import React from 'react'
import { List, Avatar, Typography, Badge, Input, Button } from 'antd'
import { MessageOutlined, UserOutlined, TeamOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'

const { Text } = Typography

interface ChatListProps {
  conversations: any[]
  selectedId?: number
  onSelect: (id: number) => void
  onCreateGroup?: () => void
}

export default function ChatList({ conversations, selectedId, onSelect, onCreateGroup }: ChatListProps) {
  return (
    <div>
      <div style={{ padding: '12px 16px', borderBottom: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text strong style={{ fontSize: 16 }}>会话列表</Text>
        <Button type="text" icon={<TeamOutlined />} onClick={onCreateGroup} title="创建群聊" />
      </div>
      <div style={{ padding: '8px 12px' }}>
        <Input.Search placeholder="搜索会话" size="small" />
      </div>
      <List
        dataSource={conversations}
        renderItem={(conv: any) => (
          <List.Item
            onClick={() => onSelect(conv.id)}
            style={{
              cursor: 'pointer',
              padding: '10px 16px',
              background: selectedId === conv.id ? '#e6f4ff' : 'transparent',
              borderBottom: '1px solid #f5f5f5',
            }}
          >
            <List.Item.Meta
              avatar={
                <Badge count={conv.unread} size="small">
                  <Avatar src={conv.avatar} icon={conv.type === 'group' ? <MessageOutlined /> : <UserOutlined />} />
                </Badge>
              }
              title={
                <Text strong style={{ fontSize: 14 }}>
                  {conv.name || `会话 ${conv.id}`}
                </Text>
              }
              description={
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text type="secondary" style={{ fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 180 }}>
                    {conv.last_message || '暂无消息'}
                  </Text>
                  {conv.last_message_time && (
                    <Text type="secondary" style={{ fontSize: 11, flexShrink: 0 }}>
                      {dayjs(conv.last_message_time).format('HH:mm')}
                    </Text>
                  )}
                </div>
              }
            />
          </List.Item>
        )}
      />
    </div>
  )
}
