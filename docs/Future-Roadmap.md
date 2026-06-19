# Future Roadmap
## Transport Control Tower (TCT)

**Version:** 1.0  
**Last Updated:** 2026-06-19  
**Owner:** Shashank Zode, Transport Transformation Leader

This document outlines planned improvements and new capabilities beyond v1.0. Items are grouped by theme and roughly ordered by priority.

---

## Phase 1 — Backend Integration (Next Priority)

The most critical gap in v1.0 is that all data is in-memory mock. Phase 1 replaces mock data with real API calls.

### 1.1 API Integration Layer

- Introduce an API client module (`src/lib/api.ts`) using `fetch` or `axios`
- Environment variable `VITE_API_BASE_URL` for endpoint configuration
- Typed API response wrappers matching the contracts in `docs/API-Spec.md`
- Request interceptor to inject `Authorization`, `X-Region`, `X-Date-From`, `X-Date-To` headers automatically from FilterContext

### 1.2 Server State Management

- Evaluate and adopt **TanStack Query (React Query)** for all server-side data fetching
  - Caching, background refetch, stale-while-revalidate behaviour
  - Automatic refetch when global filters change (use filter state as query keys)
  - Loading and error state handling out of the box
- Remove all `mock/data.ts` files once real endpoints are confirmed working
- Replace `useMemo` filter patterns with query hooks that pass filter params to the API

### 1.3 Real-time Updates

- WebSocket connection for live dispatch status changes, exception raises, SLA alerts
- `AlertContext.addAlert()` fed by WebSocket messages, not just manual test data
- Dispatch status badges in the Workbench auto-update without manual refresh
- "Last Synced" timestamp in TopNavigation updates on actual server sync

---

## Phase 2 — Authentication and Authorisation

### 2.1 Authentication

- Login / logout flow with JWT-based session
- Token refresh handling
- Session persistence across page reload (localStorage or HttpOnly cookie)

### 2.2 Role-Based Access Control (RBAC)

- Map `permission` keys in `NAV_CONFIG` to actual roles
- Server-enforced permissions on all API endpoints
- Client-side route guards: redirect to login or forbidden page if permission missing
- Hide nav items the user's role cannot access

### 2.3 User Profiles

- Real user data from backend (replace hard-coded `APP_USER` in `AppShell`)
- Profile page (`/profile`) shows actual user info
- Badge counters (alert unread count) scoped to the logged-in user

---

## Phase 3 — Live Map and GPS Tracking

### 3.1 Vehicle GPS Integration

- Replace `LiveNetworkView` static node diagram with a real interactive map (Mapbox GL or Leaflet)
- Vehicle positions updated in real time from GPS feed
- Route path overlay on the map
- Geofence alerts: vehicle enters / exits a defined zone

### 3.2 Transport Monitor Enhancement

- `TransportMonitor` page (`/transport/live`) powered by real GPS data
- ETA recalculation based on current position vs remaining distance
- Traffic delay prediction feed

---

## Phase 4 — Exception Intelligence

### 4.1 Predictive Exception Detection

- ML-based SLA risk scoring: compute probability of breach before it happens
- Risk score badge on each dispatch in the Workbench
- Prioritised CT queue: surfacing highest-risk dispatches first

### 4.2 Root Cause Analytics

- Auto-categorise exception root causes from historical patterns
- "Most common root cause" chart per carrier, route, region
- Repeat offender detection: flag carriers/routes with recurring exception types

---

## Phase 5 — Mobile Application

### 5.1 Responsive Web (Quick Win)

- Audit and fix layout breakpoints for tablet usage (currently optimised for desktop ≥ 1280px)
- `AppShell` sidebar already collapses on `max-width: 1023px`; ensure page content is usable at that width

### 5.2 Mobile Driver App (Native)

- React Native companion app for drivers
- View assigned dispatch details
- Update delivery status (arrived, unloading complete)
- Raise exceptions from the field
- Capture POD photo

### 5.3 Mobile Hub Ops App

- Simplified gate-in / gate-out interface for hub gate staff
- Scan vehicle registration via camera
- Confirm loading and generate gate pass

---

## Phase 6 — Financial Reconciliation

### 6.1 Freight Invoice Matching

- Carrier raises freight invoice
- System matches invoice lines against dispatch records (route, weight, distance, load type)
- Variance flagged for review (overcharge / undercharge)
- Approval workflow before payment release

### 6.2 Shortage and Damage Claims

- Auto-generate shortage claim from reconciliation variance
- Photo evidence upload from destination ops
- Claim approval workflow
- Settlement tracking against carrier

### 6.3 ERP Integration

- Push approved invoices and settled claims to ERP (SAP / Oracle)
- Two-way GL posting confirmation
- Freight accruals for in-transit shipments

---

## Phase 7 — Analytics and BI Enhancements

### 7.1 Drill-Down Analytics

- All 6 Analytics tabs (`/analytics/*`) currently show pre-aggregated static data
- Replace with live-computed charts driven by the global filter
- Drill: click a bar → see the underlying dispatches

### 7.2 Custom Date Ranges in Analytics

- Currently Analytics DateRangeSelector maps to global presets
- Add a custom date picker for ad-hoc period comparison
- Period-over-period comparison: "This month vs last month"

### 7.3 Carrier Scorecard Reports

- PDF export of carrier scorecard with all KPIs
- Monthly automated report distribution to carrier contacts
- Carrier portal (read-only view for carriers to see their own scorecard)

### 7.4 Route Optimisation Suggestions

- Surface underperforming route/carrier combinations
- Suggest alternative carrier for a route based on historical OTD
- Cost-vs-service trade-off matrix

---

## Phase 8 — Integrations

### 8.1 TMS Integration

- Inbound: receive dispatch records from existing TMS
- Outbound: push status updates back to TMS
- Avoid dual-entry

### 8.2 GST Portal / E-waybill API

- Auto-generate E-waybill on dispatch creation
- E-waybill extension when SLA breach expected (before 8-hour expiry)
- Cancellation API on load plan cancellation

### 8.3 FASTag / Toll Data

- Ingest toll crossing events as dispatch location checkpoints
- Auto-update "last seen at" on the transport monitor

---

## Technical Debt and Infrastructure

### Code Quality
- Add **Vitest** unit tests for: `FilterContext` reducer, `useActiveFilters` helpers, `routeOriginRegion`, `matchesDateRange`, escalation logic
- Add **Playwright** E2E tests for: dispatch creation flow, exception raise + acknowledge, filter change propagation
- Enforce max-warnings 0 in CI (already in `lint` script)
- Resolve route code format issue: `RT-XXX-YYY-NN` returns empty region from `routeOriginRegion`

### Performance
- Code-split by route using `React.lazy` + `Suspense` — current bundle is ~1.3 MB uncompressed
- Virtualise long lists (Dispatch Workbench, Exception Board) with `react-window` or `@tanstack/virtual`

### Developer Experience
- Add `CLAUDE.md` project conventions file for AI-assisted development sessions
- Storybook for shared component documentation
- OpenAPI spec auto-generated from backend (replace manual `docs/API-Spec.md`)

---

## Roadmap Summary Table

| Phase | Theme                          | Priority | Effort  | Status    |
|-------|--------------------------------|----------|---------|-----------|
| 1     | Backend API Integration        | P0       | Large   | Planned   |
| 2     | Authentication + RBAC          | P0       | Medium  | Planned   |
| 3     | Live Map + GPS Tracking        | P1       | Large   | Planned   |
| 4     | Predictive Exception AI        | P1       | Large   | Concept   |
| 5     | Mobile Application             | P2       | X-Large | Concept   |
| 6     | Financial Reconciliation       | P2       | Large   | Concept   |
| 7     | Analytics Enhancements         | P2       | Medium  | Planned   |
| 8     | TMS / GST / FASTag Integrations| P3       | Large   | Concept   |
| —     | Test Suite                     | P1       | Medium  | Planned   |
| —     | Code Splitting                 | P2       | Small   | Planned   |
