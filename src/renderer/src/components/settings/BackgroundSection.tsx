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
    id: 'plasma',
    label: 'Plasma',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path d="M12 3c2 3-1 5 1 8s4 2 3 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.9" />
        <path d="M8 5c1 2.5 3 3 2 6s-2 3-1 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.55" />
        <path d="M16 6c-1 2 1 4 0 7s-3 3-2 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.35" />
      </svg>
    )
  },
  {
    id: 'aurora',
    label: 'Aurora',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <ellipse cx="12" cy="14" rx="9" ry="4" stroke="currentColor" strokeWidth="1.5" opacity="0.9" />
        <ellipse cx="8" cy="12" rx="6" ry="2.5" stroke="currentColor" strokeWidth="1.5" opacity="0.55" />
        <ellipse cx="17" cy="11" rx="4" ry="2" stroke="currentColor" strokeWidth="1.5" opacity="0.3" />
      </svg>
    )
  },
  {
    id: 'softaurora',
    label: 'Soft Aurora',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path d="M3 14c3-4 6-4 9-2s6 4 9 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.9" />
        <path d="M3 17c3-3 6-3 9-1s6 3 9-1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
        <path d="M3 11c4-5 8-3 11-1s5 3 7-1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.25" />
      </svg>
    )
  },
  {
    id: 'pixels',
    label: 'Snow',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <circle cx="5" cy="6" r="1.2" fill="currentColor" opacity="0.9" />
        <circle cx="12" cy="4" r="1" fill="currentColor" opacity="0.7" />
        <circle cx="19" cy="7" r="1.2" fill="currentColor" opacity="0.5" />
        <circle cx="8" cy="12" r="1" fill="currentColor" opacity="0.6" />
        <circle cx="16" cy="13" r="1.5" fill="currentColor" opacity="0.8" />
        <circle cx="4" cy="18" r="1" fill="currentColor" opacity="0.4" />
        <circle cx="20" cy="17" r="1.2" fill="currentColor" opacity="0.6" />
        <circle cx="12" cy="19" r="1" fill="currentColor" opacity="0.5" />
      </svg>
    )
  },
  {
    id: 'pixelblast',
    label: 'Pixels',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <rect x="3" y="3" width="4" height="4" rx="0.5" fill="currentColor" opacity="0.9" />
        <rect x="10" y="3" width="4" height="4" rx="0.5" fill="currentColor" opacity="0.4" />
        <rect x="17" y="3" width="4" height="4" rx="0.5" fill="currentColor" opacity="0.7" />
        <rect x="3" y="10" width="4" height="4" rx="0.5" fill="currentColor" opacity="0.5" />
        <rect x="10" y="10" width="4" height="4" rx="0.5" fill="currentColor" opacity="0.9" />
        <rect x="17" y="10" width="4" height="4" rx="0.5" fill="currentColor" opacity="0.3" />
        <rect x="3" y="17" width="4" height="4" rx="0.5" fill="currentColor" opacity="0.6" />
        <rect x="10" y="17" width="4" height="4" rx="0.5" fill="currentColor" opacity="0.8" />
        <rect x="17" y="17" width="4" height="4" rx="0.5" fill="currentColor" opacity="0.45" />
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
      <div className="grid grid-cols-3 gap-2">
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
