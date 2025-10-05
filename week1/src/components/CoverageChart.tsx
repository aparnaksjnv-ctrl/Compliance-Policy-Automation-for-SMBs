import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine } from 'recharts'

export type CoveragePoint = { date: string; coverage: number }

const DEFAULT_DATA: CoveragePoint[] = [
  { date: 'Wk 1', coverage: 72 },
  { date: 'Wk 2', coverage: 74 },
  { date: 'Wk 3', coverage: 76 },
  { date: 'Wk 4', coverage: 78 },
  { date: 'Wk 5', coverage: 80 },
  { date: 'Wk 6', coverage: 83 },
  { date: 'Wk 7', coverage: 85 },
  { date: 'Wk 8', coverage: 87 },
]

export function CoverageChart({ data = DEFAULT_DATA }: { data?: CoveragePoint[] }) {
  return (
    <div style={{ width: '100%', height: 260 }}>
      <ResponsiveContainer>
        <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="coverageFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#22c55e" stopOpacity={0.35}/>
              <stop offset="100%" stopColor="#22c55e" stopOpacity={0.05}/>
            </linearGradient>
          </defs>
          <CartesianGrid stroke="#1f2937" strokeDasharray="3 3" />
          <XAxis dataKey="date" tick={{ fill: '#94a3b8', fontSize: 12 }} tickLine={false} axisLine={{ stroke: '#1f2937' }} />
          <YAxis domain={[0, 100]} tick={{ fill: '#94a3b8', fontSize: 12 }} tickFormatter={(v: number) => `${v}%`} tickLine={false} axisLine={{ stroke: '#1f2937' }} />
          <Tooltip contentStyle={{ background: '#0b1220', border: '1px solid #1f2937', borderRadius: 8 }} labelStyle={{ color: '#e5e7eb' }} formatter={(val: number) => [`${val}%`, 'Coverage']} />
          <ReferenceLine y={95} stroke="#f59e0b" strokeDasharray="4 4" />
          <Area type="monotone" dataKey="coverage" stroke="#22c55e" strokeWidth={2} fill="url(#coverageFill)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
