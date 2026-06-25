import type { CalendarEvent } from "@renderer/types"
import { formatHM } from "@renderer/utils/calendar"
import { cn } from "@renderer/utils/cn"
import { PROJECT_COLOR_SWATCHES } from "@renderer/utils/task"
import { X } from "lucide-react"
import { useState } from "react"
import type { DraftCreate } from "./TaskPickerDialog"

export interface EventEditorValues {
  title: string
  description?: string
  location?: string
  color?: string
  allDay: boolean
  rrule?: string
}

interface EventEditorDialogProps {
  /** Present when editing an existing event; absent when creating from a draft. */
  event?: CalendarEvent
  draft?: DraftCreate
  onCancel: () => void
  onSubmit: (values: EventEditorValues) => void
  onDelete?: () => void
  onSwitchToTask?: () => void
}

const RRULE_OPTIONS = [
  { label: "Does not repeat", value: "" },
  { label: "Daily", value: "FREQ=DAILY" },
  { label: "Weekly", value: "FREQ=WEEKLY" },
  { label: "Monthly", value: "FREQ=MONTHLY" },
  { label: "Yearly", value: "FREQ=YEARLY" }
] as const

const minutesFromIso = (iso: string): number => {
  const d = new Date(iso)
  return d.getHours() * 60 + d.getMinutes()
}

export function EventEditorDialog({
  event,
  draft,
  onCancel,
  onSubmit,
  onDelete,
  onSwitchToTask
}: EventEditorDialogProps): React.JSX.Element {
  const [title, setTitle] = useState(event?.title ?? "")
  const [description, setDescription] = useState(event?.description ?? "")
  const [location, setLocation] = useState(event?.location ?? "")
  const [color, setColor] = useState(event?.color ?? PROJECT_COLOR_SWATCHES[18])
  const [allDay, setAllDay] = useState(event?.allDay ?? false)
  const [rrule, setRrule] = useState(event?.rrule ?? "")

  const startAt = event?.startAt ?? draft?.startAt
  const endAt = event?.endAt ?? draft?.endAt
  const dayIso = event?.startAt ?? draft?.dayIso
  const dayLabel = dayIso
    ? new Date(dayIso).toLocaleDateString(undefined, {
        weekday: "short",
        month: "short",
        day: "numeric"
      })
    : ""
  const timeLabel =
    !allDay && startAt && endAt
      ? ` · ${formatHM(minutesFromIso(startAt))}–${formatHM(minutesFromIso(endAt))}`
      : ""

  const handleSubmit = (e: React.FormEvent): void => {
    e.preventDefault()
    onSubmit({
      title: title.trim() || "(No title)",
      description: description.trim() || undefined,
      location: location.trim() || undefined,
      color,
      allDay,
      rrule: rrule || undefined
    })
  }

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 p-6"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-md overflow-hidden rounded-lg border border-app-border bg-app-bg shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-app-border px-4 py-3">
          <div>
            <div className="text-sm text-app-text">
              {event ? "Edit event" : "New event"}
            </div>
            <div className="text-[11px] text-app-text-muted">
              {dayLabel}
              {timeLabel}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {onSwitchToTask && (
              <button
                type="button"
                onClick={onSwitchToTask}
                className="h-6 rounded px-2 text-[11px] text-app-text-muted hover:bg-app-hover hover:text-app-text"
              >
                Task session
              </button>
            )}
            <button
              type="button"
              onClick={onCancel}
              className="flex h-6 w-6 items-center justify-center rounded text-app-text-muted hover:bg-app-hover hover:text-app-text"
            >
              <X size={14} />
            </button>
          </div>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3 px-4 py-3">
          <input
            // biome-ignore lint/a11y/noAutofocus: focus the primary field on open
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => e.key === "Escape" && onCancel()}
            placeholder="Title"
            className="h-8 w-full bg-transparent text-sm text-app-text placeholder:text-app-text-muted focus:outline-none"
          />
          <input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Location (optional)"
            className="h-8 w-full bg-transparent text-xs text-app-text placeholder:text-app-text-muted focus:outline-none"
          />
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Description (optional)"
            rows={2}
            className="w-full resize-none bg-transparent text-xs text-app-text placeholder:text-app-text-muted focus:outline-none"
          />

          <label className="flex items-center gap-2 text-xs text-app-text-secondary">
            <input
              type="checkbox"
              checked={allDay}
              onChange={(e) => setAllDay(e.target.checked)}
            />
            All day
          </label>

          <select
            value={rrule}
            onChange={(e) => setRrule(e.target.value)}
            className="h-8 rounded border border-app-border bg-transparent px-2 text-xs text-app-text focus:outline-none"
          >
            {RRULE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          <div className="flex flex-wrap gap-1.5">
            {PROJECT_COLOR_SWATCHES.map((swatch) => (
              <button
                key={swatch}
                type="button"
                onClick={() => setColor(swatch)}
                className={cn(
                  "h-5 w-5 rounded-full border",
                  color === swatch ? "border-app-text" : "border-transparent"
                )}
                style={{ background: swatch }}
                title={swatch}
              />
            ))}
          </div>

          <div className="mt-1 flex items-center justify-end gap-2">
            {onDelete && (
              <button
                type="button"
                onClick={onDelete}
                className="mr-auto h-7 rounded px-3 text-xs text-red-400 hover:bg-red-500/10"
              >
                Delete
              </button>
            )}
            <button
              type="button"
              onClick={onCancel}
              className="h-7 rounded px-3 text-xs text-app-text-muted hover:bg-app-hover hover:text-app-text"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="h-7 rounded bg-app-active px-3 text-xs text-app-text hover:bg-app-hover"
            >
              {event ? "Save" : "Add event"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
