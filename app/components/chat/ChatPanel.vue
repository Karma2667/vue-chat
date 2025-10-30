<script setup lang="ts">
import { ref, computed, defineProps, defineEmits, watch } from 'vue'
import DialogList from './DialogList.vue'
import ChatWindow from './ChatWindow.vue'
import ChatListHeader from './ChatListHeader.vue'
import ChatHeader from './ChatHeader.vue'
import { type Conversation } from '@/utils/conversations'

interface Attachment {
  type: 'image' | 'video' | 'file'
  url: string
  name?: string
  size?: string
}

interface ChatMessage {
  id: number
  text: string
  time: string
  author: string
  self: boolean
  reply: { id: number; author?: string; text: string } | null
  attachments: Attachment[]
  edited?: boolean
}

interface Dialog {
  id: number
  from: string
  type?: string
  lastMessage?: { content: string; created_at: string; username: string }
}

const props = defineProps<{
  isOpen: boolean
  currentScreen: 'dialogs' | 'chat'
  dialogs: Dialog[]
  activeChat: Dialog | null
  chats: Record<number, ChatMessage[]>
  searchQuery: string
  searchResults: ChatMessage[]
  isSearching: boolean
  isSearchMode: boolean
}>()

const emit = defineEmits<{
  (e: 'open-chat', dialog: Dialog): void
  (e: 'go-back'): void
  (e: 'search'): void
  (e: 'search-query', query: string): void
  (e: 'send-message', conversationId: number, content: string | null, replyToMessageId?: number, attachment?: File): void
  (e: 'preview', attachment: Attachment): void
  (e: 'delete-message', messageId: number): void
  (e: 'forward-message', payload: [number, number, number[]]): void
  (e: 'edit-message', payload: [number, number, string]): void
  (e: 'cancel-edit'): void
  (e: 'rename-chat'): void
  (e: 'user-search'): void
  (e: 'new-group-chat'): void
  (e: 'tab-change', key: string): void
  (e: 'create-group-chat', name: string, userIds: number[]): void
  (e: 'update-dialogs', dialogs: Dialog[]): void
  (e: 'conversation-deleted', id: number): void
  (e: 'participant-added', participant: { id: number; user_id: number }): void
}>()

const forwardDialogs = ref<number[]>([])
const isForwardModalOpen = ref(false)
const messageToForward = ref<number | null>(null)

const activeConversation = computed<Conversation | null>(() => {
  if (!props.activeChat) return null
  return {
    id: props.activeChat.id,
    name: props.activeChat.from,
    conversation_type: props.activeChat.type === 'group' ? 'group' : 'private',
    owner_id: null,
    created_at: '',
    updated_at: '',
    messages_count: 0,
    participants_count: 0,
    is_owner: false,
    participants: [],
    last_message_preview: props.activeChat.lastMessage
      ? {
          content: props.activeChat.lastMessage.content,
          created_at: props.activeChat.lastMessage.created_at,
          user_id: 0,
          username: props.activeChat.lastMessage.username,
        }
      : undefined,
  }
})

const selectedDialogs = computed(() => forwardDialogs.value)

// === Пересылка ===
function openForwardModal(messageId: number) {
  messageToForward.value = messageId
  isForwardModalOpen.value = true
}

function closeForwardModal() {
  isForwardModalOpen.value = false
  forwardDialogs.value = []
  messageToForward.value = null
}

function handleForward() {
  if (messageToForward.value && props.activeChat && forwardDialogs.value.length > 0) {
    emit('forward-message', [props.activeChat.id, messageToForward.value, [...forwardDialogs.value]])
    closeForwardModal()
  } else {
    alert('Выберите хотя бы один диалог')
  }
}

function toggleDialogSelection(dialogId: number) {
  const index = forwardDialogs.value.indexOf(dialogId)
  if (index === -1) {
    forwardDialogs.value = [...forwardDialogs.value, dialogId]
  } else {
    forwardDialogs.value = forwardDialogs.value.filter(id => id !== dialogId)
  }
}

// === Удаление диалога ===
function handleConversationDeleted(id: number) {
  const updated = props.dialogs.filter(d => d.id !== id)
  emit('update-dialogs', updated)
  emit('go-back')
}

// === Добавление участника ===
function handleParticipantAdded(participant: { id: number; user_id: number }) {
  emit('participant-added', participant)
}

// === Обновление lastMessage ===
watch(
  () => props.chats,
  (newChats) => {
    const updatedDialogs: Dialog[] = props.dialogs.map(dialog => {
      const messages = newChats[dialog.id]
      const lastMsg = messages?.[messages.length - 1]
      if (!lastMsg) return dialog

      return {
        ...dialog,
        lastMessage: {
          content: lastMsg.text,
          created_at: lastMsg.time,
          username: lastMsg.author,
        },
      }
    })
    emit('update-dialogs', updatedDialogs)
  },
  { deep: true }
)
const activeChatTitle = computed(() => {
  return props.activeChat?.from || 'Чат'
})

function handleTitleUpdate(newTitle: string) {
  if (!props.activeChat) return

  // Обновляем dialogs
  const updatedDialogs = props.dialogs.map(d =>
    d.id === props.activeChat!.id ? { ...d, from: newTitle } : d
  )
  emit('update-dialogs', updatedDialogs)

  // Обновляем activeChat (реактивно)
  props.activeChat.from = newTitle
}
</script>

<template>
  <div class="chat-panel" :class="{ 'is-open': props.isOpen }">
    <transition name="screen-fade" mode="out-in">
      <div :key="`${props.currentScreen}-${props.isSearchMode}`">
        <ChatListHeader
          v-if="props.currentScreen === 'dialogs'"
          @user-search="emit('user-search')"
          @new-group-chat="emit('new-group-chat')"
          @tab-change="emit('tab-change', $event)"
          @create-group-chat="(name, userIds) => emit('create-group-chat', name, userIds)"
        />
        <ChatHeader
          v-else
          :title="activeChatTitle"
          :conversation="activeConversation!"
          :is-search-mode="props.isSearchMode"
          @go-back="emit('go-back')"
          @search="emit('search')"
          @search-query="emit('search-query', $event)"
          @conversation-deleted="handleConversationDeleted"
          @participant-added="handleParticipantAdded"
          @update:title="handleTitleUpdate"
        />
      </div>
    </transition>

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
          @forward-message="openForwardModal($event[1])"
          @edit-message="emit('edit-message', $event)"
          @cancel-edit="emit('cancel-edit')"
        />
      </div>
    </transition>

    <!-- Модалка пересылки -->
    <div v-if="isForwardModalOpen" class="modal-overlay" @click.self="closeForwardModal">
      <div class="modal-content">
        <h3>Выберите диалоги для пересылки</h3>
        <ul>
          <li v-for="dialog in props.dialogs" :key="dialog.id" class="dialog-item">
            <label>
              <input
                type="checkbox"
                :checked="selectedDialogs.includes(dialog.id)"
                @change="toggleDialogSelection(dialog.id)"
              />
              {{ dialog.from }}
            </label>
          </li>
        </ul>
        <div class="modal-actions">
          <button @click="handleForward" :disabled="selectedDialogs.length === 0">Переслать</button>
          <button @click="closeForwardModal">Отмена</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* ... (все стили из предыдущей версии) ... */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 10001;
}

.modal-content {
  background: white;
  padding: 20px;
  border-radius: 8px;
  max-height: 80vh;
  overflow-y: auto;
  width: 100%;
  max-width: 360px;
}

.modal-content ul {
  list-style: none;
  padding: 0;
  margin: 0 0 20px 0;
}

.dialog-item {
  padding: 10px;
  cursor: pointer;
  display: flex;
  align-items: center;
}

.dialog-item:hover {
  background: #f0f0f0;
}

.dialog-item label {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.modal-actions button {
  padding: 8px 16px;
  border-radius: 4px;
  border: none;
  cursor: pointer;
  font-size: 14px;
}

.modal-actions button:first-child {
  background: #0078ff;
  color: white;
}

.modal-actions button:first-child:disabled {
  background: #cccccc;
  cursor: not-allowed;
}

.modal-actions button:last-child {
  background: #f0f0f0;
  color: #333;
}

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