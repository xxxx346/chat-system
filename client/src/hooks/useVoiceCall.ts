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

export function useVoiceCall() {
  const user = useAuthStore((s) => s.user)

  const pcRef = useRef<RTCPeerConnection | null>(null)
  const localStreamRef = useRef<MediaStream | null>(null)
  const pendingCandidatesRef = useRef<RTCIceCandidateInit[]>([])
  const makingOfferRef = useRef(false)

  const cleanup = useCallback(() => {
    makingOfferRef.current = false
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
    pendingCandidatesRef.current = []
  }, [])

  const endCall = useCallback(() => {
    const state = useCallStore.getState()
    if (state.peerUserId) {
      socketService.sendVoiceEnd({ targetUserId: state.peerUserId })
    }
    cleanup()
    useCallStore.getState().setIdle()
  }, [cleanup])

  const createPC = useCallback(async (remotePeerId: number) => {
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
        endCall()
      }
    }

    return pc
  }, [endCall])

  const flushCandidates = useCallback(() => {
    if (!pcRef.current || !pcRef.current.remoteDescription) return
    const pending = pendingCandidatesRef.current.splice(0)
    for (const c of pending) {
      pcRef.current.addIceCandidate(new RTCIceCandidate(c)).catch(() => {})
    }
  }, [])

  const initiateCall = useCallback(async (targetUserId: number) => {
    if (makingOfferRef.current) return
    makingOfferRef.current = true
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
      makingOfferRef.current = false
    }
  }, [createPC, cleanup])

  // ======== Socket listeners (registered once, always alive) ========
  useEffect(() => {
    if (!user) return

    const onOffer = async (data: any) => {
      if (!data.fromUserId || !data.offer || makingOfferRef.current) return
      if (pcRef.current) {
        socketService.sendVoiceEnd({ targetUserId: data.fromUserId })
        return
      }

      const store = useCallStore.getState()
      store.setRinging(data.fromUserId, data.fromUsername, data.fromAvatar)

      try {
        const pc = await createPC(data.fromUserId)
        await pc.setRemoteDescription(new RTCSessionDescription(data.offer))
        flushCandidates()
        const answer = await pc.createAnswer()
        await pc.setLocalDescription(answer)
        socketService.sendVoiceAnswer({
          targetUserId: data.fromUserId,
          answer: pc.localDescription?.toJSON(),
        })
        store.setConnected()
      } catch (err) {
        console.error('Failed to handle offer:', err)
        useCallStore.getState().setIdle()
        cleanup()
      }
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
        pendingCandidatesRef.current.push(data.candidate)
        return
      }
      pcRef.current.addIceCandidate(new RTCIceCandidate(data.candidate)).catch(() => {})
    }

    const onEnd = () => {
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
      cleanup()
    }
  }, [user, createPC, flushCandidates, cleanup])

  // ======== Watch for 'calling' state to initiate outgoing call ========
  useEffect(() => {
    const unsub = useCallStore.subscribe((state, prev) => {
      if (state.status === 'calling' && prev.status !== 'calling' && state.peerUserId) {
        initiateCall(state.peerUserId)
      }
    })
    return unsub
  }, [initiateCall])
}
