<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { type Conversation } from '@/utils/conversations'
import { authService } from '../../utils/auth'
import UserSearch from './UserSearch.vue'

interface Participant {
  id: number
  user_id: number
  username: string
  avatar?: string
  joined_at?: string
}

interface ChatDetails {
  id: number
  name: string
  conversation_type: string
  created_at: string
  participants: Participant[]
  participants_count?: number
}

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
const showDetailsModal = ref(false)
const showUserSearch = ref(false)
const chatDetails = ref<ChatDetails | null>(null)
const loadingDetails = ref(false)
const justAddedUser = ref<string | null>(null)

// === Групповой чат? ===
const isGroupChat = computed(() => {
  if (chatDetails.value) {
    const type = chatDetails.value.conversation_type
    return ['group', 'group_chat'].includes(type) || String(type).toLowerCase().includes('group')
  }
  return ['group', 'group_chat'].includes(props.conversation.conversation_type)
})

// === Заголовок с кол-вом ===
const headerTitle = computed(() => {
  if (!isGroupChat.value) return props.title
  const count = chatDetails.value?.participants?.length || 0
  return `${props.title} (${count})`
})

// === Загрузка деталей ===
async function fetchChatDetails() {
  if (!props.conversation.id) return
  loadingDetails.value = true
  try {
    const details = await authService.makeRequest<ChatDetails>(
      `/conversations/${props.conversation.id}`,
      'GET'
    )
    console.log('[ChatHeader] Детали загружены:', details)

    // Обновляем реактивно
    if (chatDetails.value) {
      chatDetails.value.participants = details.participants || []
      chatDetails.value.participants_count = details.participants_count
      chatDetails.value.name = details.name
      chatDetails.value.created_at = details.created_at
    } else {
      chatDetails.value = details
    }
  } catch (error: any) {
    console.error('[ChatHeader] Ошибка загрузки:', error)
    alert('Не удалось загрузить детали чата')
  } finally {
    loadingDetails.value = false
  }
}

watch(() => props.conversation.id, fetchChatDetails, { immediate: true })

// === Поиск ===
watch(() => props.isSearchMode, (isSearch) => {
  if (isSearch) {
    isMenuOpen.value = false
    searchQuery.value = ''
  }
})

function toggleMenu() {
  if (!props.isSearchMode) isMenuOpen.value = !isMenuOpen.value
}

function openSearch() {
  emit('search')
  isMenuOpen.value = false
}

// === Модалки ===
function openChatDetails() {
  showDetailsModal.value = true
  isMenuOpen.value = false
}

function closeDetailsModal() {
  showDetailsModal.value = false
}

function openAddUser() {
  showUserSearch.value = true
  isMenuOpen.value = false
}

function closeUserSearch() {
  showUserSearch.value = false
}

function handleSearchInput(event: Event) {
  const target = event.target as HTMLInputElement
  emit('search-query', target.value)
}

function clearSearch() {
  searchQuery.value = ''
  emit('search-query', '')
}

// === УДАЛЕНИЕ УЧАСТНИКА (заглушка) ===
function removeParticipant() {
  window.alert('Удаление участника не реализовано')
}

// === УДАЛЕНИЕ ЧАТА ===
async function deleteConversation() {
  if (!confirm('Удалить чат?')) return
  try {
    await authService.makeRequest(`/conversations/${props.conversation.id}`, 'DELETE')
    emit('conversation-deleted', props.conversation.id)
    emit('go-back')
  } catch {
    alert('Ошибка удаления')
  }
}

// === ДОБАВЛЕНИЕ УЧАСТНИКА (МГНОВЕННОЕ ОБНОВЛЕНИЕ UI) ===
async function handleUserSelect(user: { id: number; username: string }) {
  console.log('[ChatHeader] Выбран для добавления:', user)

  try {
    const response = await authService.makeRequest<{
      participant: { id: number; user_id: number }
    }>(
      `/conversations/${props.conversation.id}/participants`,
      'POST',
      { user_id: user.id }
    )

    console.log('[ChatHeader] Добавлен:', response)

    const newParticipant: Participant = {
      id: response.participant.id,
      user_id: user.id,
      username: user.username,
      avatar: undefined,
      joined_at: new Date().toISOString()
    }

    // Безопасное обновление
    if (chatDetails.value) {
      chatDetails.value.participants.push(newParticipant)
    } else {
      chatDetails.value = {
        id: props.conversation.id,
        name: props.title,
        conversation_type: 'group_chat',
        created_at: new Date().toISOString(),
        participants: [newParticipant]
      }
    }

    justAddedUser.value = user.username
    emit('participant-added', response.participant)
    closeUserSearch()

    setTimeout(fetchChatDetails, 500)
  } catch (error: any) {
    console.error('[ChatHeader] Ошибка:', error)
    alert(error.response?.data?.error || 'Не удалось добавить')
  }
}
</script>

<template>
  <div class="chat-header">
    <!-- ПОИСК -->
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
      <button v-if="searchQuery" @click="clearSearch" class="clear-button">×</button>
    </div>

    <!-- ХЕДЕР -->
    <div v-else class="normal-mode">
      <button class="back-button" @click="emit('go-back')">←</button>
      <div class="header-center">{{ headerTitle }}</div>
      <div class="header-right">
        <button @click.stop="toggleMenu" class="menu-button">⋮</button>

        <transition name="menu">
          <div v-if="isMenuOpen" class="context-menu" @click.stop>
            <button @click="openSearch">
              <i class="fas fa-search"></i> Поиск сообщений
            </button>
            <button @click.stop="openChatDetails">
              <i class="fas fa-info-circle"></i> Детали чата
            </button>
            <button v-if="isGroupChat" @click="openAddUser">
              <i class="fas fa-user-plus"></i> Добавить участника
            </button>
            <button v-if="isGroupChat" @click="deleteConversation">
              <i class="fas fa-trash"></i> Удалить диалог
            </button>
            <button v-if="isGroupChat" @click="emit('rename-chat')">
              <i class="fas fa-edit"></i> Переименовать чат
            </button>
          </div>
        </transition>
      </div>
    </div>

    <!-- BACKDROP -->
    <div v-if="isMenuOpen" class="menu-backdrop" @click="isMenuOpen = false"></div>

    <!-- МОДАЛКА ДЕТАЛЕЙ -->
    <teleport to="body">
      <div v-if="showDetailsModal" class="modal-overlay" @click="closeDetailsModal">
        <div class="modal-content" @click.stop>
          <div class="modal-header">
            <h3>Детали чата</h3>
            <button @click="closeDetailsModal" class="close-btn">×</button>
          </div>

          <div v-if="loadingDetails" class="loading">Загрузка...</div>

          <div v-else-if="chatDetails" class="chat-info">
            <div class="chat-name"><strong>{{ chatDetails.name }}</strong></div>

            <div class="info-grid">
              <div><strong>Тип:</strong> {{ isGroupChat ? 'Групповой' : 'Личный' }}</div>
              <div><strong>Создан:</strong> {{ new Date(chatDetails.created_at).toLocaleDateString() }}</div>
              <div><strong>Участников:</strong> {{ chatDetails.participants.length }}</div>
            </div>

            <div class="section">
              <h4>Участники</h4>
              <div class="participants-list">
                <div
                  v-for="p in chatDetails.participants"
                  :key="p.id"
                  class="participant-tag"
                  :class="{ 'just-added': justAddedUser === p.username }"
                >
                  <img v-if="p.avatar" :src="p.avatar" class="avatar" />
                  <span>{{ p.username || 'Загрузка...' }}</span>
                  <button v-if="isGroupChat" @click="removeParticipant" class="remove-btn">×</button>
                </div>
              </div>

              <div v-if="justAddedUser" class="added-notification">
                <strong>{{ justAddedUser }}</strong> добавлен!
              </div>
            </div>

            <div class="modal-footer">
              <button @click="closeDetailsModal" class="btn-cancel">Закрыть</button>
            </div>
          </div>
        </div>
      </div>
    </teleport>

    <!-- ПОИСК УЧАСТНИКОВ -->
      <UserSearch
        v-if="showUserSearch"
        :visible="true"
        :conversation-id="props.conversation.id"
        :exclude-ids="chatDetails?.participants.map(p => p.user_id) ?? []"
        @select-user="handleUserSelect"
        @close="closeUserSearch"
      />
  </div>
</template>

<style scoped>
/* === ОСНОВНЫЕ СТИЛИ === */
.chat-header {
  height: 3.55rem;
  background: #fff;
  border-bottom: 1px solid #e2e8f0;
  z-index: 10001;
  position: relative;
}

.search-mode, .normal-mode {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 0.75rem;
  height: 100%;
}

.back-button {
  background: none;
  border: none;
  font-size: 1.2rem;
  color: #0078ff;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 6px;
}

.back-button:hover { background: rgba(0, 120, 255, 0.1); }

.search-input {
  flex: 1;
  padding: 0.75rem;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: #f8fafc;
  font-size: 0.95rem;
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
  color: #64748b;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  cursor: pointer;
}

.clear-button:hover { background: #f1f5f9; }

.header-center {
  flex: 1;
  text-align: center;
  font-weight: 600;
  font-size: 1rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  padding: 0 1rem;
}

.menu-button {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 6px;
}

.menu-button:hover { background: #f1f5f9; }

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
  padding: 1rem;
  border: none;
  text-align: left;
  cursor: pointer;
  font-size: 0.95rem;
}

.context-menu button:hover { background: #f0f7ff; }

.menu-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.1);
  z-index: 10001;
}

/* === МОДАЛКА ДЕТАЛЕЙ === */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10006;
}

.modal-content {
  background: white;
  border-radius: 12px;
  width: 90%;
  max-width: 420px;
  max-height: 80vh;
  overflow: visible;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
}

.modal-header {
  padding: 1rem 1.2rem;
  border-bottom: 1px solid #eee;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  color: #999;
  cursor: pointer;
}

.chat-name {
  text-align: center;
  font-size: 1.1rem;
  font-weight: 600;
  margin: 0.5rem 0;
  color: #1e293b;
}

.info-grid {
  display: grid;
  gap: 0.5rem;
  margin: 1rem 0;
  font-size: 0.9rem;
  padding: 0 1rem;
}

.info-grid div {
  display: flex;
  justify-content: space-between;
  padding: 0.4rem 0;
  border-bottom: 1px solid #eee;
}

.info-grid div:last-child { border: none; }

.section { margin: 1.5rem 0; padding: 0 1rem; }

.section h4 {
  margin: 0 0 0.5rem;
  font-size: 0.95rem;
  color: #475569;
}

.participants-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  padding: 0.5rem;
  background: #f8fafc;
  border-radius: 8px;
}

.participant-tag {
  background: #e3f2fd;
  color: #0078ff;
  padding: 0.4rem 0.7rem;
  border-radius: 20px;
  font-size: 0.85rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  border: 1px solid #bbdefb;
  transition: all 0.3s ease;
}

.participant-tag.just-added {
  background: #d4edda !important;
  border-color: #28a745 !important;
  animation: pulse 1s ease;
}

@keyframes pulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.08); }
  100% { transform: scale(1); }
}

.avatar {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  object-fit: cover;
}

.remove-btn {
  background: none;
  border: none;
  color: #ef4444;
  font-size: 1rem;
  cursor: pointer;
  width: 20px;
  height: 20px;
  border-radius: 50%;
}

.remove-btn:hover { background: rgba(239, 68, 68, 0.1); }

.added-notification {
  background: #d4edda;
  color: #155724;
  padding: 0.6rem;
  border-radius: 8px;
  margin: 1rem 0;
  text-align: center;
  font-size: 0.9rem;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.6rem;
  padding: 0.7rem 1rem;
  border-top: 1px solid #eee;
}

.btn-cancel {
  padding: 0.45rem 0.9rem;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.85rem;
  background: #f1f5f9;
  color: #666;
}

.loading {
  text-align: center;
  padding: 2rem;
  color: #666;
}
</style>