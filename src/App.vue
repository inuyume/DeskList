<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, shallowRef } from "vue";
import { getVersion } from "@tauri-apps/api/app";
import { emit as emitEvent, listen } from "@tauri-apps/api/event";
import { getCurrentWindow } from "@tauri-apps/api/window";
import AppHeader from "./components/AppHeader.vue";
import ConfirmDialog from "./components/ConfirmDialog.vue";
import FloatingWindow from "./components/FloatingWindow.vue";
import ListSidebar from "./components/ListSidebar.vue";
import QuickAdd from "./components/QuickAdd.vue";
import SettingsView from "./components/SettingsView.vue";
import TaskList from "./components/TaskList.vue";
import ToastContainer from "./components/ToastContainer.vue";
import { createTodoStore, type TodoStore } from "./composables/useTodoStore";
import { useToast } from "./composables/useToast";
import { useWindowControls } from "./composables/useWindowControls";
import { getAutostartEnabled, setAutostartEnabled } from "./services/autostartService";
import { exportData, pickImportData } from "./services/importExportService";
import { loadData, saveBackup, saveData } from "./services/storageService";
import { registerWindowShortcut } from "./services/shortcutService";
import type { AppData, AppSettings, SaveMode } from "./types/todo";
import { debounce } from "./utils/debounce";
import { createDefaultData } from "./utils/validation";

const todo = shallowRef<TodoStore>();
const isTauriRuntime = "__TAURI_INTERNALS__" in window;
const previewFloating = import.meta.env.DEV && new URLSearchParams(window.location.search).has("floating");
const currentWindow = isTauriRuntime ? getCurrentWindow() : null;
const windowLabel = currentWindow?.label ?? (previewFloating ? "floating-preview" : "browser-preview");
const isFloatingWindow = currentWindow?.label === "floating" || previewFloating;
document.documentElement.classList.toggle("floating-root", isFloatingWindow);
const ready = ref(false);
const settingsOpen = ref(false);
const version = ref("0.1.0");
const shortcutStatus = ref("正在检查快捷键…");
const quickAdd = ref<InstanceType<typeof QuickAdd>>();
const confirm = ref<{ type: "delete-list" | "clear" | "import" | "reset"; id?: string; data?: unknown }>();
const { messages, show } = useToast();
const { setAlwaysOnTop, hideWindow, setFloatingWindowVisible, showMainWindow } = useWindowControls();

const activeTitle = computed(() => todo.value?.activeList.value?.name ?? "DeskList");
const completedCount = computed(() => todo.value?.activeList.value?.tasks.filter((task) => task.completed).length ?? 0);
const pendingCount = computed(() => todo.value?.activeList.value?.tasks.filter((task) => !task.completed).length ?? 0);
interface SyncPayload { source: string; data: AppData }
type Cleanup = () => void | Promise<void>;
const cleanups: Cleanup[] = [];
let disposed = false;

function runCleanup(cleanup: Cleanup) {
  try {
    void Promise.resolve(cleanup()).catch((error: unknown) => console.error("释放桌面监听资源失败", error));
  } catch (error) {
    console.error("释放桌面监听资源失败", error);
  }
}

function trackCleanup(cleanup: Cleanup) {
  if (disposed) runCleanup(cleanup);
  else cleanups.push(cleanup);
}

let saveRunning = Promise.resolve();
function persist() {
  if (!todo.value) return;
  const snapshot = todo.value.snapshot();
  saveRunning = saveRunning.then(async () => {
    await saveData(snapshot);
    await emitEvent("app-data-changed", { source: windowLabel, data: snapshot } satisfies SyncPayload);
  }).catch((error: unknown) => {
    console.error("保存 DeskList 数据失败", error); show("保存失败，请稍后重试", "error");
  });
}
const debouncedPersist = debounce(persist, 300);
function changed(mode: SaveMode) { mode === "immediate" ? persist() : debouncedPersist(); }

onMounted(async () => {
  try {
    const result = await loadData();
    todo.value = createTodoStore(result.data, changed);
    if (result.recovered) show("主数据损坏，已从最近备份恢复", "info");
  } catch (error) {
    console.error("加载 DeskList 数据失败", error);
    todo.value = createTodoStore(createDefaultData(), changed);
    show("数据加载失败，已使用临时默认数据", "error");
  }
  ready.value = true;
  try {
    trackCleanup(await listen<SyncPayload>("app-data-changed", ({ payload }) => {
      if (payload.source !== windowLabel) todo.value?.replaceData(payload.data, false);
    }));
  } catch (error) { console.error("注册跨窗口数据同步失败", error); }
  if (isFloatingWindow) {
    if (currentWindow && !todo.value.state.settings.floatingWindowEnabled) await hideWindow();
    return;
  }
  try {
    await setAlwaysOnTop(todo.value.state.settings.alwaysOnTop);
    await setFloatingWindowVisible(todo.value.state.settings.floatingWindowEnabled);
    if (todo.value.state.settings.startHidden) await hideWindow();
  } catch (error) { console.error("应用窗口设置失败", error); }
  try { version.value = await getVersion(); } catch (error) { console.error("读取版本失败", error); }
  try {
    const enabled = await getAutostartEnabled();
    if (todo.value && todo.value.state.settings.launchAtStartup !== enabled) todo.value.updateSetting("launchAtStartup", enabled);
  } catch (error) { console.error("读取开机启动状态失败", error); show("无法读取开机启动状态", "error"); }
  try {
    trackCleanup(await listen("focus-quick-add", () => { settingsOpen.value = false; nextTick(() => quickAdd.value?.focus()); }));
    trackCleanup(await listen("tray-toggle-always-on-top", () => { void toggleTop(); }));
    trackCleanup(await listen("tray-toggle-autostart", () => { if (todo.value) void updateSetting("launchAtStartup", !todo.value.state.settings.launchAtStartup); }));
    trackCleanup(await listen("tray-toggle-floating", () => { if (todo.value) void toggleFloating(); }));
    trackCleanup(await listen("floating-window-closed", () => {
      if (todo.value?.state.settings.floatingWindowEnabled) todo.value.updateSetting("floatingWindowEnabled", false);
    }));
    trackCleanup(await registerWindowShortcut(() => { settingsOpen.value = false; nextTick(() => quickAdd.value?.focus()); }));
    shortcutStatus.value = "已启用：Ctrl + Alt + Space";
  } catch (error) { console.error("监听桌面事件失败", error); shortcutStatus.value = "注册失败，快捷键可能已被占用"; }
});

onUnmounted(() => {
  disposed = true;
  cleanups.splice(0).forEach(runCleanup);
});

function requestRename(id: string, current: string) {
  const name = window.prompt("重命名清单", current);
  if (name !== null && !todo.value?.renameList(id, name)) show("清单名称不能为空", "error");
}
async function toggleTop() { if (todo.value) await updateSetting("alwaysOnTop", !todo.value.state.settings.alwaysOnTop); }
async function toggleFloating() { if (todo.value) await updateSetting("floatingWindowEnabled", !todo.value.state.settings.floatingWindowEnabled); }
async function updateSetting(key: keyof AppSettings, value: boolean) {
  if (!todo.value) return;
  try {
    if (key === "alwaysOnTop") await setAlwaysOnTop(value);
    if (key === "floatingWindowEnabled") await setFloatingWindowVisible(value);
    if (key === "launchAtStartup") await setAutostartEnabled(value);
    todo.value.updateSetting(key, value);
  } catch (error) { console.error(`更新设置 ${key} 失败`, error); show("设置未能生效", "error"); }
}
async function doExport() {
  if (!todo.value) return;
  try { if (await exportData(todo.value.snapshot())) show("数据已导出", "success"); }
  catch (error) { console.error("导出失败", error); show("导出失败", "error"); }
}
async function beginImport() {
  try { const data = await pickImportData(); if (data) confirm.value = { type: "import", data }; }
  catch (error) { console.error("导入文件校验失败", error); show(error instanceof Error ? error.message : "导入失败", "error"); }
}
async function runConfirm() {
  const action = confirm.value; confirm.value = undefined;
  if (!todo.value || !action) return;
  if (action.type === "delete-list" && action.id) todo.value.deleteList(action.id);
  if (action.type === "clear") { const count = todo.value.clearCompleted(); show(`已清除 ${count} 项已完成任务`, "success"); }
  if (action.type === "import" && action.data) {
    await saveBackup(todo.value.snapshot()); todo.value.replaceData(action.data); show("数据导入成功", "success");
  }
  if (action.type === "reset") {
    await saveBackup(todo.value.snapshot()); todo.value.reset(); settingsOpen.value = false; show("应用数据已重置", "success");
  }
}
</script>

<template>
  <FloatingWindow v-if="ready && todo && isFloatingWindow" :lists="todo.state.lists" :active-id="todo.state.activeListId" :tasks="todo.visibleTasks.value" :pending-count="pendingCount" @select="todo.setActiveList" @add="todo.addTask" @toggle="todo.toggleTask" @edit="todo.editTask" @delete="todo.deleteTask" @hide="updateSetting('floatingWindowEnabled', false)" @open-main="showMainWindow" />
  <div v-else-if="!ready || !todo" class="loading">正在整理你的清单…</div>
  <div v-else class="app-shell">
    <ListSidebar v-if="!settingsOpen" :lists="todo.state.lists" :active-id="todo.state.activeListId" @select="todo.setActiveList" @add="todo.addList" @rename="requestRename" @delete="id => confirm = { type: 'delete-list', id }" @move="todo.moveList" />
    <main class="main-panel" :class="{ wide: settingsOpen }">
      <AppHeader :title="activeTitle" :settings-open="settingsOpen" :always-on-top="todo.state.settings.alwaysOnTop" :floating-open="todo.state.settings.floatingWindowEnabled" @settings="settingsOpen = !settingsOpen" @toggle-top="toggleTop" @toggle-floating="toggleFloating" />
      <SettingsView v-if="settingsOpen" :settings="todo.state.settings" :shortcut-status="shortcutStatus" :version="version" @back="settingsOpen = false" @update="updateSetting" @export="doExport" @import="beginImport" @reset="confirm = { type: 'reset' }" />
      <template v-else>
        <div class="task-toolbar"><span>{{ todo.activeList.value?.tasks.filter(task => !task.completed).length ?? 0 }} 项待办</span><button v-if="completedCount" class="text-button" @click="confirm = { type: 'clear' }">清除已完成</button></div>
        <TaskList :tasks="todo.visibleTasks.value" :group-completed="todo.state.settings.moveCompletedToBottom" @toggle="todo.toggleTask" @edit="todo.editTask" @delete="todo.deleteTask" @move="todo.moveTask" />
        <QuickAdd ref="quickAdd" @add="todo.addTask" />
      </template>
    </main>
    <ToastContainer :messages="messages" />
    <ConfirmDialog :open="Boolean(confirm)" :title="confirm?.type === 'reset' ? '重置所有数据？' : confirm?.type === 'import' ? '导入并替换当前数据？' : confirm?.type === 'clear' ? '清除已完成任务？' : '删除这个清单？'" :message="confirm?.type === 'reset' ? '当前数据会先保存为最近备份，然后恢复默认清单。' : confirm?.type === 'import' ? '当前数据会先备份，随后由导入文件替换。' : '此操作无法撤销。'" :danger="confirm?.type !== 'import'" @confirm="runConfirm" @cancel="confirm = undefined" />
  </div>
</template>
