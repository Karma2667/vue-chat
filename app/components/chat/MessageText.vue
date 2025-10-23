<script setup lang="ts">
import { ref, defineProps, defineEmits } from 'vue';
import MessageActions from './MessageActions.vue';
import ReplyMessage from './ReplyMessage.vue';
import type { PropType } from 'vue';

const props = defineProps({
  text: { type: String, required: true },
  time: { type: String, required: true },
  author: { type: String },
  self: { type: Boolean },
  reactions: { type: Array as PropType<string[]>, default: () => [] },
  reply: {
    type: Object as PropType<{ id: number; author?: string; text: string } | null>,
    default: null,
  },
});

const emit = defineEmits<{
  (e: 'reaction-selected', emoji: string): void;
  (e: 'reply'): void;
  (e: 'scroll-to-reply', id: number): void;
  (e: 'delete'): void;
}>();

const hover = ref(false);

function addReaction(emoji: string) {
  emit('reaction-selected', emoji);
}

function reply() {
  emit('reply');
}

function handleScrollToReply(id: number) {
  emit('scroll-to-reply', id);
}

function handleDelete() {
  emit('delete');
}
</script>

<template>
  <div class="message-text">
    <!-- Автор и действия -->
    <div class="author-row" @mouseenter="hover = true" @mouseleave="hover = false">
      <p class="author" :class="{ self: props.self }">{{ props.author || 'Unknown' }}</p>
      <div class="author-actions" v-show="hover">
        <MessageActions
          :self="props.self"
          :existing-reactions="props.reactions"
          @reaction-selected="addReaction"
          @reply="reply"
          @delete="handleDelete"
        />
      </div>
    </div>

    <!-- Reply блок -->
    <ReplyMessage
      v-if="props.reply"
      :id="props.reply.id"
      :author="props.reply.author"
      :text="props.reply.text"
      :self="props.self"
      @scroll-to-reply="handleScrollToReply"
    />

    <!-- Основной текст -->
    <p class="text">{{ props.text }}</p>

    <!-- Реакции -->
    <div v-if="props.reactions.length" class="reactions-row">
      <span v-for="(r, i) in props.reactions" :key="i" class="reaction">{{ r }}</span>
    </div>

    <!-- Время -->
    <span class="time" :class="{ self: props.self }">{{ props.time }}</span>
  </div>
</template>

<style scoped>
.message-text {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.author-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.author {
  font-size: 0.75rem;
  font-weight: 500;
  margin: 0;
  color: #666;
}

.author.self {
  color: #fff;
}

.author-actions {
  margin-left: auto;
}

.text {
  margin: 0;
  word-wrap: break-word;
  white-space: pre-wrap;
  line-height: 1.4;
}

.reactions-row {
  display: flex;
  gap: 0.25rem;
}

.reaction {
  font-size: 0.875rem;
  background: #f0f0f0;
  padding: 0.125rem 0.375rem;
  border-radius: 0.375rem;
}

.time {
  font-size: 0.6875rem;
  color: #999;
  align-self: flex-end;
}
.time.self {
  color: #fff !important;
}
</style>