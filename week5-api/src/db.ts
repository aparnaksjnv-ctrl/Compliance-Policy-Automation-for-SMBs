import mongoose from 'mongoose'
import { config, assertNonEmptyString } from './config'
import { MongoMemoryServer } from 'mongodb-memory-server'
import path from 'path'

let mem: MongoMemoryServer | null = null

export async function connectDB() {
  if (config.useInMemory) {
    const raw = process.env.MEMORY_DB_PERSIST_PATH
    const persistPath = raw && raw.trim()
    try {
      if (persistPath) {
        const dbPath = path.isAbsolute(persistPath) ? persistPath : path.join(process.cwd(), persistPath)
        mem = await MongoMemoryServer.create({
          instance: {
            dbName: 'cpa_week2',
            dbPath,
            storageEngine: 'wiredTiger',
          },
        })
        // eslint-disable-next-line no-console
        console.log(`[week2-api] In-memory MongoDB with persistence: ${dbPath}`)
      } else {
        mem = await MongoMemoryServer.create()
        // eslint-disable-next-line no-console
        console.log('[week2-api] In-memory MongoDB (ephemeral)')
      }
    } catch (e) {
      // Fallback to ephemeral if persistence path fails
      mem = await MongoMemoryServer.create()
      // eslint-disable-next-line no-console
      console.warn('[week2-api] Persistence path failed, falling back to ephemeral in-memory DB')
    }
    const uri = mem.getUri()
    await mongoose.connect(uri)
  } else {
    const uri = assertNonEmptyString(config.mongoUri, 'MONGO_URI')
    await mongoose.connect(uri)
  }
  return mongoose.connection
}

export async function disconnectDB() {
  await mongoose.disconnect()
  if (mem) {
    await mem.stop()
    mem = null
  }
}
