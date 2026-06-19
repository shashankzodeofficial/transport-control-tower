import React, { useState, useMemo } from 'react'
import { cn } from '@/lib/utils'
import { useActiveFilters } from '@/hooks/useActiveFilters'
import { LineChart } from '@/components/charts/LineChart'
import { SLA_HEATMAP, SLA_TREND_7D } from '../mock/data'

function heatColor(breachRate: number): string {
  if (breachRate === 0)   return '#F0FDF4'  // green-50
  if (breachRate <= 5)    return '#DCFCE7'  // green-100
  if (breachRate <= 10)   return '#FEF9C3'  // yellow-100
  if (breachRate <= 20)   return '#FED7AA'  // orange-200
  if (breachRate <= 30)   return '#FECACA'  // red-200
  return '#FCA5A5'                           // red-300
}

function textColor(breachRate: number): string {
  if (breachRate === 0)  return '#16A34A'
  if (breachRate <= 10)  return '#92400E'
  return '#991B1B'
}

interface HoveredCell { route: string; carrier: string; breachRate: number; breaches: number; total: number }

export function SLAHeatmap() {
  const [view, setView] = useState<'heatmap' | 'trend'>('heatmap')
  const [hovered, setHovered] = useState<HoveredCell | null>(null)

  const { region, dateRange, matchesRoute } = useActiveFilters('SLAHeatmap')

  const cells = useMemo(() =>
    region ? SLA_HEATMAP.filter(c => matchesRoute(c.route)) : SLA_HEATMAP,
    [region, dateRange],
  )

  const routes   = useMemo(() => [...new Set(cells.map(c => c.route))],   [cells])
  const carriers = useMemo(() => [...new Set(cells.map(c => c.carrier))], [cells])

  const totalBreaches  = cells.reduce((s, c) => s + c.slaBreaches, 0)
  const totalAtRisk    = cells.reduce((s, c) => s + c.slaAtRisk, 0)
  const worstCell      = cells.length ? cells.reduce((m, c) => c.breachRate > m.breachRate ? c : m, cells[0]) : null

  return (
    <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
        <div>
          <h3 className="text-sm font-semibold text-slate-800">SLA Heatmap</h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Route × Carrier breach rate · <span className="text-red-600 font-medium">{totalBreaches} breached</span>
            {' · '}<span className="text-amber-600 font-medium">{totalAtRisk} at risk</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Legend */}
          <div className="flex items-center gap-1.5 mr-2">
            {[
              { label: '0%',   color: '#F0FDF4' },
              { label: '≤10%', color: '#FEF9C3' },
              { label: '≤20%', color: '#FED7AA' },
              { label: '>20%', color: '#FECACA' },
            ].map(l => (
              <div key={l.label} className="flex items-center gap-1">
                <span className="h-3 w-4 rounded-sm border border-slate-200" style={{ backgroundColor: l.color }} />
                <span className="text-xxs text-slate-400">{l.label}</span>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-0.5 rounded-lg border border-slate-200 p-0.5">
            {(['heatmap', 'trend'] as const).map(v => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={cn(
                  'rounded px-2.5 py-1 text-xs font-medium capitalize transition-colors',
                  view === v ? 'bg-slate-800 text-white' : 'text-slate-500 hover:text-slate-700',
                )}
              >
                {v === 'heatmap' ? 'Heatmap' : '7D Trend'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {view === 'heatmap' ? (
        <div className="p-4">
          {/* Grid */}
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-xs">
              <thead>
                <tr>
                  <th className="py-1.5 pr-3 text-left text-xxs font-semibold uppercase tracking-wide text-slate-400 w-24">
                    Route ↓ / Carrier →
                  </th>
                  {carriers.map(c => (
                    <th key={c} className="px-1 py-1.5 text-center text-xxs font-semibold text-slate-500 whitespace-nowrap">
                      {c}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {routes.map(route => (
                  <tr key={route}>
                    <td className="py-1 pr-3 text-xxs font-semibold text-slate-600 whitespace-nowrap">{route}</td>
                    {carriers.map(carrier => {
                      const cell = cells.find(c => c.route === route && c.carrier === carrier)
                      if (!cell) return <td key={carrier} />
                      const bg   = heatColor(cell.breachRate)
                      const text = textColor(cell.breachRate)
                      const total = cell.slaBreaches + cell.slaAtRisk + cell.slaOk
                      return (
                        <td key={carrier} className="px-1 py-0.5">
                          <div
                            className="relative flex h-8 w-14 cursor-default items-center justify-center rounded transition-transform hover:scale-110 hover:shadow-md hover:z-10"
                            style={{ backgroundColor: bg }}
                            onMouseEnter={() => setHovered({ route, carrier, breachRate: cell.breachRate, breaches: cell.slaBreaches, total })}
                            onMouseLeave={() => setHovered(null)}
                          >
                            <span className="text-xxs font-bold tabular-nums" style={{ color: text }}>
                              {cell.breachRate}%
                            </span>
                          </div>
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Tooltip / insight bar */}
          <div className="mt-4 flex items-center gap-4">
            {hovered ? (
              <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-2 flex items-center gap-6 flex-wrap">
                <span className="text-xs font-semibold text-slate-700">{hovered.route} × {hovered.carrier}</span>
                <span className="text-xs text-slate-500">Breach Rate: <span className="font-semibold text-red-600">{hovered.breachRate}%</span></span>
                <span className="text-xs text-slate-500">Breaches: <span className="font-semibold">{hovered.breaches}/{hovered.total}</span></span>
              </div>
            ) : worstCell ? (
              <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 flex items-center gap-3">
                <span className="text-xs text-amber-700">
                  🔥 Worst: <span className="font-semibold">{worstCell.route} × {worstCell.carrier}</span> — {worstCell.breachRate}% breach rate
                </span>
              </div>
            ) : (
              <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-2">
                <span className="text-xs text-slate-400">No SLA data for selected region</span>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="p-5">
          <p className="text-xs font-medium text-slate-500 mb-3">SLA Status Composition — Last 7 Days</p>
          <LineChart
            data={SLA_TREND_7D.map(d => ({
              day: d.day,
              'OK': d.ok,
              'At Risk': d.atRisk,
              'Breached': d.breached,
            }))}
            xKey="day"
            series={[
              { dataKey: 'OK',       label: 'SLA OK',      color: '#16A34A' },
              { dataKey: 'At Risk',  label: 'At Risk',     color: '#D97706' },
              { dataKey: 'Breached', label: 'Breached',    color: '#DC2626' },
            ]}
            height={200}
            showGrid
            showLegend
          />
          <div className="mt-3 rounded-lg border border-red-100 bg-red-50 px-3 py-2">
            <p className="text-xs text-red-700">
              ↑ Breach count increased from 2 to 6 over the last 7 days (+200%). Immediate attention required on high-risk corridors.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
