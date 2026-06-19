import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // ── Brand ────────────────────────────────────────────────
        brand: {
          primary: '#1E3A5F',   // Navy — nav active, primary buttons
          accent:  '#3B82F6',   // Blue-500 — links, focus, CTAs
          surface: '#0F172A',   // Slate-900 — top nav dark bg
        },
        // ── Dispatch Status ───────────────────────────────────────
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
        // ── Exception Severity ────────────────────────────────────
        severity: {
          critical:    '#DC2626',
          'critical-bg': '#FEE2E2',
          high:        '#EA580C',
          'high-bg':   '#FFEDD5',
          medium:      '#D97706',
          'medium-bg': '#FEF3C7',
          low:         '#16A34A',
          'low-bg':    '#DCFCE7',
          info:        '#2563EB',
          'info-bg':   '#DBEAFE',
        },
        // ── Planning Scenarios ────────────────────────────────────
        scenario: {
          a: '#7C3AED',   // violet — lowest cost
          b: '#2563EB',   // blue   — balanced
          c: '#D97706',   // amber  — fastest
        },
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Courier New', 'monospace'],
      },
      fontSize: {
        'xxs': ['10px', { lineHeight: '16px', letterSpacing: '0.4px' }],
      },
      spacing: {
        '18': '4.5rem',
        '22': '5.5rem',
      },
      width: {
        'nav':           '220px',
        'nav-collapsed': '56px',
        'drawer-lg':     '620px',
        'drawer-md':     '560px',
        'drawer-sm':     '480px',
      },
      height: {
        'topnav':    '56px',
        'breadcrumb':'36px',
        'pageheader':'52px',
        'tabstrip':  '44px',
      },
      zIndex: {
        'dropdown': '200',
        'drawer':   '300',
        'modal':    '400',
        'overlay':  '500',
        'alert':    '600',
        'toast':    '700',
      },
      keyframes: {
        'slide-in-right': {
          '0%':   { transform: 'translateX(100%)' },
          '100%': { transform: 'translateX(0)' },
        },
        'slide-out-right': {
          '0%':   { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(100%)' },
        },
        'fade-in': {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'scale-in': {
          '0%':   { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        'pulse-ring': {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(220, 38, 38, 0.4)' },
          '50%':      { boxShadow: '0 0 0 8px rgba(220, 38, 38, 0)' },
        },
        'skeleton': {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'count-up': {
          '0%':   { opacity: '0', transform: 'translateY(4px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'slide-in-right':  'slide-in-right 250ms cubic-bezier(0.4,0,0.2,1)',
        'slide-out-right': 'slide-out-right 200ms ease',
        'fade-in':         'fade-in 200ms ease',
        'scale-in':        'scale-in 200ms ease',
        'pulse-ring':      'pulse-ring 1s ease-in-out infinite',
        'skeleton':        'skeleton 1.5s ease-in-out infinite',
        'count-up':        'count-up 400ms ease',
      },
      transitionDuration: {
        'fast': '150ms',
        'base': '200ms',
        'slow': '300ms',
      },
      boxShadow: {
        'xs':    '0 1px 2px rgba(0,0,0,0.05)',
        'card':  '0 1px 3px rgba(0,0,0,0.10), 0 1px 2px rgba(0,0,0,0.06)',
        'panel': '0 4px 6px rgba(0,0,0,0.07), 0 2px 4px rgba(0,0,0,0.06)',
        'drawer':'0 10px 15px rgba(0,0,0,0.10), 0 4px 6px rgba(0,0,0,0.05)',
        'modal': '0 20px 25px rgba(0,0,0,0.10), 0 10px 10px rgba(0,0,0,0.04)',
      },
    },
  },
  plugins: [],
}

export default config
