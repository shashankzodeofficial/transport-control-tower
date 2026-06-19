import React, { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  BarChart3, Truck, Building2, Route, AlertTriangle, ScanBarcode,
  Calendar, RefreshCw, ChevronDown,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useFilters } from '@/context/FilterContext'
import type { DateRangePreset } from '@/types'
import { ExecutiveAnalytics }      from './tabs/ExecutiveAnalytics'
import { OperationsAnalytics }     from './tabs/OperationsAnalytics'
import { CarrierAnalytics }        from './tabs/CarrierAnalytics'
import { RouteAnalytics }          from './tabs/RouteAnalytics'
import { ExceptionAnalytics }      from './tabs/ExceptionAnalytics'
import { ReconciliationAnalytics } from './tabs/ReconciliationAnalytics'

// ─── Tab definitions ──────────────────────────────────────────────────────────

const TABS = [
  { key: 'executive',     label: 'Executive',      icon: BarChart3,    path: '/analytics/executive' },
  { key: 'operations',    label: 'Operations',     icon: Truck,        path: '/analytics/operations' },
  { key: 'carriers',      label: 'Carriers',       icon: Building2,    path: '/analytics/carriers' },
  { key: 'routes',        label: 'Routes',         icon: Route,        path: '/analytics/routes' },
  { key: 'exceptions',    label: 'Exceptions',     icon: AlertTriangle,path: '/analytics/exceptions' },
  { key: 'reconciliation',label: 'Reconciliation', icon: ScanBarcode,  path: '/analytics/reconciliation' },
] as const

type TabKey = typeof TABS[number]['key']

function activeTabFromPath(pathname: string): TabKey {
  const seg = pathname.split('/').pop() ?? ''
  const found = TABS.find(t => t.key === seg)
  return found ? found.key : 'executive'
}

// ─── Date range selector — synced with global FilterContext ───────────────────

const PRESET_OPTIONS: { label: string; value: DateRangePreset }[] = [
  { label: 'Today',        value: 'today'     },
  { label: 'Yesterday',    value: 'yesterday' },
  { label: 'Last 7 Days',  value: '7d'        },
  { label: 'Last 30 Days', value: '30d'       },
  { label: 'This Month',   value: 'month'     },
]

function DateRangeSelector() {
  const { filters, setDatePreset } = useFilters()
  const [open, setOpen] = useState(false)
  const current = PRESET_OPTIONS.find(o => o.value === filters.dateRange.preset)?.label ?? 'Last 7 Days'
  return (
    <div className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex h-8 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors"
      >
        <Calendar size={13} className="text-slate-400" />
        {current}
        <ChevronDown size={12} className={cn('text-slate-400 transition-transform', open && 'rotate-180')} />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 z-30 w-40 rounded-xl border border-slate-200 bg-white shadow-lg overflow-hidden">
          {PRESET_OPTIONS.map(r => (
            <button
              key={r.value}
              onClick={() => { setDatePreset(r.value); setOpen(false) }}
              className={cn(
                'w-full text-left px-3 py-2 text-xs transition-colors',
                filters.dateRange.preset === r.value ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-slate-600 hover:bg-slate-50',
              )}
            >
              {r.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Quick filter pills ────────────────────────────────────────────────────────

const REGIONS  = ['All Regions', 'North', 'South', 'East', 'West']

function FilterPills({ label, options, value, onChange }: {
  label: string; options: string[]; value: string; onChange: (v: string) => void
}) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-xxs font-medium text-slate-400">{label}:</span>
      {options.map(o => (
        <button
          key={o}
          onClick={() => onChange(o)}
          className={cn(
            'rounded-full border px-2.5 py-1 text-xxs font-medium transition-colors',
            value === o
              ? 'bg-blue-600 border-blue-600 text-white'
              : 'border-slate-200 bg-white text-slate-500 hover:border-blue-300',
          )}
        >
          {o}
        </button>
      ))}
    </div>
  )
}

// ─── Main dashboard ────────────────────────────────────────────────────────────

export function AnalyticsDashboard() {
  const location = useLocation()
  const navigate = useNavigate()
  const [refreshing, setRefreshing] = useState(false)
  const { filters, setRegion: setGlobalRegion } = useFilters()

  // Map global lowercase region slug → display label
  const regionLabel = filters.region
    ? filters.region.charAt(0).toUpperCase() + filters.region.slice(1)
    : 'All Regions'

  // Translate FilterPills label → global region slug
  function handleRegionChange(label: string) {
    setGlobalRegion(label === 'All Regions' ? '' : label.toLowerCase())
  }

  const activeTab = activeTabFromPath(location.pathname)

  function handleRefresh() {
    setRefreshing(true)
    setTimeout(() => setRefreshing(false), 700)
  }

  const activeLabel = TABS.find(t => t.key === activeTab)?.label ?? 'Analytics'

  return (
    <div className="flex flex-col min-h-0 bg-slate-50">
      {/* Page header */}
      <div className="border-b border-slate-200 bg-white sticky top-0 z-10">
        <div className="flex items-center justify-between px-6 py-3">
          <div>
            <h1 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <BarChart3 size={16} className="text-blue-600" />
              Analytics
              <span className="text-slate-400 font-normal">·</span>
              <span className="text-blue-600">{activeLabel}</span>
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Aggregated from Executive CT, Dispatch, Operations, Exceptions, Reconciliation, Routes, Carriers
            </p>
          </div>
          <div className="flex items-center gap-2">
            <DateRangeSelector />
            <button
              onClick={handleRefresh}
              className="flex h-8 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors"
            >
              <RefreshCw size={13} className={cn('transition-transform', refreshing && 'animate-spin')} />
              Refresh
            </button>
          </div>
        </div>

        {/* Tab bar */}
        <div className="flex items-center gap-0 px-6 border-t border-slate-100 overflow-x-auto">
          {TABS.map(tab => {
            const Icon    = tab.icon
            const isActive = activeTab === tab.key
            return (
              <button
                key={tab.key}
                onClick={() => navigate(tab.path)}
                className={cn(
                  'flex items-center gap-2 px-4 py-3 text-xs font-medium border-b-2 transition-all whitespace-nowrap',
                  isActive
                    ? 'border-blue-600 text-blue-700 bg-blue-50/50'
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50',
                )}
              >
                <Icon size={13} />
                {tab.label}
              </button>
            )
          })}
        </div>

        {/* Filter bar */}
        <div className="flex items-center gap-4 px-6 py-2.5 bg-slate-50 border-t border-slate-100">
          <FilterPills label="Region" options={REGIONS} value={regionLabel} onChange={handleRegionChange} />
        </div>
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-auto p-6">
        {activeTab === 'executive'      && <ExecutiveAnalytics />}
        {activeTab === 'operations'     && <OperationsAnalytics />}
        {activeTab === 'carriers'       && <CarrierAnalytics />}
        {activeTab === 'routes'         && <RouteAnalytics />}
        {activeTab === 'exceptions'     && <ExceptionAnalytics />}
        {activeTab === 'reconciliation' && <ReconciliationAnalytics />}
      </div>
    </div>
  )
}
