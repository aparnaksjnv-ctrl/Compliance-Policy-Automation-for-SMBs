import { Card } from '../components/Card'
import { CoverageChart } from '../components/CoverageChart'
import { AuditTimeline } from '../components/AuditTimeline'

export function Dashboard() {
  return (
    <div className="grid">
      <Card title="Open Issues" value="12" hint="Needs review" />
      <Card title="Policy Coverage" value="87%" hint="Target 95%" />
      <Card title="Upcoming Audits" value="3" hint="Next: Oct 15" />
      <div className="card span-2">
        <div className="card-title">Coverage Trend</div>
        <CoverageChart />
      </div>
      <div className="card span-2">
        <div className="card-title">Audit Timeline</div>
        <AuditTimeline />
      </div>
      <div className="card span-2">
        <div className="card-title">Recent Activity</div>
        <ul className="list">
          <li>Updated SOC2 policy</li>
          <li>Added HIPAA training checklist</li>
          <li>Assigned audit tasks to team</li>
        </ul>
      </div>
    </div>
  )
}
