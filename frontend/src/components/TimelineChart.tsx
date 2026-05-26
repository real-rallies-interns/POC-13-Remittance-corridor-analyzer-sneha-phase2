'use client'
/**
 * TimelineChart.tsx — Temporal Archetype (core feature)
 * Monthly send/receive volume 2020–2024.
 * Year boundary reference lines make the time structure immediately readable.
 * Uses Recharts (protocol requirement).
 */
import { useMemo } from 'react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, ReferenceLine
} from 'recharts'
import type { TimelineRow } from '@/types'

interface Props {
  data:    TimelineRow[]
  channel: 'all' | 'formal' | 'informal'
}

export default function TimelineChart({ data, channel }: Props) {
  const chartData = useMemo(() => {
    const map = new Map<string, { 
      label: string; ym: string; 
      formal: number; informal: number; 
      formal_tx: number; informal_tx: number; 
      avg_tx_usd: number 
    }>()
    data.forEach(r => {
      if (!map.has(r.year_month)) map.set(r.year_month, { 
        label: r.label, ym: r.year_month, 
        formal: 0, informal: 0, 
        formal_tx: 0, informal_tx: 0, 
        avg_tx_usd: r.avg_tx_usd || 0 
      })
      const e = map.get(r.year_month)!
      if (r.channel === 'formal')   { e.formal   += r.volume_usd; e.formal_tx   += r.tx_count || 0 }
      if (r.channel === 'informal') { e.informal += r.volume_usd; e.informal_tx += r.tx_count || 0 }
    })
    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([, v]) => ({ ...v, formal: Math.round(v.formal / 1e6), informal: Math.round(v.informal / 1e6) }))
  }, [data])

  // Year boundaries for temporal readability
  const yearMarkers = useMemo(() => {
    const markers: { label: string; year: string }[] = []
    const years = ['2021', '2022', '2023', '2024']
    years.forEach(yr => {
      const entry = chartData.find(d => d.ym === `${yr}-01`)
      if (entry) markers.push({ label: entry.label, year: yr })
    })
    return markers
  }, [chartData])

  // COVID dip marker
  const covidLabel = useMemo(() => {
    const entry = chartData.find(d => d.ym === '2020-04')
    return entry?.label ?? null
  }, [chartData])

  const Tip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null
    const total = payload.reduce((s: number, p: any) => s + (p.value || 0), 0)
    const txCount = payload.reduce((s: number, p: any) => s + (p.payload?.[`${p.name}_tx`] || 0), 0)
    const avgTx = payload[0]?.payload?.avg_tx_usd
    return (
      <div className="glass p-3 text-xs min-w-[180px]">
        <p className="text-rr-muted mb-2 font-medium">{label}</p>
        {payload.map((p: any) => (
          <div key={p.name} className="flex justify-between gap-4 mb-0.5">
            <span style={{ color: p.color }}>{p.name}</span>
            <span className="font-mono text-rr-text">${p.value}M</span>
          </div>
        ))}
        <div className="flex justify-between gap-4 mt-1 pt-1 border-t border-rr-border">
          <span className="text-rr-muted">Total</span>
          <span className="font-mono text-rr-text font-semibold">${total}M</span>
        </div>
        {txCount > 0 && (
          <div className="flex justify-between gap-4 mt-0.5">
            <span className="text-rr-muted">Tx Count</span>
            <span className="font-mono text-rr-cyan">{txCount.toLocaleString()}</span>
          </div>
        )}
        {avgTx && (
          <div className="flex justify-between gap-4 mt-0.5">
            <span className="text-rr-muted">Avg Tx</span>
            <span className="font-mono text-rr-indigo">${avgTx}</span>
          </div>
        )}
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={chartData} margin={{ top: 4, right: 4, left: -18, bottom: 0 }}>
        <defs>
          <linearGradient id="gFormal" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor="#38BDF8" stopOpacity={0.35} />
            <stop offset="95%" stopColor="#38BDF8" stopOpacity={0}    />
          </linearGradient>
          <linearGradient id="gInformal" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor="#818CF8" stopOpacity={0.35} />
            <stop offset="95%" stopColor="#818CF8" stopOpacity={0}    />
          </linearGradient>
        </defs>

        <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" vertical={false} />
        <XAxis
          dataKey="label"
          tick={{ fill: '#64748B', fontSize: 9 }}
          tickLine={false}
          axisLine={false}
          interval={5}
        />
        <YAxis
          tick={{ fill: '#64748B', fontSize: 9 }}
          tickLine={false}
          axisLine={false}
          tickFormatter={v => `$${v}M`}
        />
        <Tooltip content={<Tip />} />
        <Legend wrapperStyle={{ fontSize: 10, color: '#64748B' }} />

        {/* Year boundary lines — essential for temporal archetype */}
        {yearMarkers.map(({ label, year }) => (
          <ReferenceLine
            key={year}
            x={label}
            stroke="#38BDF840"
            strokeWidth={1}
            label={{ value: year, fill: '#38BDF870', fontSize: 9, position: 'insideTopLeft' }}
          />
        ))}

        {/* COVID dip marker */}
        {covidLabel && (
          <ReferenceLine
            x={covidLabel}
            stroke="#F59E0B60"
            strokeDasharray="3 3"
            strokeWidth={1}
            label={{ value: 'COVID', fill: '#F59E0B90', fontSize: 8, position: 'insideTopRight' }}
          />
        )}

        {(channel === 'all' || channel === 'formal') && (
          <Area type="monotone" dataKey="formal" name="Formal"
            stroke="#38BDF8" strokeWidth={2} fill="url(#gFormal)"
            dot={false} activeDot={{ r: 3, fill: '#38BDF8' }} />
        )}
        {(channel === 'all' || channel === 'informal') && (
          <Area type="monotone" dataKey="informal" name="Informal"
            stroke="#818CF8" strokeWidth={2} fill="url(#gInformal)"
            dot={false} activeDot={{ r: 3, fill: '#818CF8' }} />
        )}
      </AreaChart>
    </ResponsiveContainer>
  )
}
