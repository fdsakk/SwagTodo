import { ContextMenu } from "@base-ui/react/context-menu"
import { Button } from "@renderer/components/ui/button"
import { Calendar } from "@renderer/components/ui/calendar"
import type { Priority, Task, TaskStatus } from "@renderer/types"
import { cn } from "@renderer/utils/cn"
import { PRIORITY_META } from "@renderer/utils/task"
import { format, parseISO } from "date-fns"
import {
  Archive,
  ArchiveRestore,
  CalendarIcon,
  Check,
  ChevronRight,
  Flag,
  Trash2,
  TrendingUp
} from "lucide-react"

const STATUSES: readonly { value: TaskStatus; label: string }[] = [
  { value: "todo", label: "To Do" },
  { value: "in_progress", label: "In Progress" },
  { value: "done", label: "Done" }
]

const PRIORITIES: readonly { value: Priority; label: string }[] = (
  ["p1", "p2", "p3", "p4"] as const
).map((value) => ({ value, label: PRIORITY_META[value].label }))

const menuContentClass =
  "z-50 min-w-[160px] overflow-hidden rounded-md border border-app-border bg-app-card p-1.5 shadow-xl outline-none focus:outline-none focus-visible:outline-none"
const menuItemClass =
  "flex h-8 cursor-default select-none items-center gap-2 rounded px-2 text-sm text-app-text-secondary outline-none focus:outline-none focus-visible:outline-none data-highlighted:bg-app-hover data-highlighted:text-app-text data-disabled:opacity-40"
const subTriggerClass = cn(
  menuItemClass,
  "data-popup-open:bg-app-hover data-popup-open:text-app-text"
)
const separatorClass = "my-1 h-px bg-app-border"

interface SubmenuShellProps {
  icon: React.ReactNode
  label: string
  children: React.ReactNode
  popupClassName?: string
}

function SubmenuShell({
  icon,
  label,
  children,
  popupClassName
}: SubmenuShellProps): React.JSX.Element {
  return (
    <ContextMenu.SubmenuRoot>
      <ContextMenu.SubmenuTrigger className={subTriggerClass}>
        {icon}
        <span className="flex-1">{label}</span>
        <ChevronRight size={12} className="text-app-text-muted" />
      </ContextMenu.SubmenuTrigger>
      <ContextMenu.Portal>
        <ContextMenu.Positioner
          alignOffset={-4}
          className="z-50"
          sideOffset={2}
        >
          <ContextMenu.Popup className={cn(menuContentClass, popupClassName)}>
            {children}
          </ContextMenu.Popup>
        </ContextMenu.Positioner>
      </ContextMenu.Portal>
    </ContextMenu.SubmenuRoot>
  )
}

interface CheckedMenuItemProps<T extends string> {
  value: T
  label: string
  active: boolean
  onSelect: (value: T) => void
  swatch?: string
}

function CheckedMenuItem<T extends string>({
  value,
  label,
  active,
  onSelect,
  swatch
}: CheckedMenuItemProps<T>): React.JSX.Element {
  return (
    <ContextMenu.Item className={menuItemClass} onClick={() => onSelect(value)}>
      {swatch && (
        <span
          className="size-2 shrink-0 rounded-full"
          style={{ background: swatch }}
        />
      )}
      <span className="flex-1">{label}</span>
      {active && <Check size={12} className="text-app-text-muted" />}
    </ContextMenu.Item>
  )
}

interface TaskContextMenuProps {
  task: Task
  onArchive: (taskId: string) => void
  onUnarchive: (taskId: string) => void
  onDelete: (taskId: string) => void
  onSetPriority: (taskId: string, priority: Priority) => void
  onSetStatus: (taskId: string, status: TaskStatus) => void
  onSetDueDate: (taskId: string, dueDate: string | undefined) => void
  children: React.ReactNode
}

export function TaskContextMenu({
  task,
  onArchive,
  onUnarchive,
  onDelete,
  onSetPriority,
  onSetStatus,
  onSetDueDate,
  children
}: TaskContextMenuProps): React.JSX.Element {
  const handleDaySelect = (day: Date | undefined): void => {
    onSetDueDate(task.id, day ? format(day, "yyyy-MM-dd") : undefined)
  }

  return (
    <ContextMenu.Root>
      <ContextMenu.Trigger render={children as React.ReactElement} />

      <ContextMenu.Portal>
        <ContextMenu.Positioner className="z-50">
          <ContextMenu.Popup className={menuContentClass}>
            {task.archivedAt ? (
              <ContextMenu.Item
                className={menuItemClass}
                onClick={() => onUnarchive(task.id)}
              >
                <ArchiveRestore size={14} className="shrink-0" />
                Unarchive
              </ContextMenu.Item>
            ) : (
              <ContextMenu.Item
                className={menuItemClass}
                onClick={() => onArchive(task.id)}
              >
                <Archive size={14} className="shrink-0" />
                Archive
              </ContextMenu.Item>
            )}

            <ContextMenu.Separator className={separatorClass} />

            <SubmenuShell
              icon={<Flag size={13} className="shrink-0" />}
              label="Set Urgency"
            >
              {PRIORITIES.map((p) => (
                <CheckedMenuItem
                  key={p.value}
                  value={p.value}
                  label={p.label}
                  active={task.priority === p.value}
                  onSelect={(value) => onSetPriority(task.id, value)}
                  swatch={PRIORITY_META[p.value].color}
                />
              ))}
            </SubmenuShell>

            <SubmenuShell
              icon={<TrendingUp size={13} className="shrink-0" />}
              label="Progress"
            >
              {STATUSES.map((s) => (
                <CheckedMenuItem
                  key={s.value}
                  value={s.value}
                  label={s.label}
                  active={task.status === s.value}
                  onSelect={(value) => onSetStatus(task.id, value)}
                />
              ))}
            </SubmenuShell>

            <SubmenuShell
              icon={<CalendarIcon size={13} className="shrink-0" />}
              label="Due Date"
              popupClassName="w-auto p-0"
            >
              <Calendar
                mode="single"
                selected={task.dueDate ? parseISO(task.dueDate) : undefined}
                onSelect={handleDaySelect}
              />
              {task.dueDate && (
                <ContextMenu.Item
                  className={cn(menuItemClass, "mx-1.5 mb-1.5")}
                  onClick={() => handleDaySelect(undefined)}
                >
                  Clear due date
                </ContextMenu.Item>
              )}
            </SubmenuShell>

            <ContextMenu.Separator className={separatorClass} />

            <ContextMenu.Item
              className="rounded px-2 outline-none focus:outline-none focus-visible:outline-none"
              onClick={() => onDelete(task.id)}
              render={
                <Button
                  variant="ghost-destructive"
                  className="w-full justify-start gap-2"
                >
                  <Trash2 size={12} className="shrink-0" />
                  Delete
                </Button>
              }
            />
          </ContextMenu.Popup>
        </ContextMenu.Positioner>
      </ContextMenu.Portal>
    </ContextMenu.Root>
  )
}
