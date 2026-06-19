# Enterprise Transport Control Tower — Executive Dashboard
## UI PHASE 2 · Executive Control Tower Design Specification

**Inspired by:** FourKites Live Tracking · Blue Yonder Control Tower · SAP TM Cockpit · Oracle OTM Dashboard
**Persona:** Supply Chain Head · Regional Manager (read-only elevated)
**Route:** `/executive` → `/executive/overview` (default)
**Data source:** `DashboardMaster.hydrateExecutive()` + all sub-services
**Refresh cadence:** KPI strip 30s · Alert center 15s · Map 60s · Performance widgets 5min

---

## TABLE OF CONTENTS

1. [Design System Tokens](#1-design-system-tokens)
2. [Full Page Wireframe](#2-full-page-wireframe)
3. [Section Wireframes](#3-section-wireframes)
4. [Component Hierarchy Tree](#4-component-hierarchy-tree)
5. [React Component Structure](#5-react-component-structure)
6. [UX Interactions & Behaviours](#6-ux-interactions--behaviours)
7. [Drilldown Specifications](#7-drilldown-specifications)
8. [Responsive Behaviour](#8-responsive-behaviour)
9. [Data Contract per Component](#9-data-contract-per-component)
10. [Animation & Motion Spec](#10-animation--motion-spec)

---

## 1. DESIGN SYSTEM TOKENS

### 1.1 Color Palette

```
BRAND
  --brand-primary:      #1E3A5F   (Navy — primary actions, active nav)
  --brand-accent:       #3B82F6   (Blue-500 — links, focus rings, CTAs)
  --brand-surface:      #0F172A   (Slate-900 — top nav, dark sections)

SEMANTIC STATUS
  --status-success:     #16A34A   (Green-600  — on-time, matched, healthy)
  --status-success-bg:  #F0FDF4   (Green-50   — success card backgrounds)
  --status-warning:     #D97706   (Amber-600  — at-risk, approaching breach)
  --status-warning-bg:  #FFFBEB   (Amber-50   — warning card backgrounds)
  --status-danger:      #DC2626   (Red-600    — breached, critical, missing)
  --status-danger-bg:   #FEF2F2   (Red-50     — danger card backgrounds)
  --status-info:        #2563EB   (Blue-600   — in-transit, informational)
  --status-info-bg:     #EFF6FF   (Blue-50    — info card backgrounds)
  --status-neutral:     #6B7280   (Gray-500   — planned, pending, no data)
  --status-neutral-bg:  #F9FAFB   (Gray-50    — neutral backgrounds)

SURFACE
  --surface-canvas:     #F1F5F9   (Slate-100  — page background)
  --surface-card:       #FFFFFF   (White      — card backgrounds)
  --surface-card-hover: #F8FAFC   (Slate-50   — card hover state)
  --surface-elevated:   #FFFFFF   (White + shadow)
  --surface-overlay:    rgba(15,23,42,0.55)  (modal/drawer backdrop)

BORDER
  --border-default:     #E2E8F0   (Slate-200)
  --border-strong:      #CBD5E1   (Slate-300)
  --border-focus:       #3B82F6   (Blue-500)

TEXT
  --text-primary:       #0F172A   (Slate-900)
  --text-secondary:     #475569   (Slate-600)
  --text-muted:         #94A3B8   (Slate-400)
  --text-inverse:       #F1F5F9   (Slate-100 — on dark backgrounds)
  --text-link:          #2563EB   (Blue-600)

DISPATCH STATUS COLORS
  --s-planned:          #6B7280   (Gray)
  --s-ready:            #8B5CF6   (Violet)
  --s-dispatched:       #2563EB   (Blue)
  --s-in-transit:       #0891B2   (Cyan)
  --s-arrived:          #D97706   (Amber)
  --s-unloading:        #EA580C   (Orange)
  --s-reconciled:       #16A34A   (Green)
  --s-closed:           #9CA3AF   (Cool Gray)

EXCEPTION SEVERITY COLORS
  --sev-critical:       #DC2626   (Red-600)
  --sev-critical-bg:    #FEE2E2   (Red-100)
  --sev-high:           #EA580C   (Orange-600)
  --sev-high-bg:        #FFEDD5   (Orange-100)
  --sev-medium:         #D97706   (Amber-600)
  --sev-medium-bg:      #FEF3C7   (Amber-100)
  --sev-low:            #16A34A   (Green-600)
  --sev-low-bg:         #DCFCE7   (Green-100)
```

### 1.2 Typography Scale

```
--font-family:        'Inter', -apple-system, BlinkMacSystemFont, sans-serif
--font-mono:          'JetBrains Mono', 'Fira Code', monospace

--text-xs:    10px / line-height: 16px / tracking: 0.4px
--text-sm:    12px / line-height: 18px
--text-base:  13px / line-height: 20px           ← body default
--text-md:    14px / line-height: 22px
--text-lg:    16px / line-height: 24px
--text-xl:    20px / line-height: 28px
--text-2xl:   24px / line-height: 32px
--text-3xl:   30px / line-height: 38px           ← KPI values
--text-4xl:   36px / line-height: 44px           ← hero metrics

--weight-regular:  400
--weight-medium:   500
--weight-semibold: 600
--weight-bold:     700
--weight-black:    800
```

### 1.3 Spacing & Shadow

```
SPACING (4px base grid)
  --space-1: 4px   --space-2: 8px    --space-3: 12px  --space-4: 16px
  --space-5: 20px  --space-6: 24px   --space-8: 32px  --space-10: 40px
  --space-12: 48px --space-16: 64px

BORDER RADIUS
  --radius-sm:  4px    (badges, pills, small tags)
  --radius-md:  8px    (inputs, buttons, small cards)
  --radius-lg:  12px   (cards, panels)
  --radius-xl:  16px   (modals, large cards)
  --radius-full: 9999px (avatar, badge pill)

SHADOWS
  --shadow-xs:  0 1px 2px rgba(0,0,0,0.05)
  --shadow-sm:  0 1px 3px rgba(0,0,0,0.10), 0 1px 2px rgba(0,0,0,0.06)
  --shadow-md:  0 4px 6px rgba(0,0,0,0.07), 0 2px 4px rgba(0,0,0,0.06)
  --shadow-lg:  0 10px 15px rgba(0,0,0,0.10), 0 4px 6px rgba(0,0,0,0.05)
  --shadow-xl:  0 20px 25px rgba(0,0,0,0.10), 0 10px 10px rgba(0,0,0,0.04)

TRANSITION
  --transition-fast:   150ms ease
  --transition-base:   200ms ease
  --transition-slow:   300ms cubic-bezier(0.4, 0, 0.2, 1)
```

---

## 2. FULL PAGE WIREFRAME

```
╔══════════════════════════════════════════════════════════════════════════════════════════════╗
║  TOP NAVIGATION BAR                                                              [H: 56px]  ║
║  [🚛 TCT]  📅 Last 7 Days ▼  🌍 All Regions ▼  🏭 All WH ▼  🚚 All Carriers ▼  🛣 All Routes ▼  ║
║                                                                [🔔 4]  [+ New] [👤 SC Head] ║
╠════════════╦═════════════════════════════════════════════════════════════════════════════════╣
║            ║  BREADCRUMB                                                                    ║
║  L  E  F  T║  Home  ›  Executive Control Tower                              [↻ Last sync: 14s ago] ║
║            ╠═════════════════════════════════════════════════════════════════════════════════╣
║  N  A  V   ║                                                                               ║
║            ║  ┌── SECTION 1: EXECUTIVE KPI STRIP ─────────────────────────────────────┐   ║
║  Executive ║  │ [KPI 1]  [KPI 2]  [KPI 3]  [KPI 4]  [KPI 5]  [KPI 6]  [KPI 7] [KPI 8][KPI 9] │ ║
║  ★ CT      ║  └────────────────────────────────────────────────────────────────────────┘   ║
║            ║                                                                               ║
║  Ops CT    ║  ┌── SECTION 2: LIVE NETWORK MAP (60%) ──────┐ ┌─ SECTION 3: DISPATCH    ─┐ ║
║            ║  │                                           │ │   LIFECYCLE FUNNEL       │ ║
║  Dispatch  ║  │   [Map placeholder — SVG network graph]   │ │                          │ ║
║  Mgmt      ║  │                                           │ │  Planned  ████  12        │ ║
║            ║  │   🟢 DC Mumbai        🟡 Hub Pune         │ │  Ready    ███   8         │ ║
║  Transport ║  │   🚛━━━━━━━━━━━━━━━━━━►                   │ │  Dispatched ██  5         │ ║
║  Exec      ║  │   🟢 DC Delhi         🔴 Store Nagpur     │ │  In Transit █   14        │ ║
║            ║  │                  🚛◄━━━━━━━━━━━━━         │ │  Arrived   ██   6         │ ║
║  Exception ║  │                                           │ │  Recon.    ██   5         │ ║
║  Mgmt  [9] ║  │   Legend: 🟢 Healthy  🟡 At-risk  🔴 Breach │ │  Closed    █    3         │ ║
║            ║  │   ● Warehouse  ■ DC  ▲ Hub  ★ Store       │ │                          │ ║
║  Recon     ║  └───────────────────────────────────────────┘ │  [View All Dispatches →] │ ║
║  Center    ║                                                 └──────────────────────────┘ ║
║            ║  ┌── SECTION 4: EXCEPTION COMMAND CENTER ─────────────────────────────────┐  ║
║  Route     ║  │  [CRITICAL: 2]          [HIGH: 7]       [MEDIUM: 11]      [LOW: 5]     │  ║
║  Perf      ║  │  ━━━━━━━━━━━━━━━━━━━    ━━━━━━━━━━━━     ━━━━━━━━━━━━━    ━━━━━━━━     │  ║
║            ║  │  Seal Mismatch           Arrival Delay   SLA Approach     Minor HU     │  ║
║  Carrier   ║  │  TCT-0019 · MUM-DEL     TCT-0022 · +2h  TCT-0031 · 3h    TCT-0040     │  ║
║  Perf      ║  │  [Investigate →]        [View →]         [View →]         [View →]     │  ║
║            ║  └────────────────────────────────────────────────────────────────────────┘  ║
║  Load      ║                                                                               ║
║  Planning  ║  ┌── SECTION 5: ROUTE PERFORMANCE ──────────┐ ┌─ SECTION 6: CARRIER PERF ─┐ ║
║            ║  │  [TOP 10]   [WORST 10]         Tab strip │ │  [RANKING]  [SLA]  [COST] │ ║
║  Alerts[4] ║  │  ──────────────────────────────────────  │ │  ─────────────────────── │ ║
║            ║  │  Route        Grade  OTA%   Delay  Cost  │ │  # Carrier   OTA  Score  │ ║
║  Analytics ║  │  DEL-MUM-01   A      94%    8 min  ₹42k  │ │  1 BlueDart  96%  92     │ ║
║            ║  │  BOM-PUN-03   A      91%    12 min ₹18k  │ │  2 DTDC      88%  81     │ ║
║  Master    ║  │  DEL-HYD-02   B      85%    28 min ₹67k  │ │  3 Delhivery 84%  76     │ ║
║  Data      ║  │  ─  ─  ─  ─  ─  ─  ─  ─  ─  ─  ─  ─    │ │  ─ ─ ─ ─ ─ ─ ─ ─ ─ ─   │ ║
║            ║  │  [View All Routes →]                      │ │  [View All Carriers →]   │ ║
║  Admin     ║  └───────────────────────────────────────────┘ └──────────────────────────┘ ║
║            ║                                                                               ║
╚════════════╣  ┌── SECTION 7: SLA HEATMAP ─────────────────────────────────────────────┐  ║
             ║  │  [BY REGION]  [BY ROUTE]                                    Tab strip  │  ║
             ║  │                                                                         │  ║
             ║  │  Region         SLA%   Breaches   At-Risk   Heatbar                    │  ║
             ║  │  North          91%    1           2         ████████████████████░░░    │  ║
             ║  │  South          88%    2           3         █████████████████░░░░░░    │  ║
             ║  │  West           78%    4           5         ████████████████░░░░░░░    │  ║
             ║  │  East           95%    0           1         ████████████████████████   │  ║
             ║  │  Central        72%    5           7         ████████████░░░░░░░░░░░    │  ║
             ║  └─────────────────────────────────────────────────────────────────────────┘  ║
             ║                                                                               ║
             ║  ┌── SECTION 8: ALERT CENTER ──────────────────────────────────────────────┐ ║
             ║  │  🚨 Critical Delays (1)    ⚠ SLA Breaches (2)   🔒 Theft Risk (1)  🔐 Seal (1) │ ║
             ║  │  ─────────────────────── ─────────────────────── ────────────────  ──────│ ║
             ║  │  TCT-0031 · DEL-BLR      TCT-0019 · 4h overdue  TCT-0045 · FLAG   TCT-0019│ ║
             ║  │  3.5h late · High Risk   TCT-0022 · 2h overdue  Route deviation   Mismatch│ ║
             ║  │  [Escalate] [View]        [View] [Escalate]       [Investigate]   [View] │ ║
             ║  └─────────────────────────────────────────────────────────────────────────┘ ║
             ║                                                                               ║
             ╚═══════════════════════════════════════════════════════════════════════════════╝
```

---

## 3. SECTION WIREFRAMES

### 3.1 Section 1 — Executive KPI Strip

```
┌──────────────────────────────────────────────────────────────────────────────────────────┐
│                           EXECUTIVE KPI STRIP                              [↻ 30s auto]  │
├──────────┬──────────┬──────────┬──────────┬──────────┬──────────┬──────────┬────────────┤
│ TODAY'S  │  OTD %   │  OTA %   │  SLA %   │ IN       │  OPEN    │ CRITICAL │  VEHICLE   │
│DISPATCHES│          │          │          │ TRANSIT  │EXCEPTIONS│   EXC.   │   UTIL %   │
│          │          │          │          │          │          │          │            │
│   47     │  87%     │  82%     │  91%     │   14     │   25     │   2      │  73%       │
│          │          │          │          │          │          │          │            │
│ ▲ +3     │ ▼ -2pp   │ ▲ +1pp   │ ━ 0pp    │ ━        │ ▲ +4     │ ▲ +1     │ ▼ -5pp     │
│ vs yest. │ vs yest. │ vs yest. │ vs yest. │ live     │ vs yest. │ vs yest. │ vs yest.   │
│          │          │          │          │          │          │          │            │
│ 🔵 info  │ 🟢 good  │ 🟡 warn  │ 🟢 good  │ 🔵 info  │ 🟡 warn  │ 🔴 crit  │ 🟢 good    │
└──────────┴──────────┴──────────┴──────────┴──────────┴──────────┴──────────┴────────────┘

NINTH KPI CARD (Cost Per Dispatch) — placed after Vehicle Util:
┌────────────┐
│ COST/DISP  │
│            │
│  ₹ 2,840   │
│            │
│ ▼ -₹120    │
│ vs yest.   │
│            │
│ 🟢 good    │
└────────────┘

KPI CARD ANATOMY (per card):
┌──────────────────────────────┐
│ LABEL         [i] tooltip    │  ← 10px uppercase, slate-500, info icon
│                              │
│  [VALUE]                     │  ← 36px black, brand color for healthy state
│  [UNIT]                      │  ← 12px, slate-400 (%, ₹, count)
│                              │
│  [▲/▼/━] [delta] [vs period] │  ← 11px trend line
│                              │
│  [━━━━━━━━━━░░░░░] [bar]      │  ← thin progress bar (optional, for % KPIs)
│  [STATUS DOT] [status label] │  ← 10px colored dot + label
└──────────────────────────────┘

CLICK BEHAVIOUR:
  OTD% card click     → /executive/sla-compliance?metric=otd
  OTA% card click     → /executive/sla-compliance?metric=ota
  SLA% card click     → /executive/sla-compliance
  In Transit click    → /dispatch/board?status=in-transit (drawer opens)
  Open Exceptions     → /exceptions/queue
  Critical Exc        → /exceptions/queue?severity=critical
  Vehicle Util        → /load-planning/capacity
  Cost/Dispatch       → /executive/cost-performance

STATUS DOT THRESHOLDS:
  OTD/OTA/SLA:   ≥90% = green,  75–89% = amber,  <75% = red
  Exceptions:    0 = green,     1–5 = amber,      >5 = red
  Vehicle Util:  ≥70% = green,  50–69% = amber,   <50% = red
  Cost/Dispatch: ≤₹3000 = green, ₹3001–5000 = amber, >₹5000 = red
```

---

### 3.2 Section 2 — Live Network Visibility Map

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│  LIVE NETWORK VISIBILITY MAP                          [Expand ⤢] [Legend ⓘ]    │
│                                                                                 │
│  ┌──────────────────────────────────────────────────────────────────────────┐  │
│  │                          INDIA NETWORK                                    │  │
│  │                                                                            │  │
│  │     ● DC-DELHI (2 active)                                                  │  │
│  │      \                                                                     │  │
│  │       \🚛TCT-019 (4h, on-track)                                            │  │
│  │        \                     ● HUB-JAIPUR                                  │  │
│  │         \                   /                                               │  │
│  │          ●─────────────────●                                                │  │
│  │        DC-AHMEDABAD    HUB-SURAT                                            │  │
│  │           |   \                                                              │  │
│  │    🚛TCT-031   \──────────────────● DC-MUMBAI (3 active)                    │  │
│  │    (AT RISK)                      |                                          │  │
│  │                               🚛🚛🚛 (3 in transit)                          │  │
│  │                                   |                                          │  │
│  │                            ★ STORE-PUNE (arrived 1)                          │  │
│  │                                                                              │  │
│  │  Legend:  ● DC/Warehouse  ★ Store/Customer  ─── Active Route                │  │
│  │           🟢 On-track     🟡 At-risk        🔴 Breached                     │  │
│  └──────────────────────────────────────────────────────────────────────────┘  │
│                                                                                 │
│  QUICK STATS BAR  (below map)                                                   │
│  ┌──────────┬──────────────┬────────────────┬─────────────────┬───────────────┐│
│  │  8 DCs   │  12 Routes   │  14 In Transit │  2 At Risk 🟡   │  1 Breach 🔴  ││
│  └──────────┴──────────────┴────────────────┴─────────────────┴───────────────┘│
└─────────────────────────────────────────────────────────────────────────────────┘

NODE TYPES & SYMBOLS:
  ● (filled circle)    = Distribution Center / Warehouse
  ★ (star)             = Customer Store / Delivery Point
  ▲ (triangle)         = Hub / Transshipment Point
  🚛 (truck emoji/icon) = Vehicle in transit (positioned on route line)

NODE COLOR CODING:
  Green border  = all dispatches on-track
  Amber border  = at least 1 dispatch at-risk
  Red border    = at least 1 dispatch breached

ROUTE LINE CODING:
  Solid green   = active, on-track
  Dashed amber  = at-risk
  Solid red     = breached / delayed
  Grey dashed   = no active dispatch

VEHICLE ICON BEHAVIOUR:
  Shows last GPS position (if available) or midpoint of route
  Click on 🚛 icon → opens Dispatch Detail mini-card overlay
  Mini-card shows: ID, Route, ETA, SLA Status, [View Full] button

MAP INTERACTION:
  Hover node      → tooltip: location name, active dispatches count, status
  Click node      → filter dispatch board to this origin/destination
  Hover route line → tooltip: route name, dispatches on lane, avg OTA%
  Click route line → opens Route Detail drawer
  Zoom            → scroll wheel (future: real map tiles)
  Pan             → drag (future)
  Legend toggle   → show/hide each node type
  Expand button   → map goes full-width, pushes funnel to below map
```

---

### 3.3 Section 3 — Dispatch Lifecycle Funnel

```
┌──────────────────────────────────────────────────────────┐
│  DISPATCH LIFECYCLE FUNNEL               [View All →]    │
│                                                          │
│  Today's flow                                [47 total]  │
│                                                          │
│  PLANNED     ████████████████████████    12  (26%)       │
│  READY       ████████████████░░░░░░░░░    8  (17%)       │
│  DISPATCHED  ████████████░░░░░░░░░░░░░    5  (11%)       │
│  IN TRANSIT  █████████████████████████   14  (30%) ◄ MAX │
│  ARRIVED     ████████████░░░░░░░░░░░░░    6  (13%)       │
│  RECONCILED  ████████░░░░░░░░░░░░░░░░░    5  (11%)       │
│  CLOSED      ████░░░░░░░░░░░░░░░░░░░░░    3  (6%)        │
│                                                          │
│  ┌─────────────────────────────────────────────────┐    │
│  │ STAGE HEALTH                                     │    │
│  │ In Transit:    14 dispatches                     │    │
│  │   ├── 🟢 On Track:    11                         │    │
│  │   ├── 🟡 At Risk:      2                         │    │
│  │   └── 🔴 Breached:     1                         │    │
│  └─────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────┘

FUNNEL BAR ANATOMY:
  [STATUS LABEL] [PROGRESS BAR — max width = most in any status] [COUNT] [(PCT%)]

BAR COLORS (match dispatch status color tokens):
  Planned     = --s-planned   (gray)
  Ready       = --s-ready     (violet)
  Dispatched  = --s-dispatched (blue)
  In Transit  = --s-in-transit (cyan)
  Arrived     = --s-arrived   (amber)
  Reconciled  = --s-reconciled (green)
  Closed      = --s-closed    (cool gray)

CLICK BEHAVIOUR:
  Click any row → /dispatch/board?status=[STATUS]
  Opens dispatch list pre-filtered to that status

HEALTH PANEL:
  Only shown for "In Transit" status (the live operational stage)
  Counts: on-track / at-risk / breached from AlertService
  Click counts → filtered dispatch board with that SLA status
```

---

### 3.4 Section 4 — Exception Command Center

```
┌────────────────────────────────────────────────────────────────────────────────┐
│  EXCEPTION COMMAND CENTER                      [View All Exceptions →]         │
│                                                                                │
│  ┌──────────────────────┐  ┌──────────────────────┐  ┌──────────────────────┐ │
│  │ 🔴 CRITICAL     [2]  │  │ 🟠 HIGH          [7] │  │ 🟡 MEDIUM       [11] │ │
│  │ ──────────────────── │  │ ──────────────────── │  │ ──────────────────── │ │
│  │ Seal Mismatch        │  │ Arrival Delay        │  │ SLA Approaching      │ │
│  │ TCT-0019 · MUM-DEL   │  │ TCT-0022 · +2h late  │  │ TCT-0031 · 3h remain │ │
│  │ Raised: 2h ago       │  │ Raised: 45min ago    │  │ Raised: 1h ago       │ │
│  │ Escalated: L2 RM     │  │ Assigned: Ops Exec   │  │ Unassigned           │ │
│  │ [Investigate] [View] │  │ [View] [Escalate]    │  │ [Assign] [View]      │ │
│  │ ──────────────────── │  │ ──────────────────── │  │ ──────────────────── │ │
│  │ Missing HU           │  │ + 6 more             │  │ + 10 more            │ │
│  │ TCT-0031 · DEL-BLR   │  │ [View All HIGH →]    │  │ [View All MEDIUM →]  │ │
│  │ Raised: 3h ago       │  └──────────────────────┘  └──────────────────────┘ │
│  │ [View] [Escalate]    │                                                      │
│  └──────────────────────┘  ┌──────────────────────┐                           │
│                             │ 🟢 LOW           [5] │                           │
│                             │ ──────────────────── │                           │
│                             │ Minor HU variance    │                           │
│                             │ TCT-0040 · MAA-HYD   │                           │
│                             │ + 4 more             │                           │
│                             │ [View All LOW →]     │                           │
│                             └──────────────────────┘                           │
│                                                                                │
│  [TREND] Open exceptions: 25 total · ▲ +4 from yesterday · Avg age: 4.2 hrs   │
└────────────────────────────────────────────────────────────────────────────────┘

EXCEPTION CARD ANATOMY (per severity column):
┌──────────────────────────────────────────┐
│ [SEVERITY ICON] [SEVERITY LABEL]  [COUNT]│  ← header row, colored bg
│ ────────────────────────────────────────│
│ [Category Label]                         │  ← bold 13px
│ [Dispatch ID] · [Route Code]             │  ← 12px slate-600
│ Raised: [relative time]                  │  ← 11px slate-400
│ [Assignee OR Escalation status]          │  ← 11px
│ [ACTION BTN 1]         [ACTION BTN 2]    │  ← 11px compact buttons
│ ────────────────────────────────────────│  ← repeat for 2nd item (critical only)
│ [+ N more] [View All SEVERITY →]        │  ← overflow link
└──────────────────────────────────────────┘

COLUMN LAYOUT: 2 columns on 1280px+ / 2 columns stacked at 1024px / 1 column on mobile

ACTION BUTTON VARIANTS:
  Investigate → ExceptionResolutionEngine.investigate(id)
  View        → opens /exceptions/:id drawer
  Escalate    → EscalationEngine.escalate(id) + confirmation modal
  Assign      → opens assignee picker popover
```

---

### 3.5 Section 5 — Route Performance Widget

```
┌───────────────────────────────────────────────────────────────────────────────┐
│  ROUTE PERFORMANCE                                          [View All →]       │
│                                                                               │
│  [TOP 10 ROUTES]    [WORST 10 ROUTES]                                         │
│   ─────────────     ──────────────────                                        │
│                                                                               │
│  TOP 10 ROUTES VIEW                                                           │
│  ─────────────────────────────────────────────────────────────────────────── │
│  Route Code    Route Name          Grade   OTA%   Delay   Cost/km  Score     │
│  ─────────────────────────────────────────────────────────────────────────── │
│  DEL-MUM-01   Delhi → Mumbai        🅰       94%    8 min   ₹42     96        │
│  BOM-PUN-03   Mumbai → Pune         🅰       91%   12 min   ₹18     92        │
│  DEL-HYD-02   Delhi → Hyderabad     🅱       85%   28 min   ₹67     79        │
│  MAA-BLR-01   Chennai → Bangalore   🅱       83%   35 min   ₹31     76        │
│  CCU-BBI-02   Kolkata → Bhubaneshwar 🅱      81%   42 min   ₹28     73        │
│  ─  ─  ─  ─  ─  ─  ─  ─  ─  ─  ─  ─  ─  ─  ─  ─  ─  ─  ─  ─  ─  ─  ─  ─  │
│  [+ 5 more routes]                                   [View Full Table →]      │
│                                                                               │
│  WORST 10 ROUTES VIEW (tab toggle)                                            │
│  ─────────────────────────────────────────────────────────────────────────── │
│  Route Code    Route Name          Grade   OTA%   Delay   Exceptions  Score  │
│  ─────────────────────────────────────────────────────────────────────────── │
│  PNQ-NGP-04   Pune → Nagpur         🅵       51%   98 min   8          31     │
│  AMD-SRT-02   Ahmedabad → Surat     🅳       63%   74 min   5          42     │
│  DEL-LDH-03   Delhi → Ludhiana      🅳       67%   61 min   4          48     │
│  ─  ─  ─  ─  ─  ─  ─  ─  ─  ─  ─  ─  ─  ─  ─  ─  ─  ─  ─  ─  ─  ─  ─  ─  │
│  [+ 7 more routes]                                   [View Full Table →]      │
└───────────────────────────────────────────────────────────────────────────────┘

GRADE BADGE COLORS:
  🅰 (A) = solid green bg, white text
  🅱 (B) = solid blue bg, white text
  🅲 (C) = solid amber bg, white text
  🅳 (D) = solid orange bg, white text
  🅵 (F) = solid red bg, white text

ROW CLICK → /routes/:routeId (opens Route Detail drawer)
TAB PERSISTENCE: selected tab (Top/Worst) saved to localStorage

INLINE SPARKLINE (optional, shown on hover):
  Each row gets a tiny 60×20px sparkline of OTA% for last 7 days
  Shown in tooltip on row hover
```

---

### 3.6 Section 6 — Carrier Performance Widget

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  CARRIER PERFORMANCE                                          [View All →]    │
│                                                                              │
│  [RANKING]    [SLA %]    [DELAY %]    [COST ₹/km]                            │
│   ─────────   ─────────   ─────────   ───────────                            │
│                                                                              │
│  RANKING VIEW (default)                                                      │
│  ────────────────────────────────────────────────────────────────────────── │
│  #   Carrier       Type   OTA%   OTD%  Open Exc  Score   Status              │
│  ────────────────────────────────────────────────────────────────────────── │
│  1   BlueDart      Express 96%   94%    0         92      🟢 Top Performer    │
│  2   DTDC          FTL     88%   85%    2         81      🟢 Good             │
│  3   Delhivery     3PL     84%   82%    3         76      🟡 Acceptable       │
│  4   XpressBees    LTL     79%   77%    4         71      🟡 Monitor          │
│  5   Shadow Fax    Last    72%   69%    6         64      🔴 At Risk          │
│  ─  ─  ─  ─  ─  ─  ─  ─  ─  ─  ─  ─  ─  ─  ─  ─  ─  ─  ─  ─  ─  ─  ─    │
│  [+ 1 more carrier]                             [View Full Rankings →]       │
│                                                                              │
│  STATUS LABELS:                                                              │
│  92–100 = "Top Performer" (green)    75–91 = "Good" (green)                 │
│  60–74 = "Monitor" (amber)           <60 = "At Risk" (red)                  │
└──────────────────────────────────────────────────────────────────────────────┘

ROW CLICK → /carriers/:carrierId (opens Carrier Detail drawer)
TAB behaviour: each tab loads a different `CarrierDashboardService` method
```

---

### 3.7 Section 7 — SLA Heatmap

```
┌────────────────────────────────────────────────────────────────────────────────┐
│  SLA COMPLIANCE HEATMAP                          [By Region]  [By Route]       │
│                                                                                │
│  BY REGION VIEW (default):                                                     │
│                                                                                │
│  Region       Dispatches  SLA%    Breaches  At-Risk   Performance Bar          │
│  ─────────────────────────────────────────────────────────────────────────    │
│  East          18          95%    0          1        ██████████████████████  │
│  North         24          91%    1          2        ████████████████████░░  │
│  South         19          88%    2          3        ██████████████████░░░░  │
│  West          22          78%    4          5        █████████████████░░░░░  │
│  Central       16          72%    5          7        ██████████████░░░░░░░░  │
│                                                                                │
│  HEATBAR COLORS:                                                               │
│  95–100% = solid green ██                                                      │
│  85–94%  = lighter green ▓▓                                                    │
│  75–84%  = amber ▒▒                                                            │
│  60–74%  = orange ░░ (filled orange)                                           │
│  <60%    = red (filled red)                                                    │
│                                                                                │
│  BY ROUTE VIEW (tab toggle):                                                   │
│                                                                                │
│  Route          Dispatches  SLA%   Breaches  Delta vs Avg  Bar                │
│  ─────────────────────────────────────────────────────────────────────────    │
│  DEL-MUM-01     12          94%    0          +6pp         ██████████████████ │
│  BOM-PUN-03     8           91%    0          +3pp         █████████████████░ │
│  DEL-HYD-02     6           83%    1          -5pp         ████████████████░░ │
│  PNQ-NGP-04     4           51%    3          -37pp        ████████░░░░░░░░░░ │
│  ─  ─  ─  ─  ─  ─  ─  ─  ─  ─  ─  ─  ─  ─  ─  ─  ─  ─  ─  ─  ─  ─        │
│  [View Full SLA Report →]                                                      │
└────────────────────────────────────────────────────────────────────────────────┘

CLICK BEHAVIOUR:
  Click region row → /dispatch/board?region=[REGION]&status=in-transit,arrived
  Click route row  → /routes/:routeId (drawer)

DELTA vs AVG calculation:
  Global avg SLA% from ExecutiveDashboardService.getKPIs().slaPct
  Delta = route/region SLA% - global avg
  Shown as +Xpp (green) or -Xpp (red)
```

---

### 3.8 Section 8 — Alert Center

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│  ALERT CENTER                                     [Manage Alerts] [View All →]  │
│                                                                                 │
│  ┌─────────────────────┐  ┌─────────────────────┐  ┌──────────────┐ ┌────────┐ │
│  │ 🚨 CRITICAL DELAYS  │  │ ⚠ SLA BREACHES  [2] │  │🔒 THEFT RISK│ │🔐 SEAL │ │
│  │                [1]  │  │                     │  │          [1]│ │   [1]  │ │
│  │ TCT-0031            │  │ TCT-0019            │  │ TCT-0045    │ │TCT-019 │ │
│  │ DEL-BLR Route       │  │ 4h 20min overdue    │  │ Route dev.  │ │Mismatch│ │
│  │ 3.5h late           │  │ ─────────────────── │  │ Flagged GPS │ │Raised  │ │
│  │ OTA: At Risk        │  │ TCT-0022            │  │ 2h ago      │ │3h ago  │ │
│  │                     │  │ 2h 10min overdue    │  │             │ │        │ │
│  │ [🔺 Escalate]       │  │                     │  │[Investigate]│ │[View]  │ │
│  │ [👁 View Dispatch]  │  │ [View All] [Escalate│  │             │ │        │ │
│  └─────────────────────┘  └─────────────────────┘  └──────────────┘ └────────┘ │
│                                                                                 │
│  ────────────────────────────────────────────────────────────────────────────  │
│  RECENT EVENTS (last 60 minutes)                                               │
│  🔴 14:32  SLA Breach — TCT-0019 DEL-MUM-01 — 4h 20min overdue               │
│  🟡 14:18  At-Risk — TCT-0031 DEL-BLR-02 — 3.5h delay                         │
│  🔵 14:05  Arrived — TCT-0028 BOM-PUN-03 — On time                            │
│  🔒 13:55  Theft Risk Flag — TCT-0045 — Route deviation detected               │
│  🔐 13:40  Seal Mismatch — TCT-0019 — Receiving team flagged                  │
│  [Load more events...]                                                          │
└─────────────────────────────────────────────────────────────────────────────────┘

ALERT TYPE ICONS & COLORS:
  🚨 Critical Delay  = red panel header, red icon
  ⚠  SLA Breach      = red panel header, red icon
  🔒 Theft Risk      = dark amber panel header
  🔐 Seal Mismatch   = orange panel header

RECENT EVENTS FEED:
  Data source: DomainEventBus.getEventLog(limit=20) + AlertService.getAll()
  Max 10 events shown; "Load more" adds another 10
  Each event: colored dot + timestamp + message + dispatch link
  Click event row → opens relevant dispatch/exception drawer

ALERT COUNT BADGE:
  [n] badge on each panel header
  Red badge for > 0 critical/SLA
  Amber badge for > 0 theft/seal
```

---

### 3.9 Global Filters Bar (Top Nav extension)

```
┌────────────────────────────────────────────────────────────────────────────────────┐
│  GLOBAL FILTERS (persisted in sessionStorage, encoded in URL)                      │
│                                                                                    │
│  📅 [TODAY ▼]   🌍 [ALL REGIONS ▼]   🏭 [ALL WAREHOUSES ▼]   🚚 [ALL CARRIERS ▼]  │
│  🛣 [ALL ROUTES ▼]                                    [Reset Filters] [Save Preset]│
│                                                                                    │
│  ACTIVE FILTER CHIPS (shown when non-default):                                     │
│  [📅 Last 7 Days ×]  [🌍 North Region ×]  [🚚 BlueDart ×]           [Clear All ×] │
└────────────────────────────────────────────────────────────────────────────────────┘

FILTER COMPONENT SPECS:

Date Range Picker:
  Options: Today | Yesterday | Last 7 Days | Last 30 Days | This Month | Custom Range
  Custom range: date-range calendar (2-month view)
  Default: Last 7 Days
  Quick select chips below calendar

Region Select:
  Type: Single-select dropdown
  Options: All Regions + [North, South, East, West, Central] from DAL.locations
  Default: All Regions

Warehouse Select:
  Type: Multi-select searchable dropdown
  Options: All locations from DAL.locations.getAll() where type = 'DC' or 'warehouse'
  Search: filters options live
  Shows: code + name + region

Carrier Select:
  Type: Multi-select searchable dropdown
  Options: All active carriers from DAL.carriers.getAll()
  Shows: name + type badge

Route Select:
  Type: Multi-select searchable dropdown
  Options: All active routes from DAL.routes.getAll()
  Shows: code + origin→dest + grade badge

FILTER APPLY BEHAVIOUR:
  Each filter change → debounced 300ms → invalidates DashboardCache → re-fetches all services
  DashboardMaster.invalidateAll() called on filter change
  Loading state shown during re-fetch (skeleton loaders on affected sections)

FILTER PRESET (Save Preset):
  Names a saved filter combination
  Stored in localStorage as: tct_filter_presets[name]
  Accessible from filter bar dropdown next time
```

---

## 4. COMPONENT HIERARCHY TREE

```
ExecutiveControlTower (page root)
│
├── AppShell
│   ├── TopNavigationBar
│   │   ├── AppLogo
│   │   ├── GlobalFilterBar
│   │   │   ├── DateRangeFilter
│   │   │   ├── RegionFilter
│   │   │   ├── WarehouseFilter
│   │   │   ├── CarrierFilter
│   │   │   ├── RouteFilter
│   │   │   ├── ActiveFilterChips
│   │   │   └── FilterPresetMenu
│   │   ├── AlertBell (with badge)
│   │   ├── QuickActionsMenu
│   │   └── UserContextMenu
│   │
│   ├── LeftNavigationBar
│   │   ├── NavGroup (MONITORING)
│   │   │   ├── NavItem (Executive CT) [active]
│   │   │   └── NavItem (Operations CT)
│   │   ├── NavGroup (EXECUTION)
│   │   │   ├── NavItem (Dispatch Mgmt)
│   │   │   ├── NavItem (Transport Exec)
│   │   │   └── NavItem (Load Planning)
│   │   ├── NavGroup (EXCEPTIONS)
│   │   │   └── NavItem (Exception Mgmt) [badge: 9]
│   │   ├── NavGroup (RECONCILIATION)
│   │   │   └── NavItem (Reconciliation)
│   │   ├── NavGroup (PERFORMANCE)
│   │   │   ├── NavItem (Route Performance)
│   │   │   └── NavItem (Carrier Performance)
│   │   ├── NavGroup (ALERTS)
│   │   │   └── NavItem (CT Alerts) [badge: 4]
│   │   ├── NavGroup (INTELLIGENCE)
│   │   │   └── NavItem (Analytics)
│   │   └── NavGroup (CONFIGURATION)
│   │       ├── NavItem (Master Data)
│   │       └── NavItem (Administration)
│   │
│   └── MainContentArea
│       ├── Breadcrumb
│       ├── PageHeader
│       │   ├── PageTitle
│       │   ├── SyncIndicator
│       │   └── PageActions (export, refresh)
│       │
│       └── DashboardGrid
│           │
│           ├── KPIStrip                              ← Section 1
│           │   └── KPICard × 9
│           │       ├── KPILabel
│           │       ├── KPIValue
│           │       ├── KPIUnit
│           │       ├── KPITrendBadge
│           │       ├── KPIProgressBar (% KPIs only)
│           │       └── KPIStatusDot
│           │
│           ├── NetworkRow (2-column)
│           │   ├── NetworkVisibilityMap              ← Section 2
│           │   │   ├── MapCanvas (SVG)
│           │   │   │   ├── RouteLines []
│           │   │   │   ├── LocationNodes []
│           │   │   │   │   └── LocationTooltip
│           │   │   │   └── VehicleMarkers []
│           │   │   │       └── VehicleMiniCard
│           │   │   ├── MapLegend
│           │   │   └── MapQuickStatsBar
│           │   │
│           │   └── DispatchLifecycleFunnel           ← Section 3
│           │       ├── FunnelBar × 7
│           │       │   ├── StatusLabel
│           │       │   ├── ProgressBar
│           │       │   └── CountBadge
│           │       └── StageHealthPanel
│           │
│           ├── ExceptionCommandCenter                ← Section 4
│           │   ├── ExceptionSeverityColumn × 4
│           │   │   ├── SeverityHeader
│           │   │   ├── ExceptionCard × (max 2)
│           │   │   │   ├── CategoryLabel
│           │   │   │   ├── DispatchRef
│           │   │   │   ├── TimeAgo
│           │   │   │   ├── AssigneeStatus
│           │   │   │   └── ActionButtons
│           │   │   └── OverflowLink
│           │   └── ExceptionTrendBar
│           │
│           ├── PerformanceRow (2-column)
│           │   ├── RoutePerformanceWidget            ← Section 5
│           │   │   ├── WidgetTabStrip (Top/Worst)
│           │   │   └── RouteTable
│           │   │       └── RouteRow × 10
│           │   │           ├── RouteCode
│           │   │           ├── RouteName
│           │   │           ├── GradeBadge
│           │   │           ├── OTAPercent
│           │   │           ├── DelayMinutes
│           │   │           ├── CostPerKm
│           │   │           └── CompositeScore
│           │   │
│           │   └── CarrierPerformanceWidget          ← Section 6
│           │       ├── WidgetTabStrip (Ranking/SLA/Delay/Cost)
│           │       └── CarrierTable
│           │           └── CarrierRow × 6
│           │               ├── RankNumber
│           │               ├── CarrierName
│           │               ├── CarrierTypeBadge
│           │               ├── OTAPercent
│           │               ├── OTDPercent
│           │               ├── OpenExceptions
│           │               ├── CompositeScore
│           │               └── StatusLabel
│           │
│           ├── SLAHeatmapWidget                      ← Section 7
│           │   ├── WidgetTabStrip (By Region/By Route)
│           │   └── HeatmapTable
│           │       └── HeatmapRow × N
│           │           ├── EntityLabel
│           │           ├── DispatchCount
│           │           ├── SLAPercent
│           │           ├── BreachCount
│           │           ├── AtRiskCount
│           │           ├── DeltaVsAvg
│           │           └── HeatBar
│           │
│           └── AlertCenter                           ← Section 8
│               ├── AlertPanel × 4
│               │   ├── AlertPanelHeader
│               │   ├── AlertCard × (max 2)
│               │   │   ├── AlertMessage
│               │   │   ├── DispatchRef
│               │   │   ├── TimeAgo
│               │   │   └── AlertActions
│               │   └── AlertOverflowLink
│               └── RecentEventsFeed
│                   └── EventFeedRow × 10
│
└── GlobalAlertRail (fixed overlay)
    └── AlertRailCard × (max 3)
        ├── AlertSeverityIcon
        ├── AlertMessage
        ├── DispatchLink
        └── AlertRailActions

(Drawer layer — rendered at root, conditionally)
DispatchDetailDrawer
    └── [see Dispatch screen spec for internal structure]
RouteDetailDrawer
    └── [see Route screen spec for internal structure]
CarrierDetailDrawer
    └── [see Carrier screen spec for internal structure]
ExceptionDetailDrawer
    └── [see Exception screen spec for internal structure]
```

---

## 5. REACT COMPONENT STRUCTURE

### 5.1 File Organisation

```
src/
├── pages/
│   └── executive/
│       ├── ExecutiveControlTower.jsx         ← Page root, data orchestration
│       ├── ExecutiveControlTower.css
│       └── index.js
│
├── components/
│   ├── shell/
│   │   ├── AppShell.jsx
│   │   ├── TopNavigationBar.jsx
│   │   ├── LeftNavigationBar.jsx
│   │   ├── GlobalFilterBar.jsx
│   │   ├── GlobalAlertRail.jsx
│   │   └── Breadcrumb.jsx
│   │
│   ├── kpi/
│   │   ├── KPIStrip.jsx
│   │   └── KPICard.jsx
│   │
│   ├── map/
│   │   ├── NetworkVisibilityMap.jsx
│   │   ├── MapCanvas.jsx               ← SVG renderer
│   │   ├── LocationNode.jsx
│   │   ├── RouteEdge.jsx
│   │   ├── VehicleMarker.jsx
│   │   ├── VehicleMiniCard.jsx         ← hover tooltip
│   │   └── MapLegend.jsx
│   │
│   ├── funnel/
│   │   ├── DispatchLifecycleFunnel.jsx
│   │   ├── FunnelBar.jsx
│   │   └── StageHealthPanel.jsx
│   │
│   ├── exceptions/
│   │   ├── ExceptionCommandCenter.jsx
│   │   ├── ExceptionSeverityColumn.jsx
│   │   └── ExceptionCard.jsx
│   │
│   ├── performance/
│   │   ├── RoutePerformanceWidget.jsx
│   │   ├── RouteTable.jsx
│   │   ├── CarrierPerformanceWidget.jsx
│   │   ├── CarrierTable.jsx
│   │   └── GradeBadge.jsx
│   │
│   ├── heatmap/
│   │   ├── SLAHeatmapWidget.jsx
│   │   ├── HeatmapTable.jsx
│   │   └── HeatBar.jsx
│   │
│   ├── alerts/
│   │   ├── AlertCenter.jsx
│   │   ├── AlertPanel.jsx
│   │   ├── AlertCard.jsx
│   │   └── RecentEventsFeed.jsx
│   │
│   ├── drawers/
│   │   ├── DrawerContainer.jsx         ← generic drawer shell
│   │   ├── DispatchDetailDrawer.jsx
│   │   ├── RouteDetailDrawer.jsx
│   │   ├── CarrierDetailDrawer.jsx
│   │   └── ExceptionDetailDrawer.jsx
│   │
│   └── shared/
│       ├── StatusBadge.jsx
│       ├── TrendBadge.jsx
│       ├── ProgressBar.jsx
│       ├── TabStrip.jsx
│       ├── WidgetCard.jsx
│       ├── WidgetCardHeader.jsx
│       ├── EmptyState.jsx
│       ├── SkeletonLoader.jsx
│       ├── TimeAgo.jsx
│       ├── Tooltip.jsx
│       └── ActionButton.jsx
│
├── hooks/
│   ├── useDashboardData.js             ← master data fetch hook
│   ├── useKPIData.js
│   ├── useExceptionData.js
│   ├── useRouteData.js
│   ├── useCarrierData.js
│   ├── useAlertData.js
│   ├── useGlobalFilters.js
│   └── useAutoRefresh.js
│
├── services/
│   └── dashboardBridge.js             ← bridges window.TCT.* to React hooks
│
└── context/
    ├── FilterContext.jsx
    ├── DrawerContext.jsx
    └── AlertContext.jsx
```

---

### 5.2 Key Component Props Contracts

```jsx
// ── KPICard ──────────────────────────────────────────────────────────────────
KPICard.propTypes = {
  label:        string.isRequired,          // "OTD %"
  value:        oneOfType([string, number]), // 87 or "87%"
  unit:         string,                     // "%", "₹", ""
  trend:        shape({
    direction:  oneOf(['up','down','stable']),
    delta:      string,                     // "+3", "-2pp"
    period:     string,                     // "vs yesterday"
  }),
  status:       oneOf(['healthy','warning','danger','info','neutral']),
  showProgress: bool,                       // show thin bar (% KPIs)
  progressPct:  number,                     // 0–100
  onClick:      func,                       // navigate on click
  loading:      bool,
  tooltip:      string,                     // [i] tooltip content
}

// ── FunnelBar ──────────────────────────────────────────────────────────────
FunnelBar.propTypes = {
  status:      string.isRequired,           // dispatch status key
  label:       string.isRequired,           // "In Transit"
  count:       number.isRequired,
  pct:         number.isRequired,           // 0–100
  maxCount:    number.isRequired,           // for bar normalisation
  color:       string.isRequired,           // CSS color token
  onClick:     func,                        // navigate to filtered dispatch board
  healthData:  shape({                      // only for in-transit status
    onTrack:   number,
    atRisk:    number,
    breached:  number,
  }),
}

// ── ExceptionCard ─────────────────────────────────────────────────────────
ExceptionCard.propTypes = {
  exceptionId:    string.isRequired,
  category:       string.isRequired,        // "seal-mismatch"
  severity:       oneOf(['critical','high','medium','low']),
  dispatchId:     string.isRequired,
  routeCode:      string,
  raisedAt:       string,                   // ISO date
  assignee:       string,
  escalationLevel:number,
  onView:         func,
  onInvestigate:  func,
  onEscalate:     func,
  onAssign:       func,
}

// ── HeatBar ──────────────────────────────────────────────────────────────
HeatBar.propTypes = {
  value:     number.isRequired,   // 0–100 (SLA%)
  maxWidth:  number,              // px, default 160
  showLabel: bool,
}
// Color mapping (computed internally):
// ≥95 → #16A34A,  85–94 → #4ADE80,  75–84 → #D97706,
// 60–74 → #EA580C,  <60 → #DC2626

// ── LocationNode (map) ───────────────────────────────────────────────────
LocationNode.propTypes = {
  location:    shape({
    id:        string,
    name:      string,
    type:      oneOf(['warehouse','dc','hub','store']),
    x:         number,    // SVG coordinate
    y:         number,    // SVG coordinate
  }),
  status:      oneOf(['healthy','at-risk','breached','inactive']),
  activeCount: number,    // active dispatches at this node
  onClick:     func,
}

// ── VehicleMiniCard ──────────────────────────────────────────────────────
VehicleMiniCard.propTypes = {
  dispatch:  shape({
    id:       string,
    routeCode:string,
    vehicleReg:string,
    sla:      shape({ atRisk: bool, breached: bool, hoursRemaining: number }),
  }),
  position:  shape({ x: number, y: number }),   // SVG anchor
  onView:    func,
}

// ── AlertCard ─────────────────────────────────────────────────────────
AlertCard.propTypes = {
  alertType:  oneOf(['SLA_BREACH','HIGH_RISK','ESCALATED_EXCEPTION','OVERDUE_RECONCILIATION']),
  severity:   oneOf(['critical','high','medium']),
  message:    string.isRequired,
  dispatchId: string,
  routeCode:  string,
  timeAgo:    string,
  onView:         func,
  onEscalate:     func,
  onAcknowledge:  func,
}

// ── RouteTable row ───────────────────────────────────────────────────
RouteRow.propTypes = {
  routeId:     string.isRequired,
  routeCode:   string.isRequired,
  routeName:   string,
  grade:       oneOf(['A','B','C','D','F']),
  otaPct:      number,
  delayMinutes:number,
  costPerKm:   number,
  score:       number,
  exceptions:  number,
  onClick:     func,
}

// ── GradeBadge ──────────────────────────────────────────────────────
GradeBadge.propTypes = {
  grade: oneOf(['A','B','C','D','F']),
  size:  oneOf(['sm','md','lg']),   // default 'md'
}
```

---

### 5.3 Data Fetching Architecture

```jsx
// dashboardBridge.js — wraps window.TCT services for React consumption
// Called via hooks; no direct window.TCT access from components.

export const fetchExecutiveKPIs    = () => window.TCT.ExecutiveDashboardService.getKPIs({ fresh: true });
export const fetchTimeSeries       = (days) => window.TCT.ExecutiveDashboardService.getTimeSeries(days);
export const fetchStatusFunnel     = () => window.TCT.DispatchDashboardService.getStatusFunnel();
export const fetchAtRisk           = () => window.TCT.DispatchDashboardService.getAtRisk();
export const fetchExceptionSummary = () => window.TCT.ExceptionDashboardService.getSummary();
export const fetchExceptionsByRegion = () => window.TCT.ExceptionDashboardService.getOpenByRegion();
export const fetchExceptionsByCarrier = () => window.TCT.ExceptionDashboardService.getOpenByCarrier();
export const fetchRoutePerformance = () => window.TCT.RouteDashboardService.getPerformanceTable();
export const fetchSLAByRegion      = () => window.TCT.RouteDashboardService.getSLABreakdown();
export const fetchCarrierRanking   = () => window.TCT.CarrierDashboardService.getRanking();
export const fetchAlerts           = () => window.TCT.AlertService.getAll();
export const fetchRecentEvents     = () => window.TCT.DomainEventBus.getEventLog(20);
export const fetchFleetSnapshot    = () => window.TCT.CapacityEngine.fleetSnapshot();

// useDashboardData.js — master orchestration hook
export function useDashboardData(filters) {
  // Manages:
  // - Initial load (all sections in parallel)
  // - Auto-refresh (per-section TTL intervals)
  // - Filter change (invalidate + reload)
  // - Loading / error states per section
  // Returns: { kpis, funnel, atRisk, exceptions, routes, carriers, alerts, events, loading, error }
}

// useAutoRefresh.js — generic interval hook
export function useAutoRefresh(fetchFn, intervalMs, deps = []) {
  // Runs fetchFn immediately, then on every intervalMs
  // Clears interval on unmount
  // Pauses when tab is hidden (document.visibilityState)
  // Returns: { data, loading, error, lastRefresh, refresh }
}

// useGlobalFilters.js — filter state + persistence
export function useGlobalFilters() {
  // Reads from: sessionStorage (tct_global_filters)
  // Returns: { filters, setFilter, resetFilters, savePreset, loadPreset }
  // On change: calls window.TCT.DashboardMaster.invalidateAll()
}
```

---

### 5.4 Page-Level Component (ExecutiveControlTower.jsx)

```jsx
// Structure outline — not production code, architectural reference only

function ExecutiveControlTower() {

  const { filters } = useGlobalFilters();

  const { data: kpis,      loading: l1 } = useAutoRefresh(() => fetchExecutiveKPIs(),    30_000, [filters]);
  const { data: funnel,    loading: l2 } = useAutoRefresh(() => fetchStatusFunnel(),     30_000, [filters]);
  const { data: atRisk,    loading: l3 } = useAutoRefresh(() => fetchAtRisk(),           15_000, [filters]);
  const { data: exceptions,loading: l4 } = useAutoRefresh(() => fetchExceptionSummary(), 30_000, [filters]);
  const { data: routes,    loading: l5 } = useAutoRefresh(() => fetchRoutePerformance(), 300_000,[filters]);
  const { data: carriers,  loading: l6 } = useAutoRefresh(() => fetchCarrierRanking(),   300_000,[filters]);
  const { data: alerts,    loading: l7 } = useAutoRefresh(() => fetchAlerts(),           15_000, [filters]);
  const { data: events,    loading: l8 } = useAutoRefresh(() => fetchRecentEvents(),     15_000, [filters]);
  const { data: slaHeatmap,loading: l9 } = useAutoRefresh(() => fetchSLAByRegion(),      60_000, [filters]);

  const { openDrawer } = useDrawerContext();

  return (
    <AppShell>
      <Breadcrumb items={[{ label: 'Home', href: '/' }, { label: 'Executive Control Tower' }]} />
      <PageHeader title="Executive Control Tower" syncLabel={lastSync} />

      <DashboardGrid>
        <KPIStrip data={kpis} loading={l1} />

        <TwoColumnRow>
          <NetworkVisibilityMap dispatches={atRisk} loading={l3} onNodeClick={...} onVehicleClick={...} />
          <DispatchLifecycleFunnel data={funnel} loading={l2} onStatusClick={...} />
        </TwoColumnRow>

        <ExceptionCommandCenter data={exceptions} loading={l4} onView={openDrawer} onEscalate={...} />

        <TwoColumnRow>
          <RoutePerformanceWidget data={routes} loading={l5} onRouteClick={openDrawer} />
          <CarrierPerformanceWidget data={carriers} loading={l6} onCarrierClick={openDrawer} />
        </TwoColumnRow>

        <SLAHeatmapWidget data={slaHeatmap} loading={l9} onRowClick={...} />

        <AlertCenter alerts={alerts} events={events} loading={l7 || l8} onView={openDrawer} />
      </DashboardGrid>
    </AppShell>
  );
}
```

---

## 6. UX INTERACTIONS & BEHAVIOURS

### 6.1 KPI Strip Interactions

```
HOVER CARD:
  Cursor: pointer
  Effect: card lifts (translateY -2px), shadow intensifies
  Duration: 150ms ease

CLICK CARD:
  Triggers navigation (see per-card click behaviour in Section 3.1)
  Transition: page-level fade (200ms)

TOOLTIP ([i] icon):
  Trigger: hover on [i]
  Content: metric definition + formula + data source step reference
  Position: above card, centered
  Delay: 400ms (prevent accidental trigger)
  Example for OTD%:
    "On-Time Departure: dispatches that departed within the SLA departure
    window. Source: KPIEngine.calculateOTD(). Tolerance: ±60 min (SLA config)."

TREND BADGE:
  ▲ green  = positive direction (OTA went up, exceptions went down)
  ▼ red    = negative direction
  ━ gray   = no change
  Logic: trend direction is contextual (up is good for OTA%, bad for exceptions)

PROGRESS BAR (% KPIs):
  Fills left-to-right
  Color: matches status (green/amber/red based on threshold)
  Animated on load: fills from 0 to value over 600ms

VALUE COUNTER ANIMATION:
  On load and on filter change: counts up from 0 to value over 800ms
  Uses requestAnimationFrame, easing: easeOutCubic
```

### 6.2 Map Interactions

```
NODE HOVER:
  Shows tooltip: [Location Name] | [Type] | [Active Dispatches: N]
  Node border pulses if at-risk (CSS keyframe animation, 2s loop)
  Tooltip delay: 200ms

NODE CLICK:
  Highlights all routes connected to this node
  Other nodes dim (opacity: 0.4)
  Opens a side panel (mini node summary, not drawer):
    - Location name, type, region
    - Active dispatches at this node
    - [View Dispatches →] link
  Click elsewhere to dismiss

VEHICLE MARKER HOVER:
  Shows VehicleMiniCard above the marker:
    [Dispatch ID]  [Route Code]
    ETA: 14:30    SLA: ✅ On Track
    [View Dispatch →]
  Delay: 100ms

VEHICLE MARKER CLICK:
  Opens DispatchDetailDrawer for that dispatch

ROUTE LINE HOVER:
  Line highlights (thicker, brighter)
  Tooltip: Route code, dispatches on lane, avg OTA%

ROUTE LINE CLICK:
  Opens RouteDetailDrawer

MAP ZOOM (future / phase 3):
  Scroll wheel zoom (transform: scale)
  Double-click to zoom in
  Two-finger pinch on touch

PULSING ANIMATION (at-risk / breached):
  At-risk node: amber pulse (box-shadow keyframe)
  Breached node: red pulse, faster frequency (0.8s vs 1.5s)
  Breached vehicle marker: red flashing icon
```

### 6.3 Funnel Bar Interactions

```
HOVER BAR:
  Cursor: pointer
  Effect: bar brightens (filter: brightness(1.1))
  Shows count tooltip with: "[Status]: N dispatches (P%)"

CLICK BAR:
  Navigate: /dispatch/board?status=[STATUS]
  Applied as global filter override for status

IN-TRANSIT SPECIAL BEHAVIOUR:
  Clicking "In Transit" bar expands the StageHealthPanel inline
  Panel shows: On-track N | At-risk N (amber) | Breached N (red)
  Each count is clickable → filtered dispatch board with SLA status

ANIMATION (on data load / filter change):
  Bars animate width from 0 → actual% over 500ms
  Staggered: each bar starts 50ms after previous
  Easing: easeOutExpo
```

### 6.4 Exception Command Center Interactions

```
COLUMN HEADER CLICK:
  Navigate: /exceptions/queue?severity=[SEVERITY]

EXCEPTION CARD:
  Hover: card background lightens, action buttons become more visible
  Action button hover: scale(1.02) + shadow

INVESTIGATE button:
  Calls ExceptionResolutionEngine.investigate(id) via bridge
  Optimistic UI: button shows spinner, card status updates immediately
  Success: card status changes to "Investigating"
  Error: toast notification "Failed to update status"

ESCALATE button:
  Opens inline confirmation popover (not full modal):
    "Escalate to: [current level + 1] — [role name]?"
    [Confirm]  [Cancel]
  On confirm: EscalationEngine.escalate(id, level+1, currentUser)
  Success: escalation badge updates on card

VIEW button:
  Opens ExceptionDetailDrawer (right-side, 620px)
  Backdrop dims the page

ASSIGN button:
  Opens assignee picker popover:
    Search input + user list
    Click user → assigns exception
    ResolutionEngine.assign(id, userId)
```

### 6.5 Route/Carrier Table Interactions

```
TABLE ROW HOVER:
  Background: --surface-card-hover (#F8FAFC)
  Sparkline tooltip appears (7-day OTA trend, tiny 60×20px chart)
  Cursor: pointer

TABLE ROW CLICK:
  RouteTable: opens RouteDetailDrawer
  CarrierTable: opens CarrierDetailDrawer

TAB STRIP:
  Click tab → swaps table data + updates URL query param ?tab=top|worst
  No page reload (client-side data swap)
  Active tab: bold text + bottom border accent

SORT COLUMNS:
  Click column header → sort asc/desc toggle
  Sort icon: ↑ (asc) / ↓ (desc) / ↕ (default)
  Multi-sort: hold Shift + click second column (future)

VIEW ALL LINK:
  RoutePerformanceWidget → /routes/scorecard
  CarrierPerformanceWidget → /carriers/ranking
```

### 6.6 SLA Heatmap Interactions

```
ROW HOVER:
  Highlighted row background
  HeatBar brightens

ROW CLICK (Region view):
  Filters dispatch board to that region: /dispatch/board?region=[REGION]
  Passed as global filter update (not navigation)

ROW CLICK (Route view):
  Opens RouteDetailDrawer for that route

HEATBAR ANIMATION:
  On load: bar width animates 0 → value over 400ms
  On tab switch (Region ↔ Route): bars cross-fade + re-animate
  Color changes smoothly via CSS transition

TAB SWITCH (By Region / By Route):
  Instant data swap (both loaded upfront)
  Active tab indicator slides (sliding underline CSS transition)
```

### 6.7 Alert Center Interactions

```
PANEL HEADER:
  Shows count badge
  Click header → /alerts/[alert-type] full screen

ALERT CARD:
  Hover: subtle lift (2px translate, shadow)
  New alerts: slide-in from right (200ms) with amber flash

VIEW button:
  Opens DispatchDetailDrawer for linked dispatch

ESCALATE button:
  Inline confirmation: "Escalate to Level 2?"
  On confirm: EscalationEngine.escalate(exceptionId, 2, user)

ACKNOWLEDGE button (in GlobalAlertRail):
  Marks alert as acknowledged in session state
  Alert rail count decrements
  Alert remains in /alerts/history

RECENT EVENTS FEED:
  "Load more" → fetches next 10 events (appends to list)
  Click event row → opens relevant dispatch/exception drawer
  Auto-scrolls to newest on new event arrival (if user is at top)

NEW ALERT ARRIVAL (polling):
  AlertService.getAll() runs every 15s
  If new critical alert appears: GlobalAlertRail slides up from bottom-right
  Sound notification: optional (user preference, off by default)
  Browser notification: only if user granted permission
```

### 6.8 Global Filter Interactions

```
FILTER CHANGE:
  1. Filter value changes (user selects)
  2. Active filter chip appears in filter bar
  3. 300ms debounce
  4. window.TCT.DashboardMaster.invalidateAll() called
  5. All hooks mark loading=true (skeleton loaders appear)
  6. Each section re-fetches with new filter context
  7. Sections load independently (not a single loading state)

FILTER CHIP (×) CLICK:
  Removes that filter, returns to default
  Triggers re-fetch chain

CLEAR ALL:
  All filters → default
  Full re-fetch

SAVE PRESET:
  Opens inline name input: "Name this filter combination"
  Saves to localStorage: { name, filters, savedAt }
  Appears in "Saved Presets" section of filter dropdown

FILTER DROPDOWN CLOSE:
  Click outside → close
  Escape key → close
  Applied: no apply button needed — each filter applies on selection

DEEP LINK:
  Active filters encoded in URL: ?dateRange=7d&region=North&carrier=BlueDart
  On page load: parse URL → pre-populate filter state
  Share-able URL always reflects current filter state
```

---

## 7. DRILLDOWN SPECIFICATIONS

### 7.1 Drilldown Flow from Executive Dashboard

```
ENTRY POINT A: KPI Card Click
  OTA% card click →
    URL: /executive/sla-compliance?metric=ota
    Shows: SLA Compliance page filtered to OTA metric
    Drilldown options: by region / by route / by carrier

ENTRY POINT B: Map Node Click
  DC Mumbai node click →
    Opens node summary panel (inline, not drawer)
    [View Dispatches] → /dispatch/board?origin=LOC-MUM-DC-001
    [View Route Performance] → /routes?origin=LOC-MUM-DC-001

ENTRY POINT C: Map Vehicle Click
  Vehicle marker click →
    Opens DispatchDetailDrawer for that dispatch
    Within drawer → HU Manifest tab → click barcode → HU chain of custody

ENTRY POINT D: Funnel Bar Click
  "In Transit" bar → /dispatch/board?status=in-transit
    Row click → DispatchDetailDrawer
    HU tab → HU detail
    Audit tab → Audit trail

ENTRY POINT E: Exception Card → View
  Exception View button → ExceptionDetailDrawer
    "Linked Dispatch" section → dispatch mini-card
    Click dispatch → DispatchDetailDrawer (stacked drawer)

ENTRY POINT F: Route Table Row
  Route row click → RouteDetailDrawer (right side, 680px)
  Drawer tabs: Overview | Dispatches | Exceptions | Cost | Carriers
  Dispatch row in drawer → nested DispatchDetailDrawer

ENTRY POINT G: Carrier Table Row
  Carrier row click → CarrierDetailDrawer
  Tabs: Profile | Dispatches | Exceptions | Routes | Cost
```

### 7.2 Drawer Stacking Rules

```
LEVEL 1 DRAWER: First drill (Route, Carrier, Exception)
  Width: 620px
  Overlay: dims page content (rgba(0,0,0,0.3))

LEVEL 2 DRAWER: Second drill from within Level 1 drawer (Dispatch from Route)
  Width: 560px (slightly narrower)
  Positioned: 60px left of Level 1 drawer edge
  Overlay: dims Level 1 drawer (rgba(0,0,0,0.2))
  Stack visible: both drawers visible, L2 on top

LEVEL 3 DRAWER: Third drill (HU from Dispatch)
  Width: 480px
  Positioned: 60px left of Level 2 drawer
  All 3 drawers visible simultaneously

CLOSE BEHAVIOUR:
  × on L3 → closes L3 only, L2 remains visible
  × on L2 → closes L2 + L3
  × on L1 → closes all drawers
  Escape key → closes topmost drawer
  Click backdrop → closes topmost drawer

BACK NAVIGATION (within drawer):
  Each drawer has: ← Back button (not close)
  Back from L2 → shows L1 drawer in full view (hides L2)
  Back preserves scroll position in L1

MAX STACK DEPTH: 3 drawers
  HU → chain of custody is always the final level (no further drill)
```

### 7.3 Breadcrumb in Drawers

```
Drawer internal breadcrumb (below drawer header):

  DispatchDetailDrawer:
    Dispatches › TCT-0019

  RouteDetailDrawer → DispatchDetailDrawer:
    Routes › DEL-MUM-01 › TCT-0019

  RouteDetailDrawer → DispatchDetailDrawer → HU:
    Routes › DEL-MUM-01 › TCT-0019 › HU0012345

Each breadcrumb item is clickable:
  Click "DEL-MUM-01" → closes dispatch drawer, shows route drawer
  Click "Dispatches" → closes all drawers, navigates to /dispatch/board
```

---

## 8. RESPONSIVE BEHAVIOUR

### 8.1 Breakpoints

```
--bp-xs:   375px   (mobile portrait)
--bp-sm:   640px   (mobile landscape)
--bp-md:   768px   (tablet portrait)
--bp-lg:   1024px  (tablet landscape / small laptop)
--bp-xl:   1280px  (standard desktop)
--bp-2xl:  1536px  (wide desktop)
--bp-3xl:  1920px  (ultrawide)
```

### 8.2 Layout Shifts per Breakpoint

```
≥ 1280px (xl — default design target):
  Left nav: 220px expanded
  KPI strip: 9 cards in 1 row
  Network row: 60/40 split (map / funnel)
  Exception: 4 columns
  Performance row: 50/50 split
  SLA Heatmap: full width
  Alert Center: 4-column panel row

1024–1279px (lg):
  Left nav: collapses to 56px (icon only)
  KPI strip: 5 cards row 1, 4 cards row 2
  Network row: 55/45 split
  Exception: 2×2 grid
  Performance row: 50/50 split
  Alert Center: 2×2 grid

768–1023px (md — tablet):
  Left nav: hidden (accessible via hamburger → slide-over)
  KPI strip: 3 per row (3 rows)
  Network row: stacked (map full width, funnel below)
  Exception: 2 columns (critical+high | medium+low)
  Performance: stacked (route table, then carrier table)
  Alert Center: 2 columns

<768px (sm/xs — mobile):
  Left nav: hidden (hamburger)
  Top nav: simplified (logo + bell + user icon only)
  Filters: collapse to single "Filters" button → full-screen filter sheet
  KPI strip: horizontal scroll (card width: 160px, scroll snapping)
  Map: hidden (replaced by Network Quick Stats bar only)
  Funnel: full width
  Exception: 1 column (all severity stacked)
  Performance: 1 column, Top 5 only
  Alert: 1 column, 3 alerts max
```

### 8.3 Touch Interactions (Mobile)

```
KPI card: tap = navigate (same as click)
Funnel bar: tap = navigate
Map (mobile — hidden): replaced by summary stats
Exception card: swipe-right = quick-assign; swipe-left = dismiss
Table rows: tap = open drawer (full-screen on mobile, not side drawer)
Alert card: swipe-left = acknowledge

DRAWERS (mobile):
  Full-screen (100vw × 100vh) instead of side panel
  Slide up from bottom (not from right)
  Close: swipe down or × button
  Back: back button (top-left)
```

---

## 9. DATA CONTRACT PER COMPONENT

### 9.1 KPIStrip ← ExecutiveDashboardService.getKPIs()

```javascript
// Expected shape from window.TCT.ExecutiveDashboardService.getKPIs()
{
  generatedAt:        "2026-06-18T14:32:00Z",
  totalDispatches:    47,
  activeDispatches:   14,
  otdPct:             87,
  otaPct:             82,
  slaPct:             91,
  openExceptions:     25,
  criticalExceptions: 2,
  closedExceptions:   18,
  vehicleUtilPct:     73,
  avgCarrierScore:    81,
  trends: {
    otdPct:           "down",          // for trend badge direction
    otaPct:           "up",
    openExceptions:   "up",
    vehicleUtilPct:   "good",
  },
  breakdown:          { /* KPIEngine.aggregateKPIs output */ }
}

// KPICard mapping:
Card 1: label="Today's Dispatches"  value=totalDispatches     unit=""   status=info
Card 2: label="OTD %"               value=otdPct              unit="%"  status=computed
Card 3: label="OTA %"               value=otaPct              unit="%"  status=computed
Card 4: label="SLA %"               value=slaPct              unit="%"  status=computed
Card 5: label="In Transit"          value=activeDispatches    unit=""   status=info
Card 6: label="Open Exceptions"     value=openExceptions      unit=""   status=computed
Card 7: label="Critical Exceptions" value=criticalExceptions  unit=""   status=computed-danger
Card 8: label="Vehicle Util %"      value=vehicleUtilPct      unit="%"  status=computed
Card 9: label="Cost / Dispatch"     value=costPerDispatch     unit="₹"  status=computed
       (costPerDispatch derived from CostEngine in bridge layer)
```

### 9.2 DispatchLifecycleFunnel ← DispatchDashboardService.getStatusFunnel()

```javascript
{
  funnel: {
    planned:    12,
    ready:       8,
    dispatched:  5,
    "in-transit":14,
    arrived:     6,
    unloading:   2,
    reconciled:  5,
    closed:      3,
  },
  total: 47,
  generatedAt: "..."
}
// maxCount derived in component: Math.max(...Object.values(funnel))
// healthData for in-transit: from AlertService.getHighRiskDispatches()
```

### 9.3 ExceptionCommandCenter ← ExceptionDashboardService.getSummary() + .getList()

```javascript
// getSummary() for counts and bySeverity
// getList({ severity: 'critical' }, 1, 2) for top 2 exception cards per column

// Each ExceptionCard needs:
{
  id:             "EXC-001",
  category:       "seal-mismatch",
  severity:       "critical",
  dispatchId:     "TCT-0019",
  routeCode:      "MUM-DEL-01",
  raisedAt:       "2026-06-18T12:00:00Z",
  resolutionState:"open",
  escalationLevel: 2,
  escalatedTo:    "Operations Manager",
  assignee:       null,
}
```

### 9.4 RoutePerformanceWidget ← RouteDashboardService.getPerformanceTable()

```javascript
{
  routes: [
    {
      routeId:   "RT-001",
      routeCode: "DEL-MUM-01",
      routeName: "Delhi to Mumbai",
      totalDispatches: 12,
      subScores: {
        reliability:    { score: 95 },
        slaCompliance:  { score: 94 },
        delayIndex:     { score: 88 },
        costEfficiency: { score: 90 },
        reconciliation: { score: 100 },
      },
      composite: 94,
      grade:     "A",
      avgVarianceMin: 8,
      avgCostPerKm:   42,
    },
    // ...
  ],
  avgComposite: 76,
  topRoute: { /* first item */ },
  bottomRoute: { /* last item */ },
}
// TopRoutes: routes sorted by composite DESC, slice(0, 10)
// WorstRoutes: routes sorted by composite ASC, slice(0, 10)
```

### 9.5 SLAHeatmapWidget ← RouteDashboardService.getSLABreakdown() + getDelayAnalysis()

```javascript
// By Region: computed in bridge layer from dispatch data grouped by location.region
{
  regions: [
    {
      region:         "East",
      totalDispatches: 18,
      slaCompliancePct: 95,
      slaBreaches:    0,
      breachPct:      0,
    },
    // ...
  ]
}
// HeatBar value = slaCompliancePct
// Delta vs avg = slaCompliancePct - globalSlaPct (from ExecutiveDashboardService)
```

---

## 10. ANIMATION & MOTION SPEC

### 10.1 Page Load Sequence

```
T=0ms    Shell renders (nav, top bar, breadcrumb) — instant
T=0ms    All content areas show skeleton loaders
T=50ms   KPI strip skeletons visible
T=200ms  Parallel API calls initiated (all sections)
T=300ms  KPI strip data arrives → counter animation starts (800ms count-up)
T=400ms  Funnel data arrives → bars animate (staggered, 50ms per bar)
T=500ms  Exception data arrives → cards fade in (opacity 0→1, 200ms)
T=600ms  Performance tables arrive → rows slide in from left (staggered, 30ms per row)
T=700ms  Map renders (nodes pop in, then route lines draw, then vehicles appear)
T=800ms  Alert center arrives → alert cards slide in from right
T=900ms  Heatmap bars animate (same as funnel)
```

### 10.2 Transition Catalogue

```
PAGE TRANSITION (between modules):
  Type: Crossfade
  Duration: 200ms
  Easing: ease

DRAWER OPEN:
  Slide in from right: translateX(100%) → translateX(0)
  Duration: 300ms
  Easing: cubic-bezier(0.4, 0, 0.2, 1) (Material Design standard)
  Backdrop: opacity 0 → 0.3, 300ms

DRAWER CLOSE:
  Slide out to right: translateX(0) → translateX(100%)
  Duration: 200ms
  Easing: cubic-bezier(0.4, 0, 1, 1)

ALERT RAIL OPEN:
  Slide up from bottom-right: translateY(100%) → translateY(0)
  Duration: 250ms
  Easing: ease-out

NEW ALERT CARD:
  Slide in from right + fade: translateX(40px) → 0, opacity 0 → 1
  Duration: 200ms
  Flash: amber/red background pulse once (200ms)

DATA REFRESH (in-place):
  Sections that refresh: content stays visible, subtle shimmer overlay 200ms
  Not a full skeleton re-render (only on initial load)

FILTER CHANGE:
  All sections: simultaneous skeleton overlay (100ms fade in)
  New data: skeleton fades out as each section loads independently

TAB STRIP INDICATOR:
  Active underline slides horizontally to new tab
  Duration: 150ms, ease

COUNTER ANIMATION (KPI values):
  easeOutCubic interpolation
  Duration: 800ms
  Format-preserving (never shows decimals mid-count for integer values)

AT-RISK NODE PULSE (map):
  CSS: box-shadow keyframe, 0 → amber glow → 0
  Duration: 1500ms, infinite
  Timing: ease-in-out

CRITICAL BREACH PULSE (map):
  CSS: box-shadow keyframe, red glow
  Duration: 800ms, infinite (faster than at-risk)
  Also: vehicle icon scale: 1 → 1.15 → 1 at same frequency
```

### 10.3 Loading States

```
SKELETON LOADER DESIGN:
  Background: linear-gradient(90deg, #F1F5F9 25%, #E2E8F0 50%, #F1F5F9 75%)
  Background-size: 200% 100%
  Animation: shimmer (background-position moves left to right)
  Duration: 1.5s, infinite

KPI CARD SKELETON:
  ┌────────────────────┐
  │ ████ (label)        │  ← 10px high, 60% width
  │                    │
  │ ██████████ (value) │  ← 32px high, 50% width
  │                    │
  │ ████ (trend)       │  ← 10px high, 40% width
  └────────────────────┘

TABLE ROW SKELETON:
  5 cells, each a shimmer bar at 80% of column width, 14px height, 4px radius

MAP SKELETON:
  Grey rectangle with shimmer, same dimensions as map area
  SVG loading icon centered

EMPTY STATE:
  Shows after data loads but returns 0 results
  (not shown during loading — skeleton takes that role)
```

---

## APPENDIX — Executive Dashboard Layout Grid

```
FULL PAGE GRID (1280px, 12-column, 24px gutter, 24px margin):

Row 1  [KPI STRIP]             span: 12/12  h: auto (96px card + 24px gap)
Row 2  [MAP]     span: 7/12    [FUNNEL] span: 5/12   h: 400px
Row 3  [EXCEPTION CENTER]      span: 12/12  h: auto (~220px)
Row 4  [ROUTE]   span: 6/12    [CARRIER] span: 6/12  h: 340px
Row 5  [SLA HEATMAP]           span: 12/12  h: auto (~280px)
Row 6  [ALERT CENTER]          span: 12/12  h: auto (~240px)

Total estimated scroll height (1280px viewport):
  ≈ 96 + 400 + 220 + 340 + 280 + 240 + (gaps) ≈ 1700px
  (dashboard requires scroll — intentional for information density)

Above-the-fold (no scroll at 1280×900):
  KPI Strip (Section 1) — fully visible
  Map + Funnel (Section 2+3) — partially visible, scroll cue visible
```

---

*Document ends.*

---

**UI PHASE 2 COMPLETE**
