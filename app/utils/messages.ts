// utils/messages.ts
import { authService } from './auth';

interface MessageRequest {
  content: string | null;
  reply_to_message_id?: number;
}

interface MessageResponse {
  id: number;
  content: string | null;
  conversation_id?: number;
  user_id?: number; // Изменено с sender_id
  user?: { id: number; username: string }; // Изменено с sender_username
  created_at?: string;
  reply_to?: number; // Изменено с reply_to_message_id
}

interface SendMessageResponse {
  message: MessageResponse;
}

interface FetchMessagesResponse {
  messages: MessageResponse[];
  meta?: {
    pagination: {
      page: number;
      items: number;
      total_pages: number;
      total_count: number;
    };
  };
}

export async function sendMessage(
  conversationId: number,
  request: MessageRequest
): Promise<MessageResponse> {
  try {
    const response = await authService.makeRequest<SendMessageResponse>(
      `/conversations/${conversationId}/messages`,
      'POST',
      { message: request }
    );
    console.log('Сообщение успешно отправлено:', response);
    console.log('Полный ответ сервера:', JSON.stringify(response));
    return response.message;
  } catch (error: any) {
    console.error('Ошибка при отправке сообщения:', error.response?.data || error.message);
    throw new Error(error.response?.data?.message || 'Не удалось отправить сообщение');
  }
}

export async function fetchMessages(
  conversationId: number,
  page: number = 1,
  items: number = 20
): Promise<FetchMessagesResponse> {
  try {
    const response = await authService.makeRequest<FetchMessagesResponse>(
      `/conversations/${conversationId}/messages?page=${page}&items=${items}`,
      'GET'
    );
    console.log('Сообщения загружены:', response);
    return response;
  } catch (error: any) {
    console.error('Ошибка при загрузке сообщений:', error.response?.data || error.message);
    throw new Error(error.response?.data?.message || 'Не удалось загрузить сообщения');
  }
}