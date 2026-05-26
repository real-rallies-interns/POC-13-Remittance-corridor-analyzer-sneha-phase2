'use client'
/**
 * CostIncomeChart.tsx
 * Cost vs Income Overlay — remittance fee % vs sender income level.
 * Scatter/bubble chart showing burden per corridor.
 */
import { ScatterChart, Scatter, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from 'recharts'

interface CostIncomeData {
  corridor_id:           string
  corridor_label:        string
  avg_cost_pct:          number
  sender_avg_income_usd: number
  fee_pct_of_income:     number
  burden_level:          string
  g20_compliant:         boolean
}

const burdenColor = (level: string) => {
  if (level === 'CRITICAL') return '#F87171'
  if (level === 'HIGH')     return '#FBBF24'
  if (level === 'MEDIUM')   return '#38BDF8'
  return '#34D399'
}

const Tip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null
  const d = payload[0]?.payload as CostIncomeData
  return (
    <div className="glass p-3 text-xs min-w-[180px]">
      <p className="text-rr-cyan font-semibold mb-1.5">{d?.corridor_label}</p>
      <div className="space-y-0.5">
        <div className="flex justify-between gap-4">
          <span className="text-rr-muted">Avg Transfer Cost</span>
          <span className="font-mono text-rr-text">{d?.avg_cost_pct}%</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-rr-muted">Sender Income</span>
          <span className="font-mono text-rr-text">${d?.sender_avg_income_usd?.toLocaleString()}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-rr-muted">Fee % of Income</span>
          <span className={`font-mono font-semibold`} style={{ color: burdenColor(d?.burden_level) }}>
            {d?.fee_pct_of_income}%
          </span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-rr-muted">Burden</span>
          <span className="font-mono font-semibold" style={{ color: burdenColor(d?.burden_level) }}>
            {d?.burden_level}
          </span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-rr-muted">G20 Target</span>
          <span className={`font-mono font-semibold ${d?.g20_compliant ? 'text-rr-green' : 'text-rr-amber'}`}>
            {d?.g20_compliant ? '✓ Compliant' : '✗ Above 5%'}
          </span>
        </div>
      </div>
    </div>
  )
}

export default function CostIncomeChart({ data }: { data: CostIncomeData[] }) {
  if (!data?.length) return (
    <div className="h-full flex items-center justify-center text-rr-muted text-xs">
      No data available
    </div>
  )

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center gap-3 mb-2 flex-wrap text-[9px]">
        {[
          { label: 'Critical', color: '#F87171' },
          { label: 'High',     color: '#FBBF24' },
          { label: 'Medium',   color: '#38BDF8' },
          { label: 'Low',      color: '#34D399' },
        ].map(b => (
          <div key={b.label} className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full" style={{ background: b.color }} />
            <span className="text-rr-muted">{b.label} burden</span>
          </div>
        ))}
      </div>
      <ResponsiveContainer width="100%" height="100%">
        <ScatterChart margin={{ top: 4, right: 8, left: -10, bottom: 0 }}>
          <XAxis
            dataKey="sender_avg_income_usd"
            name="Sender Income"
            tick={{ fill: '#64748B', fontSize: 8 }}
            tickLine={false}
            tickFormatter={v => `$${(v/1000).toFixed(0)}k`}
            label={{ value: 'Sender Income (USD)', fill: '#475569', fontSize: 8, position: 'insideBottom', offset: -2 }}
          />
          <YAxis
            dataKey="avg_cost_pct"
            name="Transfer Cost %"
            tick={{ fill: '#64748B', fontSize: 8 }}
            tickLine={false}
            tickFormatter={v => `${v}%`}
          />
          <Tooltip content={<Tip />} cursor={{ strokeDasharray: '3 3', stroke: '#1F2937' }} />
          <ReferenceLine y={5} stroke="#FBBF24" strokeDasharray="4 4"
            label={{ value: 'G20 5% target', fill: '#FBBF24', fontSize: 8, position: 'insideTopRight' }} />
          <Scatter data={data} fill="#38BDF8">
            {data.map((d, i) => (
              <Cell key={i} fill={burdenColor(d.burden_level)} fillOpacity={0.85} />
            ))}
          </Scatter>
        </ScatterChart>
      </ResponsiveContainer>
      <p className="text-[9px] text-rr-muted text-center mt-1">
        Each dot = one corridor · Size reflects volume · Y-axis = transfer cost %
      </p>
    </div>
  )
}