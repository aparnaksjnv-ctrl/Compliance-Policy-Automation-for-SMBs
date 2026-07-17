import { useEffect, useState } from 'react'
import { api, AlertSettings } from '../api'

export function Alerts({ token }: { token: string }) {
  const [settings, setSettings] = useState<AlertSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sending, setSending] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  // Recent alerts history (mocked in frontend; can be backed by a server collection if needed)
  const [recentAlerts, setRecentAlerts] = useState<Array<{ type: string; message: string; sentAt: string }>>([])

  useEffect(() => {
    async function loadSettings() {
      try {
        const data = await api.listAlertSettings(token)
        setSettings(data)

        // Load recent alerts from localStorage for demo
        const stored = localStorage.getItem('recentAlerts')
        if (stored) {
          setRecentAlerts(JSON.parse(stored))
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load alert settings')
      } finally {
        setLoading(false)
      }
    }
    loadSettings()
  }, [token])

  const updateSetting = async (key: keyof AlertSettings, value: any) => {
    if (!settings) return

    try {
      const updated = { ...settings, [key]: value }
      setSettings(updated)

      const saved = await api.updateAlertSettings(token, {
        vendorRiskAlerts: updated.vendorRiskAlerts,
        soc2Alerts: updated.soc2Alerts,
        policyExpiryAlerts: updated.policyExpiryAlerts,
        alertEmail: updated.alertEmail,
      })

      setSettings(saved)
      setMessage('Settings saved')
      setTimeout(() => setMessage(null), 3000)
    } catch (err: any) {
      setError(err.message || 'Failed to update settings')
    }
  }

  const sendTestEmail = async () => {
    try {
      setSending(true)
      setMessage(null)
      setError(null)
      const result = await api.sendTestAlert(token)

      const newAlert = { type: 'Test', message: result.message, sentAt: new Date().toISOString() }
      const updatedAlerts = [newAlert, ...recentAlerts].slice(0, 10)
      setRecentAlerts(updatedAlerts)
      localStorage.setItem('recentAlerts', JSON.stringify(updatedAlerts))

      setMessage(result.message)
    } catch (err: any) {
      setError(err.message || 'Failed to send test email')
    } finally {
      setSending(false)
    }
  }

  if (loading) {
    return (
      <div>
        <div style={{ fontWeight: 700, marginBottom: 12 }}>Alerts</div>
        <div className="card">Loading...</div>
      </div>
    )
  }

  if (error && !settings) {
    return (
      <div>
        <div style={{ fontWeight: 700, marginBottom: 12 }}>Alerts</div>
        <div className="card" style={{ color: '#ef4444' }}>{error}</div>
      </div>
    )
  }

  return (
    <div>
      <div style={{ fontWeight: 700, marginBottom: 12 }}>Alerts</div>

      {message && (
        <div className="card" style={{ background: 'rgba(16, 185, 129, 0.1)', borderColor: 'rgba(16, 185, 129, 0.3)', color: '#10b981', marginBottom: 12 }}>
          {message}
        </div>
      )}

      {error && (
        <div className="card" style={{ background: 'rgba(239, 68, 68, 0.08)', borderColor: 'rgba(239, 68, 68, 0.3)', color: '#fca5a5', marginBottom: 12 }}>
          {error}
        </div>
      )}

      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>Alert Settings</div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 12, color: '#9ca3af', display: 'block', marginBottom: 6 }}>Alert Email</label>
          <input
            type="email"
            value={settings?.alertEmail || ''}
            onChange={(e) => updateSetting('alertEmail', e.target.value)}
            style={{ minWidth: 300 }}
          />
        </div>

        <div style={{ display: 'grid', gap: 12 }}>
          <Toggle
            label="Vendor Risk Alerts"
            description="Notify when a vendor risk score drops below 50"
            checked={settings?.vendorRiskAlerts ?? true}
            onChange={(v) => updateSetting('vendorRiskAlerts', v)}
          />
          <Toggle
            label="SOC 2 Control Alerts"
            description="Notify when a SOC 2 control is marked not implemented"
            checked={settings?.soc2Alerts ?? true}
            onChange={(v) => updateSetting('soc2Alerts', v)}
          />
          <Toggle
            label="Policy Expiry Alerts"
            description="Notify when a policy has not been reviewed in 90 days"
            checked={settings?.policyExpiryAlerts ?? true}
            onChange={(v) => updateSetting('policyExpiryAlerts', v)}
          />
        </div>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>Test Email</div>
        <button
          onClick={sendTestEmail}
          disabled={sending}
          style={{ background: '#3b82f6', borderColor: '#2563eb' }}
        >
          {sending ? 'Sending...' : 'Send Test Email'}
        </button>
      </div>

      <div className="card">
        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>Recent Alerts</div>
        {recentAlerts.length === 0 ? (
          <div style={{ color: '#6b7280' }}>No alerts sent yet.</div>
        ) : (
          <div style={{ display: 'grid', gap: 8 }}>
            {recentAlerts.map((alert, idx) => (
              <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: 10, background: '#111827', borderRadius: 6 }}>
                <span>{alert.message}</span>
                <span style={{ color: '#6b7280', fontSize: 12 }}>{new Date(alert.sentAt).toLocaleString()}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function Toggle({ label, description, checked, onChange }: { label: string; description: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
      <div>
        <div style={{ fontWeight: 500 }}>{label}</div>
        <div style={{ fontSize: 12, color: '#6b7280' }}>{description}</div>
      </div>
      <button
        onClick={() => onChange(!checked)}
        style={{
          width: 48,
          height: 24,
          borderRadius: 12,
          border: 'none',
          background: checked ? '#10b981' : '#4b5563',
          position: 'relative',
          cursor: 'pointer',
          padding: 0,
        }}
      >
        <span
          style={{
            position: 'absolute',
            top: 2,
            left: checked ? 26 : 2,
            width: 20,
            height: 20,
            borderRadius: '50%',
            background: '#fff',
            transition: 'left 0.2s ease',
          }}
        />
      </button>
    </div>
  )
}
