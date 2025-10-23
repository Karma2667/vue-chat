<script setup lang="ts">
import { defineProps, defineEmits, type PropType } from 'vue';
import DialogList from './DialogList.vue';
import ChatWindow from './ChatWindow.vue';
import ChatListHeader from './ChatListHeader.vue';
import ChatHeader from './ChatHeader.vue';

interface Attachment {
  type: 'image' | 'video' | 'file';
  url: string;
  name?: string;
  size?: string;
}

interface ChatMessage {
  id: number;
  text: string;
  time: string;
  author: string;
  self: boolean;
  reply: { id: number; author?: string; text: string } | null;
  attachments: Attachment[];
}

interface Dialog {
  id: number;
  from: string;
  type?: string;
  lastMessage?: { content: string; created_at: string; username: string };
}

const props = defineProps<{
  isOpen: boolean;
  currentScreen: 'dialogs' | 'chat';
  dialogs: Dialog[];
  activeChat: Dialog | null;
  chats: Record<number, ChatMessage[]>;
  searchQuery: string;
  searchResults: ChatMessage[];
  isSearching: boolean;
  isSearchMode: boolean;
}>();

const emit = defineEmits<{
  (e: 'open-chat', dialog: Dialog): void;
  (e: 'go-back'): void;
  (e: 'search'): void;                    // ✅ Активация поиска
  (e: 'search-query', query: string): void; // ✅ Запрос поиска
  (e: 'send-message', conversationId: number, content: string | null, replyToMessageId?: number, attachment?: File): void;
  (e: 'preview', attachment: Attachment): void;
  (e: 'delete-message', messageId: number): void;
}>();
</script>

<template>
  <div class="chat-panel" :class="{ 'is-open': props.isOpen }">
    <!-- ✅ ХЕДЕР: dialogs / chat / search -->
    <transition name="screen-fade" mode="out-in">
      <div :key="`${props.currentScreen}-${props.isSearchMode}`">
        <ChatListHeader
          v-if="props.currentScreen === 'dialogs'"
          @search="emit('search')"
        />
        <ChatHeader
          v-else
          :title="props.activeChat?.from || 'Чат'"
          :is-search-mode="props.isSearchMode"
          @go-back="emit('go-back')"
          @search="emit('search')"
          @search-query="emit('search-query', $event)"
        />
      </div>
    </transition>

    <!-- ✅ КОНТЕНТ -->
    <transition name="screen-fade" mode="out-in">
      <div :key="props.currentScreen" class="chat-content">
        <DialogList
          v-if="props.currentScreen === 'dialogs'"
          :dialogs="props.dialogs"
          @open-chat="emit('open-chat', $event)"
        />
        <ChatWindow
          v-else
          :active-chat="props.activeChat"
          :chats="props.chats"
          :search-query="props.searchQuery"
          :search-results="props.searchResults"
          :is-searching="props.isSearching"
          :is-search-mode="props.isSearchMode"
          @send-message="emit('send-message', ...$event)"
          @preview="emit('preview', $event)"
          @delete-message="emit('delete-message', $event)"
          @search-query="emit('search-query', $event)"
        />
      </div>
    </transition>
  </div>
</template>

<style scoped>
.chat-panel {
  position: fixed;
  top: 0;
  right: 0;
  height: 100vh;
  width: 400px;
  max-width: 100%;
  transform: translateX(100%);
  box-shadow: var(--shadow-light);
  background: var(--bg-first, #fff);
  display: flex;
  flex-direction: column;
  transition: transform var(--transition-slow);
  z-index: 10000;
}

.chat-panel.is-open {
  transform: translateX(0);
}

.chat-content {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.chat-panel,
.chat-content,
.chat-panel * {
  user-select: auto !important;
  pointer-events: auto !important;
}

.screen-fade-enter-active,
.screen-fade-leave-active {
  transition: all 0.25s ease;
}
.screen-fade-enter-from,
.screen-fade-leave-to {
  opacity: 0;
  transform: translateX(10px);
}
.screen-fade-enter-to,
.screen-fade-leave-from {
  opacity: 1;
  transform: translateX(0);
}
</style>