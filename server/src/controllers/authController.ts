import { Request, Response } from 'express'
import { body, validationResult } from 'express-validator'
import { AppDataSource } from '../config/database'
import { User } from '../models/User'
import { hashPassword, comparePassword } from '../utils/password'
import { signToken } from '../utils/jwt'
import { success, error } from '../utils/response'
import { AuthRequest } from '../middleware/auth'

const userRepo = () => AppDataSource.getRepository(User)

export async function register(req: Request, res: Response) {
  try {
    const { username, email, password, nickname } = req.body
    if (!username || !email || !password) {
      return error(res, 'Username, email and password are required')
    }

    const existing = await userRepo().findOne({ where: [{ username }, { email }] })
    if (existing) {
      return error(res, 'Username or email already exists')
    }

    const password_hash = await hashPassword(password)
    const user = userRepo().create({
      username,
      email,
      password_hash,
      nickname: nickname || username,
    })
    await userRepo().save(user)

    const token = signToken({ userId: user.id, username: user.username })
    return success(res, {
      token,
      user: { id: user.id, username: user.username, email: user.email, nickname: user.nickname, avatar: user.avatar },
    }, 'Registration successful')
  } catch (err: any) {
    return error(res, err.message || 'Registration failed')
  }
}

export async function login(req: Request, res: Response) {
  try {
    const { username, password } = req.body
    if (!username || !password) {
      return error(res, 'Username and password are required')
    }

    const user = await userRepo().findOne({ where: [{ username }, { email: username }] })
    if (!user) {
      return error(res, 'Invalid credentials', 401)
    }

    const valid = await comparePassword(password, user.password_hash)
    if (!valid) {
      return error(res, 'Invalid credentials', 401)
    }

    user.status = 'online'
    await userRepo().save(user)

    const token = signToken({ userId: user.id, username: user.username })
    return success(res, {
      token,
      user: { id: user.id, username: user.username, email: user.email, nickname: user.nickname, avatar: user.avatar, signature: user.signature },
    }, 'Login successful')
  } catch (err: any) {
    return error(res, err.message || 'Login failed')
  }
}

export async function getProfile(req: AuthRequest, res: Response) {
  try {
    const user = await userRepo().findOne({ where: { id: req.user!.userId } })
    if (!user) return error(res, 'User not found', 404)
    return success(res, {
      id: user.id, username: user.username, email: user.email,
      nickname: user.nickname, avatar: user.avatar, status: user.status,
      signature: user.signature, created_at: user.created_at,
    })
  } catch (err: any) {
    return error(res, err.message)
  }
}

export async function updateProfile(req: AuthRequest, res: Response) {
  try {
    const { nickname, avatar, signature } = req.body
    const user = await userRepo().findOne({ where: { id: req.user!.userId } })
    if (!user) return error(res, 'User not found', 404)

    if (nickname) user.nickname = nickname
    if (avatar) user.avatar = avatar
    if (signature !== undefined) user.signature = signature

    await userRepo().save(user)
    return success(res, { id: user.id, nickname: user.nickname, avatar: user.avatar, signature: user.signature }, 'Profile updated')
  } catch (err: any) {
    return error(res, err.message)
  }
}

export async function logout(req: AuthRequest, res: Response) {
  try {
    const userRepo = AppDataSource.getRepository(User)
    await userRepo.update(req.user!.userId, { status: 'offline' })
    return success(res, null, 'Logged out successfully')
  } catch (err: any) {
    return error(res, err.message)
  }
}
