import React from 'react'
import { Typography, Card, Row, Col, Statistic } from 'antd'
import { MessageOutlined, TeamOutlined, UserOutlined } from '@ant-design/icons'
import { useAuthStore } from '../store/authStore'

const { Title, Paragraph } = Typography

export default function HomePage() {
  const user = useAuthStore((s) => s.user)

  return (
    <div style={{ padding: 24 }}>
      <Title level={4}>欢迎回来，{user?.nickname || user?.username}</Title>
      <Paragraph type="secondary">选择一个功能开始使用</Paragraph>
      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col span={8}>
          <Card hoverable>
            <Statistic title="即时通讯" prefix={<MessageOutlined />} value="私聊/群聊" valueStyle={{ fontSize: 16 }} />
          </Card>
        </Col>
        <Col span={8}>
          <Card hoverable>
            <Statistic title="好友管理" prefix={<TeamOutlined />} value="分组管理" valueStyle={{ fontSize: 16 }} />
          </Card>
        </Col>
        <Col span={8}>
          <Card hoverable>
            <Statistic title="在线状态" prefix={<UserOutlined />} value={'在线'} valueStyle={{ fontSize: 16 }} />
          </Card>
        </Col>
      </Row>
    </div>
  )
}
