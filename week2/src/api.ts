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
}
