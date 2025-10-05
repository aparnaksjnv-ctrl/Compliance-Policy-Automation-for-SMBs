import mongoose, { Schema, Document, Model, Types } from 'mongoose'

export type PolicyStatus = 'Draft' | 'In Review' | 'Approved'

export interface IPolicy extends Document {
  userId: Types.ObjectId
  name: string
  owner: string
  status: PolicyStatus
  content?: string
}

const PolicySchema = new Schema<IPolicy>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  name: { type: String, required: true },
  owner: { type: String, required: true },
  status: { type: String, enum: ['Draft', 'In Review', 'Approved'], default: 'Draft', index: true },
  content: { type: String },
}, { timestamps: true })

PolicySchema.index({ userId: 1, name: 1 })

export const Policy: Model<IPolicy> = mongoose.models.Policy || mongoose.model<IPolicy>('Policy', PolicySchema)
