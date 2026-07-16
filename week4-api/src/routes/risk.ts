import { Router, Response } from 'express'
import { authMiddleware, requireAdmin, AuthedRequest } from '../middleware/auth'
import { RiskScoreModel } from '../models/RiskScore'
import { notifyAdmins } from '../utils/email'

const router = Router()

// GET /api/risk — get all category scores
router.get('/', authMiddleware, async (req: AuthedRequest, res: Response) => {
  try {
    const scores = await RiskScoreModel.find().sort({ category: 1 }).lean()
    res.json({ scores })
  } catch (error) {
    console.error('Error fetching risk scores:', error)
    res.status(500).json({ error: 'Failed to fetch risk scores' })
  }
})

// GET /api/risk/overall — calculate and return overall risk score (average of all categories)
router.get('/overall', authMiddleware, async (req: AuthedRequest, res: Response) => {
  try {
    const scores = await RiskScoreModel.find().lean()
    
    if (scores.length === 0) {
      return res.json({ overallScore: 0, categoryCount: 0 })
    }
    
    const totalScore = scores.reduce((sum, score) => sum + score.score, 0)
    const overallScore = Math.round(totalScore / scores.length)
    
    res.json({ overallScore, categoryCount: scores.length })
  } catch (error) {
    console.error('Error calculating overall risk score:', error)
    res.status(500).json({ error: 'Failed to calculate overall risk score' })
  }
})

// PUT /api/risk/:category — update a category score (admin only)
router.put('/:category', authMiddleware, requireAdmin, async (req: AuthedRequest, res: Response) => {
  try {
    const category = (req.params as any).category
    const { score, trend, details } = (req.body as any)
    
    const updateData: any = { lastUpdated: new Date() }
    if (score !== undefined) updateData.score = score
    if (trend !== undefined) updateData.trend = trend
    if (details !== undefined) updateData.details = details
    
    const riskScore = await RiskScoreModel.findOneAndUpdate(
      { category },
      updateData,
      { new: true, upsert: true }
    ).lean()
    
    // Send alert if risk score drops below 50
    if (updateData.score !== undefined && updateData.score < 50) {
      notifyAdmins('VENDOR_RISK_HIGH', {
        vendorName: category,
        score: updateData.score,
        category: category,
      })
    }
    
    res.json(riskScore)
  } catch (error) {
    console.error('Error updating risk score:', error)
    res.status(500).json({ error: 'Failed to update risk score' })
  }
})

export default router
