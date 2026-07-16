<script setup lang="ts">
import { nextTick, ref } from "vue";
import type { TodoTask } from "../types/todo";
const props = defineProps<{ task: TodoTask; first: boolean; last: boolean }>();
const emit = defineEmits<{ toggle: []; edit: [title: string]; delete: []; move: [direction: -1 | 1] }>();
const editing = ref(false); const draft = ref(""); const editInput = ref<HTMLInputElement>();
function startEdit() { draft.value = props.task.title; editing.value = true; nextTick(() => { editInput.value?.focus(); editInput.value?.select(); }); }
function save() { if (draft.value.trim()) emit("edit", draft.value); editing.value = false; }
</script>
<template><li class="task-item" :class="{ completed: task.completed }"><input class="task-check" type="checkbox" :checked="task.completed" :aria-label="task.completed ? '标记为未完成' : '标记为已完成'" @change="$emit('toggle')"><input v-if="editing" ref="editInput" v-model="draft" class="task-edit" maxlength="300" @keydown.enter.prevent="save" @keydown.esc.prevent="editing = false" @blur="save"><button v-else class="task-title" title="双击编辑" @dblclick="startEdit" @click="startEdit">{{ task.title }}</button><div class="task-actions"><button class="icon-button" :disabled="first" title="上移任务" aria-label="上移任务" @click="$emit('move', -1)">↑</button><button class="icon-button" :disabled="last" title="下移任务" aria-label="下移任务" @click="$emit('move', 1)">↓</button><button class="icon-button danger-text" title="删除任务" aria-label="删除任务" @click="$emit('delete')">×</button></div></li></template>
