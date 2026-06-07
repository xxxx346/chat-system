import { io, Socket } from 'socket.io-client'

type EventHandler = (...args: any[]) => void

class SocketService {
  private socket: Socket | null = null
  private pendingOn: { event: string; handler: EventHandler }[] = []

  connect(userId: number, username: string) {
    if (this.socket?.connected) return this.socket
    this.socket = io('/', {
      query: { userId, username },
      transports: ['websocket', 'polling'],
    })
    // Replay all pending 'on' registrations onto the new socket
    const pending = this.pendingOn.splice(0)
    for (const { event, handler } of pending) {
      this.socket.on(event, handler)
    }
    return this.socket
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect()
      this.socket = null
    }
  }

  getSocket(): Socket | null {
    return this.socket
  }

  private _on(event: string, handler: EventHandler) {
    if (this.socket) {
      this.socket.on(event, handler)
    } else {
      this.pendingOn.push({ event, handler })
    }
  }

  private _off(event: string, handler: EventHandler) {
    this.pendingOn = this.pendingOn.filter(
      (h) => !(h.event === event && h.handler === handler)
    )
    this.socket?.off(event, handler)
  }

  joinConversation(convId: number) {
    this.socket?.emit('join:conversation', convId)
  }

  leaveConversation(convId: number) {
    this.socket?.emit('leave:conversation', convId)
  }

  sendMessage(data: any) {
    this.socket?.emit('message:send', data)
  }

  sendTypingStart(data: any) {
    this.socket?.emit('typing:start', data)
  }

  sendTypingEnd(data: any) {
    this.socket?.emit('typing:end', data)
  }

  onNewMessage(handler: EventHandler) { this._on('message:new', handler) }
  offNewMessage(handler: EventHandler) { this._off('message:new', handler) }

  onUserOnline(handler: EventHandler) { this._on('user:online', handler) }
  offUserOnline(handler: EventHandler) { this._off('user:online', handler) }

  onUserOffline(handler: EventHandler) { this._on('user:offline', handler) }
  offUserOffline(handler: EventHandler) { this._off('user:offline', handler) }

  onTypingStart(handler: EventHandler) { this._on('typing:start', handler) }
  offTypingStart(handler: EventHandler) { this._off('typing:start', handler) }

  onTypingEnd(handler: EventHandler) { this._on('typing:end', handler) }
  offTypingEnd(handler: EventHandler) { this._off('typing:end', handler) }

  onMessageRead(handler: EventHandler) { this._on('message:read:ack', handler) }
  offMessageRead(handler: EventHandler) { this._off('message:read:ack', handler) }

  sendMessageRead(data: any) {
    this.socket?.emit('message:read', data)
  }

  onVoiceOffer(handler: EventHandler) { this._on('voice:offer', handler) }
  offVoiceOffer(handler: EventHandler) { this._off('voice:offer', handler) }

  onVoiceAnswer(handler: EventHandler) { this._on('voice:answer', handler) }
  offVoiceAnswer(handler: EventHandler) { this._off('voice:answer', handler) }

  onVoiceIceCandidate(handler: EventHandler) { this._on('voice:ice-candidate', handler) }
  offVoiceIceCandidate(handler: EventHandler) { this._off('voice:ice-candidate', handler) }

  onVoiceEnd(handler: EventHandler) { this._on('voice:end', handler) }
  offVoiceEnd(handler: EventHandler) { this._off('voice:end', handler) }

  sendVoiceOffer(data: any) { this.socket?.emit('voice:offer', data) }
  sendVoiceAnswer(data: any) { this.socket?.emit('voice:answer', data) }
  sendVoiceIceCandidate(data: any) { this.socket?.emit('voice:ice-candidate', data) }
  sendVoiceEnd(data: any) { this.socket?.emit('voice:end', data) }
}

export const socketService = new SocketService()
