import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { api, Framework, PolicyStatus } from '../api'
import { renderTemplate } from '../utils/templating'
import { TEMPLATES, type TemplateKey } from '../utils/templates'

export function NewPolicy({ token }: { token: string }) {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [owner, setOwner] = useState('')
  const [framework, setFramework] = useState<Framework>('GDPR')
  const [company, setCompany] = useState('')
  const [content, setContent] = useState('')
  const [note, setNote] = useState('Initial draft')
  const [autoGenerate, setAutoGenerate] = useState(false)
  const [genPrompt, setGenPrompt] = useState('')
  const [tplKey, setTplKey] = useState<TemplateKey | undefined>(undefined)
  const [contactEmail, setContactEmail] = useState('')
  const [dataProcessor, setDataProcessor] = useState('')
  const [dataRetentionMonths, setDataRetentionMonths] = useState('12')

  const create = useMutation({
    mutationFn: async () => {
      const res = await api.createPolicy(token, {
        name,
        owner,
        status: 'Draft' as PolicyStatus,
        framework,
        company: company || undefined,
        content: content || undefined,
      })
      const id = res.id
      if (autoGenerate) {
        try {
          await api.generateDraft(token, id, {
            prompt: genPrompt || undefined,
            variables: {
              company: company || undefined,
              owner: owner || undefined,
              contactEmail: contactEmail || undefined,
              dataProcessor: dataProcessor || undefined,
              dataRetentionMonths: dataRetentionMonths || undefined,
            },
          })
        } catch {}
      }
      navigate(`/policies/${id}`)
      return res
    },
  })

  function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name || !owner) return
    create.mutate()
  }

  return (
    <div>
      <div style={{ marginBottom: 12 }}>
        <button onClick={() => navigate('/policies')}>{'< Back'}</button>
      </div>
      <form onSubmit={onSubmit} style={{ display: 'grid', gap: 10 }}>
        <div style={{ fontWeight: 600 }}>New Policy</div>
        <label>
          <div>Name</div>
          <input value={name} onChange={e => setName(e.target.value)} required />
        </label>
        <label>
          <div>Owner</div>
          <input value={owner} onChange={e => setOwner(e.target.value)} required />
        </label>
        <label>
          <div>Framework</div>
          <select value={framework} onChange={e => setFramework(e.target.value as Framework)}>
            <option>GDPR</option>
            <option>HIPAA</option>
            <option>CCPA</option>
            <option>Other</option>
          </select>
        </label>
        <label>
          <div>Template</div>
          <select
            value={tplKey || ''}
            onChange={e => {
              const val = e.target.value
              setTplKey(val ? (val as TemplateKey) : undefined)
            }}
          >
            <option value="">None</option>
            {Object.entries(TEMPLATES).map(([k, v]) => (
              <option key={k} value={k}>{v.label}</option>
            ))}
          </select>
        </label>
        <label>
          <div>Company (optional)</div>
          <input value={company} onChange={e => setCompany(e.target.value)} />
        </label>
        {tplKey && (
          <>
            <label>
              <div>Contact Email (optional)</div>
              <input value={contactEmail} onChange={e => setContactEmail(e.target.value)} />
            </label>
            <label>
              <div>Vendor/Data Processor (optional)</div>
              <input value={dataProcessor} onChange={e => setDataProcessor(e.target.value)} />
            </label>
            <label>
              <div>Data Retention Months (optional)</div>
              <input value={dataRetentionMonths} onChange={e => setDataRetentionMonths(e.target.value)} />
            </label>
            <div>
              <button type="button" onClick={() => {
                const tplDef = tplKey ? TEMPLATES[tplKey] : undefined
                const rendered = tplDef ? renderTemplate(tplDef.content, {
                  company,
                  owner,
                  contactEmail,
                  dataProcessor,
                  dataRetentionMonths,
                } as any) : ''
                setContent(rendered)
                if (!genPrompt) setGenPrompt('Improve and expand the applied template to be organization-ready and compliant. Keep headings and structure.')
              }}>Use template</button>
            </div>
          </>
        )}
        <label>
          <div>Initial content (optional)</div>
          <textarea rows={6} value={content} onChange={e => setContent(e.target.value)} />
        </label>
        <label>
          <div>Change note (optional)</div>
          <input value={note} onChange={e => setNote(e.target.value)} placeholder="Describe the initial draft" />
        </label>
        <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <input type="checkbox" checked={autoGenerate} onChange={e => setAutoGenerate(e.target.checked)} />
          <span>Generate draft with AI after creation</span>
        </label>
        {autoGenerate && (
          <label>
            <div>Generation prompt (optional)</div>
            <textarea rows={4} value={genPrompt} onChange={e => setGenPrompt(e.target.value)} placeholder="Describe the policy context or constraints" />
          </label>
        )}
        <div>
          <button type="submit" disabled={create.isPending}>{create.isPending ? 'Creating…' : 'Create policy'}</button>
        </div>
      </form>
    </div>
  )
}
