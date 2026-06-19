import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/** Merge Tailwind classes without conflicts */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Format Indian Rupee amounts */
export function formatINR(value: number, compact = false): string {
  if (compact) {
    if (value >= 10_000_000) return `₹${(value / 10_000_000).toFixed(1)}Cr`
    if (value >= 100_000)    return `₹${(value / 100_000).toFixed(1)}L`
    if (value >= 1_000)      return `₹${(value / 1_000).toFixed(1)}K`
  }
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value)
}

/** Format a duration in hours + minutes */
export function formatDuration(hours: number): string {
  if (hours < 1) return `${Math.round(hours * 60)}m`
  const h = Math.floor(hours)
  const m = Math.round((hours - h) * 60)
  return m > 0 ? `${h}h ${m}m` : `${h}h`
}

/** Relative time string */
export function timeAgo(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  const diffMs = Date.now() - d.getTime()
  const diffMin = Math.floor(diffMs / 60_000)
  if (diffMin < 1)   return 'just now'
  if (diffMin < 60)  return `${diffMin}m ago`
  const diffHrs = Math.floor(diffMin / 60)
  if (diffHrs < 24)  return `${diffHrs}h ago`
  const diffDays = Math.floor(diffHrs / 24)
  return `${diffDays}d ago`
}

/** Clamp a number between min and max */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

/** Percentage string */
export function pct(value: number, decimals = 1): string {
  return `${value.toFixed(decimals)}%`
}

/** Generate initials from a full name */
export function initials(name: string): string {
  return name
    .split(' ')
    .map(n => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

/** Deterministic color from a string (for avatars, etc.) */
export function stringToColor(str: string): string {
  const colors = [
    'bg-blue-500', 'bg-violet-500', 'bg-green-600',
    'bg-amber-500', 'bg-red-500', 'bg-cyan-600',
    'bg-orange-500', 'bg-pink-500',
  ]
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash)
  }
  return colors[Math.abs(hash) % colors.length]
}

/** Deep-link encode/decode for filters */
export function encodeFilters(filters: Record<string, unknown>): string {
  return btoa(JSON.stringify(filters))
}

export function decodeFilters(encoded: string): Record<string, unknown> {
  try { return JSON.parse(atob(encoded)) }
  catch { return {} }
}
