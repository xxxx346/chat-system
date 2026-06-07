import React, { useState } from 'react'
import { Form, Input, Button, Card, Typography, message, Space } from 'antd'
import { UserOutlined, MailOutlined, LockOutlined } from '@ant-design/icons'
import { useNavigate, Link } from 'react-router-dom'
import { authService } from '../services/authService'
import { useAuthStore } from '../store/authStore'

const { Title, Text } = Typography

export default function RegisterPage() {
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const setAuth = useAuthStore((s) => s.setAuth)

  const onFinish = async (values: { username: string; email: string; password: string; nickname?: string }) => {
    setLoading(true)
    try {
      const res: any = await authService.register(values)
      if (res.code === 200) {
        setAuth(res.data.token, res.data.user)
        message.success('注册成功')
        navigate('/', { replace: true })
      } else {
        message.error(res.message || '注册失败')
      }
    } catch (err: any) {
      message.error(err?.message || '注册失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: '#f0f2f5' }}>
      <Card style={{ width: 400, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <div style={{ textAlign: 'center' }}>
            <Title level={3}>创建账号</Title>
            <Text type="secondary">注册一个新的账号</Text>
          </div>
          <Form onFinish={onFinish} size="large" autoComplete="off">
            <Form.Item name="username" rules={[{ required: true, message: '请输入用户名' }]}>
              <Input prefix={<UserOutlined />} placeholder="用户名" />
            </Form.Item>
            <Form.Item name="email" rules={[{ required: true, type: 'email', message: '请输入有效的邮箱' }]}>
              <Input prefix={<MailOutlined />} placeholder="邮箱" />
            </Form.Item>
            <Form.Item name="nickname">
              <Input prefix={<UserOutlined />} placeholder="昵称（可选）" />
            </Form.Item>
            <Form.Item name="password" rules={[
              { required: true, message: '请输入密码' },
              { min: 6, message: '密码至少6位' },
            ]}>
              <Input.Password prefix={<LockOutlined />} placeholder="密码" />
            </Form.Item>
            <Form.Item
              name="confirm"
              dependencies={['password']}
              rules={[
                { required: true, message: '请确认密码' },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue('password') === value) return Promise.resolve()
                    return Promise.reject(new Error('两次输入的密码不一致'))
                  },
                }),
              ]}
            >
              <Input.Password prefix={<LockOutlined />} placeholder="确认密码" />
            </Form.Item>
            <Form.Item>
              <Button type="primary" htmlType="submit" loading={loading} block>
                注册
              </Button>
            </Form.Item>
          </Form>
          <div style={{ textAlign: 'center' }}>
            <Text>已有账号？</Text>
            <Link to="/login">立即登录</Link>
          </div>
        </Space>
      </Card>
    </div>
  )
}
