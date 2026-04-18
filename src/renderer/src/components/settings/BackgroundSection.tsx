import type { AppearanceSettings } from '@renderer/types'
import { cn } from '@renderer/utils/cn'

const BACKGROUND_OPTIONS = [
  {
    id: 'none',
    label: 'None',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="opacity-40">
        <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 2" />
      </svg>
    )
  },
  {
    id: 'waves',
    label: 'Waves',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path d="M2 8c2-2 4-2 6 0s4 2 6 0 4-2 6 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M2 12c2-2 4-2 6 0s4 2 6 0 4-2 6 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />
        <path d="M2 16c2-2 4-2 6 0s4 2 6 0 4-2 6 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.3" />
      </svg>
    )
  },
  {
    id: 'aurora',
    label: 'Aurora',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <ellipse cx="12" cy="14" rx="8" ry="5" stroke="currentColor" strokeWidth="1.5" opacity="0.8" />
        <ellipse cx="8" cy="12" rx="5" ry="3" stroke="currentColor" strokeWidth="1.5" opacity="0.5" />
        <ellipse cx="16" cy="11" rx="4" ry="2.5" stroke="currentColor" strokeWidth="1.5" opacity="0.3" />
      </svg>
    )
  },
  {
    id: 'particles',
    label: 'Particles',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <circle cx="5" cy="5" r="1.5" fill="currentColor" opacity="0.8" />
        <circle cx="12" cy="8" r="1" fill="currentColor" opacity="0.6" />
        <circle cx="19" cy="5" r="1.5" fill="currentColor" opacity="0.4" />
        <circle cx="8" cy="14" r="1" fill="currentColor" opacity="0.5" />
        <circle cx="16" cy="16" r="1.5" fill="currentColor" opacity="0.7" />
        <circle cx="5" cy="19" r="1" fill="currentColor" opacity="0.3" />
        <circle cx="19" cy="19" r="1" fill="currentColor" opacity="0.5" />
      </svg>
    )
  },
  {
    id: 'grid',
    label: 'Grid',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path d="M3 8h18M3 16h18M8 3v18M16 3v18" stroke="currentColor" strokeWidth="1" opacity="0.5" />
      </svg>
    )
  }
]

interface BackgroundSectionProps {
  appearance: AppearanceSettings
  onSetBackgroundId: (id: string) => void
}

export function BackgroundSection({
  appearance,
  onSetBackgroundId
}: BackgroundSectionProps): React.JSX.Element {
  return (
    <section className="space-y-3">
      <div>
        <h2 className="text-sm font-semibold text-app-text">Background</h2>
        <p className="mt-0.5 text-xs text-app-text-muted">Animated overlay effect</p>
      </div>
      <div className="grid grid-cols-5 gap-2">
        {BACKGROUND_OPTIONS.map((bg) => (
          <button
            key={bg.id}
            type="button"
            onClick={() => onSetBackgroundId(bg.id)}
            className={cn(
              'flex flex-col items-center gap-1.5 rounded-xl border py-3 px-1 transition-all',
              appearance.backgroundId === bg.id
                ? 'border-app-accent bg-app-accent/10 text-app-text ring-1 ring-app-accent'
                : 'border-app-border bg-app-hover text-app-text-muted hover:border-app-accent/50 hover:text-app-text-secondary'
            )}
          >
            {bg.icon}
            <span className="text-[11px] font-medium">{bg.label}</span>
          </button>
        ))}
      </div>
    </section>
  )
}
