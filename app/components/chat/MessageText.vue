
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
    type: Object as PropType<{ id: number; author?: string; text: string } | null>, // Добавляем id
    default: null,
  },
});

const emit = defineEmits<{
  (e: 'reaction-selected', emoji: string): void;
  (e: 'reply'): void;
  (e: 'scroll-to-reply', id: number): void; // Добавляем событие
}>();

const hover = ref(false);

function addReaction(emoji: string) {
  emit('reaction-selected', emoji);
}

function reply() {
  emit('reply');
}

function handleScrollToReply(id: number) {
  console.log('Scroll to reply ID:', id);
  emit('scroll-to-reply', id);
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
          @reaction-selected="addReaction"
          @reply="reply"
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
    <span class="time">{{ props.time }}</span>
  </div>
</template>

<style scoped>
.message-text {
  display: flex;
  flex-direction: column;
  word-wrap: break-word;
  user-select: text;
}

.author-row {
  position: relative;
  display: flex;
  align-items: center;
  margin-bottom: 0.2rem;
}

.author {
  margin: 0;
  font-size: 0.8rem;
  font-weight: 600;
  color: #0078ff;
}

.author.self {
  color: #fff;
}

.author-actions {
  position: absolute;
  right: 0;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  gap: 4px;
  font-size: 0.8rem;
}

.text {
  margin: 0;
  font-size: 0.9rem;
  line-height: 1.3;
}

.reactions-row {
  display: flex;
  gap: 4px;
  margin-top: 4px;
}

.reaction {
  font-size: 1rem;
  padding: 0.15rem 0.4rem;
  border-radius: 12px;
  background: #f0f0f0;
}

.message-text.self .reaction {
  background: rgba(255, 255, 255, 0.2);
  color: #fff;
}

.time {
  display: block;
  font-size: 0.7rem;
  opacity: 0.6;
  margin-top: 0.2rem;
  text-align: right;
}
</style>