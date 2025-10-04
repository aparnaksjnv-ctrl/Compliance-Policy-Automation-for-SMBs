import crypto from 'crypto'
import { config } from '../config'

function getKey(): Buffer {
  const base64 = config.fieldEncryptionKey
  const key = Buffer.from(base64, 'base64')
  if (key.length !== 32) {
    throw new Error('FIELD_ENCRYPTION_KEY must be 32 bytes base64')
  }
  return key
}

export type EncryptedPayload = {
  iv: string
  tag: string
  ciphertext: string
}

export function encryptJSON<T extends object>(obj: T): EncryptedPayload {
  const key = getKey()
  const iv = crypto.randomBytes(12)
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv)
  const plaintext = Buffer.from(JSON.stringify(obj), 'utf8')
  const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()])
  const tag = cipher.getAuthTag()
  return {
    iv: iv.toString('base64'),
    tag: tag.toString('base64'),
    ciphertext: ciphertext.toString('base64'),
  }
}

export function decryptJSON<T = unknown>(enc: EncryptedPayload): T {
  const key = getKey()
  const iv = Buffer.from(enc.iv, 'base64')
  const tag = Buffer.from(enc.tag, 'base64')
  const ciphertext = Buffer.from(enc.ciphertext, 'base64')
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv)
  decipher.setAuthTag(tag)
  const plaintext = Buffer.concat([decipher.update(ciphertext), decipher.final()])
  return JSON.parse(plaintext.toString('utf8')) as T
}
