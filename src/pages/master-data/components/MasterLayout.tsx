// Shared UI primitives for all Master Data CRUD screens.
import React from 'react'
import { X, AlertTriangle, ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

// ─── Modal ────────────────────────────────────────────────────────────────────

export function Modal({ title, onClose, children, width = 'max-w-xl' }: {
  title: string
  onClose: () => void
  children: React.ReactNode
  width?: string
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm">
      <div className={cn('relative w-full rounded-2xl border border-slate-200 bg-white shadow-2xl', width)}>
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <h3 className="text-sm font-bold text-slate-900">{title}</h3>
          <button onClick={onClose} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors">
            <X size={16} />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  )
}

// ─── ConfirmDelete ────────────────────────────────────────────────────────────

export function ConfirmDelete({ label, onConfirm, onCancel }: {
  label: string; onConfirm: () => void; onCancel: () => void
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white shadow-2xl p-6 text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
          <AlertTriangle size={22} className="text-red-600" />
        </div>
        <h3 className="text-sm font-bold text-slate-900 mb-1">Delete Record</h3>
        <p className="text-xs text-slate-500 mb-5">
          Are you sure you want to delete <span className="font-semibold text-slate-700">{label}</span>? This action cannot be undone.
        </p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors">
            Cancel
          </button>
          <button onClick={onConfirm} className="flex-1 rounded-lg bg-red-600 px-4 py-2 text-xs font-semibold text-white hover:bg-red-700 transition-colors">
            Delete
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── FormField ────────────────────────────────────────────────────────────────

export function FormField({ label, error, required, children }: {
  label: string; error?: string; required?: boolean; children: React.ReactNode
}) {
  return (
    <div>
      <label className="mb-1 block text-xs font-semibold text-slate-700">
        {label}{required && <span className="ml-0.5 text-red-500">*</span>}
      </label>
      {children}
      {error && <p className="mt-1 text-xxs text-red-600">{error}</p>}
    </div>
  )
}

export const inputCls = 'w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-800 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-colors'
export const selectCls = inputCls + ' bg-white'

// ─── AuditStamp ───────────────────────────────────────────────────────────────

export function AuditStamp({ createdAt, updatedAt }: { createdAt: string; updatedAt: string }) {
  const fmt = (iso: string) => new Date(iso).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })
  return (
    <div className="mt-6 rounded-lg bg-slate-50 p-3 text-xxs text-slate-500 space-y-1">
      <p><span className="font-medium">Created:</span> {fmt(createdAt)}</p>
      <p><span className="font-medium">Last Updated:</span> {fmt(updatedAt)}</p>
    </div>
  )
}

// ─── StatusBadge ──────────────────────────────────────────────────────────────

export function StatusBadge({ active }: { active: boolean }) {
  return (
    <span className={cn(
      'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xxs font-semibold',
      active ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500',
    )}>
      <span className={cn('h-1.5 w-1.5 rounded-full', active ? 'bg-green-500' : 'bg-slate-400')} />
      {active ? 'Active' : 'Inactive'}
    </span>
  )
}

// ─── Pagination ───────────────────────────────────────────────────────────────

export function Pagination({ page, pageSize, total, onChange }: {
  page: number; pageSize: number; total: number; onChange: (p: number) => void
}) {
  const pages = Math.ceil(total / pageSize)
  if (pages <= 1) return null
  return (
    <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3">
      <p className="text-xxs text-slate-400">
        Showing {Math.min((page - 1) * pageSize + 1, total)}–{Math.min(page * pageSize, total)} of {total} records
      </p>
      <div className="flex items-center gap-1">
        <button
          disabled={page === 1}
          onClick={() => onChange(page - 1)}
          className="rounded-lg border border-slate-200 p-1.5 text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft size={14} />
        </button>
        {Array.from({ length: pages }, (_, i) => i + 1).map(p => (
          <button
            key={p}
            onClick={() => onChange(p)}
            className={cn(
              'h-7 w-7 rounded-lg text-xs font-medium transition-colors',
              p === page ? 'bg-blue-600 text-white' : 'border border-slate-200 text-slate-600 hover:bg-slate-50',
            )}
          >
            {p}
          </button>
        ))}
        <button
          disabled={page === pages}
          onClick={() => onChange(page + 1)}
          className="rounded-lg border border-slate-200 p-1.5 text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  )
}

// ─── DetailRow ────────────────────────────────────────────────────────────────

export function DetailRow({ label, value, mono }: { label: string; value: React.ReactNode; mono?: boolean }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xxs font-semibold uppercase tracking-wide text-slate-400">{label}</span>
      <span className={cn('text-xs text-slate-800', mono && 'font-mono')}>{value ?? '—'}</span>
    </div>
  )
}

// ─── SortHeader ───────────────────────────────────────────────────────────────

export function SortHeader({ label, sortKey, currentKey, direction, onSort }: {
  label: string
  sortKey: string
  currentKey: string
  direction: 'asc' | 'desc'
  onSort: (k: string) => void
}) {
  const active = sortKey === currentKey
  return (
    <th
      className="cursor-pointer select-none px-4 py-2.5 text-left text-xxs font-semibold uppercase tracking-wide text-slate-500 hover:text-slate-700 whitespace-nowrap"
      onClick={() => onSort(sortKey)}
    >
      {label}
      <span className={cn('ml-1', active ? 'text-blue-600' : 'text-slate-300')}>
        {active ? (direction === 'asc' ? '↑' : '↓') : '↕'}
      </span>
    </th>
  )
}
