import { useEffect, useState } from 'react'
import { api, Soc2Control, Soc2Summary } from '../api'

export function Soc2({ token }: { token: string }) {
  const [controls, setControls] = useState<Soc2Control[]>([])
  const [summary, setSummary] = useState<Soc2Summary | null>(null)
  const [selectedControl, setSelectedControl] = useState<Soc2Control | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    async function loadData() {
      try {
        // Check if user is admin
        try {
          const userData = await api.me(token)
          setIsAdmin(userData.role === 'admin')
        } catch {
          setIsAdmin(false)
        }

        const data = await api.listSoc2Controls(token)
        setControls(data.controls)
        setSummary(data.summary)
      } catch (err: any) {
        setError(err.message || 'Failed to load SOC 2 controls')
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [token])

  const handleStatusChange = async (controlId: string, newStatus: 'implemented' | 'partial' | 'not_implemented') => {
    try {
      await api.updateSoc2Control(token, controlId, { status: newStatus })
      
      // Refresh data
      const data = await api.listSoc2Controls(token)
      setControls(data.controls)
      setSummary(data.summary)
      
      if (selectedControl?.controlId === controlId) {
        const updated = await api.getSoc2Control(token, controlId)
        setSelectedControl(updated)
      }
    } catch (err: any) {
      setError(err.message || 'Failed to update control')
    }
  }

  const handleNotesChange = async (controlId: string, notes: string) => {
    try {
      await api.updateSoc2Control(token, controlId, { notes })
      
      if (selectedControl?.controlId === controlId) {
        const updated = await api.getSoc2Control(token, controlId)
        setSelectedControl(updated)
      }
    } catch (err: any) {
      setError(err.message || 'Failed to update notes')
    }
  }

  if (loading) {
    return (
      <div style={{ display: 'grid', gap: 16 }}>
        <div className="page-header">
          <div className="page-header__title">SOC 2 Controls</div>
        </div>
        <div className="card">
          Loading...
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ display: 'grid', gap: 16 }}>
        <div className="page-header">
          <div className="page-header__title">SOC 2 Controls</div>
        </div>
        <div className="card text-danger">
          {error}
        </div>
      </div>
    )
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'implemented':
        return { bg: 'rgba(16, 185, 129, 0.1)', border: 'rgba(16, 185, 129, 0.3)', text: 'var(--status-approved)' }
      case 'partial':
        return { bg: 'rgba(245, 158, 11, 0.1)', border: 'rgba(245, 158, 11, 0.3)', text: 'var(--status-pending)' }
      case 'not_implemented':
        return { bg: 'rgba(239, 68, 68, 0.1)', border: 'rgba(239, 68, 68, 0.3)', text: 'var(--status-danger)' }
      default:
        return { bg: 'rgba(107, 114, 128, 0.1)', border: 'rgba(107, 114, 128, 0.3)', text: 'var(--text-muted)' }
    }
  }

  const implementationPercentage = summary ? Math.round((summary.implemented / summary.total) * 100) : 0
  const percentageColor = implementationPercentage >= 70 ? 'var(--status-approved)' : implementationPercentage >= 40 ? 'var(--status-pending)' : 'var(--status-danger)'

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <div className="page-header">
        <div className="page-header__title">SOC 2 Controls</div>
      </div>

      {/* Summary Card */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4 }}>Implementation Status</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)' }}>
              {summary?.implemented || 0} of {summary?.total || 0} controls implemented
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 32, fontWeight: 700, color: percentageColor }}>
              {implementationPercentage}%
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 16 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 4 }}>Implemented</div>
            <div style={{ fontSize: 18, fontWeight: 600, color: 'var(--status-approved)' }}>{summary?.implemented || 0}</div>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 4 }}>Partial</div>
            <div style={{ fontSize: 18, fontWeight: 600, color: 'var(--status-pending)' }}>{summary?.partial || 0}</div>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 4 }}>Not Implemented</div>
            <div style={{ fontSize: 18, fontWeight: 600, color: 'var(--status-danger)' }}>{summary?.not_implemented || 0}</div>
          </div>
        </div>
      </div>

      {/* Controls Table */}
      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>Control ID</th>
              <th>Category</th>
              <th>Title</th>
              <th>Status</th>
              <th>Owner</th>
            </tr>
          </thead>
          <tbody>
            {controls.map((control) => {
              const colors = getStatusColor(control.status)
              return (
                <tr 
                  key={control.controlId}
                  onClick={() => setSelectedControl(control)}
                  style={{ cursor: 'pointer' }}
                >
                  <td className="mono">{control.controlId}</td>
                  <td>{control.category}</td>
                  <td>{control.title}</td>
                  <td>
                    <span style={{
                      background: colors.bg,
                      border: `1px solid ${colors.border}`,
                      color: colors.text,
                      padding: '4px 12px',
                      borderRadius: '9999px',
                      fontSize: '12px',
                      fontWeight: 500,
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em'
                    }}>
                      {control.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td>{control.owner}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Control Detail Modal */}
      {selectedControl && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }} onClick={() => setSelectedControl(null)}>
          <div 
            className="card" 
            style={{ 
              maxWidth: 600, 
              width: '90%',
              maxHeight: '80vh',
              overflowY: 'auto'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <div className="mono" style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 4 }}>{selectedControl.controlId}</div>
                <div style={{ fontSize: 18, fontWeight: 700 }}>{selectedControl.title}</div>
              </div>
              <button
                onClick={() => setSelectedControl(null)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-secondary)',
                  fontSize: 24,
                  cursor: 'pointer'
                }}
              >
                ×
              </button>
            </div>

            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4 }}>Category</div>
              <div>{selectedControl.category}</div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4 }}>Description</div>
              <div style={{ lineHeight: 1.6 }}>{selectedControl.description}</div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4 }}>Status</div>
              {isAdmin ? (
                <div style={{ display: 'flex', gap: 8 }}>
                  {(['implemented', 'partial', 'not_implemented'] as const).map((status) => {
                    const colors = getStatusColor(status)
                    return (
                      <button
                        key={status}
                        onClick={() => handleStatusChange(selectedControl.controlId, status)}
                        style={{
                          background: selectedControl.status === status ? colors.bg : 'transparent',
                          border: `1px solid ${selectedControl.status === status ? colors.border : 'var(--border)'}`,
                          color: selectedControl.status === status ? colors.text : 'var(--text-secondary)',
                          padding: '6px 12px',
                          borderRadius: '6px',
                          fontSize: '12px',
                          fontWeight: 500,
                          cursor: 'pointer',
                          textTransform: 'uppercase'
                        }}
                      >
                        {status.replace('_', ' ')}
                      </button>
                    )
                  })}
                </div>
              ) : (
                <span style={{
                  background: getStatusColor(selectedControl.status).bg,
                  border: `1px solid ${getStatusColor(selectedControl.status).border}`,
                  color: getStatusColor(selectedControl.status).text,
                  padding: '4px 12px',
                  borderRadius: '9999px',
                  fontSize: '12px',
                  fontWeight: 500,
                  textTransform: 'uppercase'
                }}>
                  {selectedControl.status.replace('_', ' ')}
                </span>
              )}
            </div>

            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4 }}>Owner</div>
              <div>{selectedControl.owner}</div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4 }}>Evidence</div>
              {selectedControl.evidence.length > 0 ? (
                <ul style={{ margin: 0, paddingLeft: 20 }}>
                  {selectedControl.evidence.map((item, idx) => (
                    <li key={idx} style={{ marginBottom: 4 }}>{item}</li>
                  ))}
                </ul>
              ) : (
                <div className="text-muted">No evidence items</div>
              )}
            </div>

            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4 }}>Notes</div>
              {isAdmin ? (
                <textarea
                  value={selectedControl.notes}
                  onChange={(e) => handleNotesChange(selectedControl.controlId, e.target.value)}
                  style={{
                    width: '100%',
                    minHeight: 80,
                    background: 'var(--bg-elevated)',
                    border: '1px solid var(--border)',
                    color: 'var(--text-primary)',
                    padding: 8,
                    borderRadius: 6,
                    resize: 'vertical'
                  }}
                />
              ) : (
                <div style={{ lineHeight: 1.6 }}>{selectedControl.notes || 'No notes'}</div>
              )}
            </div>

            <div className="text-muted" style={{ fontSize: 12 }}>
              Last reviewed: {new Date(selectedControl.lastReviewed).toLocaleDateString()}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
