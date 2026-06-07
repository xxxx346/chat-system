import React from 'react'
import { Tabs, List, Avatar, Button, Typography, Empty, message, Space } from 'antd'
import { UserOutlined, CheckOutlined, CloseOutlined, ReloadOutlined } from '@ant-design/icons'
import { friendService } from '../../services/friendService'
import dayjs from 'dayjs'

const { Text } = Typography

interface FriendRequestProps {
  requests: { sent: any[]; received: any[] }
  onHandled: () => void
  onResend: () => void
}

export default function FriendRequest({ requests, onHandled, onResend }: FriendRequestProps) {
  const handleRequest = async (id: number, action: 'accepted' | 'rejected') => {
    try {
      const res: any = await friendService.handleRequest(id, action)
      if (res.code === 200) {
        message.success(action === 'accepted' ? '已同意好友请求' : '已拒绝好友请求')
        onHandled()
      }
    } catch (err: any) {
      message.error(err?.message || '操作失败')
    }
  }

  const handleResend = async (id: number) => {
    try {
      const res: any = await friendService.resendRequest(id)
      if (res.code === 200) {
        message.success('已重新发送')
        onResend()
      }
    } catch (err: any) {
      message.error(err?.message || '操作失败')
    }
  }

  const receivedPending = requests.received.filter(r => r.status === 'pending')
  const receivedHistory = requests.received.filter(r => r.status !== 'pending')
  const sentPending = requests.sent.filter(r => r.status === 'pending')
  const sentHistory = requests.sent.filter(r => r.status !== 'pending')

  const tabItems = [
    {
      key: 'received',
      label: `收到的请求 (${receivedPending.length})`,
      children: (
        <div>
          {receivedPending.length > 0 && (
            <>
              <Text strong style={{ marginBottom: 8, display: 'block' }}>待处理</Text>
              <List
                dataSource={receivedPending}
                renderItem={(item: any) => (
                  <List.Item
                    actions={[
                      <Button type="primary" icon={<CheckOutlined />} onClick={() => handleRequest(item.id, 'accepted')}>同意</Button>,
                      <Button icon={<CloseOutlined />} onClick={() => handleRequest(item.id, 'rejected')}>拒绝</Button>,
                    ]}
                  >
                    <List.Item.Meta
                      avatar={<Avatar src={item.sender?.avatar} icon={<UserOutlined />} />}
                      title={item.sender?.nickname || item.sender?.username}
                      description={<Text type="secondary">{item.message || '想要添加你为好友'}</Text>}
                    />
                  </List.Item>
                )}
              />
            </>
          )}
          {receivedHistory.length > 0 && (
            <>
              <Text strong style={{ margin: '16px 0 8px', display: 'block' }}>历史记录</Text>
              <List
                dataSource={receivedHistory}
                renderItem={(item: any) => (
                  <List.Item>
                    <List.Item.Meta
                      avatar={<Avatar src={item.sender?.avatar} icon={<UserOutlined />} />}
                      title={item.sender?.nickname || item.sender?.username}
                      description={
                        <Space>
                          <Text type="secondary">{item.status === 'accepted' ? '已同意' : '已拒绝'}</Text>
                          <Text type="secondary" style={{ fontSize: 12 }}>{dayjs(item.created_at).format('MM-DD HH:mm')}</Text>
                        </Space>
                      }
                    />
                  </List.Item>
                )}
              />
            </>
          )}
          {receivedPending.length === 0 && receivedHistory.length === 0 && <Empty description="暂无好友请求" />}
        </div>
      ),
    },
    {
      key: 'sent',
      label: `发出的请求 (${sentPending.length})`,
      children: (
        <div>
          {sentPending.length > 0 && (
            <>
              <Text strong style={{ marginBottom: 8, display: 'block' }}>等待验证</Text>
              <List
                dataSource={sentPending}
                renderItem={(item: any) => (
                  <List.Item
                    actions={[
                      <Button icon={<ReloadOutlined />} onClick={() => handleResend(item.id)}>重新发送</Button>,
                    ]}
                  >
                    <List.Item.Meta
                      avatar={<Avatar src={item.receiver?.avatar} icon={<UserOutlined />} />}
                      title={item.receiver?.nickname || item.receiver?.username}
                      description={<Text type="secondary">{item.message || '等待验证'}</Text>}
                    />
                  </List.Item>
                )}
              />
            </>
          )}
          {sentHistory.length > 0 && (
            <>
              <Text strong style={{ margin: '16px 0 8px', display: 'block' }}>历史记录</Text>
              <List
                dataSource={sentHistory}
                renderItem={(item: any) => (
                  <List.Item>
                    <List.Item.Meta
                      avatar={<Avatar src={item.receiver?.avatar} icon={<UserOutlined />} />}
                      title={item.receiver?.nickname || item.receiver?.username}
                      description={
                        <Space>
                          <Text type="secondary">{item.status === 'accepted' ? '已同意' : '已拒绝'}</Text>
                          <Text type="secondary" style={{ fontSize: 12 }}>{dayjs(item.created_at).format('MM-DD HH:mm')}</Text>
                        </Space>
                      }
                    />
                  </List.Item>
                )}
              />
            </>
          )}
          {sentPending.length === 0 && sentHistory.length === 0 && <Empty description="暂无已发送的请求" />}
        </div>
      ),
    },
  ]

  return <Tabs items={tabItems} />
}
