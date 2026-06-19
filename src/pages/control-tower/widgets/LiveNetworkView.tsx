import React, { useState } from 'react'
import { MapPin, Truck, AlertTriangle, TrendingUp } from 'lucide-react'
import { cn } from '@/lib/utils'
import { NETWORK_NODES, REGION_SUMMARY, type NetworkNode } from '../mock/data'

const REGION_COLORS = {
  north: '#3B82F6',
  south: '#10B981',
  west:  '#F59E0B',
  east:  '#8B5CF6',
}

const NODE_POSITIONS: Record<string, { x: number; y: number }> = {
  DEL: { x: 38, y: 22 },
  LKO: { x: 52, y: 28 },
  JAI: { x: 28, y: 30 },
  KOL: { x: 72, y: 34 },
  AMD: { x: 22, y: 42 },
  MUM: { x: 20, y: 58 },
  PUN: { x: 24, y: 62 },
  HYD: { x: 46, y: 62 },
  BLR: { x: 40, y: 75 },
  CHE: { x: 50, y: 78 },
}

export function LiveNetworkView() {
  const [selected, setSelected] = useState<NetworkNode | null>(null)
  const [filter, setFilter] = useState<'all' | 'north' | 'south' | 'east' | 'west'>('all')

  const totalVehicles   = NETWORK_NODES.reduce((s, n) => s + n.activeVehicles, 0)
  const totalExceptions = NETWORK_NODES.reduce((s, n) => s + n.exceptions, 0)

  const visibleNodes = filter === 'all'
    ? NETWORK_NODES
    : NETWORK_NODES.filter(n => n.region === filter)

  return (
    <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
        <div>
          <h3 className="text-sm font-semibold text-slate-800">Live Network View</h3>
          <p className="text-xs text-slate-400 mt-0.5">{totalVehicles} vehicles active across {NETWORK_NODES.length} nodes</p>
        </div>
        <div className="flex items-center gap-1">
          {(['all', 'north', 'south', 'east', 'west'] as const).map(r => (
            <button
              key={r}
              onClick={() => setFilter(r)}
              className={cn(
                'rounded px-2.5 py-1 text-xs font-medium capitalize transition-colors',
                filter === r
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-500 hover:bg-slate-100',
              )}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-5">
        {/* SVG Map — India outline approximation */}
        <div className="col-span-3 relative bg-slate-50 border-r border-slate-100" style={{ height: 340 }}>
          <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full" preserveAspectRatio="xMidYMid meet">
            {/* India rough outline */}
            <path
              d="M30 15 L45 12 L58 14 L70 20 L78 30 L80 42 L75 54 L68 62 L62 72 L55 82 L50 88 L46 84 L42 78 L36 70 L30 60 L22 50 L18 40 L20 28 Z"
              fill="#F1F5F9"
              stroke="#CBD5E1"
              strokeWidth="0.5"
            />

            {/* Connector lines between major hubs */}
            {[
              ['DEL', 'MUM'], ['DEL', 'HYD'], ['DEL', 'KOL'], ['DEL', 'LKO'],
              ['MUM', 'BLR'], ['MUM', 'PUN'], ['MUM', 'AMD'],
              ['BLR', 'CHE'], ['BLR', 'HYD'], ['HYD', 'CHE'],
            ].map(([a, b]) => {
              const pa = NODE_POSITIONS[a]
              const pb = NODE_POSITIONS[b]
              if (!pa || !pb) return null
              return (
                <line
                  key={`${a}-${b}`}
                  x1={pa.x} y1={pa.y} x2={pb.x} y2={pb.y}
                  stroke="#CBD5E1"
                  strokeWidth="0.4"
                  strokeDasharray="1 1"
                />
              )
            })}

            {/* Nodes */}
            {NETWORK_NODES.map(node => {
              const pos  = NODE_POSITIONS[node.id]
              const col  = REGION_COLORS[node.region]
              const dim  = filter !== 'all' && node.region !== filter
              const size = node.type === 'hub' ? 3.2 : 2.2
              if (!pos) return null
              return (
                <g
                  key={node.id}
                  transform={`translate(${pos.x},${pos.y})`}
                  onClick={() => setSelected(selected?.id === node.id ? null : node)}
                  style={{ cursor: 'pointer', opacity: dim ? 0.25 : 1 }}
                >
                  {/* Pulse ring for nodes with exceptions */}
                  {node.exceptions > 0 && !dim && (
                    <circle r={size + 2} fill={col} opacity={0.15}>
                      <animate attributeName="r" values={`${size + 1};${size + 3};${size + 1}`} dur="2s" repeatCount="indefinite" />
                      <animate attributeName="opacity" values="0.2;0.05;0.2" dur="2s" repeatCount="indefinite" />
                    </circle>
                  )}
                  <circle
                    r={size}
                    fill={selected?.id === node.id ? '#1E3A5F' : col}
                    stroke="#fff"
                    strokeWidth="0.6"
                  />
                  {/* Exception dot */}
                  {node.exceptions > 0 && (
                    <circle cx={size * 0.7} cy={-size * 0.7} r="1.2" fill="#DC2626" stroke="#fff" strokeWidth="0.4" />
                  )}
                  <text
                    y={size + 2.5}
                    textAnchor="middle"
                    fontSize="2.2"
                    fill="#475569"
                    fontWeight="500"
                  >
                    {node.id}
                  </text>
                </g>
              )
            })}
          </svg>

          {/* Legend */}
          <div className="absolute bottom-3 left-3 flex items-center gap-3">
            {Object.entries(REGION_COLORS).map(([r, c]) => (
              <div key={r} className="flex items-center gap-1">
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: c }} />
                <span className="text-xxs capitalize text-slate-500">{r}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right panel */}
        <div className="col-span-2 flex flex-col">
          {/* Region summary */}
          <div className="border-b border-slate-100 p-4 space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-3">Region Summary</p>
            {REGION_SUMMARY.map(r => (
              <div key={r.region} className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: r.color }} />
                <span className="w-12 text-xs text-slate-600">{r.region}</span>
                <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${r.onTime}%`, backgroundColor: r.color }} />
                </div>
                <span className="text-xs font-medium text-slate-700 w-8 text-right">{r.onTime}%</span>
                {r.exceptions > 0 && (
                  <span className="text-xxs rounded-full bg-red-100 px-1.5 text-red-600 font-semibold">
                    {r.exceptions}
                  </span>
                )}
              </div>
            ))}
          </div>

          {/* Node detail or list */}
          <div className="flex-1 overflow-y-auto p-4">
            {selected ? (
              <NodeDetail node={selected} onClose={() => setSelected(null)} />
            ) : (
              <div className="space-y-1.5">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-2">
                  Top Active Nodes
                </p>
                {NETWORK_NODES
                  .filter(n => filter === 'all' || n.region === filter)
                  .sort((a, b) => b.activeVehicles - a.activeVehicles)
                  .slice(0, 6)
                  .map(node => (
                    <button
                      key={node.id}
                      onClick={() => setSelected(node)}
                      className="w-full flex items-center gap-2 rounded-lg px-3 py-2 hover:bg-slate-50 text-left transition-colors"
                    >
                      <MapPin size={12} className="text-slate-400 shrink-0" style={{ color: REGION_COLORS[node.region] }} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium text-slate-700">{node.id}</span>
                          <div className="flex items-center gap-1.5">
                            <span className="flex items-center gap-0.5 text-xs text-slate-500">
                              <Truck size={10} />{node.activeVehicles}
                            </span>
                            {node.exceptions > 0 && (
                              <span className="flex items-center gap-0.5 text-xs text-red-500">
                                <AlertTriangle size={10} />{node.exceptions}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="h-1 mt-1 rounded-full bg-slate-100 overflow-hidden">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${node.utilPct}%`,
                              backgroundColor: node.utilPct > 85 ? '#F59E0B' : REGION_COLORS[node.region],
                            }}
                          />
                        </div>
                      </div>
                    </button>
                  ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function NodeDetail({ node, onClose }: { node: NetworkNode; onClose: () => void }) {
  const col = REGION_COLORS[node.region]
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full" style={{ backgroundColor: col }} />
          <span className="text-sm font-semibold text-slate-800">{node.id}</span>
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xxs font-medium text-slate-500 capitalize">{node.type}</span>
        </div>
        <button onClick={onClose} className="text-xs text-slate-400 hover:text-slate-600">✕</button>
      </div>
      <p className="text-xs text-slate-500 mb-3">{node.label}</p>
      <div className="space-y-2">
        {[
          { label: 'Active Vehicles',   value: node.activeVehicles,   icon: <Truck size={12} /> },
          { label: 'Pending Arrivals',  value: node.pendingArrivals,  icon: <MapPin size={12} /> },
          { label: 'Open Exceptions',   value: node.exceptions,        icon: <AlertTriangle size={12} /> },
          { label: 'Utilisation',        value: `${node.utilPct}%`,    icon: <TrendingUp size={12} /> },
        ].map(row => (
          <div key={row.label} className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-xs text-slate-500">
              <span className="text-slate-400">{row.icon}</span>{row.label}
            </span>
            <span className={cn(
              'text-xs font-semibold',
              row.label === 'Open Exceptions' && node.exceptions > 0 ? 'text-red-600' : 'text-slate-700',
            )}>
              {row.value}
            </span>
          </div>
        ))}
        <div className="pt-1">
          <div className="flex justify-between mb-1">
            <span className="text-xxs text-slate-400">Utilisation</span>
            <span className="text-xxs font-medium" style={{ color: col }}>{node.utilPct}%</span>
          </div>
          <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
            <div className="h-full rounded-full transition-all" style={{ width: `${node.utilPct}%`, backgroundColor: col }} />
          </div>
        </div>
      </div>
    </div>
  )
}
