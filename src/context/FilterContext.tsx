import React, { createContext, useContext, useReducer, useCallback } from 'react'
import type { GlobalFilters, DateRange, DateRangePreset } from '@/types'

// ─── Default values ───────────────────────────────────────────────────────────

function makeDefaultDateRange(): DateRange {
  const to   = new Date()
  const from = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  return { preset: '7d', from, to }
}

const DEFAULT_FILTERS: GlobalFilters = {
  dateRange: makeDefaultDateRange(),
  region:   '',
  routes:   [],
  carriers: [],
}

// ─── Actions ──────────────────────────────────────────────────────────────────

type FilterAction =
  | { type: 'SET_DATE_RANGE'; payload: DateRange }
  | { type: 'SET_DATE_PRESET'; payload: DateRangePreset }
  | { type: 'SET_REGION'; payload: string }
  | { type: 'SET_ROUTES'; payload: string[] }
  | { type: 'SET_CARRIERS'; payload: string[] }
  | { type: 'RESET' }

function filterReducer(state: GlobalFilters, action: FilterAction): GlobalFilters {
  switch (action.type) {
    case 'SET_DATE_RANGE':
      return { ...state, dateRange: action.payload }
    case 'SET_DATE_PRESET': {
      const to   = new Date()
      let from   = new Date()
      switch (action.payload) {
        case 'today':     from = new Date(to); from.setHours(0,0,0,0); break
        case 'yesterday': from = new Date(to.getTime() - 86400000); from.setHours(0,0,0,0); break
        case '7d':        from = new Date(to.getTime() - 7  * 86400000); break
        case '30d':       from = new Date(to.getTime() - 30 * 86400000); break
        case 'month':     from = new Date(to.getFullYear(), to.getMonth(), 1); break
        default:          break
      }
      return { ...state, dateRange: { preset: action.payload, from, to } }
    }
    case 'SET_REGION':   return { ...state, region:   action.payload }
    case 'SET_ROUTES':   return { ...state, routes:   action.payload }
    case 'SET_CARRIERS': return { ...state, carriers: action.payload }
    case 'RESET':        return DEFAULT_FILTERS
    default:             return state
  }
}

// ─── Context ──────────────────────────────────────────────────────────────────

interface FilterContextValue {
  filters: GlobalFilters
  hasActiveFilters: boolean
  setDateRange: (range: DateRange) => void
  setDatePreset: (preset: DateRangePreset) => void
  setRegion: (region: string) => void
  setRoutes: (routes: string[]) => void
  setCarriers: (carriers: string[]) => void
  resetFilters: () => void
}

const FilterContext = createContext<FilterContextValue | null>(null)

export function FilterProvider({ children }: { children: React.ReactNode }) {
  const [filters, dispatch] = useReducer(filterReducer, DEFAULT_FILTERS)

  const hasActiveFilters =
    filters.dateRange.preset !== '7d' ||
    filters.region !== '' ||
    filters.routes.length > 0 ||
    filters.carriers.length > 0

  const setDateRange  = useCallback((p: DateRange)         => dispatch({ type: 'SET_DATE_RANGE',  payload: p }), [])
  const setDatePreset = useCallback((p: DateRangePreset)   => dispatch({ type: 'SET_DATE_PRESET', payload: p }), [])
  const setRegion     = useCallback((p: string)            => dispatch({ type: 'SET_REGION',      payload: p }), [])
  const setRoutes     = useCallback((p: string[])          => dispatch({ type: 'SET_ROUTES',      payload: p }), [])
  const setCarriers   = useCallback((p: string[])          => dispatch({ type: 'SET_CARRIERS',    payload: p }), [])
  const resetFilters  = useCallback(()                     => dispatch({ type: 'RESET' }), [])

  return (
    <FilterContext.Provider value={{
      filters, hasActiveFilters,
      setDateRange, setDatePreset, setRegion, setRoutes, setCarriers, resetFilters,
    }}>
      {children}
    </FilterContext.Provider>
  )
}

export function useFilters(): FilterContextValue {
  const ctx = useContext(FilterContext)
  if (!ctx) throw new Error('useFilters must be used inside FilterProvider')
  return ctx
}
