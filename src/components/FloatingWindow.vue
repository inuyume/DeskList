<script setup lang="ts">
import { nextTick, ref } from "vue";
import type { DeepReadonly } from "vue";
import type { TodoList, TodoTask } from "../types/todo";
import FloatingTaskItem from "./FloatingTaskItem.vue";

defineProps<{ lists: readonly DeepReadonly<TodoList>[]; activeId: string; tasks: readonly DeepReadonly<TodoTask>[]; pendingCount: number }>();
const emit = defineEmits<{ select: [id: string]; add: [title: string]; toggle: [id: string]; edit: [id: string, title: string]; delete: [id: string]; hide: []; openMain: [] }>();
const title = ref("");
const input = ref<HTMLInputElement>();
function add() {
  if (!title.value.trim()) return;
  emit("add", title.value);
  title.value = "";
  nextTick(() => input.value?.focus());
}
</script>

<template>
  <main class="floating-shell">
    <header class="floating-header" data-tauri-drag-region>
      <div class="floating-brand" data-tauri-drag-region><span data-tauri-drag-region>DESKLIST</span><b data-tauri-drag-region>{{ pendingCount }} 项待办</b></div>
      <div class="floating-window-actions">
        <button title="打开主窗口" aria-label="打开主窗口" @click="$emit('openMain')">↗</button>
        <button title="隐藏悬浮窗" aria-label="隐藏悬浮窗" @click="$emit('hide')">×</button>
      </div>
    </header>
    <div class="floating-list-select">
      <label class="sr-only" for="floating-list">当前清单</label>
      <select id="floating-list" :value="activeId" @change="$emit('select', ($event.target as HTMLSelectElement).value)">
        <option v-for="list in lists" :key="list.id" :value="list.id">{{ list.name }}</option>
      </select>
    </div>
    <div class="floating-tasks">
      <div v-if="!tasks.length" class="floating-empty">所有事情都处理好了</div>
      <ul v-else>
        <FloatingTaskItem v-for="task in tasks" :key="task.id" :task="task" @toggle="$emit('toggle', task.id)" @edit="value => $emit('edit', task.id, value)" @delete="$emit('delete', task.id)" />
      </ul>
    </div>
    <form class="floating-add" @submit.prevent="add">
      <input ref="input" v-model="title" maxlength="300" autocomplete="off" placeholder="快速添加任务…" aria-label="快速添加任务">
      <button type="submit" title="添加任务" aria-label="添加任务">＋</button>
    </form>
  </main>
</template>
