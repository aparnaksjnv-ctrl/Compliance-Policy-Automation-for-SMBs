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

// Generate content for a policy using a selected template and optional company data.
// This is a lightweight local generator. You can wire OpenAI/HF by replacing the generator below.
router.post('/generate', authMiddleware, async (req: AuthedRequest, res) => {
  const schema = z.object({
    template: z.enum(['GDPR', 'HIPAA', 'CCPA']),
    company: z.any().optional(),
    existingContent: z.string().optional(),
  })
  const parsed = schema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() })

  const { template, company, existingContent } = parsed.data

  function pick<T>(o: any, k: string, fallback: T): T { try { return (o && o[k]) ?? fallback } catch { return fallback } }
  const companyName = pick<string>(company, 'name', 'Your Company')
  const industry = pick<string>(company, 'industry', 'General')
  const region = pick<string>(company, 'region', 'US')

  const base: Record<'GDPR'|'HIPAA'|'CCPA', string> = {
    GDPR: `GDPR Privacy Policy for ${companyName}

Overview
This policy describes how ${companyName} processes personal data in the ${region} and EU in accordance with GDPR.

Data Collection
- Categories: identification, contact, usage
- Purposes: service delivery, security, analytics

Lawful Basis
- Contract, Legitimate Interests, Consent (where applicable)

Data Subject Rights
- Access, Rectification, Erasure, Restriction, Portability, Objection

Security Measures
- Encryption at rest and in transit; access control; logging; regular reviews

Retention
- Data retained only as long as necessary for ${industry} operations.
`,
    HIPAA: `HIPAA Policy for ${companyName}

Overview
This policy outlines safeguards for Protected Health Information (PHI) handled by ${companyName}.

Administrative Safeguards
- Risk analysis, workforce training, BAAs with vendors

Physical Safeguards
- Facility access controls, device/media controls

Technical Safeguards
- Access controls, audit controls, integrity, transmission security
`,
    CCPA: `CCPA Notice for ${companyName}

Categories Collected
- Identifiers, commercial information, internet activity

Purposes
- Service delivery, security, debugging, short-term transient use

Consumer Rights
- Right to know, delete, opt-out of sale/share, non-discrimination
`,
  }

  const merged = `${base[template]}
${existingContent ? `\n---\nExisting Notes\n${existingContent}` : ''}`

  res.json({ content: merged })
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

// Export policy content, optionally uploading to S3 when configured.
router.post('/:id/export', authMiddleware, async (req: AuthedRequest, res) => {
  const doc = await Policy.findOne({ _id: req.params.id, userId: req.userId })
  if (!doc) return res.status(404).json({ error: 'Not found' })
  const content = doc.content || ''

  const bucket = process.env.AWS_S3_BUCKET
  if (bucket) {
    try {
      const mod: any = await (new Function('m', 'return import(m)'))('@aws-sdk/client-s3')
      const S3Client = mod.S3Client
      const PutObjectCommand = mod.PutObjectCommand
      const client = new S3Client({ region: process.env.AWS_REGION || 'us-east-1' })
      const key = `policies/${String(req.userId)}/${String(doc._id)}.txt`
      await client.send(new PutObjectCommand({ Bucket: bucket, Key: key, Body: content, ContentType: 'text/plain' }))
      const url = `https://${bucket}.s3.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com/${key}`
      return res.json({ ok: true, url })
    } catch (e) {
      return res.json({ ok: true, error: 'S3 upload failed or SDK not installed', content })
    }
  }
  res.json({ ok: true, content })
})

export default router
