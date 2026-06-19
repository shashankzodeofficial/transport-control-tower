import React, { useState, useMemo } from 'react'
import { Building2, Star } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useActiveFilters } from '@/hooks/useActiveFilters'
import { TrendBadge } from '@/components/badges/TrendBadge'
import { SparklineChart } from '@/components/charts/SparklineChart'
import { BarChart } from '@/components/charts/BarChart'
import { CARRIER_PERFORMANCE } from '../mock/data'

const TIER_STYLES: Record<string, string> = {
  'Top Performer': 'bg-green-50 text-green-700 border border-green-200',
  'Good':          'bg-blue-50 text-blue-700 border border-blue-200',
  'Monitor':       'bg-amber-50 text-amber-700 border border-amber-200',
  'At Risk':       'bg-red-50 text-red-700 border border-red-200',
}

const TREND_COLORS: Record<string, string> = {
  up: '#16A34A', down: '#DC2626', stable: '#64748B',
}

export function CarrierPerformance() {
  const [view, setView] = useState<'cards' | 'chart'>('cards')
  const [tierFilter, setTierFilter] = useState<string | null>(null)
  const { region, dateRange } = useActiveFilters('CT-CarrierPerf')

  // Carriers don't have a direct origin — filter by tier and show region label in header
  const baseCarriers = CARRIER_PERFORMANCE
  const filtered = useMemo(() =>
    baseCarriers.filter(c => !tierFilter || c.tier === tierFilter),
    [tierFilter, region, dateRange],
  )

  const tierCounts = useMemo(() => ({
    'Top Performer': baseCarriers.filter(c => c.tier === 'Top Performer').length,
    'Good':          baseCarriers.filter(c => c.tier === 'Good').length,
    'Monitor':       baseCarriers.filter(c => c.tier === 'Monitor').length,
    'At Risk':       baseCarriers.filter(c => c.tier === 'At Risk').length,
  }), [])

  return (
    <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50">
            <Building2 size={16} className="text-blue-500" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-800">Carrier Performance</h3>
            <p className="text-xs text-slate-400 mt-0.5">{CARRIER_PERFORMANCE.length} active carriers · composite score ranking</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Tier filter pills */}
          <div className="flex items-center gap-1">
            {Object.entries(tierCounts).map(([tier, count]) => (
              <button
                key={tier}
                onClick={() => setTierFilter(tierFilter === tier ? null : tier)}
                className={cn(
                  'rounded-full px-2.5 py-0.5 text-xxs font-semibold transition-colors',
                  tierFilter === tier ? TIER_STYLES[tier] : 'bg-slate-100 text-slate-500 hover:bg-slate-200',
                )}
              >
                {tier.split(' ')[0]} ({count})
              </button>
            ))}
          </div>
          {/* View toggle */}
          <div className="flex items-center gap-0.5 rounded-lg border border-slate-200 p-0.5">
            {(['cards', 'chart'] as const).map(v => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={cn(
                  'rounded px-2.5 py-1 text-xs font-medium capitalize transition-colors',
                  view === v ? 'bg-slate-800 text-white' : 'text-slate-500 hover:text-slate-700',
                )}
              >
                {v === 'cards' ? 'Scorecard' : 'Compare'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {view === 'cards' ? (
        <div className="divide-y divide-slate-50 max-h-96 overflow-y-auto">
          {/* Column headers */}
          <div className="grid grid-cols-12 gap-2 bg-slate-50 px-5 py-2 text-xxs font-semibold uppercase tracking-wide text-slate-400">
            <div className="col-span-4">Carrier</div>
            <div className="col-span-1 text-center">OTD</div>
            <div className="col-span-1 text-center">OTA</div>
            <div className="col-span-1 text-center">Except.</div>
            <div className="col-span-1 text-center">Score</div>
            <div className="col-span-1 text-center">Rating</div>
            <div className="col-span-1 text-center">Tier</div>
            <div className="col-span-2 text-right">7D Trend</div>
          </div>
          {filtered
            .sort((a, b) => b.compositeScore - a.compositeScore)
            .map((carrier, rank) => (
              <CarrierRow key={carrier.id} carrier={carrier} rank={rank + 1} />
            ))}
        </div>
      ) : (
        <div className="p-5">
          <BarChart
            data={CARRIER_PERFORMANCE.map(c => ({
              name: c.name.split(' ')[0],
              OTD: c.otdPct,
              Score: c.compositeScore,
            }))}
            xKey="name"
            series={[
              { dataKey: 'OTD',   label: 'OTD %',          color: '#3B82F6' },
              { dataKey: 'Score', label: 'Composite Score', color: '#8B5CF6' },
            ]}
            height={240}
            showGrid
            showLegend
          />
        </div>
      )}
    </div>
  )
}

function CarrierRow({ carrier, rank }: { carrier: typeof CARRIER_PERFORMANCE[0]; rank: number }) {
  const scoreColor =
    carrier.compositeScore >= 90 ? 'text-green-600' :
    carrier.compositeScore >= 80 ? 'text-blue-600' :
    carrier.compositeScore >= 70 ? 'text-amber-600' : 'text-red-600'

  return (
    <div className="grid grid-cols-12 items-center gap-2 px-5 py-3 hover:bg-slate-50 transition-colors">
      {/* Carrier name */}
      <div className="col-span-4 flex items-center gap-2.5 min-w-0">
        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xxs font-bold text-slate-500">
          {rank}
        </span>
        <div className="min-w-0">
          <div className="text-xs font-semibold text-slate-800 truncate">{carrier.name}</div>
          <div className="text-xxs text-slate-400">{carrier.type} · {carrier.activeDispatches} active</div>
        </div>
      </div>

      {/* OTD */}
      <div className="col-span-1 text-center">
        <span className={cn('text-xs font-semibold tabular-nums',
          carrier.otdPct >= 90 ? 'text-green-600' : carrier.otdPct >= 80 ? 'text-amber-600' : 'text-red-600'
        )}>
          {carrier.otdPct}%
        </span>
      </div>

      {/* OTA */}
      <div className="col-span-1 text-center">
        <span className="text-xs tabular-nums text-slate-600">{carrier.otaPct}%</span>
      </div>

      {/* Exceptions */}
      <div className="col-span-1 text-center">
        <span className={cn(
          'rounded-full px-1.5 py-0.5 text-xxs font-semibold',
          carrier.openExceptions === 0 ? 'text-slate-400' :
          carrier.openExceptions <= 4 ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-700',
        )}>
          {carrier.openExceptions}
        </span>
      </div>

      {/* Score */}
      <div className="col-span-1 text-center">
        <span className={cn('text-sm font-bold tabular-nums', scoreColor)}>
          {carrier.compositeScore}
        </span>
      </div>

      {/* Star rating */}
      <div className="col-span-1 text-center flex items-center justify-center gap-0.5">
        <Star size={10} className="text-amber-400 fill-amber-400" />
        <span className="text-xs text-slate-600">{carrier.avgRating}</span>
      </div>

      {/* Tier badge */}
      <div className="col-span-1 flex justify-center">
        <span className={cn('rounded-full px-2 py-0.5 text-xxs font-semibold whitespace-nowrap', TIER_STYLES[carrier.tier])}>
          {carrier.tier === 'Top Performer' ? 'Top' : carrier.tier}
        </span>
      </div>

      {/* Sparkline */}
      <div className="col-span-2 flex items-center justify-end gap-1.5">
        <SparklineChart
          data={carrier.sparkline}
          color={TREND_COLORS[carrier.trend]}
          height={24}
          className="w-16"
        />
        <TrendBadge
          direction={carrier.trend}
          delta={carrier.trend === 'up' ? '+' : carrier.trend === 'down' ? '−' : '~'}
        />
      </div>
    </div>
  )
}
