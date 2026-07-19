import { Router } from 'express'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { User } from '../models/User'
import { Policy } from '../models/Policy'
import { Audit } from '../models/Audit'
import { Assessment } from '../models/Assessment'
import { Activity } from '../models/Activity'
import * as vendorsStore from '../store/vendorsStore'
import { signJwt } from '../utils/jwt'
import { authMiddleware, AuthedRequest } from '../middleware/auth'

const router = Router()

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
})

router.post('/register', async (req, res) => {
  const parsed = registerSchema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() })
  const { email, password } = parsed.data

  const existing = await User.findOne({ email })
  if (existing) return res.status(409).json({ error: 'Email already registered' })

  const passwordHash = await bcrypt.hash(password, 12)
  const hasAdmin = await User.exists({ role: 'admin' })
  const role: 'user' | 'admin' = hasAdmin ? 'user' : 'admin'
  const user = await User.create({ email, passwordHash, role })
  const token = signJwt(user.id)
  return res.status(201).json({ token })
})

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
})

router.post('/login', async (req, res) => {
  const parsed = loginSchema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() })
  const { email, password } = parsed.data

  const user = await User.findOne({ email })
  if (!user) return res.status(401).json({ error: 'Invalid credentials' })

  const ok = await bcrypt.compare(password, user.passwordHash)
  if (!ok) return res.status(401).json({ error: 'Invalid credentials' })

  const token = signJwt(user.id)
  return res.json({ token })
})

export default router

// Return current user profile
router.get('/me', authMiddleware, async (req: AuthedRequest, res) => {
  const user = await User.findById(req.userId).lean()
  if (!user) return res.status(404).json({ error: 'Not found' })
  return res.json({ id: String(user._id), email: user.email, role: user.role })
})

// Admin: list all users
router.get('/users', authMiddleware, async (req: AuthedRequest, res) => {
  const me = await User.findById(req.userId).lean()
  if (!me || me.role !== 'admin') return res.status(403).json({ error: 'Forbidden' })
  const users = await User.find({}, { email: 1, role: 1 }).sort({ createdAt: 1 }).lean()
  const items = [] as any[]
  for (const u of users) {
    const uid = u._id
    const [policies, audits, assessments, activities] = await Promise.all([
      Policy.countDocuments({ userId: uid }),
      Audit.countDocuments({ userId: uid }),
      Assessment.countDocuments({ userId: uid }),
      Activity.countDocuments({ userId: uid }),
    ])
    const v = await vendorsStore.listByUser(String(uid)).catch(() => [])
    items.push({ id: String(uid), email: u.email, role: u.role, counts: { policies, audits, assessments, vendors: v.length, activities } })
  }
  return res.json({ items })
})

// Bootstrap demo data for the current user if they have zero items
router.post('/bootstrap', authMiddleware, async (req: AuthedRequest, res) => {
  const uid = req.userId!
  const [pc, ac, sc] = await Promise.all([
    Policy.countDocuments({ userId: uid }),
    Audit.countDocuments({ userId: uid }),
    Assessment.countDocuments({ userId: uid }),
  ])
  if ((pc + ac + sc) > 0) return res.json({ ok: true, seeded: false })
  // Create sample records similar to seed.ts
  await Policy.create([
    { userId: uid as any, name: 'GDPR Privacy Policy', owner: 'Alice', status: 'Draft', framework: 'GDPR', company: 'Acme Ltd', content: 'Sample GDPR policy content.' },
    { userId: uid as any, name: 'HIPAA Security Policy', owner: 'Bob', status: 'In Review', framework: 'HIPAA', company: 'Acme Health', content: 'Sample HIPAA policy content.' },
    { userId: uid as any, name: 'CCPA Consumer Policy', owner: 'Carol', status: 'Approved', framework: 'CCPA', company: 'Acme Retail', content: 'Sample CCPA policy content.' },
  ] as any)
  await Audit.create([
    { userId: uid as any, name: 'Q4 Security Audit', owner: 'Alice', status: 'In Progress', findings: [
      { title: 'Open S3 bucket', description: 'Public read on logs bucket', severity: 'High', status: 'Open', createdAt: new Date() },
      { title: 'Weak TLS settings', description: 'Outdated ciphers enabled', severity: 'Medium', status: 'Resolved', createdAt: new Date() },
    ] },
  ] as any)
  await Assessment.create([
    { userId: uid as any, name: 'GDPR Readiness 2025', owner: 'Alice', framework: 'GDPR', status: 'In Progress', items: [
      { text: 'Records of processing up to date?', category: 'Records', severity: 'Medium', response: 'Yes', createdAt: new Date() },
    ] },
  ] as any)
  await vendorsStore.upsertMany(String(uid), [
    { name: 'AWS', serviceType: 'Cloud', standards: ['SOC 2', 'ISO 27001'], riskLevel: 'Medium', status: 'Compliant', lastAuditDate: new Date().toISOString().slice(0, 10) },
    { name: 'Stripe', serviceType: 'Payments', standards: ['PCI DSS'], riskLevel: 'Low', status: 'Compliant' },
  ])
  return res.json({ ok: true, seeded: true })
})
