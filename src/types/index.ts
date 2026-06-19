import type { DispatchStatus, SeverityLevel, RouteGrade, StatusType, TrendDirection } from '@/theme'

// ─── Shared domain types ──────────────────────────────────────────────────────

export interface KPIData {
  label: string
  value: number | string
  unit?: string
  trend?: {
    direction: TrendDirection
    delta: string
    period: string
  }
  status: StatusType
  progress?: number      // 0–100, renders thin bar
  onClick?: () => void
  tooltip?: string
}

export interface Dispatch {
  id: string
  status: DispatchStatus
  routeCode: string
  routeName: string
  origin: string
  destination: string
  vehicleReg: string
  carrier: string
  plannedDeparture: string
  plannedArrival: string
  actualDeparture?: string
  actualArrival?: string
  huCount: number
  exceptionCount: number
  slaStatus: 'ok' | 'at-risk' | 'breached'
  slaHoursRemaining?: number
  slaHoursOverdue?: number
}

export interface ExceptionItem {
  id: string
  category: string
  severity: SeverityLevel
  status: ExceptionState
  dispatchId: string
  routeCode: string
  carrier: string
  raisedAt: string
  raisedBy: string
  assignee?: string
  escalationLevel?: number
  rootCause?: string
  resolutionNote?: string
  slaBreachAt?: string
}

export type ExceptionState =
  | 'OPEN'
  | 'ASSIGNED'
  | 'IN_PROGRESS'
  | 'ESCALATED'
  | 'PENDING_INFO'
  | 'RESOLVED'
  | 'CLOSED'
  | 'AUTO_RESOLVED'

export interface RoutePerformance {
  routeId: string
  routeCode: string
  routeName: string
  grade: RouteGrade
  otaPct: number
  otdPct: number
  delayMinutes: number
  costPerKm: number
  compositeScore: number
  exceptionCount: number
  dispatchCount: number
}

export interface CarrierPerformance {
  carrierId: string
  name: string
  type: 'FTL' | 'LTL' | 'LCV' | '3PL' | 'Express'
  otaPct: number
  otdPct: number
  openExceptions: number
  compositeScore: number
  costPerKm: number
  statusLabel: 'Top Performer' | 'Good' | 'Monitor' | 'At Risk'
}

// ─── Filter types ─────────────────────────────────────────────────────────────

export type DateRangePreset = 'today' | 'yesterday' | '7d' | '30d' | 'month' | 'custom'

export interface DateRange {
  preset: DateRangePreset
  from: Date
  to: Date
}

export interface GlobalFilters {
  dateRange: DateRange
  region: string        // '' = all
  routes: string[]      // [] = all
  carriers: string[]    // [] = all
}

// ─── Navigation types ────────────────────────────────────────────────────────

export interface NavItemDef {
  key: string
  label: string
  icon: string
  path: string
  badge?: number
  badgeLevel?: 'critical' | 'high'
  permission?: string
}

export interface NavGroupDef {
  key: string
  label: string
  items: NavItemDef[]
}

// ─── Table types ─────────────────────────────────────────────────────────────

export type CellEditType = 'text' | 'number' | 'dropdown' | 'date' | 'toggle'

export interface ColumnDef<T = Record<string, unknown>> {
  key: string
  label: string
  width?: number
  minWidth?: number
  sortable?: boolean
  editable?: boolean
  editType?: CellEditType
  options?: { value: string; label: string }[]
  render?: (value: unknown, row: T) => React.ReactNode
  align?: 'left' | 'center' | 'right'
  sticky?: boolean
  hide?: boolean
}

export interface SortState {
  key: string
  dir: 'asc' | 'desc'
}

export interface PaginationState {
  page: number
  pageSize: number
  total: number
}

// ─── Drawer types ─────────────────────────────────────────────────────────────

export interface DrawerTab {
  key: string
  label: string
  badge?: number
}

export interface BreadcrumbItem {
  label: string
  href?: string
}

// ─── Alert types ─────────────────────────────────────────────────────────────

export type AlertType =
  | 'SLA_BREACH'
  | 'HIGH_RISK'
  | 'ESCALATED_EXCEPTION'
  | 'OVERDUE_RECONCILIATION'
  | 'INTEGRATION_FAILURE'

export type AckAction =
  | 'carrier_escalated'
  | 'alternate_vehicle'
  | 'route_changed'
  | 'delivery_replanned'
  | 'driver_contacted'
  | 'hub_escalated'
  | 'customer_escalated'
  | 'monitoring_only'

export type EscalationLevel =
  | 'regional_manager'
  | 'transport_head'
  | 'control_tower'

export interface Alert {
  id: string
  type: AlertType
  severity: 'critical' | 'high' | 'medium'
  message: string
  dispatchId?: string
  routeCode?: string
  carrierName?: string
  delayMins?: number
  firedAt: string
  acknowledged: boolean
  ackedAt?: string
  ackedBy?: string
  ackAction?: AckAction
  ackRemarks?: string
  escalationLevel?: EscalationLevel
  closedAt?: string
}
