// utils/conversations.ts
export interface Conversation {
  id: number;
  name: string | null;
  conversation_type: string;
  owner_id: number | null;
  created_at: string;
  updated_at: string;
  messages_count: number;
  participants_count: number;
  is_owner: boolean;
  other_user_info?: {
    id: number;
    username: string;
    email: string | null;
    is_current_user: boolean;
    avatar_url: string | null;
    online: boolean;
    last_seen_at: string | null;
    status: string;
  };
  last_message_preview?: {
    content: string;
    created_at: string;
    user_id: number;
    username: string;
  };
  participants: Array<{
    id: number;
    user_id: number;
    conversation_id: number;
    created_at: string;
  }>;
}

export async function fetchConversations(page: number, items: number) {
  const response = await authService.makeRequest<{
    conversations: Conversation[];
    meta: { pagination: { page: number; items: number; total_pages: number; total_count: number } };
  }>('/conversations', 'GET', { params: { page, items } });
  return response;
}