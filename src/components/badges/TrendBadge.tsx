import React from 'react'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { TrendDirection } from '@/theme'

interface TrendBadgeProps {
  direction: TrendDirection
  delta: string          // e.g. "+3", "-2pp", "₹120"
  period?: string        // e.g. "vs yesterday"
  positiveIsGood?: boolean  // default true (up = green)
  className?: string
}

export function TrendBadge({
  direction,
  delta,
  period,
  positiveIsGood = true,
  className,
}: TrendBadgeProps) {
  const isGood = direction === 'stable'
    ? null
    : positiveIsGood
      ? direction === 'up'
      : direction === 'down'

  const colorClass =
    isGood === null   ? 'text-slate-500' :
    isGood            ? 'text-green-600' :
                        'text-red-600'

  const Icon =
    direction === 'up'     ? TrendingUp   :
    direction === 'down'   ? TrendingDown :
                             Minus

  return (
    <span className={cn('inline-flex items-center gap-1 text-xs font-medium', colorClass, className)}>
      <Icon size={12} className="flex-shrink-0" />
      <span>{delta}</span>
      {period && <span className="text-slate-400 font-normal">{period}</span>}
    </span>
  )
}
