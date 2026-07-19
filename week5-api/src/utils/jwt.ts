import jwt from 'jsonwebtoken'
import { config } from '../config'

export function signJwt(userId: string) {
  return jwt.sign({ sub: userId }, config.jwtSecret, { expiresIn: '7d' })
}

export function verifyJwt(token: string): { sub: string, iat: number, exp: number } {
  return jwt.verify(token, config.jwtSecret) as any
}
