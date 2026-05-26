'use client'
/**
 * ProviderChart.tsx
 * Provider fee benchmarking — intelligence layer shows vs regional average.
 * Uses Recharts (protocol requirement).
 *
 * FIX: ReferenceLine label `position` changed from 'insideTopRight' to
 *      'insideBottomRight' — 'insideTopRight' places the label outside the
 *      chart bounds when bars are short, making it invisible.
 */
import { useMemo } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, Cell, ReferenceLine, ResponsiveContainer } from 'recharts'
import type { Provider } from '@/types'

export default function ProviderChart({ providers }: { providers: Provider[] }) {
  const sorted = useMemo(() => [...providers].sort((a, b) => (a.fee_usd ?? 0) - (b.fee_usd ?? 0)), [providers])
  const avg    = sorted.reduce((s, p) => s + (p.fee_usd ?? 0), 0) / (sorted.length || 1)

  const Tip = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null
    const p: Provider = payload[0].payload
    return (
      <div className="glass p-3 text-xs min-w-[165px]">
        <p className="text-rr-cyan font-semibold mb-1.5">{p.name}</p>
        <div className="space-y-0.5 text-rr-muted">
          <div className="flex justify-between"><span>Type</span>     <span className="text-rr-text">{p.type}</span></div>
          <div className="flex justify-between"><span>Fee</span>      <span className="text-rr-text font-mono">${p.fee_usd?.toFixed(2)}</span></div>
          <div className="flex justify-between"><span>Received</span> <span className="text-rr-green font-mono">${p.net_received?.toFixed(2)}</span></div>
          <div className="flex justify-between"><span>Speed</span>    <span className="text-rr-text">{p.speed_hrs}h</span></div>
          <div className="flex justify-between"><span>Rating</span>   <span className="text-rr-amber">★ {p.rating}</span></div>
        </div>
        <p className="mt-1.5 text-[10px] font-medium" style={{ color: (p.vs_avg_pct ?? 0) <= 0 ? '#34D399' : '#F59E0B' }}>
          {p.vs_avg_label}
        </p>
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={sorted} margin={{ top: 4, right: 4, left: -18, bottom: 0 }}>
        <XAxis dataKey="name" tick={{ fill: '#64748B', fontSize: 9 }} tickLine={false} />
        <YAxis tick={{ fill: '#64748B', fontSize: 9 }} tickLine={false} tickFormatter={v => `$${v}`} />
        <Tooltip content={<Tip />} cursor={{ fill: 'rgba(56,189,248,0.04)' }} />
        <ReferenceLine y={avg} stroke="#818CF8" strokeDasharray="4 4"
          label={{ value: 'avg', fill: '#818CF8', fontSize: 9, position: 'insideBottomRight' }} />
        <Bar dataKey="fee_usd" radius={[3, 3, 0, 0]}>
          {sorted.map(p => (
            <Cell key={p.id} fill={(p.vs_avg_pct ?? 0) <= 0 ? '#38BDF8' : '#818CF8'} fillOpacity={0.85} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
