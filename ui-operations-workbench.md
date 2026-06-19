# Enterprise Transport Control Tower — Operations Workbench
## UI PHASE 3 · Operations Control Tower Design Specification

**Persona primary:** Operations Executive · Transport Manager
**Persona secondary:** Warehouse Manager · Regional Manager
**Routes covered:** `/operations/*` · `/dispatch/*` · `/transport/*`
**Data sources:** `DispatchDashboardService` · `AlertService` · `DrillDownService` · `CarrierAdapter` · `HURegistry` · `SLAClock`
**Design reference:** Blue Yonder CT Workspace · Oracle OTM Execution · SAP TM Order Monitor · FourKites Shipment Board

---

## TABLE OF CONTENTS

1. [Operations Shell Layout](#1-operations-shell-layout)
2. [Screen 1 — Dispatch Workbench](#2-screen-1--dispatch-workbench)
3. [Screen 2 — Dispatch Detail](#3-screen-2--dispatch-detail)
4. [Screen 3 — Chain of Custody](#4-screen-3--chain-of-custody)
5. [Screen 4 — Transport Monitoring](#5-screen-4--transport-monitoring)
6. [Screen 5 — Dispatch Search Center](#6-screen-5--dispatch-search-center)
7. [React Component Hierarchy](#7-react-component-hierarchy)
8. [Shared Operational Components](#8-shared-operational-components)
9. [UX Interactions & State Transitions](#9-ux-interactions--state-transitions)
10. [Data Contracts](#10-data-contracts)

---

## 1. OPERATIONS SHELL LAYOUT

### 1.1 Persistent Operations Header Strip

```
╔══════════════════════════════════════════════════════════════════════════════════╗
║  OPERATIONS SITUATION BAR                                     [always visible]  ║
║  ┌────────┬──────────┬─────────┬──────────┬─────────┬─────────────────────────┐║
║  │TOTAL   │ IN       │ AT      │ BREACHED │ OPEN    │  SHIFT: 08:00–20:00     │║
║  │ACTIVE  │ TRANSIT  │ RISK 🟡 │ SLA 🔴   │ EXC     │  Ops Exec: Rahul K      │║
║  │  32    │   14     │   2     │   1      │  9      │  [Handoff] [Shift Log]  │║
║  └────────┴──────────┴─────────┴──────────┴─────────┴─────────────────────────┘║
╚══════════════════════════════════════════════════════════════════════════════════╝
```

**Situation bar rules:**
- Fixed below the top navigation, always visible across all ops screens
- Counts auto-refresh every 15 seconds
- At-risk count click → dispatch board filtered to at-risk
- Breached count click → alert center (SLA breaches)
- Open exc click → exception queue
- Shift info: user's current shift window + name + role
- `[Handoff]` button: opens shift handoff modal (summary of open items to pass on)
- `[Shift Log]` button: opens log of all actions taken this shift (from audit trail)

### 1.2 Ops Sub-Navigation (Tab Strip)

```
┌──────────────────────────────────────────────────────────────────────────┐
│  [Dispatch Workbench]  [Dispatch Detail]  [Chain of Custody]             │
│  [Transport Monitoring]  [Search Center]                    [+ New Disp] │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## 2. SCREEN 1 — DISPATCH WORKBENCH

**Route:** `/operations/workbench` (default for Operations CT)
**Purpose:** Primary execution screen — all active dispatches in a status-grouped board

### 2.1 Full Screen Wireframe

```
╔══════════════════════════════════════════════════════════════════════════════════════════╗
║  TOP NAV  [Global Filters]                                          [🔔4] [+ New] [👤]  ║
╠══════════════════════════════════════════════════════════════════════════════════════════╣
║  SITUATION BAR  [32 active] [14 in-transit] [2 at-risk 🟡] [1 breached 🔴] [9 exc]     ║
╠══════════════════════════════════════════════════════════════════════════════════════════╣
║  Workbench  Detail  Custody  Monitoring  Search                          [+ New Dispatch]║
╠══════════════════════════════════════════════════════════════════════════════════════════╣
║                                                                                          ║
║  DISPATCH WORKBENCH                                   [🔍 Search] [⚙ View] [⬇ Export]  ║
║  ─────────────────────────────────────────────────────────────────────────────────────  ║
║                                                                                          ║
║  FILTER BAR:                                                                             ║
║  📅 Today ▼  🌍 All Regions ▼  🚚 All Carriers ▼  🛣 All Routes ▼  [+ More Filters]     ║
║  Active Filters: [Today ×]                                          [Reset] [Save]       ║
║                                                                                          ║
║  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  ┌────────────────────┐ ║
║  │ DISPATCH QUEUE  │  │ READY FOR DISP. │  │    LOADING      │  │     DISPATCHED     │ ║
║  │    PLANNED [12] │  │     READY  [8]  │  │ DISPATCHED  [5] │  │   IN TRANSIT [14]  │ ║
║  │                 │  │                 │  │                 │  │                    │ ║
║  │ ┌─────────────┐ │  │ ┌─────────────┐ │  │ ┌─────────────┐ │  │ ┌────────────────┐│ ║
║  │ │ TCT-0001    │ │  │ │ TCT-0005    │ │  │ │ TCT-0013    │ │  │ │ TCT-0019      ││ ║
║  │ │ DEL→MUM     │ │  │ │ BOM→PUN     │ │  │ │ DEL→HYD     │ │  │ │ DEL→MUM       ││ ║
║  │ │ ⏰ 08:00    │ │  │ │ ⏰ 09:30    │ │  │ │ 🟢 Departed │ │  │ │ 🟡 AT RISK    ││ ║
║  │ │ 42 HUs      │ │  │ │ All docs ✓  │ │  │ │ 09:15       │ │  │ │ ETA: 18:30    ││ ║
║  │ │ [Plan ▷]    │ │  │ │ [Dispatch ▷]│ │  │ │ [Track]     │ │  │ │ SLA: 2h left  ││ ║
║  │ └─────────────┘ │  │ └─────────────┘ │  │ └─────────────┘ │  │ └────────────────┘│ ║
║  │                 │  │                 │  │                 │  │                    │ ║
║  │ ┌─────────────┐ │  │ ┌─────────────┐ │  │ ┌─────────────┐ │  │ ┌────────────────┐│ ║
║  │ │ TCT-0002    │ │  │ │ TCT-0006    │ │  │ │ TCT-0014    │ │  │ │ TCT-0020      ││ ║
║  │ │ BOM→PUN     │ │  │ │ DEL→HYD     │ │  │ │ BOM→PUN     │ │  │ │ BOM→PUN       ││ ║
║  │ │ ⏰ 09:00    │ │  │ │ ⚠ Seal pend │ │  │ │ 🟢 Departed │ │  │ │ 🟢 ON TRACK   ││ ║
║  │ │ 18 HUs      │ │  │ │ [Assign ▷]  │ │  │ │ 10:02       │ │  │ │ ETA: 15:00    ││ ║
║  │ │ [Plan ▷]    │ │  │ │ [Dispatch ▷]│ │  │ │ [Track]     │ │  │ │ SLA: 6h left  ││ ║
║  │ └─────────────┘ │  │ └─────────────┘ │  │ └─────────────┘ │  │ └────────────────┘│ ║
║  │                 │  │                 │  │                 │  │                    │ ║
║  │  [+ 10 more]    │  │  [+ 6 more]     │  │  [+ 3 more]     │  │  [+ 12 more]       │ ║
║  └─────────────────┘  └─────────────────┘  └─────────────────┘  └────────────────────┘ ║
║                                                                                          ║
╠══════════════════════════════════════════════════════════════════════════════════════════╣
║  ┌── ARRIVED & PENDING ACTION ────────────────────────────────────────────────────────┐ ║
║  │  [ARRIVED: 6]  [UNLOADING: 2]  [PENDING RECONCILIATION: 4]                        │ ║
║  │  ─────────────────────────────────────────────────────────────────────────────    │ ║
║  │  TCT-0028 DEL-MUM-01  Arrived 2h ago   Dwell: 2h 14m  [Start Unloading ▷]        │ ║
║  │  TCT-0031 BOM-PUN-03  Arrived 4h ago   Dwell: 4h 02m  [Start Unloading ▷] ⚠      │ ║
║  │  TCT-0033 DEL-HYD-02  Unloading now    Progress: 28/42 HUs  [View Session]        │ ║
║  └────────────────────────────────────────────────────────────────────────────────────┘ ║
╚══════════════════════════════════════════════════════════════════════════════════════════╝
```

---

### 2.2 Kanban Column Specification

```
COLUMN STRUCTURE (per status):
┌──────────────────────────────────────────┐
│ [STATUS ICON] STATUS LABEL     [COUNT]   │  ← column header, colored accent bar top
│ ──────────────────────────────────────── │
│ [DispatchCard]                           │  ← card 1
│ [DispatchCard]                           │  ← card 2
│ [DispatchCard]                           │  ← card 3 (max 3 visible, rest collapsed)
│                                          │
│ [+ N more dispatches...]                 │  ← expand link
│ [View All in Table →]                    │  ← escape to list view
└──────────────────────────────────────────┘

COLUMN COLOR ACCENTS (top border):
  Planned     = 4px top border --s-planned (gray)
  Ready       = 4px top border --s-ready (violet)
  Dispatched  = 4px top border --s-dispatched (blue)
  In Transit  = 4px top border --s-in-transit (cyan)

COLUMN WIDTH:
  1280px+: 4 columns, equal width (calc(25% - 18px))
  1024px:  2 columns × 2 rows (planned+ready / dispatched+in-transit)
  768px:   1 column with horizontal scroll (column width: 320px, snap)
```

---

### 2.3 Dispatch Card (Kanban)

```
┌──────────────────────────────────────────────┐
│ [STATUS DOT] TCT-0019          [⋮ actions]   │  ← header row
│ ──────────────────────────────────────────── │
│ 🛣  DEL-MUM-01  Delhi → Mumbai               │  ← route
│ 🚛  MH-01-AX-2341  BlueDart FTL             │  ← vehicle + carrier
│ ⏰  Dep: 08:00   ETA: 18:30                  │  ← planned dep + ETA
│ 📦  42 HUs  •  2,800 kg  •  78% util        │  ← load summary
│ ──────────────────────────────────────────── │
│ [SLA BAR: ████████████░░░░░░  4h left]       │  ← SLA countdown bar
│ [🟡 AT RISK]           [1 exception ⚠]      │  ← status + exception badge
│ ──────────────────────────────────────────── │
│ [PRIMARY ACTION BTN]          [View Details] │  ← context-aware CTA
└──────────────────────────────────────────────┘

PRIMARY ACTION BUTTONS by status:
  planned      → [Assign Vehicle & Carrier →]
  ready        → [Mark Dispatched →]         (requires docs complete check)
  dispatched   → [Confirm Departure →]
  in-transit   → [View Live Tracking]
  arrived      → [Start Unloading →]
  unloading    → [View Scan Session]

SLA BAR:
  Full width bar, color changes with time:
    >6h left = green fill
    2–6h left = amber fill
    <2h left = red fill, bar pulses
    overdue  = red full bar, "OVERDUE" label replaces time

EXCEPTION BADGE:
  Shows count of open exceptions on this dispatch
  Click → exception list for this dispatch (within detail drawer)

CARD HEIGHT: auto (min 160px)
CARD HOVER: translateY(-2px), shadow-md → shadow-lg
CARD CLICK AREA: entire card (except action buttons) → opens Dispatch Detail Screen

⋮ CONTEXT MENU OPTIONS:
  View Details
  ─────────────────
  Assign Vehicle
  Assign Carrier
  ─────────────────
  Mark Departed (if ready/dispatched)
  Mark Arrived (if in-transit)
  ─────────────────
  Raise Exception
  Contact Carrier
  ─────────────────
  View Audit Trail
  Export Dispatch
```

---

### 2.4 Arrived & Pending Action Strip

```
STRIP HEADER: Tab strip — [ARRIVED: N]  [UNLOADING: N]  [PENDING RECON: N]
              Shows sub-counts per status
              Each tab filters the rows below

ROW STRUCTURE:
┌─────────────────────────────────────────────────────────────────────────────┐
│ [STATUS DOT] [DISPATCH ID]  [ROUTE CODE]  [LOCATION]   [ARRIVED TIME]      │
│              [DWELL TIME]   [HU COUNT]    [ACTION BTN]  [EXCEPTION FLAG?]   │
└─────────────────────────────────────────────────────────────────────────────┘

DWELL TIME COLORING:
  < 2h = green
  2–4h = amber
  > 4h = red (with ⚠ flag — unloading overdue exception risk)

UNLOADING ROW shows progress bar: [28/42 HUs scanned ██████████░░░░]

ACTION BUTTONS:
  Arrived          → [Start Unloading ▷]
  Unloading        → [View Scan Session]
  Pending Recon    → [Complete Reconciliation ▷]
```

---

### 2.5 Workbench View Toggle

```
BOARD VIEW (default):  Kanban columns (as above)
TABLE VIEW (toggle):   Standard paginated table

TABLE VIEW COLUMNS:
ID | Status | Route | Origin→Dest | Vehicle | Carrier | Planned Dep | ETA | HU Count | SLA Status | Exceptions | Action

TABLE FEATURES:
  Sticky first column (ID)
  Sortable all columns
  Row click = navigate to Dispatch Detail Screen (not drawer — full page)
  Bulk select (checkbox) → Bulk actions: Assign Carrier, Export, Raise Exception
  Inline quick-edit: status advance button in last column

VIEW TOGGLE BUTTON (top-right of workbench):
  [⊞ Board]  [☰ Table]   ← toggle with icons
  Persisted to localStorage per user
```

---

## 3. SCREEN 2 — DISPATCH DETAIL

**Route:** `/dispatch/:id`
**Entry points:** Card click on workbench · Drawer from any table · Deep link
**Layout:** Full-page (not drawer) — content density warrants full screen

### 3.1 Full Screen Wireframe

```
╔══════════════════════════════════════════════════════════════════════════════════════╗
║  TOP NAV                                                           [🔔] [👤]        ║
╠══════════════════════════════════════════════════════════════════════════════════════╣
║  SITUATION BAR                                                                       ║
╠══════════════════════════════════════════════════════════════════════════════════════╣
║  ← Back to Workbench    Dispatch Management › TCT-0019                               ║
╠══════════════════════════════════════════════════════════════════════════════════════╣
║                                                                                      ║
║  ┌── DISPATCH HEADER ─────────────────────────────────────────────────────────────┐ ║
║  │                                                                                 │ ║
║  │  TCT-0019                    [● IN TRANSIT]         [🟡 SLA AT RISK]           │ ║
║  │  Delhi DC  →  Mumbai DC                                                         │ ║
║  │  Route: DEL-MUM-01  ·  BlueDart FTL  ·  MH-01-AX-2341                         │ ║
║  │                                                                                 │ ║
║  │  ┌─────────────────┬──────────────────┬─────────────────┬──────────────────┐  │ ║
║  │  │  PLANNED DEP    │  ACTUAL DEP      │  PLANNED ARR    │  ETA / ACTUAL    │  │ ║
║  │  │  08:00 18 Jun   │  08:14 18 Jun    │  18:00 18 Jun   │  19:30 18 Jun    │  │ ║
║  │  │                 │  ✅ +14 min      │                 │  🟡 +1h 30m late │  │ ║
║  │  └─────────────────┴──────────────────┴─────────────────┴──────────────────┘  │ ║
║  │                                                                                 │ ║
║  │  SLA CLOCK: ████████████████████░░░░░░  2h 30m remaining  (SLA: 10h window)   │ ║
║  │                                                                                 │ ║
║  │  [📞 Contact Carrier]  [📍 Track Live]  [⚠ Raise Exception]  [⋮ More]         │ ║
║  └─────────────────────────────────────────────────────────────────────────────────┘ ║
║                                                                                      ║
║  ┌── TABS ──────────────────────────────────────────────────────────────────────┐   ║
║  │  Overview  │  Timeline  │  Documents  │  Vehicle & Driver  │  HU Manifest  │  │  ║
║  │            │            │             │                    │               │  │  ║
║  │  Carrier   │  Exceptions [1]  │  Audit Trail              │               │  │  ║
║  └──────────────────────────────────────────────────────────────────────────────┘   ║
║                                                                                      ║
║  ┌── TAB CONTENT AREA ──────────────────────────────────────────────────────────┐   ║
║  │  [See per-tab wireframes below]                                               │   ║
║  └──────────────────────────────────────────────────────────────────────────────┘   ║
╚══════════════════════════════════════════════════════════════════════════════════════╝
```

---

### 3.2 Tab 1 — Overview

```
┌── OVERVIEW TAB ──────────────────────────────────────────────────────────────────┐
│                                                                                   │
│  LEFT COLUMN (60%)                     RIGHT COLUMN (40%)                        │
│  ──────────────────────                ──────────────────────                    │
│                                                                                   │
│  DISPATCH SUMMARY                      SLA & PERFORMANCE                         │
│  ┌────────────────────────────────┐    ┌──────────────────────────────────────┐  │
│  │ Dispatch ID    TCT-0019        │    │ OTA Status    🟡 At Risk              │  │
│  │ Status         In Transit      │    │ OTD Status    ✅ On Time              │  │
│  │ Route          DEL-MUM-01      │    │ SLA Window    10 hours                │  │
│  │ Origin         DC Delhi (NR)   │    │ Hours Used    7.5h  (75%)             │  │
│  │ Destination    DC Mumbai (WR)  │    │ Hours Remain  2.5h                    │  │
│  │ Distance       1,420 km        │    │ Est. Delay    +1h 30m                 │  │
│  │ HU Count       42              │    │ Breach Risk   HIGH                    │  │
│  │ Weight         2,800 kg        │    └──────────────────────────────────────┘  │
│  │ Volume (CBM)   18.4            │                                               │
│  │ Seal No.       SL-20240118-07  │    LOAD CAPACITY                             │
│  │ ASN No.        ASN-2024-0918   │    ┌──────────────────────────────────────┐  │
│  │ Invoice No.    INV-2024-1203   │    │ Vehicle Util  78%  ███████████░░░     │  │
│  │ Gate Pass      GP-190618-004   │    │ Weight Cap    56%  ████████░░░░░░     │  │
│  │ Created By     Rahul Kumar     │    │ Volume Cap    61%  █████████░░░░░     │  │
│  │ Created At     18 Jun 08:00    │    │ HU Cap        53%  ████████░░░░░░     │  │
│  └────────────────────────────────┘    │ Binding: Volume                       │  │
│                                        └──────────────────────────────────────┘  │
│                                                                                   │
│  OPEN EXCEPTIONS (1)                                                              │
│  ┌────────────────────────────────────────────────────────────────────────────┐   │
│  │ 🟡 HIGH  arrival-delay  Raised 2h ago  Assigned: Ops Exec  [View] [Resolve]│   │
│  └────────────────────────────────────────────────────────────────────────────┘   │
└───────────────────────────────────────────────────────────────────────────────────┘
```

---

### 3.3 Tab 2 — Timeline

```
┌── TIMELINE TAB ─────────────────────────────────────────────────────────────────┐
│                                                                                  │
│  DISPATCH LIFECYCLE TIMELINE                          [⬇ Export Timeline]       │
│                                                                                  │
│  ┌──────────────────────────────────────────────────────────────────────────┐   │
│  │                                                                           │   │
│  │  ✅  PLANNED          18 Jun 2026  07:45    Rahul Kumar (TM)             │   │
│  │  │   Dispatch created. Vehicle assigned. Route: DEL-MUM-01               │   │
│  │  │                                                                        │   │
│  │  ✅  READY            18 Jun 2026  07:58    System (Auto-check)          │   │
│  │  │   All documents validated: ASN ✓  Invoice ✓  Seal ✓  Gate Pass ✓     │   │
│  │  │                                                                        │   │
│  │  ✅  DEPARTED         18 Jun 2026  08:14    Gate Officer (WM)            │   │
│  │  │   Gate pass scanned. Seal SL-20240118-07 locked. +14 min planned dep  │   │
│  │  │                                                                        │   │
│  │  ✅  IN TRANSIT       18 Jun 2026  08:14                                 │   │
│  │  │   GPS active. Driver: Suresh P (+91-98XXXXXXXX)                       │   │
│  │  │   Last ping: 14:32  Loc: NH48 near Vadodara  Speed: 68 km/h           │   │
│  │  │   ─────────────────────────────────────────────────────────           │   │
│  │  │   ⚠ EXCEPTION     18 Jun 2026  12:00    System (Auto)                │   │
│  │  │   Arrival delay detected. ETA revised to 19:30. SLA at risk.          │   │
│  │  │                                                                        │   │
│  │  ⏳  ARRIVAL          Expected: 18 Jun 2026  19:30  [1h 30m late]       │   │
│  │  │   (Estimated — not yet arrived)                                        │   │
│  │  │                                                                        │   │
│  │  ○   UNLOADING        —                                                   │   │
│  │  │                                                                        │   │
│  │  ○   RECONCILED       —                                                   │   │
│  │  │                                                                        │   │
│  │  ○   CLOSED           —                                                   │   │
│  │                                                                           │   │
│  └──────────────────────────────────────────────────────────────────────────┘   │
│                                                                                  │
│  TIMELINE NODE LEGEND:                                                           │
│  ✅ Completed  •  ⏳ Pending/Expected  •  ○ Not reached  •  ⚠ Event/Exception    │
└──────────────────────────────────────────────────────────────────────────────────┘

TIMELINE ENTRY ANATOMY:
  [STATUS ICON] [STATUS LABEL]   [DATETIME]    [ACTOR (ROLE)]
  [  indent  ]  [Description / detail text]
  [  indent  ]  [Sub-events / GPS data if available]

STATUS ICON STATES:
  ✅ green filled check   = completed stage
  ⏳ amber clock          = expected (not yet reached)
  ○  gray empty circle   = not yet reached
  ⚠  amber warning       = event/exception occurred within this stage
  🔴 red filled circle   = breach / critical event
```

---

### 3.4 Tab 3 — Documents

```
┌── DOCUMENTS TAB ────────────────────────────────────────────────────────────────┐
│                                                                                  │
│  DOCUMENT CHECKLIST                                         [Upload Document +]  │
│                                                                                  │
│  ┌──────────────────────────────────────────────────────────────────────────┐   │
│  │  Document          Number              Status       Validated    Action   │   │
│  │  ─────────────────────────────────────────────────────────────────────── │   │
│  │  ASN               ASN-2024-0918       ✅ Verified   Auto         [View]  │   │
│  │  Invoice           INV-2024-1203       ✅ Verified   Auto         [View]  │   │
│  │  Seal Certificate  SL-20240118-07      ✅ Intact     At Loading   [View]  │   │
│  │  Gate Pass         GP-190618-004       ✅ Issued     Gate Officer [View]  │   │
│  │  e-Way Bill        EWB-240618-119      ✅ Valid       System       [View]  │   │
│  │  Vehicle RC        —                   ⚠ Pending    —            [Upload]│   │
│  │  Insurance         —                   ⚠ Pending    —            [Upload]│   │
│  │  Driver Licence    —                   ⚠ Pending    —            [Upload]│   │
│  │  POD               —                   ○ Awaited    On arrival   —       │   │
│  └──────────────────────────────────────────────────────────────────────────┘   │
│                                                                                  │
│  DOCUMENT VALIDATION SUMMARY:                                                    │
│  Core docs: ✅ 5/5 complete  •  Supporting docs: ⚠ 3 pending  •  POD: Awaited   │
│                                                                                  │
│  [DOCUMENT PREVIEW PANEL — opens on "View" click, right-side]                   │
│  Shows: document details, validation result, validator, timestamp, raw value     │
└──────────────────────────────────────────────────────────────────────────────────┘

DOCUMENT ROW STATUS ICONS:
  ✅ = verified/valid/complete
  ⚠  = pending/incomplete
  ○  = awaited (expected later in workflow)
  ❌ = failed/mismatched

DOCUMENT PREVIEW PANEL (right side, 480px):
  ┌────────────────────────────────────────────────────────┐
  │  ASN-2024-0918                            [×] Close    │
  │  ────────────────────────────────────────────────────  │
  │  Type:        Advance Shipment Notice                  │
  │  Number:      ASN-2024-0918                            │
  │  Dispatch:    TCT-0019                                 │
  │  Validated:   18 Jun 2026 07:55 (Auto-system)         │
  │  Result:      ✅ Valid — format match, dispatch match  │
  │  ────────────────────────────────────────────────────  │
  │  Raw value:   [ASN-2024-0918]                          │
  │  ────────────────────────────────────────────────────  │
  │  [Cross-reference check: ✅ matches dispatch ASN field]│
  │  [Duplicate check: ✅ unique]                          │
  └────────────────────────────────────────────────────────┘
```

---

### 3.5 Tab 4 — Vehicle & Driver

```
┌── VEHICLE & DRIVER TAB ─────────────────────────────────────────────────────────┐
│                                                                                  │
│  LEFT (Vehicle)                         RIGHT (Driver)                           │
│  ──────────────────────────────────     ──────────────────────────────────────   │
│                                                                                  │
│  VEHICLE PROFILE                        DRIVER PROFILE                           │
│  ┌───────────────────────────────┐      ┌────────────────────────────────────┐  │
│  │  🚛 MH-01-AX-2341             │      │  👤 Suresh Patil                    │  │
│  │  32 ft Truck  •  FTL          │      │  ID: DRV-0042                       │  │
│  │  ─────────────────────────    │      │  📞 +91-98765-43210                  │  │
│  │  Carrier:   BlueDart Logistics│      │  📧 suresh.p@carrier.com            │  │
│  │  Capacity:                    │      │  ─────────────────────────────────  │  │
│  │   Weight:   10,000 kg         │      │  Licence:   MH-20234567             │  │
│  │   Volume:   62 CBM            │      │  Exp:       Mar 2027  ✅ Valid       │  │
│  │   Max HU:   180               │      │  ─────────────────────────────────  │  │
│  │  ─────────────────────────    │      │  CURRENT TRIP STATUS                │  │
│  │  Current Load:                │      │  Departed:  08:14 Delhi DC          │  │
│  │   Weight:   2,800 kg  (28%)   │      │  Location:  NH48, Vadodara area     │  │
│  │   Volume:   18.4 CBM  (30%)   │      │  Speed:     68 km/h                 │  │
│  │   HU:       42        (23%)   │      │  ETA:       19:30 Mumbai DC         │  │
│  │   Util:     78% (binding:vol) │      │  ─────────────────────────────────  │  │
│  │  ─────────────────────────    │      │  QUICK ACTIONS                      │  │
│  │  FITNESS:   ✅ Valid till Nov  │      │  [📞 Call Driver]                   │  │
│  │  INSURANCE: ✅ Valid till Sep  │      │  [💬 WhatsApp]                      │  │
│  │  PUCC:      ✅ Valid           │      │  [📍 Request Location Update]       │  │
│  └───────────────────────────────┘      └────────────────────────────────────┘  │
│                                                                                  │
│  VEHICLE TRACKING STRIP                                                          │
│  ┌──────────────────────────────────────────────────────────────────────────┐   │
│  │  LAST 5 GPS PINGS                                                         │   │
│  │  14:32   NH48, Vadodara      68 km/h    ✅ On route                      │   │
│  │  14:02   NH48, Ankleshwar    71 km/h    ✅ On route                      │   │
│  │  13:32   NH48, Bharuch       69 km/h    ✅ On route                      │   │
│  │  13:02   NH48, Surat         72 km/h    ✅ On route                      │   │
│  │  12:32   NH48, Kim           70 km/h    ✅ On route                      │   │
│  │  [View Full Tracking Trail →] (opens Chain of Custody / Monitoring tab)  │   │
│  └──────────────────────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────────────────────┘
```

---

### 3.6 Tab 5 — Carrier

```
┌── CARRIER TAB ──────────────────────────────────────────────────────────────────┐
│                                                                                  │
│  CARRIER PROFILE                        CARRIER PERFORMANCE (this route)         │
│  ┌───────────────────────────────┐      ┌────────────────────────────────────┐  │
│  │  🏢 BlueDart Logistics Ltd    │      │  Route: DEL-MUM-01                 │  │
│  │  Type: FTL Express            │      │  ─────────────────────────────     │  │
│  │  ID:   CAR-001                │      │  Dispatches:   12                   │  │
│  │  ─────────────────────────    │      │  OTA%:         94%  🟢              │  │
│  │  Contact:                     │      │  OTD%:         91%  🟢              │  │
│  │  📞 1800-XXX-XXXX             │      │  Avg Delay:    8 min                │  │
│  │  📧 ops@bluedart.com          │      │  Exceptions:   2  (last 30d)        │  │
│  │  🌐 BlueDart.com              │      │  Cost/km:      ₹42                  │  │
│  │  ─────────────────────────    │      │  ─────────────────────────────     │  │
│  │  NETWORK PERFORMANCE:         │      │  CARRIER RANK: #1 of 6  🏆         │  │
│  │  Overall OTA:  96%  🟢        │      │  [View Full Carrier Profile →]      │  │
│  │  Overall OTD:  94%  🟢        │      └────────────────────────────────────┘  │
│  │  Exc Rate:     0.8%  🟢       │                                               │
│  │  Score:        92 / 100       │      CARRIER INTEGRATION STATUS              │
│  │  Status:       Top Performer  │      ┌────────────────────────────────────┐  │
│  │  ─────────────────────────    │      │  Shipment Created  ✅ 08:01        │  │
│  │  PREFERRED ROUTES:            │      │  Vehicle Assigned  ✅ 08:10        │  │
│  │  DEL-MUM-01  ★ Preferred      │      │  Tracking Active   ✅ 08:14        │  │
│  │  BOM-PUN-03  ★ Preferred      │      │  Last POD Update   ○ Awaited       │  │
│  │  [View All Routes →]          │      │  [Retry Shipment Sync]             │  │
│  └───────────────────────────────┘      └────────────────────────────────────┘  │
│                                                                                  │
│  QUICK ACTIONS:                                                                  │
│  [📞 Call Carrier Control]  [💬 WhatsApp Notification]  [📧 Email Ops Team]     │
└──────────────────────────────────────────────────────────────────────────────────┘
```

---

### 3.7 Tab 6 — HU Manifest

```
┌── HU MANIFEST TAB ──────────────────────────────────────────────────────────────┐
│                                                                                  │
│  MANIFEST SUMMARY                                      [⬇ Export Manifest]      │
│  Dispatched: 42  •  Received: —  •  Missing: —  •  Excess: —  •  Status: Live  │
│                                                                                  │
│  [All] [In Transit] [Received] [Missing] [Flagged]          [🔍 Search barcode] │
│                                                                                  │
│  ┌──────────────────────────────────────────────────────────────────────────┐   │
│  │  #   Barcode        Status        Registry Status    Last Event    Flag   │   │
│  │  ─────────────────────────────────────────────────────────────────────── │   │
│  │  1   HU0012301      In Transit    ✅ Registered     Loaded 08:10   —     │   │
│  │  2   HU0012302      In Transit    ✅ Registered     Loaded 08:10   —     │   │
│  │  3   HU0012303      In Transit    ✅ Registered     Loaded 08:10   —     │   │
│  │  ...                                                                       │   │
│  │  42  HU0012342      In Transit    ✅ Registered     Loaded 08:10   —     │   │
│  │                                                                            │   │
│  │  [Showing 42 of 42]                                                        │   │
│  └──────────────────────────────────────────────────────────────────────────┘   │
│                                                                                  │
│  HU ROW CLICK → opens HU Detail mini-panel (right side):                        │
│  ┌─────────────────────────────────────────────────────┐                        │
│  │  HU0012301                                [×]        │                        │
│  │  ─────────────────────────────────────────────────  │                        │
│  │  Dispatch:    TCT-0019                              │                        │
│  │  Status:      In Transit                            │                        │
│  │  Registered:  18 Jun 08:01 at DC Delhi              │                        │
│  │  Loaded:      18 Jun 08:10                          │                        │
│  │  Custody:     BlueDart / MH-01-AX-2341              │                        │
│  │  Tamper Flag: None                                  │                        │
│  │  ─────────────────────────────────────────────────  │                        │
│  │  [View Full Chain of Custody →]                     │                        │
│  └─────────────────────────────────────────────────────┘                        │
└──────────────────────────────────────────────────────────────────────────────────┘

HU STATUS COLORS:
  In Transit  = blue dot
  Received    = green dot
  Missing     = red dot + ⚠ flag
  Excess      = amber dot + ⚠ flag
  Damaged     = red dot + 🔴 flag
  Tamper      = dark red + 🔒 flag
```

---

## 4. SCREEN 3 — CHAIN OF CUSTODY

**Route:** `/dispatch/:id/custody` or `/custody/:barcode`
**Entry points:** HU row click in manifest → "View Full Chain of Custody"
**Purpose:** Full provenance trail for a single HU barcode

### 4.1 Full Screen Wireframe

```
╔══════════════════════════════════════════════════════════════════════════════════╗
║  ← Dispatch TCT-0019 › HU Manifest › Chain of Custody: HU0012301                ║
╠══════════════════════════════════════════════════════════════════════════════════╣
║                                                                                  ║
║  ┌── HU IDENTITY CARD ────────────────────────────────────────────────────────┐ ║
║  │  📦 HU0012301                                           [🔍 Scan Another]  │ ║
║  │  Dispatch: TCT-0019  •  Route: DEL-MUM-01  •  Status: IN TRANSIT 🔵        │ ║
║  │  No tamper flag  •  No theft flag  •  Seal intact                           │ ║
║  │                                          [⬇ Export CoC]  [🚨 Flag Tamper] │ ║
║  └────────────────────────────────────────────────────────────────────────────┘ ║
║                                                                                  ║
║  ┌── CHAIN OF CUSTODY TIMELINE ───────────────────────────────────────────────┐ ║
║  │                                                                              │ ║
║  │  STAGE 1: PACKED                                                             │ ║
║  │  ┌──────────────────────────────────────────────────────────────────────┐  │ ║
║  │  │ ✅  PACKED             17 Jun 2026  22:30    WH System (Auto)        │  │ ║
║  │  │     Location:  DC Delhi (Warehouse Zone B)                            │  │ ║
║  │  │     Packed by: System (WMS auto-registration)                        │  │ ║
║  │  │     SKU count: 24 units (mocked — no SKU master in current model)    │  │ ║
║  │  │     Barcode validated: ✅ Format HU\d{7} — pass                     │  │ ║
║  │  └──────────────────────────────────────────────────────────────────────┘  │ ║
║  │           │                                                                  │ ║
║  │  STAGE 2: LOADED                                                             │ ║
║  │  ┌──────────────────────────────────────────────────────────────────────┐  │ ║
║  │  │ ✅  LOADED             18 Jun 2026  08:10    Loading Team (WM)       │  │ ║
║  │  │     Vehicle:    MH-01-AX-2341 (32ft BlueDart)                        │  │ ║
║  │  │     Dispatch:   TCT-0019                                              │  │ ║
║  │  │     Seal No:    SL-20240118-07 (applied post-loading)                │  │ ║
║  │  │     Position:   Manifest item #1 of 42                                │  │ ║
║  │  │     Custody:    DC Delhi → BlueDart (MH-01-AX-2341)                  │  │ ║
║  │  └──────────────────────────────────────────────────────────────────────┘  │ ║
║  │           │                                                                  │ ║
║  │  STAGE 3: DISPATCHED                                                         │ ║
║  │  ┌──────────────────────────────────────────────────────────────────────┐  │ ║
║  │  │ ✅  DISPATCHED         18 Jun 2026  08:14    Gate Officer (WM)       │  │ ║
║  │  │     Gate Pass:  GP-190618-004 scanned                                │  │ ║
║  │  │     Seal Check: ✅ SL-20240118-07 intact at gate                    │  │ ║
║  │  │     Driver:     Suresh Patil (DRV-0042)                              │  │ ║
║  │  │     Custody:    BlueDart (MH-01-AX-2341) — full carrier custody      │  │ ║
║  │  └──────────────────────────────────────────────────────────────────────┘  │ ║
║  │           │                                                                  │ ║
║  │  STAGE 4: IN TRANSIT                ← CURRENT STAGE                         │ ║
║  │  ┌──────────────────────────────────────────────────────────────────────┐  │ ║
║  │  │ 🔵  IN TRANSIT         18 Jun 2026  08:14 → ONGOING                 │  │ ║
║  │  │     Vehicle Location: NH48 near Vadodara (14:32 last ping)           │  │ ║
║  │  │     Speed:        68 km/h                                             │  │ ║
║  │  │     Custody:      BlueDart in-transit (carrier full responsibility)   │  │ ║
║  │  │     Tamper Flag:  None                                                │  │ ║
║  │  │     GPS Pings:    32 (every 30 min since departure)                   │  │ ║
║  │  └──────────────────────────────────────────────────────────────────────┘  │ ║
║  │           │                                                                  │ ║
║  │  STAGE 5: UNLOADED          ⏳ Pending                                       │ ║
║  │  ┌──────────────────────────────────────────────────────────────────────┐  │ ║
║  │  │ ⏳  UNLOADED            Expected: 18 Jun 2026  ~19:30               │  │ ║
║  │  │     Location:     DC Mumbai (destination)                             │  │ ║
║  │  │     Scan session: Not started                                         │  │ ║
║  │  └──────────────────────────────────────────────────────────────────────┘  │ ║
║  │           │                                                                  │ ║
║  │  STAGE 6: RECEIVED          ○ Not reached                                    │ ║
║  │  ┌──────────────────────────────────────────────────────────────────────┐  │ ║
║  │  │ ○   RECEIVED            —                                             │  │ ║
║  │  │     Will be updated when scan session completes at destination        │  │ ║
║  │  └──────────────────────────────────────────────────────────────────────┘  │ ║
║  │                                                                              │ ║
║  └──────────────────────────────────────────────────────────────────────────────┘ ║
║                                                                                  ║
╚══════════════════════════════════════════════════════════════════════════════════╝
```

---

### 4.2 Custody Stage Definitions

```
STAGE MATRIX:

Stage       Icon  Status Triggers                     Custody Owner
──────────────────────────────────────────────────────────────────────
PACKED      📦    HURegistry.registerLoading()        Warehouse / DC
LOADED      🚛    HURegistry.markInTransit()          Dispatch + Vehicle
DISPATCHED  🚪    status → dispatched + gate pass     Carrier (in-transit)
IN TRANSIT  🛣    status → in-transit + GPS active    Carrier (full resp.)
UNLOADED    🏭    Scan session created at dest.        DC (receiving)
RECEIVED    ✅    ScanSession accepted barcode         DC / Warehouse

TAMPER EVENTS (shown as red inlined events within a stage):
  HURegistry.flagTamper()  → shows red inline event within IN TRANSIT stage:
  ┌──────────────────────────────────────────────────────────────────────┐
  │ 🔴  TAMPER FLAG       18 Jun 2026  11:45   System / Driver report   │
  │     Reason: Seal damaged — reported by driver at fuel stop           │
  │     Action: Exception EXC-0088 raised (theft-risk, HIGH)             │
  │     [View Exception →]                                                │
  └──────────────────────────────────────────────────────────────────────┘

CROSS-DISPATCH FLAG (wrong dispatch detection):
  HUValidator.checkCrossDispatch() returned true →
  Shows red inline event:
  ┌──────────────────────────────────────────────────────────────────────┐
  │ ⚠  MIS-ROUTING         [timestamp]   System (scan)                  │
  │     This HU was scanned on dispatch TCT-0031 but belongs to TCT-0019 │
  │     Scan result: wrong-dispatch                                       │
  └──────────────────────────────────────────────────────────────────────┘
```

---

### 4.3 Barcode Scanner Input (top of screen)

```
┌── SCAN ANOTHER HU ────────────────────────────────────────────────────────┐
│  Enter barcode to view its chain of custody                                │
│  ┌──────────────────────────────────────────────────────┐ [📷 Scan] [→]   │
│  │  HU0012301                                            │                  │
│  └──────────────────────────────────────────────────────┘                  │
│  Recent: HU0012301  HU0012298  HU0012274   [Clear history]                │
└────────────────────────────────────────────────────────────────────────────┘

INPUT BEHAVIOUR:
  Auto-focus on page load
  Accept: keyboard input or scanner device (USB HID / Bluetooth)
  On Enter / scan trigger → validate format → load CoC for barcode
  Invalid format → inline error "Invalid HU format. Expected: HUxxxxxxx"
  Not found in registry → "HU not registered in this dispatch"
  Recent barcodes stored in sessionStorage (last 10)
```

---

## 5. SCREEN 4 — TRANSPORT MONITORING

**Route:** `/transport/monitoring`
**Entry points:** "Track Live" button on dispatch card · "View Live Tracking" in Transport Exec nav
**Purpose:** Real-time fleet monitoring — all in-transit dispatches

### 5.1 Full Screen Wireframe

```
╔══════════════════════════════════════════════════════════════════════════════════╗
║  TRANSPORT MONITORING                                 [⚙ Config] [⬇ Export]    ║
╠══════════════════════════════════════════════════════════════════════════════════╣
║  SITUATION BAR                                                                   ║
╠══════════════════════════════════════════════════════════════════════════════════╣
║                                                                                  ║
║  ┌── FLEET STATUS STRIP ───────────────────────────────────────────────────┐   ║
║  │  [14 IN TRANSIT]  [2 🟡 AT RISK]  [1 🔴 BREACHED]  [0 IDLE]  [Refresh ↻] │   ║
║  └──────────────────────────────────────────────────────────────────────────┘   ║
║                                                                                  ║
║  ┌── MAIN LAYOUT ─────────────────────────────────────────────────────────────┐ ║
║  │                                                                              │ ║
║  │  LEFT: MONITORING TABLE (55%)          RIGHT: DISPATCH DETAIL PANEL (45%)   │ ║
║  │  ─────────────────────────────         ─────────────────────────────────── │ ║
║  │                                                                              │ ║
║  │  [All] [At Risk 🟡] [Breached 🔴]     [Select a dispatch to view details]  │ ║
║  │  [🔍 Search dispatch / vehicle]                                              │ ║
║  │                                                                              │ ║
║  │  ┌───────────────────────────────┐    ┌──────────────────────────────────┐ │ ║
║  │  │ TCT-0019  🔴 BREACHED         │ ←  │ (Empty state until row selected) │ │ ║
║  │  │ DEL-MUM-01 · MH-01-AX-2341   │    │  [Select a dispatch from the     │ │ ║
║  │  │ ETA: 19:30  SLA BREACH +1.5h  │    │   list to view live status]      │ │ ║
║  │  │ Driver: Suresh P 📞           │    └──────────────────────────────────┘ │ ║
║  │  │ Loc: NH48 Vadodara  14:32 ✓  │                                           │ ║
║  │  ├───────────────────────────────┤    WHEN ROW SELECTED:                     │ ║
║  │  │ TCT-0022  🟡 AT RISK          │    ┌──────────────────────────────────┐  │ ║
║  │  │ BOM-PUN-03 · MH-12-BX-8834   │    │  TCT-0019 — BREACHED 🔴           │  │ ║
║  │  │ ETA: 16:00  SLA Rem: 1h 10m  │    │  ──────────────────────────────── │  │ ║
║  │  │ Driver: Vikram R 📞           │    │                                    │  │ ║
║  │  │ Loc: Mumbai Outskirts  14:28 ✓│    │  LIVE TRACKING PANEL              │  │ ║
║  │  ├───────────────────────────────┤    │  ┌────────────────────────────┐   │  │ ║
║  │  │ TCT-0028  🟢 ON TRACK         │    │  │   [ROUTE MAP SVG]          │   │  │ ║
║  │  │ DEL-HYD-02 · AP-05-CY-1192   │    │  │   Origin ●━━━━━━━━━━━▶ Dest│   │  │ ║
║  │  │ ETA: 22:00  SLA Rem: 8h       │    │  │         🚛 (current pos)   │   │  │ ║
║  │  │ Driver: Rajan M 📞            │    │  └────────────────────────────┘   │  │ ║
║  │  │ Loc: Agra  14:30 ✓           │    │                                    │  │ ║
║  │  ├───────────────────────────────┤    │  ETA TIMELINE:                     │  │ ║
║  │  │ TCT-0031  🟢 ON TRACK         │    │  Planned: 18:00  ETA: 19:30        │  │ ║
║  │  │ DEL-BLR-03 · KA-01-DX-4421   │    │  Current: 14:32  Delay: +1h 30m   │  │ ║
║  │  │ ETA: 08:00 tmrw  SLA: 18h     │    │                                    │  │ ║
║  │  │ Driver: Manoj K 📞            │    │  SLA STATUS:                       │  │ ║
║  │  │ Loc: Bangalore City  14:31 ✓  │    │  ████████████████████  BREACHED    │  │ ║
║  │  │                               │    │  Overdue by: 1h 30min              │  │ ║
║  │  │ [+ 10 more]                   │    │                                    │  │ ║
║  │  └───────────────────────────────┘    │  ACTIONS:                          │  │ ║
║  │                                        │  [📞 Call Driver]                 │  │ ║
║  │                                        │  [🔺 Escalate Exception]           │  │ ║
║  │                                        │  [📧 Notify Carrier]              │  │ ║
║  │                                        │  [📄 View Full Dispatch]          │  │ ║
║  │                                        └──────────────────────────────────┘  │ ║
║  └──────────────────────────────────────────────────────────────────────────────┘ ║
╚══════════════════════════════════════════════════════════════════════════════════╝
```

---

### 5.2 Monitoring List Row Specification

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ [SLA DOT] [DISPATCH ID]          [STATUS BADGE]            [CARRIER PHONE]   │
│           [ROUTE CODE] · [VEHICLE REG]                                        │
│           ETA: [TIME]    SLA Rem: [TIME] / SLA BREACH +[TIME]                │
│           Driver: [NAME]                     [📞 inline call icon]            │
│           Loc: [LOCATION DESCRIPTION]  [TIMESTAMP] [✓ fresh / ⚠ stale]      │
│           [SLA MINI-BAR: ██████░░░░]                          [▶ View Panel] │
└──────────────────────────────────────────────────────────────────────────────┘

SLA DOT:
  Green  = >4h remaining
  Amber  = 1–4h remaining
  Red    = <1h remaining or breached

GPS FRESHNESS:
  ✓ fresh   = last ping < 60 min ago (green)
  ⚠ stale   = last ping 1–4h ago (amber)
  ✗ no data = last ping > 4h or no GPS (red)

SORT DEFAULT: SLA risk ascending (most urgent first)
SORT OPTIONS: ETA, Route, Carrier, SLA Remaining, GPS Last Seen

ROW CLICK → selects row + populates right panel (no navigation)
DRIVER PHONE CLICK → tel: link (mobile) or "Copy number" on desktop
```

---

### 5.3 Live Detail Panel (right side)

```
┌── LIVE DETAIL PANEL ────────────────────────────────────────────────────────┐
│  TCT-0019  DEL-MUM-01                              [📄 Full Detail]         │
│  ──────────────────────────────────────────────────────────────────────     │
│                                                                              │
│  ROUTE PROGRESS SVG                                                          │
│  ┌────────────────────────────────────────────────────────────────────┐     │
│  │  DC DELHI ●━━━━━━━━━━━━━━━━━━━━━━🚛━━━━━━━━━━░░░░░░░● DC MUMBAI  │     │
│  │           │←──── 940 km done ────→│←── 480 km left ──→│           │     │
│  │           Departed 08:14           Current 14:32         ETA 19:30 │     │
│  └────────────────────────────────────────────────────────────────────┘     │
│                                                                              │
│  ┌──────────────────────┬──────────────────────────────────────────────┐    │
│  │  CURRENT POSITION    │  LAST GPS PING                               │    │
│  │  NH48, Vadodara area │  14:32 (42 min ago) ✓ fresh                 │    │
│  │  Gujarat             │  Speed: 68 km/h  Heading: South-West        │    │
│  └──────────────────────┴──────────────────────────────────────────────┘    │
│                                                                              │
│  ETA BREAKDOWN:                                                              │
│  ┌──────────────────────────────────────────────────────────────────────┐    │
│  │  Distance remaining:   480 km                                        │    │
│  │  Estimated avg speed:  65 km/h                                       │    │
│  │  Est. travel time:     7h 22min                                      │    │
│  │  Scheduled stops:      1 (fuel, ~30 min)                             │    │
│  │  ──────────────────────────────────────────────────────────────────  │    │
│  │  Current ETA:          19:30  (vs planned 18:00)                     │    │
│  │  Delay:                +1h 30min  🔴 BREACH                          │    │
│  └──────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
│  SLA STATUS:                                                                 │
│  ████████████████████████████████████████  BREACHED                         │
│  Planned: 10h window  •  Used: 11h 30min  •  Overdue: 1h 30min              │
│                                                                              │
│  EXCEPTIONS ON THIS DISPATCH (1):                                            │
│  🟡 HIGH  arrival-delay  Raised 12:00  Assigned: Ops Exec                   │
│  [View Exception]  [Escalate]                                                │
│                                                                              │
│  QUICK ACTIONS:                                                              │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │  [📞 Call Driver]  [📧 Email Carrier]  [🔺 Escalate]  [⚠ Raise Exc] │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
│  GPS TRAIL (last 6 pings):                                                   │
│  14:32  NH48 Vadodara  68 km/h  ✓                                           │
│  14:02  NH48 Ankleshwar  71 km/h  ✓                                         │
│  13:32  NH48 Bharuch  69 km/h  ✓                                            │
│  [View Full Trail →]                                                         │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

### 5.4 Route Progress SVG Specification

```
SVG DIMENSIONS: 100% width × 80px height
VIEWBOX: 0 0 600 80

ELEMENTS:
  Origin node:    Circle r=8, fill=#16A34A, cx=30
  Dest node:      Circle r=8, fill=#6B7280, cx=570 (or red if breached)
  Route line:     Rect height=4, y=36, from cx=38 to cx=562
                  Left of vehicle: fill=#16A34A (completed, green)
                  Right of vehicle: fill=#E2E8F0 (remaining, gray)
  Vehicle icon:   Text "🚛" or SVG truck icon at calculated x position
                  x = 30 + (distanceDone/totalDistance) × 540

VEHICLE X CALCULATION:
  completedRatio = (totalDistanceKm - remainingKm) / totalDistanceKm
  vehicleX = 30 + completedRatio × 540

LABELS:
  Origin label:  y=70, x=30, anchor=middle, 10px
  Dest label:    y=70, x=570, anchor=middle, 10px
  Vehicle label: y=28, x=vehicleX, anchor=middle, 9px (dispatch ID or "🚛")

ANIMATIONS:
  Vehicle icon: subtle left-right oscillation (±2px) to indicate movement
                CSS: transform: translateX(0) → translateX(2px) → 0, 2s loop
  Completed line: green color, static
```

---

## 6. SCREEN 5 — DISPATCH SEARCH CENTER

**Route:** `/dispatch/search`
**Entry points:** Search icon in workbench header · Direct nav item
**Purpose:** Advanced search with saved searches and full filter set

### 6.1 Full Screen Wireframe

```
╔══════════════════════════════════════════════════════════════════════════════════╗
║  DISPATCH SEARCH CENTER                                [⬇ Export Results]       ║
╠══════════════════════════════════════════════════════════════════════════════════╣
║                                                                                  ║
║  ┌── SEARCH BAR ──────────────────────────────────────────────────────────────┐ ║
║  │  🔍  Search dispatch ID, barcode, vehicle, route, carrier...               │ ║
║  │  ┌──────────────────────────────────────────────────────────┐  [Search]   │ ║
║  │  │  TCT-0019                                                 │             │ ║
║  │  └──────────────────────────────────────────────────────────┘             │ ║
║  │  Suggestions: [TCT-0019] [TCT-0190] [TCT-1900]                            │ ║
║  └────────────────────────────────────────────────────────────────────────────┘ ║
║                                                                                  ║
║  ┌── LAYOUT: FILTERS LEFT (320px) + RESULTS RIGHT ──────────────────────────┐  ║
║  │                                                                            │  ║
║  │  FILTER PANEL (left)                RESULTS PANEL (right)                 │  ║
║  │  ──────────────────────             ─────────────────────────────────     │  ║
║  │                                                                            │  ║
║  │  [Clear All Filters]                48 results found                       │  ║
║  │  [💾 Save This Search]              Sort: [ETA ▼]  [Relevance] [Status]   │  ║
║  │                                                                            │  ║
║  │  STATUS                             ┌──────────────────────────────────┐  │  ║
║  │  ☑ Planned (12)                     │ TCT-0019  🔴 BREACH  DEL-MUM-01  │  │  ║
║  │  ☑ Ready   (8)                      │ BlueDart · MH-01-AX-2341         │  │  ║
║  │  ☑ Dispatched (5)                   │ ETA: 19:30  Delay: +1h 30m       │  │  ║
║  │  ☑ In Transit (14)                  │ [View Details]  [Track Live]     │  │  ║
║  │  ☑ Arrived  (6)                     └──────────────────────────────────┘  │  ║
║  │  ☑ Unloading (2)                                                           │  ║
║  │  ☑ Reconciled (5)                   ┌──────────────────────────────────┐  │  ║
║  │  ☑ Closed  (3)                      │ TCT-0022  🟡 AT RISK BOM-PUN-03  │  │  ║
║  │                                     │ DTDC · MH-12-BX-8834             │  │  ║
║  │  DATE RANGE                         │ ETA: 16:00  SLA Rem: 1h 10m      │  │  ║
║  │  From: [18 Jun 2026    📅]          │ [View Details]  [Track Live]     │  │  ║
║  │  To:   [18 Jun 2026    📅]          └──────────────────────────────────┘  │  ║
║  │                                                                            │  ║
║  │  ROUTE                              ┌──────────────────────────────────┐  │  ║
║  │  ☐ DEL-MUM-01                       │ TCT-0028  🟢 ON TRACK DEL-HYD   │  │  ║
║  │  ☐ BOM-PUN-03                       │ BlueDart · AP-05-CY-1192         │  │  ║
║  │  ☐ DEL-HYD-02                       │ ETA: 22:00  SLA Rem: 8h         │  │  ║
║  │  ☐ MAA-BLR-01                       │ [View Details]  [Track Live]     │  │  ║
║  │  [+ 4 more routes]                  └──────────────────────────────────┘  │  ║
║  │                                                                            │  ║
║  │  CARRIER                            [+ 45 more results]                   │  ║
║  │  ☐ BlueDart (18)                    [Load More]    [View All as Table]    │  ║
║  │  ☐ DTDC (12)                                                               │  ║
║  │  ☐ Delhivery (9)                                                           │  ║
║  │  ☐ XpressBees (7)                                                          │  ║
║  │  [+ 2 more]                                                                │  ║
║  │                                                                            │  ║
║  │  SLA STATUS                                                                │  ║
║  │  ☐ On Track                                                                │  ║
║  │  ☐ At Risk                                                                 │  ║
║  │  ☐ Breached                                                                │  ║
║  │                                                                            │  ║
║  │  EXCEPTION                                                                 │  ║
║  │  ☐ Has open exceptions                                                     │  ║
║  │  ☐ No exceptions                                                           │  ║
║  │  ☐ Has critical exceptions                                                 │  ║
║  │                                                                            │  ║
║  │  HU COUNT                                                                  │  ║
║  │  Min: [  1  ]   Max: [180  ]                                               │  ║
║  │                                                                            │  ║
║  │  VEHICLE TYPE                                                              │  ║
║  │  ☐ LCV     ☐ 20ft  ☐ 26ft                                                 │  ║
║  │  ☐ 32ft    ☐ Trailer                                                       │  ║
║  │                                                                            │  ║
║  │  ─────────────────────────────────────────────────────────────────────    │  ║
║  │  SAVED SEARCHES                                                            │  ║
║  │  ┌──────────────────────────────────┐                                      │  ║
║  │  │ 📌 Today's At-Risk                [Load] [Delete]                      │  ║
║  │  │    Status: In Transit  SLA: At Risk                                    │  ║
║  │  ├──────────────────────────────────┤                                      │  ║
║  │  │ 📌 BlueDart North Region          [Load] [Delete]                      │  ║
║  │  │    Carrier: BlueDart  Region: North                                    │  ║
║  │  ├──────────────────────────────────┤                                      │  ║
║  │  │ 📌 DEL-MUM Critical               [Load] [Delete]                      │  ║
║  │  │    Route: DEL-MUM-01  Exc: Critical                                    │  ║
║  │  └──────────────────────────────────┘                                      │  ║
║  │  [+ New Saved Search]                                                      │  ║
║  │                                                                            │  ║
║  └────────────────────────────────────────────────────────────────────────────┘  ║
╚══════════════════════════════════════════════════════════════════════════════════╝
```

---

### 6.2 Saved Search Specification

```
SAVED SEARCH OBJECT (stored in localStorage: tct_saved_searches[]):
{
  id:          "SS-001",
  name:        "Today's At-Risk",
  filters: {
    status:      ["in-transit"],
    slaStatus:   ["at-risk"],
    dateFrom:    null,      // null = "today" (dynamic)
    dateTo:      null,
    carrierId:   [],
    routeId:     [],
    regionId:    [],
    severity:    [],
    vehicleType: [],
    hasExceptions: false,
    huCountMin:  null,
    huCountMax:  null,
  },
  createdAt:   "2026-06-18T08:00:00Z",
  createdBy:   "Rahul Kumar",
  lastUsed:    "2026-06-18T14:00:00Z",
  useCount:    7,
}

SAVE SEARCH MODAL:
┌──────────────────────────────────────────────────────────────┐
│  Save This Search                                 [×] Close  │
│  ────────────────────────────────────────────────────────    │
│  Name:  [Today's At-Risk Dispatches               ]          │
│                                                              │
│  Active filters being saved:                                 │
│  • Status: In Transit                                        │
│  • SLA Status: At Risk                                       │
│  • Date: Today (dynamic)                                     │
│                                                              │
│  ☑ Make date range dynamic (always "today")                  │
│  ☑ Share with team                                           │
│                                                              │
│  [Cancel]                          [💾 Save Search]         │
└──────────────────────────────────────────────────────────────┘

SEARCH RESULT CARD (in results panel):
┌──────────────────────────────────────────────────────────────────┐
│  [SLA DOT] [DISPATCH ID]   [STATUS BADGE]    [SLA BADGE]         │
│  [ROUTE CODE]  [ORIGIN → DEST]                                   │
│  [CARRIER] · [VEHICLE REG]                                       │
│  ETA: [TIME]   Delay: [±TIME]    HUs: [N]   Exceptions: [N]     │
│  ─────────────────────────────────────────────────────────────── │
│  [View Details →]                           [Track Live]         │
└──────────────────────────────────────────────────────────────────┘
```

---

## 7. REACT COMPONENT HIERARCHY

### 7.1 File Organisation

```
src/
├── pages/
│   └── operations/
│       ├── OperationsLayout.jsx           ← wraps all ops screens
│       ├── DispatchWorkbench.jsx
│       ├── DispatchDetail.jsx
│       ├── ChainOfCustody.jsx
│       ├── TransportMonitoring.jsx
│       └── DispatchSearchCenter.jsx
│
├── components/
│   ├── operations/
│   │   ├── SituationBar.jsx
│   │   ├── OpsSubNav.jsx
│   │   │
│   │   ├── workbench/
│   │   │   ├── DispatchWorkbench.jsx
│   │   │   ├── WorkbenchFilterBar.jsx
│   │   │   ├── WorkbenchViewToggle.jsx
│   │   │   ├── KanbanColumn.jsx
│   │   │   ├── DispatchCard.jsx
│   │   │   ├── DispatchCardHeader.jsx
│   │   │   ├── DispatchCardBody.jsx
│   │   │   ├── DispatchCardFooter.jsx
│   │   │   ├── SLAMiniBar.jsx
│   │   │   ├── DispatchContextMenu.jsx
│   │   │   ├── ArrivedPendingStrip.jsx
│   │   │   ├── ArrivedPendingRow.jsx
│   │   │   └── DispatchTableView.jsx
│   │   │
│   │   ├── detail/
│   │   │   ├── DispatchDetailPage.jsx
│   │   │   ├── DispatchDetailHeader.jsx
│   │   │   ├── DispatchTimestamp4Panel.jsx
│   │   │   ├── SLAClock.jsx
│   │   │   ├── DispatchDetailTabStrip.jsx
│   │   │   ├── tabs/
│   │   │   │   ├── OverviewTab.jsx
│   │   │   │   ├── TimelineTab.jsx
│   │   │   │   │   ├── TimelineStage.jsx
│   │   │   │   │   └── TimelineEvent.jsx
│   │   │   │   ├── DocumentsTab.jsx
│   │   │   │   │   ├── DocumentRow.jsx
│   │   │   │   │   └── DocumentPreviewPanel.jsx
│   │   │   │   ├── VehicleDriverTab.jsx
│   │   │   │   │   ├── VehicleProfileCard.jsx
│   │   │   │   │   ├── DriverProfileCard.jsx
│   │   │   │   │   └── GPSPingTable.jsx
│   │   │   │   ├── CarrierTab.jsx
│   │   │   │   │   ├── CarrierProfileCard.jsx
│   │   │   │   │   ├── CarrierRoutePerf.jsx
│   │   │   │   │   └── CarrierIntegrationStatus.jsx
│   │   │   │   ├── HUManifestTab.jsx
│   │   │   │   │   ├── ManifestSummaryBar.jsx
│   │   │   │   │   ├── HUManifestTable.jsx
│   │   │   │   │   ├── HURow.jsx
│   │   │   │   │   └── HUDetailMiniPanel.jsx
│   │   │   │   ├── ExceptionsTab.jsx
│   │   │   │   └── AuditTrailTab.jsx
│   │   │   └── DispatchQuickActions.jsx
│   │   │
│   │   ├── custody/
│   │   │   ├── ChainOfCustodyPage.jsx
│   │   │   ├── HUIdentityCard.jsx
│   │   │   ├── BarcodeScannerInput.jsx
│   │   │   ├── CustodyTimeline.jsx
│   │   │   ├── CustodyStage.jsx
│   │   │   │   ├── CustodyStageHeader.jsx
│   │   │   │   ├── CustodyStageBody.jsx
│   │   │   │   └── CustodyInlineEvent.jsx   ← for tamper, mis-route
│   │   │   └── TamperFlagModal.jsx
│   │   │
│   │   ├── monitoring/
│   │   │   ├── TransportMonitoringPage.jsx
│   │   │   ├── FleetStatusStrip.jsx
│   │   │   ├── MonitoringListPanel.jsx
│   │   │   │   ├── MonitoringFilterTabs.jsx
│   │   │   │   └── MonitoringListRow.jsx
│   │   │   ├── LiveDetailPanel.jsx
│   │   │   │   ├── RouteProgressSVG.jsx
│   │   │   │   ├── ETABreakdown.jsx
│   │   │   │   ├── SLAStatusBar.jsx
│   │   │   │   └── GPSTrailMini.jsx
│   │   │   └── MonitoringQuickActions.jsx
│   │   │
│   │   └── search/
│   │       ├── DispatchSearchPage.jsx
│   │       ├── SearchBar.jsx
│   │       │   └── SearchSuggestions.jsx
│   │       ├── SearchFilterPanel.jsx
│   │       │   ├── StatusFilter.jsx
│   │       │   ├── DateRangeFilter.jsx
│   │       │   ├── RouteFilter.jsx
│   │       │   ├── CarrierFilter.jsx
│   │       │   ├── SLAStatusFilter.jsx
│   │       │   ├── ExceptionFilter.jsx
│   │       │   ├── HUCountRangeFilter.jsx
│   │       │   ├── VehicleTypeFilter.jsx
│   │       │   └── SavedSearchList.jsx
│   │       │       └── SavedSearchCard.jsx
│   │       ├── SearchResultsPanel.jsx
│   │       │   ├── SearchResultCard.jsx
│   │       │   └── SaveSearchModal.jsx
│   │       └── SearchResultTableView.jsx
│   │
│   └── shared/
│       ├── SLAClock.jsx                   ← reused across workbench + detail
│       ├── StatusBadge.jsx
│       ├── SLAStatusBadge.jsx
│       ├── GradeBadge.jsx
│       ├── TrendBadge.jsx
│       ├── GPSFreshnessIndicator.jsx
│       ├── TimeAgo.jsx
│       ├── DispatchStatusDot.jsx
│       ├── ActionButton.jsx
│       └── ConfirmPopover.jsx
│
├── hooks/
│   ├── useDispatchList.js
│   ├── useDispatchDetail.js
│   ├── useChainOfCustody.js
│   ├── useTransportMonitoring.js
│   ├── useDispatchSearch.js
│   ├── useSavedSearches.js
│   └── useSituationBar.js
│
└── context/
    └── DispatchSelectionContext.jsx       ← selected dispatch for monitoring panel
```

---

### 7.2 Key Component Props

```jsx
// ── DispatchCard ──────────────────────────────────────────────────────────────
DispatchCard.propTypes = {
  dispatch: shape({
    id:              string.isRequired,
    status:          string.isRequired,
    routeCode:       string,
    routeName:       string,
    vehicleReg:      string,
    carrierName:     string,
    plannedDeparture:string,
    plannedArrival:  string,
    actualDeparture: string,
    huCount:         number,
    totalWeightKg:   number,
    exceptionCount:  number,
    sla: shape({
      atRisk:         bool,
      breached:       bool,
      hoursRemaining: number,
      hoursOverdue:   number,
    }),
    utilization: shape({
      overallPct: number,
    }),
  }).isRequired,
  onPrimaryAction: func,    // context-aware (dispatch / track / unload)
  onViewDetail:    func,
  onContextMenu:   shape({
    onAssignVehicle:    func,
    onAssignCarrier:    func,
    onMarkDeparted:     func,
    onRaiseException:   func,
    onContactCarrier:   func,
    onViewAudit:        func,
  }),
}

// ── KanbanColumn ─────────────────────────────────────────────────────────────
KanbanColumn.propTypes = {
  status:     string.isRequired,
  label:      string.isRequired,
  accentColor:string.isRequired,
  dispatches: arrayOf(shape({ id: string })).isRequired,
  totalCount: number.isRequired,
  onLoadMore: func,
  onViewAll:  func,
}

// ── SLAClock ─────────────────────────────────────────────────────────────────
SLAClock.propTypes = {
  slaWindowHrs:    number.isRequired,
  hoursUsed:       number,
  hoursRemaining:  number,
  hoursOverdue:    number,
  atRisk:          bool,
  breached:        bool,
  variant:         oneOf(['bar','ring','compact','text']),
  // 'bar'     = full progress bar (detail page)
  // 'ring'    = circular ring (monitoring panel)
  // 'compact' = thin mini bar (kanban card)
  // 'text'    = "2h 30m remaining" text only
}

// ── TimelineStage ─────────────────────────────────────────────────────────────
TimelineStage.propTypes = {
  stage:     string.isRequired,    // 'planned','ready','dispatched',...
  label:     string.isRequired,
  completed: bool.isRequired,
  current:   bool,
  pending:   bool,
  datetime:  string,
  actor:     string,
  role:      string,
  detail:    string,               // description text
  events:    arrayOf(shape({       // inline events (exceptions, GPS)
    type:    string,
    datetime:string,
    message: string,
    severity:string,
  })),
}

// ── CustodyStage ──────────────────────────────────────────────────────────────
CustodyStage.propTypes = {
  stageNo:   number.isRequired,    // 1–6
  stageName: oneOf(['packed','loaded','dispatched','in-transit','unloaded','received']),
  status:    oneOf(['completed','current','pending','not-reached']),
  data:      shape({
    timestamp: string,
    location:  string,
    actor:     string,
    custodyOwner: string,
    detail:    string,
    inlineEvents: arrayOf(shape({
      type:    oneOf(['tamper','mis-route','exception']),
      datetime:string,
      message: string,
    })),
  }),
}

// ── RouteProgressSVG ──────────────────────────────────────────────────────────
RouteProgressSVG.propTypes = {
  totalDistanceKm:    number.isRequired,
  remainingDistanceKm:number.isRequired,
  originLabel:        string.isRequired,
  destLabel:          string.isRequired,
  departedAt:         string,
  currentETA:         string,
  slaStatus:          oneOf(['on-track','at-risk','breached']),
  animated:           bool,    // vehicle oscillation animation
}

// ── MonitoringListRow ─────────────────────────────────────────────────────────
MonitoringListRow.propTypes = {
  dispatch:   shape({
    id:         string,
    routeCode:  string,
    vehicleReg: string,
    driverName: string,
    driverPhone:string,
    sla:        shape({ atRisk: bool, breached: bool, hoursRemaining: number }),
    lastGPS:    shape({ location: string, timestamp: string, speedKmh: number }),
    etaTime:    string,
  }).isRequired,
  selected:   bool,
  onSelect:   func,
}

// ── SearchFilterPanel ─────────────────────────────────────────────────────────
SearchFilterPanel.propTypes = {
  filters:       object.isRequired,   // current filter state
  onFilterChange:func.isRequired,     // (filterKey, value) => void
  onClearAll:    func.isRequired,
  onSaveSearch:  func.isRequired,
  facets:        shape({              // counts per filter option
    status:   object,
    carriers: array,
    routes:   array,
  }),
}

// ── SavedSearchCard ────────────────────────────────────────────────────────────
SavedSearchCard.propTypes = {
  search: shape({
    id:        string,
    name:      string,
    filters:   object,
    createdAt: string,
    useCount:  number,
  }),
  onLoad:    func,
  onDelete:  func,
  onRename:  func,
}
```

---

## 8. SHARED OPERATIONAL COMPONENTS

### 8.1 SLAClock (multi-variant)

```
VARIANT: BAR (used in Dispatch Detail header)
┌─────────────────────────────────────────────────────────────────────────┐
│  ████████████████████████░░░░░░░  7h 30m used  •  2h 30m remaining      │
│  ──────────────────────────────────────────────────────────────────     │
│  SLA Window: 10 hours  •  Status: 🟡 AT RISK  •  Breach risk: HIGH      │
└─────────────────────────────────────────────────────────────────────────┘

VARIANT: COMPACT MINI BAR (used in Kanban cards)
[████████░░░  2h left]   ← 120px wide, 6px height

VARIANT: TEXT ONLY (used in table cells)
  "2h 30m"  🟡         ← colored status dot + time string

VARIANT: RING (used in monitoring detail panel, future)
  Circular progress ring, 80px diameter

BAR COLOR TRANSITIONS:
  >6h remaining:   --status-success  (green)
  2–6h remaining:  --status-warning  (amber)
  <2h remaining:   --status-danger   (red) + pulsing animation
  Breached:        --status-danger   full bar + "OVERDUE +Xh Ymin" text

PULSE ANIMATION (<2h remaining):
  box-shadow: 0 0 0 0 rgba(220, 38, 38, 0.4) → 0 0 0 8px rgba(220,38,38,0)
  Duration: 1s, infinite
```

### 8.2 StatusBadge & SLAStatusBadge

```
StatusBadge (dispatch status):
  Props: status (string), size ('sm'|'md'|'lg')
  Output: colored pill with status label
  Colors: use --s-[status] tokens

  sm: 8px/12px, 3px 8px padding
  md: 11px/16px, 4px 10px padding (default)
  lg: 13px/20px, 6px 14px padding

SLAStatusBadge:
  Props: atRisk (bool), breached (bool), hoursRemaining (number)
  Variants:
    On Track  = green pill "✅ ON TRACK"
    At Risk   = amber pill "🟡 AT RISK"
    Breached  = red pill "🔴 BREACHED"
    Unknown   = gray pill "— PENDING"

DispatchStatusDot:
  Props: status (string), size (number, px)
  A colored circle only (no label) — used in list rows
```

### 8.3 GPSFreshnessIndicator

```
Props: lastPingTimestamp (ISO string), variant ('dot'|'text'|'full')

dot:   colored dot only (green/amber/red)
text:  "14:32 ✓" or "14:32 ⚠" or "No GPS ✗"
full:  "Last ping: 14:32 (42 min ago) ✓ fresh"

FRESHNESS THRESHOLDS:
  < 60 min = fresh ✓ (green)
  60–240 min = stale ⚠ (amber)
  > 240 min or null = no data ✗ (red)
```

### 8.4 ConfirmPopover

```
Used for: Escalate, Mark Departed, Mark Arrived (any irreversible state change)

Props:
  trigger:    ReactNode (the button that opens it)
  title:      string ("Escalate to Level 2?")
  message:    string ("This will notify [role]. Continue?")
  confirmLabel:string ("Escalate")
  cancelLabel: string ("Cancel")
  confirmVariant: 'danger'|'warning'|'primary'
  onConfirm:  func
  onCancel:   func

PLACEMENT: above trigger, centered, 280px wide
DISMISS: click outside, Escape key, Cancel button

ANATOMY:
┌──────────────────────────────────────────────┐
│  Mark this dispatch as Departed?             │
│  ───────────────────────────────────────     │
│  This will advance status to DISPATCHED and  │
│  start the SLA clock. Cannot be undone.      │
│  ───────────────────────────────────────     │
│  [Cancel]                  [Confirm ▷]       │
└──────────────────────────────────────────────┘
```

---

## 9. UX INTERACTIONS & STATE TRANSITIONS

### 9.1 Dispatch State Advance Flow (Workbench → Primary Action)

```
PLANNED → READY:
  1. Click [Assign Vehicle & Carrier] on card
  2. Opens assignment modal (vehicle dropdown + carrier dropdown)
  3. Validation: vehicle capacity check (CapacityEngine.isOverloaded)
  4. Confirm → LifecycleEngine.transition(id, 'ready', actor)
  5. Card moves to READY column (animated slide)
  6. Success toast: "TCT-0019 moved to Ready"

READY → DISPATCHED:
  1. [Mark Dispatched] on card
  2. Pre-check: docs complete? If not → warning modal
     "The following documents are pending: [list]. Continue anyway? [Cancel] [Override]"
  3. Confirm (or override) → LifecycleEngine.transition(id, 'dispatched', actor)
  4. Card slides to DISPATCHED column
  5. SLA clock starts (step 2 SLAClock)
  6. DomainEventBus.emit('DispatchDeparted', { dispatchId }) → notification fires

DISPATCHED → IN TRANSIT:
  1. [Confirm Departure] on card
  2. ConfirmPopover: "Confirm vehicle MH-01-AX-2341 has physically left the gate?"
  3. On confirm → LifecycleEngine.transition(id, 'in-transit', actor)
  4. Tracking begins (CarrierAdapter.pushTrackingUpdate fires stub)
  5. Card moves to IN TRANSIT column

IN TRANSIT → ARRIVED:
  1. [Mark Arrived] in workbench or transport monitoring
  2. ConfirmPopover + timestamp picker: "Actual arrival time?"
  3. On confirm → LifecycleEngine.transition with actualArrival
  4. OTA calculated (KPIEngine.calculateOTA)
  5. Card moves to ARRIVED strip (bottom section)
  6. DomainEventBus.emit('DispatchArrived') → carrier notification

ARRIVED → UNLOADING:
  1. [Start Unloading] in arrived strip
  2. Navigate to /reconciliation/scan/:dispatchId
  3. Scan session created (step 3 createScanSession)
```

### 9.2 Kanban Card Animations

```
CARD MOVE (status advance):
  1. Card fades out in source column (opacity 1→0, 300ms)
  2. Column count badge decrements (-1 with count-down animation)
  3. Card slides into destination column from top (translateY -20px → 0, 200ms)
  4. Destination column count badge increments (+1)
  5. New card glows briefly (background flash green 200ms)

NEW CARD ARRIVES (realtime update from polling):
  Card prepends to column
  Slides in from top (translateY -40px → 0, 250ms)
  Left border flashes accent color (200ms)

CARD ALERT STATE CHANGE (at-risk status updates):
  SLA badge color changes (green → amber → red)
  Transition: background-color 500ms
  Card border-left changes color (500ms)
  At-risk: amber pulse added to border

COLUMN LOAD MORE:
  [+ N more] click → 3 more cards fade in below
  No page refresh — data from pre-fetched list slice
```

### 9.3 Monitoring Panel Selection

```
ROW CLICK (monitoring list):
  Row background: --surface-canvas → --surface-card (selected state)
  Left border: 3px solid --brand-accent
  Right panel: slides in content (if previously empty: fade in, 200ms)
  Right panel: if switching from another dispatch: crossfade (200ms)

ROUTE PROGRESS SVG (when dispatch selected):
  Vehicle position calculated from remainingDistanceKm
  Vehicle icon: small left-right oscillation (±2px, 2s loop, CSS animation)
  Completed route segment: green color
  Remaining segment: gray

DETAIL PANEL AUTO-REFRESH:
  Selected dispatch data refreshes every 60 seconds (GPS + SLA update)
  GPS ping table: new row slides in from top when new ping arrives
  ETA field: updates in place with count animation if value changed
```

### 9.4 Search Center Interactions

```
SEARCH INPUT:
  Focus: border changes to --border-focus (blue), shadow appears
  Typing: 300ms debounce → triggers DispatchDashboardService.getList({ search: q })
  Suggestions: dropdown appears after 2+ chars, max 5 results
  Suggestion click: populates input + triggers full search

FILTER APPLY (left panel):
  Each checkbox/dropdown change: immediate filter application (no Apply button)
  300ms debounce before API call
  Results panel: skeleton loader appears while fetching
  Filter count badge: shows number of active filters

FACET COUNTS:
  Shown in parentheses next to each filter option: "BlueDart (18)"
  Updates when other filters change (filtered facet counts)
  Grayed out with (0) when no results would match

SAVE SEARCH:
  [💾 Save This Search] → opens SaveSearchModal
  Name input auto-focuses
  Preview shows active filter chips
  Save → adds to saved search list, closes modal
  Success toast: "Search 'Today's At-Risk' saved"

SAVED SEARCH LOAD:
  [Load] → populates filter panel with saved filter values
  Animation: filter panel highlights each populated filter briefly

LOAD MORE / PAGINATION:
  [Load More] → appends next 20 results to list
  [View All as Table] → switches to table layout (same data, paginated)
```

### 9.5 Chain of Custody Scanner

```
SCANNER INPUT BEHAVIOUR:
  Auto-focus on mount (window.addEventListener('keydown'))
  USB/Bluetooth barcode scanner: sends Enter after each scan
  Camera scan (future): [📷 Scan] button opens camera modal

VALIDATION SEQUENCE:
  1. Input received (keyboard or scanner)
  2. Format check: /^HU\d{7}$/ → if fail, inline error (200ms flash)
  3. Registry lookup: HURegistry.getCustody(barcode)
  4. If not found: "HU not registered in any dispatch"
  5. If found: navigate to /custody/:barcode OR update page content

TAMPER FLAG:
  [🚨 Flag Tamper] button → confirmation modal:
  "Flag HU0012301 as tampered? This will raise a theft-risk exception."
  On confirm: HURegistry.flagTamper(barcode, reason, actor)
  Then: ExceptionFactory.raiseDelay/raiseSealMismatch (theft-risk category)
  Timeline gets inline tamper event immediately

RECENT BARCODES:
  Stored in sessionStorage: tct_recent_barcodes[]
  Max 10 items, LIFO
  Click any chip → loads that barcode's chain of custody
  [Clear history] → removes sessionStorage entry + clears chips
```

---

## 10. DATA CONTRACTS

### 10.1 Dispatch Workbench ← DispatchDashboardService

```javascript
// getStatusFunnel() → for column counts
{ funnel: { planned:12, ready:8, dispatched:5, 'in-transit':14, ... } }

// getList({ status: 'planned' }, 1, 3) → for first 3 cards per column
{
  items: [
    {
      id:              "TCT-0019",
      status:          "in-transit",
      routeCode:       "DEL-MUM-01",
      routeName:       "Delhi to Mumbai",
      vehicleReg:      "MH-01-AX-2341",
      carrierName:     "BlueDart Logistics",
      plannedDeparture:"2026-06-18T08:00:00Z",
      plannedArrival:  "2026-06-18T18:00:00Z",
      actualDeparture: "2026-06-18T08:14:00Z",
      actualArrival:   null,
      huCount:         42,
      totalWeightKg:   2800,
      exceptionCount:  1,
      sla: { atRisk: true, breached: false, hoursRemaining: 2.5, hoursOverdue: null },
      utilization: { overallPct: 78, binding: 'volume' },
    }
  ],
  total: 14, page: 1, pageSize: 3, totalPages: 5
}
```

### 10.2 Dispatch Detail ← DrillDownService.fromDispatch()

```javascript
// DrillDownService.fromDispatch('TCT-0019')
{
  level:    'dispatch → HU',
  dispatch: {
    // all dispatch fields from DAL
    // + enriched from DispatchDashboardService._enrichFull():
    route:       { /* DAL.routes.getById(routeId) */ },
    carrier:     { /* DAL.carriers.getById(carrierId) */ },
    vehicle:     { /* DAL.vehicles.getById(vehicleId) */ },
    slaDetail:   { atRisk, breached, hoursRemaining, hoursOverdue },
    otaDetail:   { status, varianceMin, plannedArrival, actualArrival },
    otdDetail:   { status, varianceMin },
    capacity:    { /* CapacityEngine.forDispatch() */ },
    exceptions:  [ /* linked exception objects */ ],
    auditLog:    [ /* ordered audit entries */ ],
    trackingTrail:[ /* GPS events array */ ],
    pod:         null,   // until received
  },
  capacity: { /* CapacityEngine result */ },
  hu: {
    dispatched: ['HU0012301', 'HU0012302', ...],   // dispatch.huDispatched
    received:   [],    // empty until reconciliation
    registry:   [ /* HURegistry.getCustody() per barcode */ ]
  },
  drillTargets: [{ barcode: 'HU0012301' }, ...],
  exceptions:   [ /* same as dispatch.exceptions */ ],
}
```

### 10.3 Chain of Custody ← HURegistry + DAL

```javascript
// HURegistry.getCustody('HU0012301')
{
  barcode:     'HU0012301',
  dispatchId:  'TCT-0019',
  status:      'in-transit',
  registeredAt:'2026-06-17T22:30:00Z',
  loadedAt:    '2026-06-18T08:10:00Z',
  dispatchedAt:'2026-06-18T08:14:00Z',
  receivedAt:  null,
  closedAt:    null,
  custodyOwner:'BlueDart / MH-01-AX-2341',
  tamperFlag:  false,
  tamperEvents:[ /* if any */ ],
  misRoute:    false,
  events:      [ /* all custody events in order */ ]
}
```

### 10.4 Transport Monitoring ← DispatchDashboardService.getAtRisk() + getList()

```javascript
// getAtRisk() → for the at-risk + breached filter tabs
[
  {
    dispatchId:    'TCT-0019',
    routeCode:     'DEL-MUM-01',
    status:        'in-transit',
    vehicleReg:    'MH-01-AX-2341',
    carrierId:     'CAR-001',
    plannedArrival:'2026-06-18T18:00:00Z',
    sla: { breached: true, hoursOverdue: 1.5 },
    severity:      'critical',
    message:       '...',
  }
]

// trackingTrail from dispatch (after CarrierAdapter.pushTrackingUpdate calls):
[
  { lat: 22.3, lng: 73.2, speedKmh: 68, locationName: 'NH48 Vadodara', timestamp: '14:32' },
  ...
]
```

### 10.5 Search Center ← DispatchDashboardService.getList(filters, page, pageSize)

```javascript
// getList with all filter combinations supported:
{
  items: [ /* enriched dispatch objects */ ],
  total:      48,
  page:       1,
  pageSize:   20,
  totalPages: 3,
}

// Saved searches from localStorage:
// Key: tct_saved_searches
// Value: SavedSearch[]
[
  {
    id:        'SS-001',
    name:      "Today's At-Risk",
    filters:   { status: ['in-transit'], slaStatus: ['at-risk'] },
    createdAt: '...',
    useCount:  7,
  }
]
```

---

*Document ends.*

---

**UI PHASE 3 COMPLETE**
