<template>
  <div class="messenger-widget" :class="widgetClasses">
    <transition name="toggle-fade">
      <ChatToggle v-if="!isOpen" :is-open="isOpen" class="chat-toggle" @toggle="toggleWidget" />
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
        @user-search="openUserSearch"
        @send-message="handleSendMessage"
        @delete-message="deleteMessage"
        @search-query="performSearch"
        @forward-message="forwardMessage(...$event)"
        @edit-message="handleEditMessage"
        @cancel-edit="cancelEdit"
        @create-group-chat="createGroupChat"
      />
    </transition>

    <!-- ПОИСК ПОЛЬЗОВАТЕЛЕЙ -->
    <UserSearch
      :visible="userSearchVisible"
      @select-user="handleSelectUser"
      @close="userSearchVisible = false"
    />

    <!-- ПОИСК СООБЩЕНИЙ -->
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
import { createPrivateChat } from '~/utils/createPrivateChat'
import { sendMessage } from '~/utils/messages'
import type { Message } from '~/utils/messages'
import { authService } from '~/utils/auth' // ← ИСПРАВЛЕНО

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
} = useChat()

const messageSearchVisible = ref(false)
const userSearchVisible = ref(false)

function handleSearch() {
  if (currentScreen.value === 'chat') {
    messageSearchVisible.value = true
  }
}

function openUserSearch() {
  userSearchVisible.value = true
}

async function handleSelectUser(user: { id: number; username: string }) {
  try {
    const conversation = await createPrivateChat(user.id)

    const exists = dialogs.value.some(d => d.id === conversation.id)
    if (!exists) {
      dialogs.value = [
        ...dialogs.value,
        {
          id: conversation.id,
          from: user.username,
          type: 'private',
          lastMessage: undefined
        }
      ]
    }

    openChat({
      id: conversation.id,
      from: user.username,
      type: 'private',
      lastMessage: undefined
    })

    userSearchVisible.value = false
  } catch (err: any) {
    alert(err.message || 'Не удалось открыть чат')
  }
}

// НОВАЯ ФУНКЦИЯ — СОЗДАНИЕ ГРУППОВОГО ЧАТА
async function createGroupChat(name: string, userIds: number[]) {
  try {
    const response = await authService.makeRequest<{ conversation: any }>(
      '/conversations',
      'POST',
      {
        conversation: {
          conversation_type: 'group_chat',
          name,
          user_ids: userIds
        }
      }
    )

    const conv = response.conversation

    const exists = dialogs.value.some(d => d.id === conv.id)
    if (!exists) {
      dialogs.value = [...dialogs.value, {
        id: conv.id,
        from: name,
        type: 'group',
        lastMessage: undefined
      }]
    }

    openChat({
      id: conv.id,
      from: name,
      type: 'group',
      lastMessage: undefined
    })
  } catch (err: any) {
    alert(err.message || 'Не удалось создать группу')
  }
}

async function handleSendMessage(
  conversationId: number,
  content: string | null,
  replyToMessageId?: number,
  attachment?: File
) {
  if (!conversationId || (!content?.trim() && !attachment)) return

  const tempId = Date.now()
  const tempMessage: ChatMessage = {
    id: tempId,
    text: content || '',
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    author: 'You',
    self: true,
    reply: replyToMessageId
      ? { id: replyToMessageId, author: '', text: '[Загрузка...]' }
      : null,
    attachments: attachment
      ? [{ type: 'file', url: URL.createObjectURL(attachment), name: attachment.name }]
      : [],
    edited: false
  }

  if (!chats.value[conversationId]) chats.value[conversationId] = []
  chats.value[conversationId].push(tempMessage)

  try {
    const response = await sendMessage(conversationId, {
      message: {
        content: content || null,
        reply_to_message_id: replyToMessageId,
        attachment: attachment ? {
          filename: attachment.name,
          size: attachment.size,
          mime_type: attachment.type
        } : undefined
      }
    })

    const serverMsg = response
    const index = chats.value[conversationId].findIndex(m => m.id === tempId)
    if (index !== -1) {
      chats.value[conversationId][index] = {
        id: serverMsg.id,
        text: serverMsg.content || '',
        time: new Date(serverMsg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        author: serverMsg.user?.username || 'You',
        self: true,
        reply: serverMsg.reply_to
          ? typeof serverMsg.reply_to === 'number'
            ? { id: serverMsg.reply_to, author: '', text: '' }
            : {
                id: serverMsg.reply_to.id,
                author: serverMsg.reply_to.user?.username || 'Unknown',
                text: serverMsg.reply_to.content || ''
              }
          : null,
        attachments: serverMsg.attachment
          ? [{
              type: serverMsg.attachment.mime_type?.startsWith('image') ? 'image' :
                    serverMsg.attachment.mime_type?.startsWith('video') ? 'video' : 'file',
              url: serverMsg.attachment.url || '',
              name: serverMsg.attachment.filename,
              size: serverMsg.attachment.size?.toString()
            }]
          : [],
        edited: serverMsg.edited
      }
    }
  } catch (err: any) {
    console.error('Ошибка отправки:', err)
    chats.value[conversationId] = chats.value[conversationId].filter(m => m.id !== tempId)
    alert(err.message || 'Не удалось отправить сообщение')
  }
}

function onMessageSelect(message: ChatMessage) {
  const el = document.querySelector(`[data-message-id="${message.id}"]`)
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    el.classList.add('message-highlight')
    setTimeout(() => el.classList.remove('message-highlight'), 3000)
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