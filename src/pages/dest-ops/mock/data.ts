const now = Date.now()
const t   = (minsAgo: number)    => new Date(now - minsAgo  * 60000).toISOString()
const tf  = (minsAhead: number)  => new Date(now + minsAhead * 60000).toISOString()

export type DestStatus =
  | 'in_transit'
  | 'arrived'
  | 'gate_in'
  | 'dock_assigned'
  | 'unloading'
  | 'unloaded'
  | 'receipt_confirmed'
  | 'reconciled'
  | 'closed'

export type VehicleType  = 'FTL' | 'LTL' | 'LCV' | 'Trailer' | 'Reefer'
export type PriorityLevel = 'normal' | 'urgent' | 'sla_breach'

export interface DestVehicle {
  id: string
  vehicleNumber: string
  vehicleType: VehicleType
  carrier: string
  driverName: string
  driverMobile: string
  routeCode: string
  origin: string
  destination: string
  dockNumber?: string
  plannedHUs: number
  receivedHUs: number
  damagedHUs: number
  shortHUs: number
  weightKg: number
  priority: PriorityLevel
  status: DestStatus
  // Timeline
  departedOriginAt?: string
  arrivedAt?: string
  gateInAt?: string
  dockAssignedAt?: string
  unloadingStartAt?: string
  unloadingCompleteAt?: string
  receiptConfirmedAt?: string
  reconciledAt?: string
  closedAt?: string
  // Planned
  plannedArrival: string
  // Exceptions
  exceptionCount: number
  remarks?: string
}

// ─── Computed helpers ─────────────────────────────────────────────────────────

export function transitTimeMins(v: DestVehicle): number | null {
  if (!v.departedOriginAt || !v.arrivedAt) return null
  return Math.round((new Date(v.arrivedAt).getTime() - new Date(v.departedOriginAt).getTime()) / 60000)
}

export function dockDwellMins(v: DestVehicle): number | null {
  if (!v.dockAssignedAt || !v.unloadingCompleteAt) return null
  return Math.round((new Date(v.unloadingCompleteAt).getTime() - new Date(v.dockAssignedAt).getTime()) / 60000)
}

export function unloadingTimeMins(v: DestVehicle): number | null {
  if (!v.unloadingStartAt || !v.unloadingCompleteAt) return null
  return Math.round((new Date(v.unloadingCompleteAt).getTime() - new Date(v.unloadingStartAt).getTime()) / 60000)
}

export function totalCycleMins(v: DestVehicle): number | null {
  if (!v.arrivedAt || !v.closedAt) return null
  return Math.round((new Date(v.closedAt).getTime() - new Date(v.arrivedAt).getTime()) / 60000)
}

export function fmtMins(mins: number): string {
  if (mins < 60) return `${mins}m`
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return m > 0 ? `${h}h ${m}m` : `${h}h`
}

export function isOverdue(v: DestVehicle): boolean {
  if (['reconciled', 'closed'].includes(v.status)) return false
  return new Date(v.plannedArrival) < new Date()
}

export function huVariance(v: DestVehicle): number {
  return v.receivedHUs - v.plannedHUs
}

// ─── Mock vehicles ────────────────────────────────────────────────────────────

export const DEST_VEHICLES: DestVehicle[] = [
  // ── In Transit ───────────────────────────────────────────────────────────────
  {
    id: 'DV-001',
    vehicleNumber: 'MH12WX9012',
    vehicleType: 'FTL',
    carrier: 'Gati Kintetsu Express',
    driverName: 'Nilesh More',
    driverMobile: '9867890123',
    routeCode: 'MUM-BLR-03',
    origin: 'Mumbai (Bhiwandi Hub)',
    destination: 'Bangalore (Electronic City)',
    plannedHUs: 56, receivedHUs: 0, damagedHUs: 0, shortHUs: 0,
    weightKg: 13400,
    priority: 'normal',
    status: 'in_transit',
    departedOriginAt: t(210),
    plannedArrival: tf(540),
    exceptionCount: 0,
  },
  {
    id: 'DV-002',
    vehicleNumber: 'DL07YZ3456',
    vehicleType: 'FTL',
    carrier: 'Blue Dart Express',
    driverName: 'Amit Singh',
    driverMobile: '9810234567',
    routeCode: 'DEL-MUM-01',
    origin: 'Delhi (Naraina WH)',
    destination: 'Mumbai (Bhiwandi Hub)',
    plannedHUs: 63, receivedHUs: 0, damagedHUs: 0, shortHUs: 0,
    weightKg: 15600,
    priority: 'urgent',
    status: 'in_transit',
    departedOriginAt: t(315),
    plannedArrival: tf(285),
    exceptionCount: 1,
    remarks: '1 HU short-loaded at origin — EXC-2024-0915',
  },
  {
    id: 'DV-003',
    vehicleNumber: 'KA22TH5671',
    vehicleType: 'Trailer',
    carrier: 'VRL Logistics',
    driverName: 'Naveen Gowda',
    driverMobile: '9844256781',
    routeCode: 'BLR-HYD-02',
    origin: 'Bangalore (Electronic City)',
    destination: 'Hyderabad (Uppal Hub)',
    plannedHUs: 78, receivedHUs: 0, damagedHUs: 0, shortHUs: 0,
    weightKg: 19200,
    priority: 'sla_breach',
    status: 'in_transit',
    departedOriginAt: t(480),
    plannedArrival: t(30),
    exceptionCount: 0,
    remarks: 'SLA breach — delayed departure from origin',
  },

  // ── Arrived (at destination gate) ────────────────────────────────────────────
  {
    id: 'DV-004',
    vehicleNumber: 'TN07AB9234',
    vehicleType: 'FTL',
    carrier: 'Rivigo Technologies',
    driverName: 'Karthik Rajan',
    driverMobile: '9790123456',
    routeCode: 'CHE-BLR-01',
    origin: 'Chennai (Ambattur WH)',
    destination: 'Bangalore (Electronic City)',
    plannedHUs: 44, receivedHUs: 0, damagedHUs: 0, shortHUs: 0,
    weightKg: 9800,
    priority: 'normal',
    status: 'arrived',
    departedOriginAt: t(520),
    arrivedAt: t(18),
    plannedArrival: t(40),
    exceptionCount: 0,
  },
  {
    id: 'DV-005',
    vehicleNumber: 'MH04PL2341',
    vehicleType: 'Reefer',
    carrier: 'SafeExpress Logistics',
    driverName: 'Suhas Kulkarni',
    driverMobile: '9325678901',
    routeCode: 'MUM-PUN-02',
    origin: 'Mumbai (Bhiwandi Hub)',
    destination: 'Pune (Chakan WH)',
    plannedHUs: 28, receivedHUs: 0, damagedHUs: 0, shortHUs: 0,
    weightKg: 5400,
    priority: 'urgent',
    status: 'arrived',
    departedOriginAt: t(185),
    arrivedAt: t(7),
    plannedArrival: t(5),
    exceptionCount: 0,
    remarks: 'Cold chain reefer — priority unloading required',
  },

  // ── Gate In ──────────────────────────────────────────────────────────────────
  {
    id: 'DV-006',
    vehicleNumber: 'WB24QR6789',
    vehicleType: 'FTL',
    carrier: 'VRL Logistics',
    driverName: 'Tapan Roy',
    driverMobile: '9831234567',
    routeCode: 'KOL-DEL-02',
    origin: 'Kolkata (Rajarhat Hub)',
    destination: 'Delhi (Naraina WH)',
    plannedHUs: 74, receivedHUs: 0, damagedHUs: 0, shortHUs: 0,
    weightKg: 16800,
    priority: 'sla_breach',
    status: 'gate_in',
    departedOriginAt: t(780),
    arrivedAt: t(62),
    gateInAt: t(45),
    plannedArrival: t(90),
    exceptionCount: 2,
    remarks: 'Temperature excursion flag on 2 HUs — cold chain exception',
  },
  {
    id: 'DV-007',
    vehicleNumber: 'RJ14OP2345',
    vehicleType: 'LTL',
    carrier: 'DTDC Freight',
    driverName: 'Kamlesh Sharma',
    driverMobile: '9772345678',
    routeCode: 'JAI-DEL-01',
    origin: 'Jaipur (Sitapura Depot)',
    destination: 'Delhi (Naraina WH)',
    plannedHUs: 28, receivedHUs: 0, damagedHUs: 0, shortHUs: 0,
    weightKg: 4500,
    priority: 'normal',
    status: 'gate_in',
    departedOriginAt: t(310),
    arrivedAt: t(50),
    gateInAt: t(32),
    plannedArrival: t(60),
    exceptionCount: 0,
  },

  // ── Dock Assigned ─────────────────────────────────────────────────────────────
  {
    id: 'DV-008',
    vehicleNumber: 'GJ05EF1234',
    vehicleType: 'LCV',
    carrier: 'Patel Roadways',
    driverName: 'Bhavesh Shah',
    driverMobile: '9909876543',
    routeCode: 'AMD-MUM-01',
    origin: 'Ahmedabad (Naroda Depot)',
    destination: 'Mumbai (Bhiwandi Hub)',
    dockNumber: 'D-04',
    plannedHUs: 18, receivedHUs: 0, damagedHUs: 0, shortHUs: 0,
    weightKg: 2200,
    priority: 'normal',
    status: 'dock_assigned',
    departedOriginAt: t(345),
    arrivedAt: t(95),
    gateInAt: t(78),
    dockAssignedAt: t(55),
    plannedArrival: t(100),
    exceptionCount: 0,
  },
  {
    id: 'DV-009',
    vehicleNumber: 'UP32MN7890',
    vehicleType: 'Trailer',
    carrier: 'Gati Kintetsu Express',
    driverName: 'Vijay Pandey',
    driverMobile: '9839012345',
    routeCode: 'DEL-LKO-01',
    origin: 'Delhi (Naraina WH)',
    destination: 'Lucknow (Amausi Depot)',
    dockNumber: 'D-02',
    plannedHUs: 82, receivedHUs: 0, damagedHUs: 0, shortHUs: 0,
    weightKg: 22000,
    priority: 'urgent',
    status: 'dock_assigned',
    departedOriginAt: t(500),
    arrivedAt: t(110),
    gateInAt: t(92),
    dockAssignedAt: t(68),
    plannedArrival: t(120),
    exceptionCount: 0,
    remarks: 'Dock 2 · 4 workers assigned',
  },

  // ── Unloading ─────────────────────────────────────────────────────────────────
  {
    id: 'DV-010',
    vehicleNumber: 'TS09UV5678',
    vehicleType: 'FTL',
    carrier: 'Rivigo Technologies',
    driverName: 'Ravi Reddy',
    driverMobile: '9848567890',
    routeCode: 'HYD-BLR-01',
    origin: 'Hyderabad (Uppal Hub)',
    destination: 'Bangalore (Electronic City)',
    dockNumber: 'D-07',
    plannedHUs: 48, receivedHUs: 31, damagedHUs: 0, shortHUs: 0,
    weightKg: 10200,
    priority: 'normal',
    status: 'unloading',
    departedOriginAt: t(450),
    arrivedAt: t(140),
    gateInAt: t(122),
    dockAssignedAt: t(98),
    unloadingStartAt: t(75),
    plannedArrival: t(150),
    exceptionCount: 0,
  },
  {
    id: 'DV-011',
    vehicleNumber: 'MH43ST1234',
    vehicleType: 'Reefer',
    carrier: 'Blue Dart Express',
    driverName: 'Santosh Patil',
    driverMobile: '9370456789',
    routeCode: 'MUM-PUN-01',
    origin: 'Mumbai (Bhiwandi Hub)',
    destination: 'Pune (Chakan WH)',
    dockNumber: 'D-01',
    plannedHUs: 24, receivedHUs: 20, damagedHUs: 1, shortHUs: 0,
    weightKg: 5100,
    priority: 'urgent',
    status: 'unloading',
    departedOriginAt: t(380),
    arrivedAt: t(180),
    gateInAt: t(162),
    dockAssignedAt: t(140),
    unloadingStartAt: t(115),
    plannedArrival: t(160),
    exceptionCount: 1,
    remarks: 'Dock 1 · 1 HU with visible damage — photographed',
  },

  // ── Unloaded / Receipt Pending ────────────────────────────────────────────────
  {
    id: 'DV-012',
    vehicleNumber: 'DL01CD7890',
    vehicleType: 'Trailer',
    carrier: 'Gati Kintetsu Express',
    driverName: 'Suresh Yadav',
    driverMobile: '9812345678',
    routeCode: 'DEL-MUM-01',
    origin: 'Delhi (Naraina WH)',
    destination: 'Mumbai (Bhiwandi Hub)',
    dockNumber: 'D-03',
    plannedHUs: 68, receivedHUs: 68, damagedHUs: 0, shortHUs: 0,
    weightKg: 18500,
    priority: 'normal',
    status: 'unloaded',
    departedOriginAt: t(550),
    arrivedAt: t(220),
    gateInAt: t(202),
    dockAssignedAt: t(178),
    unloadingStartAt: t(155),
    unloadingCompleteAt: t(40),
    plannedArrival: t(200),
    exceptionCount: 0,
  },

  // ── Receipt Confirmed ─────────────────────────────────────────────────────────
  {
    id: 'DV-013',
    vehicleNumber: 'KA09GH5678',
    vehicleType: 'FTL',
    carrier: 'Blue Dart Express',
    driverName: 'Mahesh Nair',
    driverMobile: '9845012345',
    routeCode: 'BLR-CHE-01',
    origin: 'Bangalore (Electronic City)',
    destination: 'Chennai (Ambattur WH)',
    dockNumber: 'D-05',
    plannedHUs: 35, receivedHUs: 34, damagedHUs: 0, shortHUs: 1,
    weightKg: 6200,
    priority: 'normal',
    status: 'receipt_confirmed',
    departedOriginAt: t(600),
    arrivedAt: t(270),
    gateInAt: t(252),
    dockAssignedAt: t(228),
    unloadingStartAt: t(205),
    unloadingCompleteAt: t(110),
    receiptConfirmedAt: t(65),
    plannedArrival: t(250),
    exceptionCount: 1,
    remarks: '1 HU short — short-receipt exception pending',
  },

  // ── Reconciled ────────────────────────────────────────────────────────────────
  {
    id: 'DV-014',
    vehicleNumber: 'TN22IJ9012',
    vehicleType: 'FTL',
    carrier: 'SafeExpress Logistics',
    driverName: 'Anand Krishnan',
    driverMobile: '9444123456',
    routeCode: 'CHE-HYD-01',
    origin: 'Chennai (Ambattur WH)',
    destination: 'Hyderabad (Uppal Hub)',
    dockNumber: 'D-06',
    plannedHUs: 51, receivedHUs: 51, damagedHUs: 0, shortHUs: 0,
    weightKg: 11400,
    priority: 'normal',
    status: 'reconciled',
    departedOriginAt: t(720),
    arrivedAt: t(340),
    gateInAt: t(322),
    dockAssignedAt: t(298),
    unloadingStartAt: t(270),
    unloadingCompleteAt: t(165),
    receiptConfirmedAt: t(120),
    reconciledAt: t(80),
    plannedArrival: t(320),
    exceptionCount: 0,
  },

  // ── Closed ────────────────────────────────────────────────────────────────────
  {
    id: 'DV-015',
    vehicleNumber: 'MH04KL3456',
    vehicleType: 'FTL',
    carrier: 'Rivigo Technologies',
    driverName: 'Prashant Deshpande',
    driverMobile: '9322567890',
    routeCode: 'MUM-HYD-02',
    origin: 'Mumbai (Bhiwandi Hub)',
    destination: 'Hyderabad (Uppal Hub)',
    dockNumber: 'D-08',
    plannedHUs: 60, receivedHUs: 60, damagedHUs: 0, shortHUs: 0,
    weightKg: 14000,
    priority: 'normal',
    status: 'closed',
    departedOriginAt: t(900),
    arrivedAt: t(480),
    gateInAt: t(462),
    dockAssignedAt: t(438),
    unloadingStartAt: t(410),
    unloadingCompleteAt: t(300),
    receiptConfirmedAt: t(255),
    reconciledAt: t(210),
    closedAt: t(195),
    plannedArrival: t(460),
    exceptionCount: 0,
  },
]

// ─── Reference data ───────────────────────────────────────────────────────────

export const DEST_HUBS = [
  { id: 'BLR', label: 'Bangalore Hub',   region: 'south' },
  { id: 'MUM', label: 'Mumbai Hub',      region: 'west'  },
  { id: 'DEL', label: 'Delhi Hub',       region: 'north' },
  { id: 'KOL', label: 'Kolkata Hub',     region: 'east'  },
  { id: 'HYD', label: 'Hyderabad Depot', region: 'south' },
  { id: 'CHE', label: 'Chennai Depot',   region: 'south' },
  { id: 'PUN', label: 'Pune WH',         region: 'west'  },
]

export const DOCK_NUMBERS = ['D-01','D-02','D-03','D-04','D-05','D-06','D-07','D-08','D-09','D-10']

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

export const DEST_STATUS_ORDER: DestStatus[] = [
  'in_transit','arrived','gate_in','dock_assigned',
  'unloading','unloaded','receipt_confirmed','reconciled','closed',
]

export const DEST_STATUS_LABEL: Record<DestStatus, string> = {
  in_transit:        'In Transit',
  arrived:           'Arrived',
  gate_in:           'Gate In',
  dock_assigned:     'Dock Assigned',
  unloading:         'Unloading',
  unloaded:          'Unloaded',
  receipt_confirmed: 'Receipt Confirmed',
  reconciled:        'Reconciled',
  closed:            'Closed',
}
