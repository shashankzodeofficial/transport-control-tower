import React, { useState, useRef, useEffect } from 'react'
import { ChevronDown, Search, Check } from 'lucide-react'
import { cn } from '@/lib/utils'

interface FilterOption {
  value: string
  label: string
  count?: number
}

interface FilterDropdownProps {
  label: string
  options: FilterOption[]
  value: string[]
  onChange: (values: string[]) => void
  multiSelect?: boolean
  searchable?: boolean
  placeholder?: string
  className?: string
}

export function FilterDropdown({
  label,
  options,
  value,
  onChange,
  multiSelect = true,
  searchable = true,
  placeholder = 'Search...',
  className,
}: FilterDropdownProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
        setQuery('')
      }
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  const filtered = options.filter(o =>
    o.label.toLowerCase().includes(query.toLowerCase())
  )

  function toggle(optValue: string) {
    if (multiSelect) {
      onChange(
        value.includes(optValue)
          ? value.filter(v => v !== optValue)
          : [...value, optValue]
      )
    } else {
      onChange(value[0] === optValue ? [] : [optValue])
      setOpen(false)
    }
  }

  const hasValue = value.length > 0
  const displayLabel = hasValue
    ? value.length === 1
      ? options.find(o => o.value === value[0])?.label ?? value[0]
      : `${label} (${value.length})`
    : label

  return (
    <div ref={ref} className={cn('relative', className)}>
      <button
        onClick={() => setOpen(p => !p)}
        aria-expanded={open}
        aria-haspopup="listbox"
        className={cn(
          'flex h-8 items-center gap-1.5 rounded-md border px-3 text-xs font-medium transition-colors',
          hasValue
            ? 'border-blue-300 bg-blue-50 text-blue-700'
            : 'border-slate-300 bg-white text-slate-600 hover:border-slate-400',
        )}
      >
        {displayLabel}
        <ChevronDown size={12} className={cn('transition-transform', open && 'rotate-180')} />
      </button>

      {open && (
        <div className={cn(
          'absolute top-full left-0 z-dropdown mt-1 min-w-[200px] rounded-lg border border-slate-200',
          'bg-white shadow-lg',
        )}>
          {searchable && (
            <div className="border-b border-slate-100 p-2">
              <div className="flex items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-2 py-1.5">
                <Search size={12} className="text-slate-400" />
                <input
                  autoFocus
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder={placeholder}
                  className="flex-1 bg-transparent text-xs text-slate-700 outline-none placeholder:text-slate-400"
                />
              </div>
            </div>
          )}

          <ul
            role="listbox"
            aria-multiselectable={multiSelect}
            className="max-h-56 overflow-y-auto p-1"
          >
            {filtered.length === 0 ? (
              <li className="px-3 py-2 text-xs text-slate-400">No results</li>
            ) : (
              filtered.map(opt => {
                const selected = value.includes(opt.value)
                return (
                  <li
                    key={opt.value}
                    role="option"
                    aria-selected={selected}
                    onClick={() => toggle(opt.value)}
                    className={cn(
                      'flex cursor-pointer items-center justify-between rounded-md px-3 py-2',
                      'text-xs transition-colors',
                      selected ? 'bg-blue-50 text-blue-700' : 'text-slate-700 hover:bg-slate-50',
                    )}
                  >
                    <span>{opt.label}</span>
                    <div className="flex items-center gap-1.5">
                      {opt.count != null && (
                        <span className="text-slate-400">{opt.count}</span>
                      )}
                      {selected && <Check size={12} className="text-blue-500" />}
                    </div>
                  </li>
                )
              })
            )}
          </ul>

          {multiSelect && value.length > 0 && (
            <div className="border-t border-slate-100 p-2">
              <button
                onClick={() => onChange([])}
                className="text-xs text-slate-500 hover:text-red-500 transition-colors"
              >
                Clear all
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
