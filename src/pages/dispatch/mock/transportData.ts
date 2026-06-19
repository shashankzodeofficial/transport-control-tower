// Live transport telemetry — GPS pings, route checkpoints, ETA calculations

export interface GpsPing {
  timestamp: string
  lat: number
  lng: number
  speedKmh: number
  heading: number
  accuracy: number
}

export interface RouteCheckpoint {
  id: string
  name: string
  type: 'origin' | 'toll' | 'halt' | 'destination'
  lat: number
  lng: number
  expectedAt: string
  actualAt?: string
  status: 'passed' | 'current' | 'upcoming'
  distanceFromOriginKm: number
}

export interface VehicleTelematics {
  dispatchId: string
  vehicleReg: string
  driverName: string
  driverPhone: string
  currentLat: number
  currentLng: number
  currentLocation: string
  speedKmh: number
  heading: number
  lastPingAt: string
  distanceCoveredKm: number
  totalDistanceKm: number
  progressPct: number
  etaAt: string
  delayMinutes: number
  fuelPct: number
  engineStatus: 'running' | 'stopped' | 'idle'
  alerts: string[]
  recentPings: GpsPing[]
  checkpoints: RouteCheckpoint[]
}

const now = Date.now()
const t   = (minsAgo: number)  => new Date(now - minsAgo * 60000).toISOString()
const ta  = (hoursAhead: number) => new Date(now + hoursAhead * 3600000).toISOString()

export const VEHICLE_TELEMATICS: VehicleTelematics[] = [
  {
    dispatchId: 'D-48291',
    vehicleReg: 'MH12XY9901',
    driverName: 'Ramesh Singh',
    driverPhone: '+91 98100 11234',
    currentLat: 21.1702,
    currentLng: 72.8311,
    currentLocation: 'Near Surat, NH48',
    speedKmh: 62,
    heading: 205,
    lastPingAt: t(3),
    distanceCoveredKm: 1108,
    totalDistanceKm: 1418,
    progressPct: 78,
    etaAt: ta(4.8),
    delayMinutes: 72,
    fuelPct: 38,
    engineStatus: 'running',
    alerts: ['SLA AT RISK — 1.2h remaining', 'Low fuel approaching Surat'],
    recentPings: [
      { timestamp: t(3),  lat: 21.1702, lng: 72.8311, speedKmh: 62, heading: 205, accuracy: 8  },
      { timestamp: t(8),  lat: 21.3841, lng: 72.9781, speedKmh: 58, heading: 210, accuracy: 10 },
      { timestamp: t(13), lat: 21.5991, lng: 73.1124, speedKmh: 71, heading: 208, accuracy: 7  },
      { timestamp: t(18), lat: 21.8821, lng: 73.3312, speedKmh: 54, heading: 212, accuracy: 9  },
      { timestamp: t(23), lat: 22.0891, lng: 73.5124, speedKmh: 0,  heading: 205, accuracy: 6  },
    ],
    checkpoints: [
      { id: 'cp1', name: 'Delhi (Gurgaon WH)',    type: 'origin',      lat: 28.4595, lng: 77.0266, expectedAt: t(18*60), actualAt: t(17*60+30), status: 'passed',   distanceFromOriginKm: 0    },
      { id: 'cp2', name: 'Kota Toll',              type: 'toll',        lat: 25.1818, lng: 75.8336, expectedAt: t(12*60), actualAt: t(11*60+45), status: 'passed',   distanceFromOriginKm: 382  },
      { id: 'cp3', name: 'Vadodara Bypass',        type: 'toll',        lat: 22.3072, lng: 73.1812, expectedAt: t(9*60),  actualAt: t(9*60),     status: 'passed',   distanceFromOriginKm: 782  },
      { id: 'cp4', name: 'Surat — Current',        type: 'halt',        lat: 21.1702, lng: 72.8311, expectedAt: t(5*60),  status: 'current',                         distanceFromOriginKm: 1108 },
      { id: 'cp5', name: 'Mumbai (Bhiwandi Hub)',  type: 'destination', lat: 19.2967, lng: 73.0517, expectedAt: ta(4.8),  status: 'upcoming',                        distanceFromOriginKm: 1418 },
    ],
  },
  {
    dispatchId: 'D-48218',
    vehicleReg: 'DL01AB2233',
    driverName: 'Manoj Yadav',
    driverPhone: '+91 99300 77654',
    currentLat: 27.4924,
    currentLng: 77.6737,
    currentLocation: 'Near Mathura, NH19',
    speedKmh: 0,
    heading: 290,
    lastPingAt: t(45),
    distanceCoveredKm: 1401,
    totalDistanceKm: 1480,
    progressPct: 95,
    etaAt: ta(2.1),
    delayMinutes: 138,
    fuelPct: 22,
    engineStatus: 'stopped',
    alerts: ['SLA BREACHED — 1.2h overdue', 'Vehicle stopped for 45+ min', 'Critical: Escalation L3 active'],
    recentPings: [
      { timestamp: t(45), lat: 27.4924, lng: 77.6737, speedKmh: 0,  heading: 290, accuracy: 12 },
      { timestamp: t(60), lat: 27.4931, lng: 77.6741, speedKmh: 5,  heading: 285, accuracy: 10 },
      { timestamp: t(75), lat: 27.6021, lng: 77.7894, speedKmh: 62, heading: 291, accuracy: 8  },
      { timestamp: t(90), lat: 27.8412, lng: 78.0021, speedKmh: 55, heading: 294, accuracy: 9  },
    ],
    checkpoints: [
      { id: 'cp1', name: 'Kolkata (Rajarhat Hub)',   type: 'origin',      lat: 22.5726, lng: 88.3639, expectedAt: t(36*60), actualAt: t(35*60),    status: 'passed',   distanceFromOriginKm: 0    },
      { id: 'cp2', name: 'Varanasi NH19',             type: 'toll',        lat: 25.3176, lng: 82.9739, expectedAt: t(22*60), actualAt: t(22*60+30), status: 'passed',   distanceFromOriginKm: 780  },
      { id: 'cp3', name: 'Agra Bypass',               type: 'toll',        lat: 27.1767, lng: 78.0081, expectedAt: t(14*60), actualAt: t(15*60+15), status: 'passed',   distanceFromOriginKm: 1320 },
      { id: 'cp4', name: 'Mathura — Stopped',         type: 'halt',        lat: 27.4924, lng: 77.6737, expectedAt: t(12*60), status: 'current',                         distanceFromOriginKm: 1401 },
      { id: 'cp5', name: 'Delhi (Gurgaon WH)',        type: 'destination', lat: 28.4595, lng: 77.0266, expectedAt: ta(2.1),  status: 'upcoming',                        distanceFromOriginKm: 1480 },
    ],
  },
  {
    dispatchId: 'D-48275',
    vehicleReg: 'KA05MN7654',
    driverName: 'Sunil Patil',
    driverPhone: '+91 97200 55432',
    currentLat: 15.8497,
    currentLng: 74.4977,
    currentLocation: 'Near Belgaum, NH48',
    speedKmh: 74,
    heading: 155,
    lastPingAt: t(5),
    distanceCoveredKm: 598,
    totalDistanceKm: 984,
    progressPct: 61,
    etaAt: ta(8.3),
    delayMinutes: 18,
    fuelPct: 61,
    engineStatus: 'running',
    alerts: [],
    recentPings: [
      { timestamp: t(5),  lat: 15.8497, lng: 74.4977, speedKmh: 74, heading: 155, accuracy: 7  },
      { timestamp: t(10), lat: 15.9812, lng: 74.5321, speedKmh: 68, heading: 158, accuracy: 8  },
      { timestamp: t(15), lat: 16.1024, lng: 74.5701, speedKmh: 71, heading: 152, accuracy: 9  },
      { timestamp: t(20), lat: 16.2433, lng: 74.6112, speedKmh: 65, heading: 156, accuracy: 7  },
    ],
    checkpoints: [
      { id: 'cp1', name: 'Mumbai (Bhiwandi Hub)',  type: 'origin',      lat: 19.2967, lng: 73.0517, expectedAt: t(22*60), actualAt: t(21*60),    status: 'passed',   distanceFromOriginKm: 0   },
      { id: 'cp2', name: 'Pune Toll Plaza',         type: 'toll',        lat: 18.5204, lng: 73.8567, expectedAt: t(16*60), actualAt: t(15*60+40), status: 'passed',   distanceFromOriginKm: 185 },
      { id: 'cp3', name: 'Kolhapur Bypass',         type: 'toll',        lat: 16.7050, lng: 74.2433, expectedAt: t(10*60), actualAt: t(9*60+50),  status: 'passed',   distanceFromOriginKm: 412 },
      { id: 'cp4', name: 'Belgaum — Current',       type: 'halt',        lat: 15.8497, lng: 74.4977, expectedAt: t(8*60),  status: 'current',                         distanceFromOriginKm: 598 },
      { id: 'cp5', name: 'Hubli Halt',              type: 'halt',        lat: 15.3647, lng: 75.1240, expectedAt: ta(2),    status: 'upcoming',                        distanceFromOriginKm: 714 },
      { id: 'cp6', name: 'Bangalore (Whitefield)',  type: 'destination', lat: 12.9716, lng: 77.5946, expectedAt: ta(8.3),  status: 'upcoming',                        distanceFromOriginKm: 984 },
    ],
  },
  {
    dispatchId: 'D-48241',
    vehicleReg: 'TN22CD5588',
    driverName: 'Vijay Kumar',
    driverPhone: '+91 96500 22345',
    currentLat: 12.5124,
    currentLng: 78.2140,
    currentLocation: 'Near Krishnagiri, NH44',
    speedKmh: 58,
    heading: 88,
    lastPingAt: t(6),
    distanceCoveredKm: 178,
    totalDistanceKm: 346,
    progressPct: 51,
    etaAt: ta(3.8),
    delayMinutes: 48,
    fuelPct: 54,
    engineStatus: 'running',
    alerts: ['SLA AT RISK — 1.8h remaining', 'Delay: +48 min vs plan'],
    recentPings: [
      { timestamp: t(6),  lat: 12.5124, lng: 78.2140, speedKmh: 58, heading: 88, accuracy: 8 },
      { timestamp: t(11), lat: 12.5231, lng: 78.0921, speedKmh: 62, heading: 85, accuracy: 7 },
      { timestamp: t(16), lat: 12.5344, lng: 77.9701, speedKmh: 55, heading: 90, accuracy: 9 },
    ],
    checkpoints: [
      { id: 'cp1', name: 'Bangalore (Electronic City)', type: 'origin',      lat: 12.8399, lng: 77.6770, expectedAt: t(8*60),  actualAt: t(7*60+30),  status: 'passed',   distanceFromOriginKm: 0   },
      { id: 'cp2', name: 'Hosur Toll',                   type: 'toll',        lat: 12.7409, lng: 77.8253, expectedAt: t(6*60),  actualAt: t(6*60+20),  status: 'passed',   distanceFromOriginKm: 40  },
      { id: 'cp3', name: 'Krishnagiri — Current',        type: 'halt',        lat: 12.5124, lng: 78.2140, expectedAt: t(4*60),  status: 'current',                         distanceFromOriginKm: 178 },
      { id: 'cp4', name: 'Chennai (Ambattur DC)',        type: 'destination', lat: 13.1143, lng: 80.1548, expectedAt: ta(3.8),  status: 'upcoming',                        distanceFromOriginKm: 346 },
    ],
  },
  {
    dispatchId: 'D-48260',
    vehicleReg: 'TS09GH3421',
    driverName: 'Naresh Kumar',
    driverPhone: '+91 90000 66789',
    currentLat: 18.9944,
    currentLng: 79.5941,
    currentLocation: 'Near Karimnagar, NH63',
    speedKmh: 68,
    heading: 175,
    lastPingAt: t(4),
    distanceCoveredKm: 1041,
    totalDistanceKm: 1550,
    progressPct: 67,
    etaAt: ta(6.1),
    delayMinutes: 0,
    fuelPct: 47,
    engineStatus: 'running',
    alerts: [],
    recentPings: [
      { timestamp: t(4),  lat: 18.9944, lng: 79.5941, speedKmh: 68, heading: 175, accuracy: 7  },
      { timestamp: t(9),  lat: 19.1821, lng: 79.5312, speedKmh: 72, heading: 178, accuracy: 8  },
      { timestamp: t(14), lat: 19.3501, lng: 79.5012, speedKmh: 65, heading: 176, accuracy: 9  },
    ],
    checkpoints: [
      { id: 'cp1', name: 'Delhi (Okhla Depot)',     type: 'origin',      lat: 28.5355, lng: 77.2590, expectedAt: t(14*60), actualAt: t(13*60+30), status: 'passed',   distanceFromOriginKm: 0    },
      { id: 'cp2', name: 'Nagpur Toll',              type: 'toll',        lat: 21.1458, lng: 79.0882, expectedAt: t(8*60),  actualAt: t(7*60+50),  status: 'passed',   distanceFromOriginKm: 852  },
      { id: 'cp3', name: 'Karimnagar — Current',    type: 'halt',        lat: 18.9944, lng: 79.5941, expectedAt: t(5*60),  status: 'current',                         distanceFromOriginKm: 1041 },
      { id: 'cp4', name: 'Hyderabad (Uppal WH)',    type: 'destination', lat: 17.4065, lng: 78.5480, expectedAt: ta(6.1),  status: 'upcoming',                        distanceFromOriginKm: 1550 },
    ],
  },
  {
    dispatchId: 'D-48190',
    vehicleReg: 'RJ14CC4421',
    driverName: 'Prakash Meena',
    driverPhone: '+91 94100 33456',
    currentLat: 27.2046,
    currentLng: 77.4977,
    currentLocation: 'Near Mathura Bypass, NH21',
    speedKmh: 84,
    heading: 45,
    lastPingAt: t(2),
    distanceCoveredKm: 168,
    totalDistanceKm: 268,
    progressPct: 63,
    etaAt: ta(2.1),
    delayMinutes: 0,
    fuelPct: 71,
    engineStatus: 'running',
    alerts: [],
    recentPings: [
      { timestamp: t(2),  lat: 27.2046, lng: 77.4977, speedKmh: 84, heading: 45, accuracy: 6 },
      { timestamp: t(7),  lat: 27.0921, lng: 77.3812, speedKmh: 78, heading: 48, accuracy: 7 },
      { timestamp: t(12), lat: 26.9201, lng: 77.2101, speedKmh: 81, heading: 46, accuracy: 8 },
    ],
    checkpoints: [
      { id: 'cp1', name: 'Jaipur (Mansarovar WH)',  type: 'origin',      lat: 26.8905, lng: 75.7892, expectedAt: t(5*60), actualAt: t(4*60+48), status: 'passed',   distanceFromOriginKm: 0   },
      { id: 'cp2', name: 'NH21 Bharatpur',           type: 'toll',        lat: 27.2152, lng: 77.4901, expectedAt: t(3*60), actualAt: t(2*60+55), status: 'passed',   distanceFromOriginKm: 168 },
      { id: 'cp3', name: 'Delhi (Okhla Depot)',      type: 'destination', lat: 28.5355, lng: 77.2590, expectedAt: ta(2.1), status: 'upcoming',                        distanceFromOriginKm: 268 },
    ],
  },
  {
    dispatchId: 'D-48178',
    vehicleReg: 'KA01FG8812',
    driverName: 'Santosh Reddy',
    driverPhone: '+91 98400 99123',
    currentLat: 14.4426,
    currentLng: 78.1478,
    currentLocation: 'Near Kadapa, NH67',
    speedKmh: 71,
    heading: 202,
    lastPingAt: t(5),
    distanceCoveredKm: 312,
    totalDistanceKm: 568,
    progressPct: 55,
    etaAt: ta(4.2),
    delayMinutes: 14,
    fuelPct: 58,
    engineStatus: 'running',
    alerts: [],
    recentPings: [
      { timestamp: t(5),  lat: 14.4426, lng: 78.1478, speedKmh: 71, heading: 202, accuracy: 8 },
      { timestamp: t(10), lat: 14.6102, lng: 78.2314, speedKmh: 68, heading: 205, accuracy: 9 },
    ],
    checkpoints: [
      { id: 'cp1', name: 'Hyderabad (Uppal WH)',    type: 'origin',      lat: 17.4065, lng: 78.5480, expectedAt: t(10*60), actualAt: t(9*60+30), status: 'passed',   distanceFromOriginKm: 0   },
      { id: 'cp2', name: 'Kurnool Bypass',           type: 'toll',        lat: 15.8281, lng: 78.0373, expectedAt: t(6*60),  actualAt: t(6*60+15), status: 'passed',   distanceFromOriginKm: 215 },
      { id: 'cp3', name: 'Kadapa — Current',         type: 'halt',        lat: 14.4426, lng: 78.1478, expectedAt: t(4*60),  status: 'current',                         distanceFromOriginKm: 312 },
      { id: 'cp4', name: 'Bangalore (Whitefield)',   type: 'destination', lat: 12.9716, lng: 77.5946, expectedAt: ta(4.2),  status: 'upcoming',                        distanceFromOriginKm: 568 },
    ],
  },
  {
    dispatchId: 'D-48155',
    vehicleReg: 'GJ01BC6634',
    driverName: 'Haresh Shah',
    driverPhone: '+91 92000 44567',
    currentLat: 20.5124,
    currentLng: 72.9312,
    currentLocation: 'Near Vapi, NH48',
    speedKmh: 0,
    heading: 180,
    lastPingAt: t(82),
    distanceCoveredKm: 478,
    totalDistanceKm: 541,
    progressPct: 88,
    etaAt: ta(1.8),
    delayMinutes: 96,
    fuelPct: 18,
    engineStatus: 'stopped',
    alerts: ['SLA BREACHED — 0.8h overdue', 'Vehicle stopped 82 min', 'Breakdown reported by driver'],
    recentPings: [
      { timestamp: t(82), lat: 20.5124, lng: 72.9312, speedKmh: 0,  heading: 180, accuracy: 12 },
      { timestamp: t(92), lat: 20.5129, lng: 72.9318, speedKmh: 3,  heading: 182, accuracy: 10 },
      { timestamp: t(102),lat: 20.6401, lng: 72.9612, speedKmh: 72, heading: 181, accuracy: 8  },
    ],
    checkpoints: [
      { id: 'cp1', name: 'Ahmedabad (Changodar)',  type: 'origin',      lat: 22.9784, lng: 72.5872, expectedAt: t(12*60), actualAt: t(11*60+30), status: 'passed',   distanceFromOriginKm: 0   },
      { id: 'cp2', name: 'Surat NH48 Toll',         type: 'toll',        lat: 21.1702, lng: 72.8311, expectedAt: t(8*60),  actualAt: t(8*60+20),  status: 'passed',   distanceFromOriginKm: 264 },
      { id: 'cp3', name: 'Vapi — Stopped',          type: 'halt',        lat: 20.5124, lng: 72.9312, expectedAt: t(5*60),  status: 'current',                         distanceFromOriginKm: 478 },
      { id: 'cp4', name: 'Mumbai (Bhiwandi Hub)',   type: 'destination', lat: 19.2967, lng: 73.0517, expectedAt: ta(1.8),  status: 'upcoming',                        distanceFromOriginKm: 541 },
    ],
  },
]

export function getTelematics(dispatchId: string): VehicleTelematics | undefined {
  return VEHICLE_TELEMATICS.find(v => v.dispatchId === dispatchId)
}
