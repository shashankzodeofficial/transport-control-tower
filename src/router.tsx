import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { AppShell }            from '@/layout/AppShell'
import { ControlTowerPage }    from '@/pages/control-tower'
import {
  DispatchWorkbench,
  DispatchDetails,
  ChainOfCustody,
  TransportMonitor,
} from '@/pages/dispatch'
import { ExceptionBoard }      from '@/pages/exceptions'
import { ReconciliationCenter }from '@/pages/reconciliation'
import { LoadPlanning }        from '@/pages/planning'
import { RoutePerformance }    from '@/pages/routes'
import { CarrierPerformance }  from '@/pages/carriers'
import { AdminDashboard }           from '@/pages/admin'
import { OperationsControlTower }   from '@/pages/operations'
import { AlertsCenter }             from '@/pages/alerts'
import { AnalyticsDashboard }       from '@/pages/analytics'
import { MasterDataDashboard }      from '@/pages/master-data'
import { ProfilePage }              from '@/pages/profile/ProfilePage'

// Placeholder for unbuilt screens
function ComingSoon({ label }: { label: string }) {
  return (
    <div className="flex h-full min-h-[60vh] flex-col items-center justify-center text-center">
      <div className="mb-3 text-5xl opacity-20">🚧</div>
      <h2 className="text-lg font-semibold text-slate-700">{label}</h2>
      <p className="mt-1 text-sm text-slate-400">This screen is under construction.</p>
    </div>
  )
}

export function AppRouter() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        {/* Default redirect */}
        <Route index element={<Navigate to="/executive" replace />} />

        {/* Executive Control Tower */}
        <Route path="/executive"          element={<ControlTowerPage />} />
        <Route path="/executive/overview" element={<ControlTowerPage />} />

        {/* Dispatch Management */}
        <Route path="/dispatch/board"               element={<DispatchWorkbench />} />
        <Route path="/dispatch/:id/custody"         element={<ChainOfCustody />} />
        <Route path="/dispatch/:id"                 element={<DispatchDetails />} />
        <Route path="/dispatch"                     element={<Navigate to="/dispatch/board" replace />} />

        {/* Transport Execution */}
        <Route path="/transport/live"               element={<TransportMonitor />} />
        <Route path="/transport"                    element={<Navigate to="/transport/live" replace />} />

        {/* Exception Command Center */}
        <Route path="/exceptions"        element={<ExceptionBoard />} />
        <Route path="/exceptions/*"      element={<ExceptionBoard />} />

        {/* Reconciliation Center */}
        <Route path="/reconciliation"    element={<ReconciliationCenter />} />
        <Route path="/reconciliation/*"  element={<ReconciliationCenter />} />

        {/* Load Planning Workbench */}
        <Route path="/load-planning"     element={<LoadPlanning />} />
        <Route path="/load-planning/*"   element={<LoadPlanning />} />

        {/* Route Performance */}
        <Route path="/routes"            element={<RoutePerformance />} />
        <Route path="/routes/*"          element={<RoutePerformance />} />

        {/* Carrier Performance */}
        <Route path="/carriers"          element={<CarrierPerformance />} />
        <Route path="/carriers/*"        element={<CarrierPerformance />} />

        {/* Administration */}
        <Route path="/admin"             element={<AdminDashboard />} />
        <Route path="/admin/*"           element={<AdminDashboard />} />

        {/* Operations Control Tower */}
        <Route path="/operations"        element={<OperationsControlTower />} />
        <Route path="/operations/*"      element={<OperationsControlTower />} />

        {/* CT Alerts Center */}
        <Route path="/alerts"            element={<AlertsCenter />} />
        <Route path="/alerts/*"          element={<AlertsCenter />} />
        {/* Analytics Dashboard */}
        <Route path="/analytics"                element={<AnalyticsDashboard />} />
        <Route path="/analytics/executive"      element={<AnalyticsDashboard />} />
        <Route path="/analytics/operations"     element={<AnalyticsDashboard />} />
        <Route path="/analytics/carriers"       element={<AnalyticsDashboard />} />
        <Route path="/analytics/routes"         element={<AnalyticsDashboard />} />
        <Route path="/analytics/exceptions"     element={<AnalyticsDashboard />} />
        <Route path="/analytics/reconciliation" element={<AnalyticsDashboard />} />
        {/* Master Data */}
        <Route path="/master-data"              element={<MasterDataDashboard />} />
        <Route path="/master-data/routes"       element={<MasterDataDashboard />} />
        <Route path="/master-data/fleet"        element={<MasterDataDashboard />} />
        <Route path="/master-data/carriers"     element={<MasterDataDashboard />} />
        <Route path="/master-data/hubs"         element={<MasterDataDashboard />} />
        <Route path="/master-data/customers"    element={<MasterDataDashboard />} />
        <Route path="/master-data/sla-matrix"   element={<MasterDataDashboard />} />

        {/* Profile */}
        <Route path="/profile"           element={<ProfilePage />} />

        {/* 404 */}
        <Route path="*" element={<Navigate to="/executive" replace />} />
      </Route>
    </Routes>
  )
}
