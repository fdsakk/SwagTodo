import { toastManager } from "@renderer/components/ui/toast-manager"
import { useDomainStore } from "@renderer/store"
import { useMemo } from "react"

const UNDO_TIMEOUT_MS = 6000

const plural = (count: number, word: string): string =>
  count === 1 ? `1 ${word}` : `${count} ${word}s`

const showUndo = (title: string, onUndo: () => void): void => {
  const id = toastManager.add({
    title,
    type: "success",
    timeout: UNDO_TIMEOUT_MS,
    actionProps: {
      children: "Undo",
      onClick: () => {
        onUndo()
        toastManager.close(id)
      }
    }
  })
}

export interface UndoableTaskActions {
  deleteTasks: (taskIds: string[]) => void
  archiveTasks: (taskIds: string[]) => void
  deleteTask: (taskId: string) => void
  archiveTask: (taskId: string) => void
}

/** Destructive task actions that offer an "Undo" toast instead of a confirm. */
export function useUndoableTaskActions(): UndoableTaskActions {
  return useMemo(() => {
    const deleteTasks = (taskIds: string[]): void => {
      const store = useDomainStore.getState()
      const snapshot = store.deleteTasks(taskIds)
      if (snapshot.tasks.length === 0) return
      showUndo(`Deleted ${plural(snapshot.tasks.length, "task")}`, () =>
        useDomainStore.getState().restoreTasks(snapshot)
      )
    }

    const archiveTasks = (taskIds: string[]): void => {
      const store = useDomainStore.getState()
      const ids = taskIds.filter((id) =>
        store.tasks.some((task) => task.id === id && !task.archivedAt)
      )
      if (ids.length === 0) return
      store.archiveTasks(ids)
      showUndo(`Archived ${plural(ids.length, "task")}`, () =>
        useDomainStore.getState().unarchiveTasks(ids)
      )
    }

    return {
      deleteTasks,
      archiveTasks,
      deleteTask: (taskId) => deleteTasks([taskId]),
      archiveTask: (taskId) => archiveTasks([taskId])
    }
  }, [])
}
