<script setup lang="ts">
import { ref, computed } from 'vue'

const emit = defineEmits<{
  (e: 'select', emoji: string): void
}>()

const searchQuery = ref('')

// ЭМОДЗИ — теперь настоящие символы, не текст
const emojis = [
  '😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '☺️', '😊',
  '😍', '😘', '😗', '😇', '😉', '😋', '😛', '😜', '🤪', '🤔', '🤓', '😎',
  '👏', '🙏', '👌', '👍', '👎', '✊', '👋', '🙌', '💪', '☝️', '👇', '👈', '👉', '✌️', '🖕',
  '✋', '👐', '👀', '🔥', '💯', '✨', '⭐', '❤️', '💔', '💛', '💚', '💙', '💜',
  '💖', '💞', '💘', '💥', '💫', '💦', '💨', '💬', '💭', '💢', '💤', '💩', '👻', '👽', '🤖'
]

// Связь между эмодзи и ключевыми словами для поиска
const emojiKeywords: Record<string, string[]> = {
  '😀': ['улыбка', 'смех', 'весело'],
  '😍': ['любовь', 'сердце', 'глаза'],
  '💩': ['какашка', 'говно', 'смешно'],
  '🔥': ['огонь', 'жарко'],
  '👍': ['лайк', 'да', 'хорошо'],
  '👎': ['дизлайк', 'нет'],
  '😂': ['слёзы', 'смех'],
  '🤣': ['ржать', 'кататься'],
  '👏': ['аплодисменты', 'браво'],
  '🙏': ['молитва', 'прошу'],
  '💪': ['сила', 'мышцы'],
  '✨': ['блеск', 'звёзды'],
  '⭐': ['звезда', 'избранное'],
  '💥': ['взрыв', 'бум'],
  '💤': ['спать', 'сон'],
}

const filteredEmojis = computed(() => {
  if (!searchQuery.value.trim()) return emojis
  const q = searchQuery.value.toLowerCase()
  return emojis.filter(e =>
    (emojiKeywords[e] || []).some(k => k.includes(q))
  )
})

function selectEmoji(emoji: string) {
  emit('select', emoji)
  searchQuery.value = ''
}
</script>

<template>
  <div class="emoji-picker" @click.stop>
    <!-- Поиск -->
    <div class="search-bar">
      <input
        v-model="searchQuery"
        type="text"
        placeholder="Поиск..."
        class="search-input"
        @click.stop
      />
    </div>

    <!-- Эмодзи -->
    <div class="emoji-grid">
      <button
        v-for="emoji in filteredEmojis"
        :key="emoji"
        class="emoji-btn"
        @click.stop.prevent="selectEmoji(emoji)"
        type="button"
      >
        {{ emoji }}
      </button>
    </div>

    <!-- Пусто -->
    <div v-if="filteredEmojis.length === 0" class="no-results">
      Ничего не найдено
    </div>
  </div>
</template>

<style scoped>
.emoji-picker {
  position: relative;
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.15);
  max-height: 320px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  pointer-events: auto;
}

.search-bar {
  padding: 8px 12px;
  border-bottom: 1px solid #f1f5f9;
}

.search-input {
  width: 100%;
  padding: 6px 10px;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  font-size: 0.875rem;
  outline: none;
}

.search-input:focus {
  border-color: #0078ff;
  box-shadow: 0 0 0 3px rgba(0, 120, 255, 0.1);
}

.emoji-grid {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(36px, 1fr));
  gap: 4px;
  justify-items: center;
}

.emoji-btn {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  padding: 6px;
  border-radius: 12px;
  transition: all 0.15s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
}

.emoji-btn:hover {
  background: #f1f5f9;
  transform: scale(1.25);
}

.no-results {
  padding: 16px;
  text-align: center;
  color: #64748b;
  font-size: 0.875rem;
}
</style>
