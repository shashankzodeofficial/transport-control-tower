# API Specification
## Transport Control Tower (TCT)

**Version:** 1.0 (Mock / Planned)  
**Last Updated:** 2026-06-19  
**Status:** Planned — v1.0 uses in-memory mock data. This document specifies the API contracts that a real backend must implement.

---

## 1. Overview

All API calls will follow REST conventions over HTTPS. The base URL will be injected via environment variable `VITE_API_BASE_URL`.

### Request Headers (all endpoints)
```
Authorization: Bearer <token>
Content-Type: application/json
Accept: application/json
X-Region: north | south | east | west | (omit for all)
X-Date-From: ISO-8601 datetime
X-Date-To: ISO-8601 datetime
```

### Standard Response Envelope
```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "total": 100,
    "page": 1,
    "pageSize": 25,
    "region": "north",
    "dateFrom": "2026-06-12T00:00:00Z",
    "dateTo": "2026-06-19T23:59:59Z"
  },
  "error": null
}
```

### Error Response
```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "DISPATCH_NOT_FOUND",
    "message": "Dispatch D-48291 does not exist",
    "httpStatus": 404
  }
}
```

---

## 2. Filter Query Parameters

All list endpoints accept the following common query parameters:

| Parameter   | Type   | Description                          | Example                  |
|-------------|--------|--------------------------------------|--------------------------|
| `region`    | string | Filter by region slug                | `north`                  |
| `dateFrom`  | string | ISO-8601 start of date range         | `2026-06-12T00:00:00Z`   |
| `dateTo`    | string | ISO-8601 end of date range           | `2026-06-19T23:59:59Z`   |
| `page`      | number | Page number (1-based)                | `1`                      |
| `pageSize`  | number | Records per page                     | `25`                     |
| `sortBy`    | string | Field to sort by                     | `plannedDeparture`       |
| `sortDir`   | string | `asc` or `desc`                      | `desc`                   |
| `search`    | string | Free-text search                     | `DEL-MUM`                |

---

## 3. Dispatch Endpoints

### 3.1 List Dispatches
```
GET /api/v1/dispatches
```

Query parameters (in addition to common filters):
- `status` — filter by dispatch status: `planned | ready | dispatched | transit | arrived | unloading | reconciled | closed`
- `slaStatus` — `ok | at-risk | breached`
- `priority` — `normal | high | critical`
- `carrierId` — carrier ID string

**Response `data`:**
```json
{
  "dispatches": [
    {
      "id": "D-48291",
      "status": "transit",
      "routeCode": "DEL-MUM-01",
      "routeName": "Delhi → Mumbai FTL",
      "origin": "Delhi (Gurgaon Warehouse)",
      "destination": "Mumbai (Bhiwandi Hub)",
      "vehicleReg": "DL01AB2233",
      "vehicleType": "FTL",
      "driverName": "Manoj Singh",
      "driverPhone": "9765432109",
      "carrier": "FastMove Logistics",
      "carrierId": "C-001",
      "plannedDeparture": "2026-06-18T06:00:00Z",
      "plannedArrival": "2026-06-19T18:00:00Z",
      "actualDeparture": "2026-06-18T06:45:00Z",
      "actualArrival": null,
      "huCount": 22,
      "loadedHUs": 22,
      "weightKg": 13500,
      "volumeCbm": 65,
      "exceptionCount": 1,
      "slaStatus": "at-risk",
      "slaHoursRemaining": 2.5,
      "slaTotalHours": 36,
      "lrNumber": "LR-2024-001291",
      "ewaybillNumber": "EWB-1234567890",
      "invoiceNumbers": ["INV-2024-5501", "INV-2024-5502"],
      "gatePassNumber": "GP-2024-001291",
      "sealNumber": "SEAL-44821",
      "freightCost": 24500,
      "priority": "high",
      "tags": ["express", "pharma"]
    }
  ]
}
```

### 3.2 Get Dispatch Detail
```
GET /api/v1/dispatches/:id
```

Returns full dispatch record including timeline events and HU list.

### 3.3 Create Dispatch
```
POST /api/v1/dispatches
```

**Request body:**
```json
{
  "routeCode": "DEL-MUM-01",
  "vehicleReg": "DL01AB2233",
  "carrierId": "C-001",
  "plannedDeparture": "2026-06-20T06:00:00Z",
  "huCount": 20,
  "weightKg": 12000,
  "priority": "normal"
}
```

### 3.4 Update Dispatch Status
```
PATCH /api/v1/dispatches/:id/status
```

**Request body:**
```json
{ "status": "dispatched", "timestamp": "2026-06-20T06:45:00Z" }
```

### 3.5 Dispatch Status Counts (KPI bar)
```
GET /api/v1/dispatches/counts?region=north&dateFrom=...&dateTo=...
```

**Response `data`:**
```json
{
  "all": 48,
  "planned": 8,
  "ready": 5,
  "dispatched": 3,
  "transit": 18,
  "arrived": 4,
  "unloading": 3,
  "reconciled": 5,
  "closed": 2,
  "slaAtRisk": 6,
  "slaBreached": 2,
  "openExceptions": 11
}
```

---

## 4. Executive KPI Endpoints

### 4.1 Network KPIs
```
GET /api/v1/kpis/executive?region=north&dateFrom=...&dateTo=...
```

**Response `data`:**
```json
{
  "totalDispatches": 284,
  "inTransit": 143,
  "onTimePct": 87.3,
  "activeExceptions": 23,
  "costPerDispatch": 4250,
  "slaCompliancePct": 91.2,
  "trends": {
    "totalDispatches": { "direction": "up", "delta": "+12", "period": "vs last 7d" },
    "onTimePct":       { "direction": "down", "delta": "-2.1%", "period": "vs last 7d" }
  }
}
```

### 4.2 Dispatch Funnel
```
GET /api/v1/kpis/funnel?region=north&dateFrom=...&dateTo=...
```

**Response `data`:**
```json
{
  "stages": [
    { "stage": "Planned",    "count": 284 },
    { "stage": "Dispatched", "count": 261 },
    { "stage": "In Transit", "count": 218 },
    { "stage": "Arrived",    "count": 194 },
    { "stage": "Unloaded",   "count": 187 },
    { "stage": "Reconciled", "count": 179 }
  ]
}
```

### 4.3 Network Nodes
```
GET /api/v1/kpis/network?region=north
```

Returns hub/node positions and dispatch counts for the live network map.

---

## 5. Operations Endpoints

### 5.1 Fleet Status
```
GET /api/v1/fleet?region=north
```

**Response `data.vehicles`:** array of vehicle objects with status, location, delay info.

### 5.2 SLA Watch List
```
GET /api/v1/sla-watch?region=north&dateFrom=...&dateTo=...
```

Returns dispatches at SLA risk with planned arrival and breach probability.

### 5.3 Hub Activity
```
GET /api/v1/hub-activity?region=north&dateFrom=...&dateTo=...
```

Returns scheduled hub arrivals and departures.

---

## 6. Exception Endpoints

### 6.1 List Exceptions
```
GET /api/v1/exceptions?region=north&dateFrom=...&dateTo=...&severity=critical&status=OPEN
```

**Response `data.exceptions`:** array of exception objects.

**Exception object:**
```json
{
  "id": "EX-2024-001",
  "category": "SLA_BREACH",
  "severity": "critical",
  "status": "OPEN",
  "dispatchId": "D-48291",
  "routeCode": "DEL-MUM-01",
  "carrier": "FastMove Logistics",
  "origin": "Delhi",
  "raisedAt": "2026-06-18T14:30:00Z",
  "raisedBy": "System",
  "assignee": null,
  "escalationLevel": "regional_manager",
  "rootCause": null,
  "resolutionNote": null,
  "slaBreachAt": "2026-06-19T22:00:00Z"
}
```

### 6.2 Raise Exception
```
POST /api/v1/exceptions
```

### 6.3 Update Exception
```
PATCH /api/v1/exceptions/:id
```

**Request body:**
```json
{
  "status": "ASSIGNED",
  "assignee": "Shashank Zode",
  "rootCause": "Vehicle breakdown on NH-48"
}
```

### 6.4 Exception Counts (KPI)
```
GET /api/v1/exceptions/counts?region=north&dateFrom=...&dateTo=...
```

---

## 7. Reconciliation Endpoints

### 7.1 List Reconciliations
```
GET /api/v1/reconciliations?region=north&dateFrom=...&dateTo=...&status=pending
```

### 7.2 Update Reconciliation
```
PATCH /api/v1/reconciliations/:id
```

**Request body:**
```json
{
  "status": "completed",
  "receivedHUs": 22,
  "receivedWeightKg": 13450,
  "varianceReason": "Minor transit damage on 1 HU",
  "resolvedBy": "Shashank Zode"
}
```

---

## 8. Alert Endpoints

### 8.1 List Alerts
```
GET /api/v1/alerts?region=north&dateFrom=...&dateTo=...&severity=critical&acknowledged=false
```

### 8.2 Acknowledge Alert
```
PATCH /api/v1/alerts/:id/acknowledge
```

**Request body:**
```json
{
  "action": "carrier_escalated",
  "remarks": "Called carrier ops head, alternate vehicle being arranged",
  "ackedBy": "Shashank Zode"
}
```

---

## 9. Load Planning Endpoints

### 9.1 Pending Loads
```
GET /api/v1/loads/pending?region=north&dateFrom=...&dateTo=...&priority=critical
```

### 9.2 Available Vehicles
```
GET /api/v1/vehicles/available?region=north&availability=available
```

### 9.3 Load Plans
```
GET /api/v1/load-plans?region=north&dateFrom=...&dateTo=...&status=confirmed
POST /api/v1/load-plans
PATCH /api/v1/load-plans/:id
```

---

## 10. Performance Endpoints

### 10.1 Route Scorecard
```
GET /api/v1/performance/routes?region=north&dateFrom=...&dateTo=...
```

### 10.2 Carrier Ranking
```
GET /api/v1/performance/carriers?region=north&dateFrom=...&dateTo=...
```

### 10.3 SLA Heatmap
```
GET /api/v1/performance/sla-heatmap?region=north
```

---

## 11. Master Data Endpoints

All master data endpoints follow a standard CRUD pattern:

```
GET    /api/v1/master/routes
POST   /api/v1/master/routes
PUT    /api/v1/master/routes/:id
DELETE /api/v1/master/routes/:id

GET    /api/v1/master/carriers
GET    /api/v1/master/fleet
GET    /api/v1/master/hubs
GET    /api/v1/master/customers
GET    /api/v1/master/sla-matrix
```

---

## 12. Webhook Events (Future)

When the backend is integrated, it should emit the following events that the frontend can subscribe to via WebSocket:

| Event                    | Payload                          |
|--------------------------|----------------------------------|
| `dispatch.status_changed`| `{ id, newStatus, timestamp }`   |
| `exception.raised`       | Full exception object            |
| `exception.escalated`    | `{ id, newLevel, escalatedAt }`  |
| `alert.fired`            | Full alert object                |
| `sla.at_risk`            | `{ dispatchId, hoursRemaining }` |
| `sla.breached`           | `{ dispatchId, breachedAt }`     |
| `vehicle.gate_in`        | `{ vehicleId, hubCode, time }`   |
| `reconciliation.variance`| `{ id, expectedHUs, receivedHUs}`|
