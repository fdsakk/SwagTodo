import { AnimatedCheckbox } from "@renderer/components/task-list/animated-checkbox"
import { Button } from "@renderer/components/ui/button"
import { Input } from "@renderer/components/ui/input"
import type { SubTask } from "@renderer/types"
import { cn } from "@renderer/utils/cn"
import { Trash2 } from "lucide-react"

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
    <div className="space-y-2">
      <p className="text-xs font-medium text-app-text-muted">Subtasks</p>
      <div className="space-y-1">
        {subTasks.map((subTask) => (
          <div
            className="group flex items-center gap-2 rounded px-1 py-1 hover:bg-app-hover/40"
            key={subTask.id}
          >
            <AnimatedCheckbox
              checked={subTask.completed}
              className="size-[14px]"
              onCheckedChange={() => onToggle(subTask.id)}
            />
            <span
              className={cn(
                "flex-1 text-sm text-app-text-secondary",
                subTask.completed && "line-through text-app-text-muted"
              )}
            >
              {subTask.title}
            </span>
            <Button
              aria-label="Delete subtask"
              className="opacity-0 group-hover:opacity-100"
              onClick={() => onDelete(subTask.id)}
              size="icon-xs"
              type="button"
              variant="ghost"
            >
              <Trash2 size={11} />
            </Button>
          </div>
        ))}
      </div>
      <Input
        onChange={(event) => onNewSubTaskTitleChange(event.target.value)}
        onKeyDown={onAdd}
        placeholder="+ Add subtask"
        size="sm"
        value={newSubTaskTitle}
      />
    </div>
  )
}
