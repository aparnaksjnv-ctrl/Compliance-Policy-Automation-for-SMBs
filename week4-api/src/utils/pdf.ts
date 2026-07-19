import PDFDocument from 'pdfkit'

const PAGE_WIDTH = 612
const PAGE_HEIGHT = 792
const MARGIN = 54
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2
const NAVY = '#0f172a'
const TEAL = '#0f766e'
const SLATE = '#475569'
const LIGHT = '#e2e8f0'

export interface PolicyPdfInput {
  companyName: string
  policyTitle: string
  content: string
  framework?: string
  owner?: string
  status?: string
  generatedAt?: Date
}

export interface RiskPdfItem {
  category: string
  score: number
  trend?: string
}

export interface VendorPdfItem {
  name: string
  serviceType?: string
  standards?: string[]
  riskLevel?: string
  status?: string
  lastAuditDate?: string
}

export interface AuditPdfItem {
  timestamp: Date | string
  action: string
  resourceType: string
  status: string
  userEmail?: string
}

export interface ComplianceReportPdfInput {
  companyName: string
  overallRiskScore: number
  riskScores: RiskPdfItem[]
  soc2Summary: {
    total: number
    implemented: number
    partial: number
    notImplemented: number
  }
  vendors: VendorPdfItem[]
  audits: AuditPdfItem[]
  generatedAt?: Date
}

function stripHtml(value: string): string {
  return value
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>|<\/div>|<\/h[1-6]>|<\/li>/gi, '\n')
    .replace(/<li[^>]*>/gi, '• ')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

function safeFilename(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'document'
}

function ensureSpace(doc: PDFKit.PDFDocument, needed: number): void {
  if (doc.y + needed > PAGE_HEIGHT - 72) doc.addPage()
}

function addSection(doc: PDFKit.PDFDocument, title: string): void {
  ensureSpace(doc, 42)
  doc.moveDown(0.7)
  doc.font('Helvetica-Bold').fontSize(15).fillColor(NAVY).text(title)
  doc.moveTo(MARGIN, doc.y + 5).lineTo(PAGE_WIDTH - MARGIN, doc.y + 5).strokeColor('#cbd5e1').lineWidth(1).stroke()
  doc.moveDown(0.8)
}

function addMetric(doc: PDFKit.PDFDocument, label: string, value: string, x: number, y: number, width: number): void {
  doc.roundedRect(x, y, width, 60, 6).fillAndStroke('#f8fafc', '#cbd5e1')
  doc.font('Helvetica').fontSize(9).fillColor(SLATE).text(label.toUpperCase(), x + 10, y + 10, { width: width - 20 })
  doc.font('Helvetica-Bold').fontSize(20).fillColor(TEAL).text(value, x + 10, y + 28, { width: width - 20 })
}

function addTable(
  doc: PDFKit.PDFDocument,
  headers: string[],
  rows: string[][],
  widths: number[],
): void {
  const rowPadding = 6
  const lineHeight = 11
  const drawRow = (cells: string[], header: boolean): void => {
    const heights = cells.map((cell, index) => doc.heightOfString(cell || '—', { width: widths[index] - rowPadding * 2, lineGap: 1 }))
    const rowHeight = Math.max(24, Math.max(...heights) + rowPadding * 2)
    ensureSpace(doc, rowHeight + (header ? 0 : 4))
    const y = doc.y
    let x = MARGIN
    cells.forEach((cell, index) => {
      doc.rect(x, y, widths[index], rowHeight).fillAndStroke(header ? NAVY : '#ffffff', '#cbd5e1')
      doc.font(header ? 'Helvetica-Bold' : 'Helvetica').fontSize(header ? 8.5 : 8).fillColor(header ? '#ffffff' : NAVY)
        .text(cell || '—', x + rowPadding, y + rowPadding, { width: widths[index] - rowPadding * 2, lineGap: 1 })
      x += widths[index]
    })
    doc.y = y + rowHeight
  }

  drawRow(headers, true)
  if (rows.length === 0) {
    doc.font('Helvetica-Oblique').fontSize(9).fillColor(SLATE).text('No records available.', MARGIN, doc.y + 8)
    doc.moveDown()
    return
  }
  rows.forEach(row => drawRow(row, false))
  doc.moveDown(0.5)
}

function addDocumentTitle(doc: PDFKit.PDFDocument, companyName: string, title: string, generatedAt: Date): void {
  doc.font('Helvetica-Bold').fontSize(10).fillColor(TEAL).text(companyName.toUpperCase(), MARGIN, 58)
  doc.font('Helvetica-Bold').fontSize(28).fillColor(NAVY).text(title, MARGIN, 82, { width: CONTENT_WIDTH })
  doc.font('Helvetica').fontSize(9).fillColor(SLATE).text(`Generated ${generatedAt.toLocaleString()}`, MARGIN, doc.y + 8)
  doc.moveTo(MARGIN, doc.y + 18).lineTo(PAGE_WIDTH - MARGIN, doc.y + 18).strokeColor(TEAL).lineWidth(2).stroke()
  doc.y += 32
}

function decoratePages(doc: PDFKit.PDFDocument, companyName: string): void {
  const range = doc.bufferedPageRange()
  for (let index = range.start; index < range.start + range.count; index += 1) {
    doc.switchToPage(index)
    doc.save()
    doc.rotate(-32, { origin: [PAGE_WIDTH / 2, PAGE_HEIGHT / 2] })
    doc.font('Helvetica-Bold').fontSize(52).fillColor('#64748b').opacity(0.07)
      .text('CONFIDENTIAL', 70, PAGE_HEIGHT / 2 - 30, { width: PAGE_WIDTH - 140, align: 'center' })
    doc.restore()
    doc.opacity(1)
    doc.font('Helvetica').fontSize(8).fillColor(SLATE)
      .text(companyName, MARGIN, PAGE_HEIGHT - 42, { width: CONTENT_WIDTH / 2 })
      .text(`Confidential  •  Page ${index + 1} of ${range.count}`, PAGE_WIDTH / 2, PAGE_HEIGHT - 42, { width: CONTENT_WIDTH / 2, align: 'right' })
  }
}

async function renderPdf(companyName: string, build: (doc: PDFKit.PDFDocument) => void): Promise<Buffer> {
  const doc = new PDFDocument({ size: 'LETTER', margins: { top: MARGIN, right: MARGIN, bottom: 64, left: MARGIN }, bufferPages: true, info: { Title: 'Compliance Document', Author: companyName, Subject: 'Confidential compliance document' } })
  const chunks: Buffer[] = []
  const result = new Promise<Buffer>((resolve, reject) => {
    doc.on('data', chunk => chunks.push(Buffer.from(chunk)))
    doc.on('end', () => resolve(Buffer.concat(chunks)))
    doc.on('error', reject)
  })
  build(doc)
  decoratePages(doc, companyName)
  doc.end()
  return result
}

export async function generatePolicyPdf(input: PolicyPdfInput): Promise<Buffer> {
  const generatedAt = input.generatedAt || new Date()
  return renderPdf(input.companyName, doc => {
    addDocumentTitle(doc, input.companyName, input.policyTitle, generatedAt)
    const metricWidth = (CONTENT_WIDTH - 16) / 3
    const y = doc.y
    addMetric(doc, 'Framework', input.framework || 'General', MARGIN, y, metricWidth)
    addMetric(doc, 'Status', input.status || 'Draft', MARGIN + metricWidth + 8, y, metricWidth)
    addMetric(doc, 'Owner', input.owner || 'Unassigned', MARGIN + (metricWidth + 8) * 2, y, metricWidth)
    doc.y = y + 72
    addSection(doc, 'Policy Content')
    doc.font('Helvetica').fontSize(10.5).fillColor(NAVY).text(stripHtml(input.content) || 'No policy content available.', { width: CONTENT_WIDTH, lineGap: 4, align: 'left' })
    addSection(doc, 'Document Information')
    doc.font('Helvetica').fontSize(9).fillColor(SLATE)
      .text(`Company: ${input.companyName}`)
      .text(`Generated: ${generatedAt.toISOString()}`)
      .text('Classification: Confidential')
  })
}

export async function generateVendorPdf(companyName: string, vendors: VendorPdfItem[], generatedAt = new Date()): Promise<Buffer> {
  return renderPdf(companyName, doc => {
    addDocumentTitle(doc, companyName, 'Vendor Compliance Register', generatedAt)
    const compliant = vendors.filter(vendor => vendor.status === 'Compliant').length
    const highRisk = vendors.filter(vendor => vendor.riskLevel === 'High').length
    const width = (CONTENT_WIDTH - 16) / 3
    const y = doc.y
    addMetric(doc, 'Total Vendors', String(vendors.length), MARGIN, y, width)
    addMetric(doc, 'Compliant', String(compliant), MARGIN + width + 8, y, width)
    addMetric(doc, 'High Risk', String(highRisk), MARGIN + (width + 8) * 2, y, width)
    doc.y = y + 72
    addSection(doc, 'Vendor Details')
    addTable(doc, ['Vendor', 'Service', 'Standards', 'Risk', 'Status', 'Last Audit'], vendors.map(vendor => [
      vendor.name,
      vendor.serviceType || '—',
      (vendor.standards || []).join(', ') || '—',
      vendor.riskLevel || '—',
      vendor.status || '—',
      vendor.lastAuditDate || '—',
    ]), [105, 78, 100, 55, 84, 82])
  })
}

export async function generateComplianceReportPdf(input: ComplianceReportPdfInput): Promise<Buffer> {
  const generatedAt = input.generatedAt || new Date()
  return renderPdf(input.companyName, doc => {
    addDocumentTitle(doc, input.companyName, 'Compliance Status Report', generatedAt)
    const width = (CONTENT_WIDTH - 24) / 4
    const compliantVendors = input.vendors.filter(vendor => vendor.status === 'Compliant').length
    const y = doc.y
    addMetric(doc, 'Overall Score', `${input.overallRiskScore}/100`, MARGIN, y, width)
    addMetric(doc, 'SOC 2 Implemented', `${input.soc2Summary.implemented}/${input.soc2Summary.total}`, MARGIN + width + 8, y, width)
    addMetric(doc, 'Compliant Vendors', `${compliantVendors}/${input.vendors.length}`, MARGIN + (width + 8) * 2, y, width)
    addMetric(doc, '30-Day Events', String(input.audits.length), MARGIN + (width + 8) * 3, y, width)
    doc.y = y + 72

    addSection(doc, 'Risk Score Summary')
    addTable(doc, ['Category', 'Score', 'Trend'], input.riskScores.map(score => [score.category, `${score.score}/100`, score.trend || 'stable']), [252, 126, 126])

    addSection(doc, 'SOC 2 Control Status')
    addTable(doc, ['Status', 'Controls', 'Percentage'], [
      ['Implemented', String(input.soc2Summary.implemented), input.soc2Summary.total ? `${Math.round(input.soc2Summary.implemented / input.soc2Summary.total * 100)}%` : '0%'],
      ['Partial', String(input.soc2Summary.partial), input.soc2Summary.total ? `${Math.round(input.soc2Summary.partial / input.soc2Summary.total * 100)}%` : '0%'],
      ['Not Implemented', String(input.soc2Summary.notImplemented), input.soc2Summary.total ? `${Math.round(input.soc2Summary.notImplemented / input.soc2Summary.total * 100)}%` : '0%'],
    ], [252, 126, 126])

    addSection(doc, 'Vendor Compliance Summary')
    const vendorStatuses = ['Compliant', 'Pending', 'Not Compliant'].map(status => [status, String(input.vendors.filter(vendor => vendor.status === status).length)])
    addTable(doc, ['Status', 'Vendors'], vendorStatuses, [252, 252])

    addSection(doc, 'Audit Log — Last 30 Days')
    addTable(doc, ['Date', 'Action', 'Resource', 'Status', 'User'], input.audits.slice(0, 50).map(audit => [
      new Date(audit.timestamp).toLocaleDateString(),
      audit.action,
      audit.resourceType,
      audit.status,
      audit.userEmail || '—',
    ]), [78, 126, 90, 60, 150])
  })
}

export function policyPdfFilename(title: string): string {
  return `${safeFilename(title)}.pdf`
}
