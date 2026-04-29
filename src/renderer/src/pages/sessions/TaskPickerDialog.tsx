import { formatHM } from "@renderer/utils/calendar"
import { X } from "lucide-react"
import { useMemo, useState } from "react"

export interface DraftCreate {
  dayIso: string
  startAt: string
  endAt: string
}

interface TaskPickerDialogProps {
  draft: DraftCreate
  tasks: ReadonlyArray<{ id: string; title: string; projectId?: string }>
  projectById: Map<
    string,
    { id: string; name: string; color: string; emoji?: string }
  >
  onCancel: () => void
  onPick: (taskId: string) => void
  onSwitchToGhost: () => void
}

function minutesFromIso(iso: string): number {
  const d = new Date(iso)
  return d.getHours() * 60 + d.getMinutes()
}

export function TaskPickerDialog({
  draft,
  tasks,
  projectById,
  onCancel,
  onPick,
  onSwitchToGhost
}: TaskPickerDialogProps): React.JSX.Element {
  const [query, setQuery] = useState("")
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return tasks
    return tasks.filter((t) => t.title.toLowerCase().includes(q))
  }, [query, tasks])

  const startMin = minutesFromIso(draft.startAt)
  const endMin = minutesFromIso(draft.endAt)
  const day = new Date(draft.dayIso).toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric"
  })

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
            <div className="text-sm text-app-text">New session</div>
            <div className="text-[11px] text-app-text-muted">
              {day} · {formatHM(startMin)}–{formatHM(endMin)}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onSwitchToGhost}
              className="h-6 rounded px-2 text-[11px] text-app-text-muted hover:bg-app-hover hover:text-app-text"
              title="Add ghost block instead"
            >
              Ghost block
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="flex h-6 w-6 items-center justify-center rounded text-app-text-muted hover:bg-app-hover hover:text-app-text"
            >
              <X size={14} />
            </button>
          </div>
        </div>
        <div className="border-b border-app-border px-4 py-2">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Escape" && onCancel()}
            placeholder="Search tasks..."
            className="h-8 w-full bg-transparent text-sm text-app-text placeholder:text-app-text-muted focus:outline-none"
          />
        </div>
        <div className="max-h-80 overflow-y-auto py-1">
          {filtered.length === 0 ? (
            <div className="px-4 py-6 text-center text-xs text-app-text-muted">
              No project tasks match.
            </div>
          ) : (
            filtered.map((task) => {
              const project = task.projectId
                ? projectById.get(task.projectId)
                : undefined
              return (
                <button
                  key={task.id}
                  type="button"
                  onClick={() => onPick(task.id)}
                  className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-app-text hover:bg-app-hover"
                >
                  {project && (
                    <span
                      className="size-2 shrink-0 rounded-full"
                      style={{ background: project.color }}
                    />
                  )}
                  <span className="flex-1 truncate">{task.title}</span>
                  {project && (
                    <span className="text-[11px] text-app-text-muted">
                      {project.emoji ?? ""} {project.name}
                    </span>
                  )}
                </button>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
