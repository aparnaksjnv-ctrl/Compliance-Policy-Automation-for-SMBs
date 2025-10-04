import mongoose, { Schema, Document, Model, Types } from 'mongoose'

export interface ICompany extends Document {
  userId: Types.ObjectId
  encrypted: {
    iv: string
    tag: string
    ciphertext: string
  }
}

const EncryptedSchema = new Schema({
  iv: { type: String, required: true },
  tag: { type: String, required: true },
  ciphertext: { type: String, required: true },
}, { _id: false })

const CompanySchema = new Schema<ICompany>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
  encrypted: { type: EncryptedSchema, required: true },
}, { timestamps: true })

export const Company: Model<ICompany> = mongoose.models.Company || mongoose.model<ICompany>('Company', CompanySchema)
