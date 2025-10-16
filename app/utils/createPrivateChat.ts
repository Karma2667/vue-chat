// utils/createPrivateChat.ts
import { authService } from '../composables/useAuth'

export interface Conversation {
  id: number
  conversation_type: string
  users?: { id: number; username: string }[]
  name?: string
}

export async function createPrivateChat(userId: number): Promise<Conversation> {
  console.log(`Отправка запроса на создание приватного чата для пользователя с ID: ${userId}`)
  try {
    const response = await authService.makeRequest<Conversation>('/conversations', 'POST', {
      conversation: {
        conversation_type: 'private_chat',
        user_ids: [userId]
      }
    })
    console.log('Успешно создан чат:', response)
    return response
  } catch (err: any) {
    console.error('Ошибка создания приватного чата:', err.response?.data || err.message)
    throw new Error(err.response?.data?.message || 'Не удалось создать чат')
  }
}