import {
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem
} from '@renderer/components/ui/sidebar'
import { cn } from '@renderer/utils/cn'

interface NavItemProps {
  icon: React.ReactNode
  label: string
  count?: number
  active?: boolean
  collapsed: boolean
  onClick: () => void
}

export function NavItem({
  icon,
  label,
  count,
  active,
  collapsed,
  onClick
}: NavItemProps): React.JSX.Element {
  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        className={cn(
          'h-8 px-2 text-sm',
          active
            ? 'bg-app-active text-app-text data-[active=true]:bg-app-active data-[active=true]:text-app-text'
            : 'text-app-text-secondary hover:bg-app-hover hover:!text-app-text data-[active=false]:hover:bg-app-hover',
          collapsed && 'justify-center px-0'
        )}
        isActive={active}
        onClick={onClick}
        tooltip={collapsed ? label : undefined}
      >
        <span className="flex h-4 w-4 items-center justify-center">{icon}</span>
        {!collapsed && <span className="flex-1 truncate text-left">{label}</span>}
      </SidebarMenuButton>
      {!collapsed && typeof count === 'number' && count > 0 && (
        <SidebarMenuBadge className="text-xs text-app-text-muted">{count}</SidebarMenuBadge>
      )}
    </SidebarMenuItem>
  )
}
