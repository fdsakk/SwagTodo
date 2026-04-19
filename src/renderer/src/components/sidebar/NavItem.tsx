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
    <button
      className={cn(
        'flex h-8 w-full items-center rounded-md px-2 text-sm transition-colors',
        active
          ? 'bg-app-active text-app-text'
          : 'text-app-text-secondary hover:bg-app-hover hover:text-app-text',
        collapsed && 'justify-center px-0'
      )}
      onClick={onClick}
      type="button"
    >
      <span className="flex h-4 w-4 items-center justify-center">{icon}</span>
      {!collapsed && (
        <>
          <span className="ml-2.5 flex-1 text-left">{label}</span>
          {typeof count === 'number' && count > 0 && (
            <span className="text-xs text-app-text-muted">{count}</span>
          )}
        </>
      )}
    </button>
  )
}
