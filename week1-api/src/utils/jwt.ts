import jwt from 'jsonwebtoken'
import { config, assertNonEmptyString } from '../config'

export interface JwtPayload {
  sub: string
}

export function signJwt(userId: string): string {
  const secret = assertNonEmptyString(config.jwtSecret, 'JWT_SECRET')
  return jwt.sign({ sub: userId } as JwtPayload, secret, { expiresIn: '7d' })
}

export function verifyJwt(token: string): JwtPayload {
  const secret = assertNonEmptyString(config.jwtSecret, 'JWT_SECRET')
  return jwt.verify(token, secret) as JwtPayload
}
