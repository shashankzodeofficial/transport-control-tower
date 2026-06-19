// Master Data — mock records for all six entity types.
// All timestamps relative to "now" at module load time.

const now   = Date.now()
const dago  = (d: number) => new Date(now - d * 86400000).toISOString()

// ─── Route Master ─────────────────────────────────────────────────────────────

export type RouteType = 'FTL' | 'LTL' | 'LCV' | 'Express' | 'Cold Chain'

export interface RouteMaster {
  id: string
  routeCode: string
  origin: string
  destination: string
  distanceKm: number
  transitHours: number
  slaHours: number
  routeType: RouteType
  active: boolean
  createdAt: string
  updatedAt: string
}

export const INITIAL_ROUTES: RouteMaster[] = [
  { id: 'R-001', routeCode: 'DEL-MUM-FTL', origin: 'Delhi',     destination: 'Mumbai',    distanceKm: 1420, transitHours: 26, slaHours: 30, routeType: 'FTL',        active: true,  createdAt: dago(120), updatedAt: dago(3) },
  { id: 'R-002', routeCode: 'MUM-PUN-002', origin: 'Mumbai',    destination: 'Pune',      distanceKm: 155,  transitHours: 4,  slaHours: 6,  routeType: 'Express',    active: true,  createdAt: dago(110), updatedAt: dago(1) },
  { id: 'R-003', routeCode: 'BLR-CHN-003', origin: 'Bangalore', destination: 'Chennai',   distanceKm: 350,  transitHours: 8,  slaHours: 10, routeType: 'FTL',        active: true,  createdAt: dago(100), updatedAt: dago(5) },
  { id: 'R-004', routeCode: 'MUM-AHM-004', origin: 'Mumbai',    destination: 'Ahmedabad', distanceKm: 530,  transitHours: 11, slaHours: 14, routeType: 'FTL',        active: true,  createdAt: dago(95),  updatedAt: dago(2) },
  { id: 'R-005', routeCode: 'HYD-MUM-005', origin: 'Hyderabad', destination: 'Mumbai',    distanceKm: 710,  transitHours: 16, slaHours: 20, routeType: 'LTL',        active: true,  createdAt: dago(90),  updatedAt: dago(7) },
  { id: 'R-006', routeCode: 'KOL-PAT-006', origin: 'Kolkata',   destination: 'Patna',     distanceKm: 580,  transitHours: 13, slaHours: 18, routeType: 'FTL',        active: true,  createdAt: dago(85),  updatedAt: dago(4) },
  { id: 'R-007', routeCode: 'DEL-LKW-007', origin: 'Delhi',     destination: 'Lucknow',   distanceKm: 520,  transitHours: 11, slaHours: 14, routeType: 'LTL',        active: true,  createdAt: dago(80),  updatedAt: dago(6) },
  { id: 'R-008', routeCode: 'BLR-HYD-008', origin: 'Bangalore', destination: 'Hyderabad', distanceKm: 570,  transitHours: 12, slaHours: 16, routeType: 'FTL',        active: false, createdAt: dago(75),  updatedAt: dago(10) },
  { id: 'R-009', routeCode: 'DEL-JPR-009', origin: 'Delhi',     destination: 'Jaipur',    distanceKm: 280,  transitHours: 5,  slaHours: 8,  routeType: 'Express',    active: true,  createdAt: dago(70),  updatedAt: dago(1) },
  { id: 'R-010', routeCode: 'KOL-DEL-001', origin: 'Kolkata',   destination: 'Delhi',     distanceKm: 1480, transitHours: 36, slaHours: 42, routeType: 'FTL',        active: true,  createdAt: dago(65),  updatedAt: dago(8) },
  { id: 'R-011', routeCode: 'DEL-HYD-COLD',origin: 'Delhi',     destination: 'Hyderabad', distanceKm: 1520, transitHours: 30, slaHours: 36, routeType: 'Cold Chain', active: true,  createdAt: dago(60),  updatedAt: dago(2) },
  { id: 'R-012', routeCode: 'CHN-BLR-012', origin: 'Chennai',   destination: 'Bangalore', distanceKm: 350,  transitHours: 8,  slaHours: 12, routeType: 'LCV',        active: false, createdAt: dago(55),  updatedAt: dago(15) },
]

// ─── Fleet Master ─────────────────────────────────────────────────────────────

export type VehicleType = 'FTL Truck' | 'LTL Truck' | 'LCV' | 'Trailer' | 'Reefer'
export type VehicleStatus = 'active' | 'inactive' | 'maintenance' | 'decommissioned'

export interface FleetMaster {
  id: string
  vehicleNumber: string
  vehicleType: VehicleType
  capacityTons: number
  capacityCbm: number
  carrier: string
  registration: string
  driverName: string
  driverPhone: string
  status: VehicleStatus
  createdAt: string
  updatedAt: string
}

export const INITIAL_FLEET: FleetMaster[] = [
  { id: 'V-001', vehicleNumber: 'MH12XY9901', vehicleType: 'FTL Truck', capacityTons: 12, capacityCbm: 40, carrier: 'Prime Transport Co',  registration: 'MH12XY9901', driverName: 'Ramesh Singh',    driverPhone: '+91 98100 11234', status: 'active',      createdAt: dago(200), updatedAt: dago(2) },
  { id: 'V-002', vehicleNumber: 'GJ05AB1234', vehicleType: 'FTL Truck', capacityTons: 10, capacityCbm: 35, carrier: 'Gati Ltd',            registration: 'GJ05AB1234', driverName: 'Suresh Patel',    driverPhone: '+91 97654 12380', status: 'active',      createdAt: dago(195), updatedAt: dago(1) },
  { id: 'V-003', vehicleNumber: 'KA03TU5678', vehicleType: 'FTL Truck', capacityTons: 14, capacityCbm: 45, carrier: 'VRL Logistics',       registration: 'KA03TU5678', driverName: 'Manoj Kumar',     driverPhone: '+91 95432 01987', status: 'active',      createdAt: dago(190), updatedAt: dago(3) },
  { id: 'V-004', vehicleNumber: 'MH04GH2211', vehicleType: 'LTL Truck', capacityTons: 6,  capacityCbm: 22, carrier: 'DTDC Freight',        registration: 'MH04GH2211', driverName: 'Arun Sharma',     driverPhone: '+91 96543 09871', status: 'active',      createdAt: dago(185), updatedAt: dago(5) },
  { id: 'V-005', vehicleNumber: 'TN07LK9900', vehicleType: 'LCV',       capacityTons: 3,  capacityCbm: 12, carrier: 'Delhivery Surface',   registration: 'TN07LK9900', driverName: 'Vijay Rajan',     driverPhone: '+91 93210 87654', status: 'active',      createdAt: dago(180), updatedAt: dago(2) },
  { id: 'V-006', vehicleNumber: 'AP09MN3344', vehicleType: 'FTL Truck', capacityTons: 12, capacityCbm: 40, carrier: 'FastMove Logistics',  registration: 'AP09MN3344', driverName: 'Ravi Reddy',      driverPhone: '+91 91098 65432', status: 'maintenance', createdAt: dago(175), updatedAt: dago(7) },
  { id: 'V-007', vehicleNumber: 'DL01AB7788', vehicleType: 'Trailer',   capacityTons: 20, capacityCbm: 65, carrier: 'Express Roads',       registration: 'DL01AB7788', driverName: 'Pradeep Yadav',   driverPhone: '+91 94321 98760', status: 'active',      createdAt: dago(170), updatedAt: dago(4) },
  { id: 'V-008', vehicleNumber: 'RJ14CD5566', vehicleType: 'FTL Truck', capacityTons: 10, capacityCbm: 35, carrier: 'Rajasthan Carriers',  registration: 'RJ14CD5566', driverName: 'Mohan Bishnoi',   driverPhone: '+91 97654 23456', status: 'active',      createdAt: dago(165), updatedAt: dago(1) },
  { id: 'V-009', vehicleNumber: 'MH02PQ1122', vehicleType: 'FTL Truck', capacityTons: 12, capacityCbm: 40, carrier: 'BlueDart Surface',    registration: 'MH02PQ1122', driverName: 'Santosh Naik',    driverPhone: '+91 98765 12345', status: 'active',      createdAt: dago(160), updatedAt: dago(6) },
  { id: 'V-010', vehicleNumber: 'TS08RR5566', vehicleType: 'Reefer',    capacityTons: 8,  capacityCbm: 28, carrier: 'ColdEx Logistics',    registration: 'TS08RR5566', driverName: 'Deepak More',     driverPhone: '+91 96543 21987', status: 'maintenance', createdAt: dago(155), updatedAt: dago(9) },
  { id: 'V-011', vehicleNumber: 'WB20XY6655', vehicleType: 'LTL Truck', capacityTons: 6,  capacityCbm: 22, carrier: 'Calcutta Express',    registration: 'WB20XY6655', driverName: 'Biswanath Das',   driverPhone: '+91 93210 09876', status: 'inactive',    createdAt: dago(150), updatedAt: dago(30) },
  { id: 'V-012', vehicleNumber: 'MP09DE8877', vehicleType: 'LCV',       capacityTons: 2,  capacityCbm: 10, carrier: 'Central India Freight',registration: 'MP09DE8877', driverName: 'Hemant Verma',    driverPhone: '+91 94321 08765', status: 'active',      createdAt: dago(145), updatedAt: dago(2) },
]

// ─── Carrier Master ───────────────────────────────────────────────────────────

export type CarrierTier = 'Platinum' | 'Gold' | 'Silver' | 'Bronze' | 'Probation'

export interface CarrierMaster {
  id: string
  carrierCode: string
  carrierName: string
  region: string
  contactName: string
  contactPhone: string
  contactEmail: string
  tier: CarrierTier
  active: boolean
  createdAt: string
  updatedAt: string
}

export const INITIAL_CARRIERS: CarrierMaster[] = [
  { id: 'C-001', carrierCode: 'PTC',  carrierName: 'Prime Transport Co',      region: 'West',  contactName: 'Rakesh Mehta',   contactPhone: '9876501234', contactEmail: 'rakesh@primettransport.in',    tier: 'Platinum',  active: true,  createdAt: dago(300), updatedAt: dago(5) },
  { id: 'C-002', carrierCode: 'SCI',  carrierName: 'SwiftCargo India',        region: 'North', contactName: 'Sonia Kapoor',   contactPhone: '9765412380', contactEmail: 'sonia@swiftcargo.in',          tier: 'Platinum',  active: true,  createdAt: dago(290), updatedAt: dago(3) },
  { id: 'C-003', carrierCode: 'VRL',  carrierName: 'VRL Logistics',           region: 'South', contactName: 'Vijay Sangam',   contactPhone: '9654309871', contactEmail: 'vijay@vrl.co.in',              tier: 'Gold',      active: true,  createdAt: dago(280), updatedAt: dago(2) },
  { id: 'C-004', carrierCode: 'BDS',  carrierName: 'BlueDart Surface',        region: 'South', contactName: 'Arjun Nair',     contactPhone: '9543201987', contactEmail: 'arjun@bluedart.com',           tier: 'Gold',      active: true,  createdAt: dago(270), updatedAt: dago(7) },
  { id: 'C-005', carrierCode: 'TCI',  carrierName: 'TCI Freight',             region: 'North', contactName: 'Pankaj Sinha',   contactPhone: '9432198760', contactEmail: 'pankaj@tcifreight.in',         tier: 'Gold',      active: true,  createdAt: dago(260), updatedAt: dago(1) },
  { id: 'C-006', carrierCode: 'SFX',  carrierName: 'Safexpress',              region: 'East',  contactName: 'Biswas Sen',     contactPhone: '9321087654', contactEmail: 'biswas@safexpress.com',        tier: 'Silver',    active: true,  createdAt: dago(250), updatedAt: dago(10) },
  { id: 'C-007', carrierCode: 'GTI',  carrierName: 'Gati Ltd',                region: 'South', contactName: 'Kalyan Rao',     contactPhone: '9210976543', contactEmail: 'kalyan@gati.com',              tier: 'Silver',    active: true,  createdAt: dago(240), updatedAt: dago(4) },
  { id: 'C-008', carrierCode: 'FML',  carrierName: 'FastMove Logistics',      region: 'East',  contactName: 'Subhash Das',    contactPhone: '9109865432', contactEmail: 'subhash@fastmove.in',          tier: 'Probation', active: true,  createdAt: dago(230), updatedAt: dago(2) },
  { id: 'C-009', carrierCode: 'DLV',  carrierName: 'Delhivery Surface',       region: 'North', contactName: 'Neha Gupta',     contactPhone: '9876512345', contactEmail: 'neha@delhivery.com',           tier: 'Silver',    active: true,  createdAt: dago(220), updatedAt: dago(6) },
  { id: 'C-010', carrierCode: 'CLX',  carrierName: 'ColdEx Logistics',        region: 'North', contactName: 'Preet Kaur',     contactPhone: '9765423456', contactEmail: 'preet@coldex.in',              tier: 'Gold',      active: true,  createdAt: dago(210), updatedAt: dago(3) },
  { id: 'C-011', carrierCode: 'CEX',  carrierName: 'Calcutta Express',        region: 'East',  contactName: 'Arijit Bose',    contactPhone: '9654321098', contactEmail: 'arijit@calexpress.in',         tier: 'Bronze',    active: false, createdAt: dago(200), updatedAt: dago(45) },
  { id: 'C-012', carrierCode: 'RJC',  carrierName: 'Rajasthan Carriers',      region: 'North', contactName: 'Bhagirath Sharma',contactPhone: '9543210987',contactEmail: 'bhagirath@rajcarriers.in',     tier: 'Silver',    active: true,  createdAt: dago(190), updatedAt: dago(8) },
]

// ─── Hub Master ───────────────────────────────────────────────────────────────

export type HubType = 'Primary Hub' | 'Secondary Hub' | 'Depot' | 'Cross-Dock'

export interface HubMaster {
  id: string
  hubCode: string
  hubName: string
  city: string
  state: string
  capacityVehicles: number
  operatingFrom: string
  operatingTo: string
  hubType: HubType
  active: boolean
  createdAt: string
  updatedAt: string
}

export const INITIAL_HUBS: HubMaster[] = [
  { id: 'H-001', hubCode: 'DEL-HUB', hubName: 'Delhi Primary Hub',      city: 'New Delhi',  state: 'Delhi',             capacityVehicles: 80,  operatingFrom: '00:00', operatingTo: '23:59', hubType: 'Primary Hub',   active: true,  createdAt: dago(400), updatedAt: dago(10) },
  { id: 'H-002', hubCode: 'MUM-HUB', hubName: 'Mumbai Primary Hub',     city: 'Mumbai',     state: 'Maharashtra',       capacityVehicles: 90,  operatingFrom: '00:00', operatingTo: '23:59', hubType: 'Primary Hub',   active: true,  createdAt: dago(395), updatedAt: dago(5) },
  { id: 'H-003', hubCode: 'BLR-HUB', hubName: 'Bangalore Secondary Hub',city: 'Bangalore',  state: 'Karnataka',         capacityVehicles: 60,  operatingFrom: '05:00', operatingTo: '22:00', hubType: 'Secondary Hub', active: true,  createdAt: dago(390), updatedAt: dago(3) },
  { id: 'H-004', hubCode: 'HYD-DEP', hubName: 'Hyderabad Depot',        city: 'Hyderabad',  state: 'Telangana',         capacityVehicles: 35,  operatingFrom: '06:00', operatingTo: '22:00', hubType: 'Depot',         active: true,  createdAt: dago(385), updatedAt: dago(7) },
  { id: 'H-005', hubCode: 'CHN-DEP', hubName: 'Chennai Depot',          city: 'Chennai',    state: 'Tamil Nadu',        capacityVehicles: 30,  operatingFrom: '06:00', operatingTo: '21:00', hubType: 'Depot',         active: true,  createdAt: dago(380), updatedAt: dago(2) },
  { id: 'H-006', hubCode: 'KOL-HUB', hubName: 'Kolkata Primary Hub',    city: 'Kolkata',    state: 'West Bengal',       capacityVehicles: 50,  operatingFrom: '00:00', operatingTo: '23:59', hubType: 'Primary Hub',   active: true,  createdAt: dago(375), updatedAt: dago(9) },
  { id: 'H-007', hubCode: 'PUN-DEP', hubName: 'Pune Depot',             city: 'Pune',       state: 'Maharashtra',       capacityVehicles: 22,  operatingFrom: '07:00', operatingTo: '20:00', hubType: 'Depot',         active: true,  createdAt: dago(370), updatedAt: dago(4) },
  { id: 'H-008', hubCode: 'AMD-DEP', hubName: 'Ahmedabad Depot',        city: 'Ahmedabad',  state: 'Gujarat',           capacityVehicles: 28,  operatingFrom: '06:00', operatingTo: '21:00', hubType: 'Depot',         active: true,  createdAt: dago(365), updatedAt: dago(6) },
  { id: 'H-009', hubCode: 'LKO-DEP', hubName: 'Lucknow Depot',          city: 'Lucknow',    state: 'Uttar Pradesh',     capacityVehicles: 18,  operatingFrom: '07:00', operatingTo: '20:00', hubType: 'Depot',         active: true,  createdAt: dago(360), updatedAt: dago(1) },
  { id: 'H-010', hubCode: 'JAI-DEP', hubName: 'Jaipur Depot',           city: 'Jaipur',     state: 'Rajasthan',         capacityVehicles: 15,  operatingFrom: '07:00', operatingTo: '19:00', hubType: 'Depot',         active: true,  createdAt: dago(355), updatedAt: dago(8) },
  { id: 'H-011', hubCode: 'NAG-XDK', hubName: 'Nagpur Cross-Dock',      city: 'Nagpur',     state: 'Maharashtra',       capacityVehicles: 40,  operatingFrom: '00:00', operatingTo: '23:59', hubType: 'Cross-Dock',    active: true,  createdAt: dago(350), updatedAt: dago(3) },
  { id: 'H-012', hubCode: 'SUR-DEP', hubName: 'Surat Depot',            city: 'Surat',      state: 'Gujarat',           capacityVehicles: 20,  operatingFrom: '06:00', operatingTo: '21:00', hubType: 'Depot',         active: false, createdAt: dago(345), updatedAt: dago(60) },
]

// ─── Customer Master ──────────────────────────────────────────────────────────

export type ServiceLevel = 'Premium' | 'Standard' | 'Economy'

export interface CustomerMaster {
  id: string
  customerCode: string
  customerName: string
  region: string
  serviceLevel: ServiceLevel
  contactName: string
  contactPhone: string
  contactEmail: string
  active: boolean
  createdAt: string
  updatedAt: string
}

export const INITIAL_CUSTOMERS: CustomerMaster[] = [
  { id: 'CU-001', customerCode: 'FLIP-001', customerName: 'Flipkart Logistics Pvt Ltd',   region: 'Pan India',  serviceLevel: 'Premium',  contactName: 'Rohan Malhotra',  contactPhone: '9988776655', contactEmail: 'rohan@flipkart.com',     active: true,  createdAt: dago(500), updatedAt: dago(5) },
  { id: 'CU-002', customerCode: 'AMAZ-002', customerName: 'Amazon Seller Services',       region: 'Pan India',  serviceLevel: 'Premium',  contactName: 'Sneha Rao',       contactPhone: '9877665544', contactEmail: 'sneha@amazon.in',        active: true,  createdAt: dago(490), updatedAt: dago(3) },
  { id: 'CU-003', customerCode: 'TATA-003', customerName: 'Tata Consumer Products',       region: 'West',       serviceLevel: 'Premium',  contactName: 'Ashish Joshi',    contactPhone: '9766554433', contactEmail: 'ashish@tataconsumer.com', active: true,  createdAt: dago(480), updatedAt: dago(7) },
  { id: 'CU-004', customerCode: 'RLNC-004', customerName: 'Reliance Retail Ltd',          region: 'West',       serviceLevel: 'Premium',  contactName: 'Kavita Shah',     contactPhone: '9655443322', contactEmail: 'kavita@ril.com',          active: true,  createdAt: dago(470), updatedAt: dago(2) },
  { id: 'CU-005', customerCode: 'HDFC-005', customerName: 'HDFC Bank Document Services',  region: 'Pan India',  serviceLevel: 'Standard', contactName: 'Nisha Pant',      contactPhone: '9544332211', contactEmail: 'nisha@hdfcbank.com',      active: true,  createdAt: dago(460), updatedAt: dago(10) },
  { id: 'CU-006', customerCode: 'BATA-006', customerName: 'Bata India Ltd',               region: 'North',      serviceLevel: 'Standard', contactName: 'Rajiv Thakur',    contactPhone: '9433221100', contactEmail: 'rajiv@bata.in',           active: true,  createdAt: dago(450), updatedAt: dago(4) },
  { id: 'CU-007', customerCode: 'HNST-007', customerName: 'Hindustan Unilever Ltd',       region: 'South',      serviceLevel: 'Premium',  contactName: 'Meena Krishnan',  contactPhone: '9322110099', contactEmail: 'meena@hul.com',           active: true,  createdAt: dago(440), updatedAt: dago(6) },
  { id: 'CU-008', customerCode: 'ITC-008',  customerName: 'ITC Limited (FMCG)',           region: 'East',       serviceLevel: 'Standard', contactName: 'Subhro Ghosh',    contactPhone: '9211009988', contactEmail: 'subhro@itc.in',           active: true,  createdAt: dago(430), updatedAt: dago(1) },
  { id: 'CU-009', customerCode: 'CIPLA-009',customerName: 'Cipla Ltd (Pharma)',           region: 'South',      serviceLevel: 'Premium',  contactName: 'Divya Iyer',      contactPhone: '9100998877', contactEmail: 'divya@cipla.com',         active: true,  createdAt: dago(420), updatedAt: dago(8) },
  { id: 'CU-010', customerCode: 'DRRD-010', customerName: "Dr. Reddy's Laboratories",     region: 'South',      serviceLevel: 'Premium',  contactName: 'Aruna Reddy',     contactPhone: '9099887766', contactEmail: 'aruna@drreddys.com',      active: true,  createdAt: dago(410), updatedAt: dago(3) },
  { id: 'CU-011', customerCode: 'BAJAJ-011',customerName: 'Bajaj Electricals Ltd',        region: 'West',       serviceLevel: 'Standard', contactName: 'Milind Pawar',    contactPhone: '9988001122', contactEmail: 'milind@bajajelectricals.com',active: true, createdAt: dago(400), updatedAt: dago(9) },
  { id: 'CU-012', customerCode: 'OLD-012',  customerName: 'Oldtimer Trade Co.',           region: 'North',      serviceLevel: 'Economy',  contactName: 'Suresh Kumar',    contactPhone: '9876111222', contactEmail: 'suresh@oldtimer.in',      active: false, createdAt: dago(390), updatedAt: dago(90) },
]

// ─── SLA Matrix ───────────────────────────────────────────────────────────────

export type ServiceType = 'FTL Standard' | 'FTL Express' | 'LTL' | 'LCV' | 'Cold Chain'

export interface SLARule {
  id: string
  origin: string
  destination: string
  serviceType: ServiceType
  slaHours: number
  escalationThresholdHours: number
  alertThresholdHours: number
  active: boolean
  createdAt: string
  updatedAt: string
}

export const INITIAL_SLA: SLARule[] = [
  { id: 'SLA-001', origin: 'Delhi',     destination: 'Mumbai',    serviceType: 'FTL Standard', slaHours: 30, escalationThresholdHours: 33, alertThresholdHours: 28, active: true,  createdAt: dago(200), updatedAt: dago(5) },
  { id: 'SLA-002', origin: 'Delhi',     destination: 'Mumbai',    serviceType: 'FTL Express',  slaHours: 24, escalationThresholdHours: 27, alertThresholdHours: 22, active: true,  createdAt: dago(200), updatedAt: dago(5) },
  { id: 'SLA-003', origin: 'Mumbai',    destination: 'Pune',      serviceType: 'LCV',          slaHours: 6,  escalationThresholdHours: 7,  alertThresholdHours: 5,  active: true,  createdAt: dago(195), updatedAt: dago(3) },
  { id: 'SLA-004', origin: 'Mumbai',    destination: 'Pune',      serviceType: 'FTL Express',  slaHours: 5,  escalationThresholdHours: 6,  alertThresholdHours: 4,  active: true,  createdAt: dago(195), updatedAt: dago(3) },
  { id: 'SLA-005', origin: 'Bangalore', destination: 'Chennai',   serviceType: 'FTL Standard', slaHours: 10, escalationThresholdHours: 12, alertThresholdHours: 9,  active: true,  createdAt: dago(190), updatedAt: dago(7) },
  { id: 'SLA-006', origin: 'Mumbai',    destination: 'Ahmedabad', serviceType: 'FTL Standard', slaHours: 14, escalationThresholdHours: 16, alertThresholdHours: 12, active: true,  createdAt: dago(185), updatedAt: dago(2) },
  { id: 'SLA-007', origin: 'Hyderabad', destination: 'Mumbai',    serviceType: 'LTL',          slaHours: 20, escalationThresholdHours: 23, alertThresholdHours: 18, active: true,  createdAt: dago(180), updatedAt: dago(8) },
  { id: 'SLA-008', origin: 'Kolkata',   destination: 'Patna',     serviceType: 'FTL Standard', slaHours: 18, escalationThresholdHours: 21, alertThresholdHours: 16, active: true,  createdAt: dago(175), updatedAt: dago(4) },
  { id: 'SLA-009', origin: 'Delhi',     destination: 'Lucknow',   serviceType: 'LTL',          slaHours: 14, escalationThresholdHours: 16, alertThresholdHours: 12, active: true,  createdAt: dago(170), updatedAt: dago(6) },
  { id: 'SLA-010', origin: 'Delhi',     destination: 'Hyderabad', serviceType: 'Cold Chain',   slaHours: 36, escalationThresholdHours: 40, alertThresholdHours: 33, active: true,  createdAt: dago(165), updatedAt: dago(2) },
  { id: 'SLA-011', origin: 'Delhi',     destination: 'Jaipur',    serviceType: 'FTL Express',  slaHours: 8,  escalationThresholdHours: 10, alertThresholdHours: 7,  active: true,  createdAt: dago(160), updatedAt: dago(1) },
  { id: 'SLA-012', origin: 'Bangalore', destination: 'Hyderabad', serviceType: 'FTL Standard', slaHours: 16, escalationThresholdHours: 19, alertThresholdHours: 14, active: false, createdAt: dago(155), updatedAt: dago(30) },
  { id: 'SLA-013', origin: 'Kolkata',   destination: 'Delhi',     serviceType: 'FTL Standard', slaHours: 42, escalationThresholdHours: 48, alertThresholdHours: 38, active: true,  createdAt: dago(150), updatedAt: dago(8) },
  { id: 'SLA-014', origin: 'Mumbai',    destination: 'Delhi',     serviceType: 'FTL Express',  slaHours: 26, escalationThresholdHours: 30, alertThresholdHours: 24, active: true,  createdAt: dago(145), updatedAt: dago(3) },
]

// ─── Helper ───────────────────────────────────────────────────────────────────

export function nextId(prefix: string, existing: { id: string }[]): string {
  const nums = existing.map(r => parseInt(r.id.split('-').pop() ?? '0', 10)).filter(n => !isNaN(n))
  const max  = nums.length > 0 ? Math.max(...nums) : 0
  return `${prefix}-${String(max + 1).padStart(3, '0')}`
}
