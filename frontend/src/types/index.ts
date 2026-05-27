export interface Corridor {
  id: string
  label: string
  from_name: string
  from_lat: number
  from_lng: number
  to_name: string
  to_lat: number
  to_lng: number
  volume_bn_usd: number
  avg_cost_pct: number
  trend: 'up' | 'down' | 'flat'
  primary_provider: string
  formal: number
  informal: number
  // v4.0 new fields
  heat_intensity?:        number
  sender_avg_income_usd?: number
  fee_pct_of_income?:     number
}

export interface Provider {
  id: string
  name: string
  type: string
  player_type?: string
  fee_pct: number
  fee_flat: number
  speed_hrs: number
  rating: number
  fx_margin?: number
  advertised_fee_label?: string
  hidden_spread?: number
  total_true_cost_pct?: number
  corridor_id?: string
  fee_usd?: number
  net_received?: number
  vs_avg_pct?: number
  vs_avg_label?: string
}

export interface TimelineRow {
  year_month: string
  label: string
  channel: 'formal' | 'informal'
  volume_usd: number
  tx_count: number
  avg_tx_usd: number
}

export interface ChannelRow {
  corridor_id: string
  corridor_label: string
  formal_bn: number
  informal_bn: number
  formal_pct: number
  informal_pct: number
  hawala_risk: 'HIGH' | 'MEDIUM' | 'LOW'
  g20_compliant: boolean
}

export interface Regulator {
  region: string
  body: string
  role: string
  color: string
}

export interface GovernanceData {
  regulators: Regulator[]
  swift_coverage_pct: number
  avg_settlement_days: number
}

// v4.0 new types
export interface HeatmapEntry {
  corridor_id:    string
  corridor_label: string
  from_name:      string
  to_name:        string
  from_lat:       number
  from_lng:       number
  to_lat:         number
  to_lng:         number
  volume_bn_usd:  number
  heat_intensity: number
  avg_cost_pct:   number
  heat_color:     string
}

export interface CostIncomeEntry {
  corridor_id:           string
  corridor_label:        string
  avg_cost_pct:          number
  sender_avg_income_usd: number
  fee_pct_of_income:     number
  g20_compliant:         boolean
  income_bracket:        string
  burden_level:          'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'
}

export interface PlayerEntry {
  player_type:    string
  count:          number
  providers:      string[]
  avg_fee_pct:    number
  avg_fx_margin:  number
  avg_total_cost: number
  color:          string
}

export interface FXMarginEntry {
  provider:         string
  player_type:      string
  advertised_fee:   number
  hidden_spread:    number
  true_cost:        number
  fx_margin_pct:    number
  transparency:     'HIGH' | 'MEDIUM' | 'LOW'
  advertised_label: string
  data_type:        string
}

export interface VolumeFlowEntry {
  corridor_id:      string
  corridor_label:   string
  from_name:        string
  to_name:          string
  volume_bn_usd:    number
  volume_share_pct: number
  avg_cost_pct:     number
  trend:            'up' | 'down' | 'flat'
  formal_bn:        number
  informal_bn:      number
}