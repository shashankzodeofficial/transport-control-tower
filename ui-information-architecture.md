# Enterprise Transport Control Tower — UI Information Architecture
## UI PHASE 1 · Information Architecture Document

**Authored by:** Chief Product Officer · Head of Supply Chain Technology · Blue Yonder UX Architect · FourKites Product Designer
**Date:** June 2026
**Scope:** Application structure, navigation, personas, screen hierarchy, drilldown model, layout specification
**Feeds into:** UI Phase 2 (Component Library) → UI Phase 3 (Screen Build) → Step 8 (Final Assembly)

---

## TABLE OF CONTENTS

1. [Design Principles](#1-design-principles)
2. [User Personas](#2-user-personas)
3. [Complete Navigation Structure](#3-complete-navigation-structure)
4. [Screen Hierarchy — All Levels](#4-screen-hierarchy)
5. [Drilldown Navigation Model](#5-drilldown-navigation-model)
6. [Recommended Layout System](#6-recommended-layout-system)
7. [Control Tower Widget Catalogue](#7-control-tower-widget-catalogue)
8. [Global Filter Specification](#8-global-filter-specification)
9. [Persona × Screen Access Matrix](#9-persona--screen-access-matrix)
10. [Data Binding Map (Service → Screen)](#10-data-binding-map)
11. [State & Alert Overlay Model](#11-state--alert-overlay-model)

---

## 1. DESIGN PRINCIPLES

> Derived from Blue Yonder Control Tower UX guidelines and FourKites product philosophy.

### 1.1 Core Tenets

| Tenet | Principle | Applied As |
|---|---|---|
| **Situation Awareness** | Operators must know the state of the network within 5 seconds of opening any screen | Live KPI strip always visible; color-coded status everywhere |
| **Progressive Disclosure** | Summary → Exception → Detail. Never show everything at once | 3-level drilldown enforced on all list screens |
| **Action-Oriented** | Every alert, exception, and risk must have a primary CTA visible without scrolling | Action buttons co-located with data — no separate "action menus" |
| **Role Fidelity** | Each persona sees exactly the data their role needs — no more, no less | Role-based nav collapse; context-aware widget sets |
| **Zero-Click Alerts** | Critical events surface without the user navigating to them | Global alert rail; push notification overlay |
| **Consistency Over Cleverness** | Same patterns everywhere — same table structure, same filter bar, same drilldown depth | Shared component vocabulary (Phase 2 defines these) |
| **Data Density** | Supply chain operators are power users. Compact information-dense layouts preferred over marketing-style card decks | Default to table-first views; cards for KPIs only |

### 1.2 Visual Hierarchy Rules

```
Level 1  — Module (left nav item)
Level 2  — Section within module (sub-nav or tab strip)
Level 3  — Detail panel, side drawer, or modal
Overlay  — Global alert, notification, or confirmation
```

---

## 2. USER PERSONAS

### 2.1 Persona Definitions

---

#### PERSONA 1 — Supply Chain Head (SCH)

| Attribute | Detail |
|---|---|
| **Role** | VP / Head of Supply Chain |
| **Primary question** | "Is the network performing to plan today?" |
| **Decision horizon** | Weekly / monthly strategic |
| **Alert threshold** | Only critical SLA breaches, carrier failures |
| **Data preference** | KPI cards, trend lines, exception counts |
| **Key screens** | Executive Control Tower, Analytics, Carrier Performance |
| **Module access** | Read-only on all modules; no operational controls |
| **Session pattern** | Opens app once in the morning; checks alerts on mobile |

**Top 5 questions this persona asks:**
1. What is today's network-wide OTD and OTA?
2. Which carrier is underperforming most?
3. How many SLA breaches occurred this week?
4. What is the total open exception count by severity?
5. What is vehicle utilization across the fleet?

---

#### PERSONA 2 — Regional Manager (RM)

| Attribute | Detail |
|---|---|
| **Role** | Regional Operations / Distribution Manager |
| **Primary question** | "What is happening in my region right now?" |
| **Decision horizon** | Daily operational |
| **Alert threshold** | High + critical; SLA at-risk for their region |
| **Data preference** | Route tables, carrier rankings, exception queues |
| **Key screens** | Operations Control Tower, Route Performance, Exception Management |
| **Module access** | Full read + exception assign/escalate for owned region |
| **Session pattern** | Active throughout shift; escalation authority up to Tier 3 |

**Top 5 questions this persona asks:**
1. Which dispatches in my region are at SLA risk right now?
2. Which routes have the worst delay rate this week?
3. What open exceptions are unassigned in my region?
4. Which carrier is causing most delays in Region North?
5. Are there consolidation opportunities for today's planned dispatches?

---

#### PERSONA 3 — Transport Manager (TM)

| Attribute | Detail |
|---|---|
| **Role** | Transport Planning / Execution Manager |
| **Primary question** | "Are all dispatches moving on plan?" |
| **Decision horizon** | Intra-day operational |
| **Alert threshold** | Medium + above; any departure delay or SLA at-risk |
| **Data preference** | Dispatch Kanban / list, vehicle assignment, tracking feed |
| **Key screens** | Dispatch Management, Transport Execution, Load Planning, Control Tower Alerts |
| **Module access** | Full create/edit on dispatches; vehicle assignment; carrier contact |
| **Session pattern** | Continuous monitoring; highest active-session frequency |

**Top 5 questions this persona asks:**
1. Which dispatches are delayed in departure today?
2. Which vehicles are underutilized today — can I consolidate?
3. Is vehicle REG-001 on track to arrive by 18:00?
4. Are there any seal mismatches flagged by the receiving team?
5. Which dispatches are pending vehicle assignment?

---

#### PERSONA 4 — Warehouse Manager (WM)

| Attribute | Detail |
|---|---|
| **Role** | Warehouse / DC Operations Manager |
| **Primary question** | "Is the inbound and outbound flow clear?" |
| **Decision horizon** | Same-day / shift-level |
| **Alert threshold** | Missing HUs, excess HUs, unloading delays |
| **Data preference** | Reconciliation queue, scan session status, HU exceptions |
| **Key screens** | Reconciliation Center, Exception Management (HU category), Dispatch (arrived / unloading status) |
| **Module access** | Create scan sessions; complete reconciliation; raise HU exceptions |
| **Session pattern** | Active during receiving windows; shift-based |

**Top 5 questions this persona asks:**
1. Which dispatches have arrived and are pending unloading?
2. Are there any HU shortages or excess on today's arrivals?
3. What is today's reconciliation match rate?
4. Are there any seal mismatch flags I need to handle?
5. Which dispatches completed reconciliation successfully?

---

#### PERSONA 5 — Operations Executive (OE)

| Attribute | Detail |
|---|---|
| **Role** | Operations Coordinator / Control Tower Analyst |
| **Primary question** | "Is anything about to go wrong that I can prevent?" |
| **Decision horizon** | Real-time |
| **Alert threshold** | All severities; proactive monitoring |
| **Data preference** | Alert feed, at-risk list, exception queue, live tracking |
| **Key screens** | Operations Control Tower, Control Tower Alerts, Exception Management, Transport Execution |
| **Module access** | Full operational access excluding master data and admin |
| **Session pattern** | Continuous 8-hr shift coverage; hands-on exception resolution |

**Top 5 questions this persona asks:**
1. What alerts have fired in the last 30 minutes?
2. Which dispatch is most at risk of SLA breach right now?
3. What exceptions are assigned to me?
4. Has dispatch TCT-0019 departed yet?
5. What is the current status of the exception escalation for carrier XYZ?

---

#### PERSONA 6 — Administrator (ADM)

| Attribute | Detail |
|---|---|
| **Role** | System / Platform Administrator |
| **Primary question** | "Is the platform configured correctly and operating healthily?" |
| **Decision horizon** | Configuration / maintenance |
| **Alert threshold** | Integration failures, API errors, data quality issues |
| **Data preference** | System logs, integration monitor, user management |
| **Key screens** | Administration, Master Data, Integration Monitor |
| **Module access** | Full access including master data, user management, system configuration |
| **Session pattern** | On-demand; responds to integration alerts and configuration requests |

---

### 2.2 Persona Priority Matrix (screen design order)

```
HIGH FREQUENCY + HIGH IMPACT
├── Operations Executive      → Design first (widest screen coverage)
├── Transport Manager         → Design second (most complex interactions)
└── Warehouse Manager         → Design third (reconciliation-specific flows)

LOWER FREQUENCY + HIGH IMPACT
├── Regional Manager          → Design fourth (dashboard + exception focus)
├── Supply Chain Head         → Design fifth (read-only executive views)
└── Administrator             → Design last (utility screens)
```

---

## 3. COMPLETE NAVIGATION STRUCTURE

### 3.1 Navigation Model

```
Application Shell
├── LEFT NAVIGATION (persistent, collapsible, role-filtered)
│   ├── Module Groups (13 top-level)
│   └── Each group: icon + label + badge (alert count)
│
├── TOP NAVIGATION BAR (always visible)
│   ├── Global Filters (Date Range, Region, Route, Carrier)
│   ├── Live Alert Bell (count badge)
│   ├── User Context (name, role, region)
│   └── Quick Actions (New Dispatch, New Exception, Escalate)
│
└── MAIN CONTENT AREA
    ├── Breadcrumb Trail
    ├── Screen Title + Context Info
    ├── Tab Strip (Level 2 navigation)
    └── Content Panels
```

---

### 3.2 Left Navigation — Full Structure

```
╔══════════════════════════════╗
║  🚛 TCT Control Tower        ║  ← App logo / name
╠══════════════════════════════╣
║                              ║
║  ▸ MONITORING                ║  ← Group header (non-clickable)
║  ┣━ Executive CT        [2]  ║  → /executive
║  ┗━ Operations CT       [7]  ║  → /operations
║                              ║
║  ▸ EXECUTION                 ║
║  ┣━ Dispatch Mgmt       [3]  ║  → /dispatch
║  ┣━ Transport Exec      [1]  ║  → /transport
║  ┗━ Load Planning            ║  → /load-planning
║                              ║
║  ▸ EXCEPTIONS                ║
║  ┗━ Exception Mgmt      [9]  ║  → /exceptions
║                              ║
║  ▸ RECONCILIATION            ║
║  ┗━ Reconciliation Ctr       ║  → /reconciliation
║                              ║
║  ▸ PERFORMANCE               ║
║  ┣━ Route Performance        ║  → /routes
║  ┗━ Carrier Performance      ║  → /carriers
║                              ║
║  ▸ ALERTS                    ║
║  ┗━ Control Tower Alerts [4] ║  → /alerts
║                              ║
║  ▸ INTELLIGENCE              ║
║  ┗━ Analytics                ║  → /analytics
║                              ║
║  ▸ CONFIGURATION             ║
║  ┣━ Master Data              ║  → /master-data
║  ┗━ Administration           ║  → /admin
║                              ║
╚══════════════════════════════╝
```

**Badge rules:**
- `[n]` = count of open critical/high alerts for that module
- Badges hidden when count = 0
- Red badge = critical; amber badge = high; no badge = healthy

---

### 3.3 Module Definitions

| # | Module | Nav Label | URL Prefix | Primary Service (Step 7) | Persona Priority |
|---|---|---|---|---|---|
| 1 | Executive Control Tower | Executive CT | `/executive` | `ExecutiveDashboardService` | SCH, RM |
| 2 | Operations Control Tower | Operations CT | `/operations` | `DashboardMaster.hydrateExecutive` | OE, TM |
| 3 | Dispatch Management | Dispatch Mgmt | `/dispatch` | `DispatchDashboardService` | TM, OE |
| 4 | Transport Execution | Transport Exec | `/transport` | `DispatchDashboardService.getAtRisk` | TM, OE |
| 5 | Exception Management | Exception Mgmt | `/exceptions` | `ExceptionDashboardService` | OE, RM, WM |
| 6 | Reconciliation Center | Reconciliation Ctr | `/reconciliation` | `ReconciliationDashboardService` | WM, OE |
| 7 | Route Performance | Route Performance | `/routes` | `RouteDashboardService` | RM, TM |
| 8 | Carrier Performance | Carrier Performance | `/carriers` | `CarrierDashboardService` | RM, SCH |
| 9 | Load Planning | Load Planning | `/load-planning` | `PlanningAnalytics`, `ConsolidationEngine` | TM |
| 10 | Control Tower Alerts | CT Alerts | `/alerts` | `AlertService` | OE, TM |
| 11 | Analytics | Analytics | `/analytics` | All services (aggregated) | SCH, RM |
| 12 | Master Data | Master Data | `/master-data` | `DAL.*` direct | ADM |
| 13 | Administration | Administration | `/admin` | `APISecurityLayer`, `IntegrationMonitor` | ADM |

---

## 4. SCREEN HIERARCHY

### 4.1 Module 1 — Executive Control Tower

```
L1: /executive
    Executive Control Tower
    ├── L2: /executive/overview             ← DEFAULT
    │       Executive Dashboard
    │       Widgets: OTD%, OTA%, SLA%, Open Exceptions, Fleet Util, Carrier Score
    │       Sparklines: 7-day trend per KPI
    │       Map panel: network-level dispatch density (future: live)
    │
    ├── L2: /executive/network-health
    │       Network Health Summary
    │       Table: Route performance grades (A–F)
    │       Table: Carrier ranking with composite scores
    │       Chart: Exception volume by severity (7-day bar)
    │
    ├── L2: /executive/cost-performance
    │       Cost Overview
    │       Table: Cost per route (₹/km, ₹/HU, total)
    │       Table: Carrier cost efficiency ranking
    │       KPI: Total freight spend (period)
    │
    └── L2: /executive/sla-compliance
            SLA Compliance Summary
            Chart: SLA breach count by week
            Table: Top 10 SLA breach routes
            Table: Top 5 SLA breach carriers
```

---

### 4.2 Module 2 — Operations Control Tower

```
L1: /operations
    Operations Control Tower
    ├── L2: /operations/live               ← DEFAULT
    │       Live Operations View
    │       Widget: Dispatch status funnel (Kanban counts)
    │       Widget: At-risk dispatch strip (top 10)
    │       Widget: Open exceptions by severity
    │       Widget: Integration health (ERP/WMS/Carrier)
    │       Widget: Active alert feed (last 20 events)
    │
    ├── L2: /operations/dispatch-tracker
    │       Active Dispatch Tracker
    │       Table: All in-transit dispatches (live status)
    │       Columns: ID, Route, Vehicle, Carrier, ETA, SLA Status, Exceptions
    │       Row color: Green=on-track, Amber=at-risk, Red=breached
    │       │
    │       └── L3: /operations/dispatch-tracker/:id
    │               Dispatch Detail Drawer
    │               Sections: Summary, SLA Clock, HU List, Exceptions, Tracking Trail, Audit
    │
    ├── L2: /operations/exception-queue
    │       Live Exception Queue
    │       Table: Open exceptions assigned to current user / team
    │       Quick-action: Assign, Escalate, Investigate, Resolve
    │
    └── L2: /operations/integration-status
            Integration Monitor
            Table: Last 50 integration calls (system, status, latency)
            Health cards: ERP, WMS, Carrier adapters
            Retry queue depth indicator
```

---

### 4.3 Module 3 — Dispatch Management

```
L1: /dispatch
    Dispatch Management
    ├── L2: /dispatch/board                ← DEFAULT
    │       Dispatch Board (Status View)
    │       Tab strip: All | Planned | Ready | Dispatched | In-Transit | Arrived | Reconciled | Closed
    │       Filter bar: Route, Carrier, Vehicle, Date Range, Search
    │       Table: Dispatch list (sortable, paginated)
    │       Columns: ID, Status, Route, Origin→Dest, Vehicle, Carrier, Planned Dep, Planned Arr, HU Count, Exceptions, SLA
    │       Bulk actions: Assign Vehicle, Assign Carrier, Export
    │       │
    │       └── L3: /dispatch/:id
    │               Dispatch Detail (Full Page or Drawer)
    │               ┌─ Tab 1: Overview
    │               │    Fields: all dispatch fields, route, carrier, vehicle
    │               │    SLA Clock widget
    │               │    OTA/OTD status badges
    │               ├─ Tab 2: HU Manifest
    │               │    Table: All dispatched HUs with registry status
    │               │    Compare: Dispatched vs Received vs Missing vs Excess
    │               ├─ Tab 3: Exceptions
    │               │    List: All linked exceptions with status, severity, action
    │               ├─ Tab 4: Documents
    │               │    Items: ASN, Invoice, Seal, Gate Pass, POD
    │               ├─ Tab 5: Tracking
    │               │    Timeline: GPS trail events
    │               │    (Future: map view)
    │               └─ Tab 6: Audit Trail
    │                    Table: All state transitions, user, role, timestamp, delta
    │
    ├── L2: /dispatch/new
    │       Create Dispatch
    │       Form: Route, Origin, Destination, Planned Departure, Planned Arrival
    │       Form: Vehicle assignment, Carrier selection
    │       Form: HU barcode list, Seal, ASN, Invoice
    │       Validation: Capacity check (CapacityEngine), SLA check
    │       Action: Save as Planned / Save & Move to Ready
    │
    └── L2: /dispatch/bulk-import
            Bulk Dispatch Import
            Upload: CSV template
            Validation: Pre-import error list
            Action: Confirm import
```

---

### 4.4 Module 4 — Transport Execution

```
L1: /transport
    Transport Execution
    ├── L2: /transport/live                ← DEFAULT
    │       Live Execution View
    │       Columns: Dispatch ID, Vehicle, Driver, Route, Current Status, SLA Countdown, Last Event
    │       At-risk indicator: Amber/Red row highlight
    │       Actions: Contact Driver, Escalate, View Tracking
    │
    ├── L2: /transport/departures
    │       Departure Control
    │       Table: Dispatches in "Ready" status — pending departure
    │       Required fields check: Vehicle ✓ Carrier ✓ Seal ✓ ASN ✓ Invoice ✓
    │       Action: Mark Departed (triggers status → dispatched)
    │       Alert: Departure delay flag (if past plannedDeparture)
    │
    ├── L2: /transport/arrivals
    │       Arrival Control
    │       Table: Dispatches expected to arrive in next 4 hours
    │       Columns: ETA, SLA buffer, HU count, Carrier
    │       Action: Mark Arrived → triggers unloading queue
    │
    └── L2: /transport/tracking
            Tracking Feed
            Table: GPS events per dispatch (recent 100)
            Columns: Dispatch, Vehicle, Location, Speed, Timestamp, Event Type
            Filter: Dispatch ID, Route, Time range
```

---

### 4.5 Module 5 — Exception Management

```
L1: /exceptions
    Exception Management
    ├── L2: /exceptions/dashboard          ← DEFAULT
    │       Exception Overview
    │       KPI cards: Total Open, Critical, High, Medium, Avg Resolution Time
    │       Chart: Open by severity (donut)
    │       Chart: Open by category (bar)
    │       Table: Open by carrier (top 5)
    │       Table: Open by region (top 5)
    │
    ├── L2: /exceptions/queue
    │       Exception Queue
    │       Filter bar: Severity, Category, Status, Carrier, Route, Assignee, Date
    │       Table: Exception list (sortable, paginated)
    │       Columns: ID, Dispatch, Category, Severity, Status, Escalation, Age, Assignee, Root Cause
    │       Bulk actions: Assign, Escalate, Close
    │       │
    │       └── L3: /exceptions/:id
    │               Exception Detail
    │               ┌─ Section 1: Header
    │               │    ID, category badge, severity badge, status badge
    │               │    Dispatch link, Route, Carrier, Raised By, Raised At
    │               ├─ Section 2: Root Cause Analysis
    │               │    Primary cause, confidence %, candidate causes
    │               │    SLA impact estimate (₹ and hours)
    │               ├─ Section 3: Resolution Workflow
    │               │    Current state machine position
    │               │    Action buttons: Assign → Investigate → Resolve → Close
    │               │    Resolution notes input (min 10 chars enforced)
    │               ├─ Section 4: Escalation History
    │               │    Timeline: each escalation tier, actor, timestamp, note
    │               │    Action: Manual escalate button (with tier selector)
    │               └─ Section 5: Linked Dispatch
    │                    Mini dispatch card with SLA clock
    │
    ├── L2: /exceptions/root-cause
    │       Root Cause Analysis View
    │       Table: Top causes ranked by count and confidence
    │       Chart: Cause × Category matrix (heat map)
    │       Insight cards: "Carrier XYZ accounts for 43% of departure-delay root causes"
    │
    └── L2: /exceptions/sla-impact
            SLA Impact Report
            Table: Exception → estimated ₹ impact, delay hours
            Total: Aggregate financial exposure from open exceptions
```

---

### 4.6 Module 6 — Reconciliation Center

```
L1: /reconciliation
    Reconciliation Center
    ├── L2: /reconciliation/dashboard      ← DEFAULT
    │       Reconciliation Overview
    │       KPI cards: Match Rate%, Missing HU%, Excess HU%, Damage%, Pending Recon Count
    │       Chart: Reconciliation status distribution (donut)
    │       Table: Today's reconciliation queue
    │
    ├── L2: /reconciliation/queue
    │       Receiving Queue
    │       Table: Dispatches in "Arrived" or "Unloading" status awaiting reconciliation
    │       Columns: Dispatch ID, Route, HU Count, Arrived At, Age (hrs), Scan Session Status
    │       Action: Start Scan Session (opens scan workflow)
    │       │
    │       └── L3: /reconciliation/scan/:dispatchId
    │               Scan Session Workspace
    │               ┌─ Header: Dispatch info, expected HU count, session progress bar
    │               ├─ Input: Barcode scanner input field (auto-focus)
    │               ├─ Live counters: Accepted / Duplicate / Not in manifest / Wrong dispatch
    │               ├─ HU List: Accepted (green) | Rejected (red) | Pending (grey)
    │               └─ Actions: Complete Reconciliation | Save & Pause | Raise Exception
    │
    ├── L2: /reconciliation/history
    │       Reconciliation History
    │       Table: All completed reconciliations
    │       Columns: Dispatch, Route, Match Rate, Missing, Excess, Damage, Completed By, Date
    │       Filter: Status, Date range, Match rate threshold, Carrier, Route
    │       │
    │       └── L3: /reconciliation/report/:dispatchId
    │               Reconciliation Report Detail
    │               Full HU list: Dispatched vs Received comparison
    │               Line-item: Each HU with barcode, status (matched/missing/excess/damaged)
    │               Chain of custody for each HU (from HURegistry)
    │               Seal verification result
    │               ASN/Invoice validation result
    │               Export: PDF, Excel
    │
    └── L2: /reconciliation/exceptions
            Reconciliation Exceptions
            Table: HU-category exceptions (missing, excess, damaged, seal mismatch)
            Pre-filtered view of ExceptionDashboardService
```

---

### 4.7 Module 7 — Route Performance

```
L1: /routes
    Route Performance
    ├── L2: /routes/scorecard              ← DEFAULT
    │       Route Scorecard
    │       Table: All active routes ranked by composite score
    │       Columns: Route, Grade (A–F), Reliability%, SLA%, Delay Index, Cost Efficiency, Recon%
    │       Row color coding: A=green, B=light-green, C=amber, D=orange, F=red
    │       │
    │       └── L3: /routes/:routeId
    │               Route Detail
    │               ┌─ Section 1: Score breakdown (5 sub-scores with weight labels)
    │               ├─ Section 2: Dispatch history on this route (paginated table)
    │               ├─ Section 3: Exception history by category
    │               ├─ Section 4: Cost analysis (₹/km, ₹/HU trends)
    │               └─ Section 5: Carrier performance on this route
    │
    ├── L2: /routes/sla-analysis
    │       Route SLA Analysis
    │       Table: SLA compliance % and breach count per route
    │       Chart: Top 10 worst-SLA routes (bar)
    │
    ├── L2: /routes/delay-analysis
    │       Route Delay Analysis
    │       Table: Delay rate%, avg delay minutes, max delay per route
    │       Chart: Delay distribution (scatter or box plot)
    │
    └── L2: /routes/utilization
            Route Utilization
            Table: Avg vehicle fill rate per route
            Flag: Underutilized routes (< 60% fill) with consolidation opportunity link
```

---

### 4.8 Module 8 — Carrier Performance

```
L1: /carriers
    Carrier Performance
    ├── L2: /carriers/ranking              ← DEFAULT
    │       Carrier Ranking
    │       Table: All active carriers ranked by composite score
    │       Columns: Carrier, Type, OTD%, OTA%, Open Exceptions, Score, ₹/km
    │       Badges: Top Performer, At Risk, On Probation
    │       │
    │       └── L3: /carriers/:carrierId
    │               Carrier Profile
    │               ┌─ Section 1: KPI summary (OTD, OTA, exception rate)
    │               ├─ Section 2: Dispatches this period (table)
    │               ├─ Section 3: Exception history (by category)
    │               ├─ Section 4: Route-level performance on this carrier
    │               ├─ Section 5: Vehicle register for this carrier
    │               └─ Section 6: Cost profile (₹/km, ₹/HU)
    │
    ├── L2: /carriers/sla-compliance
    │       Carrier SLA Compliance
    │       Table: OTA%, OTD%, breach count per carrier
    │       Trend: 4-week OTA trend per carrier
    │
    ├── L2: /carriers/delay-profile
    │       Carrier Delay Profile
    │       Table: Delay%, avg delay minutes, max delay per carrier
    │       Highlight: Carriers with delay % > network average
    │
    └── L2: /carriers/cost-efficiency
            Carrier Cost Efficiency
            Table: ₹/km, ₹/HU, total spend per carrier
            Sort: Cost ascending — identifies cheapest-per-unit carrier per lane
```

---

### 4.9 Module 9 — Load Planning

```
L1: /load-planning
    Load Planning
    ├── L2: /load-planning/capacity        ← DEFAULT
    │       Fleet Capacity Overview
    │       Table: Active dispatches with capacity utilization %
    │       Color: Green ≥70%, Amber 50–69%, Red <50% or overloaded
    │       Filter: Status, Route, Carrier
    │
    ├── L2: /load-planning/consolidation
    │       Consolidation Opportunities
    │       Table: Consolidation opportunity list (ranked by savings ₹)
    │       Columns: Routes, Dispatches, Combined HU, Rec. Vehicle, Current Cost, Consolidated Cost, Savings ₹, Savings %
    │       Action: Accept Consolidation → creates merged dispatch plan
    │       Action: Dismiss Opportunity
    │
    ├── L2: /load-planning/scenarios
    │       SLA vs Cost Simulation
    │       Inputs: Route, HU Count, Weight, CBM, Carrier filter
    │       Output panel: Scenario A (Lowest Cost) | B (Balanced) | C (Fastest)
    │       Comparison table: Cost ₹, Transit Hrs, SLA Buffer, Utilization%, OTA Score
    │       Action: Select Scenario → pre-fill New Dispatch form
    │
    └── L2: /load-planning/recommendations
            Vehicle & Carrier Recommendations
            Input: Load profile (HU, weight, CBM) + Route + SLA hours
            Output: Recommended vehicle type + utilization %
            Output: Recommended carrier with score rationale
            Alternatives: 2 alternative vehicles, 2 alternative carriers
```

---

### 4.10 Module 10 — Control Tower Alerts

```
L1: /alerts
    Control Tower Alerts
    ├── L2: /alerts/active                 ← DEFAULT
    │       Active Alert Feed
    │       Grouped sections:
    │       ├── CRITICAL — SLA Breaches (red panel)
    │       ├── HIGH — At-Risk Dispatches (amber panel)
    │       ├── HIGH — Escalated Exceptions (amber panel)
    │       └── MEDIUM — Overdue Reconciliations (yellow panel)
    │       Each alert: icon, message, dispatch link, action buttons
    │       Actions: Acknowledge, Escalate, View Dispatch, Dismiss
    │
    ├── L2: /alerts/sla-breaches
    │       SLA Breach Log
    │       Table: All dispatches with active SLA breach
    │       Columns: Dispatch, Route, Carrier, Hours Overdue, Status, Action
    │       Sort: Hours overdue descending
    │
    ├── L2: /alerts/high-risk
    │       High Risk Dispatch Monitor
    │       Table: Dispatches with risk score ≥ 20
    │       Columns: Dispatch, Risk Score, SLA At Risk, Exception Count, Action
    │
    └── L2: /alerts/history
            Alert History
            Table: All fired alerts (last 7 days)
            Columns: Alert Type, Severity, Dispatch, Fired At, Acknowledged By, Actioned At
            Filter: Alert type, Date range, Severity
```

---

### 4.11 Module 11 — Analytics

```
L1: /analytics
    Analytics
    ├── L2: /analytics/operations          ← DEFAULT
    │       Operations Analytics
    │       Chart: OTD/OTA trend (30-day line)
    │       Chart: Dispatch volume by status (stacked bar)
    │       Chart: Exception volume by category (bar)
    │       Table: KPI summary vs previous period
    │
    ├── L2: /analytics/carrier
    │       Carrier Analytics
    │       Chart: Carrier OTA% comparison (horizontal bar)
    │       Chart: Carrier exception rate trend (line, multi-carrier)
    │       Table: Carrier cost vs performance matrix
    │
    ├── L2: /analytics/route
    │       Route Analytics
    │       Chart: Route performance grade distribution (donut)
    │       Chart: Top 10 routes by volume
    │       Chart: Delay rate by route (heat map — future)
    │
    ├── L2: /analytics/reconciliation
    │       Reconciliation Analytics
    │       Chart: Match rate trend (30-day line)
    │       Chart: HU exception breakdown (missing/excess/damage, stacked bar)
    │       Table: Reconciliation exceptions by carrier
    │
    └── L2: /analytics/export
            Data Export Center
            Exports available:
            ├── Dispatch list (filtered, date range)
            ├── Exception list (filtered)
            ├── Reconciliation report (all or per route)
            ├── Carrier performance report
            ├── Route performance report
            └── Consolidation opportunities (from PlanningAnalytics)
            Format: CSV / Excel (browser download)
```

---

### 4.12 Module 12 — Master Data

```
L1: /master-data
    Master Data
    ├── L2: /master-data/locations         ← DEFAULT
    │       Location Master
    │       Table: All locations (CRUD)
    │       Fields: Name, Code, Type (DC/Hub/Customer), Region, Address, GPS
    │
    ├── L2: /master-data/routes
    │       Route Master
    │       Table: All routes (CRUD)
    │       Fields: Code, Name, Origin, Destination, Distance km, SLA Hours, Active
    │
    ├── L2: /master-data/carriers
    │       Carrier Master
    │       Table: All carriers (CRUD)
    │       Fields: Name, Type, Contact, OTA Rate, OTD Rate, Exception Rate, Active
    │
    ├── L2: /master-data/vehicles
    │       Vehicle Master
    │       Table: All vehicles (CRUD)
    │       Fields: Registration, Type, Carrier, Capacity (weight/CBM/HU), Active
    │
    ├── L2: /master-data/exception-codes
    │       Exception Code Master
    │       Table: 12 exception categories with taxonomy config
    │       Editable: Auto severity, Resolution SLA hours, SLA impact multiplier
    │
    └── L2: /master-data/sla-config
            SLA Configuration
            Table: SLA configs per route / carrier type
            Fields: Tolerance hours, OTA window, OTD window, Escalation thresholds
```

---

### 4.13 Module 13 — Administration

```
L1: /admin
    Administration
    ├── L2: /admin/users                   ← DEFAULT
    │       User Management
    │       Table: All users with role, region, active status
    │       Actions: Create, Edit, Deactivate, Reset password
    │
    ├── L2: /admin/api-keys
    │       API Key Management
    │       Table: All API keys (from APISecurityLayer.APIKeys)
    │       Columns: Label, Scopes, Rate Limit, Created, Last Used, Call Count, Status
    │       Actions: Generate New Key, Revoke
    │
    ├── L2: /admin/webhooks
    │       Webhook Management
    │       Table: All webhook subscriptions (from WebhookFramework)
    │       Columns: Event, Callback URL, Active, Success Count, Failure Count, Retry Queue
    │       Actions: Add Subscription, Pause, Delete, Test Fire
    │
    ├── L2: /admin/integration-monitor
    │       Integration Health Monitor
    │       Health cards: ERP (SAP/Oracle), WMS, Carrier systems
    │       Table: Last 200 integration log entries
    │       Metrics: Success rate, avg latency, P95 latency per system
    │       Action: Purge old logs, Retry failed jobs
    │
    ├── L2: /admin/notifications
    │       Notification Configuration
    │       Table: Notification log (last 100 events)
    │       Configuration: Channel adapters (Email/SMS/WhatsApp — endpoint setup)
    │       Template preview: Per event × channel
    │
    └── L2: /admin/system
            System Configuration
            Sections:
            ├── Data Store: Seed data reset, storage usage, clear cache
            ├── Security: JWT secret rotation, OAuth token management
            ├── Rate Limits: Per-key limit configuration
            └── Audit: Global audit log viewer, retention settings
```

---

## 5. DRILLDOWN NAVIGATION MODEL

### 5.1 Primary Drilldown Chain

```
Executive KPI Card
│
│   Click "OTA 78%" → "Why?"
▼
Region-Level Breakdown
│   Table: OTA% by region — sorted worst first
│   Region "North" is 61% OTA — "Investigate"
│
│   Click Region Row
▼
Route-Level Breakdown  [/routes/:regionFilter]
│   Table: Routes in Region North, sorted by SLA compliance
│   Route "DEL-MUM-01" has Grade D — "View Route"
│
│   Click Route Row
▼
Route Detail  [/routes/RT-001]
│   Performance score breakdown
│   Dispatch history on this route — filter: last 30 days
│   "Dispatch TCT-0019 arrived 4 hrs late — View"
│
│   Click Dispatch Row
▼
Dispatch Detail  [/dispatch/TCT-0019]
│   Full dispatch card: status, SLA clock, HU count
│   Exceptions tab: 1 open — "arrival-delay, High"
│   Tracking tab: last GPS point 180 km from destination at 14:00
│   "View HU Manifest"
│
│   Click HU Manifest Tab
▼
HU-Level Detail  [/dispatch/TCT-0019 → HU tab]
│   Table: 42 HUs dispatched
│   2 marked "missing" after reconciliation
│   Click barcode "HU0012345"
│
│   Click HU Row
▼
HU Chain of Custody  [DrillDownService.fromHU('HU0012345')]
│   Registered: 2026-06-17 08:14 at Origin DC-001
│   Status: In-transit → Arrived → Missing
│   Exception: raised 2026-06-17 18:42
│
│   "View Full Audit Trail"
▼
Audit Trail  [DrillDownService.auditTrail('TCT-0019')]
    Chronological log of every state change, user action,
    system event, and exception on this dispatch
    Filterable by: Action type, User, Time range
    Exportable: CSV
```

---

### 5.2 Secondary Drilldown Chains

#### Exception → Dispatch → Route → Carrier

```
Alert Feed → Exception Detail → Linked Dispatch → Route Profile → Carrier Profile
```

#### Carrier Score → Route → Dispatch → Exception

```
Carrier Ranking → Carrier Detail → Route performance on carrier → Dispatch list → Exception log
```

#### Reconciliation → Dispatch → HU → Exception

```
Reconciliation Queue → Scan Session → HU status → Exception for missing HU → Resolution
```

#### Load Planning → Simulation → New Dispatch

```
Consolidation Opportunity → Accept → Scenario Simulator → Choose Scenario B → New Dispatch (pre-filled)
```

---

### 5.3 Drilldown UX Rules

| Rule | Behaviour |
|---|---|
| **Breadcrumb always visible** | Shows full drill path; each crumb is a clickable link |
| **Back = breadcrumb, not browser back** | Browser back exits drilldown; breadcrumb navigates within |
| **Context persists on drill** | Active global filters (date, region, route) carry through every drilldown level |
| **Deep link support** | Every L2 and L3 screen has a unique URL that can be bookmarked and shared |
| **Max 5 levels deep** | Never more than 5 navigation levels to reach any data point |
| **Side drawer for L3** | L3 detail opens as a right-side drawer (620px) over L2 — no full-page navigate |
| **Full page for L2** | L2 screens replace the main content area — no drawer |

---

## 6. RECOMMENDED LAYOUT SYSTEM

### 6.1 Application Shell

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ TOP NAVIGATION BAR                                           [H: 56px]       │
│  [Logo]  Global Filters ▼   [Date] [Region] [Route] [Carrier]   🔔[4]  👤RM │
├──────────────┬──────────────────────────────────────────────────────────────┤
│              │  BREADCRUMB TRAIL                             [H: 36px]       │
│  LEFT        │  Home › Dispatch Mgmt › TCT-0019 › Audit Trail               │
│  NAV         ├──────────────────────────────────────────────────────────────┤
│              │  SCREEN TITLE BAR                             [H: 52px]       │
│  [W: 220px]  │  Dispatch Management          [+ New Dispatch] [⬇ Export]     │
│  collapsed:  ├──────────────────────────────────────────────────────────────┤
│  [W: 56px]   │  TAB STRIP (L2 navigation)                   [H: 44px]       │
│              │  Board  |  New  |  Bulk Import                                │
│  Module      ├──────────────────────────────────────────────────────────────┤
│  groups      │                                                               │
│  with        │  MAIN CONTENT AREA                        [flex, fills rest] │
│  badges      │                                                               │
│              │  [Filter Bar]                                                 │
│  Hover =     │  [KPI Cards Row — when applicable]                           │
│  tooltip     │  [Primary Table / Widget Grid]                               │
│              │                                                               │
│              │                                                               │
│              │                                                               │
│              │                                               [Pagination]    │
└──────────────┴──────────────────────────────────────────────────────────────┘
                                                    ▲
                                          ALERT RAIL (fixed, bottom-right)
                                          Slides up over content
                                          Max 3 alerts visible; scroll inside
```

---

### 6.2 Top Navigation Bar — Component Breakdown

```
LEFT SECTION
├── App logo / name (collapse = icon only)
└── [≡] Hamburger (mobile / collapsed state)

CENTRE SECTION — GLOBAL FILTERS
├── 📅 Date Range picker    [Today | Last 7d | Last 30d | Custom]
├── 🌍 Region               [All Regions | North | South | East | West | Central]
├── 🛣️ Route                [All Routes | search/select]
└── 🚚 Carrier              [All Carriers | search/select]

RIGHT SECTION
├── 🔔 Alert Bell           [badge with count, click = alert panel slide-in]
├── ⚙️ Quick Actions        [+ Dispatch | + Exception | Escalate]
└── 👤 User Menu            [Name, Role, Region | Profile | Logout]
```

**Global filter behaviour:**
- Filters apply to ALL screens simultaneously
- Filter state persists across navigation (session storage)
- "Reset Filters" button appears when non-default filters are active
- Each module can add additional local filters (in its own filter bar) without affecting global state

---

### 6.3 Left Navigation — Interaction Model

```
DEFAULT STATE (expanded, 220px)
├── Group label (uppercase, non-clickable)
├── Nav item: icon + label + badge
│   └── Hover: highlight bg, tooltip if label truncated
│   └── Active: left border accent (blue), bold label
│   └── Badge: count pill (red=critical, amber=high)
└── Active module: sub-items visible below (L2 links)

COLLAPSED STATE (56px, icon only)
├── Icon only visible
├── Hover: tooltip with label
└── Click: navigate to module default L2

MOBILE STATE (<768px)
└── Left nav becomes a slide-over drawer triggered by hamburger
```

---

### 6.4 Content Area — Layout Variants

#### Variant A — KPI Dashboard Layout (Executive CT, Operations CT)

```
[KPI CARD ROW]     [KPI CARD]  [KPI CARD]  [KPI CARD]  [KPI CARD]
4 columns, equal width, each ~240px, height 96px

[CHART ROW]        [Chart 1 — 60% width]    [Chart 2 — 40% width]

[TABLE SECTION]    Full width, paginated
```

#### Variant B — List / Table Layout (Dispatch, Exception, Carrier, Route)

```
[FILTER BAR]       [Search] [Filter 1 ▼] [Filter 2 ▼] ... [Reset] [Export]

[SUMMARY STRIP]    5 small counts (optional: total, by-status counts)

[TABLE]            Full width
                   ├── Sticky header
                   ├── Sortable columns
                   ├── Row-level status color
                   ├── Inline action buttons (last column)
                   └── Click row = open L3 drawer (right)

[PAGINATION]       [< Prev]  [1] [2] [3] ... [n]  [Next >]  [20/page ▼]
```

#### Variant C — Split Panel Layout (Operations CT live view)

```
[LEFT — 65%]                           [RIGHT — 35%]
Alert feed / Dispatch tracker          At-Risk summary
                                       Open exception queue
                                       Integration health
```

#### Variant D — Workspace Layout (Reconciliation Scan Session)

```
[HEADER STRIP]     Dispatch info | Expected: 42 HUs | Scanned: 31 | Progress bar

[SCANNER INPUT]    [Barcode Input ─────────────────────] [Scan]
                   Status: "HU0012345 — ACCEPTED ✓"   / "HU0099999 — NOT IN MANIFEST ✗"

[LIVE COUNTERS]    ✓ Accepted: 31    ✗ Rejected: 2    ⚠ Duplicate: 1    ◌ Pending: 9

[HU LIST TABLE]    Barcode | Status | Scanned At | Flag
                   Color: green=accepted, red=rejected, grey=pending
```

#### Variant E — Simulation / Recommendation Layout (Load Planning)

```
[INPUT PANEL — 35%]                    [OUTPUT PANEL — 65%]
Load parameters                        Scenario A | Scenario B* | Scenario C
Route selector                         Comparison table
Carrier filter                         Recommended vehicle card
[Run Simulation]                       Recommended carrier card
                                       [Select & Create Dispatch]
```

---

### 6.5 L3 Drawer Specification

```
DRAWER PROPERTIES
├── Width:    620px (fixed on desktop; full-screen on mobile)
├── Position: Fixed right, slides in over content
├── Shadow:   Left-side shadow on main content
├── Overlay:  Semi-transparent overlay on main content (click to close)
└── Close:    × button top-right, Escape key

DRAWER INTERNAL LAYOUT
├── [Drawer Header]     Entity type badge, ID, status badge, close button
├── [Tab Strip]         Tabs for L3 sub-sections
├── [Content Area]      Scrollable
└── [Action Footer]     Primary actions (fixed at bottom of drawer)

DRAWER TAB STRIP (Dispatch Detail example)
Overview | HU Manifest | Exceptions | Documents | Tracking | Audit Trail
```

---

## 7. CONTROL TOWER WIDGET CATALOGUE

### 7.1 Widget Definitions

| Widget ID | Widget Name | Data Source (Step 7) | Used In | Size |
|---|---|---|---|---|
| W01 | OTD % Card | `ExecutiveDashboardService.getKPIs().otdPct` | Executive CT, Operations CT | S |
| W02 | OTA % Card | `ExecutiveDashboardService.getKPIs().otaPct` | Executive CT, Operations CT | S |
| W03 | SLA Compliance Card | `ExecutiveDashboardService.getKPIs().slaPct` | Executive CT | S |
| W04 | Open Exceptions Card | `ExecutiveDashboardService.getKPIs().openExceptions` | All dashboards | S |
| W05 | Fleet Utilization Card | `ExecutiveDashboardService.getKPIs().vehicleUtilPct` | Executive CT, Operations CT | S |
| W06 | Carrier Score Card | `ExecutiveDashboardService.getKPIs().avgCarrierScore` | Executive CT | S |
| W07 | Dispatch Status Funnel | `DispatchDashboardService.getStatusFunnel()` | Operations CT, Dispatch | M |
| W08 | At-Risk Dispatch Strip | `DispatchDashboardService.getAtRisk()` | Operations CT, CT Alerts | M |
| W09 | 7-Day OTA/OTD Sparkline | `ExecutiveDashboardService.getTimeSeries(7)` | Executive CT | M |
| W10 | Exception by Severity Donut | `ExceptionDashboardService.getSummary().bySeverity` | Exception Mgmt, Operations CT | M |
| W11 | Exception by Region Table | `ExceptionDashboardService.getOpenByRegion()` | Exception Mgmt, Ops CT | M |
| W12 | Integration Health Cards | `IntegrationMonitor.metrics()` | Operations CT, Admin | M |
| W13 | Active Alert Feed | `AlertService.getAll()` | Operations CT, CT Alerts | L |
| W14 | Route Performance Grade Table | `RoutePerformanceScorer.scoreAll()` | Route Performance, Executive CT | L |
| W15 | Carrier Ranking Table | `CarrierDashboardService.getRanking()` | Carrier Performance, Executive CT | L |
| W16 | Consolidation Opportunity Table | `ConsolidationEngine.findOpportunities()` | Load Planning | L |
| W17 | Reconciliation KPI Strip | `ReconciliationDashboardService.getSummary()` | Reconciliation Center | M |
| W18 | SLA Clock (per dispatch) | `SLAClock.check(dispatch)` | Dispatch Detail drawer | S |
| W19 | Scenario Comparison Panel | `ScenarioSimulator.simulate()` | Load Planning | XL |
| W20 | Fleet Snapshot Table | `CapacityEngine.fleetSnapshot()` | Load Planning / Capacity | L |

### 7.2 Widget Size Definitions

| Size | Grid Columns | Typical Dimensions |
|---|---|---|
| S (Small) | 1 of 4 | ~240 × 96px — KPI card |
| M (Medium) | 2 of 4 | ~500 × 280px — chart or compact table |
| L (Large) | 4 of 4 | Full width, variable height — data table |
| XL (Extra Large) | 4 of 4 | Full width, > 400px height — complex panel |

---

## 8. GLOBAL FILTER SPECIFICATION

### 8.1 Filter Definitions

| Filter | Type | Options | Default | Affects |
|---|---|---|---|---|
| Date Range | Date picker | Today / Last 7d / Last 30d / This Month / Custom | Last 7 days | All screens |
| Region | Single-select dropdown | All + seeded regions | All Regions | All screens |
| Route | Search-select (multi) | All active routes | All Routes | Dispatch, Route, Carrier |
| Carrier | Search-select (multi) | All active carriers | All Carriers | Dispatch, Carrier, Exception |

### 8.2 Local Filter (per screen) — Additional Fields

| Screen | Additional Local Filters |
|---|---|
| Dispatch Board | Status (multi), Vehicle, Search (free text ID/reg) |
| Exception Queue | Severity (multi), Category (multi), Assignee, Resolution State |
| Reconciliation History | Match Rate threshold (slider), Reconciliation Status |
| Route Performance | Grade (multi: A/B/C/D/F), Distance range |
| Carrier Performance | Carrier Type (FTL/LTL/3PL/Express) |
| CT Alerts | Alert Type, Severity, Acknowledged (yes/no) |

### 8.3 Filter Persistence Rules

```
Global filters  → Persist in sessionStorage (survive page navigate, clear on logout)
Local filters   → Persist per screen in sessionStorage
Filter presets  → User can save named filter combinations (stored in localStorage)
Shared filters  → Deep link encodes active filters in URL query params for sharing
```

---

## 9. PERSONA × SCREEN ACCESS MATRIX

```
                            SCH  RM   TM   WM   OE   ADM
                            ─────────────────────────────
Executive CT                 RW   R    R    —    R    R
Operations CT                R    RW   RW   R    RW   R
Dispatch Management          —    R    RW   R    RW   R
  → Create/Edit Dispatch      —    —    RW   —    RW   —
  → Bulk Import               —    —    RW   —    —    RW
Transport Execution          —    R    RW   —    RW   —
Exception Management         R    RW   R    R    RW   R
  → Assign Exception          —    RW   R    R    RW   —
  → Escalate Exception        —    RW   R    —    RW   —
  → Resolve Exception         —    RW   RW   RW   RW   —
Reconciliation Center        R    R    R    RW   RW   R
  → Create Scan Session       —    —    —    RW   RW   —
  → Complete Reconciliation   —    —    —    RW   RW   —
Route Performance            R    RW   R    —    R    R
Carrier Performance          R    RW   R    —    R    R
Load Planning                —    R    RW   —    R    R
  → Accept Consolidation      —    —    RW   —    R    —
CT Alerts                    R    RW   RW   R    RW   R
  → Acknowledge Alert         —    RW   RW   R    RW   —
Analytics                    RW   RW   R    R    R    R
Master Data                  —    —    —    —    —    RW
Administration               —    —    —    —    —    RW
  → User Management           —    —    —    —    —    RW
  → API Key Management        —    —    —    —    —    RW
  → Webhook Management        —    —    —    —    —    RW
  → Integration Monitor       —    R    R    —    R    RW

KEY:  R = Read only   RW = Read + Write / Action   — = No access
```

---

## 10. DATA BINDING MAP

### How each screen connects to Step 7 services

```
SCREEN                          PRIMARY SERVICE CALL                              CACHE TTL
──────────────────────────────────────────────────────────────────────────────────────────
Executive CT / Overview         DashboardMaster.hydrateExecutive()                30s
Executive CT / Network Health   RouteDashboardService.getPerformanceTable()       30s
Executive CT / Cost             CarrierDashboardService.getCostEfficiency()       30s
Executive CT / SLA              RouteDashboardService.getSLABreakdown()           30s

Operations CT / Live            DashboardMaster.hydrateExecutive()               30s
                                + DispatchDashboardService.getAtRisk()           30s
                                + AlertService.getAll()                           15s  ← shorter TTL
Operations CT / Tracker         DispatchDashboardService.getList({status:[…]})   15s
Operations CT / Exc Queue       ExceptionDashboardService.getList({assignee})     15s
Operations CT / Integration     IntegrationMonitor.metrics()                      60s

Dispatch Board                  DispatchDashboardService.getList(filters,p,ps)   30s
Dispatch Detail Drawer          DispatchDashboardService.getDetail(id)           15s
  → HU tab                      DrillDownService.fromDispatch(id)                15s
  → Audit tab                   DrillDownService.auditTrail(id)                  60s

Transport Exec / Live           DispatchDashboardService.getAtRisk()             15s
Transport Exec / Departures     DispatchDashboardService.getList({status:ready}) 15s
Transport Exec / Arrivals       DispatchDashboardService.getList({status:…})     15s

Exception Dashboard             ExceptionDashboardService.getSummary()           30s
Exception Queue                 ExceptionDashboardService.getList(filters,p,ps)  15s
Exception Detail Drawer         DAL.exceptions.getById(id) + enrichment          15s
Root Cause View                 ExceptionDashboardService.getRootCauseAnalysis() 60s

Reconciliation Dashboard        ReconciliationDashboardService.getSummary()      30s
Reconciliation Queue            ReconciliationDashboardService.getDispatchList() 15s
Recon Report Detail             DrillDownService.fromDispatch(id)                30s

Route Scorecard                 RouteDashboardService.getPerformanceTable()      60s
Route Detail                    DrillDownService.fromRoute(routeId)              60s
Route SLA                       RouteDashboardService.getSLABreakdown()          60s
Route Delays                    RouteDashboardService.getDelayAnalysis()         60s
Route Utilization               RouteDashboardService.getUtilizationBreakdown()  60s

Carrier Ranking                 CarrierDashboardService.getRanking()             60s
Carrier Detail                  KPIEngine.carrierKPIs(id) + CostEngine           60s
Carrier SLA                     CarrierDashboardService.getSLACompliance()       60s
Carrier Delay                   CarrierDashboardService.getDelayProfile()        60s
Carrier Cost                    CarrierDashboardService.getCostEfficiency()      60s

Load / Capacity                 CapacityEngine.fleetSnapshot()                   30s
Load / Consolidation            ConsolidationEngine.findOpportunities()          60s
Load / Simulation               ScenarioSimulator.simulate(load, routeId)        no cache
Load / Recommendations          VehicleRecommendationEngine.recommendType()      no cache

CT Alerts / Active              AlertService.getAll()                            15s  ← shortest TTL
CT Alerts / SLA Breaches        AlertService.getCriticalSLABreaches()            15s
CT Alerts / High Risk           AlertService.getHighRiskDispatches()             15s
CT Alerts / History             AlertService.getAll() → logged entries           60s

Analytics / Operations          DashboardMaster.hydrateExecutive()               5min
Analytics / Carrier             DashboardMaster.hydrateCarriers()                5min
Analytics / Route               DashboardMaster.hydrateRoutes()                  5min
Analytics / Reconciliation      DashboardMaster.hydrateReconciliation()          5min
Analytics / Export              ReconciliationKPIs.exportData() + others          no cache
```

---

## 11. STATE & ALERT OVERLAY MODEL

### 11.1 Global Alert Rail

```
POSITION: Fixed, bottom-right corner, above all content
TRIGGER:  AlertService.getAll() polled every 15 seconds
DISPLAY:
  ├── Collapsed state: Floating bell icon with count badge
  └── Expanded state: Slide-up panel, 360px wide, max 3 alerts visible

ALERT CARD ANATOMY
┌───────────────────────────────────────────────┐
│ 🚨 CRITICAL                         × dismiss │
│ Dispatch TCT-0019 — SLA Breach                │
│ Route DEL-MUM-01 · 3.2 hrs overdue           │
│ [View Dispatch]              [Escalate]        │
└───────────────────────────────────────────────┘

ALERT PRIORITY ORDER (top of list)
1. Critical SLA breaches (red)
2. Escalated exceptions — L3+ (red)
3. High-risk dispatches (amber)
4. Overdue reconciliations (amber)
5. Integration failures (grey)
```

### 11.2 Inline Status Color System

| State | Color | Usage |
|---|---|---|
| Healthy / On-time / Matched | `#16a34a` (Green-600) | OTA on-time, matched HU, SLA OK |
| At-risk / Approaching breach | `#d97706` (Amber-600) | SLA at-risk, underutilized vehicle, medium exception |
| Breached / Failed / Missing | `#dc2626` (Red-600) | SLA breached, missing HU, critical exception |
| Neutral / Planned / Pending | `#6b7280` (Gray-500) | Planned status, pending scan, no data |
| Informational / Processing | `#2563eb` (Blue-600) | In-transit, investigating exception, loading state |
| Closed / Archived | `#9ca3af` (Gray-400) | Closed dispatches, resolved exceptions |

### 11.3 Empty State Definitions

| Scenario | Message | CTA |
|---|---|---|
| No dispatches match filter | "No dispatches found for current filters." | Reset Filters |
| No open exceptions | "All exceptions resolved. Network healthy." | View Resolved |
| No consolidation opportunities | "No consolidation candidates for today's schedule." | View Load Plan |
| No alerts active | "No active alerts. All systems nominal." | View Alert History |
| Reconciliation queue empty | "No dispatches pending reconciliation." | View History |
| No route data | "This route has no dispatch history yet." | Go to Dispatch |

### 11.4 Loading State Specification

```
Page load (first visit to module):  Full-page skeleton loader (grey pulse blocks matching layout)
Data refresh (cached TTL expired):   Subtle header spinner; table data stays visible until new data arrives
Drill-down (opening L3 drawer):      Drawer slides in with skeleton content; real data replaces in <500ms
Simulation run (ScenarioSimulator):  Full panel spinner with "Calculating scenarios…" label
```

---

## APPENDIX A — URL ROUTING MAP

```
/                           → redirect to /executive
/executive                  → /executive/overview
/executive/overview
/executive/network-health
/executive/cost-performance
/executive/sla-compliance
/operations
/operations/live
/operations/dispatch-tracker
/operations/dispatch-tracker/:id
/operations/exception-queue
/operations/integration-status
/dispatch
/dispatch/board
/dispatch/board?status=&route=&carrier=&search=
/dispatch/new
/dispatch/bulk-import
/dispatch/:id               → drawer over /dispatch/board
/transport
/transport/live
/transport/departures
/transport/arrivals
/transport/tracking
/exceptions
/exceptions/dashboard
/exceptions/queue
/exceptions/queue?severity=&category=&assignee=
/exceptions/:id             → drawer over /exceptions/queue
/exceptions/root-cause
/exceptions/sla-impact
/reconciliation
/reconciliation/dashboard
/reconciliation/queue
/reconciliation/scan/:dispatchId
/reconciliation/history
/reconciliation/report/:dispatchId
/reconciliation/exceptions
/routes
/routes/scorecard
/routes/:routeId            → drawer over /routes/scorecard
/routes/sla-analysis
/routes/delay-analysis
/routes/utilization
/carriers
/carriers/ranking
/carriers/:carrierId        → drawer over /carriers/ranking
/carriers/sla-compliance
/carriers/delay-profile
/carriers/cost-efficiency
/load-planning
/load-planning/capacity
/load-planning/consolidation
/load-planning/scenarios
/load-planning/recommendations
/alerts
/alerts/active
/alerts/sla-breaches
/alerts/high-risk
/alerts/history
/analytics
/analytics/operations
/analytics/carrier
/analytics/route
/analytics/reconciliation
/analytics/export
/master-data
/master-data/locations
/master-data/routes
/master-data/carriers
/master-data/vehicles
/master-data/exception-codes
/master-data/sla-config
/admin
/admin/users
/admin/api-keys
/admin/webhooks
/admin/integration-monitor
/admin/notifications
/admin/system
```

---

## APPENDIX B — PHASE 2 HANDOFF CHECKLIST

The following must be resolved in **UI Phase 2 (Component Library)** before screen build begins:

- [ ] Design token set (colors, spacing, typography, border-radius)
- [ ] KPI Card component (value, label, trend badge, click handler)
- [ ] Data Table component (sortable, paginated, row color, inline actions)
- [ ] Filter Bar component (global + local filter composition)
- [ ] L3 Drawer component (header, tab strip, action footer)
- [ ] Alert Card component (severity icon, message, action buttons)
- [ ] Status Badge component (8 dispatch statuses + color map)
- [ ] SLA Clock widget (countdown, at-risk, breached states)
- [ ] Scan Session workspace (barcode input, live counters, HU list)
- [ ] Scenario Comparison panel (3-column layout, metric rows, selection)
- [ ] Empty state component (icon, message, CTA — per scenario)
- [ ] Skeleton loader component (layout-aware pulse animation)
- [ ] Breadcrumb component (with drilldown context)
- [ ] Global alert rail (collapsed/expanded states)

---

*Document ends.*

---

**UI PHASE 1 COMPLETE**
