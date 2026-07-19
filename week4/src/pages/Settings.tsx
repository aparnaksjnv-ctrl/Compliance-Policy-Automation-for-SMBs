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
      <div style={{ display: 'grid', gap: 16 }}>
        <div className="page-header">
          <div className="page-header__title">Settings</div>
        </div>
        <div className="card">
          Loading...
        </div>
      </div>
    )
  }

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <div className="page-header">
        <div className="page-header__title">Settings</div>
      </div>
      <div className="card">
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4 }}>Email</div>
          <div style={{ fontSize: 14 }}>{user?.email || 'Not logged in'}</div>
        </div>
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4 }}>Role</div>
          <div style={{ fontSize: 14 }}>
            {user?.role === 'admin' ? (
              <span className="chip chip--approved">Admin</span>
            ) : (
              <span className="chip chip--draft">User</span>
            )}
          </div>
        </div>
        <div className="text-muted" style={{ fontSize: 12, marginTop: 16 }}>
          Coming soon: organization settings, roles management, and integrations.
        </div>
      </div>
    </div>
  )
}
