import React, { useState, useRef } from 'react'
import { Button, Space, Typography } from 'antd'
import { AudioOutlined, StopOutlined, SendOutlined, CloseOutlined } from '@ant-design/icons'

const { Text } = Typography

interface VoiceRecorderProps {
  onSend: (blob: Blob) => void
  onCancel: () => void
}

export default function VoiceRecorder({ onSend, onCancel }: VoiceRecorderProps) {
  const [recording, setRecording] = useState(false)
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null)
  const [duration, setDuration] = useState(0)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef = useRef<ReturnType<typeof setInterval>>()

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' })
      mediaRecorderRef.current = mediaRecorder
      chunksRef.current = []

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
        setRecordedBlob(blob)
        stream.getTracks().forEach(t => t.stop())
      }

      mediaRecorder.start()
      setRecording(true)
      setDuration(0)
      timerRef.current = setInterval(() => setDuration(d => d + 1), 1000)
    } catch (err) {
      console.error('Microphone access denied:', err)
    }
  }

  const stopRecording = () => {
    mediaRecorderRef.current?.stop()
    setRecording(false)
    clearInterval(timerRef.current)
  }

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0' }}>
      {!recording && !recordedBlob && (
        <Button type="primary" icon={<AudioOutlined />} onClick={startRecording}>
          开始录音
        </Button>
      )}
      {recording && (
        <Space>
          <Button danger icon={<StopOutlined />} onClick={stopRecording}>停止</Button>
          <Text style={{ color: '#ff4d4f' }}>● 录音中 {formatTime(duration)}</Text>
        </Space>
      )}
      {recordedBlob && !recording && (
        <Space>
          <audio controls src={URL.createObjectURL(recordedBlob)} style={{ height: 36 }} />
          <Button type="primary" icon={<SendOutlined />} onClick={() => onSend(recordedBlob)}>发送</Button>
          <Button icon={<CloseOutlined />} onClick={onCancel}>取消</Button>
        </Space>
      )}
    </div>
  )
}
