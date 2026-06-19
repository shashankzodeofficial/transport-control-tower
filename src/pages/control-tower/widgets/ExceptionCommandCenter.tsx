import React, { useState } from 'react'
import { AlertTriangle, Clock, User, ChevronRight, TrendingUp } from 'lucide-react'
import { cn, timeAgo } from '@/lib/utils'
import { SeverityBadge } from '@/components/badges/SeverityBadge'
import { DonutChart } from '@/components/charts/DonutChart'
import { LineChart } from '@/components/charts/LineChart'
import { EXCEPTION_SUMMARY, LIVE_EXCEPTIONS, EXCEPTION_TREND_7D } from '../mock/data'

const STATUS_STYLES: Record<string, string> = {
  OPEN:         'bg-slate-100 text-slate-600',
  ASSIGNED:     'bg-blue-50 text-blue-600',
  IN_PROGRESS:  'bg-amber-50 text-amber-700',
  ESCALATED:    'bg-red-50 text-red-700',
  PENDING_INFO: 'bg-violet-50 text-violet-700',
}

export function ExceptionCommandCenter() {
  const [activeTab, setActiveTab] = useState<'live' | 'trend'>('live')
  const total = LIVE_EXCEPTIONS.length
  const critical = LIVE_EXCEPTIONS.filter(e => e.severity === 'critical').length
  const escalated = LIVE_EXCEPTIONS.filter(e => e.status === 'ESCALATED').length

  return (
    <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-50">
            <AlertTriangle size={16} className="text-red-500" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-800">Exception Command Center</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              <span className="font-medium text-red-600">{critical} critical</span>
              {' · '}
              <span className="font-medium text-amber-600">{escalated} escalated</span>
              {' · '}
              {total} total open
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1 rounded-lg border border-slate-200 p-0.5">
          {(['live', 'trend'] as const).map(t => (
            <button
              key={t}
              onClick={() => setActiveTab(t)}
              className={cn(
                'rounded px-3 py-1 text-xs font-medium capitalize transition-colors',
                activeTab === t ? 'bg-slate-800 text-white' : 'text-slate-500 hover:text-slate-700',
              )}
            >
              {t === 'live' ? 'Live View' : '7-Day Trend'}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-5">
        {/* Left — donut + category breakdown */}
        <div className="col-span-2 border-r border-slate-100 px-5 py-4">
          <DonutChart
            data={EXCEPTION_SUMMARY.map(e => ({ name: e.category, value: e.count, color: e.color }))}
            height={160}
            centerValue={LIVE_EXCEPTIONS.length}
            centerLabel="Open"
          />
          <div className="mt-3 space-y-2">
            {EXCEPTION_SUMMARY.map(ex => (
              <div key={ex.category} className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: ex.color }} />
                <span className="flex-1 text-xs text-slate-600 truncate">{ex.category}</span>
                <span className="text-xs font-semibold tabular-nums text-slate-700">{ex.count}</span>
                <span className="w-8 text-right text-xs text-slate-400">{ex.pct}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right panel */}
        <div className="col-span-3 flex flex-col">
          {activeTab === 'live' ? (
            <div className="flex-1 overflow-y-auto divide-y divide-slate-50">
              {LIVE_EXCEPTIONS.map(ex => {
                const isBreached = ex.slaBreachAt && new Date(ex.slaBreachAt) < new Date()
                const hoursLeft  = ex.slaBreachAt
                  ? Math.round((new Date(ex.slaBreachAt).getTime() - Date.now()) / 3600000 * 10) / 10
                  : null

                return (
                  <div key={ex.id} className="px-4 py-3 hover:bg-slate-50 transition-colors group">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <SeverityBadge severity={ex.severity} size="xs" pulse={ex.severity === 'critical'} />
                          <span className={cn(
                            'rounded-full px-2 py-0.5 text-xxs font-semibold',
                            STATUS_STYLES[ex.status] ?? 'bg-slate-100 text-slate-600',
                          )}>
                            {ex.status.replace('_', ' ')}
                          </span>
                          {ex.escalationLevel && ex.escalationLevel > 1 && (
                            <span className="rounded-full bg-red-100 px-2 py-0.5 text-xxs font-bold text-red-700">
                              L{ex.escalationLevel}
                            </span>
                          )}
                        </div>
                        <p className="text-xs font-medium text-slate-800 mb-0.5">
                          [{ex.id}] {ex.category}
                        </p>
                        <p className="text-xs text-slate-500 truncate">
                          {ex.routeCode} · {ex.carrier}
                        </p>
                        <div className="flex items-center gap-3 mt-1.5">
                          <span className="flex items-center gap-1 text-xxs text-slate-400">
                            <Clock size={10} />{timeAgo(ex.raisedAt)}
                          </span>
                          {ex.assignee && (
                            <span className="flex items-center gap-1 text-xxs text-slate-400">
                              <User size={10} />{ex.assignee}
                            </span>
                          )}
                          {hoursLeft !== null && (
                            <span className={cn(
                              'text-xxs font-semibold',
                              isBreached ? 'text-red-600' : hoursLeft < 2 ? 'text-amber-600' : 'text-slate-400',
                            )}>
                              {isBreached
                                ? `Breached ${Math.abs(hoursLeft)}h ago`
                                : `SLA: ${hoursLeft}h left`}
                            </span>
                          )}
                        </div>
                      </div>
                      <ChevronRight size={14} className="text-slate-300 group-hover:text-slate-500 shrink-0 mt-1 transition-colors" />
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="p-4">
              <p className="text-xs font-medium text-slate-500 mb-3 flex items-center gap-1.5">
                <TrendingUp size={12} />
                Exceptions Opened vs Resolved — Last 7 Days
              </p>
              <LineChart
                data={EXCEPTION_TREND_7D}
                xKey="day"
                series={[
                  { dataKey: 'opened',   label: 'Opened',   color: '#EF4444' },
                  { dataKey: 'resolved', label: 'Resolved', color: '#22C55E' },
                ]}
                height={200}
                showGrid
                showLegend
              />
              {/* Insight callout */}
              <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2">
                <p className="text-xs font-medium text-amber-800">⚠ Backlog Growing</p>
                <p className="text-xs text-amber-700 mt-0.5">
                  More exceptions opened than resolved for 3 consecutive days.
                  Today's open count: 37 (+5 vs avg).
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
