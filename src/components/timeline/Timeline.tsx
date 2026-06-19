import React from 'react'
import { cn } from '@/lib/utils'
import { timeAgo } from '@/lib/utils'
import type { SeverityLevel } from '@/theme/tokens'

type TimelineItemStatus = 'done' | 'active' | 'pending' | 'skipped' | 'error'

const DOT_CLASSES: Record<TimelineItemStatus, string> = {
  done:    'bg-green-500  border-green-500',
  active:  'bg-blue-500   border-blue-500  ring-4 ring-blue-100',
  pending: 'bg-white      border-slate-300',
  skipped: 'bg-slate-300  border-slate-300',
  error:   'bg-red-500    border-red-500',
}

const TEXT_CLASSES: Record<TimelineItemStatus, string> = {
  done:    'text-slate-700',
  active:  'text-slate-900 font-medium',
  pending: 'text-slate-400',
  skipped: 'text-slate-400 line-through',
  error:   'text-red-600',
}

export interface TimelineItem {
  id: string
  label: string
  timestamp?: Date | string
  status: TimelineItemStatus
  description?: string
  actor?: string
  severity?: SeverityLevel
  icon?: React.ReactNode
}

interface TimelineProps {
  items: TimelineItem[]
  orientation?: 'vertical' | 'horizontal'
  compact?: boolean
  className?: string
}

export function Timeline({
  items,
  orientation = 'vertical',
  compact = false,
  className,
}: TimelineProps) {
  if (orientation === 'horizontal') {
    return <HorizontalTimeline items={items} compact={compact} className={className} />
  }

  return (
    <ol className={cn('relative', className)} aria-label="Timeline">
      {items.map((item, idx) => {
        const isLast = idx === items.length - 1
        return (
          <li key={item.id} className="flex gap-4">
            {/* Track */}
            <div className="flex flex-col items-center">
              <div className={cn(
                'flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 mt-0.5',
                DOT_CLASSES[item.status],
              )}>
                {item.icon && (
                  <span className="text-white" style={{ fontSize: 10 }}>{item.icon}</span>
                )}
              </div>
              {!isLast && (
                <div className={cn(
                  'w-0.5 flex-1 my-1',
                  item.status === 'done' ? 'bg-green-300' : 'bg-slate-200',
                )} />
              )}
            </div>

            {/* Content */}
            <div className={cn('pb-4 flex-1', isLast && 'pb-0')}>
              <div className="flex items-baseline justify-between gap-2">
                <span className={cn('text-sm', TEXT_CLASSES[item.status])}>
                  {item.label}
                </span>
                {item.timestamp && (
                  <span className="shrink-0 text-xs text-slate-400">
                    {timeAgo(item.timestamp)}
                  </span>
                )}
              </div>
              {item.description && (
                <p className={cn('mt-0.5 text-xs text-slate-500', compact && 'hidden')}>
                  {item.description}
                </p>
              )}
              {item.actor && (
                <p className="mt-0.5 text-xs text-slate-400">by {item.actor}</p>
              )}
            </div>
          </li>
        )
      })}
    </ol>
  )
}

function HorizontalTimeline({
  items,
  compact,
  className,
}: { items: TimelineItem[]; compact?: boolean; className?: string }) {
  return (
    <ol className={cn('flex items-start gap-0', className)}>
      {items.map((item, idx) => {
        const isLast = idx === items.length - 1
        return (
          <li key={item.id} className="flex flex-1 flex-col items-center">
            <div className="flex w-full items-center">
              <div className={cn(
                'flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2',
                DOT_CLASSES[item.status],
              )} />
              {!isLast && (
                <div className={cn(
                  'h-0.5 flex-1',
                  item.status === 'done' ? 'bg-green-300' : 'bg-slate-200',
                )} />
              )}
            </div>
            <div className={cn('mt-2 text-center', compact ? 'max-w-[64px]' : 'max-w-[80px]')}>
              <p className={cn('text-xs leading-tight', TEXT_CLASSES[item.status])}>
                {item.label}
              </p>
              {item.timestamp && !compact && (
                <p className="mt-0.5 text-xs text-slate-400 leading-tight">
                  {timeAgo(item.timestamp)}
                </p>
              )}
            </div>
          </li>
        )
      })}
    </ol>
  )
}
