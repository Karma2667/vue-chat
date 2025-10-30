<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { type Conversation } from '@/utils/conversations'
import { authService } from '../../utils/auth'
import UserSearch from './UserSearch.vue'

const props = defineProps<{
  title: string
  conversation: Conversation
  isSearchMode?: boolean
}>()

const emit = defineEmits<{
  (e: 'go-back'): void
  (e: 'search'): void
  (e: 'search-query', query: string): void
  (e: 'rename-chat'): void
  (e: 'conversation-deleted', id: number): void
  (e: 'participant-added', participant: { id: number; user_id: number }): void
}>()

const isMenuOpen = ref(false)
const searchQuery = ref('')
const showAddUserModal = ref(false)
const selectedUserToAdd = ref<{ id: number; username: string } | null>(null)

// === Групповой чат? ===
const isGroupChat = computed(() => {
  const type = props.conversation.conversation_type
  console.log('[ChatHeader] conversation_type:', type, props.conversation)
  return ['group', 'group_chat'].includes(type) || String(type).toLowerCase().includes('group')
})

// === Поиск ===
watch(() => props.isSearchMode, (isSearch) => {
  if (isSearch) {
    isMenuOpen.value = false
    searchQuery.value = ''
  }
})

function toggleMenu() {
  if (!props.isSearchMode) {
    isMenuOpen.value = !isMenuOpen.value
  }
}

function openSearch() {
  emit('search')
  isMenuOpen.value = false
}

function handleSearchInput(event: Event) {
  const target = event.target as HTMLInputElement
  emit('search-query', target.value)
}

function clearSearch() {
  searchQuery.value = ''
  emit('search-query', '')
}

// === Удаление диалога ===
async function deleteConversation() {
  try {
    await authService.makeRequest(
      `/conversations/${props.conversation.id}`,
      'DELETE'
    )
    isMenuOpen.value = false
    emit('conversation-deleted', props.conversation.id)
    emit('go-back')
    alert('Чат удалён')
  } catch (error: any) {
    console.error('Ошибка при удалении чата:', error)
    const status = error.response?.status
    let message = 'Не удалось удалить чат'

    if (status === 401) message = 'Вы не авторизованы'
    else if (status === 403) message = 'У вас нет прав'
    else if (status === 404) message = 'Чат не найден'
    else if (status === 422) message = error.response?.data?.error || 'Невозможно удалить'

    alert(message)
  }
}

// === Добавление участника ===
function openAddUserModal() {
  showAddUserModal.value = true
  selectedUserToAdd.value = null
  isMenuOpen.value = false
}

function closeAddUserModal() {
  showAddUserModal.value = false
  selectedUserToAdd.value = null
}

function handleUserSelect(user: { id: number; username: string }) {
  selectedUserToAdd.value = user
}

async function confirmAddUser() {
  if (!selectedUserToAdd.value) return

  try {
    const response = await authService.makeRequest<{
      participant: { id: number; user_id: number }
    }>(
      `/api/v1/conversations/${props.conversation.id}/participants`,
      'POST',
      { user_id: selectedUserToAdd.value.id }
    )

    alert(`@${selectedUserToAdd.value.username} добавлен в чат`)
    emit('participant-added', response.participant)
    closeAddUserModal()
  } catch (error: any) {
    console.error('Ошибка при добавлении участника:', error)
    const status = error.response?.status
    let message = 'Не удалось добавить участника'

    if (status === 401) message = 'Вы не авторизованы'
    else if (status === 403) message = 'У вас нет прав'
    else if (status === 404) message = 'Чат не найден'
    else if (status === 422) message = error.response?.data?.error || 'Неверный пользователь'

    alert(message)
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

            <button v-if="isGroupChat" @click="deleteConversation">
              <i class="fas fa-trash"></i> Удалить диалог
            </button>

            <button v-if="isGroupChat" @click="openAddUserModal">
              <i class="fas fa-user-plus"></i> Добавить пользователя
            </button>

            <button v-if="isGroupChat" @click="emit('rename-chat')">
              <i class="fas fa-edit"></i> Переименовать чат
            </button>
          </div>
        </transition>
      </div>
    </div>

    <!-- Backdrop -->
    <div v-if="isMenuOpen" class="menu-backdrop" @click="isMenuOpen = false"></div>

    <!-- МОДАЛКА ДОБАВЛЕНИЯ -->
    <div v-if="showAddUserModal" class="add-user-modal-overlay" @click="closeAddUserModal">
      <div class="add-user-modal" @click.stop>
        <div class="modal-header">
          <h3>Добавить участника</h3>
          <button @click="closeAddUserModal" class="close-btn">×</button>
        </div>

        <div class="modal-body">
          <UserSearch
            :visible="true"
            @select-user="handleUserSelect"
            @close="closeAddUserModal"
            class="embedded-search"
          />

          <div v-if="selectedUserToAdd" class="selected-preview">
            <div class="user-tag">
              {{ selectedUserToAdd.username }}
              <button @click="selectedUserToAdd = null" class="remove-btn">×</button>
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button @click="closeAddUserModal" class="btn-cancel">Отмена</button>
          <button
            @click="confirmAddUser"
            class="btn-confirm"
            :disabled="!selectedUserToAdd"
          >
            Добавить
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* ... (все стили из предыдущей версии — без изменений) ... */
.chat-header {
  height: 3.55rem;
  background: #fff;
  border-bottom: 1px solid #e2e8f0;
  z-index: 10001;
  position: relative;
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
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
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

/* Модалка добавления */
.add-user-modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10006;
}

.add-user-modal {
  background: white;
  border-radius: 12px;
  width: 90%;
  max-width: 420px;
  max-height: 80vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
}

.modal-header {
  padding: 1rem 1.2rem;
  border-bottom: 1px solid #eee;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-shrink: 0;
}

.modal-header h3 {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #999;
}

.modal-body {
  flex: 1;
  overflow-y: auto;
  padding: 0.8rem 1.2rem;
  min-height: 200px;
}

.embedded-search {
  min-height: 300px;
}

.selected-preview {
  margin-top: 1rem;
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.user-tag {
  background: #e3f2fd;
  color: #0078ff;
  padding: 0.35rem 0.65rem;
  border-radius: 20px;
  font-size: 0.8rem;
  display: flex;
  align-items: center;
  gap: 0.4rem;
  border: 1px solid #bbdefb;
}

.remove-btn {
  background: none;
  border: none;
  color: #0078ff;
  font-size: 1rem;
  cursor: pointer;
  width: 18px;
  height: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-footer {
  padding: 0.7rem 1.2rem;
  border-top: 1px solid #eee;
  display: flex;
  justify-content: flex-end;
  gap: 0.6rem;
  flex-shrink: 0;
}

.btn-cancel,
.btn-confirm {
  padding: 0.45rem 0.9rem;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.85rem;
  min-width: 70px;
}

.btn-cancel {
  background: #f1f5f9;
  color: #666;
}

.btn-confirm {
  background: #0078ff;
  color: white;
}

.btn-confirm:disabled {
  background: #cccccc;
  cursor: not-allowed;
}
</style>