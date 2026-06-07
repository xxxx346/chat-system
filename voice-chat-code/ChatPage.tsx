import React, { useEffect, useState, useCallback, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Layout, Button, Empty } from 'antd'
import { TeamOutlined } from '@ant-design/icons'
import { useAuthStore } from '../store/authStore'
import { useChatStore } from '../store/chatStore'
import { chatService } from '../services/chatService'
import { socketService } from '../services/socketService'
import ChatList from '../components/chat/ChatList'
import ChatWindow from '../components/chat/ChatWindow'
import CreateGroupModal from '../components/chat/CreateGroupModal'

const { Sider, Content } = Layout

export default function ChatPage() {
  const { conversationId } = useParams()
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const {
    conversations, setConversations, currentConversation,
    setCurrentConversation, messages, setMessages, addMessage,
    updateConversationLastMessage, setLoading, setReadStatus,
  } = useChatStore()
  const [loading, setLoadingState] = useState(false)
  const [createGroupVisible, setCreateGroupVisible] = useState(false)
  const prevConvRef = useRef<number | undefined>()

  const loadConversations = useCallback(async () => {
    try {
      const res: any = await chatService.getConversations()
      if (res.code === 200) {
        const convs = res.data || []
        // Load unread counts and merge
        try {
          const unreadRes: any = await chatService.getUnreadCount()
          if (unreadRes.code === 200) {
            const counts = unreadRes.data || {}
            convs.forEach((c: any) => {
              c.unread = counts[c.id] || 0
            })
          }
        } catch (e) { /* ignore */ }
        setConversations(convs)
      }
    } catch (err) { /* ignore */ }
  }, [setConversations])

  const refreshUnreadCounts = useCallback(async () => {
    try {
      const unreadRes: any = await chatService.getUnreadCount()
      if (unreadRes.code === 200) {
        const counts = unreadRes.data || {}
        const updatedConvs = conversations.map((c: any) => ({
          ...c,
          unread: counts[c.id] || 0,
        }))
        setConversations(updatedConvs)
      }
    } catch (e) { /* ignore */ }
  }, [conversations, setConversations])

  const loadMessages = useCallback(async (convId: number) => {
    setLoadingState(true)
    setLoading(true)
    try {
      const res: any = await chatService.getMessages(convId)
      if (res.code === 200) setMessages(res.data.messages || [])
    } catch (err) { /* ignore */ }
    finally {
      setLoadingState(false)
      setLoading(false)
    }
  }, [setMessages, setLoading])

  useEffect(() => {
    loadConversations()
  }, [loadConversations])

  useEffect(() => {
    if (conversationId) {
      const convId = parseInt(conversationId)
      const conv = conversations.find(c => c.id === convId)
      if (conv) setCurrentConversation(conv)
      loadMessages(convId)
      socketService.joinConversation(convId)
      return () => {
        socketService.leaveConversation(convId)
      }
    } else {
      setCurrentConversation(null)
      setMessages([])
    }
  }, [conversationId, conversations])

  // Socket listener for new messages - with cleanup and dedup
  useEffect(() => {
    const handler = (data: any) => {
      if (currentConversation && data.conversation_id === currentConversation.id) {
        // Dedup: don't add if already in messages
        const exists = messages.find(m => m.id === data.id)
        if (!exists) {
          addMessage(data)
        }
      }
      updateConversationLastMessage(
        data.conversation_id,
        data.content || (data.type ? `[${data.type}]` : '[新消息]'),
        data.created_at || new Date().toISOString(),
      )
    }
    socketService.onNewMessage(handler)
    return () => { socketService.offNewMessage(handler) }
  }, [currentConversation, messages, addMessage, updateConversationLastMessage])

  // Mark messages as read when entering a conversation
  useEffect(() => {
    if (!currentConversation || !messages.length || !user) return

    const hasNewConv = prevConvRef.current !== currentConversation.id
    prevConvRef.current = currentConversation.id

    if (hasNewConv) {
      messages.forEach(msg => {
        if (msg.sender_id !== user.id && msg.id) {
          socketService.sendMessageRead({
            message_id: msg.id,
            conversation_id: currentConversation.id,
          })
        }
      })
      // Refresh unread counts after marking read
      refreshUnreadCounts()
    }
  }, [currentConversation?.id])

  // Listen for read acknowledgments
  useEffect(() => {
    const handler = (data: any) => {
      if (data.userId && data.message_id) {
        setReadStatus(data.message_id)
      }
    }
    socketService.onMessageRead(handler)
    return () => { socketService.offMessageRead(handler) }
  }, [setReadStatus])

  const handleSelectConversation = (convId: number) => {
    navigate(`/chat/${convId}`)
  }

  const handleSendMessage = (content: string, type: string = 'text') => {
    if (!currentConversation || !user) return

    const msg: Record<string, any> = {
      conversation_id: currentConversation.id,
      sender_id: user.id,
      type,
      content: '',
    }

    if (type === 'text' || type === 'system') {
      msg.content = content
    } else {
      // For voice/image/file, content is JSON with file metadata
      try {
        const fileData = JSON.parse(content)
        msg.file_url = fileData.file_url || ''
        msg.file_name = fileData.file_name || ''
        msg.file_size = fileData.file_size || 0
        msg.content = ''
      } catch {
        msg.content = content
      }
    }

    socketService.sendMessage(msg)
  }

  const handleGroupCreated = (convId: number) => {
    navigate(`/chat/${convId}`)
    loadConversations()
  }

  return (
    <Layout style={{ height: '100%', background: '#fff' }}>
      <Sider width={320} style={{ background: '#fff', borderRight: '1px solid #f0f0f0', overflow: 'auto' }}>
        <ChatList
          conversations={conversations}
          selectedId={conversationId ? parseInt(conversationId) : undefined}
          onSelect={handleSelectConversation}
          onCreateGroup={() => setCreateGroupVisible(true)}
        />
      </Sider>
      <Content style={{ display: 'flex', flexDirection: 'column' }}>
        {currentConversation ? (
          <ChatWindow
            conversation={currentConversation}
            messages={messages}
            loading={loading}
            onSendMessage={handleSendMessage}
          />
        ) : (
          <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <Empty description="选择一个会话开始聊天" />
          </div>
        )}
      </Content>

      <CreateGroupModal
        visible={createGroupVisible}
        onClose={() => setCreateGroupVisible(false)}
        onCreated={handleGroupCreated}
      />
    </Layout>
  )
}
