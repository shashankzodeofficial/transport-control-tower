import React, { useState, useMemo } from 'react'
import {
  TrendingUp, TrendingDown, MapPin, AlertTriangle,
  Search, Download, BarChart2, ChevronRight, X,
  Clock, Package, DollarSign, Activity,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { GradeBadge }  from '@/components/badges/GradeBadge'
import { SparklineChart } from '@/components/charts/SparklineChart'
import { BarChart }    from '@/components/charts/BarChart'
import { DonutChart }  from '@/components/charts/DonutChart'
import { LineChart }   from '@/components/charts/LineChart'
import { TabStrip }    from '@/layout/TabStrip'
import {
  ROUTE_DETAILS, ROUTE_KPI, GRADE_DIST, REGION_OTD,
} from './mock/data'
import type { RouteDetail } from './mock/data'
import type { RouteGrade } from '@/theme'

// ─── Grade color helper ────────────────────────────────────────────────────────

const GRADE_COLOR: Record<RouteGrade, string> = {
  A: '#22c55e', B: '#84cc16', C: '#f59e0b', D: '#f97316', F: '#ef4444',
}

function scoreBar(score: number, grade: RouteGrade) {
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-24 rounded-full bg-slate-100 overflow-hidden">
        <div
          className="h-full rounded-full"
          style={{ width: `${score}%`, background: GRADE_COLOR[grade] }}
        />
      </div>
      <span className="text-xs font-semibold tabular-nums text-slate-700">{score}</span>
    </div>
  )
}

// ─── Route detail panel ───────────────────────────────────────────────────────

function RouteDetailPanel({ route, onClose }: { route: RouteDetail; onClose: () => void }) {
  const [view, setView] = useState<'dispatches' | 'otd'>('dispatches')

  const chartData = route.dispatchTrend.map((v, i) => ({
    week: `W${i + 1}`,
    dispatches: v,
    otd: route.otdTrend[i],
  }))

  return (
    <div className="flex h-full flex-col border-l border-slate-200 bg-white">
      {/* Header */}
      <div className="border-b border-slate-100 px-5 py-4">
        <div className="flex items-start justify-between mb-1">
          <div className="flex items-center gap-2">
            <GradeBadge grade={route.grade} />
            <span className="font-mono text-sm font-bold text-slate-800">{route.routeCode}</span>
          </div>
          <button onClick={onClose} className="rounded-lg p-1 hover:bg-slate-100 transition-colors">
            <X size={14} className="text-slate-400" />
          </button>
        </div>
        <p className="text-xs text-slate-500">{route.routeName}</p>
        <p className="text-xxs text-slate-400 mt-0.5">{route.origin} → {route.destination}</p>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
        {/* Score bar */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xxs font-semibold uppercase tracking-wide text-slate-400">Performance Score</p>
            <span className="text-2xl font-bold" style={{ color: GRADE_COLOR[route.grade] }}>{route.gradeScore}</span>
          </div>
          <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${route.gradeScore}%`, background: GRADE_COLOR[route.grade] }}
            />
          </div>
        </div>

        {/* KPI grid */}
        <div className="grid grid-cols-2 gap-2">
          {[
            { label: 'OTD%',          value: `${route.otdPct}%`,   color: route.otdPct >= 90 ? 'text-green-600' : route.otdPct >= 80 ? 'text-amber-600' : 'text-red-600' },
            { label: 'OTA%',          value: `${route.otaPct}%`,   color: route.otaPct >= 90 ? 'text-green-600' : route.otaPct >= 80 ? 'text-amber-600' : 'text-red-600' },
            { label: 'SLA Compliance',value: `${route.slaCompliancePct}%`, color: 'text-slate-700' },
            { label: 'Avg Delay',     value: `${route.delayMinutesAvg}m`, color: route.delayMinutesAvg > 120 ? 'text-red-600' : 'text-slate-700' },
            { label: 'Exception Rate',value: `${route.exceptionRate}/100`, color: route.exceptionRate > 5 ? 'text-red-600' : 'text-slate-700' },
            { label: 'Distance',      value: `${route.distanceKm} km`, color: 'text-slate-700' },
            { label: 'Avg Transit',   value: `${route.avgTransitHours}h`, color: 'text-slate-700' },
            { label: 'Cost/km',       value: `₹${route.costPerKm}`, color: 'text-slate-700' },
          ].map(kpi => (
            <div key={kpi.label} className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2">
              <p className="text-xxs text-slate-400 mb-0.5">{kpi.label}</p>
              <p className={cn('text-sm font-bold tabular-nums', kpi.color)}>{kpi.value}</p>
            </div>
          ))}
        </div>

        {/* Top carrier */}
        <div className="rounded-lg border border-slate-200 px-4 py-3">
          <p className="text-xxs font-semibold uppercase tracking-wide text-slate-400 mb-1">Top Carrier</p>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-700">{route.topCarrier}</span>
            <span className="text-xs font-semibold text-blue-600">Score {route.topCarrierScore}</span>
          </div>
        </div>

        {/* Active exception */}
        {route.lastException && (
          <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5">
            <AlertTriangle size={13} className="text-amber-500 mt-0.5 shrink-0" />
            <p className="text-xs text-amber-800">{route.lastException}</p>
          </div>
        )}

        {/* 8-week trend chart */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <p className="text-xs font-semibold text-slate-700">8-Week Trend</p>
            <div className="flex items-center gap-1 ml-auto">
              {(['dispatches','otd'] as const).map(v => (
                <button
                  key={v}
                  onClick={() => setView(v)}
                  className={cn('rounded-full px-2.5 py-0.5 text-xxs font-medium capitalize transition-colors',
                    view === v ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  )}
                >
                  {v === 'otd' ? 'OTD%' : 'Dispatches'}
                </button>
              ))}
            </div>
          </div>
          <LineChart
            data={chartData}
            xKey="week"
            series={[{
              dataKey: view,
              label: view === 'otd' ? 'OTD%' : 'Dispatches',
              color: GRADE_COLOR[route.grade],
            }]}
            height={90}
            showGrid
          />
        </div>

        {/* Tags */}
        {route.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {route.tags.map(t => (
              <span key={t} className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xxs font-medium text-slate-600">{t}</span>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Route row ────────────────────────────────────────────────────────────────

function RouteRow({ route, isSelected, onClick }: {
  route: RouteDetail
  isSelected: boolean
  onClick: () => void
}) {
  const delayBad = route.delayMinutesAvg > 180
  const excBad   = route.exceptionRate > 7

  return (
    <tr
      onClick={onClick}
      className={cn(
        'cursor-pointer transition-colors border-b border-slate-100',
        isSelected ? 'bg-blue-50' :
        (delayBad || excBad) ? 'bg-red-50/30 hover:bg-red-50' :
        'hover:bg-slate-50',
      )}
    >
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <GradeBadge grade={route.grade} />
          <span className="font-mono text-xs font-bold text-slate-700">{route.routeCode}</span>
        </div>
      </td>
      <td className="px-4 py-3">
        <p className="text-xs font-medium text-slate-700 max-w-[180px] truncate">{route.routeName}</p>
        <p className="text-xxs text-slate-400 mt-0.5">{route.distanceKm} km · {route.avgTransitHours}h avg</p>
      </td>
      <td className="px-4 py-3">{scoreBar(route.gradeScore, route.grade)}</td>
      <td className="px-4 py-3">
        <span className={cn('text-xs font-semibold tabular-nums',
          route.otdPct >= 90 ? 'text-green-600' : route.otdPct >= 80 ? 'text-amber-600' : 'text-red-600'
        )}>
          {route.otdPct}%
        </span>
      </td>
      <td className="px-4 py-3 text-xs text-slate-600 tabular-nums">{route.slaCompliancePct}%</td>
      <td className="px-4 py-3">
        <span className={cn('text-xs tabular-nums font-medium', route.delayMinutesAvg > 180 ? 'text-red-600' : route.delayMinutesAvg > 60 ? 'text-amber-600' : 'text-slate-600')}>
          {route.delayMinutesAvg}m
        </span>
      </td>
      <td className="px-4 py-3">
        <span className={cn('text-xs tabular-nums', route.exceptionRate > 7 ? 'text-red-600 font-semibold' : route.exceptionRate > 4 ? 'text-amber-600' : 'text-slate-600')}>
          {route.exceptionRate}
        </span>
      </td>
      <td className="px-4 py-3">
        <SparklineChart data={route.otdTrend.map((v, i) => ({ i, v }))} dataKey="v" color={GRADE_COLOR[route.grade]} height={28} width={70} />
      </td>
      <td className="px-4 py-3 text-xs text-slate-500 tabular-nums">{route.dispatchCount}</td>
      <td className="px-4 py-3 text-xs font-medium text-slate-600">₹{route.freightRevenueM}M</td>
      <td className="px-4 py-3">
        {route.lastException && (
          <AlertTriangle size={13} className="text-amber-500" title={route.lastException} />
        )}
      </td>
      <td className="px-4 py-3">
        <ChevronRight size={13} className={cn('transition-transform', isSelected ? 'text-blue-500 rotate-90' : 'text-slate-300')} />
      </td>
    </tr>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

const GRADE_TABS = [
  { key: 'all', label: 'All Routes' },
  { key: 'A',   label: 'Grade A'    },
  { key: 'B',   label: 'Grade B'    },
  { key: 'C',   label: 'Grade C'    },
  { key: 'D',   label: 'Grade D'    },
]

type SortKey = 'gradeScore' | 'otdPct' | 'delayMinutesAvg' | 'exceptionRate' | 'dispatchCount'

export function RoutePerformance() {
  const [tab, setTab]             = useState('all')
  const [search, setSearch]       = useState('')
  const [sortKey, setSortKey]     = useState<SortKey>('gradeScore')
  const [sortDir, setSortDir]     = useState<'asc' | 'desc'>('desc')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [showCharts, setShowCharts] = useState(true)

  const filtered = useMemo(() => {
    let list = ROUTE_DETAILS
    if (tab !== 'all') list = list.filter(r => r.grade === tab)
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(r =>
        r.routeCode.toLowerCase().includes(q) ||
        r.routeName.toLowerCase().includes(q) ||
        r.origin.toLowerCase().includes(q) ||
        r.destination.toLowerCase().includes(q)
      )
    }
    return [...list].sort((a, b) => {
      const va = a[sortKey] as number
      const vb = b[sortKey] as number
      return sortDir === 'desc' ? vb - va : va - vb
    })
  }, [tab, search, sortKey, sortDir])

  const selected = selectedId ? ROUTE_DETAILS.find(r => r.id === selectedId) ?? null : null

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir(d => d === 'desc' ? 'asc' : 'desc')
    else { setSortKey(key); setSortDir('desc') }
  }

  const tabsWithBadge = GRADE_TABS.map(t => ({
    ...t,
    badge: t.key === 'all' ? ROUTE_DETAILS.length : ROUTE_DETAILS.filter(r => r.grade === t.key).length,
  }))

  const donutData = GRADE_DIST.map(g => ({ name: `Grade ${g.grade}`, value: g.count, color: g.color }))
  const regionBarData = REGION_OTD.map(r => ({ region: r.region, OTD: r.otd }))

  return (
    <div className="flex flex-col h-full bg-slate-50">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
        <div>
          <h1 className="text-lg font-bold text-slate-900">Route Performance</h1>
          <p className="text-xs text-slate-400">Grade-based scoring across all active corridors</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowCharts(s => !s)}
            className={cn('flex h-8 items-center gap-1.5 rounded-lg border px-3 text-xs font-medium transition-colors',
              showCharts ? 'border-blue-200 bg-blue-50 text-blue-700' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50')}
          >
            <BarChart2 size={13} />Analytics
          </button>
          <button className="flex h-8 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-slate-600 hover:bg-slate-50">
            <Download size={13} />Export
          </button>
        </div>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-6 gap-3 border-b border-slate-200 bg-white px-6 py-4">
        {[
          { label: 'Total Routes',   value: ROUTE_KPI.totalRoutes,       icon: MapPin,     color: 'text-slate-700'  },
          { label: 'Avg OTD%',       value: `${ROUTE_KPI.avgOTD}%`,     icon: TrendingUp,  color: 'text-green-600'  },
          { label: 'Grade A',        value: ROUTE_KPI.gradeA,            icon: Activity,    color: 'text-green-600'  },
          { label: 'Grade D/F',      value: ROUTE_KPI.gradeD_F,          icon: TrendingDown,color: 'text-red-600'    },
          { label: 'Avg Exc. Rate',  value: ROUTE_KPI.avgExceptionRate,  icon: AlertTriangle,color: 'text-amber-600' },
          { label: 'Total Dispatches',value: ROUTE_KPI.totalDispatches,  icon: Package,     color: 'text-slate-700'  },
        ].map(k => (
          <div key={k.label} className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
            <div className="flex items-center justify-between mb-1">
              <p className="text-xxs font-semibold uppercase tracking-wide text-slate-400">{k.label}</p>
              <k.icon size={13} className={k.color} />
            </div>
            <p className={cn('text-2xl font-bold tabular-nums', k.color)}>{k.value}</p>
          </div>
        ))}
      </div>

      {/* Analytics */}
      {showCharts && (
        <div className="grid grid-cols-3 gap-4 border-b border-slate-200 bg-white px-6 py-4">
          {/* Grade distribution donut */}
          <div className="rounded-xl border border-slate-200 p-4">
            <p className="mb-3 text-xs font-semibold text-slate-700">Grade Distribution</p>
            <div className="flex items-center gap-5">
              <DonutChart data={donutData} size={96} />
              <div className="space-y-1">
                {GRADE_DIST.map(g => (
                  <div key={g.grade} className="flex items-center gap-2 text-xxs">
                    <div className="h-2 w-2 rounded-full shrink-0" style={{ background: g.color }} />
                    <span className="text-slate-600">Grade {g.grade}</span>
                    <span className="ml-auto font-semibold tabular-nums text-slate-800">{g.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Region OTD bars */}
          <div className="rounded-xl border border-slate-200 p-4">
            <p className="mb-3 text-xs font-semibold text-slate-700">OTD% by Region</p>
            <BarChart
              data={regionBarData}
              xKey="region"
              series={[{ dataKey: 'OTD', label: 'OTD%', color: '#3b82f6' }]}
              height={100}
              showGrid
            />
          </div>

          {/* Performance quadrant table */}
          <div className="rounded-xl border border-slate-200 p-4">
            <p className="mb-3 text-xs font-semibold text-slate-700">Top & Bottom Routes</p>
            <div className="space-y-1.5">
              {[...ROUTE_DETAILS].sort((a,b) => b.gradeScore - a.gradeScore).slice(0, 3).map(r => (
                <div key={r.id} className="flex items-center gap-2 text-xxs">
                  <GradeBadge grade={r.grade} />
                  <span className="text-slate-600 truncate flex-1">{r.routeCode}</span>
                  <span className="font-semibold text-green-600">{r.gradeScore}</span>
                </div>
              ))}
              <div className="my-1 border-t border-slate-100" />
              {[...ROUTE_DETAILS].sort((a,b) => a.gradeScore - b.gradeScore).slice(0, 2).map(r => (
                <div key={r.id} className="flex items-center gap-2 text-xxs">
                  <GradeBadge grade={r.grade} />
                  <span className="text-slate-600 truncate flex-1">{r.routeCode}</span>
                  <span className="font-semibold text-red-600">{r.gradeScore}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <TabStrip tabs={tabsWithBadge} activeTab={tab} onChange={setTab} variant="page" />

      {/* Toolbar */}
      <div className="flex items-center gap-3 border-b border-slate-200 bg-white px-6 py-2.5">
        <Search size={14} className="text-slate-400 shrink-0" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search route code, name, origin, destination…"
          className="flex-1 bg-transparent text-sm text-slate-700 placeholder:text-slate-400 outline-none"
        />
        <span className="text-xs text-slate-400 ml-2">{filtered.length} route{filtered.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 overflow-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-slate-50 border-b border-slate-200 z-10">
              <tr>
                <Th2>Route</Th2>
                <Th2>Name / Distance</Th2>
                <SortableTh label="Score" sortKey="gradeScore" current={sortKey} dir={sortDir} onSort={toggleSort} />
                <SortableTh label="OTD%" sortKey="otdPct" current={sortKey} dir={sortDir} onSort={toggleSort} />
                <Th2>SLA %</Th2>
                <SortableTh label="Avg Delay" sortKey="delayMinutesAvg" current={sortKey} dir={sortDir} onSort={toggleSort} />
                <SortableTh label="Exc/100" sortKey="exceptionRate" current={sortKey} dir={sortDir} onSort={toggleSort} />
                <Th2>OTD Trend</Th2>
                <SortableTh label="Dispatches" sortKey="dispatchCount" current={sortKey} dir={sortDir} onSort={toggleSort} />
                <Th2>Revenue</Th2>
                <Th2></Th2>
                <Th2></Th2>
              </tr>
            </thead>
            <tbody>
              {filtered.map(route => (
                <RouteRow
                  key={route.id}
                  route={route}
                  isSelected={selectedId === route.id}
                  onClick={() => setSelectedId(prev => prev === route.id ? null : route.id)}
                />
              ))}
            </tbody>
          </table>
        </div>

        {selected && (
          <div className="w-80 shrink-0 overflow-hidden">
            <RouteDetailPanel route={selected} onClose={() => setSelectedId(null)} />
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Table helpers ─────────────────────────────────────────────────────────────

function Th2({ children }: { children: React.ReactNode }) {
  return (
    <th className="px-4 py-3 text-left text-xxs font-semibold uppercase tracking-wide text-slate-400 whitespace-nowrap">
      {children}
    </th>
  )
}

function SortableTh({ label, sortKey, current, dir, onSort }: {
  label: string
  sortKey: SortKey
  current: SortKey
  dir: 'asc' | 'desc'
  onSort: (k: SortKey) => void
}) {
  const active = current === sortKey
  return (
    <th
      className="px-4 py-3 text-left text-xxs font-semibold uppercase tracking-wide text-slate-400 whitespace-nowrap cursor-pointer hover:text-slate-600 select-none"
      onClick={() => onSort(sortKey)}
    >
      <span className="flex items-center gap-1">
        {label}
        <span className={cn('text-slate-300', active && 'text-blue-500')}>
          {active ? (dir === 'desc' ? '↓' : '↑') : '↕'}
        </span>
      </span>
    </th>
  )
}
