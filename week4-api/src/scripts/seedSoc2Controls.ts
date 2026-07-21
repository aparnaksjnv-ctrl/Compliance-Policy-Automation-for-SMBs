// Must be the first import: loads .env before any module below reads
// process.env. A bare `dotenv.config()` statement would run too late,
// because import/require evaluation is hoisted above plain statements.
import 'dotenv/config'
import mongoose from 'mongoose'
import { Soc2ControlModel } from '../models/Soc2Control'
import { connectDB, disconnectDB } from '../db'

/**
 * Seed script to populate SOC 2 controls
 * Usage: npx ts-node src/scripts/seedSoc2Controls.ts
 */
async function seedSoc2Controls() {
  try {
    await connectDB()
    console.log('Connected to database')

    // Clear existing controls
    await Soc2ControlModel.deleteMany({})
    console.log('Cleared existing SOC 2 controls')

    const controls = [
      {
        controlId: 'CC6.1',
        category: 'Logical and Physical Access Controls',
        title: 'Logical and Physical Access Controls',
        description: 'The entity implements logical and physical access controls to protect against threats to the integrity, confidentiality, and availability of the system.',
        status: 'not_implemented',
        owner: 'IT Security',
        evidence: [],
        notes: ''
      },
      {
        controlId: 'CC6.2',
        category: 'Logical and Physical Access Controls',
        title: 'New User Registration and Authorization',
        description: 'The entity implements procedures for new user registration and authorization to ensure appropriate access rights are granted.',
        status: 'not_implemented',
        owner: 'IT Operations',
        evidence: [],
        notes: ''
      },
      {
        controlId: 'CC6.3',
        category: 'Logical and Physical Access Controls',
        title: 'Role-Based Access and Removal',
        description: 'The entity implements role-based access controls and procedures for timely removal of access when employment terminates or changes.',
        status: 'not_implemented',
        owner: 'IT Security',
        evidence: [],
        notes: ''
      },
      {
        controlId: 'CC7.1',
        category: 'System Operations',
        title: 'System Monitoring',
        description: 'The entity monitors system components to detect and respond to security events and operational issues.',
        status: 'not_implemented',
        owner: 'DevOps',
        evidence: [],
        notes: ''
      },
      {
        controlId: 'CC7.2',
        category: 'System Operations',
        title: 'Security Incident Identification',
        description: 'The entity identifies and responds to security incidents to minimize their impact on the system.',
        status: 'not_implemented',
        owner: 'IT Security',
        evidence: [],
        notes: ''
      },
      {
        controlId: 'CC9.1',
        category: 'Risk Management',
        title: 'Risk Mitigation',
        description: 'The entity identifies and mitigates risks that could affect the achievement of its objectives.',
        status: 'not_implemented',
        owner: 'Compliance',
        evidence: [],
        notes: ''
      },
      {
        controlId: 'CC9.2',
        category: 'Risk Management',
        title: 'Vendor Risk Management',
        description: 'The entity implements vendor risk management processes to assess and monitor third-party service providers.',
        status: 'not_implemented',
        owner: 'Compliance',
        evidence: [],
        notes: ''
      }
    ]

    await Soc2ControlModel.insertMany(controls)
    console.log(`✓ Successfully seeded ${controls.length} SOC 2 controls`)
    
    process.exit(0)
  } catch (error) {
    console.error('Error seeding SOC 2 controls:', error)
    process.exit(1)
  }
}

seedSoc2Controls()
