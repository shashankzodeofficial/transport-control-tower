import React, { createContext, useContext, useCallback, useState } from 'react'
import type { Alert } from '@/types'

interface AlertContextValue {
  alerts: Alert[]
  unacknowledgedCount: number
  criticalCount: number
  isRailOpen: boolean
  openRail: () => void
  closeRail: () => void
  toggleRail: () => void
  acknowledge: (id: string) => void
  acknowledgeAll: () => void
  addAlert: (alert: Alert) => void   // for polling / push
  removeAlert: (id: string) => void
}

const AlertContext = createContext<AlertContextValue | null>(null)

export function AlertProvider({ children, initialAlerts = [] }: { children: React.ReactNode; initialAlerts?: Alert[] }) {
  const [alerts, setAlerts]       = useState<Alert[]>(initialAlerts)
  const [isRailOpen, setRailOpen] = useState(false)

  const unacknowledgedCount = alerts.filter(a => !a.acknowledged).length
  const criticalCount       = alerts.filter(a => a.severity === 'critical' && !a.acknowledged).length

  const openRail   = useCallback(() => setRailOpen(true),        [])
  const closeRail  = useCallback(() => setRailOpen(false),       [])
  const toggleRail = useCallback(() => setRailOpen(p => !p),     [])

  const acknowledge = useCallback((id: string) => {
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, acknowledged: true } : a))
  }, [])

  const acknowledgeAll = useCallback(() => {
    setAlerts(prev => prev.map(a => ({ ...a, acknowledged: true })))
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
      acknowledge, acknowledgeAll, addAlert, removeAlert,
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
