import { useState } from 'react'
import { Sidebar } from './components/Sidebar'
import { Topbar } from './components/Topbar'
import { Dashboard } from './pages/Dashboard'

export default function App() {
  const [route, setRoute] = useState<'dashboard' | 'policies' | 'audits'>('dashboard')

  return (
    <div className="app">
      <Sidebar active={route} onNavigate={setRoute} />
      <main className="content">
        <Topbar title={
          route === 'dashboard' ? 'Compliance & Policy Dashboard' :
          route === 'policies' ? 'Policies' :
          'Audits'
        } />
        <div className="page">
          {route === 'dashboard' && <Dashboard />}
          {route === 'policies' && <div className="card">Policies list coming soon…</div>}
          {route === 'audits' && <div className="card">Audit schedule coming soon…</div>}
        </div>
      </main>
    </div>
  )
}
