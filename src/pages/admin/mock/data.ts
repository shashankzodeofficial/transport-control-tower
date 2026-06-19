// Administration mock data

export type UserRole = 'super_admin' | 'admin' | 'operations_manager' | 'dispatcher' | 'warehouse_manager' | 'finance' | 'viewer'
export type UserStatus = 'active' | 'inactive' | 'suspended'

export interface AdminUser {
  id: string
  name: string
  email: string
  role: UserRole
  team: string
  location: string
  status: UserStatus
  lastLogin?: string
  createdAt: string
  permissions: string[]
  mfaEnabled: boolean
}

export interface RoleDef {
  id: string
  name: UserRole
  label: string
  userCount: number
  description: string
  canCreate: boolean
  canEdit: boolean
  canDelete: boolean
  canApprove: boolean
  canExport: boolean
  canViewFinancials: boolean
  canManageUsers: boolean
}

export interface ConfigEntry {
  key: string
  label: string
  value: string | number | boolean
  type: 'string' | 'number' | 'boolean' | 'select'
  options?: string[]
  group: string
  description: string
  editable: boolean
}

export interface AuditEntry {
  id: string
  actor: string
  actorRole: string
  action: string
  resource: string
  resourceId: string
  at: string
  ip: string
  result: 'success' | 'failure'
  details?: string
}

const now = Date.now()
const t   = (daysAgo: number) => new Date(now - daysAgo * 86400000).toISOString()
const tH  = (hoursAgo: number) => new Date(now - hoursAgo * 3600000).toISOString()

export const ADMIN_USERS: AdminUser[] = [
  { id: 'U-001', name: 'Priya Sharma',    email: 'priya.sharma@company.com',   role: 'super_admin',        team: 'IT',         location: 'Delhi',     status: 'active',   lastLogin: tH(1),  createdAt: t(365), permissions: ['*'],               mfaEnabled: true  },
  { id: 'U-002', name: 'Rahul Verma',     email: 'rahul.verma@company.com',    role: 'admin',              team: 'Operations', location: 'Delhi',     status: 'active',   lastLogin: tH(2),  createdAt: t(300), permissions: ['ops.*','disp.*'],    mfaEnabled: true  },
  { id: 'U-003', name: 'Anita Rao',       email: 'anita.rao@company.com',      role: 'operations_manager', team: 'Operations', location: 'Mumbai',    status: 'active',   lastLogin: tH(4),  createdAt: t(280), permissions: ['ops.*'],             mfaEnabled: true  },
  { id: 'U-004', name: 'Deepak Nair',     email: 'deepak.nair@company.com',    role: 'dispatcher',         team: 'Dispatch',   location: 'Delhi',     status: 'active',   lastLogin: tH(1),  createdAt: t(240), permissions: ['disp.*'],            mfaEnabled: false },
  { id: 'U-005', name: 'Kavitha Menon',   email: 'kavitha.menon@company.com',  role: 'dispatcher',         team: 'Dispatch',   location: 'Bangalore', status: 'active',   lastLogin: tH(3),  createdAt: t(220), permissions: ['disp.*'],            mfaEnabled: false },
  { id: 'U-006', name: 'Suresh Kumar',    email: 'suresh.kumar@company.com',   role: 'warehouse_manager',  team: 'Warehouse',  location: 'Chennai',   status: 'active',   lastLogin: tH(6),  createdAt: t(200), permissions: ['wh.*'],              mfaEnabled: true  },
  { id: 'U-007', name: 'Megha Joshi',     email: 'megha.joshi@company.com',    role: 'finance',            team: 'Finance',    location: 'Mumbai',    status: 'active',   lastLogin: tH(8),  createdAt: t(180), permissions: ['fin.*'],             mfaEnabled: true  },
  { id: 'U-008', name: 'Arjun Pillai',    email: 'arjun.pillai@company.com',   role: 'dispatcher',         team: 'Dispatch',   location: 'Hyderabad', status: 'active',   lastLogin: tH(2),  createdAt: t(160), permissions: ['disp.*'],            mfaEnabled: false },
  { id: 'U-009', name: 'Neeraj Gupta',    email: 'neeraj.gupta@company.com',   role: 'viewer',             team: 'Analytics',  location: 'Delhi',     status: 'active',   lastLogin: tH(24), createdAt: t(140), permissions: ['view.*'],            mfaEnabled: false },
  { id: 'U-010', name: 'Pooja Singh',     email: 'pooja.singh@company.com',    role: 'operations_manager', team: 'Operations', location: 'Kolkata',   status: 'active',   lastLogin: tH(12), createdAt: t(120), permissions: ['ops.*'],             mfaEnabled: true  },
  { id: 'U-011', name: 'Kiran Bhat',      email: 'kiran.bhat@company.com',     role: 'dispatcher',         team: 'Dispatch',   location: 'Pune',      status: 'inactive', lastLogin: tH(72), createdAt: t(100), permissions: ['disp.*'],            mfaEnabled: false },
  { id: 'U-012', name: 'Sunita Agarwal',  email: 'sunita.agarwal@company.com', role: 'finance',            team: 'Finance',    location: 'Delhi',     status: 'active',   lastLogin: tH(4),  createdAt: t(90),  permissions: ['fin.view','fin.export'],mfaEnabled: true },
  { id: 'U-013', name: 'Dev Malhotra',    email: 'dev.malhotra@company.com',   role: 'viewer',             team: 'Business Dev',location: 'Mumbai',   status: 'suspended',lastLogin: tH(720),createdAt: t(80),  permissions: ['view.*'],            mfaEnabled: false },
]

export const ROLES: RoleDef[] = [
  { id: 'R-001', name: 'super_admin',        label: 'Super Admin',           userCount: 1,  description: 'Full system access. All modules, configuration, user management.',         canCreate: true,  canEdit: true,  canDelete: true,  canApprove: true,  canExport: true,  canViewFinancials: true,  canManageUsers: true  },
  { id: 'R-002', name: 'admin',              label: 'Administrator',         userCount: 1,  description: 'Full operational access. Cannot modify system configuration.',              canCreate: true,  canEdit: true,  canDelete: true,  canApprove: true,  canExport: true,  canViewFinancials: true,  canManageUsers: true  },
  { id: 'R-003', name: 'operations_manager', label: 'Operations Manager',    userCount: 2,  description: 'Manage dispatches, routes, carriers. View all dashboards.',                canCreate: true,  canEdit: true,  canDelete: false, canApprove: true,  canExport: true,  canViewFinancials: true,  canManageUsers: false },
  { id: 'R-004', name: 'dispatcher',         label: 'Dispatcher',            userCount: 4,  description: 'Create and manage dispatch records. View workbench.',                      canCreate: true,  canEdit: true,  canDelete: false, canApprove: false, canExport: false, canViewFinancials: false, canManageUsers: false },
  { id: 'R-005', name: 'warehouse_manager',  label: 'Warehouse Manager',     userCount: 1,  description: 'Manage HU scanning, reconciliation, and gate operations.',                 canCreate: false, canEdit: true,  canDelete: false, canApprove: true,  canExport: true,  canViewFinancials: false, canManageUsers: false },
  { id: 'R-006', name: 'finance',            label: 'Finance',               userCount: 2,  description: 'View and export financial data. Approve reconciliation sign-offs.',        canCreate: false, canEdit: false, canDelete: false, canApprove: true,  canExport: true,  canViewFinancials: true,  canManageUsers: false },
  { id: 'R-007', name: 'viewer',             label: 'Viewer',                userCount: 2,  description: 'Read-only access to dashboards and reports.',                              canCreate: false, canEdit: false, canDelete: false, canApprove: false, canExport: false, canViewFinancials: false, canManageUsers: false },
]

export const CONFIG_ENTRIES: ConfigEntry[] = [
  // SLA
  { key: 'sla.default_hours',       label: 'Default SLA Window (hours)',    value: 48,    type: 'number',  group: 'SLA',       description: 'Default delivery SLA for all routes without specific SLA master.',     editable: true  },
  { key: 'sla.warning_threshold',   label: 'SLA Warning Threshold (%)',     value: 80,    type: 'number',  group: 'SLA',       description: 'Percentage of SLA elapsed before warning is shown.',                   editable: true  },
  { key: 'sla.auto_escalate_mins',  label: 'Auto-Escalate After (mins)',    value: 30,    type: 'number',  group: 'SLA',       description: 'Minutes after SLA breach before automatic L1 escalation.',             editable: true  },
  // Dispatch
  { key: 'dispatch.auto_close_days',label: 'Auto-Close Dispatches (days)',  value: 7,     type: 'number',  group: 'Dispatch',  description: 'Days after arrival before dispatch is auto-closed if not reconciled.', editable: true  },
  { key: 'dispatch.hub_cutoff_hr',  label: 'Hub Cut-off Time (hour)',       value: 18,    type: 'number',  group: 'Dispatch',  description: 'Hour of day after which same-day dispatch cutoff applies.',             editable: true  },
  { key: 'dispatch.require_seal',   label: 'Require Seal Number',           value: true,  type: 'boolean', group: 'Dispatch',  description: 'Enforce seal number before dispatch can move to Dispatched status.',    editable: true  },
  // GPS
  { key: 'gps.ping_interval_sec',   label: 'GPS Ping Interval (seconds)',   value: 60,    type: 'number',  group: 'GPS/Telematics', description: 'Frequency of GPS position updates.',                              editable: true  },
  { key: 'gps.idle_alert_mins',     label: 'Idle Alert Threshold (mins)',   value: 120,   type: 'number',  group: 'GPS/Telematics', description: 'Minutes of zero speed before idle alert is raised.',              editable: true  },
  { key: 'gps.speed_limit_kmh',     label: 'Speed Limit Alert (km/h)',      value: 90,    type: 'number',  group: 'GPS/Telematics', description: 'Speed above which driver speeding alert is raised.',              editable: true  },
  // Notifications
  { key: 'notif.sla_email',         label: 'SLA Email Alerts',              value: true,  type: 'boolean', group: 'Notifications', description: 'Send email on SLA breach.',                                       editable: true  },
  { key: 'notif.exc_sms',           label: 'Exception SMS Alerts',          value: true,  type: 'boolean', group: 'Notifications', description: 'Send SMS for critical exceptions.',                               editable: true  },
  { key: 'notif.daily_digest_hr',   label: 'Daily Digest Hour',             value: 8,     type: 'number',  group: 'Notifications', description: 'Hour (24h) to send daily operations digest email.',               editable: true  },
  // Integrations
  { key: 'int.gst_api_enabled',     label: 'GST Portal API',                value: true,  type: 'boolean', group: 'Integrations', description: 'Enable real-time e-waybill verification with GST portal.',        editable: false },
  { key: 'int.eway_bill_mode',      label: 'E-Waybill Mode',                value: 'prod',type: 'select',  group: 'Integrations', description: 'API mode for e-waybill generation.', options: ['prod','sandbox'],   editable: false },
  { key: 'int.maps_provider',       label: 'Maps Provider',                 value: 'Google Maps', type: 'select', group: 'Integrations', description: 'Map tiles provider for transport monitoring.', options: ['Google Maps','MapmyIndia','OpenStreetMap'], editable: true },
]

export const AUDIT_LOG: AuditEntry[] = [
  { id: 'AL-001', actor: 'Priya Sharma',  actorRole: 'super_admin',  action: 'UPDATE', resource: 'Config',    resourceId: 'sla.default_hours',  at: tH(0.5),  ip: '10.0.0.1',   result: 'success', details: 'Changed SLA default from 36h to 48h' },
  { id: 'AL-002', actor: 'Rahul Verma',   actorRole: 'admin',        action: 'CREATE', resource: 'User',      resourceId: 'U-013',              at: tH(2),    ip: '10.0.0.14',  result: 'success', details: 'Created user Dev Malhotra (viewer role)' },
  { id: 'AL-003', actor: 'Anita Rao',     actorRole: 'ops_manager',  action: 'APPROVE',resource: 'Dispatch',  resourceId: 'D-48195',            at: tH(4),    ip: '10.0.1.22',  result: 'success' },
  { id: 'AL-004', actor: 'Megha Joshi',   actorRole: 'finance',      action: 'EXPORT', resource: 'Report',    resourceId: 'RPT-NOV-2024',       at: tH(5),    ip: '10.0.2.11',  result: 'success', details: 'Exported November 2024 freight cost report (1,240 rows)' },
  { id: 'AL-005', actor: 'Dev Malhotra',  actorRole: 'viewer',       action: 'LOGIN',  resource: 'Session',   resourceId: '-',                  at: tH(6),    ip: '192.168.5.99',result: 'failure', details: 'Failed login — account suspended' },
  { id: 'AL-006', actor: 'Deepak Nair',   actorRole: 'dispatcher',   action: 'UPDATE', resource: 'Dispatch',  resourceId: 'D-48291',            at: tH(7),    ip: '10.0.0.32',  result: 'success', details: 'Updated HU count from 7 to 8' },
  { id: 'AL-007', actor: 'Priya Sharma',  actorRole: 'super_admin',  action: 'SUSPEND',resource: 'User',      resourceId: 'U-013',              at: tH(8),    ip: '10.0.0.1',   result: 'success', details: 'Suspended user Dev Malhotra — policy violation' },
  { id: 'AL-008', actor: 'Rahul Verma',   actorRole: 'admin',        action: 'UPDATE', resource: 'CarrierTier',resourceId: 'CAR-008',           at: tH(24),   ip: '10.0.0.14',  result: 'success', details: 'Changed FastMove Logistics tier: Silver → Probation' },
  { id: 'AL-009', actor: 'Kavitha Menon', actorRole: 'dispatcher',   action: 'CREATE', resource: 'Exception', resourceId: 'EXC-2024-0894',      at: tH(4),    ip: '10.0.1.45',  result: 'success' },
  { id: 'AL-010', actor: 'Suresh Kumar',  actorRole: 'wh_manager',   action: 'APPROVE',resource: 'Reconciliation',resourceId: 'REC-2024-0443',  at: tH(10),   ip: '10.0.3.17',  result: 'success' },
]

export const ADMIN_KPI = {
  totalUsers:   ADMIN_USERS.length,
  activeUsers:  ADMIN_USERS.filter(u=>u.status==='active').length,
  mfaEnabled:   ADMIN_USERS.filter(u=>u.mfaEnabled).length,
  suspended:    ADMIN_USERS.filter(u=>u.status==='suspended').length,
  configGroups: [...new Set(CONFIG_ENTRIES.map(c=>c.group))].length,
  auditToday:   AUDIT_LOG.filter(a=>Date.now()-Date.parse(a.at)<86400000).length,
}
