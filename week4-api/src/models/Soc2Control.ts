import mongoose, { Schema, Document } from 'mongoose'

export type Soc2ControlStatus = 'implemented' | 'partial' | 'not_implemented'

export interface Soc2Control extends Document {
  controlId: string
  category: string
  title: string
  description: string
  status: Soc2ControlStatus
  owner: string
  evidence: string[]
  lastReviewed: Date
  notes: string
}

const Soc2ControlSchema = new Schema<Soc2Control>(
  {
    controlId: { type: String, required: true, unique: true, index: true },
    category: { type: String, required: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    status: { 
      type: String, 
      enum: ['implemented', 'partial', 'not_implemented'], 
      required: true,
      default: 'not_implemented'
    },
    owner: { type: String, required: true },
    evidence: { type: [String], default: [] },
    lastReviewed: { type: Date, default: Date.now },
    notes: { type: String, default: '' },
  },
  {
    timestamps: true,
  }
)

export const Soc2ControlModel = mongoose.model<Soc2Control>('Soc2Control', Soc2ControlSchema)
