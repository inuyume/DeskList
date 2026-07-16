<script setup lang="ts">
import { nextTick, ref } from "vue";
import type { DeepReadonly } from "vue";
import type { TodoList } from "../types/todo";
defineProps<{ lists: readonly DeepReadonly<TodoList>[]; activeId: string }>();
const emit = defineEmits<{ select: [id: string]; add: [name: string]; rename: [id: string, name: string]; delete: [id: string]; move: [id: string, direction: -1 | 1] }>();
const adding = ref(false); const name = ref(""); const addInput = ref<HTMLInputElement>();
function openAdd() { adding.value = true; nextTick(() => addInput.value?.focus()); }
function submit() { if (!name.value.trim()) return; emit("add", name.value); name.value = ""; adding.value = false; }
</script>
<template><aside class="sidebar"><div class="sidebar-heading"><span>清单</span><button class="icon-button" title="新建清单" aria-label="新建清单" @click="openAdd">＋</button></div><form v-if="adding" class="new-list" @submit.prevent="submit"><input ref="addInput" v-model="name" maxlength="40" placeholder="清单名称" @keydown.esc="adding = false"><button class="sr-only" type="submit">创建</button></form><nav aria-label="任务清单"><div v-for="(list, index) in lists" :key="list.id" class="list-row" :class="{ active: list.id === activeId }"><button class="list-select" @click="$emit('select', list.id)"><span>{{ list.name }}</span><b>{{ list.tasks.filter(task => !task.completed).length }}</b></button><div class="list-actions"><button class="mini-button" :disabled="index === 0" title="上移清单" @click="$emit('move', list.id, -1)">↑</button><button class="mini-button" :disabled="index === lists.length - 1" title="下移清单" @click="$emit('move', list.id, 1)">↓</button><button class="mini-button" title="重命名清单" @click="$emit('rename', list.id, list.name)">✎</button><button class="mini-button danger-text" :disabled="lists.length === 1" title="删除清单" @click="$emit('delete', list.id)">×</button></div></div></nav></aside></template>
