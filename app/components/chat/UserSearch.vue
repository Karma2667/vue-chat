<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted, computed } from 'vue'
import { searchUsers } from '../../utils/userSearch'

interface User {
  id: number
  username: string
  email: string // ← только string
  is_current_user: boolean
  avatar_url: string
  online: boolean
  status: string
  last_seen_at: string
}

const props = defineProps<{
  visible?: boolean
  excludeIds?: number[]
  conversationId?: number
}>()

const emit = defineEmits<{
  (e: 'select-user', user: { id: number; username: string }): void
  (e: 'close'): void
}>()

const searchQuery = ref('')
const users = ref<User[]>([])
const loading = ref(false)
const error = ref<string | null>(null)
const showOverlay = ref(false)

const filteredUsers = computed(() => {
  const query = searchQuery.value.toLowerCase().trim()
  if (!query || query.length < 2) return []

  return users.value.filter(user => {
    const name = user.username.toLowerCase()
    const email = user.email.toLowerCase()
    return name.includes(query) || email.includes(query)
  })
})

function debounce<T extends (...args: any[]) => any>(func: T, delay: number) {
  let timeout: ReturnType<typeof setTimeout> | null = null
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), delay)
  }
}

const performSearch = debounce(async (query: string) => {
  if (query.length < 2) {
    users.value = []
    return
  }

  loading.value = true
  error.value = null

  try {
    const result = await searchUsers(query, props.excludeIds, props.conversationId)
    users.value = result
      .filter(u => u.id && u.username)
      .map(u => ({
        ...u,
        email: u.email || 'email скрыт' // ← null → строка
      }))
  } catch (err: any) {
    error.value = err.message || 'Ошибка поиска'
  } finally {
    loading.value = false
  }
}, 300)

watch(searchQuery, (q) => performSearch(q))

watch(
  () => props.visible,
  (val) => {
    showOverlay.value = !!val
    if (!val) {
      searchQuery.value = ''
      users.value = []
    }
  },
  { immediate: true }
)

function closeOverlay() {
  showOverlay.value = false
  emit('close')
}

function selectUser(user: User) {
  if (user.id && user.username) {
    emit('select-user', { id: user.id, username: user.username })
    closeOverlay()
  }
}

function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') closeOverlay()
}

onMounted(() => document.addEventListener('keydown', handleKeydown))
onUnmounted(() => document.removeEventListener('keydown', handleKeydown))
</script>
<template>
  <Teleport to="body">
    <transition name="panel-slide">
      <div v-if="showOverlay" class="overlay" @click.self="closeOverlay">
        <div class="search-container">
          <!-- HEADER -->
          <div class="search-header">
            <button class="back-button" @click="closeOverlay">
              <i class="fas fa-arrow-left"></i>
            </button>
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Поиск пользователей..."
              autofocus
              class="search-input"
            />
            <div class="search-info" v-if="filteredUsers.length">
              {{ filteredUsers.length }} {{ filteredUsers.length === 1 ? 'пользователь' : 'пользователя' }}
            </div>
          </div>

          <!-- LOADING -->
          <div v-if="loading" class="loading">
            <i class="fas fa-spinner fa-spin"></i>
            Загрузка пользователей...
          </div>

          <!-- ERROR -->
          <div v-else-if="error" class="error">
            <i class="fas fa-exclamation-triangle"></i>
            {{ error }}
            <button @click="performSearch(searchQuery)" class="retry-btn">
              <i class="fas fa-redo"></i> Повторить
            </button>
          </div>

          <!-- RESULTS -->
          <div v-else-if="filteredUsers.length" class="messages-container">
            <div
              v-for="user in filteredUsers"
              :key="user.id"
              @click="selectUser(user)"
              class="message-item"
            >
              <div class="header">
                <span class="message-from">{{ user.username }}</span>
                <span class="message-time">
                  {{ user.status === 'online' ? 'В сети' : new Date(user.last_seen_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }}
                </span>
              </div>
              <div class="preview">
                {{ user.is_current_user ? '(Вы)' : user.email }}
              </div>
            </div>
          </div>

          <!-- NO RESULTS -->
          <div v-else-if="searchQuery.length >= 2" class="no-results">
            <i class="fas fa-search"></i>
            <div>Пользователи не найдены</div>
            <small>Попробуйте другой запрос</small>
          </div>

          <!-- EMPTY STATE -->
          <div v-else-if="!loading" class="empty-state">
            <i class="fas fa-magnifying-glass"></i>
            <div>Начните печатать для поиска</div>
            <small>минимум 2 символа</small>
          </div>
        </div>
      </div>
    </transition>
  </Teleport>
</template>

<style scoped>
.overlay {
  position: fixed;
  top: 0;
  right: 0;
  width: 400px;
  height: 100vh;
  background: rgba(0, 0, 0, 0.4);
  z-index: 10005 !important;
  display: flex;
  justify-content: flex-end;
}

.search-container {
  background: var(--bg-first, #fff);
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.search-header {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 1rem;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
}

.search-info {
  font-size: 0.8rem;
  color: #64748b;
  align-self: flex-end;
}

.back-button {
  background: none;
  border: none;
  font-size: 1.2rem;
  color: #0078ff;
  padding: 0.5rem;
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.15s ease;
  align-self: flex-start;
}

.back-button:hover {
  background: rgba(0, 120, 255, 0.1);
}

.search-input {
  flex: 1;
  padding: 0.875rem 1rem;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  font-size: 0.95rem;
  background: #f8fafc;
  transition: all 0.2s ease;
}

.search-input:focus {
  outline: none;
  border-color: #0078ff;
  background: #fff;
  box-shadow: 0 0 0 3px rgba(0, 120, 255, 0.1);
}

.messages-container {
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
}

.message-item {
  padding: 1rem;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 1px solid transparent;
  margin-bottom: 0.5rem;
}

.message-item:hover {
  background: #f0f7ff;
  border-color: rgba(0, 120, 255, 0.2);
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 0.5rem;
}

.message-from {
  font-weight: 600;
  color: #1f2937;
  font-size: 0.9rem;
}

.message-time {
  font-size: 0.8rem;
  color: #64748b;
}

.preview {
  font-size: 0.875rem;
  color: #374151;
  line-height: 1.4;
  font-style: italic;
}

.loading,
.empty-state,
.no-results,
.error {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem 1rem;
  text-align: center;
  color: #64748b;
}

.loading::before,
.empty-state > i,
.no-results > i,
.error > i {
  font-size: 2rem;
  margin-bottom: 1rem;
  color: #9ca3af;
}

.retry-btn {
  margin-top: 1rem;
  padding: 0.5rem 1.5rem;
  background: #0078ff;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.875rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.retry-btn:hover {
  background: #0066cc;
}

.error {
  color: #ef4444;
}

.panel-slide-enter-active,
.panel-slide-leave-active {
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
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