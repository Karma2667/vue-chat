<!-- MessageActions.vue -->
<script setup lang="ts">
import { ref, defineProps, defineEmits } from 'vue'
import ReactionPicker from './ReactionPicker.vue'
import {
  PhSmiley,
  PhArrowBendLeftUp,
  PhPaperPlaneTilt,
  PhPencilSimple,
  PhFlag,
  PhPushPin,
  PhMagnifyingGlass // Добавляем иконку поиска
} from '@phosphor-icons/vue'

const props = defineProps<{
  self?: boolean
  existingReactions?: string[]
}>()

const emit = defineEmits<{
  (e: 'reaction-selected', emoji: string): void
  (e: 'reply'): void
  (e: 'search'): void // Новое событие для поиска
}>()

const showReactions = ref(false)

function togglePicker() {
  showReactions.value = !showReactions.value
}

function selectReaction(emoji: string) {
  emit('reaction-selected', emoji)
  showReactions.value = false
}

function reply() {
  emit('reply')
}

function openSearch() {
  emit('search') // Эмитим событие для открытия поиска
}
</script>

<template>
  <div class="actions" :class="{ self: props.self }">
    <!-- Эмоджи / реакции -->
    <PhSmiley
      size="20"
      weight="regular"
      title="Реакции"
      @click.stop="togglePicker"
    />

    <!-- Поиск -->
    <PhMagnifyingGlass
      size="20"
      weight="regular"
      title="Поиск пользователей"
      @click.stop="openSearch"
    />

    <!-- Ответ -->
    <PhArrowBendLeftUp
      size="21"
      weight="bold"
      class="reply-icon"
      title="Ответить"
      @click="reply"
    />

    <!-- Переслать -->
    <PhPaperPlaneTilt
      size="18"
      weight="regular"
      class="small-icon"
      title="Переслать"
    />

    <!-- Редактировать -->
    <PhPencilSimple
      v-if="props.self"
      size="18"
      weight="regular"
      title="Редактировать"
    />

    <!-- Пожаловаться -->
    <PhFlag
      v-else
      size="18"
      weight="regular"
      class="small-icon"
      title="Пожаловаться"
    />

    <!-- Закрепить -->
    <PhPushPin
      size="18"
      weight="regular"
      title="Закрепить"
    />

    <!-- Reaction Picker -->
    <ReactionPicker
      v-if="showReactions"
      @select="selectReaction"
      :existing-reactions="props.existingReactions"
    />
  </div>
</template>

<style scoped>
.actions {
  display: flex;
  gap: 6px;
  color: #0078ff;
  user-select: none;
  align-items: center;
}

.actions.self {
  color: #fff;
}

.actions svg {
  cursor: pointer;
  transition: transform 0.15s ease, color 0.2s ease;
}

.actions svg:hover {
  transform: scale(1.2);
  color: #0078ff;
}

.small-icon {
  width: 16px;
  height: 16px;
}

.reply-icon {
  width: 20px;
  height: 20px;
}
</style>