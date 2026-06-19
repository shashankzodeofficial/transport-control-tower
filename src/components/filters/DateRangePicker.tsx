import React, { useState, useRef, useEffect } from 'react'
import { Calendar, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import type { DateRangePreset, DateRange } from '@/types'

const PRESETS: { value: DateRangePreset; label: string }[] = [
  { value: 'today',     label: 'Today'          },
  { value: 'yesterday', label: 'Yesterday'       },
  { value: '7d',        label: 'Last 7 days'     },
  { value: '30d',       label: 'Last 30 days'    },
  { value: 'month',     label: 'This month'      },
  { value: 'custom',    label: 'Custom range...' },
]

interface DateRangePickerProps {
  value: DateRange
  preset: DateRangePreset
  onChange: (range: { from: Date | null; to: Date | null }, preset: DateRangePreset) => void
  className?: string
}

export function DateRangePicker({ value, preset, onChange, className }: DateRangePickerProps) {
  const [open, setOpen] = useState(false)
  const [customFrom, setCustomFrom] = useState(
    value.from ? format(value.from, 'yyyy-MM-dd') : ''
  )
  const [customTo, setCustomTo] = useState(
    value.to ? format(value.to, 'yyyy-MM-dd') : ''
  )
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  const label = PRESETS.find(p => p.value === preset)?.label ?? 'Date range'
  const displayLabel = preset === 'custom' && value.from && value.to
    ? `${format(value.from, 'dd MMM')} – ${format(value.to, 'dd MMM')}`
    : label

  function selectPreset(p: DateRangePreset) {
    if (p !== 'custom') {
      // FilterContext handles date calculation; send empty range to let context compute it
      onChange({ from: null, to: null }, p)
      setOpen(false)
    }
  }

  function applyCustom() {
    if (customFrom && customTo) {
      onChange(
        { from: new Date(customFrom), to: new Date(customTo) },
        'custom',
      )
      setOpen(false)
    }
  }

  return (
    <div ref={ref} className={cn('relative', className)}>
      <button
        onClick={() => setOpen(p => !p)}
        aria-expanded={open}
        className="flex h-8 items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 text-xs font-medium text-slate-600 transition-colors hover:border-slate-400"
      >
        <Calendar size={12} className="text-slate-400" />
        {displayLabel}
        <ChevronDown size={12} className={cn('transition-transform', open && 'rotate-180')} />
      </button>

      {open && (
        <div className="absolute top-full left-0 z-dropdown mt-1 w-56 rounded-lg border border-slate-200 bg-white shadow-lg">
          <ul className="p-1">
            {PRESETS.filter(p => p.value !== 'custom').map(p => (
              <li
                key={p.value}
                onClick={() => selectPreset(p.value)}
                className={cn(
                  'flex cursor-pointer items-center rounded-md px-3 py-2 text-xs transition-colors',
                  preset === p.value
                    ? 'bg-blue-50 font-medium text-blue-700'
                    : 'text-slate-700 hover:bg-slate-50',
                )}
              >
                {p.label}
              </li>
            ))}
          </ul>

          <div className="border-t border-slate-100 p-3">
            <p className="mb-2 text-xs font-medium text-slate-500">Custom range</p>
            <div className="flex flex-col gap-2">
              <input
                type="date"
                value={customFrom}
                onChange={e => setCustomFrom(e.target.value)}
                className="h-7 w-full rounded border border-slate-200 px-2 text-xs text-slate-700 focus:border-blue-400 focus:outline-none"
              />
              <input
                type="date"
                value={customTo}
                min={customFrom}
                onChange={e => setCustomTo(e.target.value)}
                className="h-7 w-full rounded border border-slate-200 px-2 text-xs text-slate-700 focus:border-blue-400 focus:outline-none"
              />
              <button
                onClick={applyCustom}
                disabled={!customFrom || !customTo}
                className="h-7 w-full rounded bg-blue-600 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
