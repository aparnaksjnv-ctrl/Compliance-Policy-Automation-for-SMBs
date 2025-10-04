type Route = 'dashboard' | 'policies' | 'audits'

export function Sidebar({ active, onNavigate }: { active: Route; onNavigate: (r: Route) => void }) {
  return (
    <aside className="sidebar">
      <div className="logo">C&P</div>
      <nav>
        <button className={active === 'dashboard' ? 'active' : ''} onClick={() => onNavigate('dashboard')}>Dashboard</button>
        <button className={active === 'policies' ? 'active' : ''} onClick={() => onNavigate('policies')}>Policies</button>
        <button className={active === 'audits' ? 'active' : ''} onClick={() => onNavigate('audits')}>Audits</button>
      </nav>
    </aside>
  )
}
