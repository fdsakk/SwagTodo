interface SliderRowProps {
  label: string
  value: number
  min: number
  max: number
  step: number
  format: (v: number) => string
  onChange: (v: number) => void
}

export function SliderRow({
  label,
  value,
  min,
  max,
  step,
  format,
  onChange
}: SliderRowProps): React.JSX.Element {
  return (
    <div className="group grid grid-cols-[1fr_auto] gap-x-4 gap-y-0.5">
      <div className="flex items-baseline gap-2">
        <span className="text-xs font-medium text-app-text">{label}</span>
      </div>
      <span className="tabular-nums text-xs font-medium text-app-accent text-right">
        {format(value)}
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="col-span-2 w-full cursor-pointer accent-[var(--app-accent)]"
      />
    </div>
  )
}
