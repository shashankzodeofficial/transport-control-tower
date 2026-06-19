import React from 'react'
import {
  ResponsiveContainer, LineChart, Line, Tooltip,
} from 'recharts'
import { cn } from '@/lib/utils'
import { CHART_COLORS } from '@/theme/tokens'

interface SparklineChartProps {
  data: number[]
  color?: string
  height?: number
  showTooltip?: boolean
  className?: string
}

export function SparklineChart({
  data,
  color = CHART_COLORS[0],
  height = 40,
  showTooltip = false,
  className,
}: SparklineChartProps) {
  const chartData = data.map((v, i) => ({ i, v }))

  return (
    <div className={cn('w-full', className)} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 2, right: 2, bottom: 2, left: 2 }}>
          <Line
            type="monotone"
            dataKey="v"
            stroke={color}
            strokeWidth={1.5}
            dot={false}
            isAnimationActive={false}
          />
          {showTooltip && (
            <Tooltip
              contentStyle={{
                fontSize: 11,
                padding: '2px 8px',
                border: '1px solid #E2E8F0',
                borderRadius: 4,
              }}
              labelFormatter={() => ''}
              formatter={(v: number) => [v, '']}
            />
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
