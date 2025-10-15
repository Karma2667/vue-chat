<script setup lang="ts">
import { ref } from 'vue'

const props = defineProps<{
  title: string
  isChat?: boolean
}>()

const emit = defineEmits<{
  (e: 'toggle-menu'): void
  (e: 'edit'): void
  (e: 'go-back'): void
  (e: 'profile'): void
  (e: 'block'): void
  (e: 'report'): void
}>()

const isMenuOpen = ref(false)
function toggleMenu() {
  isMenuOpen.value = !isMenuOpen.value
}
</script>

<template>
  <div class="chat-header">
    <!-- Левая кнопка -->
    <button class="header-left" @click="isChat ? emit('go-back') : emit('toggle-menu')">
      {{ isChat ? '←' : '☰' }}
    </button>

    <!-- Центр -->
    <div class="header-center">{{ props.title }}</div>

    <!-- Правая кнопка -->
    <div class="header-right" v-if="isChat">
      <button @click="toggleMenu">⋮</button>
      <transition name="fade">
        <div class="context-menu" v-show="isMenuOpen">
          <button @click="emit('profile')"><i class="fas fa-user"></i> Профиль</button>
          <button @click="emit('block')"><i class="fas fa-ban"></i> Заблокировать</button>
          <button @click="emit('report')"><i class="fas fa-flag"></i> Пожаловаться</button>
        </div>
      </transition>
    </div>

    <!-- Меню-бекдроп -->
    <div class="menu-backdrop" v-if="isMenuOpen" @click="isMenuOpen=false"></div>
  </div>
</template>

<style scoped>
.chat-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: var(--header-height, 3.55rem);
  padding: 0 0.5rem;
  background: var(--bg-first, #fff);
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
  box-shadow: 0 -2px 6px rgba(0, 0, 0, 0.04);
  position: relative;
  z-index: 1001;
}

.header-left {
  background: none;
  border: none;
  font-size: 1.2rem;
  cursor: pointer;
}

.header-center {
  font-weight: 500;
  text-align: center;
  flex-grow: 1;
}

.header-right {
  position: relative;
}

.header-right button {
  background: none;
  border: none;
  font-size: 1.2rem;
  cursor: pointer;
  font-weight: bold;
  margin-right: 5px; /* Сдвигаем на 5px */
}

/* Контекстное меню */
.context-menu {
  position: absolute;
  top: 2.5rem;
  right: 0;
  background: var(--bg-first, #fff);
  border-radius: var(--border-radius, 6px);
  box-shadow: var(--shadow-light, 0 3px 8px rgba(0,0,0,0.2));
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-width: 160px;
}

.context-menu button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: none;
  border: none;
  text-align: left;
  cursor: pointer;
  font-size: 0.9rem;
}

.context-menu button:hover {
  background: var(--bg-accent, #e6f0ff);
}

.menu-backdrop {
  position: fixed;
  inset: 0;
  z-index: 1000;
}

/* Анимация */
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
.fade-enter-to, .fade-leave-from { opacity: 1; }
</style>
