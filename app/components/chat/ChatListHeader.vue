<script setup lang="ts">
import { ref, nextTick } from 'vue'

const activeTab = ref('all')

const tabs = [
  { key: 'all', label: 'Все' },
  { key: 'group', label: 'Групповые' },
  { key: 'personal', label: 'Личные' },
  { key: 'tasks', label: 'Задачи чаты' },
  { key: 'pinned', label: 'Закрепленные' },
  { key: 'add', label: '+' },
]

const emit = defineEmits<{
  (e: 'tab-change', key: string): void
  (e: 'search'): void
  (e: 'new-group-chat'): void
  (e: 'settings'): void
  (e: 'selected'): void
}>()

const tabsContainer = ref<HTMLDivElement | null>(null)
const tabRefs: (HTMLButtonElement | null)[] = []

function selectTab(tabKey: string, index: number) {
  if (tabKey === 'add') {
    emit('new-group-chat') // Emit event for "+" button
    return
  }
  activeTab.value = tabKey
  emit('tab-change', tabKey)

  nextTick(() => {
    const container = tabsContainer.value
    const tabEl = tabRefs[index]
    const nextTabEl = tabRefs[index + 1] // Reference to the next tab, if it exists
    if (!container || !tabEl) return

    const tabLeft = tabEl.offsetLeft
    const tabRight = tabLeft + tabEl.offsetWidth
    const containerLeft = container.scrollLeft
    const containerRight = container.scrollLeft + container.clientWidth

    // Calculate the right edge to include the next tab (if available)
    let targetRight = tabRight
    if (nextTabEl && index < tabs.length - 1) {
      targetRight = nextTabEl.offsetLeft + nextTabEl.offsetWidth
    }

    // Smooth auto-scroll to ensure the selected tab and the next tab (if exists) are in view
    if (tabLeft < containerLeft) {
      container.scrollTo({ left: tabLeft - 8, behavior: 'smooth' })
    } else if (targetRight > containerRight) {
      container.scrollTo({ left: targetRight - container.clientWidth + 8, behavior: 'smooth' })
    }
  })
}
</script>

<template>
  <div class="chatlist-header">
    <!-- Верхняя часть -->
    <div class="top-row">
      <h2>Чаты</h2>
      <div class="icons">
        <i class="fas fa-search" @click="emit('search')"></i>
        <i class="fa-solid fa-user-group" @click="emit('new-group-chat')"></i>
        <i class="fa-solid fa-circle-check" @click="emit('selected')"></i>
        <i class="fas fa-cog" @click="emit('settings')"></i>
      </div>
    </div>

    <!-- Вкладки -->
    <div class="tabs-container">
      <div class="tabs" ref="tabsContainer">
        <button
          v-for="(tab, index) in tabs"
          :key="tab.key"
          :ref="el => { tabRefs[index] = el as HTMLButtonElement | null }"
          :class="{ active: activeTab === tab.key, 'add-tab': tab.key === 'add' }"
          @click="selectTab(tab.key, index)"
        >
          <i v-if="tab.key === 'add'" class="fas fa-plus"></i>
          <span v-else>{{ tab.label }}</span>
        </button>
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
  overflow: hidden; /* Prevent unwanted scrollbars */
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
  scrollbar-width: none; /* Hide scrollbar for Firefox */
  padding-right: 40px; /* Space for the add-tab button */
}

.tabs::-webkit-scrollbar {
  display: none; /* Hide scrollbar for Chrome, Safari */
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

.add-tab {
  flex: 0 0 auto;
  color: var(--tx-second, #666);
  font-size: 0.9rem;
  position: sticky;
  right: 0;
  background: var(--bg-first, #fff); /* Ensure visibility over scrolled content */
  z-index: 1; /* Keep button above other tabs */
}

.add-tab:hover {
  color: var(--tx-first, #0078ff);
}
</style>
