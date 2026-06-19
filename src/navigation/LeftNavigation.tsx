import React from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import {
  LayoutDashboard, Radio, PackageCheck, Truck, Route,
  AlertTriangle, ScanBarcode, TrendingUp, Building2,
  Bell, BarChart3, Database, Settings, ChevronRight,
  Warehouse, PackageOpen, GitCommitVertical,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { NAV_CONFIG } from './config'
import type { NavItemDef } from '@/types'

// ─── Icon map ─────────────────────────────────────────────────────────────────

const ICON_MAP: Record<string, React.ComponentType<{ className?: string; size?: number }>> = {
  LayoutDashboard, Radio, PackageCheck, Truck, Route,
  AlertTriangle, ScanBarcode, TrendingUp, Building2,
  Bell, BarChart3, Database, Settings, Warehouse, PackageOpen, GitCommitVertical,
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface LeftNavigationProps {
  collapsed: boolean
  badges?: Record<string, number>   // key → alert count
}

// ─── Badge component ─────────────────────────────────────────────────────────

function NavBadge({ count, level }: { count: number; level?: 'critical' | 'high' }) {
  if (count === 0) return null
  return (
    <span className={cn(
      'ml-auto flex h-5 min-w-[20px] items-center justify-center rounded-full px-1',
      'text-xxs font-semibold text-white leading-none',
      level === 'critical' ? 'bg-red-600' : 'bg-amber-500',
    )}>
      {count > 99 ? '99+' : count}
    </span>
  )
}

// ─── Single nav item ─────────────────────────────────────────────────────────

function NavItemComponent({
  item,
  collapsed,
  badge,
}: {
  item: NavItemDef
  collapsed: boolean
  badge?: number
}) {
  const location = useLocation()
  const isActive = location.pathname.startsWith(item.path)
  const Icon     = ICON_MAP[item.icon] ?? ChevronRight
  const badgeLevel = badge && badge > 0 ? (badge <= 3 ? 'high' : 'critical') as 'critical' | 'high' : undefined

  return (
    <NavLink
      to={item.path}
      title={collapsed ? item.label : undefined}
      className={cn(
        'group relative flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium',
        'transition-colors duration-fast',
        isActive
          ? 'bg-brand-primary/10 text-white'
          : 'text-slate-400 hover:bg-white/5 hover:text-slate-200',
        collapsed && 'justify-center px-2',
      )}
    >
      {/* Active indicator bar */}
      {isActive && (
        <span className="absolute left-0 top-1/2 h-6 w-0.5 -translate-y-1/2 rounded-full bg-blue-400" />
      )}

      <Icon
        size={18}
        className={cn(
          'flex-shrink-0 transition-colors',
          isActive ? 'text-blue-400' : 'text-slate-400 group-hover:text-slate-200',
        )}
      />

      {!collapsed && (
        <>
          <span className="flex-1 truncate">{item.label}</span>
          {badge !== undefined && <NavBadge count={badge} level={badgeLevel} />}
        </>
      )}

      {/* Collapsed tooltip */}
      {collapsed && (
        <div className={cn(
          'absolute left-full ml-2 z-dropdown hidden rounded-md px-2 py-1',
          'bg-slate-800 text-xs text-white shadow-panel whitespace-nowrap',
          'group-hover:flex items-center gap-2',
        )}>
          {item.label}
          {badge !== undefined && badge > 0 && (
            <NavBadge count={badge} level={badgeLevel} />
          )}
        </div>
      )}
    </NavLink>
  )
}

// ─── Nav group ────────────────────────────────────────────────────────────────

function NavGroupComponent({
  group,
  collapsed,
  badges,
}: {
  group: (typeof NAV_CONFIG)[0]
  collapsed: boolean
  badges: Record<string, number>
}) {
  return (
    <div className="space-y-0.5">
      {!collapsed && (
        <p className="mb-1 px-3 text-xxs font-semibold uppercase tracking-widest text-slate-500 select-none">
          {group.label}
        </p>
      )}
      {group.items.map(item => (
        <NavItemComponent
          key={item.key}
          item={item}
          collapsed={collapsed}
          badge={badges[item.key]}
        />
      ))}
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export function LeftNavigation({ collapsed, badges = {} }: LeftNavigationProps) {
  return (
    <nav
      aria-label="Main navigation"
      className={cn(
        'flex h-full flex-col overflow-hidden border-r border-slate-800',
        'bg-brand-surface transition-[width] duration-base',
        collapsed ? 'w-nav-collapsed' : 'w-nav',
      )}
    >
      {/* Logo area */}
      <div className={cn(
        'flex h-topnav flex-shrink-0 items-center border-b border-slate-800',
        collapsed ? 'justify-center px-2' : 'gap-3 px-4',
      )}>
        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md bg-blue-600">
          <Truck size={18} className="text-white" />
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-white leading-tight">TCT</p>
            <p className="truncate text-xxs text-slate-400 leading-tight">Control Tower</p>
          </div>
        )}
      </div>

      {/* Scrollable nav items */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden py-3 scrollbar-none">
        <div className={cn('space-y-4', collapsed ? 'px-1' : 'px-2')}>
          {NAV_CONFIG.map(group => (
            <NavGroupComponent
              key={group.key}
              group={group}
              collapsed={collapsed}
              badges={badges}
            />
          ))}
        </div>
      </div>
    </nav>
  )
}
