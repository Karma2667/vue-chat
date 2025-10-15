<script setup lang="ts">
import { defineEmits } from 'vue'
const emit = defineEmits<{ (e: 'close'): void }>()
</script>

<template>
  <transition name="backdrop-fade">
    <div class="backdrop" @click="emit('close')"></div>
  </transition>
</template>

<style scoped>
.backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.35);
  backdrop-filter: blur(2px);
  opacity: 0;
  pointer-events: none;
  z-index: 999;
}

.messenger-widget.is-open .backdrop {
  opacity: 1;
  pointer-events: auto; /* Изменено на auto */
}

.backdrop * {
  user-select: auto !important;
  pointer-events: auto !important;
  z-index: 1000 !important;
}

.backdrop-fade-enter-active,
.backdrop-fade-leave-active {
  transition: opacity 0.4s ease;
}
.backdrop-fade-enter-from,
.backdrop-fade-leave-to {
  opacity: 0;
}
.backdrop-fade-enter-to,
.backdrop-fade-leave-from {
  opacity: 1;
}
</style>