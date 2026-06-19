import React from 'react'
import { cn } from '@/lib/utils'

interface PageAction {
  label: string
  icon?: React.ReactNode
  variant?: 'primary' | 'secondary' | 'ghost'
  onClick: () => void
  disabled?: boolean
}

interface PageHeaderProps {
  title: string
  subtitle?: string
  actions?: PageAction[]
  className?: string
  children?: React.ReactNode
}

export function PageHeader({ title, subtitle, actions = [], className, children }: PageHeaderProps) {
  return (
    <div className={cn(
      'flex h-pageheader flex-shrink-0 items-center justify-between border-b border-slate-200 bg-white px-6',
      className,
    )}>
      <div className="min-w-0">
        <h1 className="text-xl font-semibold text-slate-900 leading-tight truncate">{title}</h1>
        {subtitle && (
          <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>
        )}
      </div>

      <div className="flex flex-shrink-0 items-center gap-2">
        {children}
        {actions.map((action, i) => (
          <ActionButton key={i} {...action} />
        ))}
      </div>
    </div>
  )
}

function ActionButton({ label, icon, variant = 'secondary', onClick, disabled }: PageAction) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'flex h-8 items-center gap-1.5 rounded-md px-3 text-sm font-medium transition-colors',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        variant === 'primary'   && 'bg-blue-600 text-white hover:bg-blue-700',
        variant === 'secondary' && 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50',
        variant === 'ghost'     && 'text-slate-600 hover:bg-slate-100',
      )}
    >
      {icon}
      {label}
    </button>
  )
}
