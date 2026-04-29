import {
  Popover,
  PopoverPopup,
  PopoverTrigger
} from "@renderer/components/ui/popover"
import { cn } from "@renderer/utils/cn"
import { useState } from "react"

interface EmojiPickerProps {
  value: string
  onSelect: (emoji: string) => void
  className?: string
}

const EMOJI_GROUPS: { label: string; emojis: string[] }[] = [
  {
    label: "Work",
    emojis: ["📁", "📂", "🗂️", "📋", "📝", "📌", "📍", "🗓️", "🗒️", "🗃️", "💼", "📎"]
  },
  {
    label: "Tech",
    emojis: ["💻", "🖥️", "⌨️", "🖱️", "📱", "🔌", "🔋", "💾", "💿", "🛠️", "⚙️", "🧰"]
  },
  {
    label: "Life",
    emojis: [
      "🏠",
      "🛒",
      "🧺",
      "🍳",
      "🥗",
      "☕",
      "🍽️",
      "🧹",
      "🛌",
      "👕",
      "🚿",
      "🪴"
    ]
  },
  {
    label: "Fun",
    emojis: [
      "🎯",
      "🎨",
      "🎮",
      "🎵",
      "🎬",
      "📚",
      "✈️",
      "🏖️",
      "🏕️",
      "🎁",
      "🎉",
      "🏆"
    ]
  },
  {
    label: "Misc",
    emojis: [
      "⭐",
      "🔥",
      "💡",
      "❤️",
      "✅",
      "⚡",
      "🌟",
      "🚀",
      "🧠",
      "💪",
      "🧩",
      "🌱"
    ]
  }
]

export function EmojiPicker({
  value,
  onSelect,
  className
}: EmojiPickerProps): React.JSX.Element {
  const [open, setOpen] = useState(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        aria-label="Pick emoji"
        className={cn(
          "flex h-9 w-9 items-center justify-center rounded-md border border-input bg-popover text-lg transition-colors hover:bg-accent",
          className
        )}
      >
        {value || "📁"}
      </PopoverTrigger>
      <PopoverPopup align="start" className="w-64">
        <div className="max-h-64 space-y-2 overflow-y-auto pr-1">
          {EMOJI_GROUPS.map((group) => (
            <div key={group.label}>
              <p className="mb-1 px-1 text-[10px] uppercase tracking-wide text-app-text-muted">
                {group.label}
              </p>
              <div className="grid grid-cols-6 gap-0.5">
                {group.emojis.map((emoji) => (
                  <button
                    aria-label={`Select emoji ${emoji}`}
                    className={cn(
                      "flex h-8 w-8 items-center justify-center rounded-md text-base transition-colors hover:bg-accent",
                      value === emoji && "bg-accent ring-1 ring-input"
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
      </PopoverPopup>
    </Popover>
  )
}
