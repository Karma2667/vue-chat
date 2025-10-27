<script setup lang="ts">
import { defineProps, defineEmits, ref } from 'vue';
import {
  PhArrowBendLeftUp,
  PhPaperPlaneTilt,
  PhPencilSimple,
  PhTrashSimple,
} from '@phosphor-icons/vue';

const props = defineProps<{
  self?: boolean;
  existingReactions?: string[];
}>();

const emit = defineEmits<{
  (e: 'reaction-selected', emoji: string): void;
  (e: 'reply'): void;
  (e: 'forward'): void; 
  (e: 'delete'): void;
  (e: 'edit'): void;
}>();

const showReactions = ref(false);

function togglePicker() {
  showReactions.value = !showReactions.value;
}

function selectReaction(emoji: string) {
  emit('reaction-selected', emoji);
  showReactions.value = false;
}

function reply() {
  emit('reply');
}

function forward() {
  emit('forward'); 
}

function deleteMessage() {
  emit('delete');
}

function editMessage() {
  emit('edit');
}
</script>

<template>
  <div class="actions" :class="{ self: props.self }">

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
      @click="forward"
    />

    <!-- Удаление (только для своих сообщений) -->
    <PhTrashSimple
      v-if="props.self"
      size="18"
      weight="regular"
      class="small-icon delete-icon"
      title="Удалить"
      @click="deleteMessage"
    />

    <!-- Редактировать -->
    <PhPencilSimple
      v-if="props.self"
      size="18"
      weight="regular"
      title="Редактировать"
      @click="editMessage"
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

.delete-icon:hover {
  color: #ff4444 !important; /* Красный для удаления */
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