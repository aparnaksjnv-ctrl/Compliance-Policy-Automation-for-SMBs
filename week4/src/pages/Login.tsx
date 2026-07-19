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

  const features = ['Audit Log', 'Role-Based Access', 'SOC 2 Controls', 'Risk Scoring', 'Email Alerts']

  return (
    <div style={{ minHeight: '70vh', display: 'grid', placeItems: 'center' }}>
      <div style={{ width: '100%', maxWidth: 960, display: 'grid', gridTemplateColumns: '1.15fr 0.85fr', border: '1px solid #243047', borderRadius: 18, overflow: 'hidden', background: '#0b1220', boxShadow: '0 24px 70px rgba(0,0,0,.35)' }}>
        <section style={{ padding: 40, background: 'linear-gradient(145deg, #0f766e, #0f172a 72%)' }}>
          <div style={{ color: '#99f6e4', fontSize: 12, fontWeight: 700, letterSpacing: '.14em', textTransform: 'uppercase' }}>Compliance Platform</div>
          <h2 style={{ margin: '12px 0 10px', fontSize: 34, lineHeight: 1.12 }}>Compliance Command Center</h2>
          <p style={{ margin: '0 0 28px', color: '#cbd5e1', lineHeight: 1.6 }}>Monitor controls, risk, vendors, audits, and compliance alerts from one workspace.</p>
          <div style={{ display: 'grid', gap: 10 }}>
            {features.map(feature => (
              <div key={feature} style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#e2e8f0' }}>
                <span style={{ width: 22, height: 22, display: 'grid', placeItems: 'center', borderRadius: 99, background: 'rgba(45,212,191,.2)', color: '#5eead4' }}>✓</span>
                {feature}
              </div>
            ))}
          </div>
        </section>
        <section style={{ padding: 40 }}>
          <div style={{ color: '#5eead4', textTransform: 'uppercase', fontSize: 12, fontWeight: 700, letterSpacing: '.12em', marginBottom: 8 }}>{mode === 'login' ? 'Welcome back' : 'Get started'}</div>
          <h2 style={{ margin: '0 0 24px', fontSize: 26 }}>{mode === 'login' ? 'Sign in to your workspace' : 'Create your account'}</h2>
          <form onSubmit={submit} style={{ display: 'grid', gap: 16 }}>
            <label>
              <div style={{ marginBottom: 6, color: '#cbd5e1' }}>Email</div>
              <input style={{ width: '100%', boxSizing: 'border-box' }} type="email" value={email} onChange={e => setEmail(e.target.value)} required />
            </label>
            <label>
              <div style={{ marginBottom: 6, color: '#cbd5e1' }}>Password</div>
              <input style={{ width: '100%', boxSizing: 'border-box' }} type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={8} />
            </label>
            {error && <div style={{ color: '#fca5a5' }}>{error}</div>}
            <button className="btn btn--primary" type="submit" disabled={loading} style={{ width: '100%', marginTop: 4 }}>
              {loading ? 'Please wait…' : (mode === 'login' ? 'Sign in' : 'Create account')}
            </button>
            <button type="button" onClick={() => setMode(mode === 'login' ? 'register' : 'login')} style={{ width: '100%' }}>
              {mode === 'login' ? 'New user? Create account' : 'Have an account? Sign in'}
            </button>
          </form>
        </section>
      </div>
    </div>
  )
}
