<script setup lang="ts">
import { ref, nextTick } from 'vue'
import UserSearch from './UserSearch.vue'

const activeTab = ref('all')
const showGroupModal = ref(false)
const groupName = ref('')
const selectedUsers = ref<{ id: number; username: string }[]>([])
const step = ref<'name' | 'users'>('name')
const showUserSearch = ref(false) // ← Показывать UserSearch только после клика на кнопку

const tabs = [
  { key: 'all', label: 'Все' },
  { key: 'group', label: 'Групповые' },
  { key: 'personal', label: 'Личные' },
]

const emit = defineEmits<{
  (e: 'tab-change', key: string): void
  (e: 'user-search'): void
  (e: 'create-group-chat', name: string, userIds: number[]): void
}>()

const tabsContainer = ref<HTMLDivElement | null>(null)
const tabRefs: (HTMLButtonElement | null)[] = []

function selectTab(tabKey: string, index: number) {
  activeTab.value = tabKey
  emit('tab-change', tabKey)

  nextTick(() => {
    const container = tabsContainer.value
    const tabEl = tabRefs[index]
    if (!container || !tabEl) return

    const tabLeft = tabEl.offsetLeft
    const tabRight = tabLeft + tabEl.offsetWidth
    const containerLeft = container.scrollLeft
    const containerRight = container.scrollLeft + container.clientWidth

    if (tabLeft < containerLeft) {
      container.scrollTo({ left: tabLeft - 8, behavior: 'smooth' })
    } else if (tabRight > containerRight) {
      container.scrollTo({ left: tabRight - container.clientWidth + 8, behavior: 'smooth' })
    }
  })
}

function openGroupModal() {
  showGroupModal.value = true
  groupName.value = ''
  selectedUsers.value = []
  step.value = 'name'
  showUserSearch.value = false
}

function closeGroupModal() {
  showGroupModal.value = false
  step.value = 'name'
  showUserSearch.value = false
}

function goToUsersStep() {
  if (!groupName.value.trim()) {
    alert('Введите название группы')
    return
  }
  step.value = 'users'
}

function openUserSearch() {
  showUserSearch.value = true
}

function closeUserSearch() {
  showUserSearch.value = false
}

function handleUserSelect(user: { id: number; username: string }) {
  if (!selectedUsers.value.some(u => u.id === user.id)) {
    selectedUsers.value.push(user)
  }
  // Не закрываем — можно добавлять ещё
}

function removeUser(userId: number) {
  selectedUsers.value = selectedUsers.value.filter(u => u.id !== userId)
}

function createGroupChat() {
  if (selectedUsers.value.length < 2) {
    alert('Выберите минимум 2 участников')
    return
  }

  const userIds = selectedUsers.value.map(u => u.id)
  emit('create-group-chat', groupName.value.trim(), userIds)
  closeGroupModal()
}
</script>

<template>
  <div class="chatlist-header">
    <!-- Верхняя часть -->
    <div class="top-row">
      <h2>Чаты</h2>
      <div class="icons">
        <i class="fas fa-search" @click="emit('user-search')"></i>
        <i class="fa-solid fa-user-group" @click="openGroupModal"></i>
      </div>
    </div>

    <!-- Вкладки -->
    <div class="tabs-container">
      <div class="tabs" ref="tabsContainer">
        <button
          v-for="(tab, index) in tabs"
          :key="tab.key"
          :ref="el => { tabRefs[index] = el as HTMLButtonElement | null }"
          :class="{ active: activeTab === tab.key }"
          @click="selectTab(tab.key, index)"
        >
          <span>{{ tab.label }}</span>
        </button>
      </div>
    </div>

    <!-- МОДАЛКА СОЗДАНИЯ ГРУППЫ -->
    <div v-if="showGroupModal" class="group-modal-overlay" @click="closeGroupModal">
      <div class="group-modal" @click.stop>
        <div class="modal-header">
          <h3>{{ step === 'name' ? 'Название группы' : 'Добавить участников' }}</h3>
          <button @click="closeGroupModal" class="close-btn">×</button>
        </div>

        <div class="modal-body">
          <!-- ШАГ 1: НАЗВАНИЕ -->
          <div v-if="step === 'name'" class="name-step">
            <input
              v-model="groupName"
              placeholder="Введите название группы"
              class="group-name-input"
              @keyup.enter="goToUsersStep"
            />
            <p class="hint">Минимум 1 символ, максимум 50</p>
          </div>

          <!-- ШАГ 2: УЧАСТНИКИ -->
          <div v-else class="users-step">
            <!-- КНОПКА "Добавить участника" -->
            <button @click="openUserSearch" class="add-participant-btn">
              <i class="fas fa-plus"></i> Добавить участника
            </button>

            <!-- ВЫБРАННЫЕ УЧАСТНИКИ -->
            <div class="selected-users" v-if="selectedUsers.length">
              <div v-for="user in selectedUsers" :key="user.id" class="user-tag">
                {{ user.username }}
                <button @click="removeUser(user.id)" class="remove-btn">×</button>
              </div>
            </div>

            <!-- ПОДСКАЗКА -->
            <div v-else class="no-users-hint">
              Нажмите "Добавить участника", чтобы выбрать пользователей
            </div>

            <!-- СЧЁТЧИК -->
            <div class="participants-count">
              {{ selectedUsers.length }} участник(ов) выбрано
              <span v-if="selectedUsers.length < 2" class="warning">
                — нужно минимум 2
              </span>
            </div>
          </div>
        </div>

        <!-- ФУТЕР -->
        <div class="modal-footer">
          <button @click="closeGroupModal" class="btn-cancel">Отмена</button>

          <!-- ДАЛЕЕ -->
          <button
            v-if="step === 'name'"
            @click="goToUsersStep"
            class="btn-next"
            :disabled="!groupName.trim()"
          >
            Далее
          </button>

          <!-- СОЗДАТЬ -->
          <button
            v-else
            @click="createGroupChat"
            class="btn-create"
            :disabled="selectedUsers.length < 2"
          >
            Создать
          </button>
        </div>
      </div>
    </div>

    <!-- ОТДЕЛЬНАЯ МОДАЛКА ПОИСКА УЧАСТНИКОВ -->
    <div v-if="showUserSearch" class="user-search-overlay" @click="closeUserSearch">
      <div class="user-search-modal" @click.stop>
        <div class="search-header">
          <h3>Выберите участников</h3>
          <button @click="closeUserSearch" class="close-btn">×</button>
        </div>
        <UserSearch
          :visible="true"
          @select-user="handleUserSelect"
          @close="closeUserSearch"
          class="embedded-search"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.chatlist-header {
  background: var(--bg-first, #fff);
  border-bottom: 1px solid rgba(0,0,0,0.05);
  display: flex;
  flex-direction: column;
  padding: 0.5rem 1rem;
  user-select: none;
}

.top-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.top-row h2 {
  font-size: 0.9rem;
  font-weight: 600;
  margin: 0;
}

.icons {
  display: flex;
  gap: 0.85rem;
}

.icons i {
  cursor: pointer;
  color: var(--tx-second, #666);
  transition: color 0.2s ease;
}

.icons i:hover {
  color: var(--tx-first, #000);
}

/* Tabs */
.tabs-container {
  position: relative;
  overflow: hidden;
}

.tabs {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-top: 0.4rem;
  border-bottom: 3px solid rgba(0,0,0,0.05);
  padding-bottom: 0.2rem;
  overflow-x: auto;
  white-space: nowrap;
  -webkit-overflow-scrolling: touch;
  scroll-behavior: smooth;
  scrollbar-width: none;
  padding-right: 40px;
}

.tabs::-webkit-scrollbar {
  display: none;
}

.tabs button {
  flex: 0 0 auto;
  background: none;
  border: none;
  cursor: pointer;
  color: var(--tx-second, #666);
  font-size: 0.8rem;
  padding: 0.3rem 0.5rem;
  position: relative;
}

.tabs button.active {
  color: var(--tx-first, #0078ff);
  font-weight: 500;
}

.tabs button.active::after {
  content: '';
  position: absolute;
  bottom: -2px;
  left: 0;
  width: 100%;
  height: 2px;
  background: var(--tx-first, #0078ff);
  border-radius: 2px;
}

/* Модалка группы */
.group-modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10005;
}

.group-modal {
  background: white;
  border-radius: 12px;
  width: 90%;
  max-width: 420px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  max-height: 90vh;
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
  padding: 0.8rem 1.2rem;
  flex: 1;
  overflow-y: auto;
  min-height: 120px;
}

/* Шаг 1 */
.name-step {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.group-name-input {
  width: 100%;
  padding: 0.5rem 0.7rem;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 0.85rem;
  height: 36px;
  box-sizing: border-box;
}

.hint {
  color: #888;
  font-size: 0.75rem;
  margin: 0;
}

/* Шаг 2 */
.users-step {
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
}

.add-participant-btn {
  background: #0078ff;
  color: white;
  border: none;
  border-radius: 8px;
  padding: 0.6rem 1rem;
  font-size: 0.9rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  width: 100%;
}

.add-participant-btn i {
  font-size: 0.9rem;
}

.selected-users {
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

.no-users-hint {
  color: #999;
  font-size: 0.85rem;
  text-align: center;
  margin: 1rem 0;
}

.participants-count {
  color: #666;
  font-size: 0.8rem;
  text-align: center;
}

.warning {
  color: #d32f2f;
  font-weight: 500;
}

/* Модалка поиска участников */
.user-search-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10006;
}

.user-search-modal {
  background: white;
  border-radius: 12px;
  width: 90%;
  max-width: 420px;
  max-height: 80vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.search-header {
  padding: 1rem 1.2rem;
  border-bottom: 1px solid #eee;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.search-header h3 {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
}

.embedded-search {
  flex: 1;
  min-height: 300px;
}

.modal-footer {
  padding: 0.7rem 1.2rem;
  border-top: 1px solid #eee;
  display: flex;
  justify-content: flex-end;
  gap: 0.6rem;
  flex-shrink: 0;
}

.btn-cancel, .btn-next, .btn-create {
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

.btn-next, .btn-create {
  background: #0078ff;
  color: white;
}

.btn-next:disabled,
.btn-create:disabled {
  background: #cccccc;
  cursor: not-allowed;
}
</style>