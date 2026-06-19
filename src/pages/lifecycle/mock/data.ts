const now = Date.now()
const t   = (minsAgo: number)   => new Date(now - minsAgo  * 60000).toISOString()
const tf  = (minsAhead: number) => new Date(now + minsAhead * 60000).toISOString()

// ─── 14-stage lifecycle status ────────────────────────────────────────────────

export type LifecycleStatus =
  | 'planned'
  | 'ready'
  | 'gate_in_origin'
  | 'loading'
  | 'gate_out_origin'
  | 'dispatched'
  | 'in_transit'
  | 'arrived_dest'
  | 'gate_in_dest'
  | 'dock_assigned'
  | 'unloading'
  | 'received'
  | 'reconciled'
  | 'closed'

export const LIFECYCLE_STAGES: LifecycleStatus[] = [
  'planned','ready','gate_in_origin','loading','gate_out_origin',
  'dispatched','in_transit','arrived_dest','gate_in_dest',
  'dock_assigned','unloading','received','reconciled','closed',
]

export const STAGE_LABEL: Record<LifecycleStatus, string> = {
  planned:        'Planned',
  ready:          'Ready',
  gate_in_origin: 'Gate In Origin',
  loading:        'Loading',
  gate_out_origin:'Gate Out Origin',
  dispatched:     'Dispatched',
  in_transit:     'In Transit',
  arrived_dest:   'Arrived Dest.',
  gate_in_dest:   'Gate In Dest.',
  dock_assigned:  'Dock Assigned',
  unloading:      'Unloading',
  received:       'Received',
  reconciled:     'Reconciled',
  closed:         'Closed',
}

export const STAGE_SHORT: Record<LifecycleStatus, string> = {
  planned:        'Planned',
  ready:          'Ready',
  gate_in_origin: 'Gate In (O)',
  loading:        'Loading',
  gate_out_origin:'Gate Out (O)',
  dispatched:     'Dispatched',
  in_transit:     'In Transit',
  arrived_dest:   'Arrived (D)',
  gate_in_dest:   'Gate In (D)',
  dock_assigned:  'Dock Assgn.',
  unloading:      'Unloading',
  received:       'Received',
  reconciled:     'Reconciled',
  closed:         'Closed',
}

// Phase grouping for color coding
export type Phase = 'origin' | 'transit' | 'destination' | 'complete'

export const STAGE_PHASE: Record<LifecycleStatus, Phase> = {
  planned:        'origin',
  ready:          'origin',
  gate_in_origin: 'origin',
  loading:        'origin',
  gate_out_origin:'origin',
  dispatched:     'transit',
  in_transit:     'transit',
  arrived_dest:   'transit',
  gate_in_dest:   'destination',
  dock_assigned:  'destination',
  unloading:      'destination',
  received:       'destination',
  reconciled:     'complete',
  closed:         'complete',
}

export const PHASE_STYLE: Record<Phase, { bg: string; text: string; light: string }> = {
  origin:      { bg: 'bg-blue-600',  text: 'text-blue-700',  light: 'bg-blue-50  text-blue-700  border-blue-200'  },
  transit:     { bg: 'bg-amber-500', text: 'text-amber-700', light: 'bg-amber-50 text-amber-700 border-amber-200' },
  destination: { bg: 'bg-violet-600',text: 'text-violet-700',light: 'bg-violet-50 text-violet-700 border-violet-200' },
  complete:    { bg: 'bg-green-600', text: 'text-green-700', light: 'bg-green-50 text-green-700 border-green-200' },
}

// ─── Dispatch timeline interface ──────────────────────────────────────────────

export interface DispatchTimeline {
  id: string
  dispatchId: string
  vehicleNumber: string
  carrier: string
  routeCode: string
  origin: string
  destination: string
  plannedHUs: number
  status: LifecycleStatus
  slaStatus: 'on_time' | 'at_risk' | 'breached'
  // All timestamps
  plannedAt?: string
  readyAt?: string
  gateInOriginAt?: string
  loadingStartAt?: string
  gateOutOriginAt?: string
  dispatchedAt?: string
  inTransitAt?: string
  arrivedDestAt?: string
  gateInDestAt?: string
  dockAssignedAt?: string
  unloadingStartAt?: string
  receivedAt?: string
  reconciledAt?: string
  closedAt?: string
  // Planned milestones
  plannedDispatch: string
  plannedArrival: string
  remarks?: string
}

// ─── Computed helpers ─────────────────────────────────────────────────────────

export function stageTimestamp(d: DispatchTimeline, stage: LifecycleStatus): string | undefined {
  const map: Partial<Record<LifecycleStatus, string | undefined>> = {
    planned:        d.plannedAt,
    ready:          d.readyAt,
    gate_in_origin: d.gateInOriginAt,
    loading:        d.loadingStartAt,
    gate_out_origin:d.gateOutOriginAt,
    dispatched:     d.dispatchedAt,
    in_transit:     d.inTransitAt,
    arrived_dest:   d.arrivedDestAt,
    gate_in_dest:   d.gateInDestAt,
    dock_assigned:  d.dockAssignedAt,
    unloading:      d.unloadingStartAt,
    received:       d.receivedAt,
    reconciled:     d.reconciledAt,
    closed:         d.closedAt,
  }
  return map[stage]
}

export function stageCompletionPct(d: DispatchTimeline): number {
  const idx = LIFECYCLE_STAGES.indexOf(d.status)
  return Math.round((idx / (LIFECYCLE_STAGES.length - 1)) * 100)
}

export function originToDestMins(d: DispatchTimeline): number | null {
  if (!d.gateOutOriginAt || !d.arrivedDestAt) return null
  return Math.round((new Date(d.arrivedDestAt).getTime() - new Date(d.gateOutOriginAt).getTime()) / 60000)
}

export function totalLifecycleMins(d: DispatchTimeline): number | null {
  if (!d.plannedAt || !d.closedAt) return null
  return Math.round((new Date(d.closedAt).getTime() - new Date(d.plannedAt).getTime()) / 60000)
}

function fmtMins(mins: number): string {
  if (mins < 60) return `${mins}m`
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return m > 0 ? `${h}h ${m}m` : `${h}h`
}
export { fmtMins }

// ─── Mock data — 16 dispatches across all 14 stages ──────────────────────────

export const DISPATCH_LIFECYCLES: DispatchTimeline[] = [
  // Stage 1: Planned
  {
    id: 'LC-001', dispatchId: 'DSP-2024-1401',
    vehicleNumber: 'MH12ZZ5001', carrier: 'Blue Dart Express',
    routeCode: 'MUM-DEL-07', origin: 'Mumbai (Bhiwandi Hub)', destination: 'Delhi (Naraina WH)',
    plannedHUs: 64, status: 'planned', slaStatus: 'on_time',
    plannedAt: t(120),
    plannedDispatch: tf(180), plannedArrival: tf(780),
  },
  {
    id: 'LC-002', dispatchId: 'DSP-2024-1402',
    vehicleNumber: 'KA14PP9823', carrier: 'Rivigo Technologies',
    routeCode: 'BLR-MUM-05', origin: 'Bangalore (Electronic City)', destination: 'Mumbai (Bhiwandi Hub)',
    plannedHUs: 52, status: 'planned', slaStatus: 'on_time',
    plannedAt: t(60),
    plannedDispatch: tf(240), plannedArrival: tf(960),
  },

  // Stage 2: Ready
  {
    id: 'LC-003', dispatchId: 'DSP-2024-1389',
    vehicleNumber: 'DL04XY7612', carrier: 'Gati Kintetsu Express',
    routeCode: 'DEL-KOL-03', origin: 'Delhi (Naraina WH)', destination: 'Kolkata (Rajarhat Hub)',
    plannedHUs: 88, status: 'ready', slaStatus: 'on_time',
    plannedAt: t(240), readyAt: t(45),
    plannedDispatch: tf(75), plannedArrival: tf(975),
  },

  // Stage 3: Gate In Origin
  {
    id: 'LC-004', dispatchId: 'DSP-2024-1376',
    vehicleNumber: 'GJ09QR2245', carrier: 'VRL Logistics',
    routeCode: 'AMD-BLR-02', origin: 'Ahmedabad (Naroda Depot)', destination: 'Bangalore (Electronic City)',
    plannedHUs: 36, status: 'gate_in_origin', slaStatus: 'on_time',
    plannedAt: t(360), readyAt: t(120), gateInOriginAt: t(55),
    plannedDispatch: tf(30), plannedArrival: tf(810),
  },

  // Stage 4: Loading
  {
    id: 'LC-005', dispatchId: 'DSP-2024-1371',
    vehicleNumber: 'MH43BC4567', carrier: 'SafeExpress Logistics',
    routeCode: 'MUM-HYD-04', origin: 'Mumbai (Bhiwandi Hub)', destination: 'Hyderabad (Uppal Hub)',
    plannedHUs: 57, status: 'loading', slaStatus: 'at_risk',
    plannedAt: t(480), readyAt: t(240), gateInOriginAt: t(130), loadingStartAt: t(95),
    plannedDispatch: t(20), plannedArrival: tf(520),
    remarks: 'Loading slower than planned — 2 workers absent',
  },

  // Stage 5: Gate Out Origin
  {
    id: 'LC-006', dispatchId: 'DSP-2024-1365',
    vehicleNumber: 'UP16MN8901', carrier: 'DTDC Freight',
    routeCode: 'LKO-DEL-01', origin: 'Lucknow (Amausi Depot)', destination: 'Delhi (Naraina WH)',
    plannedHUs: 42, status: 'gate_out_origin', slaStatus: 'on_time',
    plannedAt: t(600), readyAt: t(360), gateInOriginAt: t(200), loadingStartAt: t(160), gateOutOriginAt: t(30),
    plannedDispatch: t(40), plannedArrival: tf(330),
  },

  // Stage 6: Dispatched
  {
    id: 'LC-007', dispatchId: 'DSP-2024-1358',
    vehicleNumber: 'RJ19ST6712', carrier: 'Patel Roadways',
    routeCode: 'JAI-MUM-02', origin: 'Jaipur (Sitapura Depot)', destination: 'Mumbai (Bhiwandi Hub)',
    plannedHUs: 29, status: 'dispatched', slaStatus: 'on_time',
    plannedAt: t(720), readyAt: t(480), gateInOriginAt: t(320), loadingStartAt: t(280), gateOutOriginAt: t(90), dispatchedAt: t(85),
    plannedDispatch: t(90), plannedArrival: tf(555),
  },

  // Stage 7: In Transit
  {
    id: 'LC-008', dispatchId: 'DSP-2024-1342',
    vehicleNumber: 'TS07UV3456', carrier: 'Rivigo Technologies',
    routeCode: 'HYD-BLR-02', origin: 'Hyderabad (Uppal Hub)', destination: 'Bangalore (Electronic City)',
    plannedHUs: 61, status: 'in_transit', slaStatus: 'at_risk',
    plannedAt: t(960), readyAt: t(720), gateInOriginAt: t(520), loadingStartAt: t(480), gateOutOriginAt: t(290), dispatchedAt: t(285), inTransitAt: t(285),
    plannedDispatch: t(300), plannedArrival: tf(195),
    remarks: 'Delayed by 15 min from planned dispatch',
  },
  {
    id: 'LC-009', dispatchId: 'DSP-2024-1339',
    vehicleNumber: 'WB11CD8823', carrier: 'Gati Kintetsu Express',
    routeCode: 'KOL-HYD-01', origin: 'Kolkata (Rajarhat Hub)', destination: 'Hyderabad (Uppal Hub)',
    plannedHUs: 74, status: 'in_transit', slaStatus: 'breached',
    plannedAt: t(1440), readyAt: t(1200), gateInOriginAt: t(980), loadingStartAt: t(940), gateOutOriginAt: t(680), dispatchedAt: t(672), inTransitAt: t(672),
    plannedDispatch: t(720), plannedArrival: t(180),
    remarks: 'SLA breach — ETA overshot planned arrival by 3h',
  },

  // Stage 8: Arrived Destination
  {
    id: 'LC-010', dispatchId: 'DSP-2024-1328',
    vehicleNumber: 'TN22IJ9012', carrier: 'SafeExpress Logistics',
    routeCode: 'CHE-HYD-01', origin: 'Chennai (Ambattur WH)', destination: 'Hyderabad (Uppal Hub)',
    plannedHUs: 51, status: 'arrived_dest', slaStatus: 'on_time',
    plannedAt: t(1560), readyAt: t(1320), gateInOriginAt: t(1080), loadingStartAt: t(1040), gateOutOriginAt: t(820), dispatchedAt: t(815), inTransitAt: t(815), arrivedDestAt: t(50),
    plannedDispatch: t(820), plannedArrival: t(60),
  },

  // Stage 9: Gate In Destination
  {
    id: 'LC-011', dispatchId: 'DSP-2024-1319',
    vehicleNumber: 'MH04KL3456', carrier: 'Rivigo Technologies',
    routeCode: 'MUM-HYD-02', origin: 'Mumbai (Bhiwandi Hub)', destination: 'Hyderabad (Uppal Hub)',
    plannedHUs: 60, status: 'gate_in_dest', slaStatus: 'on_time',
    plannedAt: t(1680), readyAt: t(1440), gateInOriginAt: t(1200), loadingStartAt: t(1160), gateOutOriginAt: t(940), dispatchedAt: t(935), inTransitAt: t(935), arrivedDestAt: t(140), gateInDestAt: t(122),
    plannedDispatch: t(940), plannedArrival: t(150),
  },

  // Stage 10: Dock Assigned
  {
    id: 'LC-012', dispatchId: 'DSP-2024-1305',
    vehicleNumber: 'DL01CD7890', carrier: 'Blue Dart Express',
    routeCode: 'DEL-BLR-01', origin: 'Delhi (Naraina WH)', destination: 'Bangalore (Electronic City)',
    plannedHUs: 55, status: 'dock_assigned', slaStatus: 'on_time',
    plannedAt: t(1800), readyAt: t(1560), gateInOriginAt: t(1320), loadingStartAt: t(1280), gateOutOriginAt: t(1060), dispatchedAt: t(1055), inTransitAt: t(1055), arrivedDestAt: t(220), gateInDestAt: t(202), dockAssignedAt: t(178),
    plannedDispatch: t(1060), plannedArrival: t(200),
  },

  // Stage 11: Unloading
  {
    id: 'LC-013', dispatchId: 'DSP-2024-1294',
    vehicleNumber: 'KA09GH5678', carrier: 'VRL Logistics',
    routeCode: 'BLR-CHE-01', origin: 'Bangalore (Electronic City)', destination: 'Chennai (Ambattur WH)',
    plannedHUs: 35, status: 'unloading', slaStatus: 'on_time',
    plannedAt: t(1920), readyAt: t(1680), gateInOriginAt: t(1440), loadingStartAt: t(1400), gateOutOriginAt: t(1180), dispatchedAt: t(1175), inTransitAt: t(1175), arrivedDestAt: t(340), gateInDestAt: t(322), dockAssignedAt: t(298), unloadingStartAt: t(270),
    plannedDispatch: t(1180), plannedArrival: t(310),
  },

  // Stage 12: Received
  {
    id: 'LC-014', dispatchId: 'DSP-2024-1281',
    vehicleNumber: 'GJ05EF1234', carrier: 'Patel Roadways',
    routeCode: 'AMD-MUM-01', origin: 'Ahmedabad (Naroda Depot)', destination: 'Mumbai (Bhiwandi Hub)',
    plannedHUs: 18, status: 'received', slaStatus: 'on_time',
    plannedAt: t(2040), readyAt: t(1800), gateInOriginAt: t(1560), loadingStartAt: t(1520), gateOutOriginAt: t(1300), dispatchedAt: t(1295), inTransitAt: t(1295), arrivedDestAt: t(460), gateInDestAt: t(442), dockAssignedAt: t(418), unloadingStartAt: t(390), receivedAt: t(280),
    plannedDispatch: t(1300), plannedArrival: t(420),
  },

  // Stage 13: Reconciled
  {
    id: 'LC-015', dispatchId: 'DSP-2024-1265',
    vehicleNumber: 'MH12AB3456', carrier: 'Gati Kintetsu Express',
    routeCode: 'MUM-BLR-03', origin: 'Mumbai (Bhiwandi Hub)', destination: 'Bangalore (Electronic City)',
    plannedHUs: 42, status: 'reconciled', slaStatus: 'on_time',
    plannedAt: t(2160), readyAt: t(1920), gateInOriginAt: t(1680), loadingStartAt: t(1640), gateOutOriginAt: t(1420), dispatchedAt: t(1415), inTransitAt: t(1415), arrivedDestAt: t(580), gateInDestAt: t(562), dockAssignedAt: t(538), unloadingStartAt: t(510), receivedAt: t(400), reconciledAt: t(355),
    plannedDispatch: t(1420), plannedArrival: t(540),
  },

  // Stage 14: Closed
  {
    id: 'LC-016', dispatchId: 'DSP-2024-1249',
    vehicleNumber: 'UP32MN7890', carrier: 'Rivigo Technologies',
    routeCode: 'DEL-LKO-01', origin: 'Delhi (Naraina WH)', destination: 'Lucknow (Amausi Depot)',
    plannedHUs: 82, status: 'closed', slaStatus: 'on_time',
    plannedAt: t(2880), readyAt: t(2640), gateInOriginAt: t(2400), loadingStartAt: t(2360), gateOutOriginAt: t(2140), dispatchedAt: t(2135), inTransitAt: t(2135), arrivedDestAt: t(820), gateInDestAt: t(802), dockAssignedAt: t(778), unloadingStartAt: t(750), receivedAt: t(640), reconciledAt: t(595), closedAt: t(580),
    plannedDispatch: t(2140), plannedArrival: t(780),
  },
]

export const SLA_STYLE: Record<string, { bg: string; text: string; dot: string }> = {
  on_time:  { bg: 'bg-green-100',  text: 'text-green-700',  dot: 'bg-green-500'  },
  at_risk:  { bg: 'bg-amber-100',  text: 'text-amber-700',  dot: 'bg-amber-500'  },
  breached: { bg: 'bg-red-100',    text: 'text-red-700',    dot: 'bg-red-500'    },
}

export const SLA_LABEL: Record<string, string> = {
  on_time: 'On Time', at_risk: 'At Risk', breached: 'Breached',
}
