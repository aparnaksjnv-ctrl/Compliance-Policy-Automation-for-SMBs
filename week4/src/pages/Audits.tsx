import { useEffect, useState } from 'react'
import type React from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { Link, useSearchParams } from 'react-router-dom'
import { api, Audit, AuditStatus } from '../api'
import toast from 'react-hot-toast'

export function Audits({ token }: { token: string }) {
  const [q, setQ] = useState('')
  const [status, setStatus] = useState<'All' | AuditStatus>('All')
  const [dueBefore, setDueBefore] = useState<string>('')
  const [params, setParams] = useSearchParams()

  // Initialize from URL once on mount
  useEffect(() => {
    const qp = params.get('q') || ''
    const sp = (params.get('status') as AuditStatus | 'All') || 'All'
    const db = params.get('dueBefore') || ''
    setQ(qp)
    if (sp === 'Draft' || sp === 'In Progress' || sp === 'Closed' || sp === 'All') setStatus(sp)
    if (db) setDueBefore(db)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Write state to URL on change
  useEffect(() => {
    const next = new URLSearchParams()
    if (q) next.set('q', q)
    if (status !== 'All') next.set('status', status)
    if (dueBefore) next.set('dueBefore', dueBefore)
    setParams(next, { replace: true })
  }, [q, status, dueBefore, setParams])

  const { data, refetch, isFetching, error } = useQuery({
    queryKey: ['audits', q, status, dueBefore],
    queryFn: () => api.listAudits(token, { q, status, dueBefore }),
  })

  const create = useMutation({
    mutationFn: (payload: Omit<Audit, 'id' | '_id' | 'findings'>) => api.createAudit(token, payload),
    onSuccess: () => { toast.success('Audit created'); refetch() },
    onError: (e: any) => toast.error(String(e?.message || 'Create failed')),
  })

  const items = data?.items || []

  function onCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const name = String(fd.get('name') || '')
    const owner = String(fd.get('owner') || '')
    const dueDate = String(fd.get('dueDate') || '') || undefined
    const s = (String(fd.get('status') || 'Draft') as AuditStatus)
    if (!name || !owner) return
    create.mutate({ name, owner, status: s, dueDate })
    e.currentTarget.reset()
  }

  function openCount(a: Audit) {
    return (a.findings || []).filter(f => f.status === 'Open').length
  }

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <div className="page-header">
        <div className="page-header__title">Audits</div>
        <div className="page-header__actions">
          <input placeholder="Search" value={q} onChange={e => setQ(e.target.value)} />
          <select value={status} onChange={e => setStatus(e.target.value as any)}>
            <option>All</option>
            <option>Draft</option>
            <option>In Progress</option>
            <option>Closed</option>
          </select>
          <input type="date" value={dueBefore} onChange={e => setDueBefore(e.target.value)} title="Due before" />
          <button className="btn" onClick={() => refetch()} disabled={isFetching}>Refresh</button>
        </div>
      </div>

      {error && <div className="text-danger">{String((error as any)?.message || 'Failed to load')}</div>}

      <form onSubmit={onCreate} className="card" style={{ display: 'grid', gap: 10 }}>
        <div style={{ fontWeight: 600 }}>New Audit</div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <input name="name" placeholder="Name" required />
          <input name="owner" placeholder="Owner" required />
          <input name="dueDate" type="date" placeholder="Due date" />
          <select name="status" defaultValue="Draft">
            <option>Draft</option>
            <option>In Progress</option>
            <option>Closed</option>
          </select>
          <button type="submit" className="btn btn--primary" disabled={create.isPending}>Create</button>
        </div>
      </form>

      <table className="table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Owner</th>
            <th>Due</th>
            <th>Status</th>
            <th>Open findings</th>
          </tr>
        </thead>
        <tbody>
          {isFetching && items.length === 0 && [0,1,2].map(i => (
            <tr key={`sk-${i}`}>
              {Array.from({ length: 5 }).map((_, j) => (
                <td key={j}>
                  <div style={{ height: 14, background: 'var(--bg-surface)', borderRadius: 6, opacity: 0.6, width: j===0? '60%': '30%' }} />
                </td>
              ))}
            </tr>
          ))}
          {items.map(a => (
            <tr key={a.id || a._id}>
              <td><Link to={`/audits/${a.id || a._id}`}>{a.name}</Link></td>
              <td>{a.owner}</td>
              <td>{a.dueDate ? new Date(a.dueDate).toLocaleDateString() : '-'}</td>
              <td>{a.status}</td>
              <td>{openCount(a)}</td>
            </tr>
          ))}
          {items.length === 0 && (
            <tr>
              <td colSpan={5} className="text-muted">No audits yet</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
