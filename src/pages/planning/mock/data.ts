// Load Planning Workbench mock data

export type LoadPlanStatus = 'draft' | 'confirmed' | 'dispatched' | 'cancelled'
export type VehicleAvailability = 'available' | 'loading' | 'in_transit' | 'maintenance' | 'reserved'

export interface AvailableVehicle {
  id: string
  reg: string
  type: 'FTL' | 'LTL' | 'LCV' | 'Trailer'
  capacityKg: number
  capacityCbm: number
  carrier: string
  location: string
  availability: VehicleAvailability
  nextAvailable?: string
  driverName: string
  driverPhone: string
  utilizationPct: number   // current load / capacity
}

export interface PendingLoad {
  id: string
  routeCode: string
  routeName: string
  origin: string
  destination: string
  distanceKm: number
  huCount: number
  weightKg: number
  volumeCbm: number
  plannedDeparture: string
  priority: 'normal' | 'high' | 'critical'
  assignedVehicleId?: string
  loadPlanId?: string
  tags: string[]
}

export interface LoadPlan {
  id: string
  status: LoadPlanStatus
  vehicleId: string
  loads: string[]           // PendingLoad IDs
  totalWeightKg: number
  totalVolumeCbm: number
  utilizationPct: number    // weight-based
  plannedDeparture: string
  plannedArrival: string
  routeCode: string
  freightEstimate: number
  createdBy: string
  createdAt: string
}

const now = Date.now()
const tf  = (hoursAhead: number) => new Date(now + hoursAhead * 3600000).toISOString()
const t   = (hoursAgo: number)   => new Date(now - hoursAgo * 3600000).toISOString()

export const VEHICLES: AvailableVehicle[] = [
  { id: 'V-001', reg: 'MH12XY9901', type: 'FTL',     capacityKg: 15000, capacityCbm: 72, carrier: 'Prime Transport Co',   location: 'Mumbai (Bhiwandi Hub)', availability: 'available',   driverName: 'Rajesh Kumar',  driverPhone: '9876543210', utilizationPct: 0   },
  { id: 'V-002', reg: 'DL01AB2233', type: 'Trailer',  capacityKg: 25000, capacityCbm: 120,carrier: 'FastMove Logistics',   location: 'Delhi (Naraina WH)',    availability: 'available',   driverName: 'Manoj Singh',   driverPhone: '9765432109', utilizationPct: 0   },
  { id: 'V-003', reg: 'KA19TH4421', type: 'FTL',     capacityKg: 15000, capacityCbm: 72, carrier: 'BlueDart Surface',     location: 'Bangalore (EC Hub)',   availability: 'available',   driverName: 'Vijay Rao',     driverPhone: '9654321098', utilizationPct: 0   },
  { id: 'V-004', reg: 'GJ05PP1122', type: 'LTL',     capacityKg: 8000,  capacityCbm: 40, carrier: 'VRL Logistics',        location: 'Ahmedabad (Naroda)',   availability: 'available',   driverName: 'Suresh Patel',  driverPhone: '9543210987', utilizationPct: 45  },
  { id: 'V-005', reg: 'UP32KL9988', type: 'LCV',     capacityKg: 3500,  capacityCbm: 18, carrier: 'TCI Freight',          location: 'Lucknow (Amausi)',     availability: 'available',   driverName: 'Ramesh Yadav',  driverPhone: '9432109876', utilizationPct: 0   },
  { id: 'V-006', reg: 'TS09FF2211', type: 'FTL',     capacityKg: 15000, capacityCbm: 72, carrier: 'Gati Ltd',             location: 'Hyderabad (Uppal)',    availability: 'loading',     driverName: 'Anil Reddy',    driverPhone: '9321098765', utilizationPct: 72  },
  { id: 'V-007', reg: 'RJ14AB8877', type: 'LTL',     capacityKg: 8000,  capacityCbm: 40, carrier: 'TCI Freight',          location: 'Jaipur (Sitapura IE)', availability: 'available',   driverName: 'Mohan Sharma',  driverPhone: '9210987654', utilizationPct: 0   },
  { id: 'V-008', reg: 'WB07CD5544', type: 'FTL',     capacityKg: 15000, capacityCbm: 72, carrier: 'Safexpress',           location: 'Kolkata (Rajarhat)',   availability: 'available',   driverName: 'Debasis Roy',   driverPhone: '9109876543', utilizationPct: 0   },
  { id: 'V-009', reg: 'TN22GH3311', type: 'LCV',     capacityKg: 3500,  capacityCbm: 18, carrier: 'DTDC Surface',         location: 'Chennai (Ambattur)',   availability: 'available',   driverName: 'Murugan S',     driverPhone: '9098765432', utilizationPct: 0   },
  { id: 'V-010', reg: 'MP09ZZ1199', type: 'Trailer',  capacityKg: 25000, capacityCbm: 120,carrier: 'VRL Logistics',        location: 'Indore (Dewas Naka)',  availability: 'maintenance', nextAvailable: tf(8),       driverName: 'Gopal Verma',  driverPhone: '9987654321', utilizationPct: 0   },
  { id: 'V-011', reg: 'PB10XY7722', type: 'FTL',     capacityKg: 15000, capacityCbm: 72, carrier: 'Delhivery Surface',    location: 'Ludhiana (Phase 6)',   availability: 'reserved',    driverName: 'Harpreet S',    driverPhone: '9876543222', utilizationPct: 0   },
  { id: 'V-012', reg: 'HR26CD9988', type: 'LTL',     capacityKg: 8000,  capacityCbm: 40, carrier: 'SwiftCargo India',     location: 'Gurgaon (IMT)',        availability: 'available',   driverName: 'Sanjay Tyagi',  driverPhone: '9765432111', utilizationPct: 30  },
]

export const PENDING_LOADS: PendingLoad[] = [
  { id: 'PL-2024-0881', routeCode: 'DEL-MUM-FTL', routeName: 'Delhi → Mumbai FTL',      origin: 'Delhi (Gurgaon WH)',    destination: 'Mumbai (Bhiwandi)', distanceKm: 1420, huCount: 22, weightKg: 13500, volumeCbm: 65, plannedDeparture: tf(2),  priority: 'critical', tags: ['electronics','urgent'] },
  { id: 'PL-2024-0882', routeCode: 'DEL-PUN-LTL', routeName: 'Delhi → Pune LTL',        origin: 'Delhi (Okhla)',         destination: 'Pune (Chakan)',     distanceKm: 1460, huCount: 8,  weightKg: 4200,  volumeCbm: 21, plannedDeparture: tf(4),  priority: 'high',     tags: ['auto-components'] },
  { id: 'PL-2024-0883', routeCode: 'BLR-HYD-LTL', routeName: 'Bangalore → Hyderabad',   origin: 'Bangalore (EC Hub)',    destination: 'Hyderabad (Uppal)', distanceKm: 570,  huCount: 6,  weightKg: 2800,  volumeCbm: 14, plannedDeparture: tf(3),  priority: 'normal',   tags: ['fmcg'] },
  { id: 'PL-2024-0884', routeCode: 'KOL-PAT-LCV', routeName: 'Kolkata → Patna LCV',    origin: 'Kolkata (Rajarhat)',    destination: 'Patna (Bailey Rd)', distanceKm: 580,  huCount: 3,  weightKg: 1200,  volumeCbm: 6,  plannedDeparture: tf(1),  priority: 'high',     tags: ['pharma','cold'] },
  { id: 'PL-2024-0885', routeCode: 'MUM-AHM-LTL', routeName: 'Mumbai → Ahmedabad LTL', origin: 'Mumbai (Bhiwandi)',     destination: 'Ahmedabad (Naroda)',distanceKm: 530,  huCount: 10, weightKg: 5600,  volumeCbm: 28, plannedDeparture: tf(6),  priority: 'normal',   tags: ['textile'] },
  { id: 'PL-2024-0886', routeCode: 'DEL-LKW-FTL', routeName: 'Delhi → Lucknow FTL',    origin: 'Delhi (Okhla)',         destination: 'Lucknow (Amausi)', distanceKm: 520,  huCount: 14, weightKg: 7800,  volumeCbm: 39, plannedDeparture: tf(5),  priority: 'normal',   tags: ['consumer-goods'] },
  { id: 'PL-2024-0887', routeCode: 'JPR-DEL-LTL', routeName: 'Jaipur → Delhi Return',  origin: 'Jaipur (Sitapura)',     destination: 'Delhi (Gurgaon)',   distanceKm: 280,  huCount: 5,  weightKg: 2200,  volumeCbm: 11, plannedDeparture: tf(8),  priority: 'normal',   tags: ['return-load'] },
  { id: 'PL-2024-0888', routeCode: 'CHN-BLR-LTL', routeName: 'Chennai → Bangalore',    origin: 'Chennai (Ambattur)',    destination: 'Bangalore (EC)',    distanceKm: 350,  huCount: 4,  weightKg: 1600,  volumeCbm: 8,  plannedDeparture: tf(10), priority: 'normal',   tags: ['electronics'] },
  { id: 'PL-2024-0889', routeCode: 'HYD-MUM-FTL', routeName: 'Hyderabad → Mumbai FTL', origin: 'Hyderabad (Uppal)',     destination: 'Mumbai (Bhiwandi)', distanceKm: 710,  huCount: 18, weightKg: 11000, volumeCbm: 55, plannedDeparture: tf(3),  priority: 'high',     tags: ['fmcg','critical-stock'] },
  { id: 'PL-2024-0890', routeCode: 'IND-DEL-LTL', routeName: 'Indore → Delhi LTL',     origin: 'Indore (Dewas Naka)',   destination: 'Delhi (Naraina)',   distanceKm: 830,  huCount: 9,  weightKg: 4800,  volumeCbm: 24, plannedDeparture: tf(12), priority: 'normal',   tags: ['apparel'] },
]

export const LOAD_PLANS: LoadPlan[] = [
  {
    id: 'LP-2024-0551',
    status: 'confirmed',
    vehicleId: 'V-001',
    loads: ['PL-2024-0885'],
    totalWeightKg: 5600,
    totalVolumeCbm: 28,
    utilizationPct: 37,
    plannedDeparture: tf(6),
    plannedArrival: tf(14),
    routeCode: 'MUM-AHM-LTL',
    freightEstimate: 28000,
    createdBy: 'Anita Rao',
    createdAt: t(2),
  },
  {
    id: 'LP-2024-0552',
    status: 'draft',
    vehicleId: 'V-012',
    loads: ['PL-2024-0882', 'PL-2024-0887'],
    totalWeightKg: 6400,
    totalVolumeCbm: 32,
    utilizationPct: 80,
    plannedDeparture: tf(4),
    plannedArrival: tf(16),
    routeCode: 'DEL-PUN-LTL',
    freightEstimate: 36000,
    createdBy: 'Suresh Kumar',
    createdAt: t(1),
  },
]

// ─── KPIs ────────────────────────────────────────────────────────────────────

export const PLANNING_KPI = {
  available:          VEHICLES.filter(v => v.availability === 'available').length,
  pendingLoads:       PENDING_LOADS.filter(l => !l.assignedVehicleId).length,
  criticalLoads:      PENDING_LOADS.filter(l => l.priority === 'critical').length,
  avgUtilization:     Math.round(VEHICLES.filter(v => v.utilizationPct > 0).reduce((s,v) => s + v.utilizationPct, 0) / Math.max(1, VEHICLES.filter(v => v.utilizationPct > 0).length)),
  inMaintenance:      VEHICLES.filter(v => v.availability === 'maintenance').length,
  plansToday:         LOAD_PLANS.length,
}

export const CAPACITY_BY_TYPE = [
  { type: 'FTL',     available: VEHICLES.filter(v=>v.type==='FTL'&&v.availability==='available').length,     total: VEHICLES.filter(v=>v.type==='FTL').length     },
  { type: 'LTL',     available: VEHICLES.filter(v=>v.type==='LTL'&&v.availability==='available').length,     total: VEHICLES.filter(v=>v.type==='LTL').length     },
  { type: 'LCV',     available: VEHICLES.filter(v=>v.type==='LCV'&&v.availability==='available').length,     total: VEHICLES.filter(v=>v.type==='LCV').length     },
  { type: 'Trailer', available: VEHICLES.filter(v=>v.type==='Trailer'&&v.availability==='available').length, total: VEHICLES.filter(v=>v.type==='Trailer').length },
]
