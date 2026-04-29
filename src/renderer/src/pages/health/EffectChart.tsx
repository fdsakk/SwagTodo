import { useCallback, useMemo, useRef, useState } from 'react'
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
  ReferenceArea
} from 'recharts'
import type { MedicationLog, PkSettings } from '@renderer/types'
import { generateDailyChartData } from '@renderer/utils/pharmacokinetics'
import { today } from './utils'

interface EffectChartProps {
  logs: MedicationLog[]
  selectedDate: string
  pkSettings: PkSettings
}

export function EffectChart({
  logs,
  selectedDate,
  pkSettings
}: EffectChartProps): React.JSX.Element {
  const [chartWidth, setChartWidth] = useState(600)
  const roRef = useRef<ResizeObserver | null>(null)
  const containerRef = useCallback((node: HTMLDivElement | null) => {
    roRef.current?.disconnect()
    if (!node) return
    roRef.current = new ResizeObserver(([entry]) => setChartWidth(entry.contentRect.width))
    roRef.current.observe(node)
  }, [])

  const chartStepMinutes = chartWidth < 700 ? 10 : 5

  const chartData = useMemo(
    () => generateDailyChartData(logs, selectedDate, pkSettings, { stepMinutes: chartStepMinutes }),
    [logs, selectedDate, pkSettings, chartStepMinutes]
  )

  const xTickInterval = chartWidth < 700 ? 17 : chartWidth < 1000 ? 23 : 11

  const nowLabel = useMemo(() => {
    if (selectedDate !== today()) return null
    const n = new Date()
    const roundedMin = Math.round(n.getMinutes() / chartStepMinutes) * chartStepMinutes
    const h = roundedMin === 60 ? n.getHours() + 1 : n.getHours()
    const m = roundedMin === 60 ? 0 : roundedMin
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
  }, [selectedDate, chartStepMinutes])

  const { yDomain, yTicks, crashSegments } = useMemo(() => {
    let maxEffect = 0
    for (const pt of chartData) {
      if (pt.concentration > maxEffect) maxEffect = pt.concentration
    }
    const ceiling = Math.max(1, Math.ceil(maxEffect))
    const ticks: number[] = []
    for (let i = 0; i <= ceiling; i++) ticks.push(i)

    const rawSegments: { x1: string; x2: string; i1: number; i2: number }[] = []
    let segStart: string | null = null
    let segStartIdx = -1
    for (let i = 0; i < chartData.length; i++) {
      const pt = chartData[i]
      if (pt.crashRisk && !segStart) {
        segStart = pt.timeLabel
        segStartIdx = i
      } else if (!pt.crashRisk && segStart) {
        rawSegments.push({
          x1: segStart,
          x2: chartData[i - 1].timeLabel,
          i1: segStartIdx,
          i2: i - 1
        })
        segStart = null
        segStartIdx = -1
      }
    }
    if (segStart)
      rawSegments.push({
        x1: segStart,
        x2: chartData[chartData.length - 1].timeLabel,
        i1: segStartIdx,
        i2: chartData.length - 1
      })

    const MERGE_GAP = 6
    const segments: { x1: string; x2: string }[] = []
    for (let j = 0; j < rawSegments.length; j++) {
      let seg = rawSegments[j]
      while (j + 1 < rawSegments.length && rawSegments[j + 1].i1 - seg.i2 <= MERGE_GAP) {
        j++
        seg = { ...seg, x2: rawSegments[j].x2, i2: rawSegments[j].i2 }
      }
      segments.push({ x1: seg.x1, x2: seg.x2 })
    }

    return { yDomain: [0, ceiling] as [number, number], yTicks: ticks, crashSegments: segments }
  }, [chartData])

  return (
    <div ref={containerRef}>
      <div className="mb-3 flex items-center gap-4">
        <p className="text-xs font-medium text-app-text-muted">
          Estimated effect — therapeutic window model
        </p>
        <div className="ml-auto flex items-center gap-3 text-[10px] text-app-text-secondary">
          <span className="flex items-center gap-1">
            <span className="inline-block h-2 w-3 rounded-sm bg-emerald-500/80 [.app-theme-light_&]:bg-emerald-700" />
            Therapeutic
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block h-2 w-3 rounded-sm bg-red-500/75 [.app-theme-light_&]:bg-red-800" />
            Crash risk
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block h-2 w-3 rounded-sm bg-amber-500/75 [.app-theme-light_&]:bg-amber-800" />
            Above MTC
          </span>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={280}>
        <ComposedChart data={chartData} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
          <defs>
            <linearGradient id="concGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--app-accent)" stopOpacity={0.35} />
              <stop offset="95%" stopColor="var(--app-accent)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="2 4" stroke="var(--app-chart-grid)" vertical={false} />

          <ReferenceArea
            y1={pkSettings.mec}
            y2={pkSettings.mtc}
            fill="var(--app-chart-band-therapeutic)"
            stroke="none"
            ifOverflow="visible"
          />

          {crashSegments.map((seg) => (
            <ReferenceArea
              key={`${seg.x1}-${seg.x2}`}
              x1={seg.x1}
              x2={seg.x2}
              fill="var(--app-chart-band-crash)"
              stroke="none"
              ifOverflow="visible"
            />
          ))}

          <XAxis
            dataKey="timeLabel"
            tick={({ x, y, payload, index }) => {
              if (index % (xTickInterval + 1) !== 0) return <g />
              if (payload.value === '00:00' || payload.value === '24:00') return <g />
              return (
                <text
                  x={x}
                  y={(y as number) + 10}
                  textAnchor="middle"
                  fontSize={10}
                  fill="var(--app-chart-muted)"
                >
                  {payload.value}
                </text>
              )
            }}
            tickLine={false}
            axisLine={false}
            interval={0}
          />
          <YAxis
            domain={yDomain}
            ticks={yTicks}
            tick={{ fontSize: 10, fill: 'var(--app-chart-muted)' }}
            tickLine={false}
            axisLine={false}
            width={24}
            tickFormatter={(v: number) => String(v)}
          />

          <ReferenceLine
            y={pkSettings.mec}
            stroke="var(--app-chart-mec)"
            strokeDasharray="3 3"
            strokeWidth={1.75}
            label={{
              value: 'MEC',
              position: 'insideTopRight',
              fontSize: 9,
              fill: 'var(--app-chart-mec)'
            }}
          />
          <ReferenceLine
            y={pkSettings.mtc}
            stroke="var(--app-chart-mtc)"
            strokeDasharray="3 3"
            strokeWidth={1.75}
            label={{
              value: 'MTC',
              position: 'insideTopRight',
              fontSize: 9,
              fill: 'var(--app-chart-mtc)'
            }}
          />

          {nowLabel && (
            <ReferenceLine
              x={nowLabel}
              stroke="var(--app-chart-now)"
              strokeWidth={1.75}
              strokeDasharray="4 3"
              label={{
                value: 'now',
                position: 'insideTopRight',
                fontSize: 9,
                fill: 'var(--app-chart-now)'
              }}
            />
          )}

          <Tooltip
            contentStyle={{
              background: 'var(--app-card)',
              border: '1px solid var(--app-border)',
              borderRadius: '8px',
              fontSize: '11px',
              color: 'var(--app-text)'
            }}
            labelStyle={{ color: 'var(--app-text-secondary)', marginBottom: '2px' }}
            formatter={(v, name, props) => {
              if (name !== 'concentration') return [v, name]
              const val = typeof v === 'number' ? v.toFixed(2) : v
              const pt = props.payload as { band: string; crashRisk: boolean } | undefined
              const band = pt?.band ?? 'below'
              const crash = pt?.crashRisk ? ' ⚠ crash risk' : ''
              const bandLabel =
                band === 'therapeutic' ? ' ✓ therapeutic' : band === 'above' ? ' ↑ above MTC' : ''
              return [`${val}${bandLabel}${crash}`, 'Effect']
            }}
          />
          <Area
            type="monotoneX"
            dataKey="concentration"
            stroke="var(--app-accent)"
            strokeWidth={2}
            fill="url(#concGrad)"
            dot={false}
            activeDot={{ r: 3, strokeWidth: 0 }}
            isAnimationActive={false}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}
