import { selectVisibleTasks, useDomainStore, useUiStore } from "@renderer/store"
import type { Priority, Task } from "@renderer/types"
import { format, parseISO } from "date-fns"
import { useMemo } from "react"
import { useShallow } from "zustand/react/shallow"

export const PROJECT_COLOR_SWATCHES = [
  "#f4f4f5",
  "#a1a1aa",
  "#52525b",
  "#ef4444",
  "#f97316",
  "#f59e0b",
  "#eab308",
  "#84cc16",
  "#22c55e",
  "#10b981",
  "#14b8a6",
  "#06b6d4",
  "#0ea5e9",
  "#3b82f6",
  "#6366f1",
  "#8b5cf6",
  "#a855f7",
  "#d946ef",
  "#ec4899",
  "#f43f5e",
  "#78350f",
  "#14532d",
  "#1e3a8a",
  "#4a044e"
]

export const PRIORITY_META: Record<Priority, { label: string; color: string }> =
  {
    p1: { label: "Urgent", color: "hsl(0 70% 60%)" },
    p2: { label: "High", color: "hsl(30 70% 60%)" },
    p3: { label: "Medium", color: "hsl(210 60% 60%)" },
    p4: { label: "None", color: "hsl(0 0% 35%)" }
  }

export function formatDueDate(date?: string): string {
  return date ? format(parseISO(date), "MMM d") : ""
}

export function useVisibleTasks(): Task[] {
  const tasks = useDomainStore((state) => state.tasks)
  const visibleInput = useUiStore(
    useShallow((state) => ({
      sortMode: state.sortMode,
      searchQuery: state.searchQuery,
      showCompleted: state.showCompleted,
      selectedView: state.selectedView
    }))
  )

  return useMemo(
    () => selectVisibleTasks({ tasks }, visibleInput),
    [tasks, visibleInput]
  )
}
