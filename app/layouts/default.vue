<template>
  <div>
    <ChatWidget
      v-if="!isAuthRoute"
      :is-open="chat.isOpen.value"
      :current-screen="chat.currentScreen.value"
      :dialogs="chat.dialogs.value"
      :active-chat="chat.activeChat.value"
      :chats="chat.chats.value"
      :search-query="chat.searchQuery.value"
      :search-results="chat.searchResults.value"
      :is-searching="chat.isSearching.value"
      :is-search-mode="chat.isSearchMode.value"
      @open-chat="chat.openChat"
      @go-back="chat.goBack"
      @search="() => {}"
      @send-message="chat.handleSendMessage"
      @preview="chat.handlePreview"
      @delete-message="chat.deleteMessage"
      @search-query="chat.performSearch"
    />
    <slot />
  </div>
</template>

<script setup lang="ts">
import { useChat } from '~/composables/useChat'
import { onMounted } from 'vue'
import { useRoute } from 'vue-router'

const chat = useChat()

const route = useRoute()
const isAuthRoute = computed(() => [
  '/auth', 
  '/test', 
  '/reset-password',
  '/login',
  '/register',
  '/forgot-password'
].includes(route.path))

onMounted(() => {
  chat.loadConversations()
})
</script>

<style scoped>
:deep(.messenger-widget) {
  position: fixed !important;
  inset: 0 !important;
  z-index: 9999 !important;
  pointer-events: none !important;
}

:deep(.messenger-widget *) {
  pointer-events: auto !important;
}

:deep(.chat-panel) {
  position: fixed !important;
  top: 0 !important;
  right: 0 !important;
  height: 100vh !important;
  z-index: 10000 !important;
}

input, button, textarea, [type="text"], [type="email"], [type="password"], [role="button"] {
  user-select: auto !important;
  -webkit-user-select: auto !important;
  -moz-user-select: auto !important;
  -ms-user-select: auto !important;
  pointer-events: auto !important;
  z-index: 10 !important;
}
</style>