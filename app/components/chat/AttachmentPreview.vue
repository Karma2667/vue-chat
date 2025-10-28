<!-- src/components/AttachmentPreview.vue -->
<template>
  <div v-if="visible && attachment" class="preview-modal" @click.self="closeModal">
    <div class="preview-content">
      <button class="close-btn" @click="closeModal">
        <i class="fas fa-times"></i>
      </button>
      <template v-if="attachment.url && attachment.type === 'image'">
        <img
          :src="attachment.url"
          :alt="attachment.name || 'Preview'"
          class="preview-image"
          @error="console.error('❌ Image failed to load in preview:', attachment.url); closeModal()"
          @load="console.log('✅ Image loaded in preview:', attachment.url)"
        />
      </template>
      <template v-else-if="attachment.url && attachment.type === 'video'">
        <video
          controls
          :src="attachment.url"
          class="preview-video"
          @error="console.error('❌ Video failed to load in preview:', attachment.url); closeModal()"
          @loadeddata="console.log('✅ Video loaded in preview:', attachment.url)"
        >
          Ваш браузер не поддерживает воспроизведение видео.
        </video>
      </template>
      <template v-else>
        <div class="file-preview">
          <p>{{ attachment.name || 'Файл' }} ({{ attachment.size || 'unknown' }})</p>
          <a v-if="attachment.url" :href="attachment.url" download :title="attachment.name || 'Скачать'">
            Скачать
          </a>
          <p v-else>Файл недоступен: URL отсутствует</p>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { defineProps, defineEmits, watch } from 'vue';

const props = defineProps<{
  attachment: {
    type: 'image' | 'video' | 'file';
    url: string;
    name?: string;
    size?: string;
  } | null;
  visible: boolean;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
}>();

function closeModal() {
  emit('close');
}

watch(
  () => props.attachment?.url,
  (newUrl) => {
    console.log('🔍 Attachment URL updated in preview:', newUrl);
  }
);
</script>

<style scoped>
.preview-modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 2000;
}

.preview-content {
  position: relative;
  max-width: 90%;
  max-height: 90%;
  background: #fff;
  border-radius: 8px;
  overflow: hidden;
  display: flex;
  justify-content: center;
  align-items: center;
}

.preview-image,
.preview-video {
  width: 100%;
  height: 100%;
  max-width: 800px;
  max-height: 600px;
  object-fit: contain;
  display: block;
}

.file-preview {
  padding: 20px;
  text-align: center;
}

.file-preview a {
  color: blue;
  text-decoration: underline;
}

.close-btn {
  position: absolute;
  top: 10px;
  right: 10px;
  background: rgba(0, 0, 0, 0.5);
  border: none;
  color: #fff;
  border-radius: 50%;
  width: 30px;
  height: 30px;
  cursor: pointer;
  font-size: 1rem;
}

.close-btn:hover {
  background: rgba(255, 0, 0, 0.6);
}
</style>