import { useEffect, useState } from 'react'
import { useToast } from '../components/Toast'

type Theme = 'dark' | 'light'

const LS_KEYS = {
  ws: 'cp_workspace_name',
  email: 'cp_contact_email',
  theme: 'cp_theme',
}

export function Settings() {
  const { notify } = useToast()
  const [workspace, setWorkspace] = useState<string>(() => {
    try { return localStorage.getItem(LS_KEYS.ws) || '' } catch { return '' }
  })
  const [email, setEmail] = useState<string>(() => {
    try { return localStorage.getItem(LS_KEYS.email) || '' } catch { return '' }
  })
  const [theme, setTheme] = useState<Theme>(() => {
    try { return (localStorage.getItem(LS_KEYS.theme) as Theme) || 'dark' } catch { return 'dark' }
  })

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  function save(e: React.FormEvent) {
    e.preventDefault()
    try {
      localStorage.setItem(LS_KEYS.ws, workspace)
      localStorage.setItem(LS_KEYS.email, email)
      notify('Settings saved', 'success')
    } catch {
      notify('Failed to save settings', 'error')
    }
  }

  function changeTheme(next: Theme) {
    setTheme(next)
    try {
      localStorage.setItem(LS_KEYS.theme, next)
    } catch {}
    notify(`Theme: ${next}`, 'info')
  }

  return (
    <div className="card">
      <div className="card-title">Settings</div>

      <form onSubmit={save} style={{ display: 'grid', gap: 12, maxWidth: 520 }}>
        <label>
          <div>Workspace name</div>
          <input className="input" value={workspace} onChange={e => setWorkspace(e.target.value)} placeholder="e.g., Acme Corp" />
        </label>
        <label>
          <div>Contact email</div>
          <input className="input" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="name@company.com" />
        </label>

        <div>
          <div className="card-title" style={{ marginBottom: 8 }}>Theme</div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="button" className={`btn ${theme === 'dark' ? 'primary' : ''}`} onClick={() => changeTheme('dark')}>Dark</button>
            <button type="button" className={`btn ${theme === 'light' ? 'primary' : ''}`} onClick={() => changeTheme('light')}>Light</button>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <button type="submit" className="btn primary">Save changes</button>
        </div>
      </form>
    </div>
  )
}
