import React from 'react'
import { TrendingUp, TrendingDown, DollarSign, Package, Truck, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { KPICard }    from '@/components/kpi/KPICard'
import { BarChart }   from '@/components/charts/BarChart'
import { LineChart }  from '@/components/charts/LineChart'
import { DonutChart } from '@/components/charts/DonutChart'
import { KPI_DATA, DISPATCH_TREND, REGION_SUMMARY, GRADE_DISTRIBUTION, SLA_TREND_7D } from '@/pages/control-tower/mock/data'
import { EXEC_WEEKLY_TREND, EXEC_MONTHLY_REVENUE, EXEC_FLEET_UTIL_TREND } from '../mock/data'

function SectionTitle({ title, sub }: { title: string; sub?: string }) {
  return (
    <div className="mb-3">
      <h2 className="text-sm font-bold text-slate-900">{title}</h2>
      {sub && <p className="text-xxs text-slate-400 mt-0.5">{sub}</p>}
    </div>
  )
}

function StatCard({ label, value, unit, delta, deltaDir, color }: {
  label: string; value: string | number; unit?: string
  delta?: string; deltaDir?: 'up' | 'down'; color: string
}) {
  return (
    <div className={cn('rounded-xl border-l-4 border bg-white p-4', color)}>
      <p className="text-xxs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <div className="flex items-baseline gap-1 mt-1.5">
        <span className="text-2xl font-bold text-slate-900">{value}</span>
        {unit && <span className="text-sm text-slate-400">{unit}</span>}
      </div>
      {delta && (
        <span className={cn('flex items-center gap-0.5 text-xxs font-medium mt-1', deltaDir === 'up' ? 'text-green-600' : 'text-red-500')}>
          {deltaDir === 'up' ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
          {delta} vs last week
        </span>
      )}
    </div>
  )
}

export function ExecutiveAnalytics() {
  const execKPIs = [
    KPI_DATA[0], // Active Dispatches
    KPI_DATA[1], // OTD%
    KPI_DATA[2], // SLA Breaches
    KPI_DATA[4], // Vehicle Utilisation
    KPI_DATA[3], // Open Exceptions
    KPI_DATA[6], // Cost vs Budget
  ]

  return (
    <div className="space-y-8">
      {/* KPI Strip */}
      <section>
        <SectionTitle title="Executive KPIs" sub="Current period snapshot — all modules" />
        <div className="grid grid-cols-6 gap-4">
          {execKPIs.map(k => <KPICard key={k.label} data={k} />)}
        </div>
      </section>

      {/* Summary stat cards */}
      <section>
        <SectionTitle title="Period Summary" sub="Month-to-date aggregation" />
        <div className="grid grid-cols-4 gap-4">
          <StatCard label="Total Dispatches MTD" value="9,562" delta="+8.2%" deltaDir="up" color="border-l-blue-500" />
          <StatCard label="Revenue Impact (₹)" value="23.6" unit="Cr" delta="+4.1%" deltaDir="up" color="border-l-green-500" />
          <StatCard label="SLA Compliance" value="91" unit="%" delta="-0.8%" deltaDir="down" color="border-l-amber-500" />
          <StatCard label="Exception Rate" value="3.8" unit="/100 dispatch" delta="-0.4" deltaDir="down" color="border-l-red-500" />
        </div>
      </section>

      {/* Weekly Dispatch + OTD Trend */}
      <section>
        <div className="grid grid-cols-2 gap-6">
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <SectionTitle title="Weekly Dispatch Volume" sub="Planned vs completed — last 8 weeks" />
            <BarChart
              data={EXEC_WEEKLY_TREND as unknown as Record<string, unknown>[]}
              xKey="week"
              series={[
                { dataKey: 'dispatches', label: 'Planned',   color: '#CBD5E1' },
                { dataKey: 'completed',  label: 'Completed', color: '#3B82F6' },
              ]}
              height={220}
              showLegend
            />
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <SectionTitle title="OTD & SLA Compliance" sub="Weekly % trend — last 8 weeks" />
            <LineChart
              data={EXEC_WEEKLY_TREND as unknown as Record<string, unknown>[]}
              xKey="week"
              series={[
                { dataKey: 'otd', label: 'OTD %',          color: '#10B981' },
                { dataKey: 'sla', label: 'SLA Compliance', color: '#8B5CF6', dashed: true },
              ]}
              height={220}
              showLegend
              referenceLines={[{ value: 90, label: '90% target', color: '#F59E0B' }]}
            />
          </div>
        </div>
      </section>

      {/* Revenue + Fleet utilization */}
      <section>
        <div className="grid grid-cols-2 gap-6">
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <SectionTitle title="Revenue vs Budget" sub="₹ Crores — monthly comparison" />
            <BarChart
              data={EXEC_MONTHLY_REVENUE as unknown as Record<string, unknown>[]}
              xKey="month"
              series={[
                { dataKey: 'revenue', label: 'Actual Revenue', color: '#3B82F6' },
                { dataKey: 'budget',  label: 'Budget',         color: '#E2E8F0' },
              ]}
              height={220}
              showLegend
            />
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <SectionTitle title="Fleet Utilisation by Type" sub="% utilisation — monthly trend" />
            <LineChart
              data={EXEC_FLEET_UTIL_TREND as unknown as Record<string, unknown>[]}
              xKey="month"
              series={[
                { dataKey: 'ftl', label: 'FTL',  color: '#3B82F6' },
                { dataKey: 'ltl', label: 'LTL',  color: '#10B981' },
                { dataKey: 'lcv', label: 'LCV',  color: '#F59E0B' },
              ]}
              height={220}
              showLegend
            />
          </div>
        </div>
      </section>

      {/* SLA + Region + Grade breakdown */}
      <section>
        <div className="grid grid-cols-3 gap-6">
          {/* SLA 7-day */}
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <SectionTitle title="SLA Status — 7 Day" sub="Ok / At-Risk / Breached %" />
            <LineChart
              data={SLA_TREND_7D as unknown as Record<string, unknown>[]}
              xKey="day"
              series={[
                { dataKey: 'ok',       label: 'On Time',  color: '#10B981' },
                { dataKey: 'atRisk',   label: 'At Risk',  color: '#F59E0B' },
                { dataKey: 'breached', label: 'Breached', color: '#EF4444' },
              ]}
              height={180}
              showLegend
            />
          </div>

          {/* Region OTD */}
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <SectionTitle title="OTD by Region" sub="Today's on-time delivery %" />
            <div className="space-y-3 mt-2">
              {REGION_SUMMARY.map(r => (
                <div key={r.region}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-medium text-slate-700">{r.region}</span>
                    <span className="text-slate-500">{r.onTime}% OTD · {r.dispatches} dispatches</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${r.onTime}%`, backgroundColor: r.color }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Route Grade Distribution */}
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <SectionTitle title="Route Grade Mix" sub="All active routes by performance grade" />
            <DonutChart
              data={GRADE_DISTRIBUTION.map(g => ({ name: `Grade ${g.name}`, value: g.value, color: g.color }))}
              height={180}
              centerLabel="Routes"
              centerValue={GRADE_DISTRIBUTION.reduce((s, g) => s + g.value, 0)}
              showLegend
            />
          </div>
        </div>
      </section>

      {/* Day-by-day dispatch */}
      <section>
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <SectionTitle title="Daily Dispatch Performance" sub="Planned vs completed — this week" />
          <BarChart
            data={DISPATCH_TREND as unknown as Record<string, unknown>[]}
            xKey="day"
            series={[
              { dataKey: 'planned',   label: 'Planned',   color: '#CBD5E1' },
              { dataKey: 'completed', label: 'Completed', color: '#3B82F6' },
            ]}
            height={200}
            showLegend
          />
        </div>
      </section>
    </div>
  )
}
