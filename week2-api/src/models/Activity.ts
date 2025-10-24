import mongoose, { Schema, Document, Types } from 'mongoose'

export type EntityType = 'Policy' | 'Audit' | 'Assessment' | 'Vendor'
export type ActivityAction = 'create' | 'update' | 'delete' | 'status_change' | 'export' | 'generate'

export interface IActivity extends Document {
  userId: Types.ObjectId
  entityType: EntityType
  entityId: Types.ObjectId | string
  action: ActivityAction
  metadata?: Record<string, any>
  createdAt: Date
}

const ActivitySchema = new Schema<IActivity>({
  userId: { type: Schema.Types.ObjectId, required: true, index: true },
  entityType: { type: String, enum: ['Policy','Audit','Assessment','Vendor'], required: true, index: true },
  entityId: { type: Schema.Types.Mixed, required: true, index: true },
  action: { type: String, enum: ['create','update','delete','status_change','export','generate'], required: true, index: true },
  metadata: { type: Schema.Types.Mixed, default: undefined },
  createdAt: { type: Date, default: Date.now, index: true },
})

export const Activity = mongoose.models.Activity || mongoose.model<IActivity>('Activity', ActivitySchema)
