import { create } from 'zustand'

interface Conversation {
  id: number
  type: 'private' | 'group'
  name: string
  avatar: string
  last_message: string
  last_message_time: string
  members: any[]
  unread: number
}

interface Message {
  id: number
  conversation_id: number
  sender_id: number
  type: string
  content: string
  file_url: string
  created_at: string
  sender?: any
}

interface ChatState {
  conversations: Conversation[]
  currentConversation: Conversation | null
  messages: Message[]
  loading: boolean
  readByOthers: Record<number, boolean>
  setConversations: (convs: Conversation[]) => void
  setCurrentConversation: (conv: Conversation | null) => void
  addMessage: (msg: Message) => void
  setMessages: (msgs: Message[]) => void
  appendMessages: (msgs: Message[]) => void
  setLoading: (loading: boolean) => void
  updateConversationLastMessage: (convId: number, message: string, time: string) => void
  setReadStatus: (messageId: number) => void
}

export const useChatStore = create<ChatState>((set) => ({
  conversations: [],
  currentConversation: null,
  messages: [],
  loading: false,
  readByOthers: {},
  setConversations: (conversations) => set({ conversations }),
  setCurrentConversation: (conv) => set({ currentConversation: conv }),
  addMessage: (msg) => set((state) => ({ messages: [...state.messages, msg] })),
  setMessages: (messages) => set({ messages }),
  appendMessages: (msgs) => set((state) => ({ messages: [...msgs, ...state.messages] })),
  setLoading: (loading) => set({ loading }),
  updateConversationLastMessage: (convId, message, time) =>
    set((state) => ({
      conversations: state.conversations.map((c) =>
        c.id === convId ? { ...c, last_message: message, last_message_time: time } : c
      ),
    })),
  setReadStatus: (messageId) =>
    set((state) => ({ readByOthers: { ...state.readByOthers, [messageId]: true } })),
}))
