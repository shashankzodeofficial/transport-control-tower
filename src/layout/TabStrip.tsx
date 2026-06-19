import React from 'react'
import { cn } from '@/lib/utils'

interface Tab {
  key: string
  label: string
  badge?: number
  disabled?: boolean
}

interface TabStripProps {
  tabs: Tab[]
  activeTab: string
  onChange: (key: string) => void
  variant?: 'page' | 'widget' | 'drawer'
  className?: string
}

export function TabStrip({
  tabs,
  activeTab,
  onChange,
  variant = 'page',
  className,
}: TabStripProps) {
  return (
    <div
      role="tablist"
      className={cn(
        'flex items-end border-b border-slate-200 bg-white',
        variant === 'page'   && 'h-tabstrip px-6',
        variant === 'widget' && 'px-0',
        variant === 'drawer' && 'px-4',
        className,
      )}
    >
      {tabs.map(tab => {
        const isActive = tab.key === activeTab
        return (
          <button
            key={tab.key}
            role="tab"
            aria-selected={isActive}
            aria-controls={`tabpanel-${tab.key}`}
            disabled={tab.disabled}
            onClick={() => !tab.disabled && onChange(tab.key)}
            className={cn(
              'relative flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium',
              'transition-colors duration-fast whitespace-nowrap',
              'disabled:opacity-40 disabled:cursor-not-allowed',
              isActive
                ? 'text-blue-700 bg-blue-50'
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50',
              variant === 'widget' && 'px-3 py-2 text-xs',
            )}
          >
            {tab.label}
            {tab.badge !== undefined && tab.badge > 0 && (
              <span className={cn(
                'flex h-4 min-w-[16px] items-center justify-center rounded-full px-1',
                'text-xxs font-semibold leading-none',
                isActive
                  ? 'bg-blue-100 text-blue-600'
                  : 'bg-slate-100 text-slate-500',
              )}>
                {tab.badge > 99 ? '99+' : tab.badge}
              </span>
            )}
            {/* Active indicator */}
            {isActive && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full bg-blue-600" />
            )}
          </button>
        )
      })}
    </div>
  )
}
