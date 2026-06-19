import React, { createContext, useContext, useCallback, useState } from 'react'
import type { BreadcrumbItem, DrawerTab } from '@/types'

// ─── Types ────────────────────────────────────────────────────────────────────

export type DrawerEntity = 'dispatch' | 'route' | 'carrier' | 'exception' | 'hu'

export interface DrawerState {
  entity: DrawerEntity
  id: string
  title: string
  tabs?: DrawerTab[]
  activeTab?: string
  breadcrumb?: BreadcrumbItem[]
}

interface DrawerContextValue {
  stack: DrawerState[]
  isOpen: boolean
  topDrawer: DrawerState | null
  openDrawer: (state: DrawerState) => void
  pushDrawer: (state: DrawerState) => void   // stacks on top
  popDrawer:  () => void
  closeAll:   () => void
  setActiveTab: (tab: string) => void
}

// ─── Context ──────────────────────────────────────────────────────────────────

const DrawerContext = createContext<DrawerContextValue | null>(null)

export function DrawerProvider({ children }: { children: React.ReactNode }) {
  const [stack, setStack] = useState<DrawerState[]>([])

  const isOpen    = stack.length > 0
  const topDrawer = stack[stack.length - 1] ?? null

  const openDrawer = useCallback((state: DrawerState) => {
    setStack([state])
  }, [])

  const pushDrawer = useCallback((state: DrawerState) => {
    setStack(prev => {
      if (prev.length >= 3) return prev  // max 3 deep
      return [...prev, state]
    })
  }, [])

  const popDrawer = useCallback(() => {
    setStack(prev => prev.slice(0, -1))
  }, [])

  const closeAll = useCallback(() => setStack([]), [])

  const setActiveTab = useCallback((tab: string) => {
    setStack(prev => {
      if (prev.length === 0) return prev
      const next = [...prev]
      next[next.length - 1] = { ...next[next.length - 1], activeTab: tab }
      return next
    })
  }, [])

  return (
    <DrawerContext.Provider value={{
      stack, isOpen, topDrawer,
      openDrawer, pushDrawer, popDrawer, closeAll, setActiveTab,
    }}>
      {children}
    </DrawerContext.Provider>
  )
}

export function useDrawer(): DrawerContextValue {
  const ctx = useContext(DrawerContext)
  if (!ctx) throw new Error('useDrawer must be used inside DrawerProvider')
  return ctx
}
