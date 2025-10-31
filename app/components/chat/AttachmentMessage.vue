<!-- src/components/AttachmentMessage.vue -->
<script setup lang="ts">
import { defineProps, defineEmits } from 'vue'

const props = defineProps<{
  attachment: {
    type: 'image' | 'video' | 'file'
    url: string
    name?: string
    size?: string
  }
}>()

const emit = defineEmits<{
  (e: 'preview', attachment: typeof props.attachment): void
}>()

function handleClick() {
  if (props.attachment.type === 'image' || props.attachment.type === 'video') {
    emit('preview', props.attachment)
  }
}
</script>

<template>
  <div class="attachment-message" @click="handleClick">
    <!-- ИЗОБРАЖЕНИЕ -->
    <div v-if="attachment.type === 'image'" class="media-wrapper">
      <img
        v-if="attachment.url"
        :src="attachment.url"
        :alt="attachment.name || 'Изображение'"
        class="media-item"
        @error="console.error('Image load error:', attachment.url)"
        @load="console.log('Image loaded:', attachment.url)"
      />
      <div v-else class="media-error">
        <i class="fas fa-exclamation-triangle"></i>
        <span>Изображение недоступно</span>
      </div>
    </div>

    <!-- ВИДЕО -->
    <div v-else-if="attachment.type === 'video'" class="media-wrapper">
      <video
        v-if="attachment.url"
        :src="attachment.url"
        controls
        class="media-item"
        @error="console.error('Video load error:', attachment.url)"
        @loadeddata="console.log('Video loaded:', attachment.url)"
      >
        Ваш браузер не поддерживает видео.
      </video>
      <div v-else class="media-error">
        <i class="fas fa-exclamation-triangle"></i>
        <span>Видео недоступно</span>
      </div>
    </div>

    <!-- ФАЙЛ -->
    <a
      v-else-if="attachment.url"
      :href="attachment.url"
      :download="attachment.name"
      class="file-attachment"
      @click.stop
    >
      <i class="fas fa-file-alt"></i>
      <div class="file-info">
        <span class="file-name">{{ attachment.name || 'Файл' }}</span>
        <span class="file-size">{{ attachment.size || '' }}</span>
      </div>
    </a>

    <div v-else class="file-error">
      <i class="fas fa-exclamation-triangle"></i>
      <span>Файл недоступен</span>
    </div>
  </div>
</template>

<style scoped>
.attachment-message {
  display: inline-block;
  border-radius: 12px;
  overflow: hidden;
  background: #f8f9fa;
  cursor: pointer;
  transition: all 0.2s ease;
  max-width: 100%;
}

.attachment-message:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

/* ФИКСИРОВАННЫЙ КОНТЕЙНЕР */
.media-wrapper {
  width: 150px;
  height: 150px;
  background: #000;
  display: flex;
  justify-content: center;
  align-items: center;
  overflow: hidden;
  position: relative;
}

.media-item {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.media-error,
.file-error {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  color: #ef4444;
  font-size: 0.875rem;
  padding: 1rem;
  text-align: center;
}

.media-error i,
.file-error i {
  font-size: 1.5rem;
}

/* Файл */
.file-attachment {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  text-decoration: none;
  color: inherit;
  font-size: 0.9rem;
}

.file-attachment i {
  font-size: 1.6rem;
  color: #0078ff;
}

.file-info {
  display: flex;
  flex-direction: column;
  line-height: 1.3;
}

.file-name {
  font-weight: 500;
  color: #1f2937;
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.file-size {
  font-size: 0.8rem;
  color: #64748b;
}
</style>