<script setup lang="ts">
import { defineProps, ref } from 'vue'
import MessageText from './MessageText.vue'
import AttachmentMessage from './AttachmentMessage.vue'

const props = defineProps<{
  id: number
  text: string
  time: string
  author?: string
  self?: boolean
  attachments?: {
    type: 'image' | 'video' | 'file'
    url: string
    name?: string
    size?: string
  }[]
  reply?: { author?: string; text: string } | null
}>()

const showReactions = ref(false)
const reactions = ref<string[]>([])

function onReactionSelected(emoji: string) {
  const index = reactions.value.indexOf(emoji)
  if (index !== -1) {
    // Удаляем реакцию
    reactions.value.splice(index, 1)
  } else {
    // Ограничиваем до одной реакции
    reactions.value = [emoji]
  }
  showReactions.value = reactions.value.length > 0
  console.log('Reactions:', reactions.value) // Для отладки
}
</script>

<template>
  <div :class="['message-item', { self: props.self }]">
    <!-- Основной текст + reply -->
    <MessageText
      :text="props.text"
      :time="props.time"
      :author="props.author"
      :self="props.self"
      :reactions="reactions"
      :reply="props.reply"
      @reaction-selected="onReactionSelected"
    />

    <!-- Вложения -->
    <div v-if="props.attachments?.length" class="attachments">
      <AttachmentMessage
        v-for="(a, i) in props.attachments"
        :key="a.url || i"
        :attachment="a"
      />
    </div>
  </div>
</template>

<style scoped>
.message-item {
  position: relative;
  width: 85%;
  padding: 0.6rem 0.8rem;
  border-radius: 12px;
  background: #fff;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  margin-bottom: 0.4rem;
  display: flex;
  flex-direction: column;
  overflow: visible;
}

.message-item.self {
  background: #0078ff;
  color: #fff;
  align-self: flex-end;
}

.attachments {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 0.4rem;
}
</style>
