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

function Protected({ authed, children }: { authed: boolean; children: JSX.Element }) {
  if (!authed) return <Navigate to="/login" replace />
  return children
}

export default function App() {
  const [token, setTok] = useState<string>(getToken())
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => { if (token) setToken(token) }, [token])
  useEffect(() => {
    if (token && location.pathname === '/login') {
      navigate('/', { replace: true })
    }
  }, [token, location.pathname, navigate])

  function onSignOut() {
    clearToken(); setTok(''); navigate('/login', { replace: true })
  }

  return (
    <div style={{ maxWidth: 960, margin: '0 auto', padding: 16 }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h1 style={{ margin: 0, fontSize: 18 }}>Compliance & Policy — Week 2</h1>
        {token && (
          <div style={{ display: 'flex', gap: 8 }}>
            <a href="#/" onClick={(e) => { e.preventDefault(); navigate('/policies/new') }} style={{ textDecoration: 'none' }}>
              <button>New Policy</button>
            </a>
            <button onClick={onSignOut}>Sign out</button>
          </div>
        )}
      </header>
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
        <Route path="/settings" element={<Protected authed={!!token}><Settings /></Protected>} />
        <Route path="*" element={<Navigate to={token ? '/' : '/login'} replace />} />
      </Routes>
    </div>
  )
}
