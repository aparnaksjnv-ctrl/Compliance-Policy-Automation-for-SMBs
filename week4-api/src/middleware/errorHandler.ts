import { Request, Response, NextFunction } from 'express'
import { ZodError } from 'zod'

/**
 * Terminal error middleware. Must be registered after all routes.
 * Turns a thrown error into a response instead of an unhandled rejection.
 */
export function errorHandler(err: any, _req: Request, res: Response, _next: NextFunction) {
  if (res.headersSent) return

  // Malformed ObjectId in a path param, e.g. /audits/undefined
  if (err?.name === 'CastError') {
    return res.status(400).json({ error: 'Invalid id' })
  }

  if (err instanceof ZodError) {
    return res.status(400).json({ error: err.flatten() })
  }

  if (err?.name === 'ValidationError') {
    return res.status(400).json({ error: err.message })
  }

  console.error('[week4-api] unhandled error:', err)
  return res.status(500).json({ error: 'Internal server error' })
}
