import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import { api, Policy, PolicyStatus } from '../api'
import { useState, useEffect } from 'react'

export function PolicyDetail({ token }: { token: string }) {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const { data, isFetching, error, refetch } = useQuery({
    queryKey: ['policy', id],
    queryFn: () => api.getPolicy(token, id),
    enabled: !!id,
  })

  const [form, setForm] = useState<Partial<Policy>>({})
  useEffect(() => { if (data) setForm({ name: data.name, owner: data.owner, status: data.status, content: data.content }) }, [data])

  const update = useMutation({
    mutationFn: (payload: Partial<Policy>) => api.updatePolicy(token, id, payload),
    onSuccess: () => refetch(),
  })

  const del = useMutation({
    mutationFn: () => api.deletePolicy(token, id),
    onSuccess: () => navigate('/policies', { replace: true }),
  })

  function onChange<K extends keyof Policy>(key: K, value: Policy[K]) {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    update.mutate(form)
  }

  if (isFetching) return <div>Loading…</div>
  if (error) return <div style={{ color: '#fca5a5' }}>{String((error as any)?.message || 'Failed to load')}</div>
  if (!data) return <div>Not found</div>

  return (
    <div>
      <div style={{ marginBottom: 12 }}>
        <button onClick={() => navigate('/policies')}>{'< Back'}</button>
      </div>
      <form onSubmit={onSubmit} style={{ display: 'grid', gap: 10 }}>
        <label>
          <div>Name</div>
          <input value={form.name || ''} onChange={e => onChange('name', e.target.value as any)} required />
        </label>
        <label>
          <div>Owner</div>
          <input value={form.owner || ''} onChange={e => onChange('owner', e.target.value as any)} required />
        </label>
        <label>
          <div>Status</div>
          <select value={form.status || 'Draft'} onChange={e => onChange('status', e.target.value as PolicyStatus)}>
            <option>Draft</option>
            <option>In Review</option>
            <option>Approved</option>
          </select>
        </label>
        <label>
          <div>Content</div>
          <textarea rows={8} value={form.content || ''} onChange={e => onChange('content', e.target.value as any)} />
        </label>
        <div style={{ display: 'flex', gap: 8 }}>
          <button type="submit" disabled={update.isPending}>Save</button>
          <button type="button" onClick={() => del.mutate()} disabled={del.isPending}>Delete</button>
        </div>
      </form>
    </div>
  )
}
