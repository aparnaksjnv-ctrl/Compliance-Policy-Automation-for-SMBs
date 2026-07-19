import { Request, Response, NextFunction, RequestHandler } from 'express'

/**
 * Express 4 does not catch rejections from async handlers, so an unhandled
 * rejection takes down the process. Wrap async handlers with this so the
 * rejection is forwarded to the error middleware instead.
 */
export function asyncHandler<Req extends Request = Request>(
  fn: (req: Req, res: Response, next: NextFunction) => Promise<unknown>
): RequestHandler {
  return (req, res, next) => {
    Promise.resolve(fn(req as unknown as Req, res, next)).catch(next)
  }
}
