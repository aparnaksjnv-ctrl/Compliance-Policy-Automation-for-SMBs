import { Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { getToken, setToken, clearToken } from './lib'
import { Login } from './pages/Login'
import { Policies } from './pages/Policies'
import { PolicyDetail } from './pages/PolicyDetail'

function Protected({ children }: { children: JSX.Element }) {
  const tok = getToken()
  if (!tok) return <Navigate to="/login" replace />
  return children
}

export default function App() {
  const [token, setTok] = useState<string>(getToken())
  const navigate = useNavigate()

  useEffect(() => { if (token) setToken(token) }, [token])

  function onSignOut() {
    clearToken(); setTok(''); navigate('/login', { replace: true })
  }

  return (
    <div style={{ maxWidth: 960, margin: '0 auto', padding: 16 }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h1 style={{ margin: 0, fontSize: 18 }}>Compliance & Policy — Week 2</h1>
        {token && <button onClick={onSignOut}>Sign out</button>}
      </header>

      <Routes>
        <Route path="/login" element={<Login onAuth={(t) => { setTok(t); navigate('/policies', { replace: true }) }} />} />
        <Route path="/policies" element={<Protected><Policies token={token} /></Protected>} />
        <Route path="/policies/:id" element={<Protected><PolicyDetail token={token} /></Protected>} />
        <Route path="*" element={<Navigate to={token ? '/policies' : '/login'} replace />} />
      </Routes>
    </div>
  )
}
