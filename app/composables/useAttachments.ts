// src/composables/useAttachments.ts
import type { Ref } from 'vue';
import type { ChatMessage } from './useChatState';

const urlCache = new Map<string, string>();

export async function getAuthenticatedUrl(
  attachment: { id?: string; url?: string; mime_type?: string }
): Promise<string> {
  console.log('🚀 getAuthenticatedUrl called with:', { id: attachment.id, url: attachment.url, mime_type: attachment.mime_type });
  if (!attachment.id && !attachment.url) {
    console.warn('⚠️ Attachment ID or URL is missing:', attachment);
    return '';
  }
  try {
    if (attachment.url) {
      console.log('✅ Using provided attachment URL:', attachment.url);
      if (!urlCache.has(attachment.id || attachment.url)) {
        urlCache.set(attachment.id || attachment.url, attachment.url);
      }
      return attachment.url;
    }
    console.warn('⚠️ No URL provided for attachment ID:', attachment.id);
    return ''; // Не пытаемся загрузить URL, так как эндпоинт /attachments/:id не существует
  } catch (error: any) {
    console.error('❌ Ошибка обработки вложения:', error.message, { attachment, status: error.response?.status });
    return '';
  }
}

export function useAttachments(previewAttachment: Ref<ChatMessage['attachments'][0] | null>) {
  function handlePreview(attachment: {
    type: 'image' | 'video' | 'file';
    url: string;
    name?: string;
    size?: string;
  }) {
    console.log('👁️‍🗨️ Previewing attachment:', attachment);
    if ((attachment.type === 'image' || attachment.type === 'video') && attachment.url) {
      previewAttachment.value = { ...attachment }; // Создаём новый объект для триггера реактивности
    } else {
      console.warn('⚠️ Cannot preview attachment without URL or invalid type:', attachment);
    }
  }

  return { handlePreview };
}