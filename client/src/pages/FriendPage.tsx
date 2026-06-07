import React, { useEffect, useState } from 'react'
import { Layout, Tabs, Badge, message } from 'antd'
import { TeamOutlined, UserAddOutlined, BellOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { useFriendStore } from '../store/friendStore'
import { friendService } from '../services/friendService'
import { chatService } from '../services/chatService'
import FriendList from '../components/friend/FriendList'
import FriendSearch from '../components/friend/FriendSearch'
import FriendRequest from '../components/friend/FriendRequest'

const { Content } = Layout

export default function FriendPage() {
  const { groups, requests, setGroups, setRequests } = useFriendStore()
  const [activeTab, setActiveTab] = useState('friends')
  const navigate = useNavigate()

  useEffect(() => {
    loadFriends()
    loadRequests()
  }, [])

  const loadFriends = async () => {
    try {
      const res: any = await friendService.getFriends()
      if (res.code === 200) setGroups(res.data || [])
    } catch (err) { /* ignore */ }
  }

  const loadRequests = async () => {
    try {
      const res: any = await friendService.getRequests()
      if (res.code === 200) setRequests(res.data)
    } catch (err) { /* ignore */ }
  }

  const handleMoveFriend = async (friendId: number, groupId: number | null) => {
    try {
      const res: any = await friendService.moveFriend(friendId, groupId)
      if (res.code === 200) loadFriends()
    } catch (err) { /* ignore */ }
  }

  const handleDeleteFriend = async (friendId: number) => {
    try {
      const res: any = await friendService.deleteFriend(friendId)
      if (res.code === 200) loadFriends()
    } catch (err) { /* ignore */ }
  }

  const handleRequestHandled = () => {
    loadRequests()
    loadFriends()
  }

  const handleStartChat = async (friendUserId: number) => {
    try {
      const res: any = await chatService.createConversation({
        type: 'private',
        member_ids: [friendUserId],
      })
      if (res.code === 200) {
        navigate(`/chat/${res.data.id}`)
      }
    } catch (err) {
      message.error('创建会话失败')
    }
  }

  const pendingCount = requests.received.filter(r => r.status === 'pending').length

  const tabItems = [
    {
      key: 'friends',
      label: <span><TeamOutlined /> 好友列表</span>,
      children: <FriendList
        groups={groups}
        onMoveFriend={handleMoveFriend}
        onDeleteFriend={handleDeleteFriend}
        onStartChat={handleStartChat}
        onRefresh={loadFriends}
      />,
    },
    {
      key: 'search',
      label: <span><UserAddOutlined /> 添加好友</span>,
      children: <FriendSearch onRequestSent={loadRequests} />,
    },
    {
      key: 'requests',
      label: <span><Badge count={pendingCount} size="small"><BellOutlined /></Badge> 好友请求</span>,
      children: <FriendRequest
        requests={requests}
        onHandled={handleRequestHandled}
        onResend={loadRequests}
      />,
    },
  ]

  return (
    <Layout style={{ height: '100%', background: '#fff' }}>
      <Content style={{ padding: 24, overflow: 'auto' }}>
        <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabItems} />
      </Content>
    </Layout>
  )
}
