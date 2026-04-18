import { Hash, ZoomIn } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@renderer/components/ui/select'
import { UI_SCALE_OPTIONS, type UiScale } from '@renderer/types'

interface SidebarFooterProps {
  uiScale: UiScale
  hasLabels: boolean
  onScaleChange: (value: string) => void
  onOpenLabelModal: () => void
}

export function SidebarFooter({
  uiScale,
  hasLabels,
  onScaleChange,
  onOpenLabelModal
}: SidebarFooterProps): React.JSX.Element {
  return (
    <div className="px-2 py-2 space-y-0.5 overflow-hidden">
      <div className="flex h-8 w-full items-center rounded-md px-2 text-sm text-app-text-secondary gap-2 whitespace-nowrap">
        <span className="flex h-4 w-4 items-center justify-center">
          <ZoomIn size={13} />
        </span>
        <span className="text-left text-[0.8rem]">UI scale</span>
        <Select onValueChange={onScaleChange} value={String(uiScale)}>
          <SelectTrigger className="h-6 w-20 border-app-border pl-4 pr-2 bg-app-hover text-[0.8rem] text-app-text-secondary">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {UI_SCALE_OPTIONS.map((scale) => (
              <SelectItem className="text-[0.8rem]" key={scale} value={String(scale)}>
                {scale}%
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {hasLabels && (
        <button
          className="flex h-8 w-full items-center rounded-md px-2 text-sm text-app-text-secondary hover:bg-app-hover hover:text-app-text"
          onClick={onOpenLabelModal}
          type="button"
        >
          <span className="flex h-4 w-4 items-center justify-center">
            <Hash size={14} />
          </span>
          <span className="ml-2.5">Manage labels</span>
        </button>
      )}
    </div>
  )
}
