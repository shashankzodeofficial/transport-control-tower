import React from 'react'
import { cn } from '@/lib/utils'

// ─── Primitive pulse skeleton ─────────────────────────────────────────────────

interface SkeletonProps { className?: string; rounded?: boolean }

export function Skeleton({ className, rounded = false }: SkeletonProps) {
  return (
    <div className={cn(
      'animate-pulse bg-slate-200',
      rounded ? 'rounded-full' : 'rounded-md',
      className,
    )} />
  )
}

// ─── KPI strip skeleton ───────────────────────────────────────────────────────

export function KPIStripSkeleton({ count = 9 }: { count?: number }) {
  return (
    <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${count}, minmax(0, 1fr))` }}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-xl border border-slate-200 bg-white p-4 space-y-2.5">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-8 w-16" />
          <Skeleton className="h-2.5 w-20" />
          <Skeleton className="h-1.5 w-full" />
        </div>
      ))}
    </div>
  )
}

// ─── Table skeleton ───────────────────────────────────────────────────────────

export function TableSkeleton({ rows = 8, cols = 6 }: { rows?: number; cols?: number }) {
  return (
    <div className="space-y-0">
      {/* Header */}
      <div className="flex gap-3 border-b border-slate-200 px-4 py-3">
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} className="h-3" style={{ width: `${60 + (i * 20) % 80}px` }} />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, ri) => (
        <div key={ri} className="flex gap-3 border-b border-slate-100 px-4 py-3.5">
          {Array.from({ length: cols }).map((_, ci) => (
            <Skeleton key={ci} className="h-4" style={{ width: `${50 + (ri * ci * 17) % 120}px` }} />
          ))}
        </div>
      ))}
    </div>
  )
}

// ─── Card skeleton ────────────────────────────────────────────────────────────

export function CardSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="grid grid-cols-3 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-xl border border-slate-200 bg-white p-5 space-y-3">
          <Skeleton className="h-5 w-2/3" />
          <Skeleton className="h-8 w-1/2" />
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-3/4" />
        </div>
      ))}
    </div>
  )
}

// ─── Generic page skeleton ────────────────────────────────────────────────────

export function PageSkeleton() {
  return (
    <div className="p-6 space-y-6">
      <KPIStripSkeleton count={4} />
      <TableSkeleton rows={6} cols={5} />
    </div>
  )
}
