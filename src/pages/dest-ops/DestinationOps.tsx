import React, { useState, useMemo, useRef, useEffect } from 'react'
import {
  Truck, Package, Clock, CheckCircle2, AlertTriangle, X, Plus,
  ArrowRight, MapPin, User, Phone, Search, ChevronDown,
  LogIn, Dock, ClipboardCheck, GitMerge, Lock,
  TriangleAlert, PackageCheck, ScanLine, Loader2, Navigation,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useActiveFilters } from '@/hooks/useActiveFilters'
import {
  DEST_VEHICLES, DEST_HUBS, CARRIERS_LIST, DOCK_NUMBERS,
  DEST_STATUS_ORDER, DEST_STATUS_LABEL,
  dockDwellMins, unloadingTimeMins, totalCycleMins, fmtMins, isOverdue, huVariance,
  type DestVehicle, type DestStatus, type VehicleType,
} from './mock/data'

// ─── Status config ─────────────────────────────────────────────────────────────

const STATUS_STYLE: Record<DestStatus, { bg: string; ring: string; text: string; dot: string; card: string }> = {
  in_transit:        { bg: 'bg-slate-100',   ring: 'ring-slate-200',   text: 'text-slate-500',  dot: 'bg-slate-400',  card: 'bg-slate-50   border-slate-200'  },
  arrived:           { bg: 'bg-sky-100',     ring: 'ring-sky-200',     text: 'text-sky-700',    dot: 'bg-sky-500',    card: 'bg-sky-50     border-sky-200'     },
  gate_in:           { bg: 'bg-blue-100',    ring: 'ring-blue-200',    text: 'text-blue-700',   dot: 'bg-blue-500',   card: 'bg-blue-50    border-blue-200'    },
  dock_assigned:     { bg: 'bg-indigo-100',  ring: 'ring-indigo-200',  text: 'text-indigo-700', dot: 'bg-indigo-500', card: 'bg-indigo-50  border-indigo-200'  },
  unloading:         { bg: 'bg-amber-100',   ring: 'ring-amber-200',   text: 'text-amber-700',  dot: 'bg-amber-500',  card: 'bg-amber-50   border-amber-200'   },
  unloaded:          { bg: 'bg-violet-100',  ring: 'ring-violet-200',  text: 'text-violet-700', dot: 'bg-violet-500', card: 'bg-violet-50  border-violet-200'  },
  receipt_confirmed: { bg: 'bg-teal-100',    ring: 'ring-teal-200',    text: 'text-teal-700',   dot: 'bg-teal-500',   card: 'bg-teal-50    border-teal-200'    },
  reconciled:        { bg: 'bg-green-100',   ring: 'ring-green-200',   text: 'text-green-700',  dot: 'bg-green-500',  card: 'bg-green-50   border-green-200'   },
  closed:            { bg: 'bg-slate-100',   ring: 'ring-slate-200',   text: 'text-slate-500',  dot: 'bg-slate-300',  card: 'bg-slate-50   border-slate-200'   },
}

const NEXT_ACTION: Partial<Record<DestStatus, { label: string; icon: React.ElementType; next: DestStatus; color: string }>> = {
  arrived:           { label: 'Gate In',             icon: LogIn,         next: 'gate_in',           color: 'bg-blue-600  hover:bg-blue-700'   },
  gate_in:           { label: 'Assign Dock',          icon: Dock,          next: 'dock_assigned',     color: 'bg-indigo-600 hover:bg-indigo-700' },
  dock_assigned:     { label: 'Start Unloading',      icon: Loader2,       next: 'unloading',         color: 'bg-amber-500 hover:bg-amber-600'  },
  unloading:         { label: 'Unloading Complete',   icon: PackageCheck,  next: 'unloaded',          color: 'bg-violet-600 hover:bg-violet-700' },
  unloaded:          { label: 'Confirm Receipt',      icon: ClipboardCheck,next: 'receipt_confirmed', color: 'bg-teal-600  hover:bg-teal-700'   },
  receipt_confirmed: { label: 'Reconcile',            icon: GitMerge,      next: 'reconciled',        color: 'bg-green-600 hover:bg-green-700'  },
  reconciled:        { label: 'Close',                icon: Lock,          next: 'closed',            color: 'bg-slate-700 hover:bg-slate-800'  },
}

const PRIORITY_STYLE: Record<string, string> = {
  urgent:     'bg-red-100   text-red-700   border-red-200',
  sla_breach: 'bg-orange-100 text-orange-700 border-orange-200',
  normal:     '',
}

// ─── Dock input modal (for assign dock step) ──────────────────────────────────

function DockModal({ onConfirm, onClose }: { onConfirm: (dock: string) => void; onClose: () => void }) {
  const [dock, setDock] = useState('')
  return (
    <div className="fixed inset-0 z-modal flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="w-80 rounded-2xl bg-white p-6 shadow-xl" onClick={e => e.stopPropagation()}>
        <h3 className="mb-4 text-base font-bold text-slate-900">Assign Dock Number</h3>
        <div className="grid grid-cols-4 gap-2 mb-4">
          {DOCK_NUMBERS.map(d => (
            <button
              key={d}
              onClick={() => setDock(d)}
              className={cn(
                'rounded-xl py-3 text-sm font-bold border transition-all',
                dock === d
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-indigo-50',
              )}
            >
              {d}
            </button>
          ))}
        </div>
        <input
          value={dock}
          onChange={e => setDock(e.target.value.toUpperCase())}
          placeholder="Or type dock number…"
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-indigo-200"
        />
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50">Cancel</button>
          <button
            onClick={() => { if (dock) { onConfirm(dock); onClose() } }}
            disabled={!dock}
            className="flex-1 rounded-xl bg-indigo-600 py-2.5 text-sm font-bold text-white hover:bg-indigo-700 disabled:opacity-40"
          >
            Assign
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Register Arrival Modal ───────────────────────────────────────────────────

function ArrivalModal({ onClose, onAdd }: { onClose: () => void; onAdd: (v: DestVehicle) => void }) {
  const inCls = 'w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-800 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100'
  const [form, setForm] = useState({
    vehicleNumber: '', vehicleType: 'FTL' as VehicleType,
    carrier: '', driverName: '', driverMobile: '',
    routeCode: '', origin: '', plannedHUs: '', weightKg: '', remarks: '',
  })
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  function handleAdd() {
    if (!form.vehicleNumber || !form.carrier || !form.driverName || !form.driverMobile) {
      alert('Vehicle Number, Carrier, Driver Name, and Mobile are required')
      return
    }
    onAdd({
      id: `DV-${String(Date.now()).slice(-4)}`,
      vehicleNumber: form.vehicleNumber.toUpperCase(),
      vehicleType: form.vehicleType,
      carrier: form.carrier,
      driverName: form.driverName,
      driverMobile: form.driverMobile,
      routeCode: form.routeCode || 'TBD',
      origin: form.origin || 'Hub',
      destination: 'This Hub',
      plannedHUs: parseInt(form.plannedHUs) || 0,
      receivedHUs: 0, damagedHUs: 0, shortHUs: 0,
      weightKg: parseInt(form.weightKg) || 0,
      priority: 'normal',
      status: 'arrived',
      arrivedAt: new Date().toISOString(),
      plannedArrival: new Date().toISOString(),
      exceptionCount: 0,
      remarks: form.remarks || undefined,
    })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-modal flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="w-[560px] max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-50">
              <Truck size={15} className="text-sky-600" />
            </div>
            <h2 className="text-base font-bold text-slate-900">Register Inbound Arrival</h2>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 hover:bg-slate-100"><X size={16} className="text-slate-400" /></button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div><label className="mb-1 block text-xxs font-semibold uppercase tracking-wide text-slate-400">Vehicle Number *</label>
              <input value={form.vehicleNumber} onChange={e => set('vehicleNumber', e.target.value)} placeholder="MH12AB3456" className={inCls} /></div>
            <div><label className="mb-1 block text-xxs font-semibold uppercase tracking-wide text-slate-400">Vehicle Type</label>
              <select value={form.vehicleType} onChange={e => set('vehicleType', e.target.value as VehicleType)} className={inCls}>
                {(['FTL','LTL','LCV','Trailer','Reefer'] as VehicleType[]).map(t => <option key={t}>{t}</option>)}</select></div>
            <div><label className="mb-1 block text-xxs font-semibold uppercase tracking-wide text-slate-400">Carrier *</label>
              <select value={form.carrier} onChange={e => set('carrier', e.target.value)} className={inCls}>
                <option value="">Select carrier…</option>
                {CARRIERS_LIST.map(c => <option key={c}>{c}</option>)}</select></div>
            <div><label className="mb-1 block text-xxs font-semibold uppercase tracking-wide text-slate-400">Route Code</label>
              <input value={form.routeCode} onChange={e => set('routeCode', e.target.value)} placeholder="MUM-BLR-03" className={inCls} /></div>
            <div><label className="mb-1 block text-xxs font-semibold uppercase tracking-wide text-slate-400">Driver Name *</label>
              <input value={form.driverName} onChange={e => set('driverName', e.target.value)} placeholder="Full name" className={inCls} /></div>
            <div><label className="mb-1 block text-xxs font-semibold uppercase tracking-wide text-slate-400">Driver Mobile *</label>
              <input value={form.driverMobile} onChange={e => set('driverMobile', e.target.value)} placeholder="10-digit mobile" className={inCls} /></div>
            <div><label className="mb-1 block text-xxs font-semibold uppercase tracking-wide text-slate-400">Origin</label>
              <input value={form.origin} onChange={e => set('origin', e.target.value)} placeholder="Origin hub / depot" className={inCls} /></div>
            <div><label className="mb-1 block text-xxs font-semibold uppercase tracking-wide text-slate-400">Planned HUs</label>
              <input type="number" value={form.plannedHUs} onChange={e => set('plannedHUs', e.target.value)} placeholder="0" className={inCls} /></div>
            <div><label className="mb-1 block text-xxs font-semibold uppercase tracking-wide text-slate-400">Weight (kg)</label>
              <input type="number" value={form.weightKg} onChange={e => set('weightKg', e.target.value)} placeholder="0" className={inCls} /></div>
            <div><label className="mb-1 block text-xxs font-semibold uppercase tracking-wide text-slate-400">Remarks</label>
              <input value={form.remarks} onChange={e => set('remarks', e.target.value)} placeholder="Optional" className={inCls} /></div>
          </div>
        </div>
        <div className="flex justify-end gap-2 border-t border-slate-200 px-6 py-4">
          <button onClick={onClose} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50">Cancel</button>
          <button onClick={handleAdd} className="rounded-lg bg-sky-600 px-5 py-2 text-sm font-semibold text-white hover:bg-sky-700">Register Arrival</button>
        </div>
      </div>
    </div>
  )
}

// ─── Workflow steps bar ────────────────────────────────────────────────────────

function WorkflowSteps({ status }: { status: DestStatus }) {
  const steps = DEST_STATUS_ORDER.filter(s => s !== 'in_transit')
  const currentIdx = DEST_STATUS_ORDER.indexOf(status)

  return (
    <div className="overflow-x-auto pb-1">
      <div className="flex items-center gap-0 min-w-max">
        {steps.map((step, i) => {
          const stepIdx = DEST_STATUS_ORDER.indexOf(step)
          const done    = stepIdx < currentIdx
          const active  = stepIdx === currentIdx
          const isLast  = i === steps.length - 1

          return (
            <React.Fragment key={step}>
              <div className="flex flex-col items-center gap-1">
                <div className={cn(
                  'flex h-6 w-6 items-center justify-center rounded-full text-xxs font-bold transition-all',
                  done   ? 'bg-green-500 text-white' :
                  active ? 'bg-blue-600 text-white ring-4 ring-blue-100' :
                           'bg-slate-200 text-slate-400',
                )}>
                  {done ? <CheckCircle2 size={12} /> : i + 1}
                </div>
                <span className={cn(
                  'text-xxs font-medium whitespace-nowrap',
                  done   ? 'text-green-600' :
                  active ? 'text-blue-700 font-bold' :
                           'text-slate-400',
                )}>
                  {DEST_STATUS_LABEL[step]}
                </span>
              </div>
              {!isLast && (
                <div className={cn('h-0.5 w-8 mx-0.5 mb-4', done ? 'bg-green-400' : 'bg-slate-200')} />
              )}
            </React.Fragment>
          )
        })}
      </div>
    </div>
  )
}

// ─── Vehicle scan card (optimized for hub exec use) ──────────────────────────

function VehicleCard({ vehicle, isSelected, onClick }: {
  vehicle: DestVehicle
  isSelected: boolean
  onClick: () => void
}) {
  const st      = STATUS_STYLE[vehicle.status]
  const overdue = isOverdue(vehicle)
  const action  = NEXT_ACTION[vehicle.status]
  const variance = huVariance(vehicle)

  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full text-left rounded-2xl border-2 p-4 transition-all',
        isSelected
          ? 'border-blue-500 bg-blue-50 shadow-lg shadow-blue-100'
          : vehicle.priority === 'sla_breach' ? 'border-orange-300 bg-orange-50'
          : vehicle.priority === 'urgent'     ? 'border-red-300 bg-red-50'
          : overdue                           ? 'border-amber-300 bg-amber-50/60'
          : `border ${st.card}`,
      )}
    >
      {/* Top row: plate + status */}
      <div className="flex items-start justify-between mb-2">
        <div>
          <p className="font-mono text-base font-extrabold tracking-widest text-slate-900">{vehicle.vehicleNumber}</p>
          <p className="text-xxs text-slate-500 mt-0.5">{vehicle.vehicleType} · {vehicle.carrier}</p>
        </div>
        <span className={cn('rounded-full px-2.5 py-1 text-xxs font-bold flex items-center gap-1', st.bg, st.text)}>
          <span className={cn('h-1.5 w-1.5 rounded-full', st.dot)} />
          {DEST_STATUS_LABEL[vehicle.status]}
        </span>
      </div>

      {/* Route */}
      <div className="flex items-center gap-1.5 mb-3">
        <MapPin size={11} className="text-slate-400 shrink-0" />
        <p className="text-xs text-slate-600 truncate">{vehicle.origin.split('(')[0].trim()}</p>
        <ArrowRight size={11} className="text-slate-300 shrink-0" />
        <p className="text-xs text-slate-700 font-medium truncate">{vehicle.destination.split('(')[0].trim()}</p>
      </div>

      {/* Stats row */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1">
          <Package size={11} className="text-slate-400" />
          <span className="text-xs tabular-nums">
            <strong className="text-slate-800">{vehicle.receivedHUs}</strong>
            <span className="text-slate-400">/{vehicle.plannedHUs}</span>
          </span>
          {variance !== 0 && (
            <span className={cn('text-xxs font-bold ml-1', variance < 0 ? 'text-red-600' : 'text-green-600')}>
              {variance > 0 ? '+' : ''}{variance}
            </span>
          )}
        </div>
        {vehicle.dockNumber && (
          <span className="rounded bg-indigo-100 px-1.5 py-0.5 text-xxs font-bold text-indigo-700">{vehicle.dockNumber}</span>
        )}
        {overdue && (
          <span className="rounded bg-amber-100 px-1.5 py-0.5 text-xxs font-bold text-amber-700">OVERDUE</span>
        )}
        {vehicle.priority === 'sla_breach' && (
          <span className="rounded bg-orange-100 px-1.5 py-0.5 text-xxs font-bold text-orange-700">SLA BREACH</span>
        )}
        {vehicle.exceptionCount > 0 && (
          <span className="rounded bg-red-100 px-1.5 py-0.5 text-xxs font-bold text-red-700">{vehicle.exceptionCount} EXC</span>
        )}
        {action && (
          <span className="ml-auto text-xxs font-semibold text-blue-600 flex items-center gap-0.5">
            {action.label} <ArrowRight size={10} />
          </span>
        )}
      </div>
    </button>
  )
}

// ─── Detail panel ──────────────────────────────────────────────────────────────

function VehicleDetail({ vehicle, onClose, onAdvance, onUpdateReceivedHUs }: {
  vehicle: DestVehicle
  onClose: () => void
  onAdvance: (id: string, dock?: string) => void
  onUpdateReceivedHUs: (id: string, count: number) => void
}) {
  const [showDockModal, setShowDockModal] = useState(false)
  const [huInput, setHuInput]             = useState(String(vehicle.receivedHUs))
  const action   = NEXT_ACTION[vehicle.status]
  const dwell    = dockDwellMins(vehicle)
  const unload   = unloadingTimeMins(vehicle)
  const cycle    = totalCycleMins(vehicle)
  const variance = huVariance(vehicle)
  const st       = STATUS_STYLE[vehicle.status]

  function handleAction() {
    if (vehicle.status === 'gate_in') { setShowDockModal(true); return }
    onAdvance(vehicle.id)
  }

  function TimeRow({ label, value, highlight }: { label: string; value?: string; highlight?: boolean }) {
    return (
      <div className={cn('flex items-center justify-between py-1.5 border-b border-slate-50 last:border-0', highlight ? 'bg-blue-50/50 -mx-2 px-2 rounded' : '')}>
        <span className="text-xs text-slate-500">{label}</span>
        <span className="text-xs font-mono font-medium text-slate-800">
          {value
            ? new Date(value).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
            : <span className="text-slate-300 font-sans">—</span>}
        </span>
      </div>
    )
  }

  return (
    <>
      {showDockModal && (
        <DockModal
          onConfirm={dock => { onAdvance(vehicle.id, dock) }}
          onClose={() => setShowDockModal(false)}
        />
      )}

      <div className="flex flex-1 flex-col bg-white overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-200 px-5 py-4 shrink-0">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <span className="font-mono text-sm font-extrabold tracking-widest text-slate-900">{vehicle.vehicleNumber}</span>
              <span className={cn('rounded-full px-2.5 py-0.5 text-xxs font-bold', st.bg, st.text)}>
                {DEST_STATUS_LABEL[vehicle.status]}
              </span>
            </div>
            <p className="text-xs text-slate-500">{vehicle.vehicleType} · {vehicle.carrier}</p>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 hover:bg-slate-100 shrink-0">
            <X size={14} className="text-slate-400" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {/* Workflow steps */}
          <div className="py-2">
            <WorkflowSteps status={vehicle.status} />
          </div>

          {/* Driver */}
          <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 space-y-2">
            <p className="text-xxs font-semibold uppercase tracking-wide text-slate-400 mb-1">Driver</p>
            <div className="flex items-center gap-2">
              <User size={12} className="text-slate-400" /><span className="text-xs font-medium text-slate-700">{vehicle.driverName}</span>
            </div>
            <div className="flex items-center gap-2">
              <Phone size={12} className="text-slate-400" /><span className="text-xs text-slate-600">{vehicle.driverMobile}</span>
            </div>
          </div>

          {/* Route */}
          <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
            <p className="text-xxs font-semibold uppercase tracking-wide text-slate-400 mb-2">Route · {vehicle.routeCode}</p>
            <div className="flex items-start gap-2">
              <MapPin size={11} className="text-green-500 mt-0.5 shrink-0" />
              <span className="text-xs text-slate-600">{vehicle.origin}</span>
            </div>
            <div className="ml-2.5 border-l border-dashed border-slate-300 my-1 h-3" />
            <div className="flex items-start gap-2">
              <MapPin size={11} className="text-red-500 mt-0.5 shrink-0" />
              <span className="text-xs text-slate-600">{vehicle.destination}</span>
            </div>
            {vehicle.dockNumber && (
              <div className="mt-2 pt-2 border-t border-slate-100 flex items-center gap-2">
                <span className="text-xxs text-slate-400">Dock</span>
                <span className="rounded-md bg-indigo-100 px-2 py-0.5 text-xs font-bold text-indigo-700">{vehicle.dockNumber}</span>
              </div>
            )}
          </div>

          {/* HU tally — editable during unloading */}
          <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
            <p className="text-xxs font-semibold uppercase tracking-wide text-slate-400 mb-3">Handling Units</p>
            <div className="grid grid-cols-3 gap-2 mb-3">
              {[
                { label: 'Planned',  value: vehicle.plannedHUs,  color: 'text-slate-700' },
                { label: 'Received', value: vehicle.receivedHUs, color: variance < 0 ? 'text-red-600' : 'text-green-600' },
                { label: 'Damaged',  value: vehicle.damagedHUs,  color: vehicle.damagedHUs > 0 ? 'text-amber-600' : 'text-slate-400' },
              ].map(m => (
                <div key={m.label} className="text-center bg-white rounded-lg border border-slate-200 py-2">
                  <p className={cn('text-xl font-bold tabular-nums', m.color)}>{m.value}</p>
                  <p className="text-xxs text-slate-400">{m.label}</p>
                </div>
              ))}
            </div>

            {/* Editable received count during active stages */}
            {['unloading','unloaded'].includes(vehicle.status) && (
              <div className="flex items-center gap-2">
                <label className="text-xxs text-slate-500 whitespace-nowrap">Update received:</label>
                <input
                  type="number"
                  value={huInput}
                  onChange={e => setHuInput(e.target.value)}
                  className="w-20 rounded-lg border border-slate-200 px-2 py-1 text-sm text-center font-mono focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
                <button
                  onClick={() => {
                    const n = parseInt(huInput)
                    if (!isNaN(n)) onUpdateReceivedHUs(vehicle.id, n)
                  }}
                  className="rounded-lg bg-slate-200 px-2.5 py-1 text-xxs font-semibold text-slate-700 hover:bg-slate-300"
                >
                  Save
                </button>
              </div>
            )}
          </div>

          {/* Timeline */}
          <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
            <p className="text-xxs font-semibold uppercase tracking-wide text-slate-400 mb-2">Timestamp Log</p>
            <TimeRow label="Departed Origin"    value={vehicle.departedOriginAt} />
            <TimeRow label="Arrived"            value={vehicle.arrivedAt} />
            <TimeRow label="Gate In"            value={vehicle.gateInAt} />
            <TimeRow label="Dock Assigned"      value={vehicle.dockAssignedAt} />
            <TimeRow label="Unloading Start"    value={vehicle.unloadingStartAt} />
            <TimeRow label="Unloading Complete" value={vehicle.unloadingCompleteAt} />
            <TimeRow label="Receipt Confirmed"  value={vehicle.receiptConfirmedAt} />
            <TimeRow label="Reconciled"         value={vehicle.reconciledAt} />
            <TimeRow label="Closed"             value={vehicle.closedAt} />
            <div className="mt-2 pt-2 border-t border-slate-100">
              <TimeRow label="Planned Arrival" value={vehicle.plannedArrival} highlight />
            </div>
          </div>

          {/* Computed metrics */}
          <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
            <p className="text-xxs font-semibold uppercase tracking-wide text-slate-400 mb-3">Computed Metrics</p>
            <div className="space-y-2.5">
              {[
                { label: 'Dock Dwell Time',  value: dwell  !== null ? fmtMins(dwell)  : null, note: 'Dock Assigned → Unloaded', warn: dwell  !== null && dwell  > 90  },
                { label: 'Unloading Time',   value: unload !== null ? fmtMins(unload) : null, note: 'Unload Start → Complete',  warn: unload !== null && unload > 60  },
                { label: 'Total Cycle Time', value: cycle  !== null ? fmtMins(cycle)  : null, note: 'Arrived → Closed',         warn: cycle  !== null && cycle  > 240 },
              ].map(m => (
                <div key={m.label} className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-slate-600">{m.label}</p>
                    <p className="text-xxs text-slate-400">{m.note}</p>
                  </div>
                  <span className={cn('text-sm font-bold tabular-nums', m.value ? (m.warn ? 'text-red-600' : 'text-green-600') : 'text-slate-300')}>
                    {m.value ?? '—'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Exceptions / Remarks */}
          {(vehicle.exceptionCount > 0 || vehicle.remarks) && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
              {vehicle.exceptionCount > 0 && (
                <div className="flex items-center gap-1.5 mb-1.5">
                  <TriangleAlert size={12} className="text-amber-600" />
                  <p className="text-xxs font-bold text-amber-700">{vehicle.exceptionCount} exception{vehicle.exceptionCount > 1 ? 's' : ''} raised</p>
                </div>
              )}
              {vehicle.remarks && <p className="text-xs text-amber-800 leading-relaxed">{vehicle.remarks}</p>}
            </div>
          )}
        </div>

        {/* Action footer */}
        {action && (
          <div className="border-t border-slate-200 px-5 py-4 shrink-0">
            <button
              onClick={handleAction}
              className={cn(
                'w-full rounded-2xl py-4 text-sm font-extrabold text-white transition-colors flex items-center justify-center gap-2.5',
                action.color,
              )}
            >
              <action.icon size={18} />
              {action.label}
            </button>
            <p className="mt-1.5 text-center text-xxs text-slate-400">
              {new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })} · Tap to record timestamp
            </p>
          </div>
        )}
      </div>
    </>
  )
}

// ─── Main page ─────────────────────────────────────────────────────────────────

export function DestinationOps() {
  const [vehicles, setVehicles]       = useState<DestVehicle[]>(DEST_VEHICLES)
  const [selectedId, setSelectedId]   = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<DestStatus | 'all'>('all')
  const [search, setSearch]           = useState('')
  const [selectedHub, setSelectedHub] = useState(DEST_HUBS[0].id)
  const [showAddModal, setShowAddModal] = useState(false)
  const searchRef = useRef<HTMLInputElement>(null)

  const { region, dateRange, matchesRoute, matchesDate } = useActiveFilters('DestOps')

  // Ctrl+K or / to focus search
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.ctrlKey && e.key === 'k') || (e.key === '/' && document.activeElement?.tagName !== 'INPUT')) {
        e.preventDefault()
        searchRef.current?.focus()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // Base vehicles after global region + date filter (routeCode origin = origin region)
  const baseVehicles = useMemo(() =>
    vehicles.filter(v =>
      matchesRoute(v.routeCode) && matchesDate(v.arrivedAt)
    ),
    [vehicles, region, dateRange],
  )

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return baseVehicles.filter(v => {
      if (statusFilter !== 'all' && v.status !== statusFilter) return false
      if (!q) return true
      return (
        v.vehicleNumber.toLowerCase().includes(q) ||
        v.carrier.toLowerCase().includes(q) ||
        v.routeCode.toLowerCase().includes(q) ||
        v.driverName.toLowerCase().includes(q) ||
        v.driverMobile.includes(q)
      )
    })
  }, [baseVehicles, statusFilter, search])

  const selected = selectedId ? vehicles.find(v => v.id === selectedId) ?? null : null

  const kpis = useMemo(() => ({
    inTransit:      baseVehicles.filter(v => v.status === 'in_transit').length,
    arrived:        baseVehicles.filter(v => v.status === 'arrived').length,
    gateIn:         baseVehicles.filter(v => v.status === 'gate_in').length,
    unloading:      baseVehicles.filter(v => ['dock_assigned','unloading'].includes(v.status)).length,
    pendingReceipt: baseVehicles.filter(v => v.status === 'unloaded').length,
    exceptions:     baseVehicles.filter(v => v.exceptionCount > 0 && !['reconciled','closed'].includes(v.status)).length,
    closedToday:    baseVehicles.filter(v => v.status === 'closed').length,
  }), [baseVehicles])

  function advanceVehicle(id: string, dock?: string) {
    setVehicles(prev => prev.map(v => {
      if (v.id !== id) return v
      const action = NEXT_ACTION[v.status]
      if (!action) return v
      const now = new Date().toISOString()
      const updates: Partial<DestVehicle> = { status: action.next }
      if (action.next === 'gate_in')           updates.gateInAt = now
      if (action.next === 'dock_assigned')     { updates.dockAssignedAt = now; if (dock) updates.dockNumber = dock }
      if (action.next === 'unloading')         updates.unloadingStartAt = now
      if (action.next === 'unloaded')          updates.unloadingCompleteAt = now
      if (action.next === 'receipt_confirmed') updates.receiptConfirmedAt = now
      if (action.next === 'reconciled')        updates.reconciledAt = now
      if (action.next === 'closed')            updates.closedAt = now
      return { ...v, ...updates }
    }))
  }

  function updateReceivedHUs(id: string, count: number) {
    setVehicles(prev => prev.map(v => v.id === id ? { ...v, receivedHUs: count, shortHUs: Math.max(0, v.plannedHUs - count) } : v))
  }

  const hubLabel = DEST_HUBS.find(h => h.id === selectedHub)?.label ?? 'Hub'

  return (
    <>
      {showAddModal && <ArrivalModal onClose={() => setShowAddModal(false)} onAdd={v => { setVehicles(p => [v, ...p]); setSelectedId(v.id) }} />}

      <div className="flex flex-col h-full bg-slate-50">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4 shrink-0">
          <div>
            <h1 className="text-lg font-bold text-slate-900">Destination Hub Operations</h1>
            <p className="text-xs text-slate-400">Inbound receipt · Unloading · Reconciliation workflow</p>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={selectedHub}
              onChange={e => setSelectedHub(e.target.value)}
              className="h-8 rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 focus:outline-none"
            >
              {DEST_HUBS.map(h => <option key={h.id} value={h.id}>{h.label}</option>)}
            </select>
            <button
              onClick={() => setShowAddModal(true)}
              className="flex h-8 items-center gap-1.5 rounded-lg bg-sky-600 px-3 text-xs font-semibold text-white hover:bg-sky-700"
            >
              <Plus size={13} />
              Register Arrival
            </button>
          </div>
        </div>

        {/* KPI strip */}
        <div className="grid grid-cols-7 gap-3 border-b border-slate-200 bg-white px-6 py-4 shrink-0">
          {[
            { label: 'In Transit',      value: kpis.inTransit,      icon: Navigation,    color: 'text-slate-500', bg: 'bg-slate-50  border-slate-100',   status: 'in_transit'        },
            { label: 'Arrived',         value: kpis.arrived,        icon: Truck,         color: 'text-sky-600',   bg: 'bg-sky-50    border-sky-100',      status: 'arrived'           },
            { label: 'Gate In',         value: kpis.gateIn,         icon: LogIn,         color: 'text-blue-600',  bg: 'bg-blue-50   border-blue-100',     status: 'gate_in'           },
            { label: 'Unloading',       value: kpis.unloading,      icon: Loader2,       color: 'text-amber-600', bg: 'bg-amber-50  border-amber-100',    status: 'dock_assigned'     },
            { label: 'Pending Receipt', value: kpis.pendingReceipt, icon: ClipboardCheck,color: 'text-violet-600',bg: 'bg-violet-50 border-violet-100',   status: 'unloaded'          },
            { label: 'Exceptions',      value: kpis.exceptions,     icon: AlertTriangle, color: 'text-red-600',   bg: 'bg-red-50    border-red-100',      status: 'all'               },
            { label: 'Closed Today',    value: kpis.closedToday,    icon: CheckCircle2,  color: 'text-green-600', bg: 'bg-green-50  border-green-100',    status: 'closed'            },
          ].map(k => (
            <button
              key={k.label}
              onClick={() => setStatusFilter(k.status === 'all' ? 'all' : k.status as DestStatus)}
              className={cn('rounded-xl border px-3 py-3 text-left hover:shadow-sm transition-all', k.bg)}
            >
              <div className="flex items-center justify-between mb-1">
                <p className="text-xxs font-semibold uppercase tracking-wide text-slate-400">{k.label}</p>
                <k.icon size={13} className={k.color} />
              </div>
              <p className={cn('text-2xl font-bold tabular-nums', k.color)}>{k.value}</p>
            </button>
          ))}
        </div>

        {/* Search + filter bar */}
        <div className="flex items-center gap-3 border-b border-slate-200 bg-white px-6 py-3 shrink-0">
          {/* Scan / search input */}
          <div className="relative flex-1 max-w-xs">
            <ScanLine size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              ref={searchRef}
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Scan or search vehicle / driver…"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-9 py-2 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2">
                <X size={13} className="text-slate-400" />
              </button>
            )}
          </div>

          {/* Status filter pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto">
            <button
              onClick={() => setStatusFilter('all')}
              className={cn('shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-colors',
                statusFilter === 'all' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200')}
            >
              All ({vehicles.length})
            </button>
            {DEST_STATUS_ORDER.map(s => {
              const cnt = vehicles.filter(v => v.status === s).length
              if (cnt === 0) return null
              return (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={cn('shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-colors',
                    statusFilter === s ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200')}
                >
                  {DEST_STATUS_LABEL[s]} ({cnt})
                </button>
              )
            })}
          </div>

          <span className="ml-auto shrink-0 text-xxs text-slate-400">{filtered.length} shown · {hubLabel}</span>
        </div>

        {/* Body: cards + detail */}
        <div className="flex flex-1 min-h-0 overflow-hidden">
          {/* Vehicle card grid */}
          <div className="flex-1 overflow-y-auto p-4">
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-center">
                <Search size={28} className="text-slate-200 mb-2" />
                <p className="text-sm text-slate-400">No vehicles match</p>
              </div>
            ) : (
              <div className={cn(
                'grid gap-3',
                selected ? 'grid-cols-1' : 'grid-cols-2 lg:grid-cols-3',
              )}>
                {filtered.map(v => (
                  <VehicleCard
                    key={v.id}
                    vehicle={v}
                    isSelected={selectedId === v.id}
                    onClick={() => setSelectedId(prev => prev === v.id ? null : v.id)}
                  />
                ))}
              </div>
            )}

            {/* HU summary footer */}
            {filtered.length > 0 && (
              <div className="mt-4 rounded-xl border border-slate-200 bg-white px-5 py-3 flex items-center gap-6 text-xs text-slate-500">
                <span>Planned: <strong className="text-slate-700">{filtered.reduce((s, v) => s + v.plannedHUs, 0)}</strong></span>
                <span>Received: <strong className="text-slate-700">{filtered.reduce((s, v) => s + v.receivedHUs, 0)}</strong></span>
                <span>Damaged: <strong className="text-amber-600">{filtered.reduce((s, v) => s + v.damagedHUs, 0)}</strong></span>
                <span>Short: <strong className="text-red-600">{filtered.reduce((s, v) => s + v.shortHUs, 0)}</strong></span>
                <span>Weight: <strong className="text-slate-700">{filtered.reduce((s, v) => s + v.weightKg, 0).toLocaleString()} kg</strong></span>
              </div>
            )}
          </div>

          {/* Detail panel */}
          {selected && (
            <div className="w-[420px] shrink-0 flex flex-col border-l border-slate-200">
              <VehicleDetail
                vehicle={selected}
                onClose={() => setSelectedId(null)}
                onAdvance={(id, dock) => advanceVehicle(id, dock)}
                onUpdateReceivedHUs={updateReceivedHUs}
              />
            </div>
          )}
        </div>
      </div>
    </>
  )
}
