// src/composables/useSearch.ts
import type { Ref } from 'vue';
import { ref } from 'vue';
import { searchMessages, type Message } from '~/utils/messages';
import type { ChatMessage, Dialog } from '../types/index';
import { useAttachments } from './useAttachments';

const attachmentUrlCache = new Map<string, string>();

export function useSearch(
  activeChat: Ref<Dialog | null>,
  searchQuery: Ref<string>,
  searchResults: Ref<ChatMessage[]>,
  isSearching: Ref<boolean>
) {
  const { handlePreview } = useAttachments(ref(null));

  async function performSearch(query: string) {
    if (!activeChat.value || !query.trim()) {
      searchResults.value = [];
      searchQuery.value = '';
      return;
    }

    isSearching.value = true;
    searchQuery.value = query;

    try {
      const response = await searchMessages(activeChat.value.id, query, 1);
      console.log('🔍 Search response:', response);
      const tempMessages = await Promise.all(
        response.messages.map(async (msg: Message) => {
          let attachments: ChatMessage['attachments'] = [];
          if (msg.attachment && (msg.attachment.id || msg.attachment.url)) {
            const mimeType = msg.attachment.mime_type || '';
            const type: 'image' | 'video' | 'file' =
              mimeType.startsWith('image/') ? 'image' : mimeType.startsWith('video/') ? 'video' : 'file';

            let url = msg.attachment.url;
            if (!url && msg.attachment.id) {
              if (attachmentUrlCache.has(msg.attachment.id)) {
                url = attachmentUrlCache.get(msg.attachment.id)!;
                console.log('✅ Using cached URL for attachment:', msg.attachment.id);
              } else {
                url = ''; // Не вызываем getAuthenticatedUrl, так как /attachments/:id не существует
                console.warn('⚠️ No URL provided for attachment:', msg.attachment.id);
              }
            } else if (!url) {
              console.warn('⚠️ No URL provided for attachment:', msg.attachment.id);
              url = '';
            }
            console.log('📎 Attachment URL for message', msg.id, ':', url);

            attachments = [
              {
                type,
                url,
                name: msg.attachment.filename || undefined,
                size: msg.attachment.size ? `${(Number(msg.attachment.size) / 1024).toFixed(2)} KB` : undefined,
              },
            ];
          }

          return {
            id: msg.id,
            text: msg.content || '',
            time: new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            author: msg.user?.username || 'Unknown',
            self: false,
            reply: null,
            attachments,
            edited: msg.edited || false,
          } as ChatMessage;
        })
      );

      searchResults.value = tempMessages;
      console.log('✅ Search results updated:', tempMessages);
    } catch (error: any) {
      console.error('❌ Ошибка поиска:', error);
      searchResults.value = [];
    } finally {
      isSearching.value = false;
    }
  }

  function clearSearch() {
    searchQuery.value = '';
    searchResults.value = [];
    isSearching.value = false;
  }

  return { performSearch, clearSearch };
}