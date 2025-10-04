import { useEffect, useState } from 'react'
import { api } from '../api'
import { Skeleton } from '../components/Skeleton'
import { useToast } from '../components/Toast'

export function CompanyForm({ token }: { token: string }) {
  const [industry, setIndustry] = useState('')
  const [region, setRegion] = useState('')
  const [size, setSize] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const { notify } = useToast()

  useEffect(() => {
    let ignore = false
    async function load() {
      setLoading(true)
      setMessage(null)
      try {
        const res = await api.getCompany(token)
        if (!ignore && res?.profile) {
          const p = res.profile as any
          setIndustry(String(p.industry || ''))
          setRegion(String(p.region || ''))
          setSize(String(p.size || ''))
        }
      } catch (e: any) {
        // 404 is fine (not created yet)
        setMessage(e?.message?.includes('Not found') ? null : e?.message)
      } finally {
        if (!ignore) setLoading(false)
      }
    }
    load()
    return () => { ignore = true }
  }, [token])

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setMessage(null)
    try {
      await api.saveCompany(token, { industry, region, size })
      setMessage('Saved')
      notify('Company profile saved', 'success')
    } catch (e: any) {
      setMessage(e?.message || 'Failed to save')
      notify(e?.message || 'Failed to save Company profile', 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="card">
      <div className="card-title">Company Profile</div>
      {loading ? (
        <div className="space-y-3">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-40" />
        </div>
      ) : (
        <form onSubmit={submit} className="form" style={{ display: 'grid', gap: 12 }}>
          <label>
            <div>Industry</div>
            <input value={industry} onChange={e => setIndustry(e.target.value)} placeholder="e.g., SaaS" required />
          </label>
          <label>
            <div>Region</div>
            <input value={region} onChange={e => setRegion(e.target.value)} placeholder="e.g., US" required />
          </label>
          <label>
            <div>Company Size</div>
            <input value={size} onChange={e => setSize(e.target.value)} placeholder="e.g., 11-50" required />
          </label>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="primary" type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
            {message && <div className="card-hint">{message}</div>}
          </div>
        </form>
      )}
    </div>
  )
}
