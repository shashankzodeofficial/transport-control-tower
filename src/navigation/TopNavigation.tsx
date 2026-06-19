import React, { useState } from 'react'
import {
  Menu, Bell, Plus, ChevronDown, User, LogOut,
  Settings, RefreshCw, Truck,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAlerts } from '@/context/AlertContext'
import { GlobalFilterBar } from '@/components/filters/GlobalFilterBar'

interface TopNavigationProps {
  onToggleNav: () => void
  navCollapsed: boolean
  user?: { name: string; role: string; region: string }
  onNewDispatch?: () => void
  onNewException?: () => void
  onProfile?: () => void
  lastSync?: Date
}

export function TopNavigation({
  onToggleNav,
  navCollapsed,
  user,
  onNewDispatch,
  onNewException,
  onProfile,
  lastSync,
}: TopNavigationProps) {
  const { unacknowledgedCount, criticalCount, toggleRail } = useAlerts()
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [actionsOpen,  setActionsOpen]  = useState(false)

  const syncLabel = lastSync
    ? `${Math.round((Date.now() - lastSync.getTime()) / 1000)}s ago`
    : null

  return (
    <header className={cn(
      'flex h-topnav flex-shrink-0 items-center gap-3 border-b border-slate-200',
      'bg-brand-surface px-4 z-sticky',
    )}>
      {/* Hamburger */}
      <button
        onClick={onToggleNav}
        aria-label={navCollapsed ? 'Expand navigation' : 'Collapse navigation'}
        className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md text-slate-400 hover:bg-white/10 hover:text-white transition-colors"
      >
        <Menu size={18} />
      </button>

      {/* Center: Global Filters */}
      <div className="flex-1 min-w-0">
        <GlobalFilterBar compact />
      </div>

      {/* Right section */}
      <div className="flex flex-shrink-0 items-center gap-1">

        {/* Sync indicator */}
        {syncLabel && (
          <div className="hidden xl:flex items-center gap-1 text-xxs text-slate-500 mr-2">
            <RefreshCw size={11} className="text-slate-600" />
            <span>{syncLabel}</span>
          </div>
        )}

        {/* Alert bell */}
        <button
          onClick={toggleRail}
          aria-label={`${unacknowledgedCount} alerts`}
          className="relative flex h-8 w-8 items-center justify-center rounded-md text-slate-400 hover:bg-white/10 hover:text-white transition-colors"
        >
          <Bell size={18} />
          {unacknowledgedCount > 0 && (
            <span className={cn(
              'absolute -right-0.5 -top-0.5 flex h-4 min-w-[16px] items-center justify-center',
              'rounded-full px-1 text-xxs font-bold text-white leading-none',
              criticalCount > 0 ? 'bg-red-600' : 'bg-amber-500',
            )}>
              {unacknowledgedCount > 99 ? '99+' : unacknowledgedCount}
            </span>
          )}
        </button>

        {/* Quick actions */}
        <div className="relative">
          <button
            onClick={() => setActionsOpen(p => !p)}
            aria-label="Quick actions"
            className="flex h-8 items-center gap-1.5 rounded-md px-2.5 bg-blue-600 text-white text-xs font-medium hover:bg-blue-700 transition-colors"
          >
            <Plus size={14} />
            <span className="hidden sm:inline">New</span>
            <ChevronDown size={12} />
          </button>
          {actionsOpen && (
            <>
              <div
                className="fixed inset-0 z-dropdown"
                onClick={() => setActionsOpen(false)}
              />
              <div className="absolute right-0 top-full mt-1 z-dropdown w-44 rounded-lg border border-slate-200 bg-white shadow-panel py-1 animate-scale-in">
                {[
                  { label: 'New Dispatch',  action: onNewDispatch,   icon: Truck },
                  { label: 'New Exception', action: onNewException,  icon: Bell },
                ].map(({ label, action, icon: Icon }) => (
                  <button
                    key={label}
                    onClick={() => { action?.(); setActionsOpen(false) }}
                    className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    <Icon size={14} className="text-slate-400" />
                    {label}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* User menu */}
        <div className="relative">
          <button
            onClick={() => setUserMenuOpen(p => !p)}
            aria-label="User menu"
            className="flex h-8 items-center gap-2 rounded-md px-2 text-slate-400 hover:bg-white/10 hover:text-white transition-colors"
          >
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
              {user ? user.name.charAt(0) : 'U'}
            </div>
            {user && (
              <div className="hidden md:block text-left">
                <p className="text-xs font-medium text-slate-200 leading-tight truncate max-w-[100px]">
                  {user.name}
                </p>
                <p className="text-xxs text-slate-500 leading-tight truncate max-w-[100px]">
                  {user.role}
                </p>
              </div>
            )}
            <ChevronDown size={12} className="hidden md:block" />
          </button>

          {userMenuOpen && (
            <>
              <div className="fixed inset-0 z-dropdown" onClick={() => setUserMenuOpen(false)} />
              <div className="absolute right-0 top-full mt-1 z-dropdown w-52 rounded-lg border border-slate-200 bg-white shadow-panel py-1 animate-scale-in">
                {user && (
                  <div className="border-b border-slate-100 px-3 py-2 mb-1">
                    <p className="text-sm font-semibold text-slate-900">{user.name}</p>
                    <p className="text-xs text-slate-500">{user.role} · {user.region}</p>
                  </div>
                )}
                <button
                  onClick={() => { onProfile?.(); setUserMenuOpen(false) }}
                  className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  <User size={14} className="text-slate-400" /> Profile
                </button>
                <button
                  onClick={() => { onProfile?.(); setUserMenuOpen(false) }}
                  className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  <Settings size={14} className="text-slate-400" /> Preferences
                </button>
                <div className="border-t border-slate-100 mt-1 pt-1">
                  <button
                    onClick={() => {
                      setUserMenuOpen(false)
                      if (window.confirm('Sign out of Transport Control Tower?')) {
                        window.location.href = '/'
                      }
                    }}
                    className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <LogOut size={14} /> Sign Out
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
