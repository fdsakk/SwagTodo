import { AnimatePresence, motion } from 'framer-motion'

interface ShortcutsHelpModalProps {
  open: boolean
  onClose: () => void
}

const SHORTCUTS: { keys: string[]; label: string }[] = [
  { keys: ['n'], label: 'New task' },
  { keys: ['o'], label: 'New project' },
  { keys: ['l'], label: 'Open labels manager' },
  { keys: ['/'], label: 'Focus search' },
  { keys: ['Esc'], label: 'Close panel / cancel' },
  { keys: ['b'], label: 'Toggle sidebar' },
  { keys: ['?'], label: 'Show shortcuts help' },
  { keys: ['i'], label: 'Go to Inbox' },
  { keys: ['t'], label: 'Go to Today' },
  { keys: ['a'], label: 'Go to Activity' },
  { keys: ['s'], label: 'Go to Sessions' },
  { keys: ['p'], label: 'Go to Projects' },
  { keys: ['1'], label: 'Project: list tab' },
  { keys: ['2'], label: 'Project: board tab' },
  { keys: ['['], label: 'Sessions: previous range' },
  { keys: [']'], label: 'Sessions: next range' },
  { keys: ['d'], label: 'Sessions: cycle day count' },
  { keys: ['g'], label: 'Sessions: go to today' }
]

export default function ShortcutsHelpModal({
  open,
  onClose
}: ShortcutsHelpModalProps): React.JSX.Element {
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
              <h2 className="text-sm font-semibold text-zinc-100">Keyboard shortcuts</h2>
              <button
                className="text-xs text-zinc-500 hover:text-zinc-300"
                onClick={onClose}
                type="button"
              >
                Close
              </button>
            </div>
            <div className="space-y-1.5">
              {SHORTCUTS.map((sc) => (
                <div
                  key={sc.keys.join('+')}
                  className="flex items-center justify-between text-xs"
                >
                  <span className="text-zinc-400">{sc.label}</span>
                  <div className="flex items-center gap-1">
                    {sc.keys.map((k, idx) => (
                      <kbd
                        key={`${k}-${idx}`}
                        className="rounded border border-white/[0.08] bg-white/[0.04] px-1.5 py-0.5 font-mono text-[10px] text-zinc-300"
                      >
                        {k}
                      </kbd>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}
