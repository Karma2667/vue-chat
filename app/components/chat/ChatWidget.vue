<!-- src/components/chat/ChatWidget.vue -->
<template>
  <div class="messenger-widget" :class="widgetClasses">
    <!-- Тогглер -->
    <transition name="toggle-fade">
      <ChatToggle
        v-if="!isOpen"
        :is-open="isOpen"
        class="chat-toggle"
        @toggle="toggleWidget"
      />
    </transition>

    <!-- Фон -->
    <Backdrop v-if="isOpen" @close="toggleWidget" />

    <!-- Панель -->
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
        @user-search="openUserSearch"
        @send-message="handleSendMessage"
        @delete-message="deleteMessage"
        @search-query="performSearch"
        @forward-message="forwardMessage(...$event)"
        @edit-message="onEditMessage"
        @cancel-edit="cancelEdit"
        @create-group-chat="createGroupChat"
        @update-dialogs="dialogs = $event"
      />
    </transition>

    <!-- Модалки -->
    <UserSearch :visible="userSearchVisible" @select-user="handleSelectUser" @close="userSearchVisible = false" />
    <MessageSearch :visible="messageSearchVisible" :conversation-id="activeChat?.id" @select-message="onMessageSelect" @close="messageSearchVisible = false" />
    <AttachmentPreview v-if="previewAttachment" :attachment="previewAttachment" :visible="!!previewAttachment" @close="previewAttachment = null" />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { createPrivateChat } from '~/utils/createPrivateChat'
import { authService } from '~/utils/auth'

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
  previewAttachment,
  loadConversations,
  openChat,
  deleteMessage,
  performSearch,
  toggleWidget,
  goBack,
  forwardMessage,
  handleEditMessage,
  cancelEdit,
  handleSendMessage,
} = useChat()

const messageSearchVisible = ref(false)
const userSearchVisible = ref(false)

// === АДАПТЕР ДЛЯ EDIT MESSAGE ===
function onEditMessage(payload: [number, number, string]) {
  const [conversationId, messageId, content] = payload
  handleEditMessage(conversationId, messageId, content)
}

// === ПОИСК ===
function handleSearch() {
  if (currentScreen.value === 'chat') messageSearchVisible.value = true
}

function openUserSearch() {
  userSearchVisible.value = true
}

// === ПОЛЬЗОВАТЕЛИ ===
async function handleSelectUser(user: { id: number; username: string }) {
  try {
    const conversation = await createPrivateChat(user.id)
    const exists = dialogs.value.some(d => d.id === conversation.id)
    if (!exists) {
      dialogs.value.push({ id: conversation.id, from: user.username, type: 'private', lastMessage: undefined })
    }
    openChat({ id: conversation.id, from: user.username, type: 'private', lastMessage: undefined })
    userSearchVisible.value = false
  } catch (err: any) {
    alert(err.message || 'Не удалось открыть чат')
  }
}

// === ГРУППЫ ===
async function createGroupChat(name: string, userIds: number[]) {
  try {
    const { conversation } = await authService.makeRequest<{ conversation: any }>(
      '/conversations',
      'POST',
      { conversation: { conversation_type: 'group_chat', name, user_ids: userIds } }
    )
    const exists = dialogs.value.some(d => d.id === conversation.id)
    if (!exists) {
      dialogs.value.push({ id: conversation.id, from: name, type: 'group', lastMessage: undefined })
    }
    openChat({ id: conversation.id, from: name, type: 'group', lastMessage: undefined })
  } catch (err: any) {
    alert(err.message || 'Не удалось создать группу')
  }
}

// === СООБЩЕНИЯ ===
function onMessageSelect(message: any) {
  const el = document.querySelector(`[data-message-id="${message.id}"]`)
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    el.classList.add('highlight')
    setTimeout(() => el.classList.remove('highlight'), 3000)
  }
  messageSearchVisible.value = false
}

// === КЛАССЫ ===
const widgetClasses = computed(() => ({
  'is-open': isOpen.value,
  'panel-inited': true,
}))

// === ЖИЗНЬ ===
onMounted(() => {
  loadConversations()
})
</script>

<style scoped>
/* Основной контейнер */
.messenger-widget {
  position: fixed;
  inset: 0 0 0 auto;
  width: 400px;
  z-index: 10000;
  pointer-events: none;
}

.messenger-widget > * {
  pointer-events: auto;
}

/* Слои */
.backdrop { z-index: 10001; }
.chat-panel { z-index: 10002; }
.chat-toggle { z-index: 10003; }

/* Тогглер */
.chat-toggle {
  position: fixed;
  bottom: 24px;
  right: 24px;
}

/* Анимации */
.toggle-fade-enter-active,
.toggle-fade-leave-active { transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
.toggle-fade-enter-from,
.toggle-fade-leave-to { opacity: 0; transform: scale(0.9); }

.panel-slide-enter-active,
.panel-slide-leave-active { transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1); }
.panel-slide-enter-from,
.panel-slide-leave-to { transform: translateX(100%); }

/* Подсветка сообщения */
:deep(.highlight) {
  animation: highlight 3s ease forwards;
}

@keyframes highlight {
  0% { background: #fef3c7; transform: scale(1.02); }
  50% { background: #fde68a; }
  100% { background: transparent; transform: scale(1); }
}

/* Превью */
:deep(.preview-modal) { z-index: 20000 !important; }
</style>