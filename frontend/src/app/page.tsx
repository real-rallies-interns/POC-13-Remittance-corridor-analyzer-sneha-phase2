'use client'
/**
 * page.tsx — Cinematic Rail Dashboard
 * Infocreon · Remittance Corridor Analyzer · ID 13
 * Cinematic Rail Brief — Level 2
 *
 * FIXES:
 * 1. View tabs (Corridor Routes / Heatmap / Cost vs Income / Volume Flow)
 *    restored — map stays mounted, only overlay changes.
 *    Corridor arcs no longer disappear when switching tabs.
 * 2. Corridor selector tabs at top restored from Phase 1.
 * 3. Metadata modal (i) now shows:
 *      Architect · Batch 2 Interns · Stack fields correctly.
 */

import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import dynamic from 'next/dynamic'
import type { Corridor } from '@/types'
import { getCorridors, getHeatmap, getCostIncomeOverlay, getVolumeFlow } from '@/lib/api'
import MOCK from '@/data/mock_data.json'
import {
  Activity, Globe, TrendingUp, AlertCircle, Radio, CloudOff,
  Info, X, ChevronRight, BarChart2, DollarSign, Layers
} from 'lucide-react'

// ── Dynamic imports (client-only) ─────────────────────────────────────────
const CorridorMap = dynamic(() => import('@/components/CorridorMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex flex-col items-center justify-center gap-3"
      style={{ background: '#060d1a' }}>
      <Globe className="w-8 h-8 text-rr-cyan animate-pulse" />
      <p className="text-sm font-mono tracking-wide" style={{ color: '#CBD5E1' }}>LOADING MAP ENGINE</p>
    </div>
  ),
})

const IntelPanel          = dynamic(() => import('@/components/Sidebar'),                { ssr: false })
const CorridorHeatmapMatrix = dynamic(() => import('@/components/CorridorHeatmapMatrix'), { ssr: false })
const CostIncomeChart     = dynamic(() => import('@/components/CostIncomeChart'),         { ssr: false })
const VolumeFlowChart     = dynamic(() => import('@/components/VolumeFlowChart'),         { ssr: false })

// ── View types ────────────────────────────────────────────────────────────
type ViewMode = 'routes' | 'heatmap' | 'costincome' | 'volumeflow'

// ── View tab config ───────────────────────────────────────────────────────
const VIEW_TABS: { key: ViewMode; label: string; icon: React.ReactNode }[] = [
  { key: 'routes',     label: 'Corridor Routes',    icon: <Globe      className="w-3 h-3" /> },
  { key: 'heatmap',    label: 'Corridor Heatmap',   icon: <Layers     className="w-3 h-3" /> },
  { key: 'costincome', label: 'Cost vs Income',      icon: <DollarSign className="w-3 h-3" /> },
  { key: 'volumeflow', label: 'Volume Flow Tracker', icon: <BarChart2  className="w-3 h-3" /> },
]

export default function Dashboard() {
  const [corridors,   setCorridors]   = useState<Corridor[]>(MOCK.corridors as Corridor[])
  const [selectedId,  setSelectedId]  = useState<string | null>(null)
  const [panelOpen,   setPanelOpen]   = useState(false)
  const [channel,     setChannel]     = useState<'all' | 'formal' | 'informal'>('all')
  const [amount,      setAmount]      = useState(200)
  const [dataSource,  setDataSource]  = useState<string>('frontend_mock')
  const [heatmapData, setHeatmapData] = useState<any[]>([])
  const [costIncome,  setCostIncome]  = useState<any[]>([])
  const [volumeFlow,  setVolumeFlow]  = useState<any>(null)
  const [metaOpen,    setMetaOpen]    = useState(false)
  const [viewMode,    setViewMode]    = useState<ViewMode>('routes')
  const metaRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    getCorridors().then(({ corridors: data, dataSource: src }) => {
      setCorridors(data)
      setDataSource(src)
    })
    getHeatmap().then(setHeatmapData)
    getCostIncomeOverlay().then(setCostIncome)
    getVolumeFlow().then(setVolumeFlow)
  }, [])

  // Close meta modal on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (metaRef.current && !metaRef.current.contains(e.target as Node)) {
        setMetaOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const active      = corridors.find(c => c.id === selectedId)
  const totalVolume = corridors.reduce((s, c) => s + c.volume_bn_usd, 0).toFixed(0)
  const highRisk    = corridors.filter(c => c.avg_cost_pct > 5).length
  const isLive      = dataSource === 'World Bank Live'

  function handleSelect(id: string) {
    setSelectedId(id)
    setPanelOpen(true)
  }

  function closePanel() {
    setPanelOpen(false)
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden"
      style={{ background: '#060d1a' }}>

      {/* ══════════ PILLAR III — INFOCREON HEADER ══════════ */}
      <header
        className="flex items-center justify-between px-4 shrink-0"
        style={{
          height: '42px',
          background: 'rgba(6,13,26,0.97)',
          borderBottom: '1px solid rgba(56,189,248,0.15)',
          backdropFilter: 'blur(8px)',
          overflow: 'visible',
          position: 'relative',
          zIndex: 100,
        }}>

        {/* Left: brand */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-rr-cyan pulse" />
            <span className="text-[11px] font-mono font-bold text-rr-cyan tracking-[0.18em] uppercase">
              INFOCREON
            </span>
          </div>
          <span style={{ color: 'rgba(56,189,248,0.3)', fontSize: '12px' }}>·</span>
          <span className="text-[11px] font-mono tracking-[0.1em] uppercase" style={{ color: '#CBD5E1' }}>
            REMITTANCE CORRIDOR ANALYZER
          </span>
        </div>

        {/* Right: tags + (i) */}
        <div className="flex items-center gap-4">
          <span className="text-[10px] font-mono tracking-[0.1em]" style={{ color: '#94A3B8' }}>
            TEMPORAL · PAYMENT RAIL · ID 13
          </span>

          <div className="flex items-center gap-1.5 text-[10px] font-mono" style={{ color: '#94A3B8' }}>
            <TrendingUp className="w-3 h-3 text-rr-green" />
            <span className="text-rr-cyan font-semibold">${totalVolume}B/yr</span>
          </div>

          {highRisk > 0 && (
            <div className="flex items-center gap-1.5 text-rr-amber text-[10px] font-mono">
              <AlertCircle className="w-3 h-3" />
              <span>{highRisk} above G20</span>
            </div>
          )}

          <div
            className="flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-mono"
            style={{
              background: isLive ? 'rgba(52,211,153,0.08)' : 'rgba(245,158,11,0.08)',
              border: `1px solid ${isLive ? 'rgba(52,211,153,0.3)' : 'rgba(245,158,11,0.3)'}`,
              color: isLive ? '#34D399' : '#F59E0B',
            }}>
            {isLive ? <Radio className="w-3 h-3" /> : <CloudOff className="w-3 h-3" />}
            <span className="ml-1">{isLive ? 'LIVE' : 'MOCK'}</span>
          </div>

          <span
            className="px-2.5 py-0.5 rounded text-[10px] font-mono font-semibold"
            style={{
              border: '1px solid #38BDF8',
              color: '#38BDF8',
              background: 'rgba(56,189,248,0.08)',
              letterSpacing: '0.1em',
            }}>
            FINANCIAL RAIL
          </span>

          {/* (i) Metadata button — PILLAR III FIX */}
          <div className="relative" ref={metaRef}>
            <button
              onClick={() => setMetaOpen(v => !v)}
              className="w-6 h-6 rounded-full flex items-center justify-center transition-all duration-200"
              style={{
                border: '1px solid rgba(56,189,248,0.3)',
                background: metaOpen ? 'rgba(56,189,248,0.15)' : 'transparent',
                color: metaOpen ? '#38BDF8' : '#64748B',
              }}
              title="Architect Signature">
              <Info className="w-3.5 h-3.5" />
            </button>

            {/* Modal rendered via portal — see bottom of component */}
          </div>
        </div>
      </header>

      {/* ══════════ METRICS BAR ══════════ */}
      <div
        className="grid shrink-0"
        style={{
          gridTemplateColumns: 'repeat(5, 1fr)',
          borderBottom: '1px solid rgba(26,45,74,0.8)',
          background: 'rgba(11,22,40,0.9)',
        }}>
        {[
          { label: 'Total Volume / yr',   value: `$${totalVolume}B`,              color: '#38BDF8', sub: `${corridors.length} corridors`    },
          { label: 'High-Risk Corridors', value: `${highRisk}`,                   color: '#F87171', sub: 'avg cost > 5%'                    },
          { label: 'Avg Transfer Cost',   value: `${(corridors.reduce((s,c)=>s+c.avg_cost_pct,0)/corridors.length||1).toFixed(1)}%`, color: '#FBBF24', sub: 'G20 target < 3%' },
          { label: 'Informal Channel',    value: `${Math.round(corridors.reduce((s,c)=>s+c.informal,0)/corridors.length*100||0)}%`, color: '#818CF8', sub: 'hawala exposure'  },
          { label: 'Selected Corridor',   value: active ? active.id : '—',         color: '#34D399', sub: active ? `$${active.volume_bn_usd}B · ${active.primary_provider}` : 'click map to select' },
        ].map((m, i) => (
          <div key={i} className="px-4 py-2.5"
            style={{ borderRight: i < 4 ? '1px solid rgba(26,45,74,0.6)' : 'none' }}>
            <p className="text-[9px] font-mono uppercase tracking-[0.14em] mb-1" style={{ color: '#94A3B8' }}>{m.label}</p>
            <p className="font-bold text-xl font-mono leading-none" style={{ color: m.color }}>{m.value}</p>
            <p className="text-[9px] mt-1" style={{ color: '#94A3B8' }}>{m.sub}</p>
          </div>
        ))}
      </div>

      {/* ══════════ CORRIDOR SELECTOR TABS (restored from Phase 1) ══════════ */}
      <div
        className="shrink-0 flex items-center gap-1 px-3 overflow-x-auto"
        style={{
          height: '36px',
          background: 'rgba(6,13,26,0.9)',
          borderBottom: '1px solid rgba(26,45,74,0.6)',
          backdropFilter: 'blur(8px)',
        }}>
        <span className="text-[10px] font-mono uppercase tracking-widest mr-2 shrink-0" style={{ color: '#94A3B8' }}>
          CORRIDORS
        </span>
        {corridors.map(c => (
          <button
            key={c.id}
            onClick={() => handleSelect(c.id)}
            className="shrink-0 px-2.5 py-1 rounded text-[11px] font-mono font-medium transition-all duration-150"
            style={{
              background: selectedId === c.id
                ? 'rgba(56,189,248,0.15)'
                : 'rgba(26,45,74,0.4)',
              border: `1px solid ${selectedId === c.id ? 'rgba(56,189,248,0.5)' : 'rgba(26,45,74,0.6)'}`,
              color: selectedId === c.id ? '#38BDF8' : '#CBD5E1',
            }}>
            {c.label}
            {c.avg_cost_pct > 5 && (
              <span className="ml-1 text-rr-red text-[8px] font-bold uppercase">HIGH</span>
            )}
          </button>
        ))}
      </div>

      {/* ══════════ PILLAR II — FULL SCREEN MAP + SLIDE-OVER ══════════ */}
      <div className="flex flex-1 relative overflow-hidden">

        {/* ── Main stage (100% width when panel closed) ── */}
        <div className="flex-1 flex flex-col relative overflow-hidden">

          {/* ── VIEW SWITCHER BAR (restored from Phase 1, fixed so map stays mounted) ── */}
          <div
            className="shrink-0 flex items-center gap-1 px-4"
            style={{
              height: '36px',
              background: 'rgba(6,13,26,0.85)',
              borderBottom: '1px solid rgba(26,45,74,0.6)',
              backdropFilter: 'blur(8px)',
            }}>
            <span className="text-[10px] font-mono uppercase tracking-widest mr-3" style={{ color: '#94A3B8' }}>VIEW</span>
            {VIEW_TABS.map(tab => (
              <button
                key={tab.key}
                onClick={() => setViewMode(tab.key)}
                className="flex items-center gap-1.5 px-3 py-1 rounded text-[11px] font-mono font-medium transition-all duration-150"
                style={{
                  background: viewMode === tab.key
                    ? 'rgba(56,189,248,0.15)'
                    : 'transparent',
                  border: `1px solid ${viewMode === tab.key ? 'rgba(56,189,248,0.4)' : 'transparent'}`,
                  color: viewMode === tab.key ? '#38BDF8' : '#94A3B8',
                }}>
                {tab.icon}
                {tab.label}
              </button>
            ))}

            {/* Right side: corridor hint */}
            {viewMode === 'routes' && (
              <span className="ml-auto text-[10px] font-mono uppercase tracking-wide" style={{ color: '#94A3B8' }}>
                ◈ CLICK NODE OR ARC TO OPEN INTELLIGENCE PANEL
              </span>
            )}
            {panelOpen && active && viewMode === 'routes' && (
              <div className="flex items-center gap-2 ml-3">
                <ChevronRight className="w-3 h-3 text-rr-cyan" />
                <span className="text-[10px] font-mono text-rr-cyan">{active.label}</span>
              </div>
            )}
          </div>

          {/* ── Content area — map stays mounted always (FIX for Issue 1) ── */}
          <div className="flex-1 relative overflow-hidden">

            {/*
              KEY FIX: CorridorMap is always rendered (never unmounted).
              Only its visibility changes via CSS. This prevents the
              Leaflet instance from being destroyed when switching views,
              which was causing corridors to disappear on return.
            */}
            <div
              className="absolute inset-0"
              style={{ display: viewMode === 'routes' ? 'block' : 'none' }}>
              <CorridorMap
                corridors={corridors}
                selectedId={selectedId ?? ''}
                onSelect={handleSelect}
                heatmapData={heatmapData}
              />

              {/* Heat intensity legend (only in routes view) */}
              <div
                className="absolute bottom-4 left-4 z-10 rounded-lg px-3 py-2.5"
                style={{
                  background: 'rgba(6,13,26,0.9)',
                  border: '1px solid rgba(26,45,74,0.8)',
                  backdropFilter: 'blur(8px)',
                }}>
                <p className="text-[9px] font-mono uppercase tracking-widest mb-2" style={{ color: '#94A3B8' }}>Heat Intensity</p>
                {[
                  { color: '#F87171', label: 'Very High  ≥ 0.8' },
                  { color: '#FBBF24', label: 'High       ≥ 0.6' },
                  { color: '#38BDF8', label: 'Medium     ≥ 0.4' },
                  { color: '#818CF8', label: 'Low        < 0.4' },
                ].map(h => (
                  <div key={h.label} className="flex items-center gap-2 mb-1">
                    <div className="w-2 h-2 rounded-full shrink-0" style={{ background: h.color }} />
                    <span className="text-[9px] font-mono" style={{ color: '#94A3B8' }}>{h.label}</span>
                  </div>
                ))}
              </div>

              {/* Source attribution */}
              <div
                className="absolute bottom-4 right-4 z-10 px-2.5 py-1.5 rounded"
                style={{
                  background: 'rgba(6,13,26,0.85)',
                  border: '1px solid rgba(26,45,74,0.6)',
                  backdropFilter: 'blur(4px)',
                }}>
                <p className="text-[9px] font-mono" style={{ color: '#94A3B8' }}>
                  World Bank RPW · ECB Data Portal · Q4 2024
                </p>
              </div>
            </div>

            {/* Heatmap Matrix view */}
            {viewMode === 'heatmap' && (
              <div className="absolute inset-0 overflow-auto p-4">
                <CorridorHeatmapMatrix
                  corridors={corridors}
                  selectedId={selectedId ?? undefined}
                  onSelect={handleSelect}
                />
              </div>
            )}

            {/* Cost vs Income view */}
            {viewMode === 'costincome' && (
              <div className="absolute inset-0 overflow-auto p-4">
                <div className="h-full rounded-lg"
                  style={{
                    background: 'rgba(11,22,40,0.6)',
                    border: '1px solid rgba(26,45,74,0.8)',
                    minHeight: '400px',
                  }}>
                  <div className="px-4 py-3 border-b" style={{ borderColor: 'rgba(26,45,74,0.6)' }}>
                    <p className="text-[10px] font-mono uppercase tracking-widest" style={{ color: '#CBD5E1' }}>
                      Cost vs Income Overlay — Fee Burden Per Corridor
                    </p>
                  </div>
                  <div className="p-4" style={{ height: 'calc(100% - 48px)' }}>
                    <CostIncomeChart data={costIncome} />
                  </div>
                </div>
              </div>
            )}

            {/* Volume Flow Tracker view */}
            {viewMode === 'volumeflow' && (
              <div className="absolute inset-0 overflow-auto p-4">
                <div className="h-full rounded-lg"
                  style={{
                    background: 'rgba(11,22,40,0.6)',
                    border: '1px solid rgba(26,45,74,0.8)',
                    minHeight: '400px',
                  }}>
                  <div className="px-4 py-3 border-b" style={{ borderColor: 'rgba(26,45,74,0.6)' }}>
                    <p className="text-[10px] font-mono uppercase tracking-widest" style={{ color: '#CBD5E1' }}>
                      Volume Flow Tracker — Corridor Ranking by Annual Flow
                    </p>
                  </div>
                  <div className="p-4" style={{ height: 'calc(100% - 48px)' }}>
                    <VolumeFlowChart
                      data={volumeFlow?.flows ?? corridors.map(c => ({
                        corridor_id:      c.id,
                        corridor_label:   c.label,
                        volume_bn_usd:    c.volume_bn_usd,
                        volume_share_pct: +(c.volume_bn_usd / corridors.reduce((s,x)=>s+x.volume_bn_usd,0) * 100).toFixed(1),
                        avg_cost_pct:     c.avg_cost_pct,
                        trend:            c.trend,
                        formal_bn:        +(c.volume_bn_usd * c.formal).toFixed(2),
                        informal_bn:      +(c.volume_bn_usd * c.informal).toFixed(2),
                      }))}
                      totalBn={volumeFlow?.total_bn_usd ?? +corridors.reduce((s,c)=>s+c.volume_bn_usd,0).toFixed(1)}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── SLIDE-OVER INTELLIGENCE PANEL ── */}
        {panelOpen && (
          <div
            className="shrink-0 flex flex-col overflow-hidden panel-slide-enter"
            style={{
              width: '340px',
              background: '#0b1628',
              borderLeft: '1px solid rgba(56,189,248,0.18)',
            }}>
            {/* Panel header */}
            <div
              className="flex items-center justify-between px-4 shrink-0"
              style={{
                height: '42px',
                borderBottom: '1px solid rgba(26,45,74,0.8)',
                background: 'rgba(6,13,26,0.7)',
              }}>
              <div>
                <span className="text-[9px] font-mono uppercase tracking-widest" style={{ color: '#94A3B8' }}>
                  Intelligence Panel
                </span>
                {active && (
                  <p className="text-[11px] font-semibold text-rr-cyan leading-tight">{active.label}</p>
                )}
              </div>
              <button
                onClick={closePanel}
                className="w-7 h-7 rounded flex items-center justify-center transition-all duration-200 hover:text-rr-red"
                style={{
                  border: '1px solid rgba(26,45,74,0.8)',
                  background: 'transparent',
                  color: '#64748B',
                }}
                title="Close panel">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Panel content */}
            <div className="flex-1 overflow-hidden">
              {active && (
                <IntelPanel
                  corridor={active}
                  channel={channel}
                  sendAmount={amount}
                  onChannelChange={setChannel}
                  onSendAmountChange={setAmount}
                />
              )}
            </div>
          </div>
        )}
      </div>

      
      {/* ══════════ ARCHITECT SIGNATURE MODAL (Portal — true screen center) ══════════ */}
      {metaOpen && typeof document !== 'undefined' && createPortal(
        <div
          onClick={() => setMetaOpen(false)}
          style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            zIndex: 99999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(0,0,0,0.75)',
            backdropFilter: 'blur(6px)',
            animation: 'fade-in 0.2s ease',
          }}>
          <div
            onClick={e => e.stopPropagation()}
            style={{
              width: '400px',
              background: '#0b1628',
              border: '1px solid rgba(56,189,248,0.35)',
              borderRadius: '14px',
              boxShadow: '0 32px 80px rgba(0,0,0,0.95)',
              animation: 'modal-pop 0.28s cubic-bezier(0.34,1.56,0.64,1)',
            }}>

            {/* Header */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '18px 24px',
                background: 'rgba(56,189,248,0.06)',
                borderBottom: '1px solid rgba(56,189,248,0.15)',
                borderRadius: '14px 14px 0 0',
              }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{
                  width: '6px', height: '6px', borderRadius: '50%',
                  background: '#38BDF8',
                  boxShadow: '0 0 6px #38BDF8',
                }} />
                <span style={{
                  fontSize: '10px', fontFamily: 'monospace',
                  color: '#38BDF8', letterSpacing: '0.16em',
                  textTransform: 'uppercase', fontWeight: 700,
                }}>
                  ◈ Architect Signature
                </span>
              </div>
              <button
                onClick={() => setMetaOpen(false)}
                style={{
                  width: '28px', height: '28px', borderRadius: '50%',
                  border: '1px solid rgba(248,113,113,0.35)',
                  background: 'transparent', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#64748B', transition: 'all 0.2s',
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLButtonElement).style.background = 'rgba(248,113,113,0.12)'
                  ;(e.currentTarget as HTMLButtonElement).style.color = '#F87171'
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLButtonElement).style.background = 'transparent'
                  ;(e.currentTarget as HTMLButtonElement).style.color = '#64748B'
                }}>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                </svg>
              </button>
            </div>

            {/* Main fields */}
            <div style={{ padding: '24px 24px 16px' }}>
              {([
                { k: 'Architect', v: 'Sneha Sunilkumar',                       color: '#38BDF8', fontSize: '17px', fontWeight: 700 },
                { k: 'Batch',     v: 'Batch 2 Interns',                        color: '#E2E8F0', fontSize: '13px', fontWeight: 500 },
                { k: 'Stack',     v: 'Next.js, FastAPI, Tailwind CSS, Leaflet', color: '#E2E8F0', fontSize: '13px', fontWeight: 500 },
              ] as const).map(({ k, v, color, fontSize, fontWeight }) => (
                <div key={k} style={{
                  display: 'flex', justifyContent: 'space-between',
                  alignItems: 'center', gap: '16px', marginBottom: '16px',
                }}>
                  <span style={{
                    fontSize: '9px', fontFamily: 'monospace',
                    color: '#38BDF8', opacity: 0.6,
                    textTransform: 'uppercase', letterSpacing: '0.14em', flexShrink: 0,
                  }}>{k}</span>
                  <span style={{ color, fontSize, fontWeight, textAlign: 'right' }}>{v}</span>
                </div>
              ))}
            </div>

            {/* Divider */}
            <div style={{ margin: '0 24px', borderTop: '1px solid rgba(26,45,74,0.9)' }} />

            {/* Extra rows */}
            <div style={{ padding: '14px 24px' }}>
              {[
                { k: 'Project', v: 'Remittance Corridor Analyzer' },
                { k: 'Rail',    v: 'Payment Rail · Temporal'       },
                { k: 'Version', v: 'v4.0.0 · Cinematic Rail'      },
              ].map(({ k, v }) => (
                <div key={k} style={{
                  display: 'flex', justifyContent: 'space-between',
                  alignItems: 'center', marginBottom: '10px',
                }}>
                  <span style={{ fontSize: '9px', fontFamily: 'monospace', color: '#64748B' }}>{k}</span>
                  <span style={{ fontSize: '10px', fontFamily: 'monospace', color: '#94A3B8' }}>{v}</span>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div style={{ padding: '0 24px 20px' }}>
              <div style={{
                borderRadius: '8px', padding: '8px',
                background: 'rgba(56,189,248,0.04)',
                border: '1px solid rgba(56,189,248,0.08)',
                textAlign: 'center',
              }}>
                <span style={{
                  fontSize: '8px', fontFamily: 'monospace',
                  color: '#1E3A5F', letterSpacing: '0.2em', textTransform: 'uppercase',
                }}>
                  Infocreon · Financial Rail Intelligence Platform
                </span>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ══════════ BOTTOM STATUS BAR (Phase 1 feature restored) ══════════ */}
      <div
        className="shrink-0 flex items-center gap-6 px-4"
        style={{
          height: '36px',
          background: 'rgba(6,13,26,0.97)',
          borderTop: '1px solid rgba(26,45,74,0.8)',
          backdropFilter: 'blur(8px)',
        }}>
        <div className="flex items-center gap-2">
          <span className="text-[9px] font-mono uppercase tracking-widest" style={{ color: '#64748B' }}>SELECTED</span>
          <span className="text-[11px] font-mono font-semibold" style={{ color: active ? '#38BDF8' : '#475569' }}>
            {active ? active.label : '—'}
          </span>
        </div>
        {active && (<>
          <div className="w-px h-4" style={{ background: 'rgba(26,45,74,0.8)' }} />
          <div className="flex items-center gap-1.5">
            <span className="text-[9px] font-mono" style={{ color: '#64748B' }}>Volume / yr</span>
            <span className="text-[11px] font-mono font-bold" style={{ color: '#E2E8F0' }}>${active.volume_bn_usd}B</span>
          </div>
          <div className="w-px h-4" style={{ background: 'rgba(26,45,74,0.8)' }} />
          <div className="flex items-center gap-1.5">
            <span className="text-[9px] font-mono" style={{ color: '#64748B' }}>Avg Transfer Cost</span>
            <span className="text-[11px] font-mono font-bold" style={{ color: active.avg_cost_pct > 5 ? '#FBBF24' : '#34D399' }}>
              {active.avg_cost_pct}%
            </span>
            <span className="text-[9px] font-mono" style={{ color: active.avg_cost_pct > 5 ? '#FBBF24' : '#34D399' }}>
              {active.avg_cost_pct > 5 ? 'above G20' : 'G20 compliant'}
            </span>
          </div>
          <div className="w-px h-4" style={{ background: 'rgba(26,45,74,0.8)' }} />
          <div className="flex items-center gap-1.5">
            <span className="text-[9px] font-mono" style={{ color: '#64748B' }}>Formal Channel</span>
            <span className="text-[11px] font-mono font-bold" style={{ color: '#34D399' }}>{Math.round(active.formal * 100)}%</span>
          </div>
          <div className="w-px h-4" style={{ background: 'rgba(26,45,74,0.8)' }} />
          <div className="flex items-center gap-1.5">
            <span className="text-[9px] font-mono" style={{ color: '#64748B' }}>Informal Channel</span>
            <span className="text-[11px] font-mono font-bold" style={{ color: '#FBBF24' }}>{Math.round(active.informal * 100)}%</span>
          </div>
          <div className="w-px h-4" style={{ background: 'rgba(26,45,74,0.8)' }} />
          <div className="flex items-center gap-1.5">
            <span className="text-[9px] font-mono" style={{ color: '#64748B' }}>Top Provider</span>
            <span className="text-[11px] font-mono font-semibold" style={{ color: '#818CF8' }}>{active.primary_provider}</span>
          </div>
          <div className="w-px h-4" style={{ background: 'rgba(26,45,74,0.8)' }} />
          <div className="flex items-center gap-1.5">
            <span className="text-[9px] font-mono" style={{ color: '#64748B' }}>Trend</span>
            <span className="text-[11px] font-mono font-semibold" style={{
              color: active.trend === 'up' ? '#34D399' : active.trend === 'down' ? '#F87171' : '#94A3B8'
            }}>
              {active.trend === 'up' ? '↑ Growing' : active.trend === 'down' ? '↓ Declining' : '→ Flat'}
            </span>
          </div>
        </>)}
        {!active && (
          <span className="text-[10px] font-mono" style={{ color: '#475569' }}>
            Click a corridor on the map or use the tabs above to select
          </span>
        )}
      </div>

      <style jsx global>{`
        @keyframes slide-in-down {
          from { opacity: 0; transform: translateY(-8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes fade-in {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes modal-pop {
          from { opacity: 0; transform: scale(0.92) translateY(12px); }
          to   { opacity: 1; transform: scale(1)    translateY(0);    }
        }
      `}</style>
    </div>
  )
}