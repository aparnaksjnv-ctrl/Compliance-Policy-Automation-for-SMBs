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
    return { count: upcomingAudits.length, next: nextTs ? new Date(nextTs).toLocaleDateString() : '-' }
  }, [audits])
  const assessments = assessmentsQ.data?.items ?? []
  const completedAssessments = useMemo(() => assessments.filter(a => a.status === 'Completed').length, [assessments])
  const totalAssessments = assessments.length
  const riskScores = riskScoresQ.data?.scores ?? []
  const overallRiskScore = overallRiskQ.data?.overallScore ?? 0

  const loc = useLocation()

  function getRiskColor(score: number) {
    if (score >= 75) return { bg: 'rgba(16, 185, 129, 0.1)', border: 'rgba(16, 185, 129, 0.3)', text: '#10b981' }
    if (score >= 50) return { bg: 'rgba(245, 158, 11, 0.1)', border: 'rgba(245, 158, 11, 0.3)', text: '#f59e0b' }
    return { bg: 'rgba(239, 68, 68, 0.1)', border: 'rgba(239, 68, 68, 0.3)', text: '#ef4444' }
  }

  function getTrendIcon(trend: string) {
    switch (trend) {
      case 'improving': return String.fromCharCode(8593)
      case 'declining': return String.fromCharCode(8595)
      default: return String.fromCharCode(8594)
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
      <aside className="sidebar" style={{ height: 'fit-content' }}>
        <div className="sidebar-title">CPA for SMBs</div>
        <nav style={{ display: 'grid', gap: 4 }}>
          <Link to="/" className={`sidebar-link ${loc.pathname === '/' ? 'sidebar-link--active' : ''}`}>Dashboard</Link>
          <Link to="/policies" className={`sidebar-link ${loc.pathname.startsWith('/policies') ? 'sidebar-link--active' : ''}`}>Policies</Link>
          <Link to="/audits" className={`sidebar-link ${loc.pathname.startsWith('/audits') ? 'sidebar-link--active' : ''}`}>Audits</Link>
          <Link to="/assessments" className={`sidebar-link ${loc.pathname.startsWith('/assessments') ? 'sidebar-link--active' : ''}`}>Assessments</Link>
          <Link to="/vendors" className={`sidebar-link ${loc.pathname.startsWith('/vendors') ? 'sidebar-link--active' : ''}`}>Vendors</Link>
          <Link to="/soc2" className={`sidebar-link ${loc.pathname.startsWith('/soc2') ? 'sidebar-link--active' : ''}`}>SOC 2</Link>
          <Link to="/settings" className={`sidebar-link ${loc.pathname.startsWith('/settings') ? 'sidebar-link--active' : ''}`}>Settings</Link>
        </nav>
      </aside>

      {/* Main content */}
      <section style={{ display: 'grid', gap: 16 }}>
        {/* Top row: title + search + actions */}
        <div className="page-header">
          <h1>Compliance &amp; Policy Automation - Dashboard</h1>
          <div className="page-header-actions">
            <input
              placeholder="Search policies..."
              style={{ minWidth: 260 }}
              value={search}
              onChange={e => setSearch(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') navigate({ pathname: '/policies', search: search ? `?q=${encodeURIComponent(search)}` : '' }) }}
            />
            <button className="btn" onClick={() => navigate({ pathname: '/policies', search: search ? `?q=${encodeURIComponent(search)}` : '' })}>Search</button>
            <button className="btn" onClick={() => void downloadReport()} disabled={reportDownloading}>
              {reportDownloading ? 'Preparing Report...' : 'Download Compliance Report'}
            </button>
            <button className="btn btn--primary" onClick={() => navigate('/policies/new')}>New Policy</button>
          </div>
        </div>

        {/* Overall Risk Score */}
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 8 }}>OVERALL COMPLIANCE SCORE</div>
          <div style={{
            fontSize: 64,
            fontWeight: 800,
            color: getRiskColor(overallRiskScore).text,
            marginBottom: 8
          }}>
            {overallRiskScore}
          </div>
          <div style={{ fontSize: 14, color: 'var(--text-secondary)' }}>out of 100</div>
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
                <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {risk.category}
                </div>
                <div style={{ fontSize: 32, fontWeight: 700, color: colors.text, marginBottom: 4 }}>
                  {risk.score}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 8 }}>
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
                  <div style={{ width: 140, fontSize: 13, color: 'var(--text-secondary)' }}>{risk.category}</div>
                  <div style={{ flex: 1, height: 24, background: 'var(--bg-surface)', borderRadius: 4, overflow: 'hidden' }}>
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
          <div style={{ color: 'var(--text-secondary)' }}>Loading metrics...</div>
        ) : error ? (
          <div style={{ color: '#fca5a5' }}>{String((error as any)?.message || 'Failed to load')}</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0,1fr))', gap: 16 }}>
            <div className="stat-tile">
              <div className="stat-tile-label">Open Issues</div>
              <div className="stat-tile-value">{openFindings}</div>
              <div className="stat-tile-sub">Open findings</div>
            </div>
            <div className="stat-tile">
              <div className="stat-tile-label">Policy Coverage</div>
              <div className="stat-tile-value">{coverage}%</div>
              <div className="stat-tile-sub">Target 95%</div>
            </div>
            <div className="stat-tile">
              <div className="stat-tile-label">Upcoming Audits</div>
              <div className="stat-tile-value" style={{ fontSize: 22 }}>{upcoming.count}</div>
              <div className="stat-tile-sub">Next: {upcoming.next}</div>
            </div>
            <div className="stat-tile">
              <div className="stat-tile-label">Assessments</div>
              <div className="stat-tile-value">{completedAssessments}/{totalAssessments}</div>
              <div className="stat-tile-sub">Completed assessments</div>
            </div>
          </div>
        )}
      </section>
    </div>
  )
}