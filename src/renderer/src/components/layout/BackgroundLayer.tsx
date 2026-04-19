import useAppStore from '@renderer/store/useAppStore'
import { useThemeColors } from '@renderer/hooks/useThemeColors'
import Aurora from '@renderer/components/backgrounds/Aurora'
import Plasma from '@renderer/components/backgrounds/Plasma'
import PixelSnow from '@renderer/components/backgrounds/Pixels'
import PixelBlast from '@renderer/components/backgrounds/PixelBlast'
import SoftAurora from '@renderer/components/backgrounds/SoftAurora'

export function BackgroundLayer(): React.JSX.Element | null {
  const backgroundId = useAppStore((s) => s.appearance.backgroundId)
  const { accent, bg } = useThemeColors()

  if (backgroundId === 'none') return null

  return (
    <div
      className="pointer-events-none absolute inset-0 z-0 overflow-hidden opacity-20"
      style={{ maskImage: 'linear-gradient(to top, black 40%, transparent 100%)', WebkitMaskImage: 'linear-gradient(to top, black 40%, transparent 100%)' }}
    >
      {backgroundId === 'plasma' && (
        <Plasma color={accent} speed={0.6} opacity={0.6} scale={1.2} mouseInteractive={false} />
      )}
      {backgroundId === 'aurora' && (
        <Aurora
          colorStops={[accent, bg, accent]}
          amplitude={1.2}
          blend={0.5}
          speed={0.8}
        />
      )}
      {backgroundId === 'softaurora' && (
        <SoftAurora
          color1={accent}
          color2={bg}
          brightness={1.2}
          speed={0.5}
          bandHeight={0.55}
          bandSpread={1.2}
          enableMouseInteraction={false}
        />
      )}
      {backgroundId === 'pixels' && (
        <PixelSnow
          color={accent}
          density={0.2}
          speed={0.8}
          brightness={1.0}
          variant="snowflake"
          pixelResolution={180}
        />
      )}
      {backgroundId === 'pixelblast' && (
        <PixelBlast
          color={accent}
          variant="circle"
          pixelSize={3}
          patternDensity={0.85}
          speed={0.4}
          enableRipples={true}
          edgeFade={0.15}
          autoPauseOffscreen={true}
        />
      )}
    </div>
  )
}
