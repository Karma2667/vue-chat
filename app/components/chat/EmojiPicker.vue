<script setup lang="ts">
import { defineEmits } from 'vue'

const emit = defineEmits<{ (e: 'select', emoji: string): void }>()

const emojis = [
  '😀','😁','😂','🤣','😃','😅','😊','😎','😍','😘','🥰','😜',
  '🤔','😏','😢','😭','😡','🤬','👍','👎','🙏','👏','🔥','💯',
  '🎉','❤️','💔','✨','🌟','😇','😴','🤯','🤡','👀','💀'
]

function selectEmoji(emoji: string) {
  emit('select', emoji)
}
</script>

<template>
  <div class="emoji-popup">
    <div class="emoji-grid">
      <button
        v-for="(emoji, index) in emojis"
        :key="index"
        class="emoji-btn"
        @click="selectEmoji(emoji)"
      >
        {{ emoji }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.emoji-popup {
  position: absolute;
  bottom: 60px;
  right: 10px;
  z-index: 100;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  padding: 8px;
  width: 280px;
  max-height: 240px;
  overflow-y: auto;
}

.emoji-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, 28px);
  gap: 6px;
  justify-content: space-between;
}

.emoji-btn {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 20px;
  line-height: 1;
  transition: transform 0.1s ease;
}

.emoji-btn:hover {
  transform: scale(1.25);
}
</style>
