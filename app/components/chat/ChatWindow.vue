```vue
<script setup lang="ts">
import { defineProps, defineEmits, ref, computed, nextTick, watch } from 'vue';
import MessageItem from './MessageItem.vue';
import MessageInput from './MessageInput.vue';

interface ChatMessage {
  id: number;
  text: string;
  time: string;
  author: string;
  self: boolean;
  reply: { id: number; author?: string; text: string } | null;
  attachments: Array<{ type: 'image' | 'video' | 'file'; url: string; name?: string; size?: string }>;
}

interface Dialog {
  id: number;
  from: string;
  type?: string;
  lastMessage?: { content: string; created_at: string; username: string };
}

const props = defineProps<{
  activeChat: Dialog | null;
  chats: Record<number, ChatMessage[]>;
}>();

const emit = defineEmits<{
  (e: 'search'): void;
  (e: 'send-message', conversationId: number, content: string | null, replyToMessageId?: number, attachment?: File): void;
  (e: 'preview', attachment: { type: 'image' | 'video' | 'file'; url: string; name?: string; size?: string }): void;
  (e: 'scroll-to-reply', id: number): void;
}>();

const messagesContainer = ref<HTMLDivElement | null>(null);
const replyingTo = ref<number | undefined>(undefined);
const highlightedMessageId = ref<number | null>(null);

const messages = computed(() => {
  if (!props.activeChat) return [];
  return props.chats[props.activeChat.id] || [];
});

const replyingMessage = computed(() => {
  if (!replyingTo.value) return null;
  return messages.value.find((m) => m.id === replyingTo.value) || null;
});

function scrollToBottom(behavior: 'smooth' | 'auto' = 'smooth') {
  nextTick(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTo({
        top: messagesContainer.value.scrollHeight,
        behavior,
      });
    }
  });
}

function scrollToMessage(id: number) {
  nextTick(() => {
    const messageElement = messagesContainer.value?.querySelector(`#message-${id}`);
    if (messageElement) {
      messageElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      highlightedMessageId.value = id;
      setTimeout(() => {
        highlightedMessageId.value = null;
      }, 2000);
    } else {
      console.warn(`Сообщение с ID ${id} не найдено в DOM`);
    }
  });
}

watch(messages, () => {
  scrollToBottom('auto');
}, { deep: true });

async function sendMessage(text: string, attachments?: File[]) {
  if (!props.activeChat || (!text.trim() && (!attachments || attachments.length === 0))) {
    console.log('Пустое сообщение или нет вложений, игнорируем');
    return;
  }

  let attachment: File | undefined = undefined;
  if (attachments && attachments.length > 0 && attachments[0]) {
    attachment = attachments[0];
  }

  const content = text.trim() || null;
  const conversationId = props.activeChat.id;
  const replyToMessageId = replyingTo.value;

  try {
    emit('send-message', conversationId, content, replyToMessageId, attachment);
    replyingTo.value = undefined;
    scrollToBottom('smooth');
  } catch (error: any) {
    console.error('Ошибка при отправке сообщения:', error.message);
    alert(`Ошибка: ${error.message}`);
  }
}

function setReply(id: number) {
  console.log('Setting reply to ID:', id);
  replyingTo.value = id;
}

function handleSearch() {
  emit('search');
}

function handleScrollToReply(id: number) {
  console.log('Scrolling to message ID:', id);
  scrollToMessage(id);
}

function handlePreview(attachment: { type: 'image' | 'video' | 'file'; url: string; name?: string; size?: string }) {
  emit('preview', attachment);
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
        :class="{ highlighted: highlightedMessageId === msg.id }"
        @reply="setReply"
        @search="handleSearch"
        @scroll-to-reply="handleScrollToReply"
        @preview="handlePreview"
      />
    </div>
    <MessageInput
      @send="sendMessage"
      :replying-to="replyingMessage ? replyingMessage.text : ''"
      :replying-author="replyingMessage ? replyingMessage.author : ''"
      :replying-id="replyingMessage ? replyingMessage.id : undefined"
      @cancel-reply="replyingTo = undefined"
      @voice="() => console.log('Voice не реализовано')"
      @video="() => console.log('Video не реализовано')"
      @scroll-to-reply="handleScrollToReply"
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

.highlighted {
  animation: highlight 2s ease-out;
}

@keyframes highlight {
  0% {
    background: #ffeb3b;
  }
  100% {
    background: inherit;
  }
}
</style>