import mongoose, { Schema, Document, Model, Types } from 'mongoose'

export type AssessmentStatus = 'Draft' | 'In Progress' | 'Completed'
export type ItemResponse = 'Yes' | 'No' | 'N/A'
export type Severity = 'Low' | 'Medium' | 'High'

export interface IAssessmentItem extends Document {
  text: string
  category?: string
  severity: Severity
  response: ItemResponse
  notes?: string
  evidenceUrls?: string[]
  createdAt: Date
}

export interface IAssessment extends Document {
  userId: Types.ObjectId
  name: string
  owner: string
  framework?: 'GDPR' | 'HIPAA' | 'CCPA' | 'Other'
  status: AssessmentStatus
  dueDate?: Date
  items: IAssessmentItem[]
}

const ItemSchema = new Schema<IAssessmentItem>({
  text: { type: String, required: true },
  category: { type: String, default: undefined },
  severity: { type: String, enum: ['Low','Medium','High'], default: 'Medium' },
  response: { type: String, enum: ['Yes','No','N/A'], default: 'N/A' },
  notes: { type: String, default: undefined },
  evidenceUrls: { type: [String], default: [] },
  createdAt: { type: Date, default: Date.now },
}, { _id: true })

const AssessmentSchema = new Schema<IAssessment>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  name: { type: String, required: true },
  owner: { type: String, required: true },
  framework: { type: String, enum: ['GDPR','HIPAA','CCPA','Other'], default: undefined },
  status: { type: String, enum: ['Draft','In Progress','Completed'], default: 'Draft', index: true },
  dueDate: { type: Date, default: undefined },
  items: { type: [ItemSchema], default: [] },
}, { timestamps: true })

AssessmentSchema.index({ userId: 1, name: 1 })

export const Assessment: Model<IAssessment> = mongoose.models.Assessment || mongoose.model<IAssessment>('Assessment', AssessmentSchema)
