import { useEffect, useMemo, useState } from 'react'
import type React from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { Link, useSearchParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import { api, Assessment, AssessmentStatus, Framework } from '../api'

export function Assessments({ token }: { token: string }) {
  const [q, setQ] = useState('')
  const [status, setStatus] = useState<'All' | AssessmentStatus>('All')
  const [framework, setFramework] = useState<'All' | Framework>('All')
  const [dueBefore, setDueBefore] = useState<string>('')
  const [params, setParams] = useSearchParams()

  useEffect(() => {
    const qp = params.get('q') || ''
    const sp = (params.get('status') as AssessmentStatus | 'All') || 'All'
    const fp = (params.get('framework') as Framework | 'All') || 'All'
    const db = params.get('dueBefore') || ''
    setQ(qp)
    if (sp === 'Draft' || sp === 'In Progress' || sp === 'Completed' || sp === 'All') setStatus(sp)
    if (fp === 'GDPR' || fp === 'HIPAA' || fp === 'CCPA' || fp === 'Other' || fp === 'All') setFramework(fp)
    if (db) setDueBefore(db)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const next = new URLSearchParams()
    if (q) next.set('q', q)
    if (status !== 'All') next.set('status', status)
    if (framework !== 'All') next.set('framework', framework)
    if (dueBefore) next.set('dueBefore', dueBefore)
    setParams(next, { replace: true })
  }, [q, status, framework, dueBefore, setParams])

  const listQ = useQuery({
    queryKey: ['assessments', q, status, framework, dueBefore],
    queryFn: () => api.listAssessments(token, { q, status, framework, dueBefore }),
  })

  const create = useMutation({
    mutationFn: (payload: Omit<Assessment, 'id' | '_id' | 'items'>) => api.createAssessment(token, payload),
    onSuccess: () => { toast.success('Assessment created'); listQ.refetch() },
    onError: (e: any) => toast.error(String(e?.message || 'Create failed')),
  })

  const items = listQ.data?.items || []

  function onCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const name = String(fd.get('name') || '')
    const owner = String(fd.get('owner') || '')
    const fw = (String(fd.get('framework') || '') as Framework) || undefined
    const s = (String(fd.get('status') || 'Draft') as AssessmentStatus)
    const dueDate = String(fd.get('dueDate') || '') || undefined
    if (!name || !owner) return
    create.mutate({ name, owner, framework: fw, status: s, dueDate })
    e.currentTarget.reset()
  }

  function counts(a: Assessment) {
    const total = (a.items || []).length
    const yes = (a.items || []).filter(i => i.response === 'Yes').length
    const no = (a.items || []).filter(i => i.response === 'No').length
    return { total, yes, no }
  }

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 12, alignItems: 'center' }}>
        <input placeholder="Search" value={q} onChange={e => setQ(e.target.value)} />
        <select value={status} onChange={e => setStatus(e.target.value as any)}>
          <option>All</option>
          <option>Draft</option>
          <option>In Progress</option>
          <option>Completed</option>
        </select>
        <select value={framework} onChange={e => setFramework(e.target.value as any)}>
          <option>All</option>
          <option>GDPR</option>
          <option>HIPAA</option>
          <option>CCPA</option>
          <option>Other</option>
        </select>
        <input type="date" value={dueBefore} onChange={e => setDueBefore(e.target.value)} title="Due before" />
        <button onClick={() => listQ.refetch()} disabled={listQ.isFetching}>Refresh</button>
      </div>

      {listQ.error && <div style={{ color: '#fca5a5' }}>{String((listQ.error as any)?.message || 'Failed to load')}</div>}

      <form onSubmit={onCreate} style={{ display: 'grid', gap: 8, marginBottom: 12 }}>
        <div style={{ fontWeight: 600 }}>New Assessment</div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <input name="name" placeholder="Name" required />
          <input name="owner" placeholder="Owner" required />
          <select name="framework" defaultValue="GDPR" title="Framework">
            <option>GDPR</option>
            <option>HIPAA</option>
            <option>CCPA</option>
            <option>Other</option>
          </select>
          <input name="dueDate" type="date" placeholder="Due date" />
          <select name="status" defaultValue="Draft">
            <option>Draft</option>
            <option>In Progress</option>
            <option>Completed</option>
          </select>
          <button type="submit" disabled={create.isPending}>Create</button>
        </div>
      </form>

      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ textAlign: 'left' }}>
            <th style={{ padding: '8px 6px', borderBottom: '1px solid #1f2937' }}>Name</th>
            <th style={{ padding: '8px 6px', borderBottom: '1px solid #1f2937' }}>Owner</th>
            <th style={{ padding: '8px 6px', borderBottom: '1px solid #1f2937' }}>Framework</th>
            <th style={{ padding: '8px 6px', borderBottom: '1px solid #1f2937' }}>Due</th>
            <th style={{ padding: '8px 6px', borderBottom: '1px solid #1f2937' }}>Status</th>
            <th style={{ padding: '8px 6px', borderBottom: '1px solid #1f2937' }}>Progress</th>
          </tr>
        </thead>
        <tbody>
          {listQ.isFetching && items.length === 0 && [0,1,2].map(i => (
            <tr key={`sk-${i}`}>
              {Array.from({ length: 6 }).map((_, j) => (
                <td key={j} style={{ padding: '8px 6px', borderBottom: '1px solid #1f2937' }}>
                  <div style={{ height: 14, background: '#111827', borderRadius: 6, opacity: 0.6, width: j===0? '60%': '30%' }} />
                </td>
              ))}
            </tr>
          ))}
          {items.map(a => {
            const c = counts(a)
            return (
              <tr key={a.id || a._id}>
                <td style={{ padding: '8px 6px', borderBottom: '1px solid #1f2937' }}><Link to={`/assessments/${a.id || a._id}`}>{a.name}</Link></td>
                <td style={{ padding: '8px 6px', borderBottom: '1px solid #1f2937' }}>{a.owner}</td>
                <td style={{ padding: '8px 6px', borderBottom: '1px solid #1f2937' }}>{a.framework || '-'}</td>
                <td style={{ padding: '8px 6px', borderBottom: '1px solid #1f2937' }}>{a.dueDate ? new Date(a.dueDate).toLocaleDateString() : '-'}</td>
                <td style={{ padding: '8px 6px', borderBottom: '1px solid #1f2937' }}>{a.status}</td>
                <td style={{ padding: '8px 6px', borderBottom: '1px solid #1f2937' }}>{c.yes}/{c.total} Yes ({c.no} No)</td>
              </tr>
            )
          })}
          {items.length === 0 && (
            <tr>
              <td colSpan={6} style={{ padding: '12px 6px', color: '#94a3b8' }}>No assessments yet</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
