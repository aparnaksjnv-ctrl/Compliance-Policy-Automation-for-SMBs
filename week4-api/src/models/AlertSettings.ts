import mongoose, { Schema, Document } from 'mongoose'

export interface AlertSettings extends Document {
  userId: string
  vendorRiskAlerts: boolean
  soc2Alerts: boolean
  policyExpiryAlerts: boolean
  alertEmail: string
}

const AlertSettingsSchema = new Schema<AlertSettings>(
  {
    userId: { type: String, required: true, unique: true, index: true },
    vendorRiskAlerts: { type: Boolean, default: true },
    soc2Alerts: { type: Boolean, default: true },
    policyExpiryAlerts: { type: Boolean, default: true },
    alertEmail: { type: String, required: true },
  },
  {
    timestamps: true,
  }
)

export const AlertSettingsModel = mongoose.model<AlertSettings>('AlertSettings', AlertSettingsSchema)
