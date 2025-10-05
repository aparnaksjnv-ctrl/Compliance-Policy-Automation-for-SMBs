import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts'

type Item = { period: string; audits: number }

const DATA: Item[] = [
  { period: 'Oct', audits: 1 },
  { period: 'Nov', audits: 2 },
  { period: 'Dec', audits: 1 },
  { period: 'Jan', audits: 3 },
  { period: 'Feb', audits: 2 },
]

export function AuditTimeline() {
  return (
    <div style={{ width: '100%', height: 220 }}>
      <ResponsiveContainer>
        <BarChart data={DATA} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid stroke="#1f2937" strokeDasharray="3 3" />
          <XAxis dataKey="period" tick={{ fill: '#94a3b8', fontSize: 12 }} tickLine={false} axisLine={{ stroke: '#1f2937' }} />
          <YAxis allowDecimals={false} tick={{ fill: '#94a3b8', fontSize: 12 }} tickLine={false} axisLine={{ stroke: '#1f2937' }} />
          <Tooltip contentStyle={{ background: '#0b1220', border: '1px solid #1f2937', borderRadius: 8 }} labelStyle={{ color: '#e5e7eb' }} />
          <Bar dataKey="audits" fill="#22c55e" radius={[6,6,0,0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
