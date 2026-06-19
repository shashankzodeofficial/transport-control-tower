// Operations Control Tower — mock data

const now = Date.now()
const minsAgo  = (m: number) => new Date(now - m * 60000).toISOString()
const minsAhead = (m: number) => new Date(now + m * 60000).toISOString()

// ─── KPI strip ────────────────────────────────────────────────────────────────

export const OPS_KPI = [
  { label: 'Active Vehicles',   value: 24,   unit: '',    status: 'healthy' as const, trend: { direction: 'up' as const,   delta: '+3',    period: 'vs yesterday' } },
  { label: 'In Transit',        value: 18,   unit: '',    status: 'info'    as const, trend: { direction: 'up' as const,   delta: '+2',    period: 'vs yesterday' } },
  { label: 'Delayed',           value: 5,    unit: '',    status: 'danger'  as const, trend: { direction: 'up' as const,   delta: '+2',    period: 'vs yesterday' } },
  { label: 'SLA At-Risk',       value: 3,    unit: '',    status: 'warning' as const, trend: { direction: 'down' as const, delta: '-1',    period: 'vs yesterday' } },
  { label: 'Hub Arrivals Today', value: 31,  unit: '',    status: 'healthy' as const, trend: { direction: 'up' as const,   delta: '+4',    period: 'vs yesterday' } },
  { label: 'Fleet Utilisation', value: 78,   unit: '%',   status: 'healthy' as const, progress: 78 },
]

// ─── Live fleet board ─────────────────────────────────────────────────────────

export type VehicleStatus = 'in-transit' | 'halted' | 'delayed' | 'arrived' | 'idle'

export interface FleetVehicle {
  id: string
  dispatchId: string
  vehicleReg: string
  driverName: string
  carrier: string
  routeCode: string
  origin: string
  destination: string
  status: VehicleStatus
  currentLocation: string
  progressPct: number
  speedKmh: number
  etaAt: string
  delayMinutes: number
  fuelPct: number
  lastPingAt: string
  alerts: string[]
}

export const FLEET_VEHICLES: FleetVehicle[] = [
  {
    id: 'V-001', dispatchId: 'D-48291', vehicleReg: 'MH12XY9901', driverName: 'Ramesh Singh',
    carrier: 'BlueDart Logistics', routeCode: 'RT-MUM-DEL-01', origin: 'Mumbai', destination: 'Delhi',
    status: 'delayed', currentLocation: 'Near Surat, NH48', progressPct: 34, speedKmh: 0,
    etaAt: minsAhead(380), delayMinutes: 135, fuelPct: 61, lastPingAt: minsAgo(220),
    alerts: ['Stationary 3h+', 'GPS gap'],
  },
  {
    id: 'V-002', dispatchId: 'D-48293', vehicleReg: 'GJ05AB1234', driverName: 'Suresh Patel',
    carrier: 'Gati Express', routeCode: 'RT-AMD-SUR-02', origin: 'Ahmedabad', destination: 'Surat',
    status: 'in-transit', currentLocation: 'Anand, NH48', progressPct: 61, speedKmh: 74,
    etaAt: minsAhead(90), delayMinutes: 0, fuelPct: 48, lastPingAt: minsAgo(2),
    alerts: [],
  },
  {
    id: 'V-003', dispatchId: 'D-48295', vehicleReg: 'KA03TU5678', driverName: 'Manoj Kumar',
    carrier: 'DHL Supply Chain', routeCode: 'RT-BLR-CHN-03', origin: 'Bangalore', destination: 'Chennai',
    status: 'in-transit', currentLocation: 'Krishnagiri, NH44', progressPct: 52, speedKmh: 68,
    etaAt: minsAhead(120), delayMinutes: 25, fuelPct: 55, lastPingAt: minsAgo(1),
    alerts: ['Minor delay'],
  },
  {
    id: 'V-004', dispatchId: 'D-48297', vehicleReg: 'MH04GH2211', driverName: 'Arun Sharma',
    carrier: 'DTDC Freight', routeCode: 'RT-MUM-PUN-04', origin: 'Mumbai', destination: 'Pune',
    status: 'arrived', currentLocation: 'Pune Hub', progressPct: 100, speedKmh: 0,
    etaAt: minsAgo(45), delayMinutes: 0, fuelPct: 32, lastPingAt: minsAgo(45),
    alerts: [],
  },
  {
    id: 'V-005', dispatchId: 'D-48299', vehicleReg: 'TN07LK9900', driverName: 'Vijay Rajan',
    carrier: 'Delhivery', routeCode: 'RT-CHN-HYD-02', origin: 'Chennai', destination: 'Hyderabad',
    status: 'in-transit', currentLocation: 'Nellore, NH16', progressPct: 43, speedKmh: 71,
    etaAt: minsAhead(195), delayMinutes: 0, fuelPct: 73, lastPingAt: minsAgo(3),
    alerts: [],
  },
  {
    id: 'V-006', dispatchId: 'D-48301', vehicleReg: 'AP09MN3344', driverName: 'Ravi Reddy',
    carrier: 'FastMove Logistics', routeCode: 'RT-HYD-VIZ-01', origin: 'Hyderabad', destination: 'Vizag',
    status: 'halted', currentLocation: 'Khammam Checkpoint', progressPct: 28, speedKmh: 0,
    etaAt: minsAhead(310), delayMinutes: 90, fuelPct: 44, lastPingAt: minsAgo(8),
    alerts: ['Exception hold', 'Awaiting clearance'],
  },
  {
    id: 'V-007', dispatchId: 'D-48303', vehicleReg: 'DL01AB7788', driverName: 'Pradeep Yadav',
    carrier: 'Express Roads', routeCode: 'RT-DEL-AGR-01', origin: 'Delhi', destination: 'Agra',
    status: 'in-transit', currentLocation: 'Faridabad, NH19', progressPct: 22, speedKmh: 55,
    etaAt: minsAhead(145), delayMinutes: 15, fuelPct: 88, lastPingAt: minsAgo(2),
    alerts: [],
  },
  {
    id: 'V-008', dispatchId: 'D-48305', vehicleReg: 'RJ14CD5566', driverName: 'Mohan Bishnoi',
    carrier: 'Rajasthan Carriers', routeCode: 'RT-JAI-JOD-01', origin: 'Jaipur', destination: 'Jodhpur',
    status: 'in-transit', currentLocation: 'Ajmer, NH58', progressPct: 56, speedKmh: 63,
    etaAt: minsAhead(105), delayMinutes: 0, fuelPct: 52, lastPingAt: minsAgo(4),
    alerts: [],
  },
  {
    id: 'V-009', dispatchId: 'D-48307', vehicleReg: 'MH02PQ1122', driverName: 'Santosh Naik',
    carrier: 'BlueDart Logistics', routeCode: 'RT-MUM-GOA-01', origin: 'Mumbai', destination: 'Goa',
    status: 'delayed', currentLocation: 'Ratnagiri, NH66', progressPct: 47, speedKmh: 38,
    etaAt: minsAhead(250), delayMinutes: 65, fuelPct: 40, lastPingAt: minsAgo(5),
    alerts: ['Slow traffic', 'Ghat section'],
  },
  {
    id: 'V-010', dispatchId: 'D-48309', vehicleReg: 'MH15RS4433', driverName: 'Deepak More',
    carrier: 'Gati Express', routeCode: 'RT-MUM-PUN-03', origin: 'Mumbai', destination: 'Pune',
    status: 'halted', currentLocation: 'Nashik Checkpoint', progressPct: 19, speedKmh: 0,
    etaAt: minsAhead(40), delayMinutes: 45, fuelPct: 78, lastPingAt: minsAgo(12),
    alerts: ['SLA at risk', 'Checkpoint delay'],
  },
  {
    id: 'V-011', dispatchId: 'D-48311', vehicleReg: 'WB20XY6655', driverName: 'Biswanath Das',
    carrier: 'Calcutta Express', routeCode: 'RT-KOL-PAT-01', origin: 'Kolkata', destination: 'Patna',
    status: 'in-transit', currentLocation: 'Durgapur, NH19', progressPct: 38, speedKmh: 60,
    etaAt: minsAhead(165), delayMinutes: 0, fuelPct: 66, lastPingAt: minsAgo(3),
    alerts: [],
  },
  {
    id: 'V-012', dispatchId: 'D-48313', vehicleReg: 'MP09DE8877', driverName: 'Hemant Verma',
    carrier: 'Central India Freight', routeCode: 'RT-IND-BHO-01', origin: 'Indore', destination: 'Bhopal',
    status: 'arrived', currentLocation: 'Bhopal Hub', progressPct: 100, speedKmh: 0,
    etaAt: minsAgo(22), delayMinutes: 0, fuelPct: 29, lastPingAt: minsAgo(22),
    alerts: [],
  },
]

// ─── SLA watch list ────────────────────────────────────────────────────────────

export interface SLARecord {
  dispatchId: string
  routeCode: string
  carrier: string
  origin: string
  destination: string
  slaStatus: 'at-risk' | 'breached'
  hoursRemaining?: number
  hoursOverdue?: number
  plannedArrival: string
  vehicleReg: string
}

export const SLA_WATCH: SLARecord[] = [
  {
    dispatchId: 'D-48291', routeCode: 'RT-MUM-DEL-01', carrier: 'BlueDart Logistics',
    origin: 'Mumbai', destination: 'Delhi', slaStatus: 'breached',
    hoursOverdue: 2.25, plannedArrival: minsAgo(135), vehicleReg: 'MH12XY9901',
  },
  {
    dispatchId: 'D-48309', routeCode: 'RT-MUM-PUN-03', carrier: 'Gati Express',
    origin: 'Mumbai', destination: 'Pune', slaStatus: 'at-risk',
    hoursRemaining: 0.75, plannedArrival: minsAhead(45), vehicleReg: 'MH15RS4433',
  },
  {
    dispatchId: 'D-48301', routeCode: 'RT-HYD-VIZ-01', carrier: 'FastMove Logistics',
    origin: 'Hyderabad', destination: 'Vizag', slaStatus: 'breached',
    hoursOverdue: 1.5, plannedArrival: minsAgo(90), vehicleReg: 'AP09MN3344',
  },
  {
    dispatchId: 'D-48307', routeCode: 'RT-MUM-GOA-01', carrier: 'BlueDart Logistics',
    origin: 'Mumbai', destination: 'Goa', slaStatus: 'at-risk',
    hoursRemaining: 1.1, plannedArrival: minsAhead(66), vehicleReg: 'MH02PQ1122',
  },
]

// ─── Hub activity ──────────────────────────────────────────────────────────────

export interface HubEvent {
  id: string
  hub: string
  type: 'arrival' | 'departure'
  dispatchId: string
  vehicleReg: string
  carrier: string
  scheduledAt: string
  actualAt?: string
  status: 'on-time' | 'delayed' | 'early' | 'pending'
  delayMinutes?: number
}

export const HUB_EVENTS: HubEvent[] = [
  {
    id: 'HE-01', hub: 'Mumbai Hub', type: 'departure', dispatchId: 'D-48309',
    vehicleReg: 'MH15RS4433', carrier: 'Gati Express',
    scheduledAt: minsAgo(80), status: 'delayed', delayMinutes: 45,
  },
  {
    id: 'HE-02', hub: 'Pune Hub', type: 'arrival', dispatchId: 'D-48297',
    vehicleReg: 'MH04GH2211', carrier: 'DTDC Freight',
    scheduledAt: minsAgo(60), actualAt: minsAgo(45), status: 'early',
  },
  {
    id: 'HE-03', hub: 'Bangalore Hub', type: 'departure', dispatchId: 'D-48295',
    vehicleReg: 'KA03TU5678', carrier: 'DHL Supply Chain',
    scheduledAt: minsAgo(150), actualAt: minsAgo(148), status: 'on-time',
  },
  {
    id: 'HE-04', hub: 'Bhopal Hub', type: 'arrival', dispatchId: 'D-48313',
    vehicleReg: 'MP09DE8877', carrier: 'Central India Freight',
    scheduledAt: minsAgo(30), actualAt: minsAgo(22), status: 'early',
  },
  {
    id: 'HE-05', hub: 'Delhi Hub', type: 'arrival', dispatchId: 'D-48291',
    vehicleReg: 'MH12XY9901', carrier: 'BlueDart Logistics',
    scheduledAt: minsAgo(135), status: 'delayed', delayMinutes: 135,
  },
  {
    id: 'HE-06', hub: 'Hyderabad Hub', type: 'departure', dispatchId: 'D-48301',
    vehicleReg: 'AP09MN3344', carrier: 'FastMove Logistics',
    scheduledAt: minsAgo(200), actualAt: minsAgo(195), status: 'on-time',
  },
  {
    id: 'HE-07', hub: 'Chennai Hub', type: 'departure', dispatchId: 'D-48299',
    vehicleReg: 'TN07LK9900', carrier: 'Delhivery',
    scheduledAt: minsAgo(180), actualAt: minsAgo(179), status: 'on-time',
  },
  {
    id: 'HE-08', hub: 'Jaipur Hub', type: 'departure', dispatchId: 'D-48305',
    vehicleReg: 'RJ14CD5566', carrier: 'Rajasthan Carriers',
    scheduledAt: minsAgo(240), actualAt: minsAgo(238), status: 'on-time',
  },
  {
    id: 'HE-09', hub: 'Kolkata Hub', type: 'departure', dispatchId: 'D-48311',
    vehicleReg: 'WB20XY6655', carrier: 'Calcutta Express',
    scheduledAt: minsAgo(190), actualAt: minsAgo(187), status: 'on-time',
  },
  {
    id: 'HE-10', hub: 'Ahmedabad Hub', type: 'departure', dispatchId: 'D-48293',
    vehicleReg: 'GJ05AB1234', carrier: 'Gati Express',
    scheduledAt: minsAgo(290), actualAt: minsAgo(290), status: 'on-time',
  },
  {
    id: 'HE-11', hub: 'Delhi Hub', type: 'arrival', dispatchId: 'D-48303',
    vehicleReg: 'DL01AB7788', carrier: 'Express Roads',
    scheduledAt: minsAhead(145), status: 'pending',
  },
  {
    id: 'HE-12', hub: 'Jodhpur Hub', type: 'arrival', dispatchId: 'D-48305',
    vehicleReg: 'RJ14CD5566', carrier: 'Rajasthan Carriers',
    scheduledAt: minsAhead(105), status: 'pending',
  },
]
