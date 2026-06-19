// Reconciliation Center mock data

export type ReconciliationStatus =
  | 'pending'       // dispatched, not yet arrived
  | 'in_progress'   // arrived, scanning in progress
  | 'discrepancy'   // variances found, pending sign-off
  | 'approved'      // finance approved
  | 'closed'        // fully reconciled

export interface HUDiscrepancy {
  huCode: string
  type: 'missing' | 'damaged' | 'extra' | 'wrong_item' | 'weight_variance'
  description: string
  financialImpact: number
  status: 'open' | 'accepted' | 'disputed' | 'waived'
}

export interface ReconciliationRecord {
  id: string
  dispatchId: string
  routeCode: string
  routeName: string
  carrier: string
  origin: string
  destination: string
  arrivedAt?: string
  reconStatus: ReconciliationStatus
  huLoaded: number
  huArrived: number
  huDamaged: number
  huMissing: number
  huExtra: number
  weightLoaded: number   // kg
  weightArrived: number  // kg
  freightCost: number
  discrepancies: HUDiscrepancy[]
  reconBy?: string
  approvedBy?: string
  approvedAt?: string
  signedOffAt?: string
  notes?: string
}

const now = Date.now()
const t   = (hoursAgo: number) => new Date(now - hoursAgo * 3600000).toISOString()

export const RECONCILIATIONS: ReconciliationRecord[] = [
  {
    id: 'REC-2024-0441',
    dispatchId: 'D-48218',
    routeCode: 'KOL-DEL-001',
    routeName: 'Kolkata → Delhi NH19',
    carrier: 'FastMove Logistics',
    origin: 'Kolkata (Rajarhat Hub)',
    destination: 'Delhi (Naraina WH)',
    arrivedAt: t(2),
    reconStatus: 'discrepancy',
    huLoaded: 6,
    huArrived: 5,
    huDamaged: 0,
    huMissing: 1,
    huExtra: 0,
    weightLoaded: 1580,
    weightArrived: 1310,
    freightCost: 42000,
    reconBy: 'Deepak Nair',
    discrepancies: [
      { huCode: 'HU-218-005', type: 'missing', description: 'HU-218-005 (Textiles — Bulk Fabric) not delivered. Last seen Agra checkpoint.', financialImpact: 28000, status: 'open' },
      { huCode: 'WEIGHT', type: 'weight_variance', description: 'Total weight variance: -270 kg (likely due to missing HU)', financialImpact: 0, status: 'accepted' },
    ],
    notes: 'Carrier informed. FIR under consideration. Cargo insurance claim initiated.',
  },
  {
    id: 'REC-2024-0442',
    dispatchId: 'D-48291',
    routeCode: 'DEL-MUM-FTL',
    routeName: 'Delhi → Mumbai FTL Express',
    carrier: 'Prime Transport Co',
    origin: 'Delhi (Gurgaon WH)',
    destination: 'Mumbai (Bhiwandi Hub)',
    arrivedAt: t(4),
    reconStatus: 'discrepancy',
    huLoaded: 8,
    huArrived: 8,
    huDamaged: 1,
    huMissing: 0,
    huExtra: 0,
    weightLoaded: 2240,
    weightArrived: 2240,
    freightCost: 68000,
    reconBy: 'Kavitha Menon',
    discrepancies: [
      { huCode: 'HU-291-004', type: 'damaged', description: 'Outer carton dented. Contents (FMCG Personal Care) inspected — 3 of 28 SKUs damaged.', financialImpact: 8500, status: 'accepted' },
    ],
    notes: 'Damage noted in LR. Carrier deduction to be processed.',
  },
  {
    id: 'REC-2024-0443',
    dispatchId: 'D-48195',
    routeCode: 'MUM-AHM-004',
    routeName: 'Mumbai → Ahmedabad',
    carrier: 'VRL Logistics',
    origin: 'Mumbai (Bhiwandi Hub)',
    destination: 'Ahmedabad (Naroda)',
    arrivedAt: t(8),
    reconStatus: 'approved',
    huLoaded: 12,
    huArrived: 12,
    huDamaged: 0,
    huMissing: 0,
    huExtra: 0,
    weightLoaded: 3200,
    weightArrived: 3198,
    freightCost: 28000,
    reconBy: 'Suresh Kumar',
    approvedBy: 'Priya Sharma',
    approvedAt: t(4),
    discrepancies: [],
    notes: 'Clean delivery. Minor weight variance (2 kg) within tolerance.',
  },
  {
    id: 'REC-2024-0444',
    dispatchId: 'D-48241',
    routeCode: 'BLR-CHN-003',
    routeName: 'Bangalore → Chennai NH48',
    carrier: 'BlueDart Surface',
    origin: 'Bangalore (Electronic City)',
    destination: 'Chennai (Ambattur IE)',
    arrivedAt: t(1),
    reconStatus: 'in_progress',
    huLoaded: 5,
    huArrived: 5,
    huDamaged: 0,
    huMissing: 0,
    huExtra: 0,
    weightLoaded: 960,
    weightArrived: 955,
    freightCost: 18000,
    reconBy: 'Anita Rao',
    discrepancies: [],
    notes: 'Scanning in progress at destination.',
  },
  {
    id: 'REC-2024-0445',
    dispatchId: 'D-48311',
    routeCode: 'DEL-HYD-COLD',
    routeName: 'Delhi → Hyderabad Cold Chain',
    carrier: 'ColdEx Logistics',
    origin: 'Delhi (Gurgaon Cold Store)',
    destination: 'Hyderabad (Secunderabad)',
    reconStatus: 'pending',
    huLoaded: 14,
    huArrived: 0,
    huDamaged: 0,
    huMissing: 0,
    huExtra: 0,
    weightLoaded: 4200,
    weightArrived: 0,
    freightCost: 95000,
    discrepancies: [],
    notes: 'Cold chain breach detected in transit — QA inspection required on arrival.',
  },
  {
    id: 'REC-2024-0440',
    dispatchId: 'D-48140',
    routeCode: 'KOL-PAT-006',
    routeName: 'Kolkata → Patna',
    carrier: 'Safexpress',
    origin: 'Kolkata (Rajarhat Hub)',
    destination: 'Patna (Bailey Road)',
    arrivedAt: t(30),
    reconStatus: 'closed',
    huLoaded: 9,
    huArrived: 9,
    huDamaged: 0,
    huMissing: 0,
    huExtra: 0,
    weightLoaded: 2100,
    weightArrived: 2097,
    freightCost: 22000,
    reconBy: 'Deepak Nair',
    approvedBy: 'Rahul Verma',
    approvedAt: t(24),
    signedOffAt: t(22),
    discrepancies: [],
    notes: 'Fully reconciled. Proof of delivery signed.',
  },
  {
    id: 'REC-2024-0446',
    dispatchId: 'D-48302',
    routeCode: 'DEL-LKW-007',
    routeName: 'Delhi → Lucknow Express',
    carrier: 'TCI Freight',
    origin: 'Delhi (Okhla Industrial)',
    destination: 'Lucknow (Amausi Hub)',
    reconStatus: 'pending',
    huLoaded: 11,
    huArrived: 0,
    huDamaged: 0,
    huMissing: 0,
    huExtra: 0,
    weightLoaded: 2900,
    weightArrived: 0,
    freightCost: 31000,
    discrepancies: [],
    notes: 'Weight mismatch exception raised in transit.',
  },
  {
    id: 'REC-2024-0447',
    dispatchId: 'D-48263',
    routeCode: 'HYD-MUM-005',
    routeName: 'Hyderabad → Mumbai',
    carrier: 'Gati Ltd',
    origin: 'Hyderabad (Uppal Hub)',
    destination: 'Mumbai (Bhiwandi Hub)',
    reconStatus: 'pending',
    huLoaded: 7,
    huArrived: 0,
    huDamaged: 0,
    huMissing: 0,
    huExtra: 0,
    weightLoaded: 1750,
    weightArrived: 0,
    freightCost: 24000,
    discrepancies: [],
    notes: 'Gate-hold exception — e-waybill renewal in progress.',
  },
  {
    id: 'REC-2024-0448',
    dispatchId: 'D-48155',
    routeCode: 'DEL-JPR-009',
    routeName: 'Delhi → Jaipur',
    carrier: 'TCI Freight',
    origin: 'Delhi (Okhla Industrial)',
    destination: 'Jaipur (Sitapura IE)',
    arrivedAt: t(44),
    reconStatus: 'closed',
    huLoaded: 6,
    huArrived: 6,
    huDamaged: 1,
    huMissing: 0,
    huExtra: 0,
    weightLoaded: 1500,
    weightArrived: 1498,
    freightCost: 15000,
    reconBy: 'Suresh Kumar',
    approvedBy: 'Priya Sharma',
    approvedAt: t(38),
    signedOffAt: t(36),
    discrepancies: [
      { huCode: 'HU-155-003', type: 'damaged', description: 'Minor packaging tear — contents intact.', financialImpact: 500, status: 'waived' },
    ],
    notes: 'Minor damage waived. Fully reconciled.',
  },
]

// ─── KPI computations ────────────────────────────────────────────────────────

export const RECON_KPI = {
  pending:         RECONCILIATIONS.filter(r => r.reconStatus === 'pending').length,
  inProgress:      RECONCILIATIONS.filter(r => r.reconStatus === 'in_progress').length,
  discrepancy:     RECONCILIATIONS.filter(r => r.reconStatus === 'discrepancy').length,
  closed:          RECONCILIATIONS.filter(r => ['approved','closed'].includes(r.reconStatus)).length,
  totalHUMissing:  RECONCILIATIONS.reduce((s, r) => s + r.huMissing, 0),
  totalHUDamaged:  RECONCILIATIONS.reduce((s, r) => s + r.huDamaged, 0),
  financialImpact: RECONCILIATIONS.flatMap(r => r.discrepancies).reduce((s, d) => s + d.financialImpact, 0),
}

export const RECON_TREND_7D = Array.from({ length: 7 }, (_, i) => ({
  day: ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'][i],
  arrived:    [8, 12, 6, 14, 10, 4, 6][i],
  reconciled: [7, 11, 5, 13, 9,  3, 5][i],
  discrepancies: [1, 2, 1, 3, 2, 1, 1][i],
}))
