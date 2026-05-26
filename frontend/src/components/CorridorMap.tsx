'use client'
/**
 * CorridorMap.tsx — v4.1 Cinematic Rail
 * Curved arc corridors with heatmap colour coding.
 * Updated: tile layer matches Financial Rail Deep DNA background (#060d1a)
 */
import { useEffect, useRef } from 'react'
import type { Corridor } from '@/types'

interface HeatmapEntry {
  corridor_id:    string
  heat_intensity: number
  heat_color:     string
  volume_bn_usd:  number
}

interface Props {
  corridors:    Corridor[]
  selectedId:   string
  onSelect:     (id: string) => void
  heatmapData?: HeatmapEntry[]
}

function getHeatColor(intensity: number): string {
  if (intensity >= 0.8) return '#F87171'
  if (intensity >= 0.6) return '#FBBF24'
  if (intensity >= 0.4) return '#38BDF8'
  return '#818CF8'
}

function getDimColor(intensity: number): string {
  if (intensity >= 0.8) return '#7F3535'
  if (intensity >= 0.6) return '#7A5E1A'
  if (intensity >= 0.4) return '#1E5F7A'
  return '#3D4070'
}

function getCurvedPoints(
  lat1: number, lng1: number,
  lat2: number, lng2: number,
  offset: number
): [number, number][] {
  const steps  = 50
  const midLat = (lat1 + lat2) / 2
  const midLng = (lng1 + lng2) / 2
  const dLat   = lat2 - lat1
  const dLng   = lng2 - lng1
  const len    = Math.sqrt(dLat * dLat + dLng * dLng) || 1
  const perpLat = -dLng / len
  const perpLng =  dLat / len
  const ctrlLat = midLat + perpLat * offset * len
  const ctrlLng = midLng + perpLng * offset * len
  const pts: [number, number][] = []
  for (let i = 0; i <= steps; i++) {
    const t  = i / steps
    const t1 = 1 - t
    pts.push([
      t1*t1*lat1 + 2*t1*t*ctrlLat + t*t*lat2,
      t1*t1*lng1 + 2*t1*t*ctrlLng + t*t*lng2,
    ])
  }
  return pts
}

const CURVE_OFFSETS: Record<string, number> = {
  'US-MX':  0.15,
  'US-IN':  0.22,
  'US-PH':  0.28,
  'US-CN':  0.18,
  'US-DO':  0.12,
  'UK-NG':  0.20,
  'UK-IN':  0.15,
  'EU-PH':  0.20,
  'UAE-PK': 0.12,
  'UAE-IN': 0.28,
  'FR-MA':  0.18,
  'CA-IN':  0.22,
  'AU-IN':  0.20,
  'IT-RO':  0.15,
  'ES-EC':  0.18,
}

export default function CorridorMap({ corridors, selectedId, onSelect, heatmapData = [] }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef       = useRef<any>(null)
  const layersRef    = useRef<any[]>([])

  useEffect(() => {
    if (typeof window === 'undefined' || !containerRef.current) return
    const el = containerRef.current as any
    if (el._leaflet_id) {
      if (mapRef.current) { mapRef.current.remove(); mapRef.current = null }
      else delete el._leaflet_id
    }
    if (mapRef.current) return

    import('leaflet').then(L => {
      if (!containerRef.current) return
      const container = containerRef.current as any
      if (container._leaflet_id) return

      const map = L.map(containerRef.current, {
        center: [20, 15], zoom: 2,
        zoomControl: true, attributionControl: false,
        minZoom: 1, maxZoom: 8,
      })

      // Financial Rail Deep DNA tile — dark navy, matches #060d1a bg
      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        maxZoom: 19,
        // CSS filter to push the tile toward our #060d1a Financial Rail DNA
        // Applied via tile pane in CSS below
      }).addTo(map)

      mapRef.current = map

      // Apply Financial Rail DNA tint to tile pane
      const pane = map.getPane('tilePane') as HTMLElement | undefined
      if (pane) {
        pane.style.filter = 'hue-rotate(200deg) saturate(0.7) brightness(0.75)'
      }
    })

    return () => {
      if (mapRef.current) { mapRef.current.remove(); mapRef.current = null }
    }
  }, [])

  useEffect(() => {
    if (!mapRef.current || corridors.length === 0) return

    import('leaflet').then(L => {
      layersRef.current.forEach(l => l.remove())
      layersRef.current = []

      corridors.forEach(c => {
        const active      = c.id === selectedId
        const heatEntry   = heatmapData.find(h => h.corridor_id === c.id)
        const intensity   = heatEntry?.heat_intensity ?? 0.4
        const heatColor   = getHeatColor(intensity)
        const color       = active ? heatColor : getDimColor(intensity)
        const opacity     = active ? 1.0 : 0.5
        const weight      = active ? 3.5 : 1.5
        const curveOffset = CURVE_OFFSETS[c.id] ?? 0.2

        const arcPts = getCurvedPoints(c.from_lat, c.from_lng, c.to_lat, c.to_lng, curveOffset)
        const line = L.polyline(arcPts, {
          color, opacity, weight,
          dashArray: active ? undefined : '5 8',
          smoothFactor: 1,
        }).addTo(mapRef.current)
        line.on('click', () => onSelect(c.id))
        layersRef.current.push(line)

        const costColor = c.avg_cost_pct > 5 ? '#F59E0B' : c.avg_cost_pct > 4 ? '#FBBF24' : '#34D399'
        const heatLabel = intensity >= 0.8 ? 'Very High' : intensity >= 0.6 ? 'High' : intensity >= 0.4 ? 'Medium' : 'Low'
        const tip = `
          <div style="min-width:200px;background:#0b1628;border:1px solid #1a2d4a;
            border-radius:6px;padding:10px;font-family:'Space Grotesk',sans-serif">
            <b style="color:${heatColor};font-size:12px">${c.from_name} → ${c.to_name}</b>
            <div style="margin-top:8px;display:grid;grid-template-columns:1fr 1fr;
              gap:4px 12px;font-size:10px">
              <span style="color:#64748B">Volume</span>
              <span style="color:#E2E8F0;font-family:monospace">$${c.volume_bn_usd}B/yr</span>
              <span style="color:#64748B">Avg Cost</span>
              <span style="color:${costColor};font-family:monospace">${c.avg_cost_pct}%</span>
              <span style="color:#64748B">Formal</span>
              <span style="color:#34D399;font-family:monospace">${Math.round(c.formal*100)}%</span>
              <span style="color:#64748B">Informal</span>
              <span style="color:#F59E0B;font-family:monospace">${Math.round(c.informal*100)}%</span>
              <span style="color:#64748B">Provider</span>
              <span style="color:#818CF8">${c.primary_provider}</span>
              <span style="color:#64748B">Heat Level</span>
              <span style="color:${heatColor};font-weight:600">${heatLabel}</span>
            </div>
          </div>`

        const mid  = arcPts[Math.floor(arcPts.length / 2)]
        const tipM = L.marker(mid, {
          icon: L.divIcon({ html: '', className: '', iconSize: [1,1] }),
          interactive: true, zIndexOffset: -999,
        }).addTo(mapRef.current)
          .bindTooltip(tip, { sticky: false, direction: 'top', offset: [0,-5], opacity: 1 })
        tipM.on('click', () => onSelect(c.id))
        layersRef.current.push(tipM)

        const fromM = L.marker([c.from_lat, c.from_lng], {
          icon: L.divIcon({
            html: `<div style="width:${active?14:9}px;height:${active?14:9}px;
              border-radius:50%;background:${color};
              box-shadow:0 0 ${active?14:5}px ${color};
              border:2px solid #060d1a;cursor:pointer"></div>`,
            className: '', iconSize: [14,14], iconAnchor: [7,7],
          })
        }).addTo(mapRef.current)
        fromM.on('click', () => onSelect(c.id))
        layersRef.current.push(fromM)

        const toM = L.marker([c.to_lat, c.to_lng], {
          icon: L.divIcon({
            html: `<div style="width:${active?9:6}px;height:${active?9:6}px;
              border-radius:50%;background:${color};
              opacity:${active?1:0.65};border:1.5px solid #060d1a;cursor:pointer"></div>`,
            className: '', iconSize: [9,9], iconAnchor: [4,4],
          })
        }).addTo(mapRef.current)
        toM.on('click', () => onSelect(c.id))
        layersRef.current.push(toM)
      })
    })
  }, [corridors, selectedId, onSelect, heatmapData])

  return (
    <div
      ref={containerRef}
      className="w-full h-full"
      style={{ background: '#060d1a' }}
    />
  )
}