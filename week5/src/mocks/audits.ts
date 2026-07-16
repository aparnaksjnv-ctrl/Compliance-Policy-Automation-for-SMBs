import type { Audit, Finding, RiskSeverity, AuditStatus } from '../api'

let _idCounter = 1
function uid() { return String(_idCounter++) }

const today = new Date()
const inDays = (n: number) => new Date(today.getTime() + n * 86400000).toISOString()

let audits: Audit[] = [
  {
    id: uid(),
    name: 'GDPR Q4 Internal Audit',
    owner: 'Alice',
    status: 'In Progress',
    dueDate: inDays(20),
    findings: [
      { id: uid(), title: 'Data retention policy not reviewed', severity: 'Medium', status: 'Open', createdAt: new Date().toISOString() },
      { id: uid(), title: 'Vendor DPA missing for ACME', severity: 'High', status: 'Open', createdAt: new Date().toISOString() },
    ],
  },
  {
    id: uid(),
    name: 'HIPAA Annual Audit',
    owner: 'Bob',
    status: 'Draft',
    dueDate: inDays(45),
    findings: [
      { id: uid(), title: 'BAA renewal pending', severity: 'Low', status: 'Open', createdAt: new Date().toISOString() },
    ],
  },
]

export async function listAudits(params?: { q?: string; status?: AuditStatus | 'All'; dueBefore?: string }) {
  let items = audits.slice()
  if (params?.q) {
    const q = params.q.toLowerCase()
    items = items.filter(a => a.name.toLowerCase().includes(q) || a.owner.toLowerCase().includes(q))
  }
  if (params?.status && params.status !== 'All') {
    items = items.filter(a => a.status === params.status)
  }
  if (params?.dueBefore) {
    const dt = new Date(params.dueBefore).getTime()
    items = items.filter(a => (a.dueDate ? new Date(a.dueDate).getTime() <= dt : false))
  }
  return { items }
}

export async function getAudit(id: string) {
  const a = audits.find(a => a.id === id)
  if (!a) throw new Error('Not found')
  return a
}

export async function createAudit(payload: Omit<Audit, 'id' | '_id' | 'findings'>) {
  const a: Audit = { ...payload, id: uid(), findings: [] }
  audits.unshift(a)
  return { id: a.id }
}

export async function updateAudit(id: string, payload: Partial<Omit<Audit, 'id' | '_id'>>) {
  const idx = audits.findIndex(a => a.id === id)
  if (idx === -1) throw new Error('Not found')
  audits[idx] = { ...audits[idx], ...payload }
  return { id }
}

export async function addFinding(auditId: string, payload: Omit<Finding, 'id' | 'createdAt' | 'status'> & { status?: 'Open' | 'Resolved' }) {
  const a = audits.find(a => a.id === auditId)
  if (!a) throw new Error('Not found')
  const f: Finding = { id: uid(), createdAt: new Date().toISOString(), status: payload.status ?? 'Open', title: payload.title, description: payload.description, severity: payload.severity as RiskSeverity }
  a.findings = a.findings || []
  a.findings.unshift(f)
  return { id: f.id }
}

export async function updateFinding(auditId: string, findingId: string, payload: Partial<Finding>) {
  const a = audits.find(a => a.id === auditId)
  if (!a || !a.findings) throw new Error('Not found')
  const idx = a.findings.findIndex(f => f.id === findingId)
  if (idx === -1) throw new Error('Not found')
  a.findings[idx] = { ...a.findings[idx], ...payload }
  return { id: findingId }
}
