import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import type { MedicationLog } from '@renderer/types'
import { isoToTimeInput, timeInputToIso, today } from './utils'

interface MedLogListProps {
  logs: MedicationLog[]
  selectedDate: string
  onUpdateTime: (id: string, iso: string) => void
  onDelete: (id: string) => void
}

export function MedLogList({
  logs,
  selectedDate,
  onUpdateTime,
  onDelete
}: MedLogListProps): React.JSX.Element {
  const [editingId, setEditingId] = useState<string | null>(null)

  const handleTimeChange = (id: string, timeValue: string): void => {
    if (!timeValue) return
    onUpdateTime(id, timeInputToIso(selectedDate, timeValue))
  }

  return (
    <div className="w-1/2">
      <p className="mb-2 text-xs font-medium text-app-text-muted">
        Taken {selectedDate === today() ? 'today' : `on ${selectedDate}`}
      </p>
      {logs.length === 0 ? (
        <p className="text-xs text-app-text-muted">No medications logged.</p>
      ) : (
        <ul className="space-y-1">
          {logs.map((log) => (
            <li
              key={log.id}
              className="flex items-center justify-between rounded-lg border border-app-border bg-app-card px-3 py-2"
            >
              <span className="text-sm text-app-text">
                {log.medName} {log.dose}mg
              </span>
              <div className="flex items-center gap-2">
                {editingId === log.id ? (
                  <input
                    type="time"
                    autoFocus
                    defaultValue={isoToTimeInput(log.takenAt)}
                    onChange={(e) => handleTimeChange(log.id, e.target.value)}
                    onBlur={() => setEditingId(null)}
                    className="rounded border border-app-accent/40 bg-app-hover px-1.5 py-0.5 text-xs text-app-text focus:outline-none"
                  />
                ) : (
                  <button
                    type="button"
                    onClick={() => setEditingId(log.id)}
                    className="rounded px-1.5 py-0.5 text-xs text-app-text-muted hover:bg-app-hover hover:text-app-text transition-colors"
                    title="Edit time"
                  >
                    @ {isoToTimeInput(log.takenAt)}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => onDelete(log.id)}
                  className="text-app-text-muted hover:text-red-400 transition-colors"
                  title="Remove"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
