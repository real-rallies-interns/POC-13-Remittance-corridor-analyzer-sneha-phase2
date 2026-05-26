'use client'
/**
 * Sidebar.tsx — Intelligence Panel (Slide-Over)
 * Cinematic Rail Brief — v4.1
 * Now renders as a full slide-over panel with Financial Rail Deep DNA bg
 *
 * Section A: Title & High-level Metric
 * Section B: Why This Matters
 * Section C: Who Controls the Rail
 * Section D: Functional Filters & Analysis (5 tabs)
 * Section E: Download Sample Data
 */
import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import type { Corridor, Provider, TimelineRow, ChannelRow, GovernanceData } from '@/types'
import {
  getTimeline, getCostAnalysis, getChannelComparison,
  getGovernance, getPlayerBreakdown, getFXMargin, getVolumeFlow
} from '@/lib/api'
import {
  Info, Shield, SlidersHorizontal, Download, Zap,
  Globe, TrendingUp, TrendingDown, Minus,
  AlertTriangle, CheckCircle, BarChart2, DollarSign
} from 'lucide-react'

const TimelineChart        = dynamic(() => import('./TimelineChart'),        { ssr: false })
const ProviderChart        = dynamic(() => import('./ProviderChart'),         { ssr: false })
const FXMarginChart        = dynamic(() => import('./FXMarginChart'),         { ssr: false })
const PlayerBreakdownChart = dynamic(() => import('./PlayerBreakdownChart'),  { ssr: false })
const VolumeFlowChart      = dynamic(() => import('./VolumeFlowChart'),       { ssr: false })

interface Props {
  corridor:           Corridor | undefined
  channel:            'all' | 'formal' | 'informal'
  sendAmount:         number
  onChannelChange:    (v: 'all' | 'formal' | 'informal') => void
  onSendAmountChange: (v: number) => void
}

const RECEIVING_COUNTRY_WAGES: Record<string, { hourlyUSD: number; label: string }> = {
  'US-MX':  { hourlyUSD: 0.93,  label: 'Mexico'         },
  'US-IN':  { hourlyUSD: 0.28,  label: 'India'          },
  'UK-NG':  { hourlyUSD: 0.21,  label: 'Nigeria'        },
  'EU-PH':  { hourlyUSD: 0.95,  label: 'Philippines'    },
  'UAE-PK': { hourlyUSD: 0.18,  label: 'Pakistan'       },
  'US-PH':  { hourlyUSD: 0.95,  label: 'Philippines'    },
  'UAE-IN': { hourlyUSD: 0.28,  label: 'India (Kerala)' },
  'US-CN':  { hourlyUSD: 1.20,  label: 'China'          },
  'FR-MA':  { hourlyUSD: 0.45,  label: 'Morocco'        },
  'US-DO':  { hourlyUSD: 0.80,  label: 'Dominican Rep.' },
  'UK-IN':  { hourlyUSD: 0.28,  label: 'India'          },
  'CA-IN':  { hourlyUSD: 0.28,  label: 'India'          },
  'AU-IN':  { hourlyUSD: 0.28,  label: 'India'          },
  'IT-RO':  { hourlyUSD: 1.50,  label: 'Romania'        },
  'ES-EC':  { hourlyUSD: 0.55,  label: 'Ecuador'        },
}

function calcHumanCost(corridorId: string, feeUSD: number): string | null {
  const w = RECEIVING_COUNTRY_WAGES[corridorId]
  if (!w || !feeUSD || feeUSD <= 0) return null
  const hours = feeUSD / w.hourlyUSD
  if (hours < 1)  return `This fee = ${Math.round(hours * 60)} mins of work at ${w.label} min. wage`
  if (hours < 8)  return `This fee = ${hours.toFixed(1)} hrs of work at ${w.label} min. wage`
  const days = hours / 8
  return `This fee = ${days.toFixed(1)} day${days >= 2 ? 's' : ''} of work at ${w.label} min. wage`
}

const TREND_ICON = {
  up:   <TrendingUp   className="w-3.5 h-3.5 text-rr-green" />,
  down: <TrendingDown className="w-3.5 h-3.5 text-rr-amber" />,
  flat: <Minus        className="w-3.5 h-3.5 text-rr-muted" />,
}

type TabType = 'timeline' | 'providers' | 'fxmargin' | 'costincome' | 'channels'

const SECTION_STYLE = {
  borderBottom: '1px solid rgba(26,45,74,0.7)',
}

export default function Sidebar({ corridor, channel, sendAmount, onChannelChange, onSendAmountChange }: Props) {
  const [timeline,   setTimeline]   = useState<TimelineRow[]>([])
  const [providers,  setProviders]  = useState<Provider[]>([])
  const [channels,   setChannels]   = useState<ChannelRow[]>([])
  const [governance, setGovernance] = useState<GovernanceData | null>(null)
  const [playerData, setPlayerData] = useState<any>(null)
  const [fxData,     setFxData]     = useState<any[]>([])
  const [tab,        setTab]        = useState<TabType>('timeline')

  useEffect(() => { getTimeline(corridor?.id).then(setTimeline) },               [corridor?.id])
  useEffect(() => { getCostAnalysis(sendAmount, corridor?.id).then(setProviders) }, [sendAmount, corridor?.id])
  useEffect(() => { getChannelComparison(corridor?.id).then(setChannels) },      [corridor?.id])
  useEffect(() => { getGovernance().then(setGovernance) },                        [])
  useEffect(() => { getPlayerBreakdown(corridor?.id).then(setPlayerData) },      [corridor?.id])
  useEffect(() => { getFXMargin(sendAmount, corridor?.id).then(setFxData) },     [sendAmount, corridor?.id])

  const handleDownload = () => {
    const a = document.createElement('a')
    a.href     = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/download-sample`
    a.download = 'remittance_sample_data.csv'
    a.click()
  }

  if (!corridor) {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-3 text-rr-muted"
        style={{ background: '#0b1628' }}>
        <Globe className="w-10 h-10 opacity-20" />
        <p className="text-sm">Select a corridor on the map</p>
      </div>
    )
  }

  const formalPct   = Math.round(corridor.formal   * 100)
  const informalPct = Math.round(corridor.informal * 100)
  const best        = [...providers].sort((a, b) => (a.fee_usd ?? 99) - (b.fee_usd ?? 99))[0]
  const channelRow  = channels.find(c => c.corridor_id === corridor.id)

  const tabs: { key: TabType; label: string }[] = [
    { key: 'timeline',   label: 'Volume'     },
    { key: 'providers',  label: 'Players'    },
    { key: 'fxmargin',   label: 'FX Margin'  },
    { key: 'costincome', label: 'Cost/Inc'   },
    { key: 'channels',   label: 'Channels'   },
  ]

  return (
    <div className="h-full overflow-y-auto flex flex-col text-sm"
      style={{ background: '#0b1628' }}>

      {/* ── SECTION A: Title & High-level Metric ── */}
      <div className="p-4" style={SECTION_STYLE}>
        <div className="flex items-center justify-between mb-1">
          <p className="text-[9px] font-mono text-rr-muted uppercase tracking-[0.14em]">
            Section A · Active Corridor
          </p>
          {TREND_ICON[corridor.trend]}
        </div>
        <h2 className="text-rr-cyan font-semibold text-base leading-tight">{corridor.label}</h2>
        <p className="text-[10px] text-rr-muted mt-0.5">via {corridor.primary_provider} · Payment Rail</p>

        <div className="grid grid-cols-2 gap-2 mt-3">
          <div className="rounded p-2.5" style={{ background: 'rgba(56,189,248,0.07)', border: '1px solid rgba(56,189,248,0.18)' }}>
            <p className="text-[9px] text-rr-muted">Annual Volume</p>
            <p className="text-rr-cyan font-mono font-bold text-sm">
              ${channel === 'formal'
                ? (corridor.volume_bn_usd * corridor.formal).toFixed(1)
                : channel === 'informal'
                ? (corridor.volume_bn_usd * corridor.informal).toFixed(1)
                : corridor.volume_bn_usd}B
            </p>
            <p className="text-[9px] text-rr-muted mt-0.5">
              {channel === 'all' ? 'World Bank est.' : `${channel} channel only`}
            </p>
          </div>
          <div className="rounded p-2.5" style={{ background: 'rgba(129,140,248,0.07)', border: '1px solid rgba(129,140,248,0.18)' }}>
            <p className="text-[9px] text-rr-muted">Avg Transfer Cost</p>
            <p className={`font-mono font-bold text-sm ${corridor.avg_cost_pct > 4 ? 'text-rr-amber' : 'text-rr-green'}`}>
              {corridor.avg_cost_pct}%
            </p>
            <p className="text-[9px] text-rr-muted mt-0.5">
              {corridor.avg_cost_pct > 5 ? 'Above G20 target' : corridor.avg_cost_pct > 4 ? 'Near G20 limit' : 'G20 compliant'}
            </p>
          </div>

          <div className="col-span-2 rounded p-2.5" style={{ background: 'rgba(52,211,153,0.06)', border: '1px solid rgba(52,211,153,0.18)' }}>
            <p className="text-[9px] text-rr-muted mb-1.5">Formal vs Informal Channel</p>
            <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(26,45,74,0.6)' }}>
              <div className="h-full rounded-full bg-rr-green transition-all duration-700"
                style={{ width: `${formalPct}%` }} />
            </div>
            <div className="flex justify-between text-[10px] mt-1.5">
              <span className="text-rr-green font-medium">Formal {formalPct}%</span>
              <span className="text-rr-amber font-medium">Informal {informalPct}%</span>
            </div>
            {channelRow && (
              <div className="flex items-center gap-1.5 mt-1.5">
                {channelRow.hawala_risk === 'HIGH'
                  ? <AlertTriangle className="w-3 h-3 text-rr-amber" />
                  : <CheckCircle   className="w-3 h-3 text-rr-green" />}
                <span className="text-[10px]" style={{ color: channelRow.hawala_risk === 'HIGH' ? '#F59E0B' : '#34D399' }}>
                  Hawala risk: {channelRow.hawala_risk}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── SECTION B: Why This Matters ── */}
      <div className="p-4" style={SECTION_STYLE}>
        <div className="flex items-center gap-2 mb-2">
          <Info className="w-3.5 h-3.5 text-rr-indigo shrink-0" />
          <p className="text-[9px] font-mono text-rr-muted uppercase tracking-[0.14em]">
            Section B · Why This Matters
          </p>
        </div>
        <p className="text-rr-muted text-xs leading-relaxed">
          This corridor moves{' '}
          <span className="text-rr-text font-semibold">${corridor.volume_bn_usd}B/year</span> — often the{' '}
          <span className="text-rr-cyan">largest single source of foreign income</span> for receiving households.
          Every 1% cost reduction saves families millions annually.
          {(() => {
            const avgFee = providers.reduce((s, p) => s + (p.fee_usd ?? 0), 0) / (providers.length || 1)
            const humanCost = calcHumanCost(corridor.id, avgFee)
            return humanCost ? (
              <span className="text-rr-amber font-medium"> {humanCost}.</span>
            ) : null
          })()}
          {informalPct > 30 && (
            <span className="text-rr-amber">
              {' '}The {informalPct}% informal share signals hawala activity — an AML risk.
            </span>
          )}
          {corridor.avg_cost_pct > 5 && (
            <span className="text-rr-amber">
              {' '}Cost exceeds the G20 SDG 5% target.
            </span>
          )}
        </p>
      </div>

      {/* ── SECTION C: Who Controls the Rail ── */}
      <div className="p-4" style={SECTION_STYLE}>
        <div className="flex items-center gap-2 mb-3">
          <Shield className="w-3.5 h-3.5 text-rr-green shrink-0" />
          <p className="text-[9px] font-mono text-rr-muted uppercase tracking-[0.14em]">
            Section C · Who Controls the Rail
          </p>
        </div>
        {governance ? (
          <>
            <div className="space-y-2.5">
              {(governance.regulators ?? []).map(r => (
                <div key={r.region} className="flex gap-2.5 items-start">
                  <span className="text-[9px] font-mono px-1.5 py-0.5 rounded shrink-0 mt-0.5"
                    style={{ background: `${r.color}18`, color: r.color, border: `1px solid ${r.color}35` }}>
                    {r.region}
                  </span>
                  <div>
                    <p className="text-rr-text text-[11px] font-medium leading-tight">{r.body}</p>
                    <p className="text-rr-muted text-[10px] mt-0.5">{r.role}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-2 mt-3 pt-3" style={{ borderTop: '1px solid rgba(26,45,74,0.6)' }}>
              <div className="text-center rounded p-2" style={{ background: 'rgba(56,189,248,0.06)', border: '1px solid rgba(56,189,248,0.15)' }}>
                <p className="text-rr-cyan font-mono font-bold">{governance.swift_coverage_pct}%</p>
                <p className="text-rr-muted text-[9px]">SWIFT Coverage</p>
              </div>
              <div className="text-center rounded p-2" style={{ background: 'rgba(129,140,248,0.06)', border: '1px solid rgba(129,140,248,0.15)' }}>
                <p className="text-rr-indigo font-mono font-bold">{governance.avg_settlement_days}d</p>
                <p className="text-rr-muted text-[9px]">Avg Settlement</p>
              </div>
            </div>
          </>
        ) : (
          <p className="text-rr-muted text-xs">Loading governance data…</p>
        )}
      </div>

      {/* ── SECTION D: Filters & Analysis ── */}
      <div className="p-4 flex-1" style={SECTION_STYLE}>
        <div className="flex items-center gap-2 mb-3">
          <SlidersHorizontal className="w-3.5 h-3.5 text-rr-amber shrink-0" />
          <p className="text-[9px] font-mono text-rr-muted uppercase tracking-[0.14em]">
            Section D · Filters & Analysis
          </p>
        </div>

        {/* Channel filter */}
        <div className="mb-3">
          <p className="text-[10px] text-rr-muted mb-1.5">Channel Filter</p>
          <div className="flex gap-1">
            {(['all', 'formal', 'informal'] as const).map(ch => (
              <button key={ch} onClick={() => onChannelChange(ch)}
                className={`flex-1 py-1.5 rounded text-[10px] font-medium capitalize transition-all duration-150 ${
                  channel === ch
                    ? 'bg-rr-cyan text-rr-bg glow-cyan'
                    : 'text-rr-muted hover:text-rr-cyan'
                }`}
                style={channel !== ch ? { border: '1px solid #1a2d4a' } : {}}>
                {ch}
              </button>
            ))}
          </div>
        </div>

        {/* Send amount slider */}
        <div className="mb-3">
          <div className="flex justify-between items-center mb-1.5">
            <p className="text-[10px] text-rr-muted">Send Amount</p>
            <span className="text-rr-cyan font-mono text-xs font-semibold">${sendAmount}</span>
          </div>
          <input type="range" min={50} max={2000} step={50} value={sendAmount}
            onChange={e => onSendAmountChange(+e.target.value)}
            className="w-full h-1.5 rounded-full cursor-pointer accent-[#38BDF8]"
            style={{ background: `linear-gradient(to right, #38BDF8 ${((sendAmount-50)/1950)*100}%, #1a2d4a ${((sendAmount-50)/1950)*100}%)` }}
          />
          <div className="flex justify-between text-[9px] text-rr-muted mt-1">
            <span>$50</span><span>$500</span><span>$1,000</span><span>$2,000</span>
          </div>
          {best && (() => {
            const humanCost = calcHumanCost(corridor.id, best.fee_usd ?? 0)
            return humanCost ? (
              <div className="mt-2 flex items-start gap-2 p-2 rounded text-[10px]"
                style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.22)' }}>
                <AlertTriangle className="w-3 h-3 text-rr-amber shrink-0 mt-0.5" />
                <span className="text-rr-muted leading-relaxed">
                  <span className="text-rr-amber font-semibold">{humanCost}</span>
                  {' '}— best rate ({best.name}). (ILO est.)
                </span>
              </div>
            ) : null
          })()}
        </div>

        {/* Tab buttons */}
        <div className="grid grid-cols-5 gap-0.5 mb-2">
          {tabs.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`py-1.5 rounded text-[8.5px] font-medium transition-all duration-150 ${
                tab === t.key
                  ? 'text-rr-cyan'
                  : 'text-rr-muted hover:text-rr-cyan'
              }`}
              style={tab === t.key
                ? { background: 'rgba(56,189,248,0.08)', border: '1px solid rgba(56,189,248,0.3)' }
                : { border: '1px solid #1a2d4a' }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Chart area */}
        <div className="h-56">
          {tab === 'timeline'   && <TimelineChart data={timeline} channel={channel} />}
          {tab === 'providers'  && <PlayerBreakdownChart data={playerData?.breakdown ?? []} />}
          {tab === 'fxmargin'   && <FXMarginChart data={fxData} />}
          {tab === 'channels'   && (
            <div className="h-full flex flex-col justify-center gap-2 px-1">
              {channels.slice(0, 4).map(c => (
                <div key={c.corridor_id}>
                  <div className="flex justify-between text-[10px] mb-0.5">
                    <span className="text-rr-muted truncate">{c.corridor_label}</span>
                    <span className={c.hawala_risk === 'HIGH' ? 'text-rr-amber' : 'text-rr-green'}>{c.hawala_risk}</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: '#1a2d4a' }}>
                    <div className="h-full rounded-full bg-rr-green" style={{ width: `${c.formal_pct}%` }} />
                  </div>
                  <div className="flex justify-between text-[9px] text-rr-muted mt-0.5">
                    <span>Formal {c.formal_pct}%</span>
                    <span>Informal {c.informal_pct}%</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Intelligence callouts */}
        {tab === 'providers' && best && (
          <div className="mt-2 flex items-start gap-2 p-2 rounded text-[10px]"
            style={{ background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.2)' }}>
            <Zap className="w-3 h-3 text-rr-green shrink-0 mt-0.5" />
            <span className="text-rr-muted leading-relaxed">
              Best rate: <span className="text-rr-green font-semibold">{best.name}</span> — recipient gets{' '}
              <span className="text-rr-text font-mono">${best.net_received?.toFixed(2)}</span> of ${sendAmount}.
            </span>
          </div>
        )}
        {tab === 'fxmargin' && (
          <div className="mt-2 flex items-start gap-2 p-2 rounded text-[10px]"
            style={{ background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.2)' }}>
            <DollarSign className="w-3 h-3 text-rr-amber shrink-0 mt-0.5" />
            <span className="text-rr-muted leading-relaxed">
              <span className="text-rr-amber font-semibold">Hidden FX spread</span> is the gap between mid-market rate and what you get.
            </span>
          </div>
        )}
        {tab === 'timeline' && (
          <div className="mt-2 flex items-start gap-2 p-2 rounded text-[10px]"
            style={{ background: 'rgba(56,189,248,0.07)', border: '1px solid rgba(56,189,248,0.18)' }}>
            <TrendingUp className="w-3 h-3 text-rr-cyan shrink-0 mt-0.5" />
            <span className="text-rr-muted leading-relaxed">
              Temporal view 2020–2024. Formal volumes peak in <span className="text-rr-cyan">Dec–Jan</span>.
              YoY growth avg <span className="text-rr-cyan">4.5%</span>.
            </span>
          </div>
        )}
        {tab === 'costincome' && (
          <div className="mt-2 flex items-start gap-2 p-2 rounded text-[10px]"
            style={{ background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)' }}>
            <BarChart2 className="w-3 h-3 text-rr-red shrink-0 mt-0.5" />
            <span className="text-rr-muted leading-relaxed">
              <span className="text-rr-red font-semibold">CRITICAL</span> corridors = fee is 15%+ of sender income.
            </span>
          </div>
        )}
      </div>

      {/* ── SECTION E: Download ── */}
      <div className="p-4">
        <button onClick={handleDownload}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded text-xs font-semibold
            text-rr-cyan hover:text-rr-bg hover:bg-rr-cyan transition-all duration-200 glow-cyan"
          style={{ border: '1px solid #38BDF8' }}>
          <Download className="w-3.5 h-3.5" />
          Download Sample Data (.csv)
        </button>
        <p className="text-[9px] text-rr-muted text-center mt-1.5">
          100 rows · World Bank / ECB structure · Mock data
        </p>
      </div>

    </div>
  )
}