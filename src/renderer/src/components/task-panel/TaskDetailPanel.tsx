import { useEffect } from 'react'
import { Dialog, DialogPopup } from '@renderer/components/ui/dialog'
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

  const visible = Boolean(
    taskPanel.open &&
    (taskPanel.mode === 'create' ||
      taskPanel.mode === 'create_project' ||
      (taskPanel.mode === 'edit' && task) ||
      (taskPanel.mode === 'edit_project' && editingProject))
  )

  const isTaskDialog =
    taskPanel.open && (taskPanel.mode === 'create' || (taskPanel.mode === 'edit' && Boolean(task)))

  return (
    <Dialog
      open={visible}
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
    >
      <DialogPopup
        showCloseButton={false}
        className={isTaskDialog ? 'sm:max-w-2xl' : 'sm:max-w-md'}
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
      </DialogPopup>
    </Dialog>
  )
}
