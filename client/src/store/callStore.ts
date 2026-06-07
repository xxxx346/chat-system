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
  cleanupFn: (() => void) | null
  answerCall: (() => void) | null
  setCalling: (userId: number, username: string, avatar?: string) => void
  setRinging: (userId: number, username: string, avatar?: string) => void
  setConnected: () => void
  setIdle: () => void
  toggleMute: () => void
  toggleSpeaker: () => void
  tick: () => void
  setCleanupFn: (fn: (() => void) | null) => void
  setAnswerCall: (fn: (() => void) | null) => void
}

export const useCallStore = create<CallState>((set) => ({
  status: 'idle',
  peerUserId: null,
  peerUsername: '',
  peerAvatar: '',
  isMuted: false,
  isSpeakerOn: false,
  callTimer: 0,
  cleanupFn: null,
  answerCall: null,
  setCalling: (userId, username, avatar) =>
    set({ status: 'calling', peerUserId: userId, peerUsername: username, peerAvatar: avatar || '', callTimer: 0, isMuted: false, isSpeakerOn: false }),
  setRinging: (userId, username, avatar) =>
    set({ status: 'ringing', peerUserId: userId, peerUsername: username, peerAvatar: avatar || '', callTimer: 0, isMuted: false, isSpeakerOn: false }),
  setConnected: () => set({ status: 'connected', answerCall: null }),
  setIdle: () =>
    set({ status: 'idle', peerUserId: null, peerUsername: '', peerAvatar: '', callTimer: 0, isMuted: false, isSpeakerOn: false, answerCall: null }),
  toggleMute: () => set((s) => ({ isMuted: !s.isMuted })),
  toggleSpeaker: () => set((s) => ({ isSpeakerOn: !s.isSpeakerOn })),
  tick: () => set((s) => ({ callTimer: s.callTimer + 1 })),
  setCleanupFn: (fn) => set({ cleanupFn: fn }),
  setAnswerCall: (fn) => set({ answerCall: fn }),
}))
