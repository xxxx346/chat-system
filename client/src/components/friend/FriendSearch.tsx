import React, { useState } from 'react'
import { Input, List, Avatar, Button, Typography, Empty, Spin, message } from 'antd'
import { UserOutlined, UserAddOutlined, CheckOutlined } from '@ant-design/icons'
import { friendService } from '../../services/friendService'

const { Text } = Typography

interface FriendSearchProps {
  onRequestSent: () => void
}

export default function FriendSearch({ onRequestSent }: FriendSearchProps) {
  const [query, setQuery] = useState('')
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const [sending, setSending] = useState<number | null>(null)

  const handleSearch = async () => {
    if (!query.trim()) return
    setLoading(true)
    setSearched(true)
    try {
      const res: any = await friendService.searchUsers(query)
      if (res.code === 200) setUsers(res.data || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleAddFriend = async (userId: number) => {
    setSending(userId)
    try {
      const res: any = await friendService.sendRequest(userId, `你好，我是${query}，想加你为好友`)
      if (res.code === 200) {
        message.success('好友请求已发送')
        onRequestSent()
      } else {
        message.error(res.message || '发送失败')
      }
    } catch (err: any) {
      message.error(err?.message || '发送失败')
    } finally {
      setSending(null)
    }
  }

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Text strong style={{ fontSize: 16 }}>搜索用户</Text>
      </div>
      <Input.Search
        placeholder="输入用户名或昵称搜索"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onSearch={handleSearch}
        enterButton="搜索"
        size="large"
        style={{ marginBottom: 16 }}
      />
      <div style={{ maxHeight: 500, overflow: 'auto' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 40 }}><Spin /></div>
        ) : searched && users.length === 0 ? (
          <Empty description="未找到相关用户" />
        ) : (
          <List
            dataSource={users}
            renderItem={(user: any) => (
              <List.Item
                actions={[
                  user.is_friend ? (
                    <Button type="default" icon={<CheckOutlined />} disabled>已是好友</Button>
                  ) : (
                    <Button
                      type="primary"
                      icon={<UserAddOutlined />}
                      loading={sending === user.id}
                      onClick={() => handleAddFriend(user.id)}
                    >
                      添加好友
                    </Button>
                  ),
                ]}
              >
                <List.Item.Meta
                  avatar={<Avatar src={user.avatar} icon={<UserOutlined />} size="large" />}
                  title={user.nickname || user.username}
                  description={<Text type="secondary">@{user.username}</Text>}
                />
              </List.Item>
            )}
          />
        )}
      </div>
    </div>
  )
}
