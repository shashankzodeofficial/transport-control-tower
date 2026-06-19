# Change Log
## Transport Control Tower (TCT)

All notable changes to this project are documented here.  
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).  
Versions correspond to git tags on the `main` branch.

---

## [Unreleased]

### Planned
- Real backend API integration (replace all mock data)
- Authentication and role-based access control
- WebSocket subscriptions for live dispatch status updates
- GPS vehicle tracking integration
- Email / SMS alert notifications
- Code-split bundle to reduce initial JS payload
- Unit and integration test suite

---

## [1.3.0] — 2026-06-19

### Added
- `src/hooks/useActiveFilters.ts` — shared hook centralising filter consumption for all modules
  - Exposes `region`, `dateRange`, `from`, `to`
  - Exposes `matchesRoute(routeCode)`, `matchesCity(city)`, `matchesDate(isoString)` helpers
  - Was the single location for temporary debug logging during validation

### Changed
- `DispatchWorkbench` — `KPIBar` signature changed from `()` to `({ dispatches })`. All counts now derived from `baseDispatches` (filtered). Tab badge counts recomputed per-status from `baseDispatches`.
- `LoadPlanning` — `filteredLoads`, `filteredVehicles` now based on `baseLoads`/`baseVehicles` (globally filtered). KPI strip values derived from filtered data instead of static `PLANNING_KPI` constants.
- `AnalyticsDashboard` — `DateRangeSelector` reads/writes `FilterContext` preset. Region `FilterPills` calls global `setRegion()`.
- 16 existing modules migrated from `useFilters()` + `exportCsv` helpers to `useActiveFilters()`: OperationsControlTower, HubOperations, DestinationOps, DispatchLifecycle, ExceptionBoard, ReconciliationCenter, ControlTowerPage, SLAHeatmap, AlertCenter, RoutePerformance (widget), CarrierPerformance (widget), DispatchFunnel, ExceptionCommandCenter, AlertsCenter, RoutePerformance (page), CarrierPerformance (page).

### Removed
- All per-module `console.log` debug `useEffect` blocks (were in ControlTowerPage, OperationsControlTower, and several others)
- `import { useEffect }` from modules where it was only used for the debug log

### Fixed
- `useActiveFilters` temporary debug logging removed after filter validation confirmed working

---

## [1.2.1] — 2026-06-19

### Removed
- Debug `console.log` blocks from `useActiveFilters.ts` after validation
- Unused `useEffect` import from hook file

---

## [1.2.0] — 2026-06-19

### Added
- Filter wiring for SLAHeatmap widget, AlertCenter widget, AlertsCenter page, RoutePerformance page, CarrierPerformance page, HubOperations, DestinationOps, DispatchLifecycle

### Changed
- `SLAWatchTable` (inside OperationsControlTower) accepts `records` prop
- `HubActivity` (inside OperationsControlTower) accepts `events` prop
- `SLAHeatmap`: `cells` useMemo now filters by `routeOriginRegion(c.route)`; `worstCell` protected against empty array crash
- `AlertCenter` widget: `regionDateFiltered` useMemo guards against missing `routeCode`

### Fixed
- `SLAHeatmap` crash when selected region had no matching cells (`cells.reduce` on empty array returned `undefined`)
- `AlertCenter` crash for alerts without `routeCode` field

---

## [1.1.0] — 2026-06-18

### Added
- `dateScale` useMemo in `ControlTowerPage`: scales KPI counts by date window (7-day baseline)
- Temporary debug `useEffect` in ControlTowerPage and OperationsControlTower (removed in 1.3.0)
- `CITY_REGION` map and `vehicleRegion`, `slaRegion`, `hubRegion` local helpers in OperationsControlTower

### Changed
- `ControlTowerPage` — `kpiData` useMemo deps updated to `[region, dateRange, dateScale]`
- `DispatchFunnel` widget — `displayFunnel` useMemo combines region scale + date scale
- `RoutePerformance` widget — `baseRoutes` useMemo deps include `dateRange`
- `CarrierPerformance` widget — `filtered` useMemo deps include `region`, `dateRange`
- `OperationsControlTower` — full filter integration; `baseVehicles`, `filteredSLA`, `filteredHubEvents`, `filteredKPI` all computed from filtered data

### Fixed
- Executive CT KPIs not updating on date range change
- Operations CT KPIs, SLA watch, hub activity not responding to any filter change
- `matchesDateRange` null-guard added where `dateRange.from` / `.to` could be falsy

---

## [1.0.0] — 2026-06-01

### Added
- Initial project scaffolding: Vite + React 18 + TypeScript
- Tailwind CSS v3 with custom design token system (`src/theme/tokens.ts`)
- React Router v6 route tree (`src/router.tsx`)
- `FilterContext` with `useReducer` — region, dateRange, routes, carriers
- `AlertContext` — alert list, escalation engine, acknowledgement workflow
- `DrawerContext` — L3 panel drawer stack
- `AppShell` layout — collapsible left nav, top nav, GlobalAlertRail, DrawerContainer
- `GlobalFilterBar` component — region pills + date range picker
- Navigation config (`src/navigation/config.ts`) with permission keys

**Modules (all with mock data):**
- `ControlTowerPage` + 7 widgets: DispatchFunnel, LiveNetworkView, RoutePerformance, CarrierPerformance, SLAHeatmap, ExceptionCommandCenter, AlertCenter
- `OperationsControlTower`
- `DispatchWorkbench`, `DispatchDetails`, `ChainOfCustody`, `TransportMonitor`
- `LoadPlanning`
- `HubOperations`
- `DestinationOps`
- `DispatchLifecycle`
- `ExceptionBoard`
- `ReconciliationCenter`
- `RoutePerformance` (page)
- `CarrierPerformance` (page)
- `AlertsCenter`
- `AnalyticsDashboard` + 6 sub-tabs
- `MasterDataDashboard` + 6 screens
- `AdminDashboard`
- `ProfilePage`

**Shared components:**
- Badges: StatusBadge, SeverityBadge, GradeBadge, TrendBadge
- Charts: BarChart, LineChart, DonutChart, SparklineChart (all Recharts-based)
- KPI: KPICard, KPIStrip
- Tables: DataTable, TableToolbar
- Shared: Button, EmptyState, SLAClock, SkeletonLoader, GlobalAlertRail
- Modals: ModalContainer, DrawerContainer
- Timeline component

**Utilities:**
- `src/lib/exportCsv.ts` — CSV export, `cityRegion()`, `routeOriginRegion()`, `matchesDateRange()`
- `src/lib/utils.ts` — `cn()`, `formatDuration()`, `timeAgo()`

**CI/CD:**
- Vercel auto-deploy configured on push to `main` branch

---

## Commit Message Convention

```
feat(scope):    New feature
fix(scope):     Bug fix
chore(scope):   Build, tooling, dependency updates
refactor(scope):Code change with no behaviour change
docs(scope):    Documentation only
```

Examples used in this project:
- `feat(filters): Wave 6 — global filter propagation across all operational modules`
- `chore(filters): remove debug console logs from useActiveFilters`
