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
  onGoSettings: () => void
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

type HandlerKey = keyof KeyboardShortcutOptions

const KEY_BINDINGS: Record<string, HandlerKey> = {
  n: 'onNewTask',
  p: 'onGoProjects',
  o: 'onNewProject',
  l: 'onOpenLabels',
  b: 'onToggleSidebar',
  i: 'onGoInbox',
  t: 'onGoToday',
  a: 'onGoActivity',
  s: 'onGoSessions',
  ',': 'onGoSettings',
  '/': 'onFocusSearch',
  '?': 'onShowHelp',
  '1': 'onProjectTabList',
  '2': 'onProjectTabKanban'
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

      const handlerKey = KEY_BINDINGS[event.key]
      if (handlerKey) {
        event.preventDefault()
        o[handlerKey]()
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])
}
