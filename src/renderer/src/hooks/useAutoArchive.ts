import { useDomainStore } from "@renderer/store"
import { useEffect } from "react"

const CHECK_INTERVAL_MS = 60 * 60 * 1000

/** Archives completed tasks older than 14 days on start and hourly. */
export function useAutoArchive(enabled: boolean): void {
  useEffect(() => {
    if (!enabled) return
    const run = (): void => {
      useDomainStore.getState().archiveStaleCompletedTasks()
    }
    run()
    const id = window.setInterval(run, CHECK_INTERVAL_MS)
    return () => window.clearInterval(id)
  }, [enabled])
}
