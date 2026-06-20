# Product Requirements Document (PRD)
## Transport Control Tower (TCT)

**Version:** 2.0 — Full Module Audit
**Last Updated:** 2026-06-19
**Owner:** Shashank Zode, Transport Transformation Leader

---

## 1. Executive Summary

The Transport Control Tower (TCT) is a real-time operational intelligence platform for managing outbound road freight across India. It provides end-to-end visibility across the full dispatch lifecycle — from load planning at the origin hub through transit monitoring to final delivery and financial reconciliation.

TCT consolidates data from dispatch, fleet, exceptions, alerts, route performance, carrier management, and reconciliation into a single interface with a unified global filter for region and date range.

---

## 2. Problem Statement

| Problem | Impact |
|---|---|
| No single view of dispatch lifecycle | CT operators check multiple systems per shipment |
| SLA breaches detected reactively | Penalties and customer notifications arrive late |
| Exception resolution by phone/email | Root cause untracked; recurring issues repeat |
| No objective carrier performance score | Underperforming carriers remain on high-value routes |
| Reconciliation manual and delayed | Financial variance untracked for days after delivery |
| No region-level filter across data | Managers see all-India noise instead of their region |

---

## 3. Goals

### Must-Have (v1.0)
- Real-time KPI dashboard for Executive and Operations CT users
- End-to-end 14-stage dispatch lifecycle tracker
- Fleet live board with vehicle-level detail
- Exception management: assign, escalate, resolve
- SLA monitoring with at-risk and breached status
- Alert center with acknowledgement and action recording
- Route and carrier performance scorecards
- Hub operations (origin) and destination operations tracking
- Post-delivery reconciliation with HU discrepancy recording
- Global region + date range filter applied across all modules

### Non-Goals (v1.0)
- Backend API (all data is in-memory mock)
- Authentication or RBAC
- Mobile app
- GPS live map
- ERP / financial integration

---

## 4. User Personas

### 4.1 Control Tower Operator
- **Modules:** Executive CT, Operations CT, Alerts, Exceptions
- **Goal:** Identify and respond to SLA risks and exceptions in real time

### 4.2 Regional Transport Manager
- **Modules:** Executive CT (region-filtered), Route Performance, Carrier Performance
- **Goal:** Meet OTD targets for their region

### 4.3 Hub Operations Executive
- **Modules:** Hub Operations, Dispatch Workbench
- **Goal:** Minimise dwell time and ensure on-time gate-out

### 4.4 Destination Operations Executive
- **Modules:** Destination Operations
- **Goal:** Complete unloading within planned time; flag HU variances immediately

### 4.5 Dispatch Planner
- **Modules:** Load Planning, Dispatch Workbench, Dispatch Lifecycle
- **Goal:** Match vehicles to loads; ensure documents are complete before departure

### 4.6 Finance / Reconciliation Analyst
- **Modules:** Reconciliation Center
- **Goal:** Close reconciliation within 48 hours of delivery; approve freight payment

### 4.7 Transport Head
- **Modules:** Executive CT, Route Performance, Carrier Performance, Analytics
- **Goal:** Network OTD ≥ 90%; manage carrier tiers; reduce exception rate

---

## 5. Feature Requirements by Module

### FR-01: Executive Control Tower (`/executive`)

**Purpose:** Real-time network-wide operational snapshot for leadership and CT operators.

**KPI Strip (8 KPIs):**

| Label | Baseline Value | Unit | Status Logic |
|---|---|---|---|
| Active Dispatches | 248 | count | healthy if progressing |
| On-Time Delivery | 87 | % | healthy ≥ 90, warning 75–89, danger < 75 |
| SLA Breaches | 14 | count | danger if > 0 |
| Open Exceptions | 37 | count | warning if > 0 |
| Vehicle Utilisation | 79 | % | healthy ≥ 70, warning 50–69 |
| Avg Delay | 2.4 | hrs | warning if > 1h |
| Cost vs Budget | 96 | % | healthy if ≤ 100% |
| Pending Reconciliation | 31 | count | info |

**KPI Scaling Rules:**
- Date range scale factor = `days / 7` (7-day window = 1.0 baseline)
- Count metrics (Active Dispatches, SLA Breaches, Open Exceptions, Pending Reconciliation) multiplied by scale factor
- Percentage metrics (OTD, Utilisation, Cost) not scaled — taken from region data
- Region filter replaces network values with per-region values from `REGION_SUMMARY`

**Widgets:**
1. **Dispatch Funnel** — 7-stage funnel from Planned (312) → Ready (284) → Dispatched (248) → In Transit (201) → Arrived (178) → Unloading (142) → Reconciled (98), with 7-day daily trend bar chart
2. **Live Network View** — 10 hubs/depots (Delhi, Mumbai, Bangalore, Hyderabad, Chennai, Kolkata, Pune, Ahmedabad, Lucknow, Jaipur) displayed by region with vehicle counts, pending arrivals, exception counts, utilisation %
3. **Exception Command Center** — 6 live exceptions with category donut (Delay 38%, Document 24%, Breakdown 16%, Route Dev 14%, Customer Refusal 8%), 7-day trend chart, exception table with status / assignee / SLA countdown
4. **Route Performance** — Table of 10 routes with grade, OTD%, avg delay, dispatch count, exceptions, cost/km, 7-day sparkline, trend direction
5. **Carrier Performance** — Table of 8 carriers with OTD%, OTA%, open exceptions, composite score, tier badge (Top Performer / Good / Monitor / At Risk), 7-day sparkline
6. **SLA Heatmap** — Route × carrier matrix (8 routes × 5 carriers = 40 cells) coloured by breach rate %; worst cell highlighted; 7-day SLA trend line
7. **Alert Center** — Last 7 alerts for this CT with type badge, severity, dispatch/route link, time-ago, acknowledge button

**Business Rules:**
- KPI values update when region or date range changes
- `dateScale = Math.round((days/7) * 100) / 100` — rounded to 2 decimal places
- Region KPIs derived from `REGION_SUMMARY.find(rs => rs.region.toLowerCase() === region)`
- Avg delay shown as '1.8' / '2.4' / '3.2' based on regional OTD threshold bands

---

### FR-02: Operations Control Tower (`/operations`)

**Purpose:** Operational fleet visibility with live vehicle tracking, SLA watch list, and hub activity.

**KPI Strip (6 KPIs):**

| Label | Description | Status Logic |
|---|---|---|
| Active Vehicles | Vehicles not yet arrived | healthy |
| In Transit | Status = `in-transit` | info |
| Delayed | Status = `delayed` | danger if > 3, warning otherwise |
| SLA At-Risk | Filtered SLA_WATCH record count | warning if > 2 |
| Hub Arrivals Today | HUB_EVENTS arrivals count | healthy |
| Fleet Utilisation | active / total × 100 | healthy |

**Fleet Board:**
- Vehicle cards showing: registration, driver name, carrier, route, origin → destination, current location, progress bar (%), speed (km/h), fuel %, delay (+Xm badge), alert pills
- Status types: `in-transit` (blue pulse), `halted` (amber), `delayed` (red), `arrived` (green), `idle` (grey)
- Fleet tabs: All / In Transit / Delayed / Halted / Arrived — badge counts reflect filtered vehicles
- Click vehicle → 320px detail panel with all metrics and active alerts

**SLA Watch List Columns:** Dispatch ID, Route Code, Origin → Destination, Carrier, Vehicle Reg, Status (BREACHED / AT RISK), SLA time (hours overdue or remaining)

**Hub Activity Feed:**
- Events show: hub name, vehicle reg, carrier, event type (ARR / DEP), status badge (on-time / early / delayed / pending)
- Filter toggle: All / Arrival / Departure
- Scheduled time shown for pending; time-ago shown for completed

**Region Filter (custom helpers):**
- `vehicleRegion(v)` → maps `v.origin` city to region using `CITY_REGION` map
- `slaRegion(r.origin)` → maps origin city to region
- `hubRegion(e.hub)` → strips " Hub" suffix and maps city to region
- Cities covered: Mumbai/Pune/Ahmedabad/Surat/Goa → west; Delhi/Agra/Jaipur/Jodhpur/Lucknow/Indore/Bhopal → north; Bangalore/Chennai/Hyderabad/Vizag → south; Kolkata/Patna/Bhubaneswar → east

---

### FR-03: Dispatch Lifecycle Tracker (`/lifecycle`)

**Purpose:** End-to-end 14-stage timestamp visibility for every active dispatch.

**14 Stages and Phases:**

| Stage | Phase | Colour |
|---|---|---|
| Planned | Origin | Blue |
| Ready | Origin | Blue |
| Gate In Origin | Origin | Blue |
| Loading | Origin | Blue |
| Gate Out Origin | Origin | Blue |
| Dispatched | Transit | Amber |
| In Transit | Transit | Amber |
| Arrived Dest. | Transit | Amber |
| Gate In Dest. | Destination | Violet |
| Dock Assigned | Destination | Violet |
| Unloading | Destination | Violet |
| Received | Destination | Violet |
| Reconciled | Closure | Green |
| Closed | Closure | Green |

**Views:** Table (8 columns) and Kanban (14 columns, one per stage)

**KPI Strip (clickable — sets phase filter):**
- Total Active, Origin Phase, In Transit, Dest. Phase, Closed Today, At Risk, SLA Breached

**Filters:** Phase (All / Origin / Transit / Destination / Complete), SLA Status, free text search (dispatch ID, vehicle, route code, carrier, origin, destination)

**Timeline Detail Panel:**
- Route info (routeCode, origin, destination, plannedHUs)
- Lifecycle progress bar (stage index / 13 × 100%)
- 14-stage timestamp log (done = green tick, active = blue NOW badge, future = grey)
- Lifecycle Metrics: Transit Time (gateOutOrigin → arrivedDest, warn > 900m), Total Cycle Time (planned → closed, warn > 2880m)
- Planned vs Actual comparison for Dispatch and Arrival milestones with variance in minutes
- Remarks block (amber background)

**SLA Colours:** on_time = green, at_risk = amber, breached = red (row and progress bar)

---

### FR-04: Origin Operations / Hub Operations (`/hub-ops`)

**Purpose:** Manage vehicle flow at origin hubs from arrival through gate-out.

**Vehicle Statuses (in order):**
`arrived` → `gate_in` → `loading` → `loaded` → `gate_out` → `dispatched`

**Vehicle Card Fields:** vehicleNumber, vehicleType (FTL/LTL/LCV/Trailer/Reefer), carrier, driverName, driverMobile, routeCode, origin, destination, plannedHUs, loadedHUs, weightKg, status, priority (normal/urgent/delayed), arrival/gate-in/loading/gate-out timestamps, plannedDeparture, remarks

**Computed Metrics:**
- `hubDwellMins` = gateOutAt − gateInAt
- `loadingTimeMins` = loadingCompleteAt − loadingStartAt
- `turnaroundMins` = dispatchedAt − arrivedAt
- `isDelayed()` = plannedDeparture < now AND status not in [gate_out, dispatched]

**Loading Progress:** `loadedHUs / plannedHUs × 100%` shown as bar

**Hubs:** Delhi (north), Mumbai (west), Bangalore (south), Kolkata (east), Hyderabad (south), Chennai (south)

**Business Rules:**
- Urgent priority vehicles highlighted for expedited processing
- Delayed priority vehicles show red accent and remarks
- Reefer vehicles require cold chain temp confirmation before gate-out

---

### FR-05: Destination Operations (`/dest-ops`)

**Purpose:** Manage inbound vehicle arrivals, docking, unloading, and receipt confirmation at destination.

**Vehicle Statuses (in order):**
`in_transit` → `arrived` → `gate_in` → `dock_assigned` → `unloading` → `unloaded` → `receipt_confirmed` → `reconciled` → `closed`

**Vehicle Detail Fields:** vehicleNumber, vehicleType, carrier, driverName, driverMobile, routeCode, origin, destination, dockNumber, plannedHUs, receivedHUs, damagedHUs, shortHUs, weightKg, priority (normal/urgent/sla_breach), all 9 status timestamps, plannedArrival, exceptionCount, remarks

**Computed Metrics:**
- `transitTimeMins` = arrivedAt − departedOriginAt
- `dockDwellMins` = unloadingCompleteAt − dockAssignedAt
- `unloadingTimeMins` = unloadingCompleteAt − unloadingStartAt
- `totalCycleMins` = closedAt − arrivedAt
- `huVariance` = receivedHUs − plannedHUs (negative = shortage, positive = overage)
- `isOverdue()` = plannedArrival < now AND status not in [reconciled, closed]

**Dock Numbers:** D-01 through D-10

**Business Rules:**
- Priority `sla_breach` vehicles shown with red accent
- Reefer vehicles require cold chain acknowledgement
- Short HUs trigger exception count increment and reconciliation flag
- Overdue flag triggers visual alert on vehicle card

---

### FR-06: Exception Management (`/exceptions`)

**Purpose:** Centralised exception lifecycle from detection through resolution with financial impact tracking.

**Exception Categories (from Raise modal):**
SLA Breach, Delivery Delay, Vehicle Breakdown, Document Issue, Customer Complaint, Damage in Transit, Short Shipment, Address Change, Other

**Exception Data Categories (from mock data):**
SLA Breach, HU Missing, Vehicle Breakdown, HU Damaged, Route Deviation, Gate Hold, Weight Mismatch, Delayed Dispatch, Temp Deviation (Cold Chain Breach), Doc Missing

**Status Flow:** OPEN → ASSIGNED → IN_PROGRESS → ESCALATED / PENDING_INFO → RESOLVED → CLOSED / AUTO_RESOLVED

**Tab Grouping Logic:**
- "Open" tab = OPEN + ASSIGNED + PENDING_INFO
- "In Progress" tab = IN_PROGRESS
- "Escalated" tab = ESCALATED
- "Resolved" tab = RESOLVED + CLOSED + AUTO_RESOLVED

**Detail Panel Sections:** Dispatch Info, SLA Clock, Assignment (assignee, team, escalation level), Financial Impact (INR), Root Cause, Resolution Note + time, Tags, Activity comment thread

**Comment Types:** note (blue), escalation (orange), resolution (green), system (grey)

**KPI Cards:**
- Total Open, Critical, SLA Breached, Escalated, Resolved Today, Avg Resolution (hours)
- Status: danger if Critical > 0 or SLA Breached > 0; warning if Escalated > 0

**Analytics Panel (toggleable):**
- Category donut (6 categories with counts)
- 7-day trend line (Opened / Resolved / Escalated)
- Financial Impact bar chart by category (₹ amounts)

**Region Filter:** `matchesCity(ex.origin)` using `cityRegion()` function
**Date Filter:** `matchesDate(ex.raisedAt)`

---

### FR-07: Reconciliation Center (`/reconciliation`)

**Purpose:** Post-delivery HU count reconciliation, discrepancy management, and freight payment approval.

**Reconciliation Statuses:**
- `pending` — dispatched, not yet arrived
- `in_progress` — arrived, scanning in progress
- `discrepancy` — variances found, pending sign-off
- `approved` — finance approved
- `closed` — fully reconciled

**HU Discrepancy Types:** missing / damaged / extra / wrong_item / weight_variance

**Discrepancy Status:** open / accepted / disputed / waived

**Record Fields:** dispatchId, routeCode, routeName, carrier, origin, destination, arrivedAt, reconStatus, huLoaded, huArrived, huDamaged, huMissing, huExtra, weightLoaded (kg), weightArrived (kg), freightCost (INR), discrepancies (array), reconBy, approvedBy, approvedAt, signedOffAt, notes

**KPIs:** Pending count, In Progress count, Discrepancy count, Closed count, Total HU Missing, Total HU Damaged, Financial Impact (sum of discrepancy.financialImpact)

**7-Day Trend:** arrived / reconciled / discrepancies per day

**Business Rules:**
- Weight variance ≤ 2 kg treated as within tolerance
- Missing HU triggers financial impact = estimated value of HU
- Damage impact estimated by field team
- `approved` requires approvedBy and approvedAt
- `closed` requires signedOffAt

---

### FR-08: CT Alerts Center (`/alerts`)

**Purpose:** Unified alert inbox with acknowledgement workflow and analytics.

**Alert Types:**

| Type | Label | Badge Style |
|---|---|---|
| SLA_BREACH | SLA Breach | red |
| HIGH_RISK | High Risk | orange |
| ESCALATED_EXCEPTION | Escalated Exception | purple |
| OVERDUE_RECONCILIATION | Overdue Reconciliation | amber |
| INTEGRATION_FAILURE | Integration Failure | slate |

**Alert Fields:** id, type, severity, message, dispatchId?, routeCode?, carrierName?, delayMins, firedAt, acknowledged, ackedAt?, ackedBy?, ackAction?, ackRemarks?

**Acknowledgement Actions:**

| Action Key | Label |
|---|---|
| carrier_escalated | Carrier Escalated |
| alternate_vehicle | Alternate Vehicle Arranged |
| route_changed | Route Changed |
| delivery_replanned | Delivery Replanned |
| driver_contacted | Driver Contacted |
| hub_escalated | Hub Escalated |
| customer_escalated | Customer Escalated |
| monitoring_only | Monitoring Only |

**Analytics Tabs:**
- Top Delay Routes — routeCode, total exceptions, avg delay mins, breach count, OTD rate, trend
- Top Delay Carriers — carrier, exceptions, avg delay, breach count, SLA score, trend
- Chronic Lanes — route × carrier combinations with breach count, avg delay, last breach, status (critical/watch/improving)
- Recovery Stats — avg recovery time (142m), P90 (310m), fastest (18m), slowest (720m); broken down by action type

**Closure SLA:** Alert closure target = 240 minutes; 74% closed within SLA (48 of 65)

**Global Alert Rail:** auto-opens on critical severity alert; sorted by severity → firedAt

---

### FR-09: Route Management (`/routes`)

**Purpose:** Route-level performance scorecard with grade assignment and trend tracking.

**Route Grade System:**

| Grade | Score Range | Colour |
|---|---|---|
| A | 85–100 | Green |
| B | 70–84 | Blue-green |
| C | 55–69 | Amber |
| D | 40–54 | Orange |
| F | 0–39 | Red |

**Route Fields:** routeCode, routeName, origin, destination, regionOrigin, regionDest, distanceKm, grade, gradeScore, otaPct, otdPct, slaCompliancePct, avgTransitHours, plannedTransitHours, delayMinutesAvg, costPerKm, freightRevenueM (₹M MTD), exceptionRate (per 100 dispatches), dispatchCount (MTD), 8-week dispatchTrend[], 8-week otdTrend[], topCarrier, topCarrierScore, lastException?, tags[]

**KPIs:** Total Routes (10), Avg OTD, Grade A count, Grade D/F count, Avg Exception Rate, Total Dispatches

**Charts:** Grade distribution donut; Region OTD bar (North 87%, West 88%, South 74%, East 66%)

**Region Filter:** `r.regionOrigin.toLowerCase() === region`

**Route Tags:** high-volume, ftl, short-haul, long-haul, high-frequency, south-corridor, west-corridor, north-corridor, east-corridor, cross-region, volatile, critical-watch, priority

---

### FR-10: Carrier Management (`/carriers`)

**Purpose:** Carrier performance scorecard with tier management and contract oversight.

**Carrier Tiers:**

| Tier | Typical Score | Status Options |
|---|---|---|
| Platinum | 88–100 | active |
| Gold | 75–87 | active |
| Silver | 65–74 | active / under_review |
| Bronze | 55–64 | active / under_review |
| Probation | < 55 | probation |

**Carrier Fields:** id, name, shortCode, tier, compositeScore, otdPct, slaCompliancePct, exceptionRatePer100, damageRatePct, responseTimeMins, freightCostIndex (100 = baseline), activeRoutes, monthlyDispatches, fleetsSize, hqCity, contactName, contactPhone, contractExpiry, lastAuditScore, lastAuditDate, status, 6-month scoreTrend[], 6-month otdTrend[], incidentCount (MTD), remarks?

**KPIs:** Total (10), Avg Composite Score, Platinum count, Probation count, Under Review count, Avg OTD

**Scoring Dimensions:** OTD%, SLA Compliance%, Exception Rate per 100, Damage Rate%, Avg Response Time (mins)

**Business Rules:**
- Probation status = composite score < 55 OR critical incident
- Under Review = compliance breach or contract expiry approaching
- Contract expiry triggers renewal workflow
- Audit score tracked separately from composite score

**Region Filter:** `matchesCity(c.hqCity)` using `cityRegion()` function

---

## 6. SLA and Escalation Rules

| Condition | SLA Status | Alert Severity | Escalation Level | Notified |
|---|---|---|---|---|
| ETA within commitment | ok | — | 0 | — |
| ≤ 4h remaining | at-risk | high | 0 | CT Operator |
| SLA window expired | breached | critical | auto-exception | CT Operator |
| Overdue ≥ 2h | breached | critical | 1 | Regional Manager |
| Overdue ≥ 4h | breached | critical | 2 | Transport Head |
| Overdue ≥ 8h | breached | critical | 3 | Control Tower direct ownership |

---

## 7. KPI Health Thresholds

| Metric | Good | Warning | Danger |
|---|---|---|---|
| OTD / OTA / SLA Compliance | ≥ 90% | 75–89% | < 75% |
| Open Exceptions | 0 | 1–5 | > 5 |
| Vehicle Utilisation | ≥ 70% | 50–69% | < 50% |
| Avg Delay | ≤ 1h | 1–3h | > 3h |
| Carrier Composite Score | ≥ 80 | 65–79 | < 65 |
| Route Exception Rate (per 100) | ≤ 2 | 2–5 | > 5 |
| Cost vs Budget | ≤ 95% | 95–105% | > 105% |

---

## 8. Out of Scope (v1.0)

- Real-time GPS vehicle tracking map
- Backend API / database persistence
- User authentication and RBAC
- Email / SMS alert notifications
- Mobile driver or hub staff app
- ERP / GST / E-waybill API integration
- Automated freight invoice processing
- Report export to PDF
