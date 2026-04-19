import { useMemo, useState, useCallback, useRef } from 'react'
import { Trash2 } from 'lucide-react'
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
import useAppStore from '@renderer/store/useAppStore'
import { useShallow } from 'zustand/react/shallow'
import { generateDailyChartData, MED_PRESETS } from '@renderer/utils/pharmacokinetics'
import { cn } from '@renderer/utils/cn'

const today = (): string => new Date().toISOString().slice(0, 10)

const isoToTimeInput = (iso: string): string => {
  const d = new Date(iso)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

const timeInputToIso = (date: string, timeValue: string): string => {
  const [h, m] = timeValue.split(':').map(Number)
  const d = new Date(`${date}T00:00:00`)
  d.setHours(h, m, 0, 0)
  return d.toISOString()
}

const PRESET_BUTTONS = MED_PRESETS.filter(
  (p, i, arr) => arr.findIndex((x) => x.id === p.id && x.dose === p.dose) === i
)

interface SliderRowProps {
  label: string
  value: number
  min: number
  max: number
  step: number
  format: (v: number) => string
  onChange: (v: number) => void
}

function SliderRow({
  label,
  value,
  min,
  max,
  step,
  format,
  onChange
}: SliderRowProps): React.JSX.Element {
  return (
    <div className="group grid grid-cols-[1fr_auto] gap-x-4 gap-y-0.5">
      <div className="flex items-baseline gap-2">
        <span className="text-xs font-medium text-app-text">{label}</span>
      </div>
      <span className="tabular-nums text-xs font-medium text-app-accent text-right">
        {format(value)}
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="col-span-2 w-full cursor-pointer accent-[var(--app-accent)]"
      />
    </div>
  )
}

export function HealthPage(): React.JSX.Element {
  const {
    medications,
    pkSettings,
    addMedicationLog,
    updateMedicationLog,
    deleteMedicationLog,
    updateChartSettings
  } = useAppStore(
    useShallow((s) => ({
      medications: s.medications,
      pkSettings: s.pkSettings,
      addMedicationLog: s.addMedicationLog,
      updateMedicationLog: s.updateMedicationLog,
      deleteMedicationLog: s.deleteMedicationLog,
      updateChartSettings: s.updateChartSettings
    }))
  )

  const [selectedDate, setSelectedDate] = useState(today)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [pkOpen, setPkOpen] = useState(false)
  const [chartWidth, setChartWidth] = useState(600)
  const roRef = useRef<ResizeObserver | null>(null)
  const chartContainerRef = useCallback((node: HTMLDivElement | null) => {
    roRef.current?.disconnect()
    if (!node) return
    roRef.current = new ResizeObserver(([entry]) => setChartWidth(entry.contentRect.width))
    roRef.current.observe(node)
  }, [])

  const todayLogs = useMemo(
    () => medications.filter((m) => m.takenAt.slice(0, 10) === selectedDate),
    [medications, selectedDate]
  )

  const chartData = useMemo(
    () => generateDailyChartData(todayLogs, selectedDate, pkSettings),
    [todayLogs, selectedDate, pkSettings]
  )

  const xTickInterval = chartWidth < 700 ? 35 : chartWidth < 1000 ? 23 : 11

  const nowLabel = useMemo(() => {
    if (selectedDate !== today()) return null
    const n = new Date()
    const roundedMin = Math.round(n.getMinutes() / 5) * 5
    const h = roundedMin === 60 ? n.getHours() + 1 : n.getHours()
    const m = roundedMin === 60 ? 0 : roundedMin
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
  }, [selectedDate])

  const { yDomain, yTicks, crashSegments } = useMemo(() => {
    let maxEffect = 0
    for (const pt of chartData) {
      if (pt.concentration > maxEffect) maxEffect = pt.concentration
    }
    // Snap to next integer >= 1; never below 1 so chart isn't flat when empty
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

    // Merge segments separated by ≤6 non-crash points (30 min gap) into one
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

  const handleAdd = (medId: string, medName: string, dose: number): void => {
    const now = new Date()
    now.setSeconds(0, 0)
    addMedicationLog({ medId, medName, dose, takenAt: now.toISOString() })
  }

  const handleTimeChange = (id: string, timeValue: string): void => {
    if (!timeValue) return
    updateMedicationLog(id, timeInputToIso(selectedDate, timeValue))
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto px-6 py-6 overflow-hidden max-w-5xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <h1 className="text-base font-semibold text-app-text">Medications</h1>
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="rounded-md border border-app-border bg-app-card px-2 py-1 text-xs text-app-text focus:outline-none"
        />
      </div>

      <section className="max-w-3xl space-y-6">
        {/* Quick-add buttons */}
        <div>
          <p className="mb-2 text-xs font-medium text-app-text-muted">Log intake</p>
          <div className="flex flex-wrap gap-2">
            {PRESET_BUTTONS.map((p) => (
              <button
                key={`${p.id}-${p.dose}`}
                type="button"
                onClick={() => handleAdd(p.id, p.name, p.dose)}
                className={cn(
                  'rounded-lg border border-app-border bg-app-card px-3 py-1.5 text-xs text-app-text',
                  'hover:border-app-accent/40 hover:bg-app-hover transition-colors'
                )}
              >
                {p.name} {p.dose}
                {p.unit}
              </button>
            ))}
          </div>
        </div>

        {/* Log list */}
        <div className="w-1/2">
          <p className="mb-2 text-xs font-medium text-app-text-muted">
            Taken {selectedDate === today() ? 'today' : `on ${selectedDate}`}
          </p>
          {todayLogs.length === 0 ? (
            <p className="text-xs text-app-text-muted">No medications logged.</p>
          ) : (
            <ul className="space-y-1">
              {todayLogs.map((log) => (
                <li
                  key={log.id}
                  className="flex items-center justify-between rounded-lg border border-app-border bg-app-card px-3 py-2"
                >
                  <span className="text-sm text-app-text">
                    {log.medName} {log.dose}mg
                  </span>
                  <div className="flex items-center gap-2">
                    {editingId === log.id ? (
                      <input
                        type="time"
                        autoFocus
                        defaultValue={isoToTimeInput(log.takenAt)}
                        onChange={(e) => handleTimeChange(log.id, e.target.value)}
                        onBlur={() => setEditingId(null)}
                        className="rounded border border-app-accent/40 bg-app-hover px-1.5 py-0.5 text-xs text-app-text focus:outline-none"
                      />
                    ) : (
                      <button
                        type="button"
                        onClick={() => setEditingId(log.id)}
                        className="rounded px-1.5 py-0.5 text-xs text-app-text-muted hover:bg-app-hover hover:text-app-text transition-colors"
                        title="Edit time"
                      >
                        @ {isoToTimeInput(log.takenAt)}
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => deleteMedicationLog(log.id)}
                      className="text-app-text-muted hover:text-red-400 transition-colors"
                      title="Remove"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {/* Chart */}
      <div
        ref={chartContainerRef}
        className="rounded-xl border border-app-border bg-app-card p-4 [&_*]:outline-none"
      >
        <div className="mb-3 flex items-center gap-4">
          <p className="text-xs font-medium text-app-text-muted">
            Estimated effect — therapeutic window model
          </p>
          <div className="ml-auto flex items-center gap-3 text-[10px] text-app-text-secondary">
            <span className="flex items-center gap-1">
              <span className="inline-block h-2 w-3 rounded-sm bg-emerald-500/70" />
              Therapeutic
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block h-2 w-3 rounded-sm bg-red-500/60" />
              Crash risk
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block h-2 w-3 rounded-sm bg-amber-500/60" />
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
            <CartesianGrid strokeDasharray="2 4" stroke="var(--app-border)" vertical={false} />

            {/* Therapeutic window band */}
            <ReferenceArea
              y1={pkSettings.mec}
              y2={pkSettings.mtc}
              fill="rgba(16,185,129,0.10)"
              stroke="none"
              ifOverflow="visible"
            />

            {/* Crash-risk segments (orange tint behind curve) */}
            {crashSegments.map((seg) => (
              <ReferenceArea
                key={`${seg.x1}-${seg.x2}`}
                x1={seg.x1}
                x2={seg.x2}
                fill="rgba(220,38,38,0.18)"
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
                    fill="var(--app-text-muted)"
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
              tick={{ fontSize: 10, fill: 'var(--app-text-muted)' }}
              tickLine={false}
              axisLine={false}
              width={24}
              tickFormatter={(v: number) => String(v)}
            />

            {/* MEC line */}
            <ReferenceLine
              y={pkSettings.mec}
              stroke="rgba(16,185,129,0.9)"
              strokeDasharray="3 3"
              strokeWidth={1}
              label={{
                value: 'MEC',
                position: 'insideTopRight',
                fontSize: 9,
                fill: 'rgba(16,185,129,1)'
              }}
            />
            {/* MTC line */}
            <ReferenceLine
              y={pkSettings.mtc}
              stroke="rgba(217,119,6,0.9)"
              strokeDasharray="3 3"
              strokeWidth={1}
              label={{
                value: 'MTC',
                position: 'insideTopRight',
                fontSize: 9,
                fill: 'rgba(217,119,6,1)'
              }}
            />

            {/* Current time line */}
            {nowLabel && (
              <ReferenceLine
                x={nowLabel}
                stroke="var(--app-text-muted)"
                strokeWidth={1.5}
                strokeDasharray="4 3"
                label={{
                  value: 'now',
                  position: 'insideTopRight',
                  fontSize: 9,
                  fill: 'var(--app-text-muted)'
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

        {/* PK params — flush against chart bottom */}
        <div className="mt-3 -mx-4 border-t border-app-border px-4 pt-4">
          <button
            type="button"
            onClick={() => setPkOpen((v) => !v)}
            className="flex w-full items-center justify-between text-xs font-medium text-app-text-muted uppercase tracking-wider hover:text-app-text transition-colors"
          >
            <span>Pharmacokinetic parameters</span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={cn('transition-transform duration-200', pkOpen ? 'rotate-180' : '')}
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>
          {pkOpen && (
            <div className="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              <SliderRow
                label="Intensity"
                value={pkSettings.peakScale}
                min={0.5}
                max={2.0}
                step={0.05}
                format={(v) => `${v.toFixed(2)}×`}
                onChange={(v) => updateChartSettings({ peakScale: v })}
              />
              <SliderRow
                label="Tmax offset"
                value={pkSettings.tMaxOffsetH}
                min={-1}
                max={2}
                step={0.25}
                format={(v) => `${v >= 0 ? '+' : ''}${v.toFixed(2)} h`}
                onChange={(v) => updateChartSettings({ tMaxOffsetH: v })}
              />
              <SliderRow
                label="Elimination rate"
                value={pkSettings.keMultiplier}
                min={0.4}
                max={2.0}
                step={0.1}
                format={(v) => `${v.toFixed(1)}×`}
                onChange={(v) => updateChartSettings({ keMultiplier: v })}
              />
              <SliderRow
                label="Crash sensitivity"
                value={Math.abs(pkSettings.crashThreshold)}
                min={0.01}
                max={0.1}
                step={0.005}
                format={(v) => v.toFixed(3)}
                onChange={(v) => updateChartSettings({ crashThreshold: -v })}
              />
              <SliderRow
                label="MEC"
                value={pkSettings.mec}
                min={0.05}
                max={1.5}
                step={0.05}
                format={(v) => v.toFixed(2)}
                onChange={(v) => updateChartSettings({ mec: v })}
              />
              <SliderRow
                label="MTC"
                value={pkSettings.mtc}
                min={0.3}
                max={3.0}
                step={0.05}
                format={(v) => v.toFixed(2)}
                onChange={(v) => updateChartSettings({ mtc: v })}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
