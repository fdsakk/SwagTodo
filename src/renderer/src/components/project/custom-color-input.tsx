import { useEffect, useState } from 'react'
import { cn } from '@renderer/utils/cn'

interface CustomColorInputProps {
  value: string
  onChange: (color: string) => void
  className?: string
}

const HEX_RE = /^#([0-9a-fA-F]{6})$/

function normalize(input: string): string {
  const trimmed = input.trim()
  if (!trimmed) return ''
  return trimmed.startsWith('#') ? trimmed : `#${trimmed}`
}

export function CustomColorInput({
  value,
  onChange,
  className
}: CustomColorInputProps): React.JSX.Element {
  const [draft, setDraft] = useState(value)

  useEffect(() => {
    setDraft(value)
  }, [value])

  const commit = (raw: string): void => {
    const hex = normalize(raw)
    if (HEX_RE.test(hex)) onChange(hex.toLowerCase())
  }

  const displayColor = HEX_RE.test(value) ? value : '#52525b'

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <label
        className="relative flex h-7 w-7 cursor-pointer items-center justify-center rounded-md border border-white/[0.08] overflow-hidden"
        style={{ backgroundColor: displayColor }}
        title="Pick custom color"
      >
        <input
          className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
          onChange={(event) => {
            const hex = event.target.value.toLowerCase()
            setDraft(hex)
            onChange(hex)
          }}
          type="color"
          value={displayColor}
        />
      </label>
      <input
        className="h-7 flex-1 rounded-md border border-white/[0.08] bg-white/[0.03] px-2 font-mono text-xs text-zinc-300 placeholder:text-zinc-600 focus:border-white/20 focus:outline-none"
        maxLength={7}
        onBlur={() => commit(draft)}
        onChange={(event) => setDraft(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            event.preventDefault()
            commit(draft)
          }
        }}
        placeholder="#52525b"
        value={draft}
      />
    </div>
  )
}
