import React from 'react'
import { Modal, Button, Space, Typography, message } from 'antd'
import { CodeOutlined, FileTextOutlined } from '@ant-design/icons'
import { chatService } from '../../services/chatService'

const { Text } = Typography

interface ChatHistoryDownloadProps {
  visible: boolean
  conversationId: number
  onClose: () => void
}

export default function ChatHistoryDownload({ visible, conversationId, onClose }: ChatHistoryDownloadProps) {
  const handleDownload = async (format: 'json' | 'txt') => {
    try {
      const res: any = await chatService.exportMessages(conversationId, format)
      const blob = res instanceof Blob ? res : new Blob([JSON.stringify(res)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `chat-history-${conversationId}.${format}`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      message.success('聊天记录下载成功')
      onClose()
    } catch (err) {
      message.error('下载失败')
    }
  }

  return (
    <Modal
      title="下载聊天记录"
      open={visible}
      onCancel={onClose}
      footer={null}
    >
      <div style={{ textAlign: 'center', padding: 24 }}>
        <Text type="secondary">选择导出格式</Text>
        <div style={{ marginTop: 16 }}>
          <Space size="large">
            <Button
              type="primary"
              icon={<CodeOutlined />}
              size="large"
              onClick={() => handleDownload('json')}
              style={{ width: 140, height: 80, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}
            >
              <span>JSON 格式</span>
              <span style={{ fontSize: 12, fontWeight: 'normal' }}>结构化数据</span>
            </Button>
            <Button
              icon={<FileTextOutlined />}
              size="large"
              onClick={() => handleDownload('txt')}
              style={{ width: 140, height: 80, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}
            >
              <span>TXT 格式</span>
              <span style={{ fontSize: 12, fontWeight: 'normal' }}>纯文本可读</span>
            </Button>
          </Space>
        </div>
      </div>
    </Modal>
  )
}
