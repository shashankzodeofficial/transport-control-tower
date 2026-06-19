import type { Alert, AlertType } from '@/types'

const now = Date.now()
const minsAgo = (m: number) => new Date(now - m * 60000).toISOString()

export const SEED_ALERTS: Alert[] = [
  {
    id: 'ALT-001',
    type: 'SLA_BREACH',
    severity: 'critical',
    message: 'Dispatch D-48291 (MUM→DEL) has breached SLA by 2h 15m — delivery expected by 06:00 not met.',
    dispatchId: 'D-48291',
    routeCode: 'RT-MUM-DEL-01',
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
    firedAt: minsAgo(62),
    acknowledged: false,
  },
  {
    id: 'ALT-006',
    type: 'HIGH_RISK',
    severity: 'high',
    message: 'Carrier "FastMove Logistics" has 4 open exceptions this week — composite score dropped to 61 (Watch List threshold).',
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
  },
  {
    id: 'ALT-008',
    type: 'SLA_BREACH',
    severity: 'medium',
    message: 'Route RT-CHN-BLR-04 OTD dropped to 64% this week — 3 of 5 dispatches late by >2h.',
    routeCode: 'RT-CHN-BLR-04',
    firedAt: minsAgo(145),
    acknowledged: false,
  },
  {
    id: 'ALT-009',
    type: 'OVERDUE_RECONCILIATION',
    severity: 'medium',
    message: '2 reconciliation records have been in "Discrepancy" state for >72h without action: RECON-0007, RECON-0011.',
    firedAt: minsAgo(190),
    acknowledged: true,
  },
  {
    id: 'ALT-010',
    type: 'INTEGRATION_FAILURE',
    severity: 'medium',
    message: 'GPS ping gap detected for vehicle GJ05AB1234 — no telemetry received in last 55 minutes.',
    dispatchId: 'D-48295',
    routeCode: 'RT-AMD-SUR-02',
    firedAt: minsAgo(220),
    acknowledged: false,
  },
]

// Metadata labels for display
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
