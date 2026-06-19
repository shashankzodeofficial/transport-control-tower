import React, { useState, useMemo } from 'react'
import {
  Truck, Package, Clock, AlertTriangle, CheckCircle2,
  Plus, Search, ChevronRight, X, Filter,
  Zap, MapPin, User, Calendar,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { TabStrip }  from '@/layout/TabStrip'
import { BarChart }  from '@/components/charts/BarChart'
import {
  VEHICLES, PENDING_LOADS, LOAD_PLANS, PLANNING_KPI, CAPACITY_BY_TYPE,
} from './mock/data'
import type { AvailableVehicle, PendingLoad } from './mock/data'
import { useActiveFilters } from '@/hooks/useActiveFilters'

// ─── Availability config ──────────────────────────────────────────────────────

const AVAIL_CFG: Record<string, { label: string; dot: string; style: string }> = {
  available:   { label: 'Available',   dot: 'bg-green-500',  style: 'bg-green-50 text-green-700 border-green-200'  },
  loading:     { label: 'Loading',     dot: 'bg-blue-500',   style: 'bg-blue-50 text-blue-700 border-blue-200'     },
  in_transit:  { label: 'In Transit',  dot: 'bg-violet-500', style: 'bg-violet-50 text-violet-700 border-violet-200'},
  maintenance: { label: 'Maintenance', dot: 'bg-amber-500',  style: 'bg-amber-50 text-amber-700 border-amber-200'  },
  reserved:    { label: 'Reserved',    dot: 'bg-slate-400',  style: 'bg-slate-100 text-slate-600 border-slate-200' },
}

const PRIORITY_CFG: Record<string, string> = {
  critical: 'bg-red-100 text-red-700',
  high:     'bg-amber-100 text-amber-700',
  normal:   'bg-slate-100 text-slate-500',
}

// ─── Tabs ─────────────────────────────────────────────────────────────────────

const TABS = [
  { key: 'loads',    label: 'Pending Loads'  },
  { key: 'vehicles', label: 'Fleet Overview' },
  { key: 'plans',    label: 'Load Plans'     },
]

// ─── Vehicle card ─────────────────────────────────────────────────────────────

function VehicleCard({ v, isSelected, onClick }: {
  v: AvailableVehicle
  isSelected: boolean
  onClick: () => void
}) {
  const cfg = AVAIL_CFG[v.availability]
  const isAvail = v.availability === 'available'

  return (
    <div
      onClick={onClick}
      className={cn(
        'rounded-xl border p-4 cursor-pointer transition-all hover:shadow-sm',
        isSelected ? 'border-blue-400 bg-blue-50 shadow-md' :
        isAvail    ? 'border-green-200 bg-white' :
        'border-slate-200 bg-white opacity-75',
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <Truck size={14} className={cn(isAvail ? 'text-green-600' : 'text-slate-400')} />
          <span className="font-mono text-sm font-bold text-slate-800">{v.reg}</span>
          <span className="rounded text-xxs font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5">{v.type}</span>
        </div>
        <div className="flex items-center gap-1">
          <div className={cn('h-2 w-2 rounded-full', cfg.dot)} />
          <span className="text-xxs font-medium text-slate-500">{cfg.label}</span>
        </div>
      </div>

      {/* Capacity */}
      <div className="mb-3">
        <div className="flex justify-between text-xxs text-slate-400 mb-1">
          <span>Capacity utilization</span>
          <span className={cn('font-semibold', v.utilizationPct > 90 ? 'text-red-600' : v.utilizationPct > 60 ? 'text-amber-600' : 'text-green-600')}>
            {v.utilizationPct}%
          </span>
        </div>
        <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
          <div
            className={cn('h-full rounded-full transition-all', v.utilizationPct > 90 ? 'bg-red-500' : v.utilizationPct > 60 ? 'bg-amber-500' : 'bg-green-500')}
            style={{ width: `${v.utilizationPct}%` }}
          />
        </div>
        <div className="flex justify-between text-xxs text-slate-400 mt-0.5">
          <span>{v.capacityKg.toLocaleString()} kg</span>
          <span>{v.capacityCbm} CBM</span>
        </div>
      </div>

      {/* Meta */}
      <div className="space-y-1 text-xxs text-slate-500">
        <p className="flex items-center gap-1"><User size={10} className="text-slate-300" />{v.driverName}</p>
        <p className="flex items-center gap-1"><MapPin size={10} className="text-slate-300" />{v.location}</p>
        <p className="text-slate-400 truncate">{v.carrier}</p>
        {v.nextAvailable && (
          <p className="flex items-center gap-1 text-amber-600 font-medium">
            <Clock size={10} />Back {new Date(v.nextAvailable).toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'})}
          </p>
        )}
      </div>

      {isAvail && isSelected && (
        <button className="mt-3 w-full rounded-lg bg-blue-600 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 transition-colors">
          + Assign Load
        </button>
      )}
    </div>
  )
}

// ─── Load row ─────────────────────────────────────────────────────────────────

function LoadRow({ load, isSelected, onClick }: {
  load: PendingLoad
  isSelected: boolean
  onClick: () => void
}) {
  const dep = new Date(load.plannedDeparture)
  const hoursLeft = (dep.getTime() - Date.now()) / 3600000
  const isUrgent = hoursLeft < 2

  return (
    <tr
      onClick={onClick}
      className={cn(
        'cursor-pointer border-b border-slate-100 transition-colors',
        isSelected ? 'bg-blue-50' :
        load.priority === 'critical' ? 'bg-red-50/40 hover:bg-red-50' :
        isUrgent ? 'bg-amber-50/30 hover:bg-amber-50' :
        'hover:bg-slate-50',
      )}
    >
      <td className="px-4 py-3 font-mono text-xs font-semibold text-slate-700">{load.id}</td>
      <td className="px-4 py-3">
        <p className="text-xs font-semibold text-slate-800">{load.routeCode}</p>
        <p className="text-xxs text-slate-400">{load.routeName}</p>
      </td>
      <td className="px-4 py-3 text-xs text-slate-500">
        <p>{load.origin.split(' (')[0]}</p>
        <p className="text-slate-400">→ {load.destination.split(' (')[0]}</p>
      </td>
      <td className="px-4 py-3 text-xs tabular-nums text-slate-600">
        {load.huCount} HUs<br />
        <span className="text-xxs text-slate-400">{load.weightKg.toLocaleString()} kg</span>
      </td>
      <td className="px-4 py-3">
        <span className={cn('rounded-full px-2.5 py-0.5 text-xxs font-bold capitalize', PRIORITY_CFG[load.priority])}>
          {load.priority}
        </span>
      </td>
      <td className="px-4 py-3">
        <p className={cn('text-xs font-semibold', isUrgent ? 'text-red-600' : hoursLeft < 6 ? 'text-amber-600' : 'text-slate-600')}>
          {dep.toLocaleTimeString('en-IN', {hour:'2-digit',minute:'2-digit'})}
        </p>
        <p className="text-xxs text-slate-400">
          {isUrgent ? <span className="text-red-500 font-semibold">In {Math.round(hoursLeft * 60)}min</span> : `In ${Math.round(hoursLeft)}h`}
        </p>
      </td>
      <td className="px-4 py-3">
        {load.assignedVehicleId
          ? <span className="flex items-center gap-1 text-xxs text-green-700 font-semibold"><CheckCircle2 size={11} />Assigned</span>
          : <span className="flex items-center gap-1 text-xxs text-amber-600 font-semibold"><AlertTriangle size={11} />Unassigned</span>
        }
      </td>
      <td className="px-4 py-3">
        <div className="flex flex-wrap gap-1">
          {load.tags.slice(0, 2).map(tag => (
            <span key={tag} className="rounded-full bg-slate-100 px-2 py-0.5 text-xxs font-medium text-slate-500">{tag}</span>
          ))}
        </div>
      </td>
      <td className="px-4 py-3">
        <ChevronRight size={14} className={cn('transition-transform', isSelected ? 'text-blue-500 rotate-90' : 'text-slate-300')} />
      </td>
    </tr>
  )
}

// ─── New Load Plan modal ──────────────────────────────────────────────────────

function NewLoadPlanModal({ onClose }: { onClose: () => void }) {
  const [form, setForm] = useState({
    loadId: '', vehicleReg: '', vehicleType: 'FTL',
    routeCode: '', origin: '', destination: '',
    plannedDeparture: '', plannedArrival: '',
    huCount: '', weightKg: '', notes: '',
  })
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))
  const inCls = 'w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100'

  return (
    <div className="fixed inset-0 z-modal flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="w-[580px] rounded-2xl bg-white shadow-xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <h2 className="text-base font-bold text-slate-900">Create New Load Plan</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 hover:bg-slate-100 transition-colors"><X size={16} className="text-slate-400" /></button>
        </div>
        <div className="grid grid-cols-2 gap-4 px-6 py-5">
          <div>
            <label className="mb-1 block text-xxs font-semibold uppercase tracking-wide text-slate-400">Load ID *</label>
            <input value={form.loadId} onChange={e => set('loadId', e.target.value)} placeholder="LOAD-2024-XXXX" className={inCls} />
          </div>
          <div>
            <label className="mb-1 block text-xxs font-semibold uppercase tracking-wide text-slate-400">Vehicle Reg *</label>
            <input value={form.vehicleReg} onChange={e => set('vehicleReg', e.target.value)} placeholder="MH12XY9901" className={inCls} />
          </div>
          <div>
            <label className="mb-1 block text-xxs font-semibold uppercase tracking-wide text-slate-400">Vehicle Type</label>
            <select value={form.vehicleType} onChange={e => set('vehicleType', e.target.value)} className={inCls}>
              {['FTL','LTL','LCV','Trailer','Reefer'].map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xxs font-semibold uppercase tracking-wide text-slate-400">Route Code</label>
            <input value={form.routeCode} onChange={e => set('routeCode', e.target.value)} placeholder="DEL-MUM-01" className={inCls} />
          </div>
          <div>
            <label className="mb-1 block text-xxs font-semibold uppercase tracking-wide text-slate-400">Origin *</label>
            <input value={form.origin} onChange={e => set('origin', e.target.value)} placeholder="Delhi (Gurgaon)" className={inCls} />
          </div>
          <div>
            <label className="mb-1 block text-xxs font-semibold uppercase tracking-wide text-slate-400">Destination *</label>
            <input value={form.destination} onChange={e => set('destination', e.target.value)} placeholder="Mumbai (Bhiwandi)" className={inCls} />
          </div>
          <div>
            <label className="mb-1 block text-xxs font-semibold uppercase tracking-wide text-slate-400">Planned Departure</label>
            <input type="datetime-local" value={form.plannedDeparture} onChange={e => set('plannedDeparture', e.target.value)} className={inCls} />
          </div>
          <div>
            <label className="mb-1 block text-xxs font-semibold uppercase tracking-wide text-slate-400">Planned Arrival</label>
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
          <div className="col-span-2">
            <label className="mb-1 block text-xxs font-semibold uppercase tracking-wide text-slate-400">Notes</label>
            <textarea value={form.notes} onChange={e => set('notes', e.target.value)} rows={2} placeholder="Optional instructions…" className={cn(inCls, 'resize-none')} />
          </div>
        </div>
        <div className="flex justify-end gap-2 border-t border-slate-200 px-6 py-4">
          <button onClick={onClose} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">Cancel</button>
          <button
            onClick={() => {
              if (!form.loadId || !form.vehicleReg || !form.origin || !form.destination) {
                alert('Please fill in all required fields (*)')
                return
              }
              onClose()
            }}
            className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
          >
            Create Load Plan
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export function LoadPlanning() {
  const [tab, setTab]         = useState('loads')
  const [search, setSearch]   = useState('')
  const [selectedLoad, setSelectedLoad] = useState<string | null>(null)
  const [selectedVehicle, setSelectedVehicle] = useState<string | null>(null)
  const [avFilter, setAvFilter] = useState<string>('all')
  const [showNewModal, setShowNewModal] = useState(false)

  const { region, dateRange, matchesRoute, matchesCity, matchesDate } = useActiveFilters('LoadPlanning')

  // Base load list filtered by global region + date
  const baseLoads = useMemo(() =>
    PENDING_LOADS.filter(l =>
      matchesRoute(l.routeCode) && matchesDate(l.plannedDeparture)
    ),
    [region, dateRange],
  )

  // Base vehicle list filtered by global region (vehicles have a city location)
  const baseVehicles = useMemo(() =>
    region ? VEHICLES.filter(v => matchesCity(v.location)) : VEHICLES,
    [region, dateRange],
  )

  // Base plans filtered by global region + date
  const basePlans = useMemo(() =>
    LOAD_PLANS.filter(p =>
      matchesRoute(p.routeCode) && matchesDate(p.plannedDeparture)
    ),
    [region, dateRange],
  )

  // KPI values derived from filtered data
  const kpiValues = useMemo(() => {
    const available     = baseVehicles.filter(v => v.availability === 'available').length
    const inMaintenance = baseVehicles.filter(v => v.availability === 'maintenance').length
    const pendingLoads  = baseLoads.filter(l => !l.assignedVehicleId).length
    const criticalLoads = baseLoads.filter(l => l.priority === 'critical').length
    const plansToday    = basePlans.filter(p => p.status !== 'cancelled').length
    const avgUtil       = baseVehicles.length
      ? Math.round(baseVehicles.reduce((s, v) => s + v.utilizationPct, 0) / baseVehicles.length)
      : PLANNING_KPI.avgUtilization
    return { available, pendingLoads, criticalLoads, avgUtil, inMaintenance, plansToday }
  }, [baseLoads, baseVehicles, basePlans])

  const filteredLoads = useMemo(() => {
    const q = search.toLowerCase()
    return baseLoads.filter(l =>
      !q ||
      l.id.toLowerCase().includes(q) ||
      l.routeCode.toLowerCase().includes(q) ||
      l.routeName.toLowerCase().includes(q) ||
      l.origin.toLowerCase().includes(q) ||
      l.destination.toLowerCase().includes(q),
    ).sort((a, b) => {
      const p = { critical: 0, high: 1, normal: 2 }
      return (p[a.priority] - p[b.priority]) || (new Date(a.plannedDeparture).getTime() - new Date(b.plannedDeparture).getTime())
    })
  }, [baseLoads, search])

  const filteredVehicles = useMemo(() =>
    avFilter === 'all' ? baseVehicles : baseVehicles.filter(v => v.availability === avFilter),
    [baseVehicles, avFilter],
  )

  const capData = CAPACITY_BY_TYPE.map(c => ({ type: c.type, Available: c.available, 'In Use': c.total - c.available }))

  return (
    <>
    {showNewModal && <NewLoadPlanModal onClose={() => setShowNewModal(false)} />}
    <div className="flex flex-col h-full bg-slate-50">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
        <div>
          <h1 className="text-lg font-bold text-slate-900">Load Planning Workbench</h1>
          <p className="text-xs text-slate-400">Assign vehicles to pending loads, manage capacity and create plans</p>
        </div>
        <button onClick={() => setShowNewModal(true)} className="flex h-8 items-center gap-1.5 rounded-lg bg-blue-600 px-3 text-xs font-semibold text-white hover:bg-blue-700">
          <Plus size={13} />New Load Plan
        </button>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-6 gap-3 border-b border-slate-200 bg-white px-6 py-4">
        {[
          { label: 'Available Vehicles', value: kpiValues.available,            style: 'text-green-600'  },
          { label: 'Pending Loads',      value: kpiValues.pendingLoads,         style: 'text-amber-600'  },
          { label: 'Critical Loads',     value: kpiValues.criticalLoads,        style: 'text-red-600'    },
          { label: 'Avg Utilization',    value: `${kpiValues.avgUtil}%`,        style: 'text-blue-600'   },
          { label: 'In Maintenance',     value: kpiValues.inMaintenance,        style: 'text-amber-600'  },
          { label: 'Plans Today',        value: kpiValues.plansToday,           style: 'text-slate-700'  },
        ].map(k => (
          <div key={k.label} className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
            <p className="text-xxs font-semibold uppercase tracking-wide text-slate-400 mb-1">{k.label}</p>
            <p className={cn('text-2xl font-bold tabular-nums', k.style)}>{k.value}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <TabStrip
        tabs={TABS.map(t => ({
          ...t,
          badge: t.key === 'loads' ? baseLoads.filter(l=>!l.assignedVehicleId).length :
                 t.key === 'vehicles' ? baseVehicles.length :
                 basePlans.length,
        }))}
        activeTab={tab}
        onChange={setTab}
        variant="page"
      />

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        {/* ── Pending Loads ── */}
        {tab === 'loads' && (
          <div>
            {/* Toolbar */}
            <div className="flex items-center gap-3 mb-4">
              <div className="flex flex-1 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5">
                <Search size={14} className="text-slate-400" />
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search loads…"
                  className="flex-1 bg-transparent text-sm outline-none placeholder:text-slate-400"
                />
              </div>
              <div className="flex items-center gap-1.5">
                {['all','critical','high','normal'].map(p => (
                  <button
                    key={p}
                    onClick={() => {}}
                    className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-200 capitalize"
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    {['Load ID','Route','Origin → Dest','Load','Priority','Planned Dept','Status','Tags',''].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xxs font-semibold uppercase tracking-wide text-slate-400">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredLoads.map(load => (
                    <LoadRow
                      key={load.id}
                      load={load}
                      isSelected={selectedLoad === load.id}
                      onClick={() => setSelectedLoad(prev => prev === load.id ? null : load.id)}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── Fleet Overview ── */}
        {tab === 'vehicles' && (
          <div>
            {/* Capacity summary chart + filter */}
            <div className="mb-5 grid grid-cols-4 gap-4">
              <div className="col-span-2 rounded-xl border border-slate-200 bg-white p-4">
                <p className="mb-3 text-xs font-semibold text-slate-700">Fleet Capacity by Type</p>
                <BarChart
                  data={capData}
                  xKey="type"
                  series={[
                    { dataKey: 'Available', label: 'Available', color: '#4ade80' },
                    { dataKey: 'In Use',    label: 'In Use',    color: '#60a5fa' },
                  ]}
                  height={100}
                  stacked
                  showGrid
                  showLegend
                />
              </div>
              <div className="col-span-2 grid grid-cols-2 gap-3">
                {Object.entries(AVAIL_CFG).map(([key, cfg]) => {
                  const count = VEHICLES.filter(v => v.availability === key).length
                  return (
                    <button
                      key={key}
                      onClick={() => setAvFilter(avFilter === key ? 'all' : key)}
                      className={cn(
                        'rounded-xl border p-4 text-left transition-all hover:shadow-sm',
                        avFilter === key ? 'border-blue-400 bg-blue-50' : 'border-slate-200 bg-white',
                      )}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <div className={cn('h-2.5 w-2.5 rounded-full', cfg.dot)} />
                        <span className="text-xxs font-medium text-slate-500 capitalize">{cfg.label}</span>
                      </div>
                      <div className="text-2xl font-bold tabular-nums text-slate-700">{count}</div>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Vehicle grid */}
            <div className="grid grid-cols-3 gap-4">
              {filteredVehicles.map(v => (
                <VehicleCard
                  key={v.id}
                  v={v}
                  isSelected={selectedVehicle === v.id}
                  onClick={() => setSelectedVehicle(prev => prev === v.id ? null : v.id)}
                />
              ))}
            </div>
          </div>
        )}

        {/* ── Load Plans ── */}
        {tab === 'plans' && (
          <div className="space-y-4">
            {LOAD_PLANS.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                <Truck size={28} className="mb-2" />
                <p className="text-sm">No load plans yet. Create one from pending loads.</p>
              </div>
            ) : (
              LOAD_PLANS.map(plan => {
                const vehicle = VEHICLES.find(v => v.id === plan.vehicleId)
                const loads   = PENDING_LOADS.filter(l => plan.loads.includes(l.id))
                return (
                  <div key={plan.id} className="rounded-xl border border-slate-200 bg-white overflow-hidden">
                    <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3">
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-sm font-bold text-slate-800">{plan.id}</span>
                        <span className={cn(
                          'rounded-full px-2.5 py-0.5 text-xxs font-bold capitalize',
                          plan.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                          plan.status === 'draft'     ? 'bg-slate-100 text-slate-600' :
                          'bg-blue-100 text-blue-700',
                        )}>
                          {plan.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-500">
                        <span>{vehicle?.reg ?? plan.vehicleId}</span>
                        <span>{plan.utilizationPct}% utilized</span>
                        <span>₹{plan.freightEstimate.toLocaleString()}</span>
                        <span>by {plan.createdBy}</span>
                      </div>
                    </div>
                    <div className="px-5 py-3">
                      <div className="mb-2 h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className={cn('h-full rounded-full', plan.utilizationPct > 90 ? 'bg-red-500' : plan.utilizationPct > 70 ? 'bg-amber-500' : 'bg-green-500')}
                          style={{ width: `${plan.utilizationPct}%` }}
                        />
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {loads.map(l => (
                          <span key={l.id} className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs">
                            <Package size={11} className="text-slate-400" />
                            {l.id} — {l.routeCode}
                            <span className={cn('ml-1 rounded-full px-1.5 py-0.5 text-xxs font-bold', PRIORITY_CFG[l.priority])}>{l.priority}</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        )}
      </div>
    </div>
    </>
  )
}
