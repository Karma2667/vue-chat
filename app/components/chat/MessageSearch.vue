<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, computed, nextTick } from 'vue'
import { authService } from '~/utils/auth'
import type { Message } from '~/utils/messages'

interface UserSearchProps {
  conversationId?: number
  visible?: boolean
}

const props = defineProps<UserSearchProps>()

const emit = defineEmits<{
  (e: 'select-message', message: ChatMessage): void
  (e: 'close'): void
}>()

const searchQuery = ref('')
const rawMessages = ref<Message[]>([])
const loading = ref(false)
const error = ref<string | null>(null)
const showOverlay = ref(props.visible ?? false)
const highlightedMessageId = ref<number | null>(null) // ✅ Подсветка

// ✅ ФИЛЬТР ПО ТЕКСТУ + сортировка по дате
const messages = computed(() => {
  const query = searchQuery.value.toLowerCase().trim()
  if (!query || query.length < 2) return []
  
  return rawMessages.value
    .filter(msg => {
      const text = (msg.content || '').toLowerCase()
      return text.includes(query)
    })
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()) // ✅ Новые сверху
    .map(msg => ({
      id: msg.id,
      text: msg.content || '',
      time: msg.created_at 
        ? new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        : '',
      author: msg.user?.username || 'Unknown',
      self: false,
      reply: null,
      attachments: [],
    } as ChatMessage))
})

function debounce<T extends (...args: any[]) => any>(func: T, delay: number) {
  let timeout: ReturnType<typeof setTimeout> | null = null
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), delay)
  }
}

const loadMessages = debounce(async () => {
  if (!props.conversationId) {
    rawMessages.value = []
    return
  }

  loading.value = true
  error.value = null

  try {
    const response = await authService.makeRequest<{
      messages: Message[]
      meta: { pagination: { current_page: number; total_pages: number; total_count: number } }
    }>(`/conversations/${props.conversationId}/messages?page=1&items=200`, 'GET')
    
    rawMessages.value = response.messages || []
    console.log('✅ Загружено сообщений для поиска:', rawMessages.value.length)
  } catch (err: any) {
    error.value = err.response?.data?.message || err.message || 'Ошибка загрузки сообщений'
    console.error('❌ Ошибка загрузки сообщений:', err)
    rawMessages.value = []
  } finally {
    loading.value = false
  }
}, 500)

watch(() => props.visible, async (newVisible) => {
  showOverlay.value = newVisible ?? false
  if (newVisible && props.conversationId) {
    await loadMessages()
  } else if (!newVisible) {
    searchQuery.value = ''
    rawMessages.value = []
    highlightedMessageId.value = null
  }
}, { immediate: true })

function handleKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    closeOverlay()
  }
}

function closeOverlay() {
  showOverlay.value = false
  emit('close')
}

async function selectMessage(message: ChatMessage) {
  console.log('🎯 Выбрано сообщение:', message.id)
  
  // ✅ НАЙДИ .messages КОНТЕЙНЕР
  const messagesContainer = document.querySelector('.chat-window .messages') as HTMLElement
  const messageElement = document.querySelector(`[data-message-id="${message.id}"]`) as HTMLElement
  
  if (messagesContainer && messageElement) {
    // ✅ ТОЧНАЯ ПРОКРУТКА
    const containerRect = messagesContainer.getBoundingClientRect()
    const messageRect = messageElement.getBoundingClientRect()
    const scrollTop = messagesContainer.scrollTop
    const targetScroll = messageRect.top - containerRect.top + scrollTop - 120
    
    messagesContainer.scrollTo({
      top: targetScroll,
      behavior: 'smooth'
    })
    
    // ✅ ПОДСВЕТКА
    messageElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    messageElement.classList.add('message-highlight')
    
    setTimeout(() => {
      messageElement.classList.remove('message-highlight')
    }, 3000)
    
    console.log('✅ Скролл успешен!')
  } else {
    console.error('❌ НЕ НАЙДЕНЫ:', { messagesContainer, messageElement })
  }
  
  emit('select-message', message)
  closeOverlay()
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
              placeholder="Поиск сообщений..."
              autofocus
              class="search-input"
            />
            <div class="search-info" v-if="messages.length">
              {{ messages.length }} {{ messages.length === 1 ? 'сообщение' : messages.length < 5 ? 'сообщения' : 'сообщений' }}
            </div>
          </div>

          <div v-if="loading" class="loading">
            <i class="fas fa-spinner fa-spin"></i>
            Загрузка сообщений...
          </div>
          
          <div v-else-if="error" class="error">
            <i class="fas fa-exclamation-triangle"></i>
            {{ error }}
            <button @click="loadMessages" class="retry-btn">
              <i class="fas fa-redo"></i> Повторить
            </button>
          </div>

          <div v-else-if="messages.length" class="messages-container">
            <div
              v-for="message in messages"
              :key="message.id"
              @click="selectMessage(message)"
              class="message-item"
              :class="{ selected: highlightedMessageId === message.id }"
            >
              <div class="header">
                <span class="message-from">{{ message.author }}</span>
                <span class="message-time">{{ message.time }}</span>
              </div>
              <div class="preview">
                "{{ message.text.substring(0, 80) }}{{ message.text.length > 80 ? '...' : '' }}"
              </div>
            </div>
          </div>

          <div v-else-if="searchQuery.length >= 2" class="no-results">
            <i class="fas fa-search"></i>
            <div>Сообщения не найдены</div>
            <small>Попробуйте другой запрос</small>
          </div>

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

.message-item.selected {
  background: #fef3c7;
  border-color: #f59e0b;
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