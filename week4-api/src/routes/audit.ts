import { Router, Response } from 'express'
import { authMiddleware, requireAdmin, AuthedRequest } from '../middleware/auth'
import { AuditLogModel } from '../models/AuditLog'
import { User } from '../models/User'

const router = Router()

// GET /api/audit - all logs, paginated 20 per page, admin only
router.get('/', authMiddleware, requireAdmin, async (req: AuthedRequest, res: Response) => {
  try {
    const page = parseInt((req.query as any).page as string) || 1
    const limit = parseInt((req.query as any).limit as string) || 20
    const skip = (page - 1) * limit

    const [logs, total] = await Promise.all([
      AuditLogModel.find()
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      AuditLogModel.countDocuments(),
    ])

    res.json({
      logs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Error fetching audit logs:', error)
    res.status(500).json({ error: 'Failed to fetch audit logs' })
  }
})

// GET /api/audit/:id - single entry
router.get('/:id', authMiddleware, async (req: AuthedRequest, res: Response) => {
  try {
    const log = await AuditLogModel.findById((req.params as any).id).lean()
    if (!log) {
      return res.status(404).json({ error: 'Audit log not found' })
    }
    res.json(log)
  } catch (error) {
    console.error('Error fetching audit log:', error)
    res.status(500).json({ error: 'Failed to fetch audit log' })
  }
})

// GET /api/audit/user/:userId - logs by user (users can only see their own, admins can see any)
router.get('/user/:userId', authMiddleware, async (req: AuthedRequest, res: Response) => {
  try {
    const requestedUserId = (req.params as any).userId
    const currentUserEmail = req.userId!
    
    // Check if current user is admin or requesting their own logs
    const currentUser = await User.findOne({ email: currentUserEmail }).lean()
    if (!currentUser) {
      return res.status(401).json({ error: 'User not found' })
    }
    
    // Regular users can only see their own logs
    if (currentUser.role !== 'admin' && currentUser._id.toString() !== requestedUserId) {
      return res.status(403).json({ error: 'Forbidden: Can only view your own audit logs' })
    }
    
    const page = parseInt((req.query as any).page as string) || 1
    const limit = parseInt((req.query as any).limit as string) || 20
    const skip = (page - 1) * limit

    const [logs, total] = await Promise.all([
      AuditLogModel.find({ userId: requestedUserId })
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      AuditLogModel.countDocuments({ userId: requestedUserId }),
    ])

    res.json({
      logs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Error fetching user audit logs:', error)
    res.status(500).json({ error: 'Failed to fetch user audit logs' })
  }
})

export default router
