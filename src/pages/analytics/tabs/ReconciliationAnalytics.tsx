import React from 'react'
import { cn, formatINR } from '@/lib/utils'
import { BarChart }   from '@/components/charts/BarChart'
import { LineChart }  from '@/components/charts/LineChart'
import { DonutChart } from '@/components/charts/DonutChart'
import { RECONCILIATIONS, RECON_KPI, RECON_TREND_7D } from '@/pages/reconciliation/mock/data'
import {
  RECON_TURNAROUND_BY_CARRIER, RECON_APPROVAL_CYCLE, RECON_DISCREPANCY_BY_TYPE, RECON_WEEKLY_CLOSURE,
} from '../mock/data'

function SectionTitle({ title, sub }: { title: string; sub?: string }) {
  return (
    <div className="mb-3">
      <h2 className="text-sm font-bold text-slate-900">{title}</h2>
      {sub && <p className="text-xxs text-slate-400 mt-0.5">{sub}</p>}
    </div>
  )
}

const STATUS_COLOR: Record<string, string> = {
  pending:     'bg-slate-100 text-slate-600',
  in_progress: 'bg-blue-100 text-blue-700',
  discrepancy: 'bg-red-100 text-red-700',
  approved:    'bg-green-100 text-green-700',
  closed:      'bg-emerald-100 text-emerald-700',
}

export function ReconciliationAnalytics() {
  // Status distribution
  const statusCounts = {
    pending:     RECONCILIATIONS.filter(r => r.reconStatus === 'pending').length,
    in_progress: RECONCILIATIONS.filter(r => r.reconStatus === 'in_progress').length,
    discrepancy: RECONCILIATIONS.filter(r => r.reconStatus === 'discrepancy').length,
    approved:    RECONCILIATIONS.filter(r => r.reconStatus === 'approved').length,
    closed:      RECONCILIATIONS.filter(r => r.reconStatus === 'closed').length,
  }

  const statusDonut = [
    { name: 'Pending',     value: statusCounts.pending,     color: '#94A3B8' },
    { name: 'In Progress', value: statusCounts.in_progress, color: '#3B82F6' },
    { name: 'Discrepancy', value: statusCounts.discrepancy, color: '#EF4444' },
    { name: 'Approved',    value: statusCounts.approved,    color: '#10B981' },
    { name: 'Closed',      value: statusCounts.closed,      color: '#059669' },
  ]

  const totalDisc  = RECON_DISCREPANCY_BY_TYPE.reduce((s, d) => s + d.count, 0)
  const totalImpact = RECON_DISCREPANCY_BY_TYPE.reduce((s, d) => s + d.financialImpact, 0)

  return (
    <div className="space-y-8">
      {/* KPI strip */}
      <section>
        <SectionTitle title="Reconciliation KPIs" sub="Current period" />
        <div className="grid grid-cols-5 gap-4">
          {[
            { label: 'Pending',         value: RECON_KPI.pending,       color: 'text-slate-700' },
            { label: 'In Progress',     value: RECON_KPI.inProgress,    color: 'text-blue-600' },
            { label: 'Discrepancy',     value: RECON_KPI.discrepancy,   color: 'text-red-600' },
            { label: 'Approved/Closed', value: RECON_KPI.closed,        color: 'text-green-600' },
            { label: 'Financial Impact',value: formatINR(RECON_KPI.financialImpact), color: 'text-red-700' },
          ].map(k => (
            <div key={k.label} className="rounded-xl border border-slate-200 bg-white p-4">
              <p className="text-xxs font-semibold uppercase tracking-wide text-slate-500">{k.label}</p>
              <p className={cn('text-2xl font-bold mt-1.5', k.color)}>{k.value}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Status distribution + 7-day trend */}
      <section>
        <div className="grid grid-cols-3 gap-6">
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <SectionTitle title="Status Distribution" />
            <DonutChart
              data={statusDonut}
              height={160}
              centerLabel="Records"
              centerValue={RECONCILIATIONS.length}
              showLegend
            />
          </div>
          <div className="col-span-2 rounded-xl border border-slate-200 bg-white p-5">
            <SectionTitle title="Daily Reconciliation Flow" sub="Arrived vs reconciled vs discrepancies" />
            <LineChart
              data={RECON_TREND_7D as unknown as Record<string, unknown>[]}
              xKey="day"
              series={[
                { dataKey: 'arrived',       label: 'Arrived',        color: '#3B82F6' },
                { dataKey: 'reconciled',    label: 'Reconciled',     color: '#10B981' },
                { dataKey: 'discrepancies', label: 'Discrepancies',  color: '#EF4444', dashed: true },
              ]}
              height={200}
              showLegend
            />
          </div>
        </div>
      </section>

      {/* Weekly closure + Approval cycle */}
      <section>
        <div className="grid grid-cols-2 gap-6">
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <SectionTitle title="Weekly Closure Performance" sub="Arrived → reconciled → closed pipeline" />
            <BarChart
              data={RECON_WEEKLY_CLOSURE as unknown as Record<string, unknown>[]}
              xKey="week"
              series={[
                { dataKey: 'arrived',     label: 'Arrived',     color: '#CBD5E1' },
                { dataKey: 'reconciled',  label: 'Reconciled',  color: '#3B82F6' },
                { dataKey: 'closed',      label: 'Closed',      color: '#10B981' },
              ]}
              height={220}
              showLegend
            />
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <SectionTitle title="Approval Cycle Time" sub="Avg hours from arrival to approval — monthly" />
            <LineChart
              data={RECON_APPROVAL_CYCLE as unknown as Record<string, unknown>[]}
              xKey="month"
              series={[
                { dataKey: 'avgCycleHrs', label: 'Avg Cycle (hrs)', color: '#8B5CF6' },
                { dataKey: 'pendingEOD', label: 'Pending at EOD',   color: '#F59E0B', dashed: true },
              ]}
              height={220}
              showLegend
              referenceLines={[{ value: 12, label: 'Target <12h', color: '#10B981' }]}
            />
          </div>
        </div>
      </section>

      {/* Turnaround by carrier + discrepancy breakdown */}
      <section>
        <div className="grid grid-cols-2 gap-6">
          <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100">
              <SectionTitle title="Turnaround by Carrier" sub="Avg hours to reconcile + clean delivery %" />
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50">
                    {['Carrier', 'Avg Hrs', 'Clean %', 'Performance'].map(h => (
                      <th key={h} className="text-left px-4 py-2.5 text-xxs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {RECON_TURNAROUND_BY_CARRIER.sort((a, b) => a.avgHrs - b.avgHrs).map(r => (
                    <tr key={r.carrier} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 font-medium text-slate-800">{r.carrier}</td>
                      <td className="px-4 py-3">
                        <span className={cn('font-semibold', r.avgHrs < 6 ? 'text-green-600' : r.avgHrs < 12 ? 'text-amber-600' : 'text-red-600')}>
                          {r.avgHrs}h
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-12 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                            <div
                              className={cn('h-full rounded-full', r.cleanPct >= 85 ? 'bg-green-500' : r.cleanPct >= 70 ? 'bg-amber-500' : 'bg-red-500')}
                              style={{ width: `${r.cleanPct}%` }}
                            />
                          </div>
                          <span className="font-medium text-slate-700">{r.cleanPct}%</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn('rounded-full px-2 py-0.5 text-xxs font-semibold',
                          r.avgHrs < 6  ? 'bg-green-100 text-green-700'  :
                          r.avgHrs < 12 ? 'bg-amber-100 text-amber-700'  : 'bg-red-100 text-red-700',
                        )}>
                          {r.avgHrs < 6 ? 'Fast' : r.avgHrs < 12 ? 'Acceptable' : 'Slow'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <SectionTitle title="Discrepancy Types" sub="Count and financial impact by type" />
            <div className="space-y-3 mt-2">
              {RECON_DISCREPANCY_BY_TYPE.map(d => {
                const pct = Math.round((d.count / totalDisc) * 100)
                return (
                  <div key={d.type}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="font-medium text-slate-700">{d.type}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-slate-500">{d.count} cases</span>
                        {d.financialImpact > 0 && (
                          <span className="font-semibold text-red-600">{formatINR(d.financialImpact)}</span>
                        )}
                      </div>
                    </div>
                    <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className={cn('h-full rounded-full', d.financialImpact > 0 ? 'bg-red-400' : 'bg-slate-400')}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                )
              })}
              <p className="text-xxs text-slate-400 text-right mt-1">Total financial impact: {formatINR(totalImpact)}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Record-level breakdown */}
      <section>
        <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100">
            <SectionTitle title="Reconciliation Records" sub="All records with current status" />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  {['Record','Dispatch','Route','Carrier','HUs (L/A)','Weight Δ','Discrepancies','Status'].map(h => (
                    <th key={h} className="text-left px-4 py-2.5 text-xxs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {RECONCILIATIONS.map(r => {
                  const weightDelta = r.weightArrived > 0 ? r.weightArrived - r.weightLoaded : null
                  return (
                    <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 font-mono text-xxs text-slate-500">{r.id}</td>
                      <td className="px-4 py-3 font-mono font-semibold text-slate-800">{r.dispatchId}</td>
                      <td className="px-4 py-3 text-xxs font-mono text-slate-500">{r.routeCode}</td>
                      <td className="px-4 py-3 text-slate-600">{r.carrier}</td>
                      <td className="px-4 py-3">
                        <span className={cn('font-medium', r.huArrived < r.huLoaded ? 'text-red-600' : 'text-slate-700')}>
                          {r.huLoaded}/{r.huArrived > 0 ? r.huArrived : '—'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {weightDelta !== null
                          ? <span className={cn('font-medium', weightDelta < -5 ? 'text-red-600' : 'text-slate-600')}>{weightDelta > 0 ? '+' : ''}{weightDelta} kg</span>
                          : <span className="text-slate-400">Pending</span>
                        }
                      </td>
                      <td className="px-4 py-3">
                        {r.discrepancies.length > 0
                          ? <span className="text-red-600 font-semibold">{r.discrepancies.length}</span>
                          : <span className="text-green-600">—</span>
                        }
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn('rounded-full px-2 py-0.5 text-xxs font-semibold capitalize', STATUS_COLOR[r.reconStatus])}>
                          {r.reconStatus.replace('_', ' ')}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  )
}
