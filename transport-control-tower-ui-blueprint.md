# Transport Control Tower — UI Blueprint
## Master Design & Architecture Reference

**Scope:** All UI phases 1–7 consolidated  
**Covers:** Screen inventory · React folder structure · Layout architecture · Navigation · Shared components · Design system · Color palette · Typography · Responsive behavior · Enterprise UX standards  
**Does not cover:** Business logic, API implementation, data transformation

---

## TABLE OF CONTENTS

1. [Complete Screen Inventory](#1-complete-screen-inventory)
2. [React Folder Structure](#2-react-folder-structure)
3. [Layout Architecture](#3-layout-architecture)
4. [Navigation Architecture](#4-navigation-architecture)
5. [Shared Component Library](#5-shared-component-library)
6. [Design System](#6-design-system)
7. [Color Palette](#7-color-palette)
8. [Typography](#8-typography)
9. [Responsive Behavior](#9-responsive-behavior)
10. [Enterprise UX Standards](#10-enterprise-ux-standards)

---

## 1. COMPLETE SCREEN INVENTORY

### Summary Count

| Level | Count |
|-------|-------|
| L1 Modules | 13 |
| L2 Screens | 54 |
| L3 Drawers / Workspaces | 18 |
| Modals | 14 |
| **Total addressable screens** | **99** |

---

### MODULE 1 — Executive Control Tower `/executive`

| # | Level | Screen | Route | Default |
|---|-------|--------|-------|---------|
| 1.1 | L2 | Executive Dashboard | `/executive/overview` | ★ |
| 1.2 | L2 | Network Health | `/executive/network-health` | |
| 1.3 | L2 | Cost Performance | `/executive/cost-performance` | |
| 1.4 | L2 | SLA Compliance | `/executive/sla-compliance` | |
| 1.5 | L3 | Route Detail Drawer | `/executive/overview` → drawer | |
| 1.6 | L3 | Carrier Detail Drawer | `/executive/overview` → drawer | |
| 1.7 | L3 | Dispatch Detail Drawer | `/executive/overview` → drawer | |

**Widgets on L2.1:** 9-KPI strip · Network SVG map · Dispatch lifecycle funnel · Exception command center (4 severity columns) · Route performance table · Carrier performance table · SLA heatmap (region/route toggle) · Alert center · Recent events feed

---

### MODULE 2 — Operations Control Tower `/operations`

| # | Level | Screen | Route | Default |
|---|-------|--------|-------|---------|
| 2.1 | L2 | Live Operations View | `/operations/live` | ★ |
| 2.2 | L2 | Active Dispatch Tracker | `/operations/dispatch-tracker` | |
| 2.3 | L2 | Live Exception Queue | `/operations/exception-queue` | |
| 2.4 | L2 | Integration Monitor | `/operations/integration-status` | |
| 2.5 | L3 | Dispatch Detail Drawer | `/operations/dispatch-tracker/:id` | |

**Layout variant:** Split panel — left 65% live feed / right 35% at-risk + exception summary + integration health

---

### MODULE 3 — Dispatch Management `/dispatch`

| # | Level | Screen | Route | Default |
|---|-------|--------|-------|---------|
| 3.1 | L2 | Dispatch Board | `/dispatch/board` | ★ |
| 3.2 | L2 | Create Dispatch | `/dispatch/new` | |
| 3.3 | L2 | Bulk Import | `/dispatch/bulk-import` | |
| 3.4 | L3 | Dispatch Detail (7-tab) | `/dispatch/:id` | |

**Dispatch Detail tabs:** Overview · HU Manifest · Exceptions · Documents · Tracking · Chain of Custody · Audit Trail  
**Dispatch Board tabs (inline):** All · Planned · Ready · Dispatched · In Transit · Arrived · Unloading · Reconciled · Closed

---

### MODULE 4 — Transport Execution `/transport`

| # | Level | Screen | Route | Default |
|---|-------|--------|-------|---------|
| 4.1 | L2 | Live Execution View | `/transport/live` | ★ |
| 4.2 | L2 | Departure Control | `/transport/departures` | |
| 4.3 | L2 | Arrival Control | `/transport/arrivals` | |
| 4.4 | L2 | Tracking Feed | `/transport/tracking` | |
| 4.5 | L3 | Transport Monitoring Detail | `/transport/live/:id` | |

---

### MODULE 5 — Exception Management `/exceptions`

| # | Level | Screen | Route | Default |
|---|-------|--------|-------|---------|
| 5.1 | L2 | Exception Dashboard | `/exceptions/dashboard` | ★ |
| 5.2 | L2 | Exception Queue | `/exceptions/queue` | |
| 5.3 | L2 | Root Cause Analysis | `/exceptions/root-cause` | |
| 5.4 | L2 | SLA Impact Report | `/exceptions/sla-impact` | |
| 5.5 | L2 | Escalation Workflow | `/exceptions/escalation` | |
| 5.6 | L2 | Resolution Center | `/exceptions/resolution` | |
| 5.7 | L3 | Exception Detail (5-tab) | `/exceptions/:id` | |
| 5.8 | Modal | Raise Exception | Overlay | |

**Exception Detail tabs:** Overview · Timeline · Actions · Comments · Root Cause  
**Exception Queue view tabs:** All · My Queue · Unassigned · Escalated · Critical · Resolved

---

### MODULE 6 — Reconciliation Center `/reconciliation`

| # | Level | Screen | Route | Default |
|---|-------|--------|-------|---------|
| 6.1 | L2 | Reconciliation Dashboard | `/reconciliation/dashboard` | ★ |
| 6.2 | L2 | Receiving Queue | `/reconciliation/queue` | |
| 6.3 | L2 | Reconciliation History | `/reconciliation/history` | |
| 6.4 | L2 | Reconciliation Exceptions | `/reconciliation/exceptions` | |
| 6.5 | L3 | Scan Session Workspace | `/reconciliation/scan/:dispatchId` | |
| 6.6 | L3 | Reconciliation Report | `/reconciliation/report/:dispatchId` | |
| 6.7 | L3 | Missing HU Dashboard | Within scan workspace | |
| 6.8 | L3 | Excess HU Dashboard | Within scan workspace | |
| 6.9 | L3 | Discrepancy Resolution | Within scan workspace | |

**Warehouse UX:** Full-screen layout, 48px+ touch targets, HID scanner input, full-screen flash feedback

---

### MODULE 7 — Route Performance `/routes`

| # | Level | Screen | Route | Default |
|---|-------|--------|-------|---------|
| 7.1 | L2 | Route Scorecard | `/routes/scorecard` | ★ |
| 7.2 | L2 | Route SLA Analysis | `/routes/sla-analysis` | |
| 7.3 | L2 | Route Delay Analysis | `/routes/delay-analysis` | |
| 7.4 | L2 | Route Utilization | `/routes/utilization` | |
| 7.5 | L3 | Route Detail Drawer | `/routes/:routeId` | |

---

### MODULE 8 — Carrier Performance `/carriers`

| # | Level | Screen | Route | Default |
|---|-------|--------|-------|---------|
| 8.1 | L2 | Carrier Ranking | `/carriers/ranking` | ★ |
| 8.2 | L2 | Carrier SLA Compliance | `/carriers/sla-compliance` | |
| 8.3 | L2 | Carrier Delay Profile | `/carriers/delay-profile` | |
| 8.4 | L2 | Carrier Cost Efficiency | `/carriers/cost-efficiency` | |
| 8.5 | L3 | Carrier Detail Drawer | `/carriers/:carrierId` | |

---

### MODULE 9 — Load Planning `/load-planning`

| # | Level | Screen | Route | Default |
|---|-------|--------|-------|---------|
| 9.1 | L2 | Fleet Capacity Overview | `/load-planning/capacity` | ★ |
| 9.2 | L2 | Consolidation Opportunities | `/load-planning/consolidation` | |
| 9.3 | L2 | SLA vs Cost Simulation | `/load-planning/scenarios` | |
| 9.4 | L2 | Vehicle Recommendations | `/load-planning/recommendations` | |
| 9.5 | L2 | Route Optimization | `/load-planning/route-optimization` | |
| 9.6 | L2 | Planning Analytics | `/load-planning/analytics` | |

**Layout variant:** Split configurator — left inputs 38% / right results 62%, both independently scrollable

---

### MODULE 10 — Control Tower Alerts `/alerts`

| # | Level | Screen | Route | Default |
|---|-------|--------|-------|---------|
| 10.1 | L2 | Active Alert Feed | `/alerts/active` | ★ |
| 10.2 | L2 | SLA Breach Log | `/alerts/sla-breaches` | |
| 10.3 | L2 | High-Risk Dispatch Monitor | `/alerts/high-risk` | |
| 10.4 | L2 | Alert History | `/alerts/history` | |

---

### MODULE 11 — Analytics `/analytics`

| # | Level | Screen | Route | Default |
|---|-------|--------|-------|---------|
| 11.1 | L2 | Operations Analytics | `/analytics/operations` | ★ |
| 11.2 | L2 | Carrier Analytics | `/analytics/carrier` | |
| 11.3 | L2 | Route Analytics | `/analytics/route` | |
| 11.4 | L2 | Reconciliation Analytics | `/analytics/reconciliation` | |
| 11.5 | L2 | Data Export Center | `/analytics/export` | |

---

### MODULE 12 — Master Data `/master-data`

| # | Level | Screen | Route | Default |
|---|-------|--------|-------|---------|
| 12.1 | L2 | Route Master | `/master-data/routes` | ★ |
| 12.2 | L2 | Schedule Master | `/master-data/schedules` | |
| 12.3 | L2 | Carrier Master | `/master-data/carriers` | |
| 12.4 | L2 | Vehicle Master | `/master-data/vehicles` | |
| 12.5 | L2 | Location Master | `/master-data/locations` | |
| 12.6 | L2 | SLA Master | `/master-data/sla-config` | |
| 12.7 | L2 | Exception Master | `/master-data/exception-codes` | |

---

### MODULE 13 — Administration `/admin`

| # | Level | Screen | Route | Default |
|---|-------|--------|-------|---------|
| 13.1 | L2 | User Management | `/admin/users` | ★ |
| 13.2 | L2 | Role Management | `/admin/roles` | |
| 13.3 | L2 | System Configuration | `/admin/system` | |
| 13.4 | L2 | API Key Management | `/admin/api-keys` | |
| 13.5 | L2 | Webhook Management | `/admin/webhooks` | |
| 13.6 | L2 | Integration Monitor | `/admin/integration-monitor` | |
| 13.7 | L2 | Notification Config | `/admin/notifications` | |

---

### Global Modals & Overlays

| # | Modal | Trigger |
|---|-------|---------|
| M1 | Create Dispatch | [+ New Dispatch] toolbar |
| M2 | Raise Exception | [+ Raise Exception] toolbar |
| M3 | Assign Exception | Inline from queue row |
| M4 | Escalate Exception | Exception card / detail |
| M5 | Resolve Exception | Resolution center |
| M6 | Bulk Resolve | Exception queue bulk action |
| M7 | Apply Consolidation | Consolidation suggestion card |
| M8 | Confirm Dispatch | Load planning scenario select |
| M9 | Bulk Upload | Every master screen |
| M10 | Column Configurator | Every grid screen |
| M11 | Save Filter Preset | Global filter bar |
| M12 | User Invite | User management |
| M13 | Scan Complete / POD | Scan session completion |
| M14 | Dangerous Action Confirm | System config destructive ops |

---

## 2. REACT FOLDER STRUCTURE

```
src/
│
├── app/
│   ├── App.jsx                          # Root — router + context providers
│   ├── AppRoutes.jsx                    # All route definitions
│   ├── ProtectedRoute.jsx               # Auth + role guard
│   └── ErrorBoundary.jsx
│
├── pages/                               # One folder per L1 module
│   ├── executive/
│   │   ├── ExecutiveControlTower.jsx    # Page root, data orchestration
│   │   ├── NetworkHealth.jsx
│   │   ├── CostPerformance.jsx
│   │   └── SLACompliance.jsx
│   │
│   ├── operations/
│   │   ├── OperationsLive.jsx
│   │   ├── DispatchTracker.jsx
│   │   ├── ExceptionQueue.jsx
│   │   └── IntegrationStatus.jsx
│   │
│   ├── dispatch/
│   │   ├── DispatchBoard.jsx
│   │   ├── CreateDispatch.jsx
│   │   └── BulkImport.jsx
│   │
│   ├── transport/
│   │   ├── TransportLive.jsx
│   │   ├── DepartureControl.jsx
│   │   ├── ArrivalControl.jsx
│   │   └── TrackingFeed.jsx
│   │
│   ├── exceptions/
│   │   ├── ExceptionDashboard.jsx
│   │   ├── ExceptionQueuePage.jsx
│   │   ├── RootCauseAnalysis.jsx
│   │   ├── SLAImpactReport.jsx
│   │   ├── EscalationWorkflow.jsx
│   │   └── ResolutionCenter.jsx
│   │
│   ├── reconciliation/
│   │   ├── ReconciliationDashboard.jsx
│   │   ├── ReceivingQueue.jsx
│   │   ├── ReconciliationHistory.jsx
│   │   └── ReconciliationExceptions.jsx
│   │
│   ├── routes/
│   │   ├── RouteScorecard.jsx
│   │   ├── RouteSLAAnalysis.jsx
│   │   ├── RouteDelayAnalysis.jsx
│   │   └── RouteUtilization.jsx
│   │
│   ├── carriers/
│   │   ├── CarrierRanking.jsx
│   │   ├── CarrierSLACompliance.jsx
│   │   ├── CarrierDelayProfile.jsx
│   │   └── CarrierCostEfficiency.jsx
│   │
│   ├── planning/
│   │   ├── FleetCapacity.jsx
│   │   ├── ConsolidationOpportunities.jsx
│   │   ├── ScenarioSimulator.jsx
│   │   ├── VehicleRecommendations.jsx
│   │   ├── RouteOptimization.jsx
│   │   └── PlanningAnalytics.jsx
│   │
│   ├── alerts/
│   │   ├── ActiveAlerts.jsx
│   │   ├── SLABreachLog.jsx
│   │   ├── HighRiskMonitor.jsx
│   │   └── AlertHistory.jsx
│   │
│   ├── analytics/
│   │   ├── OperationsAnalytics.jsx
│   │   ├── CarrierAnalytics.jsx
│   │   ├── RouteAnalytics.jsx
│   │   ├── ReconciliationAnalytics.jsx
│   │   └── DataExport.jsx
│   │
│   ├── master-data/
│   │   ├── RouteMaster.jsx
│   │   ├── ScheduleMaster.jsx
│   │   ├── CarrierMaster.jsx
│   │   ├── VehicleMaster.jsx
│   │   ├── LocationMaster.jsx
│   │   ├── SLAMaster.jsx
│   │   └── ExceptionMaster.jsx
│   │
│   └── admin/
│       ├── UserManagement.jsx
│       ├── RoleManagement.jsx
│       ├── SystemConfig.jsx
│       ├── APIKeyManagement.jsx
│       ├── WebhookManagement.jsx
│       ├── IntegrationMonitor.jsx
│       └── NotificationConfig.jsx
│
├── components/
│   │
│   ├── shell/                           # App shell (persistent across all pages)
│   │   ├── AppShell.jsx
│   │   ├── TopNavigationBar.jsx
│   │   ├── LeftNavigationBar.jsx
│   │   ├── NavGroup.jsx
│   │   ├── NavItem.jsx
│   │   ├── GlobalFilterBar.jsx
│   │   ├── FilterChip.jsx
│   │   ├── GlobalAlertRail.jsx
│   │   ├── AlertRailCard.jsx
│   │   ├── Breadcrumb.jsx
│   │   ├── PageHeader.jsx
│   │   └── SyncIndicator.jsx
│   │
│   ├── drawers/                         # L3 right-side drawers
│   │   ├── DrawerContainer.jsx          # Shell: header, tabs, footer, overlay
│   │   ├── DrawerHeader.jsx
│   │   ├── DrawerTabStrip.jsx
│   │   ├── DrawerActionFooter.jsx
│   │   ├── DispatchDetailDrawer.jsx
│   │   ├── RouteDetailDrawer.jsx
│   │   ├── CarrierDetailDrawer.jsx
│   │   ├── ExceptionDetailDrawer.jsx
│   │   └── HUCustodyDrawer.jsx
│   │
│   ├── modals/                          # Full overlay modals
│   │   ├── ModalContainer.jsx
│   │   ├── CreateDispatchModal.jsx
│   │   ├── RaiseExceptionModal.jsx
│   │   ├── AssignExceptionModal.jsx
│   │   ├── EscalateModal.jsx
│   │   ├── ResolveExceptionModal.jsx
│   │   ├── BulkResolveModal.jsx
│   │   ├── ConsolidationApplyModal.jsx
│   │   ├── ConfirmDispatchModal.jsx
│   │   ├── BulkUploadModal.jsx
│   │   ├── ColumnConfigModal.jsx
│   │   ├── FilterPresetModal.jsx
│   │   ├── InviteUserModal.jsx
│   │   └── DangerConfirmModal.jsx
│   │
│   ├── kpi/                             # KPI cards and strips
│   │   ├── KPIStrip.jsx
│   │   ├── KPICard.jsx
│   │   ├── KPILabel.jsx
│   │   ├── KPIValue.jsx
│   │   ├── KPITrendBadge.jsx
│   │   ├── KPIProgressBar.jsx
│   │   └── KPIStatusDot.jsx
│   │
│   ├── charts/                          # All chart components
│   │   ├── SparklineChart.jsx           # 60×20px inline trend
│   │   ├── BarChart.jsx                 # Horizontal/vertical bar
│   │   ├── StackedBarChart.jsx
│   │   ├── DonutChart.jsx
│   │   ├── LineChart.jsx                # Multi-series line / trend
│   │   ├── HeatBar.jsx                  # Single-row heat bar (SLA)
│   │   ├── HeatmapTable.jsx             # Table with embedded heat bars
│   │   ├── ScoreRadarChart.jsx          # SVG pentagon — route scoring
│   │   ├── CapacityMeter.jsx            # 3-bar capacity (weight/CBM/HU)
│   │   ├── UtilHeatmap.jsx              # Route × vehicle utilization grid
│   │   ├── PriorityMatrix.jsx           # 4-quadrant SVG (severity × SLA)
│   │   └── SensitivityChart.jsx         # Cost vs SLA sensitivity
│   │
│   ├── map/                             # Network visibility map
│   │   ├── NetworkVisibilityMap.jsx
│   │   ├── MapCanvas.jsx                # SVG renderer
│   │   ├── LocationNode.jsx
│   │   ├── RouteEdge.jsx
│   │   ├── VehicleMarker.jsx
│   │   ├── VehicleMiniCard.jsx
│   │   ├── MapLegend.jsx
│   │   └── MapQuickStatsBar.jsx
│   │
│   ├── tables/                          # Data grid infrastructure
│   │   ├── DataTable.jsx                # Universal sortable/paginated table
│   │   ├── TableHeader.jsx
│   │   ├── TableRow.jsx
│   │   ├── TableCell.jsx
│   │   ├── TablePagination.jsx
│   │   ├── TableFilterBar.jsx
│   │   ├── TableToolbar.jsx
│   │   ├── TableBulkActionBar.jsx
│   │   ├── TableEmptyState.jsx
│   │   └── TableSkeletonRows.jsx
│   │
│   ├── admin/                           # Admin/master data specific
│   │   ├── MasterGrid.jsx               # Admin grid extension of DataTable
│   │   ├── MasterGridRow.jsx            # Inline edit + dirty indicator
│   │   ├── InlineCellEditor.jsx
│   │   ├── BulkUploadFlow.jsx
│   │   ├── ExportButton.jsx
│   │   ├── ColumnConfigurator.jsx
│   │   ├── AuditTrailDrawer.jsx
│   │   └── ExpiryAlertBadge.jsx
│   │
│   ├── dispatch/                        # Dispatch-specific components
│   │   ├── DispatchKanbanBoard.jsx
│   │   ├── KanbanColumn.jsx
│   │   ├── DispatchCard.jsx
│   │   ├── DispatchStatusBadge.jsx
│   │   ├── SLAClock.jsx                 # 4 variants: bar/ring/compact/text
│   │   ├── DispatchLifecycleFunnel.jsx
│   │   ├── FunnelBar.jsx
│   │   └── StageHealthPanel.jsx
│   │
│   ├── exceptions/                      # Exception-specific components
│   │   ├── ExceptionCommandCenter.jsx
│   │   ├── ExceptionSeverityColumn.jsx
│   │   ├── ExceptionCard.jsx
│   │   ├── ExceptionQueueRow.jsx
│   │   ├── SeverityBadge.jsx            # pulse prop for CRITICAL
│   │   ├── StateBadge.jsx
│   │   ├── ExceptionTimeline.jsx
│   │   ├── ExceptionTimelineNode.jsx    # 9 node types
│   │   ├── BayesianCauseBar.jsx         # Confidence %, evidence, pattern
│   │   ├── EscalationChainStepper.jsx   # SVG 4-level stepper
│   │   └── ResolutionForm.jsx
│   │
│   ├── reconciliation/                  # Warehouse / scan components
│   │   ├── ScanSessionWorkspace.jsx
│   │   ├── BarcodeInputField.jsx        # Auto-focus, scanner-ready
│   │   ├── ScanFeedbackOverlay.jsx      # Full-screen flash (5 variants)
│   │   ├── ScanProgressBar.jsx          # Segmented OK/Dup/Wrong/Tamper
│   │   ├── HUScanList.jsx
│   │   ├── HUScanRow.jsx
│   │   ├── ScanCounterStrip.jsx
│   │   ├── ReceivingDashboardCard.jsx
│   │   ├── DwellTimeBadge.jsx
│   │   ├── ReconciliationResultBanner.jsx # 3 variants: perfect/partial/severe
│   │   └── SignaturePODPanel.jsx
│   │
│   ├── planning/                        # Planning workbench components
│   │   ├── SplitConfiguratorLayout.jsx  # 38/62 split wrapper
│   │   ├── ScenarioCard.jsx
│   │   ├── ConsolidationGroupCard.jsx   # Recommended/Possible/Risky
│   │   ├── GradeBadge.jsx               # A–F with colors
│   │   ├── AllVehicleSizesTable.jsx
│   │   ├── CostSpeedSlider.jsx          # 0=cost, 100=speed
│   │   └── CostComparisonBars.jsx
│   │
│   └── shared/                          # Universal shared primitives
│       ├── Badge.jsx                    # Generic colored pill badge
│       ├── StatusBadge.jsx              # Dispatch status colors
│       ├── TrendBadge.jsx               # ▲▼━ with color
│       ├── ProgressBar.jsx
│       ├── TabStrip.jsx
│       ├── WidgetCard.jsx
│       ├── WidgetCardHeader.jsx
│       ├── EmptyState.jsx
│       ├── SkeletonLoader.jsx
│       ├── TimeAgo.jsx
│       ├── Tooltip.jsx
│       ├── ActionButton.jsx
│       ├── ConfirmPopover.jsx           # Inline confirm (not full modal)
│       ├── SearchInput.jsx
│       ├── FilterDropdown.jsx
│       ├── DateRangePicker.jsx
│       ├── MultiSelectDropdown.jsx
│       ├── UserAvatarBadge.jsx          # Initials + color
│       ├── CopyToClipboard.jsx
│       └── ExternalLink.jsx
│
├── hooks/                               # Custom React hooks
│   │
│   ├── data/
│   │   ├── useDashboardData.js          # Master orchestration hook
│   │   ├── useKPIData.js
│   │   ├── useDispatchList.js
│   │   ├── useDispatchDetail.js
│   │   ├── useExceptionData.js
│   │   ├── useRouteData.js
│   │   ├── useCarrierData.js
│   │   ├── useReconciliationData.js
│   │   ├── usePlanningData.js
│   │   ├── useAlertData.js
│   │   └── useAdminData.js
│   │
│   ├── ui/
│   │   ├── useAutoRefresh.js            # Interval polling, tab-aware pause
│   │   ├── useGlobalFilters.js          # Filter state + sessionStorage
│   │   ├── useDrawer.js                 # Drawer open/close/stacking
│   │   ├── useModal.js                  # Modal open/close + payload
│   │   ├── useBarcodeScanner.js         # HID scanner vs keyboard detection
│   │   ├── useColumnPrefs.js            # Column show/hide per user/screen
│   │   ├── useLocalSort.js              # Client-side table sort
│   │   └── usePagination.js
│   │
│   └── auth/
│       ├── useAuth.js                   # Current user + permissions
│       ├── usePermission.js             # can(module, action) guard
│       └── useRegionScope.js            # Scoped data access
│
├── context/
│   ├── FilterContext.jsx                # Global filter state
│   ├── DrawerContext.jsx                # Drawer stack state
│   ├── AlertContext.jsx                 # Live alert state
│   ├── AuthContext.jsx                  # User session
│   ├── PlanningContext.jsx              # Shared route/vehicle/period state
│   └── ExceptionCommandContext.jsx      # Shared exception filter state
│
├── services/
│   ├── dashboardBridge.js              # window.TCT.* → React bridge
│   ├── dispatchBridge.js
│   ├── exceptionBridge.js
│   ├── reconciliationBridge.js
│   ├── planningBridge.js
│   └── adminBridge.js
│
├── styles/
│   ├── tokens.css                      # All CSS custom properties
│   ├── global.css                      # Base reset + body styles
│   ├── typography.css                  # Font scale utility classes
│   ├── layout.css                      # Grid helpers
│   └── animations.css                  # Keyframes (pulse, fade, slide)
│
└── utils/
    ├── formatters.js                   # ₹ formatting, date, duration
    ├── statusConfig.js                 # Status → color/label maps
    ├── severityConfig.js               # Severity → color/icon/SLA maps
    ├── gradeConfig.js                  # A–F → color/label maps
    └── permissions.js                  # Permission matrix constants
```

---

## 3. LAYOUT ARCHITECTURE

### 3.1 Application Shell

```
┌────────────────────────────────────────────────────────────────────────┐
│ TOP NAVIGATION BAR                                          [H: 56px]  │
│ [Logo] [Global Filters ─────────────────────] [🔔] [+ New] [👤 User]  │
├────────────┬───────────────────────────────────────────────────────────┤
│            │ BREADCRUMB                                     [H: 36px]  │
│  LEFT NAV  │ Home › Module › Screen › Detail                          │
│            ├───────────────────────────────────────────────────────────┤
│  [W:220px] │ PAGE HEADER                                    [H: 52px]  │
│            │ Screen Title              [Primary CTA] [Export] [Refresh]│
│  collapsed ├───────────────────────────────────────────────────────────┤
│  [W: 56px] │ TAB STRIP (L2 navigation)                      [H: 44px]  │
│            │ Tab 1 | Tab 2 | Tab 3                                      │
│  Module    ├───────────────────────────────────────────────────────────┤
│  groups    │                                                            │
│  + badges  │  MAIN CONTENT AREA          [flex, fills remaining height] │
│            │                                                            │
│            │  [Filter Bar — per screen]                                 │
│            │  [KPI Cards — when applicable]                             │
│            │  [Primary Content: Table / Widget Grid / Split Panel]      │
│            │                                                            │
│            │                                                            │
│            │                                              [Pagination]  │
└────────────┴───────────────────────────────────────────────────────────┘
                                         ▲
                            GLOBAL ALERT RAIL (fixed, bottom-right)
                            Max 3 alerts visible, slides up on new alert
```

**Shell CSS grid:**
```css
.app-shell {
  display: grid;
  grid-template-rows: 56px 1fr;        /* top-nav + content */
  grid-template-columns: var(--nav-width) 1fr;
  height: 100vh;
  overflow: hidden;
}
/* --nav-width: 220px (expanded) | 56px (collapsed) */
/* Transitions on toggle: 200ms ease */

.main-content-wrapper {
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.main-content-area {
  flex: 1;
  overflow-y: auto;
  padding: 0 var(--space-6);
}
```

---

### 3.2 Five Content Layout Variants

#### Variant A — KPI Dashboard Layout
*Used by: Executive CT, Operations CT*

```
┌──────┬──────┬──────┬──────┐
│ KPI  │ KPI  │ KPI  │ KPI  │   Row 1: 4-col equal grid
└──────┴──────┴──────┴──────┘
┌──────┬──────┬──────┬──────┐
│ KPI  │ KPI  │ KPI  │ KPI  │   Row 2: 4-col equal grid (9th card wraps)
└──────┴──────┴──────┴──────┘
┌────────────────────┬───────┐
│ Chart / Map (60%)  │ Panel │   Row 3: 60/40 two-col
└────────────────────┴───────┘
┌────────────────────────────┐
│ Full-width widget          │   Row N: full-width
└────────────────────────────┘

css: display: grid; grid-template-columns: repeat(4, 1fr); gap: var(--space-4);
```

#### Variant B — List / Table Layout
*Used by: Dispatch Board, Exception Queue, Carrier Ranking, Route Scorecard, all Master screens*

```
[FILTER BAR]     [Search ───────────] [Filter ▼] [Filter ▼] [Reset] [Export]
[SUMMARY STRIP]  Total: 247  |  Active: 198  |  At-Risk: 12  |  Breached: 3
[TABLE]          Full width, sticky header, row-level status color, last-col actions
[PAGINATION]     [< 1 2 3 >]    Showing 1–50 of 247    [50/page ▼]
```

#### Variant C — Split Panel Layout
*Used by: Operations CT live view, Transport Monitoring detail*

```
┌──────────────────────────┬─────────────────┐
│ LEFT: Primary feed (65%) │ RIGHT: Side pane│
│ Alert feed / Tracker     │ At-Risk summary │
│                          │ Exception queue │
│                          │ Integration hlth│
└──────────────────────────┴─────────────────┘
css: display: grid; grid-template-columns: 65fr 35fr; gap: var(--space-4);
```

#### Variant D — Warehouse Scan Workspace
*Used by: Scan Session, Reconciliation workspace screens*

```
┌──────────────────────────────────────────────────┐
│ HEADER: Dispatch | Expected: N | Progress ██░░░░ │  [H: 80px, touch-friendly]
├──────────────────────────────────────────────────┤
│ SCANNER INPUT    [Barcode ─────────────────────] │  [H: 96px, 48px input]
│                  Status feedback text             │
├──────────────────────────────────────────────────┤
│ COUNTERS  ✓ Accepted: N  ✗ Rejected: N  ⚠ Dup: N│  [H: 64px]
├──────────────────────────────────────────────────┤
│ HU LIST TABLE  (remaining height, scrollable)    │
│ Barcode | Status | Scanned At | Flag             │
└──────────────────────────────────────────────────┘
Full-screen flash overlays rendered at portal level (z-index: 9999)
```

#### Variant E — Split Configurator Layout
*Used by: Load Planning, SLA vs Cost Simulation, Vehicle Recommendations*

```
┌───────────────────┬────────────────────────────────┐
│ INPUT PANEL (38%) │ OUTPUT PANEL (62%)              │
│ Form controls     │ Scenario cards / Results        │
│ Route selector    │ Comparison tables               │
│ Load params       │ Recommendation panels           │
│ [Run / Apply]     │ [Select & Create Dispatch]      │
│ (scrollable)      │ (scrollable, independent)       │
└───────────────────┴────────────────────────────────┘
css: display: grid; grid-template-columns: 38fr 62fr;
     overflow: hidden;  (children scroll independently)
```

---

### 3.3 L3 Drawer System

```
DRAWER SPECIFICATIONS
─────────────────────────────────────────────────────
Width (L1 drawer):    620px
Width (L2 stacked):   560px (offset 60px left)
Width (L3 stacked):   480px (offset 60px left of L2)
Max stack depth:      3
Position:             Fixed right, full viewport height
Backdrop:             rgba(15,23,42,0.55) — dims page
Animation:            slideInFromRight 250ms cubic-bezier(0.4,0,0.2,1)
Close triggers:       × button | Escape key | backdrop click
─────────────────────────────────────────────────────

DRAWER INTERNAL LAYOUT
┌──────────────────────────────────────────┐
│ HEADER [H: 64px]                         │
│ [← Back]  [Badge] [ID] [Status]  [×]    │
├──────────────────────────────────────────┤
│ BREADCRUMB [H: 28px]  (if stacked)       │
│ Routes › RT-001 › TCT-0019               │
├──────────────────────────────────────────┤
│ TAB STRIP [H: 44px]                      │
│ Tab1 | Tab2 | Tab3 | Tab4                │
├──────────────────────────────────────────┤
│ CONTENT (flex: 1, overflow-y: auto)      │
│                                          │
│ [Section content]                        │
│                                          │
├──────────────────────────────────────────┤
│ ACTION FOOTER [H: 64px] (fixed bottom)  │
│ [Secondary]              [Primary CTA]   │
└──────────────────────────────────────────┘
```

---

### 3.4 Admin Panel Layout

```
MASTER DATA SCREENS
─────────────────────────────────────────────────────────
TOOLBAR:    [+ Add] [📥 Upload] [📤 Export] [Delete]  [Column ⚙] [Refresh]
FILTER BAR: [Filter ▼] [Filter ▼] [Search 🔍]  [Clear]
GRID:       Full-width, inline-editable, dirty-row highlighting
SIDE PANEL: 400px, slides in on row click (no navigation)
─────────────────────────────────────────────────────────

SYSTEM CONFIG SCREEN
─────────────────────────────────────────────────────────
┌────────────────────┬───────────────────────────────────┐
│ SETTINGS SIDEBAR   │ CONFIG PANEL                      │
│ (200px)            │ (fills remaining width)            │
│ ● General          │ Form fields for selected section  │
│ ○ Notifications    │ Grouped with visual separators    │
│ ○ Security         │ [Save Section] per group          │
│ ...                │                                   │
└────────────────────┴───────────────────────────────────┘
```

---

## 4. NAVIGATION ARCHITECTURE

### 4.1 Navigation Model Overview

```
THREE-TIER NAVIGATION
─────────────────────────────────────────────────────
L1: Left navigation (module selection)
    → Persistent, collapsible, role-filtered
    → 13 modules grouped into 8 nav groups
    → Alert count badges per module

L2: Tab strip (section within module)
    → Below page header, sticky
    → Renders the main content area
    → URL-driven — each tab has unique path

L3: Right-side drawer (detail over L2)
    → Slides in over content, max 3 stacked
    → Does NOT navigate away from L2
    → Breadcrumb shows full drill path
─────────────────────────────────────────────────────
```

### 4.2 Left Navigation Structure

```
╔══════════════════════════════╗
║  🚛 TCT Control Tower        ║
╠══════════════════════════════╣
║ ▸ MONITORING                 ║
║  ┣━ Executive CT        [2]  ║  → /executive
║  ┗━ Operations CT       [7]  ║  → /operations
╠══════════════════════════════╣
║ ▸ EXECUTION                  ║
║  ┣━ Dispatch Mgmt       [3]  ║  → /dispatch
║  ┣━ Transport Exec      [1]  ║  → /transport
║  ┗━ Load Planning            ║  → /load-planning
╠══════════════════════════════╣
║ ▸ EXCEPTIONS                 ║
║  ┗━ Exception Mgmt      [9]  ║  → /exceptions
╠══════════════════════════════╣
║ ▸ RECONCILIATION             ║
║  ┗━ Reconciliation Ctr       ║  → /reconciliation
╠══════════════════════════════╣
║ ▸ PERFORMANCE                ║
║  ┣━ Route Performance        ║  → /routes
║  ┗━ Carrier Performance      ║  → /carriers
╠══════════════════════════════╣
║ ▸ ALERTS                     ║
║  ┗━ CT Alerts           [4]  ║  → /alerts
╠══════════════════════════════╣
║ ▸ INTELLIGENCE               ║
║  ┗━ Analytics                ║  → /analytics
╠══════════════════════════════╣
║ ▸ CONFIGURATION              ║
║  ┣━ Master Data              ║  → /master-data
║  ┗━ Administration           ║  → /admin
╚══════════════════════════════╝
```

### 4.3 Nav Badge Rules

```
Badge visibility:   shown only when count > 0
Badge color:        🔴 red = ≥1 CRITICAL alert in module
                    🟠 amber = ≥1 HIGH alert, no CRITICAL
                    no badge = healthy
Badge count source: AlertService.getAll() — filtered per module
Badge refresh:      every 15 seconds (same as alert polling)
```

### 4.4 Top Navigation Bar

```
LEFT        [🚛 Logo / Name]  [≡ Collapse nav]

CENTER      [📅 Date Range ▼] [🌍 Region ▼] [🛣 Route ▼] [🚚 Carrier ▼]
            [Active chips: Region: North ×]  [Reset Filters]

RIGHT       [🔔 4]  [+ New ▼ → Dispatch / Exception / Escalate]  [👤 User ▼]
```

### 4.5 Global Filter Behavior

| Filter | Type | Default | Persist |
|--------|------|---------|---------|
| Date Range | Single-select with custom range | Last 7 Days | sessionStorage |
| Region | Single-select | All Regions | sessionStorage |
| Route | Multi-select searchable | All Routes | sessionStorage |
| Carrier | Multi-select searchable | All Carriers | sessionStorage |

**Change propagation:**
1. Filter changes → 300ms debounce
2. `DashboardMaster.invalidateAll()` called
3. All hooks mark `loading=true` simultaneously
4. Each section re-fetches independently
5. URL encodes active filters for deep-link sharing

### 4.6 Drilldown Navigation Model

```
EXECUTIVE KPI → REGION BREAKDOWN → ROUTE DETAIL → DISPATCH DETAIL → HU → AUDIT TRAIL
                                       (L3 drawer)  (nested drawer)

ALERT FEED → EXCEPTION DETAIL → LINKED DISPATCH → ROUTE PROFILE → CARRIER PROFILE
               (L3 drawer)       (nested drawer)

RECON QUEUE → SCAN SESSION → HU STATUS → EXCEPTION → RESOLUTION

CONSOLIDATION → APPLY MODAL → SCENARIO SIMULATOR → CREATE DISPATCH (pre-filled)
```

**Drilldown rules:**
- Max 5 navigation levels from any starting point
- Breadcrumb always visible, every crumb clickable
- Context (active global filters) persists through all drilldown levels
- Browser Back ≠ drilldown back; breadcrumb is the drilldown back mechanism
- Every L2 and L3 has a deep-linkable URL

### 4.7 URL Routing Map (complete)

```
/                                   → redirect /executive
/executive                          → /executive/overview
/executive/overview
/executive/network-health
/executive/cost-performance
/executive/sla-compliance
/operations/live
/operations/dispatch-tracker
/operations/dispatch-tracker/:id    → drawer over tracker
/operations/exception-queue
/operations/integration-status
/dispatch/board
/dispatch/board?status=&route=&carrier=&search=
/dispatch/new
/dispatch/bulk-import
/dispatch/:id                       → drawer over board
/transport/live
/transport/departures
/transport/arrivals
/transport/tracking
/exceptions/dashboard
/exceptions/queue
/exceptions/queue?severity=&category=&assignee=
/exceptions/:id                     → drawer over queue
/exceptions/root-cause
/exceptions/sla-impact
/exceptions/escalation
/exceptions/resolution
/reconciliation/dashboard
/reconciliation/queue
/reconciliation/scan/:dispatchId    → full-screen workspace
/reconciliation/history
/reconciliation/report/:dispatchId
/reconciliation/exceptions
/routes/scorecard
/routes/:routeId                    → drawer over scorecard
/routes/sla-analysis
/routes/delay-analysis
/routes/utilization
/carriers/ranking
/carriers/:carrierId                → drawer over ranking
/carriers/sla-compliance
/carriers/delay-profile
/carriers/cost-efficiency
/load-planning/capacity
/load-planning/consolidation
/load-planning/scenarios
/load-planning/recommendations
/load-planning/route-optimization
/load-planning/analytics
/alerts/active
/alerts/sla-breaches
/alerts/high-risk
/alerts/history
/analytics/operations
/analytics/carrier
/analytics/route
/analytics/reconciliation
/analytics/export
/master-data/routes
/master-data/schedules
/master-data/carriers
/master-data/vehicles
/master-data/locations
/master-data/sla-config
/master-data/exception-codes
/admin/users
/admin/roles
/admin/system
/admin/api-keys
/admin/webhooks
/admin/integration-monitor
/admin/notifications
```

---

## 5. SHARED COMPONENT LIBRARY

### 5.1 Component Index

| Component | Description | Props summary |
|-----------|-------------|---------------|
| `KPICard` | Metric tile with value, trend, status dot | label, value, unit, trend, status, onClick, loading |
| `StatusBadge` | Dispatch state pill | status (8 states), size |
| `SeverityBadge` | Exception severity pill | severity (5 tiers), pulse (CRITICAL) |
| `StateBadge` | Exception workflow state | state (8 states) |
| `GradeBadge` | Route grade A–F | grade, size (sm/md/lg) |
| `TrendBadge` | ▲▼━ with contextual color | direction, delta, period, positiveIsUp |
| `SLAClock` | SLA countdown display | dispatch, variant (bar/ring/compact/text) |
| `HeatBar` | Single row SLA heat bar | value (0–100), maxWidth, showLabel |
| `CapacityMeter` | 3-bar weight/CBM/HU | weight, cbm, hu (each: value/max), size |
| `ScoreRadarChart` | SVG pentagon route score | scores (5 dims), weights, animated |
| `BayesianCauseBar` | Root cause confidence | cause, confidence, evidence, recommendation |
| `EscalationChainStepper` | 4-level escalation SVG | chain (4 levels), currentLevel, timestamps |
| `SparklineChart` | 60×20px inline trend | data (array), color, width, height |
| `DataTable` | Universal grid | columns, data, sortable, paginated, onRowClick |
| `MasterGrid` | Admin grid with inline edit | extends DataTable + editable, dirtyRows |
| `DrawerContainer` | L3 drawer shell | width, title, tabs, onClose, footer |
| `EmptyState` | Zero-data placeholder | icon, message, cta, ctaAction |
| `SkeletonLoader` | Pulse loading state | layout (kpi/table/card/list), count |
| `TabStrip` | Horizontal tab row | tabs (label, value, badge), activeTab, onChange |
| `FilterDropdown` | Single/multi-select | options, selected, multi, searchable, onChange |
| `DateRangePicker` | Date range selector | presets, value, onChange, custom |
| `BarcodeInputField` | Scanner-optimized input | onScan, onManual, autoFocus, placeholder |
| `ScanFeedbackOverlay` | Full-screen scan result | result (valid/dup/wrong/unknown/complete) |
| `ConsolidationGroupCard` | Consolidation suggestion | group, status (recommended/possible/risky) |
| `ScenarioCard` | Simulation scenario | scenario (A/B/C), metrics, selected, onSelect |
| `CostSpeedSlider` | Cost↔Speed trade-off | value (0–100), onChange |
| `UserAvatarBadge` | User initials circle | name, size, color (auto from name hash) |
| `ExpiryAlertBadge` | Document expiry warning | expiryDate, label (≤7d=red, ≤30d=amber) |
| `BulkUploadModal` | CSV/Excel upload flow | entityType, templateUrl, onUpload, onClose |
| `ColumnConfigurator` | Show/hide/reorder cols | columns, prefs, onChange, onReset |
| `ConfirmPopover` | Inline confirmation | message, onConfirm, onCancel, destructive |
| `TimeAgo` | Relative timestamp | datetime, short (bool) |
| `Badge` | Generic colored pill | label, color, size, dot (bool) |

---

### 5.2 DataTable Props Contract

```typescript
interface ColumnDef {
  key: string;
  label: string;
  width?: number;
  sortable?: boolean;
  filterable?: boolean;
  editable?: boolean;
  editType?: 'text' | 'number' | 'dropdown' | 'date' | 'toggle';
  options?: {value: string, label: string}[];
  render?: (value: any, row: any) => ReactNode;
  align?: 'left' | 'center' | 'right';
  sticky?: boolean;
}

DataTable.propTypes = {
  columns:        ColumnDef[].isRequired,
  data:           object[].isRequired,
  keyField:       string,                   // default 'id'
  loading:        bool,
  totalCount:     number,
  page:           number,
  pageSize:       number,
  onPageChange:   func,
  onSort:         func,                     // (key, dir) => void
  onRowClick:     func,                     // (row) => void
  onCellEdit:     func,                     // (rowId, colKey, value) => void
  selectedRows:   string[],
  onRowSelect:    func,
  onBulkAction:   func,                     // (action, rowIds) => void
  rowColorFn:     func,                     // (row) => 'green'|'amber'|'red'|null
  emptyState:     node,
  stickyHeader:   bool,                     // default true
}
```

---

### 5.3 SLAClock Variants

```
VARIANT: bar
┌─────────────────────────────────────────────────────┐
│ SLA Remaining: 3h 22m     [████████████░░░░] 72%    │
└─────────────────────────────────────────────────────┘
Color: green ≥50% / amber 20–49% / red <20% / pulse if <10%

VARIANT: ring
  SVG circle, stroke-dashoffset tracks remaining %
  Color: same thresholds

VARIANT: compact
  "3h 22m" colored text only, no bar

VARIANT: text
  "SLA OK — 3 hrs remaining" / "SLA AT RISK — 45 min left" / "SLA BREACHED — 2h overdue"
```

### 5.4 ScanFeedbackOverlay Variants

```
VALID (green, 200ms auto-dismiss):
  Full-screen green flash, ✓ icon, "ACCEPTED" large text

DUPLICATE (amber, 500ms auto-dismiss):
  Full-screen amber flash, ⚠ icon, "DUPLICATE SCAN"

WRONG DISPATCH (red, persists until dismissed):
  Full-screen red, ✕ icon, "WRONG DISPATCH" — HU detail shown — [Dismiss] button

UNKNOWN (amber, 500ms auto-dismiss):
  Full-screen amber, ? icon, "NOT IN MANIFEST"

COMPLETE (green, confetti animation, 2s then auto-dismiss):
  Full-screen green, ✓✓ icon, "ALL ITEMS SCANNED — RECONCILIATION COMPLETE"
```

---

## 6. DESIGN SYSTEM

### 6.1 Design Tokens (CSS Custom Properties)

```css
/* ─── BRAND ─────────────────────────────────────────────────── */
--brand-primary:       #1E3A5F;    /* Navy — nav active, primary buttons */
--brand-accent:        #3B82F6;    /* Blue-500 — links, focus, CTAs */
--brand-surface:       #0F172A;    /* Slate-900 — top nav dark bg */

/* ─── SEMANTIC STATUS ──────────────────────────────────────── */
--status-success:      #16A34A;    /* Green-600 — on-time, healthy, matched */
--status-success-bg:   #F0FDF4;    /* Green-50 */
--status-warning:      #D97706;    /* Amber-600 — at-risk, approaching */
--status-warning-bg:   #FFFBEB;    /* Amber-50 */
--status-danger:       #DC2626;    /* Red-600 — breached, critical, missing */
--status-danger-bg:    #FEF2F2;    /* Red-50 */
--status-info:         #2563EB;    /* Blue-600 — in-transit, informational */
--status-info-bg:      #EFF6FF;    /* Blue-50 */
--status-neutral:      #6B7280;    /* Gray-500 — planned, pending, no data */
--status-neutral-bg:   #F9FAFB;    /* Gray-50 */

/* ─── DISPATCH STATUS ──────────────────────────────────────── */
--s-planned:           #6B7280;    /* Gray */
--s-ready:             #8B5CF6;    /* Violet */
--s-dispatched:        #2563EB;    /* Blue */
--s-in-transit:        #0891B2;    /* Cyan */
--s-arrived:           #D97706;    /* Amber */
--s-unloading:         #EA580C;    /* Orange */
--s-reconciled:        #16A34A;    /* Green */
--s-closed:            #9CA3AF;    /* Cool Gray */

/* ─── EXCEPTION SEVERITY ───────────────────────────────────── */
--sev-critical:        #DC2626;    /* Red-600 */
--sev-critical-bg:     #FEE2E2;    /* Red-100 */
--sev-high:            #EA580C;    /* Orange-600 */
--sev-high-bg:         #FFEDD5;    /* Orange-100 */
--sev-medium:          #D97706;    /* Amber-600 */
--sev-medium-bg:       #FEF3C7;    /* Amber-100 */
--sev-low:             #16A34A;    /* Green-600 */
--sev-low-bg:          #DCFCE7;    /* Green-100 */
--sev-info:            #2563EB;    /* Blue-600 */
--sev-info-bg:         #DBEAFE;    /* Blue-100 */

/* ─── SURFACE ──────────────────────────────────────────────── */
--surface-canvas:      #F1F5F9;    /* Slate-100 — page background */
--surface-card:        #FFFFFF;    /* Card / panel background */
--surface-card-hover:  #F8FAFC;    /* Slate-50 — hover state */
--surface-elevated:    #FFFFFF;    /* + shadow */
--surface-overlay:     rgba(15,23,42,0.55);   /* Backdrop */

/* ─── BORDER ──────────────────────────────────────────────── */
--border-default:      #E2E8F0;    /* Slate-200 */
--border-strong:       #CBD5E1;    /* Slate-300 */
--border-focus:        #3B82F6;    /* Blue-500 */

/* ─── TEXT ─────────────────────────────────────────────────── */
--text-primary:        #0F172A;    /* Slate-900 */
--text-secondary:      #475569;    /* Slate-600 */
--text-muted:          #94A3B8;    /* Slate-400 */
--text-inverse:        #F1F5F9;    /* Slate-100 — on dark backgrounds */
--text-link:           #2563EB;    /* Blue-600 */
--text-error:          #DC2626;    /* Red-600 */

/* ─── WAREHOUSE (Reconciliation screens) ──────────────────── */
--wh-ok:               #16A34A;    /* Scan OK */
--wh-warn:             #D97706;    /* Scan warning */
--wh-danger:           #DC2626;    /* Scan critical / wrong */

/* ─── PLANNING (Planning workbench) ────────────────────────── */
--plan-optimal:        #16A34A;    /* Best option highlight */
--plan-scenario-a:     #7C3AED;    /* Violet — lowest cost */
--plan-scenario-b:     #2563EB;    /* Blue — balanced */
--plan-scenario-c:     #D97706;    /* Amber — fastest */

/* ─── ADMIN (Master data screens) ──────────────────────────── */
--adm-header:          #1E293B;    /* Slate-800 — admin section header */
--adm-toolbar:         #F8FAFC;    /* Slate-50 — toolbar bg */
--adm-border:          #E2E8F0;    /* Slate-200 — grid borders */
--adm-row-hover:       #F1F5F9;    /* Slate-100 */
--adm-row-sel:         #DBEAFE;    /* Blue-100 — selected row */
--adm-dirty:           #FEF3C7;    /* Amber-100 — unsaved inline edit */
--adm-new:             #DCFCE7;    /* Green-100 — newly added row */
--adm-del:             #FEE2E2;    /* Red-100 — marked for deletion */

/* ─── SPACING (4px base grid) ──────────────────────────────── */
--space-1:   4px;   --space-2:   8px;   --space-3:  12px;
--space-4:  16px;   --space-5:  20px;   --space-6:  24px;
--space-8:  32px;   --space-10: 40px;   --space-12: 48px;
--space-16: 64px;

/* ─── BORDER RADIUS ────────────────────────────────────────── */
--radius-sm:    4px;    /* badges, pills, tags */
--radius-md:    8px;    /* inputs, buttons, small cards */
--radius-lg:   12px;    /* cards, panels */
--radius-xl:   16px;    /* modals, large cards */
--radius-full: 9999px;  /* avatar, pill badge */

/* ─── SHADOWS ───────────────────────────────────────────────── */
--shadow-xs:  0 1px 2px rgba(0,0,0,0.05);
--shadow-sm:  0 1px 3px rgba(0,0,0,0.10), 0 1px 2px rgba(0,0,0,0.06);
--shadow-md:  0 4px 6px rgba(0,0,0,0.07), 0 2px 4px rgba(0,0,0,0.06);
--shadow-lg:  0 10px 15px rgba(0,0,0,0.10), 0 4px 6px rgba(0,0,0,0.05);
--shadow-xl:  0 20px 25px rgba(0,0,0,0.10), 0 10px 10px rgba(0,0,0,0.04);

/* ─── TRANSITIONS ───────────────────────────────────────────── */
--transition-fast:  150ms ease;
--transition-base:  200ms ease;
--transition-slow:  300ms cubic-bezier(0.4, 0, 0.2, 1);

/* ─── NAV ───────────────────────────────────────────────────── */
--nav-width:          220px;
--nav-width-collapsed: 56px;
--nav-transition:     200ms ease;

/* ─── Z-INDEX SCALE ─────────────────────────────────────────── */
--z-base:       0;
--z-sticky:   100;   /* sticky headers */
--z-dropdown: 200;   /* dropdowns, tooltips */
--z-drawer:   300;   /* L3 drawers */
--z-modal:    400;   /* modals */
--z-overlay:  500;   /* scan feedback fullscreen */
--z-alert:    600;   /* global alert rail */
--z-toast:    700;   /* toast notifications */
```

---

### 6.2 Route Grade Color Map

| Grade | Background | Text | Border |
|-------|-----------|------|--------|
| A | `#16A34A` | white | — |
| B | `#2563EB` | white | — |
| C | `#D97706` | white | — |
| D | `#EA580C` | white | — |
| F | `#DC2626` | white | — |

### 6.3 Carrier Status Labels

| Score Range | Label | Color |
|-------------|-------|-------|
| 92–100 | Top Performer | `--status-success` |
| 75–91 | Good | `--status-success` |
| 60–74 | Monitor | `--status-warning` |
| <60 | At Risk | `--status-danger` |

---

## 7. COLOR PALETTE

### 7.1 Full Palette Reference

```
BLUES (Brand + Info)
  Slate-900  #0F172A  — top nav, text-primary
  Slate-800  #1E293B  — admin header
  Navy       #1E3A5F  — brand primary
  Blue-600   #2563EB  — brand accent, info status, in-transit
  Blue-500   #3B82F6  — focus rings, links, CTAs
  Blue-100   #DBEAFE  — selected rows, info backgrounds
  Blue-50    #EFF6FF  — info card backgrounds

SLATES (Surface + Text)
  Slate-600  #475569  — text-secondary
  Slate-400  #94A3B8  — text-muted
  Slate-300  #CBD5E1  — border-strong
  Slate-200  #E2E8F0  — border-default, grid lines
  Slate-100  #F1F5F9  — page canvas
  Slate-50   #F8FAFC  — card hover, toolbar

GREENS (Success + On-Time)
  Green-600  #16A34A  — status-success, scan OK, grade A, reconciled
  Green-400  #4ADE80  — lighter heat bar (85–94%)
  Green-100  #DCFCE7  — success bg, new row highlight
  Green-50   #F0FDF4  — success card bg

AMBERS (Warning + At-Risk)
  Amber-600  #D97706  — status-warning, arrived, grade C, wh-warn
  Amber-100  #FEF3C7  — warning bg, dirty row
  Amber-50   #FFFBEB  — warning card bg

ORANGES (High Severity)
  Orange-600 #EA580C  — sev-high, unloading, grade D
  Orange-100 #FFEDD5  — sev-high bg
  Orange-400 #FB923C  — heat bar 60–74%

REDS (Critical + Danger)
  Red-600    #DC2626  — status-danger, critical, missing, grade F
  Red-100    #FEE2E2  — danger bg, deleted row
  Red-50     #FEF2F2  — danger card bg

VIOLETS (Planning + Ready)
  Violet-600 #7C3AED  — plan-scenario-a
  Violet-500 #8B5CF6  — s-ready (dispatch)
  Violet-100 #EDE9FE  — scenario A bg

CYANS (In-Transit)
  Cyan-600   #0891B2  — s-in-transit

GRAYS (Neutral + Closed)
  Gray-500   #6B7280  — status-neutral, planned
  Gray-400   #9CA3AF  — s-closed
  Gray-200   #E5E7EB  — disabled states
  Gray-50    #F9FAFB  — neutral bg
```

### 7.2 Semantic Usage Guide

| Usage | Token | Hex |
|-------|-------|-----|
| Page background | `--surface-canvas` | #F1F5F9 |
| Card background | `--surface-card` | #FFFFFF |
| Top navigation | `--brand-surface` | #0F172A |
| Active nav item | `--brand-primary` | #1E3A5F |
| Primary button | `--brand-accent` | #3B82F6 |
| On-time / success | `--status-success` | #16A34A |
| At-risk / warning | `--status-warning` | #D97706 |
| Breached / critical | `--status-danger` | #DC2626 |
| In-transit / info | `--status-info` | #2563EB |
| Planned / neutral | `--status-neutral` | #6B7280 |
| Focus ring | `--border-focus` | #3B82F6 |
| Body text | `--text-primary` | #0F172A |
| Label text | `--text-secondary` | #475569 |
| Placeholder | `--text-muted` | #94A3B8 |

---

## 8. TYPOGRAPHY

### 8.1 Type Scale

```css
--font-family:      'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
--font-mono:        'JetBrains Mono', 'Fira Code', 'Courier New', monospace;

/* Scale — size / line-height / tracking */
--text-xs:    10px / 16px / 0.4px     — labels, captions, badges
--text-sm:    12px / 18px / 0px       — table cells, secondary text
--text-base:  13px / 20px / 0px       — body default, filter bars
--text-md:    14px / 22px / 0px       — nav items, card content
--text-lg:    16px / 24px / 0px       — section headings, tab labels
--text-xl:    20px / 28px / -0.2px    — page titles, drawer titles
--text-2xl:   24px / 32px / -0.3px    — widget headers
--text-3xl:   30px / 38px / -0.4px    — KPI values
--text-4xl:   36px / 44px / -0.5px    — hero metrics (executive CT)

/* Weights */
--weight-regular:   400
--weight-medium:    500
--weight-semibold:  600
--weight-bold:      700
--weight-black:     800
```

### 8.2 Type Roles

| Element | Size | Weight | Color |
|---------|------|--------|-------|
| Page title | `--text-xl` | semibold | `--text-primary` |
| Section heading | `--text-lg` | semibold | `--text-primary` |
| Widget title | `--text-md` | semibold | `--text-primary` |
| Tab label | `--text-md` | medium | `--text-secondary` → primary when active |
| Table header | `--text-sm` | semibold | `--text-secondary` |
| Table cell | `--text-sm` | regular | `--text-primary` |
| KPI value | `--text-3xl` or `--text-4xl` | bold | varies by status |
| KPI label | `--text-xs` | medium | `--text-secondary` |
| Badge / pill | `--text-xs` | semibold | white or color |
| Button | `--text-sm` | medium | white (primary) / primary (ghost) |
| Nav item | `--text-sm` | medium | `--text-secondary` → primary when active |
| Tooltip | `--text-xs` | regular | white on dark bg |
| Monospace (IDs, barcodes) | `--text-sm` | regular | `--font-mono` |

### 8.3 Warehouse Typography Overrides
*Applied to all `/reconciliation/scan/*` routes*

```css
/* Warehouse screens: larger minimum sizes for rugged tablet 10–12" */
.warehouse-screen {
  --text-base:  16px / 24px;     /* body → 16px minimum */
  --text-sm:    14px / 22px;     /* cells → 14px minimum */
  --input-height: 48px;           /* touch-friendly inputs */
  --touch-target: 48px;           /* minimum tap area */
}

.warehouse-screen .scan-status {
  font-size: 24px;               /* scan result message */
  font-weight: 700;
}

.warehouse-screen .hu-counter {
  font-size: 48px;               /* accepted/rejected count */
  font-weight: 800;
}
```

---

## 9. RESPONSIVE BEHAVIOR

### 9.1 Breakpoints

```css
--bp-xs:    375px;    /* mobile portrait — iPhone SE */
--bp-sm:    640px;    /* mobile landscape */
--bp-md:    768px;    /* tablet portrait */
--bp-lg:   1024px;    /* tablet landscape / small laptop */
--bp-xl:   1280px;    /* standard desktop ← primary design target */
--bp-2xl:  1536px;    /* wide desktop */
--bp-3xl:  1920px;    /* ultrawide */
```

### 9.2 Layout Shifts per Breakpoint

#### ≥ 1280px (xl — primary target)
```
Left nav:             220px expanded, all labels visible
KPI strip:            9 cards in 1 row
Network row:          60% map / 40% funnel
Exception cmd center: 4 columns (one per severity)
Performance row:      50/50 split (route / carrier)
SLA heatmap:          full width
Alert center:         4-column panel row
Drawers:              620px / 560px / 480px (stacked)
```

#### 1024–1279px (lg — laptop)
```
Left nav:             56px collapsed (icons + tooltips)
KPI strip:            5 + 4 (two rows)
Network row:          55% / 45%
Exception cmd center: 2×2 grid
Performance row:      50/50
Alert center:         2×2 grid
Drawers:              540px / 480px / 420px
```

#### 768–1023px (md — tablet)
```
Left nav:             hidden, hamburger → slide-over (full height, 280px wide)
KPI strip:            3 per row (3 rows)
Network row:          stacked (map full width, then funnel)
Exception cmd center: 2 per row (2 rows)
Performance row:      stacked (route, then carrier)
SLA heatmap:          full width (fewer columns shown)
Alert center:         2 per row (2 rows)
Drawers:              full-screen (100vw - 0 offset)
```

#### 640–767px (sm — mobile landscape)
```
Left nav:             slide-over only
KPI strip:            2 per row
All widgets:          stacked single column
Drawers:              full screen
Tables:               horizontal scroll
```

#### < 640px (xs — mobile portrait)
```
Left nav:             slide-over only
KPI strip:            1 per row (scrollable horizontal strip on executive CT)
All widgets:          single column
Tables:               card view (rows become cards)
Drawers:              full screen, bottom sheet variant
Scan workspace:       full screen (this is the primary use case at this breakpoint)
```

### 9.3 Component-Level Responsive Behavior

| Component | ≥1280 | 1024–1279 | <768 |
|-----------|-------|-----------|------|
| DataTable | full columns, pagination | hide low-priority cols | card mode |
| DrawerContainer | 620px right | 540px right | full screen |
| FilterBar | all filters visible | collapse to [Filters ▼] | modal sheet |
| KPIStrip | 1 row (9 cards) | 2 rows | horizontal scroll |
| SplitConfigurator | 38/62 | 38/62 | stacked (input above result) |
| NetworkMap | 60% of row | 55% of row | full width |
| ExceptionCommandCenter | 4 columns | 2×2 | accordion |
| LeftNavigation | 220px | 56px | slide-over |

### 9.4 Warehouse Tablet Constraint
*Screens under `/reconciliation/scan/*` are always treated as `--bp-lg` minimum regardless of viewport width — they are always full-screen and optimized for 10–12" rugged tablets.*

```css
.warehouse-screen {
  min-width: 768px;
  touch-action: manipulation;    /* disable double-tap zoom */
}

.warehouse-screen button,
.warehouse-screen .touch-target {
  min-height: 48px;
  min-width: 48px;
}
```

---

## 10. ENTERPRISE UX STANDARDS

### 10.1 Information Hierarchy Principles

| Principle | Rule | Applied As |
|-----------|------|------------|
| **Situation Awareness** | Operator must know network state within 5 seconds | Live KPI strip always visible; color-coded status everywhere |
| **Progressive Disclosure** | Summary → Exception → Detail | 3-level drilldown enforced; no raw dumps |
| **Action Co-location** | Every alert must have its CTA visible without scrolling | Action buttons inside every alert card, exception row, dispatch card |
| **Role Fidelity** | Each persona sees exactly what their role needs | Role-based nav collapse; data scope per user |
| **Zero-Click Alerts** | Critical events surface without user navigation | Global alert rail; badge counts on nav items |
| **Data Density** | Operators are power users — prefer tables over cards | Default table-first; cards only for KPIs |
| **Consistency Over Cleverness** | Same pattern everywhere | Single DataTable component across 30+ screens |

---

### 10.2 Feedback & State Patterns

#### Loading States
```
First visit to module:    Full-page skeleton (grey pulse blocks matching layout geometry)
Data refresh (TTL):       Subtle spinner in header; existing data stays visible
Drill-down (L3 drawer):   Drawer slides in with skeleton; real data replaces in <500ms
Simulation run:           Full panel spinner — "Calculating scenarios…"
Scan session:             No loading state — input is always available (data streams in)
```

#### Empty States
Every screen must define an empty state with:
- Neutral icon (no error icons for filter-induced empty states)
- Human-readable message appropriate to context
- Single CTA to recover (reset filters / create first record / navigate away)

```
No dispatches (filtered):    "No dispatches match current filters."  [Reset Filters]
No open exceptions:          "All exceptions resolved. Network healthy." [View Resolved]
No consolidation:            "No consolidation candidates for today."  [View Load Plan]
No active alerts:            "No active alerts. All systems nominal."  [View History]
No scan results:             "Scan a barcode to begin."  (no CTA needed)
No master data records:      "No [entities] configured yet."  [+ Add First]
```

#### Error States
```
Service unavailable:    "Unable to load data. Last refresh: N min ago."  [Retry]
Permission denied:      "You don't have access to this section."  [Go Back]
Not found (L3):         "This [dispatch/exception/route] no longer exists."  [Close]
```

---

### 10.3 Interaction Micro-Patterns

#### Hover Behavior
- **Cards:** `translateY(-2px)` + `shadow-md → shadow-lg` in 150ms
- **Table rows:** background → `--adm-row-hover` in 100ms
- **Buttons:** `brightness(1.05)` or darker on ghost buttons in 100ms
- **Nav items:** background `--surface-card-hover` in 100ms
- **Badges/pills:** no hover (they are display-only)

#### Click Feedback
- **Primary buttons:** `scale(0.98)` on mousedown, back to 1 on mouseup — 80ms
- **Table rows (clickable):** instant visual feedback before navigation
- **KPI cards:** immediate navigation, no delay
- **Toolbar actions:** spinner replaces icon during async operation

#### Focus Behavior
- **Focus ring:** `outline: 2px solid var(--border-focus); outline-offset: 2px`
- **Focus ring on dark bg:** `outline-color: #93C5FD` (blue-300 — visible on navy)
- **Never remove focus outlines** — keyboard navigation must always be visible
- **Tab order:** follows visual reading order (left-to-right, top-to-bottom)

#### Animation Principles
```
KPI value counter:    count-up from 0 → value, 800ms, easeOutCubic
Bar charts:           width 0 → actual, 500ms, staggered 50ms, easeOutExpo
Funnel bars:          same as bar charts
Heat bars:            same as bar charts
Drawer open:          slideInFromRight, 250ms, cubic-bezier(0.4,0,0.2,1)
Drawer close:         slideOutToRight, 200ms, ease
Modal open:           fadeIn + scale(0.95→1), 200ms
Alert rail slide-up:  translateY(100%→0), 250ms, ease
New alert flash:      amber flash keyframe, 400ms
CRITICAL pulse:       box-shadow pulse, 1s loop (stops on acknowledge)
Scan feedback:        instant appear, timed auto-dismiss
Tab indicator slide:  border-bottom slides to active tab, 150ms
```

---

### 10.4 Accessibility Standards

| Standard | Requirement |
|----------|------------|
| WCAG contrast | All text ≥ 4.5:1 contrast ratio on backgrounds |
| Focus visibility | Always visible (never hidden) |
| Keyboard navigation | All interactive elements reachable by Tab |
| Screen reader | All icons have aria-label; status = role="status" |
| Loading states | aria-live="polite" on data regions |
| Modal traps focus | Focus locked inside modal while open |
| Drawer traps focus | Focus locked inside drawer while open |
| Escape closes | Modal, drawer, dropdown all close on Escape |
| Error messages | Linked to input via aria-describedby |
| Tables | thead with scope="col"; sortable headers have aria-sort |
| Color alone | Never used as sole indicator (always + text or icon) |

---

### 10.5 Form Standards

#### Input Components
```
Height:         36px (standard) / 48px (warehouse screens)
Border:         1px solid var(--border-default)
Border (focus): 2px solid var(--border-focus), no offset
Border-radius:  var(--radius-md)
Padding:        var(--space-3) var(--space-4)
Font:           --text-base, --text-primary
Placeholder:    --text-muted
Error state:    border → var(--status-danger), error message below in --text-error
Disabled:       opacity: 0.5, cursor: not-allowed
```

#### Form Validation
```
Validate:     on blur (not on every keystroke)
Display:      error message below field, red border
Required:     asterisk after label — color --adm-required (#EF4444)
Submit guard: button disabled until all required fields valid
Min lengths:  exception resolution notes ≥ 10 chars
```

#### Inline Edit (Admin Grids)
```
1. Double-click cell → cell becomes input
2. Row background → --adm-dirty (amber-100)
3. Tab navigates to next editable cell
4. Enter confirms; Escape reverts
5. Toolbar shows "N unsaved changes [Save All] [Discard All]"
6. Save All → batched DAL calls per dirty row
7. Success → row returns to normal; Error → stays dirty with tooltip
```

---

### 10.6 Notification & Alert Patterns

#### Global Alert Rail (fixed overlay)
```
Position:       fixed bottom-right, z-index: --z-alert
Trigger:        AlertService.getAll() — polled every 15 seconds
Collapsed:      floating bell icon with red count badge
Expanded:       360px wide slide-up panel, max 3 alert cards visible
New critical:   auto-expands rail, amber flash on card
Alert priority: SLA Breach > Escalated Exception > High-Risk Dispatch > Overdue Recon
Acknowledge:    decrements count; moves to history; does NOT resolve the underlying issue
```

#### Toast Notifications
```
Position:       fixed top-right, z-index: --z-toast, stacks downward
Types:          success (green) / error (red) / warning (amber) / info (blue)
Auto-dismiss:   success: 3s / info: 4s / warning: 6s / error: manual dismiss
Max visible:    3 toasts simultaneously (oldest dismissed first)
```

#### Inline Status Feedback
```
Optimistic UI:  UI updates immediately on action; reverts on error
Spinner:        icon replaced by spinner during async op
Success:        checkmark flash (300ms) then reverts to normal state
Error:          red toast + tooltip on the element that failed
Confirmation:   inline ConfirmPopover for medium-risk actions (assign, escalate)
Full modal:     for high-risk actions (bulk resolve, delete master record, cancel dispatch)
```

---

### 10.7 Master Data / Admin Screen Standards

All master screens (`/master-data/*` and `/admin/*`) follow these standards:

#### Toolbar (always present)
```
Left:   [+ Add Entity]  [📥 Bulk Upload]  [📤 Export Excel]  [🗑 Delete] (enabled on selection)
Right:  [Column ⚙]  [🔄 Refresh]
```

#### Bulk Upload (all master screens)
```
1. [📥 Bulk Upload] → BulkUploadModal
2. Step 1: Download template XLSX (headers + sample row + validation notes)
3. Step 2: Drag/drop or browse — preview file name
4. Step 3: [Upload & Validate] → validation result (N valid / N errors)
5. Error report: downloadable XLSX with error column per invalid row
6. Step 4: [Confirm Import] → batch insert (50 rows/batch) with progress bar
7. Grid auto-refreshes after completion
```

#### Excel Export
```
Click [📤 Export] →
  If rows selected: "Export selected N rows"
  If none: "Export all (current filters applied)"
Options: [☑ Include all columns] [☑ Include audit fields]
File: {entity}_{YYYY-MM-DD}.xlsx — headers bold, frozen row 1, auto-sized columns
```

#### Audit Trail
```
Right-click row → [View History] → AuditTrailDrawer (400px)
Content: created / each modification (field → old → new / user / timestamp)
Exportable as CSV
```

---

### 10.8 Persona × Screen Access Matrix

```
                                SCH   RM    TM    WM    OE    ADM
────────────────────────────────────────────────────────────────────
Executive CT                     R     R     R     —     R     R
Operations CT                    R     RW    RW    R     RW    R
Dispatch Management              —     R     RW    R     RW    R
  → Create / Edit Dispatch        —     —     RW    —     RW    —
Transport Execution              —     R     RW    —     RW    —
Exception Management             R     RW    R     R     RW    R
  → Raise / Resolve / Escalate    —     RW    RW    RW    RW    —
Reconciliation Center            R     R     R     RW    RW    R
  → Scan Session / Complete Recon —     —     —     RW    RW    —
Route Performance                R     RW    R     —     R     R
Carrier Performance              R     RW    R     —     R     R
Load Planning                    —     R     RW    —     R     R
  → Accept Consolidation          —     —     RW    —     R     —
CT Alerts / Acknowledge          R     RW    RW    R     RW    R
Analytics                        RW    RW    R     R     R     R
Master Data                      —     —     —     —     —     RW
Administration                   —     —     —     —     —     RW
  → User / Role Management        —     —     —     —     —     RW
  → Integration Monitor           —     R     R     —     R     RW

KEY: R = Read only  RW = Read + Write / Action  — = No access
```

---

### 10.9 Data Refresh Cadence

| Screen / Section | Interval | Notes |
|-----------------|----------|-------|
| Executive KPIs | 30s | Cache in `tct_dash_cache` |
| Operations live view | 15s | At-risk + alert feed |
| Alert feed (all) | 15s | Shortest TTL — critical path |
| Dispatch board | 30s | Paused when filter modal open |
| Exception queue | 15s | Paused when editing a row |
| Transport tracking | 15s | GPS events |
| Reconciliation dashboard | 30s | |
| Route / Carrier analytics | 60s | Less time-critical |
| Load planning consolidation | 60s | Batch computation |
| Simulation / Recommendation | no cache | On-demand only |
| Master data grids | manual | Refresh button only |
| System config | manual | Refresh button only |
| Analytics (all) | 5 min | Historical data |

**Cache pause rules:**
- Any open modal → pause its parent screen refresh
- Tab hidden (`visibilityState = 'hidden'`) → pause all polling
- Resume on tab focus → immediate re-fetch, then resume intervals

---

### 10.10 Performance Targets

| Metric | Target |
|--------|--------|
| First Meaningful Paint | < 1.5s |
| Time to Interactive | < 3s |
| L3 drawer open → data visible | < 500ms |
| Filter change → new data visible | < 1s |
| Scan input → feedback overlay | < 100ms |
| Table sort (client-side) | < 50ms |
| Skeleton → real content transition | smooth (no layout shift) |
| Excel export (1000 rows) | < 3s |
| Page navigation (L2 tabs) | < 300ms (client-side routing) |

---

*Document ends.*

---

**TRANSPORT CONTROL TOWER — UI BLUEPRINT COMPLETE**
