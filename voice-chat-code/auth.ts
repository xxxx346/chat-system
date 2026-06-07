import { Request, Response, NextFunction } from 'express'
import { verifyToken } from '../utils/jwt'
import { unauthorized } from '../utils/response'

export interface AuthRequest extends Request {
  user?: { userId: number; username: string }
}

export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return unauthorized(res, 'No token provided')
  }

  const token = authHeader.split(' ')[1]
  const decoded = verifyToken(token)

  if (!decoded) {
    return unauthorized(res, 'Invalid or expired token')
  }

  req.user = decoded
  next()
}
