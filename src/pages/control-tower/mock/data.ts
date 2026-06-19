import type { KPIData, ExceptionItem, Alert } from '@/types'
import type { RouteGrade, SeverityLevel } from '@/theme/tokens'

// ─── KPI Strip ────────────────────────────────────────────────────────────────

export const KPI_DATA: KPIData[] = [
  {
    label: 'Active Dispatches',
    value: 248,
    trend: { direction: 'up', delta: '+12', period: 'vs yesterday' },
    status: 'healthy',
    progress: 82,
    tooltip: 'Total dispatches currently in transit or at loading',
  },
  {
    label: 'On-Time Delivery',
    value: 87,
    unit: '%',
    trend: { direction: 'down', delta: '-2.4%', period: 'vs last week' },
    status: 'warning',
    progress: 87,
    tooltip: 'OTD % across all completed dispatches today',
  },
  {
    label: 'SLA Breaches',
    value: 14,
    trend: { direction: 'up', delta: '+3', period: 'vs yesterday' },
    status: 'danger',
    tooltip: 'Dispatches that have breached committed SLA',
  },
  {
    label: 'Open Exceptions',
    value: 37,
    trend: { direction: 'down', delta: '-5', period: 'vs yesterday' },
    status: 'warning',
    progress: 44,
    tooltip: 'Unresolved exceptions requiring action',
  },
  {
    label: 'Vehicle Utilisation',
    value: 79,
    unit: '%',
    trend: { direction: 'up', delta: '+4.1%', period: 'vs last week' },
    status: 'healthy',
    progress: 79,
    tooltip: 'Fleet capacity utilisation across all active vehicles',
  },
  {
    label: 'Avg Delay',
    value: '2.4',
    unit: 'hrs',
    trend: { direction: 'down', delta: '-18 min', period: 'vs yesterday' },
    status: 'warning',
    tooltip: 'Average delay across all in-transit dispatches',
  },
  {
    label: 'Cost vs Budget',
    value: 96,
    unit: '%',
    trend: { direction: 'up', delta: '+1.2%', period: 'vs last week' },
    status: 'healthy',
    progress: 96,
    tooltip: 'Actual transport cost as % of monthly budget',
  },
  {
    label: 'Pending Reconciliation',
    value: 31,
    trend: { direction: 'up', delta: '+7', period: 'vs yesterday' },
    status: 'info',
    tooltip: 'Dispatches awaiting pod/invoice reconciliation',
  },
]

// ─── Dispatch Funnel ──────────────────────────────────────────────────────────

export const DISPATCH_FUNNEL = [
  { status: 'Planned',     count: 312, color: '#64748B', pct: 100 },
  { status: 'Ready',       count: 284, color: '#3B82F6', pct: 91  },
  { status: 'Dispatched',  count: 248, color: '#8B5CF6', pct: 79  },
  { status: 'In Transit',  count: 201, color: '#F59E0B', pct: 64  },
  { status: 'Arrived',     count: 178, color: '#06B6D4', pct: 57  },
  { status: 'Unloading',   count: 142, color: '#10B981', pct: 45  },
  { status: 'Reconciled',  count: 98,  color: '#16A34A', pct: 31  },
]

export const DISPATCH_TREND = [
  { day: 'Mon', planned: 280, completed: 241 },
  { day: 'Tue', planned: 310, completed: 278 },
  { day: 'Wed', planned: 295, completed: 263 },
  { day: 'Thu', planned: 325, completed: 289 },
  { day: 'Fri', planned: 340, completed: 312 },
  { day: 'Sat', planned: 215, completed: 198 },
  { day: 'Sun', planned: 190, completed: 176 },
  { day: 'Today', planned: 312, completed: 248 },
]

// ─── Live Network View ────────────────────────────────────────────────────────

export interface NetworkNode {
  id: string
  label: string
  type: 'hub' | 'depot' | 'destination'
  region: 'north' | 'south' | 'east' | 'west'
  activeVehicles: number
  pendingArrivals: number
  exceptions: number
  utilPct: number
}

export const NETWORK_NODES: NetworkNode[] = [
  { id: 'DEL', label: 'Delhi Hub',        type: 'hub',         region: 'north', activeVehicles: 68, pendingArrivals: 14, exceptions: 4, utilPct: 91 },
  { id: 'MUM', label: 'Mumbai Hub',       type: 'hub',         region: 'west',  activeVehicles: 72, pendingArrivals: 18, exceptions: 7, utilPct: 88 },
  { id: 'BLR', label: 'Bangalore Hub',    type: 'hub',         region: 'south', activeVehicles: 54, pendingArrivals: 11, exceptions: 3, utilPct: 83 },
  { id: 'HYD', label: 'Hyderabad Depot',  type: 'depot',       region: 'south', activeVehicles: 31, pendingArrivals: 8,  exceptions: 2, utilPct: 74 },
  { id: 'CHE', label: 'Chennai Depot',    type: 'depot',       region: 'south', activeVehicles: 28, pendingArrivals: 6,  exceptions: 1, utilPct: 71 },
  { id: 'KOL', label: 'Kolkata Hub',      type: 'hub',         region: 'east',  activeVehicles: 42, pendingArrivals: 9,  exceptions: 5, utilPct: 79 },
  { id: 'PUN', label: 'Pune Depot',       type: 'depot',       region: 'west',  activeVehicles: 19, pendingArrivals: 4,  exceptions: 1, utilPct: 67 },
  { id: 'AMD', label: 'Ahmedabad Depot',  type: 'depot',       region: 'west',  activeVehicles: 23, pendingArrivals: 5,  exceptions: 2, utilPct: 72 },
  { id: 'LKO', label: 'Lucknow Depot',    type: 'depot',       region: 'north', activeVehicles: 16, pendingArrivals: 3,  exceptions: 1, utilPct: 63 },
  { id: 'JAI', label: 'Jaipur Depot',     type: 'depot',       region: 'north', activeVehicles: 14, pendingArrivals: 2,  exceptions: 0, utilPct: 58 },
]

export const REGION_SUMMARY = [
  { region: 'North', dispatches: 98,  onTime: 89, exceptions: 5,  color: '#3B82F6' },
  { region: 'South', dispatches: 113, onTime: 84, exceptions: 6,  color: '#10B981' },
  { region: 'West',  dispatches: 114, onTime: 91, exceptions: 10, color: '#F59E0B' },
  { region: 'East',  dispatches: 42,  onTime: 79, exceptions: 5,  color: '#8B5CF6' },
]

// ─── Exception Command Center ──────────────────────────────────────────────────

export const EXCEPTION_SUMMARY = [
  { category: 'Delay',          count: 14, pct: 38, color: '#F59E0B', severity: 'high'     as SeverityLevel },
  { category: 'Document Issue', count: 9,  pct: 24, color: '#3B82F6', severity: 'medium'   as SeverityLevel },
  { category: 'Vehicle Breakdown', count: 6, pct: 16, color: '#DC2626', severity: 'critical' as SeverityLevel },
  { category: 'Route Deviation', count: 5, pct: 14, color: '#8B5CF6', severity: 'high'     as SeverityLevel },
  { category: 'Customer Refusal', count: 3, pct: 8,  color: '#64748B', severity: 'medium'   as SeverityLevel },
]

export const LIVE_EXCEPTIONS: ExceptionItem[] = [
  {
    id: 'EX-2401',
    category: 'Vehicle Breakdown',
    severity: 'critical',
    status: 'ESCALATED',
    dispatchId: 'D-48291',
    routeCode: 'DEL-MUM-01',
    carrier: 'Shree Mahavir Transport',
    raisedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    raisedBy: 'System Auto',
    assignee: 'Amit Kumar',
    escalationLevel: 2,
    slaBreachAt: new Date(Date.now() + 1 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'EX-2398',
    category: 'Delay',
    severity: 'high',
    status: 'IN_PROGRESS',
    dispatchId: 'D-48275',
    routeCode: 'MUM-BLR-03',
    carrier: 'Gati Kintetsu Express',
    raisedAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    raisedBy: 'Rahul Shah',
    assignee: 'Priya Nair',
    escalationLevel: 1,
    slaBreachAt: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'EX-2394',
    category: 'Document Issue',
    severity: 'medium',
    status: 'OPEN',
    dispatchId: 'D-48260',
    routeCode: 'DEL-HYD-02',
    carrier: 'Blue Dart Express',
    raisedAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
    raisedBy: 'System Auto',
    escalationLevel: 0,
    slaBreachAt: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'EX-2390',
    category: 'Route Deviation',
    severity: 'high',
    status: 'ASSIGNED',
    dispatchId: 'D-48241',
    routeCode: 'BLR-CHE-01',
    carrier: 'VRL Logistics',
    raisedAt: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
    raisedBy: 'GPS Auto',
    assignee: 'Deepak Rao',
    escalationLevel: 1,
    slaBreachAt: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'EX-2385',
    category: 'Delay',
    severity: 'critical',
    status: 'ESCALATED',
    dispatchId: 'D-48218',
    routeCode: 'KOL-DEL-02',
    carrier: 'DTDC Freight',
    raisedAt: new Date(Date.now() - 10 * 60 * 60 * 1000).toISOString(),
    raisedBy: 'System Auto',
    assignee: 'Manish Verma',
    escalationLevel: 3,
    slaBreachAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'EX-2380',
    category: 'Customer Refusal',
    severity: 'medium',
    status: 'PENDING_INFO',
    dispatchId: 'D-48198',
    routeCode: 'MUM-PUN-01',
    carrier: 'Patel Roadways',
    raisedAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
    raisedBy: 'Field Agent',
    assignee: 'Suresh Patil',
    escalationLevel: 1,
    slaBreachAt: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString(),
  },
]

export const EXCEPTION_TREND_7D = [
  { day: 'D-6', opened: 28, resolved: 24 },
  { day: 'D-5', opened: 32, resolved: 30 },
  { day: 'D-4', opened: 25, resolved: 27 },
  { day: 'D-3', opened: 41, resolved: 35 },
  { day: 'D-2', opened: 38, resolved: 33 },
  { day: 'D-1', opened: 44, resolved: 40 },
  { day: 'Today', opened: 37, resolved: 18 },
]

// ─── Route Performance ────────────────────────────────────────────────────────

export interface RoutePerf {
  routeCode: string
  routeName: string
  grade: RouteGrade
  otdPct: number
  avgDelayHrs: number
  dispatchCount: number
  exceptions: number
  costPerKm: number
  trend: 'up' | 'down' | 'stable'
  sparkline: number[]
}

export const ROUTE_PERFORMANCE: RoutePerf[] = [
  { routeCode: 'DEL-MUM-01', routeName: 'Delhi → Mumbai Express',    grade: 'A', otdPct: 96, avgDelayHrs: 0.8, dispatchCount: 42, exceptions: 1, costPerKm: 18.2, trend: 'up',     sparkline: [91,93,94,95,94,96,96] },
  { routeCode: 'BLR-CHE-01', routeName: 'Bangalore → Chennai',       grade: 'A', otdPct: 94, avgDelayHrs: 1.1, dispatchCount: 38, exceptions: 2, costPerKm: 16.8, trend: 'stable', sparkline: [92,93,93,94,94,93,94] },
  { routeCode: 'MUM-BLR-03', routeName: 'Mumbai → Bangalore Bulk',   grade: 'B', otdPct: 88, avgDelayHrs: 2.2, dispatchCount: 56, exceptions: 4, costPerKm: 22.4, trend: 'down',   sparkline: [93,92,90,89,88,89,88] },
  { routeCode: 'DEL-HYD-02', routeName: 'Delhi → Hyderabad Direct',  grade: 'B', otdPct: 85, avgDelayHrs: 2.8, dispatchCount: 31, exceptions: 3, costPerKm: 24.1, trend: 'stable', sparkline: [84,86,85,85,84,86,85] },
  { routeCode: 'KOL-DEL-02', routeName: 'Kolkata → Delhi Corridor',  grade: 'C', otdPct: 76, avgDelayHrs: 4.1, dispatchCount: 28, exceptions: 6, costPerKm: 28.7, trend: 'down',   sparkline: [82,80,79,78,77,76,76] },
  { routeCode: 'HYD-BLR-01', routeName: 'Hyderabad → Bangalore',     grade: 'B', otdPct: 89, avgDelayHrs: 1.9, dispatchCount: 24, exceptions: 2, costPerKm: 19.3, trend: 'up',     sparkline: [85,86,87,88,88,89,89] },
  { routeCode: 'AMD-MUM-01', routeName: 'Ahmedabad → Mumbai',        grade: 'C', otdPct: 78, avgDelayHrs: 3.4, dispatchCount: 19, exceptions: 5, costPerKm: 21.6, trend: 'down',   sparkline: [83,81,80,79,79,78,78] },
  { routeCode: 'JAI-DEL-01', routeName: 'Jaipur → Delhi',            grade: 'A', otdPct: 93, avgDelayHrs: 1.3, dispatchCount: 16, exceptions: 1, costPerKm: 15.4, trend: 'up',     sparkline: [89,90,91,92,92,93,93] },
  { routeCode: 'LKO-DEL-01', routeName: 'Lucknow → Delhi',           grade: 'D', otdPct: 68, avgDelayHrs: 5.8, dispatchCount: 14, exceptions: 8, costPerKm: 32.1, trend: 'down',   sparkline: [74,73,71,70,69,68,68] },
  { routeCode: 'PUN-MUM-02', routeName: 'Pune → Mumbai Shuttle',     grade: 'B', otdPct: 91, avgDelayHrs: 1.6, dispatchCount: 22, exceptions: 2, costPerKm: 17.9, trend: 'stable', sparkline: [90,91,90,91,91,90,91] },
]

export const GRADE_DISTRIBUTION = [
  { name: 'A', value: 3,  color: '#16A34A' },
  { name: 'B', value: 4,  color: '#2563EB' },
  { name: 'C', value: 2,  color: '#D97706' },
  { name: 'D', value: 1,  color: '#EA580C' },
  { name: 'F', value: 0,  color: '#DC2626' },
]

// ─── Carrier Performance ──────────────────────────────────────────────────────

export interface CarrierPerf {
  id: string
  name: string
  type: string
  otdPct: number
  otaPct: number
  openExceptions: number
  activeDispatches: number
  avgRating: number
  costScore: number
  compositeScore: number
  tier: 'Top Performer' | 'Good' | 'Monitor' | 'At Risk'
  trend: 'up' | 'down' | 'stable'
  sparkline: number[]
}

export const CARRIER_PERFORMANCE: CarrierPerf[] = [
  { id: 'C01', name: 'Blue Dart Express',       type: 'Express', otdPct: 97, otaPct: 95, openExceptions: 2,  activeDispatches: 34, avgRating: 4.8, costScore: 72, compositeScore: 94, tier: 'Top Performer', trend: 'up',     sparkline: [90,91,92,93,93,94,94] },
  { id: 'C02', name: 'Gati Kintetsu Express',   type: 'FTL',     otdPct: 93, otaPct: 91, openExceptions: 4,  activeDispatches: 41, avgRating: 4.5, costScore: 81, compositeScore: 90, tier: 'Top Performer', trend: 'stable', sparkline: [89,90,89,90,90,90,90] },
  { id: 'C03', name: 'VRL Logistics',           type: 'FTL',     otdPct: 91, otaPct: 89, openExceptions: 3,  activeDispatches: 38, avgRating: 4.4, costScore: 78, compositeScore: 88, tier: 'Good',         trend: 'up',     sparkline: [85,86,87,87,88,88,88] },
  { id: 'C04', name: 'Shree Mahavir Transport', type: 'FTL',     otdPct: 84, otaPct: 81, openExceptions: 7,  activeDispatches: 29, avgRating: 4.0, costScore: 88, compositeScore: 79, tier: 'Monitor',      trend: 'down',   sparkline: [85,84,83,82,81,80,79] },
  { id: 'C05', name: 'Patel Roadways',          type: 'LTL',     otdPct: 82, otaPct: 78, openExceptions: 8,  activeDispatches: 24, avgRating: 3.9, costScore: 91, compositeScore: 76, tier: 'Monitor',      trend: 'down',   sparkline: [82,81,80,79,78,77,76] },
  { id: 'C06', name: 'DTDC Freight',            type: 'Express', otdPct: 79, otaPct: 76, openExceptions: 11, activeDispatches: 19, avgRating: 3.6, costScore: 85, compositeScore: 71, tier: 'At Risk',      trend: 'down',   sparkline: [79,78,77,75,74,73,71] },
  { id: 'C07', name: 'SafeExpress Logistics',   type: '3PL',     otdPct: 88, otaPct: 86, openExceptions: 5,  activeDispatches: 31, avgRating: 4.2, costScore: 82, compositeScore: 83, tier: 'Good',         trend: 'stable', sparkline: [82,83,83,83,84,83,83] },
  { id: 'C08', name: 'Rivigo Technologies',     type: 'FTL',     otdPct: 94, otaPct: 92, openExceptions: 3,  activeDispatches: 36, avgRating: 4.6, costScore: 76, compositeScore: 91, tier: 'Top Performer', trend: 'up',    sparkline: [87,88,89,90,90,91,91] },
]

// ─── SLA Heatmap ──────────────────────────────────────────────────────────────

export interface HeatmapCell {
  route: string
  carrier: string
  slaBreaches: number
  slaAtRisk: number
  slaOk: number
  breachRate: number
}

const ROUTES_SHORT = ['DEL-MUM', 'MUM-BLR', 'DEL-HYD', 'BLR-CHE', 'KOL-DEL', 'AMD-MUM', 'HYD-BLR', 'PUN-MUM']
const CARRIERS_SHORT = ['Blue Dart', 'Gati', 'VRL', 'Shree MH', 'Patel RW']

export const SLA_HEATMAP: HeatmapCell[] = ROUTES_SHORT.flatMap(route =>
  CARRIERS_SHORT.map(carrier => {
    const seed = (route.charCodeAt(0) + carrier.charCodeAt(0)) % 17
    const breachRate = Math.round([0, 0, 2, 4, 6, 8, 10, 14, 18, 22, 28, 32, 5, 3, 7, 12, 16][seed])
    const total = 8 + (seed % 6)
    const breaches = Math.round(total * breachRate / 100)
    const atRisk = Math.min(Math.round(total * 0.2), total - breaches)
    return { route, carrier, slaBreaches: breaches, slaAtRisk: atRisk, slaOk: total - breaches - atRisk, breachRate }
  })
)

export const SLA_TREND_7D = [
  { day: 'D-6', ok: 94, atRisk: 4,  breached: 2  },
  { day: 'D-5', ok: 91, atRisk: 6,  breached: 3  },
  { day: 'D-4', ok: 93, atRisk: 5,  breached: 2  },
  { day: 'D-3', ok: 88, atRisk: 8,  breached: 4  },
  { day: 'D-2', ok: 85, atRisk: 9,  breached: 6  },
  { day: 'D-1', ok: 87, atRisk: 7,  breached: 6  },
  { day: 'Today', ok: 84, atRisk: 10, breached: 6 },
]

// ─── Alert Center ─────────────────────────────────────────────────────────────

export const CT_ALERTS: Alert[] = [
  {
    id: 'A-1001',
    type: 'SLA_BREACH',
    severity: 'critical',
    message: 'KOL-DEL-02: D-48218 SLA breached — 1h 12m overdue. Escalation L3 triggered.',
    dispatchId: 'D-48218',
    routeCode: 'KOL-DEL-02',
    firedAt: new Date(Date.now() - 72 * 60 * 1000).toISOString(),
    acknowledged: false,
  },
  {
    id: 'A-1002',
    type: 'ESCALATED_EXCEPTION',
    severity: 'critical',
    message: 'Vehicle breakdown on DEL-MUM-01: MH12XY9901 — recovery vehicle dispatched.',
    dispatchId: 'D-48291',
    routeCode: 'DEL-MUM-01',
    firedAt: new Date(Date.now() - 110 * 60 * 1000).toISOString(),
    acknowledged: false,
  },
  {
    id: 'A-1003',
    type: 'HIGH_RISK',
    severity: 'high',
    message: '8 dispatches at SLA risk on MUM-BLR corridor — heavy traffic near Pune bypass.',
    routeCode: 'MUM-BLR-03',
    firedAt: new Date(Date.now() - 28 * 60 * 1000).toISOString(),
    acknowledged: false,
  },
  {
    id: 'A-1004',
    type: 'HIGH_RISK',
    severity: 'high',
    message: 'DTDC Freight OTD dropped below 75% threshold — review KPI dashboard.',
    firedAt: new Date(Date.now() - 185 * 60 * 1000).toISOString(),
    acknowledged: true,
  },
  {
    id: 'A-1005',
    type: 'OVERDUE_RECONCILIATION',
    severity: 'medium',
    message: '31 dispatches pending reconciliation — oldest is 4 days overdue.',
    firedAt: new Date(Date.now() - 240 * 60 * 1000).toISOString(),
    acknowledged: false,
  },
  {
    id: 'A-1006',
    type: 'INTEGRATION_FAILURE',
    severity: 'medium',
    message: 'GPS feed lost for 3 vehicles — VRL Logistics fleet (MH-plate). IT notified.',
    firedAt: new Date(Date.now() - 320 * 60 * 1000).toISOString(),
    acknowledged: true,
  },
  {
    id: 'A-1007',
    type: 'SLA_BREACH',
    severity: 'high',
    message: 'DEL-HYD-02: D-48260 approaching SLA window — ETA +3.2h over commitment.',
    dispatchId: 'D-48260',
    routeCode: 'DEL-HYD-02',
    firedAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    acknowledged: false,
  },
]
