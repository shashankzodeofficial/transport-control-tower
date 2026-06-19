import React from 'react'
import {
  ResponsiveContainer,
  BarChart as RechartsBar,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell,
} from 'recharts'
import { cn } from '@/lib/utils'
import { CHART_COLORS } from '@/theme/tokens'

interface BarSeries {
  dataKey: string
  label: string
  color?: string
}

interface BarChartProps {
  data: Record<string, unknown>[]
  xKey: string
  series: BarSeries[]
  height?: number
  horizontal?: boolean
  stacked?: boolean
  showGrid?: boolean
  showLegend?: boolean
  className?: string
}

export function BarChart({
  data,
  xKey,
  series,
  height = 240,
  horizontal = false,
  stacked = false,
  showGrid = true,
  showLegend = false,
  className,
}: BarChartProps) {
  return (
    <div className={cn('w-full', className)} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <RechartsBar
          data={data}
          layout={horizontal ? 'vertical' : 'horizontal'}
          margin={{ top: 4, right: 8, bottom: 4, left: 0 }}
        >
          {showGrid && (
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#F1F5F9"
              vertical={!horizontal}
              horizontal={horizontal}
            />
          )}
          {horizontal ? (
            <>
              <XAxis type="number" tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey={xKey} tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} width={80} />
            </>
          ) : (
            <>
              <XAxis dataKey={xKey} tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
            </>
          )}
          <Tooltip
            contentStyle={{
              fontSize: 12,
              border: '1px solid #E2E8F0',
              borderRadius: 6,
              boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
            }}
          />
          {showLegend && (
            <Legend
              iconType="circle"
              iconSize={8}
              wrapperStyle={{ fontSize: 12 }}
            />
          )}
          {series.map((s, i) => (
            <Bar
              key={s.dataKey}
              dataKey={s.dataKey}
              name={s.label}
              fill={s.color ?? CHART_COLORS[i % CHART_COLORS.length]}
              stackId={stacked ? 'stack' : undefined}
              radius={stacked ? [0, 0, 0, 0] : [3, 3, 0, 0]}
              maxBarSize={40}
            />
          ))}
        </RechartsBar>
      </ResponsiveContainer>
    </div>
  )
}
