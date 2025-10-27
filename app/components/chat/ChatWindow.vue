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
  edited?: boolean;
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
  searchQuery: string;
  searchResults: ChatMessage[];
  isSearching: boolean;
  isSearchMode: boolean;
}>();

const emit = defineEmits<{
  (e: 'send-message', payload: [number, string | null, number | undefined, File | undefined]): void;
  (e: 'preview', attachment: { type: 'image' | 'video' | 'file'; url: string; name?: string; size?: string }): void;
  (e: 'delete-message', id: number): void;
  (e: 'search-query', query: string): void;
  (e: 'forward-message', payload: [number, number, number[]]): void;
  (e: 'edit-message', payload: [number, number, string]): void;
  (e: 'cancel-edit'): void;
}>();

const messagesContainer = ref<HTMLDivElement | null>(null);
const replyingTo = ref<number | undefined>(undefined);
const highlightedMessageId = ref<number | null>(null);
const editingMessage = ref<{ id: number; text: string } | null>(null);

const messages = computed(() => {
  if (props.isSearchMode) {
    return props.searchResults;
  }
  if (!props.activeChat) return [];
  return props.chats[props.activeChat.id] || [];
});

const replyingMessage = computed(() => {
  if (!replyingTo.value) return null;
  return messages.value.find((m) => m.id === replyingTo.value) || null;
});

const replyingPreview = computed(() => {
  if (!replyingTo.value || !replyingMessage.value) return null;
  const msg = replyingMessage.value;
  if (msg.text.trim()) {
    return { text: msg.text, author: msg.author, id: msg.id };
  } else if (msg.attachments.length > 0) {
    const firstAttachment = msg.attachments[0]!;
    return {
      text: firstAttachment.name || `[Вложение: ${firstAttachment.type.toUpperCase()}]`,
      author: msg.author,
      id: msg.id,
    };
  }
  return null;
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

function scrollToMessage(id: number, highlightDuration: number = 3000) {
  nextTick(async () => {
    const selectors = [
      `[data-message-id="${id}"]`,
      `#message-${id}`,
      `.message-item[data-id="${id}"]`
    ];
    let messageElement: Element | null = null;
    for (const selector of selectors) {
      messageElement = document.querySelector(selector);
      if (messageElement) break;
    }
    if (messageElement) {
      messageElement.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
      highlightedMessageId.value = id;
      messageElement.classList.add('message-highlight');
      setTimeout(() => {
        messageElement?.classList.remove('message-highlight');
        highlightedMessageId.value = null;
      }, highlightDuration);
    } else {
      console.warn(`⚠️ Сообщение с ID ${id} не найдено`);
    }
  });
}

watch(messages, (newMessages) => {
  if (newMessages.length > 0) {
    scrollToBottom('smooth');
  }
}, { deep: true, immediate: true });

async function sendMessage(text: string, attachments?: File[]) {
  if (!props.activeChat) return;
  const hasText = text.trim().length > 0;
  const hasAttachments = attachments && attachments.length > 0;
  if (!hasText && !hasAttachments) return;
  let attachment: File | undefined = undefined;
  if (attachments && attachments.length > 0 && attachments[0]) {
    attachment = attachments[0];
  }
  const content = text.trim() || null;
  const conversationId = props.activeChat.id;
  const replyToMessageId = replyingTo.value;
  emit('send-message', [conversationId, content, replyToMessageId, attachment] as const);
  replyingTo.value = undefined;
  scrollToBottom('smooth');
}

function setReply(id: number) {
  replyingTo.value = id;
  editingMessage.value = null;
  scrollToMessage(id, 2000);
}

function setEdit(id: number, text: string) {
  console.log('🖌️ setEdit:', { id, text });
  editingMessage.value = { id, text };
  replyingTo.value = undefined;
  scrollToMessage(id, 2000);
}

function cancelEdit() {
  console.log('🚫 cancelEdit');
  editingMessage.value = null;
  emit('cancel-edit');
}

function handleSearchQuery(event: Event) {
  const target = event.target as HTMLInputElement;
  emit('search-query', target.value);
}

function clearSearch() {
  emit('search-query', '');
}

function handlePreview(attachment: { type: 'image' | 'video' | 'file'; url: string; name?: string; size?: string }) {
  emit('preview', attachment);
}

function handleDeleteMessage(id: number) {
  emit('delete-message', id);
}

function handleForwardMessage(messageId: number) {
  if (!props.activeChat) return;
  emit('forward-message', [props.activeChat.id, messageId, []]);
}

function handleEditMessage(id: number, text: string) {
  console.log('📝 ChatWindow handleEditMessage:', { id, text });
  if (!props.activeChat) return;
  emit('edit-message', [props.activeChat.id, id, text]);
}

defineExpose({ scrollToMessage });
</script>

<template>
  <div class="chat-window">
    <div v-if="props.isSearchMode" class="search-header">
      <div class="search-input-container">
        <input 
          :value="props.searchQuery"
          @input="handleSearchQuery"
          placeholder="Поиск сообщений..."
          class="search-input"
          autocomplete="off"
        />
        <button @click="clearSearch" class="search-clear" title="Очистить">
          ×
        </button>
      </div>
      <div v-if="props.isSearching" class="search-status">🔍 Поиск...</div>
      <div v-else-if="props.searchResults.length === 0" class="search-status">
        Ничего не найдено
      </div>
      <div v-else class="search-status">
        Найдено: {{ props.searchResults.length }}
      </div>
    </div>

    <div class="messages" ref="messagesContainer">
      <div v-if="props.isSearchMode && props.searchResults.length === 0 && !props.isSearching" class="no-results">
        Ничего не найдено по запросу "{{ props.searchQuery }}"
      </div>
      
      <MessageItem
        v-for="msg in messages"
        :key="msg.id"
        :id="msg.id"
        :data-message-id="msg.id"
        :text="msg.text"
        :time="msg.time"
        :self="msg.self"
        :author="msg.author"
        :attachments="msg.attachments"
        :reply="msg.reply"
        :edited="msg.edited"
        :highlighted="highlightedMessageId === msg.id"
        @reply="setReply"
        @preview="handlePreview"
        @delete="handleDeleteMessage"
        @forward="handleForwardMessage"
        @edit="setEdit" 
      />
    </div>

    <MessageInput
      v-if="!props.isSearchMode"
      @send="sendMessage"
      @cancel-reply="replyingTo = undefined"
      @cancel-edit="cancelEdit"
      @scroll-to-reply="scrollToMessage"
      @edit="handleEditMessage" 
      :replying-text="replyingPreview?.text || ''"
      :replying-author="replyingPreview?.author || ''"
      :replying-id="replyingPreview?.id"
      :editing-text="editingMessage?.text"
      :editing-id="editingMessage?.id"
    />
  </div>
</template>

<style scoped>
.chat-window {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #f1f5f9;
  max-width: 100%;
  overflow-x: hidden;
  box-sizing: border-box;
}

.messages {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 0.5rem 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  scroll-behavior: smooth;
  max-width: 100%;
  box-sizing: border-box;
}

.search-header {
  padding: 0.75rem 1rem;
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
}

.search-input-container {
  position: relative;
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.search-input {
  flex: 1;
  padding: 0.5rem 0.75rem;
  border: 1px solid #e2e8f0;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  background: white;
  transition: box-shadow 0.15s ease;
}

.search-input:focus {
  outline: none;
  box-shadow: 0 0 0 3px rgba(0, 120, 255, 0.1);
}

.search-clear {
  background: none;
  border: none;
  font-size: 1.25rem;
  cursor: pointer;
  color: #64748b;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s ease;
}

.search-clear:hover {
  background: #f1f5f9;
  color: #475569;
}

.search-status {
  font-size: 0.75rem;
  color: #64748b;
  margin-top: 0.25rem;
}

.no-results {
  padding: 2rem 1rem;
  text-align: center;
  color: #64748b;
  font-style: italic;
}

.message-highlight {
  animation: messageHighlight 3s cubic-bezier(0.4, 0, 0.2, 1) !important;
  background: #fef3c7 !important;
  border-radius: 12px !important;
  box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3) !important;
}

@keyframes messageHighlight {
  0% {
    background: #fef3c7 !important;
    transform: scale(1.02);
    box-shadow: 0 4px 12px rgba(245, 158, 11, 0.4) !important;
  }
  50% {
    background: #fde68a !important;
    transform: scale(1.01);
  }
  100% {
    background: transparent !important;
    transform: scale(1);
    box-shadow: none !important;
  }
}
</style>