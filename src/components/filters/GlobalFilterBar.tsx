import React from 'react'
import { RotateCcw } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useFilters } from '@/context/FilterContext'
import { DateRangePicker } from './DateRangePicker'
import { FilterDropdown } from './FilterDropdown'
import { FilterChip } from './FilterChip'

// These would come from an API/store in a real app — stubs for the shell
const REGION_OPTIONS = [
  { value: 'north', label: 'North' },
  { value: 'south', label: 'South' },
  { value: 'east',  label: 'East'  },
  { value: 'west',  label: 'West'  },
]

interface GlobalFilterBarProps {
  compact?: boolean
  className?: string
}

export function GlobalFilterBar({ compact = false, className }: GlobalFilterBarProps) {
  const {
    filters, hasActiveFilters,
    setDateRange, setDatePreset, setRegion, setRoutes, setCarriers, resetFilters,
  } = useFilters()

  return (
    <div className={cn('flex items-center gap-2 flex-wrap', className)}>
      {/* Date range */}
      <DateRangePicker
        value={filters.dateRange}
        preset={filters.dateRange.preset}
        onChange={(range, preset) => {
          if (preset === 'custom' && range.from && range.to) {
            setDateRange({ from: range.from, to: range.to, preset: 'custom' })
          } else if (preset !== 'custom') {
            setDatePreset(preset)
          }
        }}
      />

      {/* Region */}
      <FilterDropdown
        label="Region"
        options={REGION_OPTIONS}
        value={filters.region ? [filters.region] : []}
        multiSelect={false}
        onChange={vals => setRegion(vals[0] ?? '')}
      />

      {/* Active filter chips — only shown in non-compact mode */}
      {!compact && hasActiveFilters && (
        <div className="flex items-center gap-1.5 flex-wrap">
          {filters.region && (
            <FilterChip
              label="Region"
              value={REGION_OPTIONS.find(o => o.value === filters.region)?.label ?? filters.region}
              onRemove={() => setRegion('')}
            />
          )}
          {filters.routes.map(r => (
            <FilterChip
              key={r}
              label="Route"
              value={r}
              onRemove={() => setRoutes(filters.routes.filter(x => x !== r))}
            />
          ))}
          {filters.carriers.map(c => (
            <FilterChip
              key={c}
              label="Carrier"
              value={c}
              onRemove={() => setCarriers(filters.carriers.filter(x => x !== c))}
            />
          ))}
        </div>
      )}

      {/* Reset */}
      {hasActiveFilters && (
        <button
          onClick={resetFilters}
          title="Reset all filters"
          aria-label="Reset all filters"
          className="flex h-7 w-7 items-center justify-center rounded text-slate-400 hover:bg-slate-100 hover:text-red-500 transition-colors"
        >
          <RotateCcw size={13} />
        </button>
      )}
    </div>
  )
}
