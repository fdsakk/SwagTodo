import { AnimatePresence, motion } from 'framer-motion'
import useAppStore from '@renderer/store/useAppStore'
import TaskEditPanel from '@renderer/components/TaskEditPanel'
import TaskCreatePanel from '@renderer/components/TaskCreatePanel'
import ProjectPanel from '@renderer/components/ProjectPanel'

interface TaskDetailPanelProps {
  onClose: () => void
}

export default function TaskDetailPanel({ onClose }: TaskDetailPanelProps): React.JSX.Element {
  const taskPanel = useAppStore((state) => state.taskPanel)
  const task = useAppStore((state) =>
    taskPanel.open && taskPanel.mode === 'edit'
      ? state.tasks.find((t) => t.id === taskPanel.taskId)
      : undefined
  )
  const editingProject = useAppStore((state) =>
    taskPanel.open && taskPanel.mode === 'edit_project'
      ? state.projects.find((p) => p.id === taskPanel.projectId)
      : undefined
  )

  const visible =
    taskPanel.open &&
    (taskPanel.mode === 'create' ||
      taskPanel.mode === 'create_project' ||
      (taskPanel.mode === 'edit' && task) ||
      (taskPanel.mode === 'edit_project' && editingProject))

  const panelKey = !taskPanel.open
    ? 'closed'
    : taskPanel.mode === 'edit'
      ? `edit-${taskPanel.taskId}`
      : taskPanel.mode === 'edit_project'
        ? `edit-project-${taskPanel.projectId}`
        : taskPanel.mode === 'create'
          ? `create-${taskPanel.projectId ?? 'inbox'}`
          : 'create-project'

  return (
    <AnimatePresence>
      {visible && (
        <>
          <motion.div
            animate={{ opacity: 1 }}
            className="fixed left-2 right-2 top-8 bottom-2 z-20 rounded-lg bg-black/40"
            exit={{ opacity: 0 }}
            initial={{ opacity: 0 }}
            onClick={onClose}
            transition={{ duration: 0.18 }}
          />
          <motion.aside
            animate={{ opacity: 1 }}
            className="fixed right-2 top-8 bottom-2 z-30 w-auto rounded-r-lg border-l-8 border-app-titlebar bg-app-bg"
            exit={{ opacity: 0 }}
            initial={{ opacity: 0 }}
            key={panelKey}
            transition={{ duration: 0.18, ease: 'easeOut' }}
          >
            {taskPanel.open && taskPanel.mode === 'edit' && task && (
              <TaskEditPanel onClose={onClose} task={task} />
            )}
            {taskPanel.open && taskPanel.mode === 'create' && (
              <TaskCreatePanel
                defaultDueDate={taskPanel.dueDate}
                defaultProjectId={taskPanel.projectId}
                defaultStatus={taskPanel.status}
                onClose={onClose}
              />
            )}
            {taskPanel.open && taskPanel.mode === 'create_project' && (
              <ProjectPanel onClose={onClose} />
            )}
            {taskPanel.open && taskPanel.mode === 'edit_project' && editingProject && (
              <ProjectPanel onClose={onClose} project={editingProject} />
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}
