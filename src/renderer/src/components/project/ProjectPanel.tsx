import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import { Button } from '@renderer/components/ui/button'
import { Field, FieldLabel } from '@renderer/components/ui/field'
import { Input } from '@renderer/components/ui/input'
import {
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogPanel,
  DialogTitle
} from '@renderer/components/ui/dialog'
import { Textarea } from '@renderer/components/ui/textarea'
import type { Project } from '@renderer/types'
import { PROJECT_COLOR_SWATCHES } from '@renderer/utils/task'
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
    <>
      <DialogHeader>
        <DialogTitle>{isEdit ? 'Edit project' : 'New project'}</DialogTitle>
        <DialogDescription>
          {isEdit ? 'Update project name, emoji, and color.' : 'Create a new project.'}
        </DialogDescription>
      </DialogHeader>

      <DialogPanel className="space-y-3">
        <Field>
          <FieldLabel>Name</FieldLabel>
          <Input
            autoFocus
            onChange={(event) => patch({ name: event.target.value })}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault()
                handleSave()
              }
            }}
            placeholder="Project name"
            value={form.name}
          />
        </Field>

        <Field>
          <FieldLabel>Description</FieldLabel>
          <Textarea
            onChange={(event) => patch({ description: event.target.value })}
            placeholder="Add description..."
            value={form.description}
          />
        </Field>

        <Field>
          <FieldLabel>Emoji</FieldLabel>
          <EmojiPicker onSelect={(emoji) => patch({ emoji })} value={form.emoji} />
        </Field>

        <Field>
          <FieldLabel>Color</FieldLabel>
          <div className="w-full space-y-3">
            <ColorSelector
              colors={PROJECT_COLOR_SWATCHES}
              onColorSelect={(color) => patch({ color })}
              value={form.color}
            />
            <div className="space-y-2">
              <p className="text-xs text-app-text-muted">Custom</p>
              <CustomColorInput onChange={(color) => patch({ color })} value={form.color} />
            </div>
          </div>
        </Field>
      </DialogPanel>

      <DialogFooter className="justify-between sm:justify-between">
        {isEdit ? (
          <Button onClick={handleDelete} size="sm" type="button" variant="destructive-outline">
            <Trash2 size={12} />
            Delete
          </Button>
        ) : (
          <span />
        )}
        <div className="flex items-center gap-2">
          <Button onClick={onClose} size="sm" type="button" variant="outline">
            Cancel
          </Button>
          <Button disabled={!form.name.trim()} onClick={handleSave} size="sm" type="button">
            {isEdit ? 'Save' : 'Add project'}
          </Button>
        </div>
      </DialogFooter>
    </>
  )
}
