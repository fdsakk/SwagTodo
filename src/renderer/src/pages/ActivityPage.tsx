import { useMemo } from 'react'
import { Check, Pencil, Plus } from 'lucide-react'
import { format, formatDistanceToNow, isToday, isYesterday, parseISO } from 'date-fns'
import useAppStore from '@renderer/store/useAppStore'
import type { Project, Task } from '@renderer/types'
import { useShallow } from 'zustand/react/shallow'

type ActivityKind = 'created' | 'edited' | 'completed'

interface ActivityEvent {
  id: string
  kind: ActivityKind
  at: string
  task: Task
}

function buildEvents(tasks: Task[]): ActivityEvent[] {
  const events: ActivityEvent[] = []
  for (const task of tasks) {
    events.push({ id: `${task.id}:created`, kind: 'created', at: task.createdAt, task })
    if (task.completedAt) {
      events.push({ id: `${task.id}:completed`, kind: 'completed', at: task.completedAt, task })
    }
    if (task.updatedAt !== task.createdAt && task.updatedAt !== task.completedAt) {
      events.push({ id: `${task.id}:edited`, kind: 'edited', at: task.updatedAt, task })
    }
  }
  return events.sort((a, b) => Date.parse(b.at) - Date.parse(a.at))
}

function groupByDay(
  events: ActivityEvent[]
): { key: string; label: string; events: ActivityEvent[] }[] {
  const map = new Map<string, ActivityEvent[]>()
  for (const event of events) {
    const day = format(parseISO(event.at), 'yyyy-MM-dd')
    const bucket = map.get(day) ?? []
    bucket.push(event)
    map.set(day, bucket)
  }
  return Array.from(map.entries()).map(([key, items]) => {
    const date = parseISO(key)
    let label = format(date, 'd MMM · EEEE')
    if (isToday(date)) label = `${format(date, 'd MMM')} · Today · ${format(date, 'EEEE')}`
    else if (isYesterday(date))
      label = `${format(date, 'd MMM')} · Yesterday · ${format(date, 'EEEE')}`
    return { key, label, events: items }
  })
}

const KIND_META: Record<ActivityKind, { verb: string; icon: React.ReactNode; iconClass: string }> =
  {
    created: {
      verb: 'You created',
      icon: <Plus size={12} />,
      iconClass: 'bg-blue-500/15 text-blue-400'
    },
    edited: {
      verb: 'You edited',
      icon: <Pencil size={12} />,
      iconClass: 'bg-amber-500/15 text-amber-400'
    },
    completed: {
      verb: 'You completed',
      icon: <Check size={12} />,
      iconClass: 'bg-emerald-500/15 text-emerald-400'
    }
  }

function ActivityRow({
  event,
  project,
  onOpen
}: {
  event: ActivityEvent
  project?: Project
  onOpen: (taskId: string) => void
}): React.JSX.Element {
  const meta = KIND_META[event.kind]
  const relative = formatDistanceToNow(parseISO(event.at), { addSuffix: true })
  const titleClass =
    event.kind === 'completed' ? 'text-app-text-muted line-through' : 'text-app-text'

  return (
    <li
      className="grid grid-cols-[24px_110px_1fr_150px_130px] items-center gap-3 border-b border-app-border py-2.5 px-2 hover:bg-app-hover cursor-pointer"
      onClick={() => onOpen(event.task.id)}
    >
      <span className={`flex h-6 w-6 items-center justify-center rounded-full ${meta.iconClass}`}>
        {meta.icon}
      </span>
      <span className="text-sm text-app-text-secondary">{meta.verb}</span>
      <span className={`truncate rounded-md bg-app-hover px-2 py-0.5 text-sm ${titleClass}`}>
        {event.task.title}
      </span>
      <span className="truncate text-xs text-app-text-muted">
        {project ? `${project.emoji ?? '#'} ${project.name}` : 'Inbox'}
      </span>
      <span className="text-xs text-app-text-muted text-right">{relative}</span>
    </li>
  )
}

export default function ActivityPage(): React.JSX.Element {
  const { tasks, projects, openEditPanel } = useAppStore(
    useShallow((state) => ({
      tasks: state.tasks,
      projects: state.projects,
      openEditPanel: state.openEditPanel
    }))
  )

  const days = useMemo(() => groupByDay(buildEvents(tasks)), [tasks])
  const projectById = useMemo(() => new Map(projects.map((p) => [p.id, p])), [projects])

  if (days.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center text-center">
        <p className="text-sm text-app-text-secondary">No activity yet</p>
        <p className="mt-1 text-xs text-app-text-muted">
          Create or complete a task to see it here.
        </p>
      </div>
    )
  }

  return (
    <div className="h-full overflow-y-auto px-4 pb-6">
      <h2 className="mb-4 px-2 text-base font-semibold text-app-text">Activity</h2>
      <div className="space-y-6">
        {days.map((day) => (
          <section key={day.key}>
            <h3 className="mb-1 flex items-center gap-2 px-2 text-xs font-medium text-app-text-secondary">
              <span>{day.label}</span>
              <span className="text-app-text-muted">{day.events.length}</span>
            </h3>
            <ul>
              {day.events.map((event) => (
                <ActivityRow
                  event={event}
                  key={event.id}
                  onOpen={openEditPanel}
                  project={event.task.projectId ? projectById.get(event.task.projectId) : undefined}
                />
              ))}
            </ul>
          </section>
        ))}
        <p className="pt-2 text-center text-xs text-app-text-muted">
          That&apos;s it. No more history to load.
        </p>
      </div>
    </div>
  )
}
