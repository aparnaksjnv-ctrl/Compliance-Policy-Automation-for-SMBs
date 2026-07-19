import { Router } from 'express'
import multer from 'multer'
import { Readable } from 'stream'
import csvParser from 'csv-parser'
import { Parser as Json2CsvParser } from 'json2csv'
import { authMiddleware, requireAdmin, AuthedRequest } from '../middleware/auth'
import { vendorCreateSchema, vendorUpdateSchema, Vendor, RiskLevel, ComplianceStatus } from '../models/Vendor'
import * as store from '../store/vendorsStore'
import { logAction, getClientIp } from '../utils/audit'
import { User } from '../models/User'
import { generateVendorPdf } from '../utils/pdf'
import { asyncHandler } from '../utils/asyncHandler'

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
  fileFilter: (_req: any, file: any, cb: any) => {
    const ok = file.mimetype === 'text/csv' || file.originalname.toLowerCase().endsWith('.csv')
    if (!ok) { return cb(new Error('CSV files only')) }
    cb(null, true)
  },
})

function normRisk(s?: string): RiskLevel | undefined {
  if (!s) return undefined
  const v = s.trim().toLowerCase()
  if (v === 'low') return 'Low'
  if (v === 'medium' || v === 'med') return 'Medium'
  if (v === 'high') return 'High'
  return undefined
}

function normStatus(s?: string): ComplianceStatus | undefined {
  if (!s) return undefined
  const v = s.trim().toLowerCase()
  if (v.startsWith('compliant')) return 'Compliant'
  if (v.startsWith('pending')) return 'Pending'
  if (v.includes('not') || v.includes('non')) return 'Not Compliant'
  return undefined
}

function parseStandards(s?: string): string[] | undefined {
  if (!s) return undefined
  return s.split(/[;,]/).map(x => x.trim()).filter(Boolean)
}

const router = Router()

router.get('/', authMiddleware, asyncHandler(async (req: AuthedRequest, res) => {
  const userId = req.userId!
  const q = String(req.query.q || '').toLowerCase()
  const risk = String(req.query.risk || '')
  const status = String(req.query.status || '')
  const framework = String(req.query.framework || '')
  const all = await store.listByUser(userId)
  const items = all.filter(v => {
    if (q && !(v.name.toLowerCase().includes(q) || (v.serviceType || '').toLowerCase().includes(q))) return false
    if (risk && v.riskLevel !== risk) return false
    if (status && v.status !== status) return false
    if (framework && !(v.standards || []).includes(framework)) return false
    return true
  })
  res.json({ items })
}))

router.post('/', authMiddleware, asyncHandler(async (req: AuthedRequest, res) => {
  const userId = req.userId!
  const parsed = vendorCreateSchema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() })
  const id = await store.create(userId, parsed.data as any)
  
  // Log audit action
  try {
    const user = await User.findOne({ email: userId }).lean()
    if (user) {
      await logAction({
        userId: user._id.toString(),
        userEmail: user.email,
        action: 'CREATE_VENDOR',
        resourceType: 'Vendor',
        resourceId: id,
        changes: { after: parsed.data },
        ipAddress: getClientIp(req),
        status: 'success',
      })
    }
  } catch (err) {
    console.error('Failed to log audit action:', err)
  }
  
  res.status(201).json({ id })
}))

router.put('/:id', authMiddleware, asyncHandler(async (req: AuthedRequest, res) => {
  const userId = req.userId!
  const parsed = vendorUpdateSchema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() })
  
  // Get before state for audit log
  const before = await store.listByUser(userId).then(vendors => 
    vendors.find(v => v.id === req.params.id)
  )
  
  const ok = await store.update(userId, req.params.id, parsed.data as any)
  if (!ok) return res.status(404).json({ error: 'Not found' })
  
  // Log audit action
  try {
    const user = await User.findOne({ email: userId }).lean()
    if (user) {
      await logAction({
        userId: user._id.toString(),
        userEmail: user.email,
        action: 'UPDATE_VENDOR',
        resourceType: 'Vendor',
        resourceId: req.params.id,
        changes: { before, after: parsed.data },
        ipAddress: getClientIp(req),
        status: 'success',
      })
    }
  } catch (err) {
    console.error('Failed to log audit action:', err)
  }
  
  res.json({ id: req.params.id })
}))

router.delete('/:id', authMiddleware, requireAdmin, asyncHandler(async (req: AuthedRequest, res) => {
  const userId = req.userId!
  
  // Get before state for audit log
  const before = await store.listByUser(userId).then(vendors => 
    vendors.find(v => v.id === req.params.id)
  )
  
  const ok = await store.remove(userId, req.params.id)
  if (!ok) return res.status(404).json({ error: 'Not found' })
  
  // Log audit action
  try {
    const user = await User.findOne({ email: userId }).lean()
    if (user) {
      await logAction({
        userId: user._id.toString(),
        userEmail: user.email,
        action: 'DELETE_VENDOR',
        resourceType: 'Vendor',
        resourceId: req.params.id,
        changes: { before },
        ipAddress: getClientIp(req),
        status: 'success',
      })
    }
  } catch (err) {
    console.error('Failed to log audit action:', err)
  }
  
  res.json({ ok: true })
}))

router.post('/upload', authMiddleware, upload.single('file'), asyncHandler(async (req: AuthedRequest, res) => {
  try {
    const userId = req.userId!
    const file = (req as any).file as any | undefined
    if (!file?.buffer) return res.status(400).json({ error: 'CSV file required (field "file")' })

    const rows: any[] = []
    await new Promise<void>((resolve, reject) => {
      const readable = Readable.from(file.buffer.toString('utf8'))
      readable
        .pipe(csvParser())
        .on('data', (row) => {
          try {
            const rec = {
              name: String(row['Vendor Name'] || row['name'] || '').trim(),
              serviceType: String(row['Service Type'] || row['serviceType'] || '').trim() || undefined,
              standards: parseStandards(String(row['Compliance Standards'] || row['standards'] || '')),
              riskLevel: normRisk(String(row['Risk Level'] || row['riskLevel'] || '')),
              status: normStatus(String(row['Status'] || row['status'] || '')),
              lastAuditDate: String(row['Last Audit Date'] || row['lastAuditDate'] || '').trim() || undefined,
              notes: String(row['Notes'] || row['notes'] || '').trim() || undefined,
            }
            if (!rec.name) throw new Error('Missing vendor name')
            const validate = vendorCreateSchema.safeParse(rec)
            if (!validate.success) throw new Error('Invalid row')
            rows.push(rec)
          } catch { /* skip invalid row */ }
        })
        .on('end', () => resolve())
        .on('error', (err) => reject(err))
    })

    const result = await store.upsertMany(userId, rows, 'name')
    
    // Log audit action for bulk upload
    try {
      const user = await User.findOne({ email: userId }).lean()
      if (user) {
        await logAction({
          userId: user._id.toString(),
          userEmail: user.email,
          action: 'BULK_UPLOAD_VENDORS',
          resourceType: 'Vendor',
          resourceId: 'bulk',
          changes: { after: { created: result.created, updated: result.updated, failed: result.failed } },
          ipAddress: getClientIp(req),
          status: 'success',
        })
      }
    } catch (err) {
      console.error('Failed to log audit action:', err)
    }
    
    res.json(result)
  } catch (e: any) {
    res.status(400).json({ error: e?.message || 'Failed to import CSV' })
  }
}))

router.get('/export/pdf', authMiddleware, asyncHandler(async (req: AuthedRequest, res) => {
  try {
    const userId = req.userId!
    const [items, user] = await Promise.all([store.listByUser(userId), User.findById(userId).lean()])
    const companyName = process.env.COMPLIANCE_COMPANY_NAME || user?.email || 'Compliance Command Center'
    const pdf = await generateVendorPdf(companyName, items)
    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', 'attachment; filename="vendors.pdf"')
    res.setHeader('Content-Length', String(pdf.length))
    res.send(pdf)
  } catch (error) {
    console.error('Failed to generate vendor PDF:', error)
    res.status(500).json({ error: 'Failed to generate vendor PDF' })
  }
}))

router.get('/export', authMiddleware, asyncHandler(async (req: AuthedRequest, res) => {
  const userId = req.userId!
  const items = await store.listByUser(userId)
  const fields = [
    { label: 'Vendor Name', value: 'name' },
    { label: 'Service Type', value: 'serviceType' },
    { label: 'Compliance Standards', value: (row: Vendor) => (row.standards || []).join('; ') },
    { label: 'Risk Level', value: 'riskLevel' },
    { label: 'Status', value: 'status' },
    { label: 'Last Audit Date', value: 'lastAuditDate' },
    { label: 'Notes', value: 'notes' },
  ] as any
  const parser = new Json2CsvParser({ fields })
  const csv = parser.parse(items)
  res.setHeader('Content-Type', 'text/csv')
  res.setHeader('Content-Disposition', 'attachment; filename="vendors.csv"')
  res.send(csv)
}))

router.get('/template', authMiddleware, asyncHandler(async (_req: AuthedRequest, res) => {
  const fields = [
    { label: 'Vendor Name', value: 'name' },
    { label: 'Service Type', value: 'serviceType' },
    { label: 'Compliance Standards', value: 'standards' },
    { label: 'Risk Level', value: 'riskLevel' },
    { label: 'Status', value: 'status' },
    { label: 'Last Audit Date', value: 'lastAuditDate' },
    { label: 'Notes', value: 'notes' },
  ] as any
  const parser = new Json2CsvParser({ fields })
  const csv = parser.parse([])
  res.setHeader('Content-Type', 'text/csv')
  res.setHeader('Content-Disposition', 'attachment; filename="vendors-template.csv"')
  res.send(csv)
}))

export default router
