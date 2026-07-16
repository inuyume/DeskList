import { computed, reactive, readonly } from "vue";
import type { AppData, AppSettings, SaveMode, TodoList } from "../types/todo";
import { sortTasks } from "../utils/sorting";
import { createDefaultData, normalizeAppData } from "../utils/validation";

type SaveHandler = (mode: SaveMode) => void;

export function createTodoStore(initial: AppData, onChange: SaveHandler = () => undefined) {
  const state = reactive<AppData>(structuredClone(initial));
  const activeList = computed(() => state.lists.find((list) => list.id === state.activeListId) ?? state.lists[0]);
  const visibleTasks = computed(() => {
    const tasks = activeList.value?.tasks ?? [];
    return sortTasks(tasks.filter((task) => state.settings.showCompleted || !task.completed), state.settings.moveCompletedToBottom);
  });

  function touchList(list: TodoList) { list.updatedAt = new Date().toISOString(); }
  function renumber<T extends { sortOrder: number }>(items: T[]) { items.forEach((item, index) => { item.sortOrder = index; }); }

  function setActiveList(id: string) {
    if (!state.lists.some((list) => list.id === id)) return;
    state.activeListId = id;
    onChange("immediate");
  }
  function addList(rawName: string) {
    const name = rawName.trim().slice(0, 40);
    if (!name) return false;
    const timestamp = new Date().toISOString();
    const list: TodoList = { id: crypto.randomUUID(), name, sortOrder: state.lists.length, createdAt: timestamp, updatedAt: timestamp, tasks: [] };
    state.lists.push(list);
    state.activeListId = list.id;
    onChange("immediate");
    return true;
  }
  function renameList(id: string, rawName: string) {
    const list = state.lists.find((item) => item.id === id);
    const name = rawName.trim().slice(0, 40);
    if (!list || !name) return false;
    list.name = name;
    touchList(list);
    onChange("debounced");
    return true;
  }
  function deleteList(id: string) {
    if (state.lists.length === 1) return false;
    const index = state.lists.findIndex((list) => list.id === id);
    if (index < 0) return false;
    state.lists.splice(index, 1);
    renumber(state.lists);
    if (state.activeListId === id) state.activeListId = state.lists[Math.min(index, state.lists.length - 1)].id;
    onChange("immediate");
    return true;
  }
  function moveList(id: string, direction: -1 | 1) {
    const index = state.lists.findIndex((list) => list.id === id);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= state.lists.length) return;
    [state.lists[index], state.lists[target]] = [state.lists[target], state.lists[index]];
    renumber(state.lists);
    onChange("debounced");
  }
  function addTask(rawTitle: string) {
    const list = activeList.value;
    const title = rawTitle.trim().slice(0, 300);
    if (!list || !title) return false;
    const timestamp = new Date().toISOString();
    list.tasks.push({ id: crypto.randomUUID(), title, completed: false, sortOrder: list.tasks.length, createdAt: timestamp, updatedAt: timestamp, completedAt: null });
    touchList(list);
    onChange("immediate");
    return true;
  }
  function editTask(id: string, rawTitle: string) {
    const list = activeList.value;
    const task = list?.tasks.find((item) => item.id === id);
    const title = rawTitle.trim().slice(0, 300);
    if (!list || !task || !title) return false;
    task.title = title;
    task.updatedAt = new Date().toISOString();
    touchList(list);
    onChange("debounced");
    return true;
  }
  function toggleTask(id: string) {
    const list = activeList.value;
    const task = list?.tasks.find((item) => item.id === id);
    if (!list || !task) return;
    task.completed = !task.completed;
    task.updatedAt = new Date().toISOString();
    task.completedAt = task.completed ? task.updatedAt : null;
    touchList(list);
    onChange("immediate");
  }
  function deleteTask(id: string) {
    const list = activeList.value;
    if (!list) return;
    const index = list.tasks.findIndex((task) => task.id === id);
    if (index < 0) return;
    list.tasks.splice(index, 1);
    renumber(list.tasks);
    touchList(list);
    onChange("immediate");
  }
  function moveTask(id: string, direction: -1 | 1) {
    const list = activeList.value;
    if (!list) return;
    const ordered = [...list.tasks].sort((a, b) => a.sortOrder - b.sortOrder);
    const index = ordered.findIndex((task) => task.id === id);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= ordered.length) return;
    [ordered[index], ordered[target]] = [ordered[target], ordered[index]];
    renumber(ordered);
    list.tasks.splice(0, list.tasks.length, ...ordered);
    touchList(list);
    onChange("debounced");
  }
  function clearCompleted() {
    const list = activeList.value;
    if (!list) return 0;
    const count = list.tasks.filter((task) => task.completed).length;
    if (!count) return 0;
    list.tasks = list.tasks.filter((task) => !task.completed);
    renumber(list.tasks);
    touchList(list);
    onChange("immediate");
    return count;
  }
  function updateSetting<K extends keyof AppSettings>(key: K, value: AppSettings[K]) {
    state.settings[key] = value;
    onChange("immediate");
  }
  function replaceData(value: unknown) {
    const data = normalizeAppData(value);
    if (!data) return false;
    Object.assign(state, structuredClone(data));
    onChange("immediate");
    return true;
  }
  function reset() { replaceData(createDefaultData()); }
  function snapshot(): AppData { return structuredClone(state); }

  return { state: readonly(state), activeList, visibleTasks, snapshot, setActiveList, addList, renameList, deleteList, moveList, addTask, editTask, toggleTask, deleteTask, moveTask, clearCompleted, updateSetting, replaceData, reset };
}

export type TodoStore = ReturnType<typeof createTodoStore>;
