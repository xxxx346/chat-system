import React from 'react'
import { Avatar, Typography, Image } from 'antd'
import { UserOutlined, SoundOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import { useChatStore } from '../../store/chatStore'

const { Text } = Typography

interface MessageBubbleProps {
  message: any
  isOwn: boolean
}

export default function MessageBubble({ message, isOwn }: MessageBubbleProps) {
  const readByOthers = useChatStore((s) => s.readByOthers)
  const isRead = !!(message.id && readByOthers[message.id])

  const renderContent = () => {
    switch (message.type) {
      case 'text':
        return <div style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{message.content}</div>

      case 'image':
        return <Image src={message.file_url || message.content} style={{ maxWidth: 300, maxHeight: 300, borderRadius: 8 }} />

      case 'voice':
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <SoundOutlined style={{ fontSize: 20 }} />
            <audio controls src={message.file_url} style={{ height: 36, maxWidth: 200 }} />
            {message.file_size && <Text type="secondary" style={{ fontSize: 12 }}>{(message.file_size / 1024).toFixed(1)}KB</Text>}
          </div>
        )

      case 'file': {
        let fileInfo = { file_name: '文件', file_url: '', file_size: 0 }
        try { fileInfo = JSON.parse(message.content) } catch { /* use defaults */ }
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <a href={fileInfo.file_url || message.file_url} target="_blank" rel="noreferrer" style={{ color: isOwn ? '#fff' : '#1677ff' }}>
              {fileInfo.file_name || message.file_name || '文件'}
            </a>
            <Text type="secondary" style={{ fontSize: 12, color: isOwn ? 'rgba(255,255,255,0.65)' : undefined }}>
              {fileInfo.file_size ? `${(fileInfo.file_size / 1024).toFixed(1)}KB` : message.file_size ? `${(message.file_size / 1024).toFixed(1)}KB` : ''}
            </Text>
          </div>
        )
      }

      case 'system':
        return <Text type="secondary" style={{ fontSize: 12 }}>{message.content}</Text>

      default:
        return <Text>{message.content}</Text>
    }
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: isOwn ? 'row-reverse' : 'row',
      alignItems: 'flex-end',
      marginBottom: 16,
      gap: 8,
    }}>
      <Avatar src={message.sender?.avatar} icon={<UserOutlined />} style={{ flexShrink: 0 }} />
      <div style={{
        maxWidth: '60%',
        background: isOwn ? '#1677ff' : '#fff',
        color: isOwn ? '#fff' : '#000',
        padding: '8px 12px',
        borderRadius: 12,
        borderBottomRightRadius: isOwn ? 4 : 12,
        borderBottomLeftRadius: isOwn ? 12 : 4,
        boxShadow: '0 1px 2px rgba(0,0,0,0.08)',
      }}>
        {!isOwn && message.sender?.nickname && (
          <Text style={{ fontSize: 11, color: '#999', display: 'block', marginBottom: 2 }}>
            {message.sender.nickname}
          </Text>
        )}
        {renderContent()}
        <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 4, marginTop: 4 }}>
          <Text style={{ fontSize: 11, color: isOwn ? 'rgba(255,255,255,0.65)' : '#999' }}>
            {dayjs(message.created_at).format('HH:mm')}
          </Text>
          {isOwn && (
            <Text style={{ fontSize: 11, color: isRead ? '#69b1ff' : 'rgba(255,255,255,0.45)' }}>
              {isRead ? '✓✓' : '✓'}
            </Text>
          )}
        </div>
      </div>
    </div>
  )
}
