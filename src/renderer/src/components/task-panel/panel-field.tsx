export function Field({
  label,
  children
}: {
  label: string
  children: React.ReactNode
}): React.JSX.Element {
  return (
    <div className="flex items-center gap-3 py-2">
      <span className="w-20 shrink-0 text-xs text-app-text-muted">{label}</span>
      <div className="flex-1">{children}</div>
    </div>
  )
}
