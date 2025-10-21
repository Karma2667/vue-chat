
<script setup lang="ts">
import { defineProps, defineEmits } from 'vue';

const props = defineProps<{
  id: number;
  author?: string;
  text: string;
  self?: boolean;
}>();

const emit = defineEmits<{
  (e: 'scroll-to-reply', id: number): void;
}>();

function handleClick() {
  console.log('Clicked reply with ID:', props.id);
  emit('scroll-to-reply', props.id);
}
</script>

<template>
  <div :class="['reply-message', { self: props.self }]" @click="handleClick">
    <div class="reply-author">{{ props.author || 'Unknown' }}</div>
    <div class="reply-text">{{ props.text }}</div>
  </div>
</template>

<style scoped>
.reply-message {
  border-left: 3px solid #0078ff;
  background: #f1f5f9;
  padding: 0.4rem 0.6rem;
  border-radius: 8px;
  margin-bottom: 4px;
  cursor: pointer;
  transition: background 0.2s;
}

.reply-message:hover {
  background: #e2e8f0;
}

.reply-message.self {
  border-left-color: #fff;
  background: rgba(255, 255, 255, 0.2);
}

.reply-message.self:hover {
  background: rgba(255, 255, 255, 0.3);
}

.reply-author {
  font-size: 0.75rem;
  font-weight: 600;
  color: #0078ff;
  margin-bottom: 0.1rem;
}

.reply-message.self .reply-author {
  color: #fff;
}

.reply-text {
  font-size: 0.85rem;
  color: #222;
}

.reply-message.self .reply-text {
  color: #fff;
}
</style>