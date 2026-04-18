import { useState } from 'react'
import { X } from 'lucide-react'
import { formatHM } from '@renderer/utils/calendar'
import type { DraftCreate } from './TaskPickerDialog'

interface GhostBlockDialogProps {
  draft: DraftCreate
  onCancel: () => void
  onCreate: (label: string) => void
  onSwitchToTask: () => void
}

function minutesFromIso(iso: string): number {
  const d = new Date(iso)
  return d.getHours() * 60 + d.getMinutes()
}

export function GhostBlockDialog({
  draft,
  onCancel,
  onCreate,
  onSwitchToTask
}: GhostBlockDialogProps): React.JSX.Element {
  const [label, setLabel] = useState('')

  const startMin = minutesFromIso(draft.startAt)
  const endMin = minutesFromIso(draft.endAt)
  const day = new Date(draft.dayIso).toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  })

  const handleSubmit = (e: React.FormEvent): void => {
    e.preventDefault()
    onCreate(label.trim() || 'Block')
  }

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 p-6"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-md overflow-hidden rounded-lg border border-app-border bg-app-bg shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-app-border px-4 py-3">
          <div>
            <div className="text-sm text-app-text">New ghost block</div>
            <div className="text-[11px] text-app-text-muted">
              {day} · {formatHM(startMin)}–{formatHM(endMin)}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onSwitchToTask}
              className="h-6 rounded px-2 text-[11px] text-app-text-muted hover:bg-app-hover hover:text-app-text"
            >
              Task session
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="flex h-6 w-6 items-center justify-center rounded text-app-text-muted hover:bg-app-hover hover:text-app-text"
            >
              <X size={14} />
            </button>
          </div>
        </div>
        <form onSubmit={handleSubmit} className="px-4 py-3">
          <input
            autoFocus
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            onKeyDown={(e) => e.key === 'Escape' && onCancel()}
            placeholder="Label (e.g. Lunch, Break...)"
            className="h-8 w-full bg-transparent text-sm text-app-text placeholder:text-app-text-muted focus:outline-none"
          />
          <div className="mt-3 flex justify-end gap-2">
            <button
              type="button"
              onClick={onCancel}
              className="h-7 rounded px-3 text-xs text-app-text-muted hover:bg-app-hover hover:text-app-text"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="h-7 rounded bg-app-active px-3 text-xs text-app-text hover:bg-app-hover"
            >
              Add block
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
