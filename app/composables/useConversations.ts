// src/composables/useConversations.ts
import { fetchConversations, type Conversation } from '~/utils/conversations';
import { createPrivateChat } from '~/utils/createPrivateChat';
import type { Dialog } from './useChatState';

export function useConversations(dialogs: Ref<Dialog[]>, chats: Ref<Record<number, ChatMessage[]>>) {
  async function loadConversations() {
    try {
      const response = await fetchConversations(1, 20);
      dialogs.value = response.conversations.map((conv: Conversation) => ({
        id: conv.id,
        from: conv.other_user_info?.username || conv.name || 'Без имени',
        type: conv.conversation_type,
        lastMessage: conv.last_message_preview
          ? {
              content: conv.last_message_preview.content,
              created_at: new Date(conv.last_message_preview.created_at).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              }),
              username: conv.last_message_preview.username,
            }
          : undefined,
      }));
    } catch (error: any) {
      console.error('Не удалось загрузить диалоги:', error.message);
    }
  }

  async function handleSelectUser(user: { id: number; username: string }) {
    const existingDialog = dialogs.value.find(
      (d: Dialog) => d.from === user.username && d.type === 'private_chat'
    );

    if (existingDialog) {
      return existingDialog;
    }

    try {
      const conversation = await createPrivateChat(user.id);
      const newDialog: Dialog = {
        id: conversation.id,
        from: user.username,
        type: conversation.conversation_type,
      };
      dialogs.value.push(newDialog);
      chats.value[newDialog.id] = [];
      return newDialog;
    } catch (err: any) {
      console.error('Ошибка создания чата:', err.message);
      alert('Ошибка создания чата: ' + err.message);
      return null;
    }
  }

  return { loadConversations, handleSelectUser };
}