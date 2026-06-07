import { Response } from 'express'
import { AppDataSource } from '../config/database'
import { Conversation } from '../models/Conversation'
import { ConversationMember } from '../models/ConversationMember'
import { Message } from '../models/Message'
import { MessageStatus } from '../models/MessageStatus'
import { User } from '../models/User'
import { Friend } from '../models/Friend'
import { AuthRequest } from '../middleware/auth'
import { success, error } from '../utils/response'

const convRepo = () => AppDataSource.getRepository(Conversation)
const memberRepo = () => AppDataSource.getRepository(ConversationMember)
const messageRepo = () => AppDataSource.getRepository(Message)
const userRepo = () => AppDataSource.getRepository(User)
const friendRepo = () => AppDataSource.getRepository(Friend)

export async function getConversations(req: AuthRequest, res: Response) {
  try {
    const userId = req.user!.userId
    const memberships = await memberRepo().find({ where: { user_id: userId } })
    const convIds = memberships.map(m => m.conversation_id)

    if (convIds.length === 0) return success(res, [])

    const conversations = await convRepo()
      .createQueryBuilder('c')
      .where('c.id IN (:...ids)', { ids: convIds })
      .orderBy('c.last_message_time', 'DESC')
      .getMany()

    const result = await Promise.all(conversations.map(async (conv) => {
      const members = await memberRepo().find({ where: { conversation_id: conv.id } })
      const memberIds = members.map(m => m.user_id)
      const users = memberIds.length > 0 ? await userRepo().findByIds(memberIds) : []

      let name = conv.name
      let avatar = conv.avatar
      if (conv.type === 'private') {
        const other = users.find(u => u.id !== userId)
        if (other) {
          name = name || other.nickname || other.username
          avatar = avatar || other.avatar
        }
      }

      return {
        ...conv,
        name,
        avatar,
        members: users.map(u => ({ id: u.id, username: u.username, nickname: u.nickname, avatar: u.avatar })),
        unread: 0,
      }
    }))

    return success(res, result)
  } catch (err: any) {
    return error(res, err.message)
  }
}

export async function createConversation(req: AuthRequest, res: Response) {
  try {
    const { type, name, member_ids } = req.body
    const userId = req.user!.userId

    if (type === 'private' && member_ids && member_ids.length === 1) {
      const otherId = member_ids[0]
      const memberships = await memberRepo().find({ where: { user_id: userId } })
      const convIds = memberships.map(m => m.conversation_id)

      if (convIds.length > 0) {
        const existingConvs = await convRepo().findByIds(convIds)
        const privateConvs = existingConvs.filter(c => c.type === 'private')

        for (const conv of privateConvs) {
          const members = await memberRepo().find({ where: { conversation_id: conv.id } })
          const memberIds = members.map(m => m.user_id)
          if (memberIds.includes(otherId) && memberIds.includes(userId)) {
            return success(res, conv, 'Conversation already exists')
          }
        }
      }
    }

    const conversation = convRepo().create({
      type: type || 'private',
      name: name || '',
    })
    await convRepo().save(conversation)

    const allMemberIds = [userId, ...(member_ids || [])]
    for (const id of allMemberIds) {
      const member = memberRepo().create({ conversation_id: conversation.id, user_id: id })
      await memberRepo().save(member)
    }

    // Fetch created conversation with members
    const members = await memberRepo().find({ where: { conversation_id: conversation.id } })
    const userIds = members.map(m => m.user_id)
    const users = userIds.length > 0 ? await userRepo().findByIds(userIds) : []

    return success(res, { ...conversation, members: users }, 'Conversation created')
  } catch (err: any) {
    return error(res, err.message)
  }
}

export async function getMessages(req: AuthRequest, res: Response) {
  try {
    const conversationId = parseInt(req.params.id)
    const page = parseInt(req.query.page as string) || 1
    const limit = parseInt(req.query.limit as string) || 50
    const offset = (page - 1) * limit

    const messages = await messageRepo().find({
      where: { conversation_id: conversationId },
      order: { created_at: 'DESC' },
      skip: offset,
      take: limit,
    })

    const userIds = [...new Set(messages.map(m => m.sender_id))]
    const users = userIds.length > 0 ? await userRepo().findByIds(userIds) : []
    const userMap = new Map(users.map(u => [u.id, { id: u.id, username: u.username, nickname: u.nickname, avatar: u.avatar }]))

    const result = messages.reverse().map(m => ({
      ...m,
      sender: userMap.get(m.sender_id) || null,
    }))

    const total = await messageRepo().count({ where: { conversation_id: conversationId } })

    return success(res, { messages: result, total, page, limit, totalPages: Math.ceil(total / limit) })
  } catch (err: any) {
    return error(res, err.message)
  }
}

export async function searchMessages(req: AuthRequest, res: Response) {
  try {
    const conversationId = parseInt(req.params.id)
    const query = req.query.q as string
    if (!query) return error(res, 'Search query required')

    const messages = await messageRepo()
      .createQueryBuilder('m')
      .where('m.conversation_id = :convId', { convId: conversationId })
      .andWhere('m.type = :type', { type: 'text' })
      .andWhere('m.content LIKE :q', { q: `%${query}%` })
      .orderBy('m.created_at', 'DESC')
      .limit(100)
      .getMany()

    const userIds = [...new Set(messages.map(m => m.sender_id))]
    const users = userIds.length > 0 ? await userRepo().findByIds(userIds) : []
    const userMap = new Map(users.map(u => [u.id, { id: u.id, username: u.username, nickname: u.nickname }]))

    return success(res, messages.map(m => ({ ...m, sender: userMap.get(m.sender_id) })))
  } catch (err: any) {
    return error(res, err.message)
  }
}

export async function exportMessages(req: AuthRequest, res: Response) {
  try {
    const conversationId = parseInt(req.params.id)
    const format = (req.query.format as string) || 'json'

    const messages = await messageRepo().find({
      where: { conversation_id: conversationId },
      order: { created_at: 'ASC' },
    })

    const userIds = [...new Set(messages.map(m => m.sender_id))]
    const users = userIds.length > 0 ? await userRepo().findByIds(userIds) : []
    const userMap = new Map(users.map(u => [u.id, u.username]))

    if (format === 'txt') {
      const text = messages.map(m =>
        `[${m.created_at}] ${userMap.get(m.sender_id) || 'Unknown'} (${m.type}): ${m.content || m.file_url || ''}`
      ).join('\n')
      res.setHeader('Content-Type', 'text/plain; charset=utf-8')
      res.setHeader('Content-Disposition', `attachment; filename=chat-${conversationId}.txt`)
      return res.send(text)
    }

    const data = messages.map(m => ({
      time: m.created_at, sender: userMap.get(m.sender_id) || 'Unknown',
      type: m.type, content: m.content, file_url: m.file_url,
    }))
    res.setHeader('Content-Type', 'application/json')
    res.setHeader('Content-Disposition', `attachment; filename=chat-${conversationId}.json`)
    return res.json(data)
  } catch (err: any) {
    return error(res, err.message)
  }
}

export async function updateConversation(req: AuthRequest, res: Response) {
  try {
    const convId = parseInt(req.params.id)
    const conv = await convRepo().findOne({ where: { id: convId } })
    if (!conv) return error(res, 'Conversation not found', 404)

    if (req.body.name) conv.name = req.body.name
    if (req.body.avatar) conv.avatar = req.body.avatar
    await convRepo().save(conv)

    return success(res, conv, 'Conversation updated')
  } catch (err: any) {
    return error(res, err.message)
  }
}

export async function getUnreadCount(req: AuthRequest, res: Response) {
  try {
    const userId = req.user!.userId
    const statusRepo = AppDataSource.getRepository(MessageStatus)
    const result = await statusRepo.createQueryBuilder('ms')
      .innerJoin(Message, 'm', 'm.id = ms.message_id')
      .select('m.conversation_id', 'conversation_id')
      .addSelect('COUNT(*)', 'count')
      .where('ms.user_id = :userId', { userId })
      .andWhere('ms.status = :status', { status: 'sent' })
      .groupBy('m.conversation_id')
      .getRawMany()

    const countByConv: Record<number, number> = {}
    for (const row of result) {
      countByConv[row.conversation_id] = parseInt(row.count)
    }
    return success(res, countByConv)
  } catch (err: any) {
    return error(res, err.message)
  }
}

export async function removeMember(req: AuthRequest, res: Response) {
  try {
    const convId = parseInt(req.params.id)
    const memberId = parseInt(req.params.userId)

    const member = await memberRepo().findOne({ where: { conversation_id: convId, user_id: memberId } })
    if (!member) return error(res, 'Member not found', 404)

    await memberRepo().remove(member)
    return success(res, null, 'Member removed')
  } catch (err: any) {
    return error(res, err.message)
  }
}
