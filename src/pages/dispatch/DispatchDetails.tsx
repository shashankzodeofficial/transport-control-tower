import React, { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, Truck, MapPin, Phone, Package,
  FileText, AlertTriangle, Clock, CheckCircle2,
  ChevronRight, ExternalLink, User, Link,
} from 'lucide-react'
import { cn, timeAgo, formatDuration } from '@/lib/utils'
import { StatusBadge }   from '@/components/badges/StatusBadge'
import { SeverityBadge } from '@/components/badges/SeverityBadge'
import { SLAClock }      from '@/components/shared/SLAClock'
import { Timeline }      from '@/components/timeline/Timeline'
import { TabStrip }      from '@/layout/TabStrip'
import { getDispatch, DISPATCHES } from './mock/dispatches'
import { getHUsForDispatch }       from './mock/huData'
import { LIVE_EXCEPTIONS }         from '@/pages/control-tower/mock/data'
import type { TimelineItem }       from '@/components/timeline/Timeline'

// ─── Lifecycle timeline builder ───────────────────────────────────────────────

function buildTimeline(d: ReturnType<typeof getDispatch>): TimelineItem[] {
  if (!d) return []
  const stages = ['planned', 'ready', 'dispatched', 'transit', 'arrived', 'unloading', 'reconciled', 'closed']
  const stageIndex = stages.indexOf(d.status)

  return stages.map((stage, i): TimelineItem => {
    const isCurrent = i === stageIndex
    const isDone    = i < stageIndex
    const isPending = i > stageIndex

    const timestamps: Partial<Record<string, string>> = {
      dispatched: d.actualDeparture,
      arrived:    d.actualArrival,
    }

    return {
      id: stage,
      label: stage === 'transit' ? 'In Transit' : stage.charAt(0).toUpperCase() + stage.slice(1),
      status: isDone ? 'done' : isCurrent ? 'active' : 'pending',
      timestamp: timestamps[stage],
      description: isCurrent
        ? stage === 'transit' ? `${d.vehicleReg} on route — ${d.carrier}` : undefined
        : undefined,
    }
  })
}

// ─── Tab: Overview ────────────────────────────────────────────────────────────

function TabOverview({ d }: { d: NonNullable<ReturnType<typeof getDispatch>> }) {
  const navigate = useNavigate()
  const inTransit = d.status === 'transit' || d.status === 'dispatched'

  return (
    <div className="grid grid-cols-3 gap-5 p-6">
      {/* Left col — vehicle + carrier */}
      <div className="col-span-1 space-y-4">
        {/* Vehicle card */}
        <Section title="Vehicle & Driver">
          <Row label="Vehicle No."  value={<span className="font-mono font-semibold">{d.vehicleReg}</span>} />
          <Row label="Vehicle Type" value={d.vehicleType} />
          <Row label="Driver"       value={d.driverName} />
          <Row label="Phone"        value={
            <a href={`tel:${d.driverPhone}`} className="flex items-center gap-1 text-blue-600 hover:underline">
              <Phone size={11} />{d.driverPhone}
            </a>
          } />
          {inTransit && (
            <div className="pt-1">
              <button
                onClick={() => navigate(`/transport/live?focus=${d.id}`)}
                className="flex items-center gap-1.5 text-xs text-blue-600 font-medium hover:underline"
              >
                <MapPin size={12} />Track Live
                <ExternalLink size={11} />
              </button>
            </div>
          )}
        </Section>

        {/* Carrier card */}
        <Section title="Carrier">
          <Row label="Name"         value={d.carrier} />
          <Row label="Carrier ID"   value={<span className="font-mono text-xs">{d.carrierId}</span>} />
          {d.assignedTo && <Row label="Owner" value={d.assignedTo} />}
        </Section>

        {/* Load */}
        <Section title="Load Details">
          <Row label="Total HUs"    value={`${d.huCount} units`} />
          <Row label="Loaded HUs"   value={
            <span className={cn(d.loadedHUs < d.huCount ? 'text-amber-700 font-semibold' : '')}>
              {d.loadedHUs} / {d.huCount}
            </span>
          } />
          <Row label="Weight"       value={`${d.weightKg.toLocaleString()} kg`} />
          <Row label="Volume"       value={`${d.volumeCbm} CBM`} />
          <Row label="Freight"      value={`₹${d.freightCost.toLocaleString()}`} />
        </Section>
      </div>

      {/* Center col — timeline + SLA */}
      <div className="col-span-1 space-y-4">
        {/* SLA */}
        {(d.status !== 'closed' && d.status !== 'reconciled') && (
          <Section title="SLA Status">
            <SLAClock
              hoursRemaining={d.slaStatus === 'breached' ? -(d.slaHoursOverdue ?? 0) : (d.slaHoursRemaining ?? 0)}
              totalHours={d.slaTotalHours}
              variant="bar"
            />
          </Section>
        )}

        {/* Lifecycle timeline */}
        <Section title="Dispatch Lifecycle">
          <Timeline items={buildTimeline(d)} compact />
        </Section>

        {/* Tags */}
        {d.tags.length > 0 && (
          <Section title="Tags">
            <div className="flex flex-wrap gap-1.5">
              {d.tags.map(tag => (
                <span key={tag} className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xxs font-semibold text-slate-600">
                  {tag}
                </span>
              ))}
            </div>
          </Section>
        )}
      </div>

      {/* Right col — schedule + route */}
      <div className="col-span-1 space-y-4">
        {/* Schedule */}
        <Section title="Schedule">
          <Row label="Planned Departure" value={fmtDT(d.plannedDeparture)} />
          <Row label="Planned Arrival"   value={fmtDT(d.plannedArrival)} />
          {d.actualDeparture && <Row label="Actual Departure" value={fmtDT(d.actualDeparture)} />}
          {d.actualArrival   && <Row label="Actual Arrival"   value={fmtDT(d.actualArrival)} />}
          <Row label="SLA Window" value={`${d.slaTotalHours} hours`} />
        </Section>

        {/* Route */}
        <Section title="Route">
          <Row label="Route Code" value={<span className="font-mono font-semibold text-blue-700">{d.routeCode}</span>} />
          <Row label="Route Name" value={d.routeName} />
          <Row label="Origin"     value={d.origin} />
          <Row label="Destination" value={d.destination} />
        </Section>

        {/* Priority + remarks */}
        <Section title="Dispatch Info">
          <Row label="Priority" value={
            <span className={cn(
              'rounded-full px-2 py-0.5 text-xxs font-semibold capitalize',
              d.priority === 'critical' ? 'bg-red-100 text-red-700' :
              d.priority === 'high'     ? 'bg-amber-100 text-amber-700' :
              'bg-slate-100 text-slate-500',
            )}>
              {d.priority}
            </span>
          } />
          {d.remarks && <Row label="Remarks" value={<span className="text-slate-500 italic">{d.remarks}</span>} />}
        </Section>
      </div>
    </div>
  )
}

// ─── Tab: Documents ───────────────────────────────────────────────────────────

function TabDocuments({ d }: { d: NonNullable<ReturnType<typeof getDispatch>> }) {
  const docs = [
    { type: 'Lorry Receipt (LR)', number: d.lrNumber,        status: 'verified' },
    { type: 'E-Waybill',          number: d.ewaybillNumber,  status: 'active'   },
    { type: 'Gate Pass',          number: d.gatePassNumber,  status: 'used'     },
    { type: 'Seal Number',        number: d.sealNumber,      status: 'intact'   },
    ...d.invoiceNumbers.map((inv, i) => ({ type: `Invoice #${i + 1}`, number: inv, status: 'verified' })),
  ]

  const statusStyle: Record<string, string> = {
    verified: 'bg-green-50 text-green-700',
    active:   'bg-blue-50 text-blue-700',
    used:     'bg-slate-100 text-slate-600',
    intact:   'bg-violet-50 text-violet-700',
  }

  return (
    <div className="p-6">
      <div className="overflow-hidden rounded-xl border border-slate-200">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <Th2>Document Type</Th2>
              <Th2>Number / Reference</Th2>
              <Th2>Status</Th2>
              <Th2>Actions</Th2>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {docs.map(doc => (
              <tr key={doc.number} className="hover:bg-slate-50 transition-colors">
                <td className="px-4 py-3 font-medium text-slate-700">{doc.type}</td>
                <td className="px-4 py-3 font-mono text-xs text-slate-800">{doc.number}</td>
                <td className="px-4 py-3">
                  <span className={cn('rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize', statusStyle[doc.status] ?? '')}>
                    {doc.status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <button className="text-xs text-blue-600 hover:underline flex items-center gap-1">
                    <ExternalLink size={11} />View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ─── Tab: HU Manifest ─────────────────────────────────────────────────────────

function TabHUManifest({ dispatchId, huCount }: { dispatchId: string; huCount: number }) {
  const navigate  = useNavigate()
  const huList    = getHUsForDispatch(dispatchId)
  const hasData   = huList.length > 0

  // If no detailed data, show stubs
  const rows = hasData
    ? huList
    : Array.from({ length: Math.min(huCount, 8) }, (_, i) => ({
        huCode: `HU-${dispatchId.slice(-3)}-${String(i + 1).padStart(3, '0')}`,
        description: 'General Merchandise',
        weightKg: 180 + i * 30,
        dims: '120×80×90cm',
        invoiceRef: 'N/A',
        skuCount: 3,
        status: 'ok' as const,
        currentLocation: 'In Transit',
        scans: [],
      }))

  const damaged = rows.filter(h => h.status === 'damaged').length
  const missing = rows.filter(h => h.status === 'missing').length

  return (
    <div className="p-6">
      {/* Summary row */}
      <div className="mb-4 flex items-center gap-6">
        <Stat label="Total HUs" value={huCount} />
        <Stat label="Scanned" value={rows.reduce((s, h) => s + h.scans.length, 0)} />
        <Stat label="OK" value={rows.filter(h => h.status === 'ok').length} color="text-green-600" />
        {damaged > 0 && <Stat label="Damaged" value={damaged} color="text-amber-600" />}
        {missing > 0 && <Stat label="Missing" value={missing} color="text-red-600" />}
        {hasData && (
          <button
            onClick={() => navigate(`/dispatch/${dispatchId}/custody`)}
            className="ml-auto flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-100 transition-colors"
          >
            <Link size={12} />View Full Chain of Custody
            <ChevronRight size={12} />
          </button>
        )}
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200">
        <table className="w-full text-xs">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <Th2>HU Code</Th2>
              <Th2>Description</Th2>
              <Th2>Weight</Th2>
              <Th2>Dims</Th2>
              <Th2>Invoice</Th2>
              <Th2>Status</Th2>
              <Th2>Location</Th2>
              <Th2>Scans</Th2>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map(hu => (
              <tr
                key={hu.huCode}
                className={cn(
                  'hover:bg-slate-50 transition-colors',
                  hu.status === 'missing' && 'bg-red-50/40',
                  hu.status === 'damaged' && 'bg-amber-50/40',
                )}
              >
                <td className="px-4 py-2.5 font-mono font-semibold text-slate-700">{hu.huCode}</td>
                <td className="px-4 py-2.5 text-slate-600">{hu.description}</td>
                <td className="px-4 py-2.5 text-slate-600 tabular-nums">{hu.weightKg} kg</td>
                <td className="px-4 py-2.5 text-slate-500">{hu.dims}</td>
                <td className="px-4 py-2.5 font-mono text-slate-500">{hu.invoiceRef}</td>
                <td className="px-4 py-2.5">
                  <span className={cn(
                    'rounded-full px-2 py-0.5 text-xxs font-semibold capitalize',
                    hu.status === 'ok'      ? 'bg-green-50 text-green-700' :
                    hu.status === 'damaged' ? 'bg-amber-50 text-amber-700' :
                    hu.status === 'missing' ? 'bg-red-50 text-red-700'     :
                    'bg-blue-50 text-blue-700',
                  )}>
                    {hu.status}
                  </span>
                </td>
                <td className="px-4 py-2.5 text-slate-500 max-w-[160px] truncate">{hu.currentLocation}</td>
                <td className="px-4 py-2.5 text-center tabular-nums text-slate-600">{hu.scans.length}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ─── Tab: Exceptions ──────────────────────────────────────────────────────────

function TabExceptions({ dispatchId }: { dispatchId: string }) {
  const excs = LIVE_EXCEPTIONS.filter(e => e.dispatchId === dispatchId)

  if (excs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-400">
        <CheckCircle2 size={28} className="mb-2 text-green-400" />
        <p className="text-sm font-medium text-slate-600">No exceptions for this dispatch</p>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-3">
      {excs.map(ex => (
        <div key={ex.id} className="rounded-xl border border-slate-200 p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <SeverityBadge severity={ex.severity} size="sm" />
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-semibold text-slate-800">[{ex.id}] {ex.category}</span>
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xxs font-medium text-slate-600">
                    {ex.status.replace('_', ' ')}
                  </span>
                  {ex.escalationLevel && ex.escalationLevel > 0 && (
                    <span className="rounded-full bg-red-100 px-2 py-0.5 text-xxs font-bold text-red-700">
                      L{ex.escalationLevel}
                    </span>
                  )}
                </div>
                {ex.assignee && (
                  <p className="text-xs text-slate-500 flex items-center gap-1">
                    <User size={11} />Assigned to {ex.assignee}
                  </p>
                )}
                <p className="text-xs text-slate-400 mt-1">Raised {timeAgo(ex.raisedAt)}</p>
              </div>
            </div>
            {ex.slaBreachAt && (
              <SLAClock
                hoursRemaining={(new Date(ex.slaBreachAt).getTime() - Date.now()) / 3600000}
                totalHours={24}
                variant="compact"
              />
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── Tab: Audit Log ───────────────────────────────────────────────────────────

function TabAuditLog({ d }: { d: NonNullable<ReturnType<typeof getDispatch>> }) {
  const events = [
    { time: d.plannedDeparture, actor: 'System', event: 'Dispatch created and scheduled', type: 'info' },
    { time: d.actualDeparture ?? d.plannedDeparture, actor: d.driverName, event: `Vehicle ${d.vehicleReg} loaded and sealed with ${d.sealNumber}`, type: 'success' },
    ...(d.actualDeparture ? [{
      time: d.actualDeparture, actor: 'Gate Officer', event: `Gate out recorded — LR ${d.lrNumber}`, type: 'success',
    }] : []),
    ...(d.exceptionCount > 0 ? [{
      time: new Date(Date.parse(d.actualDeparture ?? d.plannedDeparture) + 6 * 3600000).toISOString(),
      actor: 'System Auto', event: `Exception raised — ${d.exceptionCount} open exception(s)`, type: 'warning',
    }] : []),
    ...(d.slaStatus === 'breached' ? [{
      time: new Date(Date.parse(d.plannedArrival)).toISOString(),
      actor: 'SLA Engine', event: 'SLA window expired — escalation triggered', type: 'danger',
    }] : []),
    ...(d.actualArrival ? [{
      time: d.actualArrival, actor: 'Destination Gate', event: 'Vehicle arrived at destination — gate in recorded', type: 'success',
    }] : []),
  ].sort((a, b) => Date.parse(b.time) - Date.parse(a.time))

  const typeStyle: Record<string, string> = {
    info:    'text-blue-500 bg-blue-50',
    success: 'text-green-600 bg-green-50',
    warning: 'text-amber-600 bg-amber-50',
    danger:  'text-red-600 bg-red-50',
  }

  return (
    <div className="p-6">
      <div className="space-y-0 relative">
        <div className="absolute left-[19px] top-4 bottom-4 w-0.5 bg-slate-200" />
        {events.map((ev, i) => (
          <div key={i} className="flex gap-4 pb-4">
            <div className={cn('relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full', typeStyle[ev.type] ?? 'bg-slate-100 text-slate-500')}>
              <Clock size={14} />
            </div>
            <div className="flex-1 pt-1.5">
              <p className="text-xs font-medium text-slate-800">{ev.event}</p>
              <p className="text-xxs text-slate-400 mt-0.5">
                {ev.actor} · {new Date(ev.time).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export function DispatchDetails() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('overview')

  const d = getDispatch(id ?? '')

  if (!d) {
    return (
      <div className="flex h-full flex-col items-center justify-center text-slate-400">
        <AlertTriangle size={28} className="mb-2 text-amber-400" />
        <p className="text-sm font-medium text-slate-600">Dispatch not found: {id}</p>
        <button onClick={() => navigate('/dispatch/board')} className="mt-3 text-xs text-blue-600 hover:underline">
          ← Back to Workbench
        </button>
      </div>
    )
  }

  const excCount = LIVE_EXCEPTIONS.filter(e => e.dispatchId === d.id).length

  const tabs = [
    { key: 'overview',   label: 'Overview'      },
    { key: 'documents',  label: 'Documents'     },
    { key: 'hu',         label: 'HU Manifest',  badge: d.huCount },
    { key: 'exceptions', label: 'Exceptions',   badge: excCount  },
    { key: 'audit',      label: 'Audit Log'     },
  ]

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Breadcrumb + back */}
      <div className="flex items-center gap-2 border-b border-slate-100 bg-white px-6 py-2.5">
        <button
          onClick={() => navigate('/dispatch/board')}
          className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-blue-600 transition-colors"
        >
          <ArrowLeft size={13} />Dispatch Workbench
        </button>
        <ChevronRight size={12} className="text-slate-300" />
        <span className="text-xs font-semibold text-slate-700">{d.id}</span>
      </div>

      {/* Header */}
      <div className="border-b border-slate-200 bg-white px-6 py-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            {/* Icon */}
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-50">
              <Truck size={22} className="text-blue-600" />
            </div>
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-xl font-bold text-slate-900">{d.id}</h1>
                <StatusBadge status={d.status} size="md" />
                {d.priority !== 'normal' && (
                  <span className={cn(
                    'rounded-full px-2.5 py-0.5 text-xs font-bold capitalize',
                    d.priority === 'critical' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700',
                  )}>
                    {d.priority}
                  </span>
                )}
              </div>
              <p className="text-sm text-slate-500">
                <span className="font-semibold text-slate-700">{d.routeCode}</span>
                {' · '}{d.origin.split(' (')[0]}
                <span className="mx-1.5 text-slate-300">→</span>
                {d.destination.split(' (')[0]}
              </p>
              <p className="text-xs text-slate-400 mt-0.5">
                {d.vehicleReg} · {d.carrier} · {d.huCount} HUs · ₹{d.freightCost.toLocaleString()}
              </p>
            </div>
          </div>

          {/* Right: SLA + actions */}
          <div className="flex items-center gap-4 shrink-0">
            {d.status !== 'closed' && d.status !== 'reconciled' && (
              <div className="w-56">
                <SLAClock
                  hoursRemaining={d.slaStatus === 'breached' ? -(d.slaHoursOverdue ?? 0) : (d.slaHoursRemaining ?? 0)}
                  totalHours={d.slaTotalHours}
                  variant="bar"
                />
              </div>
            )}
            <div className="flex items-center gap-2">
              {(d.status === 'transit' || d.status === 'dispatched') && (
                <button
                  onClick={() => navigate(`/transport/live?focus=${d.id}`)}
                  className="flex h-8 items-center gap-1.5 rounded-lg bg-blue-600 px-3 text-xs font-semibold text-white hover:bg-blue-700 transition-colors"
                >
                  <MapPin size={13} />Track Live
                </button>
              )}
              <button
                onClick={() => navigate(`/dispatch/${d.id}/custody`)}
                className="flex h-8 items-center gap-1.5 rounded-lg border border-slate-200 px-3 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors"
              >
                <Package size={13} />Custody Chain
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <TabStrip tabs={tabs} activeTab={activeTab} onChange={setActiveTab} variant="page" />

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'overview'   && <TabOverview d={d} />}
        {activeTab === 'documents'  && <TabDocuments d={d} />}
        {activeTab === 'hu'         && <TabHUManifest dispatchId={d.id} huCount={d.huCount} />}
        {activeTab === 'exceptions' && <TabExceptions dispatchId={d.id} />}
        {activeTab === 'audit'      && <TabAuditLog d={d} />}
      </div>
    </div>
  )
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-slate-200 overflow-hidden">
      <div className="bg-slate-50 border-b border-slate-200 px-4 py-2">
        <p className="text-xxs font-semibold uppercase tracking-wide text-slate-500">{title}</p>
      </div>
      <div className="px-4 py-3 divide-y divide-slate-50">{children}</div>
    </div>
  )
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-1.5 gap-2">
      <span className="text-xs text-slate-500 shrink-0">{label}</span>
      <span className="text-xs text-slate-800 text-right">{value}</span>
    </div>
  )
}

function Stat({ label, value, color }: { label: string; value: number; color?: string }) {
  return (
    <div className="text-center">
      <div className={cn('text-xl font-bold tabular-nums', color ?? 'text-slate-700')}>{value}</div>
      <div className="text-xxs font-medium uppercase tracking-wide text-slate-400">{label}</div>
    </div>
  )
}

function Th2({ children }: { children: React.ReactNode }) {
  return (
    <th className="px-4 py-3 text-left text-xxs font-semibold uppercase tracking-wide text-slate-400">{children}</th>
  )
}

function fmtDT(iso: string) {
  const d = new Date(iso)
  return `${d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })} ${d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`
}
