import { useEffect, useRef } from 'react'

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
  onGoSessions: () => void
  onGoProjects: () => void
  onProjectTabList: () => void
  onProjectTabKanban: () => void
}

function isInputLikeElement(element: Element | null): boolean {
  if (!element) return false
  const tagName = element.tagName
  return (
    tagName === 'INPUT' ||
    tagName === 'TEXTAREA' ||
    tagName === 'SELECT' ||
    (element as HTMLElement).isContentEditable
  )
}

export function useKeyboardShortcuts(options: KeyboardShortcutOptions): void {
  const optsRef = useRef(options)
  optsRef.current = options

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent): void => {
      const o = optsRef.current
      const activeElement = document.activeElement

      if (event.key === 'Escape') {
        if (isInputLikeElement(activeElement)) {
          ;(activeElement as HTMLElement).blur()
        }
        o.onEscape()
        return
      }

      if (isInputLikeElement(activeElement)) return
      if (event.ctrlKey || event.metaKey || event.altKey) return

      const key = event.key.toLowerCase()

      switch (key) {
        case 'n':
          event.preventDefault()
          o.onNewTask()
          return
        case 'p':
          event.preventDefault()
          o.onGoProjects()
          return
        case 'o':
          event.preventDefault()
          o.onNewProject()
          return
        case 'l':
          event.preventDefault()
          o.onOpenLabels()
          return
        case 'b':
          event.preventDefault()
          o.onToggleSidebar()
          return
        case 'i':
          event.preventDefault()
          o.onGoInbox()
          return
        case 't':
          event.preventDefault()
          o.onGoToday()
          return
        case 'a':
          event.preventDefault()
          o.onGoActivity()
          return
        case 's':
          event.preventDefault()
          o.onGoSessions()
          return
      }

      if (event.key === '/') {
        event.preventDefault()
        o.onFocusSearch()
        return
      }

      if (event.key === '?') {
        event.preventDefault()
        o.onShowHelp()
        return
      }

      if (event.key === '1') {
        event.preventDefault()
        o.onProjectTabList()
        return
      }

      if (event.key === '2') {
        event.preventDefault()
        o.onProjectTabKanban()
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [])
}
