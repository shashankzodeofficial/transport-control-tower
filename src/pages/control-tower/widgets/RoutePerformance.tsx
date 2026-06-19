import React, { useState, useMemo } from 'react'
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useFilters } from '@/context/FilterContext'
import { routeOriginRegion } from '@/lib/exportCsv'
import { GradeBadge } from '@/components/badges/GradeBadge'
import { TrendBadge } from '@/components/badges/TrendBadge'
import { SparklineChart } from '@/components/charts/SparklineChart'
import { DonutChart } from '@/components/charts/DonutChart'
import { ROUTE_PERFORMANCE } from '../mock/data'
import type { RoutePerf } from '../mock/data'

const GRADE_COLORS: Record<string, string> = {
  A: '#16A34A', B: '#2563EB', C: '#D97706', D: '#EA580C', F: '#DC2626',
}

type SortKey = 'otdPct' | 'avgDelayHrs' | 'exceptions' | 'costPerKm' | 'dispatchCount'

export function RoutePerformance() {
  const [sortKey, setSortKey]   = useState<SortKey>('otdPct')
  const [sortDir, setSortDir]   = useState<'asc' | 'desc'>('desc')
  const [gradeFilter, setGradeFilter] = useState<string | null>(null)
  const { filters } = useFilters()
  const { region } = filters

  function handleSort(key: SortKey) {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir(key === 'avgDelayHrs' || key === 'exceptions' ? 'asc' : 'desc') }
  }

  const baseRoutes = useMemo(() =>
    region
      ? ROUTE_PERFORMANCE.filter(r => routeOriginRegion(r.routeCode) === region)
      : ROUTE_PERFORMANCE,
    [region],
  )

  const gradeDistribution = useMemo(() => {
    const c: Record<string, number> = { A: 0, B: 0, C: 0, D: 0, F: 0 }
    baseRoutes.forEach(r => { c[r.grade] = (c[r.grade] ?? 0) + 1 })
    return [
      { name: 'A', value: c.A, color: GRADE_COLORS.A },
      { name: 'B', value: c.B, color: GRADE_COLORS.B },
      { name: 'C', value: c.C, color: GRADE_COLORS.C },
      { name: 'D', value: c.D, color: GRADE_COLORS.D },
      { name: 'F', value: c.F, color: GRADE_COLORS.F },
    ]
  }, [baseRoutes])

  const sorted = useMemo(() =>
    [...baseRoutes]
      .filter(r => !gradeFilter || r.grade === gradeFilter)
      .sort((a, b) => {
        const mul = sortDir === 'asc' ? 1 : -1
        return ((a[sortKey] as number) - (b[sortKey] as number)) * mul
      }),
    [baseRoutes, gradeFilter, sortKey, sortDir],
  )

  return (
    <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
        <div>
          <h3 className="text-sm font-semibold text-slate-800">Route Performance</h3>
          <p className="text-xs text-slate-400 mt-0.5">{baseRoutes.length} routes{region ? ` · ${region}` : ''} · sorted by {sortKey}</p>
        </div>
        <div className="flex items-center gap-4">
          {/* Grade filter */}
          <div className="flex items-center gap-1">
            {['A', 'B', 'C', 'D'].map(g => (
              <button
                key={g}
                onClick={() => setGradeFilter(gradeFilter === g ? null : g)}
                className={cn(
                  'flex h-6 w-6 items-center justify-center rounded text-xs font-bold transition-all',
                  gradeFilter === g
                    ? 'text-white shadow-sm'
                    : 'bg-slate-100 text-slate-500 hover:bg-slate-200',
                )}
                style={gradeFilter === g ? { backgroundColor: GRADE_COLORS[g] } : {}}
              >
                {g}
              </button>
            ))}
          </div>
          {/* Donut summary */}
          <div className="flex items-center gap-1">
            {gradeDistribution.filter(g => g.value > 0).map(g => (
              <div key={g.name} className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: g.color }} />
                <span className="text-xxs text-slate-500">{g.name}:{g.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-7">
        {/* Table */}
        <div className="col-span-5 overflow-x-auto">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <th className="px-4 py-2.5 text-left font-semibold uppercase tracking-wide text-slate-400">Route</th>
                <th className="px-3 py-2.5 text-center font-semibold uppercase tracking-wide text-slate-400">Grade</th>
                <SortTh label="OTD %" sortKey="otdPct"        current={sortKey} dir={sortDir} onSort={handleSort} />
                <SortTh label="Avg Delay" sortKey="avgDelayHrs"  current={sortKey} dir={sortDir} onSort={handleSort} />
                <SortTh label="Except." sortKey="exceptions"   current={sortKey} dir={sortDir} onSort={handleSort} />
                <SortTh label="₹/km" sortKey="costPerKm"     current={sortKey} dir={sortDir} onSort={handleSort} />
                <th className="px-3 py-2.5 text-right font-semibold uppercase tracking-wide text-slate-400">7D Trend</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {sorted.map(route => (
                <RouteRow key={route.routeCode} route={route} />
              ))}
            </tbody>
          </table>
        </div>

        {/* Right — grade donut */}
        <div className="col-span-2 border-l border-slate-100 px-4 py-4 flex flex-col items-center">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-2 self-start">Grade Mix</p>
          <DonutChart
            data={gradeDistribution.map(g => ({ name: g.name, value: Math.max(g.value, 0.01), color: g.color }))}
            height={130}
            innerRadius="55%"
            outerRadius="78%"
          />
          <div className="mt-3 w-full space-y-1.5">
            {gradeDistribution.filter(g => g.value > 0).map(g => (
              <div key={g.name} className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-sm" style={{ backgroundColor: g.color }} />
                  <span className="text-xs text-slate-600">Grade {g.name}</span>
                </div>
                <span className="text-xs font-semibold text-slate-700">{g.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function SortTh({
  label, sortKey, current, dir, onSort,
}: { label: string; sortKey: SortKey; current: SortKey; dir: 'asc' | 'desc'; onSort: (k: SortKey) => void }) {
  const active = current === sortKey
  const Icon = active ? (dir === 'asc' ? ArrowUp : ArrowDown) : ArrowUpDown
  return (
    <th className="px-3 py-2.5 text-right">
      <button
        onClick={() => onSort(sortKey)}
        className={cn(
          'inline-flex items-center gap-1 ml-auto font-semibold uppercase tracking-wide',
          active ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600',
        )}
      >
        {label}<Icon size={10} />
      </button>
    </th>
  )
}

function RouteRow({ route }: { route: RoutePerf }) {
  const delayColor = route.avgDelayHrs < 2 ? 'text-green-600' : route.avgDelayHrs < 4 ? 'text-amber-600' : 'text-red-600'
  const sparkColor = route.trend === 'up' ? '#16A34A' : route.trend === 'down' ? '#DC2626' : '#64748B'

  return (
    <tr className="hover:bg-slate-50 transition-colors">
      <td className="px-4 py-2.5">
        <div className="font-semibold text-slate-700">{route.routeCode}</div>
        <div className="text-slate-400 truncate max-w-[160px]">{route.routeName}</div>
      </td>
      <td className="px-3 py-2.5 text-center">
        <GradeBadge grade={route.grade} size="sm" />
      </td>
      <td className="px-3 py-2.5 text-right">
        <span className={cn('font-semibold tabular-nums', route.otdPct >= 90 ? 'text-green-600' : route.otdPct >= 80 ? 'text-amber-600' : 'text-red-600')}>
          {route.otdPct}%
        </span>
      </td>
      <td className={cn('px-3 py-2.5 text-right font-medium tabular-nums', delayColor)}>
        {route.avgDelayHrs}h
      </td>
      <td className="px-3 py-2.5 text-right">
        <span className={cn(
          'rounded-full px-2 py-0.5 text-xs font-semibold',
          route.exceptions === 0 ? 'text-slate-400' :
          route.exceptions <= 2 ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-700',
        )}>
          {route.exceptions}
        </span>
      </td>
      <td className="px-3 py-2.5 text-right text-slate-600 tabular-nums">
        ₹{route.costPerKm}
      </td>
      <td className="px-3 py-2.5">
        <SparklineChart data={route.sparkline} color={sparkColor} height={28} />
      </td>
    </tr>
  )
}
