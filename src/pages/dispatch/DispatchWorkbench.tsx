import React, { useState, useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  Search, Plus, Download, RefreshCw, ExternalLink,
  Truck, AlertTriangle, Clock, CheckCircle2, Filter, X,
} from 'lucide-react'
import { cn, formatDuration, timeAgo } from '@/lib/utils'
import { exportCsv } from '@/lib/exportCsv'
import { StatusBadge }   from '@/components/badges/StatusBadge'
import { SeverityBadge } from '@/components/badges/SeverityBadge'
import { SLAClock }      from '@/components/shared/SLAClock'
import { TabStrip }      from '@/layout/TabStrip'
import { DISPATCHES, STATUS_COUNTS, type DispatchRecord } from './mock/dispatches'
import type { DispatchStatus } from '@/theme/tokens'
import { useActiveFilters } from '@/hooks/useActiveFilters'

// ─── Tab config ───────────────────────────────────────────────────────────────

const STATUS_TABS: { key: DispatchStatus | 'all'; label: string }[] = [
  { key: 'all',        label: 'All'         },
  { key: 'planned',    label: 'Planned'     },
  { key: 'ready',      label: 'Ready'       },
  { key: 'dispatched', label: 'Dispatched'  },
  { key: 'transit',    label: 'In Transit'  },
  { key: 'arrived',    label: 'Arrived'     },
  { key: 'unloading',  label: 'Unloading'   },
  { key: 'reconciled', label: 'Reconciled'  },
  { key: 'closed',     label: 'Closed'      },
]

// ─── Mini KPI bar ─────────────────────────────────────────────────────────────

function KPIBar({ dispatches }: { dispatches: DispatchRecord[] }) {
  const transit   = dispatches.filter(d => d.status === 'transit').length
  const atRisk    = dispatches.filter(d => d.slaStatus === 'at-risk').length
  const breached  = dispatches.filter(d => d.slaStatus === 'breached').length
  const exceptions= dispatches.reduce((s, d) => s + d.exceptionCount, 0)

  return (
    <div className="grid grid-cols-4 gap-4 px-6 py-3 bg-white border-b border-slate-100">
      <KPIStat icon={<Truck size={15} className="text-blue-500" />}
        label="In Transit" value={transit.toString()} color="text-blue-700" />
      <KPIStat icon={<Clock size={15} className="text-amber-500" />}
        label="SLA At Risk" value={atRisk.toString()} color="text-amber-700" />
      <KPIStat icon={<AlertTriangle size={15} className="text-red-500" />}
        label="SLA Breached" value={breached.toString()} color="text-red-700" />
      <KPIStat icon={<AlertTriangle size={15} className="text-orange-500" />}
        label="Open Exceptions" value={exceptions.toString()} color="text-orange-700" />
    </div>
  )
}

function KPIStat({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 shrink-0">{icon}</div>
      <div>
        <div className={cn('text-xl font-bold tabular-nums', color)}>{value}</div>
        <div className="text-xxs font-medium uppercase tracking-wide text-slate-400">{label}</div>
      </div>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

// ─── New Dispatch modal ───────────────────────────────────────────────────────

function NewDispatchModal({ onClose }: { onClose: () => void }) {
  const [form, setForm] = useState({
    routeCode: '', origin: '', destination: '',
    vehicleReg: '', carrier: '', plannedDeparture: '', plannedArrival: '',
    driverName: '', driverPhone: '', vehicleType: 'FTL', priority: 'normal',
    huCount: '', weightKg: '', remarks: '',
  })
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))
  const inCls = 'w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100'

  return (
    <div className="fixed inset-0 z-modal flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="w-[640px] max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <h2 className="text-base font-bold text-slate-900">Create New Dispatch</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 hover:bg-slate-100 transition-colors"><X size={16} className="text-slate-400" /></button>
        </div>
        <div className="grid grid-cols-2 gap-4 px-6 py-5">
          <div>
            <label className="mb-1 block text-xxs font-semibold uppercase tracking-wide text-slate-400">Route Code *</label>
            <input value={form.routeCode} onChange={e => set('routeCode', e.target.value)} placeholder="DEL-MUM-01" className={inCls} />
          </div>
          <div>
            <label className="mb-1 block text-xxs font-semibold uppercase tracking-wide text-slate-400">Vehicle Type</label>
            <select value={form.vehicleType} onChange={e => set('vehicleType', e.target.value)} className={inCls}>
              {['FTL','LTL','LCV','Trailer'].map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xxs font-semibold uppercase tracking-wide text-slate-400">Origin *</label>
            <input value={form.origin} onChange={e => set('origin', e.target.value)} placeholder="Delhi (Gurgaon Warehouse)" className={inCls} />
          </div>
          <div>
            <label className="mb-1 block text-xxs font-semibold uppercase tracking-wide text-slate-400">Destination *</label>
            <input value={form.destination} onChange={e => set('destination', e.target.value)} placeholder="Mumbai (Bhiwandi Hub)" className={inCls} />
          </div>
          <div>
            <label className="mb-1 block text-xxs font-semibold uppercase tracking-wide text-slate-400">Vehicle Reg *</label>
            <input value={form.vehicleReg} onChange={e => set('vehicleReg', e.target.value)} placeholder="MH12XY9901" className={inCls} />
          </div>
          <div>
            <label className="mb-1 block text-xxs font-semibold uppercase tracking-wide text-slate-400">Carrier *</label>
            <input value={form.carrier} onChange={e => set('carrier', e.target.value)} placeholder="Carrier name" className={inCls} />
          </div>
          <div>
            <label className="mb-1 block text-xxs font-semibold uppercase tracking-wide text-slate-400">Driver Name</label>
            <input value={form.driverName} onChange={e => set('driverName', e.target.value)} placeholder="Driver name" className={inCls} />
          </div>
          <div>
            <label className="mb-1 block text-xxs font-semibold uppercase tracking-wide text-slate-400">Driver Phone</label>
            <input value={form.driverPhone} onChange={e => set('driverPhone', e.target.value)} placeholder="+91 98100 XXXXX" className={inCls} />
          </div>
          <div>
            <label className="mb-1 block text-xxs font-semibold uppercase tracking-wide text-slate-400">Planned Departure *</label>
            <input type="datetime-local" value={form.plannedDeparture} onChange={e => set('plannedDeparture', e.target.value)} className={inCls} />
          </div>
          <div>
            <label className="mb-1 block text-xxs font-semibold uppercase tracking-wide text-slate-400">Planned Arrival *</label>
            <input type="datetime-local" value={form.plannedArrival} onChange={e => set('plannedArrival', e.target.value)} className={inCls} />
          </div>
          <div>
            <label className="mb-1 block text-xxs font-semibold uppercase tracking-wide text-slate-400">HU Count</label>
            <input type="number" value={form.huCount} onChange={e => set('huCount', e.target.value)} placeholder="24" className={inCls} />
          </div>
          <div>
            <label className="mb-1 block text-xxs font-semibold uppercase tracking-wide text-slate-400">Weight (kg)</label>
            <input type="number" value={form.weightKg} onChange={e => set('weightKg', e.target.value)} placeholder="12000" className={inCls} />
          </div>
          <div>
            <label className="mb-1 block text-xxs font-semibold uppercase tracking-wide text-slate-400">Priority</label>
            <select value={form.priority} onChange={e => set('priority', e.target.value)} className={inCls}>
              {['normal','high','critical'].map(p => <option key={p} className="capitalize">{p}</option>)}
            </select>
          </div>
          <div className="col-span-2">
            <label className="mb-1 block text-xxs font-semibold uppercase tracking-wide text-slate-400">Remarks</label>
            <textarea value={form.remarks} onChange={e => set('remarks', e.target.value)} rows={2} placeholder="Optional notes…" className={cn(inCls, 'resize-none')} />
          </div>
        </div>
        <div className="flex justify-end gap-2 border-t border-slate-200 px-6 py-4">
          <button onClick={onClose} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">Cancel</button>
          <button
            onClick={() => {
              if (!form.routeCode || !form.origin || !form.destination || !form.vehicleReg || !form.carrier) {
                alert('Please fill in all required fields (*)')
                return
              }
              onClose()
            }}
            className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
          >
            Create Dispatch
          </button>
        </div>
      </div>
    </div>
  )
}

export function DispatchWorkbench() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [activeTab, setActiveTab]   = useState<DispatchStatus | 'all'>('all')
  const [search, setSearch]         = useState('')
  const [slaFilter, setSlaFilter]   = useState<'all' | 'at-risk' | 'breached'>('all')
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set())
  const [showNewModal, setShowNewModal] = useState(() => searchParams.get('action') === 'new')

  const { region, dateRange, matchesRoute, matchesDate } = useActiveFilters('DispatchWorkbench')

  // Global filter: region + date slice
  const baseDispatches = useMemo(() =>
    DISPATCHES.filter(d =>
      matchesRoute(d.routeCode) && matchesDate(d.plannedDeparture)
    ),
    [region, dateRange],
  )

  const filtered = useMemo(() => {
    return baseDispatches.filter(d => {
      if (activeTab !== 'all' && d.status !== activeTab) return false
      if (slaFilter !== 'all' && d.slaStatus !== slaFilter) return false
      if (search) {
        const q = search.toLowerCase()
        return (
          d.id.toLowerCase().includes(q) ||
          d.routeCode.toLowerCase().includes(q) ||
          d.carrier.toLowerCase().includes(q) ||
          d.vehicleReg.toLowerCase().includes(q) ||
          d.origin.toLowerCase().includes(q) ||
          d.destination.toLowerCase().includes(q)
        )
      }
      return true
    })
  }, [baseDispatches, activeTab, search, slaFilter])

  function toggleRow(id: string) {
    setSelectedRows(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function toggleAll() {
    setSelectedRows(prev =>
      prev.size === filtered.length
        ? new Set()
        : new Set(filtered.map(d => d.id))
    )
  }

  const tabs = STATUS_TABS.map(t => ({
    key: t.key,
    label: t.label,
    badge: t.key === 'all'
      ? baseDispatches.length
      : baseDispatches.filter(d => d.status === t.key).length,
  }))

  function handleExport() {
    exportCsv(filtered.map(d => ({
      id: d.id, status: d.status, route: d.routeCode,
      origin: d.origin, destination: d.destination,
      vehicle: d.vehicleReg, driver: d.driverName, carrier: d.carrier,
      planned_departure: d.plannedDeparture, actual_departure: d.actualDeparture ?? '',
      planned_arrival: d.plannedArrival, actual_arrival: d.actualArrival ?? '',
      hu_count: d.huCount, weight_kg: d.weightKg,
      sla_status: d.slaStatus, exceptions: d.exceptionCount, priority: d.priority,
    })), 'dispatch-workbench')
  }

  return (
    <>
    {showNewModal && <NewDispatchModal onClose={() => setShowNewModal(false)} />}
    <div className="flex flex-col h-full bg-white">
      {/* Page header */}
      <div className="flex items-center justify-between border-b border-slate-200 px-6 py-3 bg-white">
        <div>
          <h1 className="text-base font-bold text-slate-900">Dispatch Workbench</h1>
          <p className="text-xs text-slate-400 mt-0.5">{baseDispatches.length} dispatches · auto-refreshed</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleExport} className="flex h-8 items-center gap-1.5 rounded-lg border border-slate-200 px-3 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors">
            <Download size={13} />Export
          </button>
          <button className="flex h-8 items-center gap-1.5 rounded-lg border border-slate-200 px-3 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors">
            <RefreshCw size={13} />Refresh
          </button>
          <button onClick={() => setShowNewModal(true)} className="flex h-8 items-center gap-1.5 rounded-lg bg-blue-600 px-3 text-xs font-semibold text-white hover:bg-blue-700 transition-colors">
            <Plus size={13} />New Dispatch
          </button>
        </div>
      </div>

      {/* KPI bar */}
      <KPIBar dispatches={baseDispatches} />

      {/* Status tabs */}
      <TabStrip
        tabs={tabs}
        activeTab={activeTab}
        onChange={key => { setActiveTab(key as DispatchStatus | 'all'); setSelectedRows(new Set()) }}
        variant="page"
      />

      {/* Toolbar */}
      <div className="flex items-center gap-3 border-b border-slate-100 bg-slate-50 px-6 py-2.5">
        {/* Search */}
        <div className="relative flex-1 max-w-xs">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search ID, route, carrier, vehicle…"
            className="h-8 w-full rounded-lg border border-slate-200 bg-white pl-8 pr-3 text-xs text-slate-700 placeholder:text-slate-400 focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-100"
          />
        </div>

        {/* SLA filter */}
        <div className="flex items-center gap-1">
          {([
            { key: 'all',      label: 'All SLA'   },
            { key: 'at-risk',  label: '⚠ At Risk'  },
            { key: 'breached', label: '🔴 Breached' },
          ] as const).map(f => (
            <button
              key={f.key}
              onClick={() => setSlaFilter(f.key)}
              className={cn(
                'h-7 rounded px-2.5 text-xs font-medium transition-colors',
                slaFilter === f.key ? 'bg-slate-800 text-white' : 'text-slate-500 hover:bg-slate-200',
              )}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Bulk actions */}
        {selectedRows.size > 0 && (
          <div className="ml-2 flex items-center gap-2 border-l border-slate-200 pl-3">
            <span className="text-xs text-blue-600 font-medium">{selectedRows.size} selected</span>
            <button className="h-7 rounded border border-slate-300 bg-white px-2.5 text-xs text-slate-600 hover:bg-slate-50">
              Bulk Update Status
            </button>
            <button className="h-7 rounded border border-slate-300 bg-white px-2.5 text-xs text-slate-600 hover:bg-slate-50">
              Export Selected
            </button>
          </div>
        )}

        <span className="ml-auto text-xs text-slate-400">{filtered.length} results</span>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        <table className="w-full border-collapse text-xs">
          <thead className="sticky top-0 z-10 bg-slate-50">
            <tr className="border-b border-slate-200">
              <th className="w-10 px-4 py-3 text-left">
                <input
                  type="checkbox"
                  checked={selectedRows.size === filtered.length && filtered.length > 0}
                  onChange={toggleAll}
                  className="rounded border-slate-300 text-blue-600"
                />
              </th>
              <Th w="w-28">Dispatch ID</Th>
              <Th w="w-20">Status</Th>
              <Th w="w-28">Route</Th>
              <Th>Origin → Destination</Th>
              <Th w="w-28">Vehicle / Driver</Th>
              <Th w="w-36">Carrier</Th>
              <Th w="w-28">Sched. Departure</Th>
              <Th w="w-28">Actual Departure</Th>
              <Th w="w-28">Sched. Arrival</Th>
              <Th w="w-28">Actual Arrival</Th>
              <Th w="w-12" align="center">HUs</Th>
              <Th w="w-40">SLA</Th>
              <Th w="w-10" align="center">Exc</Th>
              <Th w="w-20">Priority</Th>
              <Th w="w-16" align="center">Actions</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={17} className="py-16 text-center text-sm text-slate-400">
                  No dispatches match your filters.
                </td>
              </tr>
            ) : (
              filtered.map(d => (
                <DispatchRow
                  key={d.id}
                  dispatch={d}
                  selected={selectedRows.has(d.id)}
                  onToggle={() => toggleRow(d.id)}
                  onOpen={() => navigate(`/dispatch/${d.id}`)}
                />
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
    </>
  )
}

function Th({ children, w, align }: { children: React.ReactNode; w?: string; align?: string }) {
  return (
    <th className={cn(
      'px-3 py-3 text-xxs font-semibold uppercase tracking-wide text-slate-400',
      align === 'center' ? 'text-center' : 'text-left',
      w,
    )}>
      {children}
    </th>
  )
}

function DispatchRow({
  dispatch: d, selected, onToggle, onOpen,
}: {
  dispatch: DispatchRecord
  selected: boolean
  onToggle: () => void
  onOpen: () => void
}) {
  const rowBg = d.slaStatus === 'breached'
    ? 'bg-red-50/40 hover:bg-red-50'
    : d.slaStatus === 'at-risk'
      ? 'bg-amber-50/30 hover:bg-amber-50'
      : 'hover:bg-slate-50'

  return (
    <tr className={cn('transition-colors cursor-pointer group', rowBg, selected && 'bg-blue-50 hover:bg-blue-50')}
      onClick={onOpen}
    >
      {/* Checkbox */}
      <td className="px-4 py-2.5" onClick={e => { e.stopPropagation(); onToggle() }}>
        <input type="checkbox" checked={selected} onChange={onToggle}
          className="rounded border-slate-300 text-blue-600" />
      </td>

      {/* ID + priority dot */}
      <td className="px-3 py-2.5">
        <div className="flex items-center gap-1.5">
          {d.priority === 'critical' && <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse shrink-0" />}
          {d.priority === 'high' && <span className="h-2 w-2 rounded-full bg-amber-500 shrink-0" />}
          <span className="font-semibold text-slate-800">{d.id}</span>
        </div>
        <div className="text-slate-400 mt-0.5">{timeAgo(d.plannedDeparture)}</div>
      </td>

      {/* Status */}
      <td className="px-3 py-2.5">
        <StatusBadge status={d.status} size="xs" />
      </td>

      {/* Route */}
      <td className="px-3 py-2.5">
        <span className="font-mono text-xs font-semibold text-slate-700">{d.routeCode}</span>
      </td>

      {/* Origin → Dest */}
      <td className="px-3 py-2.5 max-w-[220px]">
        <div className="flex items-center gap-1 truncate">
          <span className="truncate text-slate-600">{d.origin.split(' (')[0]}</span>
          <span className="text-slate-300 shrink-0">→</span>
          <span className="truncate text-slate-600">{d.destination.split(' (')[0]}</span>
        </div>
      </td>

      {/* Vehicle */}
      <td className="px-3 py-2.5">
        <div className="font-mono font-semibold text-slate-700">{d.vehicleReg}</div>
        <div className="text-slate-400 truncate max-w-[100px]">{d.driverName}</div>
      </td>

      {/* Carrier */}
      <td className="px-3 py-2.5">
        <span className="truncate text-slate-600 block max-w-[140px]">{d.carrier}</span>
      </td>

      {/* Scheduled Departure */}
      <td className="px-3 py-2.5 whitespace-nowrap text-slate-600">
        {new Date(d.plannedDeparture).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
        {' '}<span className="text-slate-400">{new Date(d.plannedDeparture).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
      </td>

      {/* Actual Departure */}
      <td className="px-3 py-2.5 whitespace-nowrap">
        {d.actualDeparture
          ? <span className="text-slate-600">{new Date(d.actualDeparture).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })} <span className="text-slate-400">{new Date(d.actualDeparture).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span></span>
          : <span className="text-slate-300">—</span>
        }
      </td>

      {/* Scheduled Arrival */}
      <td className="px-3 py-2.5 whitespace-nowrap text-slate-600">
        {new Date(d.plannedArrival).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
        {' '}<span className="text-slate-400">{new Date(d.plannedArrival).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
      </td>

      {/* Actual Arrival */}
      <td className="px-3 py-2.5 whitespace-nowrap">
        {d.actualArrival
          ? <span className="text-slate-600">{new Date(d.actualArrival).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })} <span className="text-slate-400">{new Date(d.actualArrival).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span></span>
          : <span className="text-slate-300">—</span>
        }
      </td>

      {/* HU count */}
      <td className="px-3 py-2.5 text-center tabular-nums text-slate-700">{d.huCount}</td>

      {/* SLA */}
      <td className="px-3 py-2.5 w-40">
        {d.status === 'reconciled' || d.status === 'closed' ? (
          <span className="flex items-center gap-1 text-xs text-green-600 font-medium">
            <CheckCircle2 size={12} />Completed
          </span>
        ) : (
          <SLAClock
            hoursRemaining={d.slaStatus === 'breached' ? -(d.slaHoursOverdue ?? 0) : (d.slaHoursRemaining ?? 0)}
            totalHours={d.slaTotalHours}
            variant="compact"
          />
        )}
      </td>

      {/* Exception count */}
      <td className="px-3 py-2.5 text-center">
        {d.exceptionCount > 0 ? (
          <span className={cn(
            'inline-flex h-5 w-5 items-center justify-center rounded-full text-xxs font-bold',
            d.exceptionCount >= 2 ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700',
          )}>
            {d.exceptionCount}
          </span>
        ) : (
          <span className="text-slate-300">—</span>
        )}
      </td>

      {/* Priority */}
      <td className="px-3 py-2.5">
        <span className={cn(
          'rounded-full px-2 py-0.5 text-xxs font-semibold capitalize',
          d.priority === 'critical' ? 'bg-red-100 text-red-700' :
          d.priority === 'high'     ? 'bg-amber-100 text-amber-700' :
          'bg-slate-100 text-slate-500',
        )}>
          {d.priority}
        </span>
      </td>

      {/* Actions */}
      <td className="px-3 py-2.5 text-center" onClick={e => e.stopPropagation()}>
        <button
          onClick={onOpen}
          className="flex h-6 w-6 items-center justify-center rounded text-slate-400 hover:bg-blue-50 hover:text-blue-600 transition-colors mx-auto"
          title="Open details"
        >
          <ExternalLink size={13} />
        </button>
      </td>
    </tr>
  )
}
