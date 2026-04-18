import { memo, useCallback, useMemo, useState } from 'react'
import { Plus } from 'lucide-react'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { useDroppable } from '@dnd-kit/core'
import type { Label, Task, TaskStatus } from '@renderer/types'
import { COLUMN_PREFIX, resolveTaskLabels } from './types'
import { SortableCard } from './KanbanCard'

interface KanbanColumnProps {
  status: TaskStatus
  title: string
  tasks: Task[]
  labelMap: Map<string, Label>
  adding: boolean
  onToggleAdd: (status: TaskStatus) => void
  onAddTask: (status: TaskStatus, title: string) => void
  onOpenTask: (taskId: string) => void
}

export const KanbanColumn = memo(function KanbanColumn({
  status,
  title,
  tasks,
  labelMap,
  adding,
  onToggleAdd,
  onAddTask,
  onOpenTask
}: KanbanColumnProps): React.JSX.Element {
  const { setNodeRef } = useDroppable({ id: `${COLUMN_PREFIX}${status}` })
  const [titleInput, setTitleInput] = useState('')

  const items = useMemo(() => tasks.map((t) => t.id), [tasks])

  const commit = useCallback(() => {
    const trimmed = titleInput.trim()
    if (!trimmed) return
    onAddTask(status, trimmed)
    setTitleInput('')
    onToggleAdd(status)
  }, [titleInput, onAddTask, status, onToggleAdd])

  const cancel = useCallback(() => {
    setTitleInput('')
    onToggleAdd(status)
  }, [onToggleAdd, status])

  const toggle = useCallback(() => onToggleAdd(status), [onToggleAdd, status])

  return (
    <div className="flex min-h-[360px] flex-col">
      <div className="mb-2 flex h-8 items-center justify-between px-1">
        <div className="flex items-center gap-2 text-sm text-app-text-muted">
          <span className="font-semibold text-app-text-secondary">{title}</span>
          <span>{tasks.length}</span>
        </div>
        <button
          className="flex h-6 w-6 items-center justify-center rounded text-app-text-muted hover:bg-app-hover hover:text-app-text-secondary"
          onClick={toggle}
          type="button"
        >
          <Plus size={14} />
        </button>
      </div>

      {adding && (
        <div className="mb-2 rounded-md border border-app-border bg-app-hover p-2">
          <input
            autoFocus
            className="w-full bg-transparent text-sm text-app-text placeholder:text-app-text-muted focus:outline-none"
            onChange={(event) => setTitleInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') commit()
              else if (event.key === 'Escape') cancel()
            }}
            placeholder="Task title"
            value={titleInput}
          />
        </div>
      )}

      <div className="flex-1 space-y-2" ref={setNodeRef}>
        <SortableContext items={items} strategy={verticalListSortingStrategy}>
          {tasks.map((task) => (
            <SortableCard
              key={task.id}
              labels={resolveTaskLabels(task, labelMap)}
              onOpen={onOpenTask}
              task={task}
            />
          ))}
        </SortableContext>
      </div>
    </div>
  )
})
