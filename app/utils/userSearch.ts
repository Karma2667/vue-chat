// utils/userSearch.ts
import { authService } from '../composables/useAuth'

export interface User {
  id: number
  username: string
  email: string
  is_current_user: boolean
  avatar_url: string
  online: boolean
  status: string
  last_seen_at: string
}

const API_BASE_URL = 'https://stan-messenger.ru/api/v1'

export async function searchUsers(
  q: string,
  excludeIds?: number[],
  conversationId?: number
): Promise<User[]> {
  if (q.length < 2) {
    throw new Error('Поисковая строка должна быть минимум 2 символа')
  }

  const params = new URLSearchParams()
  params.append('q', q)
  if (excludeIds && excludeIds.length > 0) {
    excludeIds.forEach(id => params.append('exclude_ids[]', id.toString()))
  }
  if (conversationId) {
    params.append('conversation_id', conversationId.toString())
  }

  const token = authService.getToken()
  if (!token) {
    throw new Error('Токен авторизации не найден. Пожалуйста, войдите в систему.')
  }

  const response = await fetch(`${API_BASE_URL}/users/search?${params.toString()}`, {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  })

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('Неавторизован. Пожалуйста, войдите в систему.')
    } else if (response.status === 400) {
      throw new Error('Некорректные параметры')
    } else {
      const text = await response.text()
      console.log('Ошибка сервера, ответ:', text)
      throw new Error(`Ошибка сервера: ${response.status}`)
    }
  }

  const contentType = response.headers.get('content-type')
  if (!contentType || !contentType.includes('application/json')) {
    const text = await response.text()
    console.log('Некорректный ответ сервера:', text)
    throw new Error('Сервер вернул не JSON-ответ')
  }

  const data: { users: User[] } = await response.json() // Ожидаем объект с полем users
  console.log('Полученные пользователи:', data.users) // Отладка
  return data.users // Возвращаем только массив users
}