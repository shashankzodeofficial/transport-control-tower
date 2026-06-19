import React from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface FilterChipProps {
  label: string
  value: string
  onRemove: () => void
  className?: string
}

export function FilterChip({ label, value, onRemove, className }: FilterChipProps) {
  return (
    <span className={cn(
      'inline-flex items-center gap-1 rounded-full border border-blue-200 bg-blue-50',
      'px-2.5 py-0.5 text-xs font-medium text-blue-700',
      className,
    )}>
      <span className="text-blue-400">{label}:</span>
      {value}
      <button
        onClick={onRemove}
        aria-label={`Remove ${label} filter`}
        className="ml-0.5 rounded-full p-0.5 hover:bg-blue-200 transition-colors"
      >
        <X size={10} />
      </button>
    </span>
  )
}
