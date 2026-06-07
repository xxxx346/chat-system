import { create } from 'zustand'

export type CallStatus = 'idle' | 'calling' | 'ringing' | 'connected'

interface CallState {
  status: CallStatus
  peerUserId: number | null
  peerUsername: string
  peerAvatar: string
  isMuted: boolean
  isSpeakerOn: boolean
  callTimer: number
  setCalling: (userId: number, username: string, avatar?: string) => void
  setRinging: (userId: number, username: string, avatar?: string) => void
  setConnected: () => void
  setIdle: () => void
  toggleMute: () => void
  toggleSpeaker: () => void
  tick: () => void
}

export const useCallStore = create<CallState>((set) => ({
  status: 'idle',
  peerUserId: null,
  peerUsername: '',
  peerAvatar: '',
  isMuted: false,
  isSpeakerOn: false,
  callTimer: 0,
  setCalling: (userId, username, avatar) =>
    set({ status: 'calling', peerUserId: userId, peerUsername: username, peerAvatar: avatar || '', callTimer: 0, isMuted: false, isSpeakerOn: false }),
  setRinging: (userId, username, avatar) =>
    set({ status: 'ringing', peerUserId: userId, peerUsername: username, peerAvatar: avatar || '', callTimer: 0, isMuted: false, isSpeakerOn: false }),
  setConnected: () => set({ status: 'connected' }),
  setIdle: () =>
    set({ status: 'idle', peerUserId: null, peerUsername: '', peerAvatar: '', callTimer: 0, isMuted: false, isSpeakerOn: false }),
  toggleMute: () => set((s) => ({ isMuted: !s.isMuted })),
  toggleSpeaker: () => set((s) => ({ isSpeakerOn: !s.isSpeakerOn })),
  tick: () => set((s) => ({ callTimer: s.callTimer + 1 })),
}))
