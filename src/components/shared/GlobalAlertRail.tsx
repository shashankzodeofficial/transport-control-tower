import React from 'react'
import { X, AlertCircle, AlertTriangle, Clock, ChevronDown, ChevronUp } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAlerts } from '@/context/AlertContext'
import { timeAgo } from '@/lib/utils'
import type { Alert } from '@/types'

const SEVERITY_CONFIG = {
  critical: {
    icon:   AlertCircle,
    bg:     'bg-red-50 border-red-200',
    header: 'bg-red-600 text-white',
    text:   'text-red-800',
    label:  'CRITICAL',
  },
  high: {
    icon:   AlertTriangle,
    bg:     'bg-amber-50 border-amber-200',
    header: 'bg-amber-500 text-white',
    text:   'text-amber-800',
    label:  'HIGH',
  },
  medium: {
    icon:   Clock,
    bg:     'bg-yellow-50 border-yellow-200',
    header: 'bg-yellow-500 text-white',
    text:   'text-yellow-800',
    label:  'MEDIUM',
  },
}

function AlertRailCard({ alert, onAcknowledge }: { alert: Alert; onAcknowledge: (id: string) => void }) {
  // Rail dismissal uses monitoring_only — full ack with action/remarks is done in AlertsCenter
  const cfg  = SEVERITY_CONFIG[alert.severity] ?? SEVERITY_CONFIG.medium
  const Icon = cfg.icon
  return (
    <div className={cn('rounded-lg border text-sm overflow-hidden shadow-card', cfg.bg)}>
      <div className={cn('flex items-center justify-between px-3 py-1.5 text-xs font-semibold', cfg.header)}>
        <span className="flex items-center gap-1.5">
          <Icon size={12} />
          {cfg.label}
        </span>
        <button
          onClick={() => onAcknowledge(alert.id)}
          aria-label="Acknowledge alert"
          className="opacity-75 hover:opacity-100 transition-opacity"
        >
          <X size={12} />
        </button>
      </div>
      <div className="px-3 py-2 space-y-0.5">
        <p className={cn('font-medium leading-tight', cfg.text)}>{alert.message}</p>
        {alert.routeCode && (
          <p className="text-xs text-slate-500">Route: {alert.routeCode}</p>
        )}
        <p className="text-xxs text-slate-400">{timeAgo(alert.firedAt)}</p>
      </div>
    </div>
  )
}

export function GlobalAlertRail() {
  const { alerts, isRailOpen, toggleRail, acknowledge, unacknowledgedCount, criticalCount } = useAlerts()
  const visibleAlerts = alerts.filter(a => !a.acknowledged).slice(0, 3)
  // Quick-dismiss from rail uses monitoring_only — full structured ack done in CT Alerts page
  const quickDismiss = (id: string) => acknowledge(id, { action: 'monitoring_only', remarks: 'Dismissed from alert rail — follow up in CT Alerts.' })

  return (
    <div className="fixed bottom-4 right-4 z-alert flex flex-col items-end gap-2">
      {/* Expanded rail */}
      {isRailOpen && visibleAlerts.length > 0 && (
        <div className="w-80 space-y-2 animate-scale-in">
          {visibleAlerts.map(alert => (
            <AlertRailCard key={alert.id} alert={alert} onAcknowledge={quickDismiss} />
          ))}
          {unacknowledgedCount > 3 && (
            <p className="text-center text-xs text-slate-500">
              +{unacknowledgedCount - 3} more alerts
            </p>
          )}
        </div>
      )}

      {/* Toggle button */}
      <button
        onClick={toggleRail}
        aria-label={isRailOpen ? 'Collapse alert rail' : 'Expand alert rail'}
        className={cn(
          'relative flex h-10 w-10 items-center justify-center rounded-full shadow-panel transition-colors',
          criticalCount > 0
            ? 'bg-red-600 text-white animate-pulse-ring'
            : unacknowledgedCount > 0
              ? 'bg-amber-500 text-white'
              : 'bg-white border border-slate-200 text-slate-400',
        )}
      >
        {isRailOpen ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
        {unacknowledgedCount > 0 && (
          <span className={cn(
            'absolute -right-1 -top-1 flex h-5 min-w-[20px] items-center justify-center rounded-full',
            'text-xxs font-bold text-white leading-none px-1',
            criticalCount > 0 ? 'bg-red-700' : 'bg-amber-600',
          )}>
            {unacknowledgedCount > 99 ? '99+' : unacknowledgedCount}
          </span>
        )}
      </button>
    </div>
  )
}
