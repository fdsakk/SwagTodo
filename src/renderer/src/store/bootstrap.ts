import { useDomainStore } from './domain/domainStore'

let hydratePromise: Promise<void> | null = null

export const hydrateDomainStore = async (): Promise<void> => {
  if (useDomainStore.persist.hasHydrated()) return
  if (!hydratePromise) {
    hydratePromise = Promise.resolve(useDomainStore.persist.rehydrate())
      .catch((error) => {
        console.error('[store] hydrate failed', error)
      })
      .finally(() => {
        hydratePromise = null
      })
  }

  await hydratePromise
}
