import { useState } from 'react'
import { api } from '../api'

export function Login({ onAuth }: { onAuth: (token: string) => void }) {
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError('')
    try {
      const res = mode === 'login' ? await api.login(email, password) : await api.register(email, password)
      onAuth(res.token)
    } catch (e: any) {
      setError(e?.message || 'Request failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ border: '1px solid #1f2937', borderRadius: 12, padding: 16, background: '#0b1220' }}>
      <div style={{ color: '#9ca3af', textTransform: 'uppercase', fontSize: 12, marginBottom: 8 }}>{mode === 'login' ? 'Sign in' : 'Create account'}</div>
      <form onSubmit={submit} style={{ display: 'grid', gap: 10 }}>
        <label>
          <div>Email</div>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} required />
        </label>
        <label>
          <div>Password</div>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={8} />
        </label>
        {error && <div style={{ color: '#fca5a5' }}>{error}</div>}
        <div style={{ display: 'flex', gap: 8 }}>
          <button type="submit" disabled={loading}>{loading ? 'Please wait…' : (mode === 'login' ? 'Login' : 'Register')}</button>
          <button type="button" onClick={() => setMode(mode === 'login' ? 'register' : 'login')}>
            {mode === 'login' ? 'New user? Create account' : 'Have an account? Sign in'}
          </button>
        </div>
      </form>
    </div>
  )
}
