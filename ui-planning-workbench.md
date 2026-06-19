# Enterprise Transport Control Tower — Planning & Optimization Workbench
## UI PHASE 6 · Load Planning & Optimization Design Specification

**Persona primary:** Transport Manager · Regional Manager
**Persona secondary:** Supply Chain Head · Operations Executive
**Routes covered:** `/planning/*`
**Data sources:** `CapacityEngine` · `ConsolidationEngine` · `RouteOptimizer` · `CostEngine`
**               :** `ScenarioSimulator` · `VehicleRecommendationEngine` · `RoutePerformanceScorer` · `PlanningAnalytics`
**Design reference:** Blue Yonder Transportation Planning · Oracle OTM Load Builder · SAP TM Freight Order Planning · Llamasoft Supply Chain Guru

---

## PLANNING WORKBENCH DESIGN PRINCIPLES

```
DESIGN PHILOSOPHY:
  This is a decision-support workbench, not just a dashboard.
  Every screen answers: "What should I do, and why?"
  Data drives action → recommendations lead to one-click execution.

LAYOUT PATTERN:
  "Split Configurator" — left panel (inputs/controls) + right panel (results/preview)
  Left panel: 35–40% width, scrollable, form-like
  Right panel: 60–65% width, visual output (charts, maps, tables)
  Both panels scroll independently — controls stay visible as results grow

INTERACTION MODEL:
  1. Operator sets planning parameters (left panel)
  2. Engine runs (right panel shows results in real-time / on-trigger)
  3. Operator reviews recommendation
  4. One-click "Apply" or "Create Dispatch from Plan"

COLOR TOKENS (planning-specific, extends base system):
  --plan-optimal:    #16A34A   (green  — optimal choice, recommended)
  --plan-good:       #65A30D   (lime   — good, acceptable)
  --plan-neutral:    #2563EB   (blue   — neutral, informational)
  --plan-caution:    #D97706   (amber  — caution, tradeoff exists)
  --plan-poor:       #DC2626   (red    — poor, avoid)
  --plan-scenario-a: #7C3AED   (violet — Scenario A: lowest cost)
  --plan-scenario-b: #2563EB   (blue   — Scenario B: balanced)
  --plan-scenario-c: #D97706   (amber  — Scenario C: fastest)
  --util-high:       #16A34A   (>80% utilization — good)
  --util-mid:        #D97706   (60–80% — acceptable)
  --util-low:        #DC2626   (<60% — below minimum threshold)

VEHICLE TYPE MASTER (from Step 5 VEHICLE_TYPES):
  LCV:     maxWeight 1500kg   maxCbm 8    maxHU 30    baseCost ₹18/km
  20ft:    maxWeight 5000kg   maxCbm 28   maxHU 80    baseCost ₹28/km
  26ft:    maxWeight 7500kg   maxCbm 42   maxHU 120   baseCost ₹35/km
  32ft:    maxWeight 10000kg  maxCbm 62   maxHU 180   baseCost ₹42/km
  Trailer: maxWeight 25000kg  maxCbm 120  maxHU 400   baseCost ₹65/km

CARRIER SURCHARGE FACTORS (from Step 5 CARRIER_SURCHARGE):
  Express: ×1.35   FTL: ×1.00   LTL: ×0.85   3PL: ×1.10
```

---

## TABLE OF CONTENTS

1. [Planning Shell Layout](#1-planning-shell-layout)
2. [Screen 1 — Load Planning Screen](#2-screen-1--load-planning-screen)
3. [Screen 2 — Vehicle Utilization Dashboard](#3-screen-2--vehicle-utilization-dashboard)
4. [Screen 3 — Consolidation Suggestions](#4-screen-3--consolidation-suggestions)
5. [Screen 4 — Route Optimization Dashboard](#5-screen-4--route-optimization-dashboard)
6. [Screen 5 — Cost vs SLA Simulator](#6-screen-5--cost-vs-sla-simulator)
7. [Screen 6 — Vehicle Recommendation Panel](#7-screen-6--vehicle-recommendation-panel)
8. [Screen 7 — Planning Analytics Dashboard](#8-screen-7--planning-analytics-dashboard)
9. [React Component Hierarchy](#9-react-component-hierarchy)
10. [Shared Planning Components](#10-shared-planning-components)
11. [UX Interactions & Simulation Flows](#11-ux-interactions--simulation-flows)
12. [Data Contracts](#12-data-contracts)

---

## 1. PLANNING SHELL LAYOUT

### 1.1 Planning Context Bar

```
╔══════════════════════════════════════════════════════════════════════════════════╗
║  PLANNING CONTEXT BAR                                         [always visible]  ║
║  ┌──────────────┬──────────────┬──────────────┬──────────────┬────────────────┐║
║  │ OPEN LOADS   │ PLANNED TODAY│ AVG UTIL     │ PENDING CONS.│ SAVINGS AVAIL  ║
║  │ (unplanned)  │              │ (dispatched) │ OPPORTUNITY  │ (if optimized) ║
║  │     8 ASNs   │  12 dispatch │    71%       │  3 groups    │  ₹18,400       ║
║  └──────────────┴──────────────┴──────────────┴──────────────┴────────────────┘║
╚══════════════════════════════════════════════════════════════════════════════════╝
```

### 1.2 Planning Sub-Navigation

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│  [Load Planning]  [Utilization]  [Consolidation]  [Route Optimization]          │
│  [Simulator]  [Vehicle Reco.]  [Analytics]                [+ New Plan ▶]        │
└──────────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. SCREEN 1 — LOAD PLANNING SCREEN

**Route:** `/planning/load`
**Engine:** `CapacityEngine` · `VehicleRecommendationEngine`
**Purpose:** Build a dispatch plan from scratch — select loads, assign vehicle, confirm capacity

### 2.1 Full Screen Wireframe (1280px)

```
╔══════════════════════════════════════════════════════════════════════════════════════════╗
║  LOAD PLANNING                                          [💾 Save Draft]  [▶ Create Dispatch]║
╠══════════════════════════════════════════════════════════════════════════════════════════╣
║  PLANNING CONTEXT BAR                                                                    ║
╠══════════════════════════════════════════════════════════════════════════════════════════╣
║                                                                                          ║
║  LEFT PANEL (38%) — LOAD BUILDER           RIGHT PANEL (62%) — PLAN PREVIEW            ║
║  ───────────────────────────────────       ────────────────────────────────────────     ║
║                                                                                          ║
║  ┌── 1. SELECT ROUTE ─────────────────┐   ┌── CAPACITY METER ───────────────────────┐  ║
║  │  Route:  [DEL-MUM-01 ▼]            │   │  WEIGHT   ██████████████░░░░░░  70%     │  ║
║  │  From:   DC Delhi                  │   │           7,000 / 10,000 kg             │  ║
║  │  To:     DC Mumbai                 │   │                                          │  ║
║  │  Distance: 1,420 km                │   │  VOLUME   ████████████░░░░░░░░  55%     │  ║
║  │  SLA Window: 10h                   │   │           34 / 62 CBM                   │  ║
║  └────────────────────────────────────┘   │                                          │  ║
║                                           │  HU COUNT ████████████████░░░░  78%     │  ║
║  ┌── 2. SELECT VEHICLE ───────────────┐   │           140 / 180 HUs                 │  ║
║  │  Type:   [32ft Truck ▼]            │   │                                          │  ║
║  │          [Auto-recommend ✓]        │   │  OVERALL UTIL:    70%                   │  ║
║  │                                    │   │  BINDING METRIC:  HU count              │  ║
║  │  Reg No: [MH-01-AX-2341      ]    │   │  STATUS:  🟡 GOOD — above min 60%       │  ║
║  │  Carrier:[BlueDart FTL ▼]          │   └──────────────────────────────────────────┘  ║
║  │  Surcharge factor: ×1.00 (FTL)    │                                                  ║
║  └────────────────────────────────────┘   ┌── VEHICLE SPEC ────────────────────────┐  ║
║                                           │  🚛 32ft Truck (FTL)                    │  ║
║  ┌── 3. LOADS TO INCLUDE ─────────────┐   │  Max Weight: 10,000 kg  ✅ Within       │  ║
║  │  [Search loads... 🔍]              │   │  Max Volume: 62 CBM      ✅ Within       │  ║
║  │  [+ Add by ASN]  [+ Add by Route]  │   │  Max HU:     180         ✅ Within       │  ║
║  │                                    │   │  Base Cost:  ₹42/km × 1,420km = ₹59,640│  ║
║  │  ┌───────────────────────────────┐ │   │  Fixed Cost: ₹2,100/day                 │  ║
║  │  │ ☑ ASN-2024-0918  42 HU  2,800kg│ │   │  Total est.: ₹61,740                   │  ║
║  │  │   DEL → MUM  •  INV-1203      │ │   └────────────────────────────────────────┘  ║
║  │  │ ☑ ASN-2024-0919  38 HU  1,900kg│ │                                                ║
║  │  │   DEL → MUM  •  INV-1204      │ │   ┌── COST BREAKDOWN ───────────────────────┐  ║
║  │  │ ☑ ASN-2024-0920  60 HU  2,300kg│ │   │  Base (₹42/km × 1420km)   ₹59,640      │  ║
║  │  │   DEL → MUM  •  INV-1209      │ │   │  Fixed / day               ₹ 2,100      │  ║
║  │  │ ☐ ASN-2024-0921  22 HU    900kg│ │   │  Carrier surcharge (×1.00) ₹     0      │  ║
║  │  │   DEL → MUM  •  INV-1210 SKIP │ │   │  ──────────────────────────────────     │  ║
║  │  │   (over capacity if added)    │ │   │  TOTAL ESTIMATED            ₹61,740      │  ║
║  │  └───────────────────────────────┘ │   │  Per HU:                    ₹  441       │  ║
║  │                                    │   │  Per km:                    ₹43.48       │  ║
║  │  SELECTED: 140 HUs  7,000 kg  34CBM│   └────────────────────────────────────────┘  ║
║  │  [Clear All]  [Auto-fill Capacity] │                                                  ║
║  └────────────────────────────────────┘   ┌── OVERLOAD CHECK ──────────────────────┐  ║
║                                           │  CapacityEngine.isOverloaded() = false  │  ║
║  ┌── 4. DEPARTURE DETAILS ────────────┐   │  ✅ Safe to dispatch                    │  ║
║  │  Date:    [18 Jun 2026  📅]         │   │                                          │  ║
║  │  Time:    [08:00      🕗]           │   │  If ASN-2024-0921 added:                │  ║
║  │  Driver:  [Select... ▼]            │   │  ❌ Weight: 7,900kg — OVER by 0%        │  ║
║  │  Gate:    [Gate 3 ▼]               │   │  ❌ HU: 162 — OVER capacity             │  ║
║  └────────────────────────────────────┘   │  → Recommend: Trailer or split load     │  ║
║                                           └────────────────────────────────────────┘  ║
║  ┌─────────────────────────────────────────────────────────────────────────────────┐  ║
║  │          [💾 Save Draft]   [↺ Reset]          [▶ Create Dispatch Plan]          │  ║
║  └─────────────────────────────────────────────────────────────────────────────────┘  ║
╚══════════════════════════════════════════════════════════════════════════════════════════╝
```

---

### 2.2 Load Builder Interactions

```
ROUTE SELECT:
  On change → RouteOptimizer.getForRoute(routeId) loads available loads
  Distance, SLA window auto-populate from route master
  [View Route Performance →] opens Route Optimization Dashboard for that route

VEHICLE TYPE SELECT:
  [Auto-recommend ✓] toggled on by default
  When on: VehicleRecommendationEngine.recommend(loads) runs on load change
  Recommended type highlighted in dropdown with ★ label
  Manual override: user can pick any type; shows delta vs recommendation

LOAD ITEM (in list):
  ☑ checkbox to include/exclude
  Shows: ASN number, HU count, weight, route, invoice ref
  Disabled with reason if adding would breach capacity:
    "Over capacity if added — see overload check →"
    Shown in amber/red with tooltip explaining which metric is breached

AUTO-FILL CAPACITY:
  [Auto-fill Capacity] → ConsolidationEngine-style algorithm
  Fills loads in order of HU count (largest first) until binding metric ≥ 85%
  Checkboxes update visually one by one (50ms stagger, satisfying animation)

CAPACITY METER LIVE UPDATE:
  Each checkbox toggle → CapacityEngine.calculate(selectedLoads, vehicleType) runs
  Bars animate to new width (200ms)
  Status label updates: <60% = red, 60–80% = amber, >80% = green
  Overall % recalculates from binding metric
```

---

### 2.3 Create Dispatch Confirmation Modal

```
┌── CREATE DISPATCH FROM PLAN ────────────────────────────────────────────────────┐
│                                                                                   │
│  PLAN SUMMARY                                                                     │
│  ─────────────────────────────────────────────────────────────────────────────   │
│  Route:       DEL-MUM-01  •  Delhi DC → Mumbai DC                                │
│  Vehicle:     32ft Truck  •  MH-01-AX-2341  •  BlueDart FTL                     │
│  Departure:   18 Jun 2026  08:00                                                  │
│  HU Count:    140  (78% capacity)                                                 │
│  Weight:      7,000 kg  (70% capacity)                                            │
│  Volume:      34 CBM  (55% capacity)                                              │
│  Est. Cost:   ₹61,740                                                             │
│  Loads:       ASN-2024-0918, ASN-2024-0919, ASN-2024-0920  (3 ASNs)             │
│                                                                                   │
│  DISPATCH ID will be auto-generated: TCT-XXXX                                    │
│                                                                                   │
│  ☑  Send ASN to carrier (BlueDart)                                               │
│  ☑  Notify driver assignment                                                      │
│  ☐  Create gate pass now                                                          │
│                                                                                   │
│  [Cancel]                                         [✅ Create Dispatch]           │
└───────────────────────────────────────────────────────────────────────────────────┘

ON CREATE:
  LifecycleEngine creates dispatch in 'planned' state
  HURegistry.registerLoading() for all selected HU barcodes
  CarrierAdapter.createShipment() for integration
  DomainEventBus.emit('DispatchPlanned')
  Navigates to /dispatch/:newId (Dispatch Detail Screen)
  Success toast: "Dispatch TCT-0089 created — Route DEL-MUM-01, 140 HUs"
```

---

## 3. SCREEN 2 — VEHICLE UTILIZATION DASHBOARD

**Route:** `/planning/utilization`
**Engine:** `CapacityEngine.forDispatch()` · `PlanningAnalytics`
**Purpose:** Fleet-wide utilization view — identify over/under-loaded dispatches

### 3.1 Full Screen Wireframe

```
╔══════════════════════════════════════════════════════════════════════════════════════╗
║  VEHICLE UTILIZATION DASHBOARD                        [⬇ Export]  [⚙ Thresholds]   ║
╠══════════════════════════════════════════════════════════════════════════════════════╣
║  PLANNING CONTEXT BAR                                                                ║
╠══════════════════════════════════════════════════════════════════════════════════════╣
║                                                                                      ║
║  FILTER: Period [Today ▼]  Route [All ▼]  Carrier [All ▼]  Status [All ▼]          ║
║                                                                                      ║
║  ┌── FLEET UTILIZATION KPI TILES ─────────────────────────────────────────────────┐ ║
║  │ ┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐ ┌────────────┐ │ ║
║  │ │  AVG UTILIZATION │ │ OPTIMAL (>80%)   │ │ ACCEPTABLE(60-80)│ │ POOR (<60%)│ │ ║
║  │ │       71%        │ │   4 dispatches   │ │   5 dispatches   │ │ 3 dispatches│ │ ║
║  │ │   ──────────     │ │   33% of fleet   │ │   42% of fleet   │ │ 25% of fleet│ │ ║
║  │ │   Trend: ↑+3%    │ │   [View →]       │ │   [View →]       │ │ [Act →]    │ │ ║
║  │ └──────────────────┘ └──────────────────┘ └──────────────────┘ └────────────┘ │ ║
║  └─────────────────────────────────────────────────────────────────────────────────┘ ║
║                                                                                      ║
║  ┌── UTILIZATION DISTRIBUTION CHART ──────────────────────────────────────────────┐ ║
║  │  Dispatches by Utilization Band                                                  │ ║
║  │                                                                                  │ ║
║  │  <40%  │ ▓ 1                                                                    │ ║
║  │  40-50% │ ▓▓ 2                                                                  │ ║
║  │  50-60% │ ▓▓▓▓▓ 5      ← POOR ZONE (red)                                       │ ║
║  │  60-70% │ ▓▓▓▓▓▓▓▓ 8   ← ACCEPTABLE (amber)                                    │ ║
║  │  70-80% │ ▓▓▓▓▓▓ 6     ← ACCEPTABLE (amber)                                    │ ║
║  │  80-90% │ ▓▓▓▓ 4       ← OPTIMAL (green)                                       │ ║
║  │  90-100%│ ▓▓ 2         ← OPTIMAL (green)                                       │ ║
║  │         └─────────────────────────────────                                      │ ║
║  │         0    2    4    6    8    10                                              │ ║
║  └──────────────────────────────────────────────────────────────────────────────────┘ ║
║                                                                                      ║
║  ┌── DISPATCH UTILIZATION TABLE ──────────────────────────────────────────────────┐ ║
║  │  Sort: [Utilization ↑ worst first ▼]                          [🔍 Search]      │ ║
║  │                                                                                  │ ║
║  │  Dispatch  Route      Vehicle  Weight%  Volume%  HU%   Overall  Binding  Action │ ║
║  │  ─────────────────────────────────────────────────────────────────────────────  │ ║
║  │  TCT-0088  DEL-HYD   32ft    ██ 28%   █ 22%   ██ 35%  35%🔴  Weight   [Fix]   │ ║
║  │  TCT-0072  BOM-PUN   26ft    ███ 40%  ██ 38%  ███ 42%  42%🔴  HU       [Fix]   │ ║
║  │  TCT-0081  DEL-BLR   32ft    ████55%  ████52%  ████58%  58%🟡  Volume   [View]  │ ║
║  │  TCT-0019  DEL-MUM   32ft    ███████70%  █████55% ██████78% 78%🟢  HU       [—]   │ ║
║  │  TCT-0031  DEL-MUM   32ft    ████████84% ██████78% ████████87% 87%🟢  HU       [—]   │ ║
║  │  TCT-0009  BOM-PUN   20ft    ██████████96%  ██████████91% ██████████95% 96%🟢  Weight [—]   │ ║
║  │  [+ 6 more]                                                                      │ ║
║  └──────────────────────────────────────────────────────────────────────────────────┘ ║
║                                                                                      ║
║  ┌── OPTIMIZATION OPPORTUNITIES (POOR UTILIZATION) ───────────────────────────────┐ ║
║  │                                                                                  │ ║
║  │  TCT-0088  35% utilization — severely under-loaded                               │ ║
║  │  Suggestion: Downsize to 20ft truck. Save ₹8,200. [Apply Downsize →]            │ ║
║  │                                                                                  │ ║
║  │  TCT-0072  42% utilization — under-loaded                                        │ ║
║  │  Suggestion: Merge with TCT-0081 (same route, same day). [View Consolidation →] │ ║
║  │                                                                                  │ ║
║  └──────────────────────────────────────────────────────────────────────────────────┘ ║
╚══════════════════════════════════════════════════════════════════════════════════════════╝
```

---

### 3.2 Dispatch Utilization Row Specification

```
UTILIZATION BAR (inline, per metric):
  Width proportional to utilization %
  Color: red (<60%), amber (60–80%), green (>80%)
  3 bars per row (weight, volume, HU), compact height 8px

OVERALL UTILIZATION:
  = max(weight%, volume%, HU%) — binding metric drives the vehicle
  BINDING METRIC: whichever dimension is highest % (limits capacity)

ROW CLICK → opens Utilization Detail Panel (right side, 400px):
  Full CapacityEngine.forDispatch(id) result
  Load list with per-load contribution to each dimension
  Vehicle spec comparison: current vs next size up/down
  [Downsize Vehicle ▶] or [Upsize Vehicle ▶] action buttons

[Fix] BUTTON ACTION (for poor utilization rows):
  Opens suggestion modal:
  ┌──────────────────────────────────────────────────────────────────────┐
  │  Improve Utilization — TCT-0088                                       │
  │  Current: 35%  •  32ft Truck  •  28/42/35% W/V/HU                   │
  │  ──────────────────────────────────────────────────────────────────   │
  │  OPTION A: Downsize to 20ft Truck                                    │
  │    New util: 88%  •  Cost saving: ₹8,200  [Apply →]                 │
  │                                                                        │
  │  OPTION B: Add loads from same route (3 unplanned ASNs available)    │
  │    New util: 82%  •  No cost change  [Add Loads →]                   │
  │                                                                        │
  │  OPTION C: Merge with TCT-0081 (departs 1h later, same route)        │
  │    Cancel TCT-0088, add its loads to TCT-0081  [View Merge →]        │
  │                                                                        │
  │  [Cancel — keep as-is]                                                │
  └──────────────────────────────────────────────────────────────────────┘
```

---

### 3.3 Utilization Heatmap (alternate view)

```
[⊞ Table View]  [🔲 Heatmap View]   ← toggle top-right

HEATMAP VIEW (route × vehicle type):
  Rows:    Routes (DEL-MUM-01, BOM-PUN-03, DEL-HYD-02 ...)
  Columns: Vehicle types (LCV, 20ft, 26ft, 32ft, Trailer)
  Cells:   Avg utilization for that route-vehicle combo (last 30d)
  Color:   Heatmap scale: red (0%) → yellow (60%) → green (100%)

  ┌──────────────┬──────┬──────┬──────┬──────┬──────────┐
  │ ROUTE        │ LCV  │ 20ft │ 26ft │ 32ft │ Trailer  │
  ├──────────────┼──────┼──────┼──────┼──────┼──────────┤
  │ DEL-MUM-01   │ —    │ 68%🟡│ 74%🟡│ 82%🟢│  91%🟢   │
  │ BOM-PUN-03   │ 71%🟡│ 88%🟢│ 79%🟡│ 58%🔴│   —      │
  │ DEL-HYD-02   │ —    │ 52%🔴│ 91%🟢│ 76%🟡│   —      │
  │ MAA-BLR-01   │ —    │ —    │ 64%🟡│ 88%🟢│  78%🟡   │
  └──────────────┴──────┴──────┴──────┴──────┴──────────┘

  Cell click → drill to dispatch list for that route-vehicle combo
  "—" = no dispatches for this combination in period
```

---

## 4. SCREEN 3 — CONSOLIDATION SUGGESTIONS

**Route:** `/planning/consolidation`
**Engine:** `ConsolidationEngine` (6-hour sliding window grouping, min util 60%)
**Purpose:** Surface LTL→FTL consolidation opportunities across planned dispatches

### 4.1 Full Screen Wireframe

```
╔══════════════════════════════════════════════════════════════════════════════════════╗
║  CONSOLIDATION SUGGESTIONS                      [↻ Refresh]  [⬇ Export]             ║
╠══════════════════════════════════════════════════════════════════════════════════════╣
║                                                                                      ║
║  CONSOLIDATION ENGINE SETTINGS:                                                      ║
║  Time Window: [6 hours ▼]   Min Utilization: [60% ▼]   Route: [All ▼]              ║
║  [▶ Re-Run Engine]                                                                   ║
║                                                                                      ║
║  ┌── SUMMARY BAR ─────────────────────────────────────────────────────────────────┐ ║
║  │  3 consolidation opportunities found  •  Potential saving: ₹24,600              │ ║
║  │  Dispatches can be reduced: 8 → 5  (3 fewer trucks)                             │ ║
║  └─────────────────────────────────────────────────────────────────────────────────┘ ║
║                                                                                      ║
║  ┌── CONSOLIDATION GROUP 1 ──────────────────────────────────────────────────────┐  ║
║  │  🟢 RECOMMENDED  •  DEL-MUM-01  •  18 Jun  08:00 – 14:00  (6h window)        │  ║
║  │                                                                                  │  ║
║  │  DISPATCHES TO MERGE:          COMBINED LOAD:      VEHICLE:                    │  ║
║  │  ┌───────────────────┐         Weight: 4,700 kg    ✅ 26ft Truck (sufficient)  │  ║
║  │  │ TCT-0088  35% util│         Volume: 29 CBM      Util after merge: 76% 🟡   │  ║
║  │  │ 28 HU  1,900 kg   │         HU: 92             (vs avg 36% before)          │  ║
║  │  │ Departs: 08:00    │                                                          │  ║
║  │  ├───────────────────┤         SAVINGS:                                         │  ║
║  │  │ TCT-0072  42% util│         Cancel: TCT-0072 (32ft → unused)                │  ║
║  │  │ 64 HU  2,800 kg   │         Save: ₹14,200 on TCT-0072 cancellation          │  ║
║  │  │ Departs: 10:30    │         Downsize: TCT-0088 to 26ft  Save: ₹3,100        │  ║
║  │  └───────────────────┘         TOTAL SAVING: ₹17,300                            │  ║
║  │                                                                                  │  ║
║  │  TRADEOFF:  TCT-0072 departs 2.5h later — loads will wait. SLA still met ✅   │  ║
║  │                                                                                  │  ║
║  │  [📊 View Detail]   [✅ Apply Consolidation]   [✗ Skip — Keep Separate]       │  ║
║  └────────────────────────────────────────────────────────────────────────────────┘  ║
║                                                                                      ║
║  ┌── CONSOLIDATION GROUP 2 ──────────────────────────────────────────────────────┐  ║
║  │  🟡 POSSIBLE  •  BOM-PUN-03  •  18 Jun  09:00 – 15:00  (6h window)           │  ║
║  │                                                                                  │  ║
║  │  DISPATCHES TO MERGE:  TCT-0074 (48%) + TCT-0076 (51%)                        │  ║
║  │  Combined util: 68% 🟡  •  Saving: ₹5,200  •  SLA: At risk — borderline ⚠   │  ║
║  │  Reason for risk: TCT-0076 departs 5.5h later. Merged ETA: +4h vs SLA 6h.    │  ║
║  │                                                                                  │  ║
║  │  [📊 View Detail]   [⚠ Apply with Risk Note]   [✗ Skip]                      │  ║
║  └────────────────────────────────────────────────────────────────────────────────┘  ║
║                                                                                      ║
║  ┌── CONSOLIDATION GROUP 3 ──────────────────────────────────────────────────────┐  ║
║  │  🔴 RISKY  •  DEL-BLR-03  •  18 Jun  07:00 – 13:00  (6h window)             │  ║
║  │                                                                                  │  ║
║  │  DISPATCHES TO MERGE:  TCT-0079 (38%) + TCT-0082 (44%)                        │  ║
║  │  Combined util: 64% 🟡  •  Saving: ₹2,100  •  SLA: HIGH BREACH RISK 🔴      │  ║
║  │  Reason: TCT-0082 departs at boundary of 6h window. ETA exceeds SLA by 2h.   │  ║
║  │                                                                                  │  ║
║  │  [📊 View Detail]   [✗ Skip — SLA breach risk too high]                       │  ║
║  └────────────────────────────────────────────────────────────────────────────────┘  ║
╚══════════════════════════════════════════════════════════════════════════════════════════╝
```

---

### 4.2 Consolidation Detail Panel

```
OPENS ON [📊 View Detail] — right side panel (560px wide) or full-screen modal on tablet:

┌── CONSOLIDATION DETAIL: GROUP 1 ──────────────────────────────────────────────────┐
│                                                                                    │
│  DISPATCH A: TCT-0088                    DISPATCH B: TCT-0072                    │
│  ─────────────────────────────           ─────────────────────────────           │
│  Route:    DEL-MUM-01                    Route:    DEL-MUM-01                    │
│  Departs:  18 Jun  08:00                 Departs:  18 Jun  10:30                 │
│  Vehicle:  32ft Truck (BlueDart)         Vehicle:  32ft Truck (BlueDart)         │
│  HU:       28   Weight: 1,900 kg         HU:       64   Weight: 2,800 kg         │
│  Util:     🔴 35%                        Util:     🔴 42%                        │
│                                                                                    │
│  ──────────────── MERGED PLAN ────────────────────────────────────────────────    │
│                                                                                    │
│  New Dispatch:  TCT-NEW  (merged)                                                  │
│  Vehicle:       26ft Truck  (downsized — sufficient for combined load)             │
│  Departure:     18 Jun  08:00  (earliest of two)                                  │
│  HU:            92   Weight: 4,700 kg   Volume: 29 CBM                            │
│  Util:          76% 🟡  (binding: HU)                                             │
│                                                                                    │
│  SLA ANALYSIS:                                                                     │
│  ┌────────────────────────────────────────────────────────────────────────────┐   │
│  │  Load from TCT-0072:  waits 2.5h extra (dep. delay 08:00→10:30 absorbed)  │   │
│  │  Route SLA window:    10 hours                                              │   │
│  │  ETA impact:          +0h (departure same as TCT-0088, SLA unaffected)     │   │
│  │  SLA STATUS:          ✅  Both loads meet SLA                               │   │
│  └────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                    │
│  COST COMPARISON:                                                                  │
│  ┌────────────────────────────────────────────────────────────────────────────┐   │
│  │                Before              After              Saving                │   │
│  │  TCT-0088      ₹59,640 (32ft)      ₹44,380 (26ft)    ₹15,260              │   │
│  │  TCT-0072      ₹59,640 (cancel)    —                  ₹59,640 (cancelled) │   │
│  │  TCT-NEW       —                   ₹44,380 (new)     −₹44,380             │   │
│  │  ─────────────────────────────────────────────────────────────             │   │
│  │  NET SAVING:                                          ₹17,300 (27%)       │   │
│  └────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                    │
│  [✗ Cancel]          [⚠ Apply with Risk Note]      [✅ Apply Consolidation]      │
└────────────────────────────────────────────────────────────────────────────────────┘

APPLY CONSOLIDATION FLOW:
  ConfirmModal → "This will cancel TCT-0072 and modify TCT-0088. Continue?"
  On confirm:
    LifecycleEngine cancels TCT-0072
    CapacityEngine updates TCT-0088 with merged loads
    Vehicle downsized (VehicleRecommendationEngine.recommend)
    DomainEventBus.emit('DispatchConsolidated')
    CarrierAdapter notified of vehicle change
  Success toast: "Consolidation applied — ₹17,300 saved. TCT-0072 cancelled."
```

---

## 5. SCREEN 4 — ROUTE OPTIMIZATION DASHBOARD

**Route:** `/planning/routes`
**Engine:** `RoutePerformanceScorer` · `RouteOptimizer` · `PlanningAnalytics`
**Purpose:** Performance grading and optimization recommendations per route

### 5.1 Full Screen Wireframe

```
╔══════════════════════════════════════════════════════════════════════════════════════╗
║  ROUTE OPTIMIZATION DASHBOARD                          [⬇ Export]  [⚙ Weights]     ║
╠══════════════════════════════════════════════════════════════════════════════════════╣
║                                                                                      ║
║  FILTER: Period [Last 30 days ▼]  Region [All ▼]  Min Dispatches [5 ▼]             ║
║                                                                                      ║
║  ┌── ROUTE PERFORMANCE TABLE ─────────────────────────────────────────────────────┐ ║
║  │                                                                                  │ ║
║  │  Route      Grade  Reliability SLA%   Delay  Cost   Reconcil.  Score  Action   │ ║
║  │  ─────────────────────────────────────────────────────────────────────────────  │ ║
║  │  DEL-MUM-01  🅐     96%       94%   4.2min ₹41/km  98.2%      91    [Detail]  │ ║
║  │  BOM-PUN-03  🅑     91%       89%   12min  ₹38/km  96.8%      78    [Detail]  │ ║
║  │  DEL-HYD-02  🅒     84%       82%   22min  ₹45/km  94.1%      67    [Detail]  │ ║
║  │  MAA-BLR-01  🅒     81%       80%   28min  ₹44/km  93.5%      63    [Detail]  │ ║
║  │  DEL-BLR-03  🅓     72%       68%   44min  ₹52/km  91.0%      54    [Detail]  │ ║
║  │  HYD-BOM-02  🅔     61%       58%   72min  ₹61/km  88.4%      42    [Detail]  │ ║
║  │                                                                                  │ ║
║  │  [Showing 6 of 12 routes]  [Load All]                                           │ ║
║  └──────────────────────────────────────────────────────────────────────────────────┘ ║
║                                                                                      ║
║  ┌── LEFT: SCORE RADAR (40%) ─────────────────┐ ┌── RIGHT: ROUTE DRILL (60%) ──────┐║
║  │                                             │ │                                   │║
║  │  SELECTED ROUTE: DEL-MUM-01                 │ │  DEL-MUM-01  GRADE: 🅐  Score: 91 │║
║  │                                             │ │                                   │║
║  │         Reliability (25%)                   │ │  DIMENSION BREAKDOWN:             │║
║  │              96%                            │ │  ┌─────────────────────────────┐  │║
║  │             /    \                          │ │  │ Reliability    96%  ████████│  │║
║  │  Reconcil. ──── SLA (30%)                  │ │  │ SLA Compliance 94%  ████████│  │║
║  │  (10%) 98%      94%                        │ │  │ Delay Score    4.2m ████████│  │║
║  │             \    /                          │ │  │ Cost Eff.     ₹41   ███████ │  │║
║  │     Cost(15%)──Delay(20%)                  │ │  │ Reconciliation 98%  █████████│  │║
║  │         ₹41    4.2min                      │ │  └─────────────────────────────┘  │║
║  │                                             │ │                                   │║
║  │  [SVG Radar Chart]                          │ │  TREND (last 6 months):           │║
║  │  Pentagon shape, each vertex =              │ │  Score: 88 → 89 → 91 → 91 ↑      │║
║  │  one of 5 dimensions                        │ │  Grade: B → B → A → A  ✅         │║
║  │  Filled polygon, color = grade              │ │                                   │║
║  │                                             │ │  TOP CARRIERS ON THIS ROUTE:      │║
║  │                                             │ │  BlueDart   OTA 96%  Score 94     │║
║  │                                             │ │  DTDC       OTA 89%  Score 78     │║
║  │                                             │ │                                   │║
║  │                                             │ │  OPTIMIZATION SUGGESTIONS:        │║
║  │                                             │ │  ✅ No issues — top performer     │║
║  │                                             │ │  Consider increasing vol: +15%    │║
║  │                                             │ │  capacity available               │║
║  └─────────────────────────────────────────────┘ └────────────────────────────────────┘║
╚══════════════════════════════════════════════════════════════════════════════════════════╝
```

---

### 5.2 Grade Badge Specification

```
GRADE BADGE (RoutePerformanceScorer.score(routeId) → grade A–F):
  Score 90–100 = 🅐  bg: #16A34A  text: white  label: "A — Top Performer"
  Score 80–89  = 🅑  bg: #65A30D  text: white  label: "B — Good"
  Score 70–79  = 🅒  bg: #D97706  text: white  label: "C — Average"
  Score 60–69  = 🅓  bg: #EA580C  text: white  label: "D — Below Average"
  Score 50–59  = 🅔  bg: #DC2626  text: white  label: "E — Poor"
  Score <50    = 🅕  bg: #7F1D1D  text: white  label: "F — Failing"

GRADE BADGE SIZES:
  sm: 24×24px circle, bold letter, 14px font — used in tables
  md: 36×36px circle, 18px font — used in drill panels
  lg: 52×52px circle, 28px font — used in detail headers

SCORE RADAR SVG SPEC:
  Pentagon (5 vertices), centered at 0,0 radius 100
  Vertex order: Reliability (top) → SLA (right) → Delay (bottom-right)
               → Cost (bottom-left) → Reconciliation (left)
  Background: gray pentagon at 100% (reference)
  Data polygon: filled at dimension score%, color = grade color, opacity 0.4
  Data polygon stroke: grade color, 2px
  Vertex dots: 6px circles, grade color
  Labels: 12px, outside pentagon, each dimension + score%
  Animate: polygon draws in (stroke-dashoffset, 600ms, ease-out)
```

---

### 5.3 Score Dimension Weights Configuration

```
[⚙ Weights] MODAL:
  Allows Supply Chain Head to adjust dimension weights:

  ┌──────────────────────────────────────────────────────────────────┐
  │  Score Dimension Weights         Total must = 100%               │
  │  ─────────────────────────────────────────────────────────────   │
  │  Reliability:       [25 %] ────────────────────────────────────  │
  │  SLA Compliance:    [30 %] ────────────────────────────────────  │
  │  Delay Score:       [20 %] ────────────────────────────────────  │
  │  Cost Efficiency:   [15 %] ────────────────────────────────────  │
  │  Reconciliation:    [10 %] ────────────────────────────────────  │
  │                     ──────                                       │
  │  Total:             100%  ✅                                     │
  │                                                                   │
  │  [Reset to Defaults]              [Save Weights & Recalculate]   │
  └──────────────────────────────────────────────────────────────────┘

Weights stored in localStorage: tct_route_score_weights
Changing weights → RoutePerformanceScorer.score() recalculates all routes
Table re-renders with new scores and grades (animate score change)
```

---

## 6. SCREEN 5 — COST VS SLA SIMULATOR

**Route:** `/planning/simulator`
**Engine:** `ScenarioSimulator.simulate(load, routeId, carrierIds)` → 3 scenarios
**Purpose:** Run A/B/C scenario comparison before committing to a dispatch plan

### 6.1 Full Screen Wireframe

```
╔══════════════════════════════════════════════════════════════════════════════════════╗
║  COST vs SLA SIMULATOR                     [💾 Save Scenario]  [📊 Compare Mode]   ║
╠══════════════════════════════════════════════════════════════════════════════════════╣
║                                                                                      ║
║  ┌── SIMULATION INPUTS (LEFT 38%) ──────────┐  ┌── SCENARIO RESULTS (RIGHT 62%) ──┐ ║
║  │                                           │  │                                   │ ║
║  │  ROUTE                                    │  │  [Run Simulation ▶]  ← CTA        │ ║
║  │  [DEL-MUM-01 ▼]                          │  │  (appears until first run)        │ ║
║  │  Delhi DC → Mumbai DC  1,420 km           │  │                                   │ ║
║  │                                           │  │  ─ OR, after run: ─               │ ║
║  │  LOAD PARAMETERS                          │  │                                   │ ║
║  │  HU Count:   [140      ↕]                 │  │  THREE SCENARIO CARDS:            │ ║
║  │  Weight:     [7,000 kg ↕]                 │  │  See 6.2 below                    │ ║
║  │  Volume:     [34 CBM   ↕]                 │  │                                   │ ║
║  │  Priority:   [Standard ▼]                 │  └───────────────────────────────────┘ ║
║  │              [Express] [Standard] [Eco]   │                                        ║
║  │                                           │                                        ║
║  │  CARRIERS TO INCLUDE                      │                                        ║
║  │  ☑ BlueDart FTL                           │                                        ║
║  │  ☑ DTDC FTL                               │                                        ║
║  │  ☑ Delhivery LTL                          │                                        ║
║  │  ☐ XpressBees Express                     │                                        ║
║  │  [+ Add Carrier]                          │                                        ║
║  │                                           │                                        ║
║  │  VEHICLE TYPES TO CONSIDER                │                                        ║
║  │  ☑ 20ft  ☑ 26ft  ☑ 32ft  ☐ Trailer       │                                        ║
║  │  ☐ LCV                                    │                                        ║
║  │                                           │                                        ║
║  │  SLA CONSTRAINT                           │                                        ║
║  │  Required by:  [18 Jun  22:00  📅🕗]       │                                        ║
║  │  SLA window:   10h (auto from route)      │                                        ║
║  │  Hard constraint: ☑ (reject scenarios    │                                        ║
║  │                      that breach SLA)     │                                        ║
║  │                                           │                                        ║
║  │  COST WEIGHT vs SPEED WEIGHT              │                                        ║
║  │  Cost ←───────●───── Speed               │                                        ║
║  │  [0──────────50─────────100]              │                                        ║
║  │  Balanced  (50/50)                        │                                        ║
║  │                                           │                                        ║
║  │  [↺ Reset Inputs]  [▶ Run Simulation]     │                                        ║
║  └───────────────────────────────────────────┘                                        ║
╚══════════════════════════════════════════════════════════════════════════════════════════╝
```

---

### 6.2 Scenario Cards (after simulation runs)

```
AFTER SIMULATION — right panel fills with 3 scenario cards side-by-side:

╔═══════════════════════════════════════════════════════════════════════════════╗
║ SCENARIO A                SCENARIO B                SCENARIO C               ║
║ ─────────────────────     ─────────────────────     ─────────────────────   ║
║ [VIOLET] LOWEST COST      [BLUE] BALANCED            [AMBER] FASTEST         ║
╠═══════════════════════════════════════════════════════════════════════════════╣
║                                                                               ║
║ Carrier: Delhivery LTL    Carrier: BlueDart FTL      Carrier: XpressBees Exp ║
║ Vehicle: 26ft Truck       Vehicle: 32ft Truck         Vehicle: 32ft Truck    ║
║                                                                               ║
║ ┌─────────────────────┐  ┌─────────────────────┐  ┌─────────────────────┐  ║
║ │COST                 │  │COST                 │  │COST                 │  ║
║ │₹44,200              │  │₹61,740              │  │₹83,349              │  ║
║ │(LTL×0.85 factor)    │  │(FTL×1.00 factor)    │  │(Express×1.35 factor)│  ║
║ ├─────────────────────┤  ├─────────────────────┤  ├─────────────────────┤  ║
║ │ETA                  │  │ETA                  │  │ETA                  │  ║
║ │+2h vs fastest       │  │On schedule          │  │−2h vs standard      │  ║
║ │Arrives: 20:30       │  │Arrives: 18:30       │  │Arrives: 16:30       │  ║
║ ├─────────────────────┤  ├─────────────────────┤  ├─────────────────────┤  ║
║ │SLA STATUS           │  │SLA STATUS           │  │SLA STATUS           │  ║
║ │⚠ At Risk            │  │✅ Comfortable       │  │✅ Ample buffer      │  ║
║ │(1.5h before close)  │  │(3.5h buffer)        │  │(5.5h buffer)        │  ║
║ ├─────────────────────┤  ├─────────────────────┤  ├─────────────────────┤  ║
║ │UTILIZATION          │  │UTILIZATION          │  │UTILIZATION          │  ║
║ │76% (26ft)           │  │78% (32ft)           │  │78% (32ft)           │  ║
║ ├─────────────────────┤  ├─────────────────────┤  ├─────────────────────┤  ║
║ │CARRIER SCORE        │  │CARRIER SCORE        │  │CARRIER SCORE        │  ║
║ │Delhivery: 74/100    │  │BlueDart: 92/100     │  │XpressBees: 81/100   │  ║
║ │Route hist: 88% OTA  │  │Route hist: 96% OTA  │  │Route hist: 91% OTA  │  ║
║ ├─────────────────────┤  ├─────────────────────┤  ├─────────────────────┤  ║
║ │RISK LEVEL: 🟡 MED   │  │RISK LEVEL: 🟢 LOW   │  │RISK LEVEL: 🟢 LOW   │  ║
║ └─────────────────────┘  └─────────────────────┘  └─────────────────────┘  ║
║                                                                               ║
║ [Select A]               [⭐ Select B (Recommended)] [Select C]              ║
║ Save ₹17,540 vs B        Best overall balance         +₹21,609 vs B          ║
╚═══════════════════════════════════════════════════════════════════════════════╝

RECOMMENDED SCENARIO:
  Auto-highlighted based on Cost/Speed weight slider:
    Slider at 0 (cost) → Scenario A recommended
    Slider at 50 (balanced) → Scenario B recommended
    Slider at 100 (speed) → Scenario C recommended
  [⭐ Recommended] label on the recommended card
  Card border: 2px solid --plan-scenario-X color
  Non-recommended: 1px border, lower opacity

SCENARIO SELECTION:
  [Select A/B/C] → opens Load Planning Screen pre-filled with scenario params
  User can then [Create Dispatch] from the pre-filled plan
```

---

### 6.3 Cost Comparison Chart

```
BELOW SCENARIO CARDS — horizontal bar chart comparing all 3 scenarios:

┌── COST COMPARISON ─────────────────────────────────────────────────────────────┐
│                                                                                  │
│  Scenario A  ████████████████████████████████████████████░░  ₹44,200 (lowest)  │
│  Scenario B  ████████████████████████████████████████████████████████ ₹61,740  │
│  Scenario C  ████████████████████████████████████████████████████████████████  │
│              ████████████████████████████████  ₹83,349  (highest)              │
│                                                                                  │
│              [0]      [20k]     [40k]     [60k]    [80k]    [100k]              │
│                                                                                  │
│  ─────────────────────────────────────────────────────────────────────────────  │
│                                                                                  │
│  ETA COMPARISON (hours from departure):                                          │
│  Scenario A  ████████████████████████████████████████████████████████  12.5h   │
│  Scenario B  ██████████████████████████████████████████  10.5h                  │
│  Scenario C  ██████████████████████████████████  8.5h   (fastest)              │
│                                                                                  │
└──────────────────────────────────────────────────────────────────────────────────┘

SENSITIVITY ANALYSIS (below chart, collapsed by default — expand ▼):
  What if fuel cost increases 10%?
    A: ₹46,420  B: ₹64,828  C: ₹87,516  (all increase equally)
  What if carrier SLA clause ×1.5?
    A: SLA penalty ₹20k — net cost rises. B/C unaffected.
  [⬇ Download Full Analysis]
```

---

## 7. SCREEN 6 — VEHICLE RECOMMENDATION PANEL

**Route:** `/planning/vehicle-recommendation`
**Engine:** `VehicleRecommendationEngine.recommend(loads)`
**Purpose:** For a given set of loads, recommend the optimal vehicle type

### 7.1 Full Screen Wireframe

```
╔══════════════════════════════════════════════════════════════════════════════════════╗
║  VEHICLE RECOMMENDATION                                      [📊 Compare All]        ║
╠══════════════════════════════════════════════════════════════════════════════════════╣
║                                                                                      ║
║  LEFT PANEL (40%) — LOAD PARAMETERS      RIGHT PANEL (60%) — RECOMMENDATION        ║
║  ───────────────────────────────────     ───────────────────────────────────────   ║
║                                                                                      ║
║  ┌── LOAD INPUTS ─────────────────────┐  ┌── RECOMMENDATION RESULT ───────────────┐ ║
║  │                                    │  │                                          │ ║
║  │  LOAD DETAILS (enter or import):   │  │  ⭐ RECOMMENDED: 26ft Truck              │ ║
║  │                                    │  │                                          │ ║
║  │  HU Count:   [92        ↕]         │  │  ┌────────────────────────────────────┐ │ ║
║  │  Weight:     [4,700 kg  ↕]         │  │  │  Vehicle:    26ft Truck             │ │ ║
║  │  Volume:     [29 CBM    ↕]         │  │  │  Max Weight: 7,500 kg    ✅ 63% used│ │ ║
║  │                                    │  │  │  Max Volume: 42 CBM      ✅ 69% used│ │ ║
║  │  FROM DISPATCH: [TCT-0088 ▼] (opt) │  │  │  Max HU:     120         ✅ 77% used│ │ ║
║  │  [Auto-fill from dispatch]          │  │  │  Utilization: 77%  🟡 Good          │ │ ║
║  │                                    │  │  │  Est. Cost:  ₹44,380  (DEL-MUM-01) │ │ ║
║  │  ROUTE (for cost estimate):        │  │  │  Base: ₹35/km × 1,420km = ₹49,700  │ │ ║
║  │  [DEL-MUM-01 ▼]                   │  │  └────────────────────────────────────┘ │ ║
║  │                                    │  │                                          │ ║
║  │  CARRIER TYPE:                     │  │  WHY RECOMMENDED:                        │ ║
║  │  ○ FTL (×1.00)  ● LTL (×0.85)    │  │  • HU count (92) fits within 120 max    │ ║
║  │  ○ Express(×1.35) ○ 3PL(×1.10)   │  │  • Weight (4,700kg) within 7,500kg max  │ ║
║  │                                    │  │  • Overall util 77% → above 60% min     │ ║
║  │  CONSTRAINTS:                      │  │  • Next size down (20ft) would be over  │ ║
║  │  Priority: ○ Cost  ● Balanced      │  │    capacity by HU (92 > 80 max)         │ ║
║  │            ○ Speed                 │  │  • Next size up (32ft) only 51% util    │ ║
║  │                                    │  │    (wasteful)                            │ ║
║  │  [▶ Get Recommendation]            │  │                                          │ ║
║  └────────────────────────────────────┘  │  ─────────────────────────────────────   │ ║
║                                          │  ALL VEHICLE SIZES:                      │ ║
║                                          │  ┌──────────────────────────────────┐   │ ║
║                                          │  │ Type     Util   Cost     Status   │   │ ║
║                                          │  │ LCV      OVER   —        ❌ Too small│   │ ║
║                                          │  │ 20ft     OVER   —        ❌ Too small│   │ ║
║                                          │  │ 26ft     77%  ₹44,380   ⭐ Optimal  │   │ ║
║                                          │  │ 32ft     51%  ₹61,740   🟡 Wasteful │   │ ║
║                                          │  │ Trailer  23%  ₹95,340   ❌ Excessive│   │ ║
║                                          │  └──────────────────────────────────┘   │ ║
║                                          │                                          │ ║
║                                          │  [Apply to Load Plan →]                 │ ║
║                                          └──────────────────────────────────────────┘ ║
╚══════════════════════════════════════════════════════════════════════════════════════════╝
```

---

### 7.2 Vehicle Comparison Table Specification

```
VEHICLE ALL SIZES TABLE:
  Rows: one per vehicle type (LCV, 20ft, 26ft, 32ft, Trailer)
  Status column:
    ❌ Too small  = HU, weight, or volume over capacity (red row)
    ⭐ Optimal    = CapacityEngine.isOverloaded()=false AND util ≥ min threshold
    🟡 Wasteful   = valid but util < 60% (amber row, discouraged)
    ❌ Excessive  = valid but util < 30% (red row — strongly discouraged)

  Cost column: only shows for non-overloaded vehicles (otherwise "—")
  Util column: only for non-overloaded (otherwise "OVER")

ROW CLICK → tooltip expands:
  Shows all 3 capacity metrics (W/V/HU) with individual %
  Shows cost breakdown (base + fixed + surcharge)
  [Select This Vehicle] button in tooltip

VISUAL ENCODING:
  ⭐ Optimal row: green left border (4px), green row tint
  🟡 Wasteful row: amber left border, amber row tint
  ❌ rows: red text, no border highlight, slightly lower opacity

APPLY TO LOAD PLAN:
  [Apply to Load Plan →] pre-selects vehicle type in Load Planning Screen
  If opened from a dispatch context (TCT-0088), applies directly to that dispatch
  ConfirmPopover: "Change vehicle from 32ft to 26ft? Cost change: -₹17,360"
```

---

## 8. SCREEN 7 — PLANNING ANALYTICS DASHBOARD

**Route:** `/planning/analytics`
**Engine:** `PlanningAnalytics` · `RoutePerformanceScorer` · `CostEngine`
**Purpose:** Strategic view — planning efficiency KPIs, cost trends, capacity utilization over time

### 8.1 Full Screen Wireframe

```
╔══════════════════════════════════════════════════════════════════════════════════════╗
║  PLANNING ANALYTICS                              [⬇ Export]  [📅 Period: 30 days]   ║
╠══════════════════════════════════════════════════════════════════════════════════════╣
║                                                                                      ║
║  FILTER: Period [Last 30 days ▼]  Region [All ▼]  Carrier [All ▼]  Route [All ▼]   ║
║                                                                                      ║
║  ROW 1: PLANNING KPI TILES (6 across)                                                ║
║  ┌───────────────┐ ┌───────────────┐ ┌───────────────┐ ┌──────────┐ ┌──────────┐   ║
║  │  AVG UTIL     │ │  COST / HU    │ │  COST / KM    │ │CONS. RATE│ │PLAN ACCUR│   ║
║  │    71%        │ │   ₹428        │ │   ₹43.2       │ │   22%    │ │   84%    │   ║
║  │ Trend: ↑+3%   │ │ Trend: ↓-₹12 │ │ Trend: → flat │ │ Trend:↑+4│ │ Trend:↑+2│   ║
║  │ Target: 75%   │ │ Target: <₹450 │ │ Target: <₹45  │ │ Target:25│ │ Target:90│   ║
║  └───────────────┘ └───────────────┘ └───────────────┘ └──────────┘ └──────────┘   ║
║  ┌───────────────┐                                                                   ║
║  │ EMPTY MILES   │ (miles driven without load — deadhead %)                          ║
║  │    8.4%       │                                                                   ║
║  │ Target: <10%  │                                                                   ║
║  └───────────────┘                                                                   ║
║                                                                                      ║
║  ROW 2: UTILIZATION TREND + COST TREND (side by side)                               ║
║  ┌────────────────────────────────────────────────┐ ┌──────────────────────────────┐║
║  │  UTILIZATION TREND (last 30 days, daily avg)   │ │  COST TREND (₹ per HU)       │║
║  │  ─────────────────────────────────────────     │ │  ──────────────────────────  │║
║  │                                                │ │                              │║
║  │  75% ─ ─ ─ ─ ─ ─ ─ ─ ─ ─(target line)─ ─ ─  │ │  450 ─ ─ ─(target)─ ─ ─ ─  │║
║  │                                                │ │                              │║
║  │     ╭──╮                                       │ │      ╭──╮                    │║
║  │   ──╯  ╰──────╮         ╭───────╮             │ │  ────╯  ╰──────╮  ╭───────  │║
║  │                ╰─────────╯       ╰──           │ │                ╰──╯          │║
║  │  Jun 1          Jun 15           Jun 18        │ │  Jun 1         Jun 15  Jun18 │║
║  │                                                │ │                              │║
║  │  Line chart, daily data points, target dashed  │ │  Line chart, ₹ axis          │║
║  │  Hover: tooltip with date + avg util           │ │  Hover: tooltip with ₹/HU    │║
║  └────────────────────────────────────────────────┘ └──────────────────────────────┘║
║                                                                                      ║
║  ROW 3: ROUTE PERFORMANCE MATRIX + VEHICLE TYPE MIX                                  ║
║  ┌──────────────────────────────────────────────┐ ┌──────────────────────────────┐  ║
║  │  ROUTE PERFORMANCE MATRIX (grade × route)    │ │  VEHICLE TYPE MIX (pie)      │  ║
║  │  ────────────────────────────────────────    │ │  ────────────────────────    │  ║
║  │  Route       Grade  Score  Trend  Dispatches │ │                              │  ║
║  │  DEL-MUM-01  🅐  91   ↑+3   42                │ │   32ft  ████████  52%        │  ║
║  │  BOM-PUN-03  🅑  78   ↑+1   28                │ │   26ft  █████     34%        │  ║
║  │  DEL-HYD-02  🅒  67   → 0   18                │ │   Trlr  ██        10%        │  ║
║  │  MAA-BLR-01  🅒  63   ↓-2   14                │ │   20ft  █          4%        │  ║
║  │  DEL-BLR-03  🅓  54   ↓-4   10                │ │                              │  ║
║  │  HYD-BOM-02  🅔  42   ↓-8   8                 │ │  Pie chart, sector labels    │  ║
║  │  [View All Routes →]                          │ │  Click sector → filter table │  ║
║  └──────────────────────────────────────────────┘ └──────────────────────────────┘  ║
║                                                                                      ║
║  ROW 4: CONSOLIDATION SAVINGS + CARRIER COST COMPARISON                              ║
║  ┌──────────────────────────────────────────────┐ ┌──────────────────────────────┐  ║
║  │  CONSOLIDATION SAVINGS (last 30 days)        │ │  COST / KM BY CARRIER        │  ║
║  │  ────────────────────────────────────────    │ │  ──────────────────────────  │  ║
║  │  Applied consolidations:    12               │ │  BlueDart   ████████ ₹42     │  ║
║  │  Total saved:         ₹1,84,200              │ │  DTDC       ████████ ₹41     │  ║
║  │  Avg saving per event: ₹15,350               │ │  Delhivery  ███████  ₹38     │  ║
║  │  Missed opportunities:  8  (skipped/expired) │ │  XpressBees █████████████ ₹56│  ║
║  │  Missed saving est.:  ₹72,400 (opportunity)  │ │  3PL avg    ████████ ₹44     │  ║
║  │                                              │ │                              │  ║
║  │  Consolidation rate: 22% (target: 25%)       │ │  Horizontal bar chart        │  ║
║  │  [View Opportunities →]                      │ │  [View Full Breakdown →]     │  ║
║  └──────────────────────────────────────────────┘ └──────────────────────────────┘  ║
╚══════════════════════════════════════════════════════════════════════════════════════════╝
```

---

### 8.2 Analytics KPI Tile Definitions

```
TILE: AVG UTILIZATION
  Value:   Mean of CapacityEngine.forDispatch().overallPct across all dispatches in period
  Target:  75% (configurable)
  Trend:   vs prior equivalent period
  Color:   Green if ≥ target, amber if 60–74%, red if < 60%

TILE: COST / HU
  Value:   Total freight cost / total HU count in period
  Target:  < ₹450 (configurable per route class)
  Trend:   ↓ = improving (lower cost), ↑ = worsening
  Drill:   Click → cost breakdown by carrier type

TILE: COST / KM
  Value:   Total freight cost / total distance-km in period
  Target:  < ₹45/km
  Trend:   flat, improving, worsening

TILE: CONSOLIDATION RATE
  Value:   Consolidated dispatches / total dispatches × 100
  Target:  25%
  Trend:   ↑ = more consolidation (better)

TILE: PLAN ACCURACY
  Value:   Dispatches where actual HU ≥ 90% of planned HU / total dispatches × 100
  Target:  90%
  Definition: Measures how accurately load plans were executed
  Trend:   ↑ = better

TILE: EMPTY MILES
  Value:   Deadhead km / total km × 100
  Target:  < 10%
  Definition: km driven without load (return trips, positioning)
  Trend:   ↓ = better (less empty driving)
```

---

### 8.3 Planning Efficiency Report (Export)

```
[⬇ Export] → generates JSON/CSV with:
  Period, filters applied
  All KPI tiles with value, target, trend
  Per-route: dispatches, avg util, avg cost/HU, grade, score
  Per-vehicle-type: count, avg util, avg cost
  Per-carrier: count, avg cost/km, avg OTA, cost rank
  Consolidation events: list with saving per event
  Utilization distribution: buckets 0-10%, 10-20%, ... 90-100%
  Chart data: daily util and cost/HU arrays

Also supports: [📄 Print Report] → print-friendly HTML version
               [📧 Email to SCH] → stores as notification job
```

---

## 9. REACT COMPONENT HIERARCHY

### 9.1 File Organization

```
src/
├── pages/
│   └── planning/
│       ├── PlanningLayout.jsx                ← shell + context bar + subnav
│       ├── LoadPlanning.jsx
│       ├── VehicleUtilization.jsx
│       ├── ConsolidationSuggestions.jsx
│       ├── RouteOptimization.jsx
│       ├── CostSLASimulator.jsx
│       ├── VehicleRecommendation.jsx
│       └── PlanningAnalytics.jsx
│
├── components/
│   └── planning/
│       │
│       ├── shell/
│       │   ├── PlanningContextBar.jsx
│       │   └── PlanningSubNav.jsx
│       │
│       ├── load-planning/
│       │   ├── LoadBuilderPanel.jsx           ← left panel
│       │   │   ├── RouteSelector.jsx
│       │   │   ├── VehicleSelector.jsx
│       │   │   │   └── AutoRecommendToggle.jsx
│       │   │   ├── LoadItemList.jsx
│       │   │   │   └── LoadItem.jsx           ← checkbox + capacity warning
│       │   │   └── DepartureDetails.jsx
│       │   ├── PlanPreviewPanel.jsx           ← right panel
│       │   │   ├── CapacityMeter.jsx          ← 3 bar meters (W/V/HU)
│       │   │   ├── VehicleSpecCard.jsx
│       │   │   ├── CostBreakdownCard.jsx
│       │   │   └── OverloadCheckCard.jsx
│       │   └── CreateDispatchModal.jsx
│       │
│       ├── utilization/
│       │   ├── FleetUtilKPITiles.jsx
│       │   ├── UtilDistributionChart.jsx      ← histogram bars
│       │   ├── DispatchUtilTable.jsx
│       │   │   ├── UtilTableRow.jsx
│       │   │   └── InlineUtilBars.jsx         ← 3 compact bars per row
│       │   ├── UtilDetailPanel.jsx            ← right panel on row click
│       │   ├── OptimizationOpportunities.jsx
│       │   │   └── OptimizationSuggestionCard.jsx
│       │   ├── UtilFixModal.jsx
│       │   └── UtilHeatmap.jsx                ← route × vehicle heatmap
│       │
│       ├── consolidation/
│       │   ├── ConsolidationSummaryBar.jsx
│       │   ├── ConsolidationSettings.jsx      ← time window + min util
│       │   ├── ConsolidationGroupCard.jsx
│       │   │   ├── ConsolidationGroupHeader.jsx
│       │   │   ├── DispatchPairDisplay.jsx
│       │   │   ├── MergedLoadSummary.jsx
│       │   │   ├── SavingsBreakdown.jsx
│       │   │   └── SLATradeoffNote.jsx
│       │   ├── ConsolidationDetailPanel.jsx
│       │   │   ├── CostComparisonTable.jsx    ← Before/After/Saving
│       │   │   └── SLAAnalysisPanel.jsx
│       │   └── ApplyConsolidationModal.jsx
│       │
│       ├── route-optimization/
│       │   ├── RoutePerformanceTable.jsx
│       │   │   └── RouteTableRow.jsx
│       │   ├── ScoreRadarChart.jsx            ← SVG pentagon radar
│       │   ├── RouteDrillPanel.jsx
│       │   │   ├── DimensionBreakdownBars.jsx
│       │   │   ├── RouteTrendChart.jsx
│       │   │   ├── TopCarriersOnRoute.jsx
│       │   │   └── RouteOptSuggestions.jsx
│       │   ├── ScoreWeightsModal.jsx
│       │   └── GradeBadge.jsx                 ← A-F badge (reused)
│       │
│       ├── simulator/
│       │   ├── SimulatorInputPanel.jsx        ← left panel
│       │   │   ├── RouteInput.jsx
│       │   │   ├── LoadParameterInputs.jsx
│       │   │   ├── CarrierSelectionList.jsx
│       │   │   ├── VehicleTypeCheckboxes.jsx
│       │   │   ├── SLAConstraintInput.jsx
│       │   │   └── CostSpeedSlider.jsx
│       │   ├── ScenarioResultPanel.jsx        ← right panel
│       │   │   ├── ScenarioCard.jsx           ← A, B, or C card
│       │   │   │   ├── ScenarioMetricRow.jsx
│       │   │   │   └── ScenarioSelectButton.jsx
│       │   │   ├── CostComparisonBars.jsx     ← side-by-side horizontal bars
│       │   │   └── SensitivityAnalysis.jsx
│       │   └── SaveScenarioModal.jsx
│       │
│       ├── vehicle-recommendation/
│       │   ├── LoadParameterPanel.jsx         ← left panel (similar to simulator)
│       │   ├── RecommendationResultPanel.jsx  ← right panel
│       │   │   ├── RecommendedVehicleCard.jsx
│       │   │   ├── WhyRecommendedList.jsx
│       │   │   └── AllVehicleSizesTable.jsx
│       │   └── ApplyToDispatchModal.jsx
│       │
│       └── analytics/
│           ├── PlanningKPITiles.jsx
│           ├── UtilizationTrendChart.jsx      ← line chart
│           ├── CostTrendChart.jsx             ← line chart
│           ├── RoutePerformanceMatrix.jsx
│           ├── VehicleTypePieChart.jsx
│           ├── ConsolidationSavingsPanel.jsx
│           └── CarrierCostComparisonBars.jsx
│
├── hooks/
│   ├── useLoadPlanning.js
│   ├── useCapacityEngine.js           ← wraps CapacityEngine calls
│   ├── useVehicleUtilization.js
│   ├── useConsolidationEngine.js
│   ├── useRouteOptimization.js
│   ├── useSimulator.js                ← runs ScenarioSimulator
│   ├── useVehicleRecommendation.js
│   └── usePlanningAnalytics.js
│
└── context/
    └── PlanningContext.jsx            ← shared route/filter/period state
```

---

### 9.2 Key Component Props

```jsx
// ── CapacityMeter ──────────────────────────────────────────────────────────────
CapacityMeter.propTypes = {
  weight: shape({ current: number, max: number }).isRequired,
  volume: shape({ current: number, max: number }).isRequired,
  hu:     shape({ current: number, max: number }).isRequired,
  overloaded: bool,
  binding:    oneOf(['weight','volume','hu']),
  animated:   bool,
  size:       oneOf(['sm','md','lg']),
  // sm: 8px bars (inline in table)
  // md: 16px bars with labels (default)
  // lg: 24px bars with full details (plan preview panel)
}

// ── ScenarioCard ──────────────────────────────────────────────────────────────
ScenarioCard.propTypes = {
  scenario: shape({
    label:       oneOf(['A','B','C']).isRequired,
    type:        oneOf(['lowest-cost','balanced','fastest']).isRequired,
    carrierId:   string,
    carrierName: string,
    vehicleType: string,
    cost:        number,
    etaHours:    number,
    arrivalTime: string,
    slaStatus:   oneOf(['comfortable','at-risk','breached']),
    slaBufHrs:   number,
    utilPct:     number,
    carrierScore:number,
    riskLevel:   oneOf(['low','medium','high']),
    surcharge:   number,
  }).isRequired,
  recommended: bool,
  onSelect:    func,
  colorToken:  string,  // --plan-scenario-a/b/c
}

// ── ScoreRadarChart ───────────────────────────────────────────────────────────
ScoreRadarChart.propTypes = {
  dimensions: arrayOf(shape({
    key:    string,   // 'reliability','sla','delay','cost','reconciliation'
    label:  string,
    score:  number,   // 0–100
    weight: number,   // 0–1
  })).isRequired,
  grade:     oneOf(['A','B','C','D','E','F']),
  animated:  bool,
  size:      number,   // SVG size in px (default 240)
}

// ── ConsolidationGroupCard ────────────────────────────────────────────────────
ConsolidationGroupCard.propTypes = {
  group: shape({
    id:           string,
    routeCode:    string,
    timeWindow:   shape({ from: string, to: string }),
    dispatches:   arrayOf(shape({ id: string, utilPct: number, huCount: number, weightKg: number })),
    mergedLoad:   shape({ huCount: number, weightKg: number, volumeCbm: number }),
    suggestedVehicle: shape({ type: string, utilPct: number }),
    saving:       number,
    slaRisk:      oneOf(['none','low','high']),
    slaRiskNote:  string,
    status:       oneOf(['recommended','possible','risky']),
  }).isRequired,
  onApply:  func,
  onSkip:   func,
  onDetail: func,
}

// ── GradeBadge ────────────────────────────────────────────────────────────────
GradeBadge.propTypes = {
  grade: oneOf(['A','B','C','D','E','F']).isRequired,
  score: number,       // optional — shows score below grade
  size:  oneOf(['sm','md','lg']),
  showLabel: bool,     // "Top Performer", "Good", etc.
}

// ── AllVehicleSizesTable ──────────────────────────────────────────────────────
AllVehicleSizesTable.propTypes = {
  load: shape({
    huCount:    number,
    weightKg:   number,
    volumeCbm:  number,
  }).isRequired,
  routeId:      string,
  carrierType:  oneOf(['ftl','ltl','express','3pl']),
  onSelectVehicle: func,
  highlightOptimal: bool,
}

// ── CostSpeedSlider ───────────────────────────────────────────────────────────
CostSpeedSlider.propTypes = {
  value:    number.isRequired,   // 0–100 (0=all cost, 100=all speed)
  onChange: func.isRequired,
  // Affects which scenario is "recommended" in ScenarioResultPanel
}

// ── UtilHeatmap ───────────────────────────────────────────────────────────────
UtilHeatmap.propTypes = {
  data: arrayOf(shape({
    routeCode:   string,
    vehicleType: string,
    avgUtilPct:  number,
    dispatchCount:number,
  })).isRequired,
  onCellClick: func,   // (routeCode, vehicleType) => void
}
```

---

## 10. SHARED PLANNING COMPONENTS

### 10.1 CapacityMeter (multi-size)

```
SIZE: LG (Load Planning preview panel)
┌─────────────────────────────────────────────────────────────────────┐
│  WEIGHT    ██████████████░░░░░░░░   70%    7,000 / 10,000 kg        │
│  VOLUME    ████████████░░░░░░░░░░   55%       34 / 62 CBM           │
│  HU COUNT  ████████████████░░░░░░   78%      140 / 180 HUs   ← BINDING│
│                                                                      │
│  Overall: 78%  🟡 Good   Binding: HU count                          │
└─────────────────────────────────────────────────────────────────────┘

SIZE: MD (vehicle recommendation panel)
Weight  ██████████████░░░  70%   7,000/10,000
Volume  ████████████░░░░░  55%   34/62
HU      ████████████████░  78%   140/180 ★

SIZE: SM (table inline — 3 colored dots or compact bars)
  ██70% ██55% ██78%   (W/V/HU — colors per threshold)

BAR COLOR LOGIC per bar:
  ≥ 80%:  --util-high  (green)
  60–79%: --util-mid   (amber)
  < 60%:  --util-low   (red)
  > 100%: --wh-danger  (red) + "OVER" label

BINDING METRIC MARKER:
  Small ★ or "← BINDING" label on the highest-% bar
  Tooltip: "This dimension limits load capacity"
```

### 10.2 SavingsBadge

```
SavingsBadge: shows cost saving in green pill
  Props: saving (number, ₹), comparison ('vs-before' | 'per-dispatch' | 'vs-scenario-b')
  Format: "Save ₹17,300" (green pill)
          "−27% vs current" (green text)
  Variants:
    positive (saving):     green bg, white text
    negative (extra cost): red bg, white text
    neutral (flat):        gray bg

USAGE:
  ConsolidationGroupCard: "TOTAL SAVING: ₹17,300"
  ScenarioCard:           "Save ₹17,540 vs B"
  OptimizationSuggestion: "Save ₹8,200"
```

### 10.3 PlanningTrendBadge

```
PlanningTrendBadge: wraps TrendBadge from executive phase + adds target comparison
  Props: current (number), target (number), trend ('up'|'down'|'flat'),
         metricDirection ('up-is-good' | 'down-is-good')

  Renders:
    ↑+3%  🟢  (up is good, trending up)
    ↑+3%  🔴  (down is good, trending up — worsening)
    ↓-₹12 🟢  (down is good, trending down — improving)
    →  🔵  (flat)

  Below trend: "[vs target: ₹450 — ✅ Below target]"
               or "[vs target: 75% — ⚠ 4% below target]"
```

---

## 11. UX INTERACTIONS & SIMULATION FLOWS

### 11.1 Load Planning Live Update

```
LOAD ITEM CHECKBOX TOGGLE:
  1. Checkbox checked/unchecked
  2. CapacityEngine.calculate(selectedLoads, vehicleType) fires
     (debounced 100ms to batch rapid toggles)
  3. All 3 capacity bars animate to new values (200ms)
  4. Overall% recalculates, status label updates
  5. Overload check updates
  6. If overload: new item's checkbox disabled, tooltip shows reason
  7. Cost estimate updates (CostEngine.estimate)

VEHICLE TYPE CHANGE:
  1. Dropdown changes
  2. CapacityEngine re-runs with new vehicle type
  3. All bars animate
  4. Vehicle spec card swaps to new type data (crossfade 200ms)
  5. Cost estimate recalculates

AUTO-RECOMMEND TOGGLE ON:
  1. VehicleRecommendationEngine.recommend(selectedLoads) fires
  2. Recommended type highlighted in dropdown with ★
  3. If current selection ≠ recommended: amber note appears:
     "⚠ Current vehicle is 32ft — recommended is 26ft (saves ₹17,360)"
     [Switch to 26ft] button

AUTO-FILL CAPACITY:
  Algorithm:
    Start with empty selection
    Sort unplanned ASNs by HU count (desc)
    For each ASN: if adding doesn't overload → select it
    Stop when binding metric ≥ 85% or no more ASNs
  Animation: checkboxes check in sequence (50ms apart)
  Progress toast: "Auto-filled: 3 loads, 76% utilization"
```

### 11.2 Simulator Run Flow

```
SIMULATION SEQUENCE:
  1. [▶ Run Simulation] click
  2. Left panel: inputs locked (greyed, not editable)
  3. Right panel: loading state appears (3 skeleton cards)
  4. ScenarioSimulator.simulate(load, routeId, carrierIds) fires
     (all 3 scenarios computed in one call)
  5. Results arrive (synchronous in current model — stub data from localStorage)
  6. Skeleton cards → scenario cards (fade in, 300ms stagger per card)
  7. Recommended card: enters with slight scale pop (scale 0.95 → 1.0, 200ms)
  8. [Select A/B/C] buttons appear below each card
  9. Left panel: [Edit Inputs] button appears (re-enables form)

COST/SPEED SLIDER EFFECT:
  Slider move → recommended badge moves between cards (no re-run needed)
  Slider at 0–30: A recommended (lowest cost)
  Slider at 31–70: B recommended (balanced)
  Slider at 71–100: C recommended (fastest)
  Transition: badge fades out on old card (150ms), fades in on new (150ms)

SCENARIO SELECT → APPLY:
  [Select B] click → navigates to /planning/load
  Load Planning screen pre-fills:
    Route: from simulator input
    Vehicle Type: from scenario B
    Carrier: from scenario B
    Load parameters: from simulator
  User sees filled plan + can adjust before creating dispatch
```

### 11.3 Consolidation Apply Flow

```
[✅ Apply Consolidation] click:
  1. ApplyConsolidationModal opens (review summary + ConfirmPopover)
  2. User confirms
  3. Loading spinner on modal CTA
  4. LifecycleEngine.cancel(TCT-0072)
  5. CapacityEngine validates merged load on TCT-0088
  6. DAL updates TCT-0088 with merged load list
  7. VehicleRecommendationEngine picks new vehicle size
  8. CarrierAdapter notified of vehicle change
  9. DomainEventBus.emit('DispatchConsolidated', { saved: groupSaving })
  10. Modal closes
  11. Group card changes to "Applied ✅" state (green bg, no more action buttons)
  12. Summary bar: opportunities count -1, total saving -group saving
  13. Success toast: "Consolidation applied — ₹17,300 saved. TCT-0072 cancelled."

SKIP FLOW:
  [✗ Skip — Keep Separate] click → ConfirmPopover:
  "Skip this consolidation? It won't appear in suggestions again."
  On confirm: group marked SKIPPED in localStorage (tct_cons_skips)
              Group card fades to 50% opacity, "Skipped" badge
              [Undo Skip] link stays for 30 min
```

### 11.4 Chart Interactions

```
UTILIZATION DISTRIBUTION HISTOGRAM:
  Bar hover → tooltip: "6 dispatches in 70–80% range"
  Bar click → filters Dispatch Utilization Table to that band
  Click again (same bar) → removes filter

ROUTE RADAR CHART:
  Pentagon vertex hover → tooltip: "Reliability: 96% (weighted 25%)"
  Radar click → navigates to route detail drill panel

HEATMAP CELL:
  Hover → tooltip: "DEL-MUM-01 × 32ft: avg 82% util, 18 dispatches"
  Click → opens dispatch list filtered to route × vehicle type

TREND CHARTS (line):
  Hover → crosshair + tooltip: "15 Jun: avg util 68%"
  Brush selection: click+drag to zoom into date range
  [Reset Zoom] button appears after zoom
  Data points: rendered as circles (6px), filled with chart color
  Target line: dashed, gray, labeled "Target: 75%"

VEHICLE TYPE PIE CHART:
  Sector hover → tooltip: "32ft: 52% of dispatches (156 of 300)"
  Sector click → filters all tables to that vehicle type
  Center label: total dispatches count

COST COMPARISON BARS (simulator):
  Bars animate from 0 (left) to final width on load (400ms, ease-out)
  Hover → tooltip with full cost breakdown
  [Scenario A / B / C] label at bar end
```

---

### 11.5 Animation Spec

```
CAPACITY BAR ANIMATIONS:
  Width transition: 200ms ease-out on each change
  Color change: 300ms (green → amber → red as thresholds crossed)
  "BINDING" label: slides in from right (translateX 20px → 0, 200ms)

AUTO-FILL SEQUENCE:
  Checkboxes: each checks with 50ms delay between them
  Each check: scale 1 → 1.1 → 1 (100ms pop animation on checkbox)
  Bars: increment smoothly during fill (continuous, not stepwise)

SIMULATION LOADING:
  Skeleton cards: shimmer animation (background-position scrolls, 1.5s loop)
  Skeleton → result: card crossfade (opacity, 300ms, staggered)
  Recommended card: scale 0.95 → 1.0 (200ms spring, after other cards appear)

CONSOLIDATION GROUP CARD (applied state):
  All action buttons: fade out (200ms)
  "Applied ✅" banner: slides in from top (translateY -20px → 0, 250ms)
  Card border: transitions to green (300ms)
  Summary bar savings counter: count-up to new value (400ms)

GRADE BADGE (route table):
  On score change: badge flips (rotateY 90° → 0°, 300ms, letter swap at 90°)
  Score number: count-up to new value (400ms)

RADAR CHART (route score):
  On route select: old polygon fades out (150ms), new draws in (strokeDashoffset, 500ms)
  On dimension hover: that vertex circle scales up (1 → 1.4, 150ms)
```

---

## 12. DATA CONTRACTS

### 12.1 Load Planning ← CapacityEngine + CostEngine

```javascript
// CapacityEngine.calculate(selectedLoads, vehicleType)
{
  vehicleType:  '32ft',
  maxWeightKg:  10000,
  maxCbm:       62,
  maxHU:        180,
  load: {
    totalWeightKg: 7000,
    totalCbm:      34,
    totalHU:       140,
  },
  utilization: {
    weightPct:   70,
    volumePct:   55,
    huPct:       78,
    overallPct:  78,
    bindingMetric: 'hu',
  },
  overloaded:  false,
  overloadedDimensions: [],
}

// CapacityEngine.isOverloaded(loads, vehicleType) → bool

// CostEngine.estimate(vehicleType, routeId, carrierType)
{
  vehicleType:   '32ft',
  routeId:       'DEL-MUM-01',
  distanceKm:    1420,
  baseCostPerKm: 42,
  fixedCostDay:  2100,
  surcharge:     1.0,        // FTL
  baseCost:      59640,
  fixedCost:     2100,
  surchargeAmt:  0,
  totalCost:     61740,
  perHU:         441,
  perKm:         43.48,
}
```

### 12.2 Consolidation ← ConsolidationEngine

```javascript
// ConsolidationEngine.findGroups(routeId, timeWindowHrs, minUtilPct)
[
  {
    groupId:    'CG-001',
    routeCode:  'DEL-MUM-01',
    window:     { from: '2026-06-18T08:00', to: '2026-06-18T14:00' },
    dispatches: [
      { id: 'TCT-0088', utilPct: 35, huCount: 28, weightKg: 1900, departs: '08:00' },
      { id: 'TCT-0072', utilPct: 42, huCount: 64, weightKg: 2800, departs: '10:30' },
    ],
    merged: {
      huCount: 92,  weightKg: 4700,  volumeCbm: 29,
    },
    suggestedVehicle: { type: '26ft', utilPct: 76 },
    saving:       17300,
    slaRisk:      'none',
    slaRiskNote:  null,
    status:       'recommended',    // recommended / possible / risky
    confidence:   0.94,
  },
  ...
]
```

### 12.3 Simulation ← ScenarioSimulator

```javascript
// ScenarioSimulator.simulate(load, routeId, carrierIds)
{
  routeId:  'DEL-MUM-01',
  load:     { huCount: 140, weightKg: 7000, volumeCbm: 34 },
  scenarios: {
    A: {
      label:       'A',
      type:        'lowest-cost',
      carrierId:   'CAR-003',
      carrierName: 'Delhivery',
      carrierType: 'ltl',
      vehicleType: '26ft',
      cost:        44200,
      etaHours:    12.5,
      arrivalTime: '2026-06-18T20:30:00Z',
      slaStatus:   'at-risk',
      slaBufHrs:   1.5,
      utilPct:     76,
      carrierScore: 74,
      riskLevel:   'medium',
      surcharge:   0.85,
    },
    B: { /* balanced */ },
    C: { /* fastest */ },
  },
}
```

### 12.4 Route Optimization ← RoutePerformanceScorer

```javascript
// RoutePerformanceScorer.score(routeId)
{
  routeId:    'DEL-MUM-01',
  routeName:  'Delhi to Mumbai',
  score:      91,
  grade:      'A',
  dimensions: {
    reliability:   { score: 96, weight: 0.25, weightedScore: 24.0 },
    slaCompliance: { score: 94, weight: 0.30, weightedScore: 28.2 },
    delayScore:    { score: 88, weight: 0.20, weightedScore: 17.6 },  // inverse delay
    costEfficiency:{ score: 85, weight: 0.15, weightedScore: 12.75 },
    reconciliation:{ score: 98, weight: 0.10, weightedScore: 9.8 },
  },
  raw: {
    totalDispatches:   42,
    avgDelayMin:       4.2,
    otaPct:            96,
    otdPct:            94,
    costPerKm:         41,
    reconMatchPct:     98.2,
  },
  trend:      { last6mo: [88, 89, 91, 91] },    // monthly scores
}
```

### 12.5 Vehicle Recommendation ← VehicleRecommendationEngine

```javascript
// VehicleRecommendationEngine.recommend(loads)
{
  recommendedType: '26ft',
  recommendedUtil: 76,
  reason: [
    'HU count (92) fits within 26ft max (120)',
    'Weight (4,700kg) within 26ft max (7,500kg)',
    'Utilization 76% above minimum threshold 60%',
    '20ft would be over capacity by HU',
    '32ft would result in only 51% utilization',
  ],
  allOptions: [
    { type: 'LCV',     overloaded: true,  util: null,  cost: null,     status: 'too-small' },
    { type: '20ft',    overloaded: true,  util: null,  cost: null,     status: 'too-small' },
    { type: '26ft',    overloaded: false, util: 76,    cost: 44380,    status: 'optimal' },
    { type: '32ft',    overloaded: false, util: 51,    cost: 61740,    status: 'wasteful' },
    { type: 'Trailer', overloaded: false, util: 23,    cost: 95340,    status: 'excessive' },
  ],
}
```

### 12.6 Planning Analytics ← PlanningAnalytics

```javascript
// PlanningAnalytics (Step 5 exposed methods, plus Step 7 aggregation)
{
  period:            '30d',
  avgUtilPct:        71,
  costPerHU:         428,
  costPerKm:         43.2,
  consolidationRate: 22,
  planAccuracy:      84,
  emptyMilesPct:     8.4,
  utilizationTrend:  [
    { date: '2026-06-01', avgUtil: 68 },
    { date: '2026-06-02', avgUtil: 70 },
    ...
  ],
  costTrend: [
    { date: '2026-06-01', costPerHU: 440 },
    ...
  ],
  routeScores: [
    { routeCode: 'DEL-MUM-01', grade: 'A', score: 91, trend: 3, dispatches: 42 },
    ...
  ],
  vehicleTypeMix: [
    { type: '32ft', pct: 52, count: 156 },
    ...
  ],
  consolidationSavings: {
    applied:    12,
    totalSaved: 184200,
    avgPerEvent:15350,
    missed:     8,
    missedEst:  72400,
  },
  carrierCostPerKm: [
    { carrierId: 'CAR-001', carrierName: 'BlueDart',  costPerKm: 42 },
    { carrierId: 'CAR-002', carrierName: 'DTDC',       costPerKm: 41 },
    { carrierId: 'CAR-003', carrierName: 'Delhivery',  costPerKm: 38 },
    { carrierId: 'CAR-004', carrierName: 'XpressBees', costPerKm: 56 },
  ],
}
```

---

*Document ends.*

---

**UI PHASE 6 COMPLETE**
