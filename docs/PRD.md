# Product Requirements Document
## Transport Control Tower (TCT)

**Version:** 1.0  
**Status:** Active Development  
**Last Updated:** 2026-06-19  
**Owner:** Shashank Zode, Transport Transformation Leader

---

## 1. Executive Summary

The Transport Control Tower (TCT) is an internal operations intelligence platform for managing end-to-end freight and logistics operations across India. It provides real-time visibility, exception management, and performance analytics for transport operations spanning four geographic regions — North, South, East, and West.

The platform consolidates data from dispatch planning through final delivery reconciliation into a single unified interface, enabling control tower operators, regional managers, and transport heads to monitor, act on, and analyse every shipment in the network.

---

## 2. Problem Statement

Prior to TCT, transport operations were managed across disconnected tools — spreadsheets for planning, separate systems for tracking, and manual email chains for exceptions. This created:

- No single source of truth for active dispatch status
- Delayed exception detection (hours, not minutes)
- Manual SLA breach identification after the fact
- No region-level or date-range drill-down capability
- Carrier and route performance only visible via end-of-month reports
- Reconciliation done manually, prone to discrepancies

---

## 3. Goals and Non-Goals

### Goals
- Provide real-time visibility into all active dispatches across all regions
- Surface SLA breaches and exceptions before they escalate
- Automate escalation routing based on delay thresholds
- Give a single global filter (region + date range) that updates all modules simultaneously
- Enable hub and destination operations teams to manage vehicle arrivals and unloading
- Produce a performance scorecard for every carrier and route
- Support full dispatch lifecycle tracking from planning to reconciliation

### Non-Goals (v1.0)
- Real backend API integration (current: mock data)
- Mobile-native application
- Customer-facing shipment tracking portal
- EDI / TMS direct integration
- Financial settlement processing

---

## 4. User Personas

### 4.1 Control Tower Operator
**Role:** Day-to-day monitor  
**Needs:** Live view of all dispatches, instant alert triage, exception assignment  
**Primary modules:** Executive CT, Operations CT, CT Alerts, Exception Management

### 4.2 Regional Manager
**Role:** Oversees a geographic zone (North / South / East / West)  
**Needs:** Region-filtered KPIs, SLA trend, carrier performance within region  
**Primary modules:** Executive CT (filtered), Route Performance, Carrier Performance

### 4.3 Hub Operations Executive
**Role:** Manages inbound/outbound vehicle flow at a hub  
**Needs:** Gate-in queue, loading bay status, turnaround time tracking  
**Primary modules:** Hub Operations, Dispatch Lifecycle

### 4.4 Destination Operations Executive
**Role:** Manages unloading and handover at delivery points  
**Needs:** Expected arrivals, dock assignment, unloading status, variance  
**Primary modules:** Destination Operations

### 4.5 Dispatch Planner
**Role:** Creates and assigns load plans  
**Needs:** Pending load queue, available vehicle matching, plan creation  
**Primary modules:** Load Planning, Dispatch Management

### 4.6 Transport Head
**Role:** Senior operations leader  
**Needs:** KPI dashboards, route and carrier scorecards, exception trends  
**Primary modules:** Analytics, Route Performance, Carrier Performance, Executive CT

### 4.7 Admin / Master Data Manager
**Role:** Maintains configuration data  
**Needs:** Route master, carrier master, fleet master, SLA matrix management  
**Primary modules:** Master Data, Administration

---

## 5. Feature Requirements

### 5.1 Global Filter Bar
- Region selector: All Regions | North | South | East | West
- Date range presets: Today | Yesterday | Last 7 Days | Last 30 Days | This Month | Custom
- Filter state persists across navigation within a session
- All modules, KPI cards, charts, and tables must respond to filter changes without page reload
- Single source of truth via `FilterContext` (React Context + useReducer)
- Active filter indicator when non-default selections are applied
- Reset to defaults button

### 5.2 Executive Control Tower (`/executive`)
- Network-level KPI strip: Total Dispatches, In Transit, On-Time Delivery %, Active Exceptions, Cost per Dispatch
- Live Network View: geographic node map by region with dispatch counts
- Dispatch Funnel: planned → ready → dispatched → transit → arrived → unloading → reconciled
- Route Performance widget: sortable table of top routes with grade badges
- Carrier Performance widget: tier ranking (Top Performer / Good / Monitor / At Risk)
- SLA Heatmap: route × carrier breach rate matrix
- Exception Command Center: live exception list with trend chart
- Alert Center: unread alert count, critical badge, acknowledge workflow
- All widgets respond to region and date range filters

### 5.3 Operations Control Tower (`/operations`)
- Fleet status overview: active vehicles, in-transit, delayed, SLA at-risk
- SLA Watch table: shipments with planned arrival and breach risk
- Hub Activity feed: scheduled arrivals and departures by hub
- KPI strip derived from filtered fleet, SLA, and hub data

### 5.4 Dispatch Management (`/dispatch`)
- Tabbed status board: All | Planned | Ready | Dispatched | In Transit | Arrived | Unloading | Reconciled | Closed
- KPI bar: In Transit, SLA At Risk, SLA Breached, Open Exceptions
- Per-dispatch detail drawer: documents (LR, E-waybill, Invoice, Gate Pass, Seal), HU breakdown, timeline
- Chain of custody view per dispatch
- New Dispatch modal
- CSV export of filtered list
- All counts reflect global region + date filter

### 5.5 Transport Execution (`/transport`)
- Live transport monitor: map-based vehicle position view
- Real-time status updates

### 5.6 Load Planning (`/load-planning`)
- Pending loads queue with priority sorting (Critical → High → Normal)
- Available vehicles list with availability filter
- Load Plans tab: draft, confirmed, dispatched, cancelled plans
- KPI strip: Available Vehicles, Pending Loads, Critical Loads, Avg Utilization, In Maintenance, Plans Today
- Capacity by type bar chart
- New Load Plan modal
- All data filtered by global region and planned departure date

### 5.7 Hub Operations (`/hub-ops`)
- Per-hub vehicle queue management
- Gate-in, loading, loaded, gate-out workflow
- KPIs: Waiting, Gate-In, Loading, Loaded, Delayed, Gate-Out Pending
- Vehicle detail drawer with dwell time, turnaround, loading time metrics
- Delay indicator with configurable threshold

### 5.8 Destination Operations (`/dest-ops`)
- Expected arrivals, dock-in, unloading, POD capture workflow
- Dock assignment per vehicle
- HU variance tracking (expected vs received)
- Overdue indicator for vehicles past expected arrival
- Status tabs: All | Approaching | Arrived | Unloading | Completed

### 5.9 Dispatch Lifecycle (`/lifecycle`)
- Kanban-style stage board: planned → gate-in → loaded → dispatched → in-transit → arrived → unloading → completed
- Timeline drill-down per dispatch
- Phase grouping: Pre-Dispatch | In-Transit | At Destination
- SLA status badge per dispatch
- Filterable by phase, SLA status, search

### 5.10 Exception Management (`/exceptions`)
- Exception board with severity tabs: All | Critical | High | Medium
- Workflow states: OPEN → ASSIGNED → IN_PROGRESS → ESCALATED / PENDING_INFO → RESOLVED → CLOSED
- Raise exception modal
- Exception detail drawer: root cause, assignee, resolution notes, SLA breach time
- Auto-escalation based on age and severity
- Trend chart: exceptions raised vs resolved over time

### 5.11 Reconciliation Center (`/reconciliation`)
- Reconciliation queue with status: Pending → In Progress → Completed → Disputed
- HU-level variance (expected vs received weight/count)
- Resolution workflow
- Financial summary: freight cost, shortages, overages
- Trend chart: reconciliation cycle time

### 5.12 Route Performance (`/routes`)
- Route scorecard with grade A–F
- KPIs per route: OTA%, OTD%, Avg Delay, Cost/km, Exception Count, Dispatch Count
- Grade filter tabs
- Sparkline trend per route
- Bar chart and donut charts for grade distribution

### 5.13 Carrier Performance (`/carriers`)
- Carrier ranking with tier: Top Performer | Good | Monitor | At Risk
- KPIs per carrier: OTA%, OTD%, Open Exceptions, Composite Score, Cost/km
- Status tabs: All | Active | Watch List
- Sparkline trend, performance charts
- Carrier detail drawer

### 5.14 CT Alerts (`/alerts`)
- Alert types: SLA_BREACH | HIGH_RISK | ESCALATED_EXCEPTION | OVERDUE_RECONCILIATION | INTEGRATION_FAILURE
- Severity: Critical | High | Medium
- Acknowledge workflow with action types and remarks
- Escalation levels driven by delay: 2h+ → Regional Manager, 4h+ → Transport Head, 8h+ → Control Tower
- Global alert rail (slide-over panel) available from any screen
- Alert badges on nav sidebar per module

### 5.15 Analytics (`/analytics`)
- Six analytics tabs: Executive | Operations | Carriers | Routes | Exceptions | Reconciliation
- Regional filter and date range selector synced with global filter
- Pre-aggregated KPI summaries and trend charts per domain

### 5.16 Master Data (`/master-data`)
- Route Master: route codes, origin, destination, distance, SLA hours
- Fleet Master: vehicle registry, type, carrier assignment
- Carrier Master: carrier profiles, contracts, performance baseline
- Hub Master: hub codes, locations, capacity
- Customer Master: customer profiles, delivery SLA
- SLA Matrix: SLA rules by route / carrier / load type

### 5.17 Administration (`/admin`)
- User management
- Role and permission configuration
- System settings

---

## 6. Permissions Model

Each navigation item carries a `permission` key. Planned permission groups:

| Permission Key        | Scope                                      |
|-----------------------|--------------------------------------------|
| `executive.view`      | Executive CT, KPIs, network view           |
| `operations.view`     | Operations CT, fleet, SLA watch            |
| `dispatch.view`       | Dispatch, hub-ops, dest-ops, lifecycle     |
| `transport.view`      | Transport execution / live monitor         |
| `planning.view`       | Load planning workbench                    |
| `exceptions.view`     | Exception management                       |
| `reconciliation.view` | Reconciliation center                      |
| `routes.view`         | Route performance                          |
| `carriers.view`       | Carrier performance                        |
| `alerts.view`         | CT Alerts center                           |
| `analytics.view`      | Analytics dashboard                        |
| `admin.view`          | Master data, administration                |

---

## 7. SLA & Escalation Rules

| Delay Threshold | Escalation Target  |
|-----------------|-------------------|
| ≥ 2 hours       | Regional Manager   |
| ≥ 4 hours       | Transport Head     |
| ≥ 8 hours       | Control Tower      |

KPI health thresholds:

| KPI              | Healthy | Warning |
|------------------|---------|---------|
| OTD %            | ≥ 90%   | 75–89%  |
| OTA %            | ≥ 90%   | 75–89%  |
| SLA Compliance % | ≥ 90%   | 75–89%  |
| Open Exceptions  | 0       | ≤ 5     |
| Vehicle Util %   | ≥ 70%   | 50–69%  |
| Cost/Dispatch    | ≤ ₹3000 | ≤ ₹5000 |

---

## 8. Out-of-Scope for v1.0

- Real-time GPS vehicle tracking integration
- Carrier API / EDI feeds
- Automated financial reconciliation with ERP
- Multi-tenancy
- Offline / PWA support
- Email / SMS alert notifications
- Mobile application
