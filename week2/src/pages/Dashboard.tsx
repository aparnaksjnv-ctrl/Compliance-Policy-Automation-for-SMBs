import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { api } from '../api'

export function Dashboard({ token }: { token: string }) {
  const navigate = useNavigate()
  const { data, isFetching, error } = useQuery({
    queryKey: ['dashboard-policies'],
    queryFn: () => api.listPolicies(token),
  })
  const auditsQ = useQuery({
    queryKey: ['dashboard-audits'],
    queryFn: () => api.listAudits(token),
  })
  const assessmentsQ = useQuery({
    queryKey: ['dashboard-assessments'],
    queryFn: () => api.listAssessments(token),
  })

  const items = data?.items ?? []
  const total = items.length
  const approved = useMemo(() => items.filter(p => p.status === 'Approved').length, [items])
  const coverage = total ? Math.round((approved / total) * 100) : 0
  const [search, setSearch] = useState('')
  const audits = auditsQ.data?.items ?? []
  const openFindings = useMemo(() => audits.reduce((acc, a) => acc + ((a.findings || []).filter(f => f.status === 'Open').length), 0), [audits])
  const upcoming = useMemo(() => {
    const now = Date.now()
    const soon = now + 30 * 86400000
    const upcomingAudits = audits.filter(a => a.dueDate && (() => { const t = new Date(a.dueDate!).getTime(); return t >= now && t <= soon })())
    const nextTs = upcomingAudits
      .map(a => new Date(a.dueDate!).getTime())
      .sort((a,b) => a-b)[0]
    return { count: upcomingAudits.length, next: nextTs ? new Date(nextTs).toLocaleDateString() : '—' }
  }, [audits])
  const assessments = assessmentsQ.data?.items ?? []
  const completedAssessments = useMemo(() => assessments.filter(a => a.status === 'Completed').length, [assessments])
  const totalAssessments = assessments.length

  const loc = useLocation()

  function navStyle(active: boolean) {
    return {
      padding: '8px 10px',
      borderRadius: 8,
      border: '1px solid var(--border)',
      background: active ? '#111827' : 'transparent',
    } as React.CSSProperties
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: 16 }}>
      {/* Sidebar */}
      <aside style={{ background: '#0b1220', border: '1px solid var(--border)', borderRadius: 10, padding: 10, height: 'fit-content' }}>
        <div style={{ fontWeight: 700, marginBottom: 8 }}>CPA for SMBs</div>
        <nav style={{ display: 'grid', gap: 6 }}>
          <Link to="/" style={{ textDecoration: 'none' }}>
            <div style={navStyle(loc.pathname === '/' )}>Dashboard</div>
          </Link>
          <Link to="/policies" style={{ textDecoration: 'none' }}>
            <div style={navStyle(loc.pathname.startsWith('/policies'))}>Policies</div>
          </Link>
          <Link to="/audits" style={{ textDecoration: 'none' }}>
            <div style={navStyle(loc.pathname.startsWith('/audits'))}>Audits</div>
          </Link>
          <Link to="/assessments" style={{ textDecoration: 'none' }}>
            <div style={navStyle(loc.pathname.startsWith('/assessments'))}>Assessments</div>
          </Link>
          <Link to="/vendors" style={{ textDecoration: 'none' }}>
            <div style={navStyle(loc.pathname.startsWith('/vendors'))}>Vendors</div>
          </Link>
          <Link to="/settings" style={{ textDecoration: 'none' }}>
            <div style={navStyle(loc.pathname.startsWith('/settings'))}>Settings</div>
          </Link>
        </nav>
      </aside>

      {/* Main content */}
      <section style={{ display: 'grid', gap: 16 }}>
        {/* Top row: title + search + actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, justifyContent: 'space-between' }}>
          <div style={{ fontWeight: 700 }}>Compliance & Policy Automation — Dashboard</div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input
              placeholder="Search policies..."
              style={{ minWidth: 260 }}
              value={search}
              onChange={e => setSearch(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') navigate({ pathname: '/policies', search: search ? `?q=${encodeURIComponent(search)}` : '' }) }}
            />
            <button onClick={() => navigate({ pathname: '/policies', search: search ? `?q=${encodeURIComponent(search)}` : '' })}>Search</button>
            <button onClick={() => navigate('/policies/new')} style={{ background: '#059669', borderColor: '#065f46' }}>New Policy</button>
          </div>
        </div>

        {/* Metrics cards */}
        {isFetching || auditsQ.isFetching ? (
          <div style={{ color: '#94a3b8' }}>Loading metrics…</div>
        ) : error ? (
          <div style={{ color: '#fca5a5' }}>{String((error as any)?.message || 'Failed to load')}</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0,1fr))', gap: 16 }}>
            <div className="card">
              <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 6 }}>OPEN ISSUES</div>
              <div style={{ fontSize: 28, fontWeight: 800 }}>{openFindings}</div>
              <div style={{ color: '#94a3b8' }}>Open findings</div>
            </div>
            <div className="card">
              <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 6 }}>POLICY COVERAGE</div>
              <div style={{ fontSize: 28, fontWeight: 800 }}>{coverage}%</div>
              <div style={{ color: '#94a3b8' }}>Target 95%</div>
            </div>
            <div className="card">
              <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 6 }}>UPCOMING AUDITS</div>
              <div style={{ fontSize: 22, fontWeight: 700 }}>{upcoming.count}</div>
              <div style={{ color: '#94a3b8' }}>Next: {upcoming.next}</div>
            </div>
            <div className="card">
              <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 6 }}>ASSESSMENTS</div>
              <div style={{ fontSize: 28, fontWeight: 800 }}>{completedAssessments}/{totalAssessments}</div>
              <div style={{ color: '#94a3b8' }}>Completed assessments</div>
            </div>
          </div>
        )}

        {/* Quick actions */}
        <div className="card" style={{ display: 'flex', gap: 8, alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontWeight: 600 }}>Quick Actions</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button className="btn" onClick={() => navigate('/policies/new')}>New Policy</button>
            <button className="btn" onClick={() => navigate('/audits')}>View Audits</button>
            <button className="btn" onClick={() => navigate('/assessments')}>View Assessments</button>
            <button className="btn" onClick={() => navigate('/vendors')}>Vendors</button>
            <button className="btn" onClick={() => navigate('/settings')}>Settings</button>
          </div>
        </div>
      </section>
    </div>
  )
}
