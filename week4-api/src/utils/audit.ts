import { AuditLogModel, AuditStatus } from '../models/AuditLog'

export interface LogActionOptions {
  userId: string
  userEmail: string
  action: string
  resourceType: string
  resourceId: string
  changes?: {
    before?: Record<string, any>
    after?: Record<string, any>
  }
  ipAddress: string
  status?: AuditStatus
}

export async function logAction(options: LogActionOptions): Promise<void> {
  try {
    await AuditLogModel.create({
      userId: options.userId,
      userEmail: options.userEmail,
      action: options.action,
      resourceType: options.resourceType,
      resourceId: options.resourceId,
      changes: options.changes || {},
      ipAddress: options.ipAddress,
      status: options.status || 'success',
    })
  } catch (error) {
    // Log errors but don't throw to avoid breaking main operations
    console.error('Failed to log audit action:', error)
  }
}

export function getClientIp(req: any): string {
  return (
    req.headers['x-forwarded-for'] as string ||
    req.headers['x-real-ip'] as string ||
    req.connection?.remoteAddress ||
    req.socket?.remoteAddress ||
    req.ip ||
    'unknown'
  )
}
