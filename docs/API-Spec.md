# API Specification
## Transport Control Tower (TCT)

**Version:** 3.0 — Source-Verified Technical Blueprint
**Last Updated:** 2026-06-19

---

> **IMPORTANT — Current System State**
>
> The Transport Control Tower v1.3.0 has **no backend API**. All data is served from TypeScript in-memory arrays in `src/pages/<module>/mock/data.ts`. No HTTP requests are made at runtime.
>
> This document defines the **planned API contracts** that the backend must implement when Phase 1 (Backend Integration — see `docs/Future-Roadmap.md`) is executed. Every endpoint, payload shape, and field name is derived directly from the TypeScript interfaces already used in the frontend. When real endpoints are live, each `mock/data.ts` file will be deleted and replaced by a query hook pointing at these contracts.
>
> **Authentication:** All endpoints will require a `Bearer` JWT token in the `Authorization` header. This is not yet enforced in v1.3.0 (no auth layer exists). The token will carry a `userId`, `role`, and `region` claim. Role and region enforcement are listed per endpoint below.
>
> **Common Request Headers (all endpoints):**
> ```
> Authorization: Bearer <jwt>
> Content-Type: application/json
> Accept: application/json
> X-Request-ID: <uuid>           (optional — for correlation)
> ```
>
> **Common Error Response Shape:**
> ```json
> {
>   "error": {
>     "code": "ERR_CODE",
>     "message": "Human-readable description",
>     "details": {}
>   }
> }
> ```

---

## Table of Contents

1. [Global Filter Parameters](#1-global-filter-parameters)
2. [Dispatch Endpoints](#2-dispatch-endpoints)
3. [Dispatch Lifecycle Endpoints](#3-dispatch-lifecycle-endpoints)
4. [Fleet / Operations Endpoints](#4-fleet--operations-endpoints)
5. [Hub Operations Endpoints](#5-hub-operations-endpoints)
6. [Destination Operations Endpoints](#6-destination-operations-endpoints)
7. [Exception Management Endpoints](#7-exception-management-endpoints)
8. [Reconciliation Endpoints](#8-reconciliation-endpoints)
9. [Alert Endpoints](#9-alert-endpoints)
10. [Route Performance Endpoints](#10-route-performance-endpoints)
11. [Carrier Performance Endpoints](#11-carrier-performance-endpoints)
12. [Executive CT / KPI Endpoints](#12-executive-ct--kpi-endpoints)
13. [Master Data Endpoints](#13-master-data-endpoints)
14. [Authentication Endpoints](#14-authentication-endpoints)
15. [Common Error Code Reference](#15-common-error-code-reference)

---

## 1. Global Filter Parameters

All list and KPI endpoints accept the following query parameters. These map directly to the `GlobalFilters` state managed by `FilterContext`.

| Parameter | Type | Default | Description |
|---|---|---|---|
| `region` | `string` | `''` (all) | One of `'north'`, `'south'`, `'east'`, `'west'`; empty = all |
| `datePreset` | `string` | `'7d'` | One of `today`, `yesterday`, `7d`, `30d`, `month`, `custom` |
| `from` | `string` (ISO 8601) | 7 days ago | Start of date window; required if `datePreset=custom` |
| `to` | `string` (ISO 8601) | now | End of date window; required if `datePreset=custom` |
| `routes` | `string[]` | `[]` | Route code filter (comma-separated or repeated param); empty = all |
| `carriers` | `string[]` | `[]` | Carrier name filter; empty = all |
| `page` | `number` | `1` | 1-indexed page number |
| `pageSize` | `number` | `50` | Records per page (max 200) |
| `sort` | `string` | endpoint-specific | Field name to sort by |
| `sortDir` | `'asc' \| 'desc'` | `'desc'` | Sort direction |

---

## 2. Dispatch Endpoints

### 2.1 List Dispatches

**Endpoint Name:** List Dispatches
**Method:** `GET /api/v1/dispatches`
**Description:** Returns paginated dispatch records, used by DispatchWorkbench KPI bar and board tabs.

**Request Payload (query params):**
```
GET /api/v1/dispatches?region=north&datePreset=7d&page=1&pageSize=50&status=dispatched,transit
```

| Param | Type | Required | Description |
|---|---|---|---|
| `region` | `string` | No | Filter by route origin region |
| `from` | ISO 8601 | No | Filter by `plannedDeparture >= from` |
| `to` | ISO 8601 | No | Filter by `plannedDeparture <= to` |
| `status` | `string` | No | Comma-separated `DispatchStatus` values |
| `slaStatus` | `string` | No | `ok`, `at-risk`, `breached` |
| `carrier` | `string` | No | Carrier name (exact or partial match) |
| `routeCode` | `string` | No | Exact route code |

**Response Payload:**
```json
{
  "data": [
    {
      "id": "D-48218",
      "status": "transit",
      "routeCode": "MUM-DEL-07",
      "routeName": "Mumbai → Delhi FTL",
      "origin": "Mumbai Hub",
      "destination": "Delhi Hub",
      "vehicleReg": "MH-04-AB-1234",
      "carrier": "Patel Transport Co.",
      "plannedDeparture": "2026-06-12T06:00:00.000Z",
      "plannedArrival": "2026-06-13T08:00:00.000Z",
      "actualDeparture": "2026-06-12T06:45:00.000Z",
      "actualArrival": null,
      "huCount": 24,
      "exceptionCount": 1,
      "slaStatus": "at-risk",
      "slaHoursRemaining": 2.5,
      "slaHoursOverdue": null
    }
  ],
  "pagination": {
    "page": 1,
    "pageSize": 50,
    "total": 248,
    "totalPages": 5
  },
  "kpi": {
    "total": 248,
    "inTransit": 87,
    "slaAtRisk": 12,
    "slaBreached": 3,
    "openExceptions": 37
  }
}
```

**Authentication Requirement:** Required. Role: `operator`, `manager`, `control_tower`, `admin`.

**Error Codes:**

| Code | HTTP | Description |
|---|---|---|
| `ERR_INVALID_STATUS` | 400 | `status` contains unrecognised `DispatchStatus` value |
| `ERR_INVALID_DATE_RANGE` | 400 | `from` after `to` |
| `ERR_UNAUTHORIZED` | 401 | Missing or expired JWT |
| `ERR_FORBIDDEN` | 403 | Role does not have read access to dispatches |
| `ERR_INTERNAL` | 500 | Unexpected server error |

---

### 2.2 Get Dispatch Detail

**Endpoint Name:** Get Dispatch Detail
**Method:** `GET /api/v1/dispatches/:id`
**Description:** Full detail for a single dispatch, used by DispatchDetails L3 drawer and `/dispatch/:id` route.

**Request Payload:** None (`:id` is path param, e.g. `D-48218`)

**Response Payload:**
```json
{
  "data": {
    "id": "D-48218",
    "status": "transit",
    "routeCode": "MUM-DEL-07",
    "routeName": "Mumbai → Delhi FTL",
    "origin": "Mumbai Hub",
    "destination": "Delhi Hub",
    "vehicleReg": "MH-04-AB-1234",
    "carrier": "Patel Transport Co.",
    "plannedDeparture": "2026-06-12T06:00:00.000Z",
    "plannedArrival": "2026-06-13T08:00:00.000Z",
    "actualDeparture": "2026-06-12T06:45:00.000Z",
    "actualArrival": null,
    "huCount": 24,
    "exceptionCount": 1,
    "slaStatus": "at-risk",
    "slaHoursRemaining": 2.5,
    "slaHoursOverdue": null
  }
}
```

**Authentication Requirement:** Required. Same role set as §2.1.

**Error Codes:**

| Code | HTTP | Description |
|---|---|---|
| `ERR_NOT_FOUND` | 404 | No dispatch with given `id` |
| `ERR_UNAUTHORIZED` | 401 | Missing or expired JWT |

---

### 2.3 Get Chain of Custody

**Endpoint Name:** Get Chain of Custody
**Method:** `GET /api/v1/dispatches/:id/custody`
**Description:** Ordered list of custody transfer events for a dispatch, used by `/dispatch/:id/custody` route.
**Note:** The router registers `/dispatch/:id/custody` before `/dispatch/:id` so the word `custody` is not captured as an id.

**Response Payload:**
```json
{
  "data": {
    "dispatchId": "D-48218",
    "events": [
      {
        "stage": "gate_out_origin",
        "at": "2026-06-12T06:45:00.000Z",
        "actor": "Gate Officer - Ramesh Kumar",
        "location": "Mumbai Hub Gate 3",
        "huCount": 24,
        "notes": null
      }
    ]
  }
}
```

**Authentication Requirement:** Required.

**Error Codes:** `ERR_NOT_FOUND` (404), `ERR_UNAUTHORIZED` (401).

---

## 3. Dispatch Lifecycle Endpoints

### 3.1 List Lifecycle Records

**Endpoint Name:** List Dispatch Lifecycle Records
**Method:** `GET /api/v1/lifecycle`
**Description:** Returns `DispatchTimeline` records for the Dispatch Lifecycle Kanban board (`/lifecycle`). One record per in-flight dispatch.

**Request Payload (query params):** Standard global filter params (§1). Additionally:

| Param | Type | Required | Description |
|---|---|---|---|
| `status` | `LifecycleStatus` | No | Filter by specific stage |
| `phase` | `'origin' \| 'transit' \| 'destination' \| 'complete'` | No | Filter by phase group |
| `slaStatus` | `'on_time' \| 'at_risk' \| 'breached'` | No | SLA health filter |

**Response Payload:**
```json
{
  "data": [
    {
      "id": "LC-001",
      "dispatchId": "DSP-2024-1401",
      "vehicleNumber": "MH-04-AB-1234",
      "carrier": "Patel Transport Co.",
      "routeCode": "MUM-DEL-07",
      "origin": "Mumbai Hub",
      "destination": "Delhi Depot",
      "plannedHUs": 24,
      "status": "in_transit",
      "slaStatus": "on_time",
      "plannedAt": "2026-06-12T00:30:00.000Z",
      "readyAt": "2026-06-12T01:15:00.000Z",
      "gateInOriginAt": "2026-06-12T02:00:00.000Z",
      "loadingStartAt": "2026-06-12T02:30:00.000Z",
      "gateOutOriginAt": "2026-06-12T06:45:00.000Z",
      "dispatchedAt": "2026-06-12T06:50:00.000Z",
      "inTransitAt": "2026-06-12T07:00:00.000Z",
      "arrivedDestAt": null,
      "gateInDestAt": null,
      "dockAssignedAt": null,
      "unloadingStartAt": null,
      "receivedAt": null,
      "reconciledAt": null,
      "closedAt": null,
      "plannedDispatch": "2026-06-12T06:00:00.000Z",
      "plannedArrival": "2026-06-13T08:00:00.000Z",
      "remarks": null
    }
  ],
  "pagination": { "page": 1, "pageSize": 50, "total": 16, "totalPages": 1 },
  "stageCounts": {
    "planned": 1, "ready": 1, "gate_in_origin": 1, "loading": 1,
    "gate_out_origin": 1, "dispatched": 1, "in_transit": 1, "arrived_dest": 1,
    "gate_in_dest": 1, "dock_assigned": 1, "unloading": 1, "received": 1,
    "reconciled": 1, "closed": 1
  }
}
```

**Authentication Requirement:** Required.

**Error Codes:** Standard (§15).

---

### 3.2 Advance Lifecycle Stage

**Endpoint Name:** Advance Dispatch Stage
**Method:** `PATCH /api/v1/lifecycle/:id/advance`
**Description:** Moves a dispatch to the next `LifecycleStatus` stage and records the timestamp.

**Request Payload (JSON body):**
```json
{
  "toStatus": "gate_in_origin",
  "at": "2026-06-12T02:00:00.000Z",
  "actor": "Ramesh Kumar",
  "remarks": "Vehicle arrived 10 min early"
}
```

| Field | Type | Required | Constraint |
|---|---|---|---|
| `toStatus` | `LifecycleStatus` | Yes | Must be exactly one stage ahead of current |
| `at` | ISO 8601 | Yes | Must not be before previous stage timestamp |
| `actor` | `string` | Yes | Operator name or system identifier |
| `remarks` | `string` | No | Optional note |

**Response Payload:**
```json
{
  "data": {
    "id": "LC-001",
    "previousStatus": "ready",
    "currentStatus": "gate_in_origin",
    "gateInOriginAt": "2026-06-12T02:00:00.000Z"
  }
}
```

**Authentication Requirement:** Required. Role: `operator`, `manager`, `admin`.

**Error Codes:**

| Code | HTTP | Description |
|---|---|---|
| `ERR_NOT_FOUND` | 404 | Lifecycle record not found |
| `ERR_INVALID_STAGE_TRANSITION` | 400 | `toStatus` is not the next stage after current |
| `ERR_TIMESTAMP_BEFORE_PREVIOUS` | 400 | `at` is earlier than the previous stage timestamp |
| `ERR_UNAUTHORIZED` | 401 | — |
| `ERR_FORBIDDEN` | 403 | Role cannot advance lifecycle |

---

## 4. Fleet / Operations Endpoints

### 4.1 List Fleet Vehicles

**Endpoint Name:** List Fleet Vehicles
**Method:** `GET /api/v1/operations/fleet`
**Description:** Live fleet board with vehicle positions, speed, progress, and alerts. Used by Operations CT (`/operations`).

**Request Payload (query params):**

| Param | Type | Required | Description |
|---|---|---|---|
| `region` | `string` | No | Filters by `cityRegion(vehicle.origin)` |
| `from` | ISO 8601 | No | Filters by `plannedDeparture >= from` |
| `to` | ISO 8601 | No | Filters by `etaAt <= to` |
| `status` | `VehicleStatus` | No | `in-transit`, `halted`, `delayed`, `arrived`, `idle` |
| `carrier` | `string` | No | Carrier name |

**Response Payload:**
```json
{
  "data": [
    {
      "id": "V-001",
      "dispatchId": "D-48218",
      "vehicleReg": "MH-04-AB-1234",
      "driverName": "Ramesh Kumar",
      "carrier": "Patel Transport Co.",
      "routeCode": "RT-MUM-DEL-07",
      "origin": "Mumbai",
      "destination": "Delhi",
      "status": "in-transit",
      "currentLocation": "Nashik Bypass",
      "progressPct": 35,
      "speedKmh": 68,
      "etaAt": "2026-06-13T09:30:00.000Z",
      "delayMinutes": 90,
      "fuelPct": 62,
      "lastPingAt": "2026-06-12T08:00:00.000Z",
      "alerts": ["Stationary 3h+"]
    }
  ],
  "pagination": { "page": 1, "pageSize": 50, "total": 12, "totalPages": 1 },
  "kpi": {
    "inTransit": 6,
    "delayed": 2,
    "halted": 2,
    "arrived": 1,
    "idle": 1
  }
}
```

**Authentication Requirement:** Required.

**Error Codes:** Standard (§15).

---

### 4.2 List SLA Watch Records

**Endpoint Name:** List SLA Watch
**Method:** `GET /api/v1/operations/sla-watch`
**Description:** Returns only dispatches currently `at-risk` or `breached` on SLA. Used by the SLA Watch tab in Operations CT.

**Request Payload (query params):** `region`, `from`, `to`, `slaStatus` (`at-risk` | `breached`).

**Response Payload:**
```json
{
  "data": [
    {
      "dispatchId": "D-48291",
      "routeCode": "RT-MUM-BLR-04",
      "carrier": "Blue Dart Express",
      "origin": "Mumbai",
      "destination": "Bangalore",
      "slaStatus": "breached",
      "hoursRemaining": null,
      "hoursOverdue": 2.25,
      "plannedArrival": "2026-06-12T06:00:00.000Z",
      "vehicleReg": "MH-09-ZZ-4488"
    }
  ],
  "counts": { "atRisk": 2, "breached": 2 }
}
```

**Authentication Requirement:** Required.

**Error Codes:** Standard (§15).

---

### 4.3 List Hub Events

**Endpoint Name:** List Hub Events
**Method:** `GET /api/v1/operations/hub-events`
**Description:** Arrival and departure events at all hubs. Used by Hub Activity tab in Operations CT.

**Request Payload (query params):** `region`, `from`, `to`, `hub`, `type` (`arrival` | `departure`), `status` (`on-time` | `delayed` | `early` | `pending`).

**Response Payload:**
```json
{
  "data": [
    {
      "id": "HE-01",
      "hub": "Mumbai Hub",
      "type": "arrival",
      "dispatchId": "D-48218",
      "vehicleReg": "MH-04-AB-1234",
      "carrier": "Patel Transport Co.",
      "scheduledAt": "2026-06-12T08:00:00.000Z",
      "actualAt": "2026-06-12T08:25:00.000Z",
      "status": "delayed",
      "delayMinutes": 25
    }
  ],
  "pagination": { "page": 1, "pageSize": 50, "total": 12, "totalPages": 1 }
}
```

**Authentication Requirement:** Required.

**Error Codes:** Standard (§15).

---

## 5. Hub Operations Endpoints

### 5.1 List Hub Vehicles

**Endpoint Name:** List Hub Vehicles (Origin Ops)
**Method:** `GET /api/v1/hub-ops/vehicles`
**Description:** Returns `HubVehicle` records for the Origin Hub Operations board (`/hub-ops`).

**Request Payload (query params):** Standard global filter params plus:

| Param | Type | Required | Description |
|---|---|---|---|
| `status` | `HubStatus` | No | `arrived`, `gate_in`, `loading`, `loaded`, `gate_out`, `dispatched` |
| `priority` | `PriorityLevel` | No | `normal`, `urgent`, `delayed` |
| `hub` | `string` | No | Hub city code (e.g. `DEL`, `MUM`) |

**Response Payload:**
```json
{
  "data": [
    {
      "id": "HV-001",
      "vehicleNumber": "MH-04-AB-1234",
      "vehicleType": "FTL",
      "carrier": "Patel Transport Co.",
      "driverName": "Ramesh Kumar",
      "driverMobile": "9876543210",
      "routeCode": "MUM-DEL-FTL",
      "origin": "Mumbai Hub",
      "destination": "Delhi Depot",
      "plannedHUs": 24,
      "loadedHUs": 18,
      "weightKg": 4200,
      "status": "loading",
      "priority": "normal",
      "arrivedAt": "2026-06-12T02:00:00.000Z",
      "gateInAt": "2026-06-12T02:20:00.000Z",
      "loadingStartAt": "2026-06-12T02:35:00.000Z",
      "loadingCompleteAt": null,
      "gateOutAt": null,
      "dispatchedAt": null,
      "plannedDeparture": "2026-06-12T06:00:00.000Z",
      "remarks": null
    }
  ],
  "pagination": { "page": 1, "pageSize": 50, "total": 13, "totalPages": 1 },
  "statusCounts": {
    "arrived": 2, "gate_in": 2, "loading": 3, "loaded": 2, "gate_out": 2, "dispatched": 2
  }
}
```

**Authentication Requirement:** Required. Role: `operator`, `hub_manager`, `manager`, `admin`.

**Error Codes:** Standard (§15).

---

### 5.2 Update Hub Vehicle Stage

**Endpoint Name:** Advance Hub Vehicle Stage
**Method:** `PATCH /api/v1/hub-ops/vehicles/:id/stage`
**Description:** Records a gate event (gate-in, loading start, loading complete, gate-out, dispatched).

**Request Payload (JSON body):**
```json
{
  "toStatus": "loading",
  "at": "2026-06-12T02:35:00.000Z",
  "actor": "Hub Operator - Suresh",
  "loadedHUs": 0
}
```

| Field | Type | Required | Description |
|---|---|---|---|
| `toStatus` | `HubStatus` | Yes | Next status (must follow `STATUS_ORDER`) |
| `at` | ISO 8601 | Yes | Timestamp of the event |
| `actor` | `string` | Yes | Operator or system |
| `loadedHUs` | `number` | No | Required when `toStatus = 'loading'` or `'loaded'`; final scan count when `'loaded'` |

**Response Payload:**
```json
{
  "data": {
    "id": "HV-001",
    "previousStatus": "gate_in",
    "currentStatus": "loading",
    "loadingStartAt": "2026-06-12T02:35:00.000Z"
  }
}
```

**Authentication Requirement:** Required. Role: `operator`, `hub_manager`, `admin`.

**Error Codes:**

| Code | HTTP | Description |
|---|---|---|
| `ERR_NOT_FOUND` | 404 | Vehicle not found |
| `ERR_INVALID_STAGE_TRANSITION` | 400 | `toStatus` does not follow `STATUS_ORDER` |
| `ERR_MISSING_LOADED_HUS` | 400 | `loadedHUs` required for `loaded` transition |

---

## 6. Destination Operations Endpoints

### 6.1 List Destination Vehicles

**Endpoint Name:** List Destination Vehicles
**Method:** `GET /api/v1/dest-ops/vehicles`
**Description:** Returns `DestVehicle` records for Destination Operations board (`/dest-ops`).

**Request Payload (query params):** Standard global filter params plus:

| Param | Type | Required | Description |
|---|---|---|---|
| `status` | `DestStatus` | No | Any of the 9 destination stages |
| `priority` | `DestPriorityLevel` | No | `normal`, `urgent`, `sla_breach` |
| `hub` | `string` | No | Destination hub city code |
| `dockNumber` | `string` | No | e.g. `D-04` |

**Response Payload:**
```json
{
  "data": [
    {
      "id": "DV-001",
      "vehicleNumber": "MH-04-AB-1234",
      "vehicleType": "FTL",
      "carrier": "Patel Transport Co.",
      "driverName": "Ramesh Kumar",
      "driverMobile": "9876543210",
      "routeCode": "MUM-DEL-FTL",
      "origin": "Mumbai",
      "destination": "Delhi",
      "dockNumber": "D-04",
      "plannedHUs": 24,
      "receivedHUs": 23,
      "damagedHUs": 0,
      "shortHUs": 1,
      "weightKg": 4150,
      "priority": "normal",
      "status": "unloading",
      "departedOriginAt": "2026-06-12T06:45:00.000Z",
      "arrivedAt": "2026-06-13T08:10:00.000Z",
      "gateInAt": "2026-06-13T08:20:00.000Z",
      "dockAssignedAt": "2026-06-13T08:35:00.000Z",
      "unloadingStartAt": "2026-06-13T08:45:00.000Z",
      "unloadingCompleteAt": null,
      "receiptConfirmedAt": null,
      "reconciledAt": null,
      "closedAt": null,
      "plannedArrival": "2026-06-13T08:00:00.000Z",
      "exceptionCount": 1,
      "remarks": null
    }
  ],
  "pagination": { "page": 1, "pageSize": 50, "total": 15, "totalPages": 1 },
  "statusCounts": {
    "in_transit": 3, "arrived": 2, "gate_in": 1, "dock_assigned": 2,
    "unloading": 2, "unloaded": 1, "receipt_confirmed": 1, "reconciled": 2, "closed": 1
  }
}
```

**Authentication Requirement:** Required. Role: `operator`, `dest_manager`, `manager`, `admin`.

**Error Codes:** Standard (§15).

---

### 6.2 Assign Dock

**Endpoint Name:** Assign Dock to Destination Vehicle
**Method:** `PATCH /api/v1/dest-ops/vehicles/:id/dock`
**Description:** Assigns a dock bay to an arrived vehicle and advances status to `dock_assigned`.

**Request Payload (JSON body):**
```json
{
  "dockNumber": "D-04",
  "at": "2026-06-13T08:35:00.000Z",
  "actor": "Dock Supervisor - Anita"
}
```

| Field | Type | Required | Constraint |
|---|---|---|---|
| `dockNumber` | `string` | Yes | Must be one of `D-01` through `D-10` |
| `at` | ISO 8601 | Yes | Must be after `arrivedAt` |
| `actor` | `string` | Yes | Operator name |

**Authentication Requirement:** Required.

**Error Codes:**

| Code | HTTP | Description |
|---|---|---|
| `ERR_DOCK_OCCUPIED` | 409 | Dock already assigned to another vehicle currently unloading |
| `ERR_INVALID_DOCK` | 400 | `dockNumber` not in valid range |
| `ERR_INVALID_STATUS` | 400 | Vehicle not in `arrived` status |

---

### 6.3 Update Received HU Count

**Endpoint Name:** Update HU Count at Destination
**Method:** `PATCH /api/v1/dest-ops/vehicles/:id/hu-count`
**Description:** Records the physical HU count at destination (barcode scan result).

**Request Payload (JSON body):**
```json
{
  "receivedHUs": 23,
  "damagedHUs": 0,
  "shortHUs": 1,
  "at": "2026-06-13T09:30:00.000Z",
  "actor": "Warehouse Staff - Mohan"
}
```

**Response Payload:**
```json
{
  "data": {
    "id": "DV-001",
    "plannedHUs": 24,
    "receivedHUs": 23,
    "damagedHUs": 0,
    "shortHUs": 1,
    "huVariance": -1
  }
}
```

**Note:** `huVariance = receivedHUs - plannedHUs`. Negative = shortage; positive = extra.

**Authentication Requirement:** Required.

**Error Codes:** `ERR_NOT_FOUND` (404), `ERR_INVALID_STATUS` (400 — must be in `unloading` or `unloaded`).

---

## 7. Exception Management Endpoints

### 7.1 List Exceptions

**Endpoint Name:** List Exceptions
**Method:** `GET /api/v1/exceptions`
**Description:** Returns `FullException` records for the Exception Board (`/exceptions`). Supports tab-based filtering.

**Request Payload (query params):** Standard global filter params plus:

| Param | Type | Required | Description |
|---|---|---|---|
| `status` | `ExceptionState` | No | Comma-separated; `OPEN,ASSIGNED,PENDING_INFO` = "Open" tab |
| `severity` | `SeverityLevel` | No | Comma-separated |
| `category` | `string` | No | Exception category (e.g. `SLA Breach`) |
| `assignee` | `string` | No | Operator name |
| `dispatchId` | `string` | No | Filter to exceptions for a single dispatch |

**Response Payload:**
```json
{
  "data": [
    {
      "id": "EXC-2024-0891",
      "category": "SLA Breach",
      "subcategory": null,
      "severity": "critical",
      "status": "ESCALATED",
      "dispatchId": "D-48218",
      "routeCode": "MUM-DEL-07",
      "routeName": "Mumbai to Delhi FTL",
      "carrier": "Patel Transport Co.",
      "vehicleReg": "MH-04-AB-1234",
      "origin": "Mumbai",
      "destination": "Delhi",
      "raisedAt": "2026-06-12T08:00:00.000Z",
      "raisedBy": "SLA Engine",
      "assignee": "Priya Sharma",
      "assigneeTeam": "Operations",
      "escalationLevel": 2,
      "slaBreachAt": "2026-06-12T12:00:00.000Z",
      "resolvedAt": null,
      "resolutionTime": null,
      "rootCause": null,
      "resolutionNote": null,
      "comments": [
        {
          "id": "c1",
          "author": "SLA Engine",
          "text": "Auto-raised: SLA breach predicted in < 4 hours.",
          "at": "2026-06-12T08:00:00.000Z",
          "type": "system"
        }
      ],
      "financialImpact": 15000,
      "tags": ["sla", "high-value"]
    }
  ],
  "pagination": { "page": 1, "pageSize": 50, "total": 12, "totalPages": 1 },
  "kpi": {
    "totalOpen": 9,
    "critical": 3,
    "escalated": 3,
    "avgResolutionH": 4.2,
    "financialImpact": 187500
  }
}
```

**Authentication Requirement:** Required.

**Error Codes:** Standard (§15).

---

### 7.2 Raise Exception

**Endpoint Name:** Raise Exception
**Method:** `POST /api/v1/exceptions`
**Description:** Creates a new exception record from the "Raise Exception" modal.

**Request Payload (JSON body):**
```json
{
  "category": "SLA Breach",
  "subcategory": "Delay > 4h",
  "severity": "high",
  "dispatchId": "D-48218",
  "routeCode": "MUM-DEL-07",
  "carrier": "Patel Transport Co.",
  "vehicleReg": "MH-04-AB-1234",
  "origin": "Mumbai",
  "destination": "Delhi",
  "financialImpact": 12000,
  "tags": ["sla"]
}
```

| Field | Type | Required | Description |
|---|---|---|---|
| `category` | `string` | Yes | Exception category |
| `severity` | `SeverityLevel` | Yes | `critical`, `high`, `medium`, `low`, `info` |
| `dispatchId` | `string` | Yes | FK to active dispatch |
| `routeCode` | `string` | Yes | Route code |
| `origin` | `string` | Yes | Origin city |
| `destination` | `string` | Yes | Destination city |
| `subcategory` | `string` | No | Sub-type detail |
| `financialImpact` | `number` | No | Estimated INR impact |
| `tags` | `string[]` | No | Classification labels |

**Response Payload:**
```json
{
  "data": {
    "id": "EXC-2024-0901",
    "status": "OPEN",
    "raisedAt": "2026-06-19T10:00:00.000Z",
    "raisedBy": "Shashank Zode"
  }
}
```

**Authentication Requirement:** Required. Role: any authenticated user.

**Error Codes:**

| Code | HTTP | Description |
|---|---|---|
| `ERR_INVALID_CATEGORY` | 400 | `category` not in allowed list |
| `ERR_INVALID_SEVERITY` | 400 | `severity` not a valid `SeverityLevel` |
| `ERR_DISPATCH_NOT_FOUND` | 404 | `dispatchId` not found |

---

### 7.3 Assign Exception

**Endpoint Name:** Assign Exception
**Method:** `PATCH /api/v1/exceptions/:id/assign`
**Description:** Assigns an exception to an operator and transitions status to `ASSIGNED`.

**Request Payload (JSON body):**
```json
{
  "assignee": "Priya Sharma",
  "assigneeTeam": "Operations"
}
```

**Response Payload:**
```json
{
  "data": {
    "id": "EXC-2024-0891",
    "status": "ASSIGNED",
    "assignee": "Priya Sharma",
    "assigneeTeam": "Operations"
  }
}
```

**Authentication Requirement:** Required. Role: `manager`, `control_tower`, `admin`.

**Error Codes:** `ERR_NOT_FOUND` (404), `ERR_INVALID_STATUS` (400 — cannot assign a `RESOLVED` or `CLOSED` exception).

---

### 7.4 Resolve Exception

**Endpoint Name:** Resolve Exception
**Method:** `PATCH /api/v1/exceptions/:id/resolve`
**Description:** Closes an exception with root cause and resolution note.

**Request Payload (JSON body):**
```json
{
  "rootCause": "Vehicle breakdown due to tyre burst on NH48",
  "resolutionNote": "Replacement vehicle dispatched; ETA 3 hours",
  "resolvedAt": "2026-06-13T14:00:00.000Z"
}
```

**Response Payload:**
```json
{
  "data": {
    "id": "EXC-2024-0891",
    "status": "RESOLVED",
    "resolvedAt": "2026-06-13T14:00:00.000Z",
    "resolutionTime": 360
  }
}
```

**Note:** `resolutionTime` = minutes between `raisedAt` and `resolvedAt`, computed server-side.

**Authentication Requirement:** Required. Role: `operator`, `manager`, `admin`.

**Error Codes:** `ERR_NOT_FOUND` (404), `ERR_ALREADY_RESOLVED` (409).

---

### 7.5 Add Exception Comment

**Endpoint Name:** Add Exception Comment
**Method:** `POST /api/v1/exceptions/:id/comments`

**Request Payload (JSON body):**
```json
{
  "author": "Shashank Zode",
  "text": "Confirmed with carrier; replacement vehicle en route.",
  "type": "note"
}
```

| Field | Type | Required | Description |
|---|---|---|---|
| `author` | `string` | Yes | Commenter name |
| `text` | `string` | Yes | Comment body (non-empty) |
| `type` | `'note' \| 'escalation' \| 'resolution' \| 'system'` | Yes | Classification |

**Response Payload:**
```json
{
  "data": {
    "id": "c8",
    "author": "Shashank Zode",
    "text": "Confirmed with carrier; replacement vehicle en route.",
    "at": "2026-06-13T10:00:00.000Z",
    "type": "note"
  }
}
```

**Authentication Requirement:** Required.

**Error Codes:** `ERR_NOT_FOUND` (404), `ERR_EMPTY_COMMENT` (400).

---

## 8. Reconciliation Endpoints

### 8.1 List Reconciliation Records

**Endpoint Name:** List Reconciliation Records
**Method:** `GET /api/v1/reconciliation`
**Description:** Returns `ReconciliationRecord` list for the Reconciliation Center (`/reconciliation`).

**Request Payload (query params):** Standard global filter params plus:

| Param | Type | Required | Description |
|---|---|---|---|
| `reconStatus` | `ReconciliationStatus` | No | `pending`, `in_progress`, `discrepancy`, `approved`, `closed` |
| `dispatchId` | `string` | No | Filter to a single dispatch |

**Response Payload:**
```json
{
  "data": [
    {
      "id": "REC-2024-0440",
      "dispatchId": "D-48201",
      "routeCode": "MUM-DEL-07",
      "routeName": "Mumbai to Delhi FTL",
      "carrier": "Patel Transport Co.",
      "origin": "Mumbai",
      "destination": "Delhi",
      "arrivedAt": "2026-06-10T08:00:00.000Z",
      "reconStatus": "discrepancy",
      "huLoaded": 24,
      "huArrived": 23,
      "huDamaged": 0,
      "huMissing": 1,
      "huExtra": 0,
      "weightLoaded": 4200,
      "weightArrived": 4100,
      "freightCost": 45000,
      "discrepancies": [
        {
          "huCode": "HU-A-001",
          "type": "missing",
          "description": "HU missing at destination; not found in transit records",
          "financialImpact": 8500,
          "status": "open"
        }
      ],
      "reconBy": "Warehouse Staff",
      "approvedBy": null,
      "approvedAt": null,
      "signedOffAt": null,
      "notes": null
    }
  ],
  "pagination": { "page": 1, "pageSize": 50, "total": 9, "totalPages": 1 },
  "kpi": {
    "pending": 3,
    "inProgress": 1,
    "discrepancy": 2,
    "closed": 3,
    "financialImpact": 47500
  }
}
```

**Note on `kpi.closed`:** Counts both `'approved'` and `'closed'` status values combined.

**Authentication Requirement:** Required.

**Error Codes:** Standard (§15).

---

### 8.2 Update Reconciliation Status

**Endpoint Name:** Update Reconciliation Status
**Method:** `PATCH /api/v1/reconciliation/:id/status`

**Request Payload (JSON body):**
```json
{
  "reconStatus": "approved",
  "approvedBy": "Finance Manager - Neha",
  "approvedAt": "2026-06-15T11:00:00.000Z",
  "notes": "Shortage claim raised against carrier"
}
```

| Field | Type | Required | Description |
|---|---|---|---|
| `reconStatus` | `ReconciliationStatus` | Yes | New status |
| `reconBy` | `string` | Conditional | Required when transitioning to `in_progress` |
| `approvedBy` | `string` | Conditional | Required when transitioning to `approved` |
| `approvedAt` | ISO 8601 | Conditional | Required when `approvedBy` is provided |
| `signedOffAt` | ISO 8601 | Conditional | Required when transitioning to `closed` |
| `notes` | `string` | No | Free-text notes |

**Authentication Requirement:** Required. Role: `finance`, `manager`, `admin` for `approved`/`closed` transitions.

**Error Codes:** `ERR_NOT_FOUND` (404), `ERR_INVALID_STATUS_TRANSITION` (400).

---

### 8.3 Update HU Discrepancy Status

**Endpoint Name:** Update HU Discrepancy
**Method:** `PATCH /api/v1/reconciliation/:id/discrepancies/:huCode`

**Request Payload (JSON body):**
```json
{
  "status": "accepted",
  "financialImpact": 8500
}
```

| Field | Type | Values | Description |
|---|---|---|---|
| `status` | `string` | `open \| accepted \| disputed \| waived` | New dispute status |
| `financialImpact` | `number` | — | Updated INR impact |

**Authentication Requirement:** Required. Role: `finance`, `manager`, `admin`.

**Error Codes:** `ERR_NOT_FOUND` (404), `ERR_INVALID_DISCREPANCY_STATUS` (400).

---

## 9. Alert Endpoints

### 9.1 List Alerts

**Endpoint Name:** List Alerts
**Method:** `GET /api/v1/alerts`
**Description:** Returns `Alert` records for CT Alerts page (`/alerts`) and populates the GlobalAlertRail.

**Request Payload (query params):** Standard global filter params plus:

| Param | Type | Required | Description |
|---|---|---|---|
| `type` | `AlertType` | No | `SLA_BREACH`, `HIGH_RISK`, `ESCALATED_EXCEPTION`, `OVERDUE_RECONCILIATION`, `INTEGRATION_FAILURE` |
| `severity` | `string` | No | `critical`, `high`, `medium` |
| `acknowledged` | `boolean` | No | `true` = acknowledged only; `false` = unacknowledged only |

**Response Payload:**
```json
{
  "data": [
    {
      "id": "ALT-001",
      "type": "SLA_BREACH",
      "severity": "critical",
      "message": "SLA breach imminent — MUM-DEL-07 delayed 5h beyond committed window",
      "dispatchId": "D-48218",
      "routeCode": "MUM-DEL-07",
      "carrierName": "Patel Transport Co.",
      "delayMins": 300,
      "firedAt": "2026-06-12T10:00:00.000Z",
      "acknowledged": false,
      "ackedAt": null,
      "ackedBy": null,
      "ackAction": null,
      "ackRemarks": null,
      "escalationLevel": "transport_head",
      "closedAt": null
    }
  ],
  "pagination": { "page": 1, "pageSize": 50, "total": 13, "totalPages": 1 },
  "counts": {
    "total": 13,
    "unacknowledged": 9,
    "critical": 5,
    "high": 7,
    "medium": 1
  }
}
```

**Authentication Requirement:** Required.

**Error Codes:** Standard (§15).

---

### 9.2 Acknowledge Alert

**Endpoint Name:** Acknowledge Alert
**Method:** `PATCH /api/v1/alerts/:id/acknowledge`
**Description:** Marks an alert as acknowledged. Used by the AlertModal `AcknowledgeForm`.

**Request Payload (JSON body):**
```json
{
  "action": "alternate_vehicle",
  "remarks": "Arranged backup MH-12-XY-5678 via Patel Transport",
  "ackedBy": "Shashank Zode"
}
```

| Field | Type | Required | Description |
|---|---|---|---|
| `action` | `AckAction` | Yes | One of 8 values: `carrier_escalated`, `alternate_vehicle`, `route_changed`, `delivery_replanned`, `driver_contacted`, `hub_escalated`, `customer_escalated`, `monitoring_only` |
| `remarks` | `string` | Yes | Free-text notes (non-empty) |
| `ackedBy` | `string` | No | Operator name; defaults to authenticated user name from JWT |

**Response Payload:**
```json
{
  "data": {
    "id": "ALT-001",
    "acknowledged": true,
    "ackedAt": "2026-06-19T10:15:00.000Z",
    "ackedBy": "Shashank Zode",
    "ackAction": "alternate_vehicle",
    "ackRemarks": "Arranged backup MH-12-XY-5678 via Patel Transport"
  }
}
```

**Authentication Requirement:** Required.

**Error Codes:**

| Code | HTTP | Description |
|---|---|---|
| `ERR_ALREADY_ACKNOWLEDGED` | 409 | Alert already has `acknowledged = true` |
| `ERR_INVALID_ACTION` | 400 | `action` not a valid `AckAction` value |
| `ERR_EMPTY_REMARKS` | 400 | `remarks` is empty string |
| `ERR_NOT_FOUND` | 404 | Alert id not found |

---

### 9.3 Add Alert (System Push)

**Endpoint Name:** Add Alert
**Method:** `POST /api/v1/alerts`
**Description:** System-generated alert endpoint; called by the SLA Engine, GPS system, or integration layer when a threshold is crossed.

**Request Payload (JSON body):**
```json
{
  "id": "ALT-014",
  "type": "SLA_BREACH",
  "severity": "critical",
  "message": "D-48320 breached SLA by 6 hours",
  "dispatchId": "D-48320",
  "routeCode": "BLR-MUM-05",
  "carrierName": "VRL Logistics",
  "delayMins": 360,
  "firedAt": "2026-06-19T09:00:00.000Z"
}
```

**Auto-computed server-side:**
- `escalationLevel` derived from `delayMins`: `>= 480` → `'control_tower'`; `>= 240` → `'transport_head'`; `>= 120` → `'regional_manager'`; else `undefined`
- `acknowledged = false`, `ackedAt = null`, `closedAt = null`

**Deduplication:** If `id` already exists, the existing record is kept unchanged (no update, no error).

**Response Payload:**
```json
{
  "data": { "id": "ALT-014", "created": true }
}
```

**Authentication Requirement:** Required. Role: `system` (service-to-service token).

**Error Codes:** `ERR_DUPLICATE_ALERT` (409), `ERR_INVALID_TYPE` (400), `ERR_INVALID_SEVERITY` (400).

---

### 9.4 Get Alert Analytics

**Endpoint Name:** Get Alert Analytics
**Method:** `GET /api/v1/alerts/analytics`
**Description:** Returns computed analytics for CT Alerts tabs: top delay routes, top delay carriers, chronic lanes, recovery stats, closure SLA.

**Request Payload (query params):** `region`, `from`, `to`.

**Response Payload:**
```json
{
  "topDelayRoutes": [
    {
      "routeCode": "KOL-DEL-001",
      "routeLabel": "Kolkata to Delhi",
      "totalExceptions": 18,
      "avgDelayMins": 342,
      "breachCount": 9,
      "onTimeRate": 62,
      "trend": "worsening"
    }
  ],
  "topDelayCarriers": [
    {
      "carrier": "Fast Move Logistics",
      "totalExceptions": 24,
      "avgDelayMins": 285,
      "breachCount": 11,
      "slaScore": 52,
      "trend": "stable"
    }
  ],
  "chronicLanes": [
    {
      "routeCode": "KOL-DEL-001",
      "carrier": "Fast Move Logistics",
      "breachesLast30Days": 9,
      "avgDelayMins": 342,
      "lastBreachAt": "2026-06-18T04:00:00.000Z",
      "status": "critical"
    }
  ],
  "recoveryStats": {
    "avgRecoveryMins": 142,
    "p90RecoveryMins": 310,
    "fastestMins": 18,
    "slowestMins": 720,
    "byAction": [
      { "action": "driver_contacted", "avgMins": 38, "count": 15 }
    ]
  },
  "closureSLA": {
    "totalClosed": 65,
    "closedWithinSla": 48,
    "slaThresholdMins": 240,
    "avgClosureMins": 142,
    "breachedClosure": 17,
    "slaPct": 74
  }
}
```

**Authentication Requirement:** Required.

**Error Codes:** Standard (§15).

---

## 10. Route Performance Endpoints

### 10.1 List Routes

**Endpoint Name:** List Route Performance
**Method:** `GET /api/v1/routes`
**Description:** Returns `RouteDetail` scorecards for Route Performance page (`/routes`). Region filter compares `regionOrigin.toLowerCase()` with the `region` param.

**Request Payload (query params):** Standard global filter params plus:

| Param | Type | Required | Description |
|---|---|---|---|
| `grade` | `RouteGrade` | No | `A`, `B`, `C`, `D`, `F` |

**Response Payload:**
```json
{
  "data": [
    {
      "id": "R-001",
      "routeCode": "DEL-MUM-FTL",
      "routeName": "Delhi to Mumbai FTL Express",
      "origin": "Delhi",
      "destination": "Mumbai",
      "regionOrigin": "North",
      "regionDest": "West",
      "distanceKm": 1414,
      "grade": "A",
      "gradeScore": 91,
      "otaPct": 94,
      "otdPct": 92,
      "slaCompliancePct": 96,
      "avgTransitHours": 26.5,
      "plannedTransitHours": 26,
      "delayMinutesAvg": 28,
      "costPerKm": 28.5,
      "freightRevenueM": 4.2,
      "exceptionRate": 1.2,
      "dispatchCount": 48,
      "dispatchTrend": [42, 45, 43, 48, 46, 49, 47, 48],
      "otdTrend": [90, 91, 89, 92, 93, 91, 92, 92],
      "topCarrier": "Patel Transport Co.",
      "topCarrierScore": 91,
      "lastException": null,
      "tags": ["high-frequency", "express"]
    }
  ],
  "pagination": { "page": 1, "pageSize": 50, "total": 10, "totalPages": 1 },
  "kpi": {
    "totalRoutes": 10,
    "avgOTD": 82,
    "avgExceptionRate": 3.1,
    "gradeDist": { "A": 4, "B": 3, "C": 2, "D": 1, "F": 0 }
  },
  "regionOTD": [
    { "region": "North", "otd": 87, "routes": 3 },
    { "region": "West", "otd": 88, "routes": 3 },
    { "region": "South", "otd": 74, "routes": 3 },
    { "region": "East", "otd": 66, "routes": 1 }
  ]
}
```

**Authentication Requirement:** Required.

**Error Codes:** Standard (§15).

---

## 11. Carrier Performance Endpoints

### 11.1 List Carriers

**Endpoint Name:** List Carrier Performance
**Method:** `GET /api/v1/carriers`
**Description:** Returns `CarrierDetail` records for Carrier Performance page (`/carriers`). Region filter applies `cityRegion(carrier.hqCity)`.

**Request Payload (query params):** Standard global filter params plus:

| Param | Type | Required | Description |
|---|---|---|---|
| `tier` | `CarrierTier` | No | `Platinum`, `Gold`, `Silver`, `Bronze`, `Probation` |
| `status` | `string` | No | `active`, `suspended`, `under_review`, `probation` |
| `minScore` | `number` | No | Minimum composite score filter |

**Response Payload:**
```json
{
  "data": [
    {
      "id": "CAR-001",
      "name": "Patel Transport Co.",
      "shortCode": "PTC",
      "tier": "Platinum",
      "compositeScore": 91,
      "otdPct": 94,
      "slaCompliancePct": 96,
      "exceptionRatePer100": 1.2,
      "damageRatePct": 0.3,
      "responseTimeMins": 22,
      "freightCostIndex": 95,
      "activeRoutes": 8,
      "monthlyDispatches": 142,
      "fleetsSize": 45,
      "hqCity": "Mumbai",
      "contactName": "Rajesh Patel",
      "contactPhone": "9876543210",
      "contractExpiry": "2026-12-31",
      "lastAuditScore": 92,
      "lastAuditDate": "2026-04-15",
      "status": "active",
      "scoreTrend": [88, 89, 90, 91, 90, 91],
      "otdTrend": [91, 92, 93, 94, 93, 94],
      "incidentCount": 2,
      "remarks": null
    }
  ],
  "pagination": { "page": 1, "pageSize": 50, "total": 10, "totalPages": 1 },
  "kpi": {
    "totalCarriers": 10,
    "avgScore": 76,
    "tierDist": { "Platinum": 2, "Gold": 4, "Silver": 3, "Bronze": 0, "Probation": 1 }
  },
  "scoreMetrics": [
    { "dimension": "OTD%", "weight": 30, "networkAvg": 84 },
    { "dimension": "SLA Compliance", "weight": 25, "networkAvg": 82 },
    { "dimension": "Exception Rate", "weight": 20, "networkAvg": 3.8 },
    { "dimension": "Damage Rate", "weight": 15, "networkAvg": 0.6 },
    { "dimension": "Response Time", "weight": 10, "networkAvg": 48 }
  ]
}
```

**Authentication Requirement:** Required.

**Error Codes:** Standard (§15).

---

## 12. Executive CT / KPI Endpoints

### 12.1 Get Executive KPIs

**Endpoint Name:** Get Executive Dashboard KPIs
**Method:** `GET /api/v1/control-tower/kpis`
**Description:** Returns the 8 top-level KPI cards for the Executive Control Tower (`/executive`). The `dateScale` multiplier (`windowDays / 7`) is computed on the frontend from `windowDays` in the response; the API returns raw counts for the requested window.

**Request Payload (query params):** `region`, `from`, `to`.

**Response Payload:**
```json
{
  "data": {
    "activeDispatches": { "value": 248, "trend": { "direction": "up", "delta": "+12", "period": "vs last week" } },
    "otdPct": { "value": 87, "unit": "%", "status": "warning", "trend": { "direction": "down", "delta": "-2%", "period": "vs last week" } },
    "slaBreaches": { "value": 14, "status": "danger" },
    "openExceptions": { "value": 37, "status": "danger" },
    "vehicleUtilPct": { "value": 79, "unit": "%", "status": "healthy" },
    "avgDelayHrs": { "value": 2.4, "unit": "hrs", "status": "warning" },
    "costVsBudgetPct": { "value": 96, "unit": "%", "status": "healthy" },
    "pendingReconciliation": { "value": 31, "status": "warning" }
  },
  "windowDays": 7
}
```

**Authentication Requirement:** Required. Role: `control_tower`, `manager`, `admin`.

**Error Codes:** Standard (§15).

---

### 12.2 Get Dispatch Funnel

**Endpoint Name:** Get Dispatch Status Funnel
**Method:** `GET /api/v1/control-tower/funnel`
**Description:** Count per dispatch status for the DispatchFunnel widget.

**Request Payload (query params):** `region`, `from`, `to`.

**Response Payload:**
```json
{
  "data": [
    { "stage": "Planned", "count": 42, "color": "#6B7280", "pct": 17 },
    { "stage": "Ready", "count": 28, "color": "#8B5CF6", "pct": 11 },
    { "stage": "Dispatched", "count": 53, "color": "#2563EB", "pct": 21 },
    { "stage": "In Transit", "count": 87, "color": "#0891B2", "pct": 35 },
    { "stage": "Arrived", "count": 19, "color": "#D97706", "pct": 8 },
    { "stage": "Unloading", "count": 11, "color": "#EA580C", "pct": 4 },
    { "stage": "Reconciled", "count": 8, "color": "#16A34A", "pct": 3 }
  ]
}
```

**Authentication Requirement:** Required.

**Error Codes:** Standard (§15).

---

### 12.3 Get Network Nodes

**Endpoint Name:** Get Live Network Nodes
**Method:** `GET /api/v1/control-tower/network`
**Description:** Returns hub/depot/destination nodes for the LiveNetworkView widget.

**Request Payload (query params):** `region`.

**Response Payload:**
```json
{
  "data": [
    {
      "id": "DEL",
      "label": "Delhi Hub",
      "type": "hub",
      "region": "north",
      "activeVehicles": 12,
      "pendingArrivals": 8,
      "exceptions": 3,
      "utilPct": 85
    }
  ]
}
```

**Authentication Requirement:** Required.

**Error Codes:** Standard (§15).

---

### 12.4 Get SLA Heatmap Data

**Endpoint Name:** Get SLA Heatmap
**Method:** `GET /api/v1/control-tower/sla-heatmap`
**Description:** Returns heatmap cells: route × day-of-week × OTD%. Used by SLAHeatmap widget. Region filter applies `routeOriginRegion(cell.route)`.

**Request Payload (query params):** `region`, `from`, `to`.

**Response Payload:**
```json
{
  "data": [
    {
      "route": "MUM-DEL-07",
      "day": "Mon",
      "otd": 91
    }
  ]
}
```

**Authentication Requirement:** Required.

**Error Codes:** Standard (§15).

---

### 12.5 Get Dispatch Trend

**Endpoint Name:** Get Dispatch Trend
**Method:** `GET /api/v1/control-tower/dispatch-trend`
**Description:** Day-by-day planned vs completed counts for the trend chart widget.

**Request Payload (query params):** `from`, `to`, `region`.

**Response Payload:**
```json
{
  "data": [
    { "day": "Mon", "planned": 38, "completed": 34 },
    { "day": "Tue", "planned": 42, "completed": 40 },
    { "day": "Today", "planned": 45, "completed": 31 }
  ]
}
```

**Authentication Requirement:** Required.

**Error Codes:** Standard (§15).

---

## 13. Master Data Endpoints

Master data modules (`/master/*`) manage reference records. All support standard CRUD. Authentication requires `admin` role for write operations.

### 13.1 Routes Master

| Endpoint Name | Method | Path | Description |
|---|---|---|---|
| List Routes Master | `GET` | `/api/v1/master/routes` | All route configurations |
| Get Route | `GET` | `/api/v1/master/routes/:id` | Single route record |
| Create Route | `POST` | `/api/v1/master/routes` | Create new route |
| Update Route | `PATCH` | `/api/v1/master/routes/:id` | Edit route fields |
| Delete Route | `DELETE` | `/api/v1/master/routes/:id` | Soft-delete route |

**Request Payload for Create / Update:**
```json
{
  "routeCode": "DEL-MUM-FTL",
  "routeName": "Delhi to Mumbai FTL Express",
  "origin": "Delhi",
  "destination": "Mumbai",
  "regionOrigin": "North",
  "regionDest": "West",
  "distanceKm": 1414,
  "plannedTransitHours": 26,
  "costPerKm": 28.5
}
```

**Authentication Requirement:** Required. Role: `admin` for create/update/delete; `manager`+ for read.

**Error Codes:** `ERR_DUPLICATE_ROUTE_CODE` (409), `ERR_NOT_FOUND` (404), `ERR_INVALID_REGION` (400).

---

### 13.2 Fleet Master

| Endpoint Name | Method | Path | Description |
|---|---|---|---|
| List Vehicles | `GET` | `/api/v1/master/fleet` | All registered vehicles |
| Get Vehicle | `GET` | `/api/v1/master/fleet/:id` | Single vehicle record |
| Create Vehicle | `POST` | `/api/v1/master/fleet` | Register new vehicle |
| Update Vehicle | `PATCH` | `/api/v1/master/fleet/:id` | Edit vehicle |
| Deactivate Vehicle | `DELETE` | `/api/v1/master/fleet/:id` | Soft-deactivate |

**Authentication Requirement:** Required. Role: `admin`.

---

### 13.3 Carriers Master

| Endpoint Name | Method | Path | Description |
|---|---|---|---|
| List Carriers Master | `GET` | `/api/v1/master/carriers` | All carrier master records |
| Get Carrier | `GET` | `/api/v1/master/carriers/:id` | Single carrier |
| Create Carrier | `POST` | `/api/v1/master/carriers` | Onboard new carrier |
| Update Carrier | `PATCH` | `/api/v1/master/carriers/:id` | Edit carrier fields |
| Update Carrier Tier | `PATCH` | `/api/v1/master/carriers/:id/tier` | Change performance tier |

**Authentication Requirement:** Required. Role: `admin`.

---

### 13.4 Hubs Master

| Endpoint Name | Method | Path | Description |
|---|---|---|---|
| List Hubs | `GET` | `/api/v1/master/hubs` | All hub locations |
| Get Hub | `GET` | `/api/v1/master/hubs/:id` | Single hub detail |
| Update Hub | `PATCH` | `/api/v1/master/hubs/:id` | Edit hub capacity or contact |

**Seed hubs (from mock data):** DEL, MUM, BLR, KOL, HYD, CHE (6 in hub-ops); PUN added in dest-ops — total 7.

**Authentication Requirement:** Required. Role: `admin` for write; any authenticated for read.

---

### 13.5 SLA Matrix Master

| Endpoint Name | Method | Path | Description |
|---|---|---|---|
| List SLA Rules | `GET` | `/api/v1/master/sla` | All SLA rules by route/lane |
| Upsert SLA Rule | `PUT` | `/api/v1/master/sla/:routeCode` | Create or replace rule for a route |

**Authentication Requirement:** Required. Role: `admin`.

---

## 14. Authentication Endpoints

*(Not yet implemented — Phase 2 of `docs/Future-Roadmap.md`)*

### 14.1 Login

**Endpoint Name:** Login
**Method:** `POST /api/v1/auth/login`

**Request Payload:**
```json
{
  "email": "operator@company.com",
  "password": "••••••••"
}
```

**Response Payload:**
```json
{
  "token": "<jwt>",
  "expiresIn": 3600,
  "user": {
    "id": "USR-001",
    "name": "Shashank Zode",
    "email": "operator@company.com",
    "role": "control_tower",
    "region": ""
  }
}
```

**Authentication Requirement:** None (public endpoint).

**Error Codes:**

| Code | HTTP | Description |
|---|---|---|
| `ERR_INVALID_CREDENTIALS` | 401 | Wrong email or password |
| `ERR_ACCOUNT_SUSPENDED` | 403 | Account suspended by admin |

---

### 14.2 Refresh Token

**Endpoint Name:** Refresh Token
**Method:** `POST /api/v1/auth/refresh`

**Request Payload:** `{ "refreshToken": "<refresh_jwt>" }`

**Response Payload:** `{ "token": "<new_jwt>", "expiresIn": 3600 }`

**Authentication Requirement:** None (uses refresh token in body).

**Error Codes:** `ERR_TOKEN_EXPIRED` (401), `ERR_TOKEN_INVALID` (401).

---

### 14.3 Logout

**Endpoint Name:** Logout
**Method:** `POST /api/v1/auth/logout`

**Request Payload:** None (uses `Authorization` header to identify session)

**Response Payload:** `{ "success": true }`

**Authentication Requirement:** Required (any authenticated user).

---

## 15. Common Error Code Reference

| Code | HTTP Status | When Used |
|---|---|---|
| `ERR_UNAUTHORIZED` | 401 | Missing, expired, or malformed JWT |
| `ERR_TOKEN_EXPIRED` | 401 | JWT past expiry; client should call refresh |
| `ERR_TOKEN_INVALID` | 401 | JWT signature invalid |
| `ERR_FORBIDDEN` | 403 | Authenticated but role lacks permission |
| `ERR_NOT_FOUND` | 404 | Resource with given id/code does not exist |
| `ERR_INVALID_STATUS` | 400 | Enum value not in allowed set |
| `ERR_INVALID_STATUS_TRANSITION` | 400 | State machine violation |
| `ERR_INVALID_STAGE_TRANSITION` | 400 | Lifecycle stage skip or reverse attempted |
| `ERR_TIMESTAMP_BEFORE_PREVIOUS` | 400 | Timestamp precedes the previous event's timestamp |
| `ERR_INVALID_DATE_RANGE` | 400 | `from` is after `to` |
| `ERR_INVALID_REGION` | 400 | Region string not one of `north/south/east/west` |
| `ERR_INVALID_SEVERITY` | 400 | `severity` not a valid `SeverityLevel` |
| `ERR_INVALID_CATEGORY` | 400 | Exception category not in allowed list |
| `ERR_INVALID_ACTION` | 400 | `AckAction` value unrecognised |
| `ERR_INVALID_DOCK` | 400 | Dock number not in `D-01` through `D-10` |
| `ERR_INVALID_TYPE` | 400 | `AlertType` value unrecognised |
| `ERR_DOCK_OCCUPIED` | 409 | Dock currently in use by another vehicle |
| `ERR_DUPLICATE_ALERT` | 409 | Alert with same `id` already exists |
| `ERR_DUPLICATE_ROUTE_CODE` | 409 | Route code already registered in master data |
| `ERR_ALREADY_RESOLVED` | 409 | Exception already in a terminal state |
| `ERR_ALREADY_ACKNOWLEDGED` | 409 | Alert already acknowledged |
| `ERR_MISSING_LOADED_HUS` | 400 | `loadedHUs` required for `loaded` hub stage transition |
| `ERR_EMPTY_COMMENT` | 400 | Exception comment `text` is empty string |
| `ERR_EMPTY_REMARKS` | 400 | Alert acknowledgement `remarks` is empty string |
| `ERR_INVALID_CREDENTIALS` | 401 | Email/password mismatch on login |
| `ERR_ACCOUNT_SUSPENDED` | 403 | Account disabled by admin |
| `ERR_DISPATCH_NOT_FOUND` | 404 | `dispatchId` in exception payload not found |
| `ERR_INVALID_DISCREPANCY_STATUS` | 400 | Discrepancy `status` not in `open/accepted/disputed/waived` |
| `ERR_INTERNAL` | 500 | Unhandled server error |

---

## Appendix A — Role Hierarchy

| Role | Read | Write | Scope |
|---|---|---|---|
| `system` | All | Alert ingestion only | Service-to-service |
| `operator` | All | Lifecycle advance, raise exceptions, add comments | Own region |
| `hub_manager` | All | Hub vehicle stage transitions | Own hub |
| `dest_manager` | All | Dock assignment, HU count updates | Own hub |
| `finance` | All | Reconciliation approve/close | All regions |
| `manager` | All | All operator actions + assign exceptions | All regions |
| `control_tower` | All | All manager actions + Executive KPI endpoints | All regions |
| `admin` | All | Full access including master data write | All |

---

## Appendix B — Base URL Convention

```
Development:  http://localhost:8080
Production:   https://api.transport-ct.internal
              or VITE_API_BASE_URL environment variable
```

All endpoints are versioned under `/api/v1/`. When the backend is implemented, a request interceptor in `src/lib/api.ts` will automatically inject the JWT from localStorage and the current `GlobalFilters` state as query parameters on every request.
