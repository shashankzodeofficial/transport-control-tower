# Data Dictionary
## Transport Control Tower (TCT)

**Version:** 3.0 — Source-Verified Technical Blueprint
**Last Updated:** 2026-06-19
**Source:** Derived directly from TypeScript interfaces and mock data in `src/`

> All field names, types, and enumeration values are taken verbatim from the source code. No field is invented or assumed.

---

## Table of Contents

1. [Core Entities](#1-core-entities)
2. [Enumeration Types](#2-enumeration-types)
3. [Context / State Objects](#3-context--state-objects)
4. [Shared UI Types](#4-shared-ui-types)
5. [Analytics / Derived Objects](#5-analytics--derived-objects)
6. [Entity Relationship Map](#6-entity-relationship-map)
7. [Region Mapping Rules](#7-region-mapping-rules)
8. [Computed Field Definitions](#8-computed-field-definitions)

---

## 1. Core Entities

### 1.1 DispatchTimeline
**Source:** `src/pages/lifecycle/mock/data.ts` → `interface DispatchTimeline`
**Module:** Dispatch Lifecycle (`/lifecycle`)
**Primary Key:** `id`

| Field | TypeScript Type | Nullable | Description |
|---|---|---|---|
| `id` | `string` | No | PK. Internal record ID (e.g. `LC-001`) |
| `dispatchId` | `string` | No | FK → business dispatch identifier (e.g. `DSP-2024-1401`) |
| `vehicleNumber` | `string` | No | Vehicle registration plate |
| `carrier` | `string` | No | Carrier company name |
| `routeCode` | `string` | No | FK → RouteDetail.routeCode (e.g. `MUM-DEL-07`) |
| `origin` | `string` | No | Full origin location string |
| `destination` | `string` | No | Full destination location string |
| `plannedHUs` | `number` | No | Planned handling unit count |
| `status` | `LifecycleStatus` | No | Current stage — see §2.1 |
| `slaStatus` | `'on_time' \| 'at_risk' \| 'breached'` | No | SLA health at current stage |
| `plannedAt` | `string` (ISO 8601) | Yes | Stage 1 timestamp |
| `readyAt` | `string` (ISO 8601) | Yes | Stage 2 timestamp |
| `gateInOriginAt` | `string` (ISO 8601) | Yes | Stage 3 timestamp |
| `loadingStartAt` | `string` (ISO 8601) | Yes | Stage 4 timestamp |
| `gateOutOriginAt` | `string` (ISO 8601) | Yes | Stage 5 timestamp |
| `dispatchedAt` | `string` (ISO 8601) | Yes | Stage 6 timestamp |
| `inTransitAt` | `string` (ISO 8601) | Yes | Stage 7 timestamp |
| `arrivedDestAt` | `string` (ISO 8601) | Yes | Stage 8 timestamp |
| `gateInDestAt` | `string` (ISO 8601) | Yes | Stage 9 timestamp |
| `dockAssignedAt` | `string` (ISO 8601) | Yes | Stage 10 timestamp |
| `unloadingStartAt` | `string` (ISO 8601) | Yes | Stage 11 timestamp |
| `receivedAt` | `string` (ISO 8601) | Yes | Stage 12 timestamp |
| `reconciledAt` | `string` (ISO 8601) | Yes | Stage 13 timestamp |
| `closedAt` | `string` (ISO 8601) | Yes | Stage 14 timestamp |
| `plannedDispatch` | `string` (ISO 8601) | No | Planned gate-out time (SLA start) |
| `plannedArrival` | `string` (ISO 8601) | No | Committed delivery time (SLA deadline) |
| `remarks` | `string` | Yes | Free-text operational notes |

**Relationships:**
- `routeCode` → references `RouteDetail.routeCode` (logical FK)
- `dispatchId` → shared key across `FullException.dispatchId`, `ReconciliationRecord.dispatchId`, `Alert.dispatchId`

**Seed data:** 16 records (`DISPATCH_LIFECYCLES`), one per `LifecycleStatus` stage.

---

### 1.2 Dispatch
**Source:** `src/types/index.ts` → `interface Dispatch`
**Module:** Dispatch Workbench (`/dispatch/board`)
**Primary Key:** `id`

| Field | TypeScript Type | Nullable | Description |
|---|---|---|---|
| `id` | `string` | No | PK |
| `status` | `DispatchStatus` | No | Current dispatch status — see §2.6 |
| `routeCode` | `string` | No | FK → RouteDetail.routeCode |
| `routeName` | `string` | No | Human-readable route name |
| `origin` | `string` | No | Origin location |
| `destination` | `string` | No | Destination location |
| `vehicleReg` | `string` | No | Vehicle registration |
| `carrier` | `string` | No | Carrier name |
| `plannedDeparture` | `string` (ISO 8601) | No | Planned gate-out |
| `plannedArrival` | `string` (ISO 8601) | No | Committed arrival |
| `actualDeparture` | `string` (ISO 8601) | Yes | Actual gate-out |
| `actualArrival` | `string` (ISO 8601) | Yes | Actual arrival |
| `huCount` | `number` | No | Handling unit count |
| `exceptionCount` | `number` | No | Count of active exceptions |
| `slaStatus` | `'ok' \| 'at-risk' \| 'breached'` | No | SLA health |
| `slaHoursRemaining` | `number` | Yes | Hours until breach (at-risk only) |
| `slaHoursOverdue` | `number` | Yes | Hours past SLA (breached only) |

---

### 1.3 FleetVehicle
**Source:** `src/pages/operations/mock/data.ts` → `interface FleetVehicle`
**Module:** Operations CT (`/operations`)
**Primary Key:** `id`

| Field | TypeScript Type | Nullable | Description |
|---|---|---|---|
| `id` | `string` | No | PK (e.g. `V-001`) |
| `dispatchId` | `string` | No | FK → Dispatch.id / DispatchTimeline.dispatchId |
| `vehicleReg` | `string` | No | Registration plate |
| `driverName` | `string` | No | Driver full name |
| `carrier` | `string` | No | Carrier name |
| `routeCode` | `string` | No | Route code in `RT-ORI-DEST-NN` format |
| `origin` | `string` | No | Origin city name (used for region mapping via `CITY_REGION`) |
| `destination` | `string` | No | Destination city name |
| `status` | `VehicleStatus` | No | Live status — see §2.2 |
| `currentLocation` | `string` | No | Human-readable last known position |
| `progressPct` | `number` | No | Journey completion 0–100 |
| `speedKmh` | `number` | No | Current speed (0 = stationary) |
| `etaAt` | `string` (ISO 8601) | No | Estimated arrival time |
| `delayMinutes` | `number` | No | Delay in minutes (0 = on time) |
| `fuelPct` | `number` | No | Fuel level 0–100 |
| `lastPingAt` | `string` (ISO 8601) | No | Last GPS ping timestamp |
| `alerts` | `string[]` | No | Active alert label strings (e.g. `['Stationary 3h+', 'GPS gap']`) |

**Relationships:**
- `dispatchId` → references `Dispatch.id`
- `origin` → region resolved via local `CITY_REGION` map in `OperationsControlTower.tsx` (not `routeOriginRegion`)

**Seed data:** 12 records (`FLEET_VEHICLES`).

---

### 1.4 SLARecord
**Source:** `src/pages/operations/mock/data.ts` → `interface SLARecord`
**Module:** Operations CT — SLA Watch tab
**Primary Key:** `dispatchId`

| Field | TypeScript Type | Nullable | Description |
|---|---|---|---|
| `dispatchId` | `string` | No | PK. Links to active dispatch |
| `routeCode` | `string` | No | Route code |
| `carrier` | `string` | No | Carrier name |
| `origin` | `string` | No | Origin city (used for region filter via `CITY_REGION`) |
| `destination` | `string` | No | Destination city |
| `slaStatus` | `'at-risk' \| 'breached'` | No | Only entries with SLA risk appear here |
| `hoursRemaining` | `number` | Yes | Hours until breach (`at-risk` only) |
| `hoursOverdue` | `number` | Yes | Hours past SLA (`breached` only) |
| `plannedArrival` | `string` (ISO 8601) | No | Committed delivery time |
| `vehicleReg` | `string` | No | FK → FleetVehicle.vehicleReg |

**Seed data:** 4 records (`SLA_WATCH`): 2 `breached`, 2 `at-risk`.

---

### 1.5 HubEvent
**Source:** `src/pages/operations/mock/data.ts` → `interface HubEvent`
**Module:** Operations CT — Hub Activity tab
**Primary Key:** `id`

| Field | TypeScript Type | Nullable | Description |
|---|---|---|---|
| `id` | `string` | No | PK (e.g. `HE-01`) |
| `hub` | `string` | No | Hub display name (e.g. `'Mumbai Hub'`); region resolved by stripping `' Hub'` suffix |
| `type` | `'arrival' \| 'departure'` | No | Event direction |
| `dispatchId` | `string` | No | FK → Dispatch.id |
| `vehicleReg` | `string` | No | FK → FleetVehicle.vehicleReg |
| `carrier` | `string` | No | Carrier name |
| `scheduledAt` | `string` (ISO 8601) | No | Planned event time |
| `actualAt` | `string` (ISO 8601) | Yes | Actual event time (`null` if pending) |
| `status` | `'on-time' \| 'delayed' \| 'early' \| 'pending'` | No | Punctuality classification |
| `delayMinutes` | `number` | Yes | Minutes late (`delayed` only) |

**Seed data:** 12 records (`HUB_EVENTS`).

---

### 1.6 HubVehicle
**Source:** `src/pages/hub-ops/mock/data.ts` → `interface HubVehicle`
**Module:** Hub Operations / Origin Ops (`/hub-ops`)
**Primary Key:** `id`

| Field | TypeScript Type | Nullable | Description |
|---|---|---|---|
| `id` | `string` | No | PK (e.g. `HV-001`) |
| `vehicleNumber` | `string` | No | Registration plate |
| `vehicleType` | `VehicleType` | No | Vehicle class — see §2.3 |
| `carrier` | `string` | No | Carrier name |
| `driverName` | `string` | No | Driver full name |
| `driverMobile` | `string` | No | Driver contact number (10-digit string) |
| `routeCode` | `string` | No | FK → RouteDetail.routeCode |
| `origin` | `string` | No | Full origin location string |
| `destination` | `string` | No | Full destination location string |
| `plannedHUs` | `number` | No | Target HU count |
| `loadedHUs` | `number` | No | HUs loaded so far (0 until loading starts) |
| `weightKg` | `number` | No | Cargo weight in kg |
| `status` | `HubStatus` | No | Current hub stage — see §2.4 |
| `priority` | `PriorityLevel` | No | `'normal' \| 'urgent' \| 'delayed'` |
| `arrivedAt` | `string` (ISO 8601) | Yes | Hub arrival timestamp |
| `gateInAt` | `string` (ISO 8601) | Yes | Gate-in timestamp |
| `loadingStartAt` | `string` (ISO 8601) | Yes | Loading began timestamp |
| `loadingCompleteAt` | `string` (ISO 8601) | Yes | Loading finished timestamp |
| `gateOutAt` | `string` (ISO 8601) | Yes | Gate-out timestamp |
| `dispatchedAt` | `string` (ISO 8601) | Yes | Departure confirmed timestamp |
| `plannedDeparture` | `string` (ISO 8601) | No | Scheduled gate-out time |
| `remarks` | `string` | Yes | Operational notes |

**Seed data:** 13 records (`HUB_VEHICLES`) spanning all 6 `HubStatus` values.

---

### 1.7 DestVehicle
**Source:** `src/pages/dest-ops/mock/data.ts` → `interface DestVehicle`
**Module:** Destination Operations (`/dest-ops`)
**Primary Key:** `id`

| Field | TypeScript Type | Nullable | Description |
|---|---|---|---|
| `id` | `string` | No | PK (e.g. `DV-001`) |
| `vehicleNumber` | `string` | No | Registration plate |
| `vehicleType` | `VehicleType` | No | Vehicle class — see §2.3 |
| `carrier` | `string` | No | Carrier name |
| `driverName` | `string` | No | Driver full name |
| `driverMobile` | `string` | No | Driver contact number |
| `routeCode` | `string` | No | FK → RouteDetail.routeCode |
| `origin` | `string` | No | Origin location string |
| `destination` | `string` | No | Destination location string |
| `dockNumber` | `string` | Yes | Assigned unloading bay (e.g. `'D-04'`); `null` until dock assigned |
| `plannedHUs` | `number` | No | Expected HU count from manifest |
| `receivedHUs` | `number` | No | Actual HUs counted at destination (0 until unloaded) |
| `damagedHUs` | `number` | No | HUs with visible damage |
| `shortHUs` | `number` | No | HUs missing vs manifest |
| `weightKg` | `number` | No | Cargo weight in kg |
| `priority` | `DestPriorityLevel` | No | `'normal' \| 'urgent' \| 'sla_breach'` |
| `status` | `DestStatus` | No | Current destination stage — see §2.5 |
| `departedOriginAt` | `string` (ISO 8601) | Yes | Origin gate-out time |
| `arrivedAt` | `string` (ISO 8601) | Yes | Destination gate arrival |
| `gateInAt` | `string` (ISO 8601) | Yes | Destination gate-in |
| `dockAssignedAt` | `string` (ISO 8601) | Yes | Dock assignment time |
| `unloadingStartAt` | `string` (ISO 8601) | Yes | Unloading began |
| `unloadingCompleteAt` | `string` (ISO 8601) | Yes | Unloading finished |
| `receiptConfirmedAt` | `string` (ISO 8601) | Yes | Receipt signed off |
| `reconciledAt` | `string` (ISO 8601) | Yes | Reconciliation complete |
| `closedAt` | `string` (ISO 8601) | Yes | Record closed |
| `plannedArrival` | `string` (ISO 8601) | No | Committed arrival (SLA deadline) |
| `exceptionCount` | `number` | No | Count of active exceptions for this shipment |
| `remarks` | `string` | Yes | Operational notes |

**Valid dock numbers:** `D-01` through `D-10` (defined in `DOCK_NUMBERS` constant).

**Seed data:** 15 records (`DEST_VEHICLES`) spanning all 9 `DestStatus` values.

---

### 1.8 FullException
**Source:** `src/pages/exceptions/mock/data.ts` → `interface FullException`
**Module:** Exception Board (`/exceptions`)
**Primary Key:** `id`

| Field | TypeScript Type | Nullable | Description |
|---|---|---|---|
| `id` | `string` | No | PK (e.g. `EXC-2024-0891`) |
| `category` | `string` | No | Exception category (see §2.8 for all values found in seed data) |
| `subcategory` | `string` | Yes | Sub-type detail |
| `severity` | `SeverityLevel` | No | `'critical' \| 'high' \| 'medium' \| 'low' \| 'info'` |
| `status` | `ExceptionState` | No | Current state — see §2.7 |
| `dispatchId` | `string` | No | FK → Dispatch.id (e.g. `D-48218`) |
| `routeCode` | `string` | No | FK → RouteDetail.routeCode |
| `routeName` | `string` | No | Human-readable route name |
| `carrier` | `string` | No | Carrier name |
| `vehicleReg` | `string` | No | Vehicle registration |
| `origin` | `string` | No | Origin location (used for region filter via `matchesCity`) |
| `destination` | `string` | No | Destination location |
| `raisedAt` | `string` (ISO 8601) | No | Exception creation timestamp |
| `raisedBy` | `string` | No | Creator — person name or system name (e.g. `'SLA Engine'`, `'GPS System'`) |
| `assignee` | `string` | Yes | Assigned operator name |
| `assigneeTeam` | `string` | Yes | Team name (e.g. `'Operations'`, `'Fleet'`, `'Warehouse'`, `'Documentation'`, `'Quality'`) |
| `escalationLevel` | `number` | No | `0` = none; `1` = regional; `2` = transport head; `3` = control tower |
| `slaBreachAt` | `string` (ISO 8601) | Yes | Exception SLA deadline |
| `resolvedAt` | `string` (ISO 8601) | Yes | Resolution timestamp |
| `resolutionTime` | `number` | Yes | Minutes from `raisedAt` to `resolvedAt` |
| `rootCause` | `string` | Yes | Root cause analysis text |
| `resolutionNote` | `string` | Yes | Resolution description |
| `comments` | `ExcComment[]` | No | Activity thread (may be empty array) |
| `financialImpact` | `number` | Yes | Estimated impact in INR |
| `tags` | `string[]` | No | Classification labels (may be empty array) |

**Seed data:** 12 records (`EXCEPTIONS`) — 10 open/escalated/in-progress, 2 closed/auto-resolved.

---

### 1.8.1 ExcComment (Embedded in FullException.comments)
**Source:** `src/pages/exceptions/mock/data.ts` → `interface ExcComment`

| Field | TypeScript Type | Nullable | Description |
|---|---|---|---|
| `id` | `string` | No | Comment ID (e.g. `c1`) |
| `author` | `string` | No | Operator name or system identifier |
| `text` | `string` | No | Comment body |
| `at` | `string` (ISO 8601) | No | Comment timestamp |
| `type` | `'note' \| 'escalation' \| 'resolution' \| 'system'` | No | Comment category |

---

### 1.9 ReconciliationRecord
**Source:** `src/pages/reconciliation/mock/data.ts` → `interface ReconciliationRecord`
**Module:** Reconciliation Center (`/reconciliation`)
**Primary Key:** `id`

| Field | TypeScript Type | Nullable | Description |
|---|---|---|---|
| `id` | `string` | No | PK (e.g. `REC-2024-0441`) |
| `dispatchId` | `string` | No | FK → Dispatch.id (e.g. `D-48218`) |
| `routeCode` | `string` | No | FK → RouteDetail.routeCode |
| `routeName` | `string` | No | Human-readable route name |
| `carrier` | `string` | No | Carrier name |
| `origin` | `string` | No | Origin location |
| `destination` | `string` | No | Destination location |
| `arrivedAt` | `string` (ISO 8601) | Yes | Actual arrival timestamp (`null` if `pending`) |
| `reconStatus` | `ReconciliationStatus` | No | Current status — see §2.9 |
| `huLoaded` | `number` | No | HU count at origin |
| `huArrived` | `number` | No | HU count at destination (0 if pending) |
| `huDamaged` | `number` | No | Damaged HU count |
| `huMissing` | `number` | No | Missing HU count |
| `huExtra` | `number` | No | Extra HU count beyond manifest |
| `weightLoaded` | `number` | No | Weight at origin in kg |
| `weightArrived` | `number` | No | Weight at destination in kg (0 if pending) |
| `freightCost` | `number` | No | Freight charge in INR |
| `discrepancies` | `HUDiscrepancy[]` | No | Variance items (may be empty array) |
| `reconBy` | `string` | Yes | Operator who performed reconciliation |
| `approvedBy` | `string` | Yes | Finance approver name |
| `approvedAt` | `string` (ISO 8601) | Yes | Approval timestamp |
| `signedOffAt` | `string` (ISO 8601) | Yes | Final sign-off timestamp |
| `notes` | `string` | Yes | Free-text notes |

**Seed data:** 9 records (`RECONCILIATIONS`): 3 `pending`, 1 `in_progress`, 2 `discrepancy`, 0 `approved`, 2 `closed`.

**Note on RECON_KPI computation:** `closed` bucket includes both `'approved'` and `'closed'` status values — `RECONCILIATIONS.filter(r => ['approved','closed'].includes(r.reconStatus)).length`.

---

### 1.9.1 HUDiscrepancy (Embedded in ReconciliationRecord.discrepancies)
**Source:** `src/pages/reconciliation/mock/data.ts` → `interface HUDiscrepancy`

| Field | TypeScript Type | Nullable | Description |
|---|---|---|---|
| `huCode` | `string` | No | HU identifier or `'WEIGHT'` for weight variance |
| `type` | `'missing' \| 'damaged' \| 'extra' \| 'wrong_item' \| 'weight_variance'` | No | Variance classification |
| `description` | `string` | No | Detailed description |
| `financialImpact` | `number` | No | Estimated INR impact (0 if not applicable) |
| `status` | `'open' \| 'accepted' \| 'disputed' \| 'waived'` | No | Dispute resolution state |

---

### 1.10 Alert
**Source:** `src/types/index.ts` → `interface Alert`
**Module:** CT Alerts (`/alerts`), Global Alert Rail
**Primary Key:** `id`

| Field | TypeScript Type | Nullable | Description |
|---|---|---|---|
| `id` | `string` | No | PK (e.g. `ALT-001`) |
| `type` | `AlertType` | No | Alert category — see §2.10 |
| `severity` | `'critical' \| 'high' \| 'medium'` | No | Severity level (note: `'low'` and `'info'` are not used in Alert — only in SeverityLevel) |
| `message` | `string` | No | Full alert message text |
| `dispatchId` | `string` | Yes | FK → Dispatch.id |
| `routeCode` | `string` | Yes | FK → RouteDetail.routeCode |
| `carrierName` | `string` | Yes | Carrier name |
| `delayMins` | `number` | Yes | Delay in minutes (`0` if not applicable) |
| `firedAt` | `string` (ISO 8601) | No | Alert creation timestamp |
| `acknowledged` | `boolean` | No | Whether acknowledged by an operator |
| `ackedAt` | `string` (ISO 8601) | Yes | Acknowledgement timestamp |
| `ackedBy` | `string` | Yes | Operator who acknowledged (default: `'Shashank Zode'`) |
| `ackAction` | `AckAction` | Yes | Action taken — see §2.11 |
| `ackRemarks` | `string` | Yes | Free-text remarks |
| `escalationLevel` | `EscalationLevel` | Yes | Auto-computed from `delayMins` — see §2.12 |
| `closedAt` | `string` (ISO 8601) | Yes | Closure timestamp |

**Seed data:** 13 records (`SEED_ALERTS`): 4 acknowledged, 9 unacknowledged; 5 `critical`, 7 `high`, 1 `medium`.

**Deduplication rule (AlertContext):** `addAlert` skips alert if `prev.some(a => a.id === alert.id)`. Max 50 alerts retained.

---

### 1.11 RouteDetail
**Source:** `src/pages/routes/mock/data.ts` → `interface RouteDetail`
**Module:** Route Performance (`/routes`)
**Primary Key:** `id`

| Field | TypeScript Type | Nullable | Description |
|---|---|---|---|
| `id` | `string` | No | PK (e.g. `R-001`) |
| `routeCode` | `string` | No | Business route code (e.g. `DEL-MUM-FTL`) |
| `routeName` | `string` | No | Human-readable name |
| `origin` | `string` | No | Origin location |
| `destination` | `string` | No | Destination location |
| `regionOrigin` | `string` | No | Origin region as title-case string (e.g. `'North'`, `'West'`) |
| `regionDest` | `string` | No | Destination region |
| `distanceKm` | `number` | No | Route distance in km |
| `grade` | `RouteGrade` | No | Performance grade — `'A' \| 'B' \| 'C' \| 'D' \| 'F'` |
| `gradeScore` | `number` | No | Composite score 0–100 |
| `otaPct` | `number` | No | On-Time Arrival % |
| `otdPct` | `number` | No | On-Time Departure % |
| `slaCompliancePct` | `number` | No | SLA compliance % |
| `avgTransitHours` | `number` | No | Actual average transit time (hours) |
| `plannedTransitHours` | `number` | No | Committed transit time (hours) |
| `delayMinutesAvg` | `number` | No | Average delay in minutes |
| `costPerKm` | `number` | No | Freight cost per km in INR |
| `freightRevenueM` | `number` | No | Freight revenue MTD in ₹ millions |
| `exceptionRate` | `number` | No | Exceptions per 100 dispatches |
| `dispatchCount` | `number` | No | Total dispatches MTD |
| `dispatchTrend` | `number[]` | No | Last 8 weeks dispatch count array |
| `otdTrend` | `number[]` | No | Last 8 weeks OTD% array |
| `topCarrier` | `string` | No | Best-performing carrier on this route |
| `topCarrierScore` | `number` | No | That carrier's composite score |
| `lastException` | `string` | Yes | Description of most recent exception |
| `tags` | `string[]` | No | Classification labels |

**Region filter logic:** `r.regionOrigin.toLowerCase() === region`

**Seed data:** 10 records (`ROUTE_DETAILS`) — grades A×4, B×3, C×2, D×1, F×0.

---

### 1.12 CarrierDetail
**Source:** `src/pages/carriers/mock/data.ts` → `interface CarrierDetail`
**Module:** Carrier Performance (`/carriers`)
**Primary Key:** `id`

| Field | TypeScript Type | Nullable | Description |
|---|---|---|---|
| `id` | `string` | No | PK (e.g. `CAR-001`) |
| `name` | `string` | No | Carrier full name |
| `shortCode` | `string` | No | 3-letter identifier (e.g. `'PTC'`) |
| `tier` | `CarrierTier` | No | Performance tier — see §2.13 |
| `compositeScore` | `number` | No | Overall score 0–100 |
| `otdPct` | `number` | No | On-Time Delivery % |
| `slaCompliancePct` | `number` | No | SLA compliance % |
| `exceptionRatePer100` | `number` | No | Exceptions per 100 dispatches |
| `damageRatePct` | `number` | No | Damage rate % |
| `responseTimeMins` | `number` | No | Average response time to exceptions (minutes) |
| `freightCostIndex` | `number` | No | Cost index: 100 = baseline; < 100 = cheaper; > 100 = more expensive |
| `activeRoutes` | `number` | No | Number of currently active routes |
| `monthlyDispatches` | `number` | No | Dispatches this month (MTD) |
| `fleetsSize` | `number` | No | Fleet vehicle count |
| `hqCity` | `string` | No | HQ city (used for region filter via `matchesCity(c.hqCity)`) |
| `contactName` | `string` | No | Primary contact person |
| `contactPhone` | `string` | No | Contact phone number (10-digit string) |
| `contractExpiry` | `string` (ISO date `YYYY-MM-DD`) | No | Contract end date |
| `lastAuditScore` | `number` | No | Most recent audit score |
| `lastAuditDate` | `string` (ISO date `YYYY-MM-DD`) | No | Most recent audit date |
| `status` | `'active' \| 'suspended' \| 'under_review' \| 'probation'` | No | Operational status |
| `scoreTrend` | `number[]` (length 6) | No | Last 6 months composite score |
| `otdTrend` | `number[]` (length 6) | No | Last 6 months OTD% |
| `incidentCount` | `number` | No | Incidents this month (MTD) |
| `remarks` | `string` | Yes | Flags or notes |

**Seed data:** 10 records (`CARRIERS`) — Platinum×2, Gold×4, Silver×3, Bronze×0, Probation×1.

---

### 1.13 NetworkNode
**Source:** `src/pages/control-tower/mock/data.ts` → `interface NetworkNode`
**Module:** Executive CT — Live Network View widget
**Primary Key:** `id`

| Field | TypeScript Type | Nullable | Description |
|---|---|---|---|
| `id` | `string` | No | PK — 3-letter city code (e.g. `'DEL'`) |
| `label` | `string` | No | Display name (e.g. `'Delhi Hub'`) |
| `type` | `'hub' \| 'depot' \| 'destination'` | No | Node classification |
| `region` | `'north' \| 'south' \| 'east' \| 'west'` | No | Region |
| `activeVehicles` | `number` | No | Vehicles currently active at this node |
| `pendingArrivals` | `number` | No | Vehicles expected to arrive |
| `exceptions` | `number` | No | Active exception count |
| `utilPct` | `number` | No | Utilisation % |

**Seed data:** 10 records (`NETWORK_NODES`): DEL, MUM, BLR, HYD, CHE, KOL, PUN, AMD, LKO, JAI.

---

## 2. Enumeration Types

### 2.1 LifecycleStatus
**Source:** `src/pages/lifecycle/mock/data.ts`
**Ordered sequence — stage index drives `stageCompletionPct` computation.**

| Value | Stage # | Phase | Label |
|---|---|---|---|
| `'planned'` | 0 | origin | Planned |
| `'ready'` | 1 | origin | Ready |
| `'gate_in_origin'` | 2 | origin | Gate In Origin |
| `'loading'` | 3 | origin | Loading |
| `'gate_out_origin'` | 4 | origin | Gate Out Origin |
| `'dispatched'` | 5 | transit | Dispatched |
| `'in_transit'` | 6 | transit | In Transit |
| `'arrived_dest'` | 7 | transit | Arrived Dest. |
| `'gate_in_dest'` | 8 | destination | Gate In Dest. |
| `'dock_assigned'` | 9 | destination | Dock Assigned |
| `'unloading'` | 10 | destination | Unloading |
| `'received'` | 11 | destination | Received |
| `'reconciled'` | 12 | complete | Reconciled |
| `'closed'` | 13 | complete | Closed |

**Phase colours:** origin = blue-600, transit = amber-500, destination = violet-600, complete = green-600.

---

### 2.2 VehicleStatus (Operations CT fleet board)
**Source:** `src/pages/operations/mock/data.ts`

| Value | Label | Visual |
|---|---|---|
| `'in-transit'` | In Transit | Blue pulse animation |
| `'halted'` | Halted | Amber |
| `'delayed'` | Delayed | Red |
| `'arrived'` | Arrived | Green |
| `'idle'` | Idle | Slate/grey |

---

### 2.3 VehicleType (Hub Ops and Dest Ops)
**Source:** `src/pages/hub-ops/mock/data.ts`, `src/pages/dest-ops/mock/data.ts`

`'FTL' | 'LTL' | 'LCV' | 'Trailer' | 'Reefer'`

---

### 2.4 HubStatus (Origin Ops)
**Source:** `src/pages/hub-ops/mock/data.ts`
**Ordered sequence** (defined in `STATUS_ORDER` constant):

| Value | Label | Processing Step |
|---|---|---|
| `'arrived'` | Arrived | Waiting for gate-in; turnaround clock starts |
| `'gate_in'` | Gate In | At dock; pre-loading; dwell clock starts |
| `'loading'` | Loading | HUs being loaded; `loadedHUs` updates per scan |
| `'loaded'` | Loaded | Loading complete; gate-out documentation pending |
| `'gate_out'` | Gate Out | Vehicle cleared for departure |
| `'dispatched'` | Dispatched | Vehicle departed; SLA clock starts |

---

### 2.5 DestStatus (Destination Ops)
**Source:** `src/pages/dest-ops/mock/data.ts`
**Ordered sequence** (defined in `DEST_STATUS_ORDER` constant):

| Value | Label |
|---|---|
| `'in_transit'` | In Transit |
| `'arrived'` | Arrived |
| `'gate_in'` | Gate In |
| `'dock_assigned'` | Dock Assigned |
| `'unloading'` | Unloading |
| `'unloaded'` | Unloaded |
| `'receipt_confirmed'` | Receipt Confirmed |
| `'reconciled'` | Reconciled |
| `'closed'` | Closed |

---

### 2.6 DispatchStatus (Dispatch Workbench)
**Source:** `src/theme/tokens.ts` → `COLOR.dispatch`

| Value | Hex Colour |
|---|---|
| `'planned'` | `#6B7280` (slate) |
| `'ready'` | `#8B5CF6` (violet) |
| `'dispatched'` | `#2563EB` (blue) |
| `'transit'` | `#0891B2` (cyan) |
| `'arrived'` | `#D97706` (amber) |
| `'unloading'` | `#EA580C` (orange) |
| `'reconciled'` | `#16A34A` (green) |
| `'closed'` | `#9CA3AF` (grey) |

---

### 2.7 ExceptionState
**Source:** `src/types/index.ts`

| Value | Tab Group | Badge Colour |
|---|---|---|
| `'OPEN'` | Open tab | Red |
| `'ASSIGNED'` | Open tab | Blue |
| `'IN_PROGRESS'` | In Progress tab | Violet |
| `'ESCALATED'` | Escalated tab | Orange |
| `'PENDING_INFO'` | Open tab | Amber |
| `'RESOLVED'` | Resolved tab | Green |
| `'CLOSED'` | Resolved tab | Slate |
| `'AUTO_RESOLVED'` | Resolved tab | Slate |

**Tab grouping logic** (from `ExceptionBoard.tsx`):
- "Open" = `OPEN`, `ASSIGNED`, `PENDING_INFO`
- "In Progress" = `IN_PROGRESS`
- "Escalated" = `ESCALATED`
- "Resolved" = `RESOLVED`, `CLOSED`, `AUTO_RESOLVED`

---

### 2.8 Exception Categories
**Source:** Seed values from `EXCEPTIONS` array, `EXC_BY_CATEGORY` array.

Categories present in seed data: `'SLA Breach'`, `'HU Missing'`, `'Vehicle Breakdown'`, `'HU Damaged'`, `'Route Deviation'`, `'Gate Hold'`, `'Weight Mismatch'`, `'Delayed Dispatch'`, `'Temp Deviation'`, `'Doc Missing'`

Categories available in Raise Exception modal (from UI): `SLA Breach`, `Delivery Delay`, `Vehicle Breakdown`, `Document Issue`, `Customer Complaint`, `Damage in Transit`, `Short Shipment`, `Address Change`, `Other`

---

### 2.9 ReconciliationStatus
**Source:** `src/pages/reconciliation/mock/data.ts`

| Value | Meaning |
|---|---|
| `'pending'` | Dispatched; not yet arrived |
| `'in_progress'` | Arrived; scanning in progress |
| `'discrepancy'` | Variances found; pending resolution |
| `'approved'` | Finance approved; no further dispute |
| `'closed'` | Fully reconciled and signed off |

---

### 2.10 AlertType
**Source:** `src/types/index.ts`, `src/pages/alerts/mock/data.ts`

| Value | Label | Badge Colour Class |
|---|---|---|
| `'SLA_BREACH'` | SLA Breach | `bg-red-100 text-red-700` |
| `'HIGH_RISK'` | High Risk | `bg-orange-100 text-orange-700` |
| `'ESCALATED_EXCEPTION'` | Escalated Exception | `bg-purple-100 text-purple-700` |
| `'OVERDUE_RECONCILIATION'` | Overdue Reconciliation | `bg-amber-100 text-amber-700` |
| `'INTEGRATION_FAILURE'` | Integration Failure | `bg-slate-100 text-slate-600` |

---

### 2.11 AckAction
**Source:** `src/types/index.ts`, `src/pages/alerts/mock/data.ts` → `ACK_ACTION_LABEL`

| Value | Label | Avg Recovery (mins) | Count in seed |
|---|---|---|---|
| `'carrier_escalated'` | Carrier Escalated | 180 | 9 |
| `'alternate_vehicle'` | Alternate Vehicle Arranged | 95 | 8 |
| `'route_changed'` | Route Changed | 125 | 6 |
| `'delivery_replanned'` | Delivery Replanned | 220 | 5 |
| `'driver_contacted'` | Driver Contacted | 38 | 15 |
| `'hub_escalated'` | Hub Escalated | 165 | 7 |
| `'customer_escalated'` | Customer Escalated | 290 | 3 |
| `'monitoring_only'` | Monitoring Only | 60 | 12 |

---

### 2.12 EscalationLevel
**Source:** `src/types/index.ts`, `src/context/AlertContext.tsx` → `getEscalationLevel()`

| Value | Label | Trigger Threshold |
|---|---|---|
| `'regional_manager'` | Regional Manager | `delayMins >= 120` |
| `'transport_head'` | Transport Head | `delayMins >= 240` |
| `'control_tower'` | Control Tower | `delayMins >= 480` |

Auto-computed on `AlertProvider` initialisation for all seed alerts without an explicit `escalationLevel`.

---

### 2.13 CarrierTier
**Source:** `src/pages/carriers/mock/data.ts`

| Value | Token Colour | Score Range (seed data) |
|---|---|---|
| `'Platinum'` | `#7c3aed` (violet) | 88–91 |
| `'Gold'` | `#d97706` (amber) | 76–82 |
| `'Silver'` | `#64748b` (slate) | 68–73 |
| `'Bronze'` | `#92400e` (brown) | Not represented in seed |
| `'Probation'` | `#ef4444` (red) | 52 |

---

### 2.14 DateRangePreset
**Source:** `src/types/index.ts`

`'today' | 'yesterday' | '7d' | '30d' | 'month' | 'custom'`

**Default:** `'7d'` (FilterContext initialises with `from = Date.now() - 7 * 86400000`, `to = Date.now()`).
**`hasActiveFilters` check:** `preset !== '7d' || region !== '' || routes.length > 0 || carriers.length > 0`

---

### 2.15 SeverityLevel
**Source:** `src/theme/tokens.ts`

| Value | Hex | Background Hex |
|---|---|---|
| `'critical'` | `#DC2626` | `#FEE2E2` |
| `'high'` | `#EA580C` | `#FFEDD5` |
| `'medium'` | `#D97706` | `#FEF3C7` |
| `'low'` | `#16A34A` | `#DCFCE7` |
| `'info'` | `#2563EB` | `#DBEAFE` |

**Note:** Alert.severity only uses `'critical'`, `'high'`, `'medium'` — not `'low'` or `'info'`.

---

### 2.16 RouteGrade
**Source:** `src/theme/tokens.ts`

| Value | Hex |
|---|---|
| `'A'` | `#16A34A` (green) |
| `'B'` | `#2563EB` (blue) |
| `'C'` | `#D97706` (amber) |
| `'D'` | `#EA580C` (orange) |
| `'F'` | `#DC2626` (red) |

---

## 3. Context / State Objects

### 3.1 GlobalFilters
**Source:** `src/types/index.ts` → `interface GlobalFilters`
**Managed by:** `FilterContext` via `useReducer`

| Field | TypeScript Type | Default | Description |
|---|---|---|---|
| `dateRange` | `DateRange` | `{ preset: '7d', from: 7 days ago, to: now }` | Selected date window |
| `region` | `string` | `''` | Region filter; empty string = all regions |
| `routes` | `string[]` | `[]` | Route filter; empty = all routes (currently unused in module filtering) |
| `carriers` | `string[]` | `[]` | Carrier filter; empty = all carriers (currently unused in module filtering) |

**DateRange fields:**

| Field | TypeScript Type | Description |
|---|---|---|
| `preset` | `DateRangePreset` | Named preset or `'custom'` |
| `from` | `Date` | Start of window |
| `to` | `Date` | End of window |

**FilterContext actions:** `SET_DATE_RANGE`, `SET_DATE_PRESET`, `SET_REGION`, `SET_ROUTES`, `SET_CARRIERS`, `RESET`

---

### 3.2 AlertContextValue
**Source:** `src/context/AlertContext.tsx`

| Field | Type | Description |
|---|---|---|
| `alerts` | `Alert[]` | In-memory alert list (max 50, newest first) |
| `unacknowledgedCount` | `number` | `alerts.filter(a => !a.acknowledged).length` |
| `criticalCount` | `number` | `alerts.filter(a => a.severity === 'critical' && !a.acknowledged).length` |
| `isRailOpen` | `boolean` | Whether GlobalAlertRail slide-over is open |
| `openRail / closeRail / toggleRail` | `() => void` | Rail visibility controls |
| `acknowledge(id, payload)` | `function` | Sets `acknowledged = true`, records `ackedAt`, `ackedBy`, `ackAction`, `ackRemarks` |
| `addAlert(alert)` | `function` | Prepends alert; auto-opens rail if `severity === 'critical'`; deduplicates by `id` |
| `removeAlert(id)` | `function` | Removes alert from list |

**AcknowledgePayload:**

| Field | TypeScript Type | Nullable | Description |
|---|---|---|---|
| `action` | `AckAction` | No | Action taken |
| `remarks` | `string` | No | Free-text remarks |
| `ackedBy` | `string` | Yes | Operator name; defaults to `'Shashank Zode'` if omitted |

---

## 4. Shared UI Types

### 4.1 KPIData
**Source:** `src/types/index.ts`

| Field | TypeScript Type | Nullable | Description |
|---|---|---|---|
| `label` | `string` | No | Display label |
| `value` | `number \| string` | No | Metric value |
| `unit` | `string` | Yes | Unit suffix (e.g. `'%'`, `'hrs'`) |
| `trend` | `{ direction: TrendDirection; delta: string; period: string }` | Yes | Trend arrow data |
| `status` | `StatusType` | No | `'healthy' \| 'warning' \| 'danger' \| 'info' \| 'neutral'` |
| `progress` | `number` | Yes | 0–100; renders progress bar under value |
| `onClick` | `() => void` | Yes | Click handler |
| `tooltip` | `string` | Yes | Hover tooltip text |

### 4.2 ColumnDef
**Source:** `src/types/index.ts`

Configures a column in `DataTable`. Key fields:
- `key: string` — data accessor
- `label: string` — column header
- `sortable?: boolean`
- `editable?: boolean`, `editType?: CellEditType` (`'text' | 'number' | 'dropdown' | 'date' | 'toggle'`)
- `render?: (value, row) => React.ReactNode` — custom cell renderer
- `sticky?: boolean` — freeze column

---

## 5. Analytics / Derived Objects

### 5.1 RouteDelayStats
**Source:** `src/pages/alerts/mock/data.ts`

| Field | TypeScript Type | Description |
|---|---|---|
| `routeCode` | `string` | FK → RouteDetail.routeCode |
| `routeLabel` | `string` | Display name |
| `totalExceptions` | `number` | Exception count in period |
| `avgDelayMins` | `number` | Average delay in minutes |
| `breachCount` | `number` | SLA breaches in period |
| `onTimeRate` | `number` | OTD % |
| `trend` | `'improving' \| 'stable' \| 'worsening'` | Direction |

**Seed data:** 7 records (`TOP_DELAY_ROUTES`).

### 5.2 CarrierDelayStats
**Source:** `src/pages/alerts/mock/data.ts`

| Field | TypeScript Type | Description |
|---|---|---|
| `carrier` | `string` | Carrier name |
| `totalExceptions` | `number` | Exception count |
| `avgDelayMins` | `number` | Average delay |
| `breachCount` | `number` | SLA breaches |
| `slaScore` | `number` | SLA compliance score |
| `trend` | `'improving' \| 'stable' \| 'worsening'` | Direction |

**Seed data:** 7 records (`TOP_DELAY_CARRIERS`).

### 5.3 ChronicLane
**Source:** `src/pages/alerts/mock/data.ts`

| Field | TypeScript Type | Description |
|---|---|---|
| `routeCode` | `string` | FK → RouteDetail.routeCode |
| `carrier` | `string` | Carrier name |
| `breachesLast30Days` | `number` | 30-day breach count |
| `avgDelayMins` | `number` | Average delay |
| `lastBreachAt` | `string` (ISO 8601) | Most recent breach timestamp |
| `status` | `'critical' \| 'watch' \| 'improving'` | Lane health |

**Seed data:** 5 records (`CHRONIC_LANES`).

### 5.4 RecoveryStats
**Source:** `src/pages/alerts/mock/data.ts`

| Field | TypeScript Type | Description |
|---|---|---|
| `avgRecoveryMins` | `number` | Network average: 142 minutes |
| `p90RecoveryMins` | `number` | 90th percentile: 310 minutes |
| `fastestMins` | `number` | Fastest recovery: 18 minutes |
| `slowestMins` | `number` | Slowest recovery: 720 minutes |
| `byAction` | `{ action: AckAction; avgMins: number; count: number }[]` | Per-action breakdown |

### 5.5 ClosureSLA Constant
**Source:** `src/pages/alerts/mock/data.ts`

| Field | Value | Description |
|---|---|---|
| `totalClosed` | 65 | Alerts closed in period |
| `closedWithinSla` | 48 | Closed within 240-minute target |
| `slaThresholdMins` | 240 | Alert closure SLA target |
| `avgClosureMins` | 142 | Average actual closure time |
| `breachedClosure` | 17 | Alerts that exceeded 240m |
| `slaPct` | 74 | `Math.round((48 / 65) * 100)` |

---

## 6. Entity Relationship Map

```
GlobalFilters (FilterContext)
    │
    └─ consumed by every module via useActiveFilters()
           │
           ├─ matchesRoute(routeCode) ──── routeOriginRegion() from lib/exportCsv.ts
           ├─ matchesCity(city)   ──────── cityRegion() from lib/exportCsv.ts
           └─ matchesDate(isoString) ───── matchesDateRange() from lib/exportCsv.ts

DispatchTimeline ──────┐
    .routeCode ─────────┼──── RouteDetail.routeCode (logical FK)
    .dispatchId ────────┼──── FullException.dispatchId
                        │     ReconciliationRecord.dispatchId
                        │     Alert.dispatchId
                        │     FleetVehicle.dispatchId
                        │     SLARecord.dispatchId
                        │     HubEvent.dispatchId
                        │
FleetVehicle ──────────┤
    .vehicleReg ────────┼──── SLARecord.vehicleReg (shared reference)

FullException
    .routeCode ─────────┼──── RouteDetail.routeCode
    .carrier ───────────┼──── CarrierDetail.name (display reference)
    .comments[] ────────┼──── ExcComment[] (embedded array)

ReconciliationRecord
    .dispatchId ────────┼──── one-to-one with DispatchTimeline.dispatchId
    .discrepancies[] ───┼──── HUDiscrepancy[] (embedded array)

Alert
    .escalationLevel ───┼──── auto-computed by getEscalationLevel(delayMins)
                              in AlertContext on addAlert()
```

---

## 7. Region Mapping Rules

### 7.1 routeOriginRegion() — for route codes
**Source:** `src/lib/exportCsv.ts`

Splits on `'-'`, takes index `[0]`, maps to region:

| Prefix | Region | Routes affected |
|---|---|---|
| `DEL` | `'north'` | DEL-MUM-FTL, DEL-JPR-009, DEL-LKW-007 |
| `LKO` | `'north'` | LKO-DEL-01 |
| `JAI` | `'north'` | JAI-MUM-02 |
| `CHD` | `'north'` | — |
| `MUM` | `'west'` | MUM-DEL-07, MUM-PUN-002, MUM-AHM-004 |
| `PUN` | `'west'` | — |
| `AMD` | `'west'` | AMD-BLR-02, AMD-MUM-01 |
| `SUR` | `'west'` | — |
| `BLR` | `'south'` | BLR-MUM-05, BLR-CHE-01, BLR-HYD-008 |
| `HYD` | `'south'` | HYD-BLR-02, HYD-MUM-005 |
| `CHE` | `'south'` | CHE-HYD-01 |
| `KOC` | `'south'` | — |
| `KOL` | `'east'` | KOL-HYD-01, KOL-DEL-001, KOL-PAT-006 |
| `PAT` | `'east'` | — |
| `BHU` | `'east'` | — |
| `GUW` | `'east'` | — |
| Any other | `''` | e.g. `RT-MUM-DEL-01` → prefix `RT` → no match |

**Important gap:** Route codes in the `RT-XXX-YYY-NN` format used in Operations CT (`FleetVehicle.routeCode`) return `''` from this function. Operations CT therefore uses a local `CITY_REGION` map on `FleetVehicle.origin` instead.

### 7.2 cityRegion() — for city names
**Source:** `src/lib/exportCsv.ts`
Uses `city.toLowerCase()` and regex match:

| Regex Pattern | Region |
|---|---|
| `delhi\|lucknow\|jaipur\|chandigarh\|amritsar\|ludhiana` | `'north'` |
| `bangalore\|bengaluru\|chennai\|hyderabad\|kochi\|coimbatore` | `'south'` |
| `kolkata\|patna\|bhubaneswar\|guwahati` | `'east'` |
| `mumbai\|ahmedabad\|pune\|surat\|nagpur\|indore` | `'west'` |
| no match | `''` |

### 7.3 CITY_REGION — Operations CT local map
**Source:** `src/pages/operations/OperationsControlTower.tsx`
Direct `Record<string, string>` lookup used only within Operations CT for `FleetVehicle.origin`, `SLARecord.origin`, and `HubEvent.hub`:

West: Mumbai, Pune, Ahmedabad, Surat, Goa
North: Delhi, Agra, Jaipur, Jodhpur, Lucknow, Indore, Bhopal
South: Bangalore, Chennai, Hyderabad, Vizag
East: Kolkata, Patna, Bhubaneswar

---

## 8. Computed Field Definitions

All helpers are pure functions exported from their respective `mock/data.ts` files.

### 8.1 DispatchTimeline helpers (`src/pages/lifecycle/mock/data.ts`)

| Function | Formula | Returns |
|---|---|---|
| `stageCompletionPct(d)` | `Math.round((LIFECYCLE_STAGES.indexOf(d.status) / 13) * 100)` | `number` 0–100 |
| `originToDestMins(d)` | `(arrivedDestAt - gateOutOriginAt) / 60000` | `number \| null` |
| `totalLifecycleMins(d)` | `(closedAt - plannedAt) / 60000` | `number \| null` |
| `stageTimestamp(d, stage)` | Map of stage → field name | `string \| undefined` |
| `fmtMins(mins)` | `< 60 → 'Xm'`; `>= 60 → 'Xh Ym'` | `string` |

### 8.2 HubVehicle helpers (`src/pages/hub-ops/mock/data.ts`)

| Function | Formula | Returns |
|---|---|---|
| `hubDwellMins(v)` | `(gateOutAt - gateInAt) / 60000` | `number \| null` |
| `loadingTimeMins(v)` | `(loadingCompleteAt - loadingStartAt) / 60000` | `number \| null` |
| `turnaroundMins(v)` | `(dispatchedAt - arrivedAt) / 60000` | `number \| null` |
| `isDelayed(v)` | `!['gate_out','dispatched'].includes(status) && plannedDeparture < now` | `boolean` |

### 8.3 DestVehicle helpers (`src/pages/dest-ops/mock/data.ts`)

| Function | Formula | Returns |
|---|---|---|
| `transitTimeMins(v)` | `(arrivedAt - departedOriginAt) / 60000` | `number \| null` |
| `dockDwellMins(v)` | `(unloadingCompleteAt - dockAssignedAt) / 60000` | `number \| null` |
| `unloadingTimeMins(v)` | `(unloadingCompleteAt - unloadingStartAt) / 60000` | `number \| null` |
| `totalCycleMins(v)` | `(closedAt - arrivedAt) / 60000` | `number \| null` |
| `huVariance(v)` | `receivedHUs - plannedHUs` | `number` (negative = shortage) |
| `isOverdue(v)` | `!['reconciled','closed'].includes(status) && plannedArrival < now` | `boolean` |

### 8.4 Executive CT dateScale (`src/pages/control-tower/ControlTowerPage.tsx`)

```typescript
const windowDays = Math.max(1, (to.getTime() - from.getTime()) / 86400000)
const dateScale  = Math.round((windowDays / 7) * 100) / 100
```

Applied to count-based KPIs: Active Dispatches, SLA Breaches, Open Exceptions, Pending Reconciliation.
Not applied to percentage KPIs: OTD%, Vehicle Utilisation%, Cost vs Budget, Avg Delay.

### 8.5 AlertContext getEscalationLevel (`src/context/AlertContext.tsx`)

```typescript
function getEscalationLevel(delayMins?: number): EscalationLevel | undefined {
  if (!delayMins) return undefined
  if (delayMins >= 480) return 'control_tower'
  if (delayMins >= 240) return 'transport_head'
  if (delayMins >= 120) return 'regional_manager'
  return undefined
}
```

### 8.6 Derived KPI Computations

| Constant | Source File | Formula |
|---|---|---|
| `EXC_KPI.totalOpen` | exceptions/mock/data.ts | `EXCEPTIONS.filter(e => !['RESOLVED','CLOSED','AUTO_RESOLVED'].includes(e.status)).length` |
| `EXC_KPI.financialImpact` | exceptions/mock/data.ts | `open.reduce((s, e) => s + (e.financialImpact ?? 0), 0)` |
| `EXC_KPI.avgResolutionH` | exceptions/mock/data.ts | `mean(closed[].resolutionTime) / 60`, rounded |
| `RECON_KPI.closed` | reconciliation/mock/data.ts | Includes both `'approved'` and `'closed'` statuses |
| `RECON_KPI.financialImpact` | reconciliation/mock/data.ts | `flatMap(discrepancies).reduce(sum of financialImpact)` |
| `ROUTE_KPI.avgOTD` | routes/mock/data.ts | `Math.round(sum(otdPct) / count)` |
| `ROUTE_KPI.avgExceptionRate` | routes/mock/data.ts | `(sum(exceptionRate) / count).toFixed(1)` as number |
| `CARRIER_KPI.avgScore` | carriers/mock/data.ts | `Math.round(sum(compositeScore) / count)` |
| `CLOSURE_SLA.slaPct` | alerts/mock/data.ts | `Math.round((48 / 65) * 100)` = 73 (rounded from 73.8) |
