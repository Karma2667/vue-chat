<script setup lang="ts">
import { defineProps, defineEmits, ref, computed, nextTick, watch } from 'vue';
import MessageItem from './MessageItem.vue';
import MessageInput from './MessageInput.vue';

const props = defineProps<{
  activeChat: any;
  chats: Record<number, any[]>;
}>();

const emit = defineEmits<{
  (e: 'search'): void;
  (e: 'send-message', conversationId: number, content: string | null, replyToMessageId?: number, attachment?: File): void;
}>();

const messagesContainer = ref<HTMLDivElement | null>(null);
const replyingTo = ref<number | undefined>(undefined);

const messages = computed(() => {
  if (!props.activeChat) return [];
  return props.chats[props.activeChat.id] || [];
});

const replyingMessage = computed(() => {
  if (!replyingTo.value) return null;
  return messages.value.find((m) => m.id === replyingTo.value) || null;
});

// Функция для прокрутки вниз
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

// Прокрутка вниз при изменении сообщений (например, при загрузке чата)
watch(messages, () => {
  scrollToBottom('auto'); // Используем 'auto' для мгновенной прокрутки при загрузке
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
    scrollToBottom('smooth'); // Прокрутка вниз после отправки сообщения
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
        @reply="setReply"
        @search="handleSearch"
      />
    </div>

    <MessageInput
      @send="sendMessage"
      :replying-to="replyingMessage ? replyingMessage.text : ''"
      :replying-author="replyingMessage ? replyingMessage.author : ''"
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