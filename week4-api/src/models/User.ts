import mongoose, { Schema, Document, Model } from 'mongoose'

export interface IUser extends Document {
  email: string
  passwordHash: string
  role: 'user' | 'admin'
}

const UserSchema = new Schema<IUser>({
  email: { type: String, required: true, unique: true, lowercase: true, index: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
}, { timestamps: true })

export const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', UserSchema)
