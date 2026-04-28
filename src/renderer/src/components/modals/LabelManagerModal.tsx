import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { Button } from '@renderer/components/ui/button'
import {
  Dialog,
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

  return (
    <Dialog open={props.open} onOpenChange={(open) => !open && props.onClose()}>
      <DialogPopup className="w-full max-w-lg border-zinc-700 bg-zinc-950 shadow-soft">
        <DialogHeader>
          <DialogTitle className="text-sm text-app-text">Manage labels</DialogTitle>
        </DialogHeader>

        <DialogPanel className="pt-1">
          <div className="mb-4 flex gap-2">
            <Input
              className="h-9 flex-1 rounded-lg border-zinc-700 bg-zinc-900 text-sm text-zinc-100"
              onChange={(event) => setNewName(event.target.value)}
              placeholder="Label name"
              value={newName}
            />
            <Input
              className="h-9 w-24 rounded-lg border-zinc-700 bg-zinc-900 px-2 text-sm text-zinc-100"
              onChange={(event) => setNewColor(event.target.value)}
              value={newColor}
            />
            <Button
              onClick={() => {
                if (!newName.trim()) return
                props.onCreate({ name: newName.trim(), color: newColor })
                setNewName('')
              }}
              type="button"
            >
              <Plus data-icon="inline-start" size={14} />
              Add
            </Button>
          </div>

          <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
            {props.labels.map((label) => (
              <div
                className="flex items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900 p-2"
                key={label.id}
              >
                <span className="size-3 rounded-full" style={{ backgroundColor: label.color }} />
                <Input
                  className="h-8 flex-1 rounded border-zinc-700 bg-zinc-950 text-sm text-zinc-100"
                  onChange={(event) =>
                    props.onUpdate(label.id, { name: event.target.value, color: label.color })
                  }
                  value={label.name}
                />
                <Input
                  className="h-8 w-24 rounded border-zinc-700 bg-zinc-950 text-sm text-zinc-100"
                  onChange={(event) =>
                    props.onUpdate(label.id, { name: label.name, color: event.target.value })
                  }
                  value={label.color}
                />
                <Button
                  className="size-8 p-0 text-app-text-muted hover:bg-app-hover hover:text-app-text-secondary"
                  onClick={() => props.onDelete(label.id)}
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
          <Button
            className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
            onClick={props.onClose}
            type="button"
            variant="outline"
          >
            Close
          </Button>
        </DialogFooter>
      </DialogPopup>
    </Dialog>
  )
}
