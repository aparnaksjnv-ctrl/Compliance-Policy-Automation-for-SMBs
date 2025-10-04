import mongoose from 'mongoose'
import { config, assertEnv } from './config'
import { MongoMemoryServer } from 'mongodb-memory-server'

let mem: MongoMemoryServer | null = null

export async function connectDB() {
  if (config.useInMemory) {
    mem = await MongoMemoryServer.create()
    const uri = mem.getUri()
    await mongoose.connect(uri)
  } else {
    const uri = assertEnv('mongoUri')
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
