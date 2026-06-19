import React, { useState, useMemo } from 'react'
import { Plus, Search, Edit3, Trash2, X, ToggleLeft, ToggleRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { FleetMaster, VehicleType, VehicleStatus, INITIAL_FLEET, nextId } from '../mock/data'
import {
  Modal, ConfirmDelete, FormField, inputCls, selectCls,
  AuditStamp, Pagination, DetailRow, SortHeader,
} from '../components/MasterLayout'

const VEHICLE_TYPES: VehicleType[]  = ['FTL Truck', 'LTL Truck', 'LCV', 'Trailer', 'Reefer']
const VEHICLE_STATUSES: VehicleStatus[] = ['active', 'inactive', 'maintenance', 'decommissioned']
const PAGE_SIZE = 8

const STATUS_COLOR: Record<VehicleStatus, string> = {
  active:        'bg-green-100 text-green-700',
  inactive:      'bg-slate-100 text-slate-600',
  maintenance:   'bg-amber-100 text-amber-700',
  decommissioned:'bg-red-100 text-red-600',
}

function blank(): Omit<FleetMaster, 'id' | 'createdAt' | 'updatedAt'> {
  return { vehicleNumber: '', vehicleType: 'FTL Truck', capacityTons: 0, capacityCbm: 0, carrier: '', registration: '', driverName: '', driverPhone: '', status: 'active' }
}

type SortKey = keyof FleetMaster

export function FleetMasterScreen() {
  const [rows,    setRows]    = useState<FleetMaster[]>(INITIAL_FLEET)
  const [search,  setSearch]  = useState('')
  const [typeFilter, setTypeFilter] = useState<VehicleType | 'All'>('All')
  const [statusFilter, setStatusFilter] = useState<VehicleStatus | 'All'>('All')
  const [page,    setPage]    = useState(1)
  const [sortKey, setSortKey] = useState<SortKey>('vehicleNumber')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
  const [selected,   setSelected]   = useState<FleetMaster | null>(null)
  const [modalMode,  setModalMode]  = useState<'add' | 'edit' | null>(null)
  const [form,       setForm]       = useState(blank())
  const [errors,     setErrors]     = useState<Partial<Record<keyof typeof form, string>>>({})
  const [deletingId, setDeletingId] = useState<string | null>(null)

  function handleSort(k: string) {
    if (k === sortKey) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(k as SortKey); setSortDir('asc') }
    setPage(1)
  }

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return rows
      .filter(r =>
        (!q || r.vehicleNumber.toLowerCase().includes(q) || r.carrier.toLowerCase().includes(q) || r.driverName.toLowerCase().includes(q)) &&
        (typeFilter   === 'All' || r.vehicleType === typeFilter) &&
        (statusFilter === 'All' || r.status === statusFilter)
      )
      .sort((a, b) => {
        const av = a[sortKey] as string | number
        const bv = b[sortKey] as string | number
        const cmp = av < bv ? -1 : av > bv ? 1 : 0
        return sortDir === 'asc' ? cmp : -cmp
      })
  }, [rows, search, typeFilter, statusFilter, sortKey, sortDir])

  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  function openAdd() { setForm(blank()); setErrors({}); setModalMode('add') }
  function openEdit(r: FleetMaster) {
    setForm({ vehicleNumber: r.vehicleNumber, vehicleType: r.vehicleType, capacityTons: r.capacityTons, capacityCbm: r.capacityCbm, carrier: r.carrier, registration: r.registration, driverName: r.driverName, driverPhone: r.driverPhone, status: r.status })
    setErrors({}); setModalMode('edit'); setSelected(r)
  }

  function validate() {
    const e: typeof errors = {}
    if (!form.vehicleNumber.trim()) e.vehicleNumber = 'Vehicle number is required'
    if (!form.carrier.trim())       e.carrier       = 'Carrier is required'
    if (!form.driverName.trim())    e.driverName    = 'Driver name is required'
    if (form.capacityTons <= 0)     e.capacityTons  = 'Capacity must be > 0'
    setErrors(e); return Object.keys(e).length === 0
  }

  function handleSave() {
    if (!validate()) return
    const now = new Date().toISOString()
    if (modalMode === 'add') {
      setRows(prev => [{ ...form, id: nextId('V', rows), createdAt: now, updatedAt: now }, ...prev])
    } else if (selected) {
      setRows(prev => prev.map(r => r.id === selected.id ? { ...r, ...form, updatedAt: now } : r))
      setSelected(prev => prev ? { ...prev, ...form, updatedAt: now } : null)
    }
    setModalMode(null)
  }

  function handleDelete(id: string) {
    setRows(prev => prev.filter(r => r.id !== id))
    if (selected?.id === id) setSelected(null)
    setDeletingId(null)
  }

  function cycleStatus(r: FleetMaster) {
    const idx  = VEHICLE_STATUSES.indexOf(r.status)
    const next = VEHICLE_STATUSES[(idx + 1) % VEHICLE_STATUSES.length]
    const now  = new Date().toISOString()
    setRows(prev => prev.map(v => v.id === r.id ? { ...v, status: next, updatedAt: now } : v))
    setSelected(prev => prev?.id === r.id ? { ...prev, status: next, updatedAt: now } : prev)
  }

  function f(k: keyof typeof form, v: string | number) {
    setForm(prev => ({ ...prev, [k]: v }))
    setErrors(prev => { const n = { ...prev }; delete n[k]; return n })
  }

  return (
    <div className="flex h-full gap-4">
      <div className="flex flex-1 flex-col rounded-xl border border-slate-200 bg-white overflow-hidden">
        {/* Toolbar */}
        <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-3 flex-wrap">
          <div className="relative flex-1 min-w-[200px] max-w-xs">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={search} onChange={e => { setSearch(e.target.value); setPage(1) }} placeholder="Search vehicle, carrier, driver…" className="w-full rounded-lg border border-slate-200 pl-8 pr-3 py-2 text-xs text-slate-700 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100" />
          </div>
          <div className="flex items-center gap-1">
            {(['All', ...VEHICLE_TYPES] as const).map(t => (
              <button key={t} onClick={() => { setTypeFilter(t as VehicleType | 'All'); setPage(1) }}
                className={cn('rounded-full border px-2.5 py-1 text-xxs font-medium transition-colors', typeFilter === t ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-200 text-slate-500 hover:border-blue-300')}>
                {t}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1">
            {(['All', ...VEHICLE_STATUSES] as const).map(s => (
              <button key={s} onClick={() => { setStatusFilter(s as VehicleStatus | 'All'); setPage(1) }}
                className={cn('rounded-full border px-2.5 py-1 text-xxs font-medium capitalize transition-colors', statusFilter === s ? 'bg-slate-700 border-slate-700 text-white' : 'border-slate-200 text-slate-500 hover:border-slate-400')}>
                {s}
              </button>
            ))}
          </div>
          <button onClick={openAdd} className="ml-auto flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-700 transition-colors">
            <Plus size={13} /> Add Vehicle
          </button>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <SortHeader label="Vehicle No."  sortKey="vehicleNumber" currentKey={sortKey} direction={sortDir} onSort={handleSort} />
                <SortHeader label="Type"         sortKey="vehicleType"   currentKey={sortKey} direction={sortDir} onSort={handleSort} />
                <SortHeader label="Capacity"     sortKey="capacityTons"  currentKey={sortKey} direction={sortDir} onSort={handleSort} />
                <SortHeader label="Carrier"      sortKey="carrier"       currentKey={sortKey} direction={sortDir} onSort={handleSort} />
                <SortHeader label="Driver"       sortKey="driverName"    currentKey={sortKey} direction={sortDir} onSort={handleSort} />
                <th className="px-4 py-2.5 text-left text-xxs font-semibold uppercase tracking-wide text-slate-500">Status</th>
                <th className="px-4 py-2.5 text-left text-xxs font-semibold uppercase tracking-wide text-slate-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {paged.map(r => (
                <tr key={r.id} onClick={() => setSelected(r)} className={cn('cursor-pointer transition-colors hover:bg-slate-50', selected?.id === r.id && 'bg-blue-50')}>
                  <td className="px-4 py-3 font-mono font-semibold text-slate-800 text-xxs">{r.vehicleNumber}</td>
                  <td className="px-4 py-3 text-slate-700">{r.vehicleType}</td>
                  <td className="px-4 py-3 text-slate-600">{r.capacityTons}T / {r.capacityCbm}m³</td>
                  <td className="px-4 py-3 text-slate-700">{r.carrier}</td>
                  <td className="px-4 py-3 text-slate-600">{r.driverName}</td>
                  <td className="px-4 py-3">
                    <span className={cn('rounded-full px-2 py-0.5 text-xxs font-semibold capitalize', STATUS_COLOR[r.status])}>
                      {r.status}
                    </span>
                  </td>
                  <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                    <div className="flex items-center gap-1">
                      <button onClick={() => cycleStatus(r)} className="rounded p-1 text-slate-400 hover:text-slate-700 transition-colors" title="Cycle status">
                        {r.status === 'active' ? <ToggleRight size={16} className="text-green-500" /> : <ToggleLeft size={16} />}
                      </button>
                      <button onClick={() => openEdit(r)} className="rounded p-1 text-slate-400 hover:text-blue-600 transition-colors"><Edit3 size={13} /></button>
                      <button onClick={() => setDeletingId(r.id)} className="rounded p-1 text-slate-400 hover:text-red-600 transition-colors"><Trash2 size={13} /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {paged.length === 0 && (
                <tr><td colSpan={7} className="py-12 text-center text-sm text-slate-400">No vehicles match your filters.</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <Pagination page={page} pageSize={PAGE_SIZE} total={filtered.length} onChange={setPage} />
      </div>

      {/* Detail panel */}
      {selected && (
        <div className="w-72 shrink-0 rounded-xl border border-slate-200 bg-white overflow-hidden flex flex-col">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <h3 className="text-xs font-bold text-slate-900">Vehicle Detail</h3>
            <button onClick={() => setSelected(null)} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"><X size={14} /></button>
          </div>
          <div className="flex-1 overflow-auto p-5 space-y-4">
            <DetailRow label="Vehicle Number" value={selected.vehicleNumber} mono />
            <DetailRow label="Type"           value={selected.vehicleType} />
            <DetailRow label="Capacity"       value={`${selected.capacityTons} Tons / ${selected.capacityCbm} m³`} />
            <DetailRow label="Carrier"        value={selected.carrier} />
            <DetailRow label="Registration"   value={selected.registration} mono />
            <DetailRow label="Driver"         value={selected.driverName} />
            <DetailRow label="Driver Phone"   value={selected.driverPhone} />
            <DetailRow label="Status"         value={<span className={cn('rounded-full px-2 py-0.5 text-xxs font-semibold capitalize', STATUS_COLOR[selected.status])}>{selected.status}</span>} />
            <AuditStamp createdAt={selected.createdAt} updatedAt={selected.updatedAt} />
          </div>
          <div className="border-t border-slate-100 px-5 py-3 flex gap-2">
            <button onClick={() => openEdit(selected)} className="flex-1 rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-700 transition-colors">Edit</button>
            <button onClick={() => setDeletingId(selected.id)} className="rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors">Delete</button>
          </div>
        </div>
      )}

      {/* Modal */}
      {modalMode && (
        <Modal title={modalMode === 'add' ? 'Add Vehicle' : 'Edit Vehicle'} onClose={() => setModalMode(null)}>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Vehicle Number" error={errors.vehicleNumber} required>
              <input value={form.vehicleNumber} onChange={e => f('vehicleNumber', e.target.value)} placeholder="MH12XY1234" className={inputCls} />
            </FormField>
            <FormField label="Vehicle Type" required>
              <select value={form.vehicleType} onChange={e => f('vehicleType', e.target.value)} className={selectCls}>
                {VEHICLE_TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
            </FormField>
            <FormField label="Capacity (Tons)" error={errors.capacityTons} required>
              <input type="number" min={0.5} step={0.5} value={form.capacityTons || ''} onChange={e => f('capacityTons', +e.target.value)} className={inputCls} />
            </FormField>
            <FormField label="Capacity (CBM)">
              <input type="number" min={1} value={form.capacityCbm || ''} onChange={e => f('capacityCbm', +e.target.value)} className={inputCls} />
            </FormField>
            <FormField label="Carrier" error={errors.carrier} required>
              <input value={form.carrier} onChange={e => f('carrier', e.target.value)} placeholder="Prime Transport Co" className={inputCls} />
            </FormField>
            <FormField label="Registration">
              <input value={form.registration} onChange={e => f('registration', e.target.value)} placeholder="MH12XY1234" className={inputCls} />
            </FormField>
            <FormField label="Driver Name" error={errors.driverName} required>
              <input value={form.driverName} onChange={e => f('driverName', e.target.value)} placeholder="Ramesh Singh" className={inputCls} />
            </FormField>
            <FormField label="Driver Phone">
              <input value={form.driverPhone} onChange={e => f('driverPhone', e.target.value)} placeholder="+91 98100 00000" className={inputCls} />
            </FormField>
            <FormField label="Status" required>
              <select value={form.status} onChange={e => f('status', e.target.value)} className={selectCls}>
                {VEHICLE_STATUSES.map(s => <option key={s} value={s} className="capitalize">{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
              </select>
            </FormField>
          </div>
          <div className="mt-6 flex justify-end gap-3">
            <button onClick={() => setModalMode(null)} className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors">Cancel</button>
            <button onClick={handleSave} className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700 transition-colors">
              {modalMode === 'add' ? 'Add Vehicle' : 'Save Changes'}
            </button>
          </div>
        </Modal>
      )}

      {deletingId && (
        <ConfirmDelete
          label={rows.find(r => r.id === deletingId)?.vehicleNumber ?? deletingId}
          onConfirm={() => handleDelete(deletingId)}
          onCancel={() => setDeletingId(null)}
        />
      )}
    </div>
  )
}
