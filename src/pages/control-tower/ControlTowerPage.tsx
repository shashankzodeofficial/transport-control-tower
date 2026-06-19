import React, { useState, useEffect } from 'react'
import { RefreshCw, Download, Maximize2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { exportCsv } from '@/lib/exportCsv'
import { KPIStrip } from '@/components/kpi/KPIStrip'
import { DispatchFunnel }          from './widgets/DispatchFunnel'
import { LiveNetworkView }         from './widgets/LiveNetworkView'
import { ExceptionCommandCenter }  from './widgets/ExceptionCommandCenter'
import { RoutePerformance }        from './widgets/RoutePerformance'
import { CarrierPerformance }      from './widgets/CarrierPerformance'
import { SLAHeatmap }              from './widgets/SLAHeatmap'
import { AlertCenter }             from './widgets/AlertCenter'
import { KPI_DATA }                from './mock/data'

// Refresh pulse every 60s (mock — no real fetch)
function useLastRefresh() {
  const [ts, setTs] = useState(new Date())
  useEffect(() => {
    const id = setInterval(() => setTs(new Date()), 60_000)
    return () => clearInterval(id)
  }, [])
  return ts
}

function fmtTime(d: Date) {
  return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
}

export function ControlTowerPage() {
  const lastRefresh = useLastRefresh()
  const [refreshing, setRefreshing] = useState(false)

  function handleRefresh() {
    setRefreshing(true)
    setTimeout(() => setRefreshing(false), 900)
  }

  return (
    <div className="flex flex-col min-h-0 bg-slate-50">
      {/* Page header bar */}
      <div className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-3 sticky top-0 z-10">
        <div>
          <h1 className="text-base font-bold text-slate-900">Executive Control Tower</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Live operations overview · Last updated {fmtTime(lastRefresh)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Live indicator */}
          <div className="flex items-center gap-1.5 rounded-full border border-green-200 bg-green-50 px-3 py-1">
            <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
            <span className="text-xxs font-semibold text-green-700">LIVE</span>
          </div>
          <button
            onClick={handleRefresh}
            className="flex h-8 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors"
          >
            <RefreshCw size={13} className={cn('transition-transform', refreshing && 'animate-spin')} />
            Refresh
          </button>
          <button
            onClick={() => exportCsv(KPI_DATA.map(k => ({ metric: k.label, value: k.value, trend_delta: k.trend?.delta ?? '', trend_direction: k.trend?.direction ?? '' })), 'executive-ct-kpis')}
            className="flex h-8 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors"
          >
            <Download size={13} />
            Export
          </button>
        </div>
      </div>

      {/* Dashboard body */}
      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

        {/* ── Section 1: KPI Strip ─────────────────────────────────────────── */}
        <section aria-label="KPI Summary">
          <KPIStrip kpis={KPI_DATA} columns={8} />
        </section>

        {/* ── Section 2: Dispatch Funnel + Live Network (side by side) ─────── */}
        <section aria-label="Dispatch Overview" className="grid grid-cols-2 gap-5">
          <DispatchFunnel />
          <LiveNetworkView />
        </section>

        {/* ── Section 3: Exception Command Center (full width) ─────────────── */}
        <section aria-label="Exception Management">
          <ExceptionCommandCenter />
        </section>

        {/* ── Section 4: Route + Carrier Performance (full width each) ─────── */}
        <section aria-label="Route Performance">
          <RoutePerformance />
        </section>

        <section aria-label="Carrier Performance">
          <CarrierPerformance />
        </section>

        {/* ── Section 5: SLA Heatmap + Alert Center (side by side) ─────────── */}
        <section aria-label="SLA and Alerts" className="grid grid-cols-2 gap-5 pb-6">
          <SLAHeatmap />
          <AlertCenter />
        </section>

      </div>
    </div>
  )
}
