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

  const isTaskEdit = taskPanel.open && taskPanel.mode === 'edit' && task

  return (
    <AnimatePresence>
      {visible && (
        <>
          <motion.div
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-20 bg-black/50 backdrop-blur-sm"
            exit={{ opacity: 0 }}
            initial={{ opacity: 0 }}
            onClick={onClose}
            transition={{ duration: 0.15 }}
          />
          <motion.div
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className={`fixed inset-0 z-30 flex items-center justify-center p-6 pointer-events-none`}
            exit={{ opacity: 0, scale: 0.97, y: 8 }}
            initial={{ opacity: 0, scale: 0.97, y: 8 }}
            key={panelKey}
            transition={{ duration: 0.18, ease: 'easeOut' }}
          >
            <div
              className={`pointer-events-auto w-full overflow-hidden rounded-xl border border-app-border bg-app-bg shadow-2xl ${isTaskEdit ? 'max-w-4xl' : 'max-w-xl'}`}
              style={{ maxHeight: 'calc(100vh - 80px)' }}
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
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
