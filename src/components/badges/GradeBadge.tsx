import React from 'react'
import { cn } from '@/lib/utils'
import type { RouteGrade } from '@/theme'

const GRADE_CONFIG: Record<RouteGrade, { bg: string; label: string }> = {
  A: { bg: 'bg-green-600', label: 'A' },
  B: { bg: 'bg-blue-600',  label: 'B' },
  C: { bg: 'bg-amber-500', label: 'C' },
  D: { bg: 'bg-orange-500',label: 'D' },
  F: { bg: 'bg-red-600',   label: 'F' },
}

interface GradeBadgeProps {
  grade: RouteGrade
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function GradeBadge({ grade, size = 'md', className }: GradeBadgeProps) {
  const { bg, label } = GRADE_CONFIG[grade]
  return (
    <span className={cn(
      'inline-flex items-center justify-center rounded font-bold text-white',
      size === 'sm' && 'h-5  w-5  text-xxs',
      size === 'md' && 'h-6  w-6  text-xs',
      size === 'lg' && 'h-8  w-8  text-sm',
      bg, className,
    )}>
      {label}
    </span>
  )
}
