import React, { useState } from 'react'
import { Modal, Input, List, Typography, Empty, Spin } from 'antd'
import { SearchOutlined } from '@ant-design/icons'
import { chatService } from '../../services/chatService'
import dayjs from 'dayjs'

const { Text } = Typography

interface ChatHistorySearchProps {
  visible: boolean
  conversationId: number
  onClose: () => void
}

export default function ChatHistorySearch({ visible, conversationId, onClose }: ChatHistorySearchProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)

  const handleSearch = async () => {
    if (!query.trim()) return
    setLoading(true)
    setSearched(true)
    try {
      const res: any = await chatService.searchMessages(conversationId, query)
      if (res.code === 200) setResults(res.data || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal
      title="搜索聊天记录"
      open={visible}
      onCancel={onClose}
      footer={null}
      width={500}
    >
      <Input.Search
        placeholder="输入搜索关键词"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onSearch={handleSearch}
        enterButton={<><SearchOutlined /> 搜索</>}
        size="large"
      />
      <div style={{ marginTop: 16, maxHeight: 400, overflow: 'auto' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 40 }}><Spin /></div>
        ) : searched && results.length === 0 ? (
          <Empty description="未找到相关消息" />
        ) : (
          <List
            dataSource={results}
            renderItem={(item: any) => (
              <List.Item style={{ padding: '8px 0' }}>
                <div>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {item.sender?.nickname || item.sender?.username} · {dayjs(item.created_at).format('MM-DD HH:mm')}
                  </Text>
                  <div style={{ marginTop: 2 }}>
                    <Text>{item.content}</Text>
                  </div>
                </div>
              </List.Item>
            )}
          />
        )}
      </div>
    </Modal>
  )
}
