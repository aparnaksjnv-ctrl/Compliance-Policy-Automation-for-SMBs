import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import { api, Policy, PolicyStatus, Framework } from '../api'
import { useState, useEffect, useRef } from 'react'
import type React from 'react'
import toast from 'react-hot-toast'
import DOMPurify from 'dompurify'
import { diffWords } from 'diff'
import type { Change } from 'diff'
import { exportElementToPdf } from '../utils/pdf'

export function PolicyDetail({ token }: { token: string }) {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const { data, isFetching, error, refetch } = useQuery<Policy>({
    queryKey: ['policy', id],
    queryFn: () => api.getPolicy(token, id),
    enabled: !!id,
  })
  const me = useQuery<{ id: string; email: string; role: 'user' | 'admin' }>({ queryKey: ['me'], queryFn: () => api.me(token) })

  const [form, setForm] = useState<Partial<Policy>>({})
  const [note, setNote] = useState('')
  const versionsQ = useQuery<{ versions: { content: string; note?: string; createdAt: string }[] }>({
    queryKey: ['policy-versions', id],
    queryFn: () => api.listVersions(token, id),
    enabled: !!id,
  })
  useEffect(() => {
    if (data) setForm({
      name: data.name,
      owner: data.owner,
      status: data.status,
      content: data.content,
      framework: data.framework,
      company: data.company,
    })
  }, [data])

  // Rich text editor (Quill)
  const editorEl = useRef<HTMLDivElement>(null)
  const quill = useRef<any>(null)
  const previewRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const Q = (window as any).Quill
    if (editorEl.current && Q && !quill.current) {
      quill.current = new Q(editorEl.current, { theme: 'snow' })
      if (form.content) quill.current.root.innerHTML = form.content
      quill.current.on('text-change', () => {
        const html = String(quill.current.root.innerHTML || '')
        setForm(prev => ({ ...prev, content: html }))
      })
    }
  }, [editorEl, form.content])

  const update = useMutation({
    mutationFn: (payload: Partial<Policy> & { note?: string }) => api.updatePolicy(token, id, payload),
    onSuccess: () => { toast.success('Saved'); refetch() },
    onError: (e: any) => toast.error(String(e?.message || 'Save failed')),
  })

  const del = useMutation({
    mutationFn: () => api.deletePolicy(token, id),
    onSuccess: () => { toast.success('Deleted'); navigate('/policies', { replace: true }) },
    onError: (e: any) => toast.error(String(e?.message || 'Delete failed')),
  })

  const submitReview = useMutation({
    mutationFn: () => api.submitReview(token, id),
    onSuccess: () => { toast.success('Submitted for review'); refetch() },
    onError: (e: any) => toast.error(String(e?.message || 'Submit failed')),
  })

  const approve = useMutation({
    mutationFn: () => api.approve(token, id),
    onSuccess: () => { toast.success('Approved'); refetch() },
    onError: (e: any) => toast.error(String(e?.message || 'Approve failed')),
  })

  // Template-based generation + company JSON upload
  const [template, setTemplate] = useState<'GDPR' | 'HIPAA' | 'CCPA'>('GDPR')
  const [companyText, setCompanyText] = useState('')
  const [companyObj, setCompanyObj] = useState<any>(null)
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

  const genTemplates = useMutation({
    mutationFn: async () => {
      const existing = quill.current ? String(quill.current.root.innerHTML || '') : (form.content || '')
      return api.generatePolicy(token, { template, company: companyObj || undefined, existingContent: existing })
    },
    onSuccess: (res) => {
      const html = String(res.content || '').replace(/\n/g, '<br/>')
      setForm(prev => ({ ...prev, content: html }))
      if (quill.current) quill.current.root.innerHTML = html
      toast.success('Generated from template')
    },
    onError: (e: any) => toast.error(String(e?.message || 'Generate failed')),
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
      toast.success('Export ready')
    },
    onError: (e: any) => toast.error(String(e?.message || 'Export failed')),
  })

  const [genPrompt, setGenPrompt] = useState('')
  const [genPct, setGenPct] = useState(0)
  const gen = useMutation({
    mutationFn: async () => {
      const r = await api.generateDraft(token, id, { prompt: genPrompt || undefined })
      setForm((prev: Partial<Policy>) => ({ ...prev, content: r.content }))
      return r
    },
    onSuccess: () => toast.success('Draft generated'),
    onError: (e: any) => toast.error(String(e?.message || 'Generation failed')),
  })

  useEffect(() => {
    let t: any
    if (gen.isPending) {
      setGenPct(5)
      t = setInterval(() => {
        setGenPct((p: number) => (p >= 95 ? 95 : p + Math.max(1, Math.round((100 - p) * 0.08))))
      }, 500)
    } else if (gen.isSuccess) {
      setGenPct(100)
      const done = setTimeout(() => setGenPct(0), 800)
      return () => clearTimeout(done)
    } else {
      setGenPct(0)
    }
    return () => { if (t) clearInterval(t) }
  }, [gen.isPending, gen.isSuccess])

  function onChange<K extends keyof Policy>(key: K, value: Policy[K]) {
    setForm((prev: Partial<Policy>) => ({ ...prev, [key]: value }))
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    const html = quill.current ? String(quill.current.root.innerHTML || '') : form.content
    update.mutate({ ...form, content: html, note: note || undefined })
    setNote('')
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
        <label>
          <div>Framework</div>
          <select value={form.framework || 'GDPR'} onChange={e => onChange('framework', e.target.value as Framework)}>
            <option>GDPR</option>
            <option>HIPAA</option>
            <option>CCPA</option>
            <option>Other</option>
          </select>
        </label>
        <label>
          <div>Company</div>
          <input value={form.company || ''} onChange={e => onChange('company', e.target.value as any)} />
        </label>
        <div style={{ display: 'grid', gap: 8 }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <select value={template} onChange={e => setTemplate(e.target.value as any)}>
              <option value="GDPR">GDPR</option>
              <option value="HIPAA">HIPAA</option>
              <option value="CCPA">CCPA</option>
            </select>
            <input type="file" accept="application/json" onChange={onCompanyFile} />
            <button type="button" onClick={() => genTemplates.mutate()} disabled={genTemplates.isPending}>Generate (template)</button>
            <button type="button" onClick={() => exp.mutate()} disabled={exp.isPending}>Export</button>
            <button
              type="button"
              onClick={() => {
                const el = previewRef.current
                if (el) exportElementToPdf(el, `${(form.name || data?.name || 'policy')}.pdf`)
              }}
            >Export PDF</button>
          </div>
          <div ref={editorEl} style={{ background: '#111827', color: '#e5e7eb', border: '1px solid var(--border)', borderRadius: 8 }} />
        </div>
        <label>
          <div>Change note (optional)</div>
          <input value={note} onChange={e => setNote(e.target.value)} placeholder="Describe what changed" />
        </label>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button type="submit" disabled={update.isPending}>Save</button>
          <button type="button" onClick={() => del.mutate()} disabled={del.isPending}>Delete</button>
          {form.status !== 'In Review' && form.status !== 'Approved' && (
            <button type="button" onClick={() => submitReview.mutate()} disabled={submitReview.isPending}>Submit for review</button>
          )}
          {form.status === 'In Review' && me.data?.role === 'admin' && (
            <button type="button" onClick={() => approve.mutate()} disabled={approve.isPending}>Approve (admin)</button>
          )}
        </div>
      </form>

      <div style={{ marginTop: 24 }}>
        <div style={{ fontWeight: 600, marginBottom: 8 }}>Generate Draft (AI)</div>
        <div style={{ display: 'grid', gap: 8, marginBottom: 12 }}>
          <textarea rows={4} value={genPrompt} onChange={e => setGenPrompt(e.target.value)} placeholder="Describe the policy context or any specific requirements…" />
          <div>
            <button type="button" onClick={() => gen.mutate()} disabled={gen.isPending}>
              {gen.isPending ? 'Generating…' : 'Generate draft'}
            </button>
            {gen.isError && <span style={{ color: '#fca5a5', marginLeft: 8 }}>{String((gen.error as any)?.message || 'Failed')}</span>}
            {gen.isSuccess && <span style={{ color: '#34d399', marginLeft: 8 }}>Draft generated. Review and Save.</span>}
          </div>
          {gen.isPending || genPct > 0 ? (
            <div style={{ height: 8, background: '#111827', borderRadius: 6, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${genPct}%`, background: '#22c55e', transition: 'width 0.4s ease' }} />
            </div>
          ) : null}
        </div>

        <div style={{ fontWeight: 600, marginBottom: 8 }}>Preview (sanitized)</div>
        <div ref={previewRef} style={{ border: '1px solid #1f2937', padding: 12, borderRadius: 8, marginBottom: 16 }}
             dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(form.content || '') }} />

        <div style={{ fontWeight: 600, marginBottom: 8 }}>Versions</div>
        {versionsQ.isFetching && <div>Loading versions…</div>}
        {versionsQ.data && versionsQ.data.versions && versionsQ.data.versions.length > 0 ? (
          <ul style={{ paddingLeft: 18 }}>
            {versionsQ.data.versions.map((v, idx) => (
              <li key={idx} style={{ marginBottom: 6 }}>
                <div style={{ color: '#9ca3af' }}>{new Date(v.createdAt).toLocaleString()} {v.note ? `— ${v.note}` : ''}</div>
                <details>
                  <summary>View content</summary>
                  <pre style={{ whiteSpace: 'pre-wrap' }}>{v.content}</pre>
                </details>
              </li>
            ))}
          </ul>
        ) : (
          <div style={{ color: '#94a3b8' }}>No versions yet.</div>
        )}

        {/* Diff to last version */}
        <div style={{ marginTop: 16 }}>
          <div style={{ fontWeight: 600, marginBottom: 8 }}>Diff vs last version</div>
          {(() => {
            const last = versionsQ.data?.versions?.[versionsQ.data.versions.length - 1]?.content
            const current = form.content || ''
            if (!last) return <div style={{ color: '#94a3b8' }}>No previous version to diff.</div>
            const parts = diffWords(last, current)
            return (
              <div style={{ border: '1px solid #1f2937', padding: 12, borderRadius: 8 }}>
                {parts.map((p: Change, i: number) => (
                  <span key={i} style={{
                    background: p.added ? 'rgba(34,197,94,0.25)' : p.removed ? 'rgba(239,68,68,0.25)' : 'transparent',
                    textDecoration: p.removed ? 'line-through' : 'none'
                  }}>{p.value}</span>
                ))}
              </div>
            )
          })()}
        </div>
      </div>
    </div>
  )
}
