<script setup lang="ts">
defineProps<{ title: string; settingsOpen: boolean; alwaysOnTop: boolean }>();
defineEmits<{ settings: []; toggleTop: [] }>();
</script>
<template><header class="app-header"><div><span class="eyebrow">DESKLIST</span><h1>{{ settingsOpen ? '设置' : title }}</h1></div><div class="header-actions"><button class="top-button" :class="{ active: alwaysOnTop }" :aria-pressed="alwaysOnTop" title="切换始终置顶" @click="$emit('toggleTop')">⌖ <span>{{ alwaysOnTop ? '已置顶' : '置顶' }}</span></button><button class="icon-button settings-button" :class="{ active: settingsOpen }" title="设置" aria-label="打开设置" @click="$emit('settings')">⚙</button></div></header></template>
