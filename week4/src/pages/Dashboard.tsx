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

  function getRiskTone(score: number) {
    if (score >= 75) return 'good'
    if (score >= 50) return 'warning'
    return 'danger'
  }

  function getRiskColorVar(score: number) {
    const tone = getRiskTone(score)
    if (tone === 'good') return 'var(--status-approved)'
    if (tone === 'warning') return 'var(--status-pending)'
    return 'var(--status-danger)'
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
    <div className="dashboard-layout">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar__title">CPA for SMBs</div>
        <nav className="sidebar__nav">
          <Link to="/" className={`sidebar-link${loc.pathname === '/' ? ' sidebar-link--active' : ''}`}>Dashboard</Link>
          <Link to="/policies" className={`sidebar-link${loc.pathname.startsWith('/policies') ? ' sidebar-link--active' : ''}`}>Policies</Link>
          <Link to="/audits" className={`sidebar-link${loc.pathname.startsWith('/audits') ? ' sidebar-link--active' : ''}`}>Audits</Link>
          <Link to="/assessments" className={`sidebar-link${loc.pathname.startsWith('/assessments') ? ' sidebar-link--active' : ''}`}>Assessments</Link>
          <Link to="/vendors" className={`sidebar-link${loc.pathname.startsWith('/vendors') ? ' sidebar-link--active' : ''}`}>Vendors</Link>
          <Link to="/soc2" className={`sidebar-link${loc.pathname.startsWith('/soc2') ? ' sidebar-link--active' : ''}`}>SOC 2</Link>
          <Link to="/settings" className={`sidebar-link${loc.pathname.startsWith('/settings') ? ' sidebar-link--active' : ''}`}>Settings</Link>
        </nav>
      </aside>

      {/* Main content */}
      <section className="page-content">
        {/* Top row: title + search + actions */}
        <div className="page-header">
          <div className="page-header__title">Compliance & Policy Automation — Dashboard</div>
          <div className="page-header__actions">
            <input
              className="search-input"
              placeholder="Search policies..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') navigate({ pathname: '/policies', search: search ? `?q=${encodeURIComponent(search)}` : '' }) }}
            />
            <button className="btn" onClick={() => navigate({ pathname: '/policies', search: search ? `?q=${encodeURIComponent(search)}` : '' })}>Search</button>
            <button className="btn" onClick={() => void downloadReport()} disabled={reportDownloading}>
              {reportDownloading ? 'Preparing Report…' : 'Download Compliance Report'}
            </button>
            <button className="btn btn--primary" onClick={() => navigate('/policies/new')}>New Policy</button>
          </div>
        </div>

        {/* Overall Risk Score */}
        <div className="card overall-score">
          <div className="stat-tile-label">Overall Compliance Score</div>
          <div className="stat-tile-value" style={{ color: getRiskColorVar(overallRiskScore) }}>{overallRiskScore}</div>
          <div className="stat-tile-sub">out of 100</div>
        </div>

        {/* Risk Category Cards */}
        <div className="risk-grid">
          {riskScores.map((risk) => (
            <div key={risk.category} className={`card risk-card risk-tone--${getRiskTone(risk.score)}`}>
              <div className="risk-card__label">{risk.category}</div>
              <div className="risk-card__value">{risk.score}</div>
              <div className="risk-card__scale">/ 100</div>
              <div className="risk-card__trend">{getTrendIcon(risk.trend)}</div>
            </div>
          ))}
        </div>

        {/* CSS Bar Chart */}
        <div className="card">
          <div className="chart-title">Risk Scores by Category</div>
          <div className="risk-chart">
            {riskScores.map((risk) => (
              <div key={risk.category} className={`risk-chart__row risk-tone--${getRiskTone(risk.score)}`}>
                <div className="risk-chart__label">{risk.category}</div>
                <div className="risk-chart__track">
                  <div className="risk-chart__bar" style={{ width: `${risk.score}%` }} />
                </div>
                <div className="risk-chart__value">{risk.score} {getTrendIcon(risk.trend)}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Metrics cards */}
        {isFetching || auditsQ.isFetching ? (
          <div className="text-muted">Loading metrics…</div>
        ) : error ? (
          <div className="text-danger">{String((error as any)?.message || 'Failed to load')}</div>
        ) : (
          <div className="metric-grid">
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
              <div className="stat-tile-value">{upcoming.count}</div>
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
