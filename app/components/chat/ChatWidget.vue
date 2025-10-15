<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import ChatToggle from './ChatToggle.vue'
import Backdrop from './Backdrop.vue'
import ChatPanel from './ChatPanel.vue'

const isOpen = ref(false)
const currentScreen = ref<'dialogs' | 'chat'>('dialogs')
const activeChat = ref<any>(null)
const inited = ref(false)

const dialogs = ref([
  { id: 1, from: 'Администрация' },
  { id: 2, from: 'Макс' }
])

const chats = ref<Record<number, any[]>>({
  1: [
    { id: 1, text: 'Привет! Это Администрация.', self: false, time: '10:25', author: 'Администрация' },
    { id: 2, text: 'Вы: Спасибо, получил.', self: true, time: '10:27', author: 'Вы' }
  ],
  2: [
    { id: 1, text: 'Привет, как дела?', self: false, time: '21:46', author: 'Макс' },
    { id: 2, text: 'Все отлично, а у тебя?', self: true, time: '21:47', author: 'Вы' },
    { id: 3, text: 'Тоже нормально!', self: false, time: '21:48', author: 'Макс' }
  ]
})

onMounted(() => requestAnimationFrame(() => (inited.value = true)))

function toggleWidget() {
  isOpen.value = !isOpen.value
  console.log('Widget toggled:', isOpen.value)
}

function openChat(dialog: any) {
  activeChat.value = dialog
  currentScreen.value = 'chat'
  console.log('Chat opened:', dialog)
}

function goBack() {
  currentScreen.value = 'dialogs'
  console.log('Go back to dialogs')
}

const widgetClasses = computed(() => ({
  'is-open': isOpen.value,
  'panel-inited': inited.value
}))
</script>

<template>
  <div class="messenger-widget" :class="widgetClasses">
    <transition name="toggle-fade">
      <ChatToggle
        v-if="!isOpen"
        :is-open="isOpen"
        class="chat-toggle"
        @toggle="toggleWidget"
      />
    </transition>

    <Backdrop v-if="isOpen" @close="toggleWidget" />

    <transition name="panel-slide">
      <ChatPanel
        v-if="isOpen"
        :is-open="isOpen"
        :current-screen="currentScreen"
        :dialogs="dialogs"
        :active-chat="activeChat"
        :chats="chats"
        @open-chat="openChat"
        @go-back="goBack"
      />
    </transition>
  </div>
</template>

<style scoped>
.messenger-widget {
  position: fixed;
  inset: 0;
  width:400px;
    right: 0; 
  left: auto; 
  z-index: 1000;
}

.messenger-widget > * {
  user-select: auto !important;
  pointer-events: auto !important;
}

.backdrop {
  z-index: 999;
}

.chat-panel {
  z-index: 1000;
}

.chat-toggle {
  z-index: 1001;
  position: fixed;
  bottom: 24px;
  right: 24px;
}

.toggle-fade-enter-active,
.toggle-fade-leave-active {
  transition: all 0.3s ease;
}
.toggle-fade-enter-from,
.toggle-fade-leave-to {
  opacity: 0;
  transform: scale(0.9);
}
.toggle-fade-enter-to,
.toggle-fade-leave-from {
  opacity: 1;
  transform: scale(1);
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