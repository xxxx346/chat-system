import React from 'react'
import { SoundOutlined } from '@ant-design/icons'

interface VoicePlayerProps {
  fileUrl: string
  fileSize?: number
}

export default function VoicePlayer({ fileUrl, fileSize }: VoicePlayerProps) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <SoundOutlined style={{ fontSize: 20 }} />
      <audio controls src={fileUrl} style={{ height: 36, maxWidth: 200 }} />
      <span style={{ fontSize: 12, color: '#999' }}>
        {fileSize ? `${(fileSize / 1024).toFixed(1)} KB` : ''}
      </span>
    </div>
  )
}
