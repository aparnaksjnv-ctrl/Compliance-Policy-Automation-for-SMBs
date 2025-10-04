const BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:4000'

async function request(path: string, options: RequestInit = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options,
  })
  const text = await res.text()
  let data: any
  try { data = text ? JSON.parse(text) : undefined } catch { data = text }
  if (!res.ok) throw new Error(data?.error || res.statusText)
  return data
}

export const api = {
  async register(email: string, password: string): Promise<{ token: string }> {
    return request('/auth/register', { method: 'POST', body: JSON.stringify({ email, password }) })
  },
  async login(email: string, password: string): Promise<{ token: string }> {
    return request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) })
  },
  async getCompany(token: string): Promise<{ profile: any }> {
    return request('/company', { headers: { Authorization: `Bearer ${token}` } })
  },
  async saveCompany(token: string, profile: { industry: string; region: string; size: string }): Promise<{ id: string }> {
    return request('/company', { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: JSON.stringify(profile) })
  },
}
