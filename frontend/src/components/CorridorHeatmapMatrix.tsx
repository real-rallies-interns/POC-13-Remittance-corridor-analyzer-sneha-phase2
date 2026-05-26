'use client'
/**
 * CorridorHeatmapMatrix.tsx
 * Seaborn-style heatmap matrix for Remittance Corridor Analyzer
 *
 * Rows    = Corridors (15)
 * Columns = Metrics (Cost%, Volume, Formal%, Informal%, Speed, Rating)
 * Cells   = Colour-coded by value intensity + number inside
 */

import { useMemo } from 'react'
import type { Corridor } from '@/types'

interface Props {
  corridors:   Corridor[]
  selectedId?: string
  onSelect?:   (id: string) => void
}

// Metrics definition
const METRICS = [
  { key: 'avg_cost_pct',   label: 'Cost %',    unit: '%',  invert: true  },  // lower = better (green)
  { key: 'volume_bn_usd',  label: 'Volume $B', unit: 'B',  invert: false },  // higher = better
  { key: 'formal_pct',     label: 'Formal %',  unit: '%',  invert: false },  // higher = better
  { key: 'informal_pct',   label: 'Informal%', unit: '%',  invert: true  },  // lower = better
  { key: 'g20_gap',        label: 'G20 Gap',   unit: '%',  invert: true  },  // lower = better
  { key: 'heat_intensity', label: 'Heat',      unit: '',   invert: false },  // higher = more volume
]

// Compute derived values per corridor
function enrichCorridor(c: Corridor) {
  return {
    ...c,
    formal_pct:     +(c.formal   * 100).toFixed(1),
    informal_pct:   +(c.informal * 100).toFixed(1),
    g20_gap:        +(Math.max(0, c.avg_cost_pct - 5)).toFixed(1),
    heat_intensity: (c as any).heat_intensity ?? 0.3,
  }
}

// Normalise value 0→1 across all corridors for a metric
function normalise(val: number, min: number, max: number, invert: boolean): number {
  if (max === min) return 0.5
  const n = (val - min) / (max - min)
  return invert ? 1 - n : n
}

// Cell colour — dark teal → red spectrum (Seaborn-like on dark bg)
function cellColor(norm: number): string {
  // 0 = dark/cool  →  1 = bright/warm
  const stops = [
    { t: 0.0,  r: 10,  g: 30,  b: 35  },   // deep teal (low)
    { t: 0.25, r: 30,  g: 80,  b: 90  },   // teal
    { t: 0.5,  r: 180, g: 80,  b: 50  },   // orange-red mid
    { t: 0.75, r: 220, g: 60,  b: 40  },   // red
    { t: 1.0,  r: 240, g: 20,  b: 20  },   // bright red (high)
  ]
  let lo = stops[0], hi = stops[stops.length - 1]
  for (let i = 0; i < stops.length - 1; i++) {
    if (norm >= stops[i].t && norm <= stops[i+1].t) {
      lo = stops[i]; hi = stops[i+1]; break
    }
  }
  const range = hi.t - lo.t || 1
  const t2    = (norm - lo.t) / range
  const r     = Math.round(lo.r + (hi.r - lo.r) * t2)
  const g     = Math.round(lo.g + (hi.g - lo.g) * t2)
  const b     = Math.round(lo.b + (hi.b - lo.b) * t2)
  return `rgb(${r},${g},${b})`
}

// Text colour for readability on cell bg
function textColor(norm: number): string {
  return norm > 0.45 ? '#FFFFFF' : '#94A3B8'
}

export default function CorridorHeatmapMatrix({ corridors, selectedId, onSelect }: Props) {
  const enriched = useMemo(() => corridors.map(enrichCorridor), [corridors])

  // Compute min/max per metric
  const ranges = useMemo(() => {
    return METRICS.map(m => {
      const vals = enriched.map(c => (c as any)[m.key] ?? 0)
      return { min: Math.min(...vals), max: Math.max(...vals) }
    })
  }, [enriched])

  if (!corridors.length) return (
    <div className="flex items-center justify-center h-full text-rr-muted text-xs">
      No corridor data
    </div>
  )

  return (
    <div className="w-full h-full flex flex-col overflow-auto p-2">

      {/* Title */}
      <div className="mb-3 flex items-center justify-between shrink-0">
        <div>
          <p className="text-[10px] font-mono text-rr-muted uppercase tracking-widest">
            Corridor Intelligence Matrix
          </p>
          <p className="text-rr-text text-xs font-medium mt-0.5">
            15 Corridors × 6 Metrics — Seaborn Heatmap
          </p>
        </div>
        {/* Colour scale legend */}
        <div className="flex items-center gap-2 text-[9px] text-rr-muted font-mono">
          <span>Low</span>
          <div className="flex">
            {[0, 0.2, 0.4, 0.6, 0.8, 1.0].map(n => (
              <div key={n} className="w-5 h-3" style={{ background: cellColor(n) }} />
            ))}
          </div>
          <span>High</span>
        </div>
      </div>

      {/* Matrix table */}
      <div className="overflow-auto flex-1">
        <table className="w-full border-collapse text-xs" style={{ minWidth: '580px' }}>

          {/* Column headers */}
          <thead>
            <tr>
              {/* Row label header */}
              <th className="text-left py-2 pr-3 text-[9px] font-mono text-rr-muted uppercase tracking-widest"
                style={{ width: '130px', minWidth: '130px' }}>
                Corridor
              </th>
              {METRICS.map(m => (
                <th key={m.key}
                  className="text-center py-2 px-1 text-[9px] font-mono text-rr-muted uppercase tracking-widest"
                  style={{ minWidth: '68px' }}>
                  {m.label}
                  {m.invert && (
                    <span className="ml-0.5 text-rr-green" title="Lower is better">↓</span>
                  )}
                </th>
              ))}
            </tr>
          </thead>

          {/* Data rows */}
          <tbody>
            {enriched.map((c, ri) => {
              const isSelected = c.id === selectedId
              return (
                <tr
                  key={c.id}
                  onClick={() => onSelect?.(c.id)}
                  className="cursor-pointer transition-all duration-150"
                  style={{
                    outline: isSelected ? '1px solid #10F5C8' : undefined,
                    outlineOffset: '-1px',
                  }}>

                  {/* Row label */}
                  <td className="py-0.5 pr-3"
                    style={{
                      borderRight: '1px solid #0E2A2F',
                    }}>
                    <div className="flex items-center gap-1.5">
                      {isSelected && (
                        <div className="w-1.5 h-1.5 rounded-full bg-rr-cyan shrink-0" />
                      )}
                      <span className={`text-[10px] font-medium truncate ${
                        isSelected ? 'text-rr-cyan' : 'text-rr-text'
                      }`}>
                        {c.label}
                      </span>
                    </div>
                    <p className="text-[8px] text-rr-muted font-mono ml-3">{c.id}</p>
                  </td>

                  {/* Metric cells */}
                  {METRICS.map((m, mi) => {
                    const raw  = (c as any)[m.key] ?? 0
                    const norm = normalise(raw, ranges[mi].min, ranges[mi].max, m.invert)
                    const bg   = cellColor(norm)
                    const fg   = textColor(norm)

                    // Format display value
                    let display = ''
                    if (m.key === 'volume_bn_usd') display = `$${raw}`
                    else if (m.key === 'heat_intensity') display = `${Math.round(raw * 100)}`
                    else display = `${raw}${m.unit}`

                    return (
                      <td key={m.key} className="py-0.5 px-0.5 text-center">
                        <div
                          className="flex items-center justify-center rounded font-mono font-semibold transition-all duration-200"
                          style={{
                            background: bg,
                            color: fg,
                            fontSize: '10px',
                            height: '32px',
                            minWidth: '60px',
                            border: isSelected ? '1px solid rgba(16,245,200,0.4)' : '1px solid transparent',
                          }}>
                          {display}
                        </div>
                      </td>
                    )
                  })}
                </tr>
              )
            })}
          </tbody>
        </table>

        {/* Footer note */}
        <div className="mt-3 flex items-center gap-4 text-[9px] text-rr-muted font-mono">
          <span>↓ = Lower is better</span>
          <span>·</span>
          <span>Data: World Bank RPW · ECB · Synthetic</span>
          <span>·</span>
          <span>Click row to select corridor</span>
        </div>
      </div>
    </div>
  )
}