import {
  Command,
  CommandCollection,
  CommandDialog,
  CommandDialogPopup,
  CommandEmpty,
  CommandGroup,
  CommandGroupLabel,
  CommandInput,
  CommandItem,
  CommandList,
  CommandPanel,
  CommandShortcut
} from "@renderer/components/ui/command"
import { toastManager } from "@renderer/components/ui/toast-manager"
import { useDomainStore, useUiStore } from "@renderer/store"
import { startTaskTimer, stopActiveTimer } from "@renderer/utils/timer"
import { useMemo } from "react"
import { useShallow } from "zustand/react/shallow"
import { runDataAction } from "./dataActions"

interface PaletteItem {
  value: string
  label: string
  shortcut?: string
  run: () => void
}

interface PaletteGroup {
  value: string
  items: PaletteItem[]
}

const MAX_TASKS = 200

export function CommandPalette(): React.JSX.Element {
  const { open, setOpen, activeTimer } = useUiStore(
    useShallow((state) => ({
      open: state.commandPaletteOpen,
      setOpen: state.setCommandPaletteOpen,
      activeTimer: state.activeTimer
    }))
  )
  const { tasks, projects, savedViews } = useDomainStore(
    useShallow((state) => ({
      tasks: state.tasks,
      projects: state.projects,
      savedViews: state.preferences.savedViews
    }))
  )

  const groups = useMemo((): PaletteGroup[] => {
    if (!open) return []
    const ui = useUiStore.getState()
    const domain = useDomainStore.getState()
    const nav: PaletteItem[] = [
      {
        value: "nav-inbox",
        label: "Go to Inbox",
        shortcut: "I",
        run: ui.selectInbox
      },
      {
        value: "nav-today",
        label: "Go to Today",
        shortcut: "T",
        run: ui.selectToday
      },
      {
        value: "nav-upcoming",
        label: "Go to Upcoming",
        shortcut: "U",
        run: ui.selectUpcoming
      },
      {
        value: "nav-activity",
        label: "Go to Activity",
        shortcut: "A",
        run: ui.selectActivity
      },
      {
        value: "nav-stats",
        label: "Go to Statistics",
        shortcut: "C",
        run: ui.selectStats
      },
      {
        value: "nav-sessions",
        label: "Go to Sessions",
        shortcut: "S",
        run: ui.selectSessions
      },
      {
        value: "nav-archive",
        label: "Go to Archive",
        shortcut: "R",
        run: ui.selectArchive
      },
      {
        value: "nav-health",
        label: "Go to Meds",
        shortcut: "H",
        run: ui.selectHealth
      },
      {
        value: "nav-settings",
        label: "Go to Settings",
        shortcut: ",",
        run: ui.selectSettings
      }
    ]
    const actions: PaletteItem[] = [
      {
        value: "act-quick",
        label: "Quick add task",
        shortcut: "Q",
        run: () => ui.setQuickAddOpen(true)
      },
      {
        value: "act-new",
        label: "New task (form)",
        shortcut: "N",
        run: ui.openCreatePanelForCurrentView
      },
      {
        value: "act-project",
        label: "New project",
        shortcut: "O",
        run: ui.openCreateProjectPanel
      },
      {
        value: "act-sidebar",
        label: "Toggle sidebar",
        shortcut: "B",
        run: domain.toggleSidebar
      },
      {
        value: "act-backup",
        label: "Create backup now",
        run: () => void runDataAction("backup")
      },
      {
        value: "act-export-json",
        label: "Export data (JSON)",
        run: () => void runDataAction("exportJson")
      },
      {
        value: "act-export-csv",
        label: "Export tasks (CSV)",
        run: () => void runDataAction("exportCsv")
      },
      {
        value: "act-import",
        label: "Import data…",
        run: () => void runDataAction("import")
      }
    ]
    if (activeTimer) {
      actions.unshift({
        value: "act-stop-timer",
        label: "Stop timer and log session",
        run: stopActiveTimer
      })
    }
    const views: PaletteItem[] = savedViews.map((view) => ({
      value: `view-${view.id}`,
      label: `View: ${view.name}`,
      run: () => ui.applySavedView(view)
    }))
    const projectItems: PaletteItem[] = projects.map((project) => ({
      value: `project-${project.id}`,
      label: `${project.emoji || "#"} ${project.name}`,
      run: () => ui.selectProject(project.id)
    }))
    const taskItems: PaletteItem[] = []
    for (const task of tasks) {
      if (task.archivedAt || task.completed) continue
      taskItems.push({
        value: `task-${task.id}`,
        label: task.title,
        run: () => ui.openEditPanel(task.id)
      })
      if (task.projectId)
        taskItems.push({
          value: `timer-${task.id}`,
          label: `Start pomodoro: ${task.title}`,
          run: () => startTaskTimer(task.id, "pomodoro")
        })
      if (taskItems.length >= MAX_TASKS) break
    }

    return [
      { value: "Actions", items: actions },
      { value: "Navigation", items: nav },
      { value: "Saved views", items: views },
      { value: "Projects", items: projectItems },
      { value: "Tasks", items: taskItems }
    ].filter((group) => group.items.length > 0)
  }, [activeTimer, open, projects, savedViews, tasks])

  const run = (item: PaletteItem): void => {
    setOpen(false)
    try {
      item.run()
    } catch (error) {
      toastManager.add({
        title: "Command failed",
        description: String(error),
        type: "error"
      })
    }
  }

  return (
    <CommandDialog onOpenChange={setOpen} open={open}>
      <CommandDialogPopup>
        <Command
          items={groups}
          itemToStringValue={(item: unknown) => (item as PaletteItem).label}
        >
          <CommandInput placeholder="Search commands, projects, tasks…" />
          <CommandPanel>
            <CommandEmpty>No results found.</CommandEmpty>
            <CommandList className="max-h-[min(24rem,60vh)]">
              {(group: PaletteGroup) => (
                <CommandGroup items={group.items} key={group.value}>
                  <CommandGroupLabel>{group.value}</CommandGroupLabel>
                  <CommandCollection>
                    {(item: PaletteItem) => (
                      <CommandItem
                        key={item.value}
                        onClick={() => run(item)}
                        value={item}
                      >
                        <span className="truncate">{item.label}</span>
                        {item.shortcut && (
                          <CommandShortcut>{item.shortcut}</CommandShortcut>
                        )}
                      </CommandItem>
                    )}
                  </CommandCollection>
                </CommandGroup>
              )}
            </CommandList>
          </CommandPanel>
        </Command>
      </CommandDialogPopup>
    </CommandDialog>
  )
}
