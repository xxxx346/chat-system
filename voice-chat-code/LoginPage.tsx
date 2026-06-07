import React, { useState } from 'react'
import { Form, Input, Button, Card, Typography, message, Space } from 'antd'
import { UserOutlined, LockOutlined } from '@ant-design/icons'
import { useNavigate, Link } from 'react-router-dom'
import { authService } from '../services/authService'
import { useAuthStore } from '../store/authStore'

const { Title, Text } = Typography

export default function LoginPage() {
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const setAuth = useAuthStore((s) => s.setAuth)

  const onFinish = async (values: { username: string; password: string }) => {
    setLoading(true)
    try {
      const res: any = await authService.login(values)
      if (res.code === 200) {
        setAuth(res.data.token, res.data.user)
        message.success('登录成功')
        navigate('/', { replace: true })
      } else {
        message.error(res.message || '登录失败')
      }
    } catch (err: any) {
      message.error(err?.message || '登录失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: '#f0f2f5' }}>
      <Card style={{ width: 400, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <div style={{ textAlign: 'center' }}>
            <Title level={3}>在线聊天系统</Title>
            <Text type="secondary">欢迎回来，请登录您的账号</Text>
          </div>
          <Form onFinish={onFinish} size="large" autoComplete="off">
            <Form.Item name="username" rules={[{ required: true, message: '请输入用户名' }]}>
              <Input prefix={<UserOutlined />} placeholder="用户名" />
            </Form.Item>
            <Form.Item name="password" rules={[{ required: true, message: '请输入密码' }]}>
              <Input.Password prefix={<LockOutlined />} placeholder="密码" />
            </Form.Item>
            <Form.Item>
              <Button type="primary" htmlType="submit" loading={loading} block>
                登录
              </Button>
            </Form.Item>
          </Form>
          <div style={{ textAlign: 'center' }}>
            <Text>还没有账号？</Text>
            <Link to="/register">立即注册</Link>
          </div>
        </Space>
      </Card>
    </div>
  )
}
