import { Response } from 'express'
import { AppDataSource } from '../config/database'
import { User } from '../models/User'
import { Friend } from '../models/Friend'
import { FriendGroup } from '../models/FriendGroup'
import { FriendRequest } from '../models/FriendRequest'
import { AuthRequest } from '../middleware/auth'
import { success, error } from '../utils/response'

const friendRepo = () => AppDataSource.getRepository(Friend)
const groupRepo = () => AppDataSource.getRepository(FriendGroup)
const requestRepo = () => AppDataSource.getRepository(FriendRequest)
const userRepo = () => AppDataSource.getRepository(User)

export async function getFriends(req: AuthRequest, res: Response) {
  try {
    const userId = req.user!.userId
    const friends = await friendRepo().find({ where: { user_id: userId }, relations: [] })
    const groups = await groupRepo().find({ where: { user_id: userId }, order: { sort_order: 'ASC' } })

    const userIds = friends.map(f => f.friend_id)
    const users = userIds.length > 0 ? await userRepo().findByIds(userIds) : []
    const userMap = new Map(users.map(u => [u.id, { id: u.id, username: u.username, nickname: u.nickname, avatar: u.avatar, status: u.status }]))

    const friendList = friends.map(f => ({
      id: f.id, friend: userMap.get(f.friend_id) || null,
      group_id: f.group_id, remark: f.remark, created_at: f.created_at,
    }))

    const grouped = groups.map(g => ({
      id: g.id, name: g.name, sort_order: g.sort_order,
      friends: friendList.filter(f => f.group_id === g.id),
    }))

    const ungrouped = friendList.filter(f => !f.group_id)
    if (ungrouped.length > 0) {
      grouped.unshift({ id: 0, name: '默认分组', sort_order: -1, friends: ungrouped })
    }

    return success(res, grouped)
  } catch (err: any) {
    return error(res, err.message)
  }
}

export async function searchUsers(req: AuthRequest, res: Response) {
  try {
    const query = req.query.q as string
    if (!query) return error(res, 'Search query required')

    const users = await userRepo()
      .createQueryBuilder('user')
      .where('user.username LIKE :q OR user.nickname LIKE :q', { q: `%${query}%` })
      .limit(20)
      .getMany()

    const friends = await friendRepo().find({ where: { user_id: req.user!.userId } })
    const friendIds = new Set(friends.map(f => f.friend_id))

    return success(res, users.filter(u => u.id !== req.user!.userId).map(u => ({
      id: u.id, username: u.username, nickname: u.nickname, avatar: u.avatar,
      is_friend: friendIds.has(u.id),
    })))
  } catch (err: any) {
    return error(res, err.message)
  }
}

export async function sendFriendRequest(req: AuthRequest, res: Response) {
  try {
    const { receiver_id, message } = req.body
    const sender_id = req.user!.userId

    if (sender_id === receiver_id) return error(res, 'Cannot add yourself')

    const receiver = await userRepo().findOne({ where: { id: receiver_id } })
    if (!receiver) return error(res, 'User not found', 404)

    const existing = await friendRepo().findOne({ where: { user_id: sender_id, friend_id: receiver_id } })
    if (existing) return error(res, 'Already friends')

    const pending = await requestRepo().findOne({ where: { sender_id, receiver_id, status: 'pending' } })
    if (pending) return error(res, 'Friend request already sent')

    const request = requestRepo().create({ sender_id, receiver_id, message })
    await requestRepo().save(request)

    return success(res, request, 'Friend request sent')
  } catch (err: any) {
    return error(res, err.message)
  }
}

export async function getFriendRequests(req: AuthRequest, res: Response) {
  try {
    const userId = req.user!.userId
    const sent = await requestRepo().find({ where: { sender_id: userId }, order: { created_at: 'DESC' } })
    const received = await requestRepo().find({ where: { receiver_id: userId }, order: { created_at: 'DESC' } })

    const allUserIds = [...new Set([...sent.map(r => r.receiver_id), ...received.map(r => r.sender_id)])]
    const users = allUserIds.length > 0 ? await userRepo().findByIds(allUserIds) : []
    const userMap = new Map(users.map(u => [u.id, { id: u.id, username: u.username, nickname: u.nickname, avatar: u.avatar }]))

    return success(res, {
      sent: sent.map(r => ({ ...r, receiver: userMap.get(r.receiver_id) })),
      received: received.map(r => ({ ...r, sender: userMap.get(r.sender_id) })),
    })
  } catch (err: any) {
    return error(res, err.message)
  }
}

export async function handleFriendRequest(req: AuthRequest, res: Response) {
  try {
    const requestId = parseInt(req.params.id)
    const { action } = req.body // 'accepted' | 'rejected'
    const userId = req.user!.userId

    const request = await requestRepo().findOne({ where: { id: requestId, receiver_id: userId } })
    if (!request) return error(res, 'Request not found', 404)
    if (request.status !== 'pending') return error(res, 'Request already processed')

    request.status = action
    await requestRepo().save(request)

    if (action === 'accepted') {
      const defaultGroup = await groupRepo().findOne({ where: { user_id: userId }, order: { sort_order: 'ASC' } })
      const friend1 = new Friend()
      friend1.user_id = userId
      friend1.friend_id = request.sender_id
      friend1.group_id = defaultGroup?.id as number
      await friendRepo().save(friend1)
      const friend2 = new Friend()
      friend2.user_id = request.sender_id
      friend2.friend_id = userId
      await friendRepo().save(friend2)
    }

    return success(res, request, action === 'accepted' ? 'Friend request accepted' : 'Friend request rejected')
  } catch (err: any) {
    return error(res, err.message)
  }
}

export async function resendFriendRequest(req: AuthRequest, res: Response) {
  try {
    const requestId = parseInt(req.params.id)
    const request = await requestRepo().findOne({ where: { id: requestId, sender_id: req.user!.userId } })
    if (!request) return error(res, 'Request not found', 404)

    request.status = 'pending'
    await requestRepo().save(request)

    return success(res, request, 'Friend request resent')
  } catch (err: any) {
    return error(res, err.message)
  }
}

export async function moveFriendToGroup(req: AuthRequest, res: Response) {
  try {
    const friendId = parseInt(req.params.id)
    const { group_id } = req.body

    const friend = await friendRepo().findOne({ where: { id: friendId, user_id: req.user!.userId } })
    if (!friend) return error(res, 'Friend not found', 404)

    friend.group_id = group_id || null
    await friendRepo().save(friend)

    return success(res, friend, 'Friend moved to group')
  } catch (err: any) {
    return error(res, err.message)
  }
}

export async function deleteFriend(req: AuthRequest, res: Response) {
  try {
    const friendId = parseInt(req.params.id)
    const userId = req.user!.userId

    const friend = await friendRepo().findOne({ where: { id: friendId, user_id: userId } })
    if (!friend) return error(res, 'Friend not found', 404)

    await friendRepo().remove(friend)
    // Remove bidirectional friendship
    const reverse = await friendRepo().findOne({ where: { user_id: friend.friend_id, friend_id: userId } })
    if (reverse) await friendRepo().remove(reverse)

    return success(res, null, 'Friend deleted')
  } catch (err: any) {
    return error(res, err.message)
  }
}

export async function getGroups(req: AuthRequest, res: Response) {
  try {
    const groups = await groupRepo().find({ where: { user_id: req.user!.userId }, order: { sort_order: 'ASC' } })
    return success(res, groups)
  } catch (err: any) {
    return error(res, err.message)
  }
}

export async function createGroup(req: AuthRequest, res: Response) {
  try {
    const { name } = req.body
    if (!name) return error(res, 'Group name required')

    const maxOrder = await groupRepo()
      .createQueryBuilder('g')
      .where('g.user_id = :userId', { userId: req.user!.userId })
      .orderBy('g.sort_order', 'DESC')
      .getOne()

    const group = groupRepo().create({
      user_id: req.user!.userId,
      name,
      sort_order: (maxOrder?.sort_order || 0) + 1,
    })
    await groupRepo().save(group)
    return success(res, group, 'Group created')
  } catch (err: any) {
    return error(res, err.message)
  }
}

export async function renameGroup(req: AuthRequest, res: Response) {
  try {
    const group = await groupRepo().findOne({ where: { id: parseInt(req.params.id), user_id: req.user!.userId } })
    if (!group) return error(res, 'Group not found', 404)

    group.name = req.body.name
    await groupRepo().save(group)
    return success(res, group, 'Group renamed')
  } catch (err: any) {
    return error(res, err.message)
  }
}

export async function deleteGroup(req: AuthRequest, res: Response) {
  try {
    const groupId = parseInt(req.params.id)
    const group = await groupRepo().findOne({ where: { id: groupId, user_id: req.user!.userId } })
    if (!group) return error(res, 'Group not found', 404)

    await AppDataSource.getRepository(Friend)
      .createQueryBuilder()
      .update()
      .set({ group_id: undefined as any })
      .where('group_id = :groupId', { groupId })
      .execute()
    await groupRepo().remove(group)
    return success(res, null, 'Group deleted')
  } catch (err: any) {
    return error(res, err.message)
  }
}
