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
  reply_to: number | { id: number; content: string; user: { username: string } } | null;
}

export interface Attachment {
  id?: string;
  storage?: string;
  url?: string;
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

export interface MessagesSearchResponse {
  messages: Message[];
  meta: {
    pagination: {
      current_page: number;
      total_pages: number;
      total_count: number;
      per_page: number;
    };
  };
}

export interface ForwardMessageResponse {
  success: boolean;
  message: string;
}

export async function fetchMessages(conversationId: number, items: number = 20): Promise<Message[]> {
  let allMessages: Message[] = [];
  let currentPage = 1;
  let hasMoreMessages = true;

  try {
    while (hasMoreMessages) {
      const response = await authService.makeRequest<{
        messages: Message[];
        total_pages?: number;
        current_page?: number;
      }>(`/conversations/${conversationId}/messages?page=${currentPage}&items=${items}`, 'GET');

      console.log(`Полный ответ сервера (страница ${currentPage}):`, JSON.stringify(response, null, 2));
      
      if (!response.messages || response.messages.length === 0) {
        hasMoreMessages = false;
        break;
      }

      response.messages.forEach((msg) => {
        if (msg.attachment && (!msg.attachment.url || !msg.attachment.filename || !msg.attachment.size || !msg.attachment.mime_type)) {
          console.warn('Некорректная структура attachment:', msg.attachment);
        }
      });

      allMessages = [...allMessages, ...response.messages];

      if (response.total_pages && response.current_page) {
        if (currentPage >= response.total_pages) {
          hasMoreMessages = false;
        }
      }

      currentPage += 1;
    }

    console.log(`Всего загружено сообщений: ${allMessages.length}`);
    return allMessages;
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

export async function searchMessages(
  conversationId: number, 
  query: string, 
  page: number = 1, 
  items: number = 20
): Promise<MessagesSearchResponse> {
  try {
    const response = await authService.makeRequest<MessagesSearchResponse>(
      `/conversations/${conversationId}/messages?page=${page}&items=${items}&q=${encodeURIComponent(query)}`,
      'GET'
    );
    console.log('Результат поиска:', response);
    return response;
  } catch (error: any) {
    console.error('Ошибка поиска сообщений:', error.message, error.response?.data);
    throw new Error(error.response?.data?.message || 'Не удалось найти сообщения');
  }
}

export async function forwardMessage(
  conversationId: number,
  messageId: number,
  conversationIds: number[]
): Promise<ForwardMessageResponse> {
  try {
    const response = await authService.makeRequest<ForwardMessageResponse>(
      `conversations/${conversationId}/messages/${messageId}/forward`,
      'POST',
      {
        conversation_ids: conversationIds,
      },
      { headers: { 'Content-Type': 'application/json' } }
    );
    console.log('Сообщение успешно переслано:', response);
    return response;
  } catch (error: any) {
    console.error('Ошибка при пересылке сообщения:', error.message, error.response?.data);
    let errorMsg = 'Не удалось переслать сообщение';
    if (error.response?.status === 401) {
      errorMsg = 'Неавторизован';
    } else if (error.response?.status === 404) {
      errorMsg = 'Сообщение не найдено в данном диалоге';
    } else if (error.response?.status === 422) {
      errorMsg = 'Некорректные параметры';
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

export async function editMessage(
  conversationId: number,
  messageId: number,
  content: string
): Promise<Message> {
  try {
    console.log('Редактирование сообщения:', { conversationId, messageId, content });
    const response = await authService.makeRequest<{ message: Message }>(
      `/conversations/${conversationId}/messages/${messageId}`,
      'PATCH',
      { message: { content } },
      { headers: { 'Content-Type': 'application/json' } }
    );
    console.log('Сообщение успешно отредактировано:', response.message);
    return response.message;
  } catch (error: any) {
    console.error('Ошибка при редактировании сообщения:', error.message, error.response?.data);
    let errorMsg = 'Не удалось отредактировать сообщение';
    if (error.response?.status === 401) {
      errorMsg = 'Неавторизован';
    } else if (error.response?.status === 403) {
      errorMsg = 'Нет прав для редактирования этого сообщения';
    } else if (error.response?.status === 404) {
      errorMsg = 'Сообщение не найдено';
    } else if (error.response?.status === 422) {
      const errors = error.response.data?.errors || error.response.data?.error || error.message;
      errorMsg = Array.isArray(errors) ? errors.join(', ') : errors;
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