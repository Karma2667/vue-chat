<!-- components/UserSearch.vue -->
<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { searchUsers } from '../../utils/userSearch'
import { navigateTo } from '#app'

interface User {
  id: number
  username: string
  email: string
  is_current_user: boolean
  avatar_url: string
  online: boolean
  status: string
  last_seen_at: string
}

const props = defineProps<{
  excludeIds?: number[]
  conversationId?: number
  visible?: boolean
  dialogs?: { id: number; from: string; type?: string }[]
}>()

const emit = defineEmits<{
  (e: 'select-user', user: { id: number; username: string }): void
  (e: 'close'): void
}>()

const searchQuery = ref('')
const users = ref<User[]>([])
const loading = ref(false)
const error = ref<string | null>(null)
const showOverlay = ref(props.visible ?? false)

function debounce<T extends (...args: any[]) => any>(func: T, delay: number): (...args: Parameters<T>) => void {
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
    users.value = result.filter(user => user.id !== undefined && user.username)
    console.log('Filtered users in component:', users.value)
  } catch (err: any) {
    error.value = err.message || 'Ошибка при поиске пользователей'
    console.error('Search error:', err)
  } finally {
    loading.value = false
  }
}, 300)

watch(searchQuery, (newQuery) => {
  performSearch(newQuery)
})

watch(() => props.visible, (newVisible) => {
  showOverlay.value = newVisible ?? false
  if (!showOverlay.value) {
    searchQuery.value = ''
    users.value = []
  }
})

function handleKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    closeOverlay()
  }
}

function closeOverlay() {
  showOverlay.value = false
  emit('close')
}

function selectUser(user: User) {
  if (user.id !== undefined && user.username) {
    console.log('Selected user:', { id: user.id, username: user.username })
    emit('select-user', { id: user.id, username: user.username })
  } else {
    console.warn('Invalid user selected:', user)
  }
}

onMounted(() => {
  document.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
})
</script>

<template>
  <Teleport to="body">
    <transition name="panel-slide">
      <div v-if="showOverlay" class="overlay">
        <div class="search-container">
          <div class="search-header">
            <button class="back-button" @click="closeOverlay">
              <i class="fas fa-arrow-left"></i>
            </button>
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Поиск пользователей"
              autofocus
              class="search-input"
            />
          </div>

          <div v-if="loading" class="loading">Загрузка...</div>

          <div v-if="error" class="error">
            {{ error }}
            <button v-if="error.includes('Неавторизован')" @click="closeOverlay; navigateTo('/auth')">
              Войти
            </button>
          </div>

          <div class="dialogs-container">
            <div
              v-for="user in users"
              :key="user.id"
              @click="selectUser(user)"
              class="dialog-item"
            >
              <div class="header">
                <span class="message-from">{{ user.username }}</span>
                <span class="message-created-at">
                  {{ user.status === 'online' ? 'В сети' : new Date(user.last_seen_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }}
                </span>
              </div>
              <div class="preview">
                {{ user.is_current_user ? '(Вы)' : user.email }}
              </div>
            </div>
          </div>

          <div v-if="!loading && searchQuery.length >= 2 && users.length === 0" class="no-results">
            Нет пользователей по запросу
          </div>
        </div>
      </div>
    </transition>
  </Teleport>
</template>

<style scoped>
/* Стили остаются без изменений */
.overlay {
  position: fixed;
  top: 0;
  right: 0;
  width: 400px;
  height: 100vh;
  background: rgba(0, 0, 0, 0.3);
  z-index: 1001;
  display: flex;
  justify-content: flex-end;
}

.search-container {
  background: var(--bg-first, #fff);
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  box-shadow: var(--shadow-light);
}

.search-header {
  display: flex;
  align-items: center;
  padding: 0.5rem 1rem;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  background: var(--bg-first, #fff);
}

.back-button {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 1rem;
  color: #0078ff;
  margin-right: 0.5rem;
}

.search-input {
  flex: 1;
  padding: 0.5rem;
  border: none;
  border-radius: 4px;
  font-size: 0.9rem;
  background: #f1f5f9;
}

.dialogs-container {
  flex: 1;
  overflow-y: auto;
  padding: 0.5rem;
}

.dialog-item {
  padding: 0.5rem;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  border-radius: var(--border-radius);
  cursor: pointer;
  transition: background-color var(--transition-fast);
}

.dialog-item:hover {
  background-color: var(--bg-accent, #e6f0ff);
}

.header {
  display: flex;
  justify-content: space-between;
  font-size: 0.875rem;
}

.message-from {
  font-weight: 600;
  color: var(--tx-first, #000);
}

.message-created-at {
  font-size: 0.85rem;
  color: var(--tx-second, #888);
}

.preview {
  font-size: 0.85rem;
  color: var(--tx-second, #888);
}

.loading,
.error,
.no-results {
  padding: 1rem;
  text-align: center;
  color: var(--tx-second, #666);
}

.error {
  color: red;
}

.error button {
  margin-top: 0.5rem;
  padding: 0.5rem 1rem;
  background: #0078ff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
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