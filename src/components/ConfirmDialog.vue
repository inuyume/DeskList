<script setup lang="ts">
defineProps<{ open: boolean; title: string; message: string; confirmLabel?: string; danger?: boolean }>();
defineEmits<{ confirm: []; cancel: [] }>();
</script>

<template>
  <div v-if="open" class="dialog-backdrop" @click.self="$emit('cancel')">
    <section class="dialog" role="alertdialog" aria-modal="true" :aria-label="title">
      <h2>{{ title }}</h2><p>{{ message }}</p>
      <div class="dialog-actions">
        <button class="button secondary" @click="$emit('cancel')">取消</button>
        <button class="button" :class="{ danger }" autofocus @click="$emit('confirm')">{{ confirmLabel ?? '确认' }}</button>
      </div>
    </section>
  </div>
</template>
