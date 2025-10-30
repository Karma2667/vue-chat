<script setup lang="ts">
import { ref, watch, computed, nextTick, onMounted } from 'vue'
import { type Conversation } from '@/utils/conversations'
import { authService } from '../../utils/auth'
import UserSearch from './UserSearch.vue'

interface Participant {
  id: number
  user_id: number
  username?: string
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

interface User {
  id: number
  username: string
  avatar_url?: string
  online?: boolean
  status?: string
  email?: string
  is_current_user?: boolean
  last_seen_at?: string
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
  (e: 'participant-removed', participantId: number): void
  (e: 'message-sent', message: any): void
}>()

// === Основные reactive-переменные ===
const isMenuOpen = ref(false)
const searchQuery = ref('')
const showDetailsModal = ref(false)
const showUserSearch = ref(false)
const chatDetails = ref<ChatDetails | null>(null)
const loadingDetails = ref(false)
const justAddedUser = ref<string | null>(null)
const currentUserId = ref<number | null>(null)

// Кэш пользователей
const userCache = ref<Map<number, User>>(new Map())

// === Проверка типа чата ===
const isGroupChat = computed(() => {
  const type = chatDetails.value?.conversation_type || props.conversation.conversation_type
  return ['group', 'group_chat'].includes(type) || String(type).toLowerCase().includes('group')
})

// === Заголовок ===
const headerTitle = computed(() => {
  if (!isGroupChat.value) return props.title
  const count = chatDetails.value?.participants?.length || 0
  return `${props.title} (${count})`
})

// === Участники (с подстановкой имени) ===
const participantsWithNames = computed(() => {
  if (!chatDetails.value?.participants) return []
  return chatDetails.value.participants.map(p => {
    const cached = userCache.value.get(p.user_id)
    const isMe = p.user_id === currentUserId.value

    return {
      ...p,
      username: isMe ? 'Вы' : cached?.username || p.username || `User ${p.user_id}`,
      avatar: cached?.avatar_url || p.avatar,
      online: cached?.online ?? false,
      isCurrentUser: isMe
    }
  })
})

// === Текущий пользователь ===
async function loadCurrentUser() {
  try {
    const me = await authService.makeRequest<User>('/users/current', 'GET')
    if (me?.id && me?.username) {
      currentUserId.value = me.id
      userCache.value.set(me.id, {
        ...me,
        online: me.online ?? true
      })
      console.log('[ChatHeader] Текущий пользователь:', me.username)
    }
  } catch (error: any) {
    if (error.response?.status !== 401)
      console.error('[ChatHeader] Ошибка загрузки текущего пользователя:', error)
  }
}

// === Загрузка всех пользователей (для кэша) ===
async function loadAllUsers() {
  if (userCache.value.size > 1) return
  try {
    const response = await authService.makeRequest<{ users: User[] }>('/users?limit=100', 'GET')
    response.users.forEach(u => userCache.value.set(u.id, u))
    console.log('[ChatHeader] Все пользователи загружены:', userCache.value.size)
  } catch (error) {
    console.error('[ChatHeader] Ошибка загрузки пользователей:', error)
  }
}

// === Детали чата ===
async function fetchChatDetails() {
  if (!props.conversation.id) return
  loadingDetails.value = true

  try {
    // Сначала грузим себя
    await loadCurrentUser()
    await loadAllUsers()

    const details = await authService.makeRequest<ChatDetails>(
      `/conversations/${props.conversation.id}`,
      'GET'
    )

    console.log('[ChatHeader] Детали чата загружены:', details)

    // Обновляем данные
    chatDetails.value = { ...details }

    // Правим имена
    chatDetails.value.participants.forEach(p => {
      const cached = userCache.value.get(p.user_id)
      const isMe = p.user_id === currentUserId.value

      if (isMe) {
        p.username = 'Вы'
      } else if (cached?.username) {
        p.username = cached.username
      } else if (!p.username) {
        p.username = `User ${p.user_id}`
      }
    })

    await nextTick()
  } catch (error: any) {
    console.error('[ChatHeader] Ошибка при загрузке деталей:', error)
    alert('Не удалось загрузить детали чата')
  } finally {
    loadingDetails.value = false
  }
}

watch(() => props.conversation.id, fetchChatDetails, { immediate: true })
onMounted(loadCurrentUser)

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
function handleSearchInput(e: Event) {
  emit('search-query', (e.target as HTMLInputElement).value)
}
function clearSearch() {
  searchQuery.value = ''
  emit('search-query', '')
}

// === Удаление участника ===
async function removeParticipant(participantId: number) {
  const participant = participantsWithNames.value.find(p => p.id === participantId)
  if (!participant || participant.isCurrentUser) return
  if (!confirm(`Удалить ${participant.username} из чата?`)) return

  try {
    await authService.makeRequest(
      `/conversations/${props.conversation.id}/participants/${participantId}`,
      'DELETE'
    )

    if (chatDetails.value) {
      const idx = chatDetails.value.participants.findIndex(p => p.id === participantId)
      if (idx !== -1) {
        chatDetails.value.participants.splice(idx, 1)
        if (chatDetails.value.participants_count)
          chatDetails.value.participants_count--
      }
    }

    emit('participant-removed', participantId)
  } catch (error: any) {
    const msg = error.response?.status === 403
      ? 'Нет прав'
      : error.response?.status === 404
        ? 'Участник не найден'
        : 'Ошибка удаления'
    alert(msg)
  }
}

// === Удаление чата ===
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

// === Добавление участника ===
async function handleUserSelect(user: { id: number; username: string }) {
  try {
    const response = await authService.makeRequest<{ participant: { id: number; user_id: number } }>(
      `/conversations/${props.conversation.id}/participants`,
      'POST',
      { user_id: user.id }
    )

    const newParticipant: Participant = {
      id: response.participant.id,
      user_id: user.id,
      username: user.username,
      joined_at: new Date().toISOString()
    }

    userCache.value.set(user.id, { id: user.id, username: user.username })
    chatDetails.value?.participants.push(newParticipant)
    if (chatDetails.value?.participants_count)
      chatDetails.value.participants_count++

    justAddedUser.value = user.username
    emit('participant-added', response.participant)
    closeUserSearch()

    setTimeout(fetchChatDetails, 500)
  } catch (error: any) {
    alert(error.response?.data?.error || 'Не удалось добавить участника')
  }
}
</script>

<template>
  <div class="chat-header">
    <!-- Режим поиска -->
    <div v-if="props.isSearchMode" class="search-mode">
      <button class="back-button" @click="emit('go-back')"><i class="fas fa-arrow-left"></i></button>
      <input
        v-model="searchQuery"
        @input="handleSearchInput"
        placeholder="Поиск сообщений..."
        class="search-input"
        autocomplete="off"
      />
      <button v-if="searchQuery" @click="clearSearch" class="clear-button">×</button>
    </div>

    <!-- Обычный режим -->
    <div v-else class="normal-mode">
      <button class="back-button" @click="emit('go-back')">←</button>
      <div class="header-center">{{ headerTitle }}</div>
      <div class="header-right">
        <button @click.stop="toggleMenu" class="menu-button">...</button>

        <transition name="menu">
          <div v-if="isMenuOpen" class="context-menu" @click.stop>
            <button @click="openSearch"><i class="fas fa-search"></i> Поиск сообщений</button>
            <button @click.stop="openChatDetails"><i class="fas fa-info-circle"></i> Детали чата</button>
            <button v-if="isGroupChat" @click="openAddUser"><i class="fas fa-user-plus"></i> Добавить участника</button>
            <button v-if="isGroupChat" @click="deleteConversation"><i class="fas fa-trash"></i> Удалить диалог</button>
            <button v-if="isGroupChat" @click="emit('rename-chat')"><i class="fas fa-edit"></i> Переименовать чат</button>
          </div>
        </transition>
      </div>
    </div>

    <div v-if="isMenuOpen" class="menu-backdrop" @click="isMenuOpen = false"></div>

    <!-- Детали чата -->
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
              <div><strong>Участников:</strong> {{ participantsWithNames.length }}</div>
            </div>

            <div class="section">
              <h4>Участники</h4>
              <div class="participants-list">
                <div
                  v-for="p in participantsWithNames"
                  :key="p.id"
                  class="participant-tag"
                  :class="{ 'just-added': justAddedUser === p.username, 'online': p.online }"
                >
                  <img v-if="p.avatar" :src="p.avatar" class="avatar" />
                  <div class="status-dot" v-if="p.online"></div>
                  <span>{{ p.username }}</span>
                  <button
                    v-if="!p.isCurrentUser"
                    @click.stop="removeParticipant(p.id)"
                    class="remove-btn"
                  >×</button>
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
  position: relative;
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
.participant-tag.online {
  border-color: #28a745;
  background: #d4edda;
}
.participant-tag.just-added {
  animation: pulse 1s ease;
}
@keyframes pulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.08); }
  100% { transform: scale(1); }
}
.status-dot {
  position: absolute;
  bottom: 2px;
  right: 2px;
  width: 8px;
  height: 8px;
  background: #28a745;
  border-radius: 50%;
  border: 1.5px solid white;
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