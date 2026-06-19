import React, { useState, useMemo } from 'react'
import {
  Truck, Clock, CheckCircle2, AlertTriangle, X, Plus,
  ChevronRight, MapPin, User, Phone, Package, ArrowRight,
  Timer, Activity, LogIn, LogOut, Loader2,
} from 'lucide-react'
import { cn, timeAgo } from '@/lib/utils'
import {
  HUB_VEHICLES, HUBS, CARRIERS_LIST, STATUS_LABEL, STATUS_ORDER,
  hubDwellMins, loadingTimeMins, turnaroundMins, fmtMins, isDelayed,
  type HubVehicle, type HubStatus, type VehicleType,
} from './mock/data'

// ─── Status config ────────────────────────────────────────────────────────────

const STATUS_STYLE: Record<HubStatus, { bg: string; text: string; dot: string }> = {
  arrived:    { bg: 'bg-slate-100',   text: 'text-slate-600',  dot: 'bg-slate-400'  },
  gate_in:    { bg: 'bg-blue-50',     text: 'text-blue-700',   dot: 'bg-blue-500'   },
  loading:    { bg: 'bg-amber-50',    text: 'text-amber-700',  dot: 'bg-amber-500'  },
  loaded:     { bg: 'bg-violet-50',   text: 'text-violet-700', dot: 'bg-violet-500' },
  gate_out:   { bg: 'bg-green-50',    text: 'text-green-700',  dot: 'bg-green-500'  },
  dispatched: { bg: 'bg-slate-50',    text: 'text-slate-500',  dot: 'bg-slate-300'  },
}

const NEXT_ACTION: Partial<Record<HubStatus, { label: string; next: HubStatus; color: string }>> = {
  arrived:  { label: 'Gate In',          next: 'gate_in',   color: 'bg-blue-600 hover:bg-blue-700'   },
  gate_in:  { label: 'Start Loading',    next: 'loading',   color: 'bg-amber-500 hover:bg-amber-600' },
  loading:  { label: 'Loading Complete', next: 'loaded',    color: 'bg-violet-600 hover:bg-violet-700' },
  loaded:   { label: 'Gate Out',         next: 'gate_out',  color: 'bg-green-600 hover:bg-green-700' },
  gate_out: { label: 'Dispatch',         next: 'dispatched',color: 'bg-blue-700 hover:bg-blue-800'   },
}

const PRIORITY_BADGE: Record<string, string> = {
  urgent:  'bg-red-100 text-red-700',
  delayed: 'bg-amber-100 text-amber-700',
  normal:  'bg-slate-100 text-slate-500',
}

// ─── Add Vehicle Modal ────────────────────────────────────────────────────────

function AddVehicleModal({ onClose, onAdd }: {
  onClose: () => void
  onAdd: (v: HubVehicle) => void
}) {
  const inCls = 'w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100'
  const [form, setForm] = useState({
    vehicleNumber: '', vehicleType: 'FTL' as VehicleType,
    carrier: '', driverName: '', driverMobile: '',
    routeCode: '', origin: '', destination: '',
    plannedHUs: '', weightKg: '', plannedDeparture: '',
    remarks: '',
  })
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  function handleSubmit() {
    if (!form.vehicleNumber || !form.carrier || !form.driverName || !form.driverMobile) {
      alert('Please fill in Vehicle Number, Carrier, Driver Name, and Mobile')
      return
    }
    const now = new Date().toISOString()
    const newVehicle: HubVehicle = {
      id: `HV-${String(Date.now()).slice(-4)}`,
      vehicleNumber: form.vehicleNumber.toUpperCase(),
      vehicleType: form.vehicleType,
      carrier: form.carrier,
      driverName: form.driverName,
      driverMobile: form.driverMobile,
      routeCode: form.routeCode || 'TBD',
      origin: form.origin || 'Hub',
      destination: form.destination || 'TBD',
      plannedHUs: parseInt(form.plannedHUs) || 0,
      loadedHUs: 0,
      weightKg: parseInt(form.weightKg) || 0,
      status: 'arrived',
      priority: 'normal',
      arrivedAt: now,
      plannedDeparture: form.plannedDeparture || new Date(Date.now() + 4 * 3600000).toISOString(),
      remarks: form.remarks || undefined,
    }
    onAdd(newVehicle)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-modal flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="w-[640px] max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50">
              <Truck size={15} className="text-blue-600" />
            </div>
            <h2 className="text-base font-bold text-slate-900">Register Arriving Vehicle</h2>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 hover:bg-slate-100">
            <X size={16} className="text-slate-400" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-5">
          {/* Vehicle details */}
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">Vehicle Details</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xxs font-semibold uppercase tracking-wide text-slate-400">Vehicle Number *</label>
                <input value={form.vehicleNumber} onChange={e => set('vehicleNumber', e.target.value)} placeholder="MH12AB3456" className={inCls} />
              </div>
              <div>
                <label className="mb-1 block text-xxs font-semibold uppercase tracking-wide text-slate-400">Vehicle Type</label>
                <select value={form.vehicleType} onChange={e => set('vehicleType', e.target.value as VehicleType)} className={inCls}>
                  {(['FTL','LTL','LCV','Trailer','Reefer'] as VehicleType[]).map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xxs font-semibold uppercase tracking-wide text-slate-400">Carrier *</label>
                <select value={form.carrier} onChange={e => set('carrier', e.target.value)} className={inCls}>
                  <option value="">Select carrier…</option>
                  {CARRIERS_LIST.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xxs font-semibold uppercase tracking-wide text-slate-400">Planned Departure</label>
                <input type="datetime-local" value={form.plannedDeparture} onChange={e => set('plannedDeparture', e.target.value)} className={inCls} />
              </div>
            </div>
          </div>

          {/* Driver */}
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">Driver Details</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xxs font-semibold uppercase tracking-wide text-slate-400">Driver Name *</label>
                <input value={form.driverName} onChange={e => set('driverName', e.target.value)} placeholder="Full name" className={inCls} />
              </div>
              <div>
                <label className="mb-1 block text-xxs font-semibold uppercase tracking-wide text-slate-400">Driver Mobile *</label>
                <input value={form.driverMobile} onChange={e => set('driverMobile', e.target.value)} placeholder="10-digit mobile" className={inCls} />
              </div>
            </div>
          </div>

          {/* Route */}
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">Route & Cargo</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xxs font-semibold uppercase tracking-wide text-slate-400">Route Code</label>
                <input value={form.routeCode} onChange={e => set('routeCode', e.target.value)} placeholder="MUM-BLR-03" className={inCls} />
              </div>
              <div>
                <label className="mb-1 block text-xxs font-semibold uppercase tracking-wide text-slate-400">Origin</label>
                <input value={form.origin} onChange={e => set('origin', e.target.value)} placeholder="Hub / depot name" className={inCls} />
              </div>
              <div>
                <label className="mb-1 block text-xxs font-semibold uppercase tracking-wide text-slate-400">Destination</label>
                <input value={form.destination} onChange={e => set('destination', e.target.value)} placeholder="Destination WH" className={inCls} />
              </div>
              <div>
                <label className="mb-1 block text-xxs font-semibold uppercase tracking-wide text-slate-400">Planned HUs</label>
                <input type="number" value={form.plannedHUs} onChange={e => set('plannedHUs', e.target.value)} placeholder="0" className={inCls} />
              </div>
              <div>
                <label className="mb-1 block text-xxs font-semibold uppercase tracking-wide text-slate-400">Weight (kg)</label>
                <input type="number" value={form.weightKg} onChange={e => set('weightKg', e.target.value)} placeholder="0" className={inCls} />
              </div>
              <div>
                <label className="mb-1 block text-xxs font-semibold uppercase tracking-wide text-slate-400">Remarks</label>
                <input value={form.remarks} onChange={e => set('remarks', e.target.value)} placeholder="Optional notes" className={inCls} />
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-slate-200 px-6 py-4">
          <button onClick={onClose} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50">Cancel</button>
          <button onClick={handleSubmit} className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700">
            Register Vehicle
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Workflow progress bar ─────────────────────────────────────────────────────

function WorkflowProgress({ status }: { status: HubStatus }) {
  const steps = STATUS_ORDER.filter(s => s !== 'dispatched')
  const currentIdx = STATUS_ORDER.indexOf(status)

  return (
    <div className="flex items-center gap-0">
      {steps.map((step, i) => {
        const stepIdx = STATUS_ORDER.indexOf(step)
        const done    = stepIdx < currentIdx
        const active  = stepIdx === currentIdx
        const isLast  = i === steps.length - 1

        return (
          <React.Fragment key={step}>
            <div className="flex flex-col items-center gap-1">
              <div className={cn(
                'flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-all',
                done   ? 'bg-green-500 text-white' :
                active ? 'bg-blue-600 text-white ring-4 ring-blue-100' :
                         'bg-slate-200 text-slate-400',
              )}>
                {done ? <CheckCircle2 size={14} /> : i + 1}
              </div>
              <span className={cn(
                'text-xxs font-medium whitespace-nowrap',
                done   ? 'text-green-600' :
                active ? 'text-blue-700' :
                         'text-slate-400',
              )}>
                {STATUS_LABEL[step]}
              </span>
            </div>
            {!isLast && (
              <div className={cn(
                'h-0.5 w-12 mx-1 mb-4 transition-colors',
                done ? 'bg-green-400' : 'bg-slate-200',
              )} />
            )}
          </React.Fragment>
        )
      })}
      {/* Final state */}
      <div className="h-0.5 w-12 mx-1 mb-4 bg-slate-200" />
      <div className="flex flex-col items-center gap-1">
        <div className={cn(
          'flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold',
          status === 'dispatched' ? 'bg-blue-700 text-white' : 'bg-slate-200 text-slate-400',
        )}>
          {status === 'dispatched' ? <CheckCircle2 size={14} /> : 6}
        </div>
        <span className={cn('text-xxs font-medium', status === 'dispatched' ? 'text-blue-700' : 'text-slate-400')}>
          Dispatched
        </span>
      </div>
    </div>
  )
}

// ─── Vehicle detail panel ──────────────────────────────────────────────────────

function VehicleDetail({ vehicle, onClose, onAdvance }: {
  vehicle: HubVehicle
  onClose: () => void
  onAdvance: (id: string) => void
}) {
  const action  = NEXT_ACTION[vehicle.status]
  const dwell   = hubDwellMins(vehicle)
  const loading = loadingTimeMins(vehicle)
  const tat     = turnaroundMins(vehicle)
  const delayed = isDelayed(vehicle)
  const st      = STATUS_STYLE[vehicle.status]

  function TimeRow({ label, value }: { label: string; value?: string }) {
    return (
      <div className="flex items-center justify-between py-1.5 border-b border-slate-50 last:border-0">
        <span className="text-xs text-slate-500">{label}</span>
        <span className="text-xs font-medium text-slate-800">
          {value ? new Date(value).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : <span className="text-slate-300">—</span>}
        </span>
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col bg-white overflow-hidden">
      {/* Header */}
      <div className="flex items-start justify-between border-b border-slate-200 px-5 py-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono text-sm font-bold text-slate-900">{vehicle.vehicleNumber}</span>
            <span className={cn('rounded-full px-2.5 py-0.5 text-xxs font-bold', st.bg, st.text)}>
              {STATUS_LABEL[vehicle.status]}
            </span>
            {delayed && (
              <span className="rounded-full bg-red-100 px-2 py-0.5 text-xxs font-bold text-red-700">DELAYED</span>
            )}
          </div>
          <p className="text-xs text-slate-500">{vehicle.vehicleType} · {vehicle.carrier}</p>
        </div>
        <button onClick={onClose} className="rounded-lg p-1.5 hover:bg-slate-100">
          <X size={14} className="text-slate-400" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
        {/* Workflow progress */}
        <div className="flex justify-center py-2 overflow-x-auto">
          <WorkflowProgress status={vehicle.status} />
        </div>

        {/* Driver info */}
        <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 space-y-2">
          <p className="text-xxs font-semibold uppercase tracking-wide text-slate-400 mb-2">Driver</p>
          <div className="flex items-center gap-2">
            <User size={13} className="text-slate-400" />
            <span className="text-xs font-medium text-slate-700">{vehicle.driverName}</span>
          </div>
          <div className="flex items-center gap-2">
            <Phone size={13} className="text-slate-400" />
            <span className="text-xs text-slate-600">{vehicle.driverMobile}</span>
          </div>
        </div>

        {/* Route */}
        <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
          <p className="text-xxs font-semibold uppercase tracking-wide text-slate-400 mb-2">Route</p>
          <p className="text-xs font-semibold text-blue-700 mb-2">{vehicle.routeCode}</p>
          <div className="flex items-start gap-2">
            <MapPin size={12} className="text-green-500 mt-0.5 shrink-0" />
            <span className="text-xs text-slate-600">{vehicle.origin}</span>
          </div>
          <div className="ml-3 border-l border-dashed border-slate-300 my-1 h-3" />
          <div className="flex items-start gap-2">
            <MapPin size={12} className="text-red-500 mt-0.5 shrink-0" />
            <span className="text-xs text-slate-600">{vehicle.destination}</span>
          </div>
        </div>

        {/* HU & Weight */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-center">
            <p className="text-xxs text-slate-400 mb-1">HUs Planned / Loaded</p>
            <p className="text-lg font-bold text-slate-800">
              {vehicle.loadedHUs}<span className="text-sm text-slate-400">/{vehicle.plannedHUs}</span>
            </p>
            {vehicle.loadedHUs > 0 && vehicle.loadedHUs < vehicle.plannedHUs && (
              <div className="mt-1 h-1.5 w-full rounded-full bg-slate-200 overflow-hidden">
                <div
                  className="h-full rounded-full bg-amber-500"
                  style={{ width: `${(vehicle.loadedHUs / vehicle.plannedHUs) * 100}%` }}
                />
              </div>
            )}
            {vehicle.loadedHUs === vehicle.plannedHUs && vehicle.loadedHUs > 0 && (
              <p className="text-xxs text-green-600 font-semibold mt-1">Complete</p>
            )}
          </div>
          <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-center">
            <p className="text-xxs text-slate-400 mb-1">Weight</p>
            <p className="text-lg font-bold text-slate-800">{vehicle.weightKg.toLocaleString()}</p>
            <p className="text-xxs text-slate-400">kg</p>
          </div>
        </div>

        {/* Timeline */}
        <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
          <p className="text-xxs font-semibold uppercase tracking-wide text-slate-400 mb-2">Timeline</p>
          <TimeRow label="Arrived"           value={vehicle.arrivedAt} />
          <TimeRow label="Gate In"           value={vehicle.gateInAt} />
          <TimeRow label="Loading Start"     value={vehicle.loadingStartAt} />
          <TimeRow label="Loading Complete"  value={vehicle.loadingCompleteAt} />
          <TimeRow label="Gate Out"          value={vehicle.gateOutAt} />
          <TimeRow label="Dispatched"        value={vehicle.dispatchedAt} />
          <div className="mt-2 pt-2 border-t border-slate-100">
            <TimeRow label="Planned Departure" value={vehicle.plannedDeparture} />
          </div>
        </div>

        {/* Auto-calculated metrics */}
        <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
          <p className="text-xxs font-semibold uppercase tracking-wide text-slate-400 mb-3">Computed Metrics</p>
          <div className="space-y-2">
            <MetricRow
              label="Hub Dwell Time"
              value={dwell !== null ? fmtMins(dwell) : null}
              note="Gate In → Gate Out"
              warn={dwell !== null && dwell > 180}
            />
            <MetricRow
              label="Loading Time"
              value={loading !== null ? fmtMins(loading) : null}
              note="Load Start → Complete"
              warn={loading !== null && loading > 120}
            />
            <MetricRow
              label="Vehicle Turnaround"
              value={tat !== null ? fmtMins(tat) : null}
              note="Arrived → Dispatched"
              warn={tat !== null && tat > 300}
            />
          </div>
        </div>

        {vehicle.remarks && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
            <p className="text-xxs font-semibold uppercase tracking-wide text-amber-600 mb-1">Remarks</p>
            <p className="text-xs text-amber-800 leading-relaxed">{vehicle.remarks}</p>
          </div>
        )}
      </div>

      {/* Action footer */}
      {action && (
        <div className="border-t border-slate-200 px-5 py-3">
          <button
            onClick={() => onAdvance(vehicle.id)}
            className={cn('w-full rounded-xl py-3 text-sm font-bold text-white transition-colors flex items-center justify-center gap-2', action.color)}
          >
            <ArrowRight size={16} />
            {action.label}
          </button>
          <p className="mt-1.5 text-center text-xxs text-slate-400">
            {new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })} · Tap to record timestamp
          </p>
        </div>
      )}
    </div>
  )
}

function MetricRow({ label, value, note, warn }: {
  label: string; value: string | null; note: string; warn?: boolean
}) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <p className="text-xs text-slate-600">{label}</p>
        <p className="text-xxs text-slate-400">{note}</p>
      </div>
      <span className={cn('text-sm font-bold tabular-nums', value ? (warn ? 'text-red-600' : 'text-green-600') : 'text-slate-300')}>
        {value ?? '—'}
      </span>
    </div>
  )
}

// ─── Vehicle row in table ──────────────────────────────────────────────────────

function VehicleRow({ vehicle, isSelected, onClick }: {
  vehicle: HubVehicle
  isSelected: boolean
  onClick: () => void
}) {
  const st      = STATUS_STYLE[vehicle.status]
  const delayed = isDelayed(vehicle)

  return (
    <tr
      onClick={onClick}
      className={cn(
        'cursor-pointer border-b border-slate-100 transition-colors',
        isSelected ? 'bg-blue-50' :
        delayed    ? 'bg-red-50/40 hover:bg-red-50' :
        vehicle.priority === 'urgent' ? 'bg-amber-50/40 hover:bg-amber-50' :
        'hover:bg-slate-50',
      )}
    >
      <td className="px-4 py-3">
        <p className="font-mono text-xs font-bold text-slate-800">{vehicle.vehicleNumber}</p>
        <p className="text-xxs text-slate-400">{vehicle.vehicleType}</p>
      </td>
      <td className="px-4 py-3 text-xs text-slate-600 max-w-[130px] truncate">{vehicle.carrier}</td>
      <td className="px-4 py-3">
        <span className={cn('rounded-full px-2.5 py-0.5 text-xxs font-bold flex items-center gap-1 w-fit', st.bg, st.text)}>
          <span className={cn('h-1.5 w-1.5 rounded-full', st.dot)} />
          {STATUS_LABEL[vehicle.status]}
        </span>
      </td>
      <td className="px-4 py-3 text-xs text-slate-500 max-w-[120px] truncate">{vehicle.destination.split('(')[0].trim()}</td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-1.5 text-xs">
          <span className="tabular-nums text-slate-700">{vehicle.loadedHUs}</span>
          <span className="text-slate-300">/</span>
          <span className="tabular-nums text-slate-400">{vehicle.plannedHUs}</span>
        </div>
        {vehicle.loadedHUs > 0 && vehicle.loadedHUs < vehicle.plannedHUs && (
          <div className="mt-1 h-1 w-16 rounded-full bg-slate-100 overflow-hidden">
            <div className="h-full rounded-full bg-amber-400" style={{ width: `${(vehicle.loadedHUs / vehicle.plannedHUs) * 100}%` }} />
          </div>
        )}
      </td>
      <td className="px-4 py-3">
        {delayed
          ? <span className="rounded-full bg-red-100 px-2 py-0.5 text-xxs font-bold text-red-700">DELAYED</span>
          : vehicle.priority === 'urgent'
            ? <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xxs font-bold text-amber-700">URGENT</span>
            : <span className="text-xs text-slate-300">—</span>}
      </td>
      <td className="px-4 py-3 text-xs text-slate-400">
        {vehicle.arrivedAt ? timeAgo(vehicle.arrivedAt) : '—'}
      </td>
      <td className="px-4 py-3 text-right">
        <ChevronRight size={14} className={cn('transition-transform', isSelected ? 'text-blue-500 rotate-90' : 'text-slate-300')} />
      </td>
    </tr>
  )
}

// ─── Main page ─────────────────────────────────────────────────────────────────

export function HubOperations() {
  const [vehicles, setVehicles]     = useState<HubVehicle[]>(HUB_VEHICLES)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<HubStatus | 'all'>('all')
  const [selectedHub, setSelectedHub] = useState(HUBS[0].id)
  const [showAddModal, setShowAddModal] = useState(false)

  const filtered = useMemo(() =>
    vehicles.filter(v => statusFilter === 'all' || v.status === statusFilter),
    [vehicles, statusFilter],
  )

  const selected = selectedId ? vehicles.find(v => v.id === selectedId) ?? null : null

  // KPI counts
  const kpis = useMemo(() => ({
    waiting:    vehicles.filter(v => v.status === 'arrived').length,
    gateIn:     vehicles.filter(v => v.status === 'gate_in').length,
    loading:    vehicles.filter(v => v.status === 'loading').length,
    loaded:     vehicles.filter(v => v.status === 'loaded').length,
    delayed:    vehicles.filter(v => isDelayed(v)).length,
    gateOutPending: vehicles.filter(v => v.status === 'loaded').length,
    dispatched: vehicles.filter(v => v.status === 'dispatched').length,
  }), [vehicles])

  function advanceVehicle(id: string) {
    setVehicles(prev => prev.map(v => {
      if (v.id !== id) return v
      const action = NEXT_ACTION[v.status]
      if (!action) return v
      const now = new Date().toISOString()
      const updates: Partial<HubVehicle> = { status: action.next }
      if (action.next === 'gate_in')    updates.gateInAt = now
      if (action.next === 'loading')    updates.loadingStartAt = now
      if (action.next === 'loaded')     updates.loadingCompleteAt = now
      if (action.next === 'gate_out')   updates.gateOutAt = now
      if (action.next === 'dispatched') updates.dispatchedAt = now
      return { ...v, ...updates }
    }))
  }

  function addVehicle(v: HubVehicle) {
    setVehicles(prev => [v, ...prev])
    setSelectedId(v.id)
  }

  const hubLabel = HUBS.find(h => h.id === selectedHub)?.label ?? 'Hub'

  return (
    <>
      {showAddModal && <AddVehicleModal onClose={() => setShowAddModal(false)} onAdd={addVehicle} />}

      <div className="flex flex-col h-full bg-slate-50">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
          <div>
            <h1 className="text-lg font-bold text-slate-900">Origin Hub Operations</h1>
            <p className="text-xs text-slate-400">Gate-to-dispatch workflow · Real-time vehicle tracking</p>
          </div>
          <div className="flex items-center gap-3">
            {/* Hub selector */}
            <select
              value={selectedHub}
              onChange={e => setSelectedHub(e.target.value)}
              className="h-8 rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-100"
            >
              {HUBS.map(h => <option key={h.id} value={h.id}>{h.label}</option>)}
            </select>
            <button
              onClick={() => setShowAddModal(true)}
              className="flex h-8 items-center gap-1.5 rounded-lg bg-blue-600 px-3 text-xs font-semibold text-white hover:bg-blue-700"
            >
              <Plus size={13} />
              Vehicle Arrived
            </button>
          </div>
        </div>

        {/* KPI strip */}
        <div className="grid grid-cols-7 gap-3 border-b border-slate-200 bg-white px-6 py-4">
          {[
            { label: 'Waiting',       value: kpis.waiting,         icon: Clock,      color: 'text-slate-700', bg: 'bg-slate-50 border-slate-100',  onClick: () => setStatusFilter('arrived')   },
            { label: 'Gate In',       value: kpis.gateIn,          icon: LogIn,      color: 'text-blue-600',  bg: 'bg-blue-50 border-blue-100',    onClick: () => setStatusFilter('gate_in')   },
            { label: 'Loading',       value: kpis.loading,         icon: Loader2,    color: 'text-amber-600', bg: 'bg-amber-50 border-amber-100',  onClick: () => setStatusFilter('loading')   },
            { label: 'Gate Out Pending', value: kpis.gateOutPending, icon: Package, color: 'text-violet-600',bg: 'bg-violet-50 border-violet-100',onClick: () => setStatusFilter('loaded')    },
            { label: 'Delayed',       value: kpis.delayed,         icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50 border-red-100',   onClick: () => setStatusFilter('all')       },
            { label: 'Gate Out',      value: vehicles.filter(v => v.status === 'gate_out').length, icon: LogOut, color: 'text-green-600', bg: 'bg-green-50 border-green-100', onClick: () => setStatusFilter('gate_out') },
            { label: 'Dispatched',    value: kpis.dispatched,      icon: CheckCircle2, color: 'text-blue-700', bg: 'bg-blue-50 border-blue-100', onClick: () => setStatusFilter('dispatched') },
          ].map(k => (
            <button
              key={k.label}
              onClick={k.onClick}
              className={cn('rounded-xl border px-3 py-3 text-left transition-all hover:shadow-sm', k.bg)}
            >
              <div className="flex items-center justify-between mb-1">
                <p className="text-xxs font-semibold uppercase tracking-wide text-slate-400">{k.label}</p>
                <k.icon size={13} className={k.color} />
              </div>
              <p className={cn('text-2xl font-bold tabular-nums', k.color)}>{k.value}</p>
            </button>
          ))}
        </div>

        {/* Status filter pills + count */}
        <div className="flex items-center gap-2 border-b border-slate-200 bg-white px-6 py-2.5">
          <span className="text-xxs font-semibold uppercase tracking-wide text-slate-400 mr-1">Filter:</span>
          {(['all', ...STATUS_ORDER] as const).map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={cn(
                'rounded-full px-3 py-1 text-xs font-medium capitalize transition-colors',
                statusFilter === s
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200',
              )}
            >
              {s === 'all' ? 'All' : STATUS_LABEL[s]}
              {' '}
              <span className="opacity-70">
                ({s === 'all' ? vehicles.length : vehicles.filter(v => v.status === s).length})
              </span>
            </button>
          ))}
          <span className="ml-auto text-xs text-slate-400">{filtered.length} vehicle{filtered.length !== 1 ? 's' : ''} · {hubLabel}</span>
        </div>

        {/* Body: table + detail */}
        <div className="flex flex-1 min-h-0 overflow-hidden">
          {/* Table */}
          <div className="flex-1 overflow-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-slate-50 border-b border-slate-200 z-10">
                <tr>
                  {['Vehicle', 'Carrier', 'Status', 'Destination', 'HUs', 'Priority', 'Arrived', ''].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xxs font-semibold uppercase tracking-wide text-slate-400">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-20 text-center text-sm text-slate-400">
                      <Truck size={28} className="mx-auto mb-2 text-slate-300" />
                      No vehicles match this filter
                    </td>
                  </tr>
                ) : (
                  filtered.map(v => (
                    <VehicleRow
                      key={v.id}
                      vehicle={v}
                      isSelected={selectedId === v.id}
                      onClick={() => setSelectedId(prev => prev === v.id ? null : v.id)}
                    />
                  ))
                )}
              </tbody>
            </table>

            {/* Summary footer */}
            {filtered.length > 0 && (
              <div className="border-t border-slate-100 px-4 py-3 bg-slate-50 flex items-center gap-6 text-xxs text-slate-500">
                <span>Total HUs planned: <strong className="text-slate-700">{filtered.reduce((s, v) => s + v.plannedHUs, 0)}</strong></span>
                <span>Total HUs loaded: <strong className="text-slate-700">{filtered.reduce((s, v) => s + v.loadedHUs, 0)}</strong></span>
                <span>Total weight: <strong className="text-slate-700">{filtered.reduce((s, v) => s + v.weightKg, 0).toLocaleString()} kg</strong></span>
              </div>
            )}
          </div>

          {/* Detail panel */}
          {selected && (
            <div className="w-[400px] shrink-0 flex flex-col border-l border-slate-200">
              <VehicleDetail
                vehicle={selected}
                onClose={() => setSelectedId(null)}
                onAdvance={(id) => advanceVehicle(id)}
              />
            </div>
          )}
        </div>
      </div>
    </>
  )
}
