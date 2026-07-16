import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { getToken, setToken, clearToken } from './lib'
import { Login } from './pages/Login'
import { Policies } from './pages/Policies'
import { PolicyDetail } from './pages/PolicyDetail'
import { NewPolicy } from './pages/NewPolicy'
import { Dashboard } from './pages/Dashboard'
import { Audits } from './pages/Audits'
import { Settings } from './pages/Settings'
import { AuditDetail } from './pages/AuditDetail'
import { Assessments } from './pages/Assessments'
import { AssessmentDetail } from './pages/AssessmentDetail'
import { Vendors } from './pages/Vendors'
import { HomeIcon, PlusIcon, LogoutIcon, SunIcon, MoonIcon } from './components/Icons'

function Protected({ authed, children }: { authed: boolean; children: JSX.Element }) {
  if (!authed) return <Navigate to="/login" replace />
  return children
}

export default function App() {
  const [token, setTok] = useState<string>(getToken())
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    try { return (localStorage.getItem('w2_theme') as 'dark' | 'light') || 'dark' } catch { return 'dark' }
  })
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => { if (token) setToken(token) }, [token])
  useEffect(() => {
    if (token && location.pathname === '/login') {
      navigate('/', { replace: true })
    }
  }, [token, location.pathname, navigate])

  useEffect(() => {
    try { localStorage.setItem('w2_theme', theme) } catch {}
  }, [theme])

  // Apply theme class to body for global CSS variable overrides
  useEffect(() => {
    try { document.body.classList.toggle('theme-light', theme === 'light') } catch {}
  }, [theme])

  // Button ripple handler
  useEffect(() => {
    function onDown(e: PointerEvent) {
      const t = e.target as HTMLElement
      const btn = t.closest('button') as HTMLElement | null
      if (!btn) return
      const r = btn.getBoundingClientRect()
      const x = e.clientX - r.left
      const y = e.clientY - r.top
      btn.style.setProperty('--rx', x + 'px')
      btn.style.setProperty('--ry', y + 'px')
    }
    window.addEventListener('pointerdown', onDown)
    return () => window.removeEventListener('pointerdown', onDown)
  }, [])

  function onSignOut() {
    clearToken(); setTok(''); navigate('/login', { replace: true })
  }

  return (
    <div className={`container ${theme === 'light' ? 'theme-light' : ''}`}>
      <div className="navbar">
        <h1 className="brand">Compliance & Policy Automation for SMBs</h1>
        {token && (
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn" onClick={() => navigate('/')}> <HomeIcon style={{ marginRight: 6 }} /> Home</button>
            <a href="#/" onClick={(e) => { e.preventDefault(); navigate('/policies/new') }} style={{ textDecoration: 'none' }}>
              <button className="btn btn--primary"> <PlusIcon style={{ marginRight: 6 }} /> New Policy</button>
            </a>
            <button className="btn" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
              {theme === 'dark' ? <SunIcon style={{ marginRight: 6 }} /> : <MoonIcon style={{ marginRight: 6 }} />}
              {theme === 'dark' ? 'Light' : 'Dark'}
            </button>
            <button className="btn" onClick={onSignOut}> <LogoutIcon style={{ marginRight: 6 }} /> Sign out</button>
          </div>
        )}
      </div>
      <Routes>
        <Route
          path="/login"
          element={
            token
              ? <Navigate to="/" replace />
              : <Login onAuth={(t) => { setTok(t); setToken(t); navigate('/', { replace: true }) }} />
          }
        />
        <Route path="/" element={<Protected authed={!!token}><Dashboard token={token} /></Protected>} />
        <Route path="/policies/new" element={<Protected authed={!!token}><NewPolicy token={token} /></Protected>} />
        <Route path="/policies" element={<Protected authed={!!token}><Policies token={token} /></Protected>} />
        <Route path="/policies/:id" element={<Protected authed={!!token}><PolicyDetail token={token} /></Protected>} />
        <Route path="/audits" element={<Protected authed={!!token}><Audits token={token} /></Protected>} />
        <Route path="/audits/:id" element={<Protected authed={!!token}><AuditDetail token={token} /></Protected>} />
        <Route path="/assessments" element={<Protected authed={!!token}><Assessments token={token} /></Protected>} />
        <Route path="/assessments/:id" element={<Protected authed={!!token}><AssessmentDetail token={token} /></Protected>} />
        <Route path="/vendors" element={<Protected authed={!!token}><Vendors token={token} /></Protected>} />
        <Route path="/settings" element={<Protected authed={!!token}><Settings token={token} /></Protected>} />
        <Route path="*" element={<Navigate to={token ? '/' : '/login'} replace />} />
      </Routes>
    </div>
  )
}
