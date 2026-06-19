import React, { useState, useMemo } from 'react'
import {
  Bell, AlertCircle, AlertTriangle, Clock,
  CheckCheck, Check, Search, Filter,
  ShieldAlert, RefreshCw, ArrowRight, X,
} from 'lucide-react'
import { cn, timeAgo } from '@/lib/utils'
import { useAlerts } from '@/context/AlertContext'
import type { Alert, AlertType } from '@/types'
import { ALERT_TYPE_LABEL, ALERT_TYPE_COLOR } from './mock/data'

// ─── Config ───────────────────────────────────────────────────────────────────

const SEVERITY_CONFIG = {
  critical: {
    icon:  AlertCircle,
    dot:   'bg-red-500',
    bg:    'bg-red-50 border-red-200',
    badge: 'bg-red-100 text-red-700',
    label: 'Critical',
  },
  high: {
    icon:  AlertTriangle,
    dot:   'bg-amber-500',
    bg:    'bg-amber-50 border-amber-200',
    badge: 'bg-amber-100 text-amber-700',
    label: 'High',
  },
  medium: {
    icon:  Clock,
    dot:   'bg-yellow-400',
    bg:    'bg-yellow-50 border-yellow-200',
    badge: 'bg-yellow-100 text-yellow-700',
    label: 'Medium',
  },
}

const TYPE_ICON: Record<AlertType, React.ComponentType<{ size?: number; className?: string }>> = {
  SLA_BREACH:              Clock,
  HIGH_RISK:               ShieldAlert,
  ESCALATED_EXCEPTION:     AlertTriangle,
  OVERDUE_RECONCILIATION:  RefreshCw,
  INTEGRATION_FAILURE:     X,
}

// ─── Summary strip ────────────────────────────────────────────────────────────

function SummaryStrip({ alerts }: { alerts: Alert[] }) {
  const total    = alerts.length
  const unacked  = alerts.filter(a => !a.acknowledged).length
  const critical = alerts.filter(a => a.severity === 'critical').length
  const high     = alerts.filter(a => a.severity === 'high').length

  const stats = [
    { label: 'Total Alerts',     value: total,    color: 'text-slate-900',   dot: 'bg-slate-400' },
    { label: 'Unacknowledged',   value: unacked,  color: 'text-red-600',     dot: 'bg-red-500'   },
    { label: 'Critical',         value: critical, color: 'text-red-600',     dot: 'bg-red-500'   },
    { label: 'High',             value: high,     color: 'text-amber-600',   dot: 'bg-amber-500' },
  ]

  return (
    <div className="grid grid-cols-4 gap-4">
      {stats.map(s => (
        <div key={s.label} className="rounded-xl border border-slate-200 bg-white p-4 space-y-1.5">
          <div className="flex items-center gap-1.5">
            <span className={cn('h-2 w-2 rounded-full', s.dot)} />
            <span className="text-xxs font-semibold uppercase tracking-wider text-slate-500">{s.label}</span>
          </div>
          <p className={cn('text-3xl font-bold tabular-nums leading-none', s.color)}>{s.value}</p>
        </div>
      ))}
    </div>
  )
}

// ─── Alert Row ────────────────────────────────────────────────────────────────

function AlertRow({
  alert,
  selected,
  onClick,
  onAcknowledge,
}: {
  alert: Alert
  selected: boolean
  onClick: () => void
  onAcknowledge: (id: string) => void
}) {
  const sev    = SEVERITY_CONFIG[alert.severity]
  const Icon   = sev.icon
  const TypeIcon = TYPE_ICON[alert.type]

  return (
    <tr
      onClick={onClick}
      className={cn(
        'cursor-pointer transition-colors',
        selected    ? 'bg-blue-50'  : 'hover:bg-slate-50',
        alert.acknowledged && 'opacity-60',
      )}
    >
      <td className="px-4 py-3.5">
        <div className="flex items-center gap-2">
          <span className={cn('flex h-5 w-5 items-center justify-center rounded-full flex-shrink-0', sev.badge)}>
            <Icon size={11} />
          </span>
          <span className={cn('rounded-full px-2 py-0.5 text-xxs font-semibold', sev.badge)}>
            {sev.label}
          </span>
        </div>
      </td>
      <td className="px-4 py-3.5">
        <span className={cn('rounded-full border px-2 py-0.5 text-xxs font-medium flex items-center gap-1 w-fit', ALERT_TYPE_COLOR[alert.type])}>
          <TypeIcon size={9} />
          {ALERT_TYPE_LABEL[alert.type]}
        </span>
      </td>
      <td className="px-4 py-3.5 max-w-xs">
        <p className="text-xs text-slate-800 leading-relaxed line-clamp-2">{alert.message}</p>
        {alert.dispatchId && (
          <p className="text-xxs text-slate-400 mt-0.5 font-mono">{alert.dispatchId}</p>
        )}
      </td>
      <td className="px-4 py-3.5 text-xxs text-slate-400 whitespace-nowrap">{timeAgo(alert.firedAt)}</td>
      <td className="px-4 py-3.5">
        {alert.acknowledged
          ? <span className="flex items-center gap-1 text-xxs text-green-600"><CheckCheck size={11} /> Acknowledged</span>
          : <span className="text-xxs text-slate-400 italic">Pending</span>
        }
      </td>
      <td className="px-4 py-3.5" onClick={e => e.stopPropagation()}>
        {!alert.acknowledged && (
          <button
            onClick={() => onAcknowledge(alert.id)}
            className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xxs font-medium text-slate-600 hover:border-green-300 hover:bg-green-50 hover:text-green-700 transition-colors"
          >
            <Check size={11} />
            Ack
          </button>
        )}
      </td>
    </tr>
  )
}

// ─── Alert Detail Panel ───────────────────────────────────────────────────────

function AlertDetail({ alert, onAcknowledge, onClose }: { alert: Alert; onAcknowledge: (id: string) => void; onClose: () => void }) {
  const sev = SEVERITY_CONFIG[alert.severity]
  const TypeIcon = TYPE_ICON[alert.type]
  const Icon = sev.icon

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
        <h3 className="text-sm font-bold text-slate-900">Alert Detail</h3>
        <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
          <X size={16} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-5">
        {/* Severity header */}
        <div className={cn('rounded-xl border p-4 space-y-1', sev.bg)}>
          <div className="flex items-center gap-2">
            <Icon size={16} className={sev.badge.split(' ')[1]} />
            <span className={cn('text-sm font-bold', sev.badge.split(' ')[1])}>{sev.label} Alert</span>
            {alert.acknowledged && (
              <span className="ml-auto flex items-center gap-1 text-xxs text-green-600 font-medium">
                <CheckCheck size={11} /> Acknowledged
              </span>
            )}
          </div>
          <p className="text-xs text-slate-700 leading-relaxed">{alert.message}</p>
        </div>

        {/* Metadata */}
        <div className="space-y-2">
          <p className="text-xxs font-semibold uppercase tracking-wide text-slate-400">Details</p>
          <div className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white overflow-hidden">
            {[
              { label: 'Alert ID',   value: alert.id },
              { label: 'Type',       value: ALERT_TYPE_LABEL[alert.type] },
              { label: 'Severity',   value: sev.label },
              { label: 'Fired',      value: new Date(alert.firedAt).toLocaleString('en-IN') },
              ...(alert.dispatchId ? [{ label: 'Dispatch', value: alert.dispatchId }] : []),
              ...(alert.routeCode  ? [{ label: 'Route',    value: alert.routeCode  }] : []),
            ].map(row => (
              <div key={row.label} className="flex items-center px-4 py-2.5">
                <span className="w-28 text-xxs font-medium text-slate-400 flex-shrink-0">{row.label}</span>
                <span className="text-xs text-slate-800 font-mono">{row.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Alert type explanation */}
        <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
          <div className="flex items-center gap-2 mb-1.5">
            <TypeIcon size={13} className="text-slate-500" />
            <p className="text-xxs font-semibold text-slate-600">{ALERT_TYPE_LABEL[alert.type]}</p>
          </div>
          <p className="text-xxs text-slate-500 leading-relaxed">
            {alert.type === 'SLA_BREACH'              && 'Triggered when a dispatch misses or is at imminent risk of missing its contracted delivery SLA.'}
            {alert.type === 'HIGH_RISK'               && 'Triggered when a vehicle or carrier event signals significant operational risk — breakdown, GPS loss, or score degradation.'}
            {alert.type === 'ESCALATED_EXCEPTION'     && 'Triggered when an exception reaches escalation Level 3 or remains unresolved beyond the SLA threshold.'}
            {alert.type === 'OVERDUE_RECONCILIATION'  && 'Triggered when a reconciliation record remains unactioned beyond the configured sign-off deadline.'}
            {alert.type === 'INTEGRATION_FAILURE'     && 'Triggered when an external system (e-way bill, GPS provider, ERP) fails to respond within the health check window.'}
          </p>
        </div>
      </div>

      {/* Actions */}
      {!alert.acknowledged && (
        <div className="border-t border-slate-100 p-4">
          <button
            onClick={() => { onAcknowledge(alert.id); onClose() }}
            className="w-full flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
          >
            <Check size={14} />
            Acknowledge Alert
          </button>
        </div>
      )}
    </div>
  )
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

const TYPE_FILTERS: { key: string; label: string }[] = [
  { key: 'all',                    label: 'All Types' },
  { key: 'SLA_BREACH',             label: 'SLA Breach' },
  { key: 'HIGH_RISK',              label: 'High Risk' },
  { key: 'ESCALATED_EXCEPTION',    label: 'Escalated' },
  { key: 'OVERDUE_RECONCILIATION', label: 'Overdue Recon' },
  { key: 'INTEGRATION_FAILURE',    label: 'Integration' },
]

const SEVERITY_FILTERS = [
  { key: 'all',      label: 'All' },
  { key: 'critical', label: 'Critical' },
  { key: 'high',     label: 'High' },
  { key: 'medium',   label: 'Medium' },
]

const ACK_FILTERS = [
  { key: 'all',    label: 'All' },
  { key: 'unread', label: 'Unacknowledged' },
  { key: 'read',   label: 'Acknowledged' },
]

export function AlertsCenter() {
  const { alerts, acknowledge, acknowledgeAll } = useAlerts()
  const [search,      setSearch]      = useState('')
  const [typeFilter,  setTypeFilter]  = useState('all')
  const [sevFilter,   setSevFilter]   = useState('all')
  const [ackFilter,   setAckFilter]   = useState('all')
  const [selected,    setSelected]    = useState<Alert | null>(null)

  const filtered = useMemo(() => {
    return alerts.filter(a => {
      if (typeFilter !== 'all' && a.type !== typeFilter) return false
      if (sevFilter  !== 'all' && a.severity !== sevFilter) return false
      if (ackFilter  === 'unread' && a.acknowledged) return false
      if (ackFilter  === 'read'   && !a.acknowledged) return false
      if (search) {
        const q = search.toLowerCase()
        return a.message.toLowerCase().includes(q)
          || (a.dispatchId?.toLowerCase().includes(q) ?? false)
          || (a.routeCode?.toLowerCase().includes(q) ?? false)
      }
      return true
    })
  }, [alerts, typeFilter, sevFilter, ackFilter, search])

  const unacked = alerts.filter(a => !a.acknowledged).length

  return (
    <div className="flex flex-col min-h-0 bg-slate-50">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-3 sticky top-0 z-10">
        <div>
          <h1 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Bell size={16} className="text-blue-600" />
            CT Alerts
            {unacked > 0 && (
              <span className="rounded-full bg-red-500 px-1.5 py-0.5 text-xxs font-bold text-white leading-none">
                {unacked}
              </span>
            )}
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">{alerts.length} total · {unacked} unacknowledged</p>
        </div>
        {unacked > 0 && (
          <button
            onClick={acknowledgeAll}
            className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-medium text-slate-600 hover:bg-green-50 hover:border-green-300 hover:text-green-700 transition-colors"
          >
            <CheckCheck size={13} />
            Acknowledge All ({unacked})
          </button>
        )}
      </div>

      <div className="flex-1 overflow-auto p-6 space-y-5">
        <SummaryStrip alerts={alerts} />

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px] max-w-xs">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search alerts…"
              className="h-8 w-full rounded-lg border border-slate-200 bg-white pl-8 pr-3 text-xs focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-200"
            />
          </div>

          {/* Type filter */}
          <div className="flex items-center gap-1 flex-wrap">
            {TYPE_FILTERS.map(f => (
              <button
                key={f.key}
                onClick={() => setTypeFilter(f.key)}
                className={cn(
                  'rounded-full border px-3 py-1 text-xxs font-medium transition-colors',
                  typeFilter === f.key
                    ? 'bg-blue-600 border-blue-600 text-white'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-blue-300',
                )}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Severity */}
          <div className="flex rounded-lg border border-slate-200 overflow-hidden text-xxs font-medium">
            {SEVERITY_FILTERS.map(f => (
              <button
                key={f.key}
                onClick={() => setSevFilter(f.key)}
                className={cn(
                  'px-2.5 py-1.5 transition-colors',
                  sevFilter === f.key ? 'bg-slate-800 text-white' : 'bg-white text-slate-500 hover:bg-slate-50',
                )}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Ack status */}
          <div className="flex rounded-lg border border-slate-200 overflow-hidden text-xxs font-medium">
            {ACK_FILTERS.map(f => (
              <button
                key={f.key}
                onClick={() => setAckFilter(f.key)}
                className={cn(
                  'px-2.5 py-1.5 transition-colors',
                  ackFilter === f.key ? 'bg-slate-800 text-white' : 'bg-white text-slate-500 hover:bg-slate-50',
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Table + Detail */}
        <div className="flex gap-5 min-h-0">
          {/* Table */}
          <div className="flex-1 rounded-xl border border-slate-200 bg-white overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
              <span className="text-xxs font-semibold text-slate-500 uppercase tracking-wide">
                {filtered.length} alert{filtered.length !== 1 ? 's' : ''} shown
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50">
                    {['Severity', 'Type', 'Message', 'Fired', 'Status', ''].map(h => (
                      <th key={h} className="text-left px-4 py-2.5 text-xxs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filtered.length === 0
                    ? (
                      <tr>
                        <td colSpan={6} className="px-4 py-12 text-center text-sm text-slate-400">
                          No alerts match the current filters.
                        </td>
                      </tr>
                    )
                    : filtered.map(a => (
                      <AlertRow
                        key={a.id}
                        alert={a}
                        selected={selected?.id === a.id}
                        onClick={() => setSelected(prev => prev?.id === a.id ? null : a)}
                        onAcknowledge={acknowledge}
                      />
                    ))
                  }
                </tbody>
              </table>
            </div>
          </div>

          {/* Detail Panel */}
          {selected && (
            <div className="w-96 flex-shrink-0 rounded-xl border border-slate-200 bg-white overflow-hidden">
              <AlertDetail
                alert={selected}
                onAcknowledge={acknowledge}
                onClose={() => setSelected(null)}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
