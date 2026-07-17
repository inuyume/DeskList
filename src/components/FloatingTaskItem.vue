<script setup lang="ts">
import { nextTick, ref } from "vue";
import type { TodoTask } from "../types/todo";

const props = defineProps<{ task: Readonly<TodoTask> }>();
const emit = defineEmits<{ toggle: []; edit: [title: string]; delete: [] }>();
const editing = ref(false);
const draft = ref("");
const input = ref<HTMLInputElement>();

function startEdit() {
  draft.value = props.task.title;
  editing.value = true;
  nextTick(() => { input.value?.focus(); input.value?.select(); });
}
function save() {
  if (draft.value.trim()) emit("edit", draft.value);
  editing.value = false;
}
</script>

<template>
  <li class="floating-task" :class="{ completed: task.completed }">
    <input type="checkbox" :checked="task.completed" :aria-label="task.completed ? '标记为未完成' : '标记为已完成'" @change="$emit('toggle')">
    <input v-if="editing" ref="input" v-model="draft" class="floating-task-edit" maxlength="300" @keydown.enter.prevent="save" @keydown.esc.prevent="editing = false" @blur="save">
    <button v-else class="floating-task-title" title="编辑任务" @click="startEdit">{{ task.title }}</button>
    <button class="floating-delete" title="删除任务" aria-label="删除任务" @click="$emit('delete')">×</button>
  </li>
</template>
