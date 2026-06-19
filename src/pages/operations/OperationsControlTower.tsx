import React, { useState, useEffect } from 'react'
import {
  Truck, AlertTriangle, Clock, CheckCircle2, Pause,
  RefreshCw, ChevronRight, Zap, MapPin, Fuel,
  Activity, ArrowRight,
} from 'lucide-react'
import { cn, timeAgo } from '@/lib/utils'
import { KPICard } from '@/components/kpi/KPICard'
import { TabStrip } from '@/layout/TabStrip'
import {
  OPS_KPI, FLEET_VEHICLES, SLA_WATCH, HUB_EVENTS,
  type FleetVehicle, type VehicleStatus, type HubEvent,
} from './mock/data'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtTime(d: Date) {
  return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
}

function useLastRefresh() {
  const [ts, setTs] = useState(new Date())
  useEffect(() => {
    const id = setInterval(() => setTs(new Date()), 60_000)
    return () => clearInterval(id)
  }, [])
  return ts
}

// ─── Status config ─────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<VehicleStatus, { label: string; dot: string; bg: string; text: string; icon: React.ComponentType<{ size?: number }> }> = {
  'in-transit': { label: 'In Transit', dot: 'bg-blue-500',   bg: 'bg-blue-50',   text: 'text-blue-700',   icon: Truck },
  'halted':     { label: 'Halted',     dot: 'bg-amber-500',  bg: 'bg-amber-50',  text: 'text-amber-700',  icon: Pause },
  'delayed':    { label: 'Delayed',    dot: 'bg-red-500',    bg: 'bg-red-50',    text: 'text-red-700',    icon: AlertTriangle },
  'arrived':    { label: 'Arrived',    dot: 'bg-green-500',  bg: 'bg-green-50',  text: 'text-green-700',  icon: CheckCircle2 },
  'idle':       { label: 'Idle',       dot: 'bg-slate-400',  bg: 'bg-slate-50',  text: 'text-slate-600',  icon: Clock },
}

const HUB_STATUS_STYLE: Record<HubEvent['status'], string> = {
  'on-time': 'text-green-600 bg-green-50 border-green-200',
  'early':   'text-blue-600 bg-blue-50 border-blue-200',
  'delayed': 'text-red-600 bg-red-50 border-red-200',
  'pending': 'text-slate-500 bg-slate-50 border-slate-200',
}

// ─── Fleet Vehicle Card ────────────────────────────────────────────────────────

function VehicleCard({ v, onClick, selected }: { v: FleetVehicle; onClick: () => void; selected: boolean }) {
  const cfg = STATUS_CONFIG[v.status]
  const Icon = cfg.icon
  const lateETA = v.delayMinutes > 0

  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full text-left rounded-xl border p-3.5 space-y-2.5 transition-all duration-fast',
        selected
          ? 'border-blue-600 bg-blue-50 shadow-panel'
          : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-card',
      )}
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-xs font-bold text-slate-900">{v.vehicleReg}</p>
          <p className="text-xxs text-slate-400">{v.driverName}</p>
        </div>
        <span className={cn('flex items-center gap-1 rounded-full px-2 py-0.5 text-xxs font-semibold border', cfg.bg, cfg.text, 'border-current/20')}>
          <span className={cn('h-1.5 w-1.5 rounded-full', cfg.dot, v.status === 'in-transit' && 'animate-pulse')} />
          {cfg.label}
        </span>
      </div>

      {/* Route */}
      <div className="flex items-center gap-1 text-xxs text-slate-500">
        <MapPin size={10} className="flex-shrink-0" />
        <span className="truncate">{v.origin}</span>
        <ArrowRight size={10} className="flex-shrink-0" />
        <span className="truncate">{v.destination}</span>
      </div>

      {/* Progress bar */}
      <div className="space-y-1">
        <div className="flex justify-between text-xxs text-slate-400">
          <span>{v.currentLocation}</span>
          <span>{v.progressPct}%</span>
        </div>
        <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
          <div
            className={cn('h-full rounded-full transition-all', v.status === 'delayed' ? 'bg-red-500' : v.status === 'halted' ? 'bg-amber-500' : 'bg-blue-500')}
            style={{ width: `${v.progressPct}%` }}
          />
        </div>
      </div>

      {/* Stats row */}
      <div className="flex items-center gap-3 text-xxs text-slate-500">
        <span className="flex items-center gap-0.5">
          <Activity size={9} />
          {v.speedKmh} km/h
        </span>
        <span className="flex items-center gap-0.5">
          <Fuel size={9} />
          {v.fuelPct}%
        </span>
        {lateETA && (
          <span className="ml-auto flex items-center gap-0.5 text-red-600 font-medium">
            <Clock size={9} />
            +{v.delayMinutes}m
          </span>
        )}
      </div>

      {/* Alert pills */}
      {v.alerts.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {v.alerts.map(a => (
            <span key={a} className="rounded-full bg-red-50 border border-red-200 px-1.5 py-0.5 text-xxs text-red-600">{a}</span>
          ))}
        </div>
      )}
    </button>
  )
}

// ─── Vehicle Detail Panel ──────────────────────────────────────────────────────

function VehicleDetail({ v }: { v: FleetVehicle }) {
  const cfg = STATUS_CONFIG[v.status]

  return (
    <div className="flex flex-col gap-4">
      <div>
        <div className="flex items-center gap-2 mb-0.5">
          <span className={cn('h-2 w-2 rounded-full', cfg.dot)} />
          <h3 className="text-sm font-bold text-slate-900">{v.vehicleReg}</h3>
          <span className={cn('rounded-full px-2 py-0.5 text-xxs font-semibold', cfg.bg, cfg.text)}>{cfg.label}</span>
        </div>
        <p className="text-xxs text-slate-400">{v.carrier} · {v.routeCode}</p>
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        {[
          { label: 'Driver',       value: v.driverName },
          { label: 'Dispatch',     value: v.dispatchId },
          { label: 'Origin',       value: v.origin },
          { label: 'Destination',  value: v.destination },
          { label: 'Speed',        value: `${v.speedKmh} km/h` },
          { label: 'Fuel',         value: `${v.fuelPct}%` },
          { label: 'Last Ping',    value: timeAgo(v.lastPingAt) },
          { label: 'Delay',        value: v.delayMinutes > 0 ? `+${v.delayMinutes}m` : 'On time' },
        ].map(r => (
          <div key={r.label} className="rounded-lg bg-slate-50 border border-slate-100 px-3 py-2">
            <p className="text-xxs text-slate-400 mb-0.5">{r.label}</p>
            <p className="text-xs font-semibold text-slate-800 truncate">{r.value}</p>
          </div>
        ))}
      </div>

      <div>
        <p className="text-xxs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Progress</p>
        <div className="flex justify-between text-xxs text-slate-400 mb-1">
          <span>{v.origin}</span>
          <span className="font-medium text-slate-600">{v.progressPct}%</span>
          <span>{v.destination}</span>
        </div>
        <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
          <div
            className={cn('h-full rounded-full', v.status === 'delayed' ? 'bg-red-500' : v.status === 'halted' ? 'bg-amber-500' : 'bg-blue-600')}
            style={{ width: `${v.progressPct}%` }}
          />
        </div>
      </div>

      <div>
        <p className="text-xxs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Current Location</p>
        <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2">
          <MapPin size={13} className="text-blue-600 flex-shrink-0" />
          <span className="text-xs text-slate-700">{v.currentLocation}</span>
        </div>
      </div>

      {v.alerts.length > 0 && (
        <div>
          <p className="text-xxs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Active Alerts</p>
          <div className="space-y-1.5">
            {v.alerts.map(a => (
              <div key={a} className="flex items-center gap-2 rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-700">
                <AlertTriangle size={11} className="flex-shrink-0" />
                {a}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── SLA Watch Table ───────────────────────────────────────────────────────────

function SLAWatchTable() {
  return (
    <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
        <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <Clock size={14} className="text-amber-500" />
          SLA Watch List
        </h2>
        <span className="text-xxs text-slate-400">{SLA_WATCH.length} records</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50">
              {['Dispatch', 'Route', 'Origin → Destination', 'Carrier', 'Vehicle', 'Status', 'SLA'].map(h => (
                <th key={h} className="text-left px-4 py-2.5 text-xxs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {SLA_WATCH.map(r => (
              <tr key={r.dispatchId} className="hover:bg-slate-50 transition-colors">
                <td className="px-4 py-3 font-mono font-semibold text-slate-900">{r.dispatchId}</td>
                <td className="px-4 py-3 text-slate-600">{r.routeCode}</td>
                <td className="px-4 py-3 text-slate-600">
                  <span className="flex items-center gap-1">
                    {r.origin} <ArrowRight size={10} /> {r.destination}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-600">{r.carrier}</td>
                <td className="px-4 py-3 font-mono text-slate-600">{r.vehicleReg}</td>
                <td className="px-4 py-3">
                  <span className={cn(
                    'rounded-full px-2 py-0.5 text-xxs font-semibold',
                    r.slaStatus === 'breached' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700',
                  )}>
                    {r.slaStatus === 'breached' ? 'BREACHED' : 'AT RISK'}
                  </span>
                </td>
                <td className="px-4 py-3 font-medium">
                  {r.slaStatus === 'breached'
                    ? <span className="text-red-600">+{r.hoursOverdue!.toFixed(1)}h overdue</span>
                    : <span className="text-amber-600">{r.hoursRemaining!.toFixed(1)}h remaining</span>
                  }
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ─── Hub Activity ──────────────────────────────────────────────────────────────

function HubActivity() {
  const [filter, setFilter] = useState<'all' | 'arrival' | 'departure'>('all')
  const visible = HUB_EVENTS.filter(e => filter === 'all' || e.type === filter)

  return (
    <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
        <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <Zap size={14} className="text-blue-600" />
          Hub Activity
        </h2>
        <div className="flex rounded-lg border border-slate-200 overflow-hidden text-xxs font-medium">
          {(['all', 'arrival', 'departure'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                'px-2.5 py-1 capitalize transition-colors',
                filter === f ? 'bg-blue-600 text-white' : 'bg-white text-slate-500 hover:bg-slate-50',
              )}
            >
              {f}
            </button>
          ))}
        </div>
      </div>
      <div className="max-h-72 overflow-y-auto divide-y divide-slate-50">
        {visible.map(e => (
          <div key={e.id} className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors">
            <div className={cn(
              'flex-shrink-0 w-16 text-center rounded-lg border px-1.5 py-1 text-xxs font-semibold',
              e.type === 'arrival' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-blue-50 border-blue-200 text-blue-700',
            )}>
              {e.type === 'arrival' ? '▼ ARR' : '▲ DEP'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-slate-900 truncate">{e.hub}</p>
              <p className="text-xxs text-slate-400 truncate">{e.vehicleReg} · {e.carrier}</p>
            </div>
            <div className="text-right flex-shrink-0">
              <span className={cn('rounded-full border px-2 py-0.5 text-xxs font-semibold capitalize', HUB_STATUS_STYLE[e.status])}>
                {e.status === 'delayed' && e.delayMinutes ? `+${e.delayMinutes}m` : e.status}
              </span>
              <p className="text-xxs text-slate-400 mt-0.5">
                {e.status === 'pending'
                  ? new Date(e.scheduledAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
                  : timeAgo(e.actualAt ?? e.scheduledAt)
                }
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Fleet Board ───────────────────────────────────────────────────────────────

const FLEET_TABS = [
  { key: 'all',        label: 'All' },
  { key: 'in-transit', label: 'In Transit' },
  { key: 'delayed',    label: 'Delayed' },
  { key: 'halted',     label: 'Halted' },
  { key: 'arrived',    label: 'Arrived' },
]

function filterVehicles(vehicles: FleetVehicle[], tab: string) {
  if (tab === 'all') return vehicles
  return vehicles.filter(v => v.status === tab)
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export function OperationsControlTower() {
  const lastRefresh = useLastRefresh()
  const [refreshing, setRefreshing] = useState(false)
  const [fleetTab, setFleetTab] = useState('all')
  const [selectedVehicle, setSelectedVehicle] = useState<FleetVehicle | null>(null)

  function handleRefresh() {
    setRefreshing(true)
    setTimeout(() => setRefreshing(false), 800)
  }

  const filteredVehicles = filterVehicles(FLEET_VEHICLES, fleetTab)
  const counts = {
    all:        FLEET_VEHICLES.length,
    'in-transit': FLEET_VEHICLES.filter(v => v.status === 'in-transit').length,
    delayed:    FLEET_VEHICLES.filter(v => v.status === 'delayed').length,
    halted:     FLEET_VEHICLES.filter(v => v.status === 'halted').length,
    arrived:    FLEET_VEHICLES.filter(v => v.status === 'arrived').length,
  }

  return (
    <div className="flex flex-col min-h-0 bg-slate-50">
      {/* Page header */}
      <div className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-3 sticky top-0 z-10">
        <div>
          <h1 className="text-base font-bold text-slate-900">Operations Control Tower</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Live fleet visibility · Last updated {fmtTime(lastRefresh)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 rounded-full border border-green-200 bg-green-50 px-3 py-1">
            <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
            <span className="text-xxs font-semibold text-green-700">LIVE</span>
          </div>
          <button
            onClick={handleRefresh}
            className="flex h-8 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors"
          >
            <RefreshCw size={13} className={cn('transition-transform', refreshing && 'animate-spin')} />
            Refresh
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6 space-y-6">
        {/* KPI Strip */}
        <div className="grid grid-cols-6 gap-4">
          {OPS_KPI.map(k => (
            <KPICard key={k.label} data={k as any} />
          ))}
        </div>

        {/* SLA Watch + Hub Activity */}
        <div className="grid grid-cols-2 gap-6">
          <SLAWatchTable />
          <HubActivity />
        </div>

        {/* Fleet Board */}
        <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
          <div className="px-4 pt-4 pb-0 border-b border-slate-100">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Truck size={14} className="text-blue-600" />
                Live Fleet Board
              </h2>
              <span className="text-xxs text-slate-400">{FLEET_VEHICLES.length} vehicles tracked</span>
            </div>
            <TabStrip
              tabs={FLEET_TABS.map(t => ({
                ...t,
                label: `${t.label} (${counts[t.key as keyof typeof counts] ?? 0})`,
              }))}
              activeTab={fleetTab}
              onChange={setFleetTab}
            />
          </div>

          <div className="flex">
            {/* Vehicle grid */}
            <div className={cn('flex-1 overflow-auto p-4', selectedVehicle ? 'grid grid-cols-2 gap-3' : 'grid grid-cols-4 gap-3')}>
              {filteredVehicles.length === 0
                ? (
                  <div className="col-span-4 text-center py-12 text-sm text-slate-400">
                    No vehicles in this status.
                  </div>
                )
                : filteredVehicles.map(v => (
                  <VehicleCard
                    key={v.id}
                    v={v}
                    selected={selectedVehicle?.id === v.id}
                    onClick={() => setSelectedVehicle(prev => prev?.id === v.id ? null : v)}
                  />
                ))
              }
            </div>

            {/* Detail panel */}
            {selectedVehicle && (
              <div className="w-80 flex-shrink-0 border-l border-slate-200 p-4 overflow-y-auto bg-white">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wide">Vehicle Detail</h3>
                  <button
                    onClick={() => setSelectedVehicle(null)}
                    className="text-xxs text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    Close
                  </button>
                </div>
                <VehicleDetail v={selectedVehicle} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
