import mongoose, { Schema, Document, Model, Types } from 'mongoose'

export type PolicyStatus = 'Draft' | 'In Review' | 'Approved'

export interface IPolicy extends Document {
  userId: Types.ObjectId
  name: string
  owner: string
  status: PolicyStatus
  content?: string
  framework?: 'GDPR' | 'HIPAA' | 'CCPA' | 'Other'
  company?: string
  variables?: Record<string, unknown>
  versions?: { content: string; note?: string; createdAt: Date }[]
}

const PolicySchema = new Schema<IPolicy>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  name: { type: String, required: true },
  owner: { type: String, required: true },
  status: { type: String, enum: ['Draft', 'In Review', 'Approved'], default: 'Draft', index: true },
  content: { type: String },
  framework: { type: String, enum: ['GDPR', 'HIPAA', 'CCPA', 'Other'], default: undefined },
  company: { type: String, default: undefined },
  variables: { type: Schema.Types.Mixed, default: undefined },
  versions: {
    type: [
      new Schema(
        {
          content: { type: String, required: true },
          note: { type: String },
          createdAt: { type: Date, default: Date.now },
        },
        { _id: true }
      ),
    ],
    default: [],
  },
}, { timestamps: true })

PolicySchema.index({ userId: 1, name: 1 })

export const Policy: Model<IPolicy> = mongoose.models.Policy || mongoose.model<IPolicy>('Policy', PolicySchema)
