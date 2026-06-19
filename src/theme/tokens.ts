// ─────────────────────────────────────────────────────────────────────────────
// Design Tokens — TypeScript source of truth, mirrors tailwind.config.ts
// Use these constants when you need values in JS (e.g. Recharts colors)
// ─────────────────────────────────────────────────────────────────────────────

export const COLOR = {
  // Brand
  brandPrimary:  '#1E3A5F',
  brandAccent:   '#3B82F6',
  brandSurface:  '#0F172A',

  // Status semantic
  success:       '#16A34A',
  successBg:     '#F0FDF4',
  warning:       '#D97706',
  warningBg:     '#FFFBEB',
  danger:        '#DC2626',
  dangerBg:      '#FEF2F2',
  info:          '#2563EB',
  infoBg:        '#EFF6FF',
  neutral:       '#6B7280',
  neutralBg:     '#F9FAFB',

  // Dispatch status
  dispatch: {
    planned:    '#6B7280',
    ready:      '#8B5CF6',
    dispatched: '#2563EB',
    transit:    '#0891B2',
    arrived:    '#D97706',
    unloading:  '#EA580C',
    reconciled: '#16A34A',
    closed:     '#9CA3AF',
  },

  // Exception severity
  severity: {
    critical:    '#DC2626',
    criticalBg:  '#FEE2E2',
    high:        '#EA580C',
    highBg:      '#FFEDD5',
    medium:      '#D97706',
    mediumBg:    '#FEF3C7',
    low:         '#16A34A',
    lowBg:       '#DCFCE7',
    info:        '#2563EB',
    infoBg:      '#DBEAFE',
  },

  // Route grades
  grade: {
    A: '#16A34A',
    B: '#2563EB',
    C: '#D97706',
    D: '#EA580C',
    F: '#DC2626',
  },

  // Planning scenarios
  scenario: {
    a: '#7C3AED',
    b: '#2563EB',
    c: '#D97706',
  },

  // Surface
  canvas:   '#F1F5F9',
  card:     '#FFFFFF',
  elevated: '#FFFFFF',

  // Border
  border:       '#E2E8F0',
  borderStrong: '#CBD5E1',
  borderFocus:  '#3B82F6',

  // Text
  textPrimary:   '#0F172A',
  textSecondary: '#475569',
  textMuted:     '#94A3B8',
  textInverse:   '#F1F5F9',
} as const

export const CHART_COLORS = [
  COLOR.brandAccent,
  COLOR.success,
  COLOR.warning,
  COLOR.danger,
  COLOR.dispatch.transit,
  COLOR.dispatch.ready,
  COLOR.dispatch.unloading,
  COLOR.neutral,
] as const

// KPI status thresholds
export const KPI_THRESHOLDS = {
  otd: { good: 90, warn: 75 },
  ota: { good: 90, warn: 75 },
  sla: { good: 90, warn: 75 },
  exceptions: { good: 0, warn: 5 },
  vehicleUtil: { good: 70, warn: 50 },
  costPerDispatch: { good: 3000, warn: 5000 },
} as const

export type StatusType = 'healthy' | 'warning' | 'danger' | 'info' | 'neutral'
export type DispatchStatus = keyof typeof COLOR.dispatch
export type SeverityLevel = 'critical' | 'high' | 'medium' | 'low' | 'info'
export type RouteGrade = 'A' | 'B' | 'C' | 'D' | 'F'
export type TrendDirection = 'up' | 'down' | 'stable'
