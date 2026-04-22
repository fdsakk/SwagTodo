import { useState } from 'react'
import { Trash2, X } from 'lucide-react'
import { Button } from '@renderer/components/ui/button'
import { Separator } from '@renderer/components/ui/separator'
import type { Project } from '@renderer/types'
import { PROJECT_COLOR_SWATCHES } from '@renderer/utils/task'
import { Field } from '@renderer/components/task-panel/panel-field'
import { ColorSelector } from './color-selector'
import { CustomColorInput } from './custom-color-input'
import { EmojiPicker } from './emoji-picker'
import { useShallow } from 'zustand/react/shallow'
import { useDomainStore, useUiStore } from '@renderer/store'

interface FormState {
  name: string
  emoji: string
  color: string
  description: string
}

interface ProjectPanelProps {
  project?: Project
  onClose: () => void
}

export function ProjectPanel({ project, onClose }: ProjectPanelProps): React.JSX.Element {
  const { addProject, updateProject, deleteProject } = useDomainStore(
    useShallow((state) => ({
      addProject: state.addProject,
      updateProject: state.updateProject,
      deleteProject: state.deleteProject
    }))
  )
  const selectProject = useUiStore((state) => state.selectProject)

  const [form, setForm] = useState<FormState>({
    name: project?.name ?? '',
    emoji: project?.emoji ?? '📁',
    color: project?.color ?? PROJECT_COLOR_SWATCHES[0],
    description: project?.description ?? ''
  })
  const patch = (updates: Partial<FormState>): void => setForm((f) => ({ ...f, ...updates }))

  const isEdit = Boolean(project)

  const handleSave = (): void => {
    const name = form.name.trim()
    if (!name) return
    const payload = {
      name,
      color: form.color,
      emoji: form.emoji.trim() || undefined,
      description: form.description.trim() || undefined
    }

    if (project) {
      updateProject(project.id, payload)
    } else {
      const projectId = addProject(payload)
      if (projectId) selectProject(projectId)
    }
    onClose()
  }

  const handleDelete = (): void => {
    if (!project) return
    if (window.confirm('Delete this project?')) {
      deleteProject(project.id)
      onClose()
    }
  }

  return (
    <div className="flex flex-col" style={{ maxHeight: 'calc(100vh - 80px)' }}>
      {/* Header */}
      <div className="flex items-center justify-between border-b border-app-border px-6 py-2.5">
        <span className="text-[11px] font-medium text-app-text-muted">
          {isEdit ? 'Edit project' : 'New project'}
        </span>
        <button
          className="flex h-7 w-7 items-center justify-center rounded-md text-app-text-muted hover:bg-app-hover hover:text-app-text-secondary"
          onClick={onClose}
          type="button"
        >
          <X size={15} />
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
        <input
          autoFocus
          className="w-full bg-transparent text-xl font-semibold text-zinc-100 placeholder:text-zinc-600 focus:outline-none"
          onChange={(event) => patch({ name: event.target.value })}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault()
              handleSave()
            }
            if (event.key === 'Escape') onClose()
          }}
          placeholder="Project name"
          value={form.name}
        />

        <textarea
          className="h-20 w-full resize-none bg-transparent text-sm leading-relaxed text-zinc-400 placeholder:text-zinc-600 focus:outline-none"
          onChange={(event) => patch({ description: event.target.value })}
          placeholder="Add description..."
          value={form.description}
        />

        <Separator className="bg-app-border" />

        <div className="divide-y divide-app-border">
          <Field label="Emoji">
            <EmojiPicker onSelect={(emoji) => patch({ emoji })} value={form.emoji} />
          </Field>

          <Field label="Color">
            <div className="space-y-3 pt-1">
              <ColorSelector
                colors={PROJECT_COLOR_SWATCHES}
                onColorSelect={(color) => patch({ color })}
                value={form.color}
              />
              <div className="space-y-1.5">
                <p className="text-[10px] ext-app-text-muted">Custom</p>
                <CustomColorInput onChange={(color) => patch({ color })} value={form.color} />
              </div>
            </div>
          </Field>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between border-t border-app-border px-6 py-2.5">
        {isEdit ? (
          <Button
            className="h-7 bg-transparent px-2 text-xs text-app-text-muted hover:bg-app-hover hover:text-red-400"
            onClick={handleDelete}
            type="button"
            variant="ghost"
          >
            <Trash2 size={12} />
            Delete
          </Button>
        ) : (
          <div />
        )}
        <div className="flex items-center gap-2">
          <Button
            className="h-7 bg-transparent px-3 text-xs text-app-text-muted hover:bg-app-hover hover:text-app-text-secondary"
            onClick={onClose}
            type="button"
            variant="ghost"
          >
            Cancel
          </Button>
          <Button
            className="h-7 px-4 text-xs"
            disabled={!form.name.trim()}
            onClick={handleSave}
            type="button"
          >
            {isEdit ? 'Save' : 'Add project'}
          </Button>
        </div>
      </div>
    </div>
  )
}
