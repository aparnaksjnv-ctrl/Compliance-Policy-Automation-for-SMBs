import dotenv from 'dotenv'

dotenv.config()

export interface AppConfig {
  port: number
  mongoUri: string
  jwtSecret: string
  corsOrigin: string
  fieldEncryptionKey: string
}

export const config: AppConfig = {
  port: Number(process.env.PORT ?? 5000),
  mongoUri: process.env.MONGO_URI || '',
  jwtSecret: process.env.JWT_SECRET || 'dev-secret',
  corsOrigin: process.env.CORS_ORIGIN ?? 'http://localhost:5173',
  fieldEncryptionKey: process.env.FIELD_ENCRYPTION_KEY || '',
}

export function assertNonEmptyString(value: string, envName: string) {
  if (!value) throw new Error(`Missing required env var ${envName}`)
  return value
}
