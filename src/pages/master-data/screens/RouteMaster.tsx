import React, { useState, useMemo } from 'react'
import { Plus, Search, Edit3, Trash2, X, ToggleLeft, ToggleRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  RouteMaster, RouteType, INITIAL_ROUTES, nextId,
} from '../mock/data'
import {
  Modal, ConfirmDelete, FormField, inputCls, selectCls,
  AuditStamp, StatusBadge, Pagination, DetailRow, SortHeader,
} from '../components/MasterLayout'

const ROUTE_TYPES: RouteType[] = ['FTL', 'LTL', 'LCV', 'Express', 'Cold Chain']
const PAGE_SIZE = 8

function blank(): Omit<RouteMaster, 'id' | 'createdAt' | 'updatedAt'> {
  return { routeCode: '', origin: '', destination: '', distanceKm: 0, transitHours: 0, slaHours: 0, routeType: 'FTL', active: true }
}

type SortKey = keyof RouteMaster

export function RouteMasterScreen() {
  const [rows,    setRows]    = useState<RouteMaster[]>(INITIAL_ROUTES)
  const [search,  setSearch]  = useState('')
  const [typeFilter, setTypeFilter] = useState<RouteType | 'All'>('All')
  const [activeFilter, setActiveFilter] = useState<'All' | 'Active' | 'Inactive'>('All')
  const [page,    setPage]    = useState(1)
  const [sortKey, setSortKey] = useState<SortKey>('routeCode')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
  const [selected,  setSelected]  = useState<RouteMaster | null>(null)
  const [modalMode, setModalMode] = useState<'add' | 'edit' | null>(null)
  const [form,      setForm]      = useState(blank())
  const [errors,    setErrors]    = useState<Partial<Record<keyof typeof form, string>>>({})
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
        (!q || r.routeCode.toLowerCase().includes(q) || r.origin.toLowerCase().includes(q) || r.destination.toLowerCase().includes(q)) &&
        (typeFilter   === 'All' || r.routeType === typeFilter) &&
        (activeFilter === 'All' || (activeFilter === 'Active' ? r.active : !r.active))
      )
      .sort((a, b) => {
        const av = a[sortKey] as string | number | boolean
        const bv = b[sortKey] as string | number | boolean
        const cmp = av < bv ? -1 : av > bv ? 1 : 0
        return sortDir === 'asc' ? cmp : -cmp
      })
  }, [rows, search, typeFilter, activeFilter, sortKey, sortDir])

  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  function openAdd() {
    setForm(blank()); setErrors({}); setModalMode('add')
  }
  function openEdit(r: RouteMaster) {
    setForm({ routeCode: r.routeCode, origin: r.origin, destination: r.destination, distanceKm: r.distanceKm, transitHours: r.transitHours, slaHours: r.slaHours, routeType: r.routeType, active: r.active })
    setErrors({}); setModalMode('edit')
    setSelected(r)
  }

  function validate() {
    const e: typeof errors = {}
    if (!form.routeCode.trim()) e.routeCode = 'Route code is required'
    if (!form.origin.trim())    e.origin    = 'Origin is required'
    if (!form.destination.trim()) e.destination = 'Destination is required'
    if (form.distanceKm <= 0)   e.distanceKm  = 'Distance must be > 0'
    if (form.transitHours <= 0) e.transitHours = 'Transit hours must be > 0'
    if (form.slaHours <= 0)     e.slaHours    = 'SLA hours must be > 0'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  function handleSave() {
    if (!validate()) return
    const now = new Date().toISOString()
    if (modalMode === 'add') {
      const rec: RouteMaster = { ...form, id: nextId('R', rows), createdAt: now, updatedAt: now }
      setRows(prev => [rec, ...prev])
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

  function toggleActive(id: string) {
    const now = new Date().toISOString()
    setRows(prev => prev.map(r => r.id === id ? { ...r, active: !r.active, updatedAt: now } : r))
    setSelected(prev => prev?.id === id ? { ...prev, active: !prev.active, updatedAt: now } : prev)
  }

  function f(k: keyof typeof form, v: string | number | boolean) {
    setForm(prev => ({ ...prev, [k]: v }))
    setErrors(prev => { const n = { ...prev }; delete n[k]; return n })
  }

  return (
    <div className="flex h-full gap-4">
      {/* Main panel */}
      <div className="flex flex-1 flex-col rounded-xl border border-slate-200 bg-white overflow-hidden">
        {/* Toolbar */}
        <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-3">
          <div className="relative flex-1 max-w-xs">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1) }}
              placeholder="Search route code, origin, destination…"
              className="w-full rounded-lg border border-slate-200 pl-8 pr-3 py-2 text-xs text-slate-700 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
          </div>
          <div className="flex items-center gap-1">
            {(['All', ...ROUTE_TYPES] as const).map(t => (
              <button
                key={t}
                onClick={() => { setTypeFilter(t as RouteType | 'All'); setPage(1) }}
                className={cn(
                  'rounded-full border px-2.5 py-1 text-xxs font-medium transition-colors',
                  typeFilter === t ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-200 text-slate-500 hover:border-blue-300',
                )}
              >
                {t}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1">
            {(['All', 'Active', 'Inactive'] as const).map(s => (
              <button
                key={s}
                onClick={() => { setActiveFilter(s); setPage(1) }}
                className={cn(
                  'rounded-full border px-2.5 py-1 text-xxs font-medium transition-colors',
                  activeFilter === s ? 'bg-slate-700 border-slate-700 text-white' : 'border-slate-200 text-slate-500 hover:border-slate-400',
                )}
              >
                {s}
              </button>
            ))}
          </div>
          <button
            onClick={openAdd}
            className="ml-auto flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-700 transition-colors"
          >
            <Plus size={13} /> Add Route
          </button>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <SortHeader label="Route Code"    sortKey="routeCode"    currentKey={sortKey} direction={sortDir} onSort={handleSort} />
                <SortHeader label="Origin"        sortKey="origin"       currentKey={sortKey} direction={sortDir} onSort={handleSort} />
                <SortHeader label="Destination"   sortKey="destination"  currentKey={sortKey} direction={sortDir} onSort={handleSort} />
                <SortHeader label="Distance"      sortKey="distanceKm"   currentKey={sortKey} direction={sortDir} onSort={handleSort} />
                <SortHeader label="Transit (hrs)" sortKey="transitHours" currentKey={sortKey} direction={sortDir} onSort={handleSort} />
                <SortHeader label="SLA (hrs)"     sortKey="slaHours"     currentKey={sortKey} direction={sortDir} onSort={handleSort} />
                <th className="px-4 py-2.5 text-left text-xxs font-semibold uppercase tracking-wide text-slate-500">Type</th>
                <th className="px-4 py-2.5 text-left text-xxs font-semibold uppercase tracking-wide text-slate-500">Status</th>
                <th className="px-4 py-2.5 text-left text-xxs font-semibold uppercase tracking-wide text-slate-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {paged.map(r => (
                <tr
                  key={r.id}
                  onClick={() => setSelected(r)}
                  className={cn('cursor-pointer transition-colors hover:bg-slate-50', selected?.id === r.id && 'bg-blue-50')}
                >
                  <td className="px-4 py-3 font-mono font-semibold text-slate-800 text-xxs">{r.routeCode}</td>
                  <td className="px-4 py-3 text-slate-700">{r.origin}</td>
                  <td className="px-4 py-3 text-slate-700">{r.destination}</td>
                  <td className="px-4 py-3 text-slate-600">{r.distanceKm.toLocaleString()} km</td>
                  <td className="px-4 py-3 text-slate-600">{r.transitHours}h</td>
                  <td className="px-4 py-3 text-slate-600">{r.slaHours}h</td>
                  <td className="px-4 py-3">
                    <span className={cn('rounded-full px-2 py-0.5 text-xxs font-semibold',
                      r.routeType === 'Express'    ? 'bg-purple-100 text-purple-700' :
                      r.routeType === 'Cold Chain' ? 'bg-sky-100 text-sky-700'       :
                      r.routeType === 'FTL'        ? 'bg-blue-100 text-blue-700'     :
                      r.routeType === 'LTL'        ? 'bg-amber-100 text-amber-700'   : 'bg-slate-100 text-slate-600',
                    )}>
                      {r.routeType}
                    </span>
                  </td>
                  <td className="px-4 py-3"><StatusBadge active={r.active} /></td>
                  <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                    <div className="flex items-center gap-1">
                      <button onClick={() => toggleActive(r.id)} className="rounded p-1 text-slate-400 hover:text-slate-700 transition-colors" title={r.active ? 'Deactivate' : 'Activate'}>
                        {r.active ? <ToggleRight size={16} className="text-green-500" /> : <ToggleLeft size={16} />}
                      </button>
                      <button onClick={() => openEdit(r)} className="rounded p-1 text-slate-400 hover:text-blue-600 transition-colors">
                        <Edit3 size={13} />
                      </button>
                      <button onClick={() => setDeletingId(r.id)} className="rounded p-1 text-slate-400 hover:text-red-600 transition-colors">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {paged.length === 0 && (
                <tr><td colSpan={9} className="py-12 text-center text-sm text-slate-400">No routes match your filters.</td></tr>
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
            <h3 className="text-xs font-bold text-slate-900">Route Detail</h3>
            <button onClick={() => setSelected(null)} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"><X size={14} /></button>
          </div>
          <div className="flex-1 overflow-auto p-5 space-y-4">
            <DetailRow label="Route Code"   value={selected.routeCode} mono />
            <DetailRow label="Origin"       value={selected.origin} />
            <DetailRow label="Destination"  value={selected.destination} />
            <DetailRow label="Distance"     value={`${selected.distanceKm.toLocaleString()} km`} />
            <DetailRow label="Transit Time" value={`${selected.transitHours} hrs`} />
            <DetailRow label="SLA"          value={`${selected.slaHours} hrs`} />
            <DetailRow label="Route Type"   value={selected.routeType} />
            <DetailRow label="Status"       value={<StatusBadge active={selected.active} />} />
            <AuditStamp createdAt={selected.createdAt} updatedAt={selected.updatedAt} />
          </div>
          <div className="border-t border-slate-100 px-5 py-3 flex gap-2">
            <button onClick={() => openEdit(selected)} className="flex-1 rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-700 transition-colors">
              Edit
            </button>
            <button onClick={() => setDeletingId(selected.id)} className="rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors">
              Delete
            </button>
          </div>
        </div>
      )}

      {/* Add / Edit modal */}
      {modalMode && (
        <Modal title={modalMode === 'add' ? 'Add Route' : 'Edit Route'} onClose={() => setModalMode(null)}>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Route Code" error={errors.routeCode} required>
              <input value={form.routeCode} onChange={e => f('routeCode', e.target.value)} placeholder="DEL-MUM-FTL" className={inputCls} />
            </FormField>
            <FormField label="Route Type" required>
              <select value={form.routeType} onChange={e => f('routeType', e.target.value as RouteType)} className={selectCls}>
                {ROUTE_TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
            </FormField>
            <FormField label="Origin" error={errors.origin} required>
              <input value={form.origin} onChange={e => f('origin', e.target.value)} placeholder="Delhi" className={inputCls} />
            </FormField>
            <FormField label="Destination" error={errors.destination} required>
              <input value={form.destination} onChange={e => f('destination', e.target.value)} placeholder="Mumbai" className={inputCls} />
            </FormField>
            <FormField label="Distance (km)" error={errors.distanceKm} required>
              <input type="number" min={1} value={form.distanceKm || ''} onChange={e => f('distanceKm', +e.target.value)} className={inputCls} />
            </FormField>
            <FormField label="Transit Hours" error={errors.transitHours} required>
              <input type="number" min={1} value={form.transitHours || ''} onChange={e => f('transitHours', +e.target.value)} className={inputCls} />
            </FormField>
            <FormField label="SLA Hours" error={errors.slaHours} required>
              <input type="number" min={1} value={form.slaHours || ''} onChange={e => f('slaHours', +e.target.value)} className={inputCls} />
            </FormField>
            <FormField label="Status">
              <label className="flex cursor-pointer items-center gap-2 pt-2">
                <input type="checkbox" checked={form.active} onChange={e => f('active', e.target.checked)} className="h-4 w-4 accent-blue-600" />
                <span className="text-xs text-slate-700">Active</span>
              </label>
            </FormField>
          </div>
          <div className="mt-6 flex justify-end gap-3">
            <button onClick={() => setModalMode(null)} className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors">Cancel</button>
            <button onClick={handleSave} className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700 transition-colors">
              {modalMode === 'add' ? 'Add Route' : 'Save Changes'}
            </button>
          </div>
        </Modal>
      )}

      {/* Delete confirm */}
      {deletingId && (
        <ConfirmDelete
          label={rows.find(r => r.id === deletingId)?.routeCode ?? deletingId}
          onConfirm={() => handleDelete(deletingId)}
          onCancel={() => setDeletingId(null)}
        />
      )}
    </div>
  )
}
