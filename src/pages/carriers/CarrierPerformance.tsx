import React, { useState, useMemo } from 'react'
import {
  Star, AlertTriangle, TrendingDown, TrendingUp,
  Search, Download, ChevronRight, X, Phone,
  Shield, Activity, Clock, BarChart2,
} from 'lucide-react'
import { cn, timeAgo } from '@/lib/utils'
import { useFilters } from '@/context/FilterContext'
import { cityRegion } from '@/lib/exportCsv'
import { LineChart }   from '@/components/charts/LineChart'
import { BarChart }    from '@/components/charts/BarChart'
import { DonutChart }  from '@/components/charts/DonutChart'
import { SparklineChart } from '@/components/charts/SparklineChart'
import { TabStrip }    from '@/layout/TabStrip'
import {
  CARRIERS, CARRIER_KPI, TIER_DIST, SCORE_METRICS,
} from './mock/data'
import type { CarrierDetail, CarrierTier } from './mock/data'

// ─── Tier config ──────────────────────────────────────────────────────────────

const TIER_CFG: Record<CarrierTier, { color: string; ring: string; text: string }> = {
  Platinum: { color: '#7c3aed', ring: 'ring-violet-300', text: 'text-violet-700'  },
  Gold:     { color: '#d97706', ring: 'ring-amber-300',  text: 'text-amber-700'   },
  Silver:   { color: '#64748b', ring: 'ring-slate-300',  text: 'text-slate-600'   },
  Bronze:   { color: '#92400e', ring: 'ring-orange-300', text: 'text-orange-800'  },
  Probation:{ color: '#ef4444', ring: 'ring-red-300',    text: 'text-red-700'     },
}

function TierBadge({ tier }: { tier: CarrierTier }) {
  const cfg = TIER_CFG[tier]
  return (
    <span className={cn('rounded-full ring-1 px-2.5 py-0.5 text-xxs font-bold', cfg.ring, cfg.text)}>
      {tier}
    </span>
  )
}

function StatusDot({ status }: { status: CarrierDetail['status'] }) {
  const style: Record<string, string> = {
    active:       'bg-green-500',
    suspended:    'bg-red-500',
    under_review: 'bg-amber-500',
    probation:    'bg-red-400',
  }
  return <span className={cn('inline-block h-1.5 w-1.5 rounded-full', style[status] ?? 'bg-slate-400')} />
}

// ─── Carrier detail panel ─────────────────────────────────────────────────────

function CarrierDetailPanel({ c, onClose }: { c: CarrierDetail; onClose: () => void }) {
  const [trendView, setTrendView] = useState<'score' | 'otd'>('score')
  const cfg = TIER_CFG[c.tier]

  const trendData = c.scoreTrend.map((v, i) => ({
    month: `M${i + 1}`,
    score: v,
    otd: c.otdTrend[i],
  }))

  const radarData = [
    { metric: 'OTD',      value: c.otdPct },
    { metric: 'SLA',      value: c.slaCompliancePct },
    { metric: 'Exc Rate', value: Math.max(0, 100 - c.exceptionRatePer100 * 5) },
    { metric: 'Damage',   value: Math.max(0, 100 - c.damageRatePct * 30) },
    { metric: 'Response', value: Math.max(0, 100 - Math.min(100, c.responseTimeMins / 60 * 100)) },
  ]

  return (
    <div className="flex h-full flex-col border-l border-slate-200 bg-white">
      {/* Header */}
      <div className="border-b border-slate-100 px-5 py-4">
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-3">
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white text-sm font-bold"
              style={{ background: cfg.color }}
            >
              {c.shortCode}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-800">{c.name}</span>
                <StatusDot status={c.status} />
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <TierBadge tier={c.tier} />
                <span className="text-xxs text-slate-400">{c.hqCity}</span>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-1 hover:bg-slate-100 transition-colors">
            <X size={14} className="text-slate-400" />
          </button>
        </div>
        {/* Composite score */}
        <div className="flex items-center gap-3 mt-2">
          <span className="text-3xl font-bold" style={{ color: cfg.color }}>{c.compositeScore}</span>
          <div className="flex-1 h-2 rounded-full bg-slate-100 overflow-hidden">
            <div className="h-full rounded-full" style={{ width: `${c.compositeScore}%`, background: cfg.color }} />
          </div>
          <span className="text-xs text-slate-400">/ 100</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
        {/* KPIs */}
        <div className="grid grid-cols-2 gap-2">
          {[
            { label: 'OTD%',         value: `${c.otdPct}%`,            color: c.otdPct >= 90 ? 'text-green-600' : c.otdPct >= 80 ? 'text-amber-600' : 'text-red-600' },
            { label: 'SLA Compliance',value: `${c.slaCompliancePct}%`, color: 'text-slate-700' },
            { label: 'Exc Rate/100', value: c.exceptionRatePer100,      color: c.exceptionRatePer100 > 8 ? 'text-red-600' : 'text-slate-700' },
            { label: 'Damage Rate',  value: `${c.damageRatePct}%`,      color: c.damageRatePct > 1 ? 'text-amber-600' : 'text-slate-700' },
            { label: 'Response Time',value: `${c.responseTimeMins}m`,   color: c.responseTimeMins > 60 ? 'text-red-600' : 'text-slate-700' },
            { label: 'Cost Index',   value: `${c.freightCostIndex}`,    color: 'text-slate-700' },
            { label: 'Active Routes',value: c.activeRoutes,             color: 'text-slate-700' },
            { label: 'MTD Dispatches',value: c.monthlyDispatches,       color: 'text-slate-700' },
          ].map(k => (
            <div key={k.label} className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2">
              <p className="text-xxs text-slate-400 mb-0.5">{k.label}</p>
              <p className={cn('text-sm font-bold tabular-nums', k.color)}>{k.value}</p>
            </div>
          ))}
        </div>

        {/* Contact */}
        <div className="rounded-lg border border-slate-200 px-4 py-3">
          <p className="text-xxs font-semibold uppercase tracking-wide text-slate-400 mb-2">Contact</p>
          <p className="text-sm font-medium text-slate-700">{c.contactName}</p>
          <a href={`tel:${c.contactPhone}`} className="flex items-center gap-1.5 text-xs text-blue-600 hover:underline mt-0.5">
            <Phone size={11} />{c.contactPhone}
          </a>
          <div className="flex items-center justify-between mt-2 text-xxs text-slate-400">
            <span>Contract expires</span>
            <span className={cn('font-medium', new Date(c.contractExpiry) < new Date() ? 'text-red-600' : 'text-slate-600')}>
              {new Date(c.contractExpiry).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
            </span>
          </div>
        </div>

        {/* Audit */}
        <div className="rounded-lg border border-slate-200 px-4 py-3">
          <p className="text-xxs font-semibold uppercase tracking-wide text-slate-400 mb-2">Last Audit</p>
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-slate-700">Score {c.lastAuditScore}</span>
            <span className="text-xs text-slate-400">{new Date(c.lastAuditDate).toLocaleDateString('en-IN')}</span>
          </div>
        </div>

        {/* Remarks */}
        {c.remarks && (
          <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5">
            <AlertTriangle size={13} className="text-amber-500 mt-0.5 shrink-0" />
            <p className="text-xs text-amber-800">{c.remarks}</p>
          </div>
        )}

        {/* 6-month trend */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <p className="text-xs font-semibold text-slate-700">6-Month Trend</p>
            <div className="flex gap-1 ml-auto">
              {(['score','otd'] as const).map(v => (
                <button key={v} onClick={() => setTrendView(v)}
                  className={cn('rounded-full px-2.5 py-0.5 text-xxs font-medium transition-colors',
                    trendView === v ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  )}>
                  {v === 'score' ? 'Score' : 'OTD%'}
                </button>
              ))}
            </div>
          </div>
          <LineChart
            data={trendData}
            xKey="month"
            series={[{ dataKey: trendView, label: trendView === 'score' ? 'Score' : 'OTD%', color: cfg.color }]}
            height={80}
            showGrid
          />
        </div>

        {/* Performance radar (manual bars) */}
        <div>
          <p className="text-xs font-semibold text-slate-700 mb-3">Performance Breakdown</p>
          <div className="space-y-2">
            {radarData.map(r => (
              <div key={r.metric} className="text-xxs">
                <div className="flex justify-between mb-0.5">
                  <span className="text-slate-500">{r.metric}</span>
                  <span className="font-semibold text-slate-700">{Math.round(r.value)}%</span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${r.value}%`, background: cfg.color }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Carrier row ──────────────────────────────────────────────────────────────

function CarrierRow({ c, rank, isSelected, onClick }: {
  c: CarrierDetail
  rank: number
  isSelected: boolean
  onClick: () => void
}) {
  const cfg = TIER_CFG[c.tier]
  const isProbation = c.tier === 'Probation' || c.status === 'probation'

  return (
    <tr
      onClick={onClick}
      className={cn(
        'cursor-pointer transition-colors border-b border-slate-100',
        isSelected ? 'bg-blue-50' :
        isProbation ? 'bg-red-50/40 hover:bg-red-50' :
        c.status === 'under_review' ? 'bg-amber-50/30 hover:bg-amber-50' :
        'hover:bg-slate-50',
      )}
    >
      <td className="px-4 py-3 text-xs font-semibold text-slate-400 w-8 text-center">{rank}</td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <div
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-white text-xxs font-bold"
            style={{ background: cfg.color }}
          >
            {c.shortCode}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold text-slate-800">{c.name}</span>
              <StatusDot status={c.status} />
            </div>
            <p className="text-xxs text-slate-400">{c.hqCity} · {c.fleetsSize} fleet</p>
          </div>
        </div>
      </td>
      <td className="px-4 py-3"><TierBadge tier={c.tier} /></td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="h-1.5 w-20 rounded-full bg-slate-100 overflow-hidden">
            <div className="h-full rounded-full" style={{ width: `${c.compositeScore}%`, background: cfg.color }} />
          </div>
          <span className="text-xs font-bold tabular-nums" style={{ color: cfg.color }}>{c.compositeScore}</span>
        </div>
      </td>
      <td className="px-4 py-3">
        <span className={cn('text-xs font-semibold tabular-nums',
          c.otdPct >= 90 ? 'text-green-600' : c.otdPct >= 80 ? 'text-amber-600' : 'text-red-600'
        )}>
          {c.otdPct}%
        </span>
      </td>
      <td className="px-4 py-3 text-xs text-slate-600 tabular-nums">{c.slaCompliancePct}%</td>
      <td className="px-4 py-3">
        <span className={cn('text-xs tabular-nums', c.exceptionRatePer100 > 8 ? 'text-red-600 font-semibold' : 'text-slate-600')}>
          {c.exceptionRatePer100}
        </span>
      </td>
      <td className="px-4 py-3 text-xs text-slate-500 tabular-nums">{c.responseTimeMins}m</td>
      <td className="px-4 py-3">
        <SparklineChart
          data={c.scoreTrend.map((v, i) => ({ i, v }))}
          dataKey="v"
          color={cfg.color}
          height={28}
          width={70}
        />
      </td>
      <td className="px-4 py-3 text-xs text-slate-500 tabular-nums">{c.monthlyDispatches}</td>
      <td className="px-4 py-3">
        {(c.status === 'probation' || c.status === 'under_review') && (
          <AlertTriangle size={13} className={c.status === 'probation' ? 'text-red-500' : 'text-amber-500'} />
        )}
      </td>
      <td className="px-4 py-3">
        <ChevronRight size={13} className={cn('transition-transform', isSelected ? 'text-blue-500 rotate-90' : 'text-slate-300')} />
      </td>
    </tr>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

const STATUS_TABS = [
  { key: 'all',      label: 'All Carriers' },
  { key: 'active',   label: 'Active'       },
  { key: 'watch',    label: 'Watch List'   },
]

type SortKey = 'compositeScore' | 'otdPct' | 'exceptionRatePer100' | 'responseTimeMins' | 'monthlyDispatches'

export function CarrierPerformance() {
  const [tab, setTab]               = useState('all')
  const [search, setSearch]         = useState('')
  const [sortKey, setSortKey]       = useState<SortKey>('compositeScore')
  const [sortDir, setSortDir]       = useState<'asc' | 'desc'>('desc')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [showCharts, setShowCharts] = useState(true)

  const { filters } = useFilters()
  const { region, dateRange } = filters

  // Base list filtered by global region (hqCity mapped to region)
  const baseList = useMemo(() =>
    region ? CARRIERS.filter(c => cityRegion(c.hqCity) === region) : CARRIERS,
    [region, dateRange],
  )

  const filtered = useMemo(() => {
    let list = baseList
    if (tab === 'active') list = list.filter(c => c.status === 'active')
    if (tab === 'watch')  list = list.filter(c => ['probation','under_review','suspended'].includes(c.status))
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(c =>
        c.name.toLowerCase().includes(q) ||
        c.shortCode.toLowerCase().includes(q) ||
        c.hqCity.toLowerCase().includes(q)
      )
    }
    return [...list].sort((a, b) => {
      const va = a[sortKey] as number
      const vb = b[sortKey] as number
      return sortDir === 'desc' ? vb - va : va - vb
    })
  }, [baseList, tab, search, sortKey, sortDir])

  const selected = selectedId ? CARRIERS.find(c => c.id === selectedId) ?? null : null

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir(d => d === 'desc' ? 'asc' : 'desc')
    else { setSortKey(key); setSortDir('desc') }
  }

  const tabsWithBadge = STATUS_TABS.map(t => ({
    ...t,
    badge: t.key === 'all' ? baseList.length :
           t.key === 'active' ? baseList.filter(c => c.status === 'active').length :
           baseList.filter(c => ['probation','under_review','suspended'].includes(c.status)).length,
  }))

  const donutData = TIER_DIST.filter(t => t.count > 0).map(t => ({ name: t.tier, value: t.count, color: t.color }))
  const scoreBarData = CARRIERS.slice(0, 8).map(c => ({ carrier: c.shortCode, score: c.compositeScore }))

  return (
    <div className="flex flex-col h-full bg-slate-50">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
        <div>
          <h1 className="text-lg font-bold text-slate-900">Carrier Performance</h1>
          <p className="text-xs text-slate-400">Composite scoring across OTD, SLA, exceptions, damage and response time</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowCharts(s => !s)}
            className={cn('flex h-8 items-center gap-1.5 rounded-lg border px-3 text-xs font-medium transition-colors',
              showCharts ? 'border-blue-200 bg-blue-50 text-blue-700' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50')}
          >
            <BarChart2 size={13} />Analytics
          </button>
          <button className="flex h-8 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-slate-600 hover:bg-slate-50">
            <Download size={13} />Export
          </button>
        </div>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-6 gap-3 border-b border-slate-200 bg-white px-6 py-4">
        {[
          { label: 'Total Carriers',  value: CARRIER_KPI.total,       icon: Shield,        color: 'text-slate-700' },
          { label: 'Avg Score',       value: CARRIER_KPI.avgScore,    icon: Activity,      color: 'text-blue-600'  },
          { label: 'Platinum',        value: CARRIER_KPI.platinum,    icon: Star,          color: 'text-violet-600'},
          { label: 'Avg OTD%',        value: `${CARRIER_KPI.avgOTD}%`,icon: TrendingUp,    color: 'text-green-600' },
          { label: 'Under Review',    value: CARRIER_KPI.underReview, icon: AlertTriangle, color: 'text-amber-600' },
          { label: 'On Probation',    value: CARRIER_KPI.probation,   icon: TrendingDown,  color: 'text-red-600'   },
        ].map(k => (
          <div key={k.label} className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
            <div className="flex items-center justify-between mb-1">
              <p className="text-xxs font-semibold uppercase tracking-wide text-slate-400">{k.label}</p>
              <k.icon size={13} className={k.color} />
            </div>
            <p className={cn('text-2xl font-bold tabular-nums', k.color)}>{k.value}</p>
          </div>
        ))}
      </div>

      {/* Analytics */}
      {showCharts && (
        <div className="grid grid-cols-3 gap-4 border-b border-slate-200 bg-white px-6 py-4">
          <div className="rounded-xl border border-slate-200 p-4">
            <p className="mb-3 text-xs font-semibold text-slate-700">Tier Distribution</p>
            <div className="flex items-center gap-5">
              <DonutChart data={donutData} size={96} />
              <div className="space-y-1">
                {TIER_DIST.filter(t => t.count > 0).map(t => (
                  <div key={t.tier} className="flex items-center gap-2 text-xxs">
                    <div className="h-2 w-2 rounded-full" style={{ background: t.color }} />
                    <span className="text-slate-600">{t.tier}</span>
                    <span className="ml-auto font-semibold">{t.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="col-span-2 rounded-xl border border-slate-200 p-4">
            <p className="mb-3 text-xs font-semibold text-slate-700">Score Comparison</p>
            <BarChart
              data={scoreBarData}
              xKey="carrier"
              series={[{ dataKey: 'score', label: 'Composite Score', color: '#7c3aed' }]}
              height={100}
              showGrid
            />
          </div>
        </div>
      )}

      {/* Tabs */}
      <TabStrip tabs={tabsWithBadge} activeTab={tab} onChange={setTab} variant="page" />

      {/* Toolbar */}
      <div className="flex items-center gap-3 border-b border-slate-200 bg-white px-6 py-2.5">
        <Search size={14} className="text-slate-400 shrink-0" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search carrier name, code, city…"
          className="flex-1 bg-transparent text-sm text-slate-700 placeholder:text-slate-400 outline-none"
        />
        <span className="text-xs text-slate-400 ml-2">{filtered.length} carrier{filtered.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 overflow-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-slate-50 border-b border-slate-200 z-10">
              <tr>
                <Th2>#</Th2>
                <Th2>Carrier</Th2>
                <Th2>Tier</Th2>
                <SortableTh label="Score" sortKey="compositeScore" current={sortKey} dir={sortDir} onSort={toggleSort} />
                <SortableTh label="OTD%" sortKey="otdPct" current={sortKey} dir={sortDir} onSort={toggleSort} />
                <Th2>SLA%</Th2>
                <SortableTh label="Exc/100" sortKey="exceptionRatePer100" current={sortKey} dir={sortDir} onSort={toggleSort} />
                <SortableTh label="Response" sortKey="responseTimeMins" current={sortKey} dir={sortDir} onSort={toggleSort} />
                <Th2>Score Trend</Th2>
                <SortableTh label="Dispatches" sortKey="monthlyDispatches" current={sortKey} dir={sortDir} onSort={toggleSort} />
                <Th2></Th2>
                <Th2></Th2>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c, i) => (
                <CarrierRow
                  key={c.id}
                  c={c}
                  rank={i + 1}
                  isSelected={selectedId === c.id}
                  onClick={() => setSelectedId(prev => prev === c.id ? null : c.id)}
                />
              ))}
            </tbody>
          </table>
        </div>

        {selected && (
          <div className="w-80 shrink-0 overflow-hidden">
            <CarrierDetailPanel c={selected} onClose={() => setSelectedId(null)} />
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Table helpers ─────────────────────────────────────────────────────────────

function Th2({ children }: { children: React.ReactNode }) {
  return (
    <th className="px-4 py-3 text-left text-xxs font-semibold uppercase tracking-wide text-slate-400 whitespace-nowrap">
      {children}
    </th>
  )
}

function SortableTh({ label, sortKey, current, dir, onSort }: {
  label: string
  sortKey: SortKey
  current: SortKey
  dir: 'asc' | 'desc'
  onSort: (k: SortKey) => void
}) {
  const active = current === sortKey
  return (
    <th
      className="px-4 py-3 text-left text-xxs font-semibold uppercase tracking-wide text-slate-400 whitespace-nowrap cursor-pointer hover:text-slate-600 select-none"
      onClick={() => onSort(sortKey)}
    >
      <span className="flex items-center gap-1">
        {label}
        <span className={cn('text-slate-300', active && 'text-blue-500')}>
          {active ? (dir === 'desc' ? '↓' : '↑') : '↕'}
        </span>
      </span>
    </th>
  )
}
