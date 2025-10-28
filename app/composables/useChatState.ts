// src/composables/useChatState.ts
import { reactive, toRefs, computed, onMounted } from 'vue';
import { authService } from '~/utils/auth';

export interface Dialog {
  id: number;
  from: string;
  type?: string;
  lastMessage?: { content: string; created_at: string; username: string };
}

export interface ChatMessage {
  id: number;
  text: string;
  time: string;
  author: string;
  self: boolean;
  reply: { id: number; text: string; author: string } | null;
  attachments: Array<{
    type: 'image' | 'video' | 'file';
    url: string;
    name?: string;
    size?: string;
  }>;
  edited?: boolean;
}

interface ChatState {
  currentUserId: number | null;
  isOpen: boolean;
  currentScreen: 'dialogs' | 'chat';
  activeChat: Dialog | null;
  dialogs: Dialog[];
  chats: Record<number, ChatMessage[]>;
  showSearch: boolean;
  previewAttachment: {
    type: 'image' | 'video' | 'file';
    url: string;
    name?: string;
    size?: string;
  } | null;
  searchQuery: string;
  searchResults: ChatMessage[];
  isSearching: boolean;
  editingMessage: { id: number; text: string } | null;
}

export function useChatState() {
  const state = reactive<ChatState>({
    currentUserId: null,
    isOpen: false,
    currentScreen: 'dialogs',
    activeChat: null,
    dialogs: [],
    chats: {},
    showSearch: false,
    previewAttachment: null,
    searchQuery: '',
    searchResults: [],
    isSearching: false,
    editingMessage: null,
  });

  onMounted(() => {
    const user = authService.getUser();
    if (user && user.id) {
      state.currentUserId = user.id;
    }
  });

  const isSearchMode = computed(() => state.searchQuery.trim() !== '');

  return {
    ...toRefs(state),
    isSearchMode,
  };
}