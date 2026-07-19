import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import { useState } from 'react'
import type React from 'react'
import { api, Assessment, AssessmentItem, AssessmentStatus, Framework, RiskSeverity, ItemResponse } from '../api'
import toast from 'react-hot-toast'

export function AssessmentDetail({ token }: { token: string }) {
  const { id = '' } = useParams()
  const navigate = useNavigate()

  const assessQ = useQuery<Assessment>({ queryKey: ['assessment', id], queryFn: () => api.getAssessment(token, id), enabled: !!id })

  const updateAssessment = useMutation({
    mutationFn: (payload: Partial<Omit<Assessment, 'id' | '_id'>>) => api.updateAssessment(token, id, payload),
    onSuccess: () => { toast.success('Assessment updated'); assessQ.refetch() },
    onError: (e: any) => toast.error(String(e?.message || 'Update failed')),
  })

  const addItem = useMutation({
    mutationFn: (payload: { text: string; category?: string; severity: RiskSeverity }) => api.addAssessmentItem(token, id, payload),
    onSuccess: () => { toast.success('Item added'); assessQ.refetch() },
    onError: (e: any) => toast.error(String(e?.message || 'Add item failed')),
  })

  const updateItem = useMutation({
    mutationFn: ({ itemId, patch }: { itemId: string; patch: Partial<AssessmentItem> }) => api.updateAssessmentItem(token, id, itemId, patch),
    onSuccess: () => { toast.success('Item updated'); assessQ.refetch() },
    onError: (e: any) => toast.error(String(e?.message || 'Update item failed')),
  })

  function onAddItem(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const text = String(fd.get('text') || '')
    const category = String(fd.get('category') || '') || undefined
    const severity = (String(fd.get('severity') || 'Medium') as RiskSeverity)
    if (!text) return
    addItem.mutate({ text, category, severity })
    e.currentTarget.reset()
  }

  function setStatus(s: AssessmentStatus) {
    updateAssessment.mutate({ status: s })
  }

  const a = assessQ.data
  if (assessQ.isFetching && !a) return <div className="text-muted">Loading…</div>
  if (assessQ.error) return <div className="text-danger">{String((assessQ.error as any)?.message || 'Failed to load')}</div>
  if (!a) return null

  const total = (a.items || []).length
  const yes = (a.items || []).filter(i => i.response === 'Yes').length
  const no = (a.items || []).filter(i => i.response === 'No').length
  const na = (a.items || []).filter(i => i.response === 'N/A').length

  const canComplete = total > 0 && (a.items || []).every(i => i.response !== 'N/A')

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <div className="page-header">
        <div>
          <div className="page-header__title">{a.name}</div>
          <div style={{ color: 'var(--accent-soft)' }}>Owner: {a.owner} {a.framework ? `• ${a.framework}` : ''} {a.dueDate ? `• Due ${new Date(a.dueDate).toLocaleDateString()}` : ''}</div>
        </div>
        <div className="page-header__actions">
          <span className="chip">{a.status}</span>
          {a.status !== 'Draft' && <button className="btn" onClick={() => setStatus('Draft')}>Mark Draft</button>}
          {a.status !== 'In Progress' && <button className="btn" onClick={() => setStatus('In Progress')}>Start</button>}
          {a.status !== 'Completed' && canComplete && <button className="btn" onClick={() => setStatus('Completed')}>Complete</button>}
        </div>
      </div>

      <div className="text-muted" style={{ display: 'flex', gap: 12 }}>
        <div>Questions: {total}</div>
        <div>Yes: {yes}</div>
        <div>No: {no}</div>
        <div>N/A: {na}</div>
      </div>

      {/* Items */}
      <section className="card">
        <div style={{ fontWeight: 600, marginBottom: 8 }}>Checklist Items</div>
        <div style={{ display: 'grid', gap: 8 }}>
          {(a.items || []).map(it => (
            <div key={it.id as any} style={{ border: '1px solid var(--border)', borderRadius: 8, padding: 10 }}>
              <div style={{ display: 'grid', gap: 6 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: 600 }}>{it.text}</div>
                    <div className="text-muted">{it.category || ''}</div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <select value={it.response} onChange={e => updateItem.mutate({ itemId: (it as any)._id || (it as any).id, patch: { response: e.target.value as ItemResponse } })}>
                      <option>Yes</option>
                      <option>No</option>
                      <option>N/A</option>
                    </select>
                    <select value={it.severity} onChange={e => updateItem.mutate({ itemId: (it as any)._id || (it as any).id, patch: { severity: e.target.value as RiskSeverity } })}>
                      <option>Low</option>
                      <option>Medium</option>
                      <option>High</option>
                    </select>
                  </div>
                </div>
                <div style={{ display: 'grid', gap: 6 }}>
                  <input placeholder="Notes" defaultValue={it.notes || ''} onBlur={e => updateItem.mutate({ itemId: (it as any)._id || (it as any).id, patch: { notes: e.target.value } })} />
                  <input placeholder="Evidence URLs (comma separated)" defaultValue={(it.evidenceUrls || []).join(', ')} onBlur={e => updateItem.mutate({ itemId: (it as any)._id || (it as any).id, patch: { evidenceUrls: e.target.value.split(',').map(s => s.trim()).filter(Boolean) } })} />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Add item */}
        <form onSubmit={onAddItem} style={{ display: 'grid', gap: 8, marginTop: 12 }}>
          <div style={{ fontWeight: 600 }}>Add checklist item</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <input name="text" placeholder="Question text" required />
            <input name="category" placeholder="Category (optional)" />
            <select name="severity" defaultValue="Medium">
              <option>Low</option>
              <option>Medium</option>
              <option>High</option>
            </select>
            <button type="submit" className="btn btn--primary" disabled={addItem.isPending}>Add</button>
          </div>
        </form>
      </section>
    </div>
  )
}
