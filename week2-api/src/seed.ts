import bcrypt from 'bcryptjs'
import { User } from './models/User'
import { config } from './config'

export async function runSeed() {
  try {
    let email = process.env.DEFAULT_ADMIN_EMAIL
    let password = process.env.DEFAULT_ADMIN_PASSWORD
    // In dev/in-memory mode, if not provided, seed a convenience admin
    if ((!email || !password) && config.useInMemory) {
      email = email || 'admin@local.test'
      password = password || 'password1234'
    }
    if (!email || !password) return

    const existing = await User.findOne({ email }).lean()
    if (existing) {
      return
    }

    const passwordHash = await bcrypt.hash(password, 12)
    // Always ensure we seed an admin user if requested
    await User.create({ email, passwordHash, role: 'admin' })
    // eslint-disable-next-line no-console
    console.log(`[seed] Created default admin: ${email}`)
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn('[seed] failed:', e)
  }
}
