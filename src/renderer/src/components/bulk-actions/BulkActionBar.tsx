import { buttonVariants } from "@renderer/components/ui/button"
import {
  Popover,
  PopoverPopup,
  PopoverTrigger
} from "@renderer/components/ui/popover"
import { useUndoableTaskActions } from "@renderer/hooks/useUndoableTaskActions"
import { useDomainStore, useUiStore } from "@renderer/store"
import type { Priority } from "@renderer/types"
import { cn } from "@renderer/utils/cn"
import { PRIORITY_META } from "@renderer/utils/task"
import { addDays, format, nextMonday } from "date-fns"
import {
  Archive,
  CalendarIcon,
  Check,
  Flag,
  FolderInput,
  Trash2,
  X
} from "lucide-react"
import { useEffect } from "react"
import { useShallow } from "zustand/react/shallow"

const PRIORITIES: Priority[] = ["p1", "p2", "p3", "p4"]
const itemClass =
  "flex h-8 w-full items-center gap-2 rounded px-2 text-left text-sm text-app-text-secondary hover:bg-app-hover hover:text-app-text"
const barButton = cn(
  buttonVariants({ size: "sm", variant: "ghost" }),
  "h-8 gap-1.5 px-2 text-app-text-secondary hover:text-app-text"
)

export function BulkActionBar(): React.JSX.Element | null {
  const { selectedTaskIds, clearSelection } = useUiStore(
    useShallow((state) => ({
      selectedTaskIds: state.selectedTaskIds,
      clearSelection: state.clearSelection
    }))
  )
  const { projects, tasks, updateTasks, setTasksCompleted } = useDomainStore(
    useShallow((state) => ({
      projects: state.projects,
      tasks: state.tasks,
      updateTasks: state.updateTasks,
      setTasksCompleted: state.setTasksCompleted
    }))
  )
  const { archiveTasks, deleteTasks } = useUndoableTaskActions()

  // Drop ids of tasks that disappeared (deleted elsewhere).
  useEffect(() => {
    if (selectedTaskIds.length === 0) return
    const existing = new Set(tasks.map((task) => task.id))
    const kept = selectedTaskIds.filter((id) => existing.has(id))
    if (kept.length !== selectedTaskIds.length)
      useUiStore.getState().setSelectedTaskIds(kept)
  }, [selectedTaskIds, tasks])

  if (selectedTaskIds.length === 0) return null
  const ids = selectedTaskIds
  const allDone = ids.every((id) => tasks.find((t) => t.id === id)?.completed)
  const today = new Date()
  const dates: { label: string; value?: string }[] = [
    { label: "Today", value: format(today, "yyyy-MM-dd") },
    { label: "Tomorrow", value: format(addDays(today, 1), "yyyy-MM-dd") },
    { label: "Next week", value: format(nextMonday(today), "yyyy-MM-dd") },
    { label: "No date", value: undefined }
  ]

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-4 z-20 flex justify-center px-4">
      <div className="pointer-events-auto flex items-center gap-1 rounded-xl border border-app-border bg-app-card p-1 shadow-xl">
        <span className="px-2 text-xs font-medium text-app-text">
          {ids.length} selected
        </span>
        <button
          className={barButton}
          onClick={() => setTasksCompleted(ids, !allDone)}
          type="button"
        >
          <Check size={14} />
          {allDone ? "Reopen" : "Complete"}
        </button>

        <Popover>
          <PopoverTrigger
            render={<button className={barButton} type="button" />}
          >
            <Flag size={14} />
            Priority
          </PopoverTrigger>
          <PopoverPopup className="w-44 bg-app-card p-1" side="top">
            {PRIORITIES.map((priority) => (
              <button
                className={itemClass}
                key={priority}
                onClick={() => updateTasks(ids, { priority })}
                type="button"
              >
                <span
                  className="size-2 rounded-full"
                  style={{ background: PRIORITY_META[priority].color }}
                />
                {PRIORITY_META[priority].label}
              </button>
            ))}
          </PopoverPopup>
        </Popover>

        <Popover>
          <PopoverTrigger
            render={<button className={barButton} type="button" />}
          >
            <CalendarIcon size={14} />
            Due
          </PopoverTrigger>
          <PopoverPopup className="w-44 bg-app-card p-1" side="top">
            {dates.map((date) => (
              <button
                className={itemClass}
                key={date.label}
                onClick={() => updateTasks(ids, { dueDate: date.value })}
                type="button"
              >
                {date.label}
              </button>
            ))}
          </PopoverPopup>
        </Popover>

        <Popover>
          <PopoverTrigger
            render={<button className={barButton} type="button" />}
          >
            <FolderInput size={14} />
            Move
          </PopoverTrigger>
          <PopoverPopup
            className="max-h-72 w-52 overflow-y-auto bg-app-card p-1"
            side="top"
          >
            <button
              className={itemClass}
              onClick={() => updateTasks(ids, { projectId: undefined })}
              type="button"
            >
              Inbox (no project)
            </button>
            {projects.map((project) => (
              <button
                className={itemClass}
                key={project.id}
                onClick={() => updateTasks(ids, { projectId: project.id })}
                type="button"
              >
                <span className="truncate">
                  {project.emoji || "#"} {project.name}
                </span>
              </button>
            ))}
          </PopoverPopup>
        </Popover>

        <button
          className={barButton}
          onClick={() => {
            archiveTasks(ids)
            clearSelection()
          }}
          type="button"
        >
          <Archive size={14} />
          Archive
        </button>
        <button
          className={cn(barButton, "hover:text-red-400")}
          onClick={() => {
            deleteTasks(ids)
            clearSelection()
          }}
          type="button"
        >
          <Trash2 size={14} />
          Delete
        </button>
        <button
          aria-label="Clear selection"
          className={cn(barButton, "px-1.5")}
          onClick={clearSelection}
          title="Clear selection (Esc)"
          type="button"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  )
}
