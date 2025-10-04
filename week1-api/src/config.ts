import dotenv from 'dotenv'

dotenv.config()

export const config = {
  port: Number(process.env.PORT ?? 4000),
  // Allow empty values at import-time; validate at usage sites
  mongoUri: process.env.MONGO_URI || '',
  jwtSecret: process.env.JWT_SECRET || '',
  corsOrigin: process.env.CORS_ORIGIN ?? 'http://localhost:5173',
  fieldEncryptionKey: process.env.FIELD_ENCRYPTION_KEY || '', // 32-byte key (base64)
  useInMemory: process.env.USE_INMEMORY_DB === 'true',
}

export function assertEnv(name: keyof typeof config) {
  const val = config[name]
  if (!val) throw new Error(`Missing required env var ${name}`)
  return val
}
