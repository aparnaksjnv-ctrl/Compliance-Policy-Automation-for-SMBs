import { useState } from 'react'
import { api } from '../api'

export function Auth({ onAuth }: { onAuth: (token: string) => void }) {
  const [mode, setMode] = useState<'login' | 'register'>('register')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const res = mode === 'register'
        ? await api.register(email, password)
        : await api.login(email, password)
      onAuth(res.token)
    } catch (err: any) {
      setError(err?.message || 'Request failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="card" style={{ maxWidth: 480 }}>
      <div className="card-title">{mode === 'register' ? 'Create account' : 'Sign in'}</div>
      <form onSubmit={submit} className="form">
        <label>
          <div>Email</div>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} required />
        </label>
        <label>
          <div>Password</div>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={8} />
        </label>
        {error && <div className="card-hint" style={{ color: '#fca5a5' }}>{error}</div>}
        <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
          <button className="primary" type="submit" disabled={loading}>{loading ? 'Please wait…' : (mode === 'register' ? 'Register' : 'Login')}</button>
          <button type="button" onClick={() => setMode(mode === 'register' ? 'login' : 'register')}>
            {mode === 'register' ? 'Have an account? Sign in' : 'New user? Create account'}
          </button>
        </div>
      </form>
    </div>
  )
}
