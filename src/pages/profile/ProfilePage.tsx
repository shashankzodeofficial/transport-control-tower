import React, { useState } from 'react'
import {
  User, Mail, Phone, MapPin, Shield, Bell,
  Edit3, CheckCircle2, Clock, Activity,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { APP_USER } from '@/layout/AppShell'

const NOTIFICATION_PREFS = [
  { key: 'sla_breach',     label: 'SLA Breach Alerts',         default: true  },
  { key: 'exceptions',     label: 'New Exception Raised',       default: true  },
  { key: 'escalations',    label: 'Escalation Notifications',   default: true  },
  { key: 'recon_overdue',  label: 'Overdue Reconciliation',     default: true  },
  { key: 'daily_digest',   label: 'Daily Summary Digest',       default: false },
  { key: 'system_updates', label: 'System Maintenance Updates', default: false },
]

const RECENT_ACTIVITY = [
  { action: 'Acknowledged 3 SLA Breach alerts',         time: '14 min ago', icon: Bell },
  { action: 'Approved Reconciliation REC-2024-1021',    time: '1 hr ago',   icon: CheckCircle2 },
  { action: 'Raised exception EXC-2024-0043',           time: '2 hrs ago',  icon: Activity },
  { action: 'Exported Dispatch workbench CSV',          time: '4 hrs ago',  icon: Activity },
  { action: 'Updated SLA matrix for DEL-MUM-FTL route', time: 'Yesterday',  icon: Edit3 },
]

export function ProfilePage() {
  const [notifPrefs, setNotifPrefs] = useState<Record<string, boolean>>(
    Object.fromEntries(NOTIFICATION_PREFS.map(n => [n.key, n.default]))
  )
  const [editing, setEditing] = useState(false)
  const [phone, setPhone]     = useState('+91 98200 00001')
  const [location, setLocation] = useState('Mumbai, Maharashtra')

  function toggleNotif(key: string) {
    setNotifPrefs(prev => ({ ...prev, [key]: !prev[key] }))
  }

  return (
    <div className="min-h-full bg-slate-50 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header card */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <div className="flex items-start gap-6">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-blue-600 text-2xl font-bold text-white shrink-0">
              {APP_USER.name.charAt(0)}
            </div>
            <div className="flex-1">
              <h1 className="text-xl font-bold text-slate-900">{APP_USER.name}</h1>
              <p className="text-sm text-slate-500 mt-0.5">{APP_USER.role}</p>
              <div className="flex items-center gap-4 mt-3">
                <div className="flex items-center gap-1.5 text-xs text-slate-500">
                  <MapPin size={12} className="text-slate-400" />
                  {location}
                </div>
                <div className="flex items-center gap-1.5 text-xs text-slate-500">
                  <Shield size={12} className="text-green-500" />
                  MFA Enabled
                </div>
                <div className="flex items-center gap-1.5 text-xs text-slate-500">
                  <Activity size={12} className="text-blue-500" />
                  Operations Leader — {APP_USER.region} Region
                </div>
              </div>
            </div>
            <button
              onClick={() => setEditing(e => !e)}
              className={cn(
                'flex items-center gap-2 rounded-lg border px-4 py-2 text-xs font-semibold transition-colors',
                editing
                  ? 'border-blue-300 bg-blue-50 text-blue-700'
                  : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50',
              )}
            >
              <Edit3 size={13} />
              {editing ? 'Editing…' : 'Edit Profile'}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6">
          {/* Contact info */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <h2 className="text-sm font-bold text-slate-900 mb-4">Contact Information</h2>
            <div className="space-y-4">
              <div>
                <label className="text-xxs font-semibold uppercase tracking-wide text-slate-400 mb-1 block">Full Name</label>
                <div className="flex items-center gap-2 text-sm text-slate-800">
                  <User size={14} className="text-slate-400" />
                  {APP_USER.name}
                </div>
              </div>
              <div>
                <label className="text-xxs font-semibold uppercase tracking-wide text-slate-400 mb-1 block">Email</label>
                <div className="flex items-center gap-2 text-sm text-slate-800">
                  <Mail size={14} className="text-slate-400" />
                  shashank.zode@transportct.in
                </div>
              </div>
              <div>
                <label className="text-xxs font-semibold uppercase tracking-wide text-slate-400 mb-1 block">Phone</label>
                {editing ? (
                  <input
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  />
                ) : (
                  <div className="flex items-center gap-2 text-sm text-slate-800">
                    <Phone size={14} className="text-slate-400" />
                    {phone}
                  </div>
                )}
              </div>
              <div>
                <label className="text-xxs font-semibold uppercase tracking-wide text-slate-400 mb-1 block">Location</label>
                {editing ? (
                  <input
                    value={location}
                    onChange={e => setLocation(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  />
                ) : (
                  <div className="flex items-center gap-2 text-sm text-slate-800">
                    <MapPin size={14} className="text-slate-400" />
                    {location}
                  </div>
                )}
              </div>
            </div>
            {editing && (
              <div className="mt-5 flex justify-end gap-2">
                <button onClick={() => setEditing(false)} className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors">
                  Cancel
                </button>
                <button onClick={() => setEditing(false)} className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700 transition-colors">
                  Save Changes
                </button>
              </div>
            )}
          </div>

          {/* Role & Permissions */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <h2 className="text-sm font-bold text-slate-900 mb-4">Role & Permissions</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between rounded-lg bg-blue-50 px-4 py-3">
                <div>
                  <p className="text-xs font-bold text-blue-700">Operations Manager</p>
                  <p className="text-xxs text-blue-500 mt-0.5">Primary access level</p>
                </div>
                <Shield size={16} className="text-blue-600" />
              </div>
              {[
                ['View Dispatches',      true],
                ['Create Dispatches',    true],
                ['Manage Exceptions',    true],
                ['Approve Reconciliation',true],
                ['Export Data',          true],
                ['Manage Users',         false],
                ['System Configuration', false],
              ].map(([label, granted]) => (
                <div key={label as string} className="flex items-center gap-2 text-xs">
                  <CheckCircle2 size={13} className={granted ? 'text-green-500' : 'text-slate-300'} />
                  <span className={granted ? 'text-slate-700' : 'text-slate-400'}>{label as string}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Notification Preferences */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <h2 className="text-sm font-bold text-slate-900 mb-4">Notification Preferences</h2>
            <div className="space-y-3">
              {NOTIFICATION_PREFS.map(pref => (
                <label key={pref.key} className="flex items-center justify-between cursor-pointer">
                  <span className="text-xs text-slate-700">{pref.label}</span>
                  <button
                    onClick={() => toggleNotif(pref.key)}
                    className={cn(
                      'relative h-5 w-9 rounded-full transition-colors',
                      notifPrefs[pref.key] ? 'bg-blue-600' : 'bg-slate-200',
                    )}
                  >
                    <span className={cn(
                      'absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform',
                      notifPrefs[pref.key] ? 'translate-x-4' : 'translate-x-0.5',
                    )} />
                  </button>
                </label>
              ))}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <h2 className="text-sm font-bold text-slate-900 mb-4">Recent Activity</h2>
            <div className="space-y-3">
              {RECENT_ACTIVITY.map((a, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-100">
                    <a.icon size={12} className="text-slate-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-slate-700 leading-snug">{a.action}</p>
                    <div className="flex items-center gap-1 mt-0.5">
                      <Clock size={10} className="text-slate-400" />
                      <span className="text-xxs text-slate-400">{a.time}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
