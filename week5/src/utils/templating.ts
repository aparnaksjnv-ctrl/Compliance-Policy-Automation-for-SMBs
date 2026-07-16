export function renderTemplate(src: string, vars: Record<string, string | undefined>) {
  let out = src
  for (const [k, v] of Object.entries(vars)) {
    const val = (v ?? '').toString()
    const re = new RegExp(`{{\s*${k}\s*}}`, 'gi')
    out = out.replace(re, val)
  }
  // remove any leftover placeholders
  out = out.replace(/{{\s*[^}]+\s*}}/g, '')
  return out
}
