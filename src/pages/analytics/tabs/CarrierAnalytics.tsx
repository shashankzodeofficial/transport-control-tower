import React, { useState } from 'react'
import { cn } from '@/lib/utils'
import { BarChart }   from '@/components/charts/BarChart'
import { LineChart }  from '@/components/charts/LineChart'
import { DonutChart } from '@/components/charts/DonutChart'
import { SparklineChart } from '@/components/charts/SparklineChart'
import { CARRIERS, TIER_DIST } from '@/pages/carriers/mock/data'
import { CARRIER_OTD_VS_COST, CARRIER_MONTHLY_SCORE } from '../mock/data'

function SectionTitle({ title, sub }: { title: string; sub?: string }) {
  return (
    <div className="mb-3">
      <h2 className="text-sm font-bold text-slate-900">{title}</h2>
      {sub && <p className="text-xxs text-slate-400 mt-0.5">{sub}</p>}
    </div>
  )
}

const TIER_COLOR: Record<string, string> = {
  Platinum: 'bg-violet-100 text-violet-700 border-violet-200',
  Gold:     'bg-amber-100 text-amber-700 border-amber-200',
  Silver:   'bg-slate-100 text-slate-600 border-slate-200',
  Bronze:   'bg-orange-100 text-orange-700 border-orange-200',
  Probation:'bg-red-100 text-red-700 border-red-200',
}

const TIER_BAR: Record<string, string> = {
  Platinum: 'bg-violet-500',
  Gold:     'bg-amber-500',
  Silver:   'bg-slate-400',
  Bronze:   'bg-orange-500',
  Probation:'bg-red-500',
}

const STATUS_DOT: Record<string, string> = {
  active:       'bg-green-500',
  suspended:    'bg-red-500',
  under_review: 'bg-amber-500',
  probation:    'bg-red-500',
}

export function CarrierAnalytics() {
  const [selected, setSelected] = useState<string | null>(null)
  const selectedCarrier = CARRIERS.find(c => c.id === selected) ?? null

  const sorted = [...CARRIERS].sort((a, b) => b.compositeScore - a.compositeScore)

  const otdData = CARRIER_OTD_VS_COST.map(c => ({
    name: c.name,
    otd:  c.otd,
    cost: c.cost,
  }))

  return (
    <div className="space-y-8">
      {/* Summary KPIs */}
      <section>
        <SectionTitle title="Carrier Fleet Summary" sub="Across all active contracts" />
        <div className="grid grid-cols-5 gap-4">
          {[
            { label: 'Total Carriers',   value: CARRIERS.length,                             color: 'text-slate-900' },
            { label: 'Avg Composite',    value: Math.round(CARRIERS.reduce((s,c)=>s+c.compositeScore,0)/CARRIERS.length), unit: '/100', color: 'text-blue-700' },
            { label: 'Avg OTD',          value: Math.round(CARRIERS.reduce((s,c)=>s+c.otdPct,0)/CARRIERS.length),         unit: '%',    color: 'text-green-700' },
            { label: 'On Probation',     value: CARRIERS.filter(c=>c.status==='probation').length,                         color: 'text-red-700' },
            { label: 'Under Review',     value: CARRIERS.filter(c=>c.status==='under_review').length,                      color: 'text-amber-700' },
          ].map(k => (
            <div key={k.label} className="rounded-xl border border-slate-200 bg-white p-4">
              <p className="text-xxs font-semibold uppercase tracking-wide text-slate-500">{k.label}</p>
              <p className={cn('text-3xl font-bold mt-1.5', k.color)}>{k.value}<span className="text-sm font-medium text-slate-400 ml-1">{k.unit}</span></p>
            </div>
          ))}
        </div>
      </section>

      {/* Tier distribution + monthly score */}
      <section>
        <div className="grid grid-cols-2 gap-6">
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <SectionTitle title="Tier Distribution" sub="Carrier count by performance tier" />
            <div className="flex gap-4 items-center">
              <div style={{ width: 160, flexShrink: 0 }}>
                <DonutChart
                  data={TIER_DIST.map(t => ({ name: t.tier, value: t.count, color: t.color }))}
                  height={160}
                  centerLabel="Carriers"
                  centerValue={CARRIERS.length}
                />
              </div>
              <div className="flex-1 space-y-2.5">
                {TIER_DIST.filter(t => t.count > 0).map(t => (
                  <div key={t.tier} className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full flex-shrink-0" style={{ background: t.color }} />
                    <span className="text-xs text-slate-600 flex-1">{t.tier}</span>
                    <span className="text-xs font-semibold text-slate-800">{t.count}</span>
                    <span className="text-xxs text-slate-400">{Math.round(t.count / CARRIERS.length * 100)}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <SectionTitle title="Avg Score by Tier" sub="Monthly composite score trend" />
            <LineChart
              data={CARRIER_MONTHLY_SCORE as unknown as Record<string, unknown>[]}
              xKey="month"
              series={[
                { dataKey: 'platinum',  label: 'Platinum',  color: '#7C3AED' },
                { dataKey: 'gold',      label: 'Gold',      color: '#D97706' },
                { dataKey: 'silver',    label: 'Silver',    color: '#64748B' },
                { dataKey: 'probation', label: 'Probation', color: '#EF4444', dashed: true },
              ]}
              height={180}
              showLegend
              referenceLines={[{ value: 70, label: 'Min threshold', color: '#F59E0B' }]}
            />
          </div>
        </div>
      </section>

      {/* OTD comparison */}
      <section>
        <div className="grid grid-cols-2 gap-6">
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <SectionTitle title="OTD % Comparison" sub="All carriers ranked by on-time delivery" />
            <BarChart
              data={[...CARRIER_OTD_VS_COST].sort((a, b) => b.otd - a.otd) as unknown as Record<string, unknown>[]}
              xKey="name"
              series={[{ dataKey: 'otd', label: 'OTD %', color: '#3B82F6' }]}
              height={220}
              horizontal
            />
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <SectionTitle title="Cost Index vs Score" sub="Cost efficiency vs performance quality" />
            <BarChart
              data={[...CARRIER_OTD_VS_COST].sort((a, b) => b.score - a.score) as unknown as Record<string, unknown>[]}
              xKey="name"
              series={[
                { dataKey: 'score', label: 'Composite Score', color: '#10B981' },
                { dataKey: 'cost',  label: 'Cost Index',      color: '#F59E0B' },
              ]}
              height={220}
              horizontal
              showLegend
            />
          </div>
        </div>
      </section>

      {/* Carrier Scorecard table */}
      <section>
        <div className="flex gap-5">
          {/* Table */}
          <div className="flex-1 rounded-xl border border-slate-200 bg-white overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100">
              <SectionTitle title="Carrier Scorecards" sub="Click a row for full breakdown" />
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50">
                    {['Rank', 'Carrier', 'Tier', 'Score', 'OTD %', 'SLA %', 'Exc/100', 'Trend', 'Status'].map(h => (
                      <th key={h} className="text-left px-4 py-2.5 text-xxs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {sorted.map((c, i) => (
                    <tr
                      key={c.id}
                      onClick={() => setSelected(prev => prev === c.id ? null : c.id)}
                      className={cn('cursor-pointer transition-colors', selected === c.id ? 'bg-blue-50' : 'hover:bg-slate-50')}
                    >
                      <td className="px-4 py-3 font-bold text-slate-500 w-10">#{i + 1}</td>
                      <td className="px-4 py-3">
                        <p className="font-semibold text-slate-800">{c.name}</p>
                        <p className="text-xxs text-slate-400">{c.hqCity}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn('rounded-full border px-2 py-0.5 text-xxs font-semibold', TIER_COLOR[c.tier])}>{c.tier}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-12 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                            <div className={cn('h-full rounded-full', TIER_BAR[c.tier])} style={{ width: `${c.compositeScore}%` }} />
                          </div>
                          <span className="font-bold text-slate-800">{c.compositeScore}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-700">{c.otdPct}%</td>
                      <td className="px-4 py-3 font-medium text-slate-700">{c.slaCompliancePct}%</td>
                      <td className="px-4 py-3">
                        <span className={cn('font-semibold', c.exceptionRatePer100 > 5 ? 'text-red-600' : c.exceptionRatePer100 > 3 ? 'text-amber-600' : 'text-green-600')}>
                          {c.exceptionRatePer100}
                        </span>
                      </td>
                      <td className="px-4 py-3 w-16">
                        <SparklineChart data={c.scoreTrend} height={28} color={c.compositeScore >= 80 ? '#10B981' : c.compositeScore >= 65 ? '#F59E0B' : '#EF4444'} />
                      </td>
                      <td className="px-4 py-3">
                        <span className="flex items-center gap-1.5 text-xxs font-medium text-slate-600 capitalize">
                          <span className={cn('h-1.5 w-1.5 rounded-full', STATUS_DOT[c.status])} />
                          {c.status.replace('_', ' ')}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Detail panel */}
          {selectedCarrier && (
            <div className="w-72 flex-shrink-0 rounded-xl border border-slate-200 bg-white overflow-hidden">
              <div className="px-4 py-4 border-b border-slate-100">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold text-slate-900">{selectedCarrier.name}</p>
                  <button onClick={() => setSelected(null)} className="text-xxs text-slate-400 hover:text-slate-600">✕</button>
                </div>
                <span className={cn('mt-1 rounded-full border px-2 py-0.5 text-xxs font-semibold inline-block', TIER_COLOR[selectedCarrier.tier])}>{selectedCarrier.tier}</span>
              </div>
              <div className="p-4 space-y-4 overflow-y-auto max-h-96">
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: 'Composite', value: `${selectedCarrier.compositeScore}/100` },
                    { label: 'OTD %',     value: `${selectedCarrier.otdPct}%` },
                    { label: 'SLA %',     value: `${selectedCarrier.slaCompliancePct}%` },
                    { label: 'Exc/100',   value: selectedCarrier.exceptionRatePer100 },
                    { label: 'Damage %',  value: `${selectedCarrier.damageRatePct}%` },
                    { label: 'Resp. Time',value: `${selectedCarrier.responseTimeMins}m` },
                    { label: 'Dispatches',value: selectedCarrier.monthlyDispatches },
                    { label: 'Routes',    value: selectedCarrier.activeRoutes },
                  ].map(r => (
                    <div key={r.label} className="rounded-lg bg-slate-50 border border-slate-100 px-3 py-2">
                      <p className="text-xxs text-slate-400">{r.label}</p>
                      <p className="text-xs font-bold text-slate-800">{r.value}</p>
                    </div>
                  ))}
                </div>
                <div>
                  <p className="text-xxs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Score Trend (6 mo)</p>
                  <SparklineChart data={selectedCarrier.scoreTrend} height={48} color="#3B82F6" showTooltip />
                </div>
                {selectedCarrier.remarks && (
                  <div className="rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-xxs text-amber-800">
                    {selectedCarrier.remarks}
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
