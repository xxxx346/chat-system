import { Server as IOServer, Socket } from 'socket.io'
import { AppDataSource } from '../config/database'
import { Message } from '../models/Message'
import { Conversation } from '../models/Conversation'
import { ConversationMember } from '../models/ConversationMember'
import { MessageStatus } from '../models/MessageStatus'
import { User } from '../models/User'

interface ChatSocket extends Socket {
  userId?: number
}

const onlineUsers = new Map<number, string>() // userId -> socketId

export function setupSocket(io: IOServer) {
  io.on('connection', (socket: ChatSocket) => {
    const userId = parseInt(socket.handshake.query.userId as string)
    const username = socket.handshake.query.username as string

    if (userId) {
      onlineUsers.set(userId, socket.id)
      socket.userId = userId
      socket.join(`user:${userId}`)
      io.emit('user:online', { userId, username })
      console.log(`User ${username}(${userId}) connected`)
    }

    socket.on('message:send', async (data) => {
      try {
        if (data.sender_id !== userId) return

        const messageRepo = AppDataSource.getRepository(Message)
        const message = messageRepo.create({
          conversation_id: data.conversation_id,
          sender_id: data.sender_id,
          type: data.type || 'text',
          content: data.content,
          file_url: data.file_url,
          file_size: data.file_size,
          file_name: data.file_name,
        })
        const saved = await messageRepo.save(message)

        // Update conversation last_message
        const convRepo = AppDataSource.getRepository(Conversation)
        await convRepo.update(data.conversation_id, {
          last_message: data.content
            ? (data.content.length > 200 ? data.content.substring(0, 200) + '...' : data.content)
            : `[${data.type || 'message'}]`,
          last_message_time: saved.created_at,
        })

        // Create MessageStatus for other members
        const memberRepo = AppDataSource.getRepository(ConversationMember)
        const members = await memberRepo.find({ where: { conversation_id: data.conversation_id } })
        const statusRepo = AppDataSource.getRepository(MessageStatus)
        const statuses = members
          .filter((m: any) => m.user_id !== data.sender_id)
          .map((m: any) => ({
            message_id: saved.id,
            user_id: m.user_id,
            status: 'delivered' as const,
          }))
        if (statuses.length > 0) {
          await statusRepo.save(statuses)
        }

        // Get sender info
        const userRepo = AppDataSource.getRepository(User)
        const sender = await userRepo.findOne({ where: { id: data.sender_id } })

        const messageData = {
          ...saved,
          sender: sender
            ? { id: sender.id, username: sender.username, nickname: sender.nickname, avatar: sender.avatar }
            : { id: data.sender_id },
        }

        io.to(`conv:${data.conversation_id}`).emit('message:new', messageData)
      } catch (err) {
        console.error('Failed to persist message:', err)
      }
    })

    socket.on('message:read', async (data) => {
      try {
        const statusRepo = AppDataSource.getRepository(MessageStatus)
        await statusRepo.update(
          { message_id: data.message_id, user_id: userId },
          { status: 'read' as const, read_at: new Date() }
        )
        io.to(`conv:${data.conversation_id}`).emit('message:read:ack', { ...data, userId })
      } catch (err) {
        console.error('Failed to mark message read:', err)
      }
    })

    socket.on('typing:start', (data) => {
      socket.to(`conv:${data.conversation_id}`).emit('typing:start', data)
    })

    socket.on('typing:end', (data) => {
      socket.to(`conv:${data.conversation_id}`).emit('typing:end', data)
    })

    socket.on('join:conversation', (convId: number) => {
      socket.join(`conv:${convId}`)
    })

    socket.on('leave:conversation', (convId: number) => {
      socket.leave(`conv:${convId}`)
    })

    // Voice call WebRTC signaling
    socket.on('voice:offer', async (data) => {
      const targetSocket = onlineUsers.get(data.targetUserId)
      if (targetSocket) {
        let avatar = ''
        try {
          const userRepo = AppDataSource.getRepository(User)
          const sender = await userRepo.findOne({ where: { id: userId } })
          if (sender) avatar = sender.avatar || ''
        } catch (e) { /* ignore */ }
        io.to(targetSocket).emit('voice:offer', { ...data, fromUserId: userId, fromUsername: username, fromAvatar: avatar })
      }
    })

    socket.on('voice:answer', (data) => {
      const targetSocket = onlineUsers.get(data.targetUserId)
      if (targetSocket) {
        io.to(targetSocket).emit('voice:answer', data)
      }
    })

    socket.on('voice:ice-candidate', (data) => {
      const targetSocket = onlineUsers.get(data.targetUserId)
      if (targetSocket) {
        io.to(targetSocket).emit('voice:ice-candidate', data)
      }
    })

    socket.on('voice:end', (data) => {
      const targetSocket = onlineUsers.get(data.targetUserId)
      if (targetSocket) {
        io.to(targetSocket).emit('voice:end', { userId })
      }
    })

    socket.on('disconnect', () => {
      if (userId) {
        onlineUsers.delete(userId)
        io.emit('user:offline', { userId, username })
        console.log(`User ${username}(${userId}) disconnected`)
      }
    })
  })
}
