import React, { useEffect, useRef } from 'react'
import { Info } from 'lucide-react'
import { cn } from '@/lib/utils'
import { TrendBadge } from '@/components/badges/TrendBadge'
import type { KPIData } from '@/types'
import type { StatusType } from '@/theme'

const STATUS_CONFIG: Record<StatusType, {
  dot: string; text: string; bar: string; border: string
}> = {
  healthy: { dot: 'bg-green-500',  text: 'text-green-600',  bar: 'bg-green-500',  border: 'border-green-200' },
  warning: { dot: 'bg-amber-500',  text: 'text-amber-600',  bar: 'bg-amber-500',  border: 'border-amber-200' },
  danger:  { dot: 'bg-red-500',    text: 'text-red-600',    bar: 'bg-red-500',    border: 'border-red-200'   },
  info:    { dot: 'bg-blue-500',   text: 'text-blue-600',   bar: 'bg-blue-500',   border: 'border-blue-200'  },
  neutral: { dot: 'bg-slate-400',  text: 'text-slate-500',  bar: 'bg-slate-400',  border: 'border-slate-200' },
}

// Animated counter hook
function useCountUp(target: number, duration = 800): number {
  const [value, setValue] = React.useState(0)
  const frameRef = useRef<number>()
  const startRef = useRef<number>()

  useEffect(() => {
    startRef.current = undefined
    const step = (ts: number) => {
      if (startRef.current === undefined) startRef.current = ts
      const elapsed = ts - startRef.current
      const progress = Math.min(elapsed / duration, 1)
      // easeOutCubic
      const eased = 1 - Math.pow(1 - progress, 3)
      setValue(Math.round(target * eased))
      if (progress < 1) frameRef.current = requestAnimationFrame(step)
    }
    frameRef.current = requestAnimationFrame(step)
    return () => { if (frameRef.current) cancelAnimationFrame(frameRef.current) }
  }, [target, duration])

  return value
}

interface KPICardProps {
  data: KPIData
  loading?: boolean
  className?: string
}

export function KPICard({ data, loading = false, className }: KPICardProps) {
  const { label, value, unit, trend, status, progress, onClick, tooltip } = data
  const cfg      = STATUS_CONFIG[status]
  const isNumeric = typeof value === 'number'
  const animated  = useCountUp(isNumeric ? (value as number) : 0)
  const displayValue = isNumeric ? animated : value

  if (loading) {
    return (
      <div className={cn('animate-pulse rounded-xl border border-slate-200 bg-white p-4 space-y-2.5', className)}>
        <div className="h-3 w-20 rounded bg-slate-200" />
        <div className="h-8 w-14 rounded bg-slate-200" />
        <div className="h-2.5 w-24 rounded bg-slate-200" />
        <div className="h-1.5 w-full rounded-full bg-slate-200" />
      </div>
    )
  }

  return (
    <div
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={onClick ? (e) => e.key === 'Enter' && onClick() : undefined}
      className={cn(
        'relative rounded-xl border bg-white p-4 space-y-1.5 transition-all duration-fast',
        onClick && 'cursor-pointer hover:-translate-y-0.5 hover:shadow-panel',
        `border-slate-200 hover:${cfg.border}`,
        className,
      )}
    >
      {/* Label row */}
      <div className="flex items-center justify-between gap-2">
        <span className="text-xxs font-semibold uppercase tracking-wider text-slate-500 leading-none">
          {label}
        </span>
        {tooltip && (
          <button
            aria-label={`Info: ${label}`}
            className="flex-shrink-0 text-slate-300 hover:text-slate-500 transition-colors"
            title={tooltip}
          >
            <Info size={12} />
          </button>
        )}
      </div>

      {/* Value */}
      <div className="flex items-baseline gap-1.5">
        <span className="text-3xl font-bold text-slate-900 leading-none tabular-nums">
          {displayValue}
        </span>
        {unit && (
          <span className="text-sm font-medium text-slate-400">{unit}</span>
        )}
      </div>

      {/* Trend */}
      {trend && (
        <TrendBadge
          direction={trend.direction}
          delta={trend.delta}
          period={trend.period}
          positiveIsGood={status !== 'danger'}
        />
      )}

      {/* Progress bar */}
      {progress !== undefined && (
        <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
          <div
            className={cn('h-full rounded-full transition-all duration-slow', cfg.bar)}
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>
      )}

      {/* Status dot + label */}
      <div className="flex items-center gap-1.5">
        <span className={cn('h-2 w-2 rounded-full flex-shrink-0', cfg.dot)} />
        <span className={cn('text-xxs font-medium capitalize', cfg.text)}>{status}</span>
      </div>
    </div>
  )
}
