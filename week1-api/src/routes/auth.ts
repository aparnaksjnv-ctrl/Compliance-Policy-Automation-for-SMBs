import { Router } from 'express'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { User } from '../models/User'
import { signJwt } from '../utils/jwt'

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
  const user = await User.create({ email, passwordHash })
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
