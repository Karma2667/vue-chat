import { authService } from './auth';

export interface Message {
  id: number;
  content: string | null;
  created_at: string;
  updated_at: string;
  edited: boolean;
  user_id: number;
  conversation_id: number;
  attachment?: Attachment;
  user?: { username: string };
  reply_to?: number;
}

export interface Attachment {
  id?: string; // id может отсутствовать в ответах fetchMessages
  storage?: string;
  url?: string; // Добавлено для поддержки существующих ответов сервера
  filename?: string;
  size?: number;
  mime_type?: string;
  metadata?: {
    filename?: string;
    size?: number;
    mime_type?: string;
    width?: number;
    height?: number;
  };
}

export interface SendMessageResponse {
  message: Message;
}

export async function fetchMessages(conversationId: number, page: number = 1, items: number = 20) {
  try {
    const response = await authService.makeRequest<{
      messages: Message[];
      total_pages: number;
      current_page: number;
    }>(`/conversations/${conversationId}/messages?page=${page}&items=${items}`, 'GET');
    console.log('Сообщения загружены:', response);
    response.messages.forEach((msg) => {
      if (msg.attachment && (!msg.attachment.url || !msg.attachment.filename || !msg.attachment.size || !msg.attachment.mime_type)) {
        console.warn('Некорректная структура attachment:', msg.attachment);
      }
    });
    return response;
  } catch (error: any) {
    console.error('Ошибка при загрузке сообщений:', error.message, error.response?.data);
    throw new Error(error.response?.data?.message || 'Не удалось загрузить сообщения');
  }
}

export async function sendMessage(conversationId: number, request: {
  message: {
    content: string | null;
    reply_to_message_id?: number;
    attachment?: Attachment;
  }
}) {
  try {
    console.log('Отправка сообщения:', request);
    const response = await authService.makeRequest<SendMessageResponse>(
      `/conversations/${conversationId}/messages`,
      'POST',
      request,
      { headers: { 'Content-Type': 'application/json' } }
    );
    console.log('Сообщение успешно отправлено:', response);
    if (response.message.attachment) {
      console.log('Attachment in response:', response.message.attachment);
    }
    return response.message;
  } catch (error: any) {
    console.error('Ошибка при отправке сообщения:', error.message, error.response?.data);
    let errorMsg = 'Не удалось отправить сообщение';
    if (error.response?.status === 500) {
      errorMsg = 'Внутренняя ошибка сервера. Проверьте формат запроса или обратитесь к администратору.';
    } else if (error.response?.status === 422) {
      const errors = error.response.data?.errors || error.response.data?.error || error.message;
      errorMsg = Array.isArray(errors) ? errors.join(', ') : errors;
    } else if (error.response?.status === 404) {
      errorMsg = 'Эндпоинт для отправки сообщения не найден. Уточните у бэкенда.';
    }
    console.error('Детали ошибки:', {
      status: error.response?.status,
      data: error.response?.data,
      headers: error.response?.headers,
      xRequestId: error.response?.headers?.['x-request-id'],
    });
    throw new Error(errorMsg);
  }
}

export async function getAttachmentUrl(attachmentId: string): Promise<string> {
  try {
    const response = await authService.makeRequest<Blob>(
      `/attachments/${attachmentId}`,
      'GET',
      {},
      { responseType: 'blob' }
    );
    console.log('Изображение загружено через API:', attachmentId);
    return URL.createObjectURL(response);
  } catch (error: any) {
    console.error('Ошибка загрузки изображения через API:', error.message, error.response?.data);
    throw new Error(error.response?.data?.message || 'Не удалось загрузить изображение');
  }
}