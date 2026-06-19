import React, { useState } from 'react'
import { cn } from '@/lib/utils'
import { BarChart }       from '@/components/charts/BarChart'
import { LineChart }      from '@/components/charts/LineChart'
import { DonutChart }     from '@/components/charts/DonutChart'
import { SparklineChart } from '@/components/charts/SparklineChart'
import { ROUTE_DETAILS, ROUTE_KPI, GRADE_DIST, REGION_OTD } from '@/pages/routes/mock/data'
import { ROUTE_DELAY_HEAT, ROUTE_RELIABILITY_TREND } from '../mock/data'

function SectionTitle({ title, sub }: { title: string; sub?: string }) {
  return (
    <div className="mb-3">
      <h2 className="text-sm font-bold text-slate-900">{title}</h2>
      {sub && <p className="text-xxs text-slate-400 mt-0.5">{sub}</p>}
    </div>
  )
}

const GRADE_COLOR: Record<string, { badge: string; bar: string }> = {
  A: { badge: 'bg-green-100 text-green-700',  bar: 'bg-green-500' },
  B: { badge: 'bg-blue-100 text-blue-700',    bar: 'bg-blue-500' },
  C: { badge: 'bg-amber-100 text-amber-700',  bar: 'bg-amber-500' },
  D: { badge: 'bg-orange-100 text-orange-700',bar: 'bg-orange-500' },
  F: { badge: 'bg-red-100 text-red-700',      bar: 'bg-red-500' },
}

// Heatmap cell color based on delay minutes
function delayColor(mins: number) {
  if (mins < 40)  return 'bg-green-100 text-green-800'
  if (mins < 80)  return 'bg-yellow-100 text-yellow-800'
  if (mins < 150) return 'bg-orange-100 text-orange-800'
  return 'bg-red-100 text-red-800'
}

export function RouteAnalytics() {
  const [selected, setSelected] = useState<string | null>(null)
  const selectedRoute = ROUTE_DETAILS.find(r => r.id === selected) ?? null

  const sorted     = [...ROUTE_DETAILS].sort((a, b) => b.gradeScore - a.gradeScore)
  const top5       = sorted.slice(0, 5)
  const bottom5    = sorted.slice(-5).reverse()

  const regionBar = REGION_OTD.map(r => ({ region: r.region, otd: r.otd, routes: r.routes }))

  return (
    <div className="space-y-8">
      {/* KPI strip */}
      <section>
        <SectionTitle title="Route Network Summary" sub="MTD across all active routes" />
        <div className="grid grid-cols-5 gap-4">
          {[
            { label: 'Total Routes',    value: ROUTE_KPI.totalRoutes },
            { label: 'Avg OTD',         value: `${ROUTE_KPI.avgOTD}%` },
            { label: 'Grade A Routes',  value: ROUTE_KPI.gradeA },
            { label: 'D/F Routes',      value: ROUTE_KPI.gradeD_F },
            { label: 'Avg Exc/100',     value: ROUTE_KPI.avgExceptionRate },
          ].map(k => (
            <div key={k.label} className="rounded-xl border border-slate-200 bg-white p-4">
              <p className="text-xxs font-semibold uppercase tracking-wide text-slate-500">{k.label}</p>
              <p className="text-3xl font-bold text-slate-900 mt-1.5">{k.value}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Grade dist + Region OTD */}
      <section>
        <div className="grid grid-cols-3 gap-6">
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <SectionTitle title="Grade Distribution" />
            <DonutChart
              data={GRADE_DIST.map(g => ({ name: `Grade ${g.grade}`, value: g.count, color: g.color }))}
              height={180}
              centerLabel="Routes"
              centerValue={ROUTE_DETAILS.length}
              showLegend
            />
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <SectionTitle title="Regional OTD" sub="On-time delivery % by region" />
            <div className="space-y-4 mt-2">
              {regionBar.map(r => (
                <div key={r.region}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-medium text-slate-700">{r.region}</span>
                    <span className="text-slate-500">{r.otd}% · {r.routes} routes</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className={cn('h-full rounded-full', r.otd >= 85 ? 'bg-green-500' : r.otd >= 75 ? 'bg-amber-500' : 'bg-red-500')}
                      style={{ width: `${r.otd}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <SectionTitle title="Route Reliability" sub="Reliable / Moderate / Poor — weekly" />
            <LineChart
              data={ROUTE_RELIABILITY_TREND as unknown as Record<string, unknown>[]}
              xKey="week"
              series={[
                { dataKey: 'reliable', label: 'Reliable', color: '#10B981' },
                { dataKey: 'moderate', label: 'Moderate', color: '#F59E0B' },
                { dataKey: 'poor',     label: 'Poor',     color: '#EF4444' },
              ]}
              height={180}
              showLegend
            />
          </div>
        </div>
      </section>

      {/* Top 5 / Bottom 5 */}
      <section>
        <div className="grid grid-cols-2 gap-6">
          <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 bg-green-50">
              <p className="text-sm font-bold text-green-800">Top 5 Routes</p>
              <p className="text-xxs text-green-600 mt-0.5">Highest composite grade score</p>
            </div>
            <div className="divide-y divide-slate-50">
              {top5.map((r, i) => (
                <div key={r.id} className="flex items-center gap-3 px-5 py-3.5 hover:bg-slate-50 transition-colors">
                  <span className="text-base font-black text-green-600 w-6">#{i+1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-slate-800 truncate">{r.routeName}</p>
                    <p className="text-xxs text-slate-400">{r.routeCode} · {r.dispatchCount} dispatches MTD</p>
                  </div>
                  <span className={cn('rounded-md px-2 py-0.5 text-xxs font-bold', GRADE_COLOR[r.grade].badge)}>{r.grade}</span>
                  <div className="text-right">
                    <p className="text-sm font-bold text-slate-900">{r.gradeScore}</p>
                    <p className="text-xxs text-slate-400">score</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 bg-red-50">
              <p className="text-sm font-bold text-red-800">Bottom 5 Routes</p>
              <p className="text-xxs text-red-600 mt-0.5">Needs improvement</p>
            </div>
            <div className="divide-y divide-slate-50">
              {bottom5.map((r, i) => (
                <div key={r.id} className="flex items-center gap-3 px-5 py-3.5 hover:bg-slate-50 transition-colors">
                  <span className="text-base font-black text-red-500 w-6">#{sorted.length - i}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-slate-800 truncate">{r.routeName}</p>
                    <p className="text-xxs text-slate-400">{r.routeCode} · {r.exceptionRate} exc/100</p>
                  </div>
                  <span className={cn('rounded-md px-2 py-0.5 text-xxs font-bold', GRADE_COLOR[r.grade].badge)}>{r.grade}</span>
                  <div className="text-right">
                    <p className="text-sm font-bold text-slate-900">{r.gradeScore}</p>
                    <p className="text-xxs text-slate-400">score</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Delay Heatmap */}
      <section>
        <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100">
            <SectionTitle title="Delay Heatmap" sub="Average delay (minutes) by route × week" />
          </div>
          <div className="overflow-x-auto p-4">
            <table className="w-full text-xs">
              <thead>
                <tr>
                  <th className="text-left px-3 py-2 text-xxs font-semibold text-slate-500 uppercase tracking-wide">Route</th>
                  {['W48','W49','W50','W51'].map(w => (
                    <th key={w} className="px-4 py-2 text-xxs font-semibold text-slate-500 uppercase tracking-wide text-center">{w}</th>
                  ))}
                  <th className="text-left px-3 py-2 text-xxs font-semibold text-slate-500 uppercase tracking-wide">Avg</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {ROUTE_DELAY_HEAT.map(row => {
                  const vals = [row.W48, row.W49, row.W50, row.W51]
                  const avg  = Math.round(vals.reduce((s, v) => s + v, 0) / vals.length)
                  return (
                    <tr key={row.route} className="hover:bg-slate-50">
                      <td className="px-3 py-2.5 font-mono text-slate-600 whitespace-nowrap">{row.route}</td>
                      {vals.map((v, i) => (
                        <td key={i} className="px-4 py-2.5 text-center">
                          <span className={cn('rounded-lg px-2.5 py-1 text-xxs font-semibold', delayColor(v))}>
                            {v}m
                          </span>
                        </td>
                      ))}
                      <td className="px-3 py-2.5 font-semibold text-slate-700">{avg}m</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            <div className="flex items-center gap-4 mt-3 px-3">
              <p className="text-xxs text-slate-400 font-medium">Legend:</p>
              {[
                { label: '<40m', cls: 'bg-green-100 text-green-800' },
                { label: '40–80m', cls: 'bg-yellow-100 text-yellow-800' },
                { label: '80–150m', cls: 'bg-orange-100 text-orange-800' },
                { label: '>150m', cls: 'bg-red-100 text-red-800' },
              ].map(l => (
                <span key={l.label} className={cn('rounded-lg px-2.5 py-1 text-xxs font-semibold', l.cls)}>{l.label}</span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Full scorecard table with drill-down */}
      <section>
        <div className="flex gap-5">
          <div className="flex-1 rounded-xl border border-slate-200 bg-white overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100">
              <SectionTitle title="Route Reliability Scores" sub="Click a row to drill down" />
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50">
                    {['Route','Distance','OTD %','SLA %','Exc/100','Delay Avg','Trend','Grade'].map(h => (
                      <th key={h} className="text-left px-4 py-2.5 text-xxs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {sorted.map(r => (
                    <tr
                      key={r.id}
                      onClick={() => setSelected(prev => prev === r.id ? null : r.id)}
                      className={cn('cursor-pointer transition-colors', selected === r.id ? 'bg-blue-50' : 'hover:bg-slate-50')}
                    >
                      <td className="px-4 py-3">
                        <p className="font-semibold text-slate-800 truncate max-w-[160px]">{r.routeName}</p>
                        <p className="text-xxs text-slate-400 font-mono">{r.routeCode}</p>
                      </td>
                      <td className="px-4 py-3 text-slate-600">{r.distanceKm} km</td>
                      <td className="px-4 py-3 font-semibold text-slate-800">{r.otdPct}%</td>
                      <td className="px-4 py-3 font-semibold text-slate-800">{r.slaCompliancePct}%</td>
                      <td className="px-4 py-3">
                        <span className={cn('font-semibold', r.exceptionRate > 5 ? 'text-red-600' : r.exceptionRate > 3 ? 'text-amber-600' : 'text-green-600')}>
                          {r.exceptionRate}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-600">{r.delayMinutesAvg}m</td>
                      <td className="px-4 py-3 w-16">
                        <SparklineChart data={r.otdTrend} height={28} color={r.grade === 'A' ? '#10B981' : r.grade === 'B' ? '#3B82F6' : r.grade === 'C' ? '#F59E0B' : '#EF4444'} />
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn('rounded-md px-2 py-0.5 text-xxs font-bold', GRADE_COLOR[r.grade].badge)}>{r.grade}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Detail panel */}
          {selectedRoute && (
            <div className="w-72 flex-shrink-0 rounded-xl border border-slate-200 bg-white overflow-hidden">
              <div className="px-4 py-4 border-b border-slate-100 flex items-center justify-between">
                <p className="text-xs font-bold text-slate-900 truncate">{selectedRoute.routeName}</p>
                <button onClick={() => setSelected(null)} className="text-xxs text-slate-400 hover:text-slate-600 flex-shrink-0 ml-2">✕</button>
              </div>
              <div className="p-4 space-y-4 overflow-y-auto max-h-96">
                <span className={cn('rounded-md px-2 py-0.5 text-xxs font-bold', GRADE_COLOR[selectedRoute.grade].badge)}>Grade {selectedRoute.grade} · {selectedRoute.gradeScore}/100</span>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: 'Distance',    value: `${selectedRoute.distanceKm} km` },
                    { label: 'Dispatches',  value: selectedRoute.dispatchCount },
                    { label: 'OTA %',       value: `${selectedRoute.otaPct}%` },
                    { label: 'OTD %',       value: `${selectedRoute.otdPct}%` },
                    { label: 'SLA %',       value: `${selectedRoute.slaCompliancePct}%` },
                    { label: 'Avg Transit', value: `${selectedRoute.avgTransitHours}h` },
                    { label: 'Avg Delay',   value: `${selectedRoute.delayMinutesAvg}m` },
                    { label: 'Cost/km',     value: `₹${selectedRoute.costPerKm}` },
                  ].map(r => (
                    <div key={r.label} className="rounded-lg bg-slate-50 border border-slate-100 px-3 py-2">
                      <p className="text-xxs text-slate-400">{r.label}</p>
                      <p className="text-xs font-bold text-slate-800">{r.value}</p>
                    </div>
                  ))}
                </div>
                <div>
                  <p className="text-xxs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">OTD Trend (8 wk)</p>
                  <SparklineChart data={selectedRoute.otdTrend} height={48} color="#3B82F6" showTooltip />
                </div>
                <div>
                  <p className="text-xxs font-semibold text-slate-500 uppercase tracking-wide mb-1">Top Carrier</p>
                  <div className="rounded-lg bg-slate-50 border border-slate-100 px-3 py-2">
                    <p className="text-xs font-semibold text-slate-800">{selectedRoute.topCarrier}</p>
                    <p className="text-xxs text-slate-400">Score: {selectedRoute.topCarrierScore}/100</p>
                  </div>
                </div>
                {selectedRoute.lastException && (
                  <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-xxs text-red-700">
                    <p className="font-semibold mb-0.5">Last Exception</p>
                    {selectedRoute.lastException}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
