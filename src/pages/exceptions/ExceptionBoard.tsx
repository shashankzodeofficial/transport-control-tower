import React, { useState, useMemo } from 'react'
import {
  AlertTriangle, CheckCircle2, Clock, TrendingUp,
  Search, Filter, ChevronRight, User, MessageSquare,
  Zap, X, RefreshCw, Download, CircleDot, Plus,
} from 'lucide-react'
import { cn, timeAgo } from '@/lib/utils'
import { exportCsv } from '@/lib/exportCsv'
import { useActiveFilters } from '@/hooks/useActiveFilters'
import { SeverityBadge } from '@/components/badges/SeverityBadge'
import { KPICard }       from '@/components/kpi/KPICard'
import { DonutChart }    from '@/components/charts/DonutChart'
import { BarChart }      from '@/components/charts/BarChart'
import { LineChart }     from '@/components/charts/LineChart'
import { SLAClock }      from '@/components/shared/SLAClock'
import { TabStrip }      from '@/layout/TabStrip'
import {
  EXCEPTIONS, EXC_KPI, EXC_TREND_7D, EXC_BY_CATEGORY, ASSIGNEES,
} from './mock/data'
import type { FullException, ExcComment } from './mock/data'
import type { ExceptionState } from '@/types'

// ─── Status config ────────────────────────────────────────────────────────────

const STATUS_STYLE: Record<ExceptionState, string> = {
  OPEN:          'bg-red-100 text-red-700',
  ASSIGNED:      'bg-blue-100 text-blue-700',
  IN_PROGRESS:   'bg-violet-100 text-violet-700',
  ESCALATED:     'bg-orange-100 text-orange-700',
  PENDING_INFO:  'bg-amber-100 text-amber-700',
  RESOLVED:      'bg-green-100 text-green-700',
  CLOSED:        'bg-slate-100 text-slate-500',
  AUTO_RESOLVED: 'bg-slate-100 text-slate-500',
}

const COMMENT_STYLE = {
  note:       'border-l-blue-400 bg-blue-50',
  escalation: 'border-l-orange-400 bg-orange-50',
  resolution: 'border-l-green-400 bg-green-50',
  system:     'border-l-slate-300 bg-slate-50',
}

// ─── Status tabs ──────────────────────────────────────────────────────────────

const STATUS_TABS = [
  { key: 'all',        label: 'All'         },
  { key: 'open',       label: 'Open'        },
  { key: 'progress',   label: 'In Progress' },
  { key: 'escalated',  label: 'Escalated'   },
  { key: 'resolved',   label: 'Resolved'    },
]

function filterByTab(excs: FullException[], tab: string) {
  if (tab === 'open')      return excs.filter(e => ['OPEN','ASSIGNED','PENDING_INFO'].includes(e.status))
  if (tab === 'progress')  return excs.filter(e => e.status === 'IN_PROGRESS')
  if (tab === 'escalated') return excs.filter(e => e.status === 'ESCALATED')
  if (tab === 'resolved')  return excs.filter(e => ['RESOLVED','CLOSED','AUTO_RESOLVED'].includes(e.status))
  return excs
}

// ─── Comment thread ────────────────────────────────────────────────────────────

function CommentThread({ comments }: { comments: ExcComment[] }) {
  if (comments.length === 0) {
    return <p className="text-xs text-slate-400 italic py-2">No comments yet.</p>
  }
  return (
    <div className="space-y-2.5">
      {comments.map(c => (
        <div key={c.id} className={cn('border-l-2 pl-3 py-2 rounded-r-lg text-xs', COMMENT_STYLE[c.type])}>
          <div className="flex items-center gap-2 mb-0.5">
            <span className="font-semibold text-slate-700">{c.author}</span>
            <span className="text-slate-400">{timeAgo(c.at)}</span>
            <span className={cn(
              'ml-auto rounded-full px-2 py-0.5 text-xxs font-medium capitalize',
              c.type === 'escalation' ? 'bg-orange-100 text-orange-700' :
              c.type === 'resolution' ? 'bg-green-100 text-green-700' :
              c.type === 'system'     ? 'bg-slate-100 text-slate-500' :
              'bg-blue-50 text-blue-600',
            )}>
              {c.type}
            </span>
          </div>
          <p className="text-slate-600">{c.text}</p>
        </div>
      ))}
    </div>
  )
}

// ─── Exception detail panel ───────────────────────────────────────────────────

function ExceptionDetail({ ex, onClose }: { ex: FullException; onClose: () => void }) {
  return (
    <div className="flex flex-1 flex-col bg-white overflow-hidden">
      {/* Header */}
      <div className="flex items-start justify-between border-b border-slate-100 px-5 py-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono text-sm font-bold text-slate-800">{ex.id}</span>
            <SeverityBadge severity={ex.severity} size="sm" />
            <span className={cn('rounded-full px-2 py-0.5 text-xxs font-bold', STATUS_STYLE[ex.status])}>
              {ex.status.replace('_', ' ')}
            </span>
          </div>
          <p className="text-sm font-semibold text-slate-700">{ex.category}
            {ex.subcategory && <span className="ml-1 font-normal text-slate-400">— {ex.subcategory}</span>}
          </p>
        </div>
        <button onClick={onClose} className="rounded-lg p-1.5 hover:bg-slate-100 transition-colors">
          <X size={14} className="text-slate-400" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
        {/* Dispatch / route info */}
        <Section title="Dispatch Info">
          <Row label="Dispatch"  value={<span className="font-mono font-semibold text-blue-700">{ex.dispatchId}</span>} />
          <Row label="Route"     value={`${ex.routeCode} — ${ex.routeName}`} />
          <Row label="Carrier"   value={ex.carrier} />
          <Row label="Vehicle"   value={ex.vehicleReg} />
          <Row label="Origin"    value={ex.origin} />
          <Row label="Destination" value={ex.destination} />
        </Section>

        {/* SLA */}
        {ex.slaBreachAt && !['RESOLVED','CLOSED','AUTO_RESOLVED'].includes(ex.status) && (
          <Section title="SLA">
            <SLAClock
              hoursRemaining={(new Date(ex.slaBreachAt).getTime() - Date.now()) / 3600000}
              totalHours={24}
              variant="bar"
            />
          </Section>
        )}

        {/* Assignment */}
        <Section title="Assignment">
          <Row label="Assigned To" value={
            ex.assignee
              ? <span className="flex items-center gap-1"><User size={11} />{ex.assignee}</span>
              : <span className="text-slate-400 italic">Unassigned</span>
          } />
          {ex.assigneeTeam && <Row label="Team" value={ex.assigneeTeam} />}
          <Row label="Escalation"  value={
            ex.escalationLevel > 0
              ? <span className="font-semibold text-orange-600">Level {ex.escalationLevel}</span>
              : <span className="text-slate-400">None</span>
          } />
          {ex.financialImpact && (
            <Row label="Financial Impact" value={<span className="font-semibold text-red-600">₹{ex.financialImpact.toLocaleString()}</span>} />
          )}
        </Section>

        {/* Root cause / resolution */}
        {ex.rootCause && (
          <Section title="Root Cause">
            <p className="text-xs text-slate-600 leading-relaxed">{ex.rootCause}</p>
          </Section>
        )}
        {ex.resolutionNote && (
          <Section title="Resolution">
            <p className="text-xs text-green-700 leading-relaxed">{ex.resolutionNote}</p>
            {ex.resolutionTime && <p className="text-xxs text-slate-400 mt-1">Resolved in {Math.round(ex.resolutionTime / 60)}h {ex.resolutionTime % 60}m</p>}
          </Section>
        )}

        {/* Tags */}
        {ex.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {ex.tags.map(tag => (
              <span key={tag} className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xxs font-medium text-slate-600">
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Comment thread */}
        <div>
          <p className="mb-2 text-xxs font-semibold uppercase tracking-wide text-slate-400">
            Activity ({ex.comments.length})
          </p>
          <CommentThread comments={ex.comments} />
        </div>
      </div>

      {/* Footer actions */}
      <div className="border-t border-slate-100 px-5 py-3 flex gap-2">
        {!ex.assignee && (
          <button className="flex-1 rounded-lg bg-blue-600 py-2 text-xs font-semibold text-white hover:bg-blue-700 transition-colors">
            Assign to Me
          </button>
        )}
        {['OPEN','ASSIGNED','IN_PROGRESS'].includes(ex.status) && (
          <button className="flex-1 rounded-lg bg-orange-600 py-2 text-xs font-semibold text-white hover:bg-orange-700 transition-colors">
            Escalate
          </button>
        )}
        {!['RESOLVED','CLOSED','AUTO_RESOLVED'].includes(ex.status) && (
          <button className="flex-1 rounded-lg bg-green-600 py-2 text-xs font-semibold text-white hover:bg-green-700 transition-colors">
            Resolve
          </button>
        )}
      </div>
    </div>
  )
}

// ─── Exception row ────────────────────────────────────────────────────────────

function ExcRow({ ex, isSelected, onClick }: {
  ex: FullException
  isSelected: boolean
  onClick: () => void
}) {
  const isOverdue = ex.slaBreachAt && new Date(ex.slaBreachAt) < new Date()
  const isClosed  = ['RESOLVED','CLOSED','AUTO_RESOLVED'].includes(ex.status)

  return (
    <tr
      onClick={onClick}
      className={cn(
        'cursor-pointer transition-colors border-b border-slate-100',
        isSelected ? 'bg-blue-50' :
        isOverdue  ? 'bg-red-50/40 hover:bg-red-50' :
        ex.escalationLevel > 1 ? 'bg-orange-50/30 hover:bg-orange-50' :
        'hover:bg-slate-50',
      )}
    >
      <td className="px-4 py-3 font-mono text-xs font-semibold text-slate-700">{ex.id}</td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <SeverityBadge severity={ex.severity} size="sm" />
          <span className="text-xs font-medium text-slate-700">{ex.category}</span>
        </div>
        {ex.subcategory && <p className="text-xxs text-slate-400 mt-0.5 ml-7">{ex.subcategory}</p>}
      </td>
      <td className="px-4 py-3 text-xs text-slate-600">{ex.dispatchId}</td>
      <td className="px-4 py-3 text-xs text-slate-500 max-w-[120px] truncate">{ex.carrier}</td>
      <td className="px-4 py-3">
        <span className={cn('rounded-full px-2.5 py-0.5 text-xxs font-bold', STATUS_STYLE[ex.status])}>
          {ex.status.replace('_', ' ')}
        </span>
      </td>
      <td className="px-4 py-3">
        {ex.assignee
          ? <span className="flex items-center gap-1 text-xs text-slate-600"><User size={10} className="text-slate-400" />{ex.assignee.split(' ')[0]}</span>
          : <span className="text-xs text-slate-300 italic">—</span>
        }
      </td>
      <td className="px-4 py-3 text-xs text-slate-500">{timeAgo(ex.raisedAt)}</td>
      <td className="px-4 py-3">
        {!isClosed && ex.slaBreachAt ? (
          <SLAClock
            hoursRemaining={(new Date(ex.slaBreachAt).getTime() - Date.now()) / 3600000}
            totalHours={24}
            variant="compact"
          />
        ) : (
          <span className="text-xs text-slate-300">—</span>
        )}
      </td>
      <td className="px-4 py-3">
        {ex.escalationLevel > 0 && (
          <span className="rounded-full bg-orange-100 px-2 py-0.5 text-xxs font-bold text-orange-700">L{ex.escalationLevel}</span>
        )}
      </td>
      <td className="px-4 py-3">
        {ex.financialImpact
          ? <span className="text-xs font-semibold text-red-600">₹{(ex.financialImpact/1000).toFixed(0)}K</span>
          : <span className="text-xs text-slate-300">—</span>
        }
      </td>
      <td className="px-4 py-3 text-right">
        <ChevronRight size={14} className={cn('transition-transform', isSelected ? 'text-blue-500 rotate-90' : 'text-slate-300')} />
      </td>
    </tr>
  )
}

// ─── Raise Exception modal ────────────────────────────────────────────────────

function RaiseExceptionModal({ onClose }: { onClose: () => void }) {
  const [form, setForm] = useState({
    category: '', subcategory: '', dispatchId: '', carrier: '',
    severity: 'MEDIUM', description: '', assignee: '',
  })
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))
  const inCls = 'w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100'

  const CATEGORIES = ['SLA Breach','Delivery Delay','Vehicle Breakdown','Document Issue','Customer Complaint','Damage in Transit','Short Shipment','Address Change','Other']
  const SEVERITIES = ['CRITICAL','HIGH','MEDIUM','LOW']

  return (
    <div className="fixed inset-0 z-modal flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="w-[560px] rounded-2xl bg-white shadow-xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <h2 className="text-base font-bold text-slate-900">Raise New Exception</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 hover:bg-slate-100 transition-colors"><X size={16} className="text-slate-400" /></button>
        </div>
        <div className="grid grid-cols-2 gap-4 px-6 py-5">
          <div>
            <label className="mb-1 block text-xxs font-semibold uppercase tracking-wide text-slate-400">Category *</label>
            <select value={form.category} onChange={e => set('category', e.target.value)} className={inCls}>
              <option value="">Select category…</option>
              {CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xxs font-semibold uppercase tracking-wide text-slate-400">Severity *</label>
            <select value={form.severity} onChange={e => set('severity', e.target.value)} className={inCls}>
              {SEVERITIES.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xxs font-semibold uppercase tracking-wide text-slate-400">Dispatch ID *</label>
            <input value={form.dispatchId} onChange={e => set('dispatchId', e.target.value)} placeholder="D-48291" className={inCls} />
          </div>
          <div>
            <label className="mb-1 block text-xxs font-semibold uppercase tracking-wide text-slate-400">Carrier</label>
            <input value={form.carrier} onChange={e => set('carrier', e.target.value)} placeholder="Carrier name" className={inCls} />
          </div>
          <div>
            <label className="mb-1 block text-xxs font-semibold uppercase tracking-wide text-slate-400">Subcategory</label>
            <input value={form.subcategory} onChange={e => set('subcategory', e.target.value)} placeholder="Optional detail" className={inCls} />
          </div>
          <div>
            <label className="mb-1 block text-xxs font-semibold uppercase tracking-wide text-slate-400">Assign To</label>
            <select value={form.assignee} onChange={e => set('assignee', e.target.value)} className={inCls}>
              <option value="">Unassigned</option>
              {ASSIGNEES.map(a => <option key={a}>{a}</option>)}
            </select>
          </div>
          <div className="col-span-2">
            <label className="mb-1 block text-xxs font-semibold uppercase tracking-wide text-slate-400">Description *</label>
            <textarea value={form.description} onChange={e => set('description', e.target.value)} rows={3} placeholder="Describe the exception in detail…" className={cn(inCls, 'resize-none')} />
          </div>
        </div>
        <div className="flex justify-end gap-2 border-t border-slate-200 px-6 py-4">
          <button onClick={onClose} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">Cancel</button>
          <button
            onClick={() => {
              if (!form.category || !form.dispatchId || !form.description) {
                alert('Please fill in all required fields (*)')
                return
              }
              onClose()
            }}
            className="rounded-lg bg-red-600 px-5 py-2 text-sm font-semibold text-white hover:bg-red-700 transition-colors"
          >
            Raise Exception
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export function ExceptionBoard() {
  const [tab, setTab]               = useState('all')
  const [search, setSearch]         = useState('')
  const [severityFilter, setSeverity] = useState<string>('all')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [showCharts, setShowCharts] = useState(true)
  const [showRaiseModal, setShowRaiseModal] = useState(false)
  const { region, dateRange, matchesCity, matchesDate } = useActiveFilters('ExceptionBoard')

  // Apply global region + date filters first
  const globalFiltered = useMemo(() =>
    EXCEPTIONS.filter(ex =>
      matchesCity(ex.origin) && matchesDate(ex.raisedAt)
    ),
    [region, dateRange],
  )

  const tabbed   = useMemo(() => filterByTab(globalFiltered, tab), [globalFiltered, tab])
  const filtered = useMemo(() => {
    let list = tabbed
    if (severityFilter !== 'all') list = list.filter(e => e.severity === severityFilter)
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(e =>
        e.id.toLowerCase().includes(q) ||
        e.category.toLowerCase().includes(q) ||
        e.dispatchId.toLowerCase().includes(q) ||
        e.carrier.toLowerCase().includes(q) ||
        (e.assignee ?? '').toLowerCase().includes(q),
      )
    }
    return list
  }, [tabbed, severityFilter, search])

  const selected = selectedId ? EXCEPTIONS.find(e => e.id === selectedId) ?? null : null

  // Tab counts reflect global-filtered list (respects region + date)
  const tabsWithBadge = STATUS_TABS.map(t => ({
    ...t,
    badge: t.key === 'all' ? globalFiltered.length : filterByTab(globalFiltered, t.key).length,
  }))

  const donutData = EXC_BY_CATEGORY.map(c => ({ name: c.category, value: c.count, color: c.color }))

  function handleExport() {
    exportCsv(filtered.map(e => ({
      id: e.id, severity: e.severity, category: e.category,
      subcategory: e.subcategory ?? '', dispatch_id: e.dispatchId,
      carrier: e.carrier, status: e.status, assignee: e.assignee ?? '',
      raised_at: e.raisedAt, escalation_level: e.escalationLevel,
      financial_impact: e.financialImpact ?? '',
    })), 'exceptions')
  }

  return (
    <>
    {showRaiseModal && <RaiseExceptionModal onClose={() => setShowRaiseModal(false)} />}
    <div className="flex flex-col h-full bg-slate-50">
      {/* Page header */}
      <div className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
        <div>
          <h1 className="text-lg font-bold text-slate-900">Exception Command Center</h1>
          <p className="text-xs text-slate-400">Monitor, assign and resolve all exceptions in real time</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowCharts(s => !s)}
            className={cn('flex h-8 items-center gap-1.5 rounded-lg border px-3 text-xs font-medium transition-colors',
              showCharts ? 'border-blue-200 bg-blue-50 text-blue-700' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50')}
          >
            <TrendingUp size={13} />Analytics
          </button>
          <button onClick={handleExport} className="flex h-8 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-slate-600 hover:bg-slate-50">
            <Download size={13} />Export
          </button>
          <button onClick={() => setShowRaiseModal(true)} className="flex h-8 items-center gap-1.5 rounded-lg bg-blue-600 px-3 text-xs font-semibold text-white hover:bg-blue-700">
            <AlertTriangle size={13} />Raise Exception
          </button>
        </div>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-6 gap-4 border-b border-slate-200 bg-white px-6 py-4">
        {[
          { label: 'Total Open',       value: EXC_KPI.totalOpen,       status: EXC_KPI.totalOpen > 5 ? 'warning' : 'healthy' as const, icon: CircleDot },
          { label: 'Critical',         value: EXC_KPI.critical,        status: EXC_KPI.critical > 0  ? 'danger'  : 'healthy' as const, icon: AlertTriangle },
          { label: 'SLA Breached',     value: EXC_KPI.slaBreached,     status: EXC_KPI.slaBreached>0 ? 'danger'  : 'healthy' as const, icon: Clock },
          { label: 'Escalated',        value: EXC_KPI.escalated,       status: EXC_KPI.escalated>0   ? 'warning' : 'healthy' as const, icon: Zap },
          { label: 'Resolved Today',   value: EXC_KPI.resolvedToday,   status: 'info' as const,                                        icon: CheckCircle2 },
          { label: 'Avg Resolution',   value: `${EXC_KPI.avgResolutionH}h`, status: 'neutral' as const,                                icon: Clock },
        ].map(k => (
          <div key={k.label} className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
            <div className="flex items-center justify-between mb-1">
              <p className="text-xxs font-semibold uppercase tracking-wide text-slate-400">{k.label}</p>
              <k.icon size={13} className={cn(
                k.status === 'danger'  ? 'text-red-500'   :
                k.status === 'warning' ? 'text-amber-500' :
                k.status === 'info'    ? 'text-blue-500'  :
                'text-slate-400'
              )} />
            </div>
            <p className={cn('text-2xl font-bold tabular-nums',
              k.status === 'danger'  ? 'text-red-600'   :
              k.status === 'warning' ? 'text-amber-600' :
              k.status === 'info'    ? 'text-blue-600'  :
              'text-slate-700'
            )}>
              {k.value}
            </p>
          </div>
        ))}
      </div>

      {/* Analytics panels */}
      {showCharts && (
        <div className="grid grid-cols-3 gap-4 border-b border-slate-200 bg-white px-6 py-4">
          {/* Donut by category */}
          <div className="rounded-xl border border-slate-200 p-4">
            <p className="mb-3 text-xs font-semibold text-slate-700">By Category</p>
            <div className="flex items-center gap-4">
              <DonutChart data={donutData} size={100} />
              <div className="space-y-1 min-w-0">
                {EXC_BY_CATEGORY.slice(0, 5).map(c => (
                  <div key={c.category} className="flex items-center gap-2 text-xxs">
                    <div className="h-2 w-2 rounded-full shrink-0" style={{ background: c.color }} />
                    <span className="text-slate-600 truncate">{c.category}</span>
                    <span className="ml-auto font-semibold tabular-nums text-slate-800">{c.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 7-day trend line */}
          <div className="rounded-xl border border-slate-200 p-4">
            <p className="mb-3 text-xs font-semibold text-slate-700">7-Day Trend</p>
            <LineChart
              data={EXC_TREND_7D}
              xKey="day"
              series={[
                { dataKey: 'opened',   label: 'Opened',   color: '#ef4444' },
                { dataKey: 'resolved', label: 'Resolved', color: '#22c55e' },
                { dataKey: 'escalated',label: 'Escalated',color: '#f97316' },
              ]}
              height={100}
              showGrid
            />
          </div>

          {/* Financial impact by category */}
          <div className="rounded-xl border border-slate-200 p-4">
            <p className="mb-3 text-xs font-semibold text-slate-700">Financial Impact (Open)</p>
            <div className="space-y-2">
              {[
                { label: 'Cold Chain Breach', amt: 120000, color: '#ef4444' },
                { label: 'SLA Breach',        amt: 45000,  color: '#f97316' },
                { label: 'HU Missing',        amt: 28000,  color: '#f59e0b' },
                { label: 'HU Damaged',        amt: 8500,   color: '#eab308' },
                { label: 'Gate Hold',         amt: 5000,   color: '#8b5cf6' },
              ].map(r => (
                <div key={r.label} className="text-xxs">
                  <div className="flex justify-between mb-0.5">
                    <span className="text-slate-600">{r.label}</span>
                    <span className="font-semibold text-slate-800">₹{(r.amt/1000).toFixed(0)}K</span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${(r.amt/120000)*100}%`, background: r.color }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tabs + toolbar */}
      <TabStrip tabs={tabsWithBadge} activeTab={tab} onChange={setTab} variant="page" />

      <div className="flex items-center gap-3 border-b border-slate-200 bg-white px-6 py-2.5">
        <Search size={14} className="text-slate-400 shrink-0" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search ID, category, dispatch, carrier…"
          className="flex-1 bg-transparent text-sm text-slate-700 placeholder:text-slate-400 outline-none"
        />
        {/* Severity pills */}
        <div className="flex items-center gap-1.5 ml-4">
          {['all','critical','high','medium','low'].map(s => (
            <button
              key={s}
              onClick={() => setSeverity(s)}
              className={cn(
                'rounded-full px-3 py-1 text-xs font-medium capitalize transition-colors',
                severityFilter === s
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200',
              )}
            >
              {s}
            </button>
          ))}
        </div>
        <span className="ml-2 text-xs text-slate-400">{filtered.length} result{filtered.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Body: table + detail panel */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Table */}
        <div className="flex-1 overflow-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-slate-50 border-b border-slate-200 z-10">
              <tr>
                {['Exception ID','Category','Dispatch','Carrier','Status','Assignee','Raised','SLA','Escalation','₹ Impact',''].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xxs font-semibold uppercase tracking-wide text-slate-400">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-20 text-center text-sm text-slate-400">
                    <CheckCircle2 size={24} className="mx-auto mb-2 text-green-400" />
                    No exceptions match this filter
                  </td>
                </tr>
              ) : (
                filtered.map(ex => (
                  <ExcRow
                    key={ex.id}
                    ex={ex}
                    isSelected={selectedId === ex.id}
                    onClick={() => setSelectedId(prev => prev === ex.id ? null : ex.id)}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Detail panel */}
        {selected && (
          <div className="w-96 shrink-0 flex flex-col border-l border-slate-200">
            <ExceptionDetail ex={selected} onClose={() => setSelectedId(null)} />
          </div>
        )}
      </div>
    </div>
    </>
  )
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-2 text-xxs font-semibold uppercase tracking-wide text-slate-400">{title}</p>
      <div className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 divide-y divide-slate-100">
        {children}
      </div>
    </div>
  )
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-2 py-1.5">
      <span className="text-xs text-slate-500 shrink-0">{label}</span>
      <span className="text-xs text-slate-800 text-right">{value}</span>
    </div>
  )
}
