import { Router } from 'express'
import { authMiddleware, AuthedRequest } from '../middleware/auth'
import { Activity } from '../models/Activity'

const router = Router()

router.get('/', authMiddleware, async (req: AuthedRequest, res) => {
  const userId = req.userId!
  const entityType = String(req.query.entityType || '')
  const action = String(req.query.action || '')
  const entityId = String(req.query.entityId || '')
  const limit = Math.min(parseInt(String(req.query.limit || '200'), 10) || 200, 500)

  const filter: any = { userId }
  if (entityType) filter.entityType = entityType
  if (action) filter.action = action
  if (entityId) filter.entityId = entityId

  const items = await Activity.find(filter).sort({ createdAt: -1 }).limit(limit).lean()
  res.json({ items })
})

export default router
