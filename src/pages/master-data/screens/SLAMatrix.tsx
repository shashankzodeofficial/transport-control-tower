import React, { useState, useMemo } from 'react'
import { Plus, Search, Edit3, Trash2, X, ToggleLeft, ToggleRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { SLARule, ServiceType, INITIAL_SLA, nextId } from '../mock/data'
import {
  Modal, ConfirmDelete, FormField, inputCls, selectCls,
  AuditStamp, StatusBadge, Pagination, DetailRow, SortHeader,
} from '../components/MasterLayout'

const SERVICE_TYPES: ServiceType[] = ['FTL Standard', 'FTL Express', 'LTL', 'LCV', 'Cold Chain']
const PAGE_SIZE = 8

const SVC_TYPE_COLOR: Record<ServiceType, string> = {
  'FTL Standard': 'bg-blue-100 text-blue-700',
  'FTL Express':  'bg-purple-100 text-purple-700',
  'LTL':          'bg-amber-100 text-amber-700',
  'LCV':          'bg-slate-100 text-slate-600',
  'Cold Chain':   'bg-sky-100 text-sky-700',
}

function blank(): Omit<SLARule, 'id' | 'createdAt' | 'updatedAt'> {
  return { origin: '', destination: '', serviceType: 'FTL Standard', slaHours: 24, escalationThresholdHours: 27, alertThresholdHours: 22, active: true }
}

type SortKey = keyof SLARule

export function SLAMatrixScreen() {
  const [rows,    setRows]    = useState<SLARule[]>(INITIAL_SLA)
  const [search,  setSearch]  = useState('')
  const [svcFilter,    setSvcFilter]    = useState<ServiceType | 'All'>('All')
  const [activeFilter, setActiveFilter] = useState<'All' | 'Active' | 'Inactive'>('All')
  const [page,    setPage]    = useState(1)
  const [sortKey, setSortKey] = useState<SortKey>('origin')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
  const [selected,   setSelected]   = useState<SLARule | null>(null)
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
        (!q || r.origin.toLowerCase().includes(q) || r.destination.toLowerCase().includes(q) || r.serviceType.toLowerCase().includes(q)) &&
        (svcFilter    === 'All' || r.serviceType === svcFilter) &&
        (activeFilter === 'All' || (activeFilter === 'Active' ? r.active : !r.active))
      )
      .sort((a, b) => {
        const av = a[sortKey] as string | number | boolean
        const bv = b[sortKey] as string | number | boolean
        const cmp = av < bv ? -1 : av > bv ? 1 : 0
        return sortDir === 'asc' ? cmp : -cmp
      })
  }, [rows, search, svcFilter, activeFilter, sortKey, sortDir])

  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  function openAdd() { setForm(blank()); setErrors({}); setModalMode('add') }
  function openEdit(r: SLARule) {
    setForm({ origin: r.origin, destination: r.destination, serviceType: r.serviceType, slaHours: r.slaHours, escalationThresholdHours: r.escalationThresholdHours, alertThresholdHours: r.alertThresholdHours, active: r.active })
    setErrors({}); setModalMode('edit'); setSelected(r)
  }

  function validate() {
    const e: typeof errors = {}
    if (!form.origin.trim())      e.origin      = 'Origin is required'
    if (!form.destination.trim()) e.destination = 'Destination is required'
    if (form.slaHours <= 0)       e.slaHours    = 'SLA hours must be > 0'
    if (form.alertThresholdHours >= form.slaHours) e.alertThresholdHours = 'Alert threshold must be < SLA hours'
    if (form.escalationThresholdHours <= form.slaHours) e.escalationThresholdHours = 'Escalation threshold must be > SLA hours'
    setErrors(e); return Object.keys(e).length === 0
  }

  function handleSave() {
    if (!validate()) return
    const now = new Date().toISOString()
    if (modalMode === 'add') {
      setRows(prev => [{ ...form, id: nextId('SLA', rows), createdAt: now, updatedAt: now }, ...prev])
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

  function slaRisk(r: SLARule): 'ok' | 'warn' | 'breach' {
    const slack = r.slaHours - r.alertThresholdHours
    if (slack < 2) return 'breach'
    if (slack < 4) return 'warn'
    return 'ok'
  }

  return (
    <div className="flex h-full gap-4">
      <div className="flex flex-1 flex-col rounded-xl border border-slate-200 bg-white overflow-hidden">
        {/* Toolbar */}
        <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-3 flex-wrap">
          <div className="relative flex-1 min-w-[200px] max-w-xs">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={search} onChange={e => { setSearch(e.target.value); setPage(1) }} placeholder="Search origin, destination, service…" className="w-full rounded-lg border border-slate-200 pl-8 pr-3 py-2 text-xs text-slate-700 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100" />
          </div>
          <div className="flex items-center gap-1">
            {(['All', ...SERVICE_TYPES] as const).map(t => (
              <button key={t} onClick={() => { setSvcFilter(t as ServiceType | 'All'); setPage(1) }}
                className={cn('rounded-full border px-2.5 py-1 text-xxs font-medium transition-colors', svcFilter === t ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-200 text-slate-500 hover:border-blue-300')}>
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
            <Plus size={13} /> Add Rule
          </button>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <SortHeader label="Origin"          sortKey="origin"                   currentKey={sortKey} direction={sortDir} onSort={handleSort} />
                <SortHeader label="Destination"     sortKey="destination"              currentKey={sortKey} direction={sortDir} onSort={handleSort} />
                <th className="px-4 py-2.5 text-left text-xxs font-semibold uppercase tracking-wide text-slate-500">Service Type</th>
                <SortHeader label="SLA (hrs)"       sortKey="slaHours"                 currentKey={sortKey} direction={sortDir} onSort={handleSort} />
                <SortHeader label="Alert (hrs)"     sortKey="alertThresholdHours"      currentKey={sortKey} direction={sortDir} onSort={handleSort} />
                <SortHeader label="Escalation (hrs)"sortKey="escalationThresholdHours" currentKey={sortKey} direction={sortDir} onSort={handleSort} />
                <th className="px-4 py-2.5 text-left text-xxs font-semibold uppercase tracking-wide text-slate-500">Buffer</th>
                <th className="px-4 py-2.5 text-left text-xxs font-semibold uppercase tracking-wide text-slate-500">Status</th>
                <th className="px-4 py-2.5 text-left text-xxs font-semibold uppercase tracking-wide text-slate-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {paged.map(r => {
                const risk   = slaRisk(r)
                const buffer = r.slaHours - r.alertThresholdHours
                return (
                  <tr key={r.id} onClick={() => setSelected(r)} className={cn('cursor-pointer transition-colors hover:bg-slate-50', selected?.id === r.id && 'bg-blue-50')}>
                    <td className="px-4 py-3 font-medium text-slate-800">{r.origin}</td>
                    <td className="px-4 py-3 text-slate-700">{r.destination}</td>
                    <td className="px-4 py-3">
                      <span className={cn('rounded-full px-2 py-0.5 text-xxs font-semibold', SVC_TYPE_COLOR[r.serviceType])}>{r.serviceType}</span>
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-800">{r.slaHours}h</td>
                    <td className="px-4 py-3 text-amber-600 font-medium">{r.alertThresholdHours}h</td>
                    <td className="px-4 py-3 text-red-600 font-medium">{r.escalationThresholdHours}h</td>
                    <td className="px-4 py-3">
                      <span className={cn('font-semibold', risk === 'ok' ? 'text-green-600' : risk === 'warn' ? 'text-amber-600' : 'text-red-600')}>
                        {buffer}h
                      </span>
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
                )
              })}
              {paged.length === 0 && (
                <tr><td colSpan={9} className="py-12 text-center text-sm text-slate-400">No SLA rules match your filters.</td></tr>
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
            <h3 className="text-xs font-bold text-slate-900">SLA Rule Detail</h3>
            <button onClick={() => setSelected(null)} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"><X size={14} /></button>
          </div>
          <div className="flex-1 overflow-auto p-5 space-y-4">
            <DetailRow label="Route"                value={`${selected.origin} → ${selected.destination}`} />
            <DetailRow label="Service Type"         value={<span className={cn('rounded-full px-2 py-0.5 text-xxs font-semibold', SVC_TYPE_COLOR[selected.serviceType])}>{selected.serviceType}</span>} />
            <DetailRow label="SLA Hours"            value={`${selected.slaHours}h`} />
            <DetailRow label="Alert Threshold"      value={`${selected.alertThresholdHours}h (${selected.slaHours - selected.alertThresholdHours}h before SLA)`} />
            <DetailRow label="Escalation Threshold" value={`${selected.escalationThresholdHours}h (+${selected.escalationThresholdHours - selected.slaHours}h past SLA)`} />
            <DetailRow label="Status"               value={<StatusBadge active={selected.active} />} />
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
        <Modal title={modalMode === 'add' ? 'Add SLA Rule' : 'Edit SLA Rule'} onClose={() => setModalMode(null)}>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Origin" error={errors.origin} required>
              <input value={form.origin} onChange={e => f('origin', e.target.value)} placeholder="Delhi" className={inputCls} />
            </FormField>
            <FormField label="Destination" error={errors.destination} required>
              <input value={form.destination} onChange={e => f('destination', e.target.value)} placeholder="Mumbai" className={inputCls} />
            </FormField>
            <div className="col-span-2">
              <FormField label="Service Type" required>
                <select value={form.serviceType} onChange={e => f('serviceType', e.target.value)} className={selectCls}>
                  {SERVICE_TYPES.map(t => <option key={t}>{t}</option>)}
                </select>
              </FormField>
            </div>
            <FormField label="SLA Hours" error={errors.slaHours} required>
              <input type="number" min={1} value={form.slaHours || ''} onChange={e => f('slaHours', +e.target.value)} className={inputCls} />
            </FormField>
            <FormField label="Alert Threshold (hrs)" error={errors.alertThresholdHours} required>
              <input type="number" min={1} value={form.alertThresholdHours || ''} onChange={e => f('alertThresholdHours', +e.target.value)} className={inputCls} />
              <p className="mt-0.5 text-xxs text-slate-400">Must be less than SLA hours</p>
            </FormField>
            <FormField label="Escalation Threshold (hrs)" error={errors.escalationThresholdHours} required>
              <input type="number" min={1} value={form.escalationThresholdHours || ''} onChange={e => f('escalationThresholdHours', +e.target.value)} className={inputCls} />
              <p className="mt-0.5 text-xxs text-slate-400">Must be greater than SLA hours</p>
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
              {modalMode === 'add' ? 'Add Rule' : 'Save Changes'}
            </button>
          </div>
        </Modal>
      )}

      {deletingId && (
        <ConfirmDelete
          label={`${rows.find(r => r.id === deletingId)?.origin} → ${rows.find(r => r.id === deletingId)?.destination}`}
          onConfirm={() => handleDelete(deletingId)}
          onCancel={() => setDeletingId(null)}
        />
      )}
    </div>
  )
}
