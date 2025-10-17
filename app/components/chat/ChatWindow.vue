<!-- ChatWindow.vue -->
<script setup lang="ts">
import { defineProps, defineEmits, ref, computed, nextTick } from 'vue';
import MessageItem from './MessageItem.vue';
import MessageInput from './MessageInput.vue';

const props = defineProps<{
  activeChat: any;
  chats: Record<number, any[]>;
}>();

const emit = defineEmits<{
  (e: 'search'): void;
  (e: 'send-message', conversationId: number, content: string | null, replyToMessageId?: number): void;
}>();

const messagesContainer = ref<HTMLDivElement | null>(null);
const replyingTo = ref<number | undefined>(undefined);

const messages = computed(() => {
  if (!props.activeChat) return [];
  return props.chats[props.activeChat.id] || [];
});

function setReply(id: number) {
  console.log('Setting reply to ID:', id);
  replyingTo.value = id;
}

function handleSearch() {
  emit('search');
}

function sendMessage(text: string, attachments?: File[]) {
  if (!props.activeChat || (!text.trim() && (!attachments || attachments.length === 0))) {
    console.log('Пустое сообщение или только вложения, игнорируем');
    return;
  }

  if (attachments && attachments.length > 0) {
    console.log('Вложения пока не поддерживаются, игнорируем:', attachments);
    return;
  }

  const content = text.trim() || null;
  const conversationId = props.activeChat.id;
  const replyToMessageId = replyingTo.value;

  emit('send-message', conversationId, content, replyToMessageId);
  console.log('Эмит send-message:', { conversationId, content, replyToMessageId });

  replyingTo.value = undefined;
  nextTick(() => {
    messagesContainer.value?.scrollTo({
      top: messagesContainer.value.scrollHeight,
      behavior: 'smooth',
    });
  });
}
</script>

<template>
  <div class="chat-window">
    <div class="messages" ref="messagesContainer">
      <MessageItem
        v-for="msg in messages"
        :key="msg.id"
        :id="msg.id"
        :text="msg.text"
        :time="msg.time"
        :self="msg.self"
        :author="msg.author"
        :attachments="msg.attachments"
        :reply="msg.reply"
        @reply="setReply(msg.id)"
        @search="handleSearch"
      />
    </div>

    <MessageInput
      @send="sendMessage"
      :replying-to="replyingTo ? messages.find(m => m.id === replyingTo)?.text : ''"
      :replying-author="replyingTo ? messages.find(m => m.id === replyingTo)?.author : ''"
      @cancel-reply="replyingTo = undefined"
      @voice="() => console.log('Voice не реализовано')"
      @video="() => console.log('Video не реализовано')"
    />
  </div>
</template>

<style scoped>
.chat-window {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #f1f5f9;
}

.messages {
  flex: 1;
  overflow-y: auto;
  padding: 0.5rem 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
</style>