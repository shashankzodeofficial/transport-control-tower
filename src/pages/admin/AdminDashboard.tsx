import React, { useState, useMemo } from 'react'
import {
  Users, Shield, Settings, Activity, Search,
  CheckCircle2, AlertTriangle, Clock, Plus, X,
  Eye, EyeOff, ChevronRight, LogIn, LogOut,
  Edit3, Trash2, Download, ToggleLeft, ToggleRight,
} from 'lucide-react'
import { cn, timeAgo } from '@/lib/utils'
import { exportCsv } from '@/lib/exportCsv'
import { TabStrip } from '@/layout/TabStrip'
import {
  ADMIN_USERS, ROLES, CONFIG_ENTRIES, AUDIT_LOG, ADMIN_KPI,
} from './mock/data'
import type { AdminUser, RoleDef, ConfigEntry, AuditEntry, UserRole, UserStatus } from './mock/data'

// ─── Role config ──────────────────────────────────────────────────────────────

const ROLE_STYLE: Record<UserRole, string> = {
  super_admin:        'bg-violet-100 text-violet-700',
  admin:              'bg-blue-100 text-blue-700',
  operations_manager: 'bg-teal-100 text-teal-700',
  dispatcher:         'bg-sky-100 text-sky-700',
  warehouse_manager:  'bg-amber-100 text-amber-700',
  finance:            'bg-green-100 text-green-700',
  viewer:             'bg-slate-100 text-slate-500',
}

const ROLE_LABEL: Record<UserRole, string> = {
  super_admin:        'Super Admin',
  admin:              'Admin',
  operations_manager: 'Ops Manager',
  dispatcher:         'Dispatcher',
  warehouse_manager:  'WH Manager',
  finance:            'Finance',
  viewer:             'Viewer',
}

const STATUS_STYLE: Record<UserStatus, { dot: string; badge: string }> = {
  active:    { dot: 'bg-green-500', badge: 'bg-green-50 text-green-700' },
  inactive:  { dot: 'bg-slate-400', badge: 'bg-slate-100 text-slate-500' },
  suspended: { dot: 'bg-red-500',   badge: 'bg-red-50 text-red-700' },
}

// ─── Add User modal ───────────────────────────────────────────────────────────

function AddUserModal({ onClose }: { onClose: () => void }) {
  const [form, setForm] = useState({
    name: '', email: '', phone: '', team: '', location: '',
    role: 'viewer' as UserRole, mfaEnabled: true, status: 'active' as UserStatus,
  })
  const set = (k: string, v: unknown) => setForm((f: typeof form) => ({ ...f, [k]: v }))
  const inCls = 'w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100'

  return (
    <div className="fixed inset-0 z-modal flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="w-[520px] rounded-2xl bg-white shadow-xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <h2 className="text-base font-bold text-slate-900">Add New User</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 hover:bg-slate-100 transition-colors"><X size={16} className="text-slate-400" /></button>
        </div>
        <div className="grid grid-cols-2 gap-4 px-6 py-5">
          <div className="col-span-2">
            <label className="mb-1 block text-xxs font-semibold uppercase tracking-wide text-slate-400">Full Name *</label>
            <input value={form.name} onChange={e => set('name', e.target.value)} placeholder="First Last" className={inCls} />
          </div>
          <div>
            <label className="mb-1 block text-xxs font-semibold uppercase tracking-wide text-slate-400">Email *</label>
            <input type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="user@company.in" className={inCls} />
          </div>
          <div>
            <label className="mb-1 block text-xxs font-semibold uppercase tracking-wide text-slate-400">Phone</label>
            <input value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="+91 98XXX XXXXX" className={inCls} />
          </div>
          <div>
            <label className="mb-1 block text-xxs font-semibold uppercase tracking-wide text-slate-400">Role *</label>
            <select value={form.role} onChange={e => set('role', e.target.value as UserRole)} className={inCls}>
              {(Object.keys(ROLE_LABEL) as UserRole[]).map(r => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xxs font-semibold uppercase tracking-wide text-slate-400">Status</label>
            <select value={form.status} onChange={e => set('status', e.target.value)} className={inCls}>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xxs font-semibold uppercase tracking-wide text-slate-400">Team</label>
            <input value={form.team} onChange={e => set('team', e.target.value)} placeholder="Operations" className={inCls} />
          </div>
          <div>
            <label className="mb-1 block text-xxs font-semibold uppercase tracking-wide text-slate-400">Location</label>
            <input value={form.location} onChange={e => set('location', e.target.value)} placeholder="Mumbai" className={inCls} />
          </div>
          <div className="col-span-2 flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
            <label className="flex-1 text-sm text-slate-700">Require MFA (Recommended)</label>
            <button
              onClick={() => set('mfaEnabled', !form.mfaEnabled)}
              className={cn('relative h-5 w-9 rounded-full transition-colors', form.mfaEnabled ? 'bg-blue-600' : 'bg-slate-200')}
            >
              <span className={cn('absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform', form.mfaEnabled ? 'translate-x-4' : 'translate-x-0.5')} />
            </button>
          </div>
        </div>
        <div className="flex justify-end gap-2 border-t border-slate-200 px-6 py-4">
          <button onClick={onClose} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">Cancel</button>
          <button
            onClick={() => {
              if (!form.name || !form.email) {
                alert('Name and email are required.')
                return
              }
              onClose()
            }}
            className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
          >
            Add User
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Edit Role modal ──────────────────────────────────────────────────────────

function EditRoleModal({ role, onClose }: { role: RoleDef; onClose: () => void }) {
  const [perms, setPerms] = useState({
    canCreate: role.canCreate, canEdit: role.canEdit, canDelete: role.canDelete,
    canApprove: role.canApprove, canExport: role.canExport,
    canViewFinancials: role.canViewFinancials, canManageUsers: role.canManageUsers,
  })
  const toggle = (k: keyof typeof perms) => setPerms(p => ({ ...p, [k]: !p[k] }))

  const PERM_LABELS: { key: keyof typeof perms; label: string }[] = [
    { key: 'canCreate',         label: 'Create records'        },
    { key: 'canEdit',           label: 'Edit records'          },
    { key: 'canDelete',         label: 'Delete records'        },
    { key: 'canApprove',        label: 'Approve / sign-off'    },
    { key: 'canExport',         label: 'Export data'           },
    { key: 'canViewFinancials', label: 'View financial data'   },
    { key: 'canManageUsers',    label: 'Manage users'          },
  ]

  return (
    <div className="fixed inset-0 z-modal flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="w-[440px] rounded-2xl bg-white shadow-xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div>
            <h2 className="text-base font-bold text-slate-900">Edit Role</h2>
            <p className="text-xs text-slate-400 mt-0.5">{role.label} · {role.userCount} users</p>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 hover:bg-slate-100 transition-colors"><X size={16} className="text-slate-400" /></button>
        </div>
        <div className="px-6 py-5 space-y-3">
          <p className="text-xs text-slate-500 mb-4">{role.description}</p>
          {PERM_LABELS.map(({ key, label }) => (
            <div key={key} className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50 px-4 py-2.5">
              <span className="text-sm text-slate-700">{label}</span>
              <button
                onClick={() => toggle(key)}
                className={cn('relative h-5 w-9 rounded-full transition-colors', perms[key] ? 'bg-blue-600' : 'bg-slate-200')}
              >
                <span className={cn('absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform', perms[key] ? 'translate-x-4' : 'translate-x-0.5')} />
              </button>
            </div>
          ))}
        </div>
        <div className="flex justify-end gap-2 border-t border-slate-200 px-6 py-4">
          <button onClick={onClose} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">Cancel</button>
          <button onClick={onClose} className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition-colors">Save Changes</button>
        </div>
      </div>
    </div>
  )
}

// ─── Users tab ────────────────────────────────────────────────────────────────

function UsersTab() {
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('all')
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null)
  const [showAddUser, setShowAddUser] = useState(false)

  const filtered = useMemo(() => {
    let list = ADMIN_USERS
    if (roleFilter !== 'all') list = list.filter(u => u.role === roleFilter)
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(u =>
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.team.toLowerCase().includes(q) ||
        u.location.toLowerCase().includes(q)
      )
    }
    return list
  }, [search, roleFilter])

  return (
    <>
    {showAddUser && <AddUserModal onClose={() => setShowAddUser(false)} />}
    <div className="flex flex-1 overflow-hidden">
      {/* Left: table */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Toolbar */}
        <div className="flex items-center gap-3 border-b border-slate-200 bg-white px-6 py-3">
          <Search size={14} className="text-slate-400 shrink-0" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search name, email, team, location…"
            className="flex-1 bg-transparent text-sm text-slate-700 placeholder:text-slate-400 outline-none"
          />
          <div className="flex gap-1.5">
            {(['all','super_admin','admin','operations_manager','dispatcher','warehouse_manager','finance','viewer'] as const).map(r => (
              r === 'all' ? (
                <button key={r} onClick={() => setRoleFilter('all')}
                  className={cn('rounded-full px-3 py-1 text-xs font-medium transition-colors',
                    roleFilter === 'all' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  )}>
                  All
                </button>
              ) : (
                <button key={r} onClick={() => setRoleFilter(r)}
                  className={cn('rounded-full px-2.5 py-1 text-xxs font-medium transition-colors',
                    roleFilter === r ? 'bg-blue-600 text-white' : cn(ROLE_STYLE[r], 'hover:opacity-80')
                  )}>
                  {ROLE_LABEL[r]}
                </button>
              )
            ))}
          </div>
          <button onClick={() => setShowAddUser(true)} className="flex h-8 items-center gap-1.5 rounded-lg bg-blue-600 px-3 text-xs font-semibold text-white hover:bg-blue-700 transition-colors ml-2 shrink-0">
            <Plus size={13} />Add User
          </button>
        </div>

        <div className="flex-1 overflow-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-slate-50 border-b border-slate-200 z-10">
              <tr>
                {['User','Role','Team','Location','Status','MFA','Last Login',''].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xxs font-semibold uppercase tracking-wide text-slate-400">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(u => {
                const ss = STATUS_STYLE[u.status]
                const isSelected = selectedUser?.id === u.id
                return (
                  <tr
                    key={u.id}
                    onClick={() => setSelectedUser(isSelected ? null : u)}
                    className={cn(
                      'cursor-pointer border-b border-slate-100 transition-colors',
                      isSelected ? 'bg-blue-50' :
                      u.status === 'suspended' ? 'bg-red-50/30 hover:bg-red-50' :
                      'hover:bg-slate-50',
                    )}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className={cn('flex h-8 w-8 items-center justify-center rounded-full text-white text-xs font-bold shrink-0', ROLE_STYLE[u.role])}>
                          {u.name.charAt(0)}
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-slate-800">{u.name}</p>
                          <p className="text-xxs text-slate-400">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn('rounded-full px-2.5 py-0.5 text-xxs font-semibold', ROLE_STYLE[u.role])}>
                        {ROLE_LABEL[u.role]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600">{u.team}</td>
                    <td className="px-4 py-3 text-xs text-slate-500">{u.location}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <div className={cn('h-1.5 w-1.5 rounded-full', ss.dot)} />
                        <span className={cn('text-xxs font-medium capitalize rounded-full px-2 py-0.5', ss.badge)}>{u.status}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {u.mfaEnabled
                        ? <Shield size={13} className="text-green-500" />
                        : <Shield size={13} className="text-slate-300" />
                      }
                    </td>
                    <td className="px-4 py-3 text-xxs text-slate-400">
                      {u.lastLogin ? timeAgo(u.lastLogin) : 'Never'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button className="rounded p-1 hover:bg-slate-100 text-slate-400 hover:text-blue-600 transition-colors"><Edit3 size={12} /></button>
                        <button className="rounded p-1 hover:bg-slate-100 text-slate-400 hover:text-red-600 transition-colors"><Trash2 size={12} /></button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Right: user detail */}
      {selectedUser && (
        <div className="w-72 shrink-0 border-l border-slate-200 bg-white overflow-y-auto">
          <div className="border-b border-slate-100 px-5 py-4 flex items-start justify-between">
            <div>
              <div className={cn('mb-2 inline-flex h-10 w-10 items-center justify-center rounded-full text-white text-sm font-bold', ROLE_STYLE[selectedUser.role])}>
                {selectedUser.name.charAt(0)}
              </div>
              <p className="text-sm font-bold text-slate-800">{selectedUser.name}</p>
              <p className="text-xxs text-slate-400">{selectedUser.email}</p>
            </div>
            <button onClick={() => setSelectedUser(null)} className="rounded p-1 hover:bg-slate-100 transition-colors">
              <X size={13} className="text-slate-400" />
            </button>
          </div>
          <div className="px-5 py-4 space-y-4">
            <InfoSection title="Role & Access">
              <InfoRow label="Role" value={<span className={cn('rounded-full px-2 py-0.5 text-xxs font-semibold', ROLE_STYLE[selectedUser.role])}>{ROLE_LABEL[selectedUser.role]}</span>} />
              <InfoRow label="Team" value={selectedUser.team} />
              <InfoRow label="Location" value={selectedUser.location} />
              <InfoRow label="MFA" value={selectedUser.mfaEnabled ? <span className="text-xs text-green-600 font-semibold flex items-center gap-1"><Shield size={11} />Enabled</span> : <span className="text-xs text-slate-400">Disabled</span>} />
            </InfoSection>
            <InfoSection title="Permissions">
              <div className="flex flex-wrap gap-1.5 py-1">
                {selectedUser.permissions.map(p => (
                  <span key={p} className="rounded-md bg-slate-100 px-2 py-0.5 text-xxs font-mono text-slate-600">{p}</span>
                ))}
              </div>
            </InfoSection>
            <InfoSection title="Activity">
              <InfoRow label="Last Login" value={selectedUser.lastLogin ? timeAgo(selectedUser.lastLogin) : 'Never'} />
              <InfoRow label="Created"    value={new Date(selectedUser.createdAt).toLocaleDateString('en-IN')} />
              <InfoRow label="Status"     value={<span className={cn('capitalize text-xs font-medium', STATUS_STYLE[selectedUser.status].badge, 'rounded-full px-2 py-0.5')}>{selectedUser.status}</span>} />
            </InfoSection>
          </div>
        </div>
      )}
    </div>
    </>
  )
}

// ─── Roles tab ────────────────────────────────────────────────────────────────

function RolesTab() {
  const [editingRole, setEditingRole] = useState<RoleDef | null>(null)
  return (
    <>
    {editingRole && <EditRoleModal role={editingRole} onClose={() => setEditingRole(null)} />}
    <div className="flex-1 overflow-auto p-6">
      <div className="grid grid-cols-2 gap-4">
        {ROLES.map(role => (
          <div key={role.id} className="rounded-xl border border-slate-200 bg-white p-5">
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <span className={cn('rounded-full px-2.5 py-0.5 text-xxs font-bold', ROLE_STYLE[role.name])}>{role.label}</span>
                  <span className="text-xxs text-slate-400">{role.userCount} user{role.userCount !== 1 ? 's' : ''}</span>
                </div>
                <p className="text-xs text-slate-500 mt-1">{role.description}</p>
              </div>
              <button onClick={() => setEditingRole(role)} className="rounded-lg border border-slate-200 p-1.5 hover:bg-slate-50 transition-colors">
                <Edit3 size={12} className="text-slate-400" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              {[
                { label: 'Create',         val: role.canCreate        },
                { label: 'Edit',           val: role.canEdit          },
                { label: 'Delete',         val: role.canDelete        },
                { label: 'Approve',        val: role.canApprove       },
                { label: 'Export',         val: role.canExport        },
                { label: 'Financials',     val: role.canViewFinancials},
                { label: 'Manage Users',   val: role.canManageUsers   },
              ].map(p => (
                <div key={p.label} className="flex items-center gap-1.5 text-xxs">
                  {p.val
                    ? <CheckCircle2 size={11} className="text-green-500 shrink-0" />
                    : <div className="h-[11px] w-[11px] rounded-full border border-slate-200 shrink-0" />
                  }
                  <span className={p.val ? 'text-slate-700' : 'text-slate-400'}>{p.label}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
    </>
  )
}

// ─── Config tab ───────────────────────────────────────────────────────────────

function ConfigTab() {
  const groups = [...new Set(CONFIG_ENTRIES.map(c => c.group))]
  const [editKey, setEditKey] = useState<string | null>(null)

  return (
    <div className="flex-1 overflow-auto p-6 space-y-6">
      {groups.map(group => (
        <div key={group} className="rounded-xl border border-slate-200 bg-white overflow-hidden">
          <div className="border-b border-slate-200 bg-slate-50 px-5 py-3">
            <p className="text-xs font-bold text-slate-700">{group}</p>
          </div>
          <div className="divide-y divide-slate-100">
            {CONFIG_ENTRIES.filter(c => c.group === group).map(entry => (
              <div key={entry.key} className="flex items-start gap-4 px-5 py-3.5">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-slate-800">{entry.label}</p>
                  <p className="text-xxs text-slate-400 mt-0.5">{entry.description}</p>
                  <p className="text-xxs font-mono text-slate-400 mt-1">{entry.key}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {entry.type === 'boolean' ? (
                    <button className={cn('flex items-center gap-1.5 text-xs font-medium',
                      entry.value ? 'text-green-600' : 'text-slate-400'
                    )}>
                      {entry.value ? <ToggleRight size={20} className="text-green-500" /> : <ToggleLeft size={20} className="text-slate-300" />}
                      {entry.value ? 'Enabled' : 'Disabled'}
                    </button>
                  ) : entry.type === 'select' ? (
                    <span className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-700">
                      {String(entry.value)}
                    </span>
                  ) : (
                    editKey === entry.key ? (
                      <div className="flex items-center gap-1.5">
                        <input
                          defaultValue={String(entry.value)}
                          className="w-24 rounded-lg border border-blue-300 bg-white px-2 py-1 text-xs text-slate-700 outline-none focus:ring-2 ring-blue-100"
                          autoFocus
                        />
                        <button onClick={() => setEditKey(null)} className="text-xs text-green-600 font-semibold hover:underline">Save</button>
                        <button onClick={() => setEditKey(null)} className="text-xs text-slate-400 hover:underline">Cancel</button>
                      </div>
                    ) : (
                      <span className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700 tabular-nums">
                        {String(entry.value)}
                      </span>
                    )
                  )}
                  {entry.editable && entry.type !== 'boolean' && editKey !== entry.key && (
                    <button
                      onClick={() => setEditKey(entry.key)}
                      className="rounded p-1 hover:bg-slate-100 transition-colors"
                    >
                      <Edit3 size={12} className="text-slate-400" />
                    </button>
                  )}
                  {!entry.editable && (
                    <span className="text-xxs text-slate-300 italic">read-only</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── Audit Log tab ────────────────────────────────────────────────────────────

const ACTION_CFG: Record<string, { icon: React.ReactNode; color: string }> = {
  CREATE:  { icon: <Plus size={12} />,   color: 'bg-blue-50 text-blue-700 ring-blue-200'  },
  UPDATE:  { icon: <Edit3 size={12} />,  color: 'bg-violet-50 text-violet-700 ring-violet-200' },
  DELETE:  { icon: <Trash2 size={12} />, color: 'bg-red-50 text-red-700 ring-red-200'     },
  APPROVE: { icon: <CheckCircle2 size={12} />, color: 'bg-green-50 text-green-700 ring-green-200' },
  EXPORT:  { icon: <Download size={12} />, color: 'bg-slate-50 text-slate-600 ring-slate-200' },
  SUSPEND: { icon: <AlertTriangle size={12} />, color: 'bg-amber-50 text-amber-700 ring-amber-200' },
  LOGIN:   { icon: <LogIn size={12} />,  color: 'bg-slate-50 text-slate-600 ring-slate-200' },
}

function AuditTab() {
  return (
    <div className="flex-1 overflow-auto p-6">
      <div className="space-y-2">
        {AUDIT_LOG.map(entry => {
          const cfg = ACTION_CFG[entry.action] ?? { icon: <Activity size={12} />, color: 'bg-slate-50 text-slate-600 ring-slate-200' }
          return (
            <div key={entry.id} className="flex items-start gap-4 rounded-xl border border-slate-200 bg-white px-4 py-3">
              <div className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-full ring-1', cfg.color)}>
                {cfg.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-semibold text-slate-800">{entry.actor}</span>
                  <span className="text-xxs text-slate-400">({entry.actorRole})</span>
                  <span className={cn('rounded-full px-2 py-0.5 text-xxs font-bold ring-1', cfg.color)}>{entry.action}</span>
                  <span className="text-xs text-slate-600">{entry.resource}</span>
                  <span className="font-mono text-xxs text-slate-500">{entry.resourceId}</span>
                  <span className={cn('ml-auto rounded-full px-2 py-0.5 text-xxs font-semibold',
                    entry.result === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                  )}>
                    {entry.result}
                  </span>
                </div>
                {entry.details && <p className="text-xs text-slate-500 mt-0.5">{entry.details}</p>}
                <p className="text-xxs text-slate-400 mt-1">
                  {timeAgo(entry.at)} · IP {entry.ip}
                </p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

const ADMIN_TABS = [
  { key: 'users',  label: 'Users',       badge: ADMIN_USERS.length },
  { key: 'roles',  label: 'Roles',       badge: ROLES.length       },
  { key: 'config', label: 'Configuration', badge: CONFIG_ENTRIES.length },
  { key: 'audit',  label: 'Audit Log',   badge: AUDIT_LOG.length   },
]

export function AdminDashboard() {
  const [tab, setTab] = useState('users')

  return (
    <div className="flex flex-col h-full bg-slate-50">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
        <div>
          <h1 className="text-lg font-bold text-slate-900">Administration</h1>
          <p className="text-xs text-slate-400">User management, roles, system configuration and audit log</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => exportCsv(ADMIN_USERS.map(u => ({
              name: u.name, email: u.email, role: u.role,
              team: u.team, location: u.location, status: u.status,
              mfa: u.mfaEnabled ? 'Yes' : 'No', last_login: u.lastLogin ?? '',
            })), 'admin-users')}
            className="flex h-8 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-slate-600 hover:bg-slate-50"
          >
            <Download size={13} />Export
          </button>
        </div>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-6 gap-3 border-b border-slate-200 bg-white px-6 py-4">
        {[
          { label: 'Total Users',  value: ADMIN_KPI.totalUsers,  icon: Users,         color: 'text-slate-700' },
          { label: 'Active',       value: ADMIN_KPI.activeUsers, icon: CheckCircle2,  color: 'text-green-600' },
          { label: 'MFA Enabled',  value: ADMIN_KPI.mfaEnabled,  icon: Shield,        color: 'text-violet-600'},
          { label: 'Suspended',    value: ADMIN_KPI.suspended,   icon: AlertTriangle, color: 'text-red-600'   },
          { label: 'Config Groups',value: ADMIN_KPI.configGroups,icon: Settings,      color: 'text-slate-700' },
          { label: 'Audit Today',  value: ADMIN_KPI.auditToday,  icon: Activity,      color: 'text-blue-600'  },
        ].map(k => (
          <div key={k.label} className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
            <div className="flex items-center justify-between mb-1">
              <p className="text-xxs font-semibold uppercase tracking-wide text-slate-400">{k.label}</p>
              <k.icon size={13} className={k.color} />
            </div>
            <p className={cn('text-2xl font-bold tabular-nums', k.color)}>{k.value}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <TabStrip tabs={ADMIN_TABS} activeTab={tab} onChange={setTab} variant="page" />

      {/* Content */}
      <div className="flex flex-1 overflow-hidden">
        {tab === 'users'  && <UsersTab />}
        {tab === 'roles'  && <RolesTab />}
        {tab === 'config' && <ConfigTab />}
        {tab === 'audit'  && <AuditTab />}
      </div>
    </div>
  )
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function InfoSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-1.5 text-xxs font-semibold uppercase tracking-wide text-slate-400">{title}</p>
      <div className="rounded-xl border border-slate-100 bg-slate-50 px-3 divide-y divide-slate-100">
        {children}
      </div>
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-2 gap-2">
      <span className="text-xxs text-slate-500 shrink-0">{label}</span>
      <span className="text-xs text-slate-700 text-right">{value}</span>
    </div>
  )
}
