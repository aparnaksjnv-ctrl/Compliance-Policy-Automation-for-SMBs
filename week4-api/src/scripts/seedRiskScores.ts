import mongoose from 'mongoose'
import { RiskScoreModel } from '../models/RiskScore'
import { connectDB, disconnectDB } from '../db'

/**
 * Seed script to populate risk scores
 * Usage: npx ts-node src/scripts/seedRiskScores.ts
 */
async function seedRiskScores() {
  try {
    await connectDB()
    console.log('Connected to database')

    // Clear existing risk scores
    await RiskScoreModel.deleteMany({})
    console.log('Cleared existing risk scores')

    const riskScores = [
      {
        category: 'Access Control',
        score: 75,
        maxScore: 100,
        trend: 'stable',
        details: 'Access control measures are in place with role-based permissions. Some gaps in periodic access reviews.'
      },
      {
        category: 'Data Protection',
        score: 60,
        maxScore: 100,
        trend: 'improving',
        details: 'Data encryption at rest and in transit implemented. Backup procedures need improvement.'
      },
      {
        category: 'Vendor Risk',
        score: 45,
        maxScore: 100,
        trend: 'declining',
        details: 'Vendor assessment process exists but not consistently applied. Third-party monitoring needs enhancement.'
      },
      {
        category: 'Incident Response',
        score: 80,
        maxScore: 100,
        trend: 'improving',
        details: 'Incident response plan documented and tested regularly. Communication procedures well established.'
      },
      {
        category: 'Policy Compliance',
        score: 70,
        maxScore: 100,
        trend: 'stable',
        details: 'Policy framework established with regular reviews. Some policies need updates to reflect current regulations.'
      }
    ]

    await RiskScoreModel.insertMany(riskScores)
    console.log(`✓ Successfully seeded ${riskScores.length} risk scores`)
    
    process.exit(0)
  } catch (error) {
    console.error('Error seeding risk scores:', error)
    process.exit(1)
  }
}

seedRiskScores()
