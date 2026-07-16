<script setup lang="ts">
import { nextTick, onMounted, ref } from "vue";
const emit = defineEmits<{ add: [title: string] }>();
const title = ref("");
const input = ref<HTMLInputElement>();
function submit() { if (!title.value.trim()) return; emit("add", title.value); title.value = ""; nextTick(() => input.value?.focus()); }
function focus() { input.value?.focus(); }
defineExpose({ focus });
onMounted(focus);
</script>
<template><form class="quick-add" @submit.prevent="submit"><label class="sr-only" for="quick-task">快速添加任务</label><input id="quick-task" ref="input" v-model="title" maxlength="300" autocomplete="off" placeholder="添加任务，按 Enter 保存…"><button class="add-button" type="submit" aria-label="添加任务" title="添加任务">＋</button></form></template>
