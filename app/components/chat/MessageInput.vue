<script setup lang="ts">
import { ref, defineProps, defineEmits, nextTick, watch } from 'vue'
import EmojiPicker from './EmojiPicker.vue'
import AttachmentMessage from './AttachmentMessage.vue'

const props = defineProps<{
  replyingText?: string
  replyingAuthor?: string
  replyingId?: number
  editingText?: string
  editingId?: number
}>()

const emit = defineEmits<{
  (e: 'send', message: string, attachments?: File[]): void
  (e: 'cancel-reply'): void
  (e: 'cancel-edit'): void
  (e: 'edit', id: number, message: string): void
  (e: 'preview', attachment: any): void
}>()

const message = ref('')
const showEmojiPicker = ref(false)
const attachments = ref<
  { type: 'image' | 'video' | 'file'; url: string; name: string; size: string }[]
>([])
const files = ref<File[]>([])
const inputRef = ref<HTMLInputElement | null>(null)
const fileInput = ref<HTMLInputElement | null>(null)
const isEditing = ref(false)

watch(
  () => props.editingText,
  (newText) => {
    if (newText !== undefined) {
      message.value = newText
      nextTick(() => inputRef.value?.focus())
    }
  }
)

async function sendMessage() {
  const text = message.value.trim()
  const hasFiles = files.value.length > 0
  if (!text && !hasFiles) return

  const content = text || files.value[0]?.name || 'Вложение'

  if (props.editingId !== undefined) {
    isEditing.value = true
    try {
      emit('edit', props.editingId, content)
      await new Promise(resolve => setTimeout(resolve, 500))
    } finally {
      isEditing.value = false
    }
  } else {
    emit('send', content, files.value)
  }

  clearInput()
}

function clearInput() {
  message.value = ''
  attachments.value.forEach(a => URL.revokeObjectURL(a.url))
  attachments.value = []
  files.value = []
}

function toggleEmojiPicker() {
  showEmojiPicker.value = !showEmojiPicker.value
}

function insertEmoji(emoji: string) {
  const input = inputRef.value
  if (!input) return
  const start = input.selectionStart || 0
  const end = input.selectionEnd || 0
  message.value = message.value.slice(0, start) + emoji + message.value.slice(end)
  nextTick(() => {
    input.focus()
    input.setSelectionRange(start + emoji.length, start + emoji.length)
  })
  showEmojiPicker.value = false
}

function openFileDialog() {
  fileInput.value?.click()
}

function handleFiles(event: Event) {
  const fileList = (event.target as HTMLInputElement).files
  if (!fileList) return

  Array.from(fileList).forEach(file => {
    const url = URL.createObjectURL(file)
    let type: 'image' | 'video' | 'file' = 'file'
    if (file.type.startsWith('image/')) type = 'image'
    else if (file.type.startsWith('video/')) type = 'video'

    attachments.value.push({
      type,
      url,
      name: file.name,
      size: `${(file.size / 1024).toFixed(1)} КБ`,
    })
    files.value.push(file)
  })

  if (fileInput.value) fileInput.value.value = ''
}

function removeAttachment(index: number) {
  const item = attachments.value[index]
  if (item) URL.revokeObjectURL(item.url)
  attachments.value.splice(index, 1)
  files.value.splice(index, 1)
}

function previewAttachment(attachment: any) {
  emit('preview', attachment)
}

function cancelReply() {
  emit('cancel-reply')
}

function cancelEdit() {
  emit('cancel-edit')
  message.value = ''
}
</script>

<template>
  <div class="message-input" @click.stop>
    <!-- Ответ -->
    <div v-if="props.replyingText" class="reply-block">
      <div class="reply-preview">
        <span class="reply-author">{{ props.replyingAuthor }}</span>
        <span class="reply-text">{{ props.replyingText }}</span>
      </div>
      <button class="cancel-btn" @click.stop="cancelReply">
        <i class="fas fa-times"></i>
      </button>
    </div>

    <!-- Редактирование -->
    <div v-if="props.editingId !== undefined" class="edit-block">
      <span>Редактирование</span>
      <button class="cancel-btn" @click.stop="cancelEdit">
        <i class="fas fa-times"></i>
      </button>
    </div>

    <!-- Вложения — 150×150 -->
    <transition-group name="fade" tag="div" class="attachments-preview">
      <div v-for="(a, i) in attachments" :key="a.url" class="attachment-item input-size">
        <AttachmentMessage :attachment="a" @preview="previewAttachment" />
        <button class="remove-btn" @click.stop="removeAttachment(i)">
          <i class="fas fa-times"></i>
        </button>
      </div>
    </transition-group>

    <!-- Поле ввода -->
    <div class="input-row">
      <button class="icon-btn" @click.stop="openFileDialog" title="Вложение">
        <i class="fas fa-paperclip"></i>
      </button>
      <input type="file" multiple hidden ref="fileInput" @change="handleFiles" />

      <input
        ref="inputRef"
        v-model="message"
        @keyup.enter="sendMessage"
        type="text"
        :placeholder="props.editingId !== undefined ? 'Редактировать...' : 'Сообщение...'"
        class="text-input"
        @click.stop
      />

      <button class="icon-btn" @click.stop.prevent="toggleEmojiPicker" title="Эмодзи">
        <i class="far fa-smile"></i>
      </button>

      <button
        class="icon-btn send-btn"
        @click.stop="sendMessage"
        :disabled="isEditing || (!message.trim() && files.length === 0)"
        :title="isEditing ? 'Отправка...' : 'Отправить'"
      >
        <i v-if="isEditing" class="fas fa-spinner fa-spin"></i>
        <i v-else class="fas fa-paper-plane"></i>
      </button>
    </div>

    <!-- Эмодзи-пикер -->
    <transition name="slide-up">
      <div v-if="showEmojiPicker" class="emoji-picker-wrapper" @click.stop>
        <EmojiPicker @select="insertEmoji" />
      </div>
    </transition>
  </div>
</template>

<style scoped>
.message-input {
  background: #fff;
  padding: 0.75rem;
  border-top: 1px solid rgba(0, 0, 0, 0.08);
  box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.05);
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.reply-block,
.edit-block {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #f1f5f9;
  padding: 0.5rem 0.75rem;
  border-radius: 8px;
  font-size: 0.875rem;
  color: #475569;
}

.reply-author { font-weight: 600; margin-right: 0.5rem; }
.reply-text { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 70%; }

.cancel-btn {
  background: none;
  border: none;
  color: #ef4444;
  cursor: pointer;
  font-size: 1rem;
  padding: 0.25rem;
  border-radius: 50%;
  transition: background 0.2s;
}

.cancel-btn:hover { background: rgba(239, 68, 68, 0.1); }

.input-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.icon-btn {
  background: none;
  border: none;
  color: #64748b;
  font-size: 1.1rem;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 50%;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.icon-btn:hover { background: #f1f5f9; color: #1e293b; }

.send-btn { color: #0078ff; }
.send-btn:hover:not(:disabled) { background: #e0f2fe; color: #0369a1; }
.send-btn:disabled { color: #94a3b8; cursor: not-allowed; }

.text-input {
  flex: 1;
  border: none;
  outline: none;
  padding: 0.6rem 1rem;
  font-size: 0.95rem;
  border-radius: 9999px;
  background: #f6f7f9;
  color: #1e293b;
  min-width: 0;
}

.text-input::placeholder { color: #94a3b8; }

.attachments-preview {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.attachment-item.input-size {
  position: relative;
  width: 150px;
  height: 150px;
  border-radius: 12px;
  overflow: hidden;
  background: #f8f9fa;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  flex-shrink: 0;
}

.remove-btn {
  position: absolute;
  top: 6px;
  right: 6px;
  background: rgba(0, 0, 0, 0.5);
  color: white;
  border: none;
  width: 24px;
  height: 24px;
  font-size: 0.8rem;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1;
  transition: all 0.2s;
}

.remove-btn:hover {
  background: rgba(239, 68, 68, 0.8);
  transform: scale(1.1);
}

/* Эмодзи-пикер */
.emoji-picker-wrapper {
  margin-top: 0.5rem;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 -8px 24px rgba(0, 0, 0, 0.15);
  background: white;
}

@keyframes slideUp {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.slide-up-enter-active,
.slide-up-leave-active { transition: all 0.2s ease; }
.slide-up-enter-from,
.slide-up-leave-to { opacity: 0; transform: translateY(10px); }

.fade-enter-active,
.fade-leave-active { transition: opacity 0.15s ease; }
.fade-enter-from,
.fade-leave-to { opacity: 0; }
</style>