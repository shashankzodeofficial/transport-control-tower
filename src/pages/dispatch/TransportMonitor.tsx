import React, { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import {
  Truck, MapPin, Clock, Zap, AlertTriangle,
  CheckCircle2, Phone, RefreshCw, ArrowLeft,
  Navigation, Fuel, Activity, ChevronDown,
  ChevronUp, Gauge,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { StatusBadge }   from '@/components/badges/StatusBadge'
import { SLAClock }      from '@/components/shared/SLAClock'
import { VEHICLE_TELEMATICS, getTelematics } from './mock/transportData'
import { getDispatch }   from './mock/dispatches'
import type { VehicleTelematics } from './mock/transportData'

// ─── India SVG Map with vehicle pings ────────────────────────────────────────

const MAP_BOUNDS = { minLat: 8, maxLat: 35, minLng: 68, maxLng: 98 }

function lngToX(lng: number, w = 600) {
  return ((lng - MAP_BOUNDS.minLng) / (MAP_BOUNDS.maxLng - MAP_BOUNDS.minLng)) * w
}
function latToY(lat: number, h = 480) {
  return h - ((lat - MAP_BOUNDS.minLat) / (MAP_BOUNDS.maxLat - MAP_BOUNDS.minLat)) * h
}

function LiveMapView({ vehicles, focused, onSelect }: {
  vehicles: VehicleTelematics[]
  focused: string | null
  onSelect: (id: string) => void
}) {
  return (
    <div className="relative w-full h-full bg-slate-900 rounded-xl overflow-hidden">
      <svg viewBox="0 0 600 480" className="w-full h-full">
        {/* Map grid */}
        {Array.from({ length: 6 }, (_, i) => (
          <line key={`h${i}`} x1={0} y1={i * 80} x2={600} y2={i * 80}
            stroke="rgb(30,41,59)" strokeWidth={1} />
        ))}
        {Array.from({ length: 8 }, (_, i) => (
          <line key={`v${i}`} x1={i * 75} y1={0} x2={i * 75} y2={480}
            stroke="rgb(30,41,59)" strokeWidth={1} />
        ))}

        {/* Simple India silhouette paths (approximate) */}
        <path
          d="M 210 20 L 250 15 L 310 30 L 370 50 L 410 90 L 440 130 L 450 160 L 420 200
             L 400 240 L 380 280 L 360 310 L 330 350 L 290 400 L 270 440 L 250 460
             L 230 440 L 200 400 L 170 350 L 140 310 L 130 270 L 120 230 L 100 180
             L 110 140 L 140 110 L 160 80 L 180 50 Z"
          fill="rgba(30,58,138,0.25)"
          stroke="rgba(59,130,246,0.3)"
          strokeWidth={1.5}
        />
        {/* North-east appendage */}
        <path
          d="M 370 50 L 400 40 L 440 50 L 460 70 L 440 80 L 410 90 Z"
          fill="rgba(30,58,138,0.25)"
          stroke="rgba(59,130,246,0.3)"
          strokeWidth={1}
        />

        {/* Route trails */}
        {vehicles.map(v => {
          if (v.recentPings.length < 2) return null
          const pts = v.recentPings.map(p => `${lngToX(p.lng)},${latToY(p.lat)}`).join(' ')
          const isFocused = focused === v.dispatchId
          return (
            <polyline
              key={`trail-${v.dispatchId}`}
              points={pts}
              fill="none"
              stroke={isFocused ? '#60a5fa' : '#334155'}
              strokeWidth={isFocused ? 2.5 : 1.5}
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray={isFocused ? undefined : '4 3'}
            />
          )
        })}

        {/* Vehicle pins */}
        {vehicles.map(v => {
          const x = lngToX(v.currentLng)
          const y = latToY(v.currentLat)
          const isFocused = focused === v.dispatchId
          const isAlert   = v.alerts.length > 0
          const isOverdue = v.delayMinutes > 60

          return (
            <g
              key={v.dispatchId}
              transform={`translate(${x},${y})`}
              onClick={() => onSelect(v.dispatchId)}
              className="cursor-pointer"
            >
              {/* Pulse ring */}
              {isFocused && (
                <circle r={22} fill="none" stroke="#60a5fa" strokeWidth={2} opacity={0.4}>
                  <animate attributeName="r" values="14;26;14" dur="2s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0.6;0;0.6" dur="2s" repeatCount="indefinite" />
                </circle>
              )}

              {/* Alert ring */}
              {isAlert && (
                <circle r={16} fill="none" stroke={isOverdue ? '#ef4444' : '#f59e0b'} strokeWidth={1.5} />
              )}

              {/* Vehicle marker */}
              <circle
                r={isFocused ? 11 : 8}
                fill={isOverdue ? '#ef4444' : isAlert ? '#f59e0b' : '#22c55e'}
                stroke="white"
                strokeWidth={2}
              />
              <text textAnchor="middle" dominantBaseline="middle" fontSize="9" fill="white" fontWeight="bold" y={1}>
                {v.vehicleReg.slice(-4)}
              </text>

              {/* Tooltip box */}
              {isFocused && (
                <g transform="translate(14,-30)">
                  <rect x={0} y={0} width={120} height={36} rx={6}
                    fill="rgba(15,23,42,0.92)" stroke="#334155" strokeWidth={1}
                  />
                  <text x={8} y={14} fontSize="8.5" fill="#f1f5f9" fontWeight="bold">
                    {v.vehicleReg}
                  </text>
                  <text x={8} y={26} fontSize="8" fill="#94a3b8">
                    {Math.round(v.speedKmh)} km/h · {Math.round(v.progressPct)}%
                  </text>
                </g>
              )}
            </g>
          )
        })}

        {/* City labels */}
        {[
          { name: 'Delhi',     lat: 28.6, lng: 77.2  },
          { name: 'Mumbai',    lat: 19.1, lng: 72.9  },
          { name: 'Bangalore', lat: 12.9, lng: 77.6  },
          { name: 'Chennai',   lat: 13.1, lng: 80.3  },
          { name: 'Kolkata',   lat: 22.6, lng: 88.4  },
          { name: 'Hyderabad', lat: 17.4, lng: 78.5  },
          { name: 'Pune',      lat: 18.5, lng: 73.9  },
        ].map(c => (
          <g key={c.name} transform={`translate(${lngToX(c.lng)},${latToY(c.lat)})`}>
            <circle r={3} fill="#475569" />
            <text x={5} y={4} fontSize="8" fill="#64748b">{c.name}</text>
          </g>
        ))}

        {/* Legend */}
        <g transform="translate(12,440)">
          <circle cx={6}  cy={6} r={5} fill="#22c55e" />
          <text   x={14} y={10} fontSize="9" fill="#94a3b8">On Track</text>
          <circle cx={70} cy={6} r={5} fill="#f59e0b" />
          <text   x={78} y={10} fontSize="9" fill="#94a3b8">Alert</text>
          <circle cx={110} cy={6} r={5} fill="#ef4444" />
          <text   x={118} y={10} fontSize="9" fill="#94a3b8">Delayed</text>
        </g>
      </svg>
    </div>
  )
}

// ─── Vehicle list card ────────────────────────────────────────────────────────

function VehicleCard({ v, isFocused, onClick }: {
  v: VehicleTelematics
  isFocused: boolean
  onClick: () => void
}) {
  const dispatch = getDispatch(v.dispatchId)
  const isOverdue = v.delayMinutes > 60

  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full text-left rounded-xl border p-3.5 transition-all hover:border-blue-300',
        isFocused ? 'border-blue-400 bg-blue-50 shadow-md' : 'border-slate-200 bg-white',
        isOverdue && !isFocused && 'border-red-200',
      )}
    >
      {/* Row 1 — ID + status */}
      <div className="flex items-center justify-between mb-2 gap-2">
        <div className="flex items-center gap-2">
          <Truck size={14} className={cn(isFocused ? 'text-blue-600' : 'text-slate-500')} />
          <span className="font-mono text-xs font-bold text-slate-800">{v.vehicleReg}</span>
          {v.alerts.length > 0 && (
            <span className="flex items-center gap-0.5 rounded-full bg-red-100 px-1.5 py-0.5 text-xxs font-bold text-red-700">
              <AlertTriangle size={9} />{v.alerts.length}
            </span>
          )}
        </div>
        <span className="text-xxs text-slate-400">{v.dispatchId}</span>
      </div>

      {/* Row 2 — route */}
      {dispatch && (
        <p className="text-xxs text-slate-500 mb-2 truncate">
          {dispatch.origin.split(' (')[0]}
          <span className="mx-1 text-slate-300">→</span>
          {dispatch.destination.split(' (')[0]}
        </p>
      )}

      {/* Row 3 — current location */}
      <p className="text-xs text-slate-600 flex items-center gap-1 mb-2 truncate">
        <MapPin size={10} className="shrink-0 text-slate-400" />{v.currentLocation}
      </p>

      {/* Progress bar */}
      <div className="mb-2">
        <div className="flex justify-between text-xxs text-slate-400 mb-1">
          <span>{Math.round(v.distanceCoveredKm)} km done</span>
          <span>{Math.round(v.progressPct)}%</span>
          <span>{Math.round(v.totalDistanceKm - v.distanceCoveredKm)} km left</span>
        </div>
        <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
          <div
            className={cn('h-full rounded-full transition-all', isOverdue ? 'bg-red-500' : 'bg-blue-500')}
            style={{ width: `${Math.min(100, v.progressPct)}%` }}
          />
        </div>
      </div>

      {/* Row 4 — stats */}
      <div className="flex items-center gap-4 text-xxs text-slate-500">
        <span className="flex items-center gap-1">
          <Gauge size={10} />{Math.round(v.speedKmh)} km/h
        </span>
        <span className="flex items-center gap-1">
          <Fuel size={10} />{v.fuelPct}%
        </span>
        <span className="flex items-center gap-1">
          <Clock size={10} />ETA {new Date(v.etaAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
        </span>
        {v.delayMinutes > 0 && (
          <span className={cn(
            'ml-auto flex items-center gap-0.5 font-semibold',
            isOverdue ? 'text-red-600' : 'text-amber-600',
          )}>
            +{Math.round(v.delayMinutes)}min
          </span>
        )}
      </div>
    </button>
  )
}

// ─── Vehicle detail panel ─────────────────────────────────────────────────────

function VehicleDetail({ v }: { v: VehicleTelematics }) {
  const [showCheckpoints, setShowCheckpoints] = useState(true)
  const dispatch = getDispatch(v.dispatchId)

  return (
    <div className="flex flex-col gap-4">
      {/* Carrier + driver */}
      {dispatch && (
        <Section title="Driver & Carrier">
          <Row label="Driver"   value={v.driverName} />
          <Row label="Phone"    value={
            <a href={`tel:${v.driverPhone}`} className="flex items-center gap-1 text-blue-600 hover:underline text-xs">
              <Phone size={11} />{v.driverPhone}
            </a>
          } />
          <Row label="Carrier"  value={dispatch.carrier} />
          <Row label="Dispatch" value={<span className="font-mono font-semibold">{v.dispatchId}</span>} />
        </Section>
      )}

      {/* Telematics */}
      <Section title="Live Telematics">
        <Row label="Speed"        value={`${Math.round(v.speedKmh)} km/h`} />
        <Row label="Heading"      value={`${v.heading}° — ${headingLabel(v.heading)}`} />
        <Row label="Engine"       value={
          <span className={cn(v.engineStatus === 'running' ? 'text-green-600' : 'text-slate-500', 'capitalize font-medium')}>
            {v.engineStatus}
          </span>
        } />
        <Row label="Fuel"         value={
          <div className="flex items-center gap-2 flex-1">
            <div className="flex-1 h-1.5 rounded-full bg-slate-100 overflow-hidden">
              <div
                className={cn('h-full rounded-full', v.fuelPct < 20 ? 'bg-red-500' : v.fuelPct < 40 ? 'bg-amber-500' : 'bg-green-500')}
                style={{ width: `${v.fuelPct}%` }}
              />
            </div>
            <span className="text-xs font-semibold">{v.fuelPct}%</span>
          </div>
        } />
        <Row label="Last Ping"    value={<span className="text-xs text-slate-400">{new Date(v.lastPingAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>} />
        <Row label="Location"     value={`${v.currentLat.toFixed(4)}, ${v.currentLng.toFixed(4)}`} />
      </Section>

      {/* Journey progress */}
      <Section title="Journey Progress">
        <Row label="Covered"      value={`${Math.round(v.distanceCoveredKm)} km`} />
        <Row label="Remaining"    value={`${Math.round(v.totalDistanceKm - v.distanceCoveredKm)} km`} />
        <Row label="Total"        value={`${Math.round(v.totalDistanceKm)} km`} />
        <Row label="ETA"          value={
          <span className={cn('font-semibold', v.delayMinutes > 60 ? 'text-red-600' : v.delayMinutes > 0 ? 'text-amber-600' : 'text-green-600')}>
            {new Date(v.etaAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
          </span>
        } />
        {v.delayMinutes > 0 && (
          <Row label="Delay" value={
            <span className="font-semibold text-amber-600">+{Math.round(v.delayMinutes)} min</span>
          } />
        )}
      </Section>

      {/* Alerts */}
      {v.alerts.length > 0 && (
        <Section title="Active Alerts">
          <div className="space-y-1.5">
            {v.alerts.map((alert, i) => (
              <div key={i} className="flex items-start gap-2 text-xs text-red-700 bg-red-50 rounded-lg px-3 py-2 border border-red-100">
                <AlertTriangle size={13} className="shrink-0 mt-0.5 text-red-500" />
                {alert}
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Checkpoints */}
      <div className="rounded-xl border border-slate-200 overflow-hidden">
        <button
          onClick={() => setShowCheckpoints(!showCheckpoints)}
          className="flex items-center justify-between w-full bg-slate-50 border-b border-slate-200 px-4 py-2.5 hover:bg-slate-100 transition-colors"
        >
          <p className="text-xxs font-semibold uppercase tracking-wide text-slate-500">
            Checkpoints ({v.checkpoints.length})
          </p>
          {showCheckpoints ? <ChevronUp size={13} className="text-slate-400" /> : <ChevronDown size={13} className="text-slate-400" />}
        </button>
        {showCheckpoints && (
          <div className="divide-y divide-slate-100">
            {v.checkpoints.map(cp => (
              <div key={cp.id} className={cn(
                'flex items-start gap-3 px-4 py-3',
                cp.status === 'current' && 'bg-blue-50',
              )}>
                <div className={cn(
                  'mt-0.5 h-2 w-2 rounded-full shrink-0',
                  cp.status === 'passed'   ? 'bg-green-500' :
                  cp.status === 'current'  ? 'bg-blue-500'  :
                  'bg-slate-300',
                )} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-medium text-slate-700 truncate">{cp.name}</p>
                    <span className={cn(
                      'text-xxs font-medium px-1.5 py-0.5 rounded-full shrink-0',
                      cp.status === 'passed'  ? 'bg-green-50 text-green-700' :
                      cp.status === 'current' ? 'bg-blue-50 text-blue-700'  :
                      'bg-slate-100 text-slate-500',
                    )}>
                      {cp.status}
                    </span>
                  </div>
                  <p className="text-xxs text-slate-400 mt-0.5">
                    {cp.distanceFromOriginKm} km from origin ·{' '}
                    {cp.actualAt
                      ? `Actual: ${new Date(cp.actualAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`
                      : `Expected: ${new Date(cp.expectedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`
                    }
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Recent pings mini-table ──────────────────────────────────────────────────

function RecentPings({ v }: { v: VehicleTelematics }) {
  return (
    <Section title={`Recent GPS Pings (${v.recentPings.length})`}>
      <div className="space-y-0 divide-y divide-slate-100">
        {v.recentPings.slice(0, 5).map((ping, i) => (
          <div key={i} className="flex items-center gap-4 py-1.5 text-xxs">
            <span className="text-slate-400 w-32 shrink-0">
              {new Date(ping.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
            <span className="font-mono text-slate-600">{ping.lat.toFixed(4)}, {ping.lng.toFixed(4)}</span>
            <span className="ml-auto text-slate-400">{Math.round(ping.speedKmh)} km/h</span>
          </div>
        ))}
      </div>
    </Section>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export function TransportMonitor() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const focusParam = searchParams.get('focus')

  const [focusedId, setFocusedId] = useState<string | null>(focusParam)
  const [lastRefresh, setLastRefresh] = useState(new Date())
  const [refreshing, setRefreshing] = useState(false)

  const vehicles = VEHICLE_TELEMATICS
  const focused  = focusedId ? getTelematics(focusedId) : null

  // Simulate live refresh
  const refresh = () => {
    setRefreshing(true)
    setTimeout(() => {
      setLastRefresh(new Date())
      setRefreshing(false)
    }, 800)
  }

  useEffect(() => {
    const interval = setInterval(refresh, 30000)
    return () => clearInterval(interval)
  }, [])

  // Stats
  const totalInTransit  = vehicles.length
  const withAlerts      = vehicles.filter(v => v.alerts.length > 0).length
  const delayed60       = vehicles.filter(v => v.delayMinutes > 60).length
  const avgProgress     = Math.round(vehicles.reduce((s, v) => s + v.progressPct, 0) / vehicles.length)

  return (
    <div className="flex flex-col h-full bg-slate-50">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-3.5">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/dispatch/board')}
            className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-blue-600 transition-colors"
          >
            <ArrowLeft size={13} />Workbench
          </button>
          <div className="w-px h-4 bg-slate-200" />
          <div className="flex items-center gap-2">
            <Navigation size={16} className="text-blue-600" />
            <h1 className="text-base font-bold text-slate-900">Live Transport Monitor</h1>
            <span className="flex items-center gap-1 rounded-full bg-green-50 border border-green-200 px-2 py-0.5 text-xxs font-bold text-green-700">
              <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
              LIVE
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Quick KPIs */}
          <div className="flex items-center gap-5 text-center">
            <KPI label="In Transit" value={totalInTransit} />
            <KPI label="With Alerts" value={withAlerts} color={withAlerts > 0 ? 'text-amber-600' : undefined} />
            <KPI label="Delayed >1h" value={delayed60} color={delayed60 > 0 ? 'text-red-600' : undefined} />
            <KPI label="Avg Progress" value={`${avgProgress}%`} />
          </div>

          <button
            onClick={refresh}
            className={cn('flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors', refreshing && 'opacity-60')}
          >
            <RefreshCw size={12} className={cn(refreshing && 'animate-spin')} />
            {lastRefresh.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left — vehicle list */}
        <div className="w-72 shrink-0 border-r border-slate-200 bg-white overflow-y-auto">
          <div className="border-b border-slate-100 px-4 py-2.5">
            <p className="text-xxs font-semibold uppercase tracking-wide text-slate-400">
              {vehicles.length} Vehicles In Transit
            </p>
          </div>
          <div className="p-3 space-y-2">
            {vehicles.map(v => (
              <VehicleCard
                key={v.dispatchId}
                v={v}
                isFocused={focusedId === v.dispatchId}
                onClick={() => setFocusedId(focusedId === v.dispatchId ? null : v.dispatchId)}
              />
            ))}
          </div>
        </div>

        {/* Center — map */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 p-4">
            <LiveMapView
              vehicles={vehicles}
              focused={focusedId}
              onSelect={id => setFocusedId(id === focusedId ? null : id)}
            />
          </div>

          {/* Bottom — focused vehicle quick bar */}
          {focused && (
            <div className="border-t border-slate-200 bg-white px-5 py-3">
              <div className="flex items-center gap-6 flex-wrap">
                <div className="flex items-center gap-2">
                  <Truck size={15} className="text-blue-600" />
                  <span className="font-mono text-sm font-bold text-slate-800">{focused.vehicleReg}</span>
                  <span className="text-xs text-slate-400">{focused.dispatchId}</span>
                </div>
                <div className="flex items-center gap-5 text-xs text-slate-600">
                  <span className="flex items-center gap-1.5">
                    <Gauge size={12} className="text-slate-400" />{Math.round(focused.speedKmh)} km/h
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Activity size={12} className="text-slate-400" />{Math.round(focused.progressPct)}% done
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Clock size={12} className="text-slate-400" />
                    ETA {new Date(focused.etaAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <MapPin size={12} className="text-slate-400" />{focused.currentLocation}
                  </span>
                  {focused.delayMinutes > 0 && (
                    <span className="font-semibold text-amber-600">+{Math.round(focused.delayMinutes)} min delay</span>
                  )}
                </div>
                {focused.alerts.length > 0 && (
                  <div className="flex items-center gap-2 ml-auto">
                    {focused.alerts.map((a, i) => (
                      <span key={i} className="flex items-center gap-1 text-xs text-red-700 bg-red-50 px-2 py-1 rounded-lg border border-red-100">
                        <AlertTriangle size={11} />{a}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right panel — detail when focused */}
        {focused && (
          <div className="w-80 shrink-0 border-l border-slate-200 bg-white overflow-y-auto">
            <div className="sticky top-0 border-b border-slate-100 bg-white px-4 py-2.5 z-10">
              <p className="text-xxs font-semibold uppercase tracking-wide text-slate-400">Vehicle Detail</p>
            </div>
            <div className="p-4 space-y-3">
              <VehicleDetail v={focused} />
              <RecentPings v={focused} />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-slate-200 overflow-hidden">
      <div className="bg-slate-50 border-b border-slate-200 px-4 py-2">
        <p className="text-xxs font-semibold uppercase tracking-wide text-slate-500">{title}</p>
      </div>
      <div className="px-4 py-3">{children}</div>
    </div>
  )
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-1.5 gap-2">
      <span className="text-xs text-slate-500 shrink-0">{label}</span>
      <span className="text-xs text-slate-800 text-right">{value}</span>
    </div>
  )
}

function KPI({ label, value, color }: { label: string; value: string | number; color?: string }) {
  return (
    <div>
      <div className={cn('text-lg font-bold tabular-nums', color ?? 'text-slate-700')}>{value}</div>
      <div className="text-xxs font-medium uppercase tracking-wide text-slate-400">{label}</div>
    </div>
  )
}

function headingLabel(deg: number): string {
  const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW']
  return dirs[Math.round(deg / 45) % 8]
}
