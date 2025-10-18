import { useEffect, useMemo, useRef, useState } from 'react'
import { api, Vendor, RiskLevel, ComplianceStatus } from '../api'

function DownloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

export function Vendors({ token }: { token: string }) {
  const [q, setQ] = useState('')
  const [risk, setRisk] = useState<'All' | RiskLevel>('All')
  const [status, setStatus] = useState<'All' | ComplianceStatus>('All')
  const [framework, setFramework] = useState('')
  const [rows, setRows] = useState<Vendor[]>([])
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState<string>('')

  // Add/Edit modal state
  const [editing, setEditing] = useState<Vendor | null>(null)
  const [form, setForm] = useState<Partial<Vendor>>({})
  const fileRef = useRef<HTMLInputElement | null>(null)

  async function refresh() {
    setLoading(true); setErr('')
    try {
      const res = await api.listVendors(token, { q, risk, status, framework })
      setRows(res.items)
    } catch (e: any) {
      setErr(String(e?.message || 'Failed to load'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void refresh() }, [])

  async function onSave() {
    try {
      const payload = {
        name: form.name?.trim() || '',
        serviceType: form.serviceType?.trim() || undefined,
        standards: (form.standards || []) as string[],
        riskLevel: form.riskLevel as RiskLevel | undefined,
        status: form.status as ComplianceStatus | undefined,
        lastAuditDate: form.lastAuditDate || undefined,
        notes: form.notes || undefined,
      }
      if (editing) {
        await api.updateVendor(token, editing.id, payload)
      } else {
        await api.createVendor(token, payload as any)
      }
      setEditing(null); setForm({});
      await refresh()
    } catch (e: any) { alert(String(e?.message || 'Save failed')) }
  }

  async function onDelete(v: Vendor) {
    if (!confirm(`Delete vendor: ${v.name}?`)) return
    try { await api.deleteVendor(token, v.id); await refresh() } catch (e: any) { alert(String(e?.message || 'Delete failed')) }
  }

  async function onUploadCSV(file: File) {
    try {
      const res = await api.uploadVendorsCSV(token, file)
      alert(`Import complete. Created: ${res.created}, Updated: ${res.updated}, Failed: ${res.failed}`)
      await refresh()
    } catch (e: any) { alert(String(e?.message || 'Import failed')) }
  }

  async function onExportCSV() {
    try { const blob = await api.exportVendorsCSV(token); DownloadBlob(blob, 'vendors.csv') } catch (e: any) { alert(String(e?.message || 'Export failed')) }
  }

  async function onDownloadTemplate() {
    try { const blob = await api.exportVendorsTemplate(token); DownloadBlob(blob, 'vendors-template.csv') } catch (e: any) { alert(String(e?.message || 'Template download failed')) }
  }

  function openCreate() { setEditing(null); setForm({ name: '', standards: [] }) }
  function openEdit(v: Vendor) { setEditing(v); setForm({ ...v }) }

  const filtered = useMemo(() => rows, [rows])

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <input placeholder="Search vendors..." value={q} onChange={e => setQ(e.target.value)} style={{ minWidth: 220 }} />
          <select value={risk} onChange={e => setRisk(e.target.value as any)}>
            <option>All</option><option>Low</option><option>Medium</option><option>High</option>
          </select>
          <select value={status} onChange={e => setStatus(e.target.value as any)}>
            <option>All</option><option>Compliant</option><option>Pending</option><option>Not Compliant</option>
          </select>
          <input placeholder="Framework (e.g., GDPR)" value={framework} onChange={e => setFramework(e.target.value)} style={{ width: 160 }} />
          <button onClick={() => refresh()}>Filter</button>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn" onClick={openCreate}>Add Vendor</button>
          <input ref={fileRef} type="file" accept=".csv,text/csv" style={{ display: 'none' }} onChange={e => { const f = e.target.files?.[0]; if (f) { void onUploadCSV(f); (e.target as HTMLInputElement).value = '' } }} />
          <button className="btn" onClick={() => fileRef.current?.click()}>Upload CSV</button>
          <button className="btn" onClick={() => void onDownloadTemplate()}>Download Template</button>
          <button className="btn" onClick={() => void onExportCSV()}>Download CSV</button>
        </div>
      </div>

      {loading ? <div style={{ color: '#94a3b8' }}>Loading…</div> : err ? <div style={{ color: '#fca5a5' }}>{err}</div> : (
        <table className="table">
          <thead>
            <tr>
              <th>Vendor Name</th>
              <th>Service Type</th>
              <th>Compliance Standards</th>
              <th>Risk Level</th>
              <th>Status</th>
              <th>Last Audit Date</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(v => (
              <tr key={v.id}>
                <td>{v.name}</td>
                <td>{v.serviceType || '—'}</td>
                <td>
                  {(v.standards && v.standards.length) ? (
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {v.standards.map(s => (
                        <span key={s} style={{ padding: '2px 6px', borderRadius: 999, border: '1px solid var(--border)', background: '#0b1220' }}>{s}</span>
                      ))}
                    </div>
                  ) : '—'}
                </td>
                <td>{v.riskLevel || '—'}</td>
                <td>{v.status || '—'}</td>
                <td>{v.lastAuditDate || '—'}</td>
                <td style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                  <button onClick={() => openEdit(v)}>Edit</button>
                  <button onClick={() => void onDelete(v)} style={{ background: '#7f1d1d', borderColor: '#7f1d1d' }}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Modal */}
      {(editing !== undefined) && (editing === null || editing) && (
        <div style={{ border: '1px solid var(--border)', borderRadius: 10, padding: 12, background: '#0b1220' }}>
          <div style={{ fontWeight: 700, marginBottom: 8 }}>{editing ? 'Edit Vendor' : 'Add Vendor'}</div>
          <div style={{ display: 'grid', gap: 8 }}>
            <input placeholder="Vendor Name" value={form.name || ''} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            <input placeholder="Service Type" value={form.serviceType || ''} onChange={e => setForm(f => ({ ...f, serviceType: e.target.value }))} />
            <input placeholder="Compliance Standards (semicolon separated)" value={(form.standards || []).join('; ')} onChange={e => setForm(f => ({ ...f, standards: e.target.value.split(';').map(s => s.trim()).filter(Boolean) }))} />
            <div style={{ display: 'flex', gap: 8 }}>
              <select value={(form.riskLevel as any) || ''} onChange={e => setForm(f => ({ ...f, riskLevel: e.target.value as RiskLevel }))}>
                <option value="">Risk Level</option>
                <option>Low</option><option>Medium</option><option>High</option>
              </select>
              <select value={(form.status as any) || ''} onChange={e => setForm(f => ({ ...f, status: e.target.value as ComplianceStatus }))}>
                <option value="">Status</option>
                <option>Compliant</option><option>Pending</option><option>Not Compliant</option>
              </select>
              <input placeholder="Last Audit Date (YYYY-MM-DD)" value={form.lastAuditDate || ''} onChange={e => setForm(f => ({ ...f, lastAuditDate: e.target.value }))} />
            </div>
            <textarea placeholder="Notes" value={form.notes || ''} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button onClick={() => { setEditing(null); setForm({}) }} className="btn">Cancel</button>
              <button onClick={() => void onSave()} className="btn btn--primary">Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
