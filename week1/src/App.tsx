import { useMemo, useState } from 'react'
import { Sidebar } from './components/Sidebar'
import { Topbar } from './components/Topbar'
import { Dashboard } from './pages/Dashboard'
import { Auth } from './pages/Auth'
import { CompanyForm } from './pages/CompanyForm'
import { Routes, Route, useLocation, Navigate } from 'react-router-dom'
import { Policies } from './pages/Policies'
import { Audits } from './pages/Audits'
import { Settings } from './pages/Settings'

export default function App() {
  const [token, setToken] = useState<string | null>(() => {
    try { return localStorage.getItem('token') } catch { return null }
  })
  const location = useLocation()

  function handleAuthed(t: string) {
    setToken(t)
    try { localStorage.setItem('token', t) } catch {}
  }

  function signOut() {
    setToken(null)
    try { localStorage.removeItem('token') } catch {}
  }

  const title = useMemo(() => {
    const path = location.pathname
    if (path.startsWith('/policies')) return 'Policies'
    if (path.startsWith('/audits')) return 'Audits'
    if (path.startsWith('/settings')) return 'Settings'
    return 'Compliance & Policy Dashboard'
  }, [location.pathname])

  return (
    <div className="app">
      <Sidebar />
      <main className="content">
        <Topbar authed={!!token} onSignOut={signOut} title={title} />
        <div className="page">
          <Routes>
            <Route path="/" element={
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
            } />
            <Route path="/policies" element={<Policies />} />
            <Route path="/audits" element={<Audits />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </main>
    </div>
  )
}
