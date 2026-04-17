import { useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import type { Project } from '@renderer/types'

interface ProjectPickerModalProps {
  open: boolean
  projects: Project[]
  onClose: () => void
  onSelect: (projectId: string) => void
}

export default function ProjectPickerModal({
  open,
  projects,
  onClose,
  onSelect
}: ProjectPickerModalProps): React.JSX.Element {
  useEffect(() => {
    if (!open) return
    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') {
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
    window.addEventListener('keydown', onKeyDown, true)
    return () => window.removeEventListener('keydown', onKeyDown, true)
  }, [open, projects, onClose, onSelect])

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            animate={{ opacity: 1 }}
            className="fixed left-2 right-2 top-8 bottom-2 z-40 rounded-lg bg-black/50"
            exit={{ opacity: 0 }}
            initial={{ opacity: 0 }}
            onClick={onClose}
            transition={{ duration: 0.15 }}
          />
          <div className="pointer-events-none fixed left-2 right-2 top-8 bottom-2 z-50 flex items-center justify-center">
            <motion.div
              animate={{ opacity: 1, scale: 1 }}
              className="pointer-events-auto w-[420px] max-h-[90%] overflow-y-auto rounded-lg border border-white/[0.06] bg-app-bg p-5 shadow-xl"
              exit={{ opacity: 0, scale: 0.98 }}
              initial={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.15 }}
            >
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-zinc-100">Go to project</h2>
                <button
                  className="text-xs text-zinc-500 hover:text-zinc-300"
                  onClick={onClose}
                  type="button"
                >
                  Close
                </button>
              </div>
              {projects.length === 0 ? (
                <p className="text-xs text-zinc-500">No projects yet. Press <kbd className="mx-1 rounded border border-white/[0.08] bg-white/[0.04] px-1.5 py-0.5 font-mono text-[10px] text-zinc-300">o</kbd> to create one.</p>
              ) : (
                <div className="space-y-1">
                  {projects.slice(0, 9).map((project, idx) => (
                    <button
                      key={project.id}
                      className="flex w-full items-center gap-3 rounded-md px-2 py-1.5 text-left text-sm text-zinc-300 hover:bg-white/[0.04]"
                      onClick={() => {
                        onSelect(project.id)
                        onClose()
                      }}
                      type="button"
                    >
                      <kbd className="flex h-5 w-5 shrink-0 items-center justify-center rounded border border-white/[0.08] bg-white/[0.04] font-mono text-[10px] text-zinc-300">
                        {idx + 1}
                      </kbd>
                      <span className="flex h-4 w-4 items-center justify-center text-xs">
                        {project.emoji || '#'}
                      </span>
                      <span className="flex-1 truncate">{project.name}</span>
                    </button>
                  ))}
                  {projects.length > 9 && (
                    <p className="pt-2 text-[11px] text-zinc-500">
                      {projects.length - 9} more — click to select.
                    </p>
                  )}
                </div>
              )}
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}
