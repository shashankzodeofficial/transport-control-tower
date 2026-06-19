import React, { useState } from 'react'
import { cn } from '@/lib/utils'
import { BarChart }  from '@/components/charts/BarChart'
import { LineChart } from '@/components/charts/LineChart'
import { DonutChart } from '@/components/charts/DonutChart'
import { ROUTE_DETAILS }        from '@/pages/routes/mock/data'
import { NETWORK_NODES }        from '@/pages/control-tower/mock/data'
import { OPS_KPI }              from '@/pages/operations/mock/data'
import {
  DELAY_DISTRIBUTION, HUB_PERFORMANCE, SLA_BREACH_BY_HOUR, CAPACITY_TREND,
} from '../mock/data'

function SectionTitle({ title, sub }: { title: string; sub?: string }) {
  return (
    <div className="mb-3">
      <h2 className="text-sm font-bold text-slate-900">{title}</h2>
      {sub && <p className="text-xxs text-slate-400 mt-0.5">{sub}</p>}
    </div>
  )
}

export function OperationsAnalytics() {
  const [hubSort, setHubSort] = useState<'otd' | 'util' | 'exceptions'>('otd')

  const sortedHubs = [...HUB_PERFORMANCE].sort((a, b) => {
    if (hubSort === 'otd')        return b.otd - a.otd
    if (hubSort === 'util')       return b.util - a.util
    return b.exceptions - a.exceptions
  })

  // Route adherence table
  const routeAdherence = ROUTE_DETAILS.map(r => ({
    routeCode:      r.routeCode,
    routeName:      r.routeName.split('→')[0].trim() + ' →' + r.routeName.split('→')[1],
    planned:        r.plannedTransitHours,
    actual:         r.avgTransitHours,
    adherencePct:   Math.round((r.plannedTransitHours / r.avgTransitHours) * 100),
    delayMin:       r.delayMinutesAvg,
    grade:          r.grade,
  })).sort((a, b) => b.adherencePct - a.adherencePct)

  const GRADE_COLOR: Record<string, string> = {
    A: 'text-green-600 bg-green-50', B: 'text-blue-600 bg-blue-50',
    C: 'text-amber-600 bg-amber-50', D: 'text-orange-600 bg-orange-50',
    F: 'text-red-600 bg-red-50',
  }

  // Pie for delay distribution
  const delayDonut = DELAY_DISTRIBUTION.map((d, i) => ({
    name: d.band,
    value: d.count,
    color: ['#10B981','#84CC16','#F59E0B','#F97316','#EF4444'][i],
  }))

  return (
    <div className="space-y-8">
      {/* KPI summary row */}
      <section>
        <SectionTitle title="Operations KPIs" sub="Live fleet metrics" />
        <div className="grid grid-cols-6 gap-4">
          {OPS_KPI.map(k => (
            <div key={k.label} className="rounded-xl border border-slate-200 bg-white p-4 space-y-1">
              <p className="text-xxs font-semibold uppercase tracking-wide text-slate-500">{k.label}</p>
              <p className="text-2xl font-bold text-slate-900">{k.value}{k.unit}</p>
              {k.trend && (
                <p className={cn('text-xxs font-medium', k.trend.direction === 'up' ? 'text-green-600' : 'text-red-500')}>
                  {k.trend.delta} {k.trend.period}
                </p>
              )}
              {(k as any).progress !== undefined && (
                <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                  <div className="h-full rounded-full bg-blue-500" style={{ width: `${(k as any).progress}%` }} />
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Route Adherence */}
      <section>
        <SectionTitle title="Route Adherence" sub="Planned vs actual transit time — MTD" />
        <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  {['Route', 'Planned Hrs', 'Actual Hrs', 'Adherence', 'Avg Delay', 'Grade'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xxs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {routeAdherence.map(r => (
                  <tr key={r.routeCode} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-mono text-xxs text-slate-500">{r.routeCode}</p>
                      <p className="font-medium text-slate-800 text-xs truncate max-w-[180px]">{r.routeName}</p>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{r.planned}h</td>
                    <td className="px-4 py-3 font-medium text-slate-800">{r.actual}h</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 rounded-full bg-slate-100 overflow-hidden w-16">
                          <div
                            className={cn('h-full rounded-full', r.adherencePct >= 95 ? 'bg-green-500' : r.adherencePct >= 80 ? 'bg-amber-500' : 'bg-red-500')}
                            style={{ width: `${Math.min(r.adherencePct, 100)}%` }}
                          />
                        </div>
                        <span className={cn('text-xs font-semibold', r.adherencePct >= 95 ? 'text-green-600' : r.adherencePct >= 80 ? 'text-amber-600' : 'text-red-600')}>
                          {r.adherencePct}%
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{r.delayMin}m</td>
                    <td className="px-4 py-3">
                      <span className={cn('rounded-md px-2 py-0.5 text-xxs font-bold', GRADE_COLOR[r.grade] ?? 'bg-slate-100 text-slate-600')}>{r.grade}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Delay Analysis + SLA Breach by Hour */}
      <section>
        <div className="grid grid-cols-2 gap-6">
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <SectionTitle title="Delay Distribution" sub="Dispatches by delay band — MTD" />
            <div className="flex gap-4 items-center">
              <div style={{ width: 160, flexShrink: 0 }}>
                <DonutChart
                  data={delayDonut}
                  height={160}
                  centerLabel="Total"
                  centerValue={DELAY_DISTRIBUTION.reduce((s, d) => s + d.count, 0)}
                />
              </div>
              <div className="flex-1 space-y-2">
                {DELAY_DISTRIBUTION.map((d, i) => (
                  <div key={d.band} className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full flex-shrink-0" style={{ background: delayDonut[i].color }} />
                    <span className="text-xs text-slate-600 flex-1">{d.band}</span>
                    <span className="text-xs font-semibold text-slate-800">{d.count}</span>
                    <span className="text-xxs text-slate-400 w-8 text-right">{d.pct}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <SectionTitle title="SLA Breaches by Hour" sub="When do breaches cluster?" />
            <BarChart
              data={SLA_BREACH_BY_HOUR as unknown as Record<string, unknown>[]}
              xKey="hour"
              series={[{ dataKey: 'breaches', label: 'Breaches', color: '#EF4444' }]}
              height={200}
            />
          </div>
        </div>
      </section>

      {/* Hub Performance */}
      <section>
        <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
          <div className="px-5 pt-5 pb-0 flex items-center justify-between mb-4">
            <div>
              <SectionTitle title="Hub Performance" sub="Arrival throughput, OTD, utilisation" />
            </div>
            <div className="flex rounded-lg border border-slate-200 overflow-hidden text-xxs font-medium">
              {(['otd', 'util', 'exceptions'] as const).map(s => (
                <button
                  key={s}
                  onClick={() => setHubSort(s)}
                  className={cn('px-3 py-1.5 capitalize transition-colors', hubSort === s ? 'bg-blue-600 text-white' : 'bg-white text-slate-500 hover:bg-slate-50')}
                >
                  By {s === 'otd' ? 'OTD' : s === 'util' ? 'Utilisation' : 'Exceptions'}
                </button>
              ))}
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  {['Hub', 'Arrivals Today', 'OTD %', 'Avg Dock Time', 'Utilisation', 'Active Exceptions'].map(h => (
                    <th key={h} className="text-left px-4 py-2.5 text-xxs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {sortedHubs.map(h => (
                  <tr key={h.hub} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-slate-800">{h.hub}</td>
                    <td className="px-4 py-3 text-slate-600">{h.arrivals}</td>
                    <td className="px-4 py-3">
                      <span className={cn('font-semibold', h.otd >= 88 ? 'text-green-600' : h.otd >= 80 ? 'text-amber-600' : 'text-red-600')}>
                        {h.otd}%
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{h.avgDockTime} min</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                          <div className={cn('h-full rounded-full', h.util >= 85 ? 'bg-red-500' : h.util >= 70 ? 'bg-amber-500' : 'bg-green-500')} style={{ width: `${h.util}%` }} />
                        </div>
                        <span className="text-slate-600">{h.util}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn('rounded-full px-2 py-0.5 text-xxs font-semibold', h.exceptions > 4 ? 'bg-red-100 text-red-700' : h.exceptions > 2 ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700')}>
                        {h.exceptions}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Capacity utilisation trend */}
      <section>
        <div className="grid grid-cols-2 gap-6">
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <SectionTitle title="Capacity Utilisation Trend" sub="Fleet load factor — last 8 weeks" />
            <LineChart
              data={CAPACITY_TREND as unknown as Record<string, unknown>[]}
              xKey="week"
              series={[
                { dataKey: 'loaded', label: 'Loaded %', color: '#3B82F6' },
              ]}
              height={200}
              referenceLines={[{ value: 75, label: 'Target 75%', color: '#10B981' }]}
            />
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <SectionTitle title="Hub Arrivals vs OTD" sub="Throughput correlation" />
            <BarChart
              data={HUB_PERFORMANCE.map(h => ({ hub: h.hub.replace(' Hub','').replace(' Depot',''), arrivals: h.arrivals, otd: h.otd })) as unknown as Record<string, unknown>[]}
              xKey="hub"
              series={[
                { dataKey: 'arrivals', label: 'Arrivals', color: '#3B82F6' },
                { dataKey: 'otd',      label: 'OTD %',    color: '#10B981' },
              ]}
              height={200}
              showLegend
            />
          </div>
        </div>
      </section>
    </div>
  )
}
