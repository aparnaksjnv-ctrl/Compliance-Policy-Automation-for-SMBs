import type { Request, Response, NextFunction } from 'express'
import { User } from '../models/User'
import type { AuthedRequest } from './auth'

function gatingEnabled() {
  return process.env.SUBSCRIPTION_REQUIRED === 'true'
}

export async function requireActiveSubscription(req: AuthedRequest, res: Response, next: NextFunction) {
  try {
    if (!gatingEnabled()) return next()
    const uid = req.userId
    if (!uid) return res.status(401).json({ error: 'Unauthorized' })
    const user = await User.findById(uid).lean()
    const status = (user as any)?.subscriptionStatus || 'none'
    if (status === 'active' || status === 'trialing') return next()
    return res.status(402).json({ error: 'Subscription required' })
  } catch (e: any) {
    return res.status(500).json({ error: e?.message || 'Subscription check failed' })
  }
}
