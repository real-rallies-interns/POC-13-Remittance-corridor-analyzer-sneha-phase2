'use client'
/**
 * PlayerBreakdownChart.tsx
 * Player Breakdown — Western Union, banks, fintechs.
 * Shows avg total cost per player type.
 */
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'

interface PlayerData {
  player_type:    string
  count:          number
  providers:      string[]
  avg_fee_pct:    number
  avg_fx_margin:  number
  avg_total_cost: number
  color:          string
}

const Tip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null
  const d = payload[0]?.payload as PlayerData
  return (
    <div className="glass p-3 text-xs min-w-[180px]">
      <p className="font-semibold mb-1.5" style={{ color: d?.color }}>{d?.player_type}</p>
      <div className="space-y-0.5">
        <div className="flex justify-between gap-4">
          <span className="text-rr-muted">Avg Fee %</span>
          <span className="font-mono text-rr-text">{d?.avg_fee_pct}%</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-rr-muted">Avg FX Margin</span>
          <span className="font-mono text-rr-amber">{d?.avg_fx_margin}%</span>
        </div>
        <div className="flex justify-between gap-4 pt-1 border-t border-rr-border mt-1">
          <span className="text-rr-text font-semibold">Total Cost</span>
          <span className="font-mono font-semibold" style={{ color: d?.color }}>{d?.avg_total_cost}%</span>
        </div>
        <div className="mt-1.5">
          <p className="text-rr-muted mb-0.5">Players ({d?.count}):</p>
          <p className="text-rr-text text-[10px]">{d?.providers?.join(', ')}</p>
        </div>
      </div>
    </div>
  )
}

export default function PlayerBreakdownChart({ data }: { data: PlayerData[] }) {
  if (!data?.length) return (
    <div className="h-full flex items-center justify-center text-rr-muted text-xs">
      No player data available
    </div>
  )

  return (
    <div className="h-full flex flex-col">
      <p className="text-[9px] text-rr-muted mb-2">Avg total cost % by player type (fee + FX margin)</p>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 4, right: 4, left: -18, bottom: 0 }}>
          <XAxis dataKey="player_type" tick={{ fill: '#64748B', fontSize: 8 }} tickLine={false} />
          <YAxis tick={{ fill: '#64748B', fontSize: 8 }} tickLine={false} tickFormatter={v => `${v}%`} />
          <Tooltip content={<Tip />} cursor={{ fill: 'rgba(56,189,248,0.04)' }} />
          <Bar dataKey="avg_total_cost" radius={[3,3,0,0]}>
            {data.map((d, i) => (
              <Cell key={i} fill={d.color} fillOpacity={0.85} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
