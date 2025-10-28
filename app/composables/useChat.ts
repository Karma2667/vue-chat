// src/composables/useChat.ts
import { useChatState, type ChatMessage } from './useChatState';
import { useConversations } from './useConversations';
import { useMessages } from './useMessages';
import { useSearch } from './useSearch';
import { useAttachments } from './useAttachments';
import { useChatActions } from './useChatActions';

export function useChat() {
  const {
    currentUserId,
    isOpen,
    currentScreen,
    activeChat,
    dialogs,
    chats,
    showSearch,
    previewAttachment,
    searchQuery,
    searchResults,
    isSearching,
    editingMessage,
    isSearchMode,
  } = useChatState();

  const { loadConversations, handleSelectUser } = useConversations(dialogs, chats);
  const { fetchChatMessages, deleteMessage, handleEditMessage, forwardMessage, handleSendMessage } = useMessages(
    chats,
    activeChat,
    currentUserId,
    editingMessage
  );
  const { performSearch, clearSearch } = useSearch(activeChat, searchQuery, searchResults, isSearching);
  const { handlePreview } = useAttachments(previewAttachment);
  const { openChat, toggleWidget, goBack, cancelEdit, handleSearch } = useChatActions(
    isOpen,
    currentScreen,
    activeChat,
    showSearch,
    previewAttachment,
    editingMessage,
    chats,
    currentUserId
  );

  return {
    currentUserId,
    isOpen,
    currentScreen,
    activeChat,
    dialogs,
    chats,
    showSearch,
    previewAttachment,
    searchQuery,
    searchResults,
    isSearching,
    editingMessage,
    isSearchMode,
    loadConversations,
    handleSelectUser,
    fetchChatMessages,
    deleteMessage,
    handleEditMessage,
    forwardMessage,
    handleSendMessage,
    performSearch,
    clearSearch,
    handlePreview,
    openChat,
    toggleWidget,
    goBack,
    cancelEdit,
    handleSearch,
  };
}

export type { ChatMessage };