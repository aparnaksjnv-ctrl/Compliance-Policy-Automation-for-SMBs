import dotenv from 'dotenv'

dotenv.config()

export interface AppConfig {
  port: number
  mongoUri: string
  jwtSecret: string
  corsOrigin: string
  fieldEncryptionKey: string
  useInMemory: boolean
}

export const config: AppConfig = {
  port: Number(process.env.PORT ?? 5000),
  mongoUri: process.env.MONGO_URI || '',
  jwtSecret: process.env.JWT_SECRET || 'dev-secret',
  corsOrigin: process.env.CORS_ORIGIN ?? 'http://localhost:5173',
  fieldEncryptionKey: process.env.FIELD_ENCRYPTION_KEY || '',
  // Default to in-memory if MONGO_URI is not provided, or explicit flag is set
  useInMemory: process.env.USE_INMEMORY_DB === 'true' || !process.env.MONGO_URI,
}

export function assertNonEmptyString(value: string, envName: string) {
  if (!value) throw new Error(`Missing required env var ${envName}`)
  return value
}
