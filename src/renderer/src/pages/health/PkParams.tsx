import { useState } from 'react'
import type { PkSettings } from '@renderer/types'
import { cn } from '@renderer/utils/cn'
import { SliderRow } from './SliderRow'

interface PkParamsProps {
  pkSettings: PkSettings
  onChange: (patch: Partial<PkSettings>) => void
}

export function PkParams({ pkSettings, onChange }: PkParamsProps): React.JSX.Element {
  const [open, setOpen] = useState(false)
  return (
    <div className="mt-3 -mx-4 border-t border-app-border px-4 pt-4">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between text-xs font-medium text-app-text-muted uppercase tracking-wider hover:text-app-text transition-colors"
      >
        <span>Pharmacokinetic parameters</span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={cn('transition-transform duration-200', open ? 'rotate-180' : '')}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
      {open && (
        <div className="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <SliderRow
            label="Intensity"
            value={pkSettings.peakScale}
            min={0.5}
            max={2.0}
            step={0.05}
            format={(v) => `${v.toFixed(2)}×`}
            onChange={(v) => onChange({ peakScale: v })}
          />
          <SliderRow
            label="Tmax offset"
            value={pkSettings.tMaxOffsetH}
            min={-1}
            max={2}
            step={0.25}
            format={(v) => `${v >= 0 ? '+' : ''}${v.toFixed(2)} h`}
            onChange={(v) => onChange({ tMaxOffsetH: v })}
          />
          <SliderRow
            label="Elimination rate"
            value={pkSettings.keMultiplier}
            min={0.4}
            max={2.0}
            step={0.1}
            format={(v) => `${v.toFixed(1)}×`}
            onChange={(v) => onChange({ keMultiplier: v })}
          />
          <SliderRow
            label="Crash sensitivity"
            value={Math.abs(pkSettings.crashThreshold)}
            min={0.01}
            max={0.1}
            step={0.005}
            format={(v) => v.toFixed(3)}
            onChange={(v) => onChange({ crashThreshold: -v })}
          />
          <SliderRow
            label="MEC"
            value={pkSettings.mec}
            min={0.05}
            max={1.5}
            step={0.05}
            format={(v) => v.toFixed(2)}
            onChange={(v) => onChange({ mec: v })}
          />
          <SliderRow
            label="MTC"
            value={pkSettings.mtc}
            min={0.3}
            max={3.0}
            step={0.05}
            format={(v) => v.toFixed(2)}
            onChange={(v) => onChange({ mtc: v })}
          />
        </div>
      )}
    </div>
  )
}
