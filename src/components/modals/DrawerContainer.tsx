import React, { useEffect, useCallback } from 'react'
import { X, ChevronLeft } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useDrawer } from '@/context/DrawerContext'
import { TabStrip } from '@/layout/TabStrip'

const WIDTH_BY_DEPTH: Record<number, string> = {
  1: 'w-drawer-lg',   // 620px
  2: 'w-drawer-md',   // 560px
  3: 'w-drawer-sm',   // 480px
}

const OFFSET_BY_DEPTH: Record<number, string> = {
  1: 'right-0',
  2: 'right-[60px]',
  3: 'right-[120px]',
}

export function DrawerContainer() {
  const { stack, popDrawer, closeAll, setActiveTab } = useDrawer()

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape' && stack.length > 0) popDrawer()
  }, [stack, popDrawer])

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  if (stack.length === 0) return null

  return (
    <>
      {/* Overlay — only behind bottom drawer */}
      <div
        className="fixed inset-0 z-overlay bg-slate-900/30"
        onClick={closeAll}
        aria-hidden
      />

      {stack.map((drawer, idx) => {
        const depth    = idx + 1
        const isTop    = idx === stack.length - 1
        const widthCls = WIDTH_BY_DEPTH[Math.min(depth, 3)]
        const offsetCls = OFFSET_BY_DEPTH[Math.min(depth, 3)]

        return (
          <div
            key={drawer.id}
            role="dialog"
            aria-modal
            aria-labelledby={`drawer-title-${drawer.id}`}
            className={cn(
              'fixed top-0 bottom-0 z-drawer flex flex-col bg-white shadow-2xl',
              'animate-slide-in-right',
              widthCls,
              offsetCls,
            )}
          >
            {/* Header */}
            <div className="flex items-center gap-3 border-b border-slate-200 px-5 py-3">
              {depth > 1 && (
                <button
                  onClick={popDrawer}
                  aria-label="Go back"
                  className="flex h-7 w-7 items-center justify-center rounded text-slate-400 hover:bg-slate-100 transition-colors"
                >
                  <ChevronLeft size={16} />
                </button>
              )}

              {/* Breadcrumb */}
              {drawer.breadcrumb && drawer.breadcrumb.length > 0 && (
                <p className="text-xs text-slate-400">
                  {drawer.breadcrumb.map(b => b.label).join(' / ')} /
                </p>
              )}

              <h2
                id={`drawer-title-${drawer.id}`}
                className="flex-1 text-sm font-semibold text-slate-800 truncate"
              >
                {drawer.title}
              </h2>

              <button
                onClick={closeAll}
                aria-label="Close drawer"
                className="flex h-7 w-7 items-center justify-center rounded text-slate-400 hover:bg-slate-100 transition-colors"
              >
                <X size={15} />
              </button>
            </div>

            {/* Tabs */}
            {drawer.tabs && drawer.tabs.length > 0 && isTop && (
              <TabStrip
                tabs={drawer.tabs.map(t => ({ key: t.key, label: t.label }))}
                activeTab={drawer.activeTab ?? drawer.tabs[0].key}
                onChange={tab => setActiveTab(tab)}
                variant="drawer"
              />
            )}

            {/* Content placeholder — filled by consuming screens */}
            <div className="flex-1 overflow-y-auto">
              {/* Children injected via DrawerContext entity+id pattern by page screens */}
            </div>
          </div>
        )
      })}
    </>
  )
}
