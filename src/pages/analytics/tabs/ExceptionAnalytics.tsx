import React, { useState } from 'react'
import { cn, formatINR } from '@/lib/utils'
import { BarChart }   from '@/components/charts/BarChart'
import { LineChart }  from '@/components/charts/LineChart'
import { DonutChart } from '@/components/charts/DonutChart'
import { EXCEPTIONS, EXC_KPI, EXC_TREND_7D, EXC_BY_CATEGORY } from '@/pages/exceptions/mock/data'
import {
  EXC_SEVERITY_TREND, EXC_ROOT_CAUSE, EXC_FINANCIAL_IMPACT_BY_CAT, EXC_RESOLUTION_DIST,
} from '../mock/data'

function SectionTitle({ title, sub }: { title: string; sub?: string }) {
  return (
    <div className="mb-3">
      <h2 className="text-sm font-bold text-slate-900">{title}</h2>
      {sub && <p className="text-xxs text-slate-400 mt-0.5">{sub}</p>}
    </div>
  )
}

const SEV_COLOR: Record<string, string> = {
  critical: 'bg-red-100 text-red-700',
  high:     'bg-orange-100 text-orange-700',
  medium:   'bg-amber-100 text-amber-700',
  low:      'bg-slate-100 text-slate-600',
}

export function ExceptionAnalytics() {
  const [catSelected, setCatSelected] = useState<string | null>(null)

  const totalFinancial = EXC_FINANCIAL_IMPACT_BY_CAT.reduce((s, e) => s + e.impact, 0)

  // Severity breakdown from actual exceptions data
  const bySev = {
    critical: EXCEPTIONS.filter(e => e.severity === 'critical').length,
    high:     EXCEPTIONS.filter(e => e.severity === 'high').length,
    medium:   EXCEPTIONS.filter(e => e.severity === 'medium').length,
    low:      EXCEPTIONS.filter(e => e.severity === 'low').length,
  }

  const sevDonut = [
    { name: 'Critical', value: bySev.critical, color: '#EF4444' },
    { name: 'High',     value: bySev.high,     color: '#F97316' },
    { name: 'Medium',   value: bySev.medium,   color: '#F59E0B' },
    { name: 'Low',      value: bySev.low,       color: '#94A3B8' },
  ]

  const catDonut = EXC_BY_CATEGORY.map(c => ({ name: c.category, value: c.count, color: c.color }))

  return (
    <div className="space-y-8">
      {/* KPI strip */}
      <section>
        <SectionTitle title="Exception KPIs" sub="Current period" />
        <div className="grid grid-cols-6 gap-4">
          {[
            { label: 'Open',            value: EXC_KPI.totalOpen,       color: 'text-red-600' },
            { label: 'Critical',        value: EXC_KPI.critical,        color: 'text-red-700' },
            { label: 'SLA Breached',    value: EXC_KPI.slaBreached,     color: 'text-orange-600' },
            { label: 'Escalated',       value: EXC_KPI.escalated,       color: 'text-purple-600' },
            { label: 'Resolved Today',  value: EXC_KPI.resolvedToday,   color: 'text-green-600' },
            { label: 'Avg Resolution',  value: `${EXC_KPI.avgResolutionH}h`, color: 'text-blue-600' },
          ].map(k => (
            <div key={k.label} className="rounded-xl border border-slate-200 bg-white p-4">
              <p className="text-xxs font-semibold uppercase tracking-wide text-slate-500">{k.label}</p>
              <p className={cn('text-3xl font-bold mt-1.5', k.color)}>{k.value}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Trend + severity breakdown */}
      <section>
        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-2 rounded-xl border border-slate-200 bg-white p-5">
            <SectionTitle title="Exception Trend — 7 Day" sub="Opened vs resolved daily" />
            <LineChart
              data={EXC_TREND_7D as unknown as Record<string, unknown>[]}
              xKey="day"
              series={[
                { dataKey: 'opened',   label: 'Opened',   color: '#EF4444' },
                { dataKey: 'resolved', label: 'Resolved', color: '#10B981' },
                { dataKey: 'escalated',label: 'Escalated',color: '#8B5CF6', dashed: true },
              ]}
              height={220}
              showLegend
            />
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <SectionTitle title="Severity Distribution" />
            <DonutChart
              data={sevDonut}
              height={160}
              centerLabel="Total"
              centerValue={EXCEPTIONS.length}
              showLegend
            />
            <div className="space-y-1.5 mt-3">
              {Object.entries(bySev).map(([sev, cnt]) => (
                <div key={sev} className="flex items-center justify-between">
                  <span className={cn('rounded-full px-2 py-0.5 text-xxs font-semibold capitalize', SEV_COLOR[sev])}>{sev}</span>
                  <span className="text-xs font-bold text-slate-800">{cnt}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Severity trend + category breakdown */}
      <section>
        <div className="grid grid-cols-2 gap-6">
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <SectionTitle title="Severity Trend — 8 Weeks" sub="Exception volume by severity" />
            <BarChart
              data={EXC_SEVERITY_TREND as unknown as Record<string, unknown>[]}
              xKey="week"
              series={[
                { dataKey: 'critical', label: 'Critical', color: '#EF4444' },
                { dataKey: 'high',     label: 'High',     color: '#F97316' },
                { dataKey: 'medium',   label: 'Medium',   color: '#F59E0B' },
                { dataKey: 'low',      label: 'Low',      color: '#94A3B8' },
              ]}
              stacked
              height={220}
              showLegend
            />
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <SectionTitle title="Exception by Category" sub="Click a slice to highlight" />
            <div className="flex gap-4 items-start">
              <div style={{ width: 150, flexShrink: 0 }}>
                <DonutChart data={catDonut} height={150} />
              </div>
              <div className="flex-1 space-y-2 mt-1">
                {EXC_BY_CATEGORY.map(c => (
                  <button
                    key={c.category}
                    onClick={() => setCatSelected(prev => prev === c.category ? null : c.category)}
                    className={cn(
                      'w-full flex items-center gap-2 rounded-lg p-1.5 text-left transition-colors',
                      catSelected === c.category ? 'bg-slate-100' : 'hover:bg-slate-50',
                    )}
                  >
                    <span className="h-2 w-2 rounded-full flex-shrink-0" style={{ background: c.color }} />
                    <span className="text-xs text-slate-600 flex-1 truncate">{c.category}</span>
                    <span className="text-xs font-bold text-slate-800">{c.count}</span>
                    <span className="text-xxs text-slate-400 w-7 text-right">{c.pct}%</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Root Cause Analysis */}
      <section>
        <div className="grid grid-cols-2 gap-6">
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <SectionTitle title="Root Cause Analysis" sub="Exception count by primary cause" />
            <BarChart
              data={EXC_ROOT_CAUSE as unknown as Record<string, unknown>[]}
              xKey="cause"
              series={[{ dataKey: 'count', label: 'Exceptions', color: '#8B5CF6' }]}
              height={220}
              horizontal
            />
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <SectionTitle title="Financial Impact by Category" sub="Total ₹ exposure per exception type" />
            <div className="space-y-3 mt-2">
              {EXC_FINANCIAL_IMPACT_BY_CAT
                .filter(e => e.impact > 0)
                .sort((a, b) => b.impact - a.impact)
                .map(e => {
                  const pct = Math.round((e.impact / totalFinancial) * 100)
                  return (
                    <div key={e.category}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="font-medium text-slate-700">{e.category}</span>
                        <span className="font-semibold text-slate-900">{formatINR(e.impact)}</span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                        <div className="h-full rounded-full bg-red-500" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  )
                })}
              <p className="text-xxs text-slate-400 text-right mt-1">Total: {formatINR(totalFinancial)}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Resolution Time Analysis */}
      <section>
        <div className="grid grid-cols-2 gap-6">
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <SectionTitle title="Resolution Time Distribution" sub="How quickly are exceptions closed?" />
            <div className="space-y-3 mt-2">
              {EXC_RESOLUTION_DIST.map((d, i) => {
                const colors = ['bg-green-500', 'bg-lime-500', 'bg-amber-500', 'bg-orange-500', 'bg-red-500']
                return (
                  <div key={d.band}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="font-medium text-slate-700">{d.band}</span>
                      <span className="text-slate-500">{d.count} exceptions · {d.pct}%</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                      <div className={cn('h-full rounded-full', colors[i])} style={{ width: `${d.pct}%` }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <SectionTitle title="Open Exceptions Detail" sub="Current unresolved — by severity" />
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {EXCEPTIONS
                .filter(e => !['RESOLVED','CLOSED','AUTO_RESOLVED'].includes(e.status))
                .sort((a, b) => {
                  const sev = { critical: 0, high: 1, medium: 2, low: 3, info: 4 }
                  return (sev[a.severity] ?? 4) - (sev[b.severity] ?? 4)
                })
                .map(e => (
                  <div key={e.id} className="flex items-start gap-3 rounded-lg border border-slate-100 bg-slate-50 px-3 py-2.5">
                    <span className={cn('rounded-full px-2 py-0.5 text-xxs font-semibold flex-shrink-0 capitalize', SEV_COLOR[e.severity])}>{e.severity}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-slate-800">{e.category}</p>
                      <p className="text-xxs text-slate-400 font-mono">{e.dispatchId} · {e.routeCode}</p>
                    </div>
                    {e.financialImpact && (
                      <span className="text-xxs font-semibold text-red-600 flex-shrink-0">{formatINR(e.financialImpact)}</span>
                    )}
                  </div>
                ))
              }
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
