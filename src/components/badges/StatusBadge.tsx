import React from 'react'
import { cn } from '@/lib/utils'
import type { DispatchStatus } from '@/theme'

const STATUS_CONFIG: Record<DispatchStatus, { label: string; dot: string; bg: string; text: string }> = {
  planned:    { label: 'Planned',    dot: 'bg-gray-400',   bg: 'bg-gray-100',   text: 'text-gray-700'   },
  ready:      { label: 'Ready',      dot: 'bg-violet-500', bg: 'bg-violet-100', text: 'text-violet-700' },
  dispatched: { label: 'Dispatched', dot: 'bg-blue-500',   bg: 'bg-blue-100',   text: 'text-blue-700'   },
  transit:    { label: 'In Transit', dot: 'bg-cyan-500',   bg: 'bg-cyan-100',   text: 'text-cyan-700'   },
  arrived:    { label: 'Arrived',    dot: 'bg-amber-500',  bg: 'bg-amber-100',  text: 'text-amber-700'  },
  unloading:  { label: 'Unloading',  dot: 'bg-orange-500', bg: 'bg-orange-100', text: 'text-orange-700' },
  reconciled: { label: 'Reconciled', dot: 'bg-green-500',  bg: 'bg-green-100',  text: 'text-green-700'  },
  closed:     { label: 'Closed',     dot: 'bg-slate-400',  bg: 'bg-slate-100',  text: 'text-slate-500'  },
}

interface StatusBadgeProps {
  status: DispatchStatus
  size?: 'xs' | 'sm' | 'md'
  showDot?: boolean
  className?: string
}

export function StatusBadge({ status, size = 'sm', showDot = true, className }: StatusBadgeProps) {
  const cfg = STATUS_CONFIG[status]
  return (
    <span className={cn(
      'inline-flex items-center gap-1.5 rounded-full font-medium',
      size === 'xs' && 'px-1.5 py-0.5 text-xxs',
      size === 'sm' && 'px-2   py-0.5 text-xs',
      size === 'md' && 'px-2.5 py-1   text-sm',
      cfg.bg, cfg.text,
      className,
    )}>
      {showDot && (
        <span className={cn('rounded-full flex-shrink-0', cfg.dot,
          size === 'xs' && 'h-1.5 w-1.5',
          size === 'sm' && 'h-1.5 w-1.5',
          size === 'md' && 'h-2 w-2',
        )} />
      )}
      {cfg.label}
    </span>
  )
}
