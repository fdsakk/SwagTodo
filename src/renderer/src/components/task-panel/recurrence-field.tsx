import {
  Select,
  SelectGroup,
  SelectItem,
  SelectPopup,
  SelectTrigger,
  SelectValue
} from "@renderer/components/ui/select"
import type { Recurrence, RecurrenceFreq } from "@renderer/types"
import { cn } from "@renderer/utils/cn"
import { describeRecurrence } from "@renderer/utils/recurrence"
import { memo } from "react"

const NONE = "none"
const FREQ_OPTIONS: { value: RecurrenceFreq | typeof NONE; label: string }[] = [
  { value: NONE, label: "Does not repeat" },
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "yearly", label: "Yearly" }
]
const UNIT_LABEL: Record<RecurrenceFreq, string> = {
  daily: "days",
  weekly: "weeks",
  monthly: "months",
  yearly: "years"
}
/** Monday-first display order, values are JS weekday numbers. */
const WEEKDAYS = [
  { value: 1, label: "M" },
  { value: 2, label: "T" },
  { value: 3, label: "W" },
  { value: 4, label: "T" },
  { value: 5, label: "F" },
  { value: 6, label: "S" },
  { value: 0, label: "S" }
]

interface RecurrenceFieldProps {
  value: Recurrence | undefined
  onChange: (value: Recurrence | undefined) => void
}

function RecurrenceFieldImpl({
  value,
  onChange
}: RecurrenceFieldProps): React.JSX.Element {
  const update = (patch: Partial<Recurrence>): void => {
    if (!value) return
    const next: Recurrence = { ...value, ...patch }
    if (next.freq !== "weekly" || !next.weekdays?.length) delete next.weekdays
    if (!next.fromCompletion) delete next.fromCompletion
    onChange(next)
  }

  const toggleWeekday = (day: number): void => {
    const current = value?.weekdays ?? []
    update({
      weekdays: current.includes(day)
        ? current.filter((d) => d !== day)
        : [...current, day]
    })
  }

  return (
    <div className="w-full space-y-2">
      <Select
        items={FREQ_OPTIONS}
        onValueChange={(freq) => {
          if (!freq || freq === NONE) onChange(undefined)
          else if (value) update({ freq: freq as RecurrenceFreq })
          else onChange({ freq: freq as RecurrenceFreq, interval: 1 })
        }}
        value={value?.freq ?? NONE}
      >
        <SelectTrigger className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectPopup>
          <SelectGroup>
            {FREQ_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectPopup>
      </Select>

      {value && (
        <>
          <label className="flex items-center gap-2 text-xs text-app-text-muted">
            Every
            <input
              className="h-7 w-14 rounded-md border border-app-border bg-transparent px-2 text-xs text-app-text focus:outline-none"
              max={365}
              min={1}
              onChange={(event) =>
                update({
                  interval: Math.min(
                    365,
                    Math.max(1, Number(event.target.value) || 1)
                  )
                })
              }
              type="number"
              value={value.interval}
            />
            {UNIT_LABEL[value.freq]}
          </label>

          {value.freq === "weekly" && (
            <div className="flex gap-1">
              {WEEKDAYS.map((day) => (
                <button
                  className={cn(
                    "size-6 rounded-md text-[11px] transition-colors",
                    value.weekdays?.includes(day.value)
                      ? "bg-app-active text-app-text"
                      : "bg-app-hover text-app-text-muted hover:text-app-text-secondary"
                  )}
                  key={day.value}
                  onClick={() => toggleWeekday(day.value)}
                  type="button"
                >
                  {day.label}
                </button>
              ))}
            </div>
          )}

          <label className="flex items-center gap-2 text-xs text-app-text-muted">
            <input
              checked={Boolean(value.fromCompletion)}
              onChange={(event) =>
                update({ fromCompletion: event.target.checked })
              }
              type="checkbox"
            />
            Count from completion date
          </label>
          <p className="text-xs text-app-text-secondary">
            {describeRecurrence(value)}
          </p>
        </>
      )}
    </div>
  )
}

export const RecurrenceField = memo(RecurrenceFieldImpl)
