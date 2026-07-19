import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { api } from '../api'
import { downloadBlob } from '../utils/download'

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
  const riskScoresQ = useQuery({
    queryKey: ['dashboard-risk'],
    queryFn: () => api.listRiskScores(token),
  })
  const overallRiskQ = useQuery({
    queryKey: ['dashboard-overall-risk'],
    queryFn: () => api.getOverallRiskScore(token),
  })

  const items = data?.items ?? []
  const total = items.length
  const approved = useMemo(() => items.filter(p => p.status === 'Approved').length, [items])
  const coverage = total ? Math.round((approved / total) * 100) : 0
  const [search, setSearch] = useState('')
  const [reportDownloading, setReportDownloading] = useState(false)
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
  const riskScores = riskScoresQ.data?.scores ?? []
  const overallRiskScore = overallRiskQ.data?.overallScore ?? 0

  const loc = useLocation()

  function navStyle(active: boolean) {
    return {
      padding: '8px 10px',
      borderRadius: 8,
      border: '1px solid var(--border)',
      background: active ? '#111827' : 'transparent',
    } as React.CSSProperties
  }

  function getRiskColor(score: number) {
    if (score >= 75) return { bg: 'rgba(16, 185, 129, 0.1)', border: 'rgba(16, 185, 129, 0.3)', text: '#10b981' }
    if (score >= 50) return { bg: 'rgba(245, 158, 11, 0.1)', border: 'rgba(245, 158, 11, 0.3)', text: '#f59e0b' }
    return { bg: 'rgba(239, 68, 68, 0.1)', border: 'rgba(239, 68, 68, 0.3)', text: '#ef4444' }
  }

  function getTrendIcon(trend: string) {
    switch (trend) {
      case 'improving': return '↑'
      case 'declining': return '↓'
      default: return '→'
    }
  }

  async function downloadReport() {
    try {
      setReportDownloading(true)
      const blob = await api.downloadComplianceReport(token)
      downloadBlob(blob, 'compliance-report.pdf')
    } catch (e: any) {
      alert(String(e?.message || 'Report download failed'))
    } finally {
      setReportDownloading(false)
    }
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
          <Link to="/soc2" style={{ textDecoration: 'none' }}>
            <div style={navStyle(loc.pathname.startsWith('/soc2'))}>SOC 2</div>
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
            <button onClick={() => void downloadReport()} disabled={reportDownloading}>
              {reportDownloading ? 'Preparing Report…' : 'Download Compliance Report'}
            </button>
            <button onClick={() => navigate('/policies/new')} style={{ background: '#059669', borderColor: '#065f46' }}>New Policy</button>
          </div>
        </div>

        {/* Overall Risk Score */}
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 8 }}>OVERALL COMPLIANCE SCORE</div>
          <div style={{ 
            fontSize: 64, 
            fontWeight: 800, 
            color: getRiskColor(overallRiskScore).text,
            marginBottom: 8
          }}>
            {overallRiskScore}
          </div>
          <div style={{ fontSize: 14, color: '#9ca3af' }}>out of 100</div>
        </div>

        {/* Risk Category Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12 }}>
          {riskScores.map((risk) => {
            const colors = getRiskColor(risk.score)
            return (
              <div 
                key={risk.category}
                className="card"
                style={{ 
                  textAlign: 'center',
                  borderColor: colors.border,
                  background: colors.bg
                }}
              >
                <div style={{ fontSize: 11, color: '#9ca3af', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {risk.category}
                </div>
                <div style={{ fontSize: 32, fontWeight: 700, color: colors.text, marginBottom: 4 }}>
                  {risk.score}
                </div>
                <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 8 }}>
                  / 100
                </div>
                <div style={{ fontSize: 18, color: colors.text }}>
                  {getTrendIcon(risk.trend)}
                </div>
              </div>
            )
          })}
        </div>

        {/* CSS Bar Chart */}
        <div className="card">
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>Risk Scores by Category</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {riskScores.map((risk) => {
              const colors = getRiskColor(risk.score)
              return (
                <div key={risk.category} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 140, fontSize: 13, color: '#9ca3af' }}>{risk.category}</div>
                  <div style={{ flex: 1, height: 24, background: '#1a2332', borderRadius: 4, overflow: 'hidden' }}>
                    <div 
                      style={{ 
                        height: '100%', 
                        width: `${risk.score}%`, 
                        background: colors.text,
                        transition: 'width 0.3s ease'
                      }}
                    />
                  </div>
                  <div style={{ width: 80, textAlign: 'right', fontSize: 14, fontWeight: 600, color: colors.text }}>
                    {risk.score} {getTrendIcon(risk.trend)}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Metrics cards */}
        {isFetching || auditsQ.isFetching ? (
          <div style={{ color: '#94a3b8' }}>Loading metrics…</div>
        ) : error ? (
          <div style={{ color: '#fca5a5' }}>{String((error as any)?.message || 'Failed to load')}</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0,1fr))', gap: 16 }}>
            <div style={{ border: '1px solid var(--border)', borderRadius: 10, padding: 12, background: '#111827' }}>
              <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 6 }}>OPEN ISSUES</div>
              <div style={{ fontSize: 28, fontWeight: 800 }}>{openFindings}</div>
              <div style={{ color: '#94a3b8' }}>Open findings</div>
            </div>
            <div style={{ border: '1px solid var(--border)', borderRadius: 10, padding: 12, background: '#111827' }}>
              <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 6 }}>POLICY COVERAGE</div>
              <div style={{ fontSize: 28, fontWeight: 800 }}>{coverage}%</div>
              <div style={{ color: '#94a3b8' }}>Target 95%</div>
            </div>
            <div style={{ border: '1px solid var(--border)', borderRadius: 10, padding: 12, background: '#111827' }}>
              <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 6 }}>UPCOMING AUDITS</div>
              <div style={{ fontSize: 22, fontWeight: 700 }}>{upcoming.count}</div>
              <div style={{ color: '#94a3b8' }}>Next: {upcoming.next}</div>
            </div>
            <div style={{ border: '1px solid var(--border)', borderRadius: 10, padding: 12, background: '#111827' }}>
              <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 6 }}>ASSESSMENTS</div>
              <div style={{ fontSize: 28, fontWeight: 800 }}>{completedAssessments}/{totalAssessments}</div>
              <div style={{ color: '#94a3b8' }}>Completed assessments</div>
            </div>
          </div>
        )}
      </section>
    </div>
  )
}
