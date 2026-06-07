import React, { useState, useRef } from 'react'
import { Input, Button, Space, Upload, Tooltip, message as Msg } from 'antd'
import { SendOutlined, AudioOutlined, PictureOutlined, SmileOutlined } from '@ant-design/icons'
import { chatService } from '../../services/chatService'
import VoiceRecorder from './VoiceRecorder'

const { TextArea } = Input

interface MessageInputProps {
  onSend: (content: string, type: string) => void
}

export default function MessageInput({ onSend }: MessageInputProps) {
  const [text, setText] = useState('')
  const [showVoice, setShowVoice] = useState(false)
  const [uploading, setUploading] = useState(false)

  const handleSend = () => {
    const trimmed = text.trim()
    if (!trimmed) return
    onSend(trimmed, 'text')
    setText('')
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleVoiceSend = async (blob: Blob) => {
    try {
      const formData = new FormData()
      formData.append('file', blob, `voice-${Date.now()}.webm`)
      const res: any = await chatService.uploadFile(formData)
      if (res.code === 200) {
        const content = JSON.stringify({
          file_url: res.data.file_url,
          file_name: res.data.file_name,
          file_size: res.data.file_size,
        })
        onSend(content, 'voice')
      } else {
        Msg.error(res.message || '语音上传失败')
      }
    } catch (err: any) {
      Msg.error('语音上传失败')
    }
    setShowVoice(false)
  }

  const handleFileUpload = async (file: File) => {
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res: any = await chatService.uploadFile(formData)
      if (res.code === 200) {
        const type = file.type.startsWith('image/') ? 'image' : 'file'
        const content = JSON.stringify({
          file_url: res.data.file_url,
          file_name: res.data.file_name,
          file_size: res.data.file_size,
        })
        onSend(content, type)
        Msg.success('文件发送成功')
      } else {
        Msg.error(res.message || '上传失败')
      }
    } catch (err: any) {
      Msg.error(err?.message || '上传失败')
    } finally {
      setUploading(false)
    }
    return false // Prevent default Upload behavior
  }

  return (
    <div style={{ padding: '8px 16px', borderTop: '1px solid #f0f0f0', background: '#fff' }}>
      {showVoice ? (
        <VoiceRecorder onSend={handleVoiceSend} onCancel={() => setShowVoice(false)} />
      ) : (
        <>
          <Space style={{ marginBottom: 4 }}>
            <Tooltip title="发送图片或文件">
              <Upload
                showUploadList={false}
                beforeUpload={handleFileUpload}
                accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.zip,.rar,.txt"
                disabled={uploading}
              >
                <Button type="text" icon={<PictureOutlined />} size="small" loading={uploading} />
              </Upload>
            </Tooltip>
            <Tooltip title="语音消息">
              <Button type="text" icon={<AudioOutlined />} size="small" onClick={() => setShowVoice(true)} />
            </Tooltip>
            <Tooltip title="表情">
              <Button type="text" icon={<SmileOutlined />} size="small" />
            </Tooltip>
          </Space>
          <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
            <TextArea
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="输入消息，Enter 发送，Shift+Enter 换行"
              autoSize={{ minRows: 2, maxRows: 6 }}
              style={{ flex: 1 }}
            />
            <Button type="primary" icon={<SendOutlined />} onClick={handleSend} disabled={!text.trim()}>
              发送
            </Button>
          </div>
        </>
      )}
    </div>
  )
}
