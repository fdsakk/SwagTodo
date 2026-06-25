import { useDomainStore } from "./domain/domainStore"

let hydratePromise: Promise<void> | null = null

export const hydrateDomainStore = async (): Promise<void> => {
  if (useDomainStore.persist.hasHydrated()) return
  if (!hydratePromise) {
    hydratePromise = Promise.resolve(useDomainStore.persist.rehydrate())
      .catch((error) => {
        console.error("[store] hydrate failed", error)
      })
      .finally(() => {
        hydratePromise = null
      })
  }

  await hydratePromise
}

/**
 * Force-reload domain state from disk (used after the main process writes
 * Google-synced events). Unlike hydrate, this runs even when already hydrated.
 */
export const reloadDomainStore = async (): Promise<void> => {
  try {
    await useDomainStore.persist.rehydrate()
  } catch (error) {
    console.error("[store] reload failed", error)
  }
}
