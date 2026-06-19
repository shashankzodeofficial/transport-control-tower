import type { Alert, AlertType, AckAction } from '@/types'

const now = Date.now()
const minsAgo = (m: number) => new Date(now - m * 60000).toISOString()

export const SEED_ALERTS: Alert[] = [
  {
    id: 'ALT-001',
    type: 'SLA_BREACH',
    severity: 'critical',
    message: 'Dispatch D-48291 (MUM→DEL) has breached SLA by 8h 40m — delivery expected by 06:00 not met. Vehicle stationary for last 2h.',
    dispatchId: 'D-48291',
    routeCode: 'RT-MUM-DEL-01',
    carrierName: 'FastMove Logistics',
    delayMins: 520,
    firedAt: minsAgo(18),
    acknowledged: false,
  },
  {
    id: 'ALT-002',
    type: 'ESCALATED_EXCEPTION',
    severity: 'critical',
    message: 'Exception EXC-0041 (Damaged HU) escalated to L3 — no resolution in 48h. Dispatch D-48301 halted.',
    dispatchId: 'D-48301',
    routeCode: 'RT-BLR-HYD-02',
    carrierName: 'VRL Logistics',
    delayMins: 2880,
    firedAt: minsAgo(34),
    acknowledged: false,
  },
  {
    id: 'ALT-003',
    type: 'HIGH_RISK',
    severity: 'critical',
    message: 'Vehicle MH12XY9901 stationary for 3h 40m on NH48 near Surat — possible breakdown. Driver unreachable.',
    dispatchId: 'D-48291',
    routeCode: 'RT-MUM-DEL-01',
    carrierName: 'FastMove Logistics',
    delayMins: 220,
    firedAt: minsAgo(47),
    acknowledged: false,
  },
  {
    id: 'ALT-004',
    type: 'SLA_BREACH',
    severity: 'high',
    message: 'Dispatch D-48309 at-risk: only 45 min to SLA breach. Currently stuck at Nashik checkpoint.',
    dispatchId: 'D-48309',
    routeCode: 'RT-MUM-PUN-03',
    carrierName: 'Patel Roadways',
    delayMins: 135,
    firedAt: minsAgo(9),
    acknowledged: false,
  },
  {
    id: 'ALT-005',
    type: 'OVERDUE_RECONCILIATION',
    severity: 'high',
    message: 'Reconciliation for Dispatch D-48274 overdue by 18h — RECON-0009 pending sign-off from Ops Head.',
    dispatchId: 'D-48274',
    routeCode: 'RT-DEL-LKO-01',
    carrierName: 'Gati Kintetsu Express',
    delayMins: 1080,
    firedAt: minsAgo(62),
    acknowledged: false,
  },
  {
    id: 'ALT-006',
    type: 'HIGH_RISK',
    severity: 'high',
    message: 'Carrier "FastMove Logistics" has 4 open exceptions this week — composite score dropped to 61 (Watch List threshold).',
    carrierName: 'FastMove Logistics',
    delayMins: 0,
    firedAt: minsAgo(88),
    acknowledged: false,
  },
  {
    id: 'ALT-007',
    type: 'INTEGRATION_FAILURE',
    severity: 'high',
    message: 'E-way bill API timeout — 3 consecutive failures since 14:22. Dispatches D-48312, D-48314, D-48317 pending e-way bill.',
    firedAt: minsAgo(103),
    acknowledged: true,
    ackedAt: minsAgo(95),
    ackedBy: 'Shashank Zode',
    ackAction: 'monitoring_only',
    ackRemarks: 'API team notified. Monitoring recovery. Manual e-way bills being processed as fallback.',
  },
  {
    id: 'ALT-008',
    type: 'SLA_BREACH',
    severity: 'medium',
    message: 'Route RT-CHN-BLR-04 OTD dropped to 64% this week — 3 of 5 dispatches late by >2h.',
    routeCode: 'RT-CHN-BLR-04',
    carrierName: 'Blue Dart Express',
    delayMins: 160,
    firedAt: minsAgo(145),
    acknowledged: false,
  },
  {
    id: 'ALT-009',
    type: 'OVERDUE_RECONCILIATION',
    severity: 'medium',
    message: '2 reconciliation records have been in "Discrepancy" state for >72h without action: RECON-0007, RECON-0011.',
    delayMins: 4320,
    firedAt: minsAgo(190),
    acknowledged: true,
    ackedAt: minsAgo(160),
    ackedBy: 'Shashank Zode',
    ackAction: 'hub_escalated',
    ackRemarks: 'Escalated to Mumbai Hub Ops Manager. Physical recount scheduled for tomorrow 09:00.',
  },
  {
    id: 'ALT-010',
    type: 'INTEGRATION_FAILURE',
    severity: 'medium',
    message: 'GPS ping gap detected for vehicle GJ05AB1234 — no telemetry received in last 55 minutes.',
    dispatchId: 'D-48295',
    routeCode: 'RT-AMD-SUR-02',
    carrierName: 'Rivigo Technologies',
    delayMins: 55,
    firedAt: minsAgo(220),
    acknowledged: false,
  },
  {
    id: 'ALT-011',
    type: 'SLA_BREACH',
    severity: 'critical',
    message: 'Dispatch D-48315 (DEL→MUM) — 4h 15m breach. Vehicle breakdown confirmed on NH8 near Vadodara.',
    dispatchId: 'D-48315',
    routeCode: 'RT-DEL-MUM-02',
    carrierName: 'SafeExpress Logistics',
    delayMins: 255,
    firedAt: minsAgo(250),
    acknowledged: true,
    ackedAt: minsAgo(240),
    ackedBy: 'Shashank Zode',
    ackAction: 'alternate_vehicle',
    ackRemarks: 'Alternate vehicle KA-09-BB-4521 dispatched from Vadodara depot. ETA +3h from now.',
  },
  {
    id: 'ALT-012',
    type: 'SLA_BREACH',
    severity: 'critical',
    message: 'Dispatch D-48298 (KOL→HYD) — 9h breach. Critical pharma shipment at risk of temperature excursion.',
    dispatchId: 'D-48298',
    routeCode: 'RT-KOL-HYD-01',
    carrierName: 'Blue Dart Express',
    delayMins: 540,
    firedAt: minsAgo(310),
    acknowledged: false,
  },
  {
    id: 'ALT-013',
    type: 'SLA_BREACH',
    severity: 'high',
    message: 'Route RT-BLR-CHE-02 — chronic delay pattern. 5th breach in 15 days. Avg delay 3h 20m.',
    routeCode: 'RT-BLR-CHE-02',
    carrierName: 'DTDC Freight',
    delayMins: 200,
    firedAt: minsAgo(380),
    acknowledged: true,
    ackedAt: minsAgo(360),
    ackedBy: 'Shashank Zode',
    ackAction: 'route_changed',
    ackRemarks: 'Route re-optimised via Krishnagiri bypass. Carrier briefed. Route performance review scheduled.',
  },
]

// ─── Display config ───────────────────────────────────────────────────────────

export const ALERT_TYPE_LABEL: Record<string, string> = {
  SLA_BREACH:              'SLA Breach',
  HIGH_RISK:               'High Risk',
  ESCALATED_EXCEPTION:     'Escalated Exception',
  OVERDUE_RECONCILIATION:  'Overdue Reconciliation',
  INTEGRATION_FAILURE:     'Integration Failure',
}

export const ALERT_TYPE_COLOR: Record<string, string> = {
  SLA_BREACH:              'bg-red-100 text-red-700 border-red-200',
  HIGH_RISK:               'bg-orange-100 text-orange-700 border-orange-200',
  ESCALATED_EXCEPTION:     'bg-purple-100 text-purple-700 border-purple-200',
  OVERDUE_RECONCILIATION:  'bg-amber-100 text-amber-700 border-amber-200',
  INTEGRATION_FAILURE:     'bg-slate-100 text-slate-600 border-slate-200',
}

export const ACK_ACTION_LABEL: Record<AckAction, string> = {
  carrier_escalated:  'Carrier Escalated',
  alternate_vehicle:  'Alternate Vehicle Arranged',
  route_changed:      'Route Changed',
  delivery_replanned: 'Delivery Replanned',
  driver_contacted:   'Driver Contacted',
  hub_escalated:      'Hub Escalated',
  customer_escalated: 'Customer Escalated',
  monitoring_only:    'Monitoring Only',
}

// ─── Analytics data (30-day rolling) ─────────────────────────────────────────

export interface RouteDelayStats {
  routeCode: string
  routeLabel: string
  totalExceptions: number
  avgDelayMins: number
  breachCount: number
  onTimeRate: number
  trend: 'improving' | 'stable' | 'worsening'
}

export interface CarrierDelayStats {
  carrier: string
  totalExceptions: number
  avgDelayMins: number
  breachCount: number
  slaScore: number
  trend: 'improving' | 'stable' | 'worsening'
}

export interface ChronicLane {
  routeCode: string
  carrier: string
  breachesLast30Days: number
  avgDelayMins: number
  lastBreachAt: string
  status: 'critical' | 'watch' | 'improving'
}

export interface RecoveryStats {
  avgRecoveryMins: number
  p90RecoveryMins: number
  fastestMins: number
  slowestMins: number
  byAction: { action: AckAction; avgMins: number; count: number }[]
}

export const TOP_DELAY_ROUTES: RouteDelayStats[] = [
  { routeCode: 'RT-MUM-DEL-01', routeLabel: 'Mumbai → Delhi',    totalExceptions: 18, avgDelayMins: 312, breachCount: 12, onTimeRate: 61, trend: 'worsening'  },
  { routeCode: 'RT-BLR-CHE-02', routeLabel: 'Bangalore → Chennai', totalExceptions: 14, avgDelayMins: 248, breachCount: 9,  onTimeRate: 68, trend: 'worsening'  },
  { routeCode: 'RT-KOL-HYD-01', routeLabel: 'Kolkata → Hyderabad',totalExceptions: 11, avgDelayMins: 205, breachCount: 7,  onTimeRate: 72, trend: 'stable'     },
  { routeCode: 'RT-DEL-MUM-02', routeLabel: 'Delhi → Mumbai',    totalExceptions: 9,  avgDelayMins: 188, breachCount: 6,  onTimeRate: 75, trend: 'stable'     },
  { routeCode: 'RT-CHN-BLR-04', routeLabel: 'Chennai → Bangalore', totalExceptions: 8,  avgDelayMins: 162, breachCount: 5,  onTimeRate: 78, trend: 'improving'  },
  { routeCode: 'RT-AMD-SUR-02', routeLabel: 'Ahmedabad → Surat', totalExceptions: 6,  avgDelayMins: 110, breachCount: 3,  onTimeRate: 84, trend: 'improving'  },
  { routeCode: 'RT-DEL-LKO-01', routeLabel: 'Delhi → Lucknow',   totalExceptions: 5,  avgDelayMins: 95,  breachCount: 2,  onTimeRate: 87, trend: 'stable'     },
]

export const TOP_DELAY_CARRIERS: CarrierDelayStats[] = [
  { carrier: 'FastMove Logistics',    totalExceptions: 22, avgDelayMins: 335, breachCount: 16, slaScore: 61, trend: 'worsening'  },
  { carrier: 'DTDC Freight',          totalExceptions: 15, avgDelayMins: 268, breachCount: 10, slaScore: 69, trend: 'worsening'  },
  { carrier: 'Patel Roadways',        totalExceptions: 12, avgDelayMins: 210, breachCount: 8,  slaScore: 74, trend: 'stable'     },
  { carrier: 'SafeExpress Logistics', totalExceptions: 9,  avgDelayMins: 172, breachCount: 6,  slaScore: 78, trend: 'stable'     },
  { carrier: 'Blue Dart Express',     totalExceptions: 7,  avgDelayMins: 135, breachCount: 4,  slaScore: 83, trend: 'improving'  },
  { carrier: 'VRL Logistics',         totalExceptions: 5,  avgDelayMins: 98,  breachCount: 2,  slaScore: 88, trend: 'improving'  },
  { carrier: 'Gati Kintetsu Express', totalExceptions: 4,  avgDelayMins: 82,  breachCount: 1,  slaScore: 91, trend: 'improving'  },
]

export const CHRONIC_LANES: ChronicLane[] = [
  { routeCode: 'RT-MUM-DEL-01', carrier: 'FastMove Logistics',    breachesLast30Days: 12, avgDelayMins: 312, lastBreachAt: new Date(now - 18 * 60000).toISOString(),   status: 'critical' },
  { routeCode: 'RT-BLR-CHE-02', carrier: 'DTDC Freight',          breachesLast30Days: 9,  avgDelayMins: 248, lastBreachAt: new Date(now - 380 * 60000).toISOString(),  status: 'critical' },
  { routeCode: 'RT-KOL-HYD-01', carrier: 'Blue Dart Express',     breachesLast30Days: 7,  avgDelayMins: 205, lastBreachAt: new Date(now - 310 * 60000).toISOString(),  status: 'watch'    },
  { routeCode: 'RT-DEL-MUM-02', carrier: 'SafeExpress Logistics',  breachesLast30Days: 6,  avgDelayMins: 188, lastBreachAt: new Date(now - 250 * 60000).toISOString(),  status: 'watch'    },
  { routeCode: 'RT-CHN-BLR-04', carrier: 'Blue Dart Express',     breachesLast30Days: 5,  avgDelayMins: 162, lastBreachAt: new Date(now - 145 * 60000).toISOString(),  status: 'improving' },
]

export const RECOVERY_STATS: RecoveryStats = {
  avgRecoveryMins: 142,
  p90RecoveryMins: 310,
  fastestMins: 18,
  slowestMins: 720,
  byAction: [
    { action: 'alternate_vehicle',  avgMins: 95,  count: 8  },
    { action: 'driver_contacted',   avgMins: 38,  count: 15 },
    { action: 'route_changed',      avgMins: 125, count: 6  },
    { action: 'carrier_escalated',  avgMins: 180, count: 9  },
    { action: 'delivery_replanned', avgMins: 220, count: 5  },
    { action: 'hub_escalated',      avgMins: 165, count: 7  },
    { action: 'customer_escalated', avgMins: 290, count: 3  },
    { action: 'monitoring_only',    avgMins: 60,  count: 12 },
  ],
}

export const CLOSURE_SLA = {
  totalClosed: 65,
  closedWithinSla: 48,
  slaThresholdMins: 240,
  avgClosureMins: 142,
  breachedClosure: 17,
  slaPct: Math.round((48 / 65) * 100),
}
