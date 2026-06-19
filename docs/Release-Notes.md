# Release Notes
## Transport Control Tower (TCT)

**Repository:** github.com/shashankzodeofficial/transport-control-tower  
**Deployment:** Vercel (auto-deploy on push to `main`)

---

## v1.3.0 — 2026-06-19

### Global Filter Propagation — Wave 6 + Shared Hook

**Summary:** All operational modules now respond to the global Region and Date Range filters. A shared hook centralises filter consumption across the entire application.

#### New
- **`src/hooks/useActiveFilters.ts`** — Single shared hook used by every module. Wraps `FilterContext`, exposes typed convenience helpers (`matchesRoute`, `matchesCity`, `matchesDate`), and was the single place for temporary debug logging during validation.

#### Fixed — Previously Unwired Modules
- **Dispatch Management (`/dispatch`)** — `KPIBar` (In Transit, SLA At Risk, SLA Breached, Open Exceptions) now derived from filtered dispatches. Tab badge counts (per status) reflect global region + date selection. `baseDispatches` filters by `routeOriginRegion(routeCode)` and `plannedDeparture`.
- **Load Planning (`/load-planning`)** — `baseLoads`, `baseVehicles`, and `basePlans` all filtered by global region and date. KPI strip values (Available Vehicles, Pending Loads, Critical Loads, Avg Utilization, In Maintenance, Plans Today) derived from filtered data. Tab badge counts updated accordingly.
- **Analytics Dashboard (`/analytics`)** — Local `region` state replaced with global `FilterContext`. `DateRangeSelector` component now reads and writes the global date preset instead of maintaining its own local state. Region filter pills call `setRegion()` from FilterContext.

#### Improved — Migrated to Shared Hook
All 16 previously working filter-aware modules migrated from direct `useFilters()` + `exportCsv` imports to `useActiveFilters()`:

- `OperationsControlTower` — kept custom city region helpers, adopted `matchesDate`; removed scattered debug `useEffect`
- `HubOperations`, `DestinationOps`, `DispatchLifecycle` — `matchesRoute` + `matchesDate` replace inline filter conditions
- `ExceptionBoard`, `ReconciliationCenter` — `matchesCity` + `matchesDate` replace inline conditions
- `ControlTowerPage` — debug `useEffect` removed (hook handles logging); `dateScale` computation unchanged
- `SLAHeatmap`, `AlertCenter`, `RoutePerformance` (widget), `CarrierPerformance` (widget), `DispatchFunnel`, `ExceptionCommandCenter` — all migrated
- `AlertsCenter`, `RoutePerformance` (page), `CarrierPerformance` (page) — all migrated

#### Removed
- Scattered `console.log` debug `useEffect` blocks from individual modules (centralised, then removed from shared hook after validation)

---

## v1.2.0 — 2026-06-19

### Global Filter Propagation — Wave 5 Extension

**Summary:** Applied the gold-standard filter pattern from ExceptionBoard and ReconciliationCenter to 8 additional modules that were not responding to global filters.

#### Fixed
- **SLA Heatmap widget** — Filters cells by `routeOriginRegion(c.route)`. Fixed crash on empty `cells.reduce()` when no cells match selected region.
- **Alert Center widget** — Filters alerts by route region and `firedAt` date. Handles alerts with no `routeCode` (skips region check).
- **Alerts Center page** — Global region + date applied before local severity / ack / type filters.
- **Route Performance page** — `baseList` filtered by `regionOrigin.toLowerCase()`.
- **Carrier Performance page** — `baseList` filtered by `cityRegion(c.hqCity)`.
- **Hub Operations page** — `baseVehicles` filtered by route origin region and `arrivedAt` date.
- **Destination Operations page** — Same filter pattern as Hub Operations.
- **Dispatch Lifecycle page** — `baseDispatches` filtered by route origin region and `plannedAt` date.

#### Fixed — Sub-component Props
- `SLAWatchTable` in OperationsControlTower updated to accept `records` prop instead of reading `SLA_WATCH` directly
- `HubActivity` in OperationsControlTower updated to accept `events` prop instead of reading `HUB_EVENTS` directly

---

## v1.1.0 — 2026-06-18

### Global Filter Propagation — Wave 5

**Summary:** Fixed global filter propagation for Executive CT and Operations CT, which were not updating when Region or Date Range changed.

#### Fixed — Executive CT (`/executive`)
- `dateRange` added to `kpiData` useMemo dependency array
- `dateScale` useMemo introduced: scales KPI counts proportionally to selected date window (7d baseline = 1.0)
- Debug `useEffect` added (temporary) to log filter state on every change
- `DispatchFunnel` widget: combined region + date scale factors in `displayFunnel` useMemo
- `RoutePerformance` widget: `dateRange` added to `baseRoutes` useMemo deps
- `CarrierPerformance` widget: `region`, `dateRange` added to `filtered` useMemo deps

#### Fixed — Operations CT (`/operations`)
- Full filter integration added to `OperationsControlTower`
- `baseVehicles` filtered by custom city-based region helpers (fleet vehicles use origin city names, not route codes)
- `filteredSLA` filtered by `slaRegion(r.origin)` and `plannedArrival` date
- `filteredHubEvents` filtered by `hubRegion(e.hub)` and `scheduledAt` date
- `filteredKPI` useMemo recomputes all 6 KPI cards from filtered data

---

## v1.0.0 — 2026-06-01

### Initial Release

**Summary:** First complete release of the Transport Control Tower. All navigation, modules, and mock data implemented.

#### Modules Delivered
- Executive Control Tower with 7 widgets (Dispatch Funnel, Live Network View, Route Performance, Carrier Performance, SLA Heatmap, Exception Command Center, Alert Center)
- Operations Control Tower with fleet, SLA watch, hub activity
- Dispatch Management (Workbench, Detail, Chain of Custody, Transport Monitor)
- Load Planning Workbench
- Hub Operations
- Destination Operations
- Dispatch Lifecycle (Kanban board)
- Exception Management
- Reconciliation Center
- Route Performance scorecard
- Carrier Performance ranking
- CT Alerts Center with Global Alert Rail
- Analytics Dashboard (6 sub-tabs)
- Master Data (6 screens: Routes, Fleet, Carriers, Hubs, Customers, SLA Matrix)
- Administration
- User Profile

#### Architecture Established
- `FilterContext` — global filter state via `useReducer`
- `AlertContext` — alert management with escalation engine
- `DrawerContext` — L3 panel stack management
- `GlobalFilterBar` — region + date range selector in top navigation
- `AppShell` — collapsible sidebar + top nav + alert rail layout
- Design token system (`src/theme/tokens.ts`)
- Shared component library: badges, charts, KPI cards, modals, tables

#### Known Issues at Release
- Filter propagation not yet wired in: Dispatch Management, Load Planning, Analytics, Hub Ops, Dest Ops, Lifecycle, Dispatch Lifecycle (fixed in v1.1.0 and v1.2.0)
- Route code format `RT-XXX-YYY-NN` returns empty region match
- No backend API; all data is in-memory mock
- No authentication
