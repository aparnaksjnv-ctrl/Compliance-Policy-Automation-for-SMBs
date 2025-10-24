import { useState, useEffect } from 'react'
import type React from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { Link, useSearchParams } from 'react-router-dom'
import { api, Policy, PolicyStatus, Framework } from '../api'
import toast from 'react-hot-toast'

export function Policies({ token }: { token: string }) {
  const [q, setQ] = useState('')
  const [status, setStatus] = useState<'All' | PolicyStatus>('All')
  const [framework, setFramework] = useState<'All' | Framework>('All')
  const [params, setParams] = useSearchParams()

  // Initialize from URL once on mount
  useEffect(() => {
    const qp = params.get('q') || ''
    const sp = (params.get('status') as PolicyStatus | 'All') || 'All'
    const fp = (params.get('framework') as Framework | 'All') || 'All'
    setQ(qp)
    if (sp === 'Draft' || sp === 'In Review' || sp === 'Approved' || sp === 'All') setStatus(sp)
    if (fp === 'GDPR' || fp === 'HIPAA' || fp === 'CCPA' || fp === 'Other' || fp === 'All') setFramework(fp)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Write state to URL on change
  useEffect(() => {
    const next = new URLSearchParams()
    if (q) next.set('q', q)
    if (status !== 'All') next.set('status', status)
    if (framework !== 'All') next.set('framework', framework)
    setParams(next, { replace: true })
  }, [q, status, framework, setParams])

  const { data, refetch, isFetching, error } = useQuery({
    queryKey: ['policies', q, status, framework],
    queryFn: () => api.listPolicies(token, { q, status, framework }),
  })

  const create = useMutation({
    mutationFn: (payload: Omit<Policy, 'id' | '_id' | 'versions'>) => api.createPolicy(token, payload),
    onSuccess: () => { toast.success('Policy created'); refetch() },
    onError: (e: any) => toast.error(String(e?.message || 'Create failed')),
  })

  const del = useMutation({
    mutationFn: (id: string) => api.deletePolicy(token, id),
    onSuccess: () => { toast.success('Policy deleted'); refetch() },
    onError: (e: any) => toast.error(String(e?.message || 'Delete failed')),
  })

  const items = data?.items || []

  function onCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const name = String(fd.get('name') || '')
    const owner = String(fd.get('owner') || '')
    const s = (String(fd.get('status') || 'Draft') as PolicyStatus)
    const fw = (String(fd.get('framework') || '') as Framework) || undefined
    const company = (String(fd.get('company') || '') || undefined) as string | undefined
    if (!name || !owner) return
    create.mutate({ name, owner, status: s, framework: fw, company })
    e.currentTarget.reset()
  }

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <input placeholder="Search" value={q} onChange={e => setQ(e.target.value)} />
        <select value={status} onChange={e => setStatus(e.target.value as any)}>
          <option>All</option>
          <option>Draft</option>
          <option>In Review</option>
          <option>Approved</option>
        </select>
        <select value={framework} onChange={e => setFramework(e.target.value as any)}>
          <option>All</option>
          <option>GDPR</option>
          <option>HIPAA</option>
          <option>CCPA</option>
          <option>Other</option>
        </select>
        <button onClick={() => refetch()} disabled={isFetching}>Refresh</button>
      </div>

      {error && <div style={{ color: '#fca5a5' }}>{String((error as any)?.message || 'Failed to load')}</div>}

      <form onSubmit={onCreate} style={{ display: 'grid', gap: 8, marginBottom: 12 }}>
        <div style={{ fontWeight: 600 }}>New Policy</div>
        <div style={{ display: 'flex', gap: 8 }}>
          <input name="name" placeholder="Name" required />
          <input name="owner" placeholder="Owner" required />
          <select name="status" defaultValue="Draft">
            <option>Draft</option>
            <option>In Review</option>
            <option>Approved</option>
          </select>
          <select name="framework" defaultValue="GDPR" title="Framework">
            <option>GDPR</option>
            <option>HIPAA</option>
            <option>CCPA</option>
            <option>Other</option>
          </select>
          <input name="company" placeholder="Company (optional)" />
          <button type="submit" disabled={create.isPending}>Create</button>
        </div>
      </form>

      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ textAlign: 'left' }}>
            <th style={{ padding: '8px 6px', borderBottom: '1px solid #1f2937' }}>Name</th>
            <th style={{ padding: '8px 6px', borderBottom: '1px solid #1f2937' }}>Owner</th>
            <th style={{ padding: '8px 6px', borderBottom: '1px solid #1f2937' }}>Framework</th>
            <th style={{ padding: '8px 6px', borderBottom: '1px solid #1f2937' }}>Status</th>
            <th style={{ padding: '8px 6px', borderBottom: '1px solid #1f2937' }}></th>
          </tr>
        </thead>
        <tbody>
          {isFetching && items.length === 0 && [0,1,2].map(i => (
            <tr key={`sk-${i}`}>
              {Array.from({ length: 5 }).map((_, j) => (
                <td key={j} style={{ padding: '8px 6px', borderBottom: '1px solid #1f2937' }}>
                  <div style={{ height: 14, background: '#111827', borderRadius: 6, opacity: 0.6, width: j===0? '60%': j===1? '40%': '30%' }} />
                </td>
              ))}
            </tr>
          ))}
          {items.map(p => (
            <tr key={p.id || p._id}>
              <td style={{ padding: '8px 6px', borderBottom: '1px solid #1f2937' }}><Link to={`/policies/${p.id || p._id}`}>{p.name}</Link></td>
              <td style={{ padding: '8px 6px', borderBottom: '1px solid #1f2937' }}>{p.owner}</td>
              <td style={{ padding: '8px 6px', borderBottom: '1px solid #1f2937' }}>{p.framework || '-'}</td>
              <td style={{ padding: '8px 6px', borderBottom: '1px solid #1f2937' }}>{p.status}</td>
              <td style={{ padding: '8px 6px', borderBottom: '1px solid #1f2937' }}>
                <button onClick={() => del.mutate(p.id || p._id!)} disabled={del.isPending}>Delete</button>
              </td>
            </tr>
          ))}
          {items.length === 0 && (
            <tr>
              <td colSpan={5} style={{ padding: '12px 6px', color: '#94a3b8' }}>No policies yet</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
