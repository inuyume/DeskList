<script setup lang="ts">
import type { ToastMessage } from "../composables/useToast";
defineProps<{ messages: readonly ToastMessage[] }>();
</script>
<template><div class="toast-region" aria-live="polite"><div v-for="item in messages" :key="item.id" class="toast" :class="item.tone">{{ item.text }}</div></div></template>
