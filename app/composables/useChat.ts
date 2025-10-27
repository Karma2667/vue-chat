import { ref, reactive, computed, onMounted } from 'vue';
import { toRefs } from 'vue';
import { fetchConversations, type Conversation } from '~/utils/conversations';
import { createPrivateChat } from '~/utils/createPrivateChat';
import { sendMessage, fetchMessages, getAttachmentUrl, searchMessages, forwardMessage as forwardMessageAPI, editMessage, type Attachment, type Message } from '~/utils/messages';
import { authService } from '~/utils/auth';

export interface Dialog {
  id: number;
  from: string;
  type?: string;
  lastMessage?: { content: string; created_at: string; username: string };
}

export interface ChatMessage {
  id: number;
  text: string;
  time: string;
  author: string;
  self: boolean;
  reply: { id: number; text: string; author: string } | null;
  attachments: Array<{
    type: 'image' | 'video' | 'file';
    url: string;
    name?: string;
    size?: string;
  }>;
  edited?: boolean;
}

interface ChatState {
  currentUserId: number | null;
  isOpen: boolean;
  currentScreen: 'dialogs' | 'chat';
  activeChat: Dialog | null;
  dialogs: Dialog[];
  chats: Record<number, ChatMessage[]>;
  showSearch: boolean;
  previewAttachment: {
    type: 'image' | 'video' | 'file';
    url: string;
    name?: string;
    size?: string;
  } | null;
  searchQuery: string;
  searchResults: ChatMessage[];
  isSearching: boolean;
  editingMessage: { id: number; text: string } | null; // ✅ Состояние редактируемого сообщения
}

export function useChat() {
  const state = reactive<ChatState>({
    currentUserId: null,
    isOpen: false,
    currentScreen: 'dialogs',
    activeChat: null,
    dialogs: [],
    chats: {},
    showSearch: false,
    previewAttachment: null,
    searchQuery: '',
    searchResults: [],
    isSearching: false,
    editingMessage: null,
  });

  const chatState = toRefs(state);

  async function getAuthenticatedUrl(attachment: { id?: string; url?: string; mime_type?: string }): Promise<string> {
    if (!attachment.id && !attachment.url) return '';
    try {
      if (attachment.id) return await getAttachmentUrl(attachment.id);
      return attachment.url || '';
    } catch {
      return '';
    }
  }

  async function loadConversations() {
    try {
      const response = await fetchConversations(1, 20);
      chatState.dialogs.value = response.conversations.map((conv: Conversation) => ({
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

  async function openChat(dialog: Dialog) {
    chatState.activeChat.value = dialog;
    chatState.currentScreen.value = 'chat';
    chatState.editingMessage.value = null; // ✅ Очищаем редактирование при открытии чата

    try {
      const messages = await fetchMessages(dialog.id);
      const tempMessages = await Promise.all(
        messages.map(async (msg: Message) => {
          let attachments: ChatMessage['attachments'] = [];
          if (msg.attachment && (msg.attachment.id || msg.attachment.url)) {
            const mimeType = msg.attachment.mime_type || '';
            const type: 'image' | 'video' | 'file' =
              mimeType.startsWith('image/') ? 'image' : mimeType.startsWith('video/') ? 'video' : 'file';

            attachments = [
              {
                type,
                url: await getAuthenticatedUrl(msg.attachment),
                name: msg.attachment.filename,
                size: msg.attachment.size ? `${(Number(msg.attachment.size) / 1024).toFixed(2)} KB` : undefined,
              },
            ];
          }

          const tempMsg: any = {
            id: msg.id,
            text: msg.content || '',
            time: new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            author: msg.user?.username || 'Unknown',
            self: state.currentUserId !== null && msg.user_id === state.currentUserId,
            reply: null,
            reply_to: typeof msg.reply_to === 'object' && msg.reply_to ? msg.reply_to.id : msg.reply_to,
            attachments,
            edited: msg.edited || false,
          };

          return tempMsg;
        })
      );

      chatState.chats.value[dialog.id] = tempMessages.map((msg: any) => {
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
    } catch (error: any) {
      console.error('Ошибка загрузки сообщений:', error.message);
    }
  }

  async function deleteMessage(messageId: number) {
    const chat = chatState.activeChat.value;
    if (!chat) return;

    if (!confirm('Удалить это сообщение?')) return;

    try {
      const response = await authService.makeRequest<{ success: boolean; message: string }>(
        `/conversations/${chat.id}/messages/${messageId}`,
        'DELETE'
      );

      if (response.success) {
        await openChat(chat);
      }
    } catch (error: any) {
      alert('Ошибка удаления: ' + (error.message || 'Неизвестная ошибка'));
    }
  }

  async function performSearch(query: string) {
    if (!chatState.activeChat.value || !query.trim()) {
      chatState.searchResults.value = [];
      chatState.searchQuery.value = '';
      return;
    }

    chatState.isSearching.value = true;
    chatState.searchQuery.value = query;

    try {
      const response = await searchMessages(chatState.activeChat.value.id, query, 1);

      const tempMessages = await Promise.all(
        response.messages.map(async (msg: Message) => {
          let attachments: ChatMessage['attachments'] = [];
          if (msg.attachment && (msg.attachment.id || msg.attachment.url)) {
            const mimeType = msg.attachment.mime_type || '';
            const type: 'image' | 'video' | 'file' =
              mimeType.startsWith('image/') ? 'image' : mimeType.startsWith('video/') ? 'video' : 'file';

            attachments = [
              {
                type,
                url: await getAuthenticatedUrl(msg.attachment),
                name: msg.attachment.filename,
                size: msg.attachment.size ? `${(Number(msg.attachment.size) / 1024).toFixed(2)} KB` : undefined,
              },
            ];
          }

          return {
            id: msg.id,
            text: msg.content || '',
            time: new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            author: msg.user?.username || 'Unknown',
            self: state.currentUserId !== null && msg.user_id === state.currentUserId,
            reply: null,
            attachments,
            edited: msg.edited || false,
          } as ChatMessage;
        })
      );

      chatState.searchResults.value = tempMessages;
    } catch (error: any) {
      console.error('Ошибка поиска:', error);
      chatState.searchResults.value = [];
    } finally {
      chatState.isSearching.value = false;
    }
  }

  async function forwardMessage(conversationId: number, messageId: number, conversationIds: number[]) {
    try {
      const response = await forwardMessageAPI(conversationId, messageId, conversationIds);
      if (response.success) {
        console.log('Сообщение успешно переслано:', response.message);
        await loadConversations();
      }
    } catch (error: any) {
      console.error('Ошибка пересылки:', error.message);
      alert('Ошибка пересылки: ' + (error.message || 'Неизвестная ошибка'));
    }
  }

  async function handleEditMessage([conversationId, messageId, content]: [number, number, string]) {
    try {
      const updatedMessage = await editMessage(conversationId, messageId, content);

      const newText = updatedMessage.content ?? content ?? '';
      if (!chatState.chats.value[conversationId]) {
        chatState.chats.value[conversationId] = [];
        console.warn(`Чат ${conversationId} не был загружен. Инициализируем пустым массивом.`);
      }

      chatState.chats.value[conversationId] = chatState.chats.value[conversationId].map((msg) =>
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

      console.log('✅ Сообщение успешно отредактировано:', {
        messageId,
        newText,
        edited: true,
      });

      chatState.editingMessage.value = null; // ✅ Очищаем редактирование после успешного редактирования
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

  function cancelEdit() {
    chatState.editingMessage.value = null; // ✅ Очищаем состояние редактирования
  }

  async function handleSelectUser(user: { id: number; username: string }) {
    const existingDialog = chatState.dialogs.value.find(
      (d: Dialog) => d.from === user.username && d.type === 'private_chat'
    );

    if (existingDialog) {
      openChat(existingDialog);
      chatState.showSearch.value = false;
      return;
    }

    try {
      const conversation = await createPrivateChat(user.id);
      const newDialog: Dialog = {
        id: conversation.id,
        from: user.username,
        type: conversation.conversation_type,
      };
      chatState.dialogs.value.push(newDialog);
      chatState.chats.value[newDialog.id] = [];
      openChat(newDialog);
    } catch (err: any) {
      console.error('Ошибка создания чата:', err.message);
      alert('Ошибка создания чата: ' + err.message);
    } finally {
      chatState.showSearch.value = false;
    }
  }

  async function handleSendMessage(
    conversationId: number,
    content: string | null,
    replyToMessageId?: number,
    attachment?: File
  ) {
    if (!conversationId) {
      alert('Ошибка: не выбран чат');
      return;
    }

    try {
      let attachmentData: Attachment | undefined;
      if (attachment) {
        const formData = new FormData();
        formData.append('file', attachment);
        attachmentData = await authService.makeRequest<Attachment>(
          '/attachments/upload',
          'POST',
          formData,
          { headers: { 'Content-Type': 'multipart/form-data' } }
        );
      }

      const finalContent = content || (attachment ? attachment?.name : null);

      const request = {
        message: {
          content: finalContent,
          reply_to_message_id: replyToMessageId,
          attachment: attachmentData,
        },
      };
      const response = await sendMessage(conversationId, request);

      const user = authService.getUser();
      const username = user?.username || 'Вы';

      const newMessage: ChatMessage = {
        id: response.id,
        text: response.content || (attachment ? attachment?.name || '' : ''),
        time: response.created_at
          ? new Date(response.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          : new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        author: response.user?.username || username,
        self: state.currentUserId !== null && response.user_id === state.currentUserId,
        reply: null,
        attachments: attachmentData
          ? [
              {
                type: attachment?.type?.startsWith('image/') ? 'image' : attachment?.type?.startsWith('video/') ? 'video' : 'file',
                url: await getAuthenticatedUrl(attachmentData),
                name: attachment?.name,
                size: attachment?.size ? `${(Number(attachment.size) / 1024).toFixed(2)} KB` : undefined,
              },
            ]
          : [],
        edited: response.edited || false,
      };

      if (!chatState.chats.value[conversationId]) {
        chatState.chats.value[conversationId] = [];
      }
      chatState.chats.value[conversationId].push(newMessage);
      state.chats = { ...state.chats };
      chatState.editingMessage.value = null; // ✅ Очищаем редактирование после отправки
    } catch (error: any) {
      console.error('Ошибка отправки:', error);
      alert('Ошибка отправки: ' + error.message);
    }
  }

  function clearSearch() {
    chatState.searchQuery.value = '';
    chatState.searchResults.value = [];
    chatState.isSearching.value = false;
  }

  function toggleWidget() {
    chatState.isOpen.value = !chatState.isOpen.value;
    if (!chatState.isOpen.value) {
      clearSearch();
      chatState.previewAttachment.value = null;
      chatState.showSearch.value = false;
      chatState.editingMessage.value = null; // ✅ Очищаем редактирование при закрытии
    }
  }

  function goBack() {
    chatState.currentScreen.value = 'dialogs';
    clearSearch();
    chatState.showSearch.value = false;
    chatState.previewAttachment.value = null;
    chatState.editingMessage.value = null; // ✅ Очищаем редактирование при возврате
  }

  function handlePreview(attachment: {
    type: 'image' | 'video' | 'file';
    url: string;
    name?: string;
    size?: string;
  }) {
    if ((attachment.type === 'image' || attachment.type === 'video') && attachment.url) {
      chatState.previewAttachment.value = attachment;
    }
  }

  const isSearchMode = computed(() => chatState.searchQuery.value.trim() !== '');

  onMounted(() => {
    const user = authService.getUser();
    if (user && user.id) {
      state.currentUserId = user.id;
    }
  });

  function handleSearch() {
    if (chatState.activeChat.value) {
      chatState.searchQuery.value = '';
    }
  }

  return {
    ...chatState,
    isSearchMode,
    loadConversations,
    openChat,
    deleteMessage,
    performSearch,
    clearSearch,
    toggleWidget,
    goBack,
    handleSendMessage,
    handlePreview,
    handleSelectUser,
    handleSearch,
    forwardMessage,
    handleEditMessage,
    cancelEdit, // ✅ Добавляем в возвращаемый объект
  };
}