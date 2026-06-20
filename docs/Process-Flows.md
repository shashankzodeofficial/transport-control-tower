# Process Flows
## Transport Control Tower (TCT)

**Version:** 2.0 — Full Module Audit
**Last Updated:** 2026-06-19

This document describes every operational workflow in the TCT platform with step-by-step flows, decision points, and module responsibilities.

---

## 1. End-to-End Dispatch Lifecycle (14 Stages)

```
LOAD PLANNING           ORIGIN OPS (Hub)          TRANSIT              DESTINATION OPS           CLOSURE
─────────────           ────────────────          ───────              ───────────────           ───────
Pending Load       →    [1] planned           →   [6] dispatched  →   [9] gate_in_dest     →   [13] reconciled
Vehicle Matched         [2] ready                 [7] in_transit      [10] dock_assigned        [14] closed
Load Plan Created       [3] gate_in_origin         [8] arrived_dest    [11] unloading
                        [4] loading                                     [12] received
                        [5] gate_out_origin
```

### 1.1 Origin Phase (Stages 1–5)
- **Planned** — Load plan confirmed; dispatch record created
- **Ready** — Documents attached (LR, E-waybill, Gate Pass, seal number); driver assigned; carrier confirmed
- **Gate In Origin** — Vehicle arrives at hub; gate-in registered; dwell clock starts
- **Loading** — Bay assigned; cargo loaded onto vehicle; loadedHUs tracked per HU scan
- **Gate Out Origin** — Loading complete; seal applied; gate-out clearance given; E-waybill activated; SLA clock starts

### 1.2 Transit Phase (Stages 6–8)
- **Dispatched** — Dispatch status confirmed; carrier notified; vehicle departs hub
- **In Transit** — Active transit monitoring via Operations CT; speed, fuel, location tracked
- **Arrived Dest.** — Vehicle reaches destination; arrival logged

### 1.3 Destination Phase (Stages 9–12)
- **Gate In Dest.** — Destination gate-in registered
- **Dock Assigned** — Unloading bay allocated (D-01 through D-10)
- **Unloading** — HUs scanned off vehicle; receivedHUs, damagedHUs, shortHUs updated
- **Received** — All HUs accounted for; receipt confirmed; POD captured; variance logged

### 1.4 Closure Phase (Stages 13–14)
- **Reconciled** — HU count vs manifest reconciled; financial variances computed; approved
- **Closed** — Final sign-off; freight cost locked; record archived

---

## 2. Dispatch Creation Flow

### Trigger
A pending load requires vehicle assignment.

### Step-by-Step

**Step 1 — Load Planning (`/load-planning`)**
1. Planner views Pending Loads tab (sorted: Critical → High → Normal → earliest deadline)
2. Reviews load: route, weight, volume, priority, deadline
3. Switches to Available Vehicles tab
4. Selects vehicle with matching capacity, availability = `available`, and location near origin
5. Creates Load Plan: links load IDs + vehicle ID, sets plannedDeparture, plannedArrival, routeCode, estimated freightCost
6. Confirms plan → status: `confirmed`

**Step 2 — Dispatch Workbench (`/dispatch/board`)**
1. Confirmed plan triggers new Dispatch record with status: `planned`
2. CT operator opens dispatch → attaches: LR number, E-waybill, invoice numbers, gate pass, seal number
3. Assigns driver; confirms carrier → status: `ready`

**Step 3 — Hub Operations (`/hub-ops`)**
1. Vehicle arrives → `arrived` status; hub ops starts gate-in process
2. Gate-in registered → `gate_in`; dwell clock starts
3. Loading bay assigned; loading commences → `loading`; loadedHUs updates per scan
4. All HUs loaded; seal applied → `loaded`; gate-out documentation prepared
5. Gate-out cleared → `gate_out`; dispatch status → `dispatched`; E-waybill activated

**Step 4 — Transit (`/operations` or `/lifecycle`)**
1. Vehicle status → `in_transit`; SLA clock starts based on slaTotalHours
2. CT monitors via Operations CT fleet board and Dispatch Lifecycle Tracker
3. GPS pings update currentLocation, speedKmh, fuelPct, progressPct

---

## 3. SLA Monitoring and Breach Flow

### SLA Status Transitions

```
Dispatch: in_transit
         │
         ├── hoursToPlannedArrival > 4h    → slaStatus: ok        (no alert)
         │
         ├── hoursToPlannedArrival 0–4h    → slaStatus: at-risk
         │       Alert fired: SLA_BREACH (HIGH severity)
         │       CT Operator sees alert in Global Alert Rail
         │
         └── hoursToPlannedArrival < 0     → slaStatus: breached
                 Alert fired: SLA_BREACH (CRITICAL severity)
                 Exception auto-raised: category = 'SLA Breach'
                 Escalation computed from delayMins:
                   ≥ 2h → escalationLevel 1 (Regional Manager)
                   ≥ 4h → escalationLevel 2 (Transport Head)
                   ≥ 8h → escalationLevel 3 (Control Tower)
```

### SLA Watch Colour Logic
- `at-risk` → amber badge, `+X.Xh remaining`
- `breached` → red badge, `+X.Xh overdue`

### Alert Acknowledgement Workflow
1. Alert appears in CT Alerts (`/alerts`) and Global Alert Rail (bell icon)
2. CT operator opens alert
3. Selects action: `carrier_escalated` / `alternate_vehicle` / `route_changed` / `delivery_replanned` / `driver_contacted` / `hub_escalated` / `customer_escalated` / `monitoring_only`
4. Enters free-text `ackRemarks`
5. Submits → `acknowledged = true`, `ackedAt` recorded, `ackedBy` set
6. Alert badge count on nav decrements; rail removes from unread

---

## 4. Exception Management Flow

### Raise Exception

**Trigger:** System auto-detect (SLA engine, GPS, weighbridge, temperature sensor) or manual operator raise

1. Exception created with: category, subcategory?, severity, dispatchId, carrier, vehicleReg, origin, destination
2. Status: `OPEN`; escalationLevel: 0; raisedBy set; slaBreachAt computed (24h default)
3. Alert fired: `ESCALATED_EXCEPTION` (if critical) or `HIGH_RISK` (if high)
4. Appears in Exception Board (`/exceptions`)

### Assignment
1. CT operator views OPEN exceptions in Exception Board
2. Clicks "Assign to Me" → assignee set, assigneeTeam set, status → `ASSIGNED`
3. Or uses "Assign To" dropdown in Raise modal for direct assignment

### Investigation
1. Operator contacts carrier / driver; reviews GPS data, documents
2. Records findings in activity comment (type: `note`)
3. Status → `IN_PROGRESS`
4. If awaiting information from carrier or field → status → `PENDING_INFO`

### Escalation
1. If not resolved within threshold → escalation triggered manually or by SLA engine
2. escalationLevel incremented (1 → 2 → 3)
3. Status → `ESCALATED`
4. Comment added (type: `escalation`) with approver notified

### Resolution
1. Operator documents root cause (`rootCause` field)
2. Adds resolution note (`resolutionNote`)
3. Clicks "Resolve" → status: `RESOLVED`; resolvedAt set; resolutionTime computed
4. Finance approves if financial impact involved
5. Status → `CLOSED`

### Auto-Resolution
1. Underlying condition resolves without operator action (e.g. GPS resumes, vehicle moves)
2. System sets status → `AUTO_RESOLVED` automatically

### Exception KPI Computation
```typescript
totalOpen      = filter(e => not in [RESOLVED, CLOSED, AUTO_RESOLVED]).length
critical       = totalOpen.filter(e => e.severity === 'critical').length
slaBreached    = totalOpen.filter(e => e.slaBreachAt && slaBreachAt < now).length
escalated      = totalOpen.filter(e => e.escalationLevel > 0).length
resolvedToday  = closed.filter(e => resolvedAt within last 24h).length
avgResolutionH = mean(closed.resolutionTime in minutes) / 60
```

---

## 5. Hub Operations Flow (Origin)

### Gate-In to Gate-Out Process

```
Vehicle Approaches Hub
         │
         ▼
    [arrived] — Waiting in yard
    arrivedAt recorded; turnaround clock starts
         │
         ▼ Gate-in registered
    [gate_in] — At dock / pre-staging area
    gateInAt recorded; dwell clock starts
    Priority visible: normal / urgent / delayed
         │
         ▼ Dock and loading bay assigned
    [loading] — Cargo being loaded
    loadingStartAt recorded
    loadedHUs updates per scan (progress bar: loadedHUs/plannedHUs)
    Urgent priority: 3 workers, expedited
         │
         ▼ All HUs loaded, seal applied
    [loaded] — Loading complete, gate-out pending
    loadingCompleteAt recorded; loadingTimeMins computable
    Documents: gate pass prepared, E-waybill number confirmed
         │
         ▼ Documentation cleared
    [gate_out] — Vehicle exiting hub
    gateOutAt recorded; hubDwellMins computable
    E-waybill activated
         │
         ▼ Departure confirmed
    [dispatched] — Vehicle departed
    dispatchedAt recorded; turnaroundMins computable
    Dispatch status → dispatched; SLA clock starts
```

### Delay Detection
- `isDelayed(v)` = `plannedDeparture < now` AND status not in [`gate_out`, `dispatched`]
- Delayed vehicles show red accent and priority = `delayed`

### Key Metrics
- **Hub Dwell Time**: `hubDwellMins` = gateOutAt − gateInAt (target: ≤ 120 minutes)
- **Loading Time**: `loadingTimeMins` = loadingCompleteAt − loadingStartAt
- **Turnaround Time**: `turnaroundMins` = dispatchedAt − arrivedAt

### Vehicle Types and Special Handling
- **Reefer** — Cold chain temperature verification required before gate-out
- **Trailer** — Requires wider bay; dock assignment checks bay clearance
- **LCV** — Fast turnaround; often prioritised for short-haul routes

---

## 6. Destination Operations Flow

### Inbound Arrival to Closure

```
Vehicle Approaching
    departedOriginAt known; ETA trackable
         │
         ▼ Vehicle arrives at destination gate
    [arrived] — at destination premises
    arrivedAt recorded
    isOverdue flag = plannedArrival < now
    Priority: urgent or sla_breach vehicles flagged red
         │
         ▼ Gate clearance done
    [gate_in] — Entered destination premises
    gateInAt recorded
    exceptionCount visible on card
         │
         ▼ Dock bay allocated
    [dock_assigned] — Bay assigned (D-01 to D-10)
    dockAssignedAt recorded; dockNumber set
         │
         ▼ Unloading begins
    [unloading] — HUs being offloaded
    unloadingStartAt recorded
    receivedHUs updates per scan
    damagedHUs and shortHUs updated as found
         │
         ▼ All HUs off vehicle
    [unloaded] — Vehicle cleared
    unloadingCompleteAt recorded
    dockDwellMins and unloadingTimeMins computable
         │
         ▼ Count verified, signed off by supervisor
    [receipt_confirmed] — POD captured
    receiptConfirmedAt recorded
    huVariance = receivedHUs − plannedHUs
    If shortage: shortHUs > 0 → exception raised; reconciliation flagged
    If damage: damagedHUs > 0 → exception raised
         │
         ▼ Reconciliation complete
    [reconciled] — Variances documented in ReconciliationRecord
    reconciledAt recorded
         │
         ▼ Final sign-off
    [closed] — Record archived
    closedAt recorded; totalCycleMins computable
```

### HU Variance Rules
- `receivedHUs === plannedHUs` → clean delivery; proceed to reconciliation
- `receivedHUs < plannedHUs` → shortage; raise HU Missing exception; financial impact = unit value × shortage count
- `receivedHUs > plannedHUs` → overage; investigate for undeclared load; raise Weight Mismatch exception if needed
- `damagedHUs > 0` → HU Damaged exception raised; photo evidence required; carrier deduction planned

---

## 7. Reconciliation Center Flow

### Post-Delivery Reconciliation

```
Dispatch Status: arrived/unloading
         │
         ▼
ReconciliationRecord auto-created
    status: pending
    huLoaded, weightLoaded, freightCost populated from dispatch
    huArrived = 0; huDamaged = 0; huMissing = 0 (pending)
         │
         ▼ Operator opens record
    status: in_progress
    Compares: huLoaded vs huArrived
    Compares: weightLoaded vs weightArrived
    Reviews: invoice vs POD
         │
         ├── No variance (or within tolerance ≤ 2 kg weight)
         │       discrepancies = []
         │       status → approved
         │       approvedBy, approvedAt set
         │       status → closed; signedOffAt set
         │
         └── Variance found
                 discrepancy added: { huCode, type, description, financialImpact, status: 'open' }
                 status → discrepancy
                 │
                 ├── Discrepancy accepted (e.g. minor damage, acknowledged)
                 │       discrepancy.status → 'accepted'
                 │       Carrier deduction calculated
                 │       status → approved → closed
                 │
                 ├── Discrepancy waived (e.g. packaging only, contents intact)
                 │       discrepancy.status → 'waived'
                 │       financialImpact = 0
                 │       status → approved → closed
                 │
                 └── Discrepancy disputed (carrier disagrees)
                         discrepancy.status → 'disputed'
                         status remains: discrepancy (overdue risk)
                         Physical recount or investigation
                         After resolution → status → approved → closed
```

### Financial Reconciliation Logic
- Missing HU: financialImpact = estimated cargo value
- Damaged HU: financialImpact = damage assessment (field team)
- Weight variance > 2 kg: raise weight_variance discrepancy; financialImpact = freight rate × excess kg
- Waived items: financialImpact set to 0; no carrier deduction

---

## 8. Alert Center Flow

### Alert Lifecycle

```
Condition Detected (SLA breach / exception / reconciliation overdue / integration failure)
         │
         ▼
AlertContext.addAlert({ type, severity, message, dispatchId?, routeCode?, ... })
         │
         ├── severity === 'critical'
         │       Global Alert Rail auto-opens
         │
         ▼
Alert appears in:
    - Global Alert Rail (bell icon, slide-over panel)
    - CT Alerts page (/alerts), sorted by severity → firedAt
    - Nav sidebar badge count increments
         │
         ▼ CT Operator acknowledges
    acknowledged = true
    ackedAt = now
    ackedBy = operator name
    ackAction = selected action
    ackRemarks = free-text
         │
         ▼
Alert Rail unread count decrements
Nav sidebar badge decrements
Alert record retains ackAction + ackRemarks for audit
```

### Alert Type → Module Routing

| Alert Type | Nav Badge Module |
|---|---|
| `SLA_BREACH` | Alerts (CT Alerts page) |
| `HIGH_RISK` | Operations CT |
| `ESCALATED_EXCEPTION` | Exception Board |
| `OVERDUE_RECONCILIATION` | Reconciliation Center |
| `INTEGRATION_FAILURE` | Admin / IT |

### Closure SLA
- Target: acknowledge and close alert within 240 minutes
- Avg actual: 142 minutes; P90: 310 minutes
- Fastest closure by action: `driver_contacted` (38 min avg)
- Slowest closure by action: `customer_escalated` (290 min avg)

---

## 9. Global Filter Propagation Flow

### Filter Change → UI Update

```
User selects Region or Date Range in GlobalFilterBar (top navigation)
         │
         ▼
GlobalFilterBar dispatches action to FilterContext (useReducer)
    SET_REGION: { region: 'north' | 'south' | 'east' | 'west' | '' }
    SET_DATE_PRESET: { preset: '7d' | 'today' | 'yesterday' | '30d' | 'month' }
    SET_DATE_RANGE: { from: Date, to: Date, preset: 'custom' }
         │
         ▼
FilterContext state updates; all consumers re-render
         │
         ▼
Each module calls useActiveFilters() → reads { region, dateRange, from, to }
    matchesRoute(routeCode) = !region || routeOriginRegion(routeCode) === region
    matchesCity(city)       = !region || cityRegion(city) === region
    matchesDate(isoString?) = !from || !to || matchesDateRange(isoString, from, to)
         │
         ▼
Module useMemo([region, dateRange]) recomputes:
    baseList = fullList.filter(item => matchesX(...) && matchesDate(...))
         │
         ▼
Downstream useMemos recompute:
    filtered list (local tab + search filters applied to baseList)
    KPI cards (derived from baseList)
    Tab badge counts (per-status count from baseList)
    Charts (derived from baseList)
         │
         ▼
React re-renders all affected components synchronously
No page reload; no loading state
```

### What Updates on Filter Change

| Component Type | Updates? |
|---|---|
| All KPI strips | Yes |
| All data tables and row counts | Yes |
| Tab badge counts | Yes |
| Dispatch Funnel counts | Yes |
| Exception counts | Yes |
| Alert counts | Yes |
| Route Performance sparklines | Yes (data filtered) |
| Carrier Performance table | Yes (data filtered) |
| SLA Heatmap cells | Yes (filtered by route region) |
| Live Network View | Yes (node selection by region) |
| Analytics tab charts | No (pre-aggregated static data in v1.0) |
| Master Data screens | No (configuration, not operational data) |

---

## 10. Load Planning Process

### Capacity Matching

```
Planner opens Pending Loads tab (sorted: Critical → High → Normal → earliest deadline)
         │
For each pending load (assignedVehicleId = null):
    │
    ├── Check weight requirement vs vehicle.capacityKg
    ├── Check volume requirement vs vehicle.capacityM3
    ├── Check vehicle.availability === 'available'
    └── Check vehicle.location matches or near origin city
         │
         ▼
Match found → Create Load Plan
    loadIds[] linked to vehicleId
    plannedDeparture, plannedArrival set
    routeCode assigned
    freightCost estimated (costPerKm × distanceKm)
    status: draft → confirmed → dispatched
         │
         ▼
Confirmed Load Plan → Dispatch Record Created (status: planned)
```

### Load Priority Levels
- `critical` — Expedite; assign best available vehicle; CT notified
- `high` — Assign before normal loads; flag if no vehicle within 2h
- `normal` — Standard first-in-first-out assignment

### KPI Computation (from filtered data)
```
Available Vehicles  = baseVehicles.filter(v => v.availability === 'available').length
In Maintenance      = baseVehicles.filter(v => v.availability === 'maintenance').length
Pending Loads       = baseLoads.filter(l => !l.assignedVehicleId).length
Critical Loads      = baseLoads.filter(l => l.priority === 'critical').length
Avg Utilisation     = mean(baseVehicles.map(v => v.utilizationPct))
Plans Today         = basePlans.filter(p => p.status !== 'cancelled').length
```

---

## 11. Executive CT Dashboard Logic

### KPI Scaling

The Executive CT scales count-based KPIs proportionally to the selected date window:

```
dateScale = Math.round((windowDays / 7) * 100) / 100
// 7d window → scale = 1.0
// 30d window → scale = 4.29
// Today → scale = 0.14

Scaled KPIs = [Active Dispatches, SLA Breaches, Open Exceptions, Pending Reconciliation]
Unscaled KPIs = [OTD %, Vehicle Util %, Avg Delay, Cost vs Budget]

If region is selected:
  KPIs derived from REGION_SUMMARY[region] × dateScale
  avgUtil derived from mean(NETWORK_NODES[region].utilPct)
  Avg Delay: '1.8' if OTD ≥ 90, '2.4' if OTD ≥ 85, '3.2' otherwise
```

### Widget Interaction (no deep-link yet in v1.0)
- All 7 widgets respond to region + date filter independently via `useActiveFilters()`
- Clicking a KPI does not currently drill down — planned for backend integration phase
- Refresh button resets the `lastRefresh` timestamp (cosmetic, no data refetch in mock mode)
- Export button downloads `KPI_DATA` array as CSV regardless of region/date filter (known gap — v2.0 fix planned)

---

## 12. Carrier and Route Performance Scorecard Logic

### Route Grade Computation
Grade is statically assigned in mock data but will be computed in v2.0 as:
```
gradeScore = weighted average of:
  OTD%         × 0.35
  SLA%         × 0.25
  ExceptRate   × 0.20 (inverted: 10 - rate/2, capped 0–10)
  CostPerKm    × 0.20 (inverted vs benchmark)

A: gradeScore ≥ 85
B: gradeScore ≥ 70
C: gradeScore ≥ 55
D: gradeScore ≥ 40
F: gradeScore < 40
```

### Carrier Composite Score
Computed in v2.0 as weighted average of scoring dimensions:
```
compositeScore = weighted average of:
  OTD%                × 0.30
  SLA Compliance%     × 0.25
  Exception Rate      × 0.20 (inverted)
  Damage Rate%        × 0.15 (inverted)
  Response Time (mins)× 0.10 (inverted)
```

Tier boundaries: Platinum ≥ 88, Gold ≥ 75, Silver ≥ 65, Bronze ≥ 55, Probation < 55
