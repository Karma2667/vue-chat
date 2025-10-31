// src/composables/useChat.ts
import { ref, watch } from 'vue'
import { usePolling } from './usePolling'
import type { ChatMessage } from './useChatState'
import { authService } from '~/utils/auth'

export function useChat() {
  const {
    currentUserId,
    isOpen,
    currentScreen,
    activeChat,
    dialogs,
    chats,
    showSearch,
    previewAttachment,
    searchQuery,
    searchResults,
    isSearching,
    editingMessage,
    isSearchMode,
  } = useChatState();

  const { loadConversations, handleSelectUser } = useConversations(dialogs, chats);
  const { fetchChatMessages, forwardMessage } = useMessages(
    chats,
    activeChat,
    currentUserId,
    editingMessage
  );
  const { performSearch, clearSearch } = useSearch(activeChat, searchQuery, searchResults, isSearching);
  const { handlePreview } = useAttachments(previewAttachment);
  const { openChat, toggleWidget, goBack, cancelEdit, handleSearch } = useChatActions(
    isOpen,
    currentScreen,
    activeChat,
    showSearch,
    previewAttachment,
    editingMessage,
    chats,
    currentUserId
  );

  // === Polling ===
  const activeChatId = ref<number | null>(null)
  watch(
    () => activeChat.value?.id,
    (id) => {
      activeChatId.value = id ?? null
    },
    { immediate: true }
  )

  const { isConnected, sendMessage, editMessage: wsEditMessage, deleteMessage: wsDeleteMessage } = usePolling(
    activeChatId,
    chats,
    dialogs,
    currentUserId,
    // onMessageCreated
    (payload) => {
      const chatId = payload.conversation_id
      const currentChatId = activeChat.value?.id
      if (!currentChatId || chatId !== currentChatId) return

      if (!chats.value[chatId]) chats.value[chatId] = []

      const newMsg: ChatMessage = {
        id: payload.id,
        text: payload.content || '',
        time: new Date(payload.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        author: payload.user?.username || 'Unknown',
        self: currentUserId.value === payload.user_id,
        reply: payload.replied_to_id
          ? { id: payload.replied_to_id, text: '[Загружено]', author: '...' }
          : null,
        attachments: payload.attachment
          ? [{
              type: payload.attachment.mime_type?.startsWith('image/') ? 'image' :
                    payload.attachment.mime_type?.startsWith('video/') ? 'video' : 'file',
              url: payload.attachment.url || '',
              name: payload.attachment.filename,
              size: payload.attachment.size?.toString(),
            }]
          : [],
        edited: false,
      }

      chats.value[chatId].push(newMsg)
    },
    // onMessageUpdated
    (payload) => {
      const chatId = payload.conversation_id
      if (!chats.value[chatId]) return

      chats.value[chatId] = chats.value[chatId].map(msg =>
        msg.id === payload.id
          ? {
              ...msg,
              text: payload.content || msg.text,
              edited: true,
              time: payload.updated_at
                ? new Date(payload.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                : msg.time,
            }
          : msg
      )
    },
    // onMessageDeleted
    (payload) => {
      const chatId = payload.conversation_id
      if (!chats.value[chatId]) return
      chats.value[chatId] = chats.value[chatId].filter(m => m.id !== payload.id)
    },
    // onConversationUpdated
    () => {}
  )

  // === Отправка через HTTP + Polling ===
  // === Отправка через HTTP + Polling ===
const handleSendMessage = async (
  conversationId: number,
  content: string | null,
  replyToMessageId?: number,
  attachment?: File
) => {
  if (!content && !attachment) return

  const tempId = Date.now()
  const tempMessage: ChatMessage = {
    id: tempId,
    text: content || '',
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    author: 'You',
    self: true,
    reply: replyToMessageId ? { id: replyToMessageId, text: '[Загрузка...]', author: '' } : null,
    attachments: attachment
      ? [{ type: 'file', url: URL.createObjectURL(attachment), name: attachment.name }]
      : [],
    edited: false,
  }

  // ГАРАНТИРУЕМ существование ДО try
  if (!chats.value[conversationId]) {
    chats.value[conversationId] = []
  }

  chats.value[conversationId].push(tempMessage)

  try {
    let attachmentId: string | undefined
    if (attachment) {
      const formData = new FormData()
      formData.append('file', attachment)
      const uploaded = await authService.makeRequest<{ id: string }>(
        '/attachments/upload',
        'POST',
        formData
      )
      attachmentId = uploaded.id
    }

    await sendMessage(content || '', replyToMessageId, attachmentId)

    // Удаляем temp — придёт с сервера
    setTimeout(() => {
      const messages = chats.value[conversationId]
      if (!messages) return // защита

      const idx = messages.findIndex(m => m.id === tempId)
      if (idx !== -1) {
        messages.splice(idx, 1)
      }
    }, 1000)
  } catch (err: any) {
    // Удаляем при ошибке
    const messages = chats.value[conversationId]
    if (messages) {
      chats.value[conversationId] = messages.filter(m => m.id !== tempId)
    }
    alert('Ошибка отправки: ' + (err.message || 'Неизвестная ошибка'))
  }
}

  const handleEditMessage = (conversationId: number, messageId: number, content: string) => {
    wsEditMessage(messageId, content)
  }

  const deleteMessageWS = (messageId: number) => {
    if (!activeChat.value) return
    if (confirm('Удалить сообщение?')) {
      wsDeleteMessage(messageId)
    }
  }

  return {
    currentUserId,
    isOpen,
    currentScreen,
    activeChat,
    dialogs,
    chats,
    showSearch,
    previewAttachment,
    searchQuery,
    searchResults,
    isSearching,
    editingMessage,
    isSearchMode,
    loadConversations,
    handleSelectUser,
    fetchChatMessages,
    deleteMessage: deleteMessageWS,
    handleEditMessage,
    forwardMessage,
    handleSendMessage,
    performSearch,
    clearSearch,
    handlePreview,
    openChat,
    toggleWidget,
    goBack,
    cancelEdit,
    handleSearch,
    isConnected,
  }
}

export type { ChatMessage } from './useChatState'