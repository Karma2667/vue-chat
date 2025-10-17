<!-- components/ChatWidget.vue -->
<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import ChatToggle from './ChatToggle.vue';
import Backdrop from './Backdrop.vue';
import ChatPanel from './ChatPanel.vue';
import UserSearch from './UserSearch.vue';
import { fetchConversations, type Conversation } from '../../utils/conversations';
import { createPrivateChat } from '../../utils/createPrivateChat';

const isOpen = ref(false);
const currentScreen = ref<'dialogs' | 'chat'>('dialogs');
const activeChat = ref<any>(null);
const inited = ref(false);
const showSearch = ref(false);

// Инициализируем диалоги и чаты
const dialogs = ref<{ id: number; from: string; type?: string }[]>([]);
const chats = ref<Record<number, any[]>>({});

// Загрузка диалогов с сервера
async function loadConversations() {
  try {
    const response = await fetchConversations(1, 20);
    dialogs.value = response.conversations.map((conv: Conversation) => ({
      id: conv.id,
      from: conv.users?.[0]?.username || conv.name || 'Без имени',
      type: conv.conversation_type,
    }));
    // Инициализируем пустые чаты для каждого диалога
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

onMounted(() => {
  requestAnimationFrame(() => (inited.value = true));
  // Загружаем диалоги при монтировании
  loadConversations();
});

function toggleWidget() {
  isOpen.value = !isOpen.value;
  if (!isOpen.value) {
    showSearch.value = false;
  }
  console.log('Widget toggled:', isOpen.value);
}

function openChat(dialog: any) {
  activeChat.value = dialog;
  currentScreen.value = 'chat';
  console.log('Chat opened with dialog:', dialog);
}

function goBack() {
  currentScreen.value = 'dialogs';
  showSearch.value = false;
  console.log('Go back to dialogs');
}

function openSearch() {
  showSearch.value = true;
}

async function handleSelectUser(user: { id: number; username: string }) {
  console.log('User selected for chat creation:', user);

  // Проверяем, существует ли диалог с этим пользователем
  const existingDialog = dialogs.value.find(
    (d) => d.from === user.username && d.type === 'private_chat'
  );

  if (existingDialog) {
    console.log('Existing dialog found:', existingDialog);
    openChat(existingDialog);
    showSearch.value = false;
    return;
  }

  // Создаём новый чат, если его нет
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
  } finally {
    showSearch.value = false;
    console.log('Завершение процесса создания чата');
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
      />
    </transition>

    <UserSearch
      :visible="showSearch"
      :conversation-id="activeChat?.id"
      :dialogs="dialogs"
      @select-user="handleSelectUser"
      @close="showSearch = false"
    />
  </div>
</template>

<style scoped>
/* Стили остаются без изменений */
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