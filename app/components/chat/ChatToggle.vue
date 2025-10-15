<script setup lang="ts">
import { defineProps, defineEmits } from 'vue'

const props = defineProps<{ isOpen: boolean }>()
const emit = defineEmits<{ (e: 'toggle'): void }>()

function handleClick() {
  emit('toggle')
}
</script>

<template>
  <button class="chat-toggle" :class="{ open: isOpen }" @click="handleClick">
    <i class="far fa-comments"></i>
  </button>
</template>

<style scoped>
.chat-toggle {
  position: fixed;
  top: 50%;
  right: 0;
  transform: translateY(-50%);
  width: 64px;
  height: 64px;
  border-radius: 16px 0 0 16px;
  background: linear-gradient(145deg, #ffffff, #e6e6e6);
  color: var(--tx-first, #222);
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1001;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
  transition:
    transform 0.3s ease,
    background 0.3s ease,
    box-shadow 0.3s ease,
    scale 0.2s ease;
}

.chat-toggle i {
  font-size: 26px;
}

.chat-toggle:hover {
  background: linear-gradient(145deg, #f0f0f0, #dcdcdc);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.35);
  scale: 1.05;
}

.chat-toggle::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background: rgba(0, 150, 255, 0.15);
  opacity: 0;
  transform: scale(0.9);
  transition: opacity 0.3s, transform 0.3s;
}

.chat-toggle:hover::after {
  opacity: 1;
  transform: scale(1);
}

.chat-toggle.open {
  transform: translateY(-50%) translateX(-400px);
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.15);
  background: linear-gradient(145deg, #e0e0e0, #ffffff);
}
</style>
