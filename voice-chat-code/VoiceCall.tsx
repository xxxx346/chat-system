import { useEffect, useRef } from 'react'
import { Modal, Button, Typography, Avatar, Space } from 'antd'
import {
  PhoneOutlined, CloseOutlined, SoundOutlined,
  AudioMutedOutlined, PauseCircleOutlined,
} from '@ant-design/icons'
import { useCallStore } from '../../store/callStore'

const { Text, Title } = Typography

export default function VoiceCall() {
  const status = useCallStore((s) => s.status)
  const peerUsername = useCallStore((s) => s.peerUsername)
  const peerAvatar = useCallStore((s) => s.peerAvatar)
  const isMuted = useCallStore((s) => s.isMuted)
  const isSpeakerOn = useCallStore((s) => s.isSpeakerOn)
  const callTimer = useCallStore((s) => s.callTimer)
  const toggleMute = useCallStore((s) => s.toggleMute)
  const toggleSpeaker = useCallStore((s) => s.toggleSpeaker)
  const setIdle = useCallStore((s) => s.setIdle)
  const tick = useCallStore((s) => s.tick)

  const timerRef = useRef<ReturnType<typeof setInterval>>()

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60)
    const sec = s % 60
    return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`
  }

  useEffect(() => {
    if (status === 'connected') {
      timerRef.current = setInterval(() => tick(), 1000)
    } else {
      if (timerRef.current) clearInterval(timerRef.current)
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [status, tick])

  if (status === 'idle') return null

  return (
    <>
      {/* Incoming / Outgoing call modal */}
      {(status === 'ringing' || status === 'calling') && (
        <Modal
          open
          closable={false}
          footer={null}
          width={360}
          centered
          maskClosable={false}
          destroyOnClose
        >
          <div style={{ textAlign: 'center', padding: '24px 0' }}>
            <Avatar size={80} src={peerAvatar} icon={<PhoneOutlined />} style={{ marginBottom: 16 }} />
            <Title level={4} style={{ margin: 0 }}>{peerUsername}</Title>
            <Text type="secondary" style={{ display: 'block', marginTop: 8, fontSize: 16 }}>
              {status === 'calling' ? '📞 正在呼叫...' : '🔔 邀请你语音通话'}
            </Text>
            <Space size="large" style={{ marginTop: 32 }}>
              <Button
                danger
                size="large"
                shape="circle"
                icon={<CloseOutlined />}
                onClick={() => setIdle()}
                style={{ width: 56, height: 56 }}
              />
            </Space>
          </div>
        </Modal>
      )}

      {/* In-call overlay */}
      {status === 'connected' && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
          zIndex: 9999,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          color: '#fff',
        }}>
          <Avatar size={100} src={peerAvatar} icon={<PhoneOutlined />}
            style={{ marginBottom: 20, border: '3px solid #52c41a' }} />
          <Title level={3} style={{ color: '#fff', margin: 0 }}>{peerUsername}</Title>
          <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 18, marginTop: 8 }}>
            {formatTime(callTimer)}
          </Text>
          <Space size="large" style={{ marginTop: 48 }}>
            <Button
              size="large" shape="circle"
              icon={isMuted ? <AudioMutedOutlined /> : <SoundOutlined />}
              onClick={toggleMute}
              style={{
                width: 56, height: 56,
                background: isMuted ? '#ff4d4f' : 'rgba(255,255,255,0.15)',
                border: 'none', color: '#fff',
              }}
            />
            <Button
              danger size="large" shape="circle"
              icon={<PauseCircleOutlined />}
              onClick={() => setIdle()}
              style={{ width: 72, height: 72, background: '#ff4d4f', border: 'none' }}
            />
            <Button
              size="large" shape="circle"
              icon={<SoundOutlined />}
              onClick={toggleSpeaker}
              style={{
                width: 56, height: 56,
                background: isSpeakerOn ? '#1677ff' : 'rgba(255,255,255,0.15)',
                border: 'none', color: '#fff',
              }}
            />
          </Space>
          <Text style={{ color: 'rgba(255,255,255,0.4)', marginTop: 16, fontSize: 12 }}>
            {isMuted ? '已静音' : isSpeakerOn ? '扬声器' : '听筒'}
          </Text>
        </div>
      )}
    </>
  )
}
