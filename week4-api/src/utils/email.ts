import nodemailer from 'nodemailer'
import { AlertSettingsModel } from '../models/AlertSettings'
import { User } from '../models/User'

export function isEmailConfigured(): boolean {
  return Boolean(process.env.EMAIL_USER && process.env.EMAIL_PASS)
}

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.EMAIL_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
})

export async function sendEmail(to: string, subject: string, html: string): Promise<void> {
  if (!isEmailConfigured()) {
    throw new Error('Email delivery is not configured. Add EMAIL_USER and EMAIL_PASS to the API .env file.')
  }

  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM || 'Compliance Platform <noreply@compliance.com>',
      to,
      subject,
      html,
    })
  } catch (error) {
    console.error('Failed to send email:', error)
    throw error
  }
}

export type AlertType = 'VENDOR_RISK_HIGH' | 'SOC2_CONTROL_FAILING' | 'POLICY_EXPIRED'

export async function sendComplianceAlert(
  userEmail: string,
  alertType: AlertType,
  details: Record<string, any>
): Promise<void> {
  let subject = ''
  let html = ''

  switch (alertType) {
    case 'VENDOR_RISK_HIGH':
      subject = '⚠️ High Vendor Risk Alert'
      html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #ef4444;">High Vendor Risk Alert</h2>
          <p>A vendor has been flagged with a high risk score.</p>
          <div style="background: #fef2f2; border-left: 4px solid #ef4444; padding: 16px; margin: 16px 0;">
            <p><strong>Vendor:</strong> ${details.vendorName || 'Unknown'}</p>
            <p><strong>Risk Score:</strong> ${details.score}/100</p>
            <p><strong>Category:</strong> ${details.category || 'General'}</p>
          </div>
          <p>Please review this vendor in the compliance platform and take appropriate action.</p>
          <p style="color: #6b7280; font-size: 12px;">This is an automated alert from the Compliance & Policy Automation Platform.</p>
        </div>
      `
      break

    case 'SOC2_CONTROL_FAILING':
      subject = '⚠️ SOC 2 Control Failing Alert'
      html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #ef4444;">SOC 2 Control Failing Alert</h2>
          <p>A SOC 2 control has been marked as not implemented.</p>
          <div style="background: #fef2f2; border-left: 4px solid #ef4444; padding: 16px; margin: 16px 0;">
            <p><strong>Control ID:</strong> ${details.controlId || 'Unknown'}</p>
            <p><strong>Title:</strong> ${details.title || 'Unknown'}</p>
            <p><strong>Category:</strong> ${details.category || 'Unknown'}</p>
          </div>
          <p>Please review this control in the compliance platform and implement the necessary measures.</p>
          <p style="color: #6b7280; font-size: 12px;">This is an automated alert from the Compliance & Policy Automation Platform.</p>
        </div>
      `
      break

    case 'POLICY_EXPIRED':
      subject = '⚠️ Policy Review Overdue Alert'
      html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #f59e0b;">Policy Review Overdue Alert</h2>
          <p>A policy has not been reviewed in over 90 days and requires attention.</p>
          <div style="background: #fffbeb; border-left: 4px solid #f59e0b; padding: 16px; margin: 16px 0;">
            <p><strong>Policy:</strong> ${details.policyName || 'Unknown'}</p>
            <p><strong>Last Reviewed:</strong> ${details.lastReviewed || 'Unknown'}</p>
            <p><strong>Days Overdue:</strong> ${details.daysOverdue || 'Unknown'}</p>
          </div>
          <p>Please review this policy in the compliance platform and update it as needed.</p>
          <p style="color: #6b7280; font-size: 12px;">This is an automated alert from the Compliance & Policy Automation Platform.</p>
        </div>
      `
      break
  }

  await sendEmail(userEmail, subject, html)
}

export async function notifyAdmins(alertType: AlertType, details: Record<string, any>): Promise<void> {
  try {
    const admins = await User.find({ role: 'admin' }).lean()
    
    for (const admin of admins) {
      const settings = await AlertSettingsModel.findOne({ userId: admin._id.toString() }).lean()
      
      // If no settings, default to sending all alerts
      if (!settings) {
        await sendComplianceAlert(admin.email, alertType, details)
        continue
      }
      
      const alertEnabled = 
        alertType === 'VENDOR_RISK_HIGH' ? settings.vendorRiskAlerts :
        alertType === 'SOC2_CONTROL_FAILING' ? settings.soc2Alerts :
        settings.policyExpiryAlerts
      
      if (alertEnabled) {
        await sendComplianceAlert(settings.alertEmail || admin.email, alertType, details)
      }
    }
  } catch (error) {
    console.error('Failed to notify admins:', error)
    // Don't throw to avoid breaking the main operation
  }
}
