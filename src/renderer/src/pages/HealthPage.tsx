import { useMemo, useState } from 'react'
import { RotateCcw, Settings2, Trash2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@renderer/components/ui/dialog'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from 'recharts'
import useAppStore from '@renderer/store/useAppStore'
import { useShallow } from 'zustand/react/shallow'
import {
  generateDailyChartData,
  MED_PRESETS,
  MED_IDS,
  MED_DISPLAY_NAME,
  CHART_TICK_INTERVAL
} from '@renderer/utils/pharmacokinetics'
import { DEFAULT_MED_PK_SETTINGS } from '@renderer/types'
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

function SliderRow({ label, value, min, max, step, format, onChange }: SliderRowProps): React.JSX.Element {
  return (
    <div className="flex items-center gap-3">
      <span className="w-32 shrink-0 text-xs text-app-text-secondary">{label}</span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="flex-1 accent-[var(--app-accent)]"
      />
      <span className="w-10 text-right text-xs tabular-nums text-app-text-muted">{format(value)}</span>
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
    updateMedPkSettings,
    resetMedPkSettings
  } = useAppStore(
    useShallow((s) => ({
      medications: s.medications,
      pkSettings: s.pkSettings,
      addMedicationLog: s.addMedicationLog,
      updateMedicationLog: s.updateMedicationLog,
      deleteMedicationLog: s.deleteMedicationLog,
      updateMedPkSettings: s.updateMedPkSettings,
      resetMedPkSettings: s.resetMedPkSettings
    }))
  )

  const [selectedDate, setSelectedDate] = useState(today)
  const [editingId, setEditingId] = useState<string | null>(null)

  const todayLogs = useMemo(
    () => medications.filter((m) => m.takenAt.slice(0, 10) === selectedDate),
    [medications, selectedDate]
  )

  const chartData = useMemo(
    () => generateDailyChartData(todayLogs, selectedDate, pkSettings),
    [todayLogs, selectedDate, pkSettings]
  )

  const { maxConc, yTicks } = useMemo(() => {
    const max = Math.max(...chartData.map((p) => p.concentration), 0.1)
    const ceiling = Math.ceil(max * 1.25 * 4) / 4  // round up to nearest 0.25
    const step = ceiling <= 2 ? 0.5 : ceiling <= 5 ? 1 : 2
    const ticks: number[] = []
    for (let v = 0; v <= ceiling + step / 2; v += step) {
      ticks.push(Math.round(v * 100) / 100)
    }
    return { maxConc: ceiling, yTicks: ticks }
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
    <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto px-6 py-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <h1 className="text-base font-semibold text-app-text">Medications</h1>
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="rounded-md border border-app-border bg-app-card px-2 py-1 text-xs text-app-text focus:outline-none"
        />
        <Dialog>
          <DialogTrigger asChild>
            <button
              type="button"
              className="ml-auto flex items-center gap-1.5 rounded-md border border-app-border bg-app-card px-2.5 py-1 text-xs text-app-text-muted hover:text-app-text transition-colors"
            >
              <Settings2 size={12} />
              Model settings
            </button>
          </DialogTrigger>
          <DialogContent className="border-app-border bg-app-bg text-app-text sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-sm font-semibold text-app-text">Model settings</DialogTitle>
            </DialogHeader>
            <p className="text-[11px] text-app-text-muted">
              Calibrate the effect-site model per medication. <strong className="text-app-text-secondary">Onset speed</strong> — how fast effect catches plasma (higher = faster on/off). <strong className="text-app-text-secondary">Duration</strong> — scale total active time. <strong className="text-app-text-secondary">Sensitivity</strong> — peak height multiplier.
            </p>
            <div className="space-y-5">
              {MED_IDS.map((medId) => {
                const s = pkSettings.perMed[medId] ?? DEFAULT_MED_PK_SETTINGS
                const isModified = !!pkSettings.perMed[medId]
                return (
                  <div key={medId} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-app-text">{MED_DISPLAY_NAME[medId]}</span>
                      {isModified && (
                        <button
                          type="button"
                          onClick={() => resetMedPkSettings(medId)}
                          className="flex items-center gap-1 text-[11px] text-app-text-muted hover:text-app-text transition-colors"
                          title="Reset to defaults"
                        >
                          <RotateCcw size={11} />
                          Reset
                        </button>
                      )}
                    </div>
                    <SliderRow
                      label="Onset speed"
                      value={s.ke0}
                      min={0.3}
                      max={3.0}
                      step={0.1}
                      format={(v) => v.toFixed(1)}
                      onChange={(v) => updateMedPkSettings(medId, { ke0: v })}
                    />
                    <SliderRow
                      label="Duration ×"
                      value={s.durationScale}
                      min={0.5}
                      max={2.0}
                      step={0.05}
                      format={(v) => `${v.toFixed(2)}×`}
                      onChange={(v) => updateMedPkSettings(medId, { durationScale: v })}
                    />
                    <SliderRow
                      label="Sensitivity"
                      value={s.sensitivity}
                      min={0.3}
                      max={2.0}
                      step={0.05}
                      format={(v) => v.toFixed(2)}
                      onChange={(v) => updateMedPkSettings(medId, { sensitivity: v })}
                    />
                  </div>
                )
              })}
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Chart */}
      <div className="rounded-xl border border-app-border bg-app-card p-4 [&_*]:outline-none">
        <p className="mb-3 text-xs font-medium text-app-text-muted">Estimated effect (effect-site model)</p>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={chartData} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
            <defs>
              <linearGradient id="concGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--app-accent)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="var(--app-accent)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="2 4" stroke="var(--app-border)" vertical={false} />
            <XAxis
              dataKey="timeLabel"
              tick={{ fontSize: 10, fill: 'var(--app-text-muted)' }}
              tickLine={false}
              axisLine={false}
              interval={CHART_TICK_INTERVAL}
            />
            <YAxis
              domain={[0, maxConc]}
              ticks={yTicks}
              tick={{ fontSize: 10, fill: 'var(--app-text-muted)' }}
              tickLine={false}
              axisLine={false}
              width={32}
              tickFormatter={(v: number) => Number.isInteger(v) ? String(v) : v.toFixed(1)}
            />
            <Tooltip
              contentStyle={{
                background: 'var(--app-card)',
                border: '1px solid var(--app-border)',
                borderRadius: '8px',
                fontSize: '11px',
                color: 'var(--app-text)'
              }}
              labelStyle={{ color: 'var(--app-text-secondary)', marginBottom: '2px' }}
              formatter={(v) => [typeof v === 'number' ? v.toFixed(2) : v, 'Effect']}
            />
            <Area
              type="monotoneX"
              dataKey="concentration"
              stroke="var(--app-accent)"
              strokeWidth={1.5}
              fill="url(#concGrad)"
              dot={false}
              activeDot={{ r: 3, strokeWidth: 0 }}
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

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
              {p.name} {p.dose}{p.unit}
            </button>
          ))}
        </div>
      </div>

      {/* Log list */}
      <div>
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

    </div>
  )
}
