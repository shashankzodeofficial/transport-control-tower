# Architecture Document
## Transport Control Tower (TCT)

**Version:** 1.0  
**Last Updated:** 2026-06-19

---

## 1. Technology Stack

| Layer            | Technology                     | Version  |
|------------------|--------------------------------|----------|
| UI Framework     | React                          | 18.3.1   |
| Language         | TypeScript                     | 5.4.5    |
| Build Tool       | Vite                           | 5.2.13   |
| Routing          | React Router DOM               | 6.23.1   |
| Styling          | Tailwind CSS                   | 3.4.4    |
| Charts           | Recharts                       | 2.12.7   |
| Icons            | Lucide React                   | 0.395.0  |
| Date Utilities   | date-fns                       | 3.6.0    |
| Class Utilities  | clsx + tailwind-merge          | latest   |
| Deployment       | Vercel (auto-deploy from main) | —        |
| Repository       | GitHub                         | —        |

---

## 2. High-Level Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                        Browser (SPA)                             │
│                                                                  │
│  ┌────────────┐   ┌──────────────────────────────────────────┐  │
│  │            │   │              AppShell                    │  │
│  │  Left Nav  │   │  TopNav  │  GlobalFilterBar              │  │
│  │            │   │──────────────────────────────────────────│  │
│  │  (collap-  │   │                                          │  │
│  │   sible)   │   │           Page / Module                  │  │
│  │            │   │  (React Router Outlet)                   │  │
│  │            │   │                                          │  │
│  └────────────┘   └──────────────────────────────────────────┘  │
│                                                                  │
│  ┌──────────────┐   ┌──────────────┐   ┌──────────────────────┐ │
│  │  FilterCtx   │   │  AlertCtx    │   │  DrawerCtx           │ │
│  │  (global     │   │  (alert rail │   │  (L3 panel stack)    │ │
│  │   filters)   │   │   + badges)  │   │                      │ │
│  └──────────────┘   └──────────────┘   └──────────────────────┘ │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │                  Mock Data Layer (per module)              │  │
│  │   /mock/data.ts or /mock/dispatches.ts per page folder    │  │
│  └────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────┘
```

The application is a fully client-side Single Page Application. All data is currently served from in-memory TypeScript mock data files. There is no backend API in v1.0.

---

## 3. Directory Structure

```
src/
├── components/           # Shared reusable UI components
│   ├── badges/           # StatusBadge, SeverityBadge, GradeBadge, TrendBadge
│   ├── charts/           # BarChart, LineChart, DonutChart, SparklineChart
│   ├── filters/          # GlobalFilterBar, DateRangePicker, FilterChip, FilterDropdown
│   ├── kpi/              # KPICard, KPIStrip
│   ├── modals/           # ModalContainer, DrawerContainer
│   ├── shared/           # Button, EmptyState, SLAClock, SkeletonLoader, GlobalAlertRail
│   └── tables/           # DataTable, TableToolbar
│
├── context/              # React Context providers
│   ├── FilterContext.tsx  # Global filter state (region, dateRange, routes, carriers)
│   ├── AlertContext.tsx   # Alert state, escalation engine, rail open/close
│   └── DrawerContext.tsx  # L3 drawer panel management
│
├── hooks/
│   └── useActiveFilters.ts  # Shared filter hook used by all modules
│
├── layout/               # Page chrome
│   ├── AppShell.tsx      # Root layout: sidebar + topnav + outlet + alert rail
│   ├── TabStrip.tsx      # Reusable tab bar with badge counts
│   ├── PageHeader.tsx    # Page title + breadcrumb area
│   └── Breadcrumb.tsx    # Breadcrumb component
│
├── navigation/
│   ├── config.ts         # NAV_CONFIG — all nav groups and items with permission keys
│   ├── LeftNavigation.tsx
│   └── TopNavigation.tsx
│
├── pages/                # One folder per module
│   ├── control-tower/    # Executive CT + 7 sub-widgets
│   ├── operations/       # Operations CT
│   ├── dispatch/         # Dispatch Workbench, Details, ChainOfCustody, TransportMonitor
│   ├── planning/         # Load Planning Workbench
│   ├── hub-ops/          # Hub Operations
│   ├── dest-ops/         # Destination Operations
│   ├── lifecycle/        # Dispatch Lifecycle (Kanban)
│   ├── exceptions/       # Exception Management
│   ├── reconciliation/   # Reconciliation Center
│   ├── routes/           # Route Performance
│   ├── carriers/         # Carrier Performance
│   ├── alerts/           # CT Alerts Center
│   ├── analytics/        # Analytics Dashboard + 6 sub-tabs
│   ├── master-data/      # Master Data (6 sub-screens)
│   ├── admin/            # Administration
│   └── profile/          # User Profile
│
├── lib/
│   ├── exportCsv.ts      # CSV export + cityRegion, routeOriginRegion, matchesDateRange
│   └── utils.ts          # cn(), formatDuration(), timeAgo()
│
├── theme/
│   ├── tokens.ts         # COLOR constants, KPI_THRESHOLDS, status types
│   └── index.ts
│
├── types/
│   └── index.ts          # All shared TypeScript interfaces and types
│
├── router.tsx            # React Router route tree
└── main.tsx              # React root, context providers mounted here
```

---

## 4. Context Architecture

### 4.1 FilterContext

The single global filter store. Implemented with `useReducer`. All modules read from it — none maintain their own region or date state.

```
FilterProvider
  └── useReducer(filterReducer, DEFAULT_FILTERS)
        state: {
          dateRange: { preset, from: Date, to: Date }
          region:    string   // '' = all regions
          routes:    string[] // [] = all routes
          carriers:  string[] // [] = all carriers
        }
        actions:
          SET_DATE_RANGE, SET_DATE_PRESET, SET_REGION,
          SET_ROUTES, SET_CARRIERS, RESET
```

**Default state:** Last 7 days, all regions, no route or carrier filter.

**`hasActiveFilters`** — computed boolean, true when any filter deviates from default. Used by the filter bar to show the reset button.

### 4.2 AlertContext

Manages the in-memory alert list. Provides an escalation engine that maps delay minutes to escalation level.

```
AlertProvider
  └── useState(alerts)
        operations: acknowledge(id, payload), addAlert, removeAlert
        computed:   unacknowledgedCount, criticalCount
        ui state:   isRailOpen, openRail, closeRail, toggleRail

Escalation thresholds:
  delayMins >= 120 → regional_manager
  delayMins >= 240 → transport_head
  delayMins >= 480 → control_tower
```

New critical alerts automatically open the GlobalAlertRail slide-over panel.

### 4.3 DrawerContext

Manages the L3 drawer panel stack for detail views (dispatch detail, vehicle detail, carrier detail, etc.).

---

## 5. The `useActiveFilters` Hook

Every module that needs to respond to global filters imports `useActiveFilters` from `src/hooks/useActiveFilters.ts`. This is the single point of truth for filter consumption.

```typescript
const {
  region,        // string: '' | 'north' | 'south' | 'east' | 'west'
  dateRange,     // { preset, from: Date, to: Date }
  from,          // Date | null
  to,            // Date | null
  matchesRoute,  // (routeCode: string) => boolean
  matchesCity,   // (city: string) => boolean
  matchesDate,   // (isoString?: string) => boolean
} = useActiveFilters('ModuleName')
```

**Pattern for filtering mock data:**
```typescript
const baseList = useMemo(() =>
  RAW_DATA.filter(item =>
    matchesRoute(item.routeCode) && matchesDate(item.plannedAt)
  ),
  [region, dateRange],   // dep array — triggers recompute on filter change
)
```

**`matchesRoute`** — uses `routeOriginRegion(routeCode)` from `lib/exportCsv`. Splits route code on `-`, takes `[0]`, maps to region (e.g. `DEL-MUM-01` → `DEL` → `'north'`).

**`matchesCity`** — uses `cityRegion(city)` from `lib/exportCsv`. Regex-maps city name to region.

**`matchesDate`** — guards null dates, calls `matchesDateRange(isoString, from, to)`.

---

## 6. Routing

All routes are nested under `AppShell` via a single `<Route element={<AppShell />}>` wrapper.

| Path                          | Component                |
|-------------------------------|--------------------------|
| `/executive`                  | ControlTowerPage         |
| `/operations`                 | OperationsControlTower   |
| `/dispatch/board`             | DispatchWorkbench        |
| `/dispatch/:id`               | DispatchDetails          |
| `/dispatch/:id/custody`       | ChainOfCustody           |
| `/transport/live`             | TransportMonitor         |
| `/load-planning`              | LoadPlanning             |
| `/hub-ops`                    | HubOperations            |
| `/dest-ops`                   | DestinationOps           |
| `/lifecycle`                  | DispatchLifecycle        |
| `/exceptions`                 | ExceptionBoard           |
| `/reconciliation`             | ReconciliationCenter     |
| `/routes`                     | RoutePerformance         |
| `/carriers`                   | CarrierPerformance       |
| `/alerts`                     | AlertsCenter             |
| `/analytics/:tab`             | AnalyticsDashboard       |
| `/master-data/:screen`        | MasterDataDashboard      |
| `/admin`                      | AdminDashboard           |
| `/profile`                    | ProfilePage              |
| `*`                           | → `/executive`           |

Default entry point: `/` redirects to `/executive`.

---

## 7. Data Layer

All data is mock — TypeScript arrays of typed objects defined in `pages/<module>/mock/` files. Each mock file exports:

- Named constants (e.g. `DISPATCHES`, `FLEET_VEHICLES`, `SLA_WATCH`)
- Computed summary objects where needed (e.g. `STATUS_COUNTS`, `PLANNING_KPI`)
- Helper functions that operate on mock data (e.g. `isDelayed()`, `fmtMins()`)

Timestamps are generated relative to `Date.now()` at module load time using helpers like `hago(n)` (n hours ago) and `h(n)` (n hours ahead), so data always appears current.

---

## 8. Component Design Principles

- **No prop drilling for filters.** All filter reads go through `useActiveFilters()`.
- **useMemo for derived data.** Every filtered or computed list is memoised with `[region, dateRange]` in the dependency array.
- **Sub-components receive pre-filtered data as props.** Inner components (e.g. `KPIBar`, `SLAWatchTable`) accept typed arrays as props and perform no filtering themselves.
- **Charts are stateless.** All chart components (`BarChart`, `LineChart`, `DonutChart`, `SparklineChart`) are pure presentational, accepting `data` arrays and config props.
- **Badges are semantic.** `StatusBadge`, `SeverityBadge`, `GradeBadge` derive colour from a value (not a className), enforcing consistent token usage.

---

## 9. Styling System

Tailwind CSS v3 with a custom design token layer in `src/theme/tokens.ts`. Design tokens define:

- Brand colours: `#1E3A5F` (primary), `#3B82F6` (accent), `#0F172A` (surface)
- Status semantics: success (`#16A34A`), warning (`#D97706`), danger (`#DC2626`), info (`#2563EB`)
- Dispatch status colours (8 states)
- Severity colours (critical / high / medium / low / info)
- Route grade colours (A–F)
- `CHART_COLORS` array for Recharts series

All chart colour decisions reference `COLOR.*` from `tokens.ts`, never raw hex strings in component files.

---

## 10. Build and Deployment

```
Development:   npm run dev    → Vite dev server on port 5173
Build:         vite build     → dist/ (note: package.json says tsc && vite build,
                                 but CI uses vite build only)
Preview:       npm run preview → serve dist/ locally
Lint:          npm run lint   → ESLint with max-warnings 0
```

**CI/CD:** Push to `main` branch on GitHub triggers Vercel auto-deploy. No manual deploy step required.

**Bundle size:** ~1.3 MB JS (uncompressed), ~316 KB gzip. Recharts contributes significantly; code-splitting is a planned improvement.

---

## 11. Known Architectural Constraints

| Constraint | Detail |
|------------|--------|
| No backend | All data is mock; real API integration is deferred |
| No auth | No login/logout; user is hard-coded as `APP_USER` in `AppShell` |
| No persistence | Filter state and alert state reset on page reload |
| Route format limitation | `routeOriginRegion()` only handles `XXX-YYY-NN` format; `RT-XXX-YYY-NN` format returns empty string |
| Analytics tabs | Pre-aggregated static data; cannot be filtered by region/date at the chart level |
| No tests | No unit or integration test suite in v1.0 |
