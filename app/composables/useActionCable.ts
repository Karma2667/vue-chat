// composables/useActionCable.ts
import { ref, computed, watch, onMounted, onUnmounted, type Ref } from 'vue'
import type { ChatMessage } from '../types/index'
import { createConsumer } from '@rails/actioncable'

export function useActionCable(
  activeChatId: Ref<number | null>, // ← Ref, а не computed
  chats: Ref<Record<number, ChatMessage[]>>,
  dialogs: Ref<any[]>,
  currentUserId: Ref<number | null>,
  onMessageCreated: (payload: any) => void,
  onMessageUpdated: (payload: any) => void,
  onMessageDeleted: (payload: any) => void,
  onConversationUpdated: (payload: any) => void
) {
  const consumer = ref<any>(null)
  const channel = ref<any>(null)
  const isConnected = ref(false)

  // ФИКС: правильный токен
  const getToken = () => localStorage.getItem('access_token') || null

  // ФИКС: правильный URL (если бэк на другом домене)
  const getWsUrl = () => {
    const token = getToken()
    if (!token) return null

    // Если фронт и бэк на разных доменах — укажи явно
    const baseUrl = import.meta.env.VITE_API_WS_URL || 'wss://stan-messenger.ru'
    return `${baseUrl}/cable?token=${token}`
  }

  const connect = () => {
    const url = getWsUrl()
    if (!url) {
      console.error('[ActionCable] Нет токена')
      return
    }

    consumer.value = createConsumer(url)

    const monitor = consumer.value.connection.monitor
    monitor.on('open', () => {
      isConnected.value = true
      console.log('[ActionCable] Подключено')
    })

    monitor.on('close', () => {
      isConnected.value = false
      console.log('[ActionCable] Отключено')
    })
  }

  const subscribe = (id: number) => {
    if (channel.value) unsubscribe()

    channel.value = consumer.value.subscriptions.create(
      { channel: 'ChatChannel', conversation_id: id },
      {
        connected() {
          console.log(`[WS] Подписан на чат ${id}`)
        },
        disconnected() {
          console.log(`[WS] Отписан от чата ${id}`)
        },
        received(data: any) {
          const msg = typeof data === 'string' ? JSON.parse(data) : data
          if (!msg.type || !msg.payload) return

          switch (msg.type) {
            case 'message_created':
              onMessageCreated(msg.payload)
              break
            case 'message_updated':
              onMessageUpdated(msg.payload)
              break
            case 'message_deleted':
              onMessageDeleted(msg.payload)
              break
            case 'conversation_updated':
              onConversationUpdated(msg.payload)
              break
          }
        },
      }
    )
  }

  const unsubscribe = () => {
    if (channel.value) {
      consumer.value.subscriptions.remove(channel.value)
      channel.value = null
    }
  }

  const sendMessage = (content: string, replyTo?: number, attachmentId?: string) => {
    if (!channel.value) return
    channel.value.perform('send_message', {
      content,
      reply_to_message_id: replyTo,
      attachment_id: attachmentId,
    })
  }

  const editMessage = (messageId: number, content: string) => {
    if (!channel.value) return
    channel.value.perform('update_message', { message_id: messageId, content })
  }

  const deleteMessage = (messageId: number) => {
    if (!channel.value) return
    channel.value.perform('delete_message', { message_id: messageId })
  }

  // === Watch activeChatId (Ref) ===
  watch(
    activeChatId,
    (id) => {
      if (id) {
        if (!consumer.value) connect()
        subscribe(id)
      } else {
        unsubscribe()
      }
    },
    { immediate: true }
  )

  // === Lifecycle ===
  onMounted(() => {
    if (activeChatId.value) connect()
  })

  onUnmounted(() => {
    unsubscribe()
    consumer.value?.disconnect()
  })

  return { isConnected, sendMessage, editMessage, deleteMessage }
}