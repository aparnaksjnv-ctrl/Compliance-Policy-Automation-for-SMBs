const BASE = (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:5001'

async function request<T>(path: string, opts: RequestInit = {}): Promise<T> {
  const res = await fetch(BASE + path, {
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

export type PolicyStatus = 'Draft' | 'In Review' | 'Approved'
export type Policy = { id: string; _id?: string; name: string; owner: string; status: PolicyStatus; content?: string }

export const api = {
  async register(email: string, password: string) {
    return request<{ token: string }>(`/auth/register`, { method: 'POST', body: JSON.stringify({ email, password }) })
  },
  async login(email: string, password: string) {
    return request<{ token: string }>(`/auth/login`, { method: 'POST', body: JSON.stringify({ email, password }) })
  },
  async listPolicies(token: string, params?: { q?: string; status?: PolicyStatus | 'All' }) {
    const qs = new URLSearchParams()
    if (params?.q) qs.set('q', params.q)
    if (params?.status && params.status !== 'All') qs.set('status', params.status)
    return request<{ items: Policy[] }>(`/policies?${qs.toString()}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
  },
  async getPolicy(token: string, id: string) {
    return request<Policy>(`/policies/${id}`, { headers: { Authorization: `Bearer ${token}` } })
  },
  async createPolicy(token: string, payload: Omit<Policy, 'id' | '_id'>) {
    return request<{ id: string }>(`/policies`, {
      method: 'POST',
      body: JSON.stringify(payload),
      headers: { Authorization: `Bearer ${token}` },
    })
  },
  async updatePolicy(token: string, id: string, payload: Partial<Omit<Policy, 'id' | '_id'>>) {
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
}
