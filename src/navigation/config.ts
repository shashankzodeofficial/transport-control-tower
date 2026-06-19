import type { NavGroupDef } from '@/types'

export const NAV_CONFIG: NavGroupDef[] = [
  {
    key: 'monitoring',
    label: 'MONITORING',
    items: [
      { key: 'executive',    label: 'Executive CT',      icon: 'LayoutDashboard', path: '/executive',     permission: 'executive.view' },
      { key: 'operations',   label: 'Operations CT',     icon: 'Radio',           path: '/operations',    permission: 'operations.view' },
    ],
  },
  {
    key: 'execution',
    label: 'EXECUTION',
    items: [
      { key: 'dispatch',     label: 'Dispatch Mgmt',     icon: 'PackageCheck',    path: '/dispatch',      permission: 'dispatch.view' },
      { key: 'transport',    label: 'Transport Exec',    icon: 'Truck',           path: '/transport',     permission: 'transport.view' },
      { key: 'planning',     label: 'Load Planning',     icon: 'Route',           path: '/load-planning', permission: 'planning.view' },
    ],
  },
  {
    key: 'exceptions',
    label: 'EXCEPTIONS',
    items: [
      { key: 'exceptions',   label: 'Exception Mgmt',    icon: 'AlertTriangle',   path: '/exceptions',    permission: 'exceptions.view' },
    ],
  },
  {
    key: 'reconciliation',
    label: 'RECONCILIATION',
    items: [
      { key: 'recon',        label: 'Reconciliation Ctr',icon: 'ScanBarcode',     path: '/reconciliation',permission: 'reconciliation.view' },
    ],
  },
  {
    key: 'performance',
    label: 'PERFORMANCE',
    items: [
      { key: 'routes',       label: 'Route Performance', icon: 'TrendingUp',      path: '/routes',        permission: 'routes.view' },
      { key: 'carriers',     label: 'Carrier Performance',icon: 'Building2',      path: '/carriers',      permission: 'carriers.view' },
    ],
  },
  {
    key: 'alerts',
    label: 'ALERTS',
    items: [
      { key: 'alerts',       label: 'CT Alerts',         icon: 'Bell',            path: '/alerts',        permission: 'alerts.view' },
    ],
  },
  {
    key: 'intelligence',
    label: 'INTELLIGENCE',
    items: [
      { key: 'analytics',    label: 'Analytics',         icon: 'BarChart3',       path: '/analytics',     permission: 'analytics.view' },
    ],
  },
  {
    key: 'configuration',
    label: 'CONFIGURATION',
    items: [
      { key: 'master-data',  label: 'Master Data',       icon: 'Database',        path: '/master-data',   permission: 'admin.view' },
      { key: 'admin',        label: 'Administration',    icon: 'Settings',        path: '/admin',         permission: 'admin.view' },
    ],
  },
]

// Default L2 for each L1
export const MODULE_DEFAULTS: Record<string, string> = {
  '/executive':      '/executive/overview',
  '/operations':     '/operations/live',
  '/dispatch':       '/dispatch/board',
  '/transport':      '/transport/live',
  '/load-planning':  '/load-planning/capacity',
  '/exceptions':     '/exceptions/dashboard',
  '/reconciliation': '/reconciliation/dashboard',
  '/routes':         '/routes/scorecard',
  '/carriers':       '/carriers/ranking',
  '/alerts':         '/alerts/active',
  '/analytics':      '/analytics/operations',
  '/master-data':    '/master-data/routes',
  '/admin':          '/admin/users',
}
