import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'chat-system-jwt-secret'

export function signToken(payload: { userId: number; username: string }): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: (process.env.JWT_EXPIRES_IN || '7d') as any })
}

export function verifyToken(token: string): { userId: number; username: string } | null {
  try {
    return jwt.verify(token, JWT_SECRET) as { userId: number; username: string }
  } catch {
    return null
  }
}
