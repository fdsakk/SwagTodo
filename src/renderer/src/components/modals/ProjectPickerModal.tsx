import {
  Dialog,
  DialogDescription,
  DialogHeader,
  DialogPanel,
  DialogPopup,
  DialogTitle
} from "@renderer/components/ui/dialog"
import { Kbd } from "@renderer/components/ui/kbd"
import type { Project } from "@renderer/types"
import { useEffect } from "react"

interface ProjectPickerModalProps {
  open: boolean
  projects: Project[]
  onClose: () => void
  onSelect: (projectId: string) => void
}

export function ProjectPickerModal({
  open,
  projects,
  onClose,
  onSelect
}: ProjectPickerModalProps): React.JSX.Element {
  useEffect(() => {
    if (!open) return
    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key === "Escape") {
        event.preventDefault()
        onClose()
        return
      }
      const n = Number(event.key)
      if (!Number.isInteger(n) || n < 1 || n > 9) return
      const target = projects[n - 1]
      if (!target) return
      event.preventDefault()
      event.stopPropagation()
      onSelect(target.id)
      onClose()
    }
    window.addEventListener("keydown", onKeyDown, true)
    return () => window.removeEventListener("keydown", onKeyDown, true)
  }, [open, projects, onClose, onSelect])

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogPopup finalFocus={() => false}>
        <DialogHeader>
          <DialogTitle>Go to project</DialogTitle>
          <DialogDescription>Pick a project to navigate to.</DialogDescription>
        </DialogHeader>
        <DialogPanel>
          {projects.length === 0 ? (
            <p className="text-sm text-app-text-muted">
              No projects yet. Press <Kbd>o</Kbd> to create one.
            </p>
          ) : (
            <div className="space-y-1">
              {projects.slice(0, 9).map((project, idx) => (
                <button
                  key={project.id}
                  className="flex w-full items-center gap-3 rounded-md px-2 py-1.5 text-left text-sm text-app-text-secondary hover:bg-app-hover"
                  onClick={() => {
                    onSelect(project.id)
                    onClose()
                  }}
                  type="button"
                >
                  <Kbd>{idx + 1}</Kbd>
                  <span className="flex h-4 w-4 items-center justify-center text-xs">
                    {project.emoji || "#"}
                  </span>
                  <span className="flex-1 truncate">{project.name}</span>
                </button>
              ))}
              {projects.length > 9 && (
                <p className="pt-2 text-xs text-app-text-muted">
                  {projects.length - 9} more — click to select.
                </p>
              )}
            </div>
          )}
        </DialogPanel>
      </DialogPopup>
    </Dialog>
  )
}
