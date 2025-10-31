<!-- src/components/EmojiPicker.vue -->
<script setup lang="ts">
import { ref, computed } from 'vue'

const emit = defineEmits<{
  (e: 'select', emoji: string): void
}>()

const searchQuery = ref('')
const showPicker = ref(true)

const allEmojis = [
  'grinning','smiley','smile','grin','laughing','sweat_smile','joy','rofl','relaxed','blush','heart_eyes','kissing_heart','kissing','innocent',
  'wink','yum','stuck_out_tongue','stuck_out_tongue_winking_eye','zany_face','raised_eyebrow','monocle','thinking','nerd','sunglasses',
  'confused','frowning','anguish','fearful','cold_sweat','scream','flushed','disappointed','sweat','hugs','cry','sob','rage','angry',
  'triumph','mask','sleepy','zzz','poop','ghost','alien','robot','clap','pray','ok_hand','+1','-1','fist','punch','wave','raised_hands',
  'muscle','point_up','point_down','point_left','point_right','v','middle_finger','hand','open_hands','eyes','fire','100','sparkles',
  'star','heart','broken_heart','yellow_heart','green_heart','blue_heart','purple_heart','gift_heart','revolving_hearts','cupid',
  'boom','dizzy','sweat_drops','dash','speech_balloon','thought_balloon','anger','zzz','wave','ok','no_entry','100','muscle','fire'
]

const filteredEmojis = computed(() => {
  if (!searchQuery.value.trim()) return allEmojis
  const q = searchQuery.value.toLowerCase()
  return allEmojis.filter(name => name.toLowerCase().includes(q))
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
        v-for="name in filteredEmojis"
        :key="name"
        :title="name"
        class="emoji-btn"
        @click="selectEmoji(name)"
      >
        {{ name }}
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
  position: absolute;
  bottom: 100%;
  left: 0;
  right: 0;
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 16px 16px 0 0;
  box-shadow: 0 -12px 32px rgba(0, 0, 0, 0.15);
  max-height: 320px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  z-index: 10000;
  margin-bottom: 8px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
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
  transition: all 0.2s ease;
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
  padding: 4px;
  border-radius: 8px;
  transition: all 0.15s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.emoji-btn:hover {
  background: #f1f5f9;
  transform: scale(1.2);
}

.no-results {
  padding: 16px;
  text-align: center;
  color: #64748b;
  font-size: 0.875rem;
}
</style>