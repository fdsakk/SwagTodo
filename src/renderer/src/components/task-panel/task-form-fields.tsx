import { memo, useCallback } from 'react'
import { format, parseISO } from 'date-fns'
import { CalendarIcon, ChevronDownIcon, X } from 'lucide-react'
import { Button } from '@renderer/components/ui/button'
import { Calendar } from '@renderer/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@renderer/components/ui/popover'
import { Separator } from '@renderer/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@renderer/components/ui/select'
import type { Label, Priority, Project, TaskStatus } from '@renderer/types'
import { PRIORITY_META } from '@renderer/utils/task'
import { Field } from './panel-field'
import { cn } from '@renderer/utils/cn'

const INBOX_VALUE = '__inbox__'
const PRIORITIES: readonly Priority[] = ['p1', 'p2', 'p3', 'p4'] as const

const STATUS_OPTIONS: readonly { value: TaskStatus; label: string }[] = [
  { value: 'todo', label: 'To Do' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'done', label: 'Done' }
] as const

interface LabelChipProps {
  label: Label
  selected: boolean
  onToggle: (id: string) => void
}

const LabelChip = memo(function LabelChip({
  label,
  selected,
  onToggle
}: LabelChipProps): React.JSX.Element {
  const handleClick = useCallback(() => onToggle(label.id), [onToggle, label.id])
  return (
    <button
      className={cn(
        'h-6 rounded-md px-2 text-xs transition-colors',
        selected
          ? 'bg-app-active text-app-text'
          : 'bg-app-hover text-app-text-muted hover:bg-app-active hover:text-app-text-secondary'
      )}
      onClick={handleClick}
      type="button"
    >
      #{label.name}
    </button>
  )
})

interface TaskFormFieldsProps {
  priority: Priority
  status: TaskStatus
  projectId: string | undefined
  dueDate: string | undefined
  selectedLabelIds: readonly string[]
  projects: Project[]
  labels: Label[]
  onPriorityChange: (value: Priority) => void
  onStatusChange: (value: TaskStatus) => void
  onProjectChange: (value: string | undefined) => void
  onDueDateChange: (value: string | undefined) => void
  onToggleLabel: (id: string) => void
  emptyLabelsMessage?: string
}

function TaskFormFieldsImpl({
  priority,
  status,
  projectId,
  dueDate,
  selectedLabelIds,
  projects,
  labels,
  onPriorityChange,
  onStatusChange,
  onProjectChange,
  onDueDateChange,
  onToggleLabel,
  emptyLabelsMessage
}: TaskFormFieldsProps): React.JSX.Element {
  const selectedDate = dueDate ? parseISO(dueDate) : undefined
  const projectValue = projectId ?? INBOX_VALUE
  const selectedLabelSet = new Set(selectedLabelIds)

  const handlePriority = useCallback(
    (value: string) => onPriorityChange(value as Priority),
    [onPriorityChange]
  )
  const handleStatus = useCallback(
    (value: string) => onStatusChange(value as TaskStatus),
    [onStatusChange]
  )
  const handleProject = useCallback(
    (value: string) => onProjectChange(value === INBOX_VALUE ? undefined : value),
    [onProjectChange]
  )
  const clearDate = useCallback(() => onDueDateChange(undefined), [onDueDateChange])
  const handleCalendarSelect = useCallback(
    (date: Date | undefined) => onDueDateChange(date ? format(date, 'yyyy-MM-dd') : undefined),
    [onDueDateChange]
  )

  return (
    <>
      <div className="divide-y divide-app-border">
        <Field label="Priority">
          <Select onValueChange={handlePriority} value={priority}>
            <SelectTrigger className="h-7 border-0 bg-transparent px-0 text-sm text-app-text-secondary shadow-none focus:ring-0">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {PRIORITIES.map((p) => (
                  <SelectItem key={p} value={p}>
                    <span className="flex items-center gap-2">
                      <span
                        className="size-2 rounded-full"
                        style={{ background: PRIORITY_META[p].color }}
                      />
                      {PRIORITY_META[p].label}
                    </span>
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </Field>

        <Field label="Due date">
          <div className="flex items-center gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  className="h-7 flex-1 justify-between border-0 bg-transparent px-0 text-sm font-normal text-app-text-secondary shadow-none hover:bg-transparent hover:text-app-text data-[empty=true]:text-app-text-muted"
                  data-empty={!selectedDate}
                  type="button"
                  variant="ghost"
                >
                  <span className="flex items-center gap-2">
                    <CalendarIcon size={14} />
                    {selectedDate ? format(selectedDate, 'PPP') : 'Pick a date'}
                  </span>
                  <ChevronDownIcon size={14} />
                </Button>
              </PopoverTrigger>
              <PopoverContent align="start" className="w-auto p-0">
                <Calendar
                  defaultMonth={selectedDate}
                  mode="single"
                  onSelect={handleCalendarSelect}
                  selected={selectedDate}
                />
              </PopoverContent>
            </Popover>
            {selectedDate && (
              <button
                className="flex h-6 w-6 items-center justify-center rounded text-app-text-muted hover:bg-app-hover hover:text-app-text-secondary"
                onClick={clearDate}
                type="button"
              >
                <X size={12} />
              </button>
            )}
          </div>
        </Field>

        <Field label="Project">
          <Select onValueChange={handleProject} value={projectValue}>
            <SelectTrigger className="h-7 border-0 bg-transparent px-0 text-sm text-app-text-secondary shadow-none focus:ring-0">
              <SelectValue placeholder="Inbox" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value={INBOX_VALUE}>Inbox</SelectItem>
                {projects.map((project) => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.emoji || '#'} {project.name}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </Field>

        <Field label="Status">
          <Select onValueChange={handleStatus} value={status}>
            <SelectTrigger className="h-7 border-0 bg-transparent px-0 text-sm text-app-text-secondary shadow-none focus:ring-0">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {STATUS_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </Field>
      </div>

      {labels.length > 0 && (
        <>
          <Separator className="bg-app-border" />
          <div>
            <div className="mb-2 text-xs text-app-text-muted">Labels</div>
            <div className="flex flex-wrap gap-1.5">
              {labels.map((label) => (
                <LabelChip
                  key={label.id}
                  label={label}
                  onToggle={onToggleLabel}
                  selected={selectedLabelSet.has(label.id)}
                />
              ))}
            </div>
            {emptyLabelsMessage && selectedLabelSet.size === 0 && (
              <p className="mt-2 text-xs text-app-text-muted">{emptyLabelsMessage}</p>
            )}
          </div>
        </>
      )}
    </>
  )
}

export const TaskFormFields = memo(TaskFormFieldsImpl)
