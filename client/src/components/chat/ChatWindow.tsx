import React, { useState, useRef, useEffect } from 'react'
import { Typography, Spin, Empty, Button, Dropdown, message } from 'antd'
import { DownloadOutlined, SearchOutlined, EllipsisOutlined, TeamOutlined, PhoneOutlined } from '@ant-design/icons'
import { useAuthStore } from '../../store/authStore'
import { useCallStore } from '../../store/callStore'
import MessageBubble from './MessageBubble'
import MessageInput from './MessageInput'
import ChatHistorySearch from './ChatHistorySearch'
import { chatService } from '../../services/chatService'

const { Text } = Typography

interface ChatWindowProps {
  conversation: any
  messages: any[]
  loading: boolean
  onSendMessage: (content: string, type: string) => void
}

export default function ChatWindow({ conversation, messages, loading, onSendMessage }: ChatWindowProps) {
  const user = useAuthStore((s) => s.user)
  const setCalling = useCallStore((s) => s.setCalling)
  const callStatus = useCallStore((s) => s.status)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [showSearch, setShowSearch] = useState(false)

  const isInCall = callStatus !== 'idle'

  const getOtherMemberId = () => {
    if (conversation.type !== 'private') return null
    const other = (conversation.members || []).find((m: any) => m.id !== user?.id)
    return other || null
  }

  const handleCall = () => {
    if (isInCall) return
    const other = getOtherMemberId()
    if (other) {
      setCalling(other.id, other.nickname || other.username, other.avatar)
    }
  }

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleExport = async (format: 'json' | 'txt') => {
    try {
      const res: any = await chatService.exportMessages(conversation.id, format)
      const blob = res instanceof Blob ? res : new Blob([JSON.stringify(res)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `chat-${conversation.id}.${format}`
      a.click()
      URL.revokeObjectURL(url)
      message.success('下载成功')
    } catch (err) {
      message.error('下载失败')
    }
  }

  const moreMenuItems: any[] = [
    { key: 'search', icon: <SearchOutlined />, label: '搜索聊天记录' },
    { key: 'download-json', icon: <DownloadOutlined />, label: '下载 JSON' },
    { key: 'download-txt', icon: <DownloadOutlined />, label: '下载 TXT' },
  ]

  if (conversation.type === 'group') {
    moreMenuItems.push(
      { type: 'divider' as const, key: 'g-divider' },
      {
        key: 'members',
        icon: <TeamOutlined />,
        label: `成员 (${conversation.members?.length || 0}人)`,
        disabled: true,
      },
    )
  }

  const moreMenu = {
    items: moreMenuItems,
    onClick: ({ key }: { key: string }) => {
      if (key === 'search') setShowSearch(true)
      else if (key === 'download-json') handleExport('json')
      else if (key === 'download-txt') handleExport('txt')
    },
  }

  return (
    <>
      <div style={{ padding: '10px 16px', borderBottom: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff' }}>
        <div>
          <Text strong style={{ fontSize: 16 }}>{conversation.name || '聊天'}</Text>
          <Text type="secondary" style={{ marginLeft: 8, fontSize: 12 }}>
            {conversation.type === 'group'
              ? `${conversation.members?.length || 0} 人 · 群聊`
              : '私聊'}
          </Text>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {conversation.type === 'private' && !isInCall && (
            <Button type="text" icon={<PhoneOutlined />} onClick={handleCall} title="语音通话" style={{ fontSize: 18 }} />
          )}
          <Dropdown menu={moreMenu} placement="bottomRight">
            <Button type="text" icon={<EllipsisOutlined />} />
          </Dropdown>
        </div>
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: 16, background: '#f5f5f5' }}>
        {loading ? (
          <div style={{ textAlign: 'center', paddingTop: 100 }}><Spin /></div>
        ) : messages.length === 0 ? (
          <Empty description="暂无消息，开始聊天吧" />
        ) : (
          messages.map((msg: any) => (
            <MessageBubble key={msg.id || msg._id} message={msg} isOwn={msg.sender_id === user?.id} />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <MessageInput onSend={onSendMessage} />

      {showSearch && (
        <ChatHistorySearch
          visible={showSearch}
          conversationId={conversation.id}
          onClose={() => setShowSearch(false)}
        />
      )}
    </>
  )
}
