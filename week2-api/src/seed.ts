import bcrypt from 'bcryptjs'
import { User } from './models/User'
import { config } from './config'
import { Policy } from './models/Policy'
import { Audit } from './models/Audit'
import { Assessment } from './models/Assessment'
import * as vendors from './store/vendorsStore'

export async function runSeed() {
  try {
    let email = process.env.DEFAULT_ADMIN_EMAIL
    let password = process.env.DEFAULT_ADMIN_PASSWORD
    // In dev/in-memory mode, if not provided, seed a convenience admin
    if ((!email || !password) && config.useInMemory) {
      email = email || 'admin@local.test'
      password = password || 'password1234'
    }
    if (!email || !password) return

    const existing = await User.findOne({ email }).lean()
    let userId: any
    if (existing) {
      userId = existing._id
    } else {
      const passwordHash = await bcrypt.hash(password, 12)
      // Always ensure we seed an admin user if requested
      const user = await User.create({ email, passwordHash, role: 'admin' })
      userId = user._id
      // eslint-disable-next-line no-console
      console.log(`[seed] Created default admin: ${email}`)
    }

    // Optionally seed demo domain data (policies, audits, assessments, vendors)
    const shouldSeedDemo = process.env.SEED_DEMO_DATA === 'true' || config.useInMemory
    if (!shouldSeedDemo) return

    const [pCount, aCount, sCount] = await Promise.all([
      Policy.countDocuments({ userId }),
      Audit.countDocuments({ userId }),
      Assessment.countDocuments({ userId }),
    ])
    const adminHasData = (pCount + aCount + sCount) > 0
    if (adminHasData) {
      // eslint-disable-next-line no-console
      console.log('[seed] Demo data already present for admin, skipping admin seed')
    } else {
      // Seed sample policies
      await Policy.create([
        { userId, name: 'GDPR Privacy Policy', owner: 'Alice', status: 'Draft', framework: 'GDPR', company: 'Acme Ltd', content: 'Sample GDPR policy content.' },
        { userId, name: 'HIPAA Security Policy', owner: 'Bob', status: 'In Review', framework: 'HIPAA', company: 'Acme Health', content: 'Sample HIPAA policy content.' },
        { userId, name: 'CCPA Consumer Policy', owner: 'Carol', status: 'Approved', framework: 'CCPA', company: 'Acme Retail', content: 'Sample CCPA policy content.' },
      ] as any)

      // Seed sample audits with findings
      await Audit.create([
        {
          userId,
          name: 'Q4 Security Audit',
          owner: 'Alice',
          status: 'In Progress',
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          findings: [
            { title: 'Open S3 bucket', description: 'Public read on logs bucket', severity: 'High', status: 'Open', createdAt: new Date() },
            { title: 'Weak TLS settings', description: 'Outdated ciphers enabled', severity: 'Medium', status: 'Resolved', createdAt: new Date() },
          ],
        },
        {
          userId,
          name: 'Vendor Access Audit',
          owner: 'Bob',
          status: 'Draft',
          dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
          findings: [
            { title: 'Excess IAM permissions', severity: 'High', status: 'Open', createdAt: new Date() },
          ],
        },
      ] as any)

      // Seed sample assessments with items
      await Assessment.create([
        {
          userId,
          name: 'GDPR Readiness 2025',
          owner: 'Alice',
          framework: 'GDPR',
          status: 'In Progress',
          dueDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000),
          items: [
            { text: 'Records of processing up to date?', category: 'Records', severity: 'Medium', response: 'Yes', createdAt: new Date() },
            { text: 'DPIA completed for high-risk processing?', category: 'Risk', severity: 'High', response: 'No', createdAt: new Date() },
          ],
        },
        {
          userId,
          name: 'HIPAA Annual Review',
          owner: 'Bob',
          framework: 'HIPAA',
          status: 'Draft',
          items: [
            { text: 'Workforce HIPAA training completed?', category: 'Training', severity: 'Low', response: 'N/A', createdAt: new Date() },
          ],
        },
      ] as any)

      // Seed sample vendors (file-backed store, filtered by userId)
      await vendors.upsertMany(String(userId), [
        { name: 'AWS', serviceType: 'Cloud', standards: ['SOC 2', 'ISO 27001'], riskLevel: 'Medium', status: 'Compliant', lastAuditDate: new Date().toISOString().slice(0, 10), notes: 'PCA completed' },
        { name: 'Stripe', serviceType: 'Payments', standards: ['PCI DSS'], riskLevel: 'Low', status: 'Compliant' },
        { name: 'Acme Analytics', serviceType: 'Analytics', standards: ['GDPR'], riskLevel: 'High', status: 'Pending' },
      ])

      // eslint-disable-next-line no-console
      console.log('[seed] Demo data created')
    }

    const allUsers = await User.find({}, { _id: 1 }).lean()
    for (const u of allUsers) {
      const uid = u._id
      const [pc, ac, sc] = await Promise.all([
        Policy.countDocuments({ userId: uid }),
        Audit.countDocuments({ userId: uid }),
        Assessment.countDocuments({ userId: uid }),
      ])
      if ((pc + ac + sc) > 0) continue
      await Policy.create([
        { userId: uid, name: 'GDPR Privacy Policy', owner: 'Alice', status: 'Draft', framework: 'GDPR', company: 'Acme Ltd', content: 'Sample GDPR policy content.' },
        { userId: uid, name: 'HIPAA Security Policy', owner: 'Bob', status: 'In Review', framework: 'HIPAA', company: 'Acme Health', content: 'Sample HIPAA policy content.' },
        { userId: uid, name: 'CCPA Consumer Policy', owner: 'Carol', status: 'Approved', framework: 'CCPA', company: 'Acme Retail', content: 'Sample CCPA policy content.' },
      ] as any)
      await Audit.create([
        {
          userId: uid,
          name: 'Q4 Security Audit',
          owner: 'Alice',
          status: 'In Progress',
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          findings: [
            { title: 'Open S3 bucket', description: 'Public read on logs bucket', severity: 'High', status: 'Open', createdAt: new Date() },
            { title: 'Weak TLS settings', description: 'Outdated ciphers enabled', severity: 'Medium', status: 'Resolved', createdAt: new Date() },
          ],
        },
        {
          userId: uid,
          name: 'Vendor Access Audit',
          owner: 'Bob',
          status: 'Draft',
          dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
          findings: [
            { title: 'Excess IAM permissions', severity: 'High', status: 'Open', createdAt: new Date() },
          ],
        },
      ] as any)
      await Assessment.create([
        {
          userId: uid,
          name: 'GDPR Readiness 2025',
          owner: 'Alice',
          framework: 'GDPR',
          status: 'In Progress',
          dueDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000),
          items: [
            { text: 'Records of processing up to date?', category: 'Records', severity: 'Medium', response: 'Yes', createdAt: new Date() },
            { text: 'DPIA completed for high-risk processing?', category: 'Risk', severity: 'High', response: 'No', createdAt: new Date() },
          ],
        },
        {
          userId: uid,
          name: 'HIPAA Annual Review',
          owner: 'Bob',
          framework: 'HIPAA',
          status: 'Draft',
          items: [
            { text: 'Workforce HIPAA training completed?', category: 'Training', severity: 'Low', response: 'N/A', createdAt: new Date() },
          ],
        },
      ] as any)
      await vendors.upsertMany(String(uid), [
        { name: 'AWS', serviceType: 'Cloud', standards: ['SOC 2', 'ISO 27001'], riskLevel: 'Medium', status: 'Compliant', lastAuditDate: new Date().toISOString().slice(0, 10), notes: 'PCA completed' },
        { name: 'Stripe', serviceType: 'Payments', standards: ['PCI DSS'], riskLevel: 'Low', status: 'Compliant' },
        { name: 'Acme Analytics', serviceType: 'Analytics', standards: ['GDPR'], riskLevel: 'High', status: 'Pending' },
      ])
    }
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn('[seed] failed:', e)
  }
}
