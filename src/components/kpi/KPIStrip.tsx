import React from 'react'
import { cn } from '@/lib/utils'
import { KPICard } from './KPICard'
import type { KPIData } from '@/types'

interface KPIStripProps {
  kpis: KPIData[]
  loading?: boolean
  columns?: number      // default: auto (fit all in 1 row at xl)
  className?: string
}

export function KPIStrip({ kpis, loading = false, columns, className }: KPIStripProps) {
  const cols = columns ?? kpis.length
  return (
    <div
      className={cn('grid gap-4', className)}
      style={{
        gridTemplateColumns: `repeat(${Math.min(cols, kpis.length)}, minmax(0, 1fr))`,
      }}
      role="region"
      aria-label="Key performance indicators"
    >
      {kpis.map((kpi, i) => (
        <KPICard key={kpi.label ?? i} data={kpi} loading={loading} />
      ))}
    </div>
  )
}
