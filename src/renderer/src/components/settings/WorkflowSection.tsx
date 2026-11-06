import { Switch } from "@renderer/components/ui/switch"
import type { AppPreferences } from "@renderer/types"
import { Bookmark, X } from "lucide-react"
import { useEffect, useState } from "react"

interface WorkflowSectionProps {
  preferences: AppPreferences
  onUpdate: (patch: Partial<AppPreferences>) => void
}

const inputClass =
  "h-7 rounded-md border border-app-border bg-app-card px-2 text-xs text-app-text focus:outline-none focus:ring-2 focus:ring-app-accent/40"

function Row({
  label,
  hint,
  children
}: {
  label: string
  hint?: string
  children: React.ReactNode
}): React.JSX.Element {
  return (
    <div className="flex items-center justify-between gap-6 py-1.5">
      <div className="min-w-0">
        <p className="text-sm text-app-text">{label}</p>
        {hint && <p className="text-xs text-app-text-muted">{hint}</p>}
      </div>
      <div className="flex shrink-0 items-center gap-2">{children}</div>
    </div>
  )
}

function NumberInput({
  value,
  min,
  max,
  onCommit
}: {
  value: number
  min: number
  max: number
  onCommit: (value: number) => void
}): React.JSX.Element {
  const [draft, setDraft] = useState(String(value))
  useEffect(() => setDraft(String(value)), [value])
  const commit = (): void => {
    const n = Math.round(Number(draft))
    if (Number.isFinite(n) && n >= min && n <= max) onCommit(n)
    else setDraft(String(value))
  }
  return (
    <input
      className={`${inputClass} w-16`}
      max={max}
      min={min}
      onBlur={commit}
      onChange={(event) => setDraft(event.target.value)}
      onKeyDown={(event) => event.key === "Enter" && commit()}
      type="number"
      value={draft}
    />
  )
}

export function WorkflowSection({
  preferences,
  onUpdate
}: WorkflowSectionProps): React.JSX.Element {
  const [shortcut, setShortcut] = useState(preferences.quickAddShortcut)
  useEffect(
    () => setShortcut(preferences.quickAddShortcut),
    [preferences.quickAddShortcut]
  )

  return (
    <section className="space-y-3">
      <div>
        <h2 className="text-sm font-semibold text-app-text">Workflow</h2>
        <p className="mt-0.5 text-xs text-app-text-muted">
          Reminders, background behaviour, quick add and focus timer
        </p>
      </div>

      <div className="divide-y divide-app-border/60 rounded-lg border border-app-border/64 bg-app-card px-4 py-1">
        <Row hint="For tasks with a due time" label="Desktop reminders">
          <Switch
            checked={preferences.notificationsEnabled}
            onCheckedChange={(notificationsEnabled) =>
              onUpdate({ notificationsEnabled })
            }
          />
        </Row>
        <Row hint="Minutes before the due time" label="Remind me early">
          <NumberInput
            max={1440}
            min={0}
            onCommit={(reminderLeadMinutes) =>
              onUpdate({ reminderLeadMinutes })
            }
            value={preferences.reminderLeadMinutes}
          />
        </Row>
        <Row
          hint="Keeps reminders and the shortcut working in the tray"
          label="Close to tray"
        >
          <Switch
            checked={preferences.closeToTray}
            onCheckedChange={(closeToTray) => onUpdate({ closeToTray })}
          />
        </Row>
        <Row
          hint="System-wide, e.g. CommandOrControl+Shift+Space. Empty disables."
          label="Global quick add shortcut"
        >
          <input
            className={`${inputClass} w-60 font-mono`}
            onBlur={() => onUpdate({ quickAddShortcut: shortcut.trim() })}
            onChange={(event) => setShortcut(event.target.value)}
            onKeyDown={(event) =>
              event.key === "Enter" &&
              onUpdate({ quickAddShortcut: shortcut.trim() })
            }
            value={shortcut}
          />
        </Row>
        <Row hint="Focus / break minutes" label="Pomodoro">
          <NumberInput
            max={180}
            min={1}
            onCommit={(pomodoroWorkMinutes) =>
              onUpdate({ pomodoroWorkMinutes })
            }
            value={preferences.pomodoroWorkMinutes}
          />
          <span className="text-xs text-app-text-muted">/</span>
          <NumberInput
            max={60}
            min={1}
            onCommit={(pomodoroBreakMinutes) =>
              onUpdate({ pomodoroBreakMinutes })
            }
            value={preferences.pomodoroBreakMinutes}
          />
        </Row>
      </div>

      <div className="space-y-2">
        <p className="text-xs font-medium text-app-text-muted">
          Saved views — create them from the Inbox filter menu
        </p>
        {preferences.savedViews.length === 0 ? (
          <p className="text-xs text-app-text-muted">No saved views yet.</p>
        ) : (
          <ul className="flex flex-wrap gap-2">
            {preferences.savedViews.map((view) => (
              <li
                className="flex items-center gap-1.5 rounded-md border border-app-border/64 bg-app-card px-2 py-1 text-xs text-app-text"
                key={view.id}
              >
                <Bookmark className="text-app-text-muted" size={12} />
                {view.name}
                <button
                  aria-label={`Delete view ${view.name}`}
                  className="text-app-text-muted hover:text-app-text"
                  onClick={() =>
                    onUpdate({
                      savedViews: preferences.savedViews.filter(
                        (v) => v.id !== view.id
                      )
                    })
                  }
                  type="button"
                >
                  <X size={11} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}
