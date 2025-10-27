<script setup lang="ts">
import { ref, watch } from 'vue';
import { type Conversation } from '@/utils/conversations';
import { authService } from '../../utils/auth'; // Путь к authService

const props = defineProps<{
  title: string;
  conversation: Conversation;
  isSearchMode?: boolean;
}>();

const emit = defineEmits<{
  (e: 'go-back'): void;
  (e: 'search'): void;
  (e: 'search-query', query: string): void;
  (e: 'add-user'): void;
  (e: 'rename-chat'): void;
}>();

const isMenuOpen = ref(false);
const searchQuery = ref('');

// Отслеживание режима поиска
watch(() => props.isSearchMode, (isSearch) => {
  if (isSearch) {
    isMenuOpen.value = false;
    searchQuery.value = '';
  }
});

function toggleMenu() {
  if (!props.isSearchMode) {
    isMenuOpen.value = !isMenuOpen.value;
  }
}

function openSearch() {
  emit('search');
  isMenuOpen.value = false;
}

function handleSearchInput(event: Event) {
  const target = event.target as HTMLInputElement;
  emit('search-query', target.value);
}

function clearSearch() {
  searchQuery.value = '';
  emit('search-query', '');
}

// Функция удаления диалога с обработкой ошибок
async function deleteConversation() {
  try {
    const response = await authService.makeRequest<{ success: boolean; message: string }>(
      `/api/v1/conversations/${props.conversation.id}`,
      'DELETE'
    );
    isMenuOpen.value = false;
    emit('go-back');
    alert(response.message || 'Чат успешно удален');
  } catch (error: any) {
    console.error('Ошибка при удалении чата:', error);
    console.log('Полный ответ сервера:', error.response?.data);
    const status = error.response?.status;
    let errorMessage = 'Не удалось удалить чат';

    if (status === 401) {
      errorMessage = 'Вы не авторизованы. Пожалуйста, войдите в аккаунт';
    } else if (status === 403) {
      errorMessage = 'У вас нет прав для удаления этого чата';
    } else if (status === 404) {
      errorMessage = 'Чат не найден';
    } else if (status === 422) {
      errorMessage = error.response?.data?.error || 'Невозможно удалить чат по неизвестной причине';
    }

    alert(errorMessage);
  }
}
</script>

<template>
  <div class="chat-header">
    <!-- РЕЖИМ ПОИСКА -->
    <div v-if="props.isSearchMode" class="search-mode">
      <button class="back-button" @click="emit('go-back')">
        <i class="fas fa-arrow-left"></i>
      </button>
      <input
        v-model="searchQuery"
        @input="handleSearchInput"
        placeholder="Поиск сообщений..."
        class="search-input"
        autocomplete="off"
      />
      <button v-if="searchQuery" @click="clearSearch" class="clear-button">
        ×
      </button>
    </div>

    <!-- ОБЫЧНЫЙ ХЕДЕР -->
    <div v-else class="normal-mode">
      <button class="back-button" @click="emit('go-back')">
        ←
      </button>

      <div class="header-center">{{ props.title }}</div>

      <div class="header-right">
        <button @click.stop="toggleMenu" class="menu-button" :class="{ disabled: props.isSearchMode }">
          ⋮
        </button>

        <!-- МЕНЮ -->
        <transition name="menu">
          <div v-if="isMenuOpen && !props.isSearchMode" class="context-menu" @click.stop>
            <button @click="openSearch">
              <i class="fas fa-search"></i> Поиск сообщений
            </button>
            <button v-if="props.conversation.conversation_type === 'group'" @click="deleteConversation">
              <i class="fas fa-trash"></i> Удалить диалог
            </button>
            <button v-if="props.conversation.conversation_type === 'private'" @click="emit('add-user')">
              <i class="fas fa-user-plus"></i> Добавить пользователя
            </button>
            <button v-if="props.conversation.conversation_type === 'group'" @click="emit('rename-chat')">
              <i class="fas fa-edit"></i> Переименовать чат
            </button>
          </div>
        </transition>
      </div>
    </div>

    <!-- Backdrop -->
    <div v-if="isMenuOpen" class="menu-backdrop" @click="isMenuOpen = false"></div>
  </div>
</template>

<style scoped>
.chat-header {
  height: 3.55rem;
  background: #fff;
  border-bottom: 1px solid #e2e8f0;
  z-index: 10001;
}

.search-mode {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0 0.75rem;
}

.back-button {
  background: none;
  border: none;
  font-size: 1.2rem;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 6px;
  color: #0078ff;
  transition: background 0.15s ease;
  flex-shrink: 0;
}

.back-button:hover {
  background: rgba(0, 120, 255, 0.1);
}

.search-input {
  flex: 1;
  padding: 0.75rem 1rem;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 0.95rem;
  background: #f8fafc;
  transition: all 0.15s ease;
}

.search-input:focus {
  outline: none;
  border-color: #0078ff;
  background: #fff;
  box-shadow: 0 0 0 3px rgba(0, 120, 255, 0.1);
}

.clear-button {
  background: none;
  border: none;
  font-size: 1.25rem;
  cursor: pointer;
  color: #64748b;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: all 0.15s ease;
}

.clear-button:hover {
  background: #f1f5f9;
  color: #475569;
}

.normal-mode {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 0.75rem;
}

.header-center {
  font-weight: 600;
  font-size: 1rem;
  flex: 1;
  text-align: center;
  padding: 0 1rem;
}

.header-right {
  position: relative;
}

.menu-button {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 6px;
  transition: all 0.15s ease;
}

.menu-button:hover:not(.disabled) {
  background: #f1f5f9;
  transform: scale(1.1);
}

.menu-button.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.context-menu {
  position: fixed;
  top: 4rem;
  right: 1.5rem;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
  border: 1px solid #e2e8f0;
  min-width: 200px;
  z-index: 10002;
}

.context-menu button {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  width: 100%;
  padding: 1rem 1.25rem;
  background: none;
  border: none;
  text-align: left;
  cursor: pointer;
  font-size: 0.95rem;
  transition: background 0.15s ease;
}

.context-menu button:hover {
  background: #f0f7ff;
}

.menu-backdrop {
  position: fixed;
  inset: 0;
  z-index: 10001;
  background: rgba(0, 0, 0, 0.1);
}

.menu-enter-active,
.menu-leave-active {
  transition: all 0.25s ease;
  transform-origin: top right;
}

.menu-enter-from,
.menu-leave-to {
  opacity: 0;
  transform: translateY(-12px) scale(0.95);
}

.menu-enter-to,
.menu-leave-from {
  opacity: 1;
  transform: translateY(0) scale(1);
}
</style>