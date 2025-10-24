const BASE = (import.meta as any).env?.VITE_API_BASE_URL || 'http://127.0.0.1:5000'

async function request<T>(path: string, opts: RequestInit = {}): Promise<T> {
  async function doFetch(base: string) {
    const res = await fetch(base + path, {
      ...opts,
      headers: {
        'Content-Type': 'application/json',
        ...(opts.headers || {}),
      },
    })
    if (!res.ok) {
      let msg = `${res.status} ${res.statusText}`
      try {
        const data = await res.json()
        msg = (data?.error as string) || msg
      } catch {}
      throw new Error(msg)
    }
    return res.json()
  }

  try {
    return await doFetch(BASE)
  } catch (e: any) {
    if (typeof BASE === 'string' && BASE.includes('localhost')) {
      const alt = BASE.replace('localhost', '127.0.0.1')
      try { return await doFetch(alt) } catch {}
    }
    throw e
  }
}

export type PolicyStatus = 'Draft' | 'In Review' | 'Approved'
export type Framework = 'GDPR' | 'HIPAA' | 'CCPA' | 'Other'
export type Policy = {
  id: string
  _id?: string
  name: string
  owner: string
  status: PolicyStatus
  content?: string
  framework?: Framework
  company?: string
  variables?: Record<string, unknown>
  versions?: { content: string; note?: string; createdAt: string }[]
}

export type GeneratePayload = { template: 'GDPR' | 'HIPAA' | 'CCPA'; company?: unknown; existingContent?: string }

// Week 3: Audits & Findings
export type RiskSeverity = 'Low' | 'Medium' | 'High'
export type Finding = {
  id: string
  title: string
  description?: string
  severity: RiskSeverity
  status: 'Open' | 'Resolved'
  createdAt: string
}
export type AuditStatus = 'Draft' | 'In Progress' | 'Closed'
export type Audit = {
  id: string
  _id?: string
  name: string
  owner: string
  status: AuditStatus
  dueDate?: string
  findings?: Finding[]
}

export const api = {
  async me(token: string) {
    return request<{ id: string; email: string; role: 'user' | 'admin' }>(`/auth/me`, { headers: { Authorization: `Bearer ${token}` } })
  },
  async register(email: string, password: string) {
    return request<{ token: string }>(`/auth/register`, { method: 'POST', body: JSON.stringify({ email, password }) })
  },
  async login(email: string, password: string) {
    return request<{ token: string }>(`/auth/login`, { method: 'POST', body: JSON.stringify({ email, password }) })
  },
  async listPolicies(token: string, params?: { q?: string; status?: PolicyStatus | 'All'; framework?: Framework | 'All' }) {
    const qs = new URLSearchParams()
    if (params?.q) qs.set('q', params.q)
    if (params?.status && params.status !== 'All') qs.set('status', params.status)
    if (params?.framework && params.framework !== 'All') qs.set('framework', params.framework)
    return request<{ items: Policy[] }>(`/policies?${qs.toString()}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
  },
  async getPolicy(token: string, id: string) {
    return request<Policy>(`/policies/${id}`, { headers: { Authorization: `Bearer ${token}` } })
  },
  async createPolicy(token: string, payload: Omit<Policy, 'id' | '_id' | 'versions'>) {
    return request<{ id: string }>(`/policies`, {
      method: 'POST',
      body: JSON.stringify(payload),
      headers: { Authorization: `Bearer ${token}` },
    })
  },
  async updatePolicy(token: string, id: string, payload: Partial<Omit<Policy, 'id' | '_id' | 'versions'>> & { note?: string }) {
    return request<{ id: string }>(`/policies/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
      headers: { Authorization: `Bearer ${token}` },
    })
  },
  async deletePolicy(token: string, id: string) {
    return fetch(BASE + `/policies/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } }).then(res => {
      if (!res.ok) throw new Error('Failed to delete')
      return true
    })
  },
  async generatePolicy(token: string, payload: GeneratePayload) {
    return request<{ content: string }>(`/policies/generate`, {
      method: 'POST',
      body: JSON.stringify(payload),
      headers: { Authorization: `Bearer ${token}` },
    })
  },
  async exportPolicy(token: string, id: string) {
    return request<{ ok: boolean; url?: string; content?: string; error?: string }>(`/policies/${id}/export`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    })
  },
  async submitReview(token: string, id: string) {
    return request<{ id: string; status: PolicyStatus }>(`/policies/${id}/submit-review`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    })
  },
  async approve(token: string, id: string) {
    return request<{ id: string; status: PolicyStatus }>(`/policies/${id}/approve`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    })
  },
  async listVersions(token: string, id: string) {
    return request<{ versions: { content: string; note?: string; createdAt: string }[] }>(`/policies/${id}/versions`, {
      headers: { Authorization: `Bearer ${token}` },
    })
  },
  async generateDraft(token: string, id: string, payload: { prompt?: string; variables?: Record<string, unknown>; model?: string }) {
    return request<{ content: string }>(`/policies/${id}/generate`, {
      method: 'POST',
      body: JSON.stringify(payload || {}),
      headers: { Authorization: `Bearer ${token}` },
    })
  },

  // Week 3: Audits API (with mock fallback if server route not present)
  async listAudits(token: string, params?: { q?: string; status?: AuditStatus | 'All'; dueBefore?: string }) {
    const qs = new URLSearchParams()
    if (params?.q) qs.set('q', params.q)
    if (params?.status && params.status !== 'All') qs.set('status', params.status)
    if (params?.dueBefore) qs.set('dueBefore', params.dueBefore)
    try {
      return await request<{ items: Audit[] }>(`/audits?${qs.toString()}`, { headers: { Authorization: `Bearer ${token}` } })
    } catch (e) {
      const m = await import('./mocks/audits')
      return m.listAudits(params)
    }
  },
  async getAudit(token: string, id: string) {
    try {
      return await request<Audit>(`/audits/${id}`, { headers: { Authorization: `Bearer ${token}` } })
    } catch {
      const m = await import('./mocks/audits')
      return m.getAudit(id)
    }
  },
  async createAudit(token: string, payload: Omit<Audit, 'id' | '_id' | 'findings'>) {
    try {
      return await request<{ id: string }>(`/audits`, {
        method: 'POST', body: JSON.stringify(payload), headers: { Authorization: `Bearer ${token}` },
      })
    } catch {
      const m = await import('./mocks/audits')
      return m.createAudit(payload)
    }
  },
  async updateAudit(token: string, id: string, payload: Partial<Omit<Audit, 'id' | '_id'>>) {
    try {
      return await request<{ id: string }>(`/audits/${id}`, {
        method: 'PUT', body: JSON.stringify(payload), headers: { Authorization: `Bearer ${token}` },
      })
    } catch {
      const m = await import('./mocks/audits')
      return m.updateAudit(id, payload)
    }
  },
  async addFinding(token: string, auditId: string, payload: Omit<Finding, 'id' | 'createdAt' | 'status'> & { status?: 'Open' | 'Resolved' }) {
    try {
      return await request<{ id: string }>(`/audits/${auditId}/findings`, {
        method: 'POST', body: JSON.stringify(payload), headers: { Authorization: `Bearer ${token}` },
      })
    } catch {
      const m = await import('./mocks/audits')
      return m.addFinding(auditId, payload as any)
    }
  },
  async updateFinding(token: string, auditId: string, findingId: string, payload: Partial<Finding>) {
    try {
      return await request<{ id: string }>(`/audits/${auditId}/findings/${findingId}`, {
        method: 'PUT', body: JSON.stringify(payload), headers: { Authorization: `Bearer ${token}` },
      })
    } catch {
      const m = await import('./mocks/audits')
      return m.updateFinding(auditId, findingId, payload)
    }
  },

  // Week 3: Risk Assessments
  async listAssessments(token: string, params?: { q?: string; status?: AssessmentStatus | 'All'; framework?: Framework | 'All'; dueBefore?: string }) {
    const qs = new URLSearchParams()
    if (params?.q) qs.set('q', params.q)
    if (params?.status && params.status !== 'All') qs.set('status', params.status)
    if (params?.framework && params.framework !== 'All') qs.set('framework', params.framework)
    if (params?.dueBefore) qs.set('dueBefore', params.dueBefore)
    return request<{ items: Assessment[] }>(`/assessments?${qs.toString()}`, { headers: { Authorization: `Bearer ${token}` } })
  },
  async createAssessment(token: string, payload: Omit<Assessment, 'id' | '_id' | 'items'>) {
    return request<{ id: string }>(`/assessments`, { method: 'POST', body: JSON.stringify(payload), headers: { Authorization: `Bearer ${token}` } })
  },
  async getAssessment(token: string, id: string) {
    return request<Assessment>(`/assessments/${id}`, { headers: { Authorization: `Bearer ${token}` } })
  },
  async updateAssessment(token: string, id: string, payload: Partial<Omit<Assessment, 'id' | '_id'>>) {
    return request<{ id: string }>(`/assessments/${id}`, { method: 'PUT', body: JSON.stringify(payload), headers: { Authorization: `Bearer ${token}` } })
  },
  async addAssessmentItem(token: string, id: string, payload: { text: string; category?: string; severity: RiskSeverity }) {
    return request<{ id: string }>(`/assessments/${id}/items`, { method: 'POST', body: JSON.stringify(payload), headers: { Authorization: `Bearer ${token}` } })
  },
  async updateAssessmentItem(token: string, id: string, itemId: string, payload: Partial<AssessmentItem>) {
    return request<{ id: string }>(`/assessments/${id}/items/${itemId}`, { method: 'PUT', body: JSON.stringify(payload), headers: { Authorization: `Bearer ${token}` } })
  },

  // Activities (Audit Trail)
  async listActivities(
    token: string,
    params?: { entityType?: 'Policy' | 'Audit' | 'Assessment' | 'Vendor'; action?: ActivityAction; entityId?: string; limit?: number }
  ) {
    const qs = new URLSearchParams()
    if (params?.entityType) qs.set('entityType', params.entityType)
    if (params?.action) qs.set('action', params.action)
    if (params?.entityId) qs.set('entityId', params.entityId)
    if (params?.limit) qs.set('limit', String(params.limit))
    return request<{ items: Activity[] }>(`/activities?${qs.toString()}`, { headers: { Authorization: `Bearer ${token}` } })
  },

  // Billing
  async getBillingStatus(token: string) {
    return request<BillingStatus>(`/billing/status`, { headers: { Authorization: `Bearer ${token}` } })
  },
  async createCheckout(token: string, priceId?: string) {
    return request<{ url: string }>(`/billing/create-checkout`, {
      method: 'POST',
      body: JSON.stringify(priceId ? { priceId } : {}),
      headers: { Authorization: `Bearer ${token}` },
    })
  },
  async openBillingPortal(token: string) {
    return request<{ url: string }>(`/billing/portal`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    })
  },

  // Week 4: Vendors
  async listVendors(
    token: string,
    params?: { q?: string; risk?: RiskLevel | 'All'; status?: ComplianceStatus | 'All'; framework?: string }
  ) {
    const qs = new URLSearchParams()
    if (params?.q) qs.set('q', params.q)
    if (params?.risk && params.risk !== 'All') qs.set('risk', params.risk)
    if (params?.status && params.status !== 'All') qs.set('status', params.status)
    if (params?.framework) qs.set('framework', params.framework)
    return request<{ items: Vendor[] }>(`/vendors?${qs.toString()}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
  },
  async createVendor(token: string, payload: Omit<Vendor, 'id' | 'createdAt' | 'updatedAt' | 'userId'>) {
    return request<{ id: string }>(`/vendors`, {
      method: 'POST',
      body: JSON.stringify(payload),
      headers: { Authorization: `Bearer ${token}` },
    })
  },
  async updateVendor(token: string, id: string, payload: Partial<Omit<Vendor, 'id' | 'userId'>>) {
    return request<{ id: string }>(`/vendors/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
      headers: { Authorization: `Bearer ${token}` },
    })
  },
  async deleteVendor(token: string, id: string) {
    const res = await fetch(BASE + `/vendors/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } })
    if (!res.ok) throw new Error('Failed to delete')
    return true
  },
  async uploadVendorsCSV(token: string, file: File) {
    const fd = new FormData()
    fd.append('file', file)
    const res = await fetch(BASE + `/vendors/upload`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: fd,
    })
    if (!res.ok) throw new Error(await res.text())
    return res.json() as Promise<{ created: number; updated: number; failed: number }>
  },
  async exportVendorsCSV(token: string): Promise<Blob> {
    const res = await fetch(BASE + `/vendors/export`, { headers: { Authorization: `Bearer ${token}` } })
    if (!res.ok) throw new Error('Export failed')
    return res.blob()
  },
  async exportVendorsTemplate(token: string): Promise<Blob> {
    const res = await fetch(BASE + `/vendors/template`, { headers: { Authorization: `Bearer ${token}` } })
    if (!res.ok) throw new Error('Template download failed')
    return res.blob()
  },
}

// Types for Assessments
export type AssessmentStatus = 'Draft' | 'In Progress' | 'Completed'
export type ItemResponse = 'Yes' | 'No' | 'N/A'
export type AssessmentItem = {
  id: string
  text: string
  category?: string
  severity: RiskSeverity
  response: ItemResponse
  notes?: string
  evidenceUrls?: string[]
  createdAt: string
}
export type Assessment = {
  id: string
  _id?: string
  name: string
  owner: string
  framework?: Framework
  status: AssessmentStatus
  dueDate?: string
  items?: AssessmentItem[]
}

// Activity types
export type EntityType = 'Policy' | 'Audit' | 'Assessment' | 'Vendor'
export type ActivityAction = 'create' | 'update' | 'delete' | 'status_change' | 'export' | 'generate'
export type Activity = {
  id?: string
  userId: string
  entityType: EntityType
  entityId: string
  action: ActivityAction
  metadata?: Record<string, unknown>
  createdAt: string
}

// Billing types
export type BillingStatus = {
  status: 'active' | 'trialing' | 'past_due' | 'canceled' | 'incomplete' | 'incomplete_expired' | 'unpaid' | 'none'
  stripeCustomerId?: string
  stripeSubscriptionId?: string
  publishableKey?: string
}

// Week 4: Vendor types
export type RiskLevel = 'Low' | 'Medium' | 'High'
export type ComplianceStatus = 'Compliant' | 'Pending' | 'Not Compliant'
export type Vendor = {
  id: string
  name: string
  serviceType?: string
  standards?: string[]
  riskLevel?: RiskLevel
  status?: ComplianceStatus
  lastAuditDate?: string
  notes?: string
  createdAt?: string
  updatedAt?: string
}
