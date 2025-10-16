import { Router } from 'express'
import { z } from 'zod'
import { authMiddleware, AuthedRequest } from '../middleware/auth'
import { Assessment, AssessmentStatus } from '../models/Assessment'

const router = Router()

const baseSchema = z.object({
  name: z.string().min(2),
  owner: z.string().min(2),
  framework: z.enum(['GDPR','HIPAA','CCPA','Other']).optional(),
  status: z.enum(['Draft','In Progress','Completed']).default('Draft'),
  dueDate: z.string().optional(),
})

router.get('/', authMiddleware, async (req: AuthedRequest, res) => {
  const userId = req.userId!
  const q = String(req.query.q || '').toLowerCase()
  const status = String(req.query.status || '') as AssessmentStatus | ''
  const framework = String(req.query.framework || '')
  const dueBefore = String(req.query.dueBefore || '')
  const filter: any = { userId }
  if (q) filter.$or = [{ name: { $regex: q, $options: 'i' } }, { owner: { $regex: q, $options: 'i' } }]
  if (status && ['Draft','In Progress','Completed'].includes(status)) filter.status = status
  if (framework && ['GDPR','HIPAA','CCPA','Other'].includes(framework)) filter.framework = framework
  if (dueBefore) {
    const dt = new Date(dueBefore)
    if (!isNaN(dt.getTime())) filter.dueDate = { $lte: dt }
  }
  const items = await Assessment.find(filter).sort({ updatedAt: -1 }).lean()
  res.json({ items })
})

router.post('/', authMiddleware, async (req: AuthedRequest, res) => {
  const parsed = baseSchema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() })
  const { name, owner, framework, status, dueDate } = parsed.data
  const base: any = { userId: req.userId, name, owner, framework, status }
  if (dueDate) {
    const dt = new Date(dueDate)
    if (!isNaN(dt.getTime())) base.dueDate = dt
  }
  const created = await Assessment.create(base)
  res.status(201).json({ id: created.id })
})

router.get('/:id', authMiddleware, async (req: AuthedRequest, res) => {
  const doc = await Assessment.findOne({ _id: req.params.id, userId: req.userId })
  if (!doc) return res.status(404).json({ error: 'Not found' })
  res.json(doc)
})

router.put('/:id', authMiddleware, async (req: AuthedRequest, res) => {
  const parsed = baseSchema.partial().safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() })
  const patch: any = { ...parsed.data }
  if (Object.prototype.hasOwnProperty.call(parsed.data, 'dueDate')) {
    const s = (parsed.data as any).dueDate
    if (typeof s === 'string' && s) {
      const dt = new Date(s)
      patch.dueDate = isNaN(dt.getTime()) ? undefined : dt
    } else {
      patch.dueDate = undefined
    }
  }
  const updated = await Assessment.findOneAndUpdate(
    { _id: req.params.id, userId: req.userId },
    { $set: patch },
    { new: true }
  )
  if (!updated) return res.status(404).json({ error: 'Not found' })
  res.json({ id: updated.id })
})

const itemCreateSchema = z.object({
  text: z.string().min(5),
  category: z.string().optional(),
  severity: z.enum(['Low','Medium','High']).default('Medium'),
})

router.post('/:id/items', authMiddleware, async (req: AuthedRequest, res) => {
  const parsed = itemCreateSchema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() })
  const pushDoc = {
    text: parsed.data.text,
    category: parsed.data.category,
    severity: parsed.data.severity,
    response: 'N/A' as const,
    createdAt: new Date(),
  }
  const updated = await Assessment.findOneAndUpdate(
    { _id: req.params.id, userId: req.userId },
    { $push: { items: pushDoc } },
    { new: true }
  )
  if (!updated) return res.status(404).json({ error: 'Not found' })
  const newId = updated.items[updated.items.length - 1]._id
  res.status(201).json({ id: String(newId) })
})

const itemPatchSchema = z.object({
  text: z.string().min(5).optional(),
  category: z.string().optional(),
  severity: z.enum(['Low','Medium','High']).optional(),
  response: z.enum(['Yes','No','N/A']).optional(),
  notes: z.string().optional(),
  evidenceUrls: z.array(z.string().url()).optional(),
})

router.put('/:id/items/:iid', authMiddleware, async (req: AuthedRequest, res) => {
  const parsed = itemPatchSchema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() })
  const setOps: any = {}
  for (const [k, v] of Object.entries(parsed.data)) setOps[`items.$.${k}`] = v
  const updated = await Assessment.findOneAndUpdate(
    { _id: req.params.id, userId: req.userId, 'items._id': req.params.iid },
    { $set: setOps },
    { new: true }
  )
  if (!updated) return res.status(404).json({ error: 'Not found' })
  res.json({ id: req.params.iid })
})

export default router
