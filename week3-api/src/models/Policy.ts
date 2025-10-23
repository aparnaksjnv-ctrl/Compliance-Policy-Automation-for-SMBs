import mongoose, { Schema, Document, Model, Types } from 'mongoose'

export type PolicyStatus = 'Draft' | 'In Review' | 'Approved'
export type Framework = 'GDPR' | 'HIPAA' | 'CCPA' | 'Other'

export interface IPolicyVersion {
  content: string
  note?: string
  createdAt: Date
}

export interface IPolicy extends Document {
  userId: Types.ObjectId
  name: string
  owner: string
  status: PolicyStatus
  content?: string
  framework?: Framework
  company?: string
  variables?: Record<string, unknown>
  versions?: IPolicyVersion[]
}

const PolicySchema = new Schema<IPolicy>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true },
    owner: { type: String, required: true },
    status: { type: String, enum: ['Draft', 'In Review', 'Approved'], default: 'Draft', index: true },
    content: { type: String },
    framework: { type: String, enum: ['GDPR', 'HIPAA', 'CCPA', 'Other'], index: true },
    company: { type: String },
    variables: { type: Schema.Types.Mixed },
    versions: [
      new Schema<IPolicyVersion>(
        {
          content: { type: String, required: true },
          note: { type: String },
          createdAt: { type: Date, default: Date.now },
        },
        { _id: true }
      ),
    ],
  },
  { timestamps: true }
)

PolicySchema.index({ userId: 1, name: 1 })

export const Policy: Model<IPolicy> = mongoose.models.Policy || mongoose.model<IPolicy>('Policy', PolicySchema)
