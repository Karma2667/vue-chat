<template>
  <div>
    <ChatPanel
      v-if="!isAuthRoute"
      :is-open="isChatOpen"
      current-screen="dialogs"
      :dialogs="dialogs"
      :active-chat="activeChat"
      :chats="chats"
      @on-go-back="handleGoBack"
      @on-open-chat="handleOpenChat"
    />
    <slot />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import ChatPanel from '~/components/chat/ChatPanel.vue'

const route = useRoute()
const isAuthRoute = computed(() => ['/auth', '/test', '/reset-password'].includes(route.path))

// Заглушки для чата (замените на реальные данные, если есть)
const isChatOpen = ref(true)
const dialogs = ref<any[]>([])
const activeChat = ref<any>(null)
const chats = ref<Record<number, any[]>>({})

function handleGoBack() {
  console.log('Go back triggered')
}

function handleOpenChat(dialog: any) {
  console.log('Open chat:', dialog)
  activeChat.value = dialog
}
</script>

<style scoped>
input, button, textarea, [type="text"], [type="email"], [type="password"], [role="button"] {
  user-select: auto !important;
  -webkit-user-select: auto !important;
  -moz-user-select: auto !important;
  -ms-user-select: auto !important;
  pointer-events: auto !important;
  z-index: 10 !important;
}
</style>