import {
  Select,
  SelectGroup,
  SelectItem,
  SelectPopup,
  SelectTrigger,
  SelectValue
} from "@renderer/components/ui/select"
import type { Task } from "@renderer/types"
import { cn } from "@renderer/utils/cn"
import { CheckCircle2, Circle, Lock, X } from "lucide-react"
import { useMemo } from "react"

interface DependencyListProps {
  task: Task
  tasks: readonly Task[]
  onChange: (blockedBy: string[]) => void
  onOpenTask: (taskId: string) => void
}

const PLACEHOLDER = "__add__"

export function DependencyList({
  task,
  tasks,
  onChange,
  onOpenTask
}: DependencyListProps): React.JSX.Element {
  const byId = useMemo(() => new Map(tasks.map((t) => [t.id, t])), [tasks])
  const blockers = (task.blockedBy ?? [])
    .map((id) => byId.get(id))
    .filter((t): t is Task => Boolean(t))
  const blocking = tasks.filter((t) => t.blockedBy?.includes(task.id))

  const candidates = useMemo(() => {
    const taken = new Set([task.id, ...(task.blockedBy ?? [])])
    // Prevent direct cycles: tasks already waiting on this one.
    for (const t of tasks) if (t.blockedBy?.includes(task.id)) taken.add(t.id)
    return tasks
      .filter((t) => !taken.has(t.id) && !t.archivedAt && !t.completed)
      .slice(0, 300)
      .map((t) => ({ value: t.id, label: t.title }))
  }, [task.blockedBy, task.id, tasks])

  const remaining = blockers.filter((t) => !t.completed).length

  return (
    <div className="space-y-2">
      <p className="flex items-center gap-1.5 text-xs font-medium text-app-text-muted">
        <Lock size={12} />
        Blocked by
        {remaining > 0 && (
          <span className="text-amber-400/90">· {remaining} open</span>
        )}
      </p>
      {blockers.length > 0 && (
        <ul className="space-y-1">
          {blockers.map((blocker) => (
            <li
              className="group flex items-center gap-2 text-sm"
              key={blocker.id}
            >
              {blocker.completed ? (
                <CheckCircle2 className="shrink-0 text-emerald-400" size={14} />
              ) : (
                <Circle className="shrink-0 text-app-text-muted" size={14} />
              )}
              <button
                className={cn(
                  "min-w-0 truncate text-left hover:underline",
                  blocker.completed
                    ? "text-app-text-muted line-through"
                    : "text-app-text"
                )}
                onClick={() => onOpenTask(blocker.id)}
                type="button"
              >
                {blocker.title}
              </button>
              <button
                aria-label="Remove dependency"
                className="ml-auto opacity-0 text-app-text-muted hover:text-app-text group-hover:opacity-100"
                onClick={() =>
                  onChange(
                    (task.blockedBy ?? []).filter((id) => id !== blocker.id)
                  )
                }
                type="button"
              >
                <X size={12} />
              </button>
            </li>
          ))}
        </ul>
      )}
      {candidates.length > 0 && (
        <Select
          items={[
            { value: PLACEHOLDER, label: "Add blocking task…" },
            ...candidates
          ]}
          onValueChange={(value) => {
            if (value && value !== PLACEHOLDER)
              onChange([...(task.blockedBy ?? []), value])
          }}
          value={PLACEHOLDER}
        >
          <SelectTrigger className="w-full max-w-sm" size="sm">
            <SelectValue />
          </SelectTrigger>
          <SelectPopup className="max-h-72">
            <SelectGroup>
              {candidates.map((candidate) => (
                <SelectItem key={candidate.value} value={candidate.value}>
                  <span className="truncate">{candidate.label}</span>
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectPopup>
        </Select>
      )}
      {blocking.length > 0 && (
        <p className="text-xs text-app-text-muted">
          Blocks:{" "}
          {blocking.map((t, i) => (
            <span key={t.id}>
              {i > 0 && ", "}
              <button
                className="text-app-text-secondary hover:underline"
                onClick={() => onOpenTask(t.id)}
                type="button"
              >
                {t.title}
              </button>
            </span>
          ))}
        </p>
      )}
    </div>
  )
}
