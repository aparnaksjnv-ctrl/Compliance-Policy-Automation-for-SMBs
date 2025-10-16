import { Router } from 'express'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { User } from '../models/User'
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
