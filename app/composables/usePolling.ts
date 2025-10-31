// composables/usePolling.ts
import { ref, watch, onMounted, onUnmounted, type Ref } from 'vue'
import type { ChatMessage } from '../types/index'
import { authService } from '~/utils/auth'
import { fetchMessages, sendMessage as httpSendMessage, editMessage as httpEditMessage } from '~/utils/messages'

export function usePolling(
  activeChatId: Ref<number | null>,
  chats: Ref<Record<number, ChatMessage[]>>,
  dialogs: Ref<any[]>,
  currentUserId: Ref<number | null>,
  onMessageCreated: (payload: any) => void,
  onMessageUpdated: (payload: any) => void,
  onMessageDeleted: (payload: any) => void,
  onConversationUpdated: (payload: any) => void
) {
  const isConnected = ref(true)
  const pollInterval = ref<NodeJS.Timeout | null>(null)
  const lastMessageIds = ref<Set<number>>(new Set())

  const startPolling = () => {
    if (pollInterval.value) return

    pollInterval.value = setInterval(async () => {
      const chatId = activeChatId.value
      if (!chatId) return

      try {
        const messages = await fetchMessages(chatId, 50)
        const newMessages = messages.filter(m => !lastMessageIds.value.has(m.id))

        newMessages.forEach(msg => {
          lastMessageIds.value.add(msg.id)

          const payload = {
            id: msg.id,
            content: msg.content,
            created_at: msg.created_at,
            updated_at: msg.updated_at,
            user_id: msg.user_id,
            conversation_id: msg.conversation_id,
            user: { username: msg.user?.username || 'Unknown' },
            replied_to_id: msg.reply_to ? (typeof msg.reply_to === 'object' ? msg.reply_to.id : msg.reply_to) : null,
            attachment: msg.attachment,
          }

          const existing = chats.value[chatId]?.find(m => m.id === msg.id)
          if (existing) {
            if (existing.text !== msg.content || existing.edited !== msg.edited) {
              onMessageUpdated(payload)
            }
          } else {
            onMessageCreated(payload)
          }
        })

        chats.value[chatId] = messages.map(m => ({
          id: m.id,
          text: m.content || '',
          time: new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          author: m.user?.username || 'Unknown',
          self: currentUserId.value === m.user_id,
          reply: m.reply_to
            ? { id: typeof m.reply_to === 'object' ? m.reply_to.id : m.reply_to, text: '[Ответ]', author: '...' }
            : null,
          attachments: m.attachment
            ? [{
                type: m.attachment.mime_type?.startsWith('image/') ? 'image' :
                      m.attachment.mime_type?.startsWith('video/') ? 'video' : 'file',
                url: m.attachment.url || '',
                name: m.attachment.filename,
                size: m.attachment.size?.toString(),
              }]
            : [],
          edited: m.edited,
        }))
      } catch (err) {
        console.error('[Polling] Ошибка:', err)
      }
    }, 3000)
  }

  const stopPolling = () => {
    if (pollInterval.value) {
      clearInterval(pollInterval.value)
      pollInterval.value = null
    }
  }

  const sendMessage = async (content: string, replyTo?: number, attachmentId?: string) => {
    const chatId = activeChatId.value
    if (!chatId) return

    try {
      await httpSendMessage(chatId, {
        message: {
          content: content || null,
          reply_to_message_id: replyTo,
          attachment: attachmentId ? { id: attachmentId } : undefined,
        }
      })
      setTimeout(() => fetchAndUpdate(chatId), 500)
    } catch (err: any) {
      alert('Ошибка отправки: ' + err.message)
    }
  }

  const editMessage = async (messageId: number, content: string) => {
    const chatId = activeChatId.value
    if (!chatId) return

    try {
      await httpEditMessage(chatId, messageId, content)
      setTimeout(() => fetchAndUpdate(chatId), 500)
    } catch (err: any) {
      alert('Ошибка редактирования: ' + err.message)
    }
  }

  const deleteMessage = async (messageId: number) => {
    const chatId = activeChatId.value
    if (!chatId) return

    try {
      // Используем HTTP DELETE напрямую
      await authService.makeRequest(
        `/conversations/${chatId}/messages/${messageId}`,
        'DELETE'
      )
      setTimeout(() => fetchAndUpdate(chatId), 500)
    } catch (err: any) {
      alert('Ошибка удаления: ' + err.message)
    }
  }

  const fetchAndUpdate = async (chatId: number) => {
    try {
      const messages = await fetchMessages(chatId, 50)
      chats.value[chatId] = messages.map(m => ({
        id: m.id,
        text: m.content || '',
        time: new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        author: m.user?.username || 'Unknown',
        self: currentUserId.value === m.user_id,
        reply: m.reply_to
          ? { id: typeof m.reply_to === 'object' ? m.reply_to.id : m.reply_to, text: '[Ответ]', author: '...' }
          : null,
        attachments: m.attachment
          ? [{
              type: m.attachment.mime_type?.startsWith('image/') ? 'image' :
                    m.attachment.mime_type?.startsWith('video/') ? 'video' : 'file',
              url: m.attachment.url || '',
              name: m.attachment.filename,
              size: m.attachment.size?.toString(),
            }]
          : [],
        edited: m.edited,
      }))
      messages.forEach(m => lastMessageIds.value.add(m.id))
    } catch (err) {
      console.error('[Polling] Ошибка обновления:', err)
    }
  }

  watch(
    activeChatId,
    (id) => {
      stopPolling()
      lastMessageIds.value.clear()
      if (id) {
        startPolling()
        fetchAndUpdate(id)
      }
    },
    { immediate: true }
  )

  onMounted(() => {
    if (activeChatId.value) startPolling()
  })

  onUnmounted(() => {
    stopPolling()
  })

  return {
    isConnected,
    sendMessage,
    editMessage,
    deleteMessage,
  }
}