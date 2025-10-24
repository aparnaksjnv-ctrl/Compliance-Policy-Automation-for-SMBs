import mongoose, { Schema, Document, Model, Types } from 'mongoose'

export type RiskSeverity = 'Low' | 'Medium' | 'High'
export type FindingStatus = 'Open' | 'Resolved'
export type AuditStatus = 'Draft' | 'In Progress' | 'Closed'

export interface IFinding extends Document {
  title: string
  description?: string
  severity: RiskSeverity
  status: FindingStatus
  createdAt: Date
}

export interface IAudit extends Document {
  userId: Types.ObjectId
  name: string
  owner: string
  status: AuditStatus
  dueDate?: Date
  findings: IFinding[]
}

const FindingSchema = new Schema<IFinding>({
  title: { type: String, required: true },
  description: { type: String, default: undefined },
  severity: { type: String, enum: ['Low','Medium','High'], default: 'Medium' },
  status: { type: String, enum: ['Open','Resolved'], default: 'Open', index: true },
  createdAt: { type: Date, default: Date.now },
}, { _id: true })

const AuditSchema = new Schema<IAudit>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  name: { type: String, required: true },
  owner: { type: String, required: true },
  status: { type: String, enum: ['Draft','In Progress','Closed'], default: 'Draft', index: true },
  dueDate: { type: Date, default: undefined },
  findings: { type: [FindingSchema], default: [] },
}, { timestamps: true })

AuditSchema.index({ userId: 1, name: 1 })

export const Audit: Model<IAudit> = mongoose.models.Audit || mongoose.model<IAudit>('Audit', AuditSchema)
