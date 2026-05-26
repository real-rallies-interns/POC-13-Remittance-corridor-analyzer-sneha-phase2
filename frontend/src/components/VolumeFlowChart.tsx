'use client'
/**
 * VolumeFlowChart.tsx
 * Volume Flow Tracker — total corridor volume ranked.
 * Horizontal bar chart sorted by volume.
 */
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from 'recharts'

interface FlowData {
  corridor_id:      string
  corridor_label:   string
  volume_bn_usd:    number
  volume_share_pct: number
  avg_cost_pct:     number
  trend:            string
  formal_bn:        number
  informal_bn:      number
}

const trendColor = (trend: string) => {
  if (trend === 'up')   return '#34D399'
  if (trend === 'down') return '#F87171'
  return '#94A3B8'
}

const Tip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null
  const d = payload[0]?.payload as FlowData
  return (
    <div className="glass p-3 text-xs min-w-[190px]">
      <p className="text-rr-cyan font-semibold mb-1.5">{d?.corridor_label}</p>
      <div className="space-y-0.5">
        <div className="flex justify-between gap-4">
          <span className="text-rr-muted">Total Volume</span>
          <span className="font-mono text-rr-text font-semibold">${d?.volume_bn_usd}B</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-rr-muted">Global Share</span>
          <span className="font-mono text-rr-cyan">{d?.volume_share_pct}%</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-rr-muted">Formal</span>
          <span className="font-mono text-rr-green">${d?.formal_bn}B</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-rr-muted">Informal</span>
          <span className="font-mono text-rr-amber">${d?.informal_bn}B</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-rr-muted">Avg Cost</span>
          <span className={`font-mono ${d?.avg_cost_pct > 5 ? 'text-rr-amber' : 'text-rr-green'}`}>
            {d?.avg_cost_pct}%
          </span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-rr-muted">Trend</span>
          <span className="font-mono font-semibold" style={{ color: trendColor(d?.trend) }}>
            {d?.trend === 'up' ? '↑ Growing' : d?.trend === 'down' ? '↓ Declining' : '→ Flat'}
          </span>
        </div>
      </div>
    </div>
  )
}

export default function VolumeFlowChart({ data, totalBn }: { data: FlowData[], totalBn: number }) {
  if (!data?.length) return (
    <div className="h-full flex items-center justify-center text-rr-muted text-xs">
      No flow data available
    </div>
  )

  // Show top 8 for readability in sidebar
  const top8 = data.slice(0, 8)

  return (
    <div className="h-full flex flex-col">
      <div className="flex justify-between items-center mb-2">
        <p className="text-[9px] text-rr-muted">Top corridors by volume</p>
        <p className="text-[9px] font-mono text-rr-cyan font-semibold">
          Total: ${totalBn}B
        </p>
      </div>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={top8}
          layout="vertical"
          margin={{ top: 4, right: 8, left: 4, bottom: 0 }}
        >
          <XAxis
            type="number"
            tick={{ fill: '#64748B', fontSize: 8 }}
            tickLine={false}
            tickFormatter={v => `$${v}B`}
          />
          <YAxis
            type="category"
            dataKey="corridor_id"
            tick={{ fill: '#64748B', fontSize: 7.5 }}
            tickLine={false}
            width={52}
          />
          <Tooltip content={<Tip />} cursor={{ fill: 'rgba(56,189,248,0.04)' }} />
          <Bar dataKey="volume_bn_usd" radius={[0,3,3,0]}>
            {top8.map((d, i) => (
              <Cell
                key={i}
                fill={d.avg_cost_pct > 5 ? '#FBBF24' : '#38BDF8'}
                fillOpacity={0.85}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <p className="text-[9px] text-rr-muted text-center mt-1">
        Cyan = G20 compliant · Amber = above 5% target
      </p>
    </div>
  )
}