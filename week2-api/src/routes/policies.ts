import { Router } from 'express'
import { z } from 'zod'
import { Policy, PolicyStatus } from '../models/Policy'
import { authMiddleware, AuthedRequest } from '../middleware/auth'

const router = Router()

const policySchema = z.object({
  name: z.string().min(2),
  owner: z.string().min(2),
  status: z.enum(['Draft', 'In Review', 'Approved']),
  content: z.string().optional(),
})

router.get('/', authMiddleware, async (req: AuthedRequest, res) => {
  const userId = req.userId!
  const q = String(req.query.q || '').toLowerCase()
  const status = String(req.query.status || '') as PolicyStatus | ''
  const filter: any = { userId }
  if (status && ['Draft','In Review','Approved'].includes(status)) filter.status = status
  if (q) filter.$or = [
    { name: { $regex: q, $options: 'i' } },
    { owner: { $regex: q, $options: 'i' } },
  ]
  const list = await Policy.find(filter).sort({ updatedAt: -1 }).lean()
  res.json({ items: list })
})

router.post('/', authMiddleware, async (req: AuthedRequest, res) => {
  const parsed = policySchema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() })
  const created = await Policy.create({ ...parsed.data, userId: req.userId })
  res.status(201).json({ id: created.id })
})

router.get('/:id', authMiddleware, async (req: AuthedRequest, res) => {
  const doc = await Policy.findOne({ _id: req.params.id, userId: req.userId })
  if (!doc) return res.status(404).json({ error: 'Not found' })
  res.json(doc)
})

router.put('/:id', authMiddleware, async (req: AuthedRequest, res) => {
  const parsed = policySchema.partial().safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() })
  const updated = await Policy.findOneAndUpdate(
    { _id: req.params.id, userId: req.userId },
    { $set: parsed.data },
    { new: true }
  )
  if (!updated) return res.status(404).json({ error: 'Not found' })
  res.json({ id: updated.id })
})

router.delete('/:id', authMiddleware, async (req: AuthedRequest, res) => {
  const deleted = await Policy.findOneAndDelete({ _id: req.params.id, userId: req.userId })
  if (!deleted) return res.status(404).json({ error: 'Not found' })
  res.status(204).send()
})

export default router
