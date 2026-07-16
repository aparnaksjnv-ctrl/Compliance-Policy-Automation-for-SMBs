import { Router, Response } from 'express'
import { authMiddleware, AuthedRequest } from '../middleware/auth'
import { AlertSettingsModel } from '../models/AlertSettings'
import { User } from '../models/User'
import { sendEmail, sendComplianceAlert } from '../utils/email'

const router = Router()

// POST /api/alerts/test — send a test email to the authenticated user
router.post('/test', authMiddleware, async (req: AuthedRequest, res: Response) => {
  try {
    const userId = req.userId!
    const user = await User.findById(userId).lean()
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    const alertEmail = user.email
    
    await sendEmail(
      alertEmail,
      'Test Email from Compliance Platform',
      `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #10b981;">Test Email</h2>
          <p>This is a test email from the Compliance & Policy Automation Platform.</p>
          <p>If you received this email, your email configuration is working correctly.</p>
          <p style="color: #6b7280; font-size: 12px;">This is a test email from the Compliance & Policy Automation Platform.</p>
        </div>
      `
    )
    
    res.json({ success: true, message: 'Test email sent successfully' })
  } catch (error) {
    console.error('Error sending test email:', error)
    res.status(500).json({ error: 'Failed to send test email' })
  }
})

// GET /api/alerts/settings — get alert preferences
router.get('/settings', authMiddleware, async (req: AuthedRequest, res: Response) => {
  try {
    const userId = req.userId!
    const user = await User.findById(userId).lean()
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    let settings = await AlertSettingsModel.findOne({ userId: user._id.toString() }).lean()
    
    // Create default settings if not found
    if (!settings) {
      settings = await AlertSettingsModel.create({
        userId: user._id.toString(),
        vendorRiskAlerts: true,
        soc2Alerts: true,
        policyExpiryAlerts: true,
        alertEmail: user.email,
      }) as any
    }
    
    res.json(settings)
  } catch (error) {
    console.error('Error fetching alert settings:', error)
    res.status(500).json({ error: 'Failed to fetch alert settings' })
  }
})

// PUT /api/alerts/settings — update alert preferences
router.put('/settings', authMiddleware, async (req: AuthedRequest, res: Response) => {
  try {
    const userId = req.userId!
    const user = await User.findById(userId).lean()
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    const { vendorRiskAlerts, soc2Alerts, policyExpiryAlerts, alertEmail } = (req.body as any)
    
    const settings = await AlertSettingsModel.findOneAndUpdate(
      { userId: user._id.toString() },
      {
        vendorRiskAlerts: vendorRiskAlerts !== undefined ? vendorRiskAlerts : true,
        soc2Alerts: soc2Alerts !== undefined ? soc2Alerts : true,
        policyExpiryAlerts: policyExpiryAlerts !== undefined ? policyExpiryAlerts : true,
        alertEmail: alertEmail || user.email,
      },
      { new: true, upsert: true }
    ).lean()
    
    res.json(settings)
  } catch (error) {
    console.error('Error updating alert settings:', error)
    res.status(500).json({ error: 'Failed to update alert settings' })
  }
})

export default router
