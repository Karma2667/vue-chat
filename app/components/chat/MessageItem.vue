```vue
<script setup lang="ts">
import { defineProps, defineEmits, ref } from 'vue';
import MessageText from './MessageText.vue';
import AttachmentMessage from './AttachmentMessage.vue';

const props = defineProps<{
  id: number;
  text: string;
  time: string;
  author?: string;
  self?: boolean;
  attachments?: {
    type: 'image' | 'video' | 'file';
    url: string;
    name?: string;
    size?: string;
  }[];
  reply?: { id: number; author?: string; text: string } | null; // Добавляем id
}>();

const emit = defineEmits<{
  (e: 'reply', id: number): void;
  (e: 'search'): void;
  (e: 'preview', attachment: { type: 'image' | 'video' | 'file'; url: string; name?: string; size?: string }): void;
  (e: 'scroll-to-reply', id: number): void; // Добавляем событие
}>();

const reactions = ref<string[]>([]);

function onReactionSelected(emoji: string) {
  const index = reactions.value.indexOf(emoji);
  if (index !== -1) {
    reactions.value.splice(index, 1);
  } else {
    reactions.value = [emoji];
  }
  console.log('Reactions:', reactions.value);
}

function handleReply() {
  console.log('Reply triggered for message ID:', props.id);
  emit('reply', props.id);
}

function handleSearch() {
  emit('search');
}

function handlePreview(attachment: { type: 'image' | 'video' | 'file'; url: string; name?: string; size?: string }) {
  emit('preview', attachment);
}

function handleScrollToReply(id: number) {
  console.log('Scroll to reply ID:', id);
  emit('scroll-to-reply', id);
}
</script>

<template>
  <div :class="['message-item', { self: props.self }]" :id="`message-${props.id}`">
    <!-- Основной текст + reply -->
    <MessageText
      :text="props.text"
      :time="props.time"
      :author="props.author"
      :self="props.self"
      :reactions="reactions"
      :reply="props.reply"
      @reaction-selected="onReactionSelected"
      @reply="handleReply"
      @scroll-to-reply="handleScrollToReply"
    />

    <!-- Вложения -->
    <div v-if="props.attachments?.length" class="attachments">
      <AttachmentMessage
        v-for="(a, i) in props.attachments"
        :key="a.url || i"
        :attachment="a"
        @preview="handlePreview"
      />
    </div>
  </div>
</template>

<style scoped>
.message-item {
  position: relative;
  width: 85%;
  padding: 0.6rem 0.8rem;
  border-radius: 12px;
  background: #fff;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  margin-bottom: 0.4rem;
  display: flex;
  flex-direction: column;
  overflow: visible;
}

.message-item.self {
  background: #0078ff;
  color: #fff;
  align-self: flex-end;
}

.attachments {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 0.4rem;
}
</style>