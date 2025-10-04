import { Router } from 'express'
import { z } from 'zod'
import { authMiddleware, AuthedRequest } from '../middleware/auth'
import { Company } from '../models/Company'
import { encryptJSON, decryptJSON } from '../utils/crypto'
import { config, assertNonEmptyString } from '../config'

const router = Router()

const companySchema = z.object({
  industry: z.string().min(2),
  region: z.string().min(2),
  size: z.string().min(1), // e.g., "1-10", "11-50", etc.
})

// Get current user's company profile (decrypted)
router.get('/', authMiddleware, async (req: AuthedRequest, res) => {
  try {
    const userId = req.userId!
    const doc = await Company.findOne({ userId })
    if (!doc) return res.status(404).json({ error: 'Not found' })
    // Ensure encryption key configured
    assertNonEmptyString(config.fieldEncryptionKey, 'FIELD_ENCRYPTION_KEY')
    const payload = decryptJSON<Record<string, unknown>>(doc.encrypted)
    return res.json({ profile: payload })
  } catch (err) {
    return res.status(500).json({ error: 'Failed to load profile' })
  }
})

// Create or update current user's company profile (encrypted at rest)
router.post('/', authMiddleware, async (req: AuthedRequest, res) => {
  const parsed = companySchema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() })
  try {
    const userId = req.userId!
    assertNonEmptyString(config.fieldEncryptionKey, 'FIELD_ENCRYPTION_KEY')
    const encrypted = encryptJSON(parsed.data)
    const updated = await Company.findOneAndUpdate(
      { userId },
      { $set: { encrypted } },
      { new: true, upsert: true }
    )
    return res.status(201).json({ id: updated.id })
  } catch (err) {
    return res.status(500).json({ error: 'Failed to save profile' })
  }
})

export default router
