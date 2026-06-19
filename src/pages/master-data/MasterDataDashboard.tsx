import React from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Database, Route, Truck, Building2, MapPin, Users, LayoutGrid } from 'lucide-react'
import { cn } from '@/lib/utils'
import { RouteMasterScreen }    from './screens/RouteMaster'
import { FleetMasterScreen }    from './screens/FleetMaster'
import { CarrierMasterScreen }  from './screens/CarrierMaster'
import { HubMasterScreen }      from './screens/HubMaster'
import { CustomerMasterScreen } from './screens/CustomerMaster'
import { SLAMatrixScreen }      from './screens/SLAMatrix'

// ─── Tab definitions ──────────────────────────────────────────────────────────

const TABS = [
  { key: 'routes',    label: 'Route Master',    icon: Route,     path: '/master-data/routes' },
  { key: 'fleet',     label: 'Fleet Master',    icon: Truck,     path: '/master-data/fleet' },
  { key: 'carriers',  label: 'Carrier Master',  icon: Building2, path: '/master-data/carriers' },
  { key: 'hubs',      label: 'Hub Master',      icon: MapPin,    path: '/master-data/hubs' },
  { key: 'customers', label: 'Customer Master', icon: Users,     path: '/master-data/customers' },
  { key: 'sla-matrix',label: 'SLA Matrix',      icon: LayoutGrid,path: '/master-data/sla-matrix' },
] as const

type TabKey = typeof TABS[number]['key']

function activeTabFromPath(pathname: string): TabKey {
  const seg = pathname.split('/').pop() ?? ''
  const found = TABS.find(t => t.key === seg)
  return found ? found.key : 'routes'
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

export function MasterDataDashboard() {
  const location = useLocation()
  const navigate = useNavigate()
  const activeTab = activeTabFromPath(location.pathname)

  const activeLabel = TABS.find(t => t.key === activeTab)?.label ?? 'Master Data'

  return (
    <div className="flex flex-col min-h-0 h-full bg-slate-50">
      {/* Header */}
      <div className="border-b border-slate-200 bg-white sticky top-0 z-10">
        <div className="flex items-center justify-between px-6 py-3">
          <div>
            <h1 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Database size={16} className="text-blue-600" />
              Master Data
              <span className="text-slate-400 font-normal">·</span>
              <span className="text-blue-600">{activeLabel}</span>
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Configuration records for routes, fleet, carriers, hubs, customers, and SLA rules
            </p>
          </div>
        </div>

        {/* Tab bar */}
        <div className="flex items-center gap-0 px-6 border-t border-slate-100 overflow-x-auto">
          {TABS.map(tab => {
            const Icon     = tab.icon
            const isActive = activeTab === tab.key
            return (
              <button
                key={tab.key}
                onClick={() => navigate(tab.path)}
                className={cn(
                  'flex items-center gap-2 px-4 py-3 text-xs font-medium border-b-2 transition-all whitespace-nowrap',
                  isActive
                    ? 'border-blue-600 text-blue-700 bg-blue-50/50'
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50',
                )}
              >
                <Icon size={13} />
                {tab.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        {activeTab === 'routes'     && <RouteMasterScreen />}
        {activeTab === 'fleet'      && <FleetMasterScreen />}
        {activeTab === 'carriers'   && <CarrierMasterScreen />}
        {activeTab === 'hubs'       && <HubMasterScreen />}
        {activeTab === 'customers'  && <CustomerMasterScreen />}
        {activeTab === 'sla-matrix' && <SLAMatrixScreen />}
      </div>
    </div>
  )
}
