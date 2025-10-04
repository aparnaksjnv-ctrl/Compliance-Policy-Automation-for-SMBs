import { Request, Response, NextFunction } from 'express'
import { verifyJwt } from '../utils/jwt'

export interface AuthedRequest extends Request {
  userId?: string
}

export function authMiddleware(req: AuthedRequest, res: Response, next: NextFunction) {
  const header = req.headers['authorization'] || ''
  const [, token] = header.split(' ')
  if (!token) return res.status(401).json({ error: 'Missing bearer token' })
  try {
    const payload = verifyJwt(token)
    req.userId = payload.sub
    next()
  } catch {
    return res.status(401).json({ error: 'Invalid token' })
  }
}
