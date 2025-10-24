import { Router } from 'express'
import { z } from 'zod'
import { authMiddleware, AuthedRequest } from '../middleware/auth'
import { Audit, AuditStatus } from '../models/Audit'

const router = Router()

const auditSchema = z.object({
  name: z.string().min(2),
  owner: z.string().min(2),
  status: z.enum(['Draft', 'In Progress', 'Closed']),
  dueDate: z.string().optional(), // ISO or YYYY-MM-DD
})

router.get('/', authMiddleware, async (req: AuthedRequest, res) => {
  const userId = req.userId!
  const q = String(req.query.q || '').toLowerCase()
  const status = String(req.query.status || '') as AuditStatus | ''
  const dueBefore = String(req.query.dueBefore || '')

  const filter: any = { userId }
  if (status && ['Draft','In Progress','Closed'].includes(status)) filter.status = status
  if (q) filter.$or = [
    { name: { $regex: q, $options: 'i' } },
    { owner: { $regex: q, $options: 'i' } },
  ]
  if (dueBefore) {
    const dt = new Date(dueBefore)
    if (!isNaN(dt.getTime())) filter.dueDate = { $lte: dt }
  }

  const list = await Audit.find(filter).sort({ updatedAt: -1 }).lean()
  res.json({ items: list })
})

router.post('/', authMiddleware, async (req: AuthedRequest, res) => {
  const parsed = auditSchema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() })
  const { name, owner, status, dueDate } = parsed.data
  const base: any = { userId: req.userId, name, owner, status }
  if (dueDate) {
    const dt = new Date(dueDate)
    if (!isNaN(dt.getTime())) base.dueDate = dt
  }
  const created = await Audit.create(base)
  res.status(201).json({ id: created.id })
})

router.get('/:id', authMiddleware, async (req: AuthedRequest, res) => {
  const doc = await Audit.findOne({ _id: req.params.id, userId: req.userId })
  if (!doc) return res.status(404).json({ error: 'Not found' })
  res.json(doc)
})

router.put('/:id', authMiddleware, async (req: AuthedRequest, res) => {
  const parsed = auditSchema.partial().safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() })
  const update: any = { ...parsed.data }
  if (Object.prototype.hasOwnProperty.call(parsed.data, 'dueDate')) {
    const s = (parsed.data as any).dueDate
    if (typeof s === 'string' && s) {
      const dt = new Date(s)
      update.dueDate = isNaN(dt.getTime()) ? undefined : dt
    } else {
      update.dueDate = undefined
    }
  }
  const updated = await Audit.findOneAndUpdate(
    { _id: req.params.id, userId: req.userId },
    { $set: update },
    { new: true }
  )
  if (!updated) return res.status(404).json({ error: 'Not found' })
  res.json({ id: updated.id })
})

const findingSchema = z.object({
  title: z.string().min(2),
  description: z.string().optional(),
  severity: z.enum(['Low','Medium','High']),
  status: z.enum(['Open','Resolved']).optional(),
})

router.post('/:id/findings', authMiddleware, async (req: AuthedRequest, res) => {
  const parsed = findingSchema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() })
  const pushDoc = {
    title: parsed.data.title,
    description: parsed.data.description,
    severity: parsed.data.severity,
    status: parsed.data.status || 'Open',
    createdAt: new Date(),
  }
  const updated = await Audit.findOneAndUpdate(
    { _id: req.params.id, userId: req.userId },
    { $push: { findings: pushDoc } },
    { new: true }
  )
  if (!updated) return res.status(404).json({ error: 'Not found' })
  const newId = updated.findings[updated.findings.length - 1]._id
  res.status(201).json({ id: String(newId) })
})

const findingPatchSchema = z.object({
  title: z.string().min(2).optional(),
  description: z.string().optional(),
  severity: z.enum(['Low','Medium','High']).optional(),
  status: z.enum(['Open','Resolved']).optional(),
})

router.put('/:id/findings/:fid', authMiddleware, async (req: AuthedRequest, res) => {
  const parsed = findingPatchSchema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() })
  const setOps: any = {}
  for (const [k, v] of Object.entries(parsed.data)) {
    setOps[`findings.$.${k}`] = v
  }
  const updated = await Audit.findOneAndUpdate(
    { _id: req.params.id, userId: req.userId, 'findings._id': req.params.fid },
    { $set: setOps },
    { new: true }
  )
  if (!updated) return res.status(404).json({ error: 'Not found' })
  res.json({ id: req.params.fid })
})

export default router
