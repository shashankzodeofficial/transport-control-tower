import React, { useState, useMemo, useRef } from 'react'
import {
  CheckCircle2, Clock, Circle, X, Search,
  ArrowRight, MapPin, Package, ChevronRight,
  AlertTriangle, Activity, TrendingUp,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useFilters } from '@/context/FilterContext'
import { routeOriginRegion, matchesDateRange } from '@/lib/exportCsv'
import {
  DISPATCH_LIFECYCLES, LIFECYCLE_STAGES, STAGE_LABEL, STAGE_SHORT,
  STAGE_PHASE, PHASE_STYLE, SLA_STYLE, SLA_LABEL,
  stageTimestamp, stageCompletionPct, originToDestMins, totalLifecycleMins, fmtMins,
  type DispatchTimeline, type LifecycleStatus, type Phase,
} from './mock/data'

// ─── Phase header labels ────────────────────────────────────────────────────────

const PHASE_LABELS: { phase: Phase; label: string; stages: LifecycleStatus[] }[] = [
  { phase: 'origin',      label: 'ORIGIN OPERATIONS',      stages: ['planned','ready','gate_in_origin','loading','gate_out_origin'] },
  { phase: 'transit',     label: 'IN TRANSIT',              stages: ['dispatched','in_transit','arrived_dest'] },
  { phase: 'destination', label: 'DESTINATION OPERATIONS',  stages: ['gate_in_dest','dock_assigned','unloading','received'] },
  { phase: 'complete',    label: 'CLOSURE',                 stages: ['reconciled','closed'] },
]

// ─── SLA badge ────────────────────────────────────────────────────────────────

function SlaBadge({ status }: { status: string }) {
  const s = SLA_STYLE[status]
  return (
    <span className={cn('flex items-center gap-1 rounded-full px-2 py-0.5 text-xxs font-bold', s.bg, s.text)}>
      <span className={cn('h-1.5 w-1.5 rounded-full', s.dot)} />
      {SLA_LABEL[status]}
    </span>
  )
}

// ─── Mini timeline strip (per row in kanban / list) ───────────────────────────

function MiniTimeline({ dispatch }: { dispatch: DispatchTimeline }) {
  const currentIdx = LIFECYCLE_STAGES.indexOf(dispatch.status)
  const pct = stageCompletionPct(dispatch)

  return (
    <div className="mt-2">
      {/* Progress bar */}
      <div className="h-1.5 w-full rounded-full bg-slate-200 overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all',
            dispatch.slaStatus === 'breached' ? 'bg-red-500' :
            dispatch.slaStatus === 'at_risk'  ? 'bg-amber-500' :
            'bg-blue-500',
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="flex justify-between mt-1">
        <span className="text-xxs text-slate-400">Planned</span>
        <span className="text-xxs font-semibold text-slate-600">{pct}% · {STAGE_LABEL[dispatch.status]}</span>
        <span className="text-xxs text-slate-400">Closed</span>
      </div>
    </div>
  )
}

// ─── Full timeline detail ─────────────────────────────────────────────────────

function TimelineDetail({ dispatch, onClose }: { dispatch: DispatchTimeline; onClose: () => void }) {
  const currentIdx  = LIFECYCLE_STAGES.indexOf(dispatch.status)
  const transitMins = originToDestMins(dispatch)
  const cycleMins   = totalLifecycleMins(dispatch)

  return (
    <div className="flex flex-1 flex-col bg-white overflow-hidden">
      {/* Header */}
      <div className="flex items-start justify-between border-b border-slate-200 px-5 py-4 shrink-0">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-sm font-bold text-slate-900">{dispatch.dispatchId}</span>
            <SlaBadge status={dispatch.slaStatus} />
          </div>
          <p className="text-xs text-slate-500 font-mono">{dispatch.vehicleNumber} · {dispatch.carrier}</p>
        </div>
        <button onClick={onClose} className="rounded-lg p-1.5 hover:bg-slate-100 shrink-0">
          <X size={14} className="text-slate-400" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
        {/* Route + HUs */}
        <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
          <p className="text-xxs font-semibold uppercase tracking-wide text-slate-400 mb-2">{dispatch.routeCode}</p>
          <div className="flex items-center gap-2 text-xs">
            <MapPin size={11} className="text-green-500 shrink-0" />
            <span className="text-slate-600 truncate">{dispatch.origin}</span>
            <ArrowRight size={11} className="text-slate-300 shrink-0" />
            <MapPin size={11} className="text-red-500 shrink-0" />
            <span className="text-slate-600 truncate">{dispatch.destination}</span>
          </div>
          <div className="mt-2 flex items-center gap-2">
            <Package size={11} className="text-slate-400" />
            <span className="text-xs text-slate-600">{dispatch.plannedHUs} HUs planned</span>
          </div>
        </div>

        {/* Completion bar */}
        <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xxs font-semibold uppercase tracking-wide text-slate-400">Lifecycle Progress</p>
            <span className="text-xs font-bold text-slate-700">{stageCompletionPct(dispatch)}%</span>
          </div>
          <div className="h-2 w-full rounded-full bg-slate-200 overflow-hidden">
            <div
              className={cn('h-full rounded-full',
                dispatch.slaStatus === 'breached' ? 'bg-red-500' :
                dispatch.slaStatus === 'at_risk'  ? 'bg-amber-500' :
                'bg-blue-500',
              )}
              style={{ width: `${stageCompletionPct(dispatch)}%` }}
            />
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-xxs text-slate-400">Planned</span>
            <span className="text-xxs text-blue-700 font-bold">{STAGE_LABEL[dispatch.status]}</span>
            <span className="text-xxs text-slate-400">Closed</span>
          </div>
        </div>

        {/* 14-stage timeline */}
        <div>
          <p className="text-xxs font-semibold uppercase tracking-wide text-slate-400 mb-3">14-Stage Timestamp Log</p>
          <div className="space-y-0">
            {PHASE_LABELS.map(ph => (
              <div key={ph.phase} className="mb-1">
                {/* Phase header */}
                <div className={cn('flex items-center gap-2 py-1.5 px-3 rounded-t-lg text-xxs font-bold tracking-wide', PHASE_STYLE[ph.phase].light)}>
                  <span className={cn('h-1.5 w-1.5 rounded-full', PHASE_STYLE[ph.phase].bg)} />
                  {ph.label}
                </div>
                {/* Stages in this phase */}
                <div className="border-x border-b border-slate-100 rounded-b-lg overflow-hidden">
                  {ph.stages.map((stage, si) => {
                    const stageIdx  = LIFECYCLE_STAGES.indexOf(stage)
                    const done      = stageIdx < currentIdx
                    const active    = stageIdx === currentIdx
                    const future    = stageIdx > currentIdx
                    const ts        = stageTimestamp(dispatch, stage)

                    return (
                      <div
                        key={stage}
                        className={cn(
                          'flex items-center gap-3 px-3 py-2.5 border-b border-slate-50 last:border-0',
                          active ? 'bg-blue-50' : done ? 'bg-white' : 'bg-slate-50/50',
                        )}
                      >
                        {/* Step number + icon */}
                        <div className={cn(
                          'flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xxs font-bold',
                          done   ? 'bg-green-500 text-white' :
                          active ? 'bg-blue-600 text-white ring-2 ring-blue-200' :
                                   'bg-slate-200 text-slate-400',
                        )}>
                          {done ? <CheckCircle2 size={12} /> : stageIdx + 1}
                        </div>

                        {/* Label */}
                        <span className={cn('flex-1 text-xs font-medium',
                          done   ? 'text-slate-700' :
                          active ? 'text-blue-800 font-bold' :
                                   'text-slate-400',
                        )}>
                          {STAGE_LABEL[stage]}
                        </span>

                        {/* Timestamp */}
                        <span className={cn('text-xs tabular-nums font-mono',
                          done || active ? 'text-slate-700' : 'text-slate-300',
                        )}>
                          {ts
                            ? new Date(ts).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false })
                            : '—:——'}
                        </span>

                        {active && (
                          <span className="shrink-0 rounded-full bg-blue-100 px-2 py-0.5 text-xxs font-bold text-blue-700">NOW</span>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Computed metrics */}
        <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
          <p className="text-xxs font-semibold uppercase tracking-wide text-slate-400 mb-3">Lifecycle Metrics</p>
          <div className="space-y-2.5">
            {[
              { label: 'Transit Time',      value: transitMins !== null ? fmtMins(transitMins) : null, note: 'Gate Out Origin → Arrived Dest.',  warn: transitMins !== null && transitMins > 900 },
              { label: 'Total Cycle Time',  value: cycleMins  !== null ? fmtMins(cycleMins)  : null,  note: 'Planned → Closed',                warn: cycleMins  !== null && cycleMins  > 2880 },
            ].map(m => (
              <div key={m.label} className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-600">{m.label}</p>
                  <p className="text-xxs text-slate-400">{m.note}</p>
                </div>
                <span className={cn('text-sm font-bold tabular-nums', m.value ? (m.warn ? 'text-red-600' : 'text-green-600') : 'text-slate-300')}>
                  {m.value ?? '—'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Planned milestones */}
        <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
          <p className="text-xxs font-semibold uppercase tracking-wide text-slate-400 mb-2">Planned vs Actual</p>
          <div className="space-y-2">
            {[
              {
                label: 'Dispatch',
                planned: dispatch.plannedDispatch,
                actual: dispatch.dispatchedAt,
              },
              {
                label: 'Arrival',
                planned: dispatch.plannedArrival,
                actual: dispatch.arrivedDestAt,
              },
            ].map(row => {
              const planDate   = new Date(row.planned)
              const actualDate = row.actual ? new Date(row.actual) : null
              const diffMins   = actualDate ? Math.round((actualDate.getTime() - planDate.getTime()) / 60000) : null
              return (
                <div key={row.label} className="flex items-center justify-between">
                  <span className="text-xs text-slate-500 w-16">{row.label}</span>
                  <span className="text-xs font-mono text-slate-600">
                    {planDate.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false })}
                  </span>
                  <span className="text-xxs text-slate-300">→</span>
                  <span className="text-xs font-mono text-slate-700">
                    {actualDate
                      ? actualDate.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false })
                      : '—'}
                  </span>
                  {diffMins !== null && (
                    <span className={cn('text-xxs font-bold tabular-nums',
                      diffMins > 0 ? 'text-red-600' : 'text-green-600',
                    )}>
                      {diffMins > 0 ? `+${diffMins}m` : `${diffMins}m`}
                    </span>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {dispatch.remarks && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
            <p className="text-xxs font-bold text-amber-700 mb-1">Remarks</p>
            <p className="text-xs text-amber-800 leading-relaxed">{dispatch.remarks}</p>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Row in table view ────────────────────────────────────────────────────────

function LifecycleRow({ dispatch, isSelected, onClick }: {
  dispatch: DispatchTimeline
  isSelected: boolean
  onClick: () => void
}) {
  const phase = STAGE_PHASE[dispatch.status]
  const ps    = PHASE_STYLE[phase]
  const pct   = stageCompletionPct(dispatch)

  return (
    <tr
      onClick={onClick}
      className={cn(
        'cursor-pointer border-b border-slate-100 transition-colors group',
        isSelected ? 'bg-blue-50' :
        dispatch.slaStatus === 'breached' ? 'bg-red-50/40 hover:bg-red-50' :
        dispatch.slaStatus === 'at_risk'  ? 'bg-amber-50/40 hover:bg-amber-50' :
        'hover:bg-slate-50',
      )}
    >
      {/* Dispatch ID */}
      <td className="px-4 py-3">
        <p className="text-xs font-bold text-slate-800">{dispatch.dispatchId}</p>
        <p className="text-xxs font-mono text-slate-400">{dispatch.vehicleNumber}</p>
      </td>

      {/* Route */}
      <td className="px-4 py-3 text-xs text-slate-600">
        <p className="font-semibold text-slate-700">{dispatch.routeCode}</p>
        <p className="text-slate-400 text-xxs truncate max-w-[140px]">{dispatch.origin.split('(')[0].trim()} → {dispatch.destination.split('(')[0].trim()}</p>
      </td>

      {/* Current stage + phase */}
      <td className="px-4 py-3">
        <span className={cn('rounded-full px-2.5 py-1 text-xxs font-bold border', ps.light)}>
          {STAGE_LABEL[dispatch.status]}
        </span>
        <p className="text-xxs text-slate-400 mt-1 capitalize">{phase} phase</p>
      </td>

      {/* Progress bar */}
      <td className="px-4 py-3 w-36">
        <div className="flex items-center gap-2">
          <div className="flex-1 h-1.5 rounded-full bg-slate-200 overflow-hidden">
            <div
              className={cn('h-full rounded-full',
                dispatch.slaStatus === 'breached' ? 'bg-red-500' :
                dispatch.slaStatus === 'at_risk'  ? 'bg-amber-500' :
                'bg-blue-500',
              )}
              style={{ width: `${pct}%` }}
            />
          </div>
          <span className="text-xxs tabular-nums text-slate-500 shrink-0">{pct}%</span>
        </div>
      </td>

      {/* SLA */}
      <td className="px-4 py-3"><SlaBadge status={dispatch.slaStatus} /></td>

      {/* Carrier */}
      <td className="px-4 py-3 text-xs text-slate-500 truncate max-w-[120px]">{dispatch.carrier}</td>

      {/* HUs */}
      <td className="px-4 py-3 text-xs text-slate-700 tabular-nums">{dispatch.plannedHUs}</td>

      <td className="px-4 py-3 text-right">
        <ChevronRight size={14} className={cn('transition-transform', isSelected ? 'text-blue-500' : 'text-slate-300 group-hover:text-slate-400')} />
      </td>
    </tr>
  )
}

// ─── Kanban column ────────────────────────────────────────────────────────────

function KanbanCard({ dispatch, isSelected, onClick }: {
  dispatch: DispatchTimeline; isSelected: boolean; onClick: () => void
}) {
  const phase = STAGE_PHASE[dispatch.status]
  const ps    = PHASE_STYLE[phase]

  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full text-left rounded-xl border-2 p-3 transition-all mb-2',
        isSelected ? 'border-blue-500 bg-blue-50 shadow-md' :
        dispatch.slaStatus === 'breached' ? 'border-red-300 bg-red-50' :
        dispatch.slaStatus === 'at_risk'  ? 'border-amber-300 bg-amber-50/60' :
        'border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm',
      )}
    >
      <div className="flex items-start justify-between mb-1.5">
        <p className="text-xxs font-bold text-slate-700">{dispatch.dispatchId}</p>
        <SlaBadge status={dispatch.slaStatus} />
      </div>
      <p className="font-mono text-xs font-semibold text-slate-800 mb-0.5">{dispatch.vehicleNumber}</p>
      <p className="text-xxs text-slate-500 truncate mb-2">{dispatch.routeCode} · {dispatch.carrier.split(' ')[0]}</p>
      <div className="flex items-center gap-2">
        <Package size={10} className="text-slate-400" />
        <span className="text-xxs text-slate-500">{dispatch.plannedHUs} HUs</span>
      </div>
      <MiniTimeline dispatch={dispatch} />
    </button>
  )
}

// ─── Main page ─────────────────────────────────────────────────────────────────

type ViewMode = 'table' | 'kanban'
type FilterPhase = Phase | 'all'

export function DispatchLifecycle() {
  const [dispatches] = useState<DispatchTimeline[]>(DISPATCH_LIFECYCLES)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [view, setView]             = useState<ViewMode>('table')
  const [phaseFilter, setPhaseFilter] = useState<FilterPhase>('all')
  const [slaFilter, setSlaFilter]   = useState<'all' | 'on_time' | 'at_risk' | 'breached'>('all')
  const [search, setSearch]         = useState('')
  const kanbanRef = useRef<HTMLDivElement>(null)

  const { filters } = useFilters()
  const { region, dateRange } = filters

  // Base dispatches after global region + date filter
  const baseDispatches = useMemo(() =>
    dispatches.filter(d => {
      if (region && routeOriginRegion(d.routeCode) !== region) return false
      if (d.plannedAt && !matchesDateRange(d.plannedAt, dateRange.from, dateRange.to)) return false
      return true
    }),
    [dispatches, region, dateRange],
  )

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return baseDispatches.filter(d => {
      if (phaseFilter !== 'all' && STAGE_PHASE[d.status] !== phaseFilter) return false
      if (slaFilter !== 'all' && d.slaStatus !== slaFilter) return false
      if (!q) return true
      return (
        d.dispatchId.toLowerCase().includes(q) ||
        d.vehicleNumber.toLowerCase().includes(q) ||
        d.routeCode.toLowerCase().includes(q) ||
        d.carrier.toLowerCase().includes(q) ||
        d.origin.toLowerCase().includes(q) ||
        d.destination.toLowerCase().includes(q)
      )
    })
  }, [baseDispatches, phaseFilter, slaFilter, search])

  const selected = selectedId ? dispatches.find(d => d.id === selectedId) ?? null : null

  const kpis = useMemo(() => ({
    total:    baseDispatches.length,
    origin:   baseDispatches.filter(d => STAGE_PHASE[d.status] === 'origin').length,
    transit:  baseDispatches.filter(d => STAGE_PHASE[d.status] === 'transit').length,
    dest:     baseDispatches.filter(d => STAGE_PHASE[d.status] === 'destination').length,
    complete: baseDispatches.filter(d => STAGE_PHASE[d.status] === 'complete').length,
    atRisk:   baseDispatches.filter(d => d.slaStatus === 'at_risk').length,
    breached: baseDispatches.filter(d => d.slaStatus === 'breached').length,
  }), [baseDispatches])

  // Group for kanban
  const kanbanGroups = useMemo(() => LIFECYCLE_STAGES.map(stage => ({
    stage,
    items: filtered.filter(d => d.status === stage),
  })).filter(g => g.items.length > 0), [filtered])

  return (
    <div className="flex flex-col h-full bg-slate-50">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4 shrink-0">
        <div>
          <h1 className="text-lg font-bold text-slate-900">Dispatch Lifecycle Tracker</h1>
          <p className="text-xs text-slate-400">End-to-end 14-stage visibility · Origin → Transit → Destination → Closure</p>
        </div>
        {/* View toggle */}
        <div className="flex rounded-lg border border-slate-200 overflow-hidden">
          {(['table','kanban'] as ViewMode[]).map(v => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={cn('px-3 py-1.5 text-xs font-semibold capitalize transition-colors',
                view === v ? 'bg-slate-800 text-white' : 'bg-white text-slate-600 hover:bg-slate-50')}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-7 gap-3 border-b border-slate-200 bg-white px-6 py-4 shrink-0">
        {[
          { label: 'Total Active', value: kpis.total,   color: 'text-slate-700',  bg: 'bg-slate-50  border-slate-100',   onClick: () => { setPhaseFilter('all'); setSlaFilter('all') } },
          { label: 'Origin Phase', value: kpis.origin,  color: 'text-blue-700',   bg: 'bg-blue-50   border-blue-100',    onClick: () => setPhaseFilter('origin')      },
          { label: 'In Transit',   value: kpis.transit, color: 'text-amber-700',  bg: 'bg-amber-50  border-amber-100',   onClick: () => setPhaseFilter('transit')     },
          { label: 'Dest. Phase',  value: kpis.dest,    color: 'text-violet-700', bg: 'bg-violet-50 border-violet-100',  onClick: () => setPhaseFilter('destination') },
          { label: 'Closed Today', value: kpis.complete,color: 'text-green-700',  bg: 'bg-green-50  border-green-100',   onClick: () => setPhaseFilter('complete')    },
          { label: 'At Risk',      value: kpis.atRisk,  color: 'text-amber-700',  bg: 'bg-amber-50  border-amber-100',   onClick: () => setSlaFilter('at_risk')       },
          { label: 'SLA Breached', value: kpis.breached,color: 'text-red-700',    bg: 'bg-red-50    border-red-100',     onClick: () => setSlaFilter('breached')      },
        ].map(k => (
          <button key={k.label} onClick={k.onClick} className={cn('rounded-xl border px-3 py-3 text-left hover:shadow-sm transition-all', k.bg)}>
            <p className="text-xxs font-semibold uppercase tracking-wide text-slate-400 mb-1">{k.label}</p>
            <p className={cn('text-2xl font-bold tabular-nums', k.color)}>{k.value}</p>
          </button>
        ))}
      </div>

      {/* Phase legend bar */}
      <div className="border-b border-slate-200 bg-white px-6 py-2.5 shrink-0">
        <div className="flex items-center gap-6">
          {/* Phase filter buttons */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setPhaseFilter('all')}
              className={cn('rounded-full px-3 py-1 text-xs font-medium transition-colors',
                phaseFilter === 'all' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200')}
            >
              All Phases
            </button>
            {(['origin','transit','destination','complete'] as Phase[]).map(p => (
              <button
                key={p}
                onClick={() => setPhaseFilter(p)}
                className={cn('rounded-full px-3 py-1 text-xs font-medium capitalize transition-colors',
                  phaseFilter === p ? cn(PHASE_STYLE[p].bg, 'text-white') : 'bg-slate-100 text-slate-600 hover:bg-slate-200')}
              >
                {p === 'destination' ? 'Destination' : p.charAt(0).toUpperCase() + p.slice(1)}
              </button>
            ))}
          </div>

          <div className="h-4 w-px bg-slate-200" />

          {/* SLA filter */}
          <div className="flex items-center gap-1.5">
            {(['all','on_time','at_risk','breached'] as const).map(s => (
              <button
                key={s}
                onClick={() => setSlaFilter(s)}
                className={cn('rounded-full px-2.5 py-1 text-xxs font-bold capitalize transition-colors',
                  slaFilter === s
                    ? s === 'all' ? 'bg-slate-800 text-white' : cn(SLA_STYLE[s]?.bg ?? '', SLA_STYLE[s]?.text ?? '')
                    : 'bg-slate-100 text-slate-500 hover:bg-slate-200')}
              >
                {s === 'all' ? 'All SLA' : SLA_LABEL[s]}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative ml-auto">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search dispatch / vehicle…"
              className="w-52 rounded-lg border border-slate-200 bg-slate-50 pl-8 pr-3 py-1.5 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
            {search && <button onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2"><X size={12} className="text-slate-400" /></button>}
          </div>

          <span className="shrink-0 text-xxs text-slate-400">{filtered.length} dispatches</span>
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Main content */}
        <div className="flex-1 overflow-auto">
          {view === 'table' ? (
            /* ── Table view ─────────────────────────────────────────────────── */
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-slate-50 border-b border-slate-200 z-10">
                <tr>
                  {['Dispatch ID','Route','Current Stage','Progress','SLA','Carrier','HUs',''].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xxs font-semibold uppercase tracking-wide text-slate-400">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={8} className="py-16 text-center text-sm text-slate-400">No dispatches match</td></tr>
                ) : filtered.map(d => (
                  <LifecycleRow
                    key={d.id}
                    dispatch={d}
                    isSelected={selectedId === d.id}
                    onClick={() => setSelectedId(prev => prev === d.id ? null : d.id)}
                  />
                ))}
              </tbody>
            </table>
          ) : (
            /* ── Kanban view ────────────────────────────────────────────────── */
            <div ref={kanbanRef} className="flex gap-3 p-4 overflow-x-auto h-full items-start">
              {LIFECYCLE_STAGES.map(stage => {
                const items = filtered.filter(d => d.status === stage)
                const phase = STAGE_PHASE[stage]
                const ps    = PHASE_STYLE[phase]

                return (
                  <div key={stage} className="w-56 shrink-0 flex flex-col">
                    {/* Column header */}
                    <div className={cn('flex items-center justify-between rounded-t-xl px-3 py-2 border', ps.light)}>
                      <span className="text-xxs font-bold truncate">{STAGE_LABEL[stage]}</span>
                      <span className={cn('rounded-full w-5 h-5 flex items-center justify-center text-xxs font-bold shrink-0', ps.bg, 'text-white')}>
                        {items.length}
                      </span>
                    </div>
                    {/* Cards */}
                    <div className="rounded-b-xl bg-slate-100/60 border border-t-0 border-slate-200 p-2 min-h-[80px] flex-1">
                      {items.length === 0
                        ? <p className="text-center text-xxs text-slate-300 py-4">—</p>
                        : items.map(d => (
                          <KanbanCard
                            key={d.id}
                            dispatch={d}
                            isSelected={selectedId === d.id}
                            onClick={() => setSelectedId(prev => prev === d.id ? null : d.id)}
                          />
                        ))}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Detail panel */}
        {selected && (
          <div className="w-[420px] shrink-0 flex flex-col border-l border-slate-200">
            <TimelineDetail
              dispatch={selected}
              onClose={() => setSelectedId(null)}
            />
          </div>
        )}
      </div>
    </div>
  )
}
