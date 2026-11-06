import { toastManager } from "@renderer/components/ui/toast-manager"
import { useDomainStore } from "@renderer/store"

export type DataAction = "backup" | "exportJson" | "exportCsv" | "import"

const fail = (title: string, error?: string): void => {
  toastManager.add({ title, description: error, type: "error" })
}

/** Backup / export / import through the main process, with toasts. */
export async function runDataAction(action: DataAction): Promise<void> {
  const api = window.api?.backup
  if (!api) return
  try {
    if (action === "backup") {
      const result = await api.create()
      if (result.ok)
        toastManager.add({
          title: "Backup created",
          description: result.value,
          type: "success"
        })
      else fail("Backup failed", result.error)
      return
    }
    if (action === "exportJson" || action === "exportCsv") {
      const result =
        action === "exportJson" ? await api.exportJson() : await api.exportCsv()
      if (result.ok)
        toastManager.add({
          title: "Exported",
          description: result.value,
          type: "success"
        })
      else if (!result.canceled) fail("Export failed", result.error)
      return
    }
    const result = await api.importFile()
    if (!result.ok) {
      if (!result.canceled) fail("Import failed", result.error)
      return
    }
    await useDomainStore.persist.rehydrate()
    toastManager.add({
      title: `Imported ${result.value} tasks`,
      description: "A pre-import backup was saved first.",
      type: "success"
    })
  } catch (error) {
    fail(
      "Operation failed",
      error instanceof Error ? error.message : String(error)
    )
  }
}
