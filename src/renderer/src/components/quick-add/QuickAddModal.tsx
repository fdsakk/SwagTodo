import { Badge } from "@renderer/components/ui/badge"
import { Button } from "@renderer/components/ui/button"
import {
  Dialog,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogPanel,
  DialogPopup,
  DialogTitle
} from "@renderer/components/ui/dialog"
import { useDomainStore, useUiStore } from "@renderer/store"
import { parseQuickAdd } from "@renderer/utils/quickAdd"
import { describeRecurrence } from "@renderer/utils/recurrence"
import { PRIORITY_META, PROJECT_COLOR_SWATCHES } from "@renderer/utils/task"
import { format, parseISO } from "date-fns"
import { useMemo, useState } from "react"
import { useShallow } from "zustand/react/shallow"

const EXAMPLES = [
  "Call Anna tomorrow at 3pm p1 #phone @work",
  "Zapłać czynsz co miesiąc 10.12",
  "Gym every mon and thu 7:00",
  "Raport w piątek o 9 !2"
]

export function QuickAddModal(): React.JSX.Element {
  const { open, setOpen, selectedView, selectedProjectId } = useUiStore(
    useShallow((state) => ({
      open: state.quickAddOpen,
      setOpen: state.setQuickAddOpen,
      selectedView: state.selectedView,
      selectedProjectId: state.selectedProjectId
    }))
  )
  const { projects, labels } = useDomainStore(
    useShallow((state) => ({ projects: state.projects, labels: state.labels }))
  )
  const [text, setText] = useState("")

  const parsed = useMemo(
    () => parseQuickAdd(text, { projects, labels }),
    [labels, projects, text]
  )
  const projectId =
    parsed.projectId ??
    (selectedView === "project" ? selectedProjectId : undefined)
  const project = projects.find((p) => p.id === projectId)

  const close = (): void => {
    setOpen(false)
    setText("")
  }

  const submit = (): void => {
    if (!parsed.title.trim()) return
    const store = useDomainStore.getState()
    const newLabelIds = parsed.newLabels
      .map((name, i) =>
        store.addLabel({
          name,
          color:
            PROJECT_COLOR_SWATCHES[
              (labels.length + i + 3) % PROJECT_COLOR_SWATCHES.length
            ]
        })
      )
      .filter(Boolean)
    store.addTask({
      title: parsed.title,
      dueDate: parsed.dueDate,
      dueTime: parsed.dueTime,
      recurrence: parsed.recurrence,
      priority: parsed.priority,
      projectId,
      labels: [...parsed.labelIds, ...newLabelIds]
    })
    close()
  }

  const chips: { key: string; text: string; color?: string }[] = []
  if (parsed.dueDate) {
    chips.push({
      key: "date",
      text: `📅 ${format(parseISO(parsed.dueDate), "EEE d MMM")}${parsed.dueTime ? ` ${parsed.dueTime}` : ""}`
    })
  }
  if (parsed.recurrence)
    chips.push({
      key: "rec",
      text: `↻ ${describeRecurrence(parsed.recurrence)}`
    })
  if (parsed.priority)
    chips.push({
      key: "prio",
      text: `⚑ ${PRIORITY_META[parsed.priority].label}`,
      color: PRIORITY_META[parsed.priority].color
    })
  if (project)
    chips.push({ key: "proj", text: `${project.emoji || "#"} ${project.name}` })
  for (const id of parsed.labelIds) {
    const label = labels.find((l) => l.id === id)
    if (label)
      chips.push({ key: `l-${id}`, text: `#${label.name}`, color: label.color })
  }
  for (const name of parsed.newLabels)
    chips.push({ key: `n-${name}`, text: `#${name} (new)` })

  return (
    <Dialog open={open} onOpenChange={(next) => !next && close()}>
      <DialogPopup className="sm:max-w-xl" finalFocus={() => false}>
        <DialogHeader>
          <DialogTitle>Quick add</DialogTitle>
          <DialogDescription>
            Type naturally — dates, times, <code>p1</code>–<code>p4</code>,{" "}
            <code>#label</code>, <code>@project</code>, “every …” / “co …”.
          </DialogDescription>
        </DialogHeader>
        <DialogPanel className="space-y-3">
          <input
            autoFocus
            className="h-10 w-full rounded-md border border-app-border bg-app-card px-3 text-sm text-app-text placeholder:text-app-text-muted focus:outline-none focus:ring-2 focus:ring-app-accent/50"
            onChange={(event) => setText(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault()
                submit()
              }
            }}
            placeholder={EXAMPLES[0]}
            value={text}
          />
          <div className="flex min-h-6 flex-wrap items-center gap-1.5">
            {parsed.title && (
              <span className="mr-1 truncate text-sm text-app-text">
                {parsed.title}
              </span>
            )}
            {chips.map((chip) => (
              <Badge key={chip.key} size="sm" variant="outline">
                {chip.color && (
                  <span
                    className="size-2 rounded-full"
                    style={{ background: chip.color }}
                  />
                )}
                {chip.text}
              </Badge>
            ))}
          </div>
          {!text && (
            <ul className="space-y-1 text-xs text-app-text-muted">
              {EXAMPLES.map((example) => (
                <li key={example}>
                  <button
                    className="hover:text-app-text-secondary"
                    onClick={() => setText(example)}
                    type="button"
                  >
                    {example}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </DialogPanel>
        <DialogFooter>
          <Button onClick={close} size="sm" type="button" variant="outline">
            Cancel
          </Button>
          <Button
            disabled={!parsed.title.trim()}
            onClick={submit}
            size="sm"
            type="button"
          >
            Add task
          </Button>
        </DialogFooter>
      </DialogPopup>
    </Dialog>
  )
}
