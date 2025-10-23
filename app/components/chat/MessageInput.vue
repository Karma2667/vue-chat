<script setup lang="ts">
import { ref, defineProps, defineEmits, nextTick } from 'vue';
import EmojiPicker from './EmojiPicker.vue';
import AttachmentMessage from './AttachmentMessage.vue';
import ReplyMessage from './ReplyMessage.vue';

const props = defineProps<{
  replyingText?: string;  // ✅ ИСПРАВЛЕНО: было replyingTo
  replyingAuthor?: string;
  replyingId?: number;
}>();

const emit = defineEmits<{
  (e: 'send', message: string, attachments?: File[]): void;
  (e: 'voice'): void;
  (e: 'video'): void;
  (e: 'cancel-reply'): void;
  (e: 'scroll-to-reply', id: number): void;
}>();

const message = ref('');
const showEmojiPicker = ref(false);
const attachments = ref<
  { type: 'image' | 'video' | 'file'; url: string; name: string; size: string }[]
>([]);
const files = ref<File[]>([]);
const inputRef = ref<HTMLInputElement | null>(null);
const fileInput = ref<HTMLInputElement | null>(null);

function sendMessage() {
  const text = message.value.trim();
  if (!text && files.value.length === 0) return;

  emit('send', text, files.value);

  message.value = '';
  attachments.value.forEach((a) => URL.revokeObjectURL(a.url));
  attachments.value = [];
  files.value = [];
}

function toggleEmojiPicker() {
  showEmojiPicker.value = !showEmojiPicker.value;
}

function insertEmoji(emoji: string) {
  const input = inputRef.value;
  if (!input) return;
  const start = input.selectionStart || 0;
  const end = input.selectionEnd || 0;
  message.value = message.value.slice(0, start) + emoji + message.value.slice(end);
  nextTick(() => {
    input.focus();
    input.setSelectionRange(start + emoji.length, start + emoji.length);
  });
}

function openFileDialog() {
  fileInput.value?.click();
}

function handleFiles(event: Event) {
  const fileList = (event.target as HTMLInputElement).files;
  if (!fileList) return;

  Array.from(fileList).forEach((file) => {
    const url = URL.createObjectURL(file);
    let type: 'image' | 'video' | 'file' = 'file';
    if (file.type.startsWith('image/')) type = 'image';
    else if (file.type.startsWith('video/')) type = 'video';

    attachments.value.push({
      type,
      url,
      name: file.name,
      size: `${(file.size / 1024).toFixed(1)} KB`,
    });
    files.value.push(file);
  });
}

function removeAttachment(index: number) {
  const item = attachments.value[index];
  if (!item) return;

  URL.revokeObjectURL(item.url);
  attachments.value.splice(index, 1);
  files.value.splice(index, 1);
}

function cancelReply() {
  emit('cancel-reply');
}

function handleScrollToReply(id: number) {
  console.log('Scroll to reply ID:', id);
  emit('scroll-to-reply', id);
}
</script>

<template>
  <div class="message-input">
    <!-- ✅ ИСПРАВЛЕНО: Показываем reply даже для вложений без текста -->
    <div v-if="props.replyingText" class="replying-to">
      <ReplyMessage
        :id="props.replyingId!"
        :author="props.replyingAuthor"
        :text="props.replyingText"
        @scroll-to-reply="handleScrollToReply"
      />
      <button class="cancel-btn" @click="cancelReply">
        <i class="fas fa-times"></i>
      </button>
    </div>

    <!-- Кнопка для файлов -->
    <button class="icon-btn" @click="openFileDialog">
      <i class="fas fa-paperclip"></i>
    </button>
    <input type="file" multiple hidden ref="fileInput" @change="handleFiles" />

    <!-- Поле ввода -->
    <input
      ref="inputRef"
      v-model="message"
      @keyup.enter="sendMessage"
      type="text"
      placeholder="Write message"
      class="input"
    />

    <!-- Правый блок -->
    <div class="right-icons">
      <button class="icon-btn"><i class="fas fa-font"></i></button>
      <button class="icon-btn" @click="toggleEmojiPicker">
        <i class="far fa-smile"></i>
      </button>
      <button class="icon-btn" @click="emit('video')">
        <i class="fas fa-video"></i>
      </button>
      <button class="icon-btn send-btn" @click="sendMessage">
        <i class="fas fa-paper-plane"></i>
      </button>
    </div>

    <!-- Эмоджи -->
    <transition name="fade">
      <EmojiPicker v-if="showEmojiPicker" @select="insertEmoji" />
    </transition>

    <!-- Вложения -->
    <transition-group name="fade" tag="div" class="attachments-preview">
      <div v-for="(a, index) in attachments" :key="a.url" class="attachment-wrapper">
        <AttachmentMessage :attachment="a" />
        <button class="remove-btn" @click="removeAttachment(index)">
          <i class="fas fa-times"></i>
        </button>
      </div>
    </transition-group>
  </div>
</template>

<style scoped>
.message-input {
  position: relative;
  display: flex;
  align-items: center;
  background: #fff;
  padding: 0.65rem 0.9rem;
  border-top: 1px solid rgba(0, 0, 0, 0.08);
  box-shadow: 0 -2px 6px rgba(0, 0, 0, 0.04);
  flex-wrap: wrap;
}

.replying-to {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #f1f5f9;
  padding: 0.4rem 0.6rem;
  border-radius: 8px;
  margin-bottom: 4px;
  font-size: 0.85rem;
  width: 100%;
}

.cancel-btn {
  background: none;
  border: none;
  color: #ff4444;
  cursor: pointer;
  font-size: 0.9rem;
}

.input {
  flex: 1;
  border: none;
  outline: none;
  padding: 0.6rem 1rem;
  font-size: 0.95rem;
  border-radius: 9999px;
  background: var(--bg-second, #f6f7f9);
  color: var(--tx-first, #222);
  margin: 0 0.5rem;
}

.icon-btn {
  background: none;
  border: none;
  color: var(--tx-second, #777);
  font-size: 1rem;
  cursor: pointer;
  padding: 0.1rem;
  border-radius: 50%;
  transition: background 0.2s, color 0.2s;
}

.icon-btn:hover {
  background: rgba(0, 0, 0, 0.05);
  color: var(--tx-first, #000);
}

.right-icons {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.send-btn {
  color: #0078ff;
}

.attachments-preview {
  display: flex;
  gap: 8px;
  margin-top: 6px;
  width: 100%;
  padding-left: 2rem;
  flex-wrap: wrap;
}

.attachment-wrapper {
  position: relative;
}

.remove-btn {
  position: absolute;
  top: 4px;
  right: 4px;
  background: rgba(0, 0, 0, 0.45);
  border: none;
  border-radius: 50%;
  color: #fff;
  width: 18px;
  height: 18px;
  font-size: 0.65rem;
  cursor: pointer;
}

.remove-btn:hover {
  background: rgba(255, 0, 0, 0.6);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.15s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>