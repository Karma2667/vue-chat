<script setup lang="ts">
import { defineProps, defineEmits } from 'vue';

const props = defineProps<{
  dialogs: Array<{
    id: number;
    from: string;
    type?: string;
    lastMessage?: { content: string; created_at: string; username: string };
  }>;
}>();

const emit = defineEmits<{
  (e: 'open-chat', dialog: { id: number; from: string; type?: string }): void;
}>();
</script>

<template>
  <div class="dialogs-container">
    <div
      v-for="dialog in props.dialogs"
      :key="dialog.id"
      class="dialog-item"
      @click="emit('open-chat', dialog)"
    >
      <div class="header">
        <span>{{ dialog.from }}</span>
        <span v-if="dialog.lastMessage">{{ dialog.lastMessage.created_at }}</span>
      </div>
      <div class="preview" v-if="dialog.lastMessage">
        {{ dialog.lastMessage.username }}: {{ dialog.lastMessage.content }}
      </div>
    </div>
  </div>
</template>

<style scoped>
.dialogs-container {
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  padding: 0.5rem;
}

.dialog-item {
  padding: 0.5rem;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  border-radius: var(--border-radius);
  cursor: pointer;
  transition: background-color var(--transition-fast);
}

.dialog-item:hover {
  background-color: var(--bg-accent, #e6f0ff);
}

.header {
  display: flex;
  justify-content: space-between;
  font-size: 0.875rem;
}

.preview {
  font-size: 0.85rem;
  color: var(--tx-second, #888);
}
</style>