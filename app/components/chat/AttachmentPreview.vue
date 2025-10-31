<!-- src/components/AttachmentPreview.vue -->
<template>
  <div v-if="visible && attachment" class="preview-modal" @click.self="closeModal">
    <div class="preview-content">
      <button class="close-btn" @click="closeModal" aria-label="Закрыть">
        <i class="fas fa-times"></i>
      </button>

      <!-- Фиксированный контейнер для медиа -->
      <div class="media-container">
        <!-- Изображение -->
        <img
          v-if="attachment.url && attachment.type === 'image'"
          :src="attachment.url"
          :alt="attachment.name || 'Изображение'"
          class="media-item"
          @load="onMediaLoad"
          @error="onMediaError"
        />

        <!-- Видео -->
        <video
          v-else-if="attachment.url && attachment.type === 'video'"
          :src="attachment.url"
          controls
          class="media-item"
          @loadeddata="onMediaLoad"
          @error="onMediaError"
        >
          Ваш браузер не поддерживает воспроизведение видео.
        </video>

        <!-- Файл (без медиа) -->
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
  console.log('Медиа загружено в превью:', props.attachment?.url)
}

function onMediaError() {
  console.error('Ошибка загрузки медиа в превью:', props.attachment?.url)
  closeModal()
}

// Форматирование размера файла
function formatSize(size?: string): string {
  if (!size) return 'неизвестно'
  const bytes = Number(size)
  if (isNaN(bytes)) return size
  const kb = bytes / 1024
  return kb < 1024 ? `${kb.toFixed(1)} КБ` : `${(kb / 1024).toFixed(1)} МБ`
}
</script>

<style scoped>
/* Модальное окно */
.preview-modal {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.85);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 2000;
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
}

/* Контент */
.preview-content {
  position: relative;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
  background: #000;
}

/* Кнопка закрытия */
.close-btn {
  position: absolute;
  top: 12px;
  right: 12px;
  z-index: 10;
  background: rgba(0, 0, 0, 0.6);
  border: none;
  color: #fff;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  font-size: 1.1rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.close-btn:hover {
  background: rgba(220, 38, 38, 0.8);
  transform: scale(1.1);
}

/* Фиксированный контейнер для медиа */
.media-container {
  width: 800px;
  height: 600px;
  background: #000;
  display: flex;
  justify-content: center;
  align-items: center;
  overflow: hidden;
}

/* Единый стиль для изображения и видео */
.media-item {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

/* Превью файла */
.file-preview {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #fff;
  text-align: center;
  padding: 2rem;
  gap: 0.75rem;
}

.file-icon {
  font-size: 3rem;
  color: #0078ff;
}

.file-name {
  font-weight: 600;
  font-size: 1.1rem;
  max-width: 300px;
  word-break: break-word;
}

.file-size {
  font-size: 0.9rem;
  color: #aaa;
}

.download-link {
  color: #0078ff;
  text-decoration: underline;
  font-weight: 500;
  font-size: 0.95rem;
  margin-top: 0.5rem;
}

.download-link:hover {
  color: #0056b3;
}

.file-unavailable {
  color: #ff6b6b;
  font-size: 0.9rem;
}

/* Адаптивность */
@media (max-width: 900px) {
  .media-container {
    width: 90vw;
    height: calc(90vw * 0.75); /* 4:3 */
    max-width: 600px;
    max-height: 450px;
  }

  .file-preview {
    padding: 1.5rem;
  }

  .file-name {
    font-size: 1rem;
    max-width: 250px;
  }
}

@media (max-width: 480px) {
  .media-container {
    width: 95vw;
    height: calc(95vw * 0.75);
  }

  .close-btn {
    width: 32px;
    height: 32px;
    font-size: 1rem;
  }
}
</style>