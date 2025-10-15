<script setup lang="ts">
import { defineEmits, defineProps } from 'vue'

const props = defineProps<{
  existingReactions?: string[] // Опционально: уже добавленные реакции для подсветки
}>()

const emit = defineEmits<{
  (e: 'select', emoji: string): void
}>()

// Список возможных реакций
const reactions = [
  '👍', '❤️', '😂', '😮', '😢', '😡', '🎉', '💯'
]

function selectReaction(emoji: string) {
  emit('select', emoji)
}
</script>

<template>
  <div class="reaction-picker">
    <span
      v-for="r in reactions"
      :key="r"
      class="reaction"
      :class="{ selected: props.existingReactions?.includes(r) }"
      @click="selectReaction(r)"
    >
      {{ r }}
    </span>
  </div>
</template>

<style scoped>
.reaction-picker {
  display: flex;
  gap: 6px;
  background: #fff;
  padding: 0.4rem 0.6rem;
  border-radius: 20px;
  box-shadow: 0 2px 6px rgba(0,0,0,0.12);
  position: absolute;
  top: -45px; /* будет выше имени автора */
  right: 0;
  z-index: 50;
}

.reaction {
  font-size: 1.3rem;
  cursor: pointer;
  transition: transform 0.15s ease;
}

.reaction:hover {
  transform: scale(1.4);
}

.reaction.selected {
  background: #f0f0f0;
  border-radius: 50%;
  cursor: default; /* Чтобы не кликался, если уже добавлен */
}
</style>
