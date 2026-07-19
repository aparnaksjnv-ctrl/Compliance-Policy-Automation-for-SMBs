import { Types } from 'mongoose'
import { Activity, type EntityType, type ActivityAction } from '../models/Activity'

export async function logActivity(
  userId: Types.ObjectId | string | undefined,
  entityType: EntityType,
  entityId: string | Types.ObjectId,
  action: ActivityAction,
  metadata?: Record<string, any>
) {
  try {
    if (!userId) return
    await Activity.create({ userId, entityType, entityId, action, metadata })
  } catch {}
}
