<script setup lang="ts">
import type { TodoTask } from "../types/todo";
import TaskItem from "./TaskItem.vue";
defineProps<{ tasks: TodoTask[] }>();
defineEmits<{ toggle: [id: string]; edit: [id: string, title: string]; delete: [id: string]; move: [id: string, direction: -1 | 1] }>();
</script>
<template><div class="task-list-wrap"><div v-if="!tasks.length" class="empty-state"><span>✓</span><strong>这里很清爽</strong><p>从下方添加第一项任务吧。</p></div><ul v-else class="task-list"><TaskItem v-for="(task, index) in tasks" :key="task.id" :task="task" :first="index === 0" :last="index === tasks.length - 1" @toggle="$emit('toggle', task.id)" @edit="title => $emit('edit', task.id, title)" @delete="$emit('delete', task.id)" @move="direction => $emit('move', task.id, direction)" /></ul></div></template>
