import { useMemo, useState } from 'react'
import { Modal } from '../components/Modal'
import { useToast } from '../components/Toast'

type Policy = { id: string; name: string; owner: string; status: 'Draft' | 'In Review' | 'Approved' }

const SAMPLE: Policy[] = [
  { id: 'p-1', name: 'SOC 2 Security Policy', owner: 'Alex', status: 'Approved' },
  { id: 'p-2', name: 'Incident Response', owner: 'Priya', status: 'In Review' },
  { id: 'p-3', name: 'Acceptable Use', owner: 'Sam', status: 'Draft' },
]

function Chip({ status }: { status: Policy['status'] }) {
  const map = {
    'Draft': 'bg-slate-700/40 border-slate-600 text-slate-200',
    'In Review': 'bg-amber-500/15 border-amber-500/40 text-amber-200',
    'Approved': 'bg-emerald-500/15 border-emerald-500/40 text-emerald-200',
  } as const
  return (
    <span className={[
      'inline-flex items-center gap-1 rounded border px-2 py-0.5 text-xs font-medium',
      map[status],
    ].join(' ')}>{status}</span>
  )
}

export function Policies() {
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState<'All' | Policy['status']>('All')
  const [open, setOpen] = useState(false)
  const [rows, setRows] = useState<Policy[]>(SAMPLE)
  const { notify } = useToast()

  const filtered = useMemo(() => rows.filter(r => {
    const q = query.trim().toLowerCase()
    const matchesText = !q || r.name.toLowerCase().includes(q) || r.owner.toLowerCase().includes(q)
    const matchesStatus = status === 'All' || r.status === status
    return matchesText && matchesStatus
  }), [rows, query, status])

  function createPolicy(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const name = String(fd.get('name') || '').trim()
    const owner = String(fd.get('owner') || '').trim()
    const s = (String(fd.get('status') || 'Draft') as Policy['status'])
    if (!name || !owner) return
    setRows(prev => [{ id: 'p-' + (Date.now()), name, owner, status: s }, ...prev])
    setOpen(false)
    notify('Policy created', 'success')
  }

  return (
    <div className="card">
      <div className="card-title">Policies</div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <input
          className="input"
          placeholder="Search by name or owner"
          value={query}
          onChange={e => setQuery(e.target.value)}
        />
        <select className="input" value={status} onChange={e => setStatus(e.target.value as any)}>
          <option>All</option>
          <option>Draft</option>
          <option>In Review</option>
          <option>Approved</option>
        </select>
        <button className="btn primary" onClick={() => setOpen(true)}>New Policy</button>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ textAlign: 'left' }}>
              <th style={{ padding: '8px 6px', borderBottom: '1px solid #1f2937' }}>Name</th>
              <th style={{ padding: '8px 6px', borderBottom: '1px solid #1f2937' }}>Owner</th>
              <th style={{ padding: '8px 6px', borderBottom: '1px solid #1f2937' }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(r => (
              <tr key={r.id}>
                <td style={{ padding: '8px 6px', borderBottom: '1px solid #1f2937' }}>{r.name}</td>
                <td style={{ padding: '8px 6px', borderBottom: '1px solid #1f2937' }}>{r.owner}</td>
                <td style={{ padding: '8px 6px', borderBottom: '1px solid #1f2937' }}><Chip status={r.status} /></td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={3} style={{ padding: '12px 6px', color: '#94a3b8' }}>No matching policies</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="New Policy">
        <form onSubmit={createPolicy} style={{ display: 'grid', gap: 10 }}>
          <label>
            <div>Name</div>
            <input className="input" name="name" placeholder="e.g., Access Control" required />
          </label>
          <label>
            <div>Owner</div>
            <input className="input" name="owner" placeholder="e.g., Alex" required />
          </label>
          <label>
            <div>Status</div>
            <select className="input" name="status" defaultValue="Draft">
              <option>Draft</option>
              <option>In Review</option>
              <option>Approved</option>
            </select>
          </label>
          <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
            <button type="submit" className="btn primary">Create</button>
            <button type="button" className="btn" onClick={() => setOpen(false)}>Cancel</button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
