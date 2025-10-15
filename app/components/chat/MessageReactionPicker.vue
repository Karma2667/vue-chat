<script setup lang="ts">
import { defineEmits, defineProps } from 'vue'

const props = defineProps<{
  existingReactions?: string[] // Для подсветки уже выбранных
}>()

const emit = defineEmits<{
  (e: 'select', emoji: string): void
}>()

// Синхронизируем с ReactionPicker.vue
const reactions = ['👍', '❤️', '😂', '😮', '😢', '😡', '🎉', '💯']

function selectReaction(emoji: string) {
  emit('select', emoji)
}
</script>

<template>
  <div class="picker">
    <span
      v-for="r in reactions"
      :key="r"
      class="emoji"
      :class="{ selected: props.existingReactions?.includes(r) }"
      @click="selectReaction(r)"
    >
      {{ r }}
    </span>
  </div>
</template>

<style scoped>
.picker {
  display: flex;
  gap: 5px;
}

.emoji {
  font-size: 1.2rem;
  cursor: pointer;
  transition: transform 0.2s;
}

.emoji:hover {
  transform: scale(1.2);
}

.emoji.selected {
  background: #f0f0f0;
  border-radius: 50%;
}
</style>
