export async function exportElementToPdf(el: HTMLElement, filename: string) {
  if (!el) return
  const mod: any = await import('html2pdf.js')
  const html2pdf = mod.default || mod
  const opt = {
    margin:       10,
    filename:     filename || 'export.pdf',
    image:        { type: 'jpeg', quality: 0.98 },
    html2canvas:  { scale: 2, useCORS: true, backgroundColor: '#0f172a' },
    jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' },
    pagebreak:    { mode: ['avoid-all', 'css', 'legacy'] },
  }
  await html2pdf().set(opt).from(el).save()
}
