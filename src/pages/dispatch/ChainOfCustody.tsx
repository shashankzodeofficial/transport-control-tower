import React, { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, ChevronRight, Package, AlertTriangle,
  CheckCircle2, MapPin, Clock, Scan, ChevronDown, ChevronUp,
  Filter, Camera, Wifi, Smartphone,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { getDispatch } from './mock/dispatches'
import { getHUsForDispatch } from './mock/huData'
import type { HUManifest, HUScan, ScanType } from './mock/huData'

// ─── Scan type config ────────────────────────────────────────────────────────

const SCAN_CONFIG: Record<ScanType, { label: string; color: string; icon: React.ReactNode }> = {
  LOAD:        { label: 'Load',         color: 'bg-blue-100 text-blue-700 ring-blue-200',     icon: <Package size={13} /> },
  GATE_OUT:    { label: 'Gate Out',     color: 'bg-violet-100 text-violet-700 ring-violet-200', icon: <ChevronRight size={13} /> },
  CHECKPOINT:  { label: 'Checkpoint',   color: 'bg-slate-100 text-slate-600 ring-slate-200',  icon: <MapPin size={13} /> },
  GATE_IN:     { label: 'Gate In',      color: 'bg-green-100 text-green-700 ring-green-200',  icon: <CheckCircle2 size={13} /> },
  UNLOAD:      { label: 'Unload',       color: 'bg-teal-100 text-teal-700 ring-teal-200',     icon: <Package size={13} /> },
  DISCREPANCY: { label: 'Discrepancy',  color: 'bg-red-100 text-red-700 ring-red-200',        icon: <AlertTriangle size={13} /> },
  RECOUNT:     { label: 'Recount',      color: 'bg-amber-100 text-amber-700 ring-amber-200',  icon: <Scan size={13} /> },
}

const DISCREPANCY_STYLE: Record<string, string> = {
  DAMAGED:    'text-amber-700 bg-amber-50',
  MISSING:    'text-red-700 bg-red-50',
  EXTRA:      'text-blue-700 bg-blue-50',
  WRONG_ITEM: 'text-violet-700 bg-violet-50',
}

// ─── Scan event card ──────────────────────────────────────────────────────────

function ScanCard({ scan, isLast }: { scan: HUScan; isLast: boolean }) {
  const cfg = SCAN_CONFIG[scan.scanType]

  return (
    <div className="relative flex gap-4">
      {/* Connector line */}
      {!isLast && (
        <div className="absolute left-[19px] top-10 bottom-0 w-0.5 bg-slate-100" />
      )}

      {/* Icon bubble */}
      <div className={cn('relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full ring-2', cfg.color)}>
        {cfg.icon}
      </div>

      {/* Content */}
      <div className={cn(
        'mb-4 flex-1 rounded-xl border p-3',
        scan.discrepancy ? 'border-red-200 bg-red-50/30' : 'border-slate-200 bg-white',
      )}>
        <div className="flex items-start justify-between gap-2 mb-1.5">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={cn('rounded-full px-2.5 py-0.5 text-xxs font-bold ring-1', cfg.color)}>
              {cfg.label}
            </span>
            {scan.discrepancy && (
              <span className={cn('rounded-full px-2.5 py-0.5 text-xxs font-bold', DISCREPANCY_STYLE[scan.discrepancy])}>
                {scan.discrepancy.replace('_', ' ')}
              </span>
            )}
            <span className="font-mono text-xxs text-slate-400">{scan.scanId}</span>
          </div>
          <span className="text-xxs text-slate-400 shrink-0">
            {new Date(scan.scannedAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>

        <p className="flex items-center gap-1.5 text-xs font-medium text-slate-700 mb-1">
          <MapPin size={11} className="text-slate-400 shrink-0" />
          {scan.location}
        </p>

        <div className="flex flex-wrap items-center gap-4 text-xxs text-slate-500 mt-1.5">
          <span className="flex items-center gap-1">
            <Scan size={10} className="text-slate-400" />{scan.scannedBy}
          </span>
          <span className="flex items-center gap-1">
            <Smartphone size={10} className="text-slate-400" />{scan.deviceId}
          </span>
          {scan.lat && (
            <span className="flex items-center gap-1">
              <Wifi size={10} className="text-slate-400" />{scan.lat.toFixed(4)}, {scan.lng?.toFixed(4)}
            </span>
          )}
        </div>

        {scan.notes && (
          <div className="mt-2 rounded-md bg-amber-50 border border-amber-200 px-3 py-1.5 text-xs text-amber-700 italic">
            Note: {scan.notes}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── HU row ──────────────────────────────────────────────────────────────────

function HURow({ hu, isExpanded, onToggle }: {
  hu: HUManifest
  isExpanded: boolean
  onToggle: () => void
}) {
  const hasAnomaly = hu.status === 'damaged' || hu.status === 'missing'
  const scanTypes = Array.from(new Set(hu.scans.map(s => s.scanType)))

  return (
    <div className={cn(
      'rounded-xl border overflow-hidden mb-3 transition-all',
      hasAnomaly ? 'border-red-200' : 'border-slate-200',
    )}>
      {/* Header */}
      <button
        onClick={onToggle}
        className={cn(
          'w-full flex items-center gap-4 px-4 py-3 text-left hover:bg-slate-50 transition-colors',
          hasAnomaly && 'bg-red-50/50 hover:bg-red-50',
        )}
      >
        {/* Status dot */}
        <div className={cn('h-2.5 w-2.5 rounded-full shrink-0',
          hu.status === 'ok'      ? 'bg-green-500' :
          hu.status === 'damaged' ? 'bg-amber-500' :
          hu.status === 'missing' ? 'bg-red-500'   :
          'bg-blue-500',
        )} />

        {/* HU code + desc */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm font-bold text-slate-800">{hu.huCode}</span>
            <span className={cn(
              'rounded-full px-2 py-0.5 text-xxs font-semibold capitalize',
              hu.status === 'ok'      ? 'bg-green-50 text-green-700' :
              hu.status === 'damaged' ? 'bg-amber-50 text-amber-700' :
              hu.status === 'missing' ? 'bg-red-50 text-red-700'     :
              'bg-blue-50 text-blue-700',
            )}>
              {hu.status}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5 truncate">{hu.description}</p>
        </div>

        {/* Scan type pills */}
        <div className="hidden md:flex items-center gap-1.5 flex-shrink-0">
          {scanTypes.map(st => {
            const c = SCAN_CONFIG[st]
            return (
              <span key={st} className={cn('rounded-full px-2 py-0.5 text-xxs font-medium ring-1', c.color)}>
                {c.label}
              </span>
            )
          })}
        </div>

        {/* Stats */}
        <div className="flex items-center gap-4 text-xs text-slate-500 shrink-0">
          <span>{hu.scans.length} scan{hu.scans.length !== 1 ? 's' : ''}</span>
          <span className="text-slate-400">{hu.weightKg} kg</span>
          <span className="text-slate-400">{hu.currentLocation.substring(0, 20)}…</span>
          {isExpanded ? <ChevronUp size={14} className="text-slate-400" /> : <ChevronDown size={14} className="text-slate-400" />}
        </div>
      </button>

      {/* Expanded scan chain */}
      {isExpanded && (
        <div className="border-t border-slate-100 bg-slate-50/50 px-6 pt-5 pb-2">
          {hu.scans.length === 0 ? (
            <p className="text-xs text-slate-400 italic py-2">No scans recorded for this HU.</p>
          ) : (
            hu.scans.map((scan, i) => (
              <ScanCard key={scan.scanId} scan={scan} isLast={i === hu.scans.length - 1} />
            ))
          )}
        </div>
      )}
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export function ChainOfCustody() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [filterStatus, setFilterStatus] = useState<'all' | 'ok' | 'damaged' | 'missing'>('all')
  const [expandAll, setExpandAll] = useState(false)

  const d  = getDispatch(id ?? '')
  const hus = getHUsForDispatch(id ?? '')

  const toggle = (code: string) => {
    setExpanded(prev => {
      const next = new Set(prev)
      next.has(code) ? next.delete(code) : next.add(code)
      return next
    })
  }

  const handleExpandAll = () => {
    if (expandAll) {
      setExpanded(new Set())
    } else {
      setExpanded(new Set(hus.map(h => h.huCode)))
    }
    setExpandAll(!expandAll)
  }

  if (!d) {
    return (
      <div className="flex h-full flex-col items-center justify-center text-slate-400">
        <AlertTriangle size={28} className="mb-2 text-amber-400" />
        <p className="text-sm text-slate-600">Dispatch not found: {id}</p>
        <button onClick={() => navigate('/dispatch/board')} className="mt-3 text-xs text-blue-600 hover:underline">
          ← Back to Workbench
        </button>
      </div>
    )
  }

  if (hus.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center text-slate-400">
        <Package size={28} className="mb-2" />
        <p className="text-sm text-slate-600">No custody data available for {id}</p>
        <button onClick={() => navigate(`/dispatch/${id}`)} className="mt-3 text-xs text-blue-600 hover:underline">
          ← Back to Dispatch Details
        </button>
      </div>
    )
  }

  const filtered = filterStatus === 'all' ? hus : hus.filter(h => h.status === filterStatus)
  const totalScans = hus.reduce((s, h) => s + h.scans.length, 0)
  const anomalies  = hus.filter(h => h.status !== 'ok').length
  const discrepancyScans = hus.flatMap(h => h.scans).filter(s => s.discrepancy).length

  return (
    <div className="flex flex-col h-full bg-slate-50">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 border-b border-slate-200 bg-white px-6 py-2.5">
        <button
          onClick={() => navigate('/dispatch/board')}
          className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-blue-600 transition-colors"
        >
          <ArrowLeft size={13} />Dispatch Workbench
        </button>
        <ChevronRight size={12} className="text-slate-300" />
        <button
          onClick={() => navigate(`/dispatch/${id}`)}
          className="text-xs text-slate-500 hover:text-blue-600 transition-colors"
        >
          {id}
        </button>
        <ChevronRight size={12} className="text-slate-300" />
        <span className="text-xs font-semibold text-slate-700">Chain of Custody</span>
      </div>

      {/* Header */}
      <div className="border-b border-slate-200 bg-white px-6 py-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-lg font-bold text-slate-900">Chain of Custody</h1>
              <span className="rounded-full bg-blue-50 px-3 py-0.5 text-xs font-semibold text-blue-700 border border-blue-200">
                {id}
              </span>
            </div>
            <p className="text-xs text-slate-500">
              {d.routeCode} · {d.origin.split(' (')[0]}
              <span className="mx-1.5 text-slate-300">→</span>
              {d.destination.split(' (')[0]}
              · {d.vehicleReg}
            </p>
          </div>

          {/* Summary stats */}
          <div className="flex items-center gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-slate-700 tabular-nums">{hus.length}</div>
              <div className="text-xxs font-semibold uppercase tracking-wide text-slate-400">HUs</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-slate-700 tabular-nums">{totalScans}</div>
              <div className="text-xxs font-semibold uppercase tracking-wide text-slate-400">Scans</div>
            </div>
            {anomalies > 0 && (
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600 tabular-nums">{anomalies}</div>
                <div className="text-xxs font-semibold uppercase tracking-wide text-red-400">Anomalies</div>
              </div>
            )}
            {discrepancyScans > 0 && (
              <div className="text-center">
                <div className="text-2xl font-bold text-amber-600 tabular-nums">{discrepancyScans}</div>
                <div className="text-xxs font-semibold uppercase tracking-wide text-amber-400">Discrepancies</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-3 border-b border-slate-200 bg-white px-6 py-3">
        {/* Status filter */}
        <Filter size={13} className="text-slate-400 shrink-0" />
        <div className="flex items-center gap-1.5">
          {(['all', 'ok', 'damaged', 'missing'] as const).map(s => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={cn(
                'rounded-full px-3 py-1 text-xs font-medium capitalize transition-colors',
                filterStatus === s
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200',
              )}
            >
              {s === 'all' ? `All (${hus.length})` : `${s} (${hus.filter(h => h.status === s).length})`}
            </button>
          ))}
        </div>

        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={handleExpandAll}
            className="flex items-center gap-1.5 text-xs text-slate-600 hover:text-blue-600 transition-colors"
          >
            {expandAll ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
            {expandAll ? 'Collapse All' : 'Expand All'}
          </button>
        </div>
      </div>

      {/* Scan chain list */}
      <div className="flex-1 overflow-y-auto px-6 py-5">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <Package size={28} className="mb-2" />
            <p className="text-sm">No HUs match this filter</p>
          </div>
        ) : (
          filtered.map(hu => (
            <HURow
              key={hu.huCode}
              hu={hu}
              isExpanded={expanded.has(hu.huCode)}
              onToggle={() => toggle(hu.huCode)}
            />
          ))
        )}
      </div>
    </div>
  )
}
