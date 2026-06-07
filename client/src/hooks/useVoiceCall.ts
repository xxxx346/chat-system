import { useEffect, useRef, useCallback } from 'react'
import { socketService } from '../services/socketService'
import { useAuthStore } from '../store/authStore'
import { useCallStore } from '../store/callStore'

const RTC_CONFIG = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
}

// Module-level refs so they survive across renders and closures
const pcRef = { current: null as RTCPeerConnection | null }
const localStreamRef = { current: null as MediaStream | null }
const pendingCandidates: RTCIceCandidateInit[] = []
const makingOffer = { current: false }
const pendingOffer: { current: any } = { current: null }

function cleanup() {
  makingOffer.current = false
  pendingOffer.current = null
  if (pcRef.current) {
    pcRef.current.onicecandidate = null
    pcRef.current.ontrack = null
    pcRef.current.oniceconnectionstatechange = null
    pcRef.current.close()
    pcRef.current = null
  }
  if (localStreamRef.current) {
    localStreamRef.current.getTracks().forEach((t) => t.stop())
    localStreamRef.current = null
  }
  pendingCandidates.length = 0
}

async function createPC(remotePeerId: number) {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
  localStreamRef.current = stream

  const pc = new RTCPeerConnection(RTC_CONFIG)
  pcRef.current = pc

  stream.getTracks().forEach((track) => pc.addTrack(track, stream))

  pc.onicecandidate = (e) => {
    if (e.candidate && remotePeerId) {
      socketService.sendVoiceIceCandidate({
        targetUserId: remotePeerId,
        candidate: e.candidate.toJSON(),
      })
    }
  }

  let audioEl = document.getElementById('remote-audio') as HTMLAudioElement
  if (!audioEl) {
    audioEl = document.createElement('audio')
    audioEl.id = 'remote-audio'
    audioEl.autoplay = true
    document.body.appendChild(audioEl)
  }

  pc.ontrack = (e) => {
    audioEl.srcObject = e.streams[0]
  }

  pc.oniceconnectionstatechange = () => {
    if (pc.iceConnectionState === 'disconnected' || pc.iceConnectionState === 'failed') {
      endCallInternal()
    }
  }

  // Flush any candidates queued before remote description
  if (pc.currentRemoteDescription && pendingCandidates.length > 0) {
    const queued = pendingCandidates.splice(0)
    for (const c of queued) {
      pc.addIceCandidate(new RTCIceCandidate(c)).catch(() => {})
    }
  }

  return pc
}

function flushCandidates() {
  if (!pcRef.current || !pcRef.current.remoteDescription || pendingCandidates.length === 0) return
  const queued = pendingCandidates.splice(0)
  for (const c of queued) {
    pcRef.current.addIceCandidate(new RTCIceCandidate(c)).catch(() => {})
  }
}

function endCallInternal() {
  const state = useCallStore.getState()
  if (state.peerUserId) {
    socketService.sendVoiceEnd({ targetUserId: state.peerUserId })
  }
  cleanup()
  useCallStore.getState().setIdle()
}

// Called from VoiceCall UI when user clicks Accept ✅
export function acceptIncomingCall() {
  const pending = pendingOffer.current
  if (!pending) return
  pendingOffer.current = null
  ;(async () => {
    try {
      const pc = await createPC(pending.fromUserId)
      await pc.setRemoteDescription(new RTCSessionDescription(pending.offer))
      flushCandidates()
      const answer = await pc.createAnswer()
      await pc.setLocalDescription(answer)
      socketService.sendVoiceAnswer({
        targetUserId: pending.fromUserId,
        answer: pc.localDescription?.toJSON(),
      })
      useCallStore.getState().setConnected()
    } catch (err) {
      console.error('Failed to accept call:', err)
      cleanup()
      useCallStore.getState().setIdle()
    }
  })()
}

// Called from VoiceCall UI when user clicks Reject ❌ / Hang Up
export function hangUpCall() {
  endCallInternal()
}

async function initiateCall(targetUserId: number) {
  if (makingOffer.current) return
  makingOffer.current = true
  try {
    const pc = await createPC(targetUserId)
    const offer = await pc.createOffer()
    await pc.setLocalDescription(offer)
    socketService.sendVoiceOffer({
      targetUserId,
      offer: pc.localDescription?.toJSON(),
    })
  } catch (err) {
    console.error('Call failed:', err)
    cleanup()
    useCallStore.getState().setIdle()
  } finally {
    makingOffer.current = false
  }
}

export function useVoiceCall() {
  const user = useAuthStore((s) => s.user)

  // ======== Socket listeners ========
  useEffect(() => {
    if (!user) return

    const onOffer = (data: any) => {
      if (!data.fromUserId || !data.offer || makingOffer.current) return
      if (pcRef.current) {
        socketService.sendVoiceEnd({ targetUserId: data.fromUserId })
        return
      }

      // Save offer for later acceptance/rejection
      pendingOffer.current = {
        fromUserId: data.fromUserId,
        fromUsername: data.fromUsername,
        fromAvatar: data.fromAvatar || '',
        offer: data.offer,
      }

      useCallStore.getState().setRinging(data.fromUserId, data.fromUsername, data.fromAvatar)
    }

    const onAnswer = async (data: any) => {
      if (!pcRef.current || !data.answer) return
      try {
        await pcRef.current.setRemoteDescription(new RTCSessionDescription(data.answer))
        flushCandidates()
        useCallStore.getState().setConnected()
      } catch (err) {
        console.error('Failed to handle answer:', err)
      }
    }

    const onIce = (data: any) => {
      if (!data.candidate) return
      if (!pcRef.current || !pcRef.current.remoteDescription) {
        pendingCandidates.push(data.candidate)
        return
      }
      pcRef.current.addIceCandidate(new RTCIceCandidate(data.candidate)).catch(() => {})
    }

    const onEnd = () => {
      pendingOffer.current = null
      cleanup()
      useCallStore.getState().setIdle()
    }

    socketService.onVoiceOffer(onOffer)
    socketService.onVoiceAnswer(onAnswer)
    socketService.onVoiceIceCandidate(onIce)
    socketService.onVoiceEnd(onEnd)

    return () => {
      socketService.offVoiceOffer(onOffer)
      socketService.offVoiceAnswer(onAnswer)
      socketService.offVoiceIceCandidate(onIce)
      socketService.offVoiceEnd(onEnd)
    }
  }, [user])

  // ======== Watch for 'calling' state to initiate outgoing call ========
  useEffect(() => {
    const unsub = useCallStore.subscribe((state, prev) => {
      if (state.status === 'calling' && prev.status !== 'calling' && state.peerUserId) {
        // Don't await - fire and forget
        initiateCall(state.peerUserId)
      }
    })
    return unsub
  }, [])
}
