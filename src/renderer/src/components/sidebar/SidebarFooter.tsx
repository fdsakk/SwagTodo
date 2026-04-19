import { Hash } from 'lucide-react'

interface SidebarFooterProps {
  hasLabels: boolean
  onOpenLabelModal: () => void
}

export function SidebarFooter({
  hasLabels,
  onOpenLabelModal
}: SidebarFooterProps): React.JSX.Element {
  return (
    <>
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
    </>
  )
}
