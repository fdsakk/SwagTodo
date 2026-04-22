import { useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { TaskEditPanel } from './TaskEditPanel'
import { TaskCreatePanel } from './TaskCreatePanel'
import { ProjectPanel } from '@renderer/components/project/ProjectPanel'
import {
  selectEditingProjectById,
  selectTaskById,
  useDomainStore,
  useUiStore
} from '@renderer/store'

interface TaskDetailPanelProps {
  onClose: () => void
}

export function TaskDetailPanel({ onClose }: TaskDetailPanelProps): React.JSX.Element {
  const taskPanel = useUiStore((state) => state.taskPanel)
  const closeTaskPanel = useUiStore((state) => state.closeTaskPanel)
  const task = useDomainStore((state) =>
    taskPanel.open && taskPanel.mode === 'edit'
      ? selectTaskById(state, taskPanel.taskId)
      : undefined
  )
  const editingProject = useDomainStore((state) =>
    taskPanel.open && taskPanel.mode === 'edit_project'
      ? selectEditingProjectById(state, taskPanel.projectId)
      : undefined
  )

  useEffect(() => {
    if (!taskPanel.open) return
    if (taskPanel.mode === 'edit' && !task) closeTaskPanel()
    if (taskPanel.mode === 'edit_project' && !editingProject) closeTaskPanel()
  }, [closeTaskPanel, editingProject, task, taskPanel])

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
          ? `create-${taskPanel.defaults.projectId ?? 'inbox'}`
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
                defaultDueDate={taskPanel.defaults.dueDate}
                defaultProjectId={taskPanel.defaults.projectId}
                defaultStatus={taskPanel.defaults.status}
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
