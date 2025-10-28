// src/composables/useChatActions.ts
import type { Ref } from 'vue';
import type { Dialog, ChatMessage } from './useChatState';
import { useMessages } from './useMessages';

export function useChatActions(
  isOpen: Ref<boolean>,
  currentScreen: Ref<'dialogs' | 'chat'>,
  activeChat: Ref<Dialog | null>,
  showSearch: Ref<boolean>,
  previewAttachment: Ref<ChatMessage['attachments'][0] | null>,
  editingMessage: Ref<{ id: number; text: string } | null>,
  chats: Ref<Record<number, ChatMessage[]>>,
  currentUserId: Ref<number | null>
) {
  const { fetchChatMessages } = useMessages(chats, activeChat, currentUserId, editingMessage);

  async function openChat(dialog: Dialog) {
    activeChat.value = dialog;
    currentScreen.value = 'chat';
    editingMessage.value = null;

    const messages = await fetchChatMessages(dialog.id);
    chats.value[dialog.id] = messages;
  }

  function toggleWidget() {
    isOpen.value = !isOpen.value;
    if (!isOpen.value) {
      showSearch.value = false;
      previewAttachment.value = null;
      editingMessage.value = null;
    }
  }

  function goBack() {
    currentScreen.value = 'dialogs';
    showSearch.value = false;
    previewAttachment.value = null;
    editingMessage.value = null;
  }

  function cancelEdit() {
    editingMessage.value = null;
  }

  function handleSearch() {
    if (activeChat.value) {
      showSearch.value = true;
    }
  }

  return { openChat, toggleWidget, goBack, cancelEdit, handleSearch };
}