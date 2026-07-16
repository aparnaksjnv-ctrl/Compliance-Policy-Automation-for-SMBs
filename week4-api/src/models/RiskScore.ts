import mongoose, { Schema, Document } from 'mongoose'

export type RiskTrend = 'improving' | 'stable' | 'declining'

export interface RiskScore extends Document {
  category: string
  score: number
  maxScore: number
  trend: RiskTrend
  lastUpdated: Date
  details: string
}

const RiskScoreSchema = new Schema<RiskScore>(
  {
    category: { type: String, required: true, unique: true, index: true },
    score: { type: Number, required: true, min: 0, max: 100 },
    maxScore: { type: Number, required: true, default: 100 },
    trend: { 
      type: String, 
      enum: ['improving', 'stable', 'declining'], 
      required: true,
      default: 'stable'
    },
    lastUpdated: { type: Date, default: Date.now },
    details: { type: String, default: '' },
  },
  {
    timestamps: true,
  }
)

export const RiskScoreModel = mongoose.model<RiskScore>('RiskScore', RiskScoreSchema)
