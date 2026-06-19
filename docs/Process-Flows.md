# Process Flows
## Transport Control Tower (TCT)

**Version:** 1.0  
**Last Updated:** 2026-06-19

This document describes the end-to-end operational processes handled by the TCT platform, from dispatch creation through final reconciliation.

---

## 1. End-to-End Dispatch Lifecycle

```
LOAD PLANNING          DISPATCH MANAGEMENT         EXECUTION             RECONCILIATION
─────────────          ───────────────────         ─────────             ───────────────
  Pending Load    →    New Dispatch Created   →    Gate-Out         →    Arrives at Hub
  Vehicle Matched      [status: planned]            [dispatched]         [status: arrived]
  Load Plan Created    Documents Attached           
                       [status: ready]         →    In Transit       →    Unloading Starts
                                                    [status: transit]     [status: unloading]
                                                    
                                                    ↓ (exception?)        ↓
                                                    Exception Raised      HU Count Verified
                                                    Operator Assigned     Variance Noted
                                                    Escalate/Resolve      
                                                                     →    Reconciled
                                                                          [status: reconciled]
                                                                     →    Closed
                                                                          [status: closed]
```

---

## 2. Dispatch Creation Flow

### Trigger
A pending load requires vehicle assignment and dispatch scheduling.

### Steps

**Step 1 — Load Planning Workbench (`/load-planning`)**
1. Planner opens Pending Loads tab
2. Identifies a load by priority (Critical → High → Normal)
3. Reviews load details: route, weight, volume, deadline
4. Switches to Available Vehicles tab
5. Selects a vehicle with sufficient capacity and correct location
6. Creates a Load Plan linking vehicle to load
7. Confirms the plan (status: `confirmed`)

**Step 2 — Dispatch Workbench (`/dispatch/board`)**
1. Confirmed load plan triggers creation of a Dispatch record (status: `planned`)
2. Planner / CT operator opens the new dispatch
3. Attaches documents: LR number, E-waybill, Invoice numbers, Gate Pass, Seal number
4. Assigns driver and confirms carrier
5. Moves dispatch to `ready` status

**Step 3 — Gate-Out**
1. Hub operations confirms gate-out
2. Dispatch moves to `dispatched` status
3. Actual departure time recorded
4. E-waybill activated

**Step 4 — In Transit**
1. Dispatch status moves to `transit`
2. SLA clock starts ticking (based on `slaTotalHours`)
3. Control tower monitors via Executive CT and Operations CT

---

## 3. SLA Monitoring and Breach Flow

### SLA Status Lifecycle

```
[transit]
    │
    ├── slaHoursRemaining > 4h         → slaStatus: ok
    ├── slaHoursRemaining 0–4h         → slaStatus: at-risk
    │       └── Alert fired: SLA_BREACH (high severity)
    │       └── CT Operator notified via Alert Rail
    └── slaHoursRemaining < 0          → slaStatus: breached
            └── Alert fired: SLA_BREACH (critical severity)
            └── Exception auto-raised: SLA_BREACH
            └── Escalation computed from delayMins
```

### Escalation Rules

| Delay       | Escalation Level   | Action Required                             |
|-------------|--------------------|---------------------------------------------|
| ≥ 2 hours   | Regional Manager   | Alert sent to regional manager              |
| ≥ 4 hours   | Transport Head     | Transport head notified, carrier on watch   |
| ≥ 8 hours   | Control Tower      | Control tower takes direct ownership        |

### Alert Acknowledgement Flow

1. Alert appears in CT Alerts (`/alerts`) and in the Global Alert Rail
2. Operator opens alert detail
3. Selects an action from: Carrier Escalated / Alternate Vehicle / Route Changed / Delivery Replanned / Driver Contacted / Hub Escalated / Customer Escalated / Monitoring Only
4. Enters free-text remarks
5. Submits acknowledgement → `acknowledged = true`, `ackedAt` recorded
6. Alert badge count on nav decrements

---

## 4. Hub Operations Flow

### Inbound Vehicle Flow (`/hub-ops`)

```
Vehicle Approaches Hub
         │
         ▼
    ARRIVED (waiting in yard)
    KPI: Waiting++
         │
         ▼ Gate-In registered
    GATE_IN
    KPI: Gate-In++
    Dwell clock starts
         │
         ▼ Loading bay assigned
    LOADING
    KPI: Loading++
    Loading clock starts
         │
         ▼ All HUs loaded, seal applied
    LOADED
    KPI: Loaded++
    Gate-out pending
         │
         ▼ Gate-out done
    Gate-Out → Dispatch status moves to DISPATCHED
```

**Delay Flag:** If a vehicle remains in GATE_IN or LOADING beyond the configured threshold, `isDelayed()` returns true and a delay badge appears on the vehicle card.

**Key Metrics:**
- **Dwell Time** (`hubDwellMins`): Time from gate-in to gate-out
- **Loading Time** (`loadingTimeMins`): Time from LOADING to LOADED
- **Turnaround Time** (`turnaroundMins`): Total time from ARRIVED to gate-out

---

## 5. Destination Operations Flow

### Inbound Delivery Flow (`/dest-ops`)

```
Dispatch In Transit
         │
         ▼ Vehicle approaches
    APPROACHING
    Expected arrival time visible
         │
         ▼ Vehicle arrives at delivery point
    ARRIVED (status: arrived)
    Overdue flag if past expected arrival
         │
         ▼ Dock assigned, unloading begins
    UNLOADING (status: unloading)
    Dock number recorded
         │
         ▼ All HUs unloaded, count verified
    COMPLETED
    POD captured
    HU variance calculated (expected vs received)
    Dispatch moves to: reconciled / needs exception
```

**HU Variance:**
- If `receivedHUs === expectedHUs` → pass, proceed to reconciliation
- If `receivedHUs < expectedHUs` → shortage exception raised
- If `receivedHUs > expectedHUs` → overage noted, investigated

---

## 6. Exception Management Flow

### Exception Lifecycle

```
OPEN → ASSIGNED → IN_PROGRESS → [RESOLVED / ESCALATED / PENDING_INFO]
                                       │
                                       ▼
                                    CLOSED / AUTO_RESOLVED
```

### Step-by-Step

**Raise Exception**
1. Exception raised by: System (auto, e.g. SLA breach) or Operator (manual)
2. Category assigned (e.g. `VEHICLE_BREAKDOWN`)
3. Severity assessed (`critical` / `high` / `medium`)
4. Exception enters `OPEN` state

**Assignment**
1. CT operator views open exceptions in Exception Board (`/exceptions`)
2. Assigns exception to themselves or another operator
3. Status moves to `ASSIGNED`

**Investigation**
1. Operator contacts carrier / driver
2. Records root cause
3. Status moves to `IN_PROGRESS`

**Escalation Path (if needed)**
1. If not resolved within threshold → status moves to `ESCALATED`
2. Escalation level promoted per delay minutes
3. Manager notified

**Resolution**
1. Operator documents resolution action
2. Status moves to `RESOLVED`
3. After validation → `CLOSED`

**Auto-Resolution**
1. If the underlying condition resolves (e.g. vehicle moves after breakdown) without operator action → `AUTO_RESOLVED`

---

## 7. Reconciliation Flow

### Post-Delivery Reconciliation (`/reconciliation`)

```
Dispatch Arrives & Unloaded
         │
         ▼
Reconciliation Record Created (status: pending)
         │
         ▼ Operator opens record
In Progress
    - Compare expected HUs vs received HUs
    - Compare expected weight vs received weight
    - Review invoice vs POD
         │
         ├── No variance → COMPLETED
         │
         └── Variance found:
                  ├── Shortage → raise Shortage Exception
                  ├── Damage  → raise Damage Exception
                  └── Dispute → status: DISPUTED
                                  │
                                  ▼ After resolution
                                COMPLETED
```

**Financial Summary:**
- Freight cost locked to dispatch record
- Shortage value = (shortage HU count × per-unit value)
- Damage value estimated by field team
- Disputed amount held pending investigation

---

## 8. Global Filter Flow

The global filter bar appears at the top of every page. Changing a filter immediately updates all visible data with no page reload.

```
User Changes Region or Date Range
         │
         ▼
GlobalFilterBar dispatches action to FilterContext
         │
         ▼
FilterContext updates state via useReducer
         │
         ▼
All components subscribed via useActiveFilters() re-render:
    ├── useMemo [region, dateRange] → recomputes baseList
    ├── Downstream useMemos → recompute filtered, KPIs, badge counts
    └── Charts, tables, KPI cards all reflect new data
```

**What updates:**
- All KPI cards and KPI strips
- All data tables (with new row counts)
- All charts and sparklines
- All status tab badge counts
- Dispatch Funnel counts
- Exception counts
- Alert counts

**What does NOT update:**
- Analytics tab charts (pre-aggregated static data in v1.0)
- Master data screens (configuration, not operational data)

---

## 9. Alert Rail Flow

The Global Alert Rail is a slide-over panel accessible from the bell icon in the top navigation bar.

```
New Alert Added (via AlertContext.addAlert)
         │
         ├── If severity === 'critical' → Rail auto-opens
         │
         ▼
Rail shows unread alerts sorted by severity → firedAt
         │
         ▼
Operator clicks alert → opens full CT Alerts page (/alerts)
         │
         ▼
Operator acknowledges → alert removed from unread count
         │
         ▼
Nav sidebar badge for affected module decrements
```

**Module → Alert Type Routing:**

| Alert Type                  | Nav Badge Module |
|-----------------------------|------------------|
| `SLA_BREACH`                | alerts           |
| `HIGH_RISK`                 | operations       |
| `ESCALATED_EXCEPTION`       | exceptions       |
| `OVERDUE_RECONCILIATION`    | recon            |
| `INTEGRATION_FAILURE`       | admin            |

---

## 10. Load Planning Process

### Capacity Matching

```
Planner views Pending Loads (sorted: Critical → High → Normal → earliest deadline)
         │
         ▼
For each pending load:
    - Check weight requirement vs vehicle capacity (kg)
    - Check volume requirement vs vehicle capacity (cbm)
    - Check vehicle availability status = 'available'
    - Check vehicle location matches or is near origin
         │
         ▼
Match found → Create Load Plan
    - Link load IDs to vehicle ID
    - Set plannedDeparture, plannedArrival, routeCode
    - Estimate freightCost
    - Status: draft → confirmed → dispatched
         │
         ▼
Confirmed Load Plan → Dispatch Record Created
```

**KPI Impact (from filtered data):**
- Available Vehicles: `filter(v => v.availability === 'available').length`
- Pending Loads: `filter(l => !l.assignedVehicleId).length`
- Critical Loads: `filter(l => l.priority === 'critical').length`
- Avg Utilization: mean of `v.utilizationPct` across filtered vehicles
- In Maintenance: `filter(v => v.availability === 'maintenance').length`
- Plans Today: `filter(p => p.status !== 'cancelled').length`
