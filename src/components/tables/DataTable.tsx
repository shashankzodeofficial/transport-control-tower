import React, { useState, useMemo, useCallback } from 'react'
import { ArrowUp, ArrowDown, ArrowUpDown, ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { EmptyState } from '@/components/shared/EmptyState'
import { TableSkeleton } from '@/components/shared/SkeletonLoader'
import type { ColumnDef, SortState, PaginationState } from '@/types'

// ─── Row color helper ─────────────────────────────────────────────────────────

const ROW_COLOR_CLASSES = {
  green:  'bg-green-50  hover:bg-green-100',
  amber:  'bg-amber-50  hover:bg-amber-100',
  red:    'bg-red-50    hover:bg-red-100',
  violet: 'bg-violet-50 hover:bg-violet-100',
  blue:   'bg-blue-50   hover:bg-blue-100',
  null:   'hover:bg-slate-50',
}

type RowColor = keyof typeof ROW_COLOR_CLASSES

// ─── Sort header cell ─────────────────────────────────────────────────────────

function SortableHeader({
  col,
  sort,
  onSort,
}: {
  col: ColumnDef
  sort: SortState | null
  onSort: (key: string) => void
}) {
  const isActive = sort?.key === col.key
  const Icon = isActive
    ? sort!.dir === 'asc' ? ArrowUp : ArrowDown
    : ArrowUpDown

  return (
    <button
      onClick={() => onSort(col.key)}
      className={cn(
        'flex items-center gap-1 text-xs font-semibold text-slate-500 uppercase tracking-wide',
        'hover:text-slate-700 transition-colors',
        col.align === 'right'  && 'ml-auto',
        col.align === 'center' && 'mx-auto',
      )}
      aria-sort={isActive ? (sort!.dir === 'asc' ? 'ascending' : 'descending') : 'none'}
    >
      {col.label}
      <Icon size={12} className={cn(isActive ? 'text-blue-500' : 'text-slate-300')} />
    </button>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

interface DataTableProps<T extends Record<string, unknown>> {
  columns: ColumnDef<T>[]
  data: T[]
  keyField?: string
  loading?: boolean
  sortable?: boolean
  // Server-side pagination props (optional — if provided, disables client sort)
  pagination?: PaginationState
  onPageChange?: (page: number, pageSize: number) => void
  onSortChange?: (sort: SortState) => void
  // Row interactions
  onRowClick?: (row: T) => void
  rowColor?: (row: T) => RowColor | null
  selectedRows?: string[]
  onRowSelect?: (key: string, selected: boolean) => void
  onSelectAll?: (selected: boolean) => void
  // Customization
  emptyTitle?: string
  emptyDescription?: string
  stickyHeader?: boolean
  compact?: boolean
  className?: string
}

export function DataTable<T extends Record<string, unknown>>({
  columns,
  data,
  keyField = 'id',
  loading = false,
  sortable = true,
  pagination,
  onPageChange,
  onSortChange,
  onRowClick,
  rowColor,
  selectedRows = [],
  onRowSelect,
  onSelectAll,
  emptyTitle = 'No data found',
  emptyDescription = 'Try adjusting your filters.',
  stickyHeader = true,
  compact = false,
  className,
}: DataTableProps<T>) {
  const [localSort, setLocalSort] = useState<SortState | null>(null)
  const [localPage, setLocalPage] = useState(1)
  const [localPageSize] = useState(50)

  const visibleCols = columns.filter(c => !c.hide)
  const hasSelect   = !!(onRowSelect || onSelectAll)
  const isServerPag = !!(pagination && onPageChange)

  // Client-side sort
  const sort = isServerPag ? null : localSort
  const sortedData = useMemo(() => {
    if (!sort || isServerPag) return data
    return [...data].sort((a, b) => {
      const av = a[sort.key]
      const bv = b[sort.key]
      const mul = sort.dir === 'asc' ? 1 : -1
      if (av == null) return 1
      if (bv == null) return -1
      if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * mul
      return String(av).localeCompare(String(bv)) * mul
    })
  }, [data, sort, isServerPag])

  // Client-side pagination
  const pag = pagination ?? {
    page: localPage,
    pageSize: localPageSize,
    total: data.length,
  }
  const pagedData = isServerPag
    ? sortedData
    : sortedData.slice((pag.page - 1) * pag.pageSize, pag.page * pag.pageSize)

  const totalPages = Math.ceil(pag.total / pag.pageSize)

  const handleSort = useCallback((key: string) => {
    if (isServerPag && onSortChange) {
      const newSort: SortState = {
        key,
        dir: sort?.key === key && sort.dir === 'asc' ? 'desc' : 'asc',
      }
      onSortChange(newSort)
    } else {
      setLocalSort(prev =>
        prev?.key === key
          ? { key, dir: prev.dir === 'asc' ? 'desc' : 'asc' }
          : { key, dir: 'asc' }
      )
    }
  }, [isServerPag, onSortChange, sort])

  const handlePageChange = useCallback((page: number) => {
    if (isServerPag) onPageChange!(page, pag.pageSize)
    else setLocalPage(page)
  }, [isServerPag, onPageChange, pag.pageSize])

  if (loading) return <TableSkeleton rows={8} cols={visibleCols.length} />

  return (
    <div className={cn('flex flex-col', className)}>
      {/* Table */}
      <div className="overflow-auto">
        <table className="w-full border-collapse text-sm" role="grid">
          <thead className={cn(stickyHeader && 'sticky top-0 z-sticky bg-white')}>
            <tr className="border-b border-slate-200">
              {hasSelect && (
                <th className="w-10 px-3 py-3 text-left">
                  <input
                    type="checkbox"
                    aria-label="Select all rows"
                    checked={selectedRows.length === data.length && data.length > 0}
                    onChange={e => onSelectAll?.(e.target.checked)}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                </th>
              )}
              {visibleCols.map(col => (
                <th
                  key={col.key}
                  style={{ width: col.width, minWidth: col.minWidth }}
                  className={cn(
                    'px-4 py-3 text-left',
                    col.sticky && 'sticky left-0 bg-white shadow-[1px_0_0_#E2E8F0]',
                  )}
                >
                  {col.sortable !== false && sortable ? (
                    <SortableHeader col={col} sort={sort} onSort={handleSort} />
                  ) : (
                    <span className={cn(
                      'text-xs font-semibold uppercase tracking-wide text-slate-500',
                      col.align === 'right'  && 'block text-right',
                      col.align === 'center' && 'block text-center',
                    )}>
                      {col.label}
                    </span>
                  )}
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {pagedData.length === 0 ? (
              <tr>
                <td colSpan={visibleCols.length + (hasSelect ? 1 : 0)}>
                  <EmptyState title={emptyTitle} description={emptyDescription} size="sm" />
                </td>
              </tr>
            ) : (
              pagedData.map(row => {
                const rowKey     = String(row[keyField] ?? Math.random())
                const isSelected = selectedRows.includes(rowKey)
                const color      = rowColor?.(row) ?? null
                return (
                  <tr
                    key={rowKey}
                    onClick={() => onRowClick?.(row)}
                    className={cn(
                      'transition-colors duration-fast',
                      onRowClick && 'cursor-pointer',
                      isSelected ? 'bg-blue-50' : ROW_COLOR_CLASSES[color ?? 'null'],
                      compact ? 'h-9' : 'h-12',
                    )}
                  >
                    {hasSelect && (
                      <td className="w-10 px-3" onClick={e => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          aria-label={`Select row ${rowKey}`}
                          onChange={e => onRowSelect?.(rowKey, e.target.checked)}
                          className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                        />
                      </td>
                    )}
                    {visibleCols.map(col => {
                      const cellValue = row[col.key]
                      return (
                        <td
                          key={col.key}
                          className={cn(
                            'px-4',
                            compact ? 'py-1.5' : 'py-3',
                            col.align === 'right'  && 'text-right',
                            col.align === 'center' && 'text-center',
                            col.sticky && 'sticky left-0 bg-inherit shadow-[1px_0_0_#E2E8F0]',
                            'text-slate-700',
                          )}
                        >
                          {col.render
                            ? col.render(cellValue, row)
                            : cellValue != null
                              ? String(cellValue)
                              : <span className="text-slate-300">—</span>
                          }
                        </td>
                      )
                    })}
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pag.total > pag.pageSize && (
        <div className="flex items-center justify-between border-t border-slate-200 bg-white px-4 py-3">
          <p className="text-xs text-slate-500">
            Showing <span className="font-medium">{(pag.page - 1) * pag.pageSize + 1}</span>
            {' – '}
            <span className="font-medium">{Math.min(pag.page * pag.pageSize, pag.total)}</span>
            {' of '}
            <span className="font-medium">{pag.total.toLocaleString()}</span>
          </p>
          <div className="flex items-center gap-1">
            <PageButton
              label="← Prev"
              disabled={pag.page <= 1}
              onClick={() => handlePageChange(pag.page - 1)}
            />
            {buildPageRange(pag.page, totalPages).map((p, i) =>
              p === '...' ? (
                <span key={`ellipsis-${i}`} className="px-2 text-xs text-slate-400">…</span>
              ) : (
                <PageButton
                  key={p}
                  label={String(p)}
                  active={p === pag.page}
                  onClick={() => handlePageChange(p as number)}
                />
              )
            )}
            <PageButton
              label="Next →"
              disabled={pag.page >= totalPages}
              onClick={() => handlePageChange(pag.page + 1)}
            />
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function PageButton({
  label, active = false, disabled = false, onClick,
}: { label: string; active?: boolean; disabled?: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'flex h-7 min-w-[28px] items-center justify-center rounded px-2 text-xs font-medium transition-colors',
        'disabled:opacity-40 disabled:cursor-not-allowed',
        active
          ? 'bg-blue-600 text-white'
          : 'text-slate-600 hover:bg-slate-100',
      )}
    >
      {label}
    </button>
  )
}

function buildPageRange(current: number, total: number): (number | '...')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  const pages: (number | '...')[] = [1]
  if (current > 3) pages.push('...')
  for (let p = Math.max(2, current - 1); p <= Math.min(total - 1, current + 1); p++) {
    pages.push(p)
  }
  if (current < total - 2) pages.push('...')
  pages.push(total)
  return pages
}
