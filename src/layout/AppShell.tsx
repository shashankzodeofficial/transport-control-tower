import React, { useState, useEffect } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { LeftNavigation } from '@/navigation/LeftNavigation'
import { TopNavigation }  from '@/navigation/TopNavigation'
import { GlobalAlertRail } from '@/components/shared/GlobalAlertRail'
import { DrawerContainer }  from '@/components/modals/DrawerContainer'
import { useAlerts } from '@/context/AlertContext'

export const APP_USER = { name: 'Shashank Zode', role: 'Transport Transformation Leader', region: 'West' }

export function AppShell() {
  const [navCollapsed, setNavCollapsed] = useState(false)
  const [lastSync,     setLastSync]     = useState<Date>(new Date())
  const { alerts } = useAlerts()
  const location   = useLocation()
  const navigate   = useNavigate()

  // Auto-collapse on small screens
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 1023px)')
    setNavCollapsed(mq.matches)
    const handler = (e: MediaQueryListEvent) => setNavCollapsed(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  // Update sync time on route change
  useEffect(() => { setLastSync(new Date()) }, [location.pathname])

  // Build badge map from active alerts
  const badges: Record<string, number> = {}
  alerts.filter(a => !a.acknowledged).forEach(a => {
    const moduleKey = alertTypeToModule(a.type)
    if (moduleKey) badges[moduleKey] = (badges[moduleKey] ?? 0) + 1
  })

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-100">
      {/* Sidebar */}
      <LeftNavigation collapsed={navCollapsed} badges={badges} />

      {/* Main area */}
      <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
        <TopNavigation
          onToggleNav={() => setNavCollapsed(p => !p)}
          navCollapsed={navCollapsed}
          user={APP_USER}
          lastSync={lastSync}
          onNewDispatch={() => navigate('/dispatch/board?action=new')}
          onNewException={() => navigate('/exceptions?action=new')}
          onProfile={() => navigate('/profile')}
        />

        {/* Scrollable content */}
        <main className="flex-1 overflow-hidden flex flex-col" id="main-content">
          <Outlet />
        </main>
      </div>

      {/* Fixed global alert rail */}
      <GlobalAlertRail />

      {/* L3 drawer stack */}
      <DrawerContainer />
    </div>
  )
}

function alertTypeToModule(type: string): string | null {
  const map: Record<string, string> = {
    SLA_BREACH:             'alerts',
    HIGH_RISK:              'operations',
    ESCALATED_EXCEPTION:    'exceptions',
    OVERDUE_RECONCILIATION: 'recon',
    INTEGRATION_FAILURE:    'admin',
  }
  return map[type] ?? null
}
