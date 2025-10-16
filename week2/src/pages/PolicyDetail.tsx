import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import { api, Policy, PolicyStatus } from '../api'
import { useState, useEffect, useRef } from 'react'

export function PolicyDetail({ token }: { token: string }) {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const { data, isFetching, error, refetch } = useQuery({
    queryKey: ['policy', id],
    queryFn: () => api.getPolicy(token, id),
    enabled: !!id,
  })

  const [form, setForm] = useState<Partial<Policy>>({})
  useEffect(() => { if (data) setForm({ name: data.name, owner: data.owner, status: data.status, content: data.content }) }, [data])

  const editorEl = useRef<HTMLDivElement>(null)
  const quill = useRef<any>(null)
  const [template, setTemplate] = useState<'GDPR' | 'HIPAA' | 'CCPA'>('GDPR')
  const [companyText, setCompanyText] = useState<string>('')
  const [companyObj, setCompanyObj] = useState<any>(null)

  useEffect(() => {
    const Q = (window as any).Quill
    if (editorEl.current && Q && !quill.current) {
      quill.current = new Q(editorEl.current, { theme: 'snow' })
      if (form.content) quill.current.root.innerHTML = form.content
      quill.current.on('text-change', () => {
        const html = quill.current.root.innerHTML as string
        setForm(prev => ({ ...prev, content: html }))
      })
    }
  }, [editorEl, form.content])

  const update = useMutation({
    mutationFn: (payload: Partial<Policy>) => api.updatePolicy(token, id, payload),
    onSuccess: () => refetch(),
  })

  const del = useMutation({
    mutationFn: () => api.deletePolicy(token, id),
    onSuccess: () => navigate('/policies', { replace: true }),
  })

  const gen = useMutation({
    mutationFn: async () => {
      const existing = quill.current ? (quill.current.root.innerHTML as string) : (form.content || '')
      return api.generatePolicy(token, { template, company: companyObj || undefined, existingContent: existing })
    },
    onSuccess: (res) => {
      const html = String(res.content || '').replace(/\n/g, '<br/>')
      setForm(prev => ({ ...prev, content: html }))
      if (quill.current) quill.current.root.innerHTML = html
    },
  })

  const exp = useMutation({
    mutationFn: () => api.exportPolicy(token, id),
    onSuccess: (res) => {
      if ((res as any).url) {
        window.open((res as any).url, '_blank')
      } else if ((res as any).content) {
        const blob = new Blob([String((res as any).content)], { type: 'text/plain' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'policy.txt'
        a.click()
        URL.revokeObjectURL(url)
      }
    },
  })

  function onChange<K extends keyof Policy>(key: K, value: Policy[K]) {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    const payload = { ...form, content: quill.current ? (quill.current.root.innerHTML as string) : form.content }
    update.mutate(payload)
  }

  function onCompanyFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (!f) return
    const reader = new FileReader()
    reader.onload = () => {
      const text = String(reader.result || '')
      setCompanyText(text)
      try { setCompanyObj(JSON.parse(text)) } catch { setCompanyObj(null) }
    }
    reader.readAsText(f)
  }

  if (isFetching) return <div>Loading…</div>
  if (error) return <div style={{ color: '#fca5a5' }}>{String((error as any)?.message || 'Failed to load')}</div>
  if (!data) return <div>Not found</div>

  return (
    <div>
      <div style={{ marginBottom: 12 }}>
        <button onClick={() => navigate('/policies')}>{'< Back'}</button>
      </div>
      <form onSubmit={onSubmit} style={{ display: 'grid', gap: 10 }}>
        <label>
          <div>Name</div>
          <input value={form.name || ''} onChange={e => onChange('name', e.target.value as any)} required />
        </label>
        <label>
          <div>Owner</div>
          <input value={form.owner || ''} onChange={e => onChange('owner', e.target.value as any)} required />
        </label>
        <label>
          <div>Status</div>
          <select value={form.status || 'Draft'} onChange={e => onChange('status', e.target.value as PolicyStatus)}>
            <option>Draft</option>
            <option>In Review</option>
            <option>Approved</option>
          </select>
        </label>
        <div style={{ display: 'grid', gap: 8 }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <select value={template} onChange={e => setTemplate(e.target.value as any)}>
              <option value="GDPR">GDPR</option>
              <option value="HIPAA">HIPAA</option>
              <option value="CCPA">CCPA</option>
            </select>
            <input type="file" accept="application/json" onChange={onCompanyFile} />
            <button type="button" onClick={() => gen.mutate()} disabled={gen.isPending}>Generate</button>
            <button type="button" onClick={() => exp.mutate()} disabled={exp.isPending}>Export</button>
          </div>
          <div ref={editorEl} style={{ background: '#111827', color: '#e5e7eb' }} />
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button type="submit" disabled={update.isPending}>Save</button>
          <button type="button" onClick={() => del.mutate()} disabled={del.isPending}>Delete</button>
        </div>
      </form>
    </div>
  )
}
