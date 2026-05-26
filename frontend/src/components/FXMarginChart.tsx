'use client'
/**
 * FXMarginChart.tsx
 * FX Margin Visualizer — hidden spread vs advertised fee.
 * Stacked bar: advertised fee (bottom) + hidden FX spread (top)
 */
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts'

interface FXData {
  provider:        string
  advertised_fee:  number
  hidden_spread:   number
  true_cost:       number
  fx_margin_pct:   number
  transparency:    string
  player_type:     string
}

const Tip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  const d = payload[0]?.payload as FXData
  return (
    <div className="glass p-3 text-xs min-w-[180px]">
      <p className="text-rr-cyan font-semibold mb-1.5">{label}</p>
      <div className="space-y-0.5">
        <div className="flex justify-between gap-4">
          <span className="text-rr-green">Advertised Fee</span>
          <span className="font-mono text-rr-text">${d?.advertised_fee?.toFixed(2)}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-rr-amber">Hidden FX Spread</span>
          <span className="font-mono text-rr-amber">${d?.hidden_spread?.toFixed(2)}</span>
        </div>
        <div className="flex justify-between gap-4 pt-1 border-t border-rr-border mt-1">
          <span className="text-rr-text font-semibold">True Cost</span>
          <span className="font-mono text-rr-red font-semibold">${d?.true_cost?.toFixed(2)}</span>
        </div>
        <div className="flex justify-between gap-4 mt-1">
          <span className="text-rr-muted">FX Margin</span>
          <span className="font-mono text-rr-muted">{d?.fx_margin_pct}%</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-rr-muted">Transparency</span>
          <span className={`font-mono font-semibold ${
            d?.transparency === 'HIGH' ? 'text-rr-green' :
            d?.transparency === 'MEDIUM' ? 'text-rr-amber' : 'text-rr-red'
          }`}>{d?.transparency}</span>
        </div>
      </div>
    </div>
  )
}

export default function FXMarginChart({ data }: { data: FXData[] }) {
  if (!data?.length) return (
    <div className="h-full flex items-center justify-center text-rr-muted text-xs">
      No FX data available
    </div>
  )

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center gap-3 mb-2 text-[9px]">
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-sm bg-rr-green" />
          <span className="text-rr-muted">Advertised Fee</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-sm bg-rr-amber" />
          <span className="text-rr-muted">Hidden FX Spread</span>
        </div>
      </div>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 4, right: 4, left: -18, bottom: 0 }}>
          <XAxis dataKey="provider" tick={{ fill: '#64748B', fontSize: 8 }} tickLine={false} />
          <YAxis tick={{ fill: '#64748B', fontSize: 8 }} tickLine={false} tickFormatter={v => `$${v}`} />
          <Tooltip content={<Tip />} cursor={{ fill: 'rgba(56,189,248,0.04)' }} />
          <Bar dataKey="advertised_fee" stackId="a" fill="#34D399" radius={[0,0,0,0]} name="Advertised Fee" />
          <Bar dataKey="hidden_spread"  stackId="a" fill="#FBBF24" radius={[3,3,0,0]} name="Hidden Spread" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
