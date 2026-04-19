import type { SubTask } from '@renderer/types'
import { AnimatedCheckbox } from '@renderer/components/task-list/animated-checkbox'
import { cn } from '@renderer/utils/cn'
import { Trash2 } from 'lucide-react'

interface SubtaskListProps {
  taskId: string
  subTasks: SubTask[]
  newSubTaskTitle: string
  onNewSubTaskTitleChange: (value: string) => void
  onToggle: (subTaskId: string) => void
  onDelete: (subTaskId: string) => void
  onAdd: (e: React.KeyboardEvent<HTMLInputElement>) => void
}

export function SubtaskList({
  subTasks,
  newSubTaskTitle,
  onNewSubTaskTitleChange,
  onToggle,
  onDelete,
  onAdd
}: SubtaskListProps): React.JSX.Element {
  return (
    <div>
      <div className="mb-2 text-xs text-app-text-muted">Subtasks</div>
      <div className="space-y-1">
        {subTasks.map((subTask) => (
          <div
            className="group flex items-center gap-2 rounded px-1 py-1 hover:bg-white/[0.02]"
            key={subTask.id}
          >
            <AnimatedCheckbox
              checked={subTask.completed}
              className="size-[14px]"
              onCheckedChange={() => onToggle(subTask.id)}
            />
            <span
              className={cn(
                'flex-1 text-sm text-app-text-secondary',
                subTask.completed && 'line-through text-app-text-muted'
              )}
            >
              {subTask.title}
            </span>
            <button
              className="flex size-5 items-center justify-center rounded text-app-text-muted opacity-0 hover:bg-app-hover hover:text-app-text-secondary group-hover:opacity-100"
              onClick={() => onDelete(subTask.id)}
              type="button"
            >
              <Trash2 size={11} />
            </button>
          </div>
        ))}
      </div>
      <input
        className="mt-1 h-7 w-full bg-transparent px-1 text-sm text-app-text-secondary placeholder:text-app-text-muted focus:outline-none"
        onChange={(event) => onNewSubTaskTitleChange(event.target.value)}
        onKeyDown={onAdd}
        placeholder="+ Add subtask"
        value={newSubTaskTitle}
      />
    </div>
  )
}
