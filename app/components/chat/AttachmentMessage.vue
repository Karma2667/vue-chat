<script setup lang="ts">
import { defineProps, defineEmits } from 'vue';
import { authService } from '../../utils/auth';

const props = defineProps<{
  attachment: {
    type: 'image' | 'video' | 'file';
    url: string;
    name?: string;
    size?: string;
  };
}>();

const emit = defineEmits<{
  (e: 'preview', attachment: { type: 'image' | 'video' | 'file'; url: string; name?: string; size?: string }): void;
}>();

async function handleClick() {
  if (props.attachment.type === 'image' || props.attachment.type === 'video') {
    emit('preview', props.attachment);
  } else {
    try {
      const response = await authService.makeRequest<Blob>(
        props.attachment.url,
        'GET',
        {},
        { responseType: 'blob' }
      );
      const url = URL.createObjectURL(response);
      const link = document.createElement('a');
      link.href = url;
      link.download = props.attachment.name || 'file';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error: any) {
      console.error('Ошибка при скачивании файла:', error.message);
      alert('Не удалось скачать файл: ' + error.message);
    }
  }
}
</script>

<template>
  <div class="attachment-message" @click="handleClick">
    <template v-if="attachment.type === 'image'">
      <img :src="attachment.url" :alt="attachment.name || 'Image'" class="attachment-image" />
    </template>

    <template v-else-if="attachment.type === 'video'">
      <video
        controls
        :src="attachment.url"
        class="attachment-video"
      />
    </template>

    <template v-else>
      <div class="attachment-file">
        <i class="fas fa-file-alt"></i>
        <div class="file-info">
          <span class="file-name">{{ attachment.name || 'File' }}</span>
          <span class="file-size">{{ attachment.size || '' }}</span>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.attachment-message {
  display: inline-block;
  border-radius: 10px;
  overflow: hidden;
  background: #f6f7f9;
  cursor: pointer;
  transition: transform 0.15s ease;
  max-width: 320px;
}

.attachment-message:hover {
  transform: scale(1.02);
}

.attachment-image {
  width: 100%;
  height: auto;
  display: block;
  border-radius: 8px;
}

.attachment-video {
  width: 100%;
  height: auto;
  border-radius: 8px;
}

.attachment-file {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.6rem 0.8rem;
  background: #fff;
  border: 1px solid rgba(0,0,0,0.08);
  border-radius: 8px;
}

.attachment-file i {
  font-size: 1.4rem;
  color: #0078ff;
}

.file-info {
  display: flex;
  flex-direction: column;
  line-height: 1.2;
}

.file-name {
  font-weight: 500;
  color: #222;
}

.file-size {
  font-size: 0.85rem;
  color: #777;
}
</style>