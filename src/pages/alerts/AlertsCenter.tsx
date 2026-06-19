import React, { useState, useMemo } from 'react'
import {
  Bell, AlertCircle, AlertTriangle, Clock,
  CheckCheck, Check, Search, X, ShieldAlert, RefreshCw,
  TrendingDown, TrendingUp, Minus, Zap, BarChart3,
  ChevronRight, ArrowUpRight, Timer, Target, Users,
} from 'lucide-react'
import { cn, timeAgo } from '@/lib/utils'
import { useAlerts, getEscalationLevel, ESCALATION_LABEL, ESCALATION_THRESHOLD, type AcknowledgePayload } from '@/context/AlertContext'
import type { Alert, AlertType, AckAction } from '@/types'
import {
  ALERT_TYPE_LABEL, ALERT_TYPE_COLOR, ACK_ACTION_LABEL,
  TOP_DELAY_ROUTES, TOP_DELAY_CARRIERS, CHRONIC_LANES, RECOVERY_STATS, CLOSURE_SLA,
} from './mock/data'

// ─── Constants ────────────────────────────────────────────────────────────────

const ACK_ACTIONS: { value: AckAction; label: string; color: string }[] = [
  { value: 'driver_contacted',   label: 'Driver Contacted',          color: 'bg-blue-50   text-blue-700   border-blue-200'   },
  { value: 'carrier_escalated',  label: 'Carrier Escalated',         color: 'bg-orange-50 text-orange-700 border-orange-200' },
  { value: 'alternate_vehicle',  label: 'Alternate Vehicle Arranged', color: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  { value: 'route_changed',      label: 'Route Changed',             color: 'bg-violet-50 text-violet-700 border-violet-200' },
  { value: 'delivery_replanned', label: 'Delivery Replanned',        color: 'bg-teal-50   text-teal-700   border-teal-200'   },
  { value: 'hub_escalated',      label: 'Hub Escalated',             color: 'bg-amber-50  text-amber-700  border-amber-200'  },
  { value: 'customer_escalated', label: 'Customer Escalated',        color: 'bg-rose-50   text-rose-700   border-rose-200'   },
  { value: 'monitoring_only',    label: 'Monitoring Only',           color: 'bg-slate-50  text-slate-600  border-slate-200'  },
]

const ESCALATION_STYLE = {
  regional_manager: 'bg-amber-100  text-amber-800  border-amber-300',
  transport_head:   'bg-orange-100 text-orange-800 border-orange-300',
  control_tower:    'bg-red-100    text-red-800    border-red-300',
}

const SEVERITY_CONFIG = {
  critical: { icon: AlertCircle,   dot: 'bg-red-500',    bg: 'bg-red-50 border-red-200',       badge: 'bg-red-100 text-red-700',    label: 'Critical' },
  high:     { icon: AlertTriangle, dot: 'bg-amber-500',  bg: 'bg-amber-50 border-amber-200',   badge: 'bg-amber-100 text-amber-700', label: 'High'     },
  medium:   { icon: Clock,         dot: 'bg-yellow-400', bg: 'bg-yellow-50 border-yellow-200', badge: 'bg-yellow-100 text-yellow-700',label: 'Medium'  },
}

const TYPE_ICON: Record<AlertType, React.ComponentType<{ size?: number; className?: string }>> = {
  SLA_BREACH:              Clock,
  HIGH_RISK:               ShieldAlert,
  ESCALATED_EXCEPTION:     AlertTriangle,
  OVERDUE_RECONCILIATION:  RefreshCw,
  INTEGRATION_FAILURE:     X,
}

// ─── Acknowledge modal ────────────────────────────────────────────────────────

function AckModal({ alert, onConfirm, onClose }: {
  alert: Alert
  onConfirm: (payload: AcknowledgePayload) => void
  onClose: () => void
}) {
  const [action,  setAction]  = useState<AckAction | ''>('')
  const [remarks, setRemarks] = useState('')
  const escalation = getEscalationLevel(alert.delayMins)

  function handleSubmit() {
    if (!action) return
    if (!remarks.trim()) return
    onConfirm({ action: action as AckAction, remarks: remarks.trim() })
  }

  const sev = SEVERITY_CONFIG[alert.severity]

  return (
    <div className="fixed inset-0 z-modal flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="w-[540px] rounded-2xl bg-white shadow-2xl" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-200 px-6 py-5">
          <div className="flex items-start gap-3">
            <div className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-xl', sev.badge)}>
              <sev.icon size={16} />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Acknowledge Alert</h2>
              <p className="text-xs text-slate-500 mt-0.5">{alert.id} · {ALERT_TYPE_LABEL[alert.type]}</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 hover:bg-slate-100">
            <X size={16} className="text-slate-400" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-5">
          {/* Alert message preview */}
          <div className={cn('rounded-xl border p-3.5 text-xs leading-relaxed', sev.bg)}>
            {alert.message}
          </div>

          {/* Escalation notice */}
          {escalation && (
            <div className={cn('flex items-center gap-2.5 rounded-xl border px-4 py-3', ESCALATION_STYLE[escalation])}>
              <Zap size={14} className="shrink-0" />
              <div>
                <p className="text-xs font-bold">Auto-escalated to {ESCALATION_LABEL[escalation]}</p>
                <p className="text-xxs opacity-80 mt-0.5">{ESCALATION_THRESHOLD[escalation]} threshold triggered · Delay: {Math.round((alert.delayMins ?? 0) / 60 * 10) / 10}h</p>
              </div>
            </div>
          )}

          {/* Action selection */}
          <div>
            <label className="mb-2.5 block text-xs font-bold text-slate-700">
              Action Taken <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              {ACK_ACTIONS.map(a => (
                <button
                  key={a.value}
                  onClick={() => setAction(a.value)}
                  className={cn(
                    'rounded-xl border-2 px-3.5 py-2.5 text-left text-xs font-semibold transition-all',
                    action === a.value
                      ? cn(a.color, 'border-current shadow-sm scale-[1.02]')
                      : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300',
                  )}
                >
                  {a.label}
                </button>
              ))}
            </div>
          </div>

          {/* Remarks */}
          <div>
            <label className="mb-2 block text-xs font-bold text-slate-700">
              Remarks / Action Details <span className="text-red-500">*</span>
            </label>
            <textarea
              value={remarks}
              onChange={e => setRemarks(e.target.value)}
              rows={3}
              placeholder="Describe what action was taken, who was contacted, expected resolution time…"
              className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs leading-relaxed text-slate-800 resize-none focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
            <p className="mt-1 text-xxs text-slate-400">{remarks.length} characters · minimum 10</p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-slate-200 px-6 py-4">
          <p className="text-xxs text-slate-400">Acknowledged by <strong>Shashank Zode</strong> · {new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</p>
          <div className="flex gap-2">
            <button onClick={onClose} className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50">
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={!action || remarks.trim().length < 10}
              className="rounded-lg bg-blue-600 px-5 py-2 text-xs font-bold text-white hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <Check size={13} className="inline mr-1.5" />
              Confirm Acknowledgement
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Escalation badge ─────────────────────────────────────────────────────────

function EscalationBadge({ level }: { level: string }) {
  return (
    <span className={cn('flex items-center gap-1 rounded-full border px-2 py-0.5 text-xxs font-bold whitespace-nowrap', ESCALATION_STYLE[level as keyof typeof ESCALATION_STYLE])}>
      <Zap size={9} />
      {ESCALATION_LABEL[level as keyof typeof ESCALATION_LABEL]}
    </span>
  )
}

// ─── Alert row ────────────────────────────────────────────────────────────────

function AlertRow({ alert, selected, onClick, onAckClick }: {
  alert: Alert
  selected: boolean
  onClick: () => void
  onAckClick: () => void
}) {
  const sev      = SEVERITY_CONFIG[alert.severity]
  const TypeIcon = TYPE_ICON[alert.type]
  const escalation = getEscalationLevel(alert.delayMins)

  return (
    <tr
      onClick={onClick}
      className={cn(
        'cursor-pointer border-b border-slate-50 transition-colors',
        selected          ? 'bg-blue-50' : 'hover:bg-slate-50',
        alert.acknowledged && 'opacity-55',
      )}
    >
      <td className="px-4 py-3">
        <span className={cn('flex h-5 w-5 items-center justify-center rounded-full', sev.badge)}>
          <sev.icon size={10} />
        </span>
      </td>
      <td className="px-4 py-3">
        <span className={cn('rounded-full border px-2 py-0.5 text-xxs font-medium flex items-center gap-1 w-fit', ALERT_TYPE_COLOR[alert.type])}>
          <TypeIcon size={9} />
          {ALERT_TYPE_LABEL[alert.type]}
        </span>
      </td>
      <td className="px-4 py-3 max-w-xs">
        <p className="text-xs text-slate-800 leading-relaxed line-clamp-2">{alert.message}</p>
        <div className="flex items-center gap-2 mt-1 flex-wrap">
          {alert.dispatchId && <span className="text-xxs text-slate-400 font-mono">{alert.dispatchId}</span>}
          {alert.carrierName && <span className="text-xxs text-slate-400">{alert.carrierName}</span>}
          {escalation && !alert.acknowledged && <EscalationBadge level={escalation} />}
        </div>
      </td>
      <td className="px-4 py-3 text-xxs text-slate-400 whitespace-nowrap">{timeAgo(alert.firedAt)}</td>
      <td className="px-4 py-3">
        {alert.acknowledged
          ? (
            <div>
              <span className="flex items-center gap-1 text-xxs text-green-600 font-medium"><CheckCheck size={11} /> Acknowledged</span>
              {alert.ackAction && (
                <span className="text-xxs text-slate-400 mt-0.5 block">{ACK_ACTION_LABEL[alert.ackAction]}</span>
              )}
            </div>
          )
          : <span className="text-xxs text-slate-400 italic">Pending</span>
        }
      </td>
      <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
        {!alert.acknowledged && (
          <button
            onClick={onAckClick}
            className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xxs font-semibold text-slate-600 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 transition-colors whitespace-nowrap"
          >
            <Check size={10} />
            Acknowledge
          </button>
        )}
      </td>
    </tr>
  )
}

// ─── Alert Detail Panel ───────────────────────────────────────────────────────

function AlertDetail({ alert, onAckClick, onClose }: {
  alert: Alert
  onAckClick: () => void
  onClose: () => void
}) {
  const sev      = SEVERITY_CONFIG[alert.severity]
  const TypeIcon = TYPE_ICON[alert.type]
  const escalation = getEscalationLevel(alert.delayMins)

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 shrink-0">
        <h3 className="text-sm font-bold text-slate-900">Alert Detail</h3>
        <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={16} /></button>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        {/* Severity card */}
        <div className={cn('rounded-xl border p-4 space-y-1', sev.bg)}>
          <div className="flex items-center gap-2 flex-wrap">
            <sev.icon size={15} className={sev.badge.split(' ')[1]} />
            <span className={cn('text-sm font-bold', sev.badge.split(' ')[1])}>{sev.label} Alert</span>
            {alert.acknowledged && (
              <span className="ml-auto flex items-center gap-1 text-xxs text-green-600 font-medium">
                <CheckCheck size={11} /> Acknowledged
              </span>
            )}
          </div>
          <p className="text-xs text-slate-700 leading-relaxed mt-2">{alert.message}</p>
        </div>

        {/* Escalation notice */}
        {escalation && (
          <div className={cn('rounded-xl border px-4 py-3 space-y-1', ESCALATION_STYLE[escalation])}>
            <div className="flex items-center gap-2">
              <Zap size={13} />
              <p className="text-xs font-bold">Escalated to {ESCALATION_LABEL[escalation]}</p>
            </div>
            <p className="text-xxs opacity-80">{ESCALATION_THRESHOLD[escalation]} · Delay: {alert.delayMins} min ({(alert.delayMins! / 60).toFixed(1)}h)</p>
            <p className="text-xxs opacity-80">Notification sent automatically upon alert creation.</p>
          </div>
        )}

        {/* Metadata */}
        <div>
          <p className="text-xxs font-semibold uppercase tracking-wide text-slate-400 mb-2">Alert Details</p>
          <div className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white overflow-hidden">
            {[
              { label: 'Alert ID',    value: alert.id },
              { label: 'Type',        value: ALERT_TYPE_LABEL[alert.type] },
              { label: 'Severity',    value: sev.label },
              { label: 'Fired',       value: new Date(alert.firedAt).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' }) },
              ...(alert.dispatchId  ? [{ label: 'Dispatch',  value: alert.dispatchId }]  : []),
              ...(alert.routeCode   ? [{ label: 'Route',     value: alert.routeCode }]   : []),
              ...(alert.carrierName ? [{ label: 'Carrier',   value: alert.carrierName }] : []),
              ...(alert.delayMins   ? [{ label: 'Delay',     value: `${alert.delayMins} min (${(alert.delayMins / 60).toFixed(1)}h)` }] : []),
            ].map(row => (
              <div key={row.label} className="flex items-center px-4 py-2.5">
                <span className="w-24 text-xxs font-medium text-slate-400 flex-shrink-0">{row.label}</span>
                <span className="text-xs text-slate-800 font-mono">{row.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Acknowledgement record (if acked) */}
        {alert.acknowledged && (
          <div>
            <p className="text-xxs font-semibold uppercase tracking-wide text-slate-400 mb-2">Acknowledgement Record</p>
            <div className="rounded-xl border border-green-200 bg-green-50 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-green-800">Action Taken</span>
                <span className="rounded-full bg-green-200 px-2.5 py-0.5 text-xxs font-bold text-green-800">
                  {alert.ackAction ? ACK_ACTION_LABEL[alert.ackAction] : '—'}
                </span>
              </div>
              {alert.ackRemarks && (
                <p className="text-xs text-green-800 leading-relaxed bg-white/60 rounded-lg px-3 py-2 border border-green-100">
                  "{alert.ackRemarks}"
                </p>
              )}
              <div className="flex items-center justify-between text-xxs text-green-600">
                <span>By {alert.ackedBy}</span>
                <span>{alert.ackedAt ? new Date(alert.ackedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '—'}</span>
              </div>
            </div>
          </div>
        )}

        {/* Type explanation */}
        <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
          <div className="flex items-center gap-2 mb-1.5">
            <TypeIcon size={12} className="text-slate-500" />
            <p className="text-xxs font-semibold text-slate-600">{ALERT_TYPE_LABEL[alert.type]}</p>
          </div>
          <p className="text-xxs text-slate-500 leading-relaxed">
            {alert.type === 'SLA_BREACH'             && 'Triggered when a dispatch misses or is at imminent risk of missing its contracted delivery SLA.'}
            {alert.type === 'HIGH_RISK'              && 'Triggered when a vehicle or carrier event signals significant operational risk — breakdown, GPS loss, or score degradation.'}
            {alert.type === 'ESCALATED_EXCEPTION'    && 'Triggered when an exception reaches escalation Level 3 or remains unresolved beyond the SLA threshold.'}
            {alert.type === 'OVERDUE_RECONCILIATION' && 'Triggered when a reconciliation record remains unactioned beyond the configured sign-off deadline.'}
            {alert.type === 'INTEGRATION_FAILURE'    && 'Triggered when an external system (e-way bill, GPS provider, ERP) fails to respond within the health check window.'}
          </p>
        </div>
      </div>

      {/* Action footer */}
      {!alert.acknowledged && (
        <div className="border-t border-slate-100 p-4 shrink-0">
          <button
            onClick={onAckClick}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-bold text-white hover:bg-blue-700 transition-colors"
          >
            <Check size={15} />
            Acknowledge with Action
          </button>
          <p className="mt-1.5 text-center text-xxs text-slate-400">Action Taken + Remarks required</p>
        </div>
      )}
    </div>
  )
}

// ─── Analytics tab ────────────────────────────────────────────────────────────

function TrendIcon({ trend }: { trend: string }) {
  if (trend === 'improving') return <TrendingUp size={12} className="text-green-500" />
  if (trend === 'worsening') return <TrendingDown size={12} className="text-red-500" />
  return <Minus size={12} className="text-slate-400" />
}

function ExceptionAnalytics() {
  const barMax = Math.max(...TOP_DELAY_ROUTES.map(r => r.totalExceptions))

  return (
    <div className="space-y-6 p-6 overflow-auto">
      {/* KPI row */}
      <div className="grid grid-cols-4 gap-4">
        {[
          {
            label: 'Avg Recovery Time',
            value: `${RECOVERY_STATS.avgRecoveryMins}m`,
            sub: `P90: ${RECOVERY_STATS.p90RecoveryMins}m`,
            icon: Timer,
            color: 'text-blue-600',
            bg: 'bg-blue-50 border-blue-100',
          },
          {
            label: 'Exception Closure SLA',
            value: `${CLOSURE_SLA.slaPct}%`,
            sub: `${CLOSURE_SLA.closedWithinSla}/${CLOSURE_SLA.totalClosed} within ${CLOSURE_SLA.slaThresholdMins/60}h SLA`,
            icon: Target,
            color: CLOSURE_SLA.slaPct >= 80 ? 'text-green-600' : 'text-amber-600',
            bg: CLOSURE_SLA.slaPct >= 80 ? 'bg-green-50 border-green-100' : 'bg-amber-50 border-amber-100',
          },
          {
            label: 'Chronic Lanes (30d)',
            value: String(CHRONIC_LANES.filter(l => l.status === 'critical').length),
            sub: `${CHRONIC_LANES.filter(l => l.status === 'watch').length} on watch list`,
            icon: AlertTriangle,
            color: 'text-red-600',
            bg: 'bg-red-50 border-red-100',
          },
          {
            label: 'Fastest Recovery',
            value: `${RECOVERY_STATS.fastestMins}m`,
            sub: `Slowest: ${Math.round(RECOVERY_STATS.slowestMins/60)}h`,
            icon: Zap,
            color: 'text-violet-600',
            bg: 'bg-violet-50 border-violet-100',
          },
        ].map(k => (
          <div key={k.label} className={cn('rounded-xl border p-4', k.bg)}>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xxs font-semibold uppercase tracking-wide text-slate-400">{k.label}</p>
              <k.icon size={14} className={k.color} />
            </div>
            <p className={cn('text-3xl font-bold tabular-nums leading-none mb-1', k.color)}>{k.value}</p>
            <p className="text-xxs text-slate-500">{k.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Top Delay Routes */}
        <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
          <div className="flex items-center gap-2 border-b border-slate-100 px-5 py-3.5">
            <BarChart3 size={14} className="text-blue-500" />
            <h3 className="text-sm font-bold text-slate-900">Top Delay Routes</h3>
            <span className="ml-auto text-xxs text-slate-400">Last 30 days</span>
          </div>
          <div className="p-4 space-y-3">
            {TOP_DELAY_ROUTES.map((r, i) => (
              <div key={r.routeCode}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xxs font-bold text-slate-400 w-4">{i + 1}</span>
                    <div>
                      <p className="text-xs font-semibold text-slate-800">{r.routeLabel}</p>
                      <p className="text-xxs text-slate-400 font-mono">{r.routeCode}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <TrendIcon trend={r.trend} />
                    <span className="text-xs font-bold text-slate-700 tabular-nums">{r.totalExceptions}</span>
                  </div>
                </div>
                <div className="ml-6 flex items-center gap-2">
                  <div className="flex-1 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className={cn('h-full rounded-full', r.trend === 'worsening' ? 'bg-red-400' : r.trend === 'stable' ? 'bg-amber-400' : 'bg-green-400')}
                      style={{ width: `${(r.totalExceptions / barMax) * 100}%` }}
                    />
                  </div>
                  <span className="text-xxs text-slate-400 whitespace-nowrap">avg {Math.round(r.avgDelayMins/60 * 10)/10}h · {r.onTimeRate}% OTD</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Delay Carriers */}
        <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
          <div className="flex items-center gap-2 border-b border-slate-100 px-5 py-3.5">
            <Users size={14} className="text-amber-500" />
            <h3 className="text-sm font-bold text-slate-900">Top Delay Carriers</h3>
            <span className="ml-auto text-xxs text-slate-400">Last 30 days</span>
          </div>
          <div className="p-4 space-y-3">
            {TOP_DELAY_CARRIERS.map((c, i) => {
              const maxExc = Math.max(...TOP_DELAY_CARRIERS.map(x => x.totalExceptions))
              const score  = c.slaScore
              return (
                <div key={c.carrier}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xxs font-bold text-slate-400 w-4">{i + 1}</span>
                      <div>
                        <p className="text-xs font-semibold text-slate-800">{c.carrier}</p>
                        <p className="text-xxs text-slate-400">SLA Score: <strong className={cn(score < 70 ? 'text-red-600' : score < 80 ? 'text-amber-600' : 'text-green-600')}>{score}</strong></p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <TrendIcon trend={c.trend} />
                      <span className="text-xs font-bold text-slate-700 tabular-nums">{c.totalExceptions}</span>
                    </div>
                  </div>
                  <div className="ml-6 flex items-center gap-2">
                    <div className="flex-1 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className={cn('h-full rounded-full', c.trend === 'worsening' ? 'bg-red-400' : c.trend === 'stable' ? 'bg-amber-400' : 'bg-green-400')}
                        style={{ width: `${(c.totalExceptions / maxExc) * 100}%` }}
                      />
                    </div>
                    <span className="text-xxs text-slate-400 whitespace-nowrap">avg {Math.round(c.avgDelayMins/60 * 10)/10}h delay</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Chronic Problem Lanes */}
      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
        <div className="flex items-center gap-2 border-b border-slate-100 px-5 py-3.5">
          <AlertTriangle size={14} className="text-red-500" />
          <h3 className="text-sm font-bold text-slate-900">Chronic Problem Lanes</h3>
          <span className="ml-1 text-xxs text-slate-400">≥5 breaches in 30 days</span>
          <span className="ml-auto text-xxs text-slate-400">{CHRONIC_LANES.length} lanes flagged</span>
        </div>
        <table className="w-full text-xs">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr>
              {['Route', 'Carrier', 'Breaches (30d)', 'Avg Delay', 'Last Breach', 'Status'].map(h => (
                <th key={h} className="px-4 py-2.5 text-left text-xxs font-semibold uppercase tracking-wide text-slate-400">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {CHRONIC_LANES.map(lane => (
              <tr key={`${lane.routeCode}-${lane.carrier}`} className="hover:bg-slate-50">
                <td className="px-4 py-3">
                  <p className="font-mono text-xs font-semibold text-slate-800">{lane.routeCode}</p>
                </td>
                <td className="px-4 py-3 text-slate-600">{lane.carrier}</td>
                <td className="px-4 py-3">
                  <span className={cn(
                    'rounded-full px-2.5 py-0.5 text-xxs font-bold',
                    lane.breachesLast30Days >= 10 ? 'bg-red-100 text-red-700' :
                    lane.breachesLast30Days >= 7  ? 'bg-orange-100 text-orange-700' :
                    'bg-amber-100 text-amber-700',
                  )}>
                    {lane.breachesLast30Days}×
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-600 tabular-nums">{Math.round(lane.avgDelayMins / 60 * 10) / 10}h</td>
                <td className="px-4 py-3 text-slate-400 text-xxs">{timeAgo(lane.lastBreachAt)}</td>
                <td className="px-4 py-3">
                  <span className={cn(
                    'rounded-full px-2.5 py-0.5 text-xxs font-bold capitalize',
                    lane.status === 'critical'   ? 'bg-red-100   text-red-700'   :
                    lane.status === 'watch'      ? 'bg-amber-100 text-amber-700' :
                    'bg-green-100 text-green-700',
                  )}>
                    {lane.status === 'improving' ? 'Improving' : lane.status === 'watch' ? 'Watch' : 'Critical'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Recovery time by action */}
      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
        <div className="flex items-center gap-2 border-b border-slate-100 px-5 py-3.5">
          <Timer size={14} className="text-violet-500" />
          <h3 className="text-sm font-bold text-slate-900">Average Recovery Time by Action</h3>
          <span className="ml-auto text-xxs text-slate-400">All closed exceptions</span>
        </div>
        <div className="grid grid-cols-4 gap-4 p-5">
          {RECOVERY_STATS.byAction.sort((a, b) => a.avgMins - b.avgMins).map(r => {
            const maxMins = Math.max(...RECOVERY_STATS.byAction.map(x => x.avgMins))
            return (
              <div key={r.action} className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
                <p className="text-xxs text-slate-500 mb-1 leading-tight">{ACK_ACTION_LABEL[r.action]}</p>
                <p className="text-xl font-bold text-slate-800 tabular-nums">{r.avgMins}m</p>
                <p className="text-xxs text-slate-400 mb-2">{r.count} cases</p>
                <div className="h-1 rounded-full bg-slate-200 overflow-hidden">
                  <div
                    className={cn('h-full rounded-full', r.avgMins <= 60 ? 'bg-green-400' : r.avgMins <= 150 ? 'bg-amber-400' : 'bg-red-400')}
                    style={{ width: `${(r.avgMins / maxMins) * 100}%` }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ─── Main page ─────────────────────────────────────────────────────────────────

type TabKey = 'alerts' | 'analytics'

const TYPE_FILTERS = [
  { key: 'all',                    label: 'All Types'      },
  { key: 'SLA_BREACH',             label: 'SLA Breach'     },
  { key: 'HIGH_RISK',              label: 'High Risk'      },
  { key: 'ESCALATED_EXCEPTION',    label: 'Escalated'      },
  { key: 'OVERDUE_RECONCILIATION', label: 'Overdue Recon'  },
  { key: 'INTEGRATION_FAILURE',    label: 'Integration'    },
]

const SEVERITY_FILTERS = [
  { key: 'all', label: 'All' }, { key: 'critical', label: 'Critical' },
  { key: 'high', label: 'High' }, { key: 'medium', label: 'Medium' },
]

const ACK_FILTERS = [
  { key: 'all', label: 'All' }, { key: 'unread', label: 'Unacked' }, { key: 'read', label: 'Acked' },
]

const ESC_FILTERS = [
  { key: 'all',              label: 'All Levels'       },
  { key: 'regional_manager', label: 'Regional Manager' },
  { key: 'transport_head',   label: 'Transport Head'   },
  { key: 'control_tower',    label: 'Control Tower'    },
]

export function AlertsCenter() {
  const { alerts, acknowledge } = useAlerts()
  const [tab,        setTab]        = useState<TabKey>('alerts')
  const [search,     setSearch]     = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [sevFilter,  setSevFilter]  = useState('all')
  const [ackFilter,  setAckFilter]  = useState('all')
  const [escFilter,  setEscFilter]  = useState('all')
  const [selected,   setSelected]   = useState<Alert | null>(null)
  const [ackTarget,  setAckTarget]  = useState<Alert | null>(null)

  const filtered = useMemo(() => alerts.filter(a => {
    if (typeFilter !== 'all' && a.type !== typeFilter) return false
    if (sevFilter  !== 'all' && a.severity !== sevFilter) return false
    if (ackFilter  === 'unread' && a.acknowledged) return false
    if (ackFilter  === 'read'   && !a.acknowledged) return false
    if (escFilter  !== 'all') {
      const lvl = getEscalationLevel(a.delayMins)
      if (lvl !== escFilter) return false
    }
    if (search) {
      const q = search.toLowerCase()
      return a.message.toLowerCase().includes(q)
        || (a.dispatchId?.toLowerCase().includes(q) ?? false)
        || (a.routeCode?.toLowerCase().includes(q) ?? false)
        || (a.carrierName?.toLowerCase().includes(q) ?? false)
    }
    return true
  }), [alerts, typeFilter, sevFilter, ackFilter, escFilter, search])

  const unacked       = alerts.filter(a => !a.acknowledged).length
  const escCounts     = {
    regional_manager: alerts.filter(a => getEscalationLevel(a.delayMins) === 'regional_manager' && !a.acknowledged).length,
    transport_head:   alerts.filter(a => getEscalationLevel(a.delayMins) === 'transport_head'   && !a.acknowledged).length,
    control_tower:    alerts.filter(a => getEscalationLevel(a.delayMins) === 'control_tower'    && !a.acknowledged).length,
  }

  function handleAck(payload: AcknowledgePayload) {
    if (!ackTarget) return
    acknowledge(ackTarget.id, payload)
    // Update selected if it's the same alert
    if (selected?.id === ackTarget.id) {
      setSelected(prev => prev ? { ...prev, acknowledged: true, ackAction: payload.action, ackRemarks: payload.remarks, ackedBy: 'Shashank Zode', ackedAt: new Date().toISOString() } : null)
    }
    setAckTarget(null)
  }

  return (
    <>
      {ackTarget && (
        <AckModal
          alert={ackTarget}
          onConfirm={handleAck}
          onClose={() => setAckTarget(null)}
        />
      )}

      <div className="flex flex-col h-full bg-slate-50">
        {/* Header with tabs */}
        <div className="border-b border-slate-200 bg-white px-6 shrink-0">
          <div className="flex items-center justify-between py-4">
            <div>
              <h1 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Bell size={16} className="text-blue-600" />
                CT Alerts
                {unacked > 0 && (
                  <span className="rounded-full bg-red-500 px-1.5 py-0.5 text-xxs font-bold text-white leading-none">{unacked}</span>
                )}
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">{alerts.length} total · {unacked} unacknowledged</p>
            </div>
            {/* Escalation summary pills */}
            <div className="flex items-center gap-2">
              {Object.entries(escCounts).filter(([,v]) => v > 0).map(([k, v]) => (
                <button
                  key={k}
                  onClick={() => { setEscFilter(k); setTab('alerts') }}
                  className={cn('flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xxs font-bold transition-all', ESCALATION_STYLE[k as keyof typeof ESCALATION_STYLE])}
                >
                  <Zap size={10} />
                  {ESCALATION_LABEL[k as keyof typeof ESCALATION_LABEL]} ({v})
                </button>
              ))}
            </div>
          </div>
          {/* Tabs */}
          <div className="flex gap-1 -mb-px">
            {([
              { key: 'alerts',    label: 'Active Alerts'         },
              { key: 'analytics', label: 'Exception Intelligence' },
            ] as const).map(t => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={cn(
                  'px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors',
                  tab === t.key
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700',
                )}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {tab === 'analytics' ? (
          <div className="flex-1 overflow-auto">
            <ExceptionAnalytics />
          </div>
        ) : (
          <div className="flex-1 overflow-auto">
            <div className="p-5 space-y-4">
              {/* KPI cards */}
              <div className="grid grid-cols-4 gap-4">
                {[
                  { label: 'Total Alerts',   value: alerts.length, color: 'text-slate-900', dot: 'bg-slate-400' },
                  { label: 'Unacknowledged', value: unacked,        color: 'text-red-600',   dot: 'bg-red-500'   },
                  { label: 'Critical',       value: alerts.filter(a => a.severity === 'critical').length, color: 'text-red-600', dot: 'bg-red-500' },
                  { label: 'High',           value: alerts.filter(a => a.severity === 'high').length,     color: 'text-amber-600', dot: 'bg-amber-500' },
                ].map(s => (
                  <div key={s.label} className="rounded-xl border border-slate-200 bg-white p-4 space-y-1.5">
                    <div className="flex items-center gap-1.5">
                      <span className={cn('h-2 w-2 rounded-full', s.dot)} />
                      <span className="text-xxs font-semibold uppercase tracking-wider text-slate-500">{s.label}</span>
                    </div>
                    <p className={cn('text-3xl font-bold tabular-nums leading-none', s.color)}>{s.value}</p>
                  </div>
                ))}
              </div>

              {/* Filters */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                  <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Search alerts…"
                    className="h-8 w-48 rounded-lg border border-slate-200 bg-white pl-7 pr-3 text-xs focus:outline-none focus:ring-2 focus:ring-blue-100"
                  />
                </div>
                <div className="flex items-center gap-1 flex-wrap">
                  {TYPE_FILTERS.map(f => (
                    <button key={f.key} onClick={() => setTypeFilter(f.key)}
                      className={cn('rounded-full border px-2.5 py-1 text-xxs font-medium transition-colors',
                        typeFilter === f.key ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-200 bg-white text-slate-600 hover:border-blue-300')}>
                      {f.label}
                    </button>
                  ))}
                </div>
                <div className="flex rounded-lg border border-slate-200 overflow-hidden text-xxs font-medium">
                  {SEVERITY_FILTERS.map(f => (
                    <button key={f.key} onClick={() => setSevFilter(f.key)}
                      className={cn('px-2.5 py-1.5 transition-colors', sevFilter === f.key ? 'bg-slate-800 text-white' : 'bg-white text-slate-500 hover:bg-slate-50')}>
                      {f.label}
                    </button>
                  ))}
                </div>
                <div className="flex rounded-lg border border-slate-200 overflow-hidden text-xxs font-medium">
                  {ACK_FILTERS.map(f => (
                    <button key={f.key} onClick={() => setAckFilter(f.key)}
                      className={cn('px-2.5 py-1.5 transition-colors', ackFilter === f.key ? 'bg-slate-800 text-white' : 'bg-white text-slate-500 hover:bg-slate-50')}>
                      {f.label}
                    </button>
                  ))}
                </div>
                {/* Escalation filter */}
                <div className="flex rounded-lg border border-slate-200 overflow-hidden text-xxs font-medium">
                  {ESC_FILTERS.map(f => (
                    <button key={f.key} onClick={() => setEscFilter(f.key)}
                      className={cn('px-2.5 py-1.5 transition-colors whitespace-nowrap',
                        escFilter === f.key ? 'bg-slate-800 text-white' : 'bg-white text-slate-500 hover:bg-slate-50')}>
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Table + detail */}
              <div className="flex gap-4 min-h-0">
                <div className="flex-1 rounded-xl border border-slate-200 bg-white overflow-hidden">
                  <div className="px-4 py-2.5 border-b border-slate-100">
                    <span className="text-xxs font-semibold text-slate-500 uppercase tracking-wide">{filtered.length} alert{filtered.length !== 1 ? 's' : ''}</span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-slate-100 bg-slate-50">
                          {['','Type','Message','Fired','Status',''].map((h, i) => (
                            <th key={i} className="px-4 py-2.5 text-left text-xxs font-semibold uppercase tracking-wide text-slate-400 whitespace-nowrap">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {filtered.length === 0
                          ? <tr><td colSpan={6} className="px-4 py-12 text-center text-sm text-slate-400">No alerts match the current filters.</td></tr>
                          : filtered.map(a => (
                            <AlertRow
                              key={a.id}
                              alert={a}
                              selected={selected?.id === a.id}
                              onClick={() => setSelected(prev => prev?.id === a.id ? null : a)}
                              onAckClick={() => setAckTarget(a)}
                            />
                          ))
                        }
                      </tbody>
                    </table>
                  </div>
                </div>

                {selected && (
                  <div className="w-96 flex-shrink-0 rounded-xl border border-slate-200 bg-white overflow-hidden">
                    <AlertDetail
                      alert={selected}
                      onAckClick={() => setAckTarget(selected)}
                      onClose={() => setSelected(null)}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
