<script setup lang="ts">
import { defineProps, ref, computed, nextTick } from 'vue'
import MessageItem from './MessageItem.vue'
import MessageInput from './MessageInput.vue'

const props = defineProps<{
  activeChat: any
  chats: Record<number, any[]>
}>()

const messagesContainer = ref<HTMLDivElement | null>(null)
const replyingTo = ref<number | null>(null)

const messages = computed(() => {
  if (!props.activeChat) return []
  return props.chats[props.activeChat.id] || []
})

function setReply(id: number) {
  console.log('Setting reply to ID:', id)
  replyingTo.value = id
}

function sendMessage(text: string, attachments?: File[]) {
  if (!props.activeChat || (!text.trim() && (!attachments || attachments.length === 0))) return

  const id = props.activeChat.id
  if (!props.chats[id]) props.chats[id] = []

  const replyMsg = replyingTo.value
    ? props.chats[id].find(m => m.id === replyingTo.value)
    : null
  console.log('Reply message:', replyMsg)

  const mappedAttachments = attachments?.map(file => ({
    type: file.type.startsWith('image/')
      ? 'image'
      : file.type.startsWith('video/')
      ? 'video'
      : 'file',
    url: URL.createObjectURL(file),
    name: file.name,
    size: `${(file.size / 1024).toFixed(1)} KB`
  })) || []

  const msg = {
    id: Date.now(),
    text,
    attachments: mappedAttachments,
    self: true,
    author: 'Вы', // Добавляем поле author
    time: new Date().toLocaleTimeString().slice(0, 5),
    reply: replyMsg
      ? { author: replyMsg.author, text: replyMsg.text }
      : undefined
  }
  console.log('New message:', msg)

  props.chats[id].push(msg)
  replyingTo.value = null

  nextTick(() => {
    messagesContainer.value?.scrollTo({
      top: messagesContainer.value.scrollHeight,
      behavior: 'smooth'
    })
  })
}
</script>

<template>
  <div class="chat-window">
    <div class="messages" ref="messagesContainer">
      <MessageItem
        v-for="msg in messages"
        :key="msg.id"
        :id="msg.id"
        :text="msg.text"
        :time="msg.time"
        :self="msg.self"
        :author="msg.author"
        :attachments="msg.attachments"
        :reply="msg.reply"
        @reply="setReply(msg.id)"
      />
    </div>

    <MessageInput
      @send="sendMessage"
      :replying-to="replyingTo ? messages.find(m => m.id === replyingTo)?.text : ''"
      :replying-author="replyingTo ? messages.find(m => m.id === replyingTo)?.author : ''"
      @cancel-reply="replyingTo = null"
    />
  </div>
</template>

<style scoped>
.chat-window {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #f1f5f9;
}

.messages {
  flex: 1;
  overflow-y: auto;
  padding: 0.5rem 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
</style>
