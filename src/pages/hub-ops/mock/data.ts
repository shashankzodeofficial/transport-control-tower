const now = Date.now()
const t   = (minsAgo: number) => new Date(now - minsAgo * 60000).toISOString()
const tf  = (minsAhead: number) => new Date(now + minsAhead * 60000).toISOString()

export type HubStatus =
  | 'arrived'
  | 'gate_in'
  | 'loading'
  | 'loaded'
  | 'gate_out'
  | 'dispatched'

export type VehicleType = 'FTL' | 'LTL' | 'LCV' | 'Trailer' | 'Reefer'
export type PriorityLevel = 'normal' | 'urgent' | 'delayed'

export interface HubVehicle {
  id: string
  vehicleNumber: string
  vehicleType: VehicleType
  carrier: string
  driverName: string
  driverMobile: string
  routeCode: string
  origin: string
  destination: string
  plannedHUs: number
  loadedHUs: number
  weightKg: number
  status: HubStatus
  priority: PriorityLevel
  // Timeline (ISO strings)
  arrivedAt?: string
  gateInAt?: string
  loadingStartAt?: string
  loadingCompleteAt?: string
  gateOutAt?: string
  dispatchedAt?: string
  // Planned
  plannedDeparture: string
  // Remarks
  remarks?: string
}

// ─── Computed helpers ─────────────────────────────────────────────────────────

export function hubDwellMins(v: HubVehicle): number | null {
  if (!v.gateInAt || !v.gateOutAt) return null
  return Math.round((new Date(v.gateOutAt).getTime() - new Date(v.gateInAt).getTime()) / 60000)
}

export function loadingTimeMins(v: HubVehicle): number | null {
  if (!v.loadingStartAt || !v.loadingCompleteAt) return null
  return Math.round((new Date(v.loadingCompleteAt).getTime() - new Date(v.loadingStartAt).getTime()) / 60000)
}

export function turnaroundMins(v: HubVehicle): number | null {
  if (!v.arrivedAt || !v.dispatchedAt) return null
  return Math.round((new Date(v.dispatchedAt).getTime() - new Date(v.arrivedAt).getTime()) / 60000)
}

export function fmtMins(mins: number): string {
  if (mins < 60) return `${mins}m`
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return m > 0 ? `${h}h ${m}m` : `${h}h`
}

export function isDelayed(v: HubVehicle): boolean {
  if (['gate_out', 'dispatched'].includes(v.status)) return false
  return new Date(v.plannedDeparture) < new Date()
}

// ─── Mock vehicles ────────────────────────────────────────────────────────────

export const HUB_VEHICLES: HubVehicle[] = [
  // ── Arrived (waiting for gate in) ─────────────────────────────────────────
  {
    id: 'HV-001',
    vehicleNumber: 'MH12AB3456',
    vehicleType: 'FTL',
    carrier: 'VRL Logistics',
    driverName: 'Ramesh Kumar',
    driverMobile: '9876543210',
    routeCode: 'MUM-BLR-03',
    origin: 'Mumbai (Bhiwandi Hub)',
    destination: 'Bangalore (Electronic City)',
    plannedHUs: 42,
    loadedHUs: 0,
    weightKg: 8400,
    status: 'arrived',
    priority: 'normal',
    arrivedAt: t(12),
    plannedDeparture: tf(48),
  },
  {
    id: 'HV-002',
    vehicleNumber: 'DL01CD7890',
    vehicleType: 'Trailer',
    carrier: 'Gati Kintetsu Express',
    driverName: 'Suresh Yadav',
    driverMobile: '9812345678',
    routeCode: 'DEL-MUM-01',
    origin: 'Delhi (Naraina WH)',
    destination: 'Mumbai (Bhiwandi Hub)',
    plannedHUs: 68,
    loadedHUs: 0,
    weightKg: 18500,
    status: 'arrived',
    priority: 'urgent',
    arrivedAt: t(8),
    plannedDeparture: tf(20),
    remarks: 'Priority shipment — FMCG restocking',
  },
  {
    id: 'HV-003',
    vehicleNumber: 'GJ05EF1234',
    vehicleType: 'LCV',
    carrier: 'Patel Roadways',
    driverName: 'Bhavesh Shah',
    driverMobile: '9909876543',
    routeCode: 'AMD-MUM-01',
    origin: 'Ahmedabad (Naroda Depot)',
    destination: 'Mumbai (Bhiwandi Hub)',
    plannedHUs: 18,
    loadedHUs: 0,
    weightKg: 2200,
    status: 'arrived',
    priority: 'delayed',
    arrivedAt: t(95),
    plannedDeparture: t(30),
    remarks: 'Arrived 65 min late — traffic on NH48',
  },

  // ── Gate In (waiting for dock assignment / pre-loading) ───────────────────
  {
    id: 'HV-004',
    vehicleNumber: 'KA09GH5678',
    vehicleType: 'FTL',
    carrier: 'Blue Dart Express',
    driverName: 'Mahesh Nair',
    driverMobile: '9845012345',
    routeCode: 'BLR-CHE-01',
    origin: 'Bangalore (Electronic City)',
    destination: 'Chennai (Ambattur WH)',
    plannedHUs: 35,
    loadedHUs: 0,
    weightKg: 6200,
    status: 'gate_in',
    priority: 'normal',
    arrivedAt: t(55),
    gateInAt: t(40),
    plannedDeparture: tf(60),
  },
  {
    id: 'HV-005',
    vehicleNumber: 'TN22IJ9012',
    vehicleType: 'FTL',
    carrier: 'SafeExpress Logistics',
    driverName: 'Anand Krishnan',
    driverMobile: '9444123456',
    routeCode: 'CHE-HYD-01',
    origin: 'Chennai (Ambattur WH)',
    destination: 'Hyderabad (Uppal Hub)',
    plannedHUs: 51,
    loadedHUs: 0,
    weightKg: 11400,
    status: 'gate_in',
    priority: 'delayed',
    arrivedAt: t(110),
    gateInAt: t(90),
    plannedDeparture: t(15),
    remarks: 'Dock 3 — awaiting forklift',
  },

  // ── Loading (in progress) ─────────────────────────────────────────────────
  {
    id: 'HV-006',
    vehicleNumber: 'MH04KL3456',
    vehicleType: 'FTL',
    carrier: 'Rivigo Technologies',
    driverName: 'Prashant Deshpande',
    driverMobile: '9322567890',
    routeCode: 'MUM-HYD-02',
    origin: 'Mumbai (Bhiwandi Hub)',
    destination: 'Hyderabad (Uppal Hub)',
    plannedHUs: 60,
    loadedHUs: 34,
    weightKg: 14000,
    status: 'loading',
    priority: 'normal',
    arrivedAt: t(140),
    gateInAt: t(120),
    loadingStartAt: t(95),
    plannedDeparture: tf(25),
  },
  {
    id: 'HV-007',
    vehicleNumber: 'UP32MN7890',
    vehicleType: 'Trailer',
    carrier: 'Gati Kintetsu Express',
    driverName: 'Vijay Pandey',
    driverMobile: '9839012345',
    routeCode: 'DEL-LKO-01',
    origin: 'Delhi (Naraina WH)',
    destination: 'Lucknow (Amausi Depot)',
    plannedHUs: 82,
    loadedHUs: 55,
    weightKg: 22000,
    status: 'loading',
    priority: 'urgent',
    arrivedAt: t(200),
    gateInAt: t(180),
    loadingStartAt: t(150),
    plannedDeparture: tf(10),
    remarks: 'Dock 1 — 3 workers. Speed up — 10 min to planned departure',
  },
  {
    id: 'HV-008',
    vehicleNumber: 'RJ14OP2345',
    vehicleType: 'LTL',
    carrier: 'DTDC Freight',
    driverName: 'Kamlesh Sharma',
    driverMobile: '9772345678',
    routeCode: 'JAI-DEL-01',
    origin: 'Jaipur (Sitapura Depot)',
    destination: 'Delhi (Naraina WH)',
    plannedHUs: 28,
    loadedHUs: 28,
    weightKg: 4500,
    status: 'loading',
    priority: 'normal',
    arrivedAt: t(175),
    gateInAt: t(155),
    loadingStartAt: t(120),
    plannedDeparture: tf(30),
  },

  // ── Loading Complete (gate out pending) ───────────────────────────────────
  {
    id: 'HV-009',
    vehicleNumber: 'WB24QR6789',
    vehicleType: 'FTL',
    carrier: 'VRL Logistics',
    driverName: 'Tapan Roy',
    driverMobile: '9831234567',
    routeCode: 'KOL-DEL-02',
    origin: 'Kolkata (Rajarhat Hub)',
    destination: 'Delhi (Naraina WH)',
    plannedHUs: 74,
    loadedHUs: 74,
    weightKg: 16800,
    status: 'loaded',
    priority: 'urgent',
    arrivedAt: t(280),
    gateInAt: t(258),
    loadingStartAt: t(220),
    loadingCompleteAt: t(45),
    plannedDeparture: t(10),
    remarks: 'Gate out pending — documentation check',
  },
  {
    id: 'HV-010',
    vehicleNumber: 'MH43ST1234',
    vehicleType: 'Reefer',
    carrier: 'Blue Dart Express',
    driverName: 'Santosh Patil',
    driverMobile: '9370456789',
    routeCode: 'MUM-PUN-01',
    origin: 'Mumbai (Bhiwandi Hub)',
    destination: 'Pune (Chakan WH)',
    plannedHUs: 24,
    loadedHUs: 24,
    weightKg: 5100,
    status: 'loaded',
    priority: 'delayed',
    arrivedAt: t(320),
    gateInAt: t(300),
    loadingStartAt: t(265),
    loadingCompleteAt: t(60),
    plannedDeparture: t(45),
    remarks: 'Cold chain verified — reefer at 4°C. Gate out doc pending',
  },

  // ── Gate Out ──────────────────────────────────────────────────────────────
  {
    id: 'HV-011',
    vehicleNumber: 'TS09UV5678',
    vehicleType: 'FTL',
    carrier: 'Rivigo Technologies',
    driverName: 'Ravi Reddy',
    driverMobile: '9848567890',
    routeCode: 'HYD-BLR-01',
    origin: 'Hyderabad (Uppal Hub)',
    destination: 'Bangalore (Electronic City)',
    plannedHUs: 48,
    loadedHUs: 48,
    weightKg: 10200,
    status: 'gate_out',
    priority: 'normal',
    arrivedAt: t(360),
    gateInAt: t(338),
    loadingStartAt: t(300),
    loadingCompleteAt: t(120),
    gateOutAt: t(95),
    plannedDeparture: t(90),
  },

  // ── Dispatched (completed today) ──────────────────────────────────────────
  {
    id: 'HV-012',
    vehicleNumber: 'MH12WX9012',
    vehicleType: 'FTL',
    carrier: 'Gati Kintetsu Express',
    driverName: 'Nilesh More',
    driverMobile: '9867890123',
    routeCode: 'MUM-BLR-03',
    origin: 'Mumbai (Bhiwandi Hub)',
    destination: 'Bangalore (Electronic City)',
    plannedHUs: 56,
    loadedHUs: 56,
    weightKg: 13400,
    status: 'dispatched',
    priority: 'normal',
    arrivedAt: t(480),
    gateInAt: t(458),
    loadingStartAt: t(410),
    loadingCompleteAt: t(240),
    gateOutAt: t(215),
    dispatchedAt: t(210),
    plannedDeparture: t(200),
  },
  {
    id: 'HV-013',
    vehicleNumber: 'DL07YZ3456',
    vehicleType: 'FTL',
    carrier: 'Blue Dart Express',
    driverName: 'Amit Singh',
    driverMobile: '9810234567',
    routeCode: 'DEL-MUM-01',
    origin: 'Delhi (Naraina WH)',
    destination: 'Mumbai (Bhiwandi Hub)',
    plannedHUs: 63,
    loadedHUs: 62,
    weightKg: 15600,
    status: 'dispatched',
    priority: 'normal',
    arrivedAt: t(600),
    gateInAt: t(578),
    loadingStartAt: t(530),
    loadingCompleteAt: t(350),
    gateOutAt: t(320),
    dispatchedAt: t(315),
    plannedDeparture: t(300),
    remarks: '1 HU short-loaded — exception raised EXC-2024-0915',
  },
]

// ─── Hub options ──────────────────────────────────────────────────────────────

export const HUBS = [
  { id: 'DEL', label: 'Delhi Hub',       region: 'north' },
  { id: 'MUM', label: 'Mumbai Hub',      region: 'west'  },
  { id: 'BLR', label: 'Bangalore Hub',   region: 'south' },
  { id: 'KOL', label: 'Kolkata Hub',     region: 'east'  },
  { id: 'HYD', label: 'Hyderabad Depot', region: 'south' },
  { id: 'CHE', label: 'Chennai Depot',   region: 'south' },
]

export const CARRIERS_LIST = [
  'Blue Dart Express',
  'Gati Kintetsu Express',
  'VRL Logistics',
  'Rivigo Technologies',
  'SafeExpress Logistics',
  'DTDC Freight',
  'Patel Roadways',
  'Shree Mahavir Transport',
]

export const STATUS_ORDER: HubStatus[] = [
  'arrived', 'gate_in', 'loading', 'loaded', 'gate_out', 'dispatched',
]

export const STATUS_LABEL: Record<HubStatus, string> = {
  arrived:    'Arrived',
  gate_in:    'Gate In',
  loading:    'Loading',
  loaded:     'Loaded',
  gate_out:   'Gate Out',
  dispatched: 'Dispatched',
}
