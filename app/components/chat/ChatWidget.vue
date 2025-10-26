<template>
  <div class="messenger-widget" :class="widgetClasses">
    <transition name="toggle-fade">
      <ChatToggle
        v-if="!isOpen"
        :is-open="isOpen"
        class="chat-toggle"
        @toggle="toggleWidget"
      />
    </transition>

    <Backdrop v-if="isOpen" @close="toggleWidget" />

    <transition name="panel-slide">
      <ChatPanel
        v-if="isOpen"
        :is-open="isOpen"
        :current-screen="currentScreen"
        :dialogs="dialogs"
        :active-chat="activeChat"
        :chats="chats"
        :search-query="searchQuery"
        :search-results="searchResults"
        :is-searching="isSearching"
        :is-search-mode="isSearchMode"
        @open-chat="openChat"
        @go-back="goBack"
        @search="handleSearch"
        @send-message="handleSendMessage"
        @preview="handlePreview"
        @delete-message="deleteMessage"
        @search-query="performSearch"
        @forward-message="forwardMessage(...$event)" 
      />
    </transition>

    <UserSearch
      :visible="showSearch"
      :conversation-id="activeChat?.id"
      :dialogs="dialogs"
      @select-user="handleSelectUser"
      @close="showSearch = false"
    />

    <MessageSearch
      :visible="messageSearchVisible"
      :conversation-id="activeChat?.id"
      @select-message="onMessageSelect"
      @close="messageSearchVisible = false"
    />

    <AttachmentPreview
      v-if="previewAttachment"
      :attachment="previewAttachment"
      :visible="!!previewAttachment"
      @close="previewAttachment = null"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { type ChatMessage } from '~/composables/useChat'
import ChatToggle from './ChatToggle.vue'
import Backdrop from './Backdrop.vue'
import ChatPanel from './ChatPanel.vue'
import UserSearch from './UserSearch.vue'
import MessageSearch from './MessageSearch.vue'
import AttachmentPreview from './AttachmentPreview.vue'

import { useChat } from '~/composables/useChat'

const {
  isOpen,
  currentScreen,
  dialogs,
  activeChat,
  chats,
  searchQuery,
  searchResults,
  isSearching,
  isSearchMode,
  showSearch,
  previewAttachment,
  loadConversations,
  openChat,
  deleteMessage,
  performSearch,
  toggleWidget,
  goBack,
  handleSendMessage,
  handlePreview,
  handleSelectUser,
  clearSearch,
  forwardMessage, // ✅ Добавляем forwardMessage
} = useChat()

const messageSearchVisible = ref(false)

function handleSearch() {
  console.log('🔍 Поиск сообщений активирован!')
  if (activeChat.value) {
    messageSearchVisible.value = true
  }
}

function onMessageSelect(message: ChatMessage) {
  console.log('📄 Выбрано сообщение:', message.id)
  
  const element = document.querySelector(`[data-message-id="${message.id}"]`)
  if (element) {
    element.scrollIntoView({ 
      behavior: 'smooth', 
      block: 'center' 
    })
    
    element.classList.add('message-highlight')
    setTimeout(() => {
      element.classList.remove('message-highlight')
    }, 3000)
  }
  
  messageSearchVisible.value = false
}

const widgetClasses = computed(() => ({
  'is-open': isOpen.value,
  'panel-inited': true, 
}))

onMounted(() => {
  loadConversations()
})
</script>

<style scoped>
.messenger-widget {
  position: fixed;
  inset: 0;
  width: 400px;
  right: 0;
  left: auto;
  z-index: 10000;
}

.messenger-widget > * {
  user-select: auto !important;
  pointer-events: auto !important;
}

.backdrop {
  z-index: 10001;
}

.chat-panel {
  z-index: 10002;
}

.chat-toggle {
  z-index: 10003;
  position: fixed;
  bottom: 24px;
  right: 24px;
}

:deep(.overlay) {
  z-index: 10004 !important;
}

.toggle-fade-enter-active,
.toggle-fade-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.toggle-fade-enter-from,
.toggle-fade-leave-to {
  opacity: 0;
  transform: scale(0.9);
}

.toggle-fade-enter-to,
.toggle-fade-leave-from {
  opacity: 1;
  transform: scale(1);
}

.panel-slide-enter-active,
.panel-slide-leave-active {
  transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.panel-slide-enter-from,
.panel-slide-leave-to {
  transform: translateX(100%);
}

.panel-slide-enter-to,
.panel-slide-leave-from {
  transform: translateX(0);
}
</style>