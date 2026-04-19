import { useEffect, useRef, useState } from 'react'
import { cn } from '@renderer/utils/cn'

interface EmojiPickerProps {
  value: string
  onSelect: (emoji: string) => void
  className?: string
}

const EMOJI_GROUPS: { label: string; emojis: string[] }[] = [
  {
    label: 'Work',
    emojis: ['📁', '📂', '🗂️', '📋', '📝', '📌', '📍', '🗓️', '🗒️', '🗃️', '💼', '📎']
  },
  {
    label: 'Tech',
    emojis: ['💻', '🖥️', '⌨️', '🖱️', '📱', '🔌', '🔋', '💾', '💿', '🛠️', '⚙️', '🧰']
  },
  {
    label: 'Life',
    emojis: ['🏠', '🛒', '🧺', '🍳', '🥗', '☕', '🍽️', '🧹', '🛌', '👕', '🚿', '🪴']
  },
  {
    label: 'Fun',
    emojis: ['🎯', '🎨', '🎮', '🎵', '🎬', '📚', '✈️', '🏖️', '🏕️', '🎁', '🎉', '🏆']
  },
  {
    label: 'Misc',
    emojis: ['⭐', '🔥', '💡', '❤️', '✅', '⚡', '🌟', '🚀', '🧠', '💪', '🧩', '🌱']
  }
]

export function EmojiPicker({ value, onSelect, className }: EmojiPickerProps): React.JSX.Element {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!open) return
    const onDocClick = (event: MouseEvent): void => {
      if (!rootRef.current) return
      if (!rootRef.current.contains(event.target as Node)) setOpen(false)
    }
    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDocClick)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onDocClick)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  return (
    <div className={cn('relative inline-block', className)} ref={rootRef}>
      <button
        aria-haspopup="dialog"
        aria-expanded={open}
        className="flex h-9 w-9 items-center justify-center rounded-md border border-white/[0.08] bg-white/[0.03] text-lg transition-colors hover:bg-white/[0.06] focus:outline-none focus:ring-1 focus:ring-white/20"
        onClick={() => setOpen((v) => !v)}
        type="button"
      >
        {value || '📁'}
      </button>

      {open && (
        <div
          className="absolute left-0 top-11 z-50 w-64 rounded-md border border-white/[0.08] bg-app-bg p-2 shadow-xl"
          role="dialog"
        >
          <div className="max-h-64 space-y-2 overflow-y-auto pr-1">
            {EMOJI_GROUPS.map((group) => (
              <div key={group.label}>
                <p className="mb-1 px-1 text-[10px] uppercase tracking-wide text-zinc-500">
                  {group.label}
                </p>
                <div className="grid grid-cols-6 gap-0.5">
                  {group.emojis.map((emoji) => (
                    <button
                      aria-label={`Select emoji ${emoji}`}
                      className={cn(
                        'flex h-8 w-8 items-center justify-center rounded-md text-base transition-colors hover:bg-white/[0.06]',
                        value === emoji && 'bg-white/[0.08] ring-1 ring-white/20'
                      )}
                      key={emoji}
                      onClick={() => {
                        onSelect(emoji)
                        setOpen(false)
                      }}
                      type="button"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
