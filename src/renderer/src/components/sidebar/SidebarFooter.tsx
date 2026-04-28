import { Hash } from 'lucide-react'
import { SidebarMenuButton, SidebarMenuItem } from '@renderer/components/ui/sidebar'

interface SidebarFooterProps {
  hasLabels: boolean
  onOpenLabelModal: () => void
}

export function SidebarFooter({
  hasLabels,
  onOpenLabelModal
}: SidebarFooterProps): React.JSX.Element {
  if (!hasLabels) return <></>
  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        className="h-8 px-2 text-sm text-app-text-secondary hover:bg-app-hover hover:!text-app-text"
        onClick={onOpenLabelModal}
      >
        <span className="flex h-4 w-4 items-center justify-center">
          <Hash size={14} />
        </span>
        <span className="flex-1 truncate text-left">Manage labels</span>
      </SidebarMenuButton>
    </SidebarMenuItem>
  )
}
