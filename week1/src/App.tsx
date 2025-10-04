import { useState } from 'react'
import { Sidebar } from './components/Sidebar'
import { Topbar } from './components/Topbar'
import { Dashboard } from './pages/Dashboard'
import { Auth } from './pages/Auth'
import { CompanyForm } from './pages/CompanyForm'

export default function App() {
  const [route, setRoute] = useState<'dashboard' | 'policies' | 'audits'>('dashboard')
  const [token, setToken] = useState<string | null>(() => {
    try { return localStorage.getItem('token') } catch { return null }
  })

  function handleAuthed(t: string) {
    setToken(t)
    try { localStorage.setItem('token', t) } catch {}
  }

  function signOut() {
    setToken(null)
    try { localStorage.removeItem('token') } catch {}
  }

  return (
    <div className="app">
      <Sidebar active={route} onNavigate={setRoute} />
      <main className="content">
        <Topbar authed={!!token} onSignOut={signOut} title={
          route === 'dashboard' ? 'Compliance & Policy Dashboard' :
          route === 'policies' ? 'Policies' :
          'Audits'
        } />
        <div className="page">
          {route === 'dashboard' && (
            <>
              <Dashboard />
              <div style={{ marginTop: 12 }}>
                {token ? (
                  <CompanyForm token={token} />
                ) : (
                  <Auth onAuth={handleAuthed} />
                )}
              </div>
            </>
          )}
          {route === 'policies' && <div className="card">Policies list coming soon…</div>}
          {route === 'audits' && <div className="card">Audit schedule coming soon…</div>}
        </div>
      </main>
    </div>
  )
}
