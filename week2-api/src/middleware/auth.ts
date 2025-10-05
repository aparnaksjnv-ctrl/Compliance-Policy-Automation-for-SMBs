import { Request, Response, NextFunction } from 'express'
import { verifyJwt } from '../utils/jwt'

export interface AuthedRequest extends Request {
  userId?: string
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
