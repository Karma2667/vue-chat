<template>
  <NuxtPage />
  <MessengerWidget v-if="!isAuthRoute" />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import MessengerWidget from './components/chat/ChatWidget.vue'

const route = useRoute()
const isAuthRoute = computed(() => ['/auth', '/test', '/reset-password'].includes(route.path))
</script>

<style scoped>
/* Исключения для форм */
input, button, textarea, [type="text"], [type="email"], [type="password"], [role="button"] {
  user-select: auto !important;
  -webkit-user-select: auto !important;
  -moz-user-select: auto !important;
  -ms-user-select: auto !important;
  pointer-events: auto !important;
  z-index: 10 !important;
}
</style>