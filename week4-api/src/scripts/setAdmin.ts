// Must be the first import: loads .env before any module below reads
// process.env. This matters most here — ../config captures env values at
// module load, so a bare `dotenv.config()` statement would run too late.
import 'dotenv/config'
import mongoose from 'mongoose'
import { User } from '../models/User'
import { config } from '../config'
import { connectDB, disconnectDB } from '../db'

/**
 * Seed script to set a user as admin
 * Usage: npx ts-node src/scripts/setAdmin.ts <email>
 * Example: npx ts-node src/scripts/setAdmin.ts user@example.com
 */
async function setAdmin(email: string) {
  try {
    await connectDB()
    console.log('Connected to database')

    const user = await User.findOne({ email: email.toLowerCase() })
    
    if (!user) {
      console.error(`User with email "${email}" not found`)
      process.exit(1)
    }

    if (user.role === 'admin') {
      console.log(`User "${email}" is already an admin`)
      process.exit(0)
    }

    user.role = 'admin'
    await user.save()
    
    console.log(`✓ Successfully set "${email}" as admin`)
    process.exit(0)
  } catch (error) {
    console.error('Error setting admin:', error)
    process.exit(1)
  }
}

// Get email from command line argument
const email = process.argv[2]

if (!email) {
  console.error('Usage: npx ts-node src/scripts/setAdmin.ts <email>')
  console.error('Example: npx ts-node src/scripts/setAdmin.ts user@example.com')
  process.exit(1)
}

setAdmin(email)
