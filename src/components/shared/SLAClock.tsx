import React from 'react'
import { Clock, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatDuration, clamp } from '@/lib/utils'

type SLAVariant = 'bar' | 'ring' | 'compact' | 'text'

interface SLAClockProps {
  hoursRemaining?: number    // positive = remaining, negative = overdue
  totalHours: number         // SLA window
  variant?: SLAVariant
  className?: string
}

function getSLAStatus(remaining: number, total: number): 'ok' | 'at-risk' | 'breached' {
  if (remaining < 0) return 'breached'
  const pct = remaining / total
  if (pct < 0.2) return 'at-risk'
  return 'ok'
}

const STATUS_COLORS = {
  ok:       { bar: 'bg-green-500',  text: 'text-green-700',  ring: '#16A34A', bg: 'bg-green-50'  },
  'at-risk':{ bar: 'bg-amber-500',  text: 'text-amber-700',  ring: '#D97706', bg: 'bg-amber-50'  },
  breached: { bar: 'bg-red-500',    text: 'text-red-700',    ring: '#DC2626', bg: 'bg-red-50'    },
}

export function SLAClock({
  hoursRemaining = 0,
  totalHours,
  variant = 'bar',
  className,
}: SLAClockProps) {
  const status   = getSLAStatus(hoursRemaining, totalHours)
  const colors   = STATUS_COLORS[status]
  const pctLeft  = clamp(hoursRemaining / totalHours, 0, 1) * 100
  const isBreached = status === 'breached'
  const label    = isBreached
    ? `${formatDuration(Math.abs(hoursRemaining))} overdue`
    : `${formatDuration(hoursRemaining)} remaining`

  if (variant === 'compact') {
    return (
      <span className={cn(
        'inline-flex items-center gap-1 text-xs font-medium',
        colors.text, className,
      )}>
        <Clock size={12} />
        {label}
      </span>
    )
  }

  if (variant === 'text') {
    const prefix = isBreached ? 'SLA BREACHED' : status === 'at-risk' ? 'SLA AT RISK' : 'SLA OK'
    return (
      <span className={cn('text-xs font-semibold', colors.text, className)}>
        {prefix} — {label}
      </span>
    )
  }

  if (variant === 'ring') {
    const r = 16
    const circumference = 2 * Math.PI * r
    const dashOffset    = circumference * (1 - pctLeft / 100)
    return (
      <div className={cn('flex flex-col items-center gap-1', className)}>
        <svg width="40" height="40" viewBox="0 0 40 40" className="-rotate-90">
          <circle cx="20" cy="20" r={r} fill="none" stroke="#E2E8F0" strokeWidth="4" />
          <circle
            cx="20" cy="20" r={r}
            fill="none"
            stroke={colors.ring}
            strokeWidth="4"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            strokeLinecap="round"
            className="transition-all duration-slow"
          />
        </svg>
        <span className={cn('text-xxs font-semibold', colors.text)}>{label}</span>
      </div>
    )
  }

  // Default: bar
  return (
    <div className={cn('space-y-1', className)}>
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-1 text-xs text-slate-500">
          {isBreached && <AlertTriangle size={11} className="text-red-600" />}
          SLA {isBreached ? 'Overdue' : 'Remaining'}
        </span>
        <span className={cn('text-xs font-semibold', colors.text)}>{label}</span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-slate-200 overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all duration-slow', colors.bar, {
            'animate-pulse': status === 'at-risk',
          })}
          style={{ width: `${pctLeft}%` }}
        />
      </div>
    </div>
  )
}
