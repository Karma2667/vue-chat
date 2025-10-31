// composables/useActionCable.ts
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue'
import type { ChatMessage } from './useChatState'
import { createConsumer } from '@rails/actioncable'

export function useActionCable(
  activeChatId: ReturnType<typeof computed<number | null>>,
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

  const getToken = () => localStorage.getItem('jwt_token') || null

  const connect = () => {
    const token = getToken()
    if (!token) return console.error('[ActionCable] Нет JWT')

    const wsUrl = `${window.location.origin.replace('http', 'ws')}/cable?token=${token}`
    consumer.value = createConsumer(wsUrl)

    consumer.value.connection.monitor.on('open', () => {
      isConnected.value = true
      console.log('[ActionCable] Подключено')
    })

    consumer.value.connection.monitor.on('close', () => {
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
          if (msg.type && msg.payload) {
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

  watch(activeChatId, (id) => {
    if (id) {
      if (!consumer.value) connect()
      subscribe(id)
    } else {
      unsubscribe()
    }
  })

  onMounted(() => {
    if (activeChatId.value) connect()
  })

  onUnmounted(() => {
    unsubscribe()
    consumer.value?.disconnect()
  })

  return { isConnected, sendMessage, editMessage, deleteMessage }
}