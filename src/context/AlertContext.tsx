import React, { createContext, useContext, useCallback, useState } from 'react'
import type { Alert, AckAction, EscalationLevel } from '@/types'

export interface AcknowledgePayload {
  action: AckAction
  remarks: string
  ackedBy?: string
}

interface AlertContextValue {
  alerts: Alert[]
  unacknowledgedCount: number
  criticalCount: number
  isRailOpen: boolean
  openRail: () => void
  closeRail: () => void
  toggleRail: () => void
  acknowledge: (id: string, payload: AcknowledgePayload) => void
  addAlert: (alert: Alert) => void
  removeAlert: (id: string) => void
}

// ─── Escalation engine ────────────────────────────────────────────────────────

export function getEscalationLevel(delayMins?: number): EscalationLevel | undefined {
  if (!delayMins) return undefined
  if (delayMins >= 480) return 'control_tower'
  if (delayMins >= 240) return 'transport_head'
  if (delayMins >= 120) return 'regional_manager'
  return undefined
}

export const ESCALATION_LABEL: Record<EscalationLevel, string> = {
  regional_manager: 'Regional Manager',
  transport_head:   'Transport Head',
  control_tower:    'Control Tower',
}

export const ESCALATION_THRESHOLD: Record<EscalationLevel, string> = {
  regional_manager: '2h+ delay',
  transport_head:   '4h+ delay',
  control_tower:    '8h+ delay',
}

const AlertContext = createContext<AlertContextValue | null>(null)

export function AlertProvider({ children, initialAlerts = [] }: { children: React.ReactNode; initialAlerts?: Alert[] }) {
  const [alerts, setAlerts]       = useState<Alert[]>(
    // Auto-compute escalation levels on init
    initialAlerts.map(a => ({ ...a, escalationLevel: a.escalationLevel ?? getEscalationLevel(a.delayMins) }))
  )
  const [isRailOpen, setRailOpen] = useState(false)

  const unacknowledgedCount = alerts.filter(a => !a.acknowledged).length
  const criticalCount       = alerts.filter(a => a.severity === 'critical' && !a.acknowledged).length

  const openRail   = useCallback(() => setRailOpen(true),        [])
  const closeRail  = useCallback(() => setRailOpen(false),       [])
  const toggleRail = useCallback(() => setRailOpen(p => !p),     [])

  const acknowledge = useCallback((id: string, payload: AcknowledgePayload) => {
    setAlerts(prev => prev.map(a => a.id === id ? {
      ...a,
      acknowledged: true,
      ackedAt:   new Date().toISOString(),
      ackedBy:   payload.ackedBy ?? 'Shashank Zode',
      ackAction: payload.action,
      ackRemarks: payload.remarks,
    } : a))
  }, [])

  const addAlert = useCallback((alert: Alert) => {
    setAlerts(prev => {
      // Deduplicate by id
      if (prev.some(a => a.id === alert.id)) return prev
      // Keep latest 50 alerts
      return [alert, ...prev].slice(0, 50)
    })
    // Auto-open rail on new critical alert
    if (alert.severity === 'critical') setRailOpen(true)
  }, [])

  const removeAlert = useCallback((id: string) => {
    setAlerts(prev => prev.filter(a => a.id !== id))
  }, [])

  return (
    <AlertContext.Provider value={{
      alerts, unacknowledgedCount, criticalCount,
      isRailOpen, openRail, closeRail, toggleRail,
      acknowledge, addAlert, removeAlert,
    }}>
      {children}
    </AlertContext.Provider>
  )
}

export function useAlerts(): AlertContextValue {
  const ctx = useContext(AlertContext)
  if (!ctx) throw new Error('useAlerts must be used inside AlertProvider')
  return ctx
}
