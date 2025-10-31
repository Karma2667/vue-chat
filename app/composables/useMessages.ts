// src/composables/useMessages.ts
import type { Ref } from 'vue';
import { sendMessage, fetchMessages, editMessage, forwardMessage as forwardMessageAPI, type Message, type Attachment } from '~/utils/messages';
import { authService } from '~/utils/auth';
import type { Dialog, ChatMessage } from '../types/index';
import { getAuthenticatedUrl } from './useAttachments';

// Simple debounce utility
function debounce<T extends (...args: any[]) => any>(func: T, wait: number): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => {
      func(...args);
      timeout = null;
    }, wait);
  };
}

const attachmentUrlCache = new Map<string, string>();

export function useMessages(
  chats: Ref<Record<number, ChatMessage[]>>,
  activeChat: Ref<Dialog | null>,
  currentUserId: Ref<number | null>,
  editingMessage: Ref<{ id: number; text: string } | null>
) {
  async function fetchChatMessages(dialogId: number): Promise<ChatMessage[]> {
    try {
      const messages = await fetchMessages(dialogId);
      console.log('📬 Messages fetched:', messages);
      const tempMessages = await Promise.all(
        messages.map(async (msg: Message) => {
          let attachments: ChatMessage['attachments'] = [];
          if (msg.attachment && (msg.attachment.id || msg.attachment.url)) {
            console.log('🔍 Processing attachment for message:', msg.id, msg.attachment);
            const mimeType = msg.attachment.mime_type || '';
            const type: 'image' | 'video' | 'file' =
              mimeType.startsWith('image/') ? 'image' : mimeType.startsWith('video/') ? 'video' : 'file';

            let url = msg.attachment.url;
            if (!url && msg.attachment.id) {
              if (attachmentUrlCache.has(msg.attachment.id)) {
                url = attachmentUrlCache.get(msg.attachment.id)!;
                console.log('✅ Using cached URL for attachment:', msg.attachment.id);
              } else {
                url = await getAuthenticatedUrl(msg.attachment);
                attachmentUrlCache.set(msg.attachment.id, url);
                console.log('✅ Stored URL in cache for attachment:', msg.attachment.id, url);
              }
            } else if (!url) {
              console.warn('⚠️ No URL provided for attachment:', msg.attachment.id);
              url = '';
            }

            attachments = [
              {
                type,
                url,
                name: msg.attachment.filename || undefined,
                size: msg.attachment.size ? `${(Number(msg.attachment.size) / 1024).toFixed(2)} KB` : undefined,
              },
            ];
          }

          const tempMsg: any = {
            id: msg.id,
            text: msg.content || '',
            time: new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            author: msg.user?.username || 'Unknown',
            self: currentUserId.value !== null && msg.user_id === currentUserId.value,
            reply: null,
            reply_to: typeof msg.reply_to === 'object' && msg.reply_to ? msg.reply_to.id : msg.reply_to,
            attachments,
            edited: msg.edited || false,
          };

          return tempMsg;
        })
      );

      const result = tempMessages.map((msg: any) => {
        const reply_to = msg.reply_to;
        return {
          ...msg,
          reply: reply_to
            ? {
                id: reply_to,
                text: tempMessages.find((m: any) => m.id === reply_to)?.text || 'Сообщение не найдено',
                author: tempMessages.find((m: any) => m.id === reply_to)?.author || 'Unknown',
              }
            : null,
          edited: msg.edited || false,
        } as ChatMessage;
      });

      // Deduplicate messages by ID
      chats.value[dialogId] = result.filter(
        (msg, index, self) => index === self.findIndex((m) => m.id === msg.id)
      );
      console.log('✅ Chats updated for dialog:', dialogId, chats.value[dialogId]);
      return chats.value[dialogId];
    } catch (error: any) {
      console.error('❌ Ошибка загрузки сообщений:', error.message);
      return [];
    }
  }

  async function deleteMessage(messageId: number) {
    const chat = activeChat.value;
    if (!chat) return;

    if (!confirm('Удалить это сообщение?')) return;

    try {
      const response = await authService.makeRequest<{ success: boolean; message: string }>(
        `/conversations/${chat.id}/messages/${messageId}`,
        'DELETE'
      );

      if (response.success) {
        chats.value[chat.id] = await fetchChatMessages(chat.id);
      }
    } catch (error: any) {
      alert('Ошибка удаления: ' + (error.message || 'Неизвестная ошибка'));
    }
  }

  async function handleEditMessage([conversationId, messageId, content]: [number, number, string]) {
    try {
      const updatedMessage = await editMessage(conversationId, messageId, content);
      const newText = updatedMessage.content ?? content ?? '';
      if (!chats.value[conversationId]) {
        chats.value[conversationId] = [];
        console.warn(`⚠️ Чат ${conversationId} не был загружен. Инициализируем пустым массивом.`);
      }

      chats.value[conversationId] = chats.value[conversationId].map((msg) =>
        msg.id === messageId
          ? {
              ...msg,
              text: newText,
              edited: true,
              time: updatedMessage.updated_at
                ? new Date(updatedMessage.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                : msg.time,
            }
          : msg
      );

      console.log('✅ Сообщение успешно отредактировано:', { messageId, newText, edited: true });
      editingMessage.value = null;
    } catch (error: any) {
      console.error('❌ Ошибка при редактировании сообщения:', {
        conversationId,
        messageId,
        content,
        error: error.message,
        status: error.response?.status,
        details: error.response?.data,
      });
      alert(
        `Ошибка редактирования: ${
          error.response?.status === 403
            ? 'Нет прав для редактирования этого сообщения'
            : error.response?.status === 404
              ? 'Сообщение не найдено'
              : error.message || 'Неизвестная ошибка'
        }`
      );
    }
  }

  async function forwardMessage(conversationId: number, messageId: number, conversationIds: number[]) {
    try {
      const response = await forwardMessageAPI(conversationId, messageId, conversationIds);
      if (response.success) {
        console.log('✅ Сообщение успешно переслано:', response.message);
      }
    } catch (error: any) {
      console.error('❌ Ошибка пересылки:', error.message);
      alert('Ошибка пересылки: ' + (error.message || 'Неизвестная ошибка'));
    }
  }

const debouncedHandleSendMessage = debounce(
  async (conversationId: number, content: string | null, replyToMessageId?: number, attachment?: File) => {
    if (!conversationId) {
      alert('Ошибка: не выбран чат');
      return;
    }

    const tempId = Date.now();
    const tempMessage: ChatMessage = {
      id: tempId,
      text: content || '',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      author: 'You',
      self: true,
      reply: replyToMessageId ? { id: replyToMessageId, author: '', text: '[Загрузка...]' } : null,
      attachments: attachment
        ? [{ type: 'file', url: URL.createObjectURL(attachment), name: attachment.name }]
        : [],
      edited: false,
    };

    if (!chats.value[conversationId]) chats.value[conversationId] = [];
    chats.value[conversationId].push(tempMessage);

    try {
      let attachmentData: Attachment | undefined = undefined; // ← undefined, не null!

      if (attachment) {
        const formData = new FormData();
        formData.append('file', attachment);

        const uploaded = await authService.makeRequest<Attachment>(
          '/attachments/upload',
          'POST',
          formData
          // НЕ указывай Content-Type — браузер сам поставит boundary
        );
        attachmentData = uploaded;
        console.log('Файл загружен в кэш:', uploaded);
      }

      const response = await sendMessage(conversationId, {
        message: {
          content: content || null,
          reply_to_message_id: replyToMessageId,
          attachment: attachmentData, // ← undefined если нет
        },
      });

      // Заменяем tempMessage
      const index = chats.value[conversationId].findIndex(m => m.id === tempId);
      if (index !== -1) {
        const serverMsg = response;
        chats.value[conversationId][index] = {
          id: serverMsg.id,
          text: serverMsg.content || '',
          time: new Date(serverMsg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          author: serverMsg.user?.username || 'You',
          self: true,
          reply: serverMsg.reply_to
            ? typeof serverMsg.reply_to === 'number'
              ? { id: serverMsg.reply_to, author: '', text: '' }
              : {
                  id: serverMsg.reply_to.id,
                  author: serverMsg.reply_to.user?.username || 'Unknown',
                  text: serverMsg.reply_to.content || '',
                }
            : null,
          attachments: serverMsg.attachment
            ? [{
                type: serverMsg.attachment.mime_type?.startsWith('image') ? 'image' :
                      serverMsg.attachment.mime_type?.startsWith('video') ? 'video' : 'file',
                url: serverMsg.attachment.url || '',
                name: serverMsg.attachment.filename,
                size: serverMsg.attachment.size?.toString(),
              }]
            : [],
          edited: serverMsg.edited,
        };
      }
    } catch (error: any) {
      console.error('Ошибка отправки:', error);
      chats.value[conversationId] = chats.value[conversationId].filter(m => m.id !== tempId);
      alert(error.message || 'Не удалось отправить сообщение');
    }
  },
  300
);

  return { fetchChatMessages, deleteMessage, handleEditMessage, forwardMessage, handleSendMessage: debouncedHandleSendMessage };
}