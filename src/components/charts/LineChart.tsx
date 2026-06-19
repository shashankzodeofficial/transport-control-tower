import React from 'react'
import {
  ResponsiveContainer,
  LineChart as RechartsLine,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
} from 'recharts'
import { cn } from '@/lib/utils'
import { CHART_COLORS } from '@/theme/tokens'

interface LineSeries {
  dataKey: string
  label: string
  color?: string
  dashed?: boolean
}

interface LineChartProps {
  data: Record<string, unknown>[]
  xKey: string
  series: LineSeries[]
  height?: number
  showGrid?: boolean
  showLegend?: boolean
  referenceLines?: { value: number; label?: string; color?: string }[]
  yDomain?: [number | 'auto' | 'dataMin' | 'dataMax', number | 'auto' | 'dataMin' | 'dataMax']
  className?: string
}

export function LineChart({
  data,
  xKey,
  series,
  height = 240,
  showGrid = true,
  showLegend = false,
  referenceLines = [],
  yDomain,
  className,
}: LineChartProps) {
  return (
    <div className={cn('w-full', className)} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <RechartsLine
          data={data}
          margin={{ top: 4, right: 8, bottom: 4, left: 0 }}
        >
          {showGrid && (
            <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
          )}
          <XAxis
            dataKey={xKey}
            tick={{ fontSize: 11, fill: '#94A3B8' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: '#94A3B8' }}
            axisLine={false}
            tickLine={false}
            domain={yDomain}
          />
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
          {referenceLines.map((rl, i) => (
            <ReferenceLine
              key={i}
              y={rl.value}
              stroke={rl.color ?? '#94A3B8'}
              strokeDasharray="4 4"
              label={rl.label ? { value: rl.label, fontSize: 10, fill: '#94A3B8' } : undefined}
            />
          ))}
          {series.map((s, i) => (
            <Line
              key={s.dataKey}
              type="monotone"
              dataKey={s.dataKey}
              name={s.label}
              stroke={s.color ?? CHART_COLORS[i % CHART_COLORS.length]}
              strokeWidth={2}
              strokeDasharray={s.dashed ? '5 5' : undefined}
              dot={false}
              activeDot={{ r: 4, strokeWidth: 0 }}
            />
          ))}
        </RechartsLine>
      </ResponsiveContainer>
    </div>
  )
}
