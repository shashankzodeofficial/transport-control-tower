import React, { useState, useEffect, useMemo } from 'react'
import { RefreshCw, Download, Maximize2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { exportCsv } from '@/lib/exportCsv'
import { useFilters } from '@/context/FilterContext'
import { KPIStrip } from '@/components/kpi/KPIStrip'
import { DispatchFunnel }          from './widgets/DispatchFunnel'
import { LiveNetworkView }         from './widgets/LiveNetworkView'
import { ExceptionCommandCenter }  from './widgets/ExceptionCommandCenter'
import { RoutePerformance }        from './widgets/RoutePerformance'
import { CarrierPerformance }      from './widgets/CarrierPerformance'
import { SLAHeatmap }              from './widgets/SLAHeatmap'
import { AlertCenter }             from './widgets/AlertCenter'
import { KPI_DATA, REGION_SUMMARY, NETWORK_NODES } from './mock/data'
import type { KPIData } from '@/types'

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
  const { filters } = useFilters()
  const { region } = filters

  const kpiData = useMemo((): KPIData[] => {
    if (!region) return KPI_DATA
    const r = REGION_SUMMARY.find(rs => rs.region.toLowerCase() === region)
    if (!r) return KPI_DATA
    const nodes = NETWORK_NODES.filter(n => n.region === region)
    const avgUtil = nodes.length
      ? Math.round(nodes.reduce((s, n) => s + n.utilPct, 0) / nodes.length)
      : 79
    const slaBreaches = Math.max(1, Math.round(r.dispatches * (100 - r.onTime) / 100 * 0.3))
    return [
      { ...KPI_DATA[0], value: r.dispatches },
      { ...KPI_DATA[1], value: r.onTime, status: r.onTime >= 90 ? 'healthy' : r.onTime >= 80 ? 'warning' : 'danger', progress: r.onTime },
      { ...KPI_DATA[2], value: slaBreaches },
      { ...KPI_DATA[3], value: r.exceptions, progress: Math.round(r.exceptions / 37 * 100) },
      { ...KPI_DATA[4], value: avgUtil, progress: avgUtil },
      { ...KPI_DATA[5], value: r.onTime >= 90 ? '1.8' : r.onTime >= 85 ? '2.4' : '3.2' },
      { ...KPI_DATA[6] },
      { ...KPI_DATA[7], value: Math.round(r.dispatches * 0.12) },
    ]
  }, [region])

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
            Live operations overview{region ? ` · ${region.charAt(0).toUpperCase() + region.slice(1)} region` : ''} · Last updated {fmtTime(lastRefresh)}
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
          <KPIStrip kpis={kpiData} columns={8} />
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
