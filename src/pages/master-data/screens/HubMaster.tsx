import React, { useState, useMemo } from 'react'
import { Plus, Search, Edit3, Trash2, X, ToggleLeft, ToggleRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { HubMaster, HubType, INITIAL_HUBS, nextId } from '../mock/data'
import {
  Modal, ConfirmDelete, FormField, inputCls, selectCls,
  AuditStamp, StatusBadge, Pagination, DetailRow, SortHeader,
} from '../components/MasterLayout'

const HUB_TYPES: HubType[] = ['Primary Hub', 'Secondary Hub', 'Depot', 'Cross-Dock']
const STATES = ['Delhi', 'Maharashtra', 'Karnataka', 'Telangana', 'Tamil Nadu', 'West Bengal', 'Gujarat', 'Rajasthan', 'Uttar Pradesh']
const PAGE_SIZE = 8

const HUB_TYPE_COLOR: Record<HubType, string> = {
  'Primary Hub':   'bg-blue-100 text-blue-700',
  'Secondary Hub': 'bg-blue-100 text-blue-700',
  'Depot':         'bg-slate-100 text-slate-600',
  'Cross-Dock':    'bg-purple-100 text-purple-700',
}

function blank(): Omit<HubMaster, 'id' | 'createdAt' | 'updatedAt'> {
  return { hubCode: '', hubName: '', city: '', state: 'Maharashtra', capacityVehicles: 0, operatingFrom: '06:00', operatingTo: '22:00', hubType: 'Depot', active: true }
}

type SortKey = keyof HubMaster

export function HubMasterScreen() {
  const [rows,    setRows]    = useState<HubMaster[]>(INITIAL_HUBS)
  const [search,  setSearch]  = useState('')
  const [typeFilter,   setTypeFilter]   = useState<HubType | 'All'>('All')
  const [activeFilter, setActiveFilter] = useState<'All' | 'Active' | 'Inactive'>('All')
  const [page,    setPage]    = useState(1)
  const [sortKey, setSortKey] = useState<SortKey>('hubCode')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
  const [selected,   setSelected]   = useState<HubMaster | null>(null)
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
        (!q || r.hubCode.toLowerCase().includes(q) || r.hubName.toLowerCase().includes(q) || r.city.toLowerCase().includes(q) || r.state.toLowerCase().includes(q)) &&
        (typeFilter   === 'All' || r.hubType === typeFilter) &&
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

  function openAdd() { setForm(blank()); setErrors({}); setModalMode('add') }
  function openEdit(r: HubMaster) {
    setForm({ hubCode: r.hubCode, hubName: r.hubName, city: r.city, state: r.state, capacityVehicles: r.capacityVehicles, operatingFrom: r.operatingFrom, operatingTo: r.operatingTo, hubType: r.hubType, active: r.active })
    setErrors({}); setModalMode('edit'); setSelected(r)
  }

  function validate() {
    const e: typeof errors = {}
    if (!form.hubCode.trim()) e.hubCode = 'Hub code is required'
    if (!form.hubName.trim()) e.hubName = 'Hub name is required'
    if (!form.city.trim())    e.city    = 'City is required'
    if (form.capacityVehicles <= 0) e.capacityVehicles = 'Capacity must be > 0'
    setErrors(e); return Object.keys(e).length === 0
  }

  function handleSave() {
    if (!validate()) return
    const now = new Date().toISOString()
    if (modalMode === 'add') {
      setRows(prev => [{ ...form, id: nextId('H', rows), createdAt: now, updatedAt: now }, ...prev])
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
      <div className="flex flex-1 flex-col rounded-xl border border-slate-200 bg-white overflow-hidden">
        {/* Toolbar */}
        <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-3 flex-wrap">
          <div className="relative flex-1 min-w-[200px] max-w-xs">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={search} onChange={e => { setSearch(e.target.value); setPage(1) }} placeholder="Search code, name, city, state…" className="w-full rounded-lg border border-slate-200 pl-8 pr-3 py-2 text-xs text-slate-700 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100" />
          </div>
          <div className="flex items-center gap-1">
            {(['All', ...HUB_TYPES] as const).map(t => (
              <button key={t} onClick={() => { setTypeFilter(t as HubType | 'All'); setPage(1) }}
                className={cn('rounded-full border px-2.5 py-1 text-xxs font-medium transition-colors', typeFilter === t ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-200 text-slate-500 hover:border-blue-300')}>
                {t}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1">
            {(['All', 'Active', 'Inactive'] as const).map(s => (
              <button key={s} onClick={() => { setActiveFilter(s); setPage(1) }}
                className={cn('rounded-full border px-2.5 py-1 text-xxs font-medium transition-colors', activeFilter === s ? 'bg-slate-700 border-slate-700 text-white' : 'border-slate-200 text-slate-500 hover:border-slate-400')}>
                {s}
              </button>
            ))}
          </div>
          <button onClick={openAdd} className="ml-auto flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-700 transition-colors">
            <Plus size={13} /> Add Hub
          </button>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <SortHeader label="Hub Code"   sortKey="hubCode"          currentKey={sortKey} direction={sortDir} onSort={handleSort} />
                <SortHeader label="Hub Name"   sortKey="hubName"          currentKey={sortKey} direction={sortDir} onSort={handleSort} />
                <SortHeader label="City"       sortKey="city"             currentKey={sortKey} direction={sortDir} onSort={handleSort} />
                <SortHeader label="State"      sortKey="state"            currentKey={sortKey} direction={sortDir} onSort={handleSort} />
                <SortHeader label="Capacity"   sortKey="capacityVehicles" currentKey={sortKey} direction={sortDir} onSort={handleSort} />
                <th className="px-4 py-2.5 text-left text-xxs font-semibold uppercase tracking-wide text-slate-500">Hours</th>
                <th className="px-4 py-2.5 text-left text-xxs font-semibold uppercase tracking-wide text-slate-500">Type</th>
                <th className="px-4 py-2.5 text-left text-xxs font-semibold uppercase tracking-wide text-slate-500">Status</th>
                <th className="px-4 py-2.5 text-left text-xxs font-semibold uppercase tracking-wide text-slate-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {paged.map(r => (
                <tr key={r.id} onClick={() => setSelected(r)} className={cn('cursor-pointer transition-colors hover:bg-slate-50', selected?.id === r.id && 'bg-blue-50')}>
                  <td className="px-4 py-3 font-mono font-semibold text-slate-800 text-xxs">{r.hubCode}</td>
                  <td className="px-4 py-3 font-medium text-slate-800">{r.hubName}</td>
                  <td className="px-4 py-3 text-slate-700">{r.city}</td>
                  <td className="px-4 py-3 text-slate-600">{r.state}</td>
                  <td className="px-4 py-3 text-slate-600">{r.capacityVehicles} vehicles</td>
                  <td className="px-4 py-3 text-slate-500 text-xxs font-mono">{r.operatingFrom}–{r.operatingTo}</td>
                  <td className="px-4 py-3">
                    <span className={cn('rounded-full px-2 py-0.5 text-xxs font-semibold', HUB_TYPE_COLOR[r.hubType])}>{r.hubType}</span>
                  </td>
                  <td className="px-4 py-3"><StatusBadge active={r.active} /></td>
                  <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                    <div className="flex items-center gap-1">
                      <button onClick={() => toggleActive(r.id)} className="rounded p-1 text-slate-400 hover:text-slate-700 transition-colors">
                        {r.active ? <ToggleRight size={16} className="text-green-500" /> : <ToggleLeft size={16} />}
                      </button>
                      <button onClick={() => openEdit(r)} className="rounded p-1 text-slate-400 hover:text-blue-600 transition-colors"><Edit3 size={13} /></button>
                      <button onClick={() => setDeletingId(r.id)} className="rounded p-1 text-slate-400 hover:text-red-600 transition-colors"><Trash2 size={13} /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {paged.length === 0 && (
                <tr><td colSpan={9} className="py-12 text-center text-sm text-slate-400">No hubs match your filters.</td></tr>
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
            <h3 className="text-xs font-bold text-slate-900">Hub Detail</h3>
            <button onClick={() => setSelected(null)} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"><X size={14} /></button>
          </div>
          <div className="flex-1 overflow-auto p-5 space-y-4">
            <DetailRow label="Hub Code"     value={selected.hubCode} mono />
            <DetailRow label="Hub Name"     value={selected.hubName} />
            <DetailRow label="City"         value={selected.city} />
            <DetailRow label="State"        value={selected.state} />
            <DetailRow label="Hub Type"     value={<span className={cn('rounded-full px-2 py-0.5 text-xxs font-semibold', HUB_TYPE_COLOR[selected.hubType])}>{selected.hubType}</span>} />
            <DetailRow label="Capacity"     value={`${selected.capacityVehicles} vehicles`} />
            <DetailRow label="Operating Hours" value={`${selected.operatingFrom} – ${selected.operatingTo}`} mono />
            <DetailRow label="Status"       value={<StatusBadge active={selected.active} />} />
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
        <Modal title={modalMode === 'add' ? 'Add Hub' : 'Edit Hub'} onClose={() => setModalMode(null)}>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Hub Code" error={errors.hubCode} required>
              <input value={form.hubCode} onChange={e => f('hubCode', e.target.value)} placeholder="MUM-HUB" className={inputCls} />
            </FormField>
            <FormField label="Hub Type" required>
              <select value={form.hubType} onChange={e => f('hubType', e.target.value)} className={selectCls}>
                {HUB_TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
            </FormField>
            <div className="col-span-2">
              <FormField label="Hub Name" error={errors.hubName} required>
                <input value={form.hubName} onChange={e => f('hubName', e.target.value)} placeholder="Mumbai Primary Hub" className={inputCls} />
              </FormField>
            </div>
            <FormField label="City" error={errors.city} required>
              <input value={form.city} onChange={e => f('city', e.target.value)} placeholder="Mumbai" className={inputCls} />
            </FormField>
            <FormField label="State" required>
              <select value={form.state} onChange={e => f('state', e.target.value)} className={selectCls}>
                {STATES.map(s => <option key={s}>{s}</option>)}
              </select>
            </FormField>
            <FormField label="Capacity (Vehicles)" error={errors.capacityVehicles} required>
              <input type="number" min={1} value={form.capacityVehicles || ''} onChange={e => f('capacityVehicles', +e.target.value)} className={inputCls} />
            </FormField>
            <FormField label="Operating From">
              <input type="time" value={form.operatingFrom} onChange={e => f('operatingFrom', e.target.value)} className={inputCls} />
            </FormField>
            <FormField label="Operating To">
              <input type="time" value={form.operatingTo} onChange={e => f('operatingTo', e.target.value)} className={inputCls} />
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
              {modalMode === 'add' ? 'Add Hub' : 'Save Changes'}
            </button>
          </div>
        </Modal>
      )}

      {deletingId && (
        <ConfirmDelete
          label={rows.find(r => r.id === deletingId)?.hubName ?? deletingId}
          onConfirm={() => handleDelete(deletingId)}
          onCancel={() => setDeletingId(null)}
        />
      )}
    </div>
  )
}
