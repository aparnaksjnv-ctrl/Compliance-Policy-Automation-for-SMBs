import { Router } from 'express'
import { z } from 'zod'
import { Policy, PolicyStatus } from '../models/Policy'
import { authMiddleware, AuthedRequest } from '../middleware/auth'
import { User } from '../models/User'

const router = Router()

const policySchema = z.object({
  name: z.string().min(2),
  owner: z.string().min(2),
  status: z.enum(['Draft', 'In Review', 'Approved']),
  content: z.string().optional(),
  framework: z.enum(['GDPR','HIPAA','CCPA','Other']).optional(),
  company: z.string().min(2).optional(),
  variables: z.record(z.any()).optional(),
})

router.get('/', authMiddleware, async (req: AuthedRequest, res) => {
  const userId = req.userId!
  const q = String(req.query.q || '').toLowerCase()
  const status = String(req.query.status || '') as PolicyStatus | ''
  const framework = String(req.query.framework || '')
  const filter: any = { userId }
  if (status && ['Draft','In Review','Approved'].includes(status)) filter.status = status
  if (framework && ['GDPR','HIPAA','CCPA','Other'].includes(framework)) filter.framework = framework
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
  const base: any = { ...parsed.data, userId: req.userId }
  if (parsed.data.content) {
    base.versions = [{ content: parsed.data.content, note: 'initial draft', createdAt: new Date() }]
  }
  const created = await Policy.create(base)
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
  const updateOps: any = { $set: parsed.data }
  const note = typeof (req.body?.note) === 'string' ? String(req.body.note) : undefined
  if (Object.prototype.hasOwnProperty.call(parsed.data, 'content')) {
    const contentVal = (parsed.data as any).content
    if (typeof contentVal === 'string') {
      updateOps.$push = { versions: { content: contentVal, note, createdAt: new Date() } }
    }
  }
  const updated = await Policy.findOneAndUpdate(
    { _id: req.params.id, userId: req.userId },
    updateOps,
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

// Status transitions
router.post('/:id/submit-review', authMiddleware, async (req: AuthedRequest, res) => {
  const updated = await Policy.findOneAndUpdate(
    { _id: req.params.id, userId: req.userId },
    { $set: { status: 'In Review' as PolicyStatus } },
    { new: true }
  )
  if (!updated) return res.status(404).json({ error: 'Not found' })
  res.json({ id: updated.id, status: updated.status })
})

router.post('/:id/approve', authMiddleware, async (req: AuthedRequest, res) => {
  const user = await User.findById(req.userId).lean()
  if (!user || user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' })
  const updated = await Policy.findOneAndUpdate(
    { _id: req.params.id, userId: req.userId },
    { $set: { status: 'Approved' as PolicyStatus } },
    { new: true }
  )
  if (!updated) return res.status(404).json({ error: 'Not found' })
  res.json({ id: updated.id, status: updated.status })
})

// Versions
router.get('/:id/versions', authMiddleware, async (req: AuthedRequest, res) => {
  const doc = await Policy.findOne({ _id: req.params.id, userId: req.userId }).lean()
  if (!doc) return res.status(404).json({ error: 'Not found' })
  res.json({ versions: doc.versions || [] })
})

// AI-assisted draft generation (optional)
router.post('/:id/generate', authMiddleware, async (req: AuthedRequest, res) => {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) return res.status(501).json({ error: 'AI generation not configured' })

  const genSchema = z.object({
    prompt: z.string().min(8).max(4000).optional(),
    variables: z.record(z.any()).optional(),
    model: z.string().optional(),
  })
  const parsed = genSchema.safeParse(req.body || {})
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() })

  const policy = await Policy.findOne({ _id: req.params.id, userId: req.userId })
  if (!policy) return res.status(404).json({ error: 'Not found' })

  const model = parsed.data.model || process.env.OPENAI_MODEL || 'gpt-4o-mini'
  const vars = parsed.data.variables || {}
  const varsList = Object.entries(vars)
    .filter(([_, v]) => typeof v === 'string' && v)
    .map(([k, v]) => `${k}: ${String(v)}`)
    .slice(0, 16)
    .join(', ')
  const system = `You are a compliance policy drafting assistant. Generate a clear, structured, and legally-aligned policy draft.
Framework: ${policy.framework || 'N/A'}
Company: ${policy.company || 'N/A'}
Variables: ${varsList || 'None provided'}
Instructions: Keep sections with headings and bullet points where helpful. Do not fabricate facts.`
  const userMsg = parsed.data.prompt || 'Draft a concise, organization-ready policy based on the given framework and company context.'

  try {
    const r = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        temperature: 0.2,
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: userMsg },
        ],
      }),
    })
    if (!r.ok) {
      const txt = await r.text().catch(() => '')
      return res.status(502).json({ error: `AI provider error: ${r.status} ${r.statusText} ${txt}` })
    }
    const data = await r.json() as any
    const content = data?.choices?.[0]?.message?.content?.trim()
    if (!content) return res.status(502).json({ error: 'No content from AI provider' })

    policy.content = content
    policy.versions = policy.versions || []
    policy.versions.push({ content, note: 'ai generated draft', createdAt: new Date() })
    await policy.save()

    res.json({ content })
  } catch (e: any) {
    res.status(500).json({ error: e?.message || 'Generation failed' })
  }
})

export default router
