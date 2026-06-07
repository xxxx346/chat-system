import React, { useEffect, useState } from 'react'
import { Layout, Menu, Avatar, Dropdown, Typography, Badge, Button } from 'antd'
import {
  MessageOutlined, TeamOutlined, HomeOutlined,
  LogoutOutlined, UserOutlined, BellOutlined,
} from '@ant-design/icons'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { socketService } from '../../services/socketService'
import { friendService } from '../../services/friendService'
import { authService } from '../../services/authService'
import { useFriendStore } from '../../store/friendStore'
import { useVoiceCall } from '../../hooks/useVoiceCall'
import VoiceCall from '../chat/VoiceCall'

const { Sider, Content, Header } = Layout
const { Text } = Typography

export default function MainLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, token, logout } = useAuthStore()
  const { requests, setRequests } = useFriendStore()
  const [collapsed, setCollapsed] = useState(false)
  const [friendRequestCount, setFriendRequestCount] = useState(0)

  // Voice call WebRTC hook (registers socket listeners in MainLayout, not in child components)
  useVoiceCall()

  useEffect(() => {
    if (token && user) {
      socketService.connect(user.id, user.username)

      socketService.onUserOnline((data) => {
        console.log('User online:', data)
      })
      socketService.onUserOffline((data) => {
        console.log('User offline:', data)
      })

      loadFriendRequests()
    }
    return () => { socketService.disconnect() }
  }, [token, user])

  const loadFriendRequests = async () => {
    try {
      const res: any = await friendService.getRequests()
      if (res.code === 200) {
        setRequests(res.data)
        const pending = res.data.received.filter((r: any) => r.status === 'pending')
        setFriendRequestCount(pending.length)
      }
    } catch (err) { /* ignore */ }
  }

  const handleLogout = async () => {
    try { await authService.logout() } catch (e) { /* ignore */ }
    socketService.disconnect()
    logout()
    navigate('/login')
  }

  const menuItems = [
    { key: '/', icon: <HomeOutlined />, label: '首页' },
    { key: '/chat', icon: <MessageOutlined />, label: '聊天' },
    {
      key: '/friends',
      icon: <Badge count={friendRequestCount} size="small"><TeamOutlined /></Badge>,
      label: '好友',
    },
  ]

  const userMenu = {
    items: [
      { key: 'profile', icon: <UserOutlined />, label: `个人资料 (${user?.username})` },
      { type: 'divider' as const },
      { key: 'logout', icon: <LogoutOutlined />, label: '退出登录', danger: true },
    ],
    onClick: ({ key }: { key: string }) => {
      if (key === 'logout') handleLogout()
    },
  }

  return (
    <>
      <Layout style={{ height: '100vh' }}>
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        style={{ background: '#fff' }}
        theme="light"
      >
        <div style={{ height: 64, display: 'flex', alignItems: 'center', justifyContent: 'center', borderBottom: '1px solid #f0f0f0' }}>
          {!collapsed && <Text strong style={{ fontSize: 16 }}>在线聊天</Text>}
          {collapsed && <MessageOutlined style={{ fontSize: 20, color: '#1677ff' }} />}
        </div>
        <Menu
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
          style={{ borderRight: 0 }}
        />
      </Sider>
      <Layout>
        <Header style={{ background: '#fff', padding: '0 24px', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', borderBottom: '1px solid #f0f0f0' }}>
          <Dropdown menu={userMenu} placement="bottomRight">
            <div style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Avatar src={user?.avatar} icon={<UserOutlined />} />
              <Text>{user?.nickname || user?.username}</Text>
            </div>
          </Dropdown>
        </Header>
        <Content style={{ overflow: 'auto', background: '#f5f5f5' }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
    <VoiceCall />
    </>
  )
}
