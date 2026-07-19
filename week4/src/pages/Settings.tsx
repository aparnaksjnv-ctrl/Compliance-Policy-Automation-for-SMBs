import { useEffect, useState } from 'react'
import { api } from '../api'
import { getToken } from '../lib'

export function Settings() {
  const [user, setUser] = useState<{ id: string; email: string; role: 'user' | 'admin' } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadUser() {
      try {
        const token = getToken()
        if (token) {
          const userData = await api.me(token)
          setUser(userData)
        }
      } catch (error) {
        console.error('Failed to load user:', error)
      } finally {
        setLoading(false)
      }
    }
    loadUser()
  }, [])

  if (loading) {
    return (
      <div>
        <div style={{ fontWeight: 700, marginBottom: 12 }}>Settings</div>
        <div style={{ border: '1px solid var(--border)', background: '#111827', padding: 12, borderRadius: 10 }}>
          Loading...
        </div>
      </div>
    )
  }

  return (
    <div>
      <div style={{ fontWeight: 700, marginBottom: 12 }}>Settings</div>
      <div style={{ border: '1px solid var(--border)', background: '#111827', padding: 12, borderRadius: 10 }}>
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 4 }}>Email</div>
          <div style={{ fontSize: 14 }}>{user?.email || 'Not logged in'}</div>
        </div>
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 4 }}>Role</div>
          <div style={{ fontSize: 14 }}>
            {user?.role === 'admin' ? (
              <span style={{ 
                background: 'rgba(16, 185, 129, 0.1)', 
                border: '1px solid rgba(16, 185, 129, 0.3)', 
                color: '#10b981',
                padding: '4px 12px',
                borderRadius: '9999px',
                fontSize: '12px',
                fontWeight: 500,
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>
                Admin
              </span>
            ) : (
              <span style={{ 
                background: 'rgba(107, 114, 128, 0.1)', 
                border: '1px solid rgba(107, 114, 128, 0.3)', 
                color: '#6b7280',
                padding: '4px 12px',
                borderRadius: '9999px',
                fontSize: '12px',
                fontWeight: 500,
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>
                User
              </span>
            )}
          </div>
        </div>
        <div style={{ fontSize: 12, color: '#6b7280', marginTop: 16 }}>
          Coming soon: organization settings, roles management, and integrations.
        </div>
      </div>
    </div>
  )
}
