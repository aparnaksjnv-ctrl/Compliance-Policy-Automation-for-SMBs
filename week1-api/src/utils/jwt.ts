import jwt from 'jsonwebtoken'
import { assertEnv, config } from '../config'

export interface JwtPayload {
  sub: string
}

export function signJwt(userId: string): string {
  const secret = assertEnv('jwtSecret')
  return jwt.sign({ sub: userId } as JwtPayload, secret, { expiresIn: '7d' })
}

export function verifyJwt(token: string): JwtPayload {
  const secret = assertEnv('jwtSecret')
  return jwt.verify(token, secret) as JwtPayload
}
