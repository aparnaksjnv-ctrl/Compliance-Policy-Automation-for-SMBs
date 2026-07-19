import { Router } from 'express'
import { authMiddleware, AuthedRequest } from '../middleware/auth'
import { User } from '../models/User'
import { RiskScoreModel } from '../models/RiskScore'
import { Soc2ControlModel } from '../models/Soc2Control'
import { AuditLogModel } from '../models/AuditLog'
import * as vendorStore from '../store/vendorsStore'
import { generateComplianceReportPdf } from '../utils/pdf'

const router = Router()

function companyNameFor(email?: string): string {
  if (process.env.COMPLIANCE_COMPANY_NAME) return process.env.COMPLIANCE_COMPANY_NAME
  const domain = email?.split('@')[1]?.split('.')[0]
  if (!domain) return 'Compliance Command Center'
  return domain.charAt(0).toUpperCase() + domain.slice(1)
}

router.get('/compliance', authMiddleware, async (req: AuthedRequest, res) => {
  try {
    const userId = req.userId!
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    const [user, riskScores, controls, vendors, audits] = await Promise.all([
      User.findById(userId).lean(),
      RiskScoreModel.find().sort({ category: 1 }).lean(),
      Soc2ControlModel.find().lean(),
      vendorStore.listByUser(userId),
      AuditLogModel.find({ userId, timestamp: { $gte: since } }).sort({ timestamp: -1 }).limit(100).lean(),
    ])

    const totalRisk = riskScores.reduce((sum, score) => sum + score.score, 0)
    const overallRiskScore = riskScores.length ? Math.round(totalRisk / riskScores.length) : 0
    const implemented = controls.filter(control => control.status === 'implemented').length
    const partial = controls.filter(control => control.status === 'partial').length
    const notImplemented = controls.filter(control => control.status === 'not_implemented').length

    const pdf = await generateComplianceReportPdf({
      companyName: companyNameFor(user?.email),
      overallRiskScore,
      riskScores: riskScores.map(score => ({ category: score.category, score: score.score, trend: score.trend })),
      soc2Summary: { total: controls.length, implemented, partial, notImplemented },
      vendors,
      audits: audits.map(audit => ({
        timestamp: audit.timestamp,
        action: audit.action,
        resourceType: audit.resourceType,
        status: audit.status,
        userEmail: audit.userEmail,
      })),
    })

    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', 'attachment; filename="compliance-report.pdf"')
    res.setHeader('Content-Length', String(pdf.length))
    res.send(pdf)
  } catch (error) {
    console.error('Failed to generate compliance report PDF:', error)
    res.status(500).json({ error: 'Failed to generate compliance report PDF' })
  }
})

export default router
