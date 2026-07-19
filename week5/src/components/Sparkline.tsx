import React from 'react'

export function Sparkline({ data, width = 100, height = 28, stroke = '#22c55e' }: { data: number[]; width?: number; height?: number; stroke?: string }) {
  const max = Math.max(1, ...data)
  const min = Math.min(0, ...data)
  const rng = Math.max(1, max - min)
  const step = data.length > 1 ? width / (data.length - 1) : width
  const pts = data.map((v, i) => {
    const x = i * step
    const y = height - ((v - min) / rng) * height
    return `${x},${y}`
  }).join(' ')
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden>
      <polyline fill="none" stroke={stroke} strokeWidth="2" points={pts} />
    </svg>
  )
}
