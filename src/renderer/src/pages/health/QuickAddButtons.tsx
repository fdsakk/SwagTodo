import { cn } from "@renderer/utils/cn"
import { MED_PRESETS } from "@renderer/utils/pharmacokinetics"

const PRESET_BUTTONS = MED_PRESETS.filter(
  (p, i, arr) => arr.findIndex((x) => x.id === p.id && x.dose === p.dose) === i
)

interface QuickAddButtonsProps {
  onAdd: (medId: string, medName: string, dose: number) => void
}

export function QuickAddButtons({
  onAdd
}: QuickAddButtonsProps): React.JSX.Element {
  return (
    <div>
      <p className="mb-2 text-xs font-medium text-app-text-muted">Log intake</p>
      <div className="flex flex-wrap gap-2">
        {PRESET_BUTTONS.map((p) => (
          <button
            key={`${p.id}-${p.dose}`}
            type="button"
            onClick={() => onAdd(p.id, p.name, p.dose)}
            className={cn(
              "rounded-lg border border-app-border bg-app-card px-3 py-1.5 text-xs text-app-text",
              "hover:border-app-accent/40 hover:bg-app-hover transition-colors"
            )}
          >
            {p.name} {p.dose}
            {p.unit}
          </button>
        ))}
      </div>
    </div>
  )
}
