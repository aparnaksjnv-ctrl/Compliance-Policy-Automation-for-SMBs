import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api, type Activity, type EntityType, type ActivityAction, type BillingStatus } from '../api'

export function Settings({ token }: { token: string }) {
  const [entityType, setEntityType] = useState<EntityType | ''>('')
  const [action, setAction] = useState<ActivityAction | ''>('')
  const [entityId, setEntityId] = useState('')
  const [limit, setLimit] = useState(200)

  const q = useQuery<{ items: Activity[] }>({
    queryKey: ['activities', entityType, action, entityId, limit],
    queryFn: () => api.listActivities(token, {
      entityType: entityType || undefined,
      action: action || undefined,
      entityId: entityId || undefined,
      limit,
    }),
  })

  const billingQ = useQuery<BillingStatus>({
    queryKey: ['billing-status'],
    queryFn: () => api.getBillingStatus(token),
  })

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <div style={{ fontWeight: 700, marginBottom: 4 }}>Settings</div>

      <section style={{ border: '1px solid var(--border)', background: '#111827', padding: 12, borderRadius: 10 }}>
        <div style={{ fontWeight: 600, marginBottom: 8 }}>Billing</div>
        {billingQ.isFetching ? <div style={{ color: '#94a3b8' }}>Loading…</div> : (
          <div style={{ display: 'grid', gap: 8 }}>
            <div>Status: <b>{billingQ.data?.status || 'none'}</b></div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button onClick={async () => { try { const r = await api.createCheckout(token); window.location.href = r.url } catch (e: any) { alert(String(e?.message || 'Checkout failed')) } }}>Start/Manage Subscription</button>
              <button onClick={async () => { try { const r = await api.openBillingPortal(token); window.location.href = r.url } catch (e: any) { alert(String(e?.message || 'Portal failed')) } }}>Open Billing Portal</button>
              <button onClick={() => billingQ.refetch()} disabled={billingQ.isFetching}>Refresh</button>
            </div>
          </div>
        )}
      </section>

      <section style={{ border: '1px solid var(--border)', background: '#111827', padding: 12, borderRadius: 10 }}>
        <div style={{ fontWeight: 600, marginBottom: 8 }}>Audit Logs</div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
          <select value={entityType} onChange={e => setEntityType(e.target.value as EntityType | '')}>
            <option value="">All Entities</option>
            <option>Policy</option>
            <option>Audit</option>
            <option>Assessment</option>
            <option>Vendor</option>
          </select>
          <select value={action} onChange={e => setAction(e.target.value as ActivityAction | '')}>
            <option value="">All Actions</option>
            <option value="create">create</option>
            <option value="update">update</option>
            <option value="delete">delete</option>
            <option value="status_change">status_change</option>
            <option value="export">export</option>
            <option value="generate">generate</option>
          </select>
          <input placeholder="Entity ID (optional)" value={entityId} onChange={e => setEntityId(e.target.value)} />
          <input type="number" min={10} max={500} value={limit} onChange={e => setLimit(Math.max(10, Math.min(500, Number(e.target.value||200))))} />
          <button type="button" onClick={() => q.refetch()} disabled={q.isFetching}>Refresh</button>
        </div>

        {q.isFetching && <div style={{ color: '#94a3b8' }}>Loading…</div>}
        {q.error && <div style={{ color: '#fca5a5' }}>{String((q.error as any)?.message || 'Failed to load')}</div>}
        {!q.isFetching && !q.error && (
          <div style={{ display: 'grid', gap: 6 }}>
            {(q.data?.items || []).map((it, idx) => (
              <div key={idx} style={{ display: 'grid', gridTemplateColumns: '200px 110px 110px 1fr', gap: 8, alignItems: 'center', border: '1px solid var(--border)', borderRadius: 8, padding: 8 }}>
                <div style={{ color: '#9ca3af' }}>{new Date(it.createdAt).toLocaleString()}</div>
                <div>{it.entityType}</div>
                <div>{it.action}</div>
                <div style={{ color: '#94a3b8' }}>
                  <span style={{ color: '#e5e7eb' }}>ID:</span> {String(it.entityId)}
                  {it.metadata ? <>
                    {' '}• <span style={{ color: '#e5e7eb' }}>Meta:</span> {JSON.stringify(it.metadata).slice(0, 160)}
                    {JSON.stringify(it.metadata).length > 160 ? '…' : ''}
                  </> : null}
                </div>
              </div>
            ))}
            {(q.data?.items || []).length === 0 && <div style={{ color: '#94a3b8' }}>No activity yet.</div>}
          </div>
        )}
      </section>
    </div>
  )
}
