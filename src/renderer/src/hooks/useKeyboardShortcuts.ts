import { useEffect, useRef } from "react"

interface KeyboardShortcutOptions {
  onNewTask: () => void
  onNewProject: () => void
  onFocusSearch: () => void
  onEscape: () => void
  onToggleSidebar: () => void
  onOpenLabels: () => void
  onShowHelp: () => void
  onGoInbox: () => void
  onGoToday: () => void
  onGoActivity: () => void
  onGoArchive: () => void
  onGoHealth: () => void
  onGoSessions: () => void
  onGoSettings: () => void
  onGoProjects: () => void
  onProjectTabList: () => void
  onProjectTabKanban: () => void
  onZoomIn: () => void
  onZoomOut: () => void
  onZoomReset: () => void
}

function isInputLikeElement(element: Element | null): boolean {
  if (!element) return false
  const tagName = element.tagName
  return (
    tagName === "INPUT" ||
    tagName === "TEXTAREA" ||
    tagName === "SELECT" ||
    (element as HTMLElement).isContentEditable
  )
}

type HandlerKey = keyof KeyboardShortcutOptions

const KEY_BINDINGS: Record<string, HandlerKey> = {
  n: "onNewTask",
  p: "onGoProjects",
  o: "onNewProject",
  l: "onOpenLabels",
  b: "onToggleSidebar",
  i: "onGoInbox",
  t: "onGoToday",
  a: "onGoActivity",
  r: "onGoArchive",
  h: "onGoHealth",
  s: "onGoSessions",
  ",": "onGoSettings",
  "/": "onFocusSearch",
  "?": "onShowHelp",
  "1": "onProjectTabList",
  "2": "onProjectTabKanban"
}

export function useKeyboardShortcuts(options: KeyboardShortcutOptions): void {
  const optsRef = useRef(options)

  useEffect(() => {
    optsRef.current = options
  }, [options])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent): void => {
      const o = optsRef.current
      const activeElement = document.activeElement

      if (event.key === "Escape") {
        if (isInputLikeElement(activeElement)) {
          ;(activeElement as HTMLElement).blur()
        }
        o.onEscape()
        return
      }

      if (isInputLikeElement(activeElement)) return

      if (event.ctrlKey || event.metaKey) {
        if (event.key === "=" || event.key === "+") {
          event.preventDefault()
          o.onZoomIn()
          return
        }
        if (event.key === "-") {
          event.preventDefault()
          o.onZoomOut()
          return
        }
        if (event.key === "0") {
          event.preventDefault()
          o.onZoomReset()
          return
        }
      }

      if (event.ctrlKey || event.metaKey || event.altKey) return

      const handlerKey = KEY_BINDINGS[event.key]
      if (handlerKey) {
        event.preventDefault()
        o[handlerKey]()
      }
    }

    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [])
}
