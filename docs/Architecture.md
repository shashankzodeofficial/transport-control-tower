# Architecture Document
## Transport Control Tower (TCT)

**Version:** 2.0 — Full Module Audit
**Last Updated:** 2026-06-19

---

## 1. Technology Stack

| Layer | Technology | Version |
|---|---|---|
| UI Framework | React | 18.3.1 |
| Language | TypeScript | 5.4.5 |
| Build Tool | Vite | 5.2.13 |
| Routing | React Router DOM | 6.23.1 |
| Styling | Tailwind CSS | 3.4.4 |
| Charts | Recharts | 2.12.7 |
| Icons | Lucide React | 0.395.0 |
| Date Utilities | date-fns | 3.6.0 |
| Class Utilities | clsx + tailwind-merge | latest |
| Deployment | Vercel (auto-deploy from main) | — |
| Repository | GitHub | — |

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

Fully client-side SPA. No backend API in v1.0 — all data served from TypeScript in-memory mock files.

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
│   ├── control-tower/    # Executive CT (ControlTowerPage.tsx) + 7 sub-widgets
│   │   ├── ControlTowerPage.tsx
│   │   ├── widgets/      # DispatchFunnel, LiveNetworkView, RoutePerformance, etc.
│   │   └── mock/data.ts
│   ├── operations/       # Operations CT (OperationsControlTower.tsx)
│   │   ├── OperationsControlTower.tsx
│   │   └── mock/data.ts
│   ├── dispatch/         # Workbench, Details, ChainOfCustody, TransportMonitor
│   ├── planning/         # Load Planning Workbench
│   ├── hub-ops/          # Hub Operations (HubOperations.tsx)
│   │   └── mock/data.ts
│   ├── dest-ops/         # Destination Operations (DestinationOps.tsx)
│   │   └── mock/data.ts
│   ├── lifecycle/        # Dispatch Lifecycle Kanban (DispatchLifecycle.tsx)
│   │   └── mock/data.ts
│   ├── exceptions/       # Exception Management (ExceptionBoard.tsx)
│   │   └── mock/data.ts
│   ├── reconciliation/   # Reconciliation Center (ReconciliationCenter.tsx)
│   │   └── mock/data.ts
│   ├── routes/           # Route Performance page
│   │   └── mock/data.ts
│   ├── carriers/         # Carrier Performance page
│   │   └── mock/data.ts
│   ├── alerts/           # CT Alerts Center (AlertsCenter.tsx)
│   │   └── mock/data.ts
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

### 4.1 FilterContext (`src/context/FilterContext.tsx`)

Single global filter store. Implemented with `useReducer`. All modules read from it — none maintain their own region or date state.

```
FilterProvider
  └── useReducer(filterReducer, DEFAULT_FILTERS)
        state: {
          dateRange: { preset: DateRangePreset, from: Date, to: Date }
          region:    string   // '' = all; 'north'|'south'|'east'|'west' = filtered
          routes:    string[] // [] = all routes (currently unused in module filtering)
          carriers:  string[] // [] = all carriers (currently unused in module filtering)
        }
        actions:
          SET_DATE_RANGE:  { from: Date, to: Date, preset: 'custom' }
          SET_DATE_PRESET: { preset: '7d'|'today'|'yesterday'|'30d'|'month' }
          SET_REGION:      { region: string }
          SET_ROUTES:      { routes: string[] }
          SET_CARRIERS:    { carriers: string[] }
          RESET:           (no payload)
```

**Default state:** 7-day window (from = 7 days ago, to = now), empty region (= all), empty routes, empty carriers.

**`hasActiveFilters`** — computed boolean exposed by context; true when any filter deviates from defaults. Used by GlobalFilterBar to show/hide the reset button.

### 4.2 AlertContext (`src/context/AlertContext.tsx`)

Manages in-memory alert list. Provides acknowledgement and escalation engine.

```
AlertProvider
  └── useState(alerts: Alert[]) — seeded from SEED_ALERTS in mock/data.ts
        operations:
          acknowledge(id, { ackAction, ackRemarks }) → sets acknowledged, ackedAt, ackedBy
          addAlert(alert: Omit<Alert, 'id'>) → assigns UUID id, prepends to list
          removeAlert(id) → removes from list
        computed:
          unacknowledgedCount = alerts.filter(a => !a.acknowledged).length
          criticalCount       = alerts.filter(a => a.severity === 'critical' && !a.acknowledged).length
        ui state:
          isRailOpen: boolean
          openRail(), closeRail(), toggleRail()

Escalation thresholds (AlertContext.getEscalationLevel(delayMins)):
  delayMins >= 480 → 'control_tower'
  delayMins >= 240 → 'transport_head'
  delayMins >= 120 → 'regional_manager'
  otherwise        → 'none'
```

New `critical` severity alerts automatically open the GlobalAlertRail slide-over panel.

### 4.3 DrawerContext (`src/context/DrawerContext.tsx`)

Manages the L3 detail panel drawer stack (dispatch detail, vehicle detail, exception detail, etc.).

```
DrawerProvider
  └── useState(stack: DrawerItem[])
        operations:
          push(item: DrawerItem) → adds to stack; panel slides open
          pop()                  → removes top item; panel closes or previous shown
          clear()                → empties stack; all panels close
```

---

## 5. The `useActiveFilters` Hook (`src/hooks/useActiveFilters.ts`)

Every module that responds to global filters imports this single hook. It wraps `FilterContext` and exposes typed helper functions.

```typescript
const {
  region,        // '' | 'north' | 'south' | 'east' | 'west'
  dateRange,     // { preset, from: Date, to: Date }
  from,          // Date | null
  to,            // Date | null
  matchesRoute,  // (routeCode: string) => boolean
  matchesCity,   // (city: string) => boolean
  matchesDate,   // (isoString?: string) => boolean
} = useActiveFilters('ModuleName')
```

**Standard module pattern:**
```typescript
const baseList = useMemo(() =>
  RAW_DATA.filter(item =>
    matchesRoute(item.routeCode) && matchesDate(item.plannedAt)
  ),
  [region, dateRange],
)
```

**Helper implementations:**

| Helper | Implementation | Note |
|---|---|---|
| `matchesRoute(routeCode)` | `!region \|\| routeOriginRegion(routeCode) === region` | Works for `XXX-YYY-NN` format only |
| `matchesCity(city)` | `!region \|\| cityRegion(city) === region` | Regex match against city name |
| `matchesDate(isoString?)` | `!from \|\| !to \|\| matchesDateRange(isoString, from, to)` | Returns true if isoString is undefined |

**Exception — Operations CT:** Uses local `CITY_REGION` map and custom helper functions (`vehicleRegion`, `slaRegion`, `hubRegion`) instead of `matchesRoute`, because fleet vehicles use origin city names rather than route codes.

---

## 6. Module Architecture Summary

Each module follows the same structural pattern:

```
/pages/<module>/
├── <ModulePage>.tsx     # Page component: all business logic, filter integration, layout
├── components/          # Local sub-components (receive pre-filtered data as props)
│   ├── <Widget>.tsx     # Charts, cards, tables
│   └── <Panel>.tsx      # Detail panels, modals
└── mock/
    └── data.ts          # TypeScript mock data: interfaces, seed data, helper functions
```

**Data flow per module:**
```
mock/data.ts (RAW constants)
  → Page useMemo (baseList = filtered by region + date)
    → Page useMemo (localFiltered = filtered by local tab/search)
      → KPI strip (derived from localFiltered or baseList)
      → Data table / board (renders localFiltered)
      → Charts (derived from localFiltered or baseList)
      → Sub-components receive pre-filtered arrays as props (no filtering inside)
```

---

## 7. Executive CT Module Architecture (`/executive`)

### Component Hierarchy
```
ControlTowerPage
├── KPIStrip (8 KPI cards) — derived from kpiData useMemo
├── DispatchFunnel widget
│   ├── 7-stage bar chart — displayFunnel useMemo (region + dateScale scaled)
│   └── 7-day trend BarChart
├── LiveNetworkView widget
│   └── NetworkNodeCard × 10 — filtered by region
├── ExceptionCommandCenter widget
│   ├── DonutChart (category distribution)
│   ├── LineChart (7-day trend)
│   └── ExceptionRow × N — filtered by matchesCity + matchesDate
├── RoutePerformance widget
│   └── RouteRow × N — baseRoutes useMemo filtered by matchesRoute + matchesDate
├── CarrierPerformance widget
│   └── CarrierRow × N — filtered useMemo by region + dateRange
├── SLAHeatmap widget
│   └── cells useMemo filtered by routeOriginRegion; worstCell computed safely
└── AlertCenter widget
    └── AlertRow × 7 — regionDateFiltered useMemo by routeCode region + firedAt
```

**dateScale useMemo:**
```typescript
const dateScale = useMemo(() => {
  const days = Math.max(1, (to.getTime() - from.getTime()) / 86400000)
  return Math.round((days / 7) * 100) / 100
}, [from, to])
```

**kpiData useMemo deps:** `[region, dateRange, dateScale]`

### KPI Source Logic

| Filter State | KPI Source |
|---|---|
| Region = '' | `KPI_DATA` baseline values × `dateScale` for count metrics |
| Region = 'north' / 'south' / 'east' / 'west' | `REGION_SUMMARY.find(rs => rs.region.toLowerCase() === region)` values × `dateScale` |

---

## 8. Operations CT Module Architecture (`/operations`)

### Component Hierarchy
```
OperationsControlTower
├── KPIStrip (6 KPIs) — filteredKPI useMemo
├── FleetBoard
│   ├── Tab strip (All / In Transit / Delayed / Halted / Arrived)
│   └── VehicleCard × N — baseVehicles → localFiltered (by tab)
│       └── Click → VehicleDetailPanel (DrawerContext.push)
├── SLAWatchTable — filteredSLA useMemo
└── HubActivityFeed — filteredHubEvents useMemo
```

**Region Resolution for Fleet:**
```typescript
const CITY_REGION: Record<string, string> = {
  'Mumbai': 'west', 'Pune': 'west', 'Ahmedabad': 'west', 'Surat': 'west', 'Goa': 'west',
  'Delhi': 'north', 'Agra': 'north', 'Jaipur': 'north', 'Jodhpur': 'north',
  'Lucknow': 'north', 'Indore': 'north', 'Bhopal': 'north',
  'Bangalore': 'south', 'Chennai': 'south', 'Hyderabad': 'south', 'Vizag': 'south',
  'Kolkata': 'east', 'Patna': 'east', 'Bhubaneswar': 'east',
}

vehicleRegion(v: FleetVehicle) → CITY_REGION[v.origin] || ''
slaRegion(origin: string)      → CITY_REGION[origin] || ''
hubRegion(hub: string)         → CITY_REGION[hub.replace(' Hub', '')] || ''
```

**4 filter memos:**
- `baseVehicles` = `FLEET_VEHICLES.filter(v => vehicleRegion(v) matches region AND matchesDate(v.lastPingAt))`
- `filteredSLA` = `SLA_WATCH.filter(r => slaRegion(r.origin) matches AND matchesDate(r.plannedArrival))`
- `filteredHubEvents` = `HUB_EVENTS.filter(e => hubRegion(e.hub) matches AND matchesDate(e.scheduledAt))`
- `filteredKPI` = derived from `baseVehicles` + `filteredSLA` counts

---

## 9. Routing

All routes nested under `AppShell` via a single route wrapper.

| Path | Component | Module |
|---|---|---|
| `/executive` | ControlTowerPage | Executive CT |
| `/operations` | OperationsControlTower | Operations CT |
| `/dispatch/board` | DispatchWorkbench | Dispatch Management |
| `/dispatch/:id` | DispatchDetails | Dispatch Management |
| `/dispatch/:id/custody` | ChainOfCustody | Dispatch Management |
| `/transport/live` | TransportMonitor | Transport Monitor |
| `/load-planning` | LoadPlanning | Load Planning |
| `/hub-ops` | HubOperations | Origin Operations |
| `/dest-ops` | DestinationOps | Destination Operations |
| `/lifecycle` | DispatchLifecycle | Dispatch Lifecycle |
| `/exceptions` | ExceptionBoard | Exception Management |
| `/reconciliation` | ReconciliationCenter | Reconciliation Center |
| `/routes` | RoutePerformance | Route Management |
| `/carriers` | CarrierPerformance | Carrier Management |
| `/alerts` | AlertsCenter | CT Alerts |
| `/analytics/:tab` | AnalyticsDashboard | Analytics |
| `/master-data/:screen` | MasterDataDashboard | Master Data |
| `/admin` | AdminDashboard | Administration |
| `/profile` | ProfilePage | User Profile |
| `*` | redirect | → `/executive` |

Default entry: `/` redirects to `/executive`.

---

## 10. Filter Propagation Chain (Full Detail)

```
User interacts with GlobalFilterBar (top navigation)
  │
  ▼ dispatch to FilterContext
FilterContext.useReducer updates state
  │
  ▼ React Context propagation
All components subscribed via useActiveFilters() re-render
  │
  ▼ Per module: useMemo([region, dateRange]) recomputes
  baseList = RAW_DATA.filter(matchesX && matchesDate)
  │
  ▼ Downstream useMemos recompute (no deps on filter, only on baseList)
  filteredList  = baseList.filter(local tab + search filters)
  kpiValues     = derive counts from filteredList or baseList
  tabBadges     = per-status count from baseList
  chartData     = aggregate from baseList
  │
  ▼ React renders updated UI synchronously
No page reload. No loading state. No API call.
```

**What is NOT updated by filter change:**
- Analytics tab charts (pre-aggregated static data in v1.0)
- Master Data screens (configuration data, not operational)
- Admin screen

---

## 11. Data Layer

All data is TypeScript in-memory mock. Each `mock/data.ts` exports:

- **Interfaces**: TypeScript types for all entities in that module
- **Seed data**: Named constants (`FLEET_VEHICLES`, `SLA_WATCH`, etc.) — arrays of typed objects
- **Computed summaries**: Pre-aggregated KPI objects (e.g. `EXC_KPI`, `CARRIER_KPI`)
- **Time helpers**: `hago(n)` = n hours ago (ISO string); `h(n)` = n hours in future; `dago(n)` = n days ago — so all timestamps appear current relative to `Date.now()` at module load time

---

## 12. Component Design Principles

- **No prop drilling for filters** — all filter reads go through `useActiveFilters()`.
- **Pre-filter before passing** — sub-components (e.g. `KPIBar`, `SLAWatchTable`) receive pre-filtered arrays as props; they perform no filtering internally.
- **useMemo for all derived data** — every filtered or computed list is memoised with `[region, dateRange]` in the dependency array.
- **Charts are stateless** — `BarChart`, `LineChart`, `DonutChart`, `SparklineChart` are pure presentational; they accept `data` arrays and config props only.
- **Badges are semantic** — `StatusBadge`, `SeverityBadge`, `GradeBadge` derive colour from a value string, not a className — enforcing consistent token usage.

---

## 13. Styling System

Tailwind CSS v3 with a custom design token layer in `src/theme/tokens.ts`.

| Token Category | Values |
|---|---|
| Brand primary | `#1E3A5F` |
| Brand accent | `#3B82F6` |
| Surface | `#0F172A` |
| Success | `#16A34A` |
| Warning | `#D97706` |
| Danger | `#DC2626` |
| Info | `#2563EB` |
| Dispatch statuses | 8 states (planned, ready, dispatched, transit, arrived, unloading, reconciled, closed) |
| Severity levels | critical / high / medium / low / info |
| Route grades | A (green) / B (blue-green) / C (amber) / D (orange) / F (red) |
| Chart colours | `CHART_COLORS` array for Recharts series |

All colour decisions in component files reference `COLOR.*` from `tokens.ts` — never raw hex strings.

---

## 14. Build and Deployment

```
Development:   npm run dev     → Vite dev server, port 5173
Build:         npm run build   → tsc && vite build → dist/
Preview:       npm run preview → serve dist/ locally
Lint:          npm run lint    → ESLint with max-warnings 0
```

**CI/CD:** Push to `main` branch on GitHub triggers Vercel auto-deploy. No manual deploy step.

**Bundle:** ~1.3 MB JS uncompressed, ~316 KB gzip. Recharts is the dominant contributor. Code-splitting via `React.lazy` planned for v2.0.

---

## 15. Known Architectural Constraints

| Constraint | Detail | Planned Fix |
|---|---|---|
| No backend | All data is in-memory mock | Phase 1 — API integration |
| No auth | User is hard-coded as `APP_USER` in AppShell | Phase 2 — JWT auth + RBAC |
| No persistence | Filter state and alert state reset on page reload | Phase 1 — server state via TanStack Query |
| Route format gap | `routeOriginRegion()` returns empty for `RT-XXX-YYY-NN` format vehicles in Operations CT; resolved with local `CITY_REGION` map | v2.0 normalise route format |
| Analytics not filtered | Pre-aggregated static charts; global filter has no effect on chart data | Phase 7 — live-computed charts |
| No test suite | No unit or integration tests in v1.0 | Test suite in planned backlog |
| Large bundle | No code-splitting; all routes loaded upfront | Phase 1 — `React.lazy` per route |
