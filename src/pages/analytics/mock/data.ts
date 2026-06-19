// Analytics module — derived aggregations built from existing module mocks.
// These are month-level and multi-week series that don't exist in any single
// operational mock but are derived from the same underlying numbers.

// ─── Executive trend (8 weeks) ────────────────────────────────────────────────

export const EXEC_WEEKLY_TREND = [
  { week: 'W44', dispatches: 1820, completed: 1612, otd: 88, sla: 91, exceptions: 148 },
  { week: 'W45', dispatches: 1940, completed: 1724, otd: 89, sla: 92, exceptions: 134 },
  { week: 'W46', dispatches: 1875, completed: 1650, otd: 88, sla: 90, exceptions: 156 },
  { week: 'W47', dispatches: 2010, completed: 1789, otd: 89, sla: 91, exceptions: 129 },
  { week: 'W48', dispatches: 2185, completed: 1943, otd: 89, sla: 93, exceptions: 118 },
  { week: 'W49', dispatches: 2240, completed: 1971, otd: 88, sla: 92, exceptions: 124 },
  { week: 'W50', dispatches: 2180, completed: 1898, otd: 87, sla: 91, exceptions: 141 },
  { week: 'W51', dispatches: 2312, completed: 1984, otd: 86, sla: 90, exceptions: 155 },
]

export const EXEC_MONTHLY_REVENUE = [
  { month: 'Jun', revenue: 18.4, budget: 20.0, freight: 14.2, penalty: 0.8 },
  { month: 'Jul', revenue: 21.2, budget: 21.0, freight: 16.8, penalty: 0.6 },
  { month: 'Aug', revenue: 19.8, budget: 21.0, freight: 15.9, penalty: 0.9 },
  { month: 'Sep', revenue: 22.4, budget: 23.0, freight: 17.8, penalty: 0.7 },
  { month: 'Oct', revenue: 24.1, budget: 24.0, freight: 19.2, penalty: 0.5 },
  { month: 'Nov', revenue: 23.6, budget: 24.0, freight: 18.7, penalty: 1.1 },
]

export const EXEC_FLEET_UTIL_TREND = [
  { month: 'Jun', ftl: 71, ltl: 64, lcv: 58 },
  { month: 'Jul', ftl: 74, ltl: 66, lcv: 61 },
  { month: 'Aug', ftl: 73, ltl: 65, lcv: 59 },
  { month: 'Sep', ftl: 76, ltl: 68, lcv: 63 },
  { month: 'Oct', ftl: 78, ltl: 70, lcv: 65 },
  { month: 'Nov', ftl: 79, ltl: 71, lcv: 66 },
]

// ─── Operations analytics ─────────────────────────────────────────────────────

export const DELAY_DISTRIBUTION = [
  { band: '0–30 min',   count: 112, pct: 45 },
  { band: '30–60 min',  count: 68,  pct: 27 },
  { band: '1–2 hrs',    count: 42,  pct: 17 },
  { band: '2–4 hrs',    count: 18,  pct: 7  },
  { band: '4+ hrs',     count: 12,  pct: 5  },
]

export const HUB_PERFORMANCE = [
  { hub: 'Delhi Hub',       arrivals: 14, otd: 89, avgDockTime: 42, exceptions: 4, util: 91 },
  { hub: 'Mumbai Hub',      arrivals: 18, otd: 86, avgDockTime: 55, exceptions: 7, util: 88 },
  { hub: 'Bangalore Hub',   arrivals: 11, otd: 91, avgDockTime: 38, exceptions: 3, util: 83 },
  { hub: 'Kolkata Hub',     arrivals: 9,  otd: 79, avgDockTime: 68, exceptions: 5, util: 79 },
  { hub: 'Hyderabad Depot', arrivals: 8,  otd: 84, avgDockTime: 47, exceptions: 2, util: 74 },
  { hub: 'Chennai Depot',   arrivals: 6,  otd: 87, avgDockTime: 41, exceptions: 1, util: 71 },
  { hub: 'Pune Depot',      arrivals: 4,  otd: 92, avgDockTime: 35, exceptions: 1, util: 67 },
  { hub: 'Ahmedabad Depot', arrivals: 5,  otd: 88, avgDockTime: 44, exceptions: 2, util: 72 },
]

export const SLA_BREACH_BY_HOUR = [
  { hour: '00–02', breaches: 2 }, { hour: '02–04', breaches: 1 },
  { hour: '04–06', breaches: 3 }, { hour: '06–08', breaches: 7 },
  { hour: '08–10', breaches: 11 },{ hour: '10–12', breaches: 9 },
  { hour: '12–14', breaches: 6 }, { hour: '14–16', breaches: 8 },
  { hour: '16–18', breaches: 14 },{ hour: '18–20', breaches: 10 },
  { hour: '20–22', breaches: 5 }, { hour: '22–24', breaches: 3 },
]

export const CAPACITY_TREND = [
  { week: 'W44', loaded: 68, available: 100 },
  { week: 'W45', loaded: 72, available: 100 },
  { week: 'W46', loaded: 70, available: 100 },
  { week: 'W47', loaded: 74, available: 100 },
  { week: 'W48', loaded: 76, available: 100 },
  { week: 'W49', loaded: 78, available: 100 },
  { week: 'W50', loaded: 77, available: 100 },
  { week: 'W51', loaded: 79, available: 100 },
]

// ─── Carrier analytics ────────────────────────────────────────────────────────

export const CARRIER_OTD_VS_COST = [
  { name: 'Prime Transport', otd: 94, cost: 108, score: 91 },
  { name: 'SwiftCargo',      otd: 92, cost: 102, score: 88 },
  { name: 'VRL Logistics',   otd: 88, cost: 95,  score: 82 },
  { name: 'BlueDart Surf.',  otd: 83, cost: 112, score: 79 },
  { name: 'TCI Freight',     otd: 82, cost: 90,  score: 78 },
  { name: 'Delhivery',       otd: 76, cost: 92,  score: 73 },
  { name: 'Safexpress',      otd: 74, cost: 88,  score: 71 },
  { name: 'ColdEx',          otd: 80, cost: 125, score: 76 },
  { name: 'Gati Ltd',        otd: 72, cost: 85,  score: 68 },
  { name: 'FastMove',        otd: 61, cost: 78,  score: 52 },
]

export const CARRIER_MONTHLY_SCORE = [
  { month: 'Jun', platinum: 90, gold: 79, silver: 71, probation: 58 },
  { month: 'Jul', platinum: 90, gold: 79, silver: 71, probation: 56 },
  { month: 'Aug', platinum: 89, gold: 78, silver: 71, probation: 55 },
  { month: 'Sep', platinum: 90, gold: 79, silver: 71, probation: 54 },
  { month: 'Oct', platinum: 90, gold: 79, silver: 72, probation: 53 },
  { month: 'Nov', platinum: 90, gold: 79, silver: 71, probation: 52 },
]

// ─── Route analytics ──────────────────────────────────────────────────────────

export const ROUTE_DELAY_HEAT = [
  // delay avg minutes per week per route
  { route: 'DEL-MUM-FTL', W48: 72, W49: 68, W50: 80, W51: 80 },
  { route: 'MUM-PUN-002', W48: 24, W49: 28, W50: 30, W51: 28 },
  { route: 'BLR-CHN-003', W48: 55, W49: 60, W50: 65, W51: 62 },
  { route: 'MUM-AHM-004', W48: 40, W49: 44, W50: 50, W51: 48 },
  { route: 'HYD-MUM-005', W48: 88, W49: 90, W50: 98, W51: 95 },
  { route: 'KOL-PAT-006', W48: 155, W49: 162, W50: 170, W51: 165 },
  { route: 'DEL-LKW-007', W48: 50, W49: 52, W50: 58, W51: 55 },
  { route: 'BLR-HYD-008', W48: 175, W49: 182, W50: 192, W51: 188 },
  { route: 'DEL-JPR-009', W48: 28, W49: 30, W50: 35, W51: 32 },
  { route: 'KOL-DEL-001', W48: 340, W49: 355, W50: 370, W51: 368 },
]

export const ROUTE_RELIABILITY_TREND = [
  { week: 'W44', reliable: 68, moderate: 22, poor: 10 },
  { week: 'W45', reliable: 70, moderate: 20, poor: 10 },
  { week: 'W46', reliable: 69, moderate: 21, poor: 10 },
  { week: 'W47', reliable: 71, moderate: 20, poor: 9  },
  { week: 'W48', reliable: 72, moderate: 19, poor: 9  },
  { week: 'W49', reliable: 71, moderate: 20, poor: 9  },
  { week: 'W50', reliable: 70, moderate: 21, poor: 9  },
  { week: 'W51', reliable: 69, moderate: 21, poor: 10 },
]

// ─── Exception analytics ──────────────────────────────────────────────────────

export const EXC_SEVERITY_TREND = [
  { week: 'W44', critical: 8,  high: 22, medium: 31, low: 12 },
  { week: 'W45', critical: 9,  high: 24, medium: 29, low: 10 },
  { week: 'W46', critical: 7,  high: 20, medium: 33, low: 14 },
  { week: 'W47', critical: 11, high: 28, medium: 27, low: 11 },
  { week: 'W48', critical: 10, high: 25, medium: 30, low: 9  },
  { week: 'W49', critical: 12, high: 29, medium: 28, low: 8  },
  { week: 'W50', critical: 9,  high: 26, medium: 32, low: 10 },
  { week: 'W51', critical: 13, high: 31, medium: 26, low: 8  },
]

export const EXC_ROOT_CAUSE = [
  { cause: 'Vehicle Breakdown',   count: 18, pct: 22, color: '#ef4444' },
  { cause: 'Traffic / Route',     count: 16, pct: 20, color: '#f97316' },
  { cause: 'Documentation',       count: 14, pct: 17, color: '#f59e0b' },
  { cause: 'Loading Delay',       count: 12, pct: 15, color: '#eab308' },
  { cause: 'Cold Chain Failure',  count: 8,  pct: 10, color: '#8b5cf6' },
  { cause: 'Weight Mismatch',     count: 7,  pct: 8,  color: '#3b82f6' },
  { cause: 'Customer Refusal',    count: 4,  pct: 5,  color: '#64748b' },
  { cause: 'Other',               count: 3,  pct: 3,  color: '#94a3b8' },
]

export const EXC_FINANCIAL_IMPACT_BY_CAT = [
  { category: 'Cold Chain',    impact: 120000 },
  { category: 'SLA Breach',    impact: 45000  },
  { category: 'HU Missing',    impact: 28000  },
  { category: 'Breakdown',     impact: 12000  },
  { category: 'HU Damaged',    impact: 9000   },
  { category: 'Gate Hold',     impact: 5000   },
  { category: 'Route Dev.',    impact: 2000   },
  { category: 'Doc Missing',   impact: 1000   },
]

export const EXC_RESOLUTION_DIST = [
  { band: '<1 hr',    count: 8,  pct: 22 },
  { band: '1–4 hrs',  count: 12, pct: 33 },
  { band: '4–12 hrs', count: 9,  pct: 25 },
  { band: '12–24 hrs',count: 5,  pct: 14 },
  { band: '>24 hrs',  count: 2,  pct: 6  },
]

// ─── Reconciliation analytics ─────────────────────────────────────────────────

export const RECON_TURNAROUND_BY_CARRIER = [
  { carrier: 'Prime Transport', avgHrs: 3.2,  cleanPct: 92 },
  { carrier: 'SwiftCargo',      avgHrs: 4.1,  cleanPct: 88 },
  { carrier: 'VRL Logistics',   avgHrs: 6.8,  cleanPct: 84 },
  { carrier: 'BlueDart Surf.',  avgHrs: 5.4,  cleanPct: 81 },
  { carrier: 'TCI Freight',     avgHrs: 7.2,  cleanPct: 79 },
  { carrier: 'Safexpress',      avgHrs: 9.5,  cleanPct: 74 },
  { carrier: 'Gati Ltd',        avgHrs: 11.8, cleanPct: 68 },
  { carrier: 'FastMove',        avgHrs: 18.4, cleanPct: 54 },
]

export const RECON_APPROVAL_CYCLE = [
  { month: 'Jun', avgCycleHrs: 12.4, pendingEOD: 8 },
  { month: 'Jul', avgCycleHrs: 11.8, pendingEOD: 6 },
  { month: 'Aug', avgCycleHrs: 13.2, pendingEOD: 9 },
  { month: 'Sep', avgCycleHrs: 10.9, pendingEOD: 5 },
  { month: 'Oct', avgCycleHrs: 10.1, pendingEOD: 4 },
  { month: 'Nov', avgCycleHrs: 11.4, pendingEOD: 7 },
]

export const RECON_DISCREPANCY_BY_TYPE = [
  { type: 'Weight Variance', count: 18, financialImpact: 0     },
  { type: 'HU Missing',      count: 7,  financialImpact: 82000 },
  { type: 'HU Damaged',      count: 12, financialImpact: 21500 },
  { type: 'Extra HU',        count: 3,  financialImpact: 0     },
  { type: 'Wrong Item',      count: 5,  financialImpact: 14000 },
]

export const RECON_WEEKLY_CLOSURE = [
  { week: 'W44', arrived: 38, reconciled: 35, discrepancy: 4, closed: 31 },
  { week: 'W45', arrived: 42, reconciled: 39, discrepancy: 5, closed: 36 },
  { week: 'W46', arrived: 36, reconciled: 32, discrepancy: 6, closed: 29 },
  { week: 'W47', arrived: 48, reconciled: 44, discrepancy: 7, closed: 40 },
  { week: 'W48', arrived: 44, reconciled: 40, discrepancy: 5, closed: 37 },
  { week: 'W49', arrived: 50, reconciled: 45, discrepancy: 8, closed: 41 },
  { week: 'W50', arrived: 46, reconciled: 41, discrepancy: 6, closed: 38 },
  { week: 'W51', arrived: 52, reconciled: 46, discrepancy: 9, closed: 42 },
]
