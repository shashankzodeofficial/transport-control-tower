import React from 'react'
import { Plus, Upload, Download, Trash2, Settings2, RefreshCw } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ToolbarAction {
  key: string
  label: string
  icon?: React.ReactNode
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
  disabled?: boolean
  onClick: () => void
}

interface TableToolbarProps {
  title?: string
  actions?: ToolbarAction[]
  selectedCount?: number
  onAdd?: () => void
  onBulkUpload?: () => void
  onExport?: () => void
  onDelete?: () => void
  onRefresh?: () => void
  onColumnConfig?: () => void
  addLabel?: string
  className?: string
  children?: React.ReactNode
}

export function TableToolbar({
  title,
  actions = [],
  selectedCount = 0,
  onAdd,
  onBulkUpload,
  onExport,
  onDelete,
  onRefresh,
  onColumnConfig,
  addLabel = 'Add',
  className,
  children,
}: TableToolbarProps) {
  return (
    <div className={cn(
      'flex items-center gap-2 border-b border-slate-200 bg-slate-50 px-4 py-2.5',
      className,
    )}>
      {title && (
        <span className="text-sm font-semibold text-slate-700 mr-2">{title}</span>
      )}

      {/* Selected count chip */}
      {selectedCount > 0 && (
        <span className="flex items-center gap-1.5 rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-700">
          {selectedCount} selected
        </span>
      )}

      {/* Left actions */}
      <div className="flex items-center gap-1.5">
        {onAdd && (
          <ToolbarBtn
            onClick={onAdd}
            icon={<Plus size={14} />}
            label={addLabel}
            variant="primary"
          />
        )}
        {onBulkUpload && (
          <ToolbarBtn onClick={onBulkUpload} icon={<Upload size={14} />} label="Bulk Upload" />
        )}
        {onExport && (
          <ToolbarBtn onClick={onExport} icon={<Download size={14} />} label="Export" />
        )}
        {onDelete && (
          <ToolbarBtn
            onClick={onDelete}
            icon={<Trash2 size={14} />}
            label="Delete"
            variant="danger"
            disabled={selectedCount === 0}
          />
        )}
        {actions.map(action => (
          <ToolbarBtn key={action.key} {...action} />
        ))}
        {children}
      </div>

      {/* Right actions */}
      <div className="ml-auto flex items-center gap-1">
        {onColumnConfig && (
          <button
            onClick={onColumnConfig}
            title="Configure columns"
            aria-label="Configure columns"
            className="flex h-7 w-7 items-center justify-center rounded text-slate-400 hover:bg-slate-200 hover:text-slate-600 transition-colors"
          >
            <Settings2 size={14} />
          </button>
        )}
        {onRefresh && (
          <button
            onClick={onRefresh}
            title="Refresh"
            aria-label="Refresh data"
            className="flex h-7 w-7 items-center justify-center rounded text-slate-400 hover:bg-slate-200 hover:text-slate-600 transition-colors"
          >
            <RefreshCw size={14} />
          </button>
        )}
      </div>
    </div>
  )
}

function ToolbarBtn({
  label, icon, variant = 'secondary', disabled = false, onClick,
}: {
  label: string; icon?: React.ReactNode; variant?: string; disabled?: boolean; onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'flex h-7 items-center gap-1.5 rounded px-2.5 text-xs font-medium transition-colors',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        variant === 'primary'   && 'bg-blue-600 text-white hover:bg-blue-700',
        variant === 'danger'    && 'text-red-600 hover:bg-red-50',
        variant === 'ghost'     && 'text-slate-600 hover:bg-slate-200',
        (!variant || variant === 'secondary') && 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50',
      )}
    >
      {icon}
      {label}
    </button>
  )
}
