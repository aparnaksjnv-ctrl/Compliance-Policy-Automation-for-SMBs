import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import { useState } from 'react'
import type React from 'react'
import { api, Audit, Finding, AuditStatus, RiskSeverity } from '../api'
import toast from 'react-hot-toast'

export function AuditDetail({ token }: { token: string }) {
  const { id = '' } = useParams()
  const navigate = useNavigate()

  const me = useQuery<{ id: string; email: string; role: 'user' | 'admin' }>({ queryKey: ['me'], queryFn: () => api.me(token) })
  const auditQ = useQuery<Audit>({ queryKey: ['audit', id], queryFn: () => api.getAudit(token, id), enabled: !!id })

  const updateAudit = useMutation({
    mutationFn: (payload: Partial<Omit<Audit, 'id' | '_id'>>) => api.updateAudit(token, id, payload),
    onSuccess: () => { toast.success('Audit updated'); auditQ.refetch() },
    onError: (e: any) => toast.error(String(e?.message || 'Update failed')),
  })

  const addFinding = useMutation({
    mutationFn: (payload: { title: string; description?: string; severity: RiskSeverity }) => api.addFinding(token, id, payload as any),
    onSuccess: () => { toast.success('Finding added'); auditQ.refetch() },
    onError: (e: any) => toast.error(String(e?.message || 'Add finding failed')),
  })

  const updateFinding = useMutation({
    mutationFn: ({ fid, patch }: { fid: string; patch: Partial<Finding> }) => api.updateFinding(token, id, fid, patch),
    onSuccess: () => { toast.success('Finding updated'); auditQ.refetch() },
    onError: (e: any) => toast.error(String(e?.message || 'Update finding failed')),
  })

  const a = auditQ.data
  const isAdmin = me.data?.role === 'admin'

  function onAddFinding(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const title = String(fd.get('title') || '')
    const description = String(fd.get('description') || '') || undefined
    const severity = (String(fd.get('severity') || 'Low') as RiskSeverity)
    if (!title) return
    addFinding.mutate({ title, description, severity })
    e.currentTarget.reset()
  }

  function setStatus(s: AuditStatus) {
    updateAudit.mutate({ status: s })
  }

  if (auditQ.isFetching && !a) return <div style={{ color: '#94a3b8' }}>Loading…</div>
  if (auditQ.error) return <div style={{ color: '#fca5a5' }}>{String((auditQ.error as any)?.message || 'Failed to load')}</div>
  if (!a) return null

  const openCount = (a.findings || []).filter(f => f.status === 'Open').length

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 700 }}>{a.name}</div>
          <div style={{ color: '#94a3b8' }}>Owner: {a.owner} {a.dueDate ? `• Due ${new Date(a.dueDate).toLocaleDateString()}` : ''}</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <span style={{ padding: '6px 10px', border: '1px solid var(--border)', borderRadius: 8 }}>{a.status}</span>
          {isAdmin && (
            <>
              {a.status !== 'Draft' && <button onClick={() => setStatus('Draft')}>Mark Draft</button>}
              {a.status !== 'In Progress' && <button onClick={() => setStatus('In Progress')}>Start</button>}
              {a.status !== 'Closed' && openCount === 0 && <button onClick={() => setStatus('Closed')}>Close</button>}
            </>
          )}
        </div>
      </div>

      {/* Findings */}
      <section style={{ border: '1px solid var(--border)', borderRadius: 10, background: '#111827', padding: 12 }}>
        <div style={{ fontWeight: 600, marginBottom: 8 }}>Findings ({openCount} open)</div>
        <div style={{ display: 'grid', gap: 8 }}>
          {(a.findings || []).map(f => (
            <div key={f.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid var(--border)', borderRadius: 8, padding: 10 }}>
              <div>
                <div style={{ fontWeight: 600 }}>{f.title}</div>
                <div style={{ color: '#94a3b8' }}>{f.description || ''}</div>
                <div style={{ color: f.severity === 'High' ? '#f87171' : f.severity === 'Medium' ? '#fbbf24' : '#22c55e' }}>{f.severity}</div>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <span>{f.status}</span>
                {f.status === 'Open' && (
                  <button onClick={() => updateFinding.mutate({ fid: f.id, patch: { status: 'Resolved' } })}>
                    Resolve
                  </button>
                )}
                {f.status === 'Resolved' && isAdmin && (
                  <button onClick={() => updateFinding.mutate({ fid: f.id, patch: { status: 'Open' } })}>
                    Re-open
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Add finding */}
        <form onSubmit={onAddFinding} style={{ display: 'grid', gap: 8, marginTop: 12 }}>
          <div style={{ fontWeight: 600 }}>Add finding</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <input name="title" placeholder="Title" required />
            <input name="description" placeholder="Description (optional)" />
            <select name="severity" defaultValue="Medium">
              <option>Low</option>
              <option>Medium</option>
              <option>High</option>
            </select>
            <button type="submit" disabled={addFinding.isPending}>Add</button>
          </div>
        </form>
      </section>
    </div>
  )
}
