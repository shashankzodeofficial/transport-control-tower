import React, { useState, useMemo } from 'react'
import {
  Package, CheckCircle2, AlertTriangle, Clock,
  ChevronRight, X, Download, Search, FileCheck,
  ArrowUpDown, DollarSign,
} from 'lucide-react'
import { cn, timeAgo } from '@/lib/utils'
import { exportCsv } from '@/lib/exportCsv'
import { useActiveFilters } from '@/hooks/useActiveFilters'
import { TabStrip }     from '@/layout/TabStrip'
import { BarChart }     from '@/components/charts/BarChart'
import { LineChart }    from '@/components/charts/LineChart'
import { SeverityBadge }from '@/components/badges/SeverityBadge'
import {
  RECONCILIATIONS, RECON_KPI, RECON_TREND_7D,
} from './mock/data'
import type { ReconciliationRecord, ReconciliationStatus, HUDiscrepancy } from './mock/data'

// ─── Status config ────────────────────────────────────────────────────────────

const STATUS_CFG: Record<ReconciliationStatus, { label: string; style: string }> = {
  pending:     { label: 'Pending',     style: 'bg-slate-100 text-slate-500'   },
  in_progress: { label: 'In Progress', style: 'bg-blue-100 text-blue-700'     },
  discrepancy: { label: 'Discrepancy', style: 'bg-red-100 text-red-700'       },
  approved:    { label: 'Approved',    style: 'bg-amber-100 text-amber-700'   },
  closed:      { label: 'Closed',      style: 'bg-green-100 text-green-700'   },
}

const TABS = [
  { key: 'all',        label: 'All' },
  { key: 'pending',    label: 'Pending' },
  { key: 'in_progress',label: 'In Progress' },
  { key: 'discrepancy',label: 'Discrepancy' },
  { key: 'approved',   label: 'Approved' },
  { key: 'closed',     label: 'Closed' },
]

function filterTab(recs: ReconciliationRecord[], tab: string) {
  if (tab === 'all') return recs
  return recs.filter(r => r.reconStatus === tab)
}

// ─── Discrepancy list ─────────────────────────────────────────────────────────

function DiscrepancyList({ discrepancies }: { discrepancies: HUDiscrepancy[] }) {
  if (discrepancies.length === 0) {
    return (
      <div className="flex items-center gap-2 py-3 text-sm text-green-600">
        <CheckCircle2 size={16} className="text-green-500" />Clean delivery — no discrepancies
      </div>
    )
  }

  const DISC_STYLE: Record<string, string> = {
    missing:        'bg-red-50 border-red-200 text-red-700',
    damaged:        'bg-amber-50 border-amber-200 text-amber-700',
    extra:          'bg-blue-50 border-blue-200 text-blue-700',
    wrong_item:     'bg-violet-50 border-violet-200 text-violet-700',
    weight_variance:'bg-slate-50 border-slate-200 text-slate-600',
  }

  const STATUS_DISC: Record<string, string> = {
    open:     'bg-red-100 text-red-700',
    accepted: 'bg-green-100 text-green-700',
    disputed: 'bg-orange-100 text-orange-700',
    waived:   'bg-slate-100 text-slate-500',
  }

  return (
    <div className="space-y-2">
      {discrepancies.map(d => (
        <div key={d.huCode} className={cn('rounded-lg border p-3', DISC_STYLE[d.type] ?? 'bg-slate-50 border-slate-200')}>
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-mono text-xs font-bold">{d.huCode}</span>
                <span className={cn('rounded-full px-2 py-0.5 text-xxs font-bold capitalize', DISC_STYLE[d.type]?.split(' ')[0] ?? '')}>
                  {d.type.replace('_', ' ')}
                </span>
              </div>
              <p className="text-xs leading-relaxed">{d.description}</p>
            </div>
            <div className="text-right shrink-0">
              {d.financialImpact > 0 && (
                <p className="text-xs font-bold text-red-700 mb-1">₹{d.financialImpact.toLocaleString()}</p>
              )}
              <span className={cn('rounded-full px-2 py-0.5 text-xxs font-bold capitalize', STATUS_DISC[d.status] ?? '')}>
                {d.status}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── Detail panel ─────────────────────────────────────────────────────────────

function ReconciliationDetail({ rec, onClose }: { rec: ReconciliationRecord; onClose: () => void }) {
  const pctArrived = rec.huLoaded > 0 ? Math.round((rec.huArrived / rec.huLoaded) * 100) : 0
  const impact     = rec.discrepancies.reduce((s, d) => s + d.financialImpact, 0)

  return (
    <div className="flex flex-1 flex-col bg-white overflow-hidden">
      <div className="flex items-start justify-between border-b border-slate-100 px-5 py-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono text-sm font-bold text-slate-800">{rec.id}</span>
            <span className={cn('rounded-full px-2.5 py-0.5 text-xxs font-bold', STATUS_CFG[rec.reconStatus].style)}>
              {STATUS_CFG[rec.reconStatus].label}
            </span>
          </div>
          <p className="text-xs text-slate-500">{rec.routeCode} · {rec.carrier}</p>
        </div>
        <button onClick={onClose} className="rounded-lg p-1.5 hover:bg-slate-100">
          <X size={14} className="text-slate-400" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
        {/* Route info */}
        <Section title="Dispatch Info">
          <Row label="Dispatch ID"  value={<span className="font-mono font-semibold text-blue-700">{rec.dispatchId}</span>} />
          <Row label="Route"        value={rec.routeName} />
          <Row label="Origin"       value={rec.origin} />
          <Row label="Destination"  value={rec.destination} />
          {rec.arrivedAt && <Row label="Arrived"     value={new Date(rec.arrivedAt).toLocaleString('en-IN', {day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'})} />}
          <Row label="Freight Cost" value={<span className="font-semibold">₹{rec.freightCost.toLocaleString()}</span>} />
        </Section>

        {/* HU summary */}
        <Section title="HU Summary">
          <Row label="Loaded"  value={rec.huLoaded} />
          <Row label="Arrived" value={
            <span className={cn('font-semibold', rec.huArrived < rec.huLoaded ? 'text-red-600' : 'text-green-600')}>
              {rec.huArrived}
            </span>
          } />
          <Row label="Missing" value={rec.huMissing > 0 ? <span className="font-bold text-red-600">{rec.huMissing}</span> : '0'} />
          <Row label="Damaged" value={rec.huDamaged > 0 ? <span className="font-bold text-amber-600">{rec.huDamaged}</span> : '0'} />
          <div className="py-2">
            <div className="flex justify-between text-xxs text-slate-400 mb-1">
              <span>Arrival rate</span><span>{pctArrived}%</span>
            </div>
            <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
              <div
                className={cn('h-full rounded-full', pctArrived < 100 ? 'bg-red-500' : 'bg-green-500')}
                style={{ width: `${pctArrived}%` }}
              />
            </div>
          </div>
          <Row label="Weight Loaded"  value={`${rec.weightLoaded.toLocaleString()} kg`} />
          {rec.weightArrived > 0 && (
            <Row label="Weight Arrived" value={
              <span className={cn('font-medium', Math.abs(rec.weightArrived - rec.weightLoaded) > 5 ? 'text-amber-600' : 'text-green-600')}>
                {rec.weightArrived.toLocaleString()} kg
              </span>
            } />
          )}
        </Section>

        {/* Financial impact */}
        {impact > 0 && (
          <Section title="Financial Impact">
            <div className="py-2 text-center">
              <div className="text-2xl font-bold text-red-600">₹{impact.toLocaleString()}</div>
              <div className="text-xxs text-slate-400 mt-0.5">Total discrepancy impact</div>
            </div>
          </Section>
        )}

        {/* Discrepancies */}
        <div>
          <p className="mb-2 text-xxs font-semibold uppercase tracking-wide text-slate-400">
            Discrepancies ({rec.discrepancies.length})
          </p>
          <DiscrepancyList discrepancies={rec.discrepancies} />
        </div>

        {/* Notes */}
        {rec.notes && (
          <Section title="Notes">
            <p className="py-1 text-xs text-slate-600 leading-relaxed">{rec.notes}</p>
          </Section>
        )}

        {/* Sign-off chain */}
        {(rec.reconBy || rec.approvedBy) && (
          <Section title="Sign-off Chain">
            {rec.reconBy    && <Row label="Reconciled By"  value={rec.reconBy} />}
            {rec.approvedBy && <Row label="Approved By"    value={rec.approvedBy} />}
            {rec.approvedAt && <Row label="Approved At"    value={new Date(rec.approvedAt).toLocaleString('en-IN',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'})} />}
            {rec.signedOffAt&& <Row label="Signed Off"     value={new Date(rec.signedOffAt).toLocaleString('en-IN',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'})} />}
          </Section>
        )}
      </div>

      {/* Actions */}
      {['in_progress','discrepancy'].includes(rec.reconStatus) && (
        <div className="border-t border-slate-100 px-5 py-3 flex gap-2">
          {rec.reconStatus === 'discrepancy' && (
            <button className="flex-1 rounded-lg bg-amber-500 py-2 text-xs font-semibold text-white hover:bg-amber-600 transition-colors">
              Raise Dispute
            </button>
          )}
          <button className="flex-1 rounded-lg bg-green-600 py-2 text-xs font-semibold text-white hover:bg-green-700 transition-colors">
            <span className="flex items-center justify-center gap-1.5"><FileCheck size={13} />Approve & Sign Off</span>
          </button>
        </div>
      )}
    </div>
  )
}

// ─── Table row ────────────────────────────────────────────────────────────────

function ReconRow({ rec, isSelected, onClick }: {
  rec: ReconciliationRecord
  isSelected: boolean
  onClick: () => void
}) {
  const impact = rec.discrepancies.reduce((s, d) => s + d.financialImpact, 0)

  return (
    <tr
      onClick={onClick}
      className={cn(
        'cursor-pointer border-b border-slate-100 transition-colors',
        isSelected ? 'bg-blue-50' :
        rec.reconStatus === 'discrepancy' ? 'bg-red-50/40 hover:bg-red-50' :
        'hover:bg-slate-50',
      )}
    >
      <td className="px-4 py-3 font-mono text-xs font-semibold text-slate-700">{rec.id}</td>
      <td className="px-4 py-3">
        <p className="text-xs font-semibold text-slate-800">{rec.dispatchId}</p>
        <p className="text-xxs text-slate-400">{rec.routeCode}</p>
      </td>
      <td className="px-4 py-3 text-xs text-slate-500 max-w-[120px] truncate">{rec.carrier}</td>
      <td className="px-4 py-3">
        <span className={cn('rounded-full px-2.5 py-0.5 text-xxs font-bold', STATUS_CFG[rec.reconStatus].style)}>
          {STATUS_CFG[rec.reconStatus].label}
        </span>
      </td>
      <td className="px-4 py-3 text-center">
        <span className="text-xs tabular-nums">{rec.huArrived}/{rec.huLoaded}</span>
        {rec.huMissing > 0 && <span className="ml-2 text-xxs font-bold text-red-600">−{rec.huMissing}</span>}
        {rec.huDamaged > 0 && <span className="ml-1 text-xxs font-bold text-amber-600">~{rec.huDamaged}</span>}
      </td>
      <td className="px-4 py-3 text-xs text-slate-500 tabular-nums">
        {rec.weightArrived > 0
          ? `${rec.weightArrived.toLocaleString()} / ${rec.weightLoaded.toLocaleString()} kg`
          : `${rec.weightLoaded.toLocaleString()} kg`}
      </td>
      <td className="px-4 py-3 text-xs font-medium">
        {impact > 0
          ? <span className="text-red-600">₹{impact.toLocaleString()}</span>
          : <span className="text-slate-300">—</span>}
      </td>
      <td className="px-4 py-3 text-xs text-slate-400">
        {rec.reconBy ?? <span className="italic text-slate-300">—</span>}
      </td>
      <td className="px-4 py-3 text-xs text-slate-400">
        {rec.arrivedAt ? timeAgo(rec.arrivedAt) : '—'}
      </td>
      <td className="px-4 py-3">
        <ChevronRight size={14} className={cn('transition-transform', isSelected ? 'text-blue-500 rotate-90' : 'text-slate-300')} />
      </td>
    </tr>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export function ReconciliationCenter() {
  const [tab, setTab]           = useState('all')
  const [search, setSearch]     = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const { region, dateRange, matchesCity, matchesDate } = useActiveFilters('ReconciliationCenter')

  // Apply global region + date filters first
  const globalFiltered = useMemo(() =>
    RECONCILIATIONS.filter(rec =>
      matchesCity(rec.origin) && matchesDate(rec.arrivedAt)
    ),
    [region, dateRange],
  )

  const filtered = useMemo(() => {
    let list = filterTab(globalFiltered, tab)
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(r =>
        r.id.toLowerCase().includes(q) ||
        r.dispatchId.toLowerCase().includes(q) ||
        r.carrier.toLowerCase().includes(q) ||
        r.routeCode.toLowerCase().includes(q),
      )
    }
    return list
  }, [globalFiltered, tab, search])

  const selected = selectedId ? RECONCILIATIONS.find(r => r.id === selectedId) ?? null : null

  // Tab counts reflect global-filtered list (respects region + date)
  const tabsWithBadge = TABS.map(t => ({
    ...t,
    badge: t.key === 'all' ? globalFiltered.length : globalFiltered.filter(r => r.reconStatus === t.key).length,
  }))

  return (
    <div className="flex flex-col h-full bg-slate-50">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
        <div>
          <h1 className="text-lg font-bold text-slate-900">Reconciliation Center</h1>
          <p className="text-xs text-slate-400">Verify HU counts, resolve discrepancies, sign-off deliveries</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => exportCsv(filtered.map(r => ({
              id: r.id, dispatch_id: r.dispatchId, route: r.routeCode,
              carrier: r.carrier, origin: r.origin, destination: r.destination,
              status: r.reconStatus, hu_loaded: r.huLoaded, hu_arrived: r.huArrived,
              hu_damaged: r.huDamaged, arrived_at: r.arrivedAt ?? '',
            })), 'reconciliation')}
            className="flex h-8 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-slate-600 hover:bg-slate-50"
          >
            <Download size={13} />Export
          </button>
        </div>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-5 gap-4 border-b border-slate-200 bg-white px-6 py-4">
        {[
          { label: 'Pending Arrival',  value: RECON_KPI.pending,         style: 'text-slate-700',   icon: Clock },
          { label: 'Scanning',         value: RECON_KPI.inProgress,      style: 'text-blue-600',    icon: Package },
          { label: 'With Discrepancy', value: RECON_KPI.discrepancy,     style: 'text-red-600',     icon: AlertTriangle },
          { label: 'HU Issues',        value: RECON_KPI.totalHUMissing + RECON_KPI.totalHUDamaged, style: 'text-amber-600', icon: AlertTriangle },
          { label: 'Financial Impact', value: `₹${(RECON_KPI.financialImpact/1000).toFixed(0)}K`, style: 'text-red-600', icon: DollarSign },
        ].map(k => (
          <div key={k.label} className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
            <div className="flex items-center justify-between mb-1">
              <p className="text-xxs font-semibold uppercase tracking-wide text-slate-400">{k.label}</p>
              <k.icon size={13} className="text-slate-400" />
            </div>
            <p className={cn('text-2xl font-bold tabular-nums', k.style)}>{k.value}</p>
          </div>
        ))}
      </div>

      {/* Trend chart */}
      <div className="border-b border-slate-200 bg-white px-6 py-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-semibold text-slate-700">7-Day Reconciliation Activity</p>
        </div>
        <BarChart
          data={RECON_TREND_7D}
          xKey="day"
          series={[
            { dataKey: 'arrived',       label: 'Dispatches Arrived',  color: '#60a5fa' },
            { dataKey: 'reconciled',    label: 'Reconciled',          color: '#4ade80' },
            { dataKey: 'discrepancies', label: 'With Discrepancy',    color: '#f87171' },
          ]}
          height={100}
          showGrid
          showLegend
        />
      </div>

      {/* Tabs + toolbar */}
      <TabStrip tabs={tabsWithBadge} activeTab={tab} onChange={setTab} variant="page" />

      <div className="flex items-center gap-3 border-b border-slate-200 bg-white px-6 py-2.5">
        <Search size={14} className="text-slate-400 shrink-0" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by Recon ID, dispatch, carrier…"
          className="flex-1 bg-transparent text-sm text-slate-700 placeholder:text-slate-400 outline-none"
        />
        <span className="text-xs text-slate-400">{filtered.length} record{filtered.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Body */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        <div className="flex-1 overflow-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-slate-50 border-b border-slate-200 z-10">
              <tr>
                {['Recon ID','Dispatch','Carrier','Status','HUs (Arr/Load)','Weight','₹ Impact','Recon By','Arrived',''].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xxs font-semibold uppercase tracking-wide text-slate-400">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-20 text-center text-sm text-slate-400">
                    <Package size={24} className="mx-auto mb-2 text-slate-300" />
                    No records match
                  </td>
                </tr>
              ) : (
                filtered.map(rec => (
                  <ReconRow
                    key={rec.id}
                    rec={rec}
                    isSelected={selectedId === rec.id}
                    onClick={() => setSelectedId(prev => prev === rec.id ? null : rec.id)}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>

        {selected && (
          <div className="w-96 shrink-0 flex flex-col border-l border-slate-200">
            <ReconciliationDetail rec={selected} onClose={() => setSelectedId(null)} />
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-2 text-xxs font-semibold uppercase tracking-wide text-slate-400">{title}</p>
      <div className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 divide-y divide-slate-100">
        {children}
      </div>
    </div>
  )
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-2 py-1.5">
      <span className="text-xs text-slate-500 shrink-0">{label}</span>
      <span className="text-xs text-slate-800 text-right">{value}</span>
    </div>
  )
}
