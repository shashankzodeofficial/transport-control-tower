/**
 * Shared filter hook — single import for global region + date range
 * filtering across every operational module.
 *
 * Usage:
 *   const { region, dateRange, matchesRoute, matchesCity, matchesDate } =
 *     useActiveFilters('ModuleName')
 *
 * Put `region, dateRange` in your useMemo dep array so React knows when
 * to recompute; use the helper functions inside the memo body.
 *
 * Debug logs: each filter change emits a console.log tagged with the
 * calling module name. Remove the useEffect block after validation.
 */
import { useFilters } from '@/context/FilterContext'
import { routeOriginRegion, cityRegion, matchesDateRange } from '@/lib/exportCsv'

export interface ActiveFilters {
  /** Lowercase region slug ('north' | 'south' | 'east' | 'west' | '') */
  region: string
  dateRange: ReturnType<typeof useFilters>['filters']['dateRange']
  from: Date | null | undefined
  to:   Date | null | undefined
  /** True if routeCode origin maps to the selected region (or no region set) */
  matchesRoute: (routeCode: string) => boolean
  /** True if city maps to the selected region (or no region set) */
  matchesCity:  (city: string) => boolean
  /** True if isoString falls within the selected date range (or range not set) */
  matchesDate:  (isoString?: string) => boolean
}

export function useActiveFilters(moduleName = 'unknown'): ActiveFilters {
  const { filters } = useFilters()
  const { region, dateRange } = filters
  const { from, to } = dateRange

const matchesRoute = (routeCode: string) =>
    !region || routeOriginRegion(routeCode) === region

  const matchesCity = (city: string) =>
    !region || cityRegion(city) === region

  const matchesDate = (isoString?: string) =>
    !from || !to || matchesDateRange(isoString, from, to)

  return { region, dateRange, from, to, matchesRoute, matchesCity, matchesDate }
}
