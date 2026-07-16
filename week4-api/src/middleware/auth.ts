import { Request, Response, NextFunction } from 'express'
import { verifyJwt } from '../utils/jwt'
import { User } from '../models/User'

export interface AuthedRequest<
  P = any,
  ResBody = any,
  ReqBody = any,
  ReqQuery = any
> extends Request<P, ResBody, ReqBody, ReqQuery> {
  userId?: string
  userRole?: 'user' | 'admin'
}

export function authMiddleware(req: AuthedRequest, res: Response, next: NextFunction) {
  const hdr = req.headers.authorization
  const token = hdr?.startsWith('Bearer ') ? hdr.slice(7) : undefined
  if (!token) return res.status(401).json({ error: 'Unauthorized' })
  try {
    const payload = verifyJwt(token)
    req.userId = payload.sub
    next()
  } catch {
    return res.status(401).json({ error: 'Unauthorized' })
  }
}

export async function requireAdmin(req: AuthedRequest, res: Response, next: NextFunction) {
  try {
    const user = await User.findById(req.userId).lean()
    if (!user) {
      return res.status(401).json({ error: 'User not found' })
    }
    if (user.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden: Admin access required' })
    }
    req.userRole = user.role
    next()
  } catch (error) {
    console.error('Error checking admin role:', error)
    return res.status(500).json({ error: 'Failed to verify admin role' })
  }
}
