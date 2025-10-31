export interface Dialog {
  id: number
  from: string
  type?: string
  lastMessage?: { content: string; created_at: string; username: string }
}

export interface ChatMessage {
  id: number
  text: string
  time: string
  author: string
  self: boolean
  reply: { id: number; text: string; author: string } | null
  attachments: Array<{
    type: 'image' | 'video' | 'file'
    url: string
    name?: string
    size?: string
  }>
  edited?: boolean
}

export interface Conversation {
  id: number
  conversation_type: string
  users?: { id: number; username: string }[]
  name?: string
}