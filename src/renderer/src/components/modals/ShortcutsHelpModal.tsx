import {
  Dialog,
  DialogDescription,
  DialogHeader,
  DialogPanel,
  DialogPopup,
  DialogTitle
} from "@renderer/components/ui/dialog"
import { Kbd } from "@renderer/components/ui/kbd"

interface ShortcutsHelpModalProps {
  open: boolean
  onClose: () => void
}

const SHORTCUTS: { keys: string[]; label: string }[] = [
  { keys: ["n"], label: "New task" },
  { keys: ["o"], label: "New project" },
  { keys: ["l"], label: "Open labels manager" },
  { keys: ["/"], label: "Focus search" },
  { keys: ["Esc"], label: "Close panel / cancel" },
  { keys: ["b"], label: "Toggle sidebar" },
  { keys: ["?"], label: "Show shortcuts help" },
  { keys: ["i"], label: "Go to Inbox" },
  { keys: ["t"], label: "Go to Today" },
  { keys: ["a"], label: "Go to Activity" },
  { keys: ["s"], label: "Go to Sessions" },
  { keys: ["p"], label: "Go to Projects" },
  { keys: ["1"], label: "Project: list tab" },
  { keys: ["2"], label: "Project: board tab" },
  { keys: ["["], label: "Sessions: previous range" },
  { keys: ["]"], label: "Sessions: next range" },
  { keys: ["d"], label: "Sessions: cycle day count" },
  { keys: ["g"], label: "Sessions: go to today" }
]

export function ShortcutsHelpModal({
  open,
  onClose
}: ShortcutsHelpModalProps): React.JSX.Element {
  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogPopup finalFocus={() => false}>
        <DialogHeader>
          <DialogTitle>Keyboard shortcuts</DialogTitle>
          <DialogDescription>
            Press any key to navigate the app.
          </DialogDescription>
        </DialogHeader>
        <DialogPanel>
          <div className="space-y-2">
            {SHORTCUTS.map((sc) => (
              <div
                key={sc.keys.join("+")}
                className="flex items-center justify-between text-sm"
              >
                <span className="text-app-text-secondary">{sc.label}</span>
                <div className="flex items-center gap-1">
                  {sc.keys.map((k, idx) => (
                    <Kbd key={`${k}-${idx}`}>{k}</Kbd>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </DialogPanel>
      </DialogPopup>
    </Dialog>
  )
}
