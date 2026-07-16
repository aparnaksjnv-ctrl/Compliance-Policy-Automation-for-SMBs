import mongoose, { Schema, Document } from 'mongoose'

export type AuditStatus = 'success' | 'failure'

export interface AuditLog extends Document {
  userId: string
  userEmail: string
  action: string
  resourceType: string
  resourceId: string
  changes: {
    before?: Record<string, any>
    after?: Record<string, any>
  }
  ipAddress: string
  timestamp: Date
  status: AuditStatus
}

const AuditLogSchema = new Schema<AuditLog>(
  {
    userId: { type: String, required: true, index: true },
    userEmail: { type: String, required: true },
    action: { type: String, required: true, index: true },
    resourceType: { type: String, required: true, index: true },
    resourceId: { type: String, required: true, index: true },
    changes: {
      before: { type: Schema.Types.Mixed, default: undefined },
      after: { type: Schema.Types.Mixed, default: undefined },
    },
    ipAddress: { type: String, required: true },
    timestamp: { type: Date, default: Date.now, index: true },
    status: { type: String, enum: ['success', 'failure'], required: true, index: true },
  },
  {
    timestamps: true,
  }
)

// Compound indexes for common queries
AuditLogSchema.index({ userId: 1, timestamp: -1 })
AuditLogSchema.index({ resourceType: 1, resourceId: 1, timestamp: -1 })

export const AuditLogModel = mongoose.model<AuditLog>('AuditLog', AuditLogSchema)
