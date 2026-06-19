/**
 * TRANSPORT CONTROL TOWER — STEP 1: CORE DATA MODEL
 * =====================================================
 * Entity definitions, schemas, relationships, and seed data.
 * Storage: browser localStorage with prefix "tct_"
 * No UI. No APIs. Data layer only.
 */

'use strict';

/* ═══════════════════════════════════════════════════════
   STORAGE KEYS
═══════════════════════════════════════════════════════ */
const KEYS = {
  locations:      'tct_locations',
  carriers:       'tct_carriers',
  vehicles:       'tct_vehicles',
  routes:         'tct_routes',
  schedules:      'tct_schedules',
  slaConfig:      'tct_sla_config',
  exceptionCodes: 'tct_exception_codes',
  dispatches:     'tct_dispatches',
  exceptions:     'tct_exceptions',
  huRegistry:     'tct_hu_registry',
  auditLog:       'tct_audit_log',
  notifications:  'tct_notifications',
  users:          'tct_users',
};

/* ═══════════════════════════════════════════════════════
   ENTITY SCHEMAS (JSDoc-style definitions)
═══════════════════════════════════════════════════════

  ┌─────────────────────────────────────────────────────┐
  │  ENTITY RELATIONSHIP MAP                            │
  │                                                     │
  │  Location ──< Route >── Location                    │
  │  Route ──< Schedule                                 │
  │  Schedule ──< Dispatch                              │
  │  Carrier ──< Vehicle                                │
  │  Carrier ──< Dispatch                               │
  │  Vehicle ──< Dispatch                               │
  │  Dispatch ──< HU (handling units)                   │
  │  Dispatch ──< Exception                             │
  │  Dispatch ──< AuditLog                              │
  │  HU ──< CustodyTrail                                │
  │  ExceptionCode ──< Exception                        │
  │  SLAConfig ── Route                                 │
  └─────────────────────────────────────────────────────┘

*/

/* ───────────────────────────────────────────
   SCHEMA: Location
─────────────────────────────────────────── */
/**
 * @typedef {Object} Location
 * @property {string}  id          - Unique ID e.g. "LOC001"
 * @property {string}  code        - Short code e.g. "DEL-WH1"
 * @property {string}  name        - Full name
 * @property {string}  type        - "warehouse" | "dc" | "store" | "port"
 * @property {string}  city
 * @property {string}  state
 * @property {string}  pincode
 * @property {string}  address
 * @property {string}  contact     - Contact person name
 * @property {string}  phone
 * @property {string}  email
 * @property {boolean} active
 * @property {string}  createdAt   - ISO timestamp
 */

/* ───────────────────────────────────────────
   SCHEMA: Carrier
─────────────────────────────────────────── */
/**
 * @typedef {Object} Carrier
 * @property {string}  id
 * @property {string}  code          - e.g. "BDE"
 * @property {string}  name          - e.g. "Blue Dart Express"
 * @property {string}  type          - "express" | "ftl" | "ltl" | "3pl"
 * @property {number}  rating        - 1–5 star rating
 * @property {number}  otdRate       - On-time departure % (0–100)
 * @property {number}  otaRate       - On-time arrival % (0–100)
 * @property {number}  exceptionRate - % of dispatches with exceptions
 * @property {string}  contactName
 * @property {string}  contactPhone
 * @property {string}  contactEmail
 * @property {boolean} active
 * @property {string}  createdAt
 */

/* ───────────────────────────────────────────
   SCHEMA: Vehicle
─────────────────────────────────────────── */
/**
 * @typedef {Object} Vehicle
 * @property {string}  id
 * @property {string}  regNo         - e.g. "MH12AB1234"
 * @property {string}  type          - "20ft-truck" | "26ft-truck" | "32ft-truck" | "lcv" | "trailer"
 * @property {number}  capacityKg    - Weight capacity in KG
 * @property {number}  capacityCbm   - Volume capacity in CBM
 * @property {string}  carrierId     - FK → Carrier.id
 * @property {string}  driverName    - Default/current driver
 * @property {string}  driverPhone
 * @property {boolean} active
 * @property {string}  createdAt
 */

/* ───────────────────────────────────────────
   SCHEMA: Route
─────────────────────────────────────────── */
/**
 * @typedef {Object} Route
 * @property {string}   id
 * @property {string}   code          - e.g. "DEL-MUM"
 * @property {string}   name          - e.g. "Delhi → Mumbai"
 * @property {string}   originId      - FK → Location.id
 * @property {string}   destId        - FK → Location.id
 * @property {number}   distanceKm
 * @property {number}   transitDays   - Standard transit days
 * @property {number}   slaHours      - SLA delivery window in hours
 * @property {string}   frequency     - "daily" | "alternate" | "weekly" | "on-demand"
 * @property {string[]} preferredCarrierIds - FK[] → Carrier.id
 * @property {boolean}  active
 * @property {string}   createdAt
 */

/* ───────────────────────────────────────────
   SCHEMA: Schedule
─────────────────────────────────────────── */
/**
 * @typedef {Object} Schedule
 * @property {string}   id
 * @property {string}   routeId          - FK → Route.id
 * @property {number[]} daysOfWeek       - 0=Sun,1=Mon,...,6=Sat
 * @property {string}   plannedDeparture - "HH:MM" local time
 * @property {number}   transitHours     - expected transit hours
 * @property {number}   slaHours         - overrides route SLA if set
 * @property {number}   otdToleranceMin  - OTD tolerance in minutes (default 30)
 * @property {number}   otaToleranceMin  - OTA tolerance in minutes (default 60)
 * @property {boolean}  active
 * @property {string}   createdAt
 */

/* ───────────────────────────────────────────
   SCHEMA: SLA Config
─────────────────────────────────────────── */
/**
 * @typedef {Object} SLAConfig
 * @property {string}  id
 * @property {string}  routeId           - FK → Route.id (null = global default)
 * @property {number}  otdToleranceMin   - Minutes late allowed for OTD
 * @property {number}  otaToleranceMin   - Minutes late allowed for OTA
 * @property {number}  slaBreachAlertHrs - Alert X hours before SLA breach
 * @property {number}  reconciliationHrs - Hours to complete reconciliation after arrival
 * @property {string}  escalationL1Role  - "ops-manager"
 * @property {string}  escalationL2Role  - "regional-manager"
 * @property {string}  escalationL3Role  - "sc-head"
 * @property {number}  escalationL1Hrs   - Hours open before L1 escalation
 * @property {number}  escalationL2Hrs   - Hours open before L2 escalation
 * @property {number}  escalationL3Hrs   - Hours open before L3 escalation
 */

/* ───────────────────────────────────────────
   SCHEMA: Exception Code
─────────────────────────────────────────── */
/**
 * @typedef {Object} ExceptionCode
 * @property {string}  id
 * @property {string}  code            - e.g. "EX-DEL-001"
 * @property {string}  description     - Human readable
 * @property {string}  type            - "delay" | "shortage" | "damage" | "seal-mismatch" | "theft-risk" | "documentation"
 * @property {string}  defaultSeverity - "low" | "medium" | "high" | "critical"
 * @property {string}  defaultOwner    - "carrier" | "warehouse" | "store" | "ops"
 * @property {string}  autoTriggerOn   - rule string e.g. "actualDeparture > plannedDeparture + 30min"
 * @property {boolean} active
 */

/* ───────────────────────────────────────────
   SCHEMA: Dispatch (CORE ENTITY)
─────────────────────────────────────────── */
/**
 * @typedef {Object} Dispatch
 * @property {string}   id              - e.g. "DSP-2024-0001"
 * @property {string}   scheduleId      - FK → Schedule.id
 * @property {string}   routeId         - FK → Route.id
 * @property {string}   routeCode       - Denormalized
 * @property {string}   routeName       - Denormalized
 * @property {string}   originId        - FK → Location.id
 * @property {string}   destId          - FK → Location.id
 * @property {string}   carrierId       - FK → Carrier.id
 * @property {string}   vehicleId       - FK → Vehicle.id
 * @property {string}   vehicleReg      - Denormalized
 * @property {string}   driverName
 * @property {string}   driverPhone
 *
 * @property {string}   asn             - ASN number
 * @property {string}   invoice         - Invoice number
 * @property {string}   gatepass        - Gate pass number
 * @property {string}   sealNo          - Seal number applied at loading
 *
 * @property {string}   plannedDeparture  - ISO datetime
 * @property {string}   plannedArrival    - ISO datetime
 * @property {string}   actualDeparture   - ISO datetime | null
 * @property {string}   actualArrival     - ISO datetime | null
 * @property {number}   slaHours          - From schedule/route
 *
 * @property {string}   status
 *   Values: "planned" | "ready" | "dispatched" | "in-transit" |
 *           "arrived" | "unloading" | "reconciled" | "closed"
 *
 * @property {string}   otdStatus       - "on-time" | "delayed" | "early" | null
 * @property {string}   otaStatus       - "on-time" | "delayed" | "early" | null
 * @property {number}   otdVarianceMin  - Actual - Planned departure in minutes
 * @property {number}   otaVarianceMin  - Actual - Planned arrival in minutes
 *
 * @property {string[]} huDispatched    - HU barcodes loaded at origin
 * @property {string[]} huReceived      - HU barcodes scanned at destination
 * @property {string[]} huMissing       - Computed: dispatched - received
 * @property {string[]} huExcess        - Computed: received - dispatched
 *
 * @property {string}   reconciliationStatus - "pending" | "matched" | "discrepancy" | "closed"
 * @property {string}   reconciliationNote
 * @property {string}   reconciledAt
 * @property {string}   reconciledBy
 *
 * @property {Object}   receivingData   - Destination receiving checklist
 * @property {boolean}  receivingData.vehicleVerified
 * @property {boolean}  receivingData.sealVerified
 * @property {boolean}  receivingData.sealMatch       - false triggers exception
 * @property {string}   receivingData.sealReceived     - Seal number observed at dest
 * @property {boolean}  receivingData.invoiceVerified
 * @property {boolean}  receivingData.asnVerified
 * @property {string}   receivingData.receivedBy
 * @property {string}   receivingData.receivedAt
 * @property {string}   receivingData.notes
 *
 * @property {string[]} exceptionIds    - FK[] → Exception.id
 *
 * @property {CustodyEvent[]} custody   - Chain of custody log
 * @property {AuditEvent[]}   auditLog  - Audit trail
 *
 * @property {number}   totalWeightKg
 * @property {number}   totalCbm
 * @property {string}   notes
 * @property {string}   createdBy
 * @property {string}   createdAt
 * @property {string}   updatedAt
 */

/* ───────────────────────────────────────────
   SCHEMA: Custody Event
─────────────────────────────────────────── */
/**
 * @typedef {Object} CustodyEvent
 * @property {string} event     - "packed"|"loaded"|"in-transit"|"arrived"|"unloaded"|"received"|"closed"
 * @property {string} user      - User who performed action
 * @property {string} role      - User role
 * @property {string} locationId
 * @property {string} timestamp - ISO
 * @property {string} note
 * @property {string} deviceId  - Scanner/terminal ID
 */

/* ───────────────────────────────────────────
   SCHEMA: HU Registry
─────────────────────────────────────────── */
/**
 * @typedef {Object} HURecord
 * @property {string}         barcode       - Unique HU barcode
 * @property {string}         dispatchId    - Current/last dispatch
 * @property {string}         status        - "packed"|"loaded"|"in-transit"|"unloaded"|"received"|"closed"
 * @property {string}         description   - Item description
 * @property {number}         weightKg
 * @property {number}         cbm
 * @property {CustodyEvent[]} custody       - HU-level custody trail
 * @property {boolean}        tamperFlag    - true if seal mismatch detected
 * @property {string}         createdAt
 */

/* ───────────────────────────────────────────
   SCHEMA: Exception
─────────────────────────────────────────── */
/**
 * @typedef {Object} Exception
 * @property {string}  id
 * @property {string}  codeId          - FK → ExceptionCode.id
 * @property {string}  code            - Denormalized
 * @property {string}  dispatchId      - FK → Dispatch.id
 * @property {string}  routeId
 * @property {string}  type            - "delay"|"shortage"|"damage"|"seal-mismatch"|"theft-risk"|"documentation"
 * @property {string}  subType         - Finer classification
 * @property {string}  severity        - "low"|"medium"|"high"|"critical"
 * @property {string}  title
 * @property {string}  description
 * @property {string}  autoClassified  - "yes"|"no"
 * @property {string}  suggestedCause  - "carrier-delay"|"warehouse-delay"|"store-delay"|"force-majeure"
 * @property {number}  causeConfidence - 0–100 %
 * @property {string}  rootCause       - Confirmed root cause
 * @property {number}  slaImpactHrs    - Estimated SLA impact in hours
 * @property {string}  status          - "open"|"acknowledged"|"in-progress"|"escalated"|"resolved"|"closed"
 * @property {string}  owner           - "carrier"|"warehouse"|"store"|"ops"
 * @property {number}  escalationLevel - 0=none, 1=ops, 2=regional, 3=sc-head
 * @property {string}  raisedBy
 * @property {string}  raisedAt
 * @property {string}  acknowledgedBy
 * @property {string}  acknowledgedAt
 * @property {string}  resolvedBy
 * @property {string}  resolvedAt
 * @property {string}  resolution
 * @property {string[]} huAffected     - HU barcodes involved
 * @property {AuditEvent[]} auditLog
 */

/* ───────────────────────────────────────────
   SCHEMA: Audit Event
─────────────────────────────────────────── */
/**
 * @typedef {Object} AuditEvent
 * @property {string} id
 * @property {string} entityType   - "dispatch"|"exception"|"hu"|"route"|"carrier"
 * @property {string} entityId
 * @property {string} action       - e.g. "STATUS_CHANGED", "HU_SCANNED", "EXCEPTION_RAISED"
 * @property {string} user
 * @property {string} role
 * @property {any}    oldValue
 * @property {any}    newValue
 * @property {string} note
 * @property {string} timestamp    - ISO
 * @property {string} sessionId
 */

/* ═══════════════════════════════════════════════════════
   STORAGE LAYER
═══════════════════════════════════════════════════════ */

const DB = {
  get(key)      { try { return JSON.parse(localStorage.getItem(key) || 'null'); } catch(e) { return null; } },
  set(key, val) { localStorage.setItem(key, JSON.stringify(val)); },
  getOrInit(key, defaultVal) {
    const v = DB.get(key);
    if (v !== null) return v;
    DB.set(key, defaultVal);
    return defaultVal;
  },
};

/* ═══════════════════════════════════════════════════════
   SEED DATA
═══════════════════════════════════════════════════════ */

const SEED = {

  /* ── Locations ── */
  locations: [
    { id:'LOC001', code:'DEL-WH1', name:'Delhi Warehouse 1 (Okhla)', type:'warehouse',
      city:'New Delhi', state:'Delhi', pincode:'110020', address:'Plot 15, Okhla Industrial Area Phase II',
      contact:'Suresh Mehta', phone:'9811001100', email:'suresh@delwh1.com', active:true, createdAt:'2023-01-01T00:00:00Z' },
    { id:'LOC002', code:'MUM-WH1', name:'Mumbai Warehouse (Bhiwandi)', type:'warehouse',
      city:'Mumbai', state:'Maharashtra', pincode:'421302', address:'Shed 22, Bhiwandi Logistics Park',
      contact:'Priya Nair', phone:'9820002200', email:'priya@mumwh1.com', active:true, createdAt:'2023-01-01T00:00:00Z' },
    { id:'LOC003', code:'BLR-DC1', name:'Bangalore DC (Hosur Road)', type:'dc',
      city:'Bangalore', state:'Karnataka', pincode:'560100', address:'DC Hub, Bommasandra Industrial Area',
      contact:'Arjun Rao', phone:'9845003300', email:'arjun@blrdc1.com', active:true, createdAt:'2023-01-01T00:00:00Z' },
    { id:'LOC004', code:'HYD-WH1', name:'Hyderabad Warehouse (Patancheru)', type:'warehouse',
      city:'Hyderabad', state:'Telangana', pincode:'502319', address:'IDA Patancheru, Plot 45',
      contact:'Ravi Kumar', phone:'9701004400', email:'ravi@hydwh1.com', active:true, createdAt:'2023-01-01T00:00:00Z' },
    { id:'LOC005', code:'CHE-DC1', name:'Chennai DC (Ambattur)', type:'dc',
      city:'Chennai', state:'Tamil Nadu', pincode:'600053', address:'SIDCO Industrial Estate, Ambattur',
      contact:'Kavitha S', phone:'9841005500', email:'kavitha@chedc1.com', active:true, createdAt:'2023-01-01T00:00:00Z' },
    { id:'LOC006', code:'PUN-ST1', name:'Pune Store (FC Road)', type:'store',
      city:'Pune', state:'Maharashtra', pincode:'411004', address:'Shop 12, FC Road Retail Hub',
      contact:'Amit Joshi', phone:'9822006600', email:'amit@punst1.com', active:true, createdAt:'2023-01-01T00:00:00Z' },
    { id:'LOC007', code:'KOL-WH1', name:'Kolkata Warehouse (Dankuni)', type:'warehouse',
      city:'Kolkata', state:'West Bengal', pincode:'712311', address:'NH-2 Logistics Zone, Dankuni',
      contact:'Sanjoy Das', phone:'9831007700', email:'sanjoy@kolwh1.com', active:true, createdAt:'2023-01-01T00:00:00Z' },
    { id:'LOC008', code:'AHM-DC1', name:'Ahmedabad DC (Vatva)', type:'dc',
      city:'Ahmedabad', state:'Gujarat', pincode:'382445', address:'GIDC Vatva, Block C-12',
      contact:'Nikhil Shah', phone:'9824008800', email:'nikhil@ahmdc1.com', active:true, createdAt:'2023-01-01T00:00:00Z' },
  ],

  /* ── Carriers ── */
  carriers: [
    { id:'CAR001', code:'BDE', name:'Blue Dart Express', type:'express',
      rating:4.5, otdRate:91, otaRate:88, exceptionRate:4,
      contactName:'Deepak Verma', contactPhone:'9810101010', contactEmail:'ops@bluedart.com', active:true, createdAt:'2023-01-01T00:00:00Z' },
    { id:'CAR002', code:'GTI', name:'GATI Kintetsu', type:'ftl',
      rating:4.1, otdRate:85, otaRate:82, exceptionRate:7,
      contactName:'Sunil Kapoor', contactPhone:'9820202020', contactEmail:'ops@gati.com', active:true, createdAt:'2023-01-01T00:00:00Z' },
    { id:'CAR003', code:'MHL', name:'Mahindra Logistics', type:'3pl',
      rating:4.3, otdRate:87, otaRate:85, exceptionRate:5,
      contactName:'Anita Singh', contactPhone:'9830303030', contactEmail:'ops@mahindralogistics.com', active:true, createdAt:'2023-01-01T00:00:00Z' },
    { id:'CAR004', code:'TCE', name:'TCI Express', type:'ltl',
      rating:3.9, otdRate:80, otaRate:77, exceptionRate:10,
      contactName:'Rajendra Tiwari', contactPhone:'9840404040', contactEmail:'ops@tciexpress.com', active:true, createdAt:'2023-01-01T00:00:00Z' },
    { id:'CAR005', code:'EKT', name:'Ecom Express', type:'express',
      rating:4.0, otdRate:83, otaRate:80, exceptionRate:8,
      contactName:'Pooja Reddy', contactPhone:'9850505050', contactEmail:'ops@ecomexpress.com', active:true, createdAt:'2023-01-01T00:00:00Z' },
    { id:'CAR006', code:'SFL', name:'Safexpress', type:'ftl',
      rating:4.2, otdRate:86, otaRate:84, exceptionRate:6,
      contactName:'Mohan Pillai', contactPhone:'9860606060', contactEmail:'ops@safexpress.com', active:true, createdAt:'2023-01-01T00:00:00Z' },
  ],

  /* ── Vehicles ── */
  vehicles: [
    { id:'VEH001', regNo:'MH12AB1234', type:'26ft-truck', capacityKg:7000, capacityCbm:42, carrierId:'CAR001', driverName:'Ramesh Yadav',    driverPhone:'9811111111', active:true, createdAt:'2023-01-01T00:00:00Z' },
    { id:'VEH002', regNo:'DL10CD5678', type:'32ft-truck', capacityKg:10000, capacityCbm:62, carrierId:'CAR001', driverName:'Sunil Kumar',     driverPhone:'9822222222', active:true, createdAt:'2023-01-01T00:00:00Z' },
    { id:'VEH003', regNo:'KA03EF9012', type:'20ft-truck', capacityKg:5000, capacityCbm:30, carrierId:'CAR002', driverName:'Anil Singh',       driverPhone:'9833333333', active:true, createdAt:'2023-01-01T00:00:00Z' },
    { id:'VEH004', regNo:'TN22GH3456', type:'26ft-truck', capacityKg:7000, capacityCbm:42, carrierId:'CAR002', driverName:'Mohan Rao',        driverPhone:'9844444444', active:true, createdAt:'2023-01-01T00:00:00Z' },
    { id:'VEH005', regNo:'TS09IJ7890', type:'lcv',        capacityKg:2000, capacityCbm:12, carrierId:'CAR003', driverName:'Vijay Sharma',     driverPhone:'9855555555', active:true, createdAt:'2023-01-01T00:00:00Z' },
    { id:'VEH006', regNo:'GJ01KL2345', type:'trailer',    capacityKg:20000, capacityCbm:90, carrierId:'CAR003', driverName:'Rajan Patel',    driverPhone:'9866666666', active:true, createdAt:'2023-01-01T00:00:00Z' },
    { id:'VEH007', regNo:'WB15MN6789', type:'26ft-truck', capacityKg:7000, capacityCbm:42, carrierId:'CAR004', driverName:'Ashok Das',        driverPhone:'9877777777', active:true, createdAt:'2023-01-01T00:00:00Z' },
    { id:'VEH008', regNo:'MH04OP1234', type:'32ft-truck', capacityKg:10000, capacityCbm:62, carrierId:'CAR004', driverName:'Santosh Jadhav', driverPhone:'9888888888', active:true, createdAt:'2023-01-01T00:00:00Z' },
    { id:'VEH009', regNo:'DL14QR5678', type:'20ft-truck', capacityKg:5000, capacityCbm:30, carrierId:'CAR005', driverName:'Pradeep Gupta',   driverPhone:'9899999999', active:true, createdAt:'2023-01-01T00:00:00Z' },
    { id:'VEH010', regNo:'KA01ST9012', type:'lcv',        capacityKg:2000, capacityCbm:12, carrierId:'CAR005', driverName:'Kiran Nair',      driverPhone:'9800000000', active:true, createdAt:'2023-01-01T00:00:00Z' },
    { id:'VEH011', regNo:'AP31UV3456', type:'26ft-truck', capacityKg:7000, capacityCbm:42, carrierId:'CAR006', driverName:'Srinivas Reddy',  driverPhone:'9700100100', active:true, createdAt:'2023-01-01T00:00:00Z' },
    { id:'VEH012', regNo:'RJ14WX7890', type:'32ft-truck', capacityKg:10000, capacityCbm:62, carrierId:'CAR006', driverName:'Harish Chand',   driverPhone:'9700200200', active:true, createdAt:'2023-01-01T00:00:00Z' },
  ],

  /* ── Routes ── */
  routes: [
    { id:'R001', code:'DEL-MUM', name:'Delhi → Mumbai',
      originId:'LOC001', destId:'LOC002', distanceKm:1400, transitDays:2, slaHours:48,
      frequency:'daily', preferredCarrierIds:['CAR001','CAR003'], active:true, createdAt:'2023-01-01T00:00:00Z' },
    { id:'R002', code:'MUM-BLR', name:'Mumbai → Bangalore',
      originId:'LOC002', destId:'LOC003', distanceKm:980, transitDays:2, slaHours:40,
      frequency:'daily', preferredCarrierIds:['CAR001','CAR002'], active:true, createdAt:'2023-01-01T00:00:00Z' },
    { id:'R003', code:'DEL-HYD', name:'Delhi → Hyderabad',
      originId:'LOC001', destId:'LOC004', distanceKm:1500, transitDays:2, slaHours:52,
      frequency:'alternate', preferredCarrierIds:['CAR002','CAR006'], active:true, createdAt:'2023-01-01T00:00:00Z' },
    { id:'R004', code:'BLR-CHE', name:'Bangalore → Chennai',
      originId:'LOC003', destId:'LOC005', distanceKm:340, transitDays:1, slaHours:18,
      frequency:'daily', preferredCarrierIds:['CAR001','CAR005'], active:true, createdAt:'2023-01-01T00:00:00Z' },
    { id:'R005', code:'DEL-AHM', name:'Delhi → Ahmedabad',
      originId:'LOC001', destId:'LOC008', distanceKm:950, transitDays:2, slaHours:36,
      frequency:'alternate', preferredCarrierIds:['CAR003','CAR006'], active:true, createdAt:'2023-01-01T00:00:00Z' },
    { id:'R006', code:'KOL-DEL', name:'Kolkata → Delhi',
      originId:'LOC007', destId:'LOC001', distanceKm:1470, transitDays:2, slaHours:50,
      frequency:'weekly', preferredCarrierIds:['CAR004','CAR006'], active:true, createdAt:'2023-01-01T00:00:00Z' },
    { id:'R007', code:'MUM-HYD', name:'Mumbai → Hyderabad',
      originId:'LOC002', destId:'LOC004', distanceKm:710, transitDays:1, slaHours:30,
      frequency:'daily', preferredCarrierIds:['CAR002','CAR003'], active:true, createdAt:'2023-01-01T00:00:00Z' },
    { id:'R008', code:'BLR-HYD', name:'Bangalore → Hyderabad',
      originId:'LOC003', destId:'LOC004', distanceKm:570, transitDays:1, slaHours:24,
      frequency:'daily', preferredCarrierIds:['CAR001','CAR004'], active:false, createdAt:'2023-01-01T00:00:00Z' },
  ],

  /* ── Schedules ── */
  schedules: [
    { id:'SCH001', routeId:'R001', daysOfWeek:[1,2,3,4,5], plannedDeparture:'06:00',
      transitHours:44, slaHours:48, otdToleranceMin:30, otaToleranceMin:60, active:true, createdAt:'2023-01-01T00:00:00Z' },
    { id:'SCH002', routeId:'R001', daysOfWeek:[6,0], plannedDeparture:'08:00',
      transitHours:44, slaHours:52, otdToleranceMin:60, otaToleranceMin:120, active:true, createdAt:'2023-01-01T00:00:00Z' },
    { id:'SCH003', routeId:'R002', daysOfWeek:[1,2,3,4,5,6], plannedDeparture:'07:00',
      transitHours:36, slaHours:40, otdToleranceMin:30, otaToleranceMin:60, active:true, createdAt:'2023-01-01T00:00:00Z' },
    { id:'SCH004', routeId:'R003', daysOfWeek:[1,3,5], plannedDeparture:'05:00',
      transitHours:48, slaHours:52, otdToleranceMin:30, otaToleranceMin:60, active:true, createdAt:'2023-01-01T00:00:00Z' },
    { id:'SCH005', routeId:'R004', daysOfWeek:[1,2,3,4,5,6,0], plannedDeparture:'09:00',
      transitHours:14, slaHours:18, otdToleranceMin:20, otaToleranceMin:30, active:true, createdAt:'2023-01-01T00:00:00Z' },
    { id:'SCH006', routeId:'R005', daysOfWeek:[1,4], plannedDeparture:'06:00',
      transitHours:32, slaHours:36, otdToleranceMin:30, otaToleranceMin:60, active:true, createdAt:'2023-01-01T00:00:00Z' },
    { id:'SCH007', routeId:'R006', daysOfWeek:[2,5], plannedDeparture:'05:00',
      transitHours:46, slaHours:50, otdToleranceMin:60, otaToleranceMin:120, active:true, createdAt:'2023-01-01T00:00:00Z' },
    { id:'SCH008', routeId:'R007', daysOfWeek:[1,2,3,4,5,6], plannedDeparture:'08:00',
      transitHours:26, slaHours:30, otdToleranceMin:30, otaToleranceMin:60, active:true, createdAt:'2023-01-01T00:00:00Z' },
  ],

  /* ── SLA Config ── */
  slaConfig: [
    { id:'SLA001', routeId:null, otdToleranceMin:30, otaToleranceMin:60,
      slaBreachAlertHrs:4, reconciliationHrs:6,
      escalationL1Role:'ops-manager', escalationL2Role:'regional-manager', escalationL3Role:'sc-head',
      escalationL1Hrs:4, escalationL2Hrs:8, escalationL3Hrs:12 },
    { id:'SLA002', routeId:'R004', otdToleranceMin:20, otaToleranceMin:30,
      slaBreachAlertHrs:2, reconciliationHrs:4,
      escalationL1Role:'ops-manager', escalationL2Role:'regional-manager', escalationL3Role:'sc-head',
      escalationL1Hrs:2, escalationL2Hrs:4, escalationL3Hrs:8 },
  ],

  /* ── Exception Codes ── */
  exceptionCodes: [
    { id:'EC001', code:'EX-DEL-001', description:'Vehicle Departure Delayed > 30 min', type:'delay', subType:'carrier-delay',
      defaultSeverity:'medium', defaultOwner:'carrier', autoTriggerOn:'otdVarianceMin > 30', active:true },
    { id:'EC002', code:'EX-DEL-002', description:'Vehicle Departure Delayed > 4 Hours', type:'delay', subType:'carrier-delay',
      defaultSeverity:'high', defaultOwner:'carrier', autoTriggerOn:'otdVarianceMin > 240', active:true },
    { id:'EC003', code:'EX-ARR-001', description:'Vehicle Arrival Delayed > 1 Hour', type:'delay', subType:'transit-delay',
      defaultSeverity:'medium', defaultOwner:'carrier', autoTriggerOn:'otaVarianceMin > 60', active:true },
    { id:'EC004', code:'EX-ARR-002', description:'SLA Breach — Arrival Past Due', type:'delay', subType:'sla-breach',
      defaultSeverity:'critical', defaultOwner:'carrier', autoTriggerOn:'otaVarianceMin > slaHours*60', active:true },
    { id:'EC005', code:'EX-HU-001', description:'Short Delivery — HU Missing', type:'shortage', subType:'hu-shortage',
      defaultSeverity:'high', defaultOwner:'carrier', autoTriggerOn:'huMissing.length > 0', active:true },
    { id:'EC006', code:'EX-HU-002', description:'Excess HU Received — Not in Manifest', type:'shortage', subType:'hu-excess',
      defaultSeverity:'medium', defaultOwner:'warehouse', autoTriggerOn:'huExcess.length > 0', active:true },
    { id:'EC007', code:'EX-SEAL-001', description:'Seal Mismatch — Tamper Suspected', type:'seal-mismatch', subType:'tamper',
      defaultSeverity:'critical', defaultOwner:'carrier', autoTriggerOn:'sealVerified === false', active:true },
    { id:'EC008', code:'EX-DMG-001', description:'Damage Reported at Destination', type:'damage', subType:'physical-damage',
      defaultSeverity:'high', defaultOwner:'carrier', autoTriggerOn:'manual', active:true },
    { id:'EC009', code:'EX-THFT-001', description:'Theft Risk — Seal Tamper + HU Shortage', type:'theft-risk', subType:'combined',
      defaultSeverity:'critical', defaultOwner:'ops', autoTriggerOn:'sealVerified===false && huMissing.length > 0', active:true },
    { id:'EC010', code:'EX-DOC-001', description:'Invoice Mismatch', type:'documentation', subType:'invoice-error',
      defaultSeverity:'medium', defaultOwner:'warehouse', autoTriggerOn:'manual', active:true },
    { id:'EC011', code:'EX-DOC-002', description:'ASN Not Found in System', type:'documentation', subType:'asn-error',
      defaultSeverity:'low', defaultOwner:'warehouse', autoTriggerOn:'manual', active:true },
    { id:'EC012', code:'EX-VEH-001', description:'Vehicle Breakdown En Route', type:'delay', subType:'breakdown',
      defaultSeverity:'high', defaultOwner:'carrier', autoTriggerOn:'manual', active:true },
  ],

  /* ── Dispatches ── */
  dispatches: (() => {
    const now = new Date();
    const ago = (h) => new Date(now.getTime() - h * 3600000).toISOString();
    const fwd = (h) => new Date(now.getTime() + h * 3600000).toISOString();
    const hu  = (prefix, count, offset=0) => Array.from({length:count}, (_,i) => `HU${String(prefix*100+i+1+offset).padStart(7,'0')}`);

    return [
      /* ── PLANNED (3) ── */
      {
        id:'DSP-2024-0001', scheduleId:'SCH001', routeId:'R001', routeCode:'DEL-MUM',
        routeName:'Delhi → Mumbai', originId:'LOC001', destId:'LOC002',
        carrierId:'CAR001', vehicleId:'VEH001', vehicleReg:'MH12AB1234',
        driverName:'Ramesh Yadav', driverPhone:'9811111111',
        asn:'ASN-2024-1001', invoice:'INV-2024-2001', gatepass:'GP-0101', sealNo:'SL-99001',
        plannedDeparture:fwd(6), plannedArrival:fwd(50), actualDeparture:null, actualArrival:null,
        slaHours:48, status:'planned', otdStatus:null, otaStatus:null, otdVarianceMin:null, otaVarianceMin:null,
        huDispatched:hu(10,8), huReceived:[], huMissing:[], huExcess:[],
        reconciliationStatus:'pending', reconciliationNote:'', reconciledAt:null, reconciledBy:null,
        receivingData:null, exceptionIds:[], totalWeightKg:3200, totalCbm:18,
        custody:[{event:'planned',user:'System',role:'system',locationId:'LOC001',timestamp:ago(2),note:'Dispatch created from schedule SCH001',deviceId:'SYS'}],
        auditLog:[{id:'A001',entityType:'dispatch',entityId:'DSP-2024-0001',action:'DISPATCH_CREATED',user:'System',role:'system',oldValue:null,newValue:'planned',note:'Auto-created',timestamp:ago(2),sessionId:'SYS'}],
        notes:'Priority shipment — seasonal demand', createdBy:'System', createdAt:ago(2), updatedAt:ago(2),
      },
      {
        id:'DSP-2024-0002', scheduleId:'SCH003', routeId:'R002', routeCode:'MUM-BLR',
        routeName:'Mumbai → Bangalore', originId:'LOC002', destId:'LOC003',
        carrierId:'CAR002', vehicleId:'VEH003', vehicleReg:'KA03EF9012',
        driverName:'Anil Singh', driverPhone:'9833333333',
        asn:'ASN-2024-1002', invoice:'INV-2024-2002', gatepass:'GP-0102', sealNo:'SL-99002',
        plannedDeparture:fwd(4), plannedArrival:fwd(40), actualDeparture:null, actualArrival:null,
        slaHours:40, status:'planned', otdStatus:null, otaStatus:null, otdVarianceMin:null, otaVarianceMin:null,
        huDispatched:hu(11,6), huReceived:[], huMissing:[], huExcess:[],
        reconciliationStatus:'pending', reconciliationNote:'', reconciledAt:null, reconciledBy:null,
        receivingData:null, exceptionIds:[], totalWeightKg:2800, totalCbm:15,
        custody:[{event:'planned',user:'System',role:'system',locationId:'LOC002',timestamp:ago(1),note:'Dispatch planned',deviceId:'SYS'}],
        auditLog:[{id:'A002',entityType:'dispatch',entityId:'DSP-2024-0002',action:'DISPATCH_CREATED',user:'System',role:'system',oldValue:null,newValue:'planned',note:'',timestamp:ago(1),sessionId:'SYS'}],
        notes:'', createdBy:'System', createdAt:ago(1), updatedAt:ago(1),
      },
      {
        id:'DSP-2024-0003', scheduleId:'SCH004', routeId:'R003', routeCode:'DEL-HYD',
        routeName:'Delhi → Hyderabad', originId:'LOC001', destId:'LOC004',
        carrierId:'CAR006', vehicleId:'VEH011', vehicleReg:'AP31UV3456',
        driverName:'Srinivas Reddy', driverPhone:'9700100100',
        asn:'ASN-2024-1003', invoice:'INV-2024-2003', gatepass:'GP-0103', sealNo:'SL-99003',
        plannedDeparture:fwd(2), plannedArrival:fwd(50), actualDeparture:null, actualArrival:null,
        slaHours:52, status:'planned', otdStatus:null, otaStatus:null, otdVarianceMin:null, otaVarianceMin:null,
        huDispatched:hu(12,10), huReceived:[], huMissing:[], huExcess:[],
        reconciliationStatus:'pending', reconciliationNote:'', reconciledAt:null, reconciledBy:null,
        receivingData:null, exceptionIds:[], totalWeightKg:4100, totalCbm:22,
        custody:[{event:'planned',user:'Priya.Ops',role:'ops',locationId:'LOC001',timestamp:ago(3),note:'Manually planned',deviceId:'WEB-001'}],
        auditLog:[{id:'A003',entityType:'dispatch',entityId:'DSP-2024-0003',action:'DISPATCH_CREATED',user:'Priya.Ops',role:'ops',oldValue:null,newValue:'planned',note:'',timestamp:ago(3),sessionId:'S001'}],
        notes:'Fragile goods — handle with care', createdBy:'Priya.Ops', createdAt:ago(3), updatedAt:ago(3),
      },

      /* ── READY (3) ── */
      {
        id:'DSP-2024-0004', scheduleId:'SCH001', routeId:'R001', routeCode:'DEL-MUM',
        routeName:'Delhi → Mumbai', originId:'LOC001', destId:'LOC002',
        carrierId:'CAR001', vehicleId:'VEH002', vehicleReg:'DL10CD5678',
        driverName:'Sunil Kumar', driverPhone:'9822222222',
        asn:'ASN-2024-1004', invoice:'INV-2024-2004', gatepass:'GP-0104', sealNo:'SL-99004',
        plannedDeparture:fwd(1), plannedArrival:fwd(45), actualDeparture:null, actualArrival:null,
        slaHours:48, status:'ready', otdStatus:null, otaStatus:null, otdVarianceMin:null, otaVarianceMin:null,
        huDispatched:hu(20,12), huReceived:[], huMissing:[], huExcess:[],
        reconciliationStatus:'pending', reconciliationNote:'', reconciledAt:null, reconciledBy:null,
        receivingData:null, exceptionIds:[], totalWeightKg:5500, totalCbm:30,
        custody:[
          {event:'planned',user:'System',role:'system',locationId:'LOC001',timestamp:ago(5),note:'Created',deviceId:'SYS'},
          {event:'loaded',user:'Suresh.WH',role:'warehouse-op',locationId:'LOC001',timestamp:ago(1),note:'All HUs loaded and verified',deviceId:'WH-SCAN-01'},
        ],
        auditLog:[
          {id:'A004',entityType:'dispatch',entityId:'DSP-2024-0004',action:'DISPATCH_CREATED',user:'System',role:'system',oldValue:null,newValue:'planned',note:'',timestamp:ago(5),sessionId:'SYS'},
          {id:'A005',entityType:'dispatch',entityId:'DSP-2024-0004',action:'STATUS_CHANGED',user:'Suresh.WH',role:'warehouse-op',oldValue:'planned',newValue:'ready',note:'Vehicle loaded and ready',timestamp:ago(1),sessionId:'S002'},
        ],
        notes:'', createdBy:'System', createdAt:ago(5), updatedAt:ago(1),
      },
      {
        id:'DSP-2024-0005', scheduleId:'SCH005', routeId:'R004', routeCode:'BLR-CHE',
        routeName:'Bangalore → Chennai', originId:'LOC003', destId:'LOC005',
        carrierId:'CAR001', vehicleId:'VEH009', vehicleReg:'DL14QR5678',
        driverName:'Pradeep Gupta', driverPhone:'9899999999',
        asn:'ASN-2024-1005', invoice:'INV-2024-2005', gatepass:'GP-0105', sealNo:'SL-99005',
        plannedDeparture:fwd(0.5), plannedArrival:fwd(14.5), actualDeparture:null, actualArrival:null,
        slaHours:18, status:'ready', otdStatus:null, otaStatus:null, otdVarianceMin:null, otaVarianceMin:null,
        huDispatched:hu(30,5), huReceived:[], huMissing:[], huExcess:[],
        reconciliationStatus:'pending', reconciliationNote:'', reconciledAt:null, reconciledBy:null,
        receivingData:null, exceptionIds:[], totalWeightKg:1800, totalCbm:9,
        custody:[
          {event:'planned',user:'System',role:'system',locationId:'LOC003',timestamp:ago(6),note:'Created',deviceId:'SYS'},
          {event:'loaded',user:'Arjun.WH',role:'warehouse-op',locationId:'LOC003',timestamp:ago(0.5),note:'Loaded',deviceId:'WH-SCAN-02'},
        ],
        auditLog:[
          {id:'A006',entityType:'dispatch',entityId:'DSP-2024-0005',action:'DISPATCH_CREATED',user:'System',role:'system',oldValue:null,newValue:'planned',note:'',timestamp:ago(6),sessionId:'SYS'},
          {id:'A007',entityType:'dispatch',entityId:'DSP-2024-0005',action:'STATUS_CHANGED',user:'Arjun.WH',role:'warehouse-op',oldValue:'planned',newValue:'ready',note:'',timestamp:ago(0.5),sessionId:'S003'},
        ],
        notes:'', createdBy:'System', createdAt:ago(6), updatedAt:ago(0.5),
      },
      {
        id:'DSP-2024-0006', scheduleId:'SCH006', routeId:'R005', routeCode:'DEL-AHM',
        routeName:'Delhi → Ahmedabad', originId:'LOC001', destId:'LOC008',
        carrierId:'CAR003', vehicleId:'VEH005', vehicleReg:'TS09IJ7890',
        driverName:'Vijay Sharma', driverPhone:'9855555555',
        asn:'ASN-2024-1006', invoice:'INV-2024-2006', gatepass:'GP-0106', sealNo:'SL-99006',
        plannedDeparture:fwd(0.25), plannedArrival:fwd(32.25), actualDeparture:null, actualArrival:null,
        slaHours:36, status:'ready', otdStatus:null, otaStatus:null, otdVarianceMin:null, otaVarianceMin:null,
        huDispatched:hu(40,7), huReceived:[], huMissing:[], huExcess:[],
        reconciliationStatus:'pending', reconciliationNote:'', reconciledAt:null, reconciledBy:null,
        receivingData:null, exceptionIds:[], totalWeightKg:2100, totalCbm:11,
        custody:[
          {event:'planned',user:'System',role:'system',locationId:'LOC001',timestamp:ago(4),note:'Created',deviceId:'SYS'},
          {event:'loaded',user:'Mohan.WH',role:'warehouse-op',locationId:'LOC001',timestamp:ago(0.25),note:'',deviceId:'WH-SCAN-01'},
        ],
        auditLog:[{id:'A008',entityType:'dispatch',entityId:'DSP-2024-0006',action:'DISPATCH_CREATED',user:'System',role:'system',oldValue:null,newValue:'planned',note:'',timestamp:ago(4),sessionId:'SYS'}],
        notes:'', createdBy:'System', createdAt:ago(4), updatedAt:ago(0.25),
      },

      /* ── DISPATCHED / IN-TRANSIT (5) ── */
      {
        id:'DSP-2024-0007', scheduleId:'SCH001', routeId:'R001', routeCode:'DEL-MUM',
        routeName:'Delhi → Mumbai', originId:'LOC001', destId:'LOC002',
        carrierId:'CAR001', vehicleId:'VEH001', vehicleReg:'MH12AB1234',
        driverName:'Ramesh Yadav', driverPhone:'9811111111',
        asn:'ASN-2024-0907', invoice:'INV-2024-1807', gatepass:'GP-0007', sealNo:'SL-88007',
        plannedDeparture:ago(8), plannedArrival:fwd(36), actualDeparture:ago(7.5), actualArrival:null,
        slaHours:48, status:'in-transit', otdStatus:'on-time', otaStatus:null, otdVarianceMin:30, otaVarianceMin:null,
        huDispatched:hu(50,10), huReceived:[], huMissing:[], huExcess:[],
        reconciliationStatus:'pending', reconciliationNote:'', reconciledAt:null, reconciledBy:null,
        receivingData:null, exceptionIds:[], totalWeightKg:4200, totalCbm:24,
        custody:[
          {event:'planned',user:'System',role:'system',locationId:'LOC001',timestamp:ago(14),note:'Created',deviceId:'SYS'},
          {event:'loaded',user:'Suresh.WH',role:'warehouse-op',locationId:'LOC001',timestamp:ago(9),note:'',deviceId:'WH-SCAN-01'},
          {event:'in-transit',user:'Suresh.WH',role:'warehouse-op',locationId:'LOC001',timestamp:ago(7.5),note:'Departed gate',deviceId:'WH-SCAN-01'},
        ],
        auditLog:[
          {id:'A010',entityType:'dispatch',entityId:'DSP-2024-0007',action:'STATUS_CHANGED',user:'Suresh.WH',role:'warehouse-op',oldValue:'ready',newValue:'dispatched',note:'',timestamp:ago(8),sessionId:'S004'},
          {id:'A011',entityType:'dispatch',entityId:'DSP-2024-0007',action:'STATUS_CHANGED',user:'Suresh.WH',role:'warehouse-op',oldValue:'dispatched',newValue:'in-transit',note:'GPS tracking started',timestamp:ago(7.5),sessionId:'S004'},
        ],
        notes:'', createdBy:'System', createdAt:ago(14), updatedAt:ago(7.5),
      },
      {
        id:'DSP-2024-0008', scheduleId:'SCH003', routeId:'R002', routeCode:'MUM-BLR',
        routeName:'Mumbai → Bangalore', originId:'LOC002', destId:'LOC003',
        carrierId:'CAR002', vehicleId:'VEH004', vehicleReg:'TN22GH3456',
        driverName:'Mohan Rao', driverPhone:'9844444444',
        asn:'ASN-2024-0908', invoice:'INV-2024-1808', gatepass:'GP-0008', sealNo:'SL-88008',
        plannedDeparture:ago(10), plannedArrival:fwd(26), actualDeparture:ago(9), actualArrival:null,
        slaHours:40, status:'in-transit', otdStatus:'on-time', otaStatus:null, otdVarianceMin:-60, otaVarianceMin:null,
        huDispatched:hu(60,8), huReceived:[], huMissing:[], huExcess:[],
        reconciliationStatus:'pending', reconciliationNote:'', reconciledAt:null, reconciledBy:null,
        receivingData:null, exceptionIds:['EXC008'], totalWeightKg:3800, totalCbm:20,
        custody:[
          {event:'planned',user:'System',role:'system',locationId:'LOC002',timestamp:ago(16),note:'',deviceId:'SYS'},
          {event:'in-transit',user:'Priya.WH',role:'warehouse-op',locationId:'LOC002',timestamp:ago(9),note:'',deviceId:'WH-SCAN-03'},
        ],
        auditLog:[{id:'A012',entityType:'dispatch',entityId:'DSP-2024-0008',action:'STATUS_CHANGED',user:'Priya.WH',role:'warehouse-op',oldValue:'ready',newValue:'in-transit',note:'',timestamp:ago(9),sessionId:'S005'}],
        notes:'', createdBy:'System', createdAt:ago(16), updatedAt:ago(9),
      },
      {
        id:'DSP-2024-0009', scheduleId:'SCH004', routeId:'R003', routeCode:'DEL-HYD',
        routeName:'Delhi → Hyderabad', originId:'LOC001', destId:'LOC004',
        carrierId:'CAR006', vehicleId:'VEH012', vehicleReg:'RJ14WX7890',
        driverName:'Harish Chand', driverPhone:'9700200200',
        asn:'ASN-2024-0909', invoice:'INV-2024-1809', gatepass:'GP-0009', sealNo:'SL-88009',
        plannedDeparture:ago(20), plannedArrival:fwd(28), actualDeparture:ago(16), actualArrival:null,
        slaHours:52, status:'in-transit', otdStatus:'delayed', otaStatus:null, otdVarianceMin:240, otaVarianceMin:null,
        huDispatched:hu(70,12), huReceived:[], huMissing:[], huExcess:[],
        reconciliationStatus:'pending', reconciliationNote:'', reconciledAt:null, reconciledBy:null,
        receivingData:null, exceptionIds:['EXC001','EXC002'], totalWeightKg:5200, totalCbm:28,
        custody:[
          {event:'planned',user:'System',role:'system',locationId:'LOC001',timestamp:ago(26),note:'',deviceId:'SYS'},
          {event:'in-transit',user:'Mohan.WH',role:'warehouse-op',locationId:'LOC001',timestamp:ago(16),note:'Delayed departure — traffic',deviceId:'WH-SCAN-01'},
        ],
        auditLog:[
          {id:'A013',entityType:'dispatch',entityId:'DSP-2024-0009',action:'STATUS_CHANGED',user:'Mohan.WH',role:'warehouse-op',oldValue:'ready',newValue:'in-transit',note:'Departure delayed 4hrs',timestamp:ago(16),sessionId:'S006'},
          {id:'A014',entityType:'dispatch',entityId:'DSP-2024-0009',action:'EXCEPTION_RAISED',user:'System',role:'system',oldValue:null,newValue:'EXC001',note:'Auto-raised: delay > 4hrs',timestamp:ago(16),sessionId:'SYS'},
        ],
        notes:'Departure delayed due to traffic at origin gate', createdBy:'System', createdAt:ago(26), updatedAt:ago(16),
      },
      {
        id:'DSP-2024-0010', scheduleId:'SCH005', routeId:'R004', routeCode:'BLR-CHE',
        routeName:'Bangalore → Chennai', originId:'LOC003', destId:'LOC005',
        carrierId:'CAR001', vehicleId:'VEH010', vehicleReg:'KA01ST9012',
        driverName:'Kiran Nair', driverPhone:'9800000000',
        asn:'ASN-2024-0910', invoice:'INV-2024-1810', gatepass:'GP-0010', sealNo:'SL-88010',
        plannedDeparture:ago(16), plannedArrival:fwd(2), actualDeparture:ago(15.5), actualArrival:null,
        slaHours:18, status:'in-transit', otdStatus:'on-time', otaStatus:null, otdVarianceMin:30, otaVarianceMin:null,
        huDispatched:hu(80,7), huReceived:[], huMissing:[], huExcess:[],
        reconciliationStatus:'pending', reconciliationNote:'', reconciledAt:null, reconciledBy:null,
        receivingData:null, exceptionIds:[], totalWeightKg:2400, totalCbm:13,
        custody:[
          {event:'planned',user:'System',role:'system',locationId:'LOC003',timestamp:ago(18),note:'',deviceId:'SYS'},
          {event:'in-transit',user:'Arjun.WH',role:'warehouse-op',locationId:'LOC003',timestamp:ago(15.5),note:'',deviceId:'WH-SCAN-02'},
        ],
        auditLog:[{id:'A015',entityType:'dispatch',entityId:'DSP-2024-0010',action:'STATUS_CHANGED',user:'Arjun.WH',role:'warehouse-op',oldValue:'ready',newValue:'in-transit',note:'',timestamp:ago(15.5),sessionId:'S007'}],
        notes:'', createdBy:'System', createdAt:ago(18), updatedAt:ago(15.5),
      },
      {
        id:'DSP-2024-0011', scheduleId:'SCH008', routeId:'R007', routeCode:'MUM-HYD',
        routeName:'Mumbai → Hyderabad', originId:'LOC002', destId:'LOC004',
        carrierId:'CAR003', vehicleId:'VEH006', vehicleReg:'GJ01KL2345',
        driverName:'Rajan Patel', driverPhone:'9866666666',
        asn:'ASN-2024-0911', invoice:'INV-2024-1811', gatepass:'GP-0011', sealNo:'SL-88011',
        plannedDeparture:ago(30), plannedArrival:ago(4), actualDeparture:ago(29), actualArrival:null,
        slaHours:30, status:'in-transit', otdStatus:'on-time', otaStatus:'delayed', otdVarianceMin:-60, otaVarianceMin:180,
        huDispatched:hu(90,9), huReceived:[], huMissing:[], huExcess:[],
        reconciliationStatus:'pending', reconciliationNote:'', reconciledAt:null, reconciledBy:null,
        receivingData:null, exceptionIds:['EXC003'], totalWeightKg:3900, totalCbm:21,
        custody:[
          {event:'planned',user:'System',role:'system',locationId:'LOC002',timestamp:ago(36),note:'',deviceId:'SYS'},
          {event:'in-transit',user:'Priya.WH',role:'warehouse-op',locationId:'LOC002',timestamp:ago(29),note:'',deviceId:'WH-SCAN-03'},
        ],
        auditLog:[{id:'A016',entityType:'dispatch',entityId:'DSP-2024-0011',action:'STATUS_CHANGED',user:'Priya.WH',role:'warehouse-op',oldValue:'ready',newValue:'in-transit',note:'',timestamp:ago(29),sessionId:'S008'}],
        notes:'OTA breach risk — running late', createdBy:'System', createdAt:ago(36), updatedAt:ago(29),
      },

      /* ── ARRIVED (3) ── */
      {
        id:'DSP-2024-0012', scheduleId:'SCH001', routeId:'R001', routeCode:'DEL-MUM',
        routeName:'Delhi → Mumbai', originId:'LOC001', destId:'LOC002',
        carrierId:'CAR001', vehicleId:'VEH001', vehicleReg:'MH12AB1234',
        driverName:'Ramesh Yadav', driverPhone:'9811111111',
        asn:'ASN-2024-0812', invoice:'INV-2024-1612', gatepass:'GP-0012', sealNo:'SL-77012',
        plannedDeparture:ago(52), plannedArrival:ago(8), actualDeparture:ago(51), actualArrival:ago(7),
        slaHours:48, status:'arrived', otdStatus:'on-time', otaStatus:'on-time', otdVarianceMin:-60, otaVarianceMin:-60,
        huDispatched:hu(100,10), huReceived:[], huMissing:[], huExcess:[],
        reconciliationStatus:'pending', reconciliationNote:'', reconciledAt:null, reconciledBy:null,
        receivingData:null, exceptionIds:[], totalWeightKg:4500, totalCbm:25,
        custody:[
          {event:'planned',user:'System',role:'system',locationId:'LOC001',timestamp:ago(58),note:'',deviceId:'SYS'},
          {event:'in-transit',user:'Suresh.WH',role:'warehouse-op',locationId:'LOC001',timestamp:ago(51),note:'',deviceId:'WH-SCAN-01'},
          {event:'arrived',user:'Priya.WH',role:'warehouse-op',locationId:'LOC002',timestamp:ago(7),note:'Vehicle arrived at destination gate',deviceId:'WH-SCAN-04'},
        ],
        auditLog:[{id:'A017',entityType:'dispatch',entityId:'DSP-2024-0012',action:'STATUS_CHANGED',user:'Priya.WH',role:'warehouse-op',oldValue:'in-transit',newValue:'arrived',note:'',timestamp:ago(7),sessionId:'S009'}],
        notes:'', createdBy:'System', createdAt:ago(58), updatedAt:ago(7),
      },
      {
        id:'DSP-2024-0013', scheduleId:'SCH003', routeId:'R002', routeCode:'MUM-BLR',
        routeName:'Mumbai → Bangalore', originId:'LOC002', destId:'LOC003',
        carrierId:'CAR002', vehicleId:'VEH003', vehicleReg:'KA03EF9012',
        driverName:'Anil Singh', driverPhone:'9833333333',
        asn:'ASN-2024-0813', invoice:'INV-2024-1613', gatepass:'GP-0013', sealNo:'SL-77013',
        plannedDeparture:ago(44), plannedArrival:ago(8), actualDeparture:ago(42), actualArrival:ago(6),
        slaHours:40, status:'arrived', otdStatus:'on-time', otaStatus:'on-time', otdVarianceMin:-120, otaVarianceMin:-120,
        huDispatched:hu(110,8), huReceived:[], huMissing:[], huExcess:[],
        reconciliationStatus:'pending', reconciliationNote:'', reconciledAt:null, reconciledBy:null,
        receivingData:null, exceptionIds:[], totalWeightKg:3200, totalCbm:17,
        custody:[
          {event:'planned',user:'System',role:'system',locationId:'LOC002',timestamp:ago(50),note:'',deviceId:'SYS'},
          {event:'arrived',user:'Arjun.WH',role:'warehouse-op',locationId:'LOC003',timestamp:ago(6),note:'',deviceId:'WH-SCAN-05'},
        ],
        auditLog:[{id:'A018',entityType:'dispatch',entityId:'DSP-2024-0013',action:'STATUS_CHANGED',user:'Arjun.WH',role:'warehouse-op',oldValue:'in-transit',newValue:'arrived',note:'',timestamp:ago(6),sessionId:'S010'}],
        notes:'', createdBy:'System', createdAt:ago(50), updatedAt:ago(6),
      },
      {
        id:'DSP-2024-0014', scheduleId:'SCH007', routeId:'R006', routeCode:'KOL-DEL',
        routeName:'Kolkata → Delhi', originId:'LOC007', destId:'LOC001',
        carrierId:'CAR004', vehicleId:'VEH007', vehicleReg:'WB15MN6789',
        driverName:'Ashok Das', driverPhone:'9877777777',
        asn:'ASN-2024-0814', invoice:'INV-2024-1614', gatepass:'GP-0014', sealNo:'SL-77014',
        plannedDeparture:ago(54), plannedArrival:ago(8), actualDeparture:ago(50), actualArrival:ago(5),
        slaHours:50, status:'arrived', otdStatus:'delayed', otaStatus:'on-time', otdVarianceMin:240, otaVarianceMin:-180,
        huDispatched:hu(120,11), huReceived:[], huMissing:[], huExcess:[],
        reconciliationStatus:'pending', reconciliationNote:'', reconciledAt:null, reconciledBy:null,
        receivingData:null, exceptionIds:['EXC004'], totalWeightKg:4800, totalCbm:26,
        custody:[
          {event:'planned',user:'System',role:'system',locationId:'LOC007',timestamp:ago(60),note:'',deviceId:'SYS'},
          {event:'arrived',user:'Ravi.WH',role:'warehouse-op',locationId:'LOC001',timestamp:ago(5),note:'Arrived with delay at origin but recovered transit',deviceId:'WH-SCAN-06'},
        ],
        auditLog:[{id:'A019',entityType:'dispatch',entityId:'DSP-2024-0014',action:'STATUS_CHANGED',user:'Ravi.WH',role:'warehouse-op',oldValue:'in-transit',newValue:'arrived',note:'',timestamp:ago(5),sessionId:'S011'}],
        notes:'Departure delayed but recovered in transit', createdBy:'System', createdAt:ago(60), updatedAt:ago(5),
      },

      /* ── UNLOADING (3) ── */
      {
        id:'DSP-2024-0015', scheduleId:'SCH005', routeId:'R004', routeCode:'BLR-CHE',
        routeName:'Bangalore → Chennai', originId:'LOC003', destId:'LOC005',
        carrierId:'CAR001', vehicleId:'VEH009', vehicleReg:'DL14QR5678',
        driverName:'Pradeep Gupta', driverPhone:'9899999999',
        asn:'ASN-2024-0715', invoice:'INV-2024-1415', gatepass:'GP-0015', sealNo:'SL-66015',
        plannedDeparture:ago(20), plannedArrival:ago(6), actualDeparture:ago(19.5), actualArrival:ago(5),
        slaHours:18, status:'unloading', otdStatus:'on-time', otaStatus:'on-time', otdVarianceMin:30, otaVarianceMin:-60,
        huDispatched:hu(130,6), huReceived:[], huMissing:[], huExcess:[],
        reconciliationStatus:'pending', reconciliationNote:'', reconciledAt:null, reconciledBy:null,
        receivingData:{vehicleVerified:true,sealVerified:true,sealMatch:true,sealReceived:'SL-66015',invoiceVerified:true,asnVerified:true,receivedBy:'Kavitha.DC',receivedAt:ago(4),notes:''},
        exceptionIds:[], totalWeightKg:2200, totalCbm:11,
        custody:[
          {event:'arrived',user:'Kavitha.DC',role:'warehouse-op',locationId:'LOC005',timestamp:ago(5),note:'',deviceId:'WH-SCAN-07'},
          {event:'unloaded',user:'Kavitha.DC',role:'warehouse-op',locationId:'LOC005',timestamp:ago(4),note:'Unloading started',deviceId:'WH-SCAN-07'},
        ],
        auditLog:[{id:'A020',entityType:'dispatch',entityId:'DSP-2024-0015',action:'STATUS_CHANGED',user:'Kavitha.DC',role:'warehouse-op',oldValue:'arrived',newValue:'unloading',note:'Receiving checks passed',timestamp:ago(4),sessionId:'S012'}],
        notes:'', createdBy:'System', createdAt:ago(24), updatedAt:ago(4),
      },
      {
        id:'DSP-2024-0016', scheduleId:'SCH008', routeId:'R007', routeCode:'MUM-HYD',
        routeName:'Mumbai → Hyderabad', originId:'LOC002', destId:'LOC004',
        carrierId:'CAR003', vehicleId:'VEH005', vehicleReg:'TS09IJ7890',
        driverName:'Vijay Sharma', driverPhone:'9855555555',
        asn:'ASN-2024-0716', invoice:'INV-2024-1416', gatepass:'GP-0016', sealNo:'SL-66016',
        plannedDeparture:ago(34), plannedArrival:ago(8), actualDeparture:ago(33), actualArrival:ago(6),
        slaHours:30, status:'unloading', otdStatus:'on-time', otaStatus:'on-time', otdVarianceMin:-60, otaVarianceMin:-120,
        huDispatched:hu(140,9), huReceived:[], huMissing:[], huExcess:[],
        reconciliationStatus:'pending', reconciliationNote:'', reconciledAt:null, reconciledBy:null,
        receivingData:{vehicleVerified:true,sealVerified:false,sealMatch:false,sealReceived:'SL-XXXX',invoiceVerified:true,asnVerified:true,receivedBy:'Ravi.DC',receivedAt:ago(5),notes:'Seal number does not match manifest'},
        exceptionIds:['EXC005'], totalWeightKg:3500, totalCbm:18,
        custody:[
          {event:'arrived',user:'Ravi.DC',role:'warehouse-op',locationId:'LOC004',timestamp:ago(6),note:'',deviceId:'WH-SCAN-08'},
          {event:'unloaded',user:'Ravi.DC',role:'warehouse-op',locationId:'LOC004',timestamp:ago(5),note:'SEAL MISMATCH DETECTED',deviceId:'WH-SCAN-08'},
        ],
        auditLog:[
          {id:'A021',entityType:'dispatch',entityId:'DSP-2024-0016',action:'STATUS_CHANGED',user:'Ravi.DC',role:'warehouse-op',oldValue:'arrived',newValue:'unloading',note:'',timestamp:ago(5),sessionId:'S013'},
          {id:'A022',entityType:'dispatch',entityId:'DSP-2024-0016',action:'EXCEPTION_RAISED',user:'System',role:'system',oldValue:null,newValue:'EXC005',note:'Auto: seal mismatch detected',timestamp:ago(5),sessionId:'SYS'},
        ],
        notes:'⚠ SEAL MISMATCH — Critical exception raised', createdBy:'System', createdAt:ago(38), updatedAt:ago(5),
      },
      {
        id:'DSP-2024-0017', scheduleId:'SCH006', routeId:'R005', routeCode:'DEL-AHM',
        routeName:'Delhi → Ahmedabad', originId:'LOC001', destId:'LOC008',
        carrierId:'CAR006', vehicleId:'VEH012', vehicleReg:'RJ14WX7890',
        driverName:'Harish Chand', driverPhone:'9700200200',
        asn:'ASN-2024-0717', invoice:'INV-2024-1417', gatepass:'GP-0017', sealNo:'SL-66017',
        plannedDeparture:ago(40), plannedArrival:ago(8), actualDeparture:ago(39), actualArrival:ago(7),
        slaHours:36, status:'unloading', otdStatus:'on-time', otaStatus:'on-time', otdVarianceMin:-60, otaVarianceMin:-60,
        huDispatched:hu(150,8), huReceived:[], huMissing:[], huExcess:[],
        reconciliationStatus:'pending', reconciliationNote:'', reconciledAt:null, reconciledBy:null,
        receivingData:{vehicleVerified:true,sealVerified:true,sealMatch:true,sealReceived:'SL-66017',invoiceVerified:true,asnVerified:true,receivedBy:'Nikhil.DC',receivedAt:ago(6),notes:''},
        exceptionIds:[], totalWeightKg:3100, totalCbm:16,
        custody:[
          {event:'arrived',user:'Nikhil.DC',role:'warehouse-op',locationId:'LOC008',timestamp:ago(7),note:'',deviceId:'WH-SCAN-09'},
          {event:'unloaded',user:'Nikhil.DC',role:'warehouse-op',locationId:'LOC008',timestamp:ago(6),note:'',deviceId:'WH-SCAN-09'},
        ],
        auditLog:[{id:'A023',entityType:'dispatch',entityId:'DSP-2024-0017',action:'STATUS_CHANGED',user:'Nikhil.DC',role:'warehouse-op',oldValue:'arrived',newValue:'unloading',note:'',timestamp:ago(6),sessionId:'S014'}],
        notes:'', createdBy:'System', createdAt:ago(44), updatedAt:ago(6),
      },

      /* ── RECONCILED (3) ── */
      {
        id:'DSP-2024-0018', scheduleId:'SCH001', routeId:'R001', routeCode:'DEL-MUM',
        routeName:'Delhi → Mumbai', originId:'LOC001', destId:'LOC002',
        carrierId:'CAR001', vehicleId:'VEH002', vehicleReg:'DL10CD5678',
        driverName:'Sunil Kumar', driverPhone:'9822222222',
        asn:'ASN-2024-0618', invoice:'INV-2024-1218', gatepass:'GP-0018', sealNo:'SL-55018',
        plannedDeparture:ago(72), plannedArrival:ago(24), actualDeparture:ago(71), actualArrival:ago(23),
        slaHours:48, status:'reconciled', otdStatus:'on-time', otaStatus:'on-time', otdVarianceMin:-60, otaVarianceMin:-60,
        huDispatched:hu(160,10), huReceived:hu(160,10), huMissing:[], huExcess:[],
        reconciliationStatus:'matched', reconciliationNote:'All 10 HUs matched', reconciledAt:ago(20), reconciledBy:'Priya.WH',
        receivingData:{vehicleVerified:true,sealVerified:true,sealMatch:true,sealReceived:'SL-55018',invoiceVerified:true,asnVerified:true,receivedBy:'Priya.WH',receivedAt:ago(22),notes:''},
        exceptionIds:[], totalWeightKg:4300, totalCbm:23,
        custody:[
          {event:'received',user:'Priya.WH',role:'warehouse-op',locationId:'LOC002',timestamp:ago(20),note:'All HUs reconciled successfully',deviceId:'WH-SCAN-04'},
        ],
        auditLog:[{id:'A024',entityType:'dispatch',entityId:'DSP-2024-0018',action:'RECONCILIATION_COMPLETE',user:'Priya.WH',role:'warehouse-op',oldValue:'unloading',newValue:'reconciled',note:'10/10 HUs matched',timestamp:ago(20),sessionId:'S015'}],
        notes:'', createdBy:'System', createdAt:ago(78), updatedAt:ago(20),
      },
      {
        id:'DSP-2024-0019', scheduleId:'SCH003', routeId:'R002', routeCode:'MUM-BLR',
        routeName:'Mumbai → Bangalore', originId:'LOC002', destId:'LOC003',
        carrierId:'CAR002', vehicleId:'VEH003', vehicleReg:'KA03EF9012',
        driverName:'Anil Singh', driverPhone:'9833333333',
        asn:'ASN-2024-0619', invoice:'INV-2024-1219', gatepass:'GP-0019', sealNo:'SL-55019',
        plannedDeparture:ago(70), plannedArrival:ago(34), actualDeparture:ago(70), actualArrival:ago(32),
        slaHours:40, status:'reconciled', otdStatus:'on-time', otaStatus:'on-time', otdVarianceMin:0, otaVarianceMin:-120,
        huDispatched:hu(170,8), huReceived:hu(170,7), huMissing:[`HU${String(170*100+8).padStart(7,'0')}`], huExcess:[],
        reconciliationStatus:'discrepancy', reconciliationNote:'1 HU short-delivered', reconciledAt:ago(30), reconciledBy:'Arjun.WH',
        receivingData:{vehicleVerified:true,sealVerified:true,sealMatch:true,sealReceived:'SL-55019',invoiceVerified:true,asnVerified:true,receivedBy:'Arjun.WH',receivedAt:ago(31),notes:''},
        exceptionIds:['EXC006'], totalWeightKg:3400, totalCbm:18,
        custody:[
          {event:'received',user:'Arjun.WH',role:'warehouse-op',locationId:'LOC003',timestamp:ago(30),note:'7/8 HUs received — 1 missing',deviceId:'WH-SCAN-05'},
        ],
        auditLog:[{id:'A025',entityType:'dispatch',entityId:'DSP-2024-0019',action:'RECONCILIATION_DISCREPANCY',user:'Arjun.WH',role:'warehouse-op',oldValue:'unloading',newValue:'reconciled',note:'1 HU missing',timestamp:ago(30),sessionId:'S016'}],
        notes:'1 HU not received — exception raised', createdBy:'System', createdAt:ago(76), updatedAt:ago(30),
      },
      {
        id:'DSP-2024-0020', scheduleId:'SCH004', routeId:'R003', routeCode:'DEL-HYD',
        routeName:'Delhi → Hyderabad', originId:'LOC001', destId:'LOC004',
        carrierId:'CAR006', vehicleId:'VEH011', vehicleReg:'AP31UV3456',
        driverName:'Srinivas Reddy', driverPhone:'9700100100',
        asn:'ASN-2024-0620', invoice:'INV-2024-1220', gatepass:'GP-0020', sealNo:'SL-55020',
        plannedDeparture:ago(76), plannedArrival:ago(24), actualDeparture:ago(74), actualArrival:ago(22),
        slaHours:52, status:'reconciled', otdStatus:'delayed', otaStatus:'on-time', otdVarianceMin:120, otaVarianceMin:-120,
        huDispatched:hu(180,12), huReceived:hu(180,14), huMissing:[], huExcess:[`HU${String(180*100+13).padStart(7,'0')}`,`HU${String(180*100+14).padStart(7,'0')}`],
        reconciliationStatus:'discrepancy', reconciliationNote:'2 excess HUs received not in manifest', reconciledAt:ago(18), reconciledBy:'Ravi.DC',
        receivingData:{vehicleVerified:true,sealVerified:true,sealMatch:true,sealReceived:'SL-55020',invoiceVerified:true,asnVerified:true,receivedBy:'Ravi.DC',receivedAt:ago(21),notes:'2 extra cartons found'},
        exceptionIds:['EXC007'], totalWeightKg:5100, totalCbm:27,
        custody:[
          {event:'received',user:'Ravi.DC',role:'warehouse-op',locationId:'LOC004',timestamp:ago(18),note:'2 excess HUs — not in dispatch manifest',deviceId:'WH-SCAN-08'},
        ],
        auditLog:[{id:'A026',entityType:'dispatch',entityId:'DSP-2024-0020',action:'RECONCILIATION_DISCREPANCY',user:'Ravi.DC',role:'warehouse-op',oldValue:'unloading',newValue:'reconciled',note:'2 excess HUs',timestamp:ago(18),sessionId:'S017'}],
        notes:'2 unmanifested HUs received', createdBy:'System', createdAt:ago(82), updatedAt:ago(18),
      },

      /* ── CLOSED (2) ── */
      {
        id:'DSP-2024-0021', scheduleId:'SCH001', routeId:'R001', routeCode:'DEL-MUM',
        routeName:'Delhi → Mumbai', originId:'LOC001', destId:'LOC002',
        carrierId:'CAR001', vehicleId:'VEH001', vehicleReg:'MH12AB1234',
        driverName:'Ramesh Yadav', driverPhone:'9811111111',
        asn:'ASN-2024-0521', invoice:'INV-2024-1021', gatepass:'GP-0021', sealNo:'SL-44021',
        plannedDeparture:ago(120), plannedArrival:ago(72), actualDeparture:ago(119.5), actualArrival:ago(71),
        slaHours:48, status:'closed', otdStatus:'on-time', otaStatus:'on-time', otdVarianceMin:30, otaVarianceMin:-60,
        huDispatched:hu(190,10), huReceived:hu(190,10), huMissing:[], huExcess:[],
        reconciliationStatus:'matched', reconciliationNote:'All HUs matched. Closed.', reconciledAt:ago(68), reconciledBy:'Priya.WH',
        receivingData:{vehicleVerified:true,sealVerified:true,sealMatch:true,sealReceived:'SL-44021',invoiceVerified:true,asnVerified:true,receivedBy:'Priya.WH',receivedAt:ago(70),notes:''},
        exceptionIds:[], totalWeightKg:4100, totalCbm:22,
        custody:[{event:'closed',user:'System',role:'system',locationId:'LOC002',timestamp:ago(65),note:'Dispatch closed after successful reconciliation',deviceId:'SYS'}],
        auditLog:[{id:'A027',entityType:'dispatch',entityId:'DSP-2024-0021',action:'DISPATCH_CLOSED',user:'System',role:'system',oldValue:'reconciled',newValue:'closed',note:'Auto-closed',timestamp:ago(65),sessionId:'SYS'}],
        notes:'', createdBy:'System', createdAt:ago(126), updatedAt:ago(65),
      },
      {
        id:'DSP-2024-0022', scheduleId:'SCH003', routeId:'R002', routeCode:'MUM-BLR',
        routeName:'Mumbai → Bangalore', originId:'LOC002', destId:'LOC003',
        carrierId:'CAR002', vehicleId:'VEH004', vehicleReg:'TN22GH3456',
        driverName:'Mohan Rao', driverPhone:'9844444444',
        asn:'ASN-2024-0522', invoice:'INV-2024-1022', gatepass:'GP-0022', sealNo:'SL-44022',
        plannedDeparture:ago(100), plannedArrival:ago(60), actualDeparture:ago(97), actualArrival:ago(57),
        slaHours:40, status:'closed', otdStatus:'delayed', otaStatus:'delayed', otdVarianceMin:180, otaVarianceMin:180,
        huDispatched:hu(200,8), huReceived:hu(200,8), huMissing:[], huExcess:[],
        reconciliationStatus:'matched', reconciliationNote:'', reconciledAt:ago(54), reconciledBy:'Arjun.WH',
        receivingData:{vehicleVerified:true,sealVerified:true,sealMatch:true,sealReceived:'SL-44022',invoiceVerified:true,asnVerified:true,receivedBy:'Arjun.WH',receivedAt:ago(56),notes:''},
        exceptionIds:['EXC009'], totalWeightKg:3600, totalCbm:19,
        custody:[{event:'closed',user:'System',role:'system',locationId:'LOC003',timestamp:ago(50),note:'Closed',deviceId:'SYS'}],
        auditLog:[{id:'A028',entityType:'dispatch',entityId:'DSP-2024-0022',action:'DISPATCH_CLOSED',user:'System',role:'system',oldValue:'reconciled',newValue:'closed',note:'',timestamp:ago(50),sessionId:'SYS'}],
        notes:'Delayed but reconciled clean', createdBy:'System', createdAt:ago(106), updatedAt:ago(50),
      },
    ];
  })(),

  /* ── Exceptions ── */
  exceptions: [
    { id:'EXC001', codeId:'EC002', code:'EX-DEL-002', dispatchId:'DSP-2024-0009', routeId:'R003',
      type:'delay', subType:'carrier-delay', severity:'high',
      title:'Vehicle Departure Delayed 4 Hours — DEL-HYD',
      description:'Vehicle departed 4 hours after planned schedule. NH-48 congestion reported by driver.',
      autoClassified:'yes', suggestedCause:'carrier-delay', causeConfidence:82,
      rootCause:'Traffic congestion on NH-44 near Nagpur toll',
      slaImpactHrs:4, status:'in-progress', owner:'carrier', escalationLevel:1,
      raisedBy:'System', raisedAt: (() => { const now=new Date(); return new Date(now.getTime()-16*3600000).toISOString(); })(),
      acknowledgedBy:'Ops.Manager', acknowledgedAt: (() => { const now=new Date(); return new Date(now.getTime()-15*3600000).toISOString(); })(),
      resolvedBy:null, resolvedAt:null, resolution:null, huAffected:[],
      auditLog:[
        {id:'EA001',entityType:'exception',entityId:'EXC001',action:'EXCEPTION_RAISED',user:'System',role:'system',oldValue:null,newValue:'open',note:'Auto-raised: OTD > 240 min',timestamp: new Date(new Date().getTime()-16*3600000).toISOString(),sessionId:'SYS'},
        {id:'EA002',entityType:'exception',entityId:'EXC001',action:'ACKNOWLEDGED',user:'Ops.Manager',role:'ops-manager',oldValue:'open',newValue:'acknowledged',note:'Investigating with carrier',timestamp: new Date(new Date().getTime()-15*3600000).toISOString(),sessionId:'S020'},
        {id:'EA003',entityType:'exception',entityId:'EXC001',action:'ESCALATED',user:'System',role:'system',oldValue:'acknowledged',newValue:'escalated',note:'Auto-escalated L1 threshold (4hrs)',timestamp: new Date(new Date().getTime()-12*3600000).toISOString(),sessionId:'SYS'},
      ],
    },
    { id:'EXC002', codeId:'EC001', code:'EX-DEL-001', dispatchId:'DSP-2024-0009', routeId:'R003',
      type:'delay', subType:'carrier-delay', severity:'medium',
      title:'Departure Delay Notification — DSP-2024-0009',
      description:'Initial delay notification raised as vehicle did not depart within 30 min of scheduled time.',
      autoClassified:'yes', suggestedCause:'carrier-delay', causeConfidence:75,
      rootCause:'Driver late arrival at loading dock',
      slaImpactHrs:1, status:'resolved', owner:'carrier', escalationLevel:0,
      raisedBy:'System', raisedAt: new Date(new Date().getTime()-20*3600000).toISOString(),
      acknowledgedBy:'Ops.Exec', acknowledgedAt: new Date(new Date().getTime()-19*3600000).toISOString(),
      resolvedBy:'Ops.Exec', resolvedAt: new Date(new Date().getTime()-17*3600000).toISOString(),
      resolution:'Driver arrived and vehicle departed. Escalated to carrier for SLA penalty.',
      huAffected:[], auditLog:[],
    },
    { id:'EXC003', codeId:'EC003', code:'EX-ARR-001', dispatchId:'DSP-2024-0011', routeId:'R007',
      type:'delay', subType:'transit-delay', severity:'high',
      title:'Vehicle Arrival Overdue — MUM-HYD',
      description:'Vehicle has not arrived at destination. ETA exceeded by 3 hours. Possible breakdown.',
      autoClassified:'yes', suggestedCause:'carrier-delay', causeConfidence:68,
      rootCause:null, slaImpactHrs:3, status:'escalated', owner:'carrier', escalationLevel:2,
      raisedBy:'System', raisedAt: new Date(new Date().getTime()-4*3600000).toISOString(),
      acknowledgedBy:'Ops.Manager', acknowledgedAt: new Date(new Date().getTime()-3.5*3600000).toISOString(),
      resolvedBy:null, resolvedAt:null, resolution:null,
      huAffected:[], auditLog:[],
    },
    { id:'EXC004', codeId:'EC001', code:'EX-DEL-001', dispatchId:'DSP-2024-0014', routeId:'R006',
      type:'delay', subType:'carrier-delay', severity:'medium',
      title:'OTD Breach — Kolkata → Delhi',
      description:'Vehicle departed 4 hours late. Driver cited vehicle inspection delays at origin.',
      autoClassified:'yes', suggestedCause:'warehouse-delay', causeConfidence:60,
      rootCause:'Vehicle fitness certificate renewal caused delay at origin gate',
      slaImpactHrs:0, status:'resolved', owner:'warehouse', escalationLevel:0,
      raisedBy:'System', raisedAt: new Date(new Date().getTime()-54*3600000).toISOString(),
      acknowledgedBy:'Ops.Exec', acknowledgedAt: new Date(new Date().getTime()-53*3600000).toISOString(),
      resolvedBy:'Ops.Exec', resolvedAt: new Date(new Date().getTime()-48*3600000).toISOString(),
      resolution:'Vehicle cleared. OTA was on-time despite OTD breach.',
      huAffected:[], auditLog:[],
    },
    { id:'EXC005', codeId:'EC007', code:'EX-SEAL-001', dispatchId:'DSP-2024-0016', routeId:'R007',
      type:'seal-mismatch', subType:'tamper', severity:'critical',
      title:'⚠ CRITICAL: Seal Mismatch Detected — MUM-HYD',
      description:'Seal number on vehicle (SL-XXXX) does not match dispatch manifest (SL-66016). Tamper risk.',
      autoClassified:'yes', suggestedCause:'carrier-delay', causeConfidence:91,
      rootCause:null, slaImpactHrs:8, status:'open', owner:'ops', escalationLevel:3,
      raisedBy:'System', raisedAt: new Date(new Date().getTime()-5*3600000).toISOString(),
      acknowledgedBy:null, acknowledgedAt:null,
      resolvedBy:null, resolvedAt:null, resolution:null,
      huAffected:['HU0140001','HU0140002','HU0140003'], auditLog:[],
    },
    { id:'EXC006', codeId:'EC005', code:'EX-HU-001', dispatchId:'DSP-2024-0019', routeId:'R002',
      type:'shortage', subType:'hu-shortage', severity:'high',
      title:'HU Short Delivery — 1 Missing',
      description:'1 Handling Unit not received at Bangalore DC. Manifested but not scanned at destination.',
      autoClassified:'yes', suggestedCause:'carrier-delay', causeConfidence:72,
      rootCause:null, slaImpactHrs:0, status:'in-progress', owner:'carrier', escalationLevel:1,
      raisedBy:'System', raisedAt: new Date(new Date().getTime()-30*3600000).toISOString(),
      acknowledgedBy:'Ops.Manager', acknowledgedAt: new Date(new Date().getTime()-29*3600000).toISOString(),
      resolvedBy:null, resolvedAt:null, resolution:null,
      huAffected:[`HU${String(170*100+8).padStart(7,'0')}`], auditLog:[],
    },
    { id:'EXC007', codeId:'EC006', code:'EX-HU-002', dispatchId:'DSP-2024-0020', routeId:'R003',
      type:'shortage', subType:'hu-excess', severity:'medium',
      title:'Excess HU Received — 2 Unmanifested',
      description:'2 HU barcodes received at Hyderabad DC not found in dispatch manifest. Possible mis-routing.',
      autoClassified:'yes', suggestedCause:'warehouse-delay', causeConfidence:65,
      rootCause:'Likely loaded from adjacent dispatch due to warehouse packing error',
      slaImpactHrs:2, status:'in-progress', owner:'warehouse', escalationLevel:0,
      raisedBy:'System', raisedAt: new Date(new Date().getTime()-18*3600000).toISOString(),
      acknowledgedBy:'Ops.Exec', acknowledgedAt: new Date(new Date().getTime()-17*3600000).toISOString(),
      resolvedBy:null, resolvedAt:null, resolution:null,
      huAffected:[`HU${String(180*100+13).padStart(7,'0')}`,`HU${String(180*100+14).padStart(7,'0')}`], auditLog:[],
    },
    { id:'EXC008', codeId:'EC012', code:'EX-VEH-001', dispatchId:'DSP-2024-0008', routeId:'R002',
      type:'delay', subType:'breakdown', severity:'high',
      title:'Vehicle Breakdown Reported En Route',
      description:'Driver reported tyre burst near Pune. Vehicle stopped for repair. 3-4 hour delay expected.',
      autoClassified:'no', suggestedCause:'carrier-delay', causeConfidence:95,
      rootCause:'Tyre burst — NH-48 near Khopoli', slaImpactHrs:4, status:'in-progress', owner:'carrier', escalationLevel:1,
      raisedBy:'Ops.Exec', raisedAt: new Date(new Date().getTime()-7*3600000).toISOString(),
      acknowledgedBy:'Ops.Manager', acknowledgedAt: new Date(new Date().getTime()-6.5*3600000).toISOString(),
      resolvedBy:null, resolvedAt:null, resolution:null,
      huAffected:[], auditLog:[],
    },
    { id:'EXC009', codeId:'EC004', code:'EX-ARR-002', dispatchId:'DSP-2024-0022', routeId:'R002',
      type:'delay', subType:'sla-breach', severity:'critical',
      title:'SLA Breach — MUM-BLR (Closed)',
      description:'Vehicle arrived 3 hours past SLA window. Carrier performance impact logged.',
      autoClassified:'yes', suggestedCause:'carrier-delay', causeConfidence:88,
      rootCause:'Border check point delays and driver rest stops exceeded permitted time',
      slaImpactHrs:3, status:'closed', owner:'carrier', escalationLevel:0,
      raisedBy:'System', raisedAt: new Date(new Date().getTime()-60*3600000).toISOString(),
      acknowledgedBy:'Ops.Manager', acknowledgedAt: new Date(new Date().getTime()-59*3600000).toISOString(),
      resolvedBy:'Ops.Manager', resolvedAt: new Date(new Date().getTime()-52*3600000).toISOString(),
      resolution:'SLA penalty raised against GATI Kintetsu. Root cause documented.',
      huAffected:[], auditLog:[],
    },
  ],

  /* ── Users ── */
  users: [
    { id:'USR001', username:'admin',       name:'Admin User',        role:'admin',             active:true },
    { id:'USR002', username:'ops.exec',    name:'Priya Sharma',      role:'ops-exec',          active:true },
    { id:'USR003', username:'ops.manager', name:'Rahul Gupta',       role:'ops-manager',       active:true },
    { id:'USR004', username:'wh.op.del',   name:'Suresh Mehta',      role:'warehouse-op',      active:true },
    { id:'USR005', username:'wh.op.mum',   name:'Priya Nair',        role:'warehouse-op',      active:true },
    { id:'USR006', username:'reg.manager', name:'Sanjay Kapoor',     role:'regional-manager',  active:true },
    { id:'USR007', username:'sc.head',     name:'Ananya Krishnan',   role:'sc-head',           active:true },
    { id:'USR008', username:'carrier.mgr', name:'Deepak Verma',      role:'carrier-manager',   active:true },
  ],
};

/* ═══════════════════════════════════════════════════════
   INITIALIZER — Seeds localStorage if empty
═══════════════════════════════════════════════════════ */
function initializeDataStore(forceReset = false) {
  if (forceReset || !localStorage.getItem(KEYS.locations)) {
    Object.entries(KEYS).forEach(([name, key]) => {
      if (SEED[name]) DB.set(key, SEED[name]);
    });
    // Audit log global table
    const allAudit = SEED.dispatches.flatMap(d => d.auditLog || []);
    DB.set(KEYS.auditLog, allAudit);
    console.log('[TCT] Data store initialized with seed data.');
    return true;
  }
  return false;
}

/* ═══════════════════════════════════════════════════════
   DATA ACCESS LAYER (DAL)
═══════════════════════════════════════════════════════ */
const DAL = {
  /* Generic */
  getAll:   (key)     => DB.getOrInit(key, []),
  getById:  (key, id) => (DB.getOrInit(key, [])).find(x => x.id === id) || null,
  upsert(key, record) {
    const list = DB.getOrInit(key, []);
    const idx  = list.findIndex(x => x.id === record.id);
    if (idx >= 0) list[idx] = { ...list[idx], ...record };
    else list.unshift(record);
    DB.set(key, list);
    return record;
  },
  delete(key, id) {
    const list = DB.getOrInit(key, []).filter(x => x.id !== id);
    DB.set(key, list);
  },

  /* Shortcuts */
  dispatches:     { getAll: ()   => DAL.getAll(KEYS.dispatches),
                    getById: id  => DAL.getById(KEYS.dispatches, id),
                    save: rec    => DAL.upsert(KEYS.dispatches, rec) },
  exceptions:     { getAll: ()   => DAL.getAll(KEYS.exceptions),
                    getById: id  => DAL.getById(KEYS.exceptions, id),
                    save: rec    => DAL.upsert(KEYS.exceptions, rec) },
  routes:         { getAll: ()   => DAL.getAll(KEYS.routes),
                    getById: id  => DAL.getById(KEYS.routes, id) },
  carriers:       { getAll: ()   => DAL.getAll(KEYS.carriers),
                    getById: id  => DAL.getById(KEYS.carriers, id) },
  vehicles:       { getAll: ()   => DAL.getAll(KEYS.vehicles),
                    getById: id  => DAL.getById(KEYS.vehicles, id) },
  locations:      { getAll: ()   => DAL.getAll(KEYS.locations),
                    getById: id  => DAL.getById(KEYS.locations, id) },
  schedules:      { getAll: ()   => DAL.getAll(KEYS.schedules),
                    getById: id  => DAL.getById(KEYS.schedules, id) },
  exceptionCodes: { getAll: ()   => DAL.getAll(KEYS.exceptionCodes),
                    getById: id  => DAL.getById(KEYS.exceptionCodes, id) },
  slaConfig:      { getAll: ()   => DAL.getAll(KEYS.slaConfig),
                    forRoute: rId => {
                      const all = DAL.getAll(KEYS.slaConfig);
                      return all.find(s => s.routeId === rId) || all.find(s => !s.routeId) || null;
                    }},
  auditLog:       { getAll: ()   => DAL.getAll(KEYS.auditLog),
                    append: ev   => {
                      const log = DAL.getAll(KEYS.auditLog);
                      log.unshift(ev);
                      DB.set(KEYS.auditLog, log);
                    }},
};

/* ═══════════════════════════════════════════════════════
   RELATIONSHIP RESOLVERS
═══════════════════════════════════════════════════════ */
const RESOLVE = {
  dispatchFull(dispatch) {
    if (!dispatch) return null;
    return {
      ...dispatch,
      route:    DAL.routes.getById(dispatch.routeId),
      carrier:  DAL.carriers.getById(dispatch.carrierId),
      vehicle:  DAL.vehicles.getById(dispatch.vehicleId),
      origin:   DAL.locations.getById(dispatch.originId),
      dest:     DAL.locations.getById(dispatch.destId),
      schedule: DAL.schedules.getById(dispatch.scheduleId),
      exceptions: (dispatch.exceptionIds || []).map(id => DAL.exceptions.getById(id)).filter(Boolean),
    };
  },
};

/* ═══════════════════════════════════════════════════════
   CONSTANTS
═══════════════════════════════════════════════════════ */
const DISPATCH_STATUSES = ['planned','ready','dispatched','in-transit','arrived','unloading','reconciled','closed'];
const STATUS_LABELS     = { planned:'Planned', ready:'Ready', dispatched:'Dispatched', 'in-transit':'In Transit', arrived:'Arrived', unloading:'Unloading', reconciled:'Reconciled', closed:'Closed' };
const EXCEPTION_TYPES   = ['delay','shortage','damage','seal-mismatch','theft-risk','documentation'];
const SEVERITY_LEVELS   = ['low','medium','high','critical'];
const ESCALATION_ROLES  = { 0:'None', 1:'Ops Manager', 2:'Regional Manager', 3:'SC Head' };
const USER_ROLES        = ['admin','ops-exec','ops-manager','warehouse-op','regional-manager','sc-head','carrier-manager'];

/* ═══════════════════════════════════════════════════════
   EXPORTS (attach to window for module use)
═══════════════════════════════════════════════════════ */
window.TCT = window.TCT || {};
Object.assign(window.TCT, {
  KEYS, DB, DAL, SEED, RESOLVE,
  DISPATCH_STATUSES, STATUS_LABELS,
  EXCEPTION_TYPES, SEVERITY_LEVELS, ESCALATION_ROLES, USER_ROLES,
  initializeDataStore,
});

console.log('[TCT Step 1] Core Data Model loaded. Run TCT.initializeDataStore() to seed data.');
// → Next module: STEP 2 (await instruction)
