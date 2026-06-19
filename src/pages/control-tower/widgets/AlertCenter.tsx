import React, { useState, useMemo } from 'react'
import { Bell, BellOff, CheckCheck, Filter } from 'lucide-react'
import { cn, timeAgo } from '@/lib/utils'
import { useFilters } from '@/context/FilterContext'
import { routeOriginRegion, matchesDateRange } from '@/lib/exportCsv'
import { CT_ALERTS } from '../mock/data'
import type { Alert } from '@/types'

const SEVERITY_STYLES: Record<string, { dot: string; row: string; label: string }> = {
  critical: { dot: 'bg-red-500',    row: 'border-l-4 border-red-400 bg-red-50/40',   label: 'bg-red-100 text-red-700'   },
  high:     { dot: 'bg-amber-500',  row: 'border-l-4 border-amber-400 bg-amber-50/40', label: 'bg-amber-100 text-amber-700' },
  medium:   { dot: 'bg-blue-400',   row: 'border-l-4 border-blue-300 bg-blue-50/30', label: 'bg-blue-100 text-blue-700' },
}

const TYPE_LABELS: Record<string, string> = {
  SLA_BREACH:              'SLA Breach',
  HIGH_RISK:               'High Risk',
  ESCALATED_EXCEPTION:     'Escalated',
  OVERDUE_RECONCILIATION:  'Overdue Recon',
  INTEGRATION_FAILURE:     'Integration',
}

export function AlertCenter() {
  const [alerts, setAlerts] = useState<Alert[]>(CT_ALERTS)
  const [filter, setFilter] = useState<'all' | 'unread' | 'critical'>('all')

  const { filters } = useFilters()
  const { region, dateRange } = filters

  // Apply global region + date filter before local severity/ack filter
  const regionDateFiltered = useMemo(() =>
    alerts.filter(a => {
      if (region && a.routeCode && routeOriginRegion(a.routeCode) !== region) return false
      if (!matchesDateRange(a.firedAt, dateRange.from, dateRange.to)) return false
      return true
    }),
    [alerts, region, dateRange],
  )

  const unread   = regionDateFiltered.filter(a => !a.acknowledged).length
  const critical = regionDateFiltered.filter(a => a.severity === 'critical' && !a.acknowledged).length

  const visible = regionDateFiltered.filter(a => {
    if (filter === 'unread')   return !a.acknowledged
    if (filter === 'critical') return a.severity === 'critical'
    return true
  })

  function ackAlert(id: string) {
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, acknowledged: true } : a))
  }

  function ackAll() {
    setAlerts(prev => prev.map(a => ({ ...a, acknowledged: true })))
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
        <div className="flex items-center gap-3">
          <div className={cn(
            'relative flex h-8 w-8 items-center justify-center rounded-lg',
            critical > 0 ? 'bg-red-50' : 'bg-slate-100',
          )}>
            <Bell size={16} className={critical > 0 ? 'text-red-500' : 'text-slate-500'} />
            {critical > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-xxs font-bold text-white">
                {critical}
              </span>
            )}
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-800">Alert Center</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              {unread > 0
                ? <><span className="text-red-600 font-medium">{unread} unread</span> · {alerts.length} total</>
                : 'All alerts acknowledged'
              }
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Filter */}
          <div className="flex items-center gap-1">
            {([
              { key: 'all',      label: 'All' },
              { key: 'unread',   label: `Unread (${unread})` },
              { key: 'critical', label: 'Critical' },
            ] as const).map(f => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={cn(
                  'rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors',
                  filter === f.key
                    ? 'bg-slate-800 text-white'
                    : 'text-slate-500 hover:bg-slate-100',
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
          {unread > 0 && (
            <button
              onClick={ackAll}
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-500 hover:bg-slate-50 transition-colors"
            >
              <CheckCheck size={12} />
              Acknowledge All
            </button>
          )}
        </div>
      </div>

      {/* Alert list */}
      <div className="divide-y divide-slate-100">
        {visible.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-slate-400">
            <BellOff size={28} className="mb-2 opacity-40" />
            <p className="text-sm font-medium">No alerts to show</p>
            <p className="text-xs mt-0.5">You're all caught up!</p>
          </div>
        ) : (
          visible.map(alert => (
            <AlertRow key={alert.id} alert={alert} onAck={() => ackAlert(alert.id)} />
          ))
        )}
      </div>
    </div>
  )
}

function AlertRow({ alert, onAck }: { alert: Alert; onAck: () => void }) {
  const style = SEVERITY_STYLES[alert.severity] ?? SEVERITY_STYLES.medium

  return (
    <div className={cn(
      'flex items-start gap-3 px-5 py-3.5 transition-all',
      alert.acknowledged ? 'opacity-50' : style.row,
    )}>
      {/* Dot */}
      <div className="mt-1.5 shrink-0">
        <span className={cn('flex h-2 w-2 rounded-full', style.dot, !alert.acknowledged && alert.severity === 'critical' && 'animate-pulse')} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <span className={cn('rounded px-2 py-0.5 text-xxs font-semibold', style.label)}>
            {alert.severity.toUpperCase()}
          </span>
          <span className="rounded bg-slate-100 px-2 py-0.5 text-xxs font-medium text-slate-600">
            {TYPE_LABELS[alert.type] ?? alert.type}
          </span>
          {alert.routeCode && (
            <span className="text-xxs font-mono text-slate-400">{alert.routeCode}</span>
          )}
          {alert.acknowledged && (
            <span className="flex items-center gap-0.5 text-xxs text-slate-400">
              <CheckCheck size={10} />ACK
            </span>
          )}
        </div>
        <p className="text-xs text-slate-700 leading-relaxed">{alert.message}</p>
        <p className="mt-1 text-xxs text-slate-400">{timeAgo(alert.firedAt)}</p>
      </div>

      {/* Ack button */}
      {!alert.acknowledged && (
        <button
          onClick={onAck}
          title="Acknowledge"
          className="shrink-0 flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-400 hover:border-green-300 hover:text-green-600 transition-colors"
        >
          <CheckCheck size={13} />
        </button>
      )}
    </div>
  )
}
