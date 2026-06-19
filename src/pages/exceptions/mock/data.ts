import type { SeverityLevel } from '@/theme'
import type { ExceptionState } from '@/types'

export interface FullException {
  id: string
  category: string
  subcategory?: string
  severity: SeverityLevel
  status: ExceptionState
  dispatchId: string
  routeCode: string
  routeName: string
  carrier: string
  vehicleReg: string
  origin: string
  destination: string
  raisedAt: string
  raisedBy: string
  assignee?: string
  assigneeTeam?: string
  escalationLevel: number
  slaBreachAt?: string
  resolvedAt?: string
  resolutionTime?: number       // minutes
  rootCause?: string
  resolutionNote?: string
  comments: ExcComment[]
  financialImpact?: number      // INR
  tags: string[]
}

export interface ExcComment {
  id: string
  author: string
  text: string
  at: string
  type: 'note' | 'escalation' | 'resolution' | 'system'
}

const now = Date.now()
const t   = (hoursAgo: number) => new Date(now - hoursAgo * 3600000).toISOString()
const tf  = (hoursAhead: number) => new Date(now + hoursAhead * 3600000).toISOString()

export const EXCEPTIONS: FullException[] = [
  // ── CRITICAL / OPEN ──────────────────────────────────────────
  {
    id: 'EXC-2024-0891',
    category: 'SLA Breach',
    subcategory: 'Delivery Overdue',
    severity: 'critical',
    status: 'ESCALATED',
    dispatchId: 'D-48218',
    routeCode: 'KOL-DEL-001',
    routeName: 'Kolkata → Delhi NH19',
    carrier: 'FastMove Logistics',
    vehicleReg: 'DL01AB2233',
    origin: 'Kolkata (Rajarhat Hub)',
    destination: 'Delhi (Naraina WH)',
    raisedAt: t(14),
    raisedBy: 'SLA Engine',
    assignee: 'Priya Sharma',
    assigneeTeam: 'Operations',
    escalationLevel: 3,
    slaBreachAt: t(2),
    financialImpact: 45000,
    rootCause: 'Vehicle breakdown near Agra, 1 HU missing post-incident',
    tags: ['sla-breach', 'missing-hu', 'vehicle-breakdown'],
    comments: [
      { id: 'c1', author: 'SLA Engine', text: 'SLA window expired. Auto-escalation triggered.', at: t(14), type: 'system' },
      { id: 'c2', author: 'Priya Sharma', text: 'Contacted driver. Vehicle broke down on NH-19 near Agra. Recovery truck dispatched.', at: t(12), type: 'note' },
      { id: 'c3', author: 'Rahul Verma (L2)', text: 'Escalating to L3 — financial impact >₹40K. Carrier SLA penalty to be applied.', at: t(8), type: 'escalation' },
    ],
  },
  {
    id: 'EXC-2024-0892',
    category: 'HU Missing',
    subcategory: 'Post-Loading Count Mismatch',
    severity: 'critical',
    status: 'IN_PROGRESS',
    dispatchId: 'D-48218',
    routeCode: 'KOL-DEL-001',
    routeName: 'Kolkata → Delhi NH19',
    carrier: 'FastMove Logistics',
    vehicleReg: 'DL01AB2233',
    origin: 'Kolkata (Rajarhat Hub)',
    destination: 'Delhi (Naraina WH)',
    raisedAt: t(10),
    raisedBy: 'Ram Kishore',
    assignee: 'Deepak Nair',
    assigneeTeam: 'Warehouse',
    escalationLevel: 1,
    slaBreachAt: tf(6),
    financialImpact: 28000,
    rootCause: 'HU-218-005 (Textiles — Bulk Fabric) not scanned at Agra checkpoint. Last known location: Agra Bypass.',
    tags: ['missing-hu', 'in-transit'],
    comments: [
      { id: 'c1', author: 'Ram Kishore', text: 'Recount at Varanasi checkpoint: 5 of 6 HUs present. HU-218-005 missing.', at: t(10), type: 'note' },
      { id: 'c2', author: 'Deepak Nair', text: 'Raised with Agra hub. CCTV review in progress.', at: t(8), type: 'note' },
    ],
  },
  {
    id: 'EXC-2024-0893',
    category: 'Vehicle Breakdown',
    severity: 'high',
    status: 'IN_PROGRESS',
    dispatchId: 'D-48275',
    routeCode: 'MUM-PUN-002',
    routeName: 'Mumbai → Pune Express',
    carrier: 'SwiftCargo India',
    vehicleReg: 'MH12XY9901',
    origin: 'Mumbai (Bhiwandi Hub)',
    destination: 'Pune (Chakan Industrial)',
    raisedAt: t(6),
    raisedBy: 'GPS System',
    assignee: 'Anita Rao',
    assigneeTeam: 'Fleet',
    escalationLevel: 1,
    slaBreachAt: tf(4),
    financialImpact: 12000,
    tags: ['breakdown', 'fleet'],
    comments: [
      { id: 'c1', author: 'GPS System', text: 'Vehicle stationary for >2 hours at NH48 Khopoli Ghat. Speed: 0 km/h.', at: t(6), type: 'system' },
      { id: 'c2', author: 'Anita Rao', text: 'Driver confirmed tyre burst. Replacement vehicle arranged — ETA 2h.', at: t(5), type: 'note' },
    ],
  },
  {
    id: 'EXC-2024-0894',
    category: 'HU Damaged',
    subcategory: 'Physical Damage at Loading',
    severity: 'high',
    status: 'OPEN',
    dispatchId: 'D-48291',
    routeCode: 'DEL-MUM-FTL',
    routeName: 'Delhi → Mumbai FTL Express',
    carrier: 'Prime Transport Co',
    vehicleReg: 'MH12XY9901',
    origin: 'Delhi (Gurgaon WH)',
    destination: 'Mumbai (Bhiwandi Hub)',
    raisedAt: t(4),
    raisedBy: 'Ram Kishore',
    assignee: undefined,
    assigneeTeam: undefined,
    escalationLevel: 0,
    slaBreachAt: tf(20),
    financialImpact: 8500,
    tags: ['damage', 'electronics'],
    comments: [
      { id: 'c1', author: 'Ram Kishore', text: 'HU-291-004 outer carton dented during forklift loading. Noted in LR. Contents appear intact.', at: t(4), type: 'note' },
    ],
  },
  {
    id: 'EXC-2024-0895',
    category: 'Route Deviation',
    severity: 'medium',
    status: 'OPEN',
    dispatchId: 'D-48241',
    routeCode: 'BLR-CHN-003',
    routeName: 'Bangalore → Chennai NH48',
    carrier: 'BlueDart Surface',
    vehicleReg: 'KA19TH4421',
    origin: 'Bangalore (Electronic City)',
    destination: 'Chennai (Ambattur IE)',
    raisedAt: t(3),
    raisedBy: 'GPS System',
    assignee: 'Suresh Kumar',
    assigneeTeam: 'Operations',
    escalationLevel: 0,
    slaBreachAt: tf(30),
    tags: ['route-deviation'],
    comments: [
      { id: 'c1', author: 'GPS System', text: 'Vehicle deviated from approved route. Currently on NH-75 instead of NH-48.', at: t(3), type: 'system' },
    ],
  },
  {
    id: 'EXC-2024-0896',
    category: 'Gate Hold',
    subcategory: 'E-Waybill Expired',
    severity: 'high',
    status: 'OPEN',
    dispatchId: 'D-48263',
    routeCode: 'HYD-MUM-005',
    routeName: 'Hyderabad → Mumbai',
    carrier: 'Gati Ltd',
    vehicleReg: 'TS09FF2211',
    origin: 'Hyderabad (Uppal Hub)',
    destination: 'Mumbai (Bhiwandi Hub)',
    raisedAt: t(2),
    raisedBy: 'Gate Officer — Narayan',
    assignee: 'Kavitha Menon',
    assigneeTeam: 'Documentation',
    escalationLevel: 1,
    slaBreachAt: tf(3),
    financialImpact: 5000,
    tags: ['gate-hold', 'documentation'],
    comments: [
      { id: 'c1', author: 'Gate Officer — Narayan', text: 'E-waybill EWB-2024-1144 expired at 06:00 today. Vehicle held at Pune Toll Gate.', at: t(2), type: 'note' },
      { id: 'c2', author: 'Kavitha Menon', text: 'New e-waybill generation in process. Expected resolution in 45 minutes.', at: t(1.5), type: 'note' },
    ],
  },
  {
    id: 'EXC-2024-0897',
    category: 'Weight Mismatch',
    severity: 'medium',
    status: 'ASSIGNED',
    dispatchId: 'D-48302',
    routeCode: 'DEL-LKW-007',
    routeName: 'Delhi → Lucknow Express',
    carrier: 'TCI Freight',
    vehicleReg: 'UP32KL9988',
    origin: 'Delhi (Okhla Industrial)',
    destination: 'Lucknow (Amausi Hub)',
    raisedAt: t(5),
    raisedBy: 'Weighbridge System',
    assignee: 'Deepak Nair',
    assigneeTeam: 'Warehouse',
    escalationLevel: 0,
    slaBreachAt: tf(15),
    tags: ['weight-mismatch', 'overload'],
    comments: [
      { id: 'c1', author: 'Weighbridge System', text: 'Exit weight 12.4T vs manifest 11.8T — variance 0.6T. Possible undeclared load.', at: t(5), type: 'system' },
      { id: 'c2', author: 'Deepak Nair', text: 'Recount in progress. Investigating 3 unlisted cartons found during inspection.', at: t(3), type: 'note' },
    ],
  },
  {
    id: 'EXC-2024-0898',
    category: 'Delayed Dispatch',
    subcategory: 'Loading Delay',
    severity: 'low',
    status: 'RESOLVED',
    dispatchId: 'D-48195',
    routeCode: 'MUM-AHM-004',
    routeName: 'Mumbai → Ahmedabad',
    carrier: 'VRL Logistics',
    vehicleReg: 'GJ05PP1122',
    origin: 'Mumbai (Bhiwandi Hub)',
    destination: 'Ahmedabad (Naroda)',
    raisedAt: t(20),
    raisedBy: 'Scheduler',
    assignee: 'Anita Rao',
    assigneeTeam: 'Operations',
    escalationLevel: 0,
    resolvedAt: t(16),
    resolutionTime: 240,
    resolutionNote: 'Loading completed after dock congestion cleared. Vehicle dispatched 4h late — SLA still met.',
    tags: ['loading-delay'],
    comments: [
      { id: 'c1', author: 'Scheduler', text: 'Loading at Dock 5 delayed due to dock congestion. 3 vehicles ahead in queue.', at: t(20), type: 'note' },
      { id: 'c2', author: 'Anita Rao', text: 'Moved to Dock 8 — loading commenced.', at: t(18), type: 'note' },
      { id: 'c3', author: 'Anita Rao', text: 'Vehicle dispatched. SLA met — 2h buffer remaining.', at: t(16), type: 'resolution' },
    ],
  },
  {
    id: 'EXC-2024-0899',
    category: 'Temp Deviation',
    subcategory: 'Cold Chain Breach',
    severity: 'critical',
    status: 'ESCALATED',
    dispatchId: 'D-48311',
    routeCode: 'DEL-HYD-COLD',
    routeName: 'Delhi → Hyderabad Cold Chain',
    carrier: 'ColdEx Logistics',
    vehicleReg: 'TS08RR5566',
    origin: 'Delhi (Gurgaon Cold Store)',
    destination: 'Hyderabad (Secunderabad)',
    raisedAt: t(8),
    raisedBy: 'Temperature Sensor',
    assignee: 'Priya Sharma',
    assigneeTeam: 'Quality',
    escalationLevel: 2,
    slaBreachAt: tf(1),
    financialImpact: 120000,
    rootCause: 'Reefer unit malfunction at Nagpur. Temperature rose from -4°C to +11°C for 90 minutes.',
    tags: ['cold-chain', 'reefer-failure', 'pharma'],
    comments: [
      { id: 'c1', author: 'Temperature Sensor', text: 'Alert: Temperature +11.2°C — breach of -2°C to -6°C range. Duration: 90 min.', at: t(8), type: 'system' },
      { id: 'c2', author: 'Priya Sharma', text: 'Reefer technician called. Cargo inspection at next halt — Nagpur.', at: t(7), type: 'note' },
      { id: 'c3', author: 'Quality Manager', text: 'Escalated. Pharma cargo affected — ₹1.2L potential loss. QA team dispatched to Nagpur.', at: t(6), type: 'escalation' },
    ],
  },
  {
    id: 'EXC-2024-0900',
    category: 'Doc Missing',
    severity: 'medium',
    status: 'PENDING_INFO',
    dispatchId: 'D-48288',
    routeCode: 'BLR-HYD-008',
    routeName: 'Bangalore → Hyderabad',
    carrier: 'Delhivery Surface',
    vehicleReg: 'AP28XZ1100',
    origin: 'Bangalore (Whitefield Hub)',
    destination: 'Hyderabad (Uppal Hub)',
    raisedAt: t(3.5),
    raisedBy: 'Check-in System',
    assignee: 'Kavitha Menon',
    assigneeTeam: 'Documentation',
    escalationLevel: 0,
    slaBreachAt: tf(12),
    tags: ['documentation'],
    comments: [
      { id: 'c1', author: 'Check-in System', text: 'Gate pass GP-2024-8821 not found in system. Manual entry required.', at: t(3.5), type: 'system' },
      { id: 'c2', author: 'Kavitha Menon', text: 'Awaiting original document from origin warehouse. ETA: 1h.', at: t(2), type: 'note' },
    ],
  },
  // ── Additional resolved ───────────────────────────────────────
  {
    id: 'EXC-2024-0881',
    category: 'Delayed Dispatch',
    severity: 'medium',
    status: 'CLOSED',
    dispatchId: 'D-48140',
    routeCode: 'KOL-PAT-006',
    routeName: 'Kolkata → Patna',
    carrier: 'Safexpress',
    vehicleReg: 'BR05CD4411',
    origin: 'Kolkata (Rajarhat Hub)',
    destination: 'Patna (Bailey Road)',
    raisedAt: t(36),
    raisedBy: 'Scheduler',
    assignee: 'Rahul Verma',
    assigneeTeam: 'Operations',
    escalationLevel: 0,
    resolvedAt: t(30),
    resolutionTime: 360,
    resolutionNote: 'Resolved — driver arrived 6h late due to personal emergency. Replacement driver arranged.',
    tags: ['driver-delay'],
    comments: [],
  },
  {
    id: 'EXC-2024-0882',
    category: 'HU Damaged',
    severity: 'low',
    status: 'AUTO_RESOLVED',
    dispatchId: 'D-48155',
    routeCode: 'DEL-JPR-009',
    routeName: 'Delhi → Jaipur',
    carrier: 'TCI Freight',
    vehicleReg: 'RJ14AB8877',
    origin: 'Delhi (Okhla Industrial)',
    destination: 'Jaipur (Sitapura IE)',
    raisedAt: t(48),
    raisedBy: 'Driver Scan',
    assignee: 'Suresh Kumar',
    assigneeTeam: 'Warehouse',
    escalationLevel: 0,
    resolvedAt: t(44),
    resolutionTime: 240,
    resolutionNote: 'Outer packaging damage only. Contents verified intact at destination. Closed.',
    tags: ['minor-damage'],
    comments: [],
  },
]

// ─── Computed KPIs ────────────────────────────────────────────────────────────

const open    = EXCEPTIONS.filter(e => !['RESOLVED','CLOSED','AUTO_RESOLVED'].includes(e.status))
const closed  = EXCEPTIONS.filter(e =>  ['RESOLVED','CLOSED','AUTO_RESOLVED'].includes(e.status))

export const EXC_KPI = {
  totalOpen:      open.length,
  critical:       open.filter(e => e.severity === 'critical').length,
  slaBreached:    open.filter(e => e.slaBreachAt && new Date(e.slaBreachAt) < new Date()).length,
  escalated:      open.filter(e => e.escalationLevel > 0).length,
  resolvedToday:  closed.filter(e => e.resolvedAt && Date.now() - Date.parse(e.resolvedAt) < 86400000).length,
  avgResolutionH: Math.round(closed.filter(e => e.resolutionTime).reduce((s, e) => s + (e.resolutionTime ?? 0), 0) / Math.max(1, closed.length) / 60),
  financialImpact: open.reduce((s, e) => s + (e.financialImpact ?? 0), 0),
}

export const EXC_TREND_7D = Array.from({ length: 7 }, (_, i) => ({
  day: ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'][i],
  opened:   [4, 6, 3, 8, 5, 2, 3][i],
  resolved: [3, 5, 4, 6, 7, 2, 2][i],
  escalated:[1, 2, 0, 3, 1, 0, 1][i],
}))

export const EXC_BY_CATEGORY = [
  { category: 'SLA Breach',       count: 3, pct: 25, color: '#ef4444' },
  { category: 'HU Missing',       count: 2, pct: 17, color: '#f97316' },
  { category: 'Vehicle Breakdown',count: 2, pct: 17, color: '#f59e0b' },
  { category: 'HU Damaged',       count: 2, pct: 17, color: '#eab308' },
  { category: 'Gate Hold',        count: 1, pct: 8,  color: '#8b5cf6' },
  { category: 'Route Deviation',  count: 1, pct: 8,  color: '#3b82f6' },
  { category: 'Other',            count: 1, pct: 8,  color: '#94a3b8' },
]

export const ASSIGNEES = ['Priya Sharma','Deepak Nair','Anita Rao','Kavitha Menon','Suresh Kumar','Rahul Verma']
