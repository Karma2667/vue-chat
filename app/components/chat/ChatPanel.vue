<!-- components/ChatPanel.vue -->
<script setup lang="ts">
import { defineProps, defineEmits } from 'vue';
import DialogList from './DialogList.vue';
import ChatWindow from './ChatWindow.vue';
import ChatListHeader from './ChatListHeader.vue';
import ChatHeader from './ChatHeader.vue';

const props = defineProps<{
  isOpen: boolean;
  currentScreen: 'dialogs' | 'chat';
  dialogs: any[];
  activeChat: any;
  chats: Record<number, any[]>;
}>();

const emit = defineEmits<{
  (e: 'open-chat', dialog: any): void;
  (e: 'go-back'): void;
  (e: 'search'): void;
  (e: 'send-message', conversationId: number, content: string | null, replyToMessageId?: number): void; // Добавляем send-message
}>();
</script>

<template>
  <div class="chat-panel" :class="{ 'is-open': props.isOpen }">
    <transition name="screen-fade" mode="out-in">
      <div :key="props.currentScreen">
        <ChatListHeader
          v-if="props.currentScreen === 'dialogs'"
          @tab-change="key => console.log('Переключение вкладки', key)"
          @search="emit('search')"
          @new-group-chat="console.log('Новая группа')"
          @settings="console.log('Настройки')"
          @selected="console.log('Выбраны чаты')"
        />
        <ChatHeader
          v-else
          :title="props.activeChat?.from || ''"
          :is-chat="true"
          @go-back="emit('go-back')"
        />
      </div>
    </transition>

    <transition name="screen-fade" mode="out-in">
      <div key="props.currentScreen" class="chat-content">
        <DialogList
          v-if="props.currentScreen === 'dialogs'"
          :dialogs="props.dialogs"
          @open-chat="emit('open-chat', $event)"
        />
        <ChatWindow
          v-else
          :active-chat="props.activeChat"
          :chats="props.chats"
          @search="emit('search')"
          @send-message="(conversationId, content, replyToMessageId) => emit('send-message', conversationId, content, replyToMessageId)"
        />
      </div>
    </transition>
  </div>
</template>

<style scoped>
.chat-panel {
  position: absolute;
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
}

.chat-panel.is-open {
  transform: translateX(0);
}

.chat-content {
  flex: 1;
  overflow-y: auto;
}

.chat-panel,
.chat-content,
.chat-panel * {
  user-select: auto !important;
  pointer-events: auto !important;
  z-index: 1000 !important;
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