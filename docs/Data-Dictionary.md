# Data Dictionary
## Transport Control Tower (TCT)

**Version:** 1.0  
**Last Updated:** 2026-06-19

This document defines every data entity, field, and enumeration in the TCT domain model.

---

## 1. Core Entities

### 1.1 Dispatch (`DispatchRecord`)

The primary operational record. Represents a single truck movement from origin to destination.

| Field               | Type       | Description                                          |
|---------------------|------------|------------------------------------------------------|
| `id`                | string     | Unique dispatch ID. Format: `D-NNNNN`                |
| `status`            | DispatchStatus | Current lifecycle state (see §3.1)               |
| `routeCode`         | string     | Route identifier. Format: `ORI-DEST-NN` (e.g. `DEL-MUM-01`) |
| `routeName`         | string     | Human-readable route label                          |
| `origin`            | string     | Origin location name including warehouse/hub label  |
| `destination`       | string     | Destination location name                           |
| `vehicleReg`        | string     | Vehicle registration number                         |
| `vehicleType`       | VehicleType | FTL / LTL / LCV / Trailer                         |
| `driverName`        | string     | Assigned driver's full name                         |
| `driverPhone`       | string     | Driver's mobile number                              |
| `carrier`           | string     | Carrier company name                                |
| `carrierId`         | string     | Carrier master ID                                   |
| `plannedDeparture`  | ISO-8601   | Scheduled departure datetime                        |
| `plannedArrival`    | ISO-8601   | Scheduled arrival datetime                          |
| `actualDeparture`   | ISO-8601?  | Actual gate-out time (null if not yet departed)     |
| `actualArrival`     | ISO-8601?  | Actual arrival time (null if not yet arrived)       |
| `huCount`           | number     | Total Handling Units booked                         |
| `loadedHUs`         | number     | Handling Units actually loaded                      |
| `weightKg`          | number     | Total shipment weight in kilograms                  |
| `volumeCbm`         | number     | Total volume in cubic metres                        |
| `exceptionCount`    | number     | Number of open exceptions on this dispatch          |
| `slaStatus`         | SLAStatus  | `ok` / `at-risk` / `breached`                       |
| `slaHoursRemaining` | number?    | Hours until SLA breach (present when at-risk)       |
| `slaHoursOverdue`   | number?    | Hours past SLA (present when breached)              |
| `slaTotalHours`     | number     | Contractual SLA window in hours                     |
| `lrNumber`          | string     | Lorry Receipt number                                |
| `ewaybillNumber`    | string     | GST E-waybill number                                |
| `invoiceNumbers`    | string[]   | Associated invoice numbers                          |
| `gatePassNumber`    | string     | Gate pass issued at origin hub                      |
| `sealNumber`        | string     | Truck seal number                                   |
| `freightCost`       | number     | Freight cost in INR                                 |
| `priority`          | Priority   | `normal` / `high` / `critical`                      |
| `tags`              | string[]   | Free-form labels (e.g. `['pharma', 'express']`)     |
| `remarks`           | string?    | Optional operational notes                          |
| `assignedTo`        | string?    | Control tower operator assigned to monitor          |

---

### 1.2 Exception (`ExceptionItem`)

A flagged operational problem requiring investigation and resolution.

| Field             | Type           | Description                                         |
|-------------------|----------------|-----------------------------------------------------|
| `id`              | string         | Unique exception ID. Format: `EX-YYYY-NNN`          |
| `category`        | string         | Exception category (see §3.3)                      |
| `severity`        | SeverityLevel  | `critical` / `high` / `medium` / `low` / `info`    |
| `status`          | ExceptionState | Current workflow state (see §3.4)                  |
| `dispatchId`      | string         | Associated dispatch ID                              |
| `routeCode`       | string         | Route code of the affected dispatch                 |
| `carrier`         | string         | Carrier name                                        |
| `origin`          | string         | Origin city of the exception                        |
| `raisedAt`        | ISO-8601       | When the exception was raised                       |
| `raisedBy`        | string         | Who raised it (`System` for auto-raised)            |
| `assignee`        | string?        | Operator assigned to resolve                        |
| `escalationLevel` | EscalationLevel? | Current escalation tier                           |
| `rootCause`       | string?        | Root cause description                              |
| `resolutionNote`  | string?        | How it was resolved                                 |
| `slaBreachAt`     | ISO-8601?      | Timestamp of SLA breach if applicable              |

---

### 1.3 Alert (`Alert`)

A system-generated notification requiring acknowledgement.

| Field             | Type           | Description                                         |
|-------------------|----------------|-----------------------------------------------------|
| `id`              | string         | Unique alert ID                                     |
| `type`            | AlertType      | Alert category (see §3.5)                          |
| `severity`        | string         | `critical` / `high` / `medium`                      |
| `message`         | string         | Human-readable alert description                    |
| `dispatchId`      | string?        | Associated dispatch if applicable                   |
| `routeCode`       | string?        | Associated route code                               |
| `carrierName`     | string?        | Associated carrier name                             |
| `delayMins`       | number?        | Delay in minutes (drives escalation level)          |
| `firedAt`         | ISO-8601       | When the alert was generated                        |
| `acknowledged`    | boolean        | Whether an operator has acknowledged it             |
| `ackedAt`         | ISO-8601?      | When acknowledged                                   |
| `ackedBy`         | string?        | Operator name who acknowledged                      |
| `ackAction`       | AckAction?     | Action taken on acknowledgement (see §3.6)         |
| `ackRemarks`      | string?        | Free-text remarks from the operator                 |
| `escalationLevel` | EscalationLevel? | Computed from `delayMins`                         |
| `closedAt`        | ISO-8601?      | When the alert was closed                           |

---

### 1.4 Route Performance (`RoutePerformance`)

Aggregated performance metrics for a named route.

| Field            | Type       | Description                                           |
|------------------|------------|-------------------------------------------------------|
| `routeId`        | string     | Unique route identifier                               |
| `routeCode`      | string     | Route code (e.g. `DEL-MUM-01`)                        |
| `routeName`      | string     | Human label                                           |
| `grade`          | RouteGrade | A / B / C / D / F based on composite score           |
| `otaPct`         | number     | On-Time Arrival percentage                            |
| `otdPct`         | number     | On-Time Departure percentage                          |
| `delayMinutes`   | number     | Average delay in minutes                              |
| `costPerKm`      | number     | Average freight cost per kilometre (INR)              |
| `compositeScore` | number     | Weighted performance score 0–100                      |
| `exceptionCount` | number     | Total exceptions in period                            |
| `dispatchCount`  | number     | Total dispatches in period                            |

---

### 1.5 Carrier Performance (`CarrierPerformance`)

Aggregated performance metrics for a carrier.

| Field            | Type       | Description                                           |
|------------------|------------|-------------------------------------------------------|
| `carrierId`      | string     | Unique carrier ID                                     |
| `name`           | string     | Carrier company name                                  |
| `type`           | string     | FTL / LTL / LCV / 3PL / Express                      |
| `otaPct`         | number     | On-Time Arrival %                                     |
| `otdPct`         | number     | On-Time Departure %                                   |
| `openExceptions` | number     | Currently open exceptions                             |
| `compositeScore` | number     | Weighted performance score 0–100                      |
| `costPerKm`      | number     | Average cost per km (INR)                             |
| `statusLabel`    | string     | Top Performer / Good / Monitor / At Risk              |

---

### 1.6 Available Vehicle (`AvailableVehicle`)

A vehicle in the fleet available for load assignment.

| Field           | Type              | Description                                    |
|-----------------|-------------------|------------------------------------------------|
| `id`            | string            | Vehicle ID (e.g. `V-001`)                      |
| `reg`           | string            | Registration number                            |
| `type`          | VehicleType       | FTL / LTL / LCV / Trailer                     |
| `capacityKg`    | number            | Maximum load capacity in kilograms             |
| `capacityCbm`   | number            | Maximum volume capacity in cubic metres        |
| `carrier`       | string            | Carrier this vehicle belongs to                |
| `location`      | string            | Current location / hub name                    |
| `availability`  | VehicleAvailability | available / loading / in_transit / maintenance / reserved |
| `nextAvailable` | ISO-8601?         | When it becomes available (if not available)   |
| `driverName`    | string            | Assigned driver                                |
| `driverPhone`   | string            | Driver contact                                 |
| `utilizationPct`| number            | Current load as percentage of capacity         |

---

### 1.7 Pending Load (`PendingLoad`)

A shipment awaiting vehicle assignment in the load planning workbench.

| Field              | Type     | Description                                      |
|--------------------|----------|--------------------------------------------------|
| `id`               | string   | Load ID (e.g. `PL-2024-0881`)                    |
| `routeCode`        | string   | Intended route                                   |
| `routeName`        | string   | Human label                                      |
| `origin`           | string   | Origin location                                  |
| `destination`      | string   | Destination location                             |
| `distanceKm`       | number   | Route distance in km                             |
| `huCount`          | number   | Number of handling units                         |
| `weightKg`         | number   | Total weight                                     |
| `volumeCbm`        | number   | Total volume                                     |
| `plannedDeparture` | ISO-8601 | Required departure time                          |
| `priority`         | Priority | `normal` / `high` / `critical`                   |
| `assignedVehicleId`| string?  | Vehicle assigned (null if still pending)         |
| `loadPlanId`       | string?  | Load plan this belongs to once assigned          |
| `tags`             | string[] | Commodity / handling tags                        |

---

### 1.8 Global Filters (`GlobalFilters`)

The application-wide filter state managed by `FilterContext`.

| Field       | Type          | Description                                          |
|-------------|---------------|------------------------------------------------------|
| `dateRange` | DateRange     | Selected date window                                 |
| `region`    | string        | Selected region slug: `''` (all) / `north` / `south` / `east` / `west` |
| `routes`    | string[]      | Selected route codes (`[]` = all)                   |
| `carriers`  | string[]      | Selected carrier IDs (`[]` = all)                   |

**DateRange:**

| Field    | Type            | Description                      |
|----------|-----------------|----------------------------------|
| `preset` | DateRangePreset | `today / yesterday / 7d / 30d / month / custom` |
| `from`   | Date            | Start of range (always set)      |
| `to`     | Date            | End of range (always set)        |

---

## 2. Region Mapping

### 2.1 Route Code → Region (`routeOriginRegion`)

Splits `routeCode` on `-`, takes the first segment, maps to region:

| Code Prefix | Region  |
|-------------|---------|
| DEL, LKO, JAI, CHD | north |
| MUM, PUN, AMD, SUR | west  |
| BLR, HYD, CHE, KOC | south |
| KOL, PAT, BHU, GUW | east  |

> **Note:** Route codes in `RT-XXX-YYY-NN` format will return `''` (unmatched) because the first segment is `RT`.

### 2.2 City Name → Region (`cityRegion`)

Regex-based mapping:

| Cities                                                    | Region |
|-----------------------------------------------------------|--------|
| delhi, lucknow, jaipur, chandigarh, amritsar, ludhiana    | north  |
| bangalore, bengaluru, chennai, hyderabad, kochi, coimbatore | south |
| kolkata, patna, bhubaneswar, guwahati                     | east   |
| mumbai, ahmedabad, pune, surat, nagpur, indore             | west   |

---

## 3. Enumeration Reference

### 3.1 `DispatchStatus`

| Value        | Colour Token            | Meaning                              |
|--------------|-------------------------|--------------------------------------|
| `planned`    | `#6B7280` (gray)        | Created, not yet ready               |
| `ready`      | `#8B5CF6` (violet)      | Vehicle and documents confirmed      |
| `dispatched` | `#2563EB` (blue)        | Gate-out done, departed origin       |
| `transit`    | `#0891B2` (cyan)        | En route                             |
| `arrived`    | `#D97706` (amber)       | Reached destination, awaiting dock   |
| `unloading`  | `#EA580C` (orange)      | Active unloading in progress         |
| `reconciled` | `#16A34A` (green)       | Delivery confirmed, HUs matched      |
| `closed`     | `#9CA3AF` (cool gray)   | Fully closed, no further action      |

### 3.2 `VehicleType`

| Value     | Description                        |
|-----------|------------------------------------|
| `FTL`     | Full Truck Load                    |
| `LTL`     | Less Than Truck Load               |
| `LCV`     | Light Commercial Vehicle           |
| `Trailer` | Multi-axle trailer                 |

### 3.3 Exception Categories

| Category              | Description                              |
|-----------------------|------------------------------------------|
| `SLA_BREACH`          | Delivery missed contractual SLA          |
| `VEHICLE_BREAKDOWN`   | Vehicle broke down en route              |
| `DRIVER_ISSUE`        | Driver unavailability or misconduct      |
| `SHORTAGE`            | HU count less than expected on arrival   |
| `DAMAGE`              | Physical damage to goods                 |
| `DELAY_NO_REASON`     | Delayed without communicated reason      |
| `DOCUMENT_MISSING`    | LR, E-waybill, or Invoice not presented  |
| `GATE_HOLD`           | Held at gate due to compliance issue     |
| `ROUTE_DEVIATION`     | Vehicle deviated from planned route      |
| `OVERWEIGHT`          | Actual weight exceeds declared           |

### 3.4 `ExceptionState`

| Value           | Description                              |
|-----------------|------------------------------------------|
| `OPEN`          | Raised, not yet assigned                 |
| `ASSIGNED`      | Assigned to an operator                  |
| `IN_PROGRESS`   | Operator actively working it             |
| `ESCALATED`     | Escalated to manager / head              |
| `PENDING_INFO`  | Waiting on information from carrier      |
| `RESOLVED`      | Resolution applied, pending closure      |
| `CLOSED`        | Fully closed                             |
| `AUTO_RESOLVED` | System automatically resolved            |

### 3.5 `AlertType`

| Value                      | Trigger                                   |
|----------------------------|-------------------------------------------|
| `SLA_BREACH`               | Dispatch exceeded SLA delivery window     |
| `HIGH_RISK`                | Dispatch flagged as high delay risk       |
| `ESCALATED_EXCEPTION`      | Exception escalated to manager level      |
| `OVERDUE_RECONCILIATION`   | Reconciliation not completed within SLA   |
| `INTEGRATION_FAILURE`      | API / system integration error            |

### 3.6 `AckAction`

| Value               | Description                              |
|---------------------|------------------------------------------|
| `carrier_escalated` | Escalated issue to carrier ops team      |
| `alternate_vehicle` | Arranged alternate vehicle               |
| `route_changed`     | Rerouted the dispatch                    |
| `delivery_replanned`| Replanned delivery window with customer  |
| `driver_contacted`  | Directly contacted the driver            |
| `hub_escalated`     | Escalated to hub manager                 |
| `customer_escalated`| Informed and escalated to customer       |
| `monitoring_only`   | Acknowledged, monitoring situation       |

### 3.7 `EscalationLevel`

| Value              | Threshold  | Label              |
|--------------------|------------|--------------------|
| `regional_manager` | ≥ 120 mins | Regional Manager   |
| `transport_head`   | ≥ 240 mins | Transport Head     |
| `control_tower`    | ≥ 480 mins | Control Tower      |

### 3.8 `RouteGrade`

| Grade | Composite Score Range | Colour   |
|-------|-----------------------|----------|
| A     | 90–100                | `#16A34A` (green) |
| B     | 75–89                 | `#2563EB` (blue)  |
| C     | 60–74                 | `#D97706` (amber) |
| D     | 45–59                 | `#EA580C` (orange)|
| F     | 0–44                  | `#DC2626` (red)   |

### 3.9 `SeverityLevel`

| Value      | Use                                    |
|------------|----------------------------------------|
| `critical` | Immediate action required              |
| `high`     | Action required within hours           |
| `medium`   | Should be resolved same day            |
| `low`      | Informational, no urgency              |
| `info`     | Non-actionable system notification     |

### 3.10 `DateRangePreset`

| Value       | Range                      |
|-------------|----------------------------|
| `today`     | Midnight today → now        |
| `yesterday` | Full previous day           |
| `7d`        | Last 7 days (default)       |
| `30d`       | Last 30 days                |
| `month`     | First of current month → now|
| `custom`    | User-specified from/to      |

### 3.11 `VehicleAvailability`

| Value         | Description                         |
|---------------|-------------------------------------|
| `available`   | Ready for assignment                |
| `loading`     | Currently being loaded              |
| `in_transit`  | En route on an active dispatch      |
| `maintenance` | Under repair / service              |
| `reserved`    | Pre-assigned to future dispatch     |

---

## 4. KPI Thresholds

| KPI                | Healthy     | Warning     | Danger      |
|--------------------|-------------|-------------|-------------|
| OTD %              | ≥ 90%       | 75–89%      | < 75%       |
| OTA %              | ≥ 90%       | 75–89%      | < 75%       |
| SLA Compliance %   | ≥ 90%       | 75–89%      | < 75%       |
| Open Exceptions    | 0           | 1–5         | > 5         |
| Vehicle Util %     | ≥ 70%       | 50–69%      | < 50%       |
| Cost / Dispatch    | ≤ ₹3,000    | ₹3,001–5,000| > ₹5,000    |
