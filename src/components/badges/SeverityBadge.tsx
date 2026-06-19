import React from 'react'
import { cn } from '@/lib/utils'
import type { SeverityLevel } from '@/theme'

const SEV_CONFIG: Record<SeverityLevel, {
  label: string; bg: string; text: string; border: string; pulse?: boolean
}> = {
  critical: { label: 'CRITICAL', bg: 'bg-red-100',    text: 'text-red-700',    border: 'border-red-300',   pulse: true },
  high:     { label: 'HIGH',     bg: 'bg-orange-100',  text: 'text-orange-700', border: 'border-orange-300' },
  medium:   { label: 'MEDIUM',   bg: 'bg-amber-100',   text: 'text-amber-700',  border: 'border-amber-300'  },
  low:      { label: 'LOW',      bg: 'bg-green-100',   text: 'text-green-700',  border: 'border-green-300'  },
  info:     { label: 'INFO',     bg: 'bg-blue-100',    text: 'text-blue-700',   border: 'border-blue-300'   },
}

const SEV_ICONS: Record<SeverityLevel, string> = {
  critical: '🔴', high: '🟠', medium: '🟡', low: '🟢', info: '🔵',
}

interface SeverityBadgeProps {
  severity: SeverityLevel
  size?: 'xs' | 'sm' | 'md'
  pulse?: boolean
  showIcon?: boolean
  className?: string
}

export function SeverityBadge({
  severity,
  size = 'sm',
  pulse,
  showIcon = false,
  className,
}: SeverityBadgeProps) {
  const cfg      = SEV_CONFIG[severity]
  const doPulse  = pulse ?? (severity === 'critical' && cfg.pulse)

  return (
    <span className={cn(
      'inline-flex items-center gap-1 rounded-full border font-semibold',
      size === 'xs' && 'px-1.5 py-0.5 text-xxs',
      size === 'sm' && 'px-2   py-0.5 text-xxs',
      size === 'md' && 'px-2.5 py-1   text-xs',
      cfg.bg, cfg.text, cfg.border,
      doPulse && 'animate-pulse-ring',
      className,
    )}>
      {showIcon && <span aria-hidden>{SEV_ICONS[severity]}</span>}
      {cfg.label}
    </span>
  )
}
