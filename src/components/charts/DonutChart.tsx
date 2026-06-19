import React from 'react'
import {
  ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend,
} from 'recharts'
import { cn } from '@/lib/utils'
import { CHART_COLORS } from '@/theme/tokens'

interface DonutSlice {
  name: string
  value: number
  color?: string
}

interface DonutChartProps {
  data: DonutSlice[]
  height?: number
  innerRadius?: number | string
  outerRadius?: number | string
  centerLabel?: string
  centerValue?: string | number
  showLegend?: boolean
  className?: string
}

export function DonutChart({
  data,
  height = 200,
  innerRadius = '60%',
  outerRadius = '80%',
  centerLabel,
  centerValue,
  showLegend = false,
  className,
}: DonutChartProps) {
  return (
    <div className={cn('relative w-full', className)} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={innerRadius}
            outerRadius={outerRadius}
            dataKey="value"
            startAngle={90}
            endAngle={-270}
            paddingAngle={2}
          >
            {data.map((entry, i) => (
              <Cell
                key={`cell-${i}`}
                fill={entry.color ?? CHART_COLORS[i % CHART_COLORS.length]}
                stroke="none"
              />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              fontSize: 12,
              border: '1px solid #E2E8F0',
              borderRadius: 6,
            }}
          />
          {showLegend && (
            <Legend
              iconType="circle"
              iconSize={8}
              wrapperStyle={{ fontSize: 12 }}
            />
          )}
        </PieChart>
      </ResponsiveContainer>

      {/* Center label */}
      {(centerValue != null || centerLabel) && (
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          {centerValue != null && (
            <span className="text-xl font-bold text-slate-800">{centerValue}</span>
          )}
          {centerLabel && (
            <span className="text-xs text-slate-500">{centerLabel}</span>
          )}
        </div>
      )}
    </div>
  )
}
