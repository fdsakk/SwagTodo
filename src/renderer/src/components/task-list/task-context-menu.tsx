import * as ContextMenu from '@radix-ui/react-context-menu'
import { format, parseISO } from 'date-fns'
import {
  Archive,
  ArchiveRestore,
  CalendarIcon,
  Check,
  ChevronRight,
  Flag,
  Trash2,
  TrendingUp
} from 'lucide-react'
import { cn } from '@renderer/utils/cn'
import type { Priority, Task, TaskStatus } from '@renderer/types'
import { PRIORITY_META } from '@renderer/utils/task'
import { Calendar } from '@renderer/components/ui/calendar'

const STATUSES: { value: TaskStatus; label: string }[] = [
  { value: 'todo', label: 'To Do' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'done', label: 'Done' }
]

const PRIORITIES: { value: Priority; label: string }[] = [
  { value: 'p1', label: 'Urgent' },
  { value: 'p2', label: 'High' },
  { value: 'p3', label: 'Medium' },
  { value: 'p4', label: 'None' }
]

const menuContentClass =
  'z-50 min-w-[160px] overflow-hidden rounded-md border border-app-border bg-app-card p-1.5 shadow-xl'
const menuItemClass =
  'flex h-8 cursor-default select-none items-center gap-2 rounded px-2 text-sm text-app-text-secondary outline-none data-[highlighted]:bg-app-hover data-[highlighted]:text-app-text data-[disabled]:opacity-40'
const subTriggerClass = cn(
  menuItemClass,
  'data-[state=open]:bg-app-hover data-[state=open]:text-app-text'
)
const separatorClass = 'my-1 h-px bg-app-border'

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
    onSetDueDate(task.id, day ? format(day, 'yyyy-MM-dd') : undefined)
  }

  return (
    <ContextMenu.Root>
      <ContextMenu.Trigger asChild>{children}</ContextMenu.Trigger>

      <ContextMenu.Portal>
        <ContextMenu.Content className={menuContentClass}>
          {task.archivedAt ? (
            <ContextMenu.Item className={menuItemClass} onSelect={() => onUnarchive(task.id)}>
              <ArchiveRestore size={14} className="shrink-0" />
              Unarchive
            </ContextMenu.Item>
          ) : (
            <ContextMenu.Item className={menuItemClass} onSelect={() => onArchive(task.id)}>
              <Archive size={14} className="shrink-0" />
              Archive
            </ContextMenu.Item>
          )}

          <ContextMenu.Separator className={separatorClass} />

          {/* Priority submenu */}
          <ContextMenu.Sub>
            <ContextMenu.SubTrigger className={subTriggerClass}>
              <Flag size={13} className="shrink-0" />
              <span className="flex-1">Set Urgency</span>
              <ChevronRight size={12} className="text-app-text-muted" />
            </ContextMenu.SubTrigger>
            <ContextMenu.Portal>
              <ContextMenu.SubContent className={menuContentClass} sideOffset={2} alignOffset={-4}>
                {PRIORITIES.map((p) => (
                  <ContextMenu.Item
                    key={p.value}
                    className={menuItemClass}
                    onSelect={() => onSetPriority(task.id, p.value)}
                  >
                    <span
                      className="size-2 shrink-0 rounded-full"
                      style={{ background: PRIORITY_META[p.value].color }}
                    />
                    <span className="flex-1">{p.label}</span>
                    {task.priority === p.value && (
                      <Check size={12} className="text-app-text-muted" />
                    )}
                  </ContextMenu.Item>
                ))}
              </ContextMenu.SubContent>
            </ContextMenu.Portal>
          </ContextMenu.Sub>

          {/* Status submenu */}
          <ContextMenu.Sub>
            <ContextMenu.SubTrigger className={subTriggerClass}>
              <TrendingUp size={13} className="shrink-0" />
              <span className="flex-1">Progress</span>
              <ChevronRight size={12} className="text-app-text-muted" />
            </ContextMenu.SubTrigger>
            <ContextMenu.Portal>
              <ContextMenu.SubContent className={menuContentClass} sideOffset={2} alignOffset={-4}>
                {STATUSES.map((s) => (
                  <ContextMenu.Item
                    key={s.value}
                    className={menuItemClass}
                    onSelect={() => onSetStatus(task.id, s.value)}
                  >
                    <span className="flex-1">{s.label}</span>
                    {task.status === s.value && <Check size={12} className="text-app-text-muted" />}
                  </ContextMenu.Item>
                ))}
              </ContextMenu.SubContent>
            </ContextMenu.Portal>
          </ContextMenu.Sub>

          <ContextMenu.Sub>
            <ContextMenu.SubTrigger className={subTriggerClass}>
              <CalendarIcon size={13} className="shrink-0" />
              <span className="flex-1">Due Date</span>
              <ChevronRight size={12} className="text-app-text-muted" />
            </ContextMenu.SubTrigger>
            <ContextMenu.Portal>
              <ContextMenu.SubContent
                className={cn(menuContentClass, 'w-auto p-0')}
                sideOffset={2}
                alignOffset={-4}
              >
                <Calendar
                  mode="single"
                  selected={task.dueDate ? parseISO(task.dueDate) : undefined}
                  onSelect={handleDaySelect}
                />
                {task.dueDate && (
                  <ContextMenu.Item
                    className={cn(menuItemClass, 'mx-1.5 mb-1.5')}
                    onSelect={() => handleDaySelect(undefined)}
                  >
                    Clear due date
                  </ContextMenu.Item>
                )}
              </ContextMenu.SubContent>
            </ContextMenu.Portal>
          </ContextMenu.Sub>

          <ContextMenu.Separator className={separatorClass} />

          <ContextMenu.Item
            className={cn(
              menuItemClass,
              'text-red-300 data-[highlighted]:bg-red-500/10 data-[highlighted]:text-red-200 [.app-theme-light_&]:text-red-800 [.app-theme-light_&]:data-[highlighted]:bg-red-700/15 [.app-theme-light_&]:data-[highlighted]:text-red-950'
            )}
            onSelect={() => onDelete(task.id)}
          >
            <Trash2 size={13} className="shrink-0" />
            Delete
          </ContextMenu.Item>
        </ContextMenu.Content>
      </ContextMenu.Portal>
    </ContextMenu.Root>
  )
}
