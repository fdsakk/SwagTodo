import useAppStore from '@renderer/store/useAppStore'

export default function BackgroundLayer(): React.JSX.Element | null {
  const backgroundId = useAppStore((s) => s.appearance.backgroundId)

  if (backgroundId === 'none') return null

  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      {/* Background components from React Bits will be rendered here based on backgroundId */}
    </div>
  )
}
