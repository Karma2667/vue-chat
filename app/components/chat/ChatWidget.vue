<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import ChatToggle from './ChatToggle.vue';
import Backdrop from './Backdrop.vue';
import ChatPanel from './ChatPanel.vue';
import UserSearch from './UserSearch.vue';
import AttachmentPreview from './AttachmentPreview.vue';
import { fetchConversations, type Conversation } from '../../utils/conversations';
import { createPrivateChat } from '../../utils/createPrivateChat';
import { sendMessage, fetchMessages, getAttachmentUrl, type Attachment } from '../../utils/messages';
import { authService } from '../../utils/auth';

const currentUserId = ref<number | null>(null);
const isOpen = ref(false);
const currentScreen = ref<'dialogs' | 'chat'>('dialogs');
const activeChat = ref<any>(null);
const inited = ref(false);
const showSearch = ref(false);
const previewAttachment = ref<{ type: 'image' | 'video' | 'file'; url: string; name?: string; size?: string } | null>(null);

const dialogs = ref<Array<{
  id: number;
  from: string;
  type?: string;
  lastMessage?: { content: string; created_at: string; username: string };
}>>([]);
const chats = ref<Record<number, any[]>>({});

async function getAuthenticatedUrl(attachment: { id?: string; url?: string; mime_type?: string }): Promise<string> {
  if (!attachment.id && !attachment.url) {
    console.warn('Отсутствуют attachment.id и attachment.url для загрузки медиа:', attachment);
    return '';
  }
  try {
    if (attachment.id) {
      console.log(`Fetching authenticated URL for attachment ID: ${attachment.id}`);
      const blobUrl = await getAttachmentUrl(attachment.id);
      console.log(`Successfully created blob URL: ${blobUrl}`);
      return blobUrl;
    } else if (attachment.url) {
      console.log(`Using direct URL as fallback: ${attachment.url}`);
      return attachment.url; // Временное решение, пока сервер не возвращает id
    }
    return '';
  } catch (error: any) {
    console.error(`Failed to fetch media for attachment:`, attachment, error.message);
    return '';
  }
}

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
    response.conversations.forEach((conv) => {
      if (!chats.value[conv.id]) {
        chats.value[conv.id] = [];
      }
    });
    console.log('Диалоги загружены:', dialogs.value);
  } catch (error: any) {
    console.error('Не удалось загрузить диалоги:', error.message);
  }
}

async function openChat(dialog: any) {
  activeChat.value = dialog;
  currentScreen.value = 'chat';
  console.log('Chat opened with dialog:', dialog);

  if (dialog.id) {
    try {
      const messages = await fetchMessages(dialog.id); // Теперь возвращается Message[]
      chats.value[dialog.id] = await Promise.all(messages.map(async (msg: Message) => {
        const attachmentData = msg.attachment && (msg.attachment.id || msg.attachment.url)
          ? {
              type: (msg.attachment.mime_type || 'application/octet-stream').startsWith('image/') ? 'image' :
                    (msg.attachment.mime_type || 'application/octet-stream').startsWith('video/') ? 'video' : 'file',
              url: await getAuthenticatedUrl(msg.attachment),
              name: msg.attachment.filename || 'unknown',
              size: msg.attachment.size != null ? `${(Number(msg.attachment.size) / 1024).toFixed(2)} KB` : 'unknown',
            }
          : null;
        console.log('Формирование вложения:', attachmentData);
        return {
          id: msg.id,
          text: msg.content || '',
          time: msg.created_at
            ? new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            : new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          author: msg.user?.username || 'Unknown',
          self: currentUserId.value !== null && msg.user_id === currentUserId.value,
          reply: msg.reply_to
            ? {
                id: msg.reply_to,
                text: chats.value[dialog.id]?.find((m) => m.id === msg.reply_to)?.text || 'Сообщение не найдено',
                author: chats.value[dialog.id]?.find((m) => m.id === msg.reply_to)?.author || 'Unknown',
              }
            : null,
          attachments: attachmentData ? [attachmentData] : [],
        };
      }));
      console.log('Сообщения для чата загружены:', chats.value[dialog.id]);
    } catch (error: any) {
      console.error('Ошибка при загрузке сообщений:', error.message);
      alert('Ошибка загрузки сообщений: ' + error.message);
    }
  } else {
    console.error('Ошибка: dialog.id не определён при открытии чата');
  }
}

onMounted(() => {
  requestAnimationFrame(() => (inited.value = true));
  loadConversations();
  const user = authService.getUser();
  if (user && user.id) {
    currentUserId.value = user.id;
    console.log('Current user ID:', currentUserId.value);
  } else {
    console.error('Не удалось получить ID текущего пользователя');
  }
  console.log('Initial isOpen:', isOpen.value);
});

function toggleWidget() {
  isOpen.value = !isOpen.value;
  if (!isOpen.value) {
    showSearch.value = false;
    previewAttachment.value = null;
  }
  console.log('Widget toggled:', isOpen.value);
}

function goBack() {
  currentScreen.value = 'dialogs';
  showSearch.value = false;
  previewAttachment.value = null;
  console.log('Go back to dialogs');
}

function openSearch() {
  showSearch.value = true;
}

async function handleSelectUser(user: { id: number; username: string }) {
  console.log('User selected for chat creation:', user);
  const existingDialog = dialogs.value.find(
    (d) => d.from === user.username && d.type === 'private_chat'
  );

  if (existingDialog) {
    console.log('Existing dialog found:', existingDialog);
    openChat(existingDialog);
    showSearch.value = false;
    return;
  }

  try {
    console.log(`Начало создания чата с пользователем: ${user.username} (ID: ${user.id})`);
    const conversation = await createPrivateChat(user.id);
    console.log('Успешно создан чат:', conversation);
    const newDialog = {
      id: conversation.id,
      from: user.username,
      type: conversation.conversation_type,
    };
    dialogs.value.push(newDialog);
    chats.value[newDialog.id] = [];
    console.log('New dialog added to dialogs:', newDialog);
    console.log('Chats updated for ID:', newDialog.id);
    openChat(newDialog);
  } catch (err: any) {
    console.error('Ошибка создания чата:', err.message);
    alert('Ошибка создания чата: ' + err.message);
  } finally {
    showSearch.value = false;
    console.log('Завершение процесса создания чата');
  }
}

async function uploadAttachment(file: File): Promise<Attachment> {
  const formData = new FormData();
  formData.append('file', file);
  try {
    console.log('Uploading file to /api/v1/attachments/upload');
    const response = await authService.makeRequest<Attachment>(
      '/attachments/upload', // Исправлен URL: убрано дублирование /api/v1
      'POST',
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    console.log('File uploaded successfully:', response);
    return response;
  } catch (error: any) {
    console.error('Failed to upload file:', error.message, error.response?.data);
    throw error;
  }
}

async function handleSendMessage(
  conversationId: number,
  content: string | null,
  replyToMessageId?: number,
  attachment?: File
) {
  console.log('handleSendMessage вызван:', { conversationId, content, replyToMessageId, attachment });
  if (!conversationId) {
    console.error('Ошибка: conversationId не определён');
    alert('Ошибка: не выбран чат');
    return;
  }

  try {
    let attachmentData: Attachment | undefined;
    if (attachment) {
      attachmentData = await uploadAttachment(attachment);
    }

    const request = {
      message: {
        content,
        reply_to_message_id: replyToMessageId,
        attachment: attachmentData,
      }
    };
    console.log('Отправка сообщения через sendMessage:', request);
    const response = await sendMessage(conversationId, request);
    console.log('Ответ от sendMessage:', response);

    const user = authService.getUser();
    const username = user?.username || 'Вы';

    const newMessage = {
      id: response.id,
      text: response.content || '',
      time: response.created_at
        ? new Date(response.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        : new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      author: response.user?.username || username,
      self: currentUserId.value !== null && response.user_id === currentUserId.value,
      reply: replyToMessageId
        ? {
            id: replyToMessageId,
            text: chats.value[conversationId]?.find((m) => m.id === replyToMessageId)?.text || 'Сообщение не найдено',
            author: chats.value[conversationId]?.find((m) => m.id === response.reply_to)?.author || 'Unknown',
          }
        : null,
      attachments: response.attachment && (response.attachment.id || response.attachment.url)
        ? [{
            type: (response.attachment.mime_type || 'application/octet-stream').startsWith('image/') ? 'image' :
                  (response.attachment.mime_type || 'application/octet-stream').startsWith('video/') ? 'video' : 'file',
            url: await getAuthenticatedUrl(response.attachment),
            name: response.attachment.filename || 'unknown',
            size: response.attachment.size != null ? `${(Number(response.attachment.size) / 1024).toFixed(2)} KB` : 'unknown',
          }]
        : [],
    };

    if (!chats.value[conversationId]) chats.value[conversationId] = [];
    chats.value[conversationId].push(newMessage);
    console.log('Сообщение добавлено локально:', newMessage);
  } catch (error: any) {
    console.error('Ошибка в handleSendMessage:', error.message, error);
    alert('Ошибка отправки: ' + error.message);
  }
}

function handlePreview(attachment: { type: 'image' | 'video' | 'file'; url: string; name?: string; size?: string }) {
  if ((attachment.type === 'image' || attachment.type === 'video') && attachment.url) {
    console.log('Открытие предпросмотра:', attachment);
    previewAttachment.value = attachment;
  } else {
    console.warn('Пропуск предпросмотра: некорректный тип или отсутствует URL', attachment);
  }
}

const widgetClasses = computed(() => ({
  'is-open': isOpen.value,
  'panel-inited': inited.value,
}));
</script>

<template>
  <div class="messenger-widget" :class="widgetClasses">
    <transition name="toggle-fade">
      <ChatToggle
        v-if="!isOpen"
        :is-open="isOpen"
        class="chat-toggle"
        @toggle="toggleWidget"
      />
    </transition>

    <Backdrop v-if="isOpen" @close="toggleWidget" />

    <transition name="panel-slide">
      <ChatPanel
        v-if="isOpen"
        :is-open="isOpen"
        :current-screen="currentScreen"
        :dialogs="dialogs"
        :active-chat="activeChat"
        :chats="chats"
        @open-chat="openChat"
        @go-back="goBack"
        @search="openSearch"
        @send-message="handleSendMessage"
        @preview="handlePreview"
      />
    </transition>

    <UserSearch
      :visible="showSearch"
      :conversation-id="activeChat?.id"
      :dialogs="dialogs"
      @select-user="handleSelectUser"
      @close="showSearch = false"
    />

    <AttachmentPreview
      v-if="previewAttachment"
      :attachment="previewAttachment"
      :visible="!!previewAttachment"
      @close="previewAttachment = null"
    />
  </div>
</template>

<style scoped>
.messenger-widget {
  position: fixed;
  inset: 0;
  width: 400px;
  right: 0;
  left: auto;
  z-index: 1000;
}

.messenger-widget > * {
  user-select: auto !important;
  pointer-events: auto !important;
}

.backdrop {
  z-index: 999;
}

.chat-panel {
  z-index: 1000;
}

.chat-toggle {
  z-index: 1001;
  position: fixed;
  bottom: 24px;
  right: 24px;
}

.toggle-fade-enter-active,
.toggle-fade-leave-active {
  transition: all 0.3s ease;
}
.toggle-fade-enter-from,
.toggle-fade-leave-to {
  opacity: 0;
  transform: scale(0.9);
}
.toggle-fade-enter-to,
.toggle-fade-leave-from {
  opacity: 1;
  transform: scale(1);
}

.panel-slide-enter-active,
.panel-slide-leave-active {
  transition: transform 0.4s ease;
}
.panel-slide-enter-from,
.panel-slide-leave-to {
  transform: translateX(100%);
}
.panel-slide-enter-to,
.panel-slide-leave-from {
  transform: translateX(0);
}
</style>