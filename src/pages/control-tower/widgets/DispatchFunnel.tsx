import React from 'react'
import { cn } from '@/lib/utils'
import { useFilters } from '@/context/FilterContext'
import { BarChart } from '@/components/charts/BarChart'
import { DISPATCH_FUNNEL, DISPATCH_TREND, REGION_SUMMARY } from '../mock/data'

export function DispatchFunnel() {
  const { filters } = useFilters()
  const { region } = filters

  const regionData = region ? REGION_SUMMARY.find(r => r.region.toLowerCase() === region) : null
  const scale = regionData ? regionData.dispatches / DISPATCH_FUNNEL[0].count : 1
  const displayFunnel = regionData
    ? DISPATCH_FUNNEL.map(s => ({ ...s, count: Math.max(1, Math.round(s.count * scale)) }))
    : DISPATCH_FUNNEL

  const max = displayFunnel[0].count

  return (
    <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
        <div>
          <h3 className="text-sm font-semibold text-slate-800">Dispatch Funnel</h3>
          <p className="text-xs text-slate-400 mt-0.5">Live status pipeline — today</p>
        </div>
        <div className="flex items-center gap-3">
          <Stat label="Total" value={displayFunnel[0].count.toString()} color="text-slate-700" />
          <Stat label="Active" value={displayFunnel[2].count.toString()} color="text-blue-600" />
          <Stat label="Completed" value={displayFunnel[6].count.toString()} color="text-green-600" />
        </div>
      </div>

      <div className="grid grid-cols-2 divide-x divide-slate-100">
        {/* Funnel bars */}
        <div className="px-5 py-4 space-y-2.5">
          {displayFunnel.map((stage, i) => (
            <div key={stage.status} className="flex items-center gap-3">
              <span className="w-24 shrink-0 text-xs text-slate-500 text-right">{stage.status}</span>
              <div className="flex-1 relative h-6 flex items-center">
                {/* Track */}
                <div className="absolute inset-y-1 left-0 right-0 rounded-full bg-slate-100" />
                {/* Fill — tapers like a funnel */}
                <div
                  className="absolute inset-y-1 left-0 rounded-full transition-all duration-slow"
                  style={{
                    width: `${stage.pct}%`,
                    backgroundColor: stage.color,
                    opacity: 0.85,
                  }}
                />
                <span
                  className="relative z-10 ml-2 text-xs font-semibold tabular-nums"
                  style={{ color: stage.pct > 30 ? '#fff' : stage.color }}
                >
                  {stage.count}
                </span>
              </div>
              <span className="w-8 shrink-0 text-right text-xs font-medium text-slate-400">
                {stage.pct}%
              </span>
            </div>
          ))}
        </div>

        {/* 7-day trend */}
        <div className="px-5 py-4">
          <p className="text-xs font-medium text-slate-500 mb-3">7-Day Dispatch Trend</p>
          <BarChart
            data={DISPATCH_TREND}
            xKey="day"
            series={[
              { dataKey: 'planned',   label: 'Planned',   color: '#CBD5E1' },
              { dataKey: 'completed', label: 'Completed', color: '#3B82F6' },
            ]}
            height={180}
            showLegend
          />
        </div>
      </div>
    </div>
  )
}

function Stat({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="text-center">
      <div className={cn('text-lg font-bold tabular-nums', color)}>{value}</div>
      <div className="text-xxs text-slate-400 uppercase tracking-wide">{label}</div>
    </div>
  )
}
