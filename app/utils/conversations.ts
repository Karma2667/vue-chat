// utils/conversations.ts
import { authService } from './auth';

interface Pagination {
  page: number;
  items: number;
  total_pages: number;
  total_count: number;
}

export interface Conversation {
  id: number;
  conversation_type: string;
  users?: { id: number; username: string }[];
  name?: string;
}

interface ConversationsResponse {
  conversations: Conversation[];
  meta: {
    pagination: Pagination;
  };
}

export async function fetchConversations(
  page: number = 1,
  items: number = 20
): Promise<ConversationsResponse> {
  try {
    const response = await authService.makeRequest<ConversationsResponse>(
      `/conversations?page=${page}&items=${items}`, // Убрали /api/v1
      'GET'
    );
    console.log('Диалоги загружены:', response);
    return response;
  } catch (error: any) {
    console.error('Ошибка при получении диалогов:', error.response?.data || error.message);
    throw new Error(error.response?.data?.message || 'Не удалось загрузить диалоги');
  }
}