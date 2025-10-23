import { describe, it, expect } from 'vitest'
import { diffWords } from 'diff'

describe('diffWords', () => {
  it('marks added and removed words', () => {
    const before = 'We process personal data.'
    const after = 'We securely process personal and sensitive data.'
    const parts = diffWords(before, after)
    const text = parts.map(p => (p.added ? `[+${p.value}]` : p.removed ? `[-${p.value}]` : p.value)).join('')
    expect(text).toContain('[+securely ]')
    expect(text).toContain('[+and sensitive ]')
    expect(text).not.toContain('[-]')
  })
})
