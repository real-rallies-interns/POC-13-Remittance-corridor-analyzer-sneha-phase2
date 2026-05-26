/**
 * api.ts – Reusable data adapters
 *
 * DATA FLOW (per protocol):
 *   1. Call FastAPI backend (which calls World Bank / ECB live APIs)
 *   2. FastAPI auto-falls back to mock_data.json if live APIs fail
 *   3. Frontend also has its own mock fallback if FastAPI itself is offline
 *
 * NEW ENDPOINTS (v4.0):
 *   - getHeatmap()           → Corridor Heatmap data
 *   - getCostIncomeOverlay() → Cost vs Income Overlay
 *   - getPlayerBreakdown()   → Player Breakdown (Fintech/MTO/Bank)
 *   - getFXMargin()          → FX Margin Visualizer
 *   - getVolumeFlow()        → Volume Flow Tracker
 */

import type { Corridor, Provider, TimelineRow, ChannelRow, GovernanceData } from '@/types'
import MOCK from '@/data/mock_data.json'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

// ── Safe fetch — falls back to mock if backend offline ───────────────────────
async function safeFetch<T>(url: string, fallback: T): Promise<T> {
  try {
    const res = await fetch(url, { cache: 'no-store' })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return await res.json()
  } catch {
    console.warn(`[RealRails] Backend offline — frontend mock active for: ${url}`)
    return fallback
  }
}

// ── Frontend mock helpers ─────────────────────────────────────────────────────

function mockTimeline(corridorId?: string): TimelineRow[] {
  const M = ['','Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  const rows: TimelineRow[] = []
  const list = corridorId
    ? (MOCK.corridors as Corridor[]).filter(c => c.id === corridorId)
    : (MOCK.corridors as Corridor[])
  list.forEach(c => {
    const base = c.volume_bn_usd * 1e9 / 12
    for (let y = 2020; y <= 2024; y++) {
      for (let m = 1; m <= 12; m++) {
        if (y === 2024 && m > 6) break
        const vol = base * (1 + (y-2020)*0.045) * (1 + 0.15*Math.sin((m-11)*Math.PI/6))
        ;(['formal','informal'] as const).forEach(ch => {
          rows.push({
            year_month: `${y}-${String(m).padStart(2,'0')}`,
            label:      `${M[m]} '${String(y).slice(2)}`,
            channel:    ch,
            volume_usd: Math.round(vol * c[ch]),
            tx_count:   Math.round(vol * c[ch] / 280),
            avg_tx_usd: 265,
          })
        })
      }
    }
  })
  return rows
}

function mockProviders(amount: number, corridorId?: string): Provider[] {
  const allProviders = MOCK.providers as any[]
  const filtered = corridorId
    ? allProviders.filter((p: any) => p.corridor_id === corridorId)
    : allProviders
  const list = (filtered.length > 0 ? filtered : allProviders).map(p => ({
    ...p,
    fee_usd:      +(p.fee_pct / 100 * amount + p.fee_flat).toFixed(2),
    net_received: +(amount - (p.fee_pct / 100 * amount + p.fee_flat)).toFixed(2),
  }))
  const avg = list.reduce((s, p) => s + (p.fee_usd ?? 0), 0) / list.length
  return list
    .map(p => {
      const d = +(((p.fee_usd! - avg) / avg) * 100).toFixed(1)
      return { ...p, vs_avg_pct: d, vs_avg_label: `${Math.abs(d).toFixed(1)}% ${d > 0 ? 'above' : 'below'} regional avg` }
    })
    .sort((a, b) => (a.fee_usd ?? 0) - (b.fee_usd ?? 0))
}

function mockChannels(corridorId?: string): ChannelRow[] {
  const list = corridorId
    ? (MOCK.corridors as Corridor[]).filter(c => c.id === corridorId)
    : (MOCK.corridors as Corridor[])
  return list.map(c => ({
    corridor_id:    c.id,
    corridor_label: c.label,
    formal_bn:      +(c.volume_bn_usd * c.formal).toFixed(2),
    informal_bn:    +(c.volume_bn_usd * c.informal).toFixed(2),
    formal_pct:     +(c.formal * 100).toFixed(1),
    informal_pct:   +(c.informal * 100).toFixed(1),
    hawala_risk:    (c.informal > 0.35 ? 'HIGH' : c.informal > 0.2 ? 'MEDIUM' : 'LOW') as 'HIGH'|'MEDIUM'|'LOW',
    g20_compliant:  c.avg_cost_pct <= 5,
  }))
}

// ── Mock fallbacks for new features ──────────────────────────────────────────

function mockHeatmap() {
  return (MOCK.corridors as any[]).map(c => ({
    corridor_id:    c.id,
    corridor_label: c.label,
    from_name:      c.from_name,
    to_name:        c.to_name,
    from_lat:       c.from_lat,
    from_lng:       c.from_lng,
    to_lat:         c.to_lat,
    to_lng:         c.to_lng,
    volume_bn_usd:  c.volume_bn_usd,
    heat_intensity: c.heat_intensity ?? 0.5,
    avg_cost_pct:   c.avg_cost_pct,
    heat_color:     c.heat_intensity >= 0.8 ? '#F87171' :
                    c.heat_intensity >= 0.6 ? '#FBBF24' :
                    c.heat_intensity >= 0.4 ? '#38BDF8' : '#818CF8',
  }))
}

function mockCostIncome() {
  return (MOCK.corridors as any[]).map(c => ({
    corridor_id:           c.id,
    corridor_label:        c.label,
    avg_cost_pct:          c.avg_cost_pct,
    sender_avg_income_usd: c.sender_avg_income_usd ?? 35000,
    fee_pct_of_income:     c.fee_pct_of_income ?? 10,
    g20_compliant:         c.avg_cost_pct <= 5,
    income_bracket:        c.sender_avg_income_usd >= 50000 ? 'High Income' :
                           c.sender_avg_income_usd >= 35000 ? 'Middle Income' : 'Lower Income',
    burden_level:          c.fee_pct_of_income >= 15 ? 'CRITICAL' :
                           c.fee_pct_of_income >= 10 ? 'HIGH' :
                           c.fee_pct_of_income >= 5  ? 'MEDIUM' : 'LOW',
  }))
}

function mockPlayerBreakdown(corridorId?: string) {
  const allProviders = MOCK.providers as any[]
  const providers = corridorId
    ? allProviders.filter(p => p.corridor_id === corridorId)
    : allProviders

  const groups: Record<string, any> = {}
  providers.forEach(p => {
    const pt = p.player_type ?? 'Other'
    if (!groups[pt]) groups[pt] = { player_type: pt, providers: [], fees: [], margins: [] }
    groups[pt].providers.push(p.name)
    groups[pt].fees.push(p.fee_pct)
    groups[pt].margins.push(p.fx_margin ?? 1.5)
  })

  const colors: Record<string,string> = {
    'Fintech': '#38BDF8', 'Traditional MTO': '#818CF8',
    'Bank': '#34D399', 'Mobile Money': '#FBBF24',
  }

  return {
    breakdown: Object.values(groups).map((g: any) => ({
      player_type:    g.player_type,
      count:          g.providers.length,
      providers:      [...new Set(g.providers)],
      avg_fee_pct:    +(g.fees.reduce((a:number,b:number)=>a+b,0)/g.fees.length).toFixed(2),
      avg_fx_margin:  +(g.margins.reduce((a:number,b:number)=>a+b,0)/g.margins.length).toFixed(2),
      avg_total_cost: +(
        g.fees.reduce((a:number,b:number)=>a+b,0)/g.fees.length +
        g.margins.reduce((a:number,b:number)=>a+b,0)/g.margins.length
      ).toFixed(2),
      color: colors[g.player_type] ?? '#94A3B8',
    })),
    categories: (MOCK as any).player_categories ?? [],
  }
}

function mockFXMargin(amount: number, corridorId?: string) {
  const allProviders = MOCK.providers as any[]
  const providers = corridorId
    ? allProviders.filter(p => p.corridor_id === corridorId)
    : allProviders

  return providers.map(p => {
    const fx_margin     = p.fx_margin ?? 1.5
    const advertised    = +(p.fee_pct / 100 * amount + p.fee_flat).toFixed(2)
    const hidden        = +(fx_margin / 100 * amount).toFixed(2)
    return {
      provider:         p.name,
      player_type:      p.player_type ?? 'Other',
      advertised_fee:   advertised,
      hidden_spread:    hidden,
      true_cost:        +(advertised + hidden).toFixed(2),
      fx_margin_pct:    fx_margin,
      transparency:     fx_margin < 0.8 ? 'HIGH' : fx_margin < 2.0 ? 'MEDIUM' : 'LOW',
      advertised_label: p.advertised_fee_label ?? 'Standard fee',
      data_type:        'synthetic_fx_margin',
    }
  }).sort((a:any,b:any) => a.true_cost - b.true_cost)
}

function mockVolumeFlow() {
  const corridors = MOCK.corridors as any[]
  const total = corridors.reduce((s, c) => s + c.volume_bn_usd, 0)
  return {
    flows: corridors
      .map(c => ({
        corridor_id:      c.id,
        corridor_label:   c.label,
        from_name:        c.from_name,
        to_name:          c.to_name,
        volume_bn_usd:    c.volume_bn_usd,
        volume_share_pct: +(c.volume_bn_usd / total * 100).toFixed(1),
        avg_cost_pct:     c.avg_cost_pct,
        trend:            c.trend,
        formal_bn:        +(c.volume_bn_usd * c.formal).toFixed(2),
        informal_bn:      +(c.volume_bn_usd * c.informal).toFixed(2),
      }))
      .sort((a,b) => b.volume_bn_usd - a.volume_bn_usd),
    total_bn_usd:    +total.toFixed(1),
    corridor_count:  corridors.length,
    data_source:     'World Bank RPW + Synthetic estimates',
  }
}

// ── Existing exported API functions ──────────────────────────────────────────

export async function getCorridors(): Promise<{ corridors: Corridor[]; dataSource: string }> {
  const d = await safeFetch<{ corridors: Corridor[]; data_source: string }>(
    `${API}/api/corridors`,
    { corridors: MOCK.corridors as Corridor[], data_source: 'frontend_mock' }
  )
  return { corridors: d.corridors, dataSource: d.data_source }
}

export async function getTimeline(corridorId?: string): Promise<TimelineRow[]> {
  const url = `${API}/api/timeline${corridorId ? `?corridor=${corridorId}` : ''}`
  return safeFetch(url, mockTimeline(corridorId))
}

export async function getCostAnalysis(amount: number, corridorId?: string): Promise<Provider[]> {
  const url = `${API}/api/cost-analysis?amount=${amount}${corridorId ? `&corridor=${corridorId}` : ''}`
  return safeFetch(url, mockProviders(amount, corridorId))
}

export async function getChannelComparison(corridorId?: string): Promise<ChannelRow[]> {
  const url = `${API}/api/informal-vs-formal${corridorId ? `?corridor=${corridorId}` : ''}`
  return safeFetch(url, mockChannels(corridorId))
}

export async function getGovernance(): Promise<GovernanceData> {
  try {
    const res = await fetch(`${API}/api/governance`, { cache: 'no-store' })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const data = await res.json()
    const gov = data?.governance ?? data
    if (!gov?.regulators) throw new Error('Missing regulators')
    return gov as GovernanceData
  } catch {
    console.warn('[RealRails] Governance API offline — using mock')
    const fallback = MOCK.governance as GovernanceData
    return {
      regulators:          fallback?.regulators          ?? [],
      swift_coverage_pct:  fallback?.swift_coverage_pct  ?? 92,
      avg_settlement_days: fallback?.avg_settlement_days ?? 1.4,
    }
  }
}

export async function getFxRates(): Promise<Record<string, { rate_vs_eur: number; source: string }>> {
  const d = await safeFetch<{ rates: Record<string, { rate_vs_eur: number; source: string }> }>(
    `${API}/api/fx-rates`,
    {
      rates: {
        GBP: { rate_vs_eur: 0.856, source: 'frontend_mock' },
        MXN: { rate_vs_eur: 18.2,  source: 'frontend_mock' },
        INR: { rate_vs_eur: 89.5,  source: 'frontend_mock' },
        NGN: { rate_vs_eur: 1620,  source: 'frontend_mock' },
        PHP: { rate_vs_eur: 61.3,  source: 'frontend_mock' },
        PKR: { rate_vs_eur: 298.0, source: 'frontend_mock' },
        AED: { rate_vs_eur: 3.92,  source: 'frontend_mock' },
      }
    }
  )
  return d.rates
}

// ── NEW exported API functions (v4.0) ─────────────────────────────────────────

export async function getHeatmap() {
  return safeFetch(`${API}/api/heatmap`, mockHeatmap())
}

export async function getCostIncomeOverlay() {
  return safeFetch(`${API}/api/cost-income-overlay`, mockCostIncome())
}

export async function getPlayerBreakdown(corridorId?: string) {
  const url = `${API}/api/player-breakdown${corridorId ? `?corridor=${corridorId}` : ''}`
  return safeFetch(url, mockPlayerBreakdown(corridorId))
}

export async function getFXMargin(amount: number, corridorId?: string) {
  const url = `${API}/api/fx-margin?amount=${amount}${corridorId ? `&corridor=${corridorId}` : ''}`
  return safeFetch(url, mockFXMargin(amount, corridorId))
}

export async function getVolumeFlow() {
  return safeFetch(`${API}/api/volume-flow`, mockVolumeFlow())
}
