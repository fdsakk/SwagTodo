import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { Button } from '@renderer/components/ui/button'
import {
  Dialog,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogPanel,
  DialogPopup,
  DialogTitle
} from '@renderer/components/ui/dialog'
import { Input } from '@renderer/components/ui/input'
import type { Label } from '@renderer/types'

interface LabelManagerModalProps {
  open: boolean
  labels: Label[]
  onClose: () => void
  onCreate: (payload: { name: string; color: string }) => void
  onUpdate: (labelId: string, payload: { name: string; color: string }) => void
  onDelete: (labelId: string) => void
}

export function LabelManagerModal(props: LabelManagerModalProps): React.JSX.Element {
  const [newName, setNewName] = useState('')
  const [newColor, setNewColor] = useState('#71717a')

  const handleCreate = (): void => {
    if (!newName.trim()) return
    props.onCreate({ name: newName.trim(), color: newColor })
    setNewName('')
  }

  return (
    <Dialog open={props.open} onOpenChange={(open) => !open && props.onClose()}>
      <DialogPopup>
        <DialogHeader>
          <DialogTitle>Manage labels</DialogTitle>
          <DialogDescription>Add, rename, or delete task labels.</DialogDescription>
        </DialogHeader>

        <DialogPanel>
          <div className="mb-4 flex gap-2">
            <Input
              className="flex-1"
              onChange={(event) => setNewName(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault()
                  handleCreate()
                }
              }}
              placeholder="Label name"
              value={newName}
            />
            <Input
              className="w-24"
              onChange={(event) => setNewColor(event.target.value)}
              value={newColor}
            />
            <Button onClick={handleCreate} size="sm" type="button">
              <Plus size={14} />
              Add
            </Button>
          </div>

          <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
            {props.labels.map((label) => (
              <div
                className="flex items-center gap-2 rounded-lg border border-app-border bg-app-hover/40 p-2"
                key={label.id}
              >
                <span className="size-3 rounded-full" style={{ backgroundColor: label.color }} />
                <Input
                  className="flex-1"
                  onChange={(event) =>
                    props.onUpdate(label.id, { name: event.target.value, color: label.color })
                  }
                  size="sm"
                  value={label.name}
                />
                <Input
                  className="w-24"
                  onChange={(event) =>
                    props.onUpdate(label.id, { name: label.name, color: event.target.value })
                  }
                  size="sm"
                  value={label.color}
                />
                <Button
                  aria-label="Delete label"
                  onClick={() => props.onDelete(label.id)}
                  size="icon-sm"
                  type="button"
                  variant="ghost"
                >
                  <Trash2 size={13} />
                </Button>
              </div>
            ))}
            {props.labels.length === 0 && (
              <p className="text-sm text-app-text-muted">No labels yet.</p>
            )}
          </div>
        </DialogPanel>

        <DialogFooter>
          <Button onClick={props.onClose} type="button" variant="outline">
            Close
          </Button>
        </DialogFooter>
      </DialogPopup>
    </Dialog>
  )
}
