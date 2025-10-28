<!-- src/components/AttachmentMessage.vue -->
<script setup lang="ts">
import { defineProps, defineEmits } from 'vue';

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

function handleClick() {
  console.log('🔍 Handling click on attachment:', props.attachment);
  if (props.attachment.type === 'image' || props.attachment.type === 'video') {
    if (props.attachment.url) {
      emit('preview', props.attachment);
    } else {
      console.warn('⚠️ Cannot preview attachment: URL is empty');
    }
  }
}
</script>

<template>
  <div class="attachment-message">
    <template v-if="attachment.type === 'image'">
      <img
        v-if="attachment.url"
        :src="attachment.url"
        :alt="attachment.name || 'Image'"
        class="attachment-image"
        @click="handleClick"
        @error="console.error('❌ Image failed to load:', attachment.url)"
        @load="console.log('✅ Image loaded:', attachment.url)"
      />
      <div v-else class="attachment-error">
        <i class="fas fa-exclamation-triangle"></i>
        <span>Изображение недоступно</span>
      </div>
    </template>

    <template v-else-if="attachment.type === 'video'">
      <video
        v-if="attachment.url"
        controls
        :src="attachment.url"
        class="attachment-video"
        @click="handleClick"
        @error="console.error('❌ Video failed to load:', attachment.url)"
        @loadeddata="console.log('✅ Video loaded:', attachment.url)"
      />
      <div v-else class="attachment-error">
        <i class="fas fa-exclamation-triangle"></i>
        <span>Видео недоступно</span>
      </div>
    </template>

    <template v-else>
      <a
        v-if="attachment.url"
        :href="attachment.url"
        :download="attachment.name || 'file'"
        class="attachment-file"
        @click.stop
      >
        <i class="fas fa-file-alt"></i>
        <div class="file-info">
          <span class="file-name">{{ attachment.name || 'File' }}</span>
          <span class="file-size">{{ attachment.size || '' }}</span>
        </div>
      </a>
      <div v-else class="attachment-error">
        <i class="fas fa-exclamation-triangle"></i>
        <span>Файл недоступен</span>
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
  text-decoration: none;
  color: inherit;
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

.attachment-error {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.6rem 0.8rem;
  background: #fff;
  border: 1px solid rgba(255,0,0,0.2);
  border-radius: 8px;
  color: #d32f2f;
}

.attachment-error i {
  font-size: 1.4rem;
}
</style>