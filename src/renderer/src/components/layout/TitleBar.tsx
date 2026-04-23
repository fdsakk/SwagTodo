import { useEffect, useState } from 'react'

const isMac = window.api?.window?.platform === 'darwin'

function useClockTick(): string {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])
  const day = now.toLocaleDateString('pl-PL', { month: 'short', day: 'numeric' })
  const time = now.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' })
  return `${day}  ${time}`
}

export function TitleBar(): React.JSX.Element | null {
  const [isMaximized, setIsMaximized] = useState(false)
  const [isFullScreen, setIsFullScreen] = useState(false)
  const clock = useClockTick()

  useEffect(() => {
    const windowApi = window.api?.window
    if (!windowApi) return

    void windowApi.getState().then((state) => {
      setIsMaximized(state.isMaximized)
      setIsFullScreen(state.isFullScreen)
    })

    const unsubscribe = windowApi.onStateChange((state) => {
      setIsMaximized(state.isMaximized)
      setIsFullScreen(state.isFullScreen)
    })

    return unsubscribe
  }, [])

  if (isFullScreen) return null

  const handleMinimize = (): void => {
    void window.api?.window?.minimize()
  }

  const handleToggleMaximize = (): void => {
    void window.api?.window?.toggleMaximize()
  }

  const handleClose = (): void => {
    void window.api?.window?.close()
  }

  return (
    <div
      className="flex h-7 shrink-0 items-center justify-between select-none px-2.5 z-50"
      style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
    >
      <span className="text-sm text-app-text-secondary ml-2">😎</span>
      <span className="text-xs font-semibold tracking-wide tabular-nums text-app-text-secondary">
        {clock}
      </span>

      {!isMac && (
        <div
          className="flex h-full items-center gap-2"
          style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
        >
          <button
            type="button"
            aria-label="Minimize window"
            onClick={handleMinimize}
            className="group h-2.5 w-2.5 rounded-full bg-neutral-800 transition-colors hover:bg-yellow-400 focus-visible:bg-yellow-400 focus-visible:outline-none"
          />
          <button
            type="button"
            aria-label={isMaximized ? 'Restore window' : 'Maximize window'}
            onClick={handleToggleMaximize}
            className="h-2.5 w-2.5 rounded-full bg-neutral-800 transition-colors hover:bg-green-500 focus-visible:bg-green-500 focus-visible:outline-none"
          />
          <button
            type="button"
            aria-label="Close window"
            onClick={handleClose}
            className="h-2.5 w-2.5 rounded-full bg-neutral-800 transition-colors hover:bg-red-500 focus-visible:bg-red-500 focus-visible:outline-none"
          />
        </div>
      )}
    </div>
  )
}
