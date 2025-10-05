import { useMemo, useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { api, Policy, PolicyStatus } from '../api'

export function Policies({ token }: { token: string }) {
  const [q, setQ] = useState('')
  const [status, setStatus] = useState<'All' | PolicyStatus>('All')

  const { data, refetch, isFetching, error } = useQuery({
    queryKey: ['policies', q, status],
    queryFn: () => api.listPolicies(token, { q, status }),
  })

  const create = useMutation({
    mutationFn: (payload: Omit<Policy, 'id' | '_id'>) => api.createPolicy(token, payload),
    onSuccess: () => refetch(),
  })

  const del = useMutation({
    mutationFn: (id: string) => api.deletePolicy(token, id),
    onSuccess: () => refetch(),
  })

  const items = data?.items || []

  function onCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const name = String(fd.get('name') || '')
    const owner = String(fd.get('owner') || '')
    const s = (String(fd.get('status') || 'Draft') as PolicyStatus)
    if (!name || !owner) return
    create.mutate({ name, owner, status: s })
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
          <button type="submit" disabled={create.isPending}>Create</button>
        </div>
      </form>

      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ textAlign: 'left' }}>
            <th style={{ padding: '8px 6px', borderBottom: '1px solid #1f2937' }}>Name</th>
            <th style={{ padding: '8px 6px', borderBottom: '1px solid #1f2937' }}>Owner</th>
            <th style={{ padding: '8px 6px', borderBottom: '1px solid #1f2937' }}>Status</th>
            <th style={{ padding: '8px 6px', borderBottom: '1px solid #1f2937' }}></th>
          </tr>
        </thead>
        <tbody>
          {items.map(p => (
            <tr key={p.id || p._id}>
              <td style={{ padding: '8px 6px', borderBottom: '1px solid #1f2937' }}><Link to={`/policies/${p.id || p._id}`}>{p.name}</Link></td>
              <td style={{ padding: '8px 6px', borderBottom: '1px solid #1f2937' }}>{p.owner}</td>
              <td style={{ padding: '8px 6px', borderBottom: '1px solid #1f2937' }}>{p.status}</td>
              <td style={{ padding: '8px 6px', borderBottom: '1px solid #1f2937' }}>
                <button onClick={() => del.mutate(p.id || p._id!)} disabled={del.isPending}>Delete</button>
              </td>
            </tr>
          ))}
          {items.length === 0 && (
            <tr>
              <td colSpan={4} style={{ padding: '12px 6px', color: '#94a3b8' }}>No policies yet</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
