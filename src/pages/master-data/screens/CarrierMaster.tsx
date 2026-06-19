import React, { useState, useMemo } from 'react'
import { Plus, Search, Edit3, Trash2, X, ToggleLeft, ToggleRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { CarrierMaster, CarrierTier, INITIAL_CARRIERS, nextId } from '../mock/data'
import {
  Modal, ConfirmDelete, FormField, inputCls, selectCls,
  AuditStamp, StatusBadge, Pagination, DetailRow, SortHeader,
} from '../components/MasterLayout'

const TIERS: CarrierTier[] = ['Platinum', 'Gold', 'Silver', 'Bronze', 'Probation']
const REGIONS = ['North', 'South', 'East', 'West', 'Pan India']
const PAGE_SIZE = 8

const TIER_COLOR: Record<CarrierTier, string> = {
  Platinum:  'bg-indigo-100 text-indigo-700',
  Gold:      'bg-amber-100 text-amber-700',
  Silver:    'bg-slate-200 text-slate-700',
  Bronze:    'bg-orange-100 text-orange-700',
  Probation: 'bg-red-100 text-red-700',
}

function blank(): Omit<CarrierMaster, 'id' | 'createdAt' | 'updatedAt'> {
  return { carrierCode: '', carrierName: '', region: 'North', contactName: '', contactPhone: '', contactEmail: '', tier: 'Silver', active: true }
}

type SortKey = keyof CarrierMaster

export function CarrierMasterScreen() {
  const [rows,    setRows]    = useState<CarrierMaster[]>(INITIAL_CARRIERS)
  const [search,  setSearch]  = useState('')
  const [tierFilter,   setTierFilter]   = useState<CarrierTier | 'All'>('All')
  const [regionFilter, setRegionFilter] = useState<string>('All')
  const [activeFilter, setActiveFilter] = useState<'All' | 'Active' | 'Inactive'>('All')
  const [page,    setPage]    = useState(1)
  const [sortKey, setSortKey] = useState<SortKey>('carrierCode')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
  const [selected,   setSelected]   = useState<CarrierMaster | null>(null)
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
        (!q || r.carrierCode.toLowerCase().includes(q) || r.carrierName.toLowerCase().includes(q) || r.contactName.toLowerCase().includes(q)) &&
        (tierFilter   === 'All' || r.tier === tierFilter) &&
        (regionFilter === 'All' || r.region === regionFilter) &&
        (activeFilter === 'All' || (activeFilter === 'Active' ? r.active : !r.active))
      )
      .sort((a, b) => {
        const av = a[sortKey] as string | boolean
        const bv = b[sortKey] as string | boolean
        const cmp = av < bv ? -1 : av > bv ? 1 : 0
        return sortDir === 'asc' ? cmp : -cmp
      })
  }, [rows, search, tierFilter, regionFilter, activeFilter, sortKey, sortDir])

  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  function openAdd() { setForm(blank()); setErrors({}); setModalMode('add') }
  function openEdit(r: CarrierMaster) {
    setForm({ carrierCode: r.carrierCode, carrierName: r.carrierName, region: r.region, contactName: r.contactName, contactPhone: r.contactPhone, contactEmail: r.contactEmail, tier: r.tier, active: r.active })
    setErrors({}); setModalMode('edit'); setSelected(r)
  }

  function validate() {
    const e: typeof errors = {}
    if (!form.carrierCode.trim())  e.carrierCode  = 'Carrier code is required'
    if (!form.carrierName.trim())  e.carrierName  = 'Carrier name is required'
    if (!form.contactName.trim())  e.contactName  = 'Contact name is required'
    if (!form.contactEmail.trim()) e.contactEmail = 'Email is required'
    setErrors(e); return Object.keys(e).length === 0
  }

  function handleSave() {
    if (!validate()) return
    const now = new Date().toISOString()
    if (modalMode === 'add') {
      setRows(prev => [{ ...form, id: nextId('C', rows), createdAt: now, updatedAt: now }, ...prev])
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

  function f(k: keyof typeof form, v: string | boolean) {
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
            <input value={search} onChange={e => { setSearch(e.target.value); setPage(1) }} placeholder="Search code, name, contact…" className="w-full rounded-lg border border-slate-200 pl-8 pr-3 py-2 text-xs text-slate-700 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100" />
          </div>
          <div className="flex items-center gap-1">
            {(['All', ...TIERS] as const).map(t => (
              <button key={t} onClick={() => { setTierFilter(t as CarrierTier | 'All'); setPage(1) }}
                className={cn('rounded-full border px-2.5 py-1 text-xxs font-medium transition-colors', tierFilter === t ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-200 text-slate-500 hover:border-blue-300')}>
                {t}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1">
            {(['All', ...REGIONS] as const).map(r => (
              <button key={r} onClick={() => { setRegionFilter(r); setPage(1) }}
                className={cn('rounded-full border px-2.5 py-1 text-xxs font-medium transition-colors', regionFilter === r ? 'bg-slate-700 border-slate-700 text-white' : 'border-slate-200 text-slate-500 hover:border-slate-400')}>
                {r}
              </button>
            ))}
          </div>
          <button onClick={openAdd} className="ml-auto flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-700 transition-colors">
            <Plus size={13} /> Add Carrier
          </button>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <SortHeader label="Code"     sortKey="carrierCode" currentKey={sortKey} direction={sortDir} onSort={handleSort} />
                <SortHeader label="Name"     sortKey="carrierName" currentKey={sortKey} direction={sortDir} onSort={handleSort} />
                <SortHeader label="Region"   sortKey="region"      currentKey={sortKey} direction={sortDir} onSort={handleSort} />
                <th className="px-4 py-2.5 text-left text-xxs font-semibold uppercase tracking-wide text-slate-500">Contact</th>
                <SortHeader label="Tier"     sortKey="tier"        currentKey={sortKey} direction={sortDir} onSort={handleSort} />
                <th className="px-4 py-2.5 text-left text-xxs font-semibold uppercase tracking-wide text-slate-500">Status</th>
                <th className="px-4 py-2.5 text-left text-xxs font-semibold uppercase tracking-wide text-slate-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {paged.map(r => (
                <tr key={r.id} onClick={() => setSelected(r)} className={cn('cursor-pointer transition-colors hover:bg-slate-50', selected?.id === r.id && 'bg-blue-50')}>
                  <td className="px-4 py-3 font-mono font-semibold text-slate-800 text-xxs">{r.carrierCode}</td>
                  <td className="px-4 py-3 font-medium text-slate-800">{r.carrierName}</td>
                  <td className="px-4 py-3 text-slate-600">{r.region}</td>
                  <td className="px-4 py-3">
                    <div className="text-slate-700">{r.contactName}</div>
                    <div className="text-xxs text-slate-400">{r.contactEmail}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn('rounded-full px-2 py-0.5 text-xxs font-semibold', TIER_COLOR[r.tier])}>{r.tier}</span>
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
                <tr><td colSpan={7} className="py-12 text-center text-sm text-slate-400">No carriers match your filters.</td></tr>
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
            <h3 className="text-xs font-bold text-slate-900">Carrier Detail</h3>
            <button onClick={() => setSelected(null)} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"><X size={14} /></button>
          </div>
          <div className="flex-1 overflow-auto p-5 space-y-4">
            <DetailRow label="Carrier Code" value={selected.carrierCode} mono />
            <DetailRow label="Name"         value={selected.carrierName} />
            <DetailRow label="Region"       value={selected.region} />
            <DetailRow label="Tier"         value={<span className={cn('rounded-full px-2 py-0.5 text-xxs font-semibold', TIER_COLOR[selected.tier])}>{selected.tier}</span>} />
            <DetailRow label="Contact"      value={selected.contactName} />
            <DetailRow label="Phone"        value={selected.contactPhone} />
            <DetailRow label="Email"        value={selected.contactEmail} />
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
        <Modal title={modalMode === 'add' ? 'Add Carrier' : 'Edit Carrier'} onClose={() => setModalMode(null)}>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Carrier Code" error={errors.carrierCode} required>
              <input value={form.carrierCode} onChange={e => f('carrierCode', e.target.value)} placeholder="PTC" className={inputCls} />
            </FormField>
            <FormField label="Tier" required>
              <select value={form.tier} onChange={e => f('tier', e.target.value)} className={selectCls}>
                {TIERS.map(t => <option key={t}>{t}</option>)}
              </select>
            </FormField>
            <FormField label="Carrier Name" error={errors.carrierName} required>
              <input value={form.carrierName} onChange={e => f('carrierName', e.target.value)} placeholder="Prime Transport Co" className={inputCls} />
            </FormField>
            <FormField label="Region" required>
              <select value={form.region} onChange={e => f('region', e.target.value)} className={selectCls}>
                {REGIONS.map(r => <option key={r}>{r}</option>)}
              </select>
            </FormField>
            <FormField label="Contact Name" error={errors.contactName} required>
              <input value={form.contactName} onChange={e => f('contactName', e.target.value)} placeholder="Rakesh Mehta" className={inputCls} />
            </FormField>
            <FormField label="Contact Phone">
              <input value={form.contactPhone} onChange={e => f('contactPhone', e.target.value)} placeholder="9876501234" className={inputCls} />
            </FormField>
            <div className="col-span-2">
              <FormField label="Contact Email" error={errors.contactEmail} required>
                <input type="email" value={form.contactEmail} onChange={e => f('contactEmail', e.target.value)} placeholder="contact@carrier.in" className={inputCls} />
              </FormField>
            </div>
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
              {modalMode === 'add' ? 'Add Carrier' : 'Save Changes'}
            </button>
          </div>
        </Modal>
      )}

      {deletingId && (
        <ConfirmDelete
          label={rows.find(r => r.id === deletingId)?.carrierName ?? deletingId}
          onConfirm={() => handleDelete(deletingId)}
          onCancel={() => setDeletingId(null)}
        />
      )}
    </div>
  )
}
