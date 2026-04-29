import { cn } from "@renderer/utils/cn"

interface ColorSelectorProps {
  colors: string[]
  size?: "sm" | "default" | "lg"
  value: string
  onColorSelect?: (color: string) => void
  className?: string
}

function sizeClass(size: "sm" | "default" | "lg"): string {
  switch (size) {
    case "sm":
      return "size-4"
    case "lg":
      return "size-6"
    default:
      return "size-5"
  }
}

export function ColorSelector({
  colors,
  size = "default",
  value,
  onColorSelect,
  className
}: ColorSelectorProps): React.JSX.Element {
  const dim = sizeClass(size)
  const normalized = value.toLowerCase()

  return (
    <div className={cn("grid grid-cols-8 gap-1.5", className)}>
      {colors.map((color) => {
        const selected = color.toLowerCase() === normalized
        return (
          <button
            aria-label={`Select color ${color}`}
            aria-pressed={selected}
            className={cn(
              dim,
              "rounded-full cursor-pointer transition-transform duration-150 active:scale-90 hover:scale-110",
              selected &&
                "ring-2 ring-white/70 ring-offset-2 ring-offset-app-bg"
            )}
            key={color}
            onClick={() => onColorSelect?.(color)}
            style={{ backgroundColor: color }}
            type="button"
          />
        )
      })}
    </div>
  )
}
