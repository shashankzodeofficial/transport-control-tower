import React from 'react'
import { cn } from '@/lib/utils'

interface EmptyStateProps {
  icon?: React.ReactNode
  title: string
  description?: string
  action?: { label: string; onClick: () => void }
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
  size = 'md',
}: EmptyStateProps) {
  return (
    <div className={cn(
      'flex flex-col items-center justify-center text-center',
      size === 'sm' && 'py-8 px-4',
      size === 'md' && 'py-16 px-6',
      size === 'lg' && 'py-24 px-8',
      className,
    )}>
      {icon && (
        <div className={cn(
          'mb-4 flex items-center justify-center rounded-full bg-slate-100 text-slate-400',
          size === 'sm' && 'h-10 w-10',
          size === 'md' && 'h-14 w-14',
          size === 'lg' && 'h-16 w-16',
        )}>
          {icon}
        </div>
      )}
      <p className={cn(
        'font-semibold text-slate-700',
        size === 'sm' && 'text-sm',
        size === 'md' && 'text-base',
        size === 'lg' && 'text-lg',
      )}>
        {title}
      </p>
      {description && (
        <p className={cn(
          'mt-1 text-slate-500 max-w-xs',
          size === 'sm' ? 'text-xs' : 'text-sm',
        )}>
          {description}
        </p>
      )}
      {action && (
        <button
          onClick={action.onClick}
          className="mt-4 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
        >
          {action.label}
        </button>
      )}
    </div>
  )
}
