<!-- src/components/AttachmentPreview.vue -->
<template>
  <div v-if="visible && attachment" class="preview-modal" @click.self="closeModal">
    <div class="preview-content">
      <button class="close-btn" @click="closeModal" aria-label="Закрыть">
        <i class="fas fa-times"></i>
      </button>

      <!-- Контейнер для медиа -->
      <div class="media-container">
        <!-- ИЗОБРАЖЕНИЕ -->
        <img
          v-if="attachment.type === 'image' && attachment.url"
          :src="attachment.url"
          :alt="attachment.name || 'Изображение'"
          class="media-item"
          @load="onMediaLoad"
          @error="onMediaError"
        />

        <!-- ВИДЕО -->
        <video
          v-else-if="attachment.type === 'video' && attachment.url"
          :src="attachment.url"
          controls
          class="media-item"
          @loadeddata="onMediaLoad"
          @error="onMediaError"
        >
          Ваш браузер не поддерживает видео.
        </video>

        <!-- ФАЙЛ -->
        <div v-else class="file-preview">
          <i class="fas fa-file-alt file-icon"></i>
          <p class="file-name">{{ attachment.name || 'Файл' }}</p>
          <p class="file-size">{{ formatSize(attachment.size) }}</p>
          <a
            v-if="attachment.url"
            :href="attachment.url"
            download
            class="download-link"
            @click.stop
          >
            Скачать
          </a>
          <p v-else class="file-unavailable">Файл недоступен</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { defineProps, defineEmits } from 'vue'

const props = defineProps<{
  attachment: {
    type: 'image' | 'video' | 'file'
    url: string
    name?: string
    size?: string
  } | null
  visible: boolean
}>()

const emit = defineEmits<{
  (e: 'close'): void
}>()

function closeModal() {
  emit('close')
}

function onMediaLoad() {
  console.log('Медиа загружено:', props.attachment?.url)
}

function onMediaError() {
  console.error('Ошибка загрузки:', props.attachment?.url)
  closeModal()
}

function formatSize(size?: string): string {
  if (!size) return 'неизвестно'
  const bytes = Number(size)
  if (isNaN(bytes)) return size
  const kb = bytes / 1024
  return kb < 1024 ? `${kb.toFixed(1)} КБ` : `${(kb / 1024).toFixed(1)} МБ`
}
</script>

<style scoped>
.preview-modal {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.9);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 2000;
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
}

.preview-content {
  position: relative;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.4);
  background: #000;
  max-width: 95vw;
  max-height: 95vh;
}

.close-btn {
  position: absolute;
  top: 16px;
  right: 16px;
  z-index: 10;
  background: rgba(0, 0, 0, 0.7);
  border: none;
  color: #fff;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  font-size: 1.2rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  backdrop-filter: blur(4px);
}

.close-btn:hover {
  background: rgba(239, 68, 68, 0.9);
  transform: scale(1.1);
}

/* Контейнер медиа */
.media-container {
  width: 90vw;
  height: 80vh;
  max-width: 1000px;
  max-height: 800px;
  background: #000;
  display: flex;
  justify-content: center;
  align-items: center;
  overflow: hidden;
  border-radius: 16px;
}

.media-item {
  max-width: 100%;
  max-height: 100%;
  width: auto;
  height: auto;
  object-fit: contain;
  display: block;
}

.file-preview {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #fff;
  text-align: center;
  padding: 2.5rem;
  gap: 1rem;
}

.file-icon {
  font-size: 4rem;
  color: #0078ff;
}

.file-name {
  font-weight: 600;
  font-size: 1.3rem;
  max-width: 400px;
  word-break: break-word;
}

.file-size {
  font-size: 1rem;
  color: #aaa;
}

.download-link {
  color: #0078ff;
  text-decoration: underline;
  font-weight: 500;
  font-size: 1rem;
  margin-top: 0.5rem;
  transition: color 0.2s;
}

.download-link:hover {
  color: #0056b3;
}

.file-unavailable {
  color: #ff6b6b;
  font-size: 1rem;
}

/* Адаптивность */
@media (max-width: 768px) {
  .media-container {
    width: 95vw;
    height: 75vh;
  }

  .file-preview {
    padding: 1.5rem;
  }

  .file-name {
    font-size: 1.1rem;
    max-width: 300px;
  }
}

@media (max-width: 480px) {
  .close-btn {
    width: 36px;
    height: 36px;
    font-size: 1rem;
  }

  .file-icon {
    font-size: 3rem;
  }
}
</style>