import { useCallback, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import {
  SLOT_MIN,
  buildIsoAtMinutes,
  clampMin,
  pointToMinutes,
  snapMin
} from '@renderer/utils/calendar'
import type {
  Draft,
  DraftCreate,
  DraftMove,
  DraftResize,
  DraftTimeBlockMove,
  DraftTimeBlockResize,
  SessionBlock,
  TimeBlockDisplayBlock
} from './types'

const DEFAULT_CLICK_MIN = 60
const DAY_MIN = 24 * 60

interface UseCalendarDragArgs {
  days: Date[]
  onCreateDraft: (dayIndex: number, startMin: number, endMin: number) => void
  onUpdate: (sessionId: string, startAt: string, endAt: string) => void
  onOpenSession: (sessionId: string) => void
  onUpdateTimeBlock: (id: string, startAt: string, endAt: string) => void
}

interface CalendarDrag {
  draft: Draft | null
  setColumnRef: (idx: number) => (el: HTMLDivElement | null) => void
  handleCreatePointerDown: (event: ReactPointerEvent<HTMLDivElement>) => void
  handleBlockPointerDown: (
    block: SessionBlock,
    mode: 'move' | 'resize'
  ) => (event: ReactPointerEvent<HTMLDivElement>) => void
  handleTimeBlockPointerDown: (
    tb: TimeBlockDisplayBlock,
    mode: 'move' | 'resize'
  ) => (event: ReactPointerEvent<HTMLDivElement>) => void
}

function findDayIndexAtX(
  rects: readonly (DOMRect | null)[],
  clientX: number,
  fallback: number
): number {
  for (let i = 0; i < rects.length; i++) {
    const r = rects[i]
    if (!r) continue
    if (clientX >= r.left && clientX <= r.right) return i
  }
  return fallback
}

const measureColumnRects = (columns: readonly (HTMLDivElement | null)[]): (DOMRect | null)[] =>
  columns.map((column) => column?.getBoundingClientRect() ?? null)

export function useCalendarDrag({
  days,
  onCreateDraft,
  onUpdate,
  onOpenSession,
  onUpdateTimeBlock
}: UseCalendarDragArgs): CalendarDrag {
  const columnRefs = useRef<(HTMLDivElement | null)[]>([])
  const columnRectsRef = useRef<(DOMRect | null)[]>([])
  const [draft, setDraft] = useState<Draft | null>(null)

  const setColumnRef = useCallback(
    (idx: number) => (el: HTMLDivElement | null) => {
      columnRefs.current[idx] = el
    },
    []
  )

  const handleCreatePointerDown = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>): void => {
      if (event.button !== 0) return
      const target = event.target as HTMLElement
      if (target.closest('[data-session-block]')) return
      const dayIndex = Number(event.currentTarget.dataset.dayIndex)
      const column = columnRefs.current[dayIndex]
      if (!column) return
      event.preventDefault()
      const startMin = pointToMinutes(event.clientY, column)
      let current: DraftCreate = {
        kind: 'create',
        dayIndex,
        startMin,
        endMin: Math.min(DAY_MIN, startMin + SLOT_MIN)
      }
      let moved = false
      setDraft(current)
      const onMove = (e: PointerEvent): void => {
        const col = columnRefs.current[dayIndex]
        if (!col) return
        const cur = pointToMinutes(e.clientY, col)
        const endMin =
          cur <= current.startMin ? Math.min(DAY_MIN, current.startMin + SLOT_MIN) : cur
        if (endMin !== current.endMin) moved = true
        current = { ...current, endMin }
        setDraft(current)
      }
      const onUp = (): void => {
        window.removeEventListener('pointermove', onMove)
        window.removeEventListener('pointerup', onUp)
        setDraft(null)
        let finalStart = current.startMin
        let finalEnd = current.endMin
        if (!moved) {
          finalEnd = Math.min(DAY_MIN, finalStart + DEFAULT_CLICK_MIN)
          if (finalEnd - finalStart < DEFAULT_CLICK_MIN) {
            finalStart = Math.max(0, DAY_MIN - DEFAULT_CLICK_MIN)
            finalEnd = DAY_MIN
          }
        }
        if (finalEnd <= finalStart) return
        onCreateDraft(current.dayIndex, finalStart, finalEnd)
      }
      window.addEventListener('pointermove', onMove)
      window.addEventListener('pointerup', onUp)
    },
    [onCreateDraft]
  )

  const handleBlockPointerDown = useCallback(
    (block: SessionBlock, mode: 'move' | 'resize') =>
      (event: ReactPointerEvent<HTMLDivElement>): void => {
        if (event.button !== 0) return
        event.preventDefault()
        event.stopPropagation()
        const startDayIndex = block.dayIndex
        const column = columnRefs.current[startDayIndex]
        if (!column) return
        const initialPointer = pointToMinutes(event.clientY, column)
        columnRectsRef.current = measureColumnRects(columnRefs.current)
        const duration = block.endMin - block.startMin
        const offsetMin = initialPointer - block.startMin
        let current: DraftMove | DraftResize = {
          kind: mode,
          sessionId: block.session.id,
          dayIndex: startDayIndex,
          startMin: block.startMin,
          endMin: block.endMin
        }
        setDraft(current)
        let moved = false
        const onMove = (e: PointerEvent): void => {
          moved = true
          const nextDayIndex =
            mode === 'move'
              ? findDayIndexAtX(columnRectsRef.current, e.clientX, startDayIndex)
              : startDayIndex
          const col = columnRefs.current[nextDayIndex]
          if (!col) return
          const cur = pointToMinutes(e.clientY, col)
          if (mode === 'move') {
            const nextStart = clampMin(snapMin(cur - offsetMin))
            const start = Math.min(DAY_MIN - duration, nextStart)
            current = {
              kind: 'move',
              sessionId: block.session.id,
              dayIndex: nextDayIndex,
              startMin: start,
              endMin: start + duration
            }
          } else {
            const end = Math.max(block.startMin + SLOT_MIN, clampMin(cur))
            current = {
              kind: 'resize',
              sessionId: block.session.id,
              dayIndex: startDayIndex,
              startMin: block.startMin,
              endMin: end
            }
          }
          setDraft(current)
        }
        const onUp = (): void => {
          window.removeEventListener('pointermove', onMove)
          window.removeEventListener('pointerup', onUp)
          setDraft(null)
          if (!moved) {
            onOpenSession(block.session.id)
            return
          }
          const targetDay = days[current.dayIndex] ?? days[startDayIndex]
          const startAt = buildIsoAtMinutes(targetDay, current.startMin)
          const endAt = buildIsoAtMinutes(targetDay, current.endMin)
          onUpdate(block.session.id, startAt, endAt)
        }
        window.addEventListener('pointermove', onMove)
        window.addEventListener('pointerup', onUp)
      },
    [days, onUpdate, onOpenSession]
  )

  const handleTimeBlockPointerDown = useCallback(
    (tb: TimeBlockDisplayBlock, mode: 'move' | 'resize') =>
      (event: ReactPointerEvent<HTMLDivElement>): void => {
        if (event.button !== 0) return
        event.preventDefault()
        event.stopPropagation()
        const startDayIndex = tb.dayIndex
        const column = columnRefs.current[startDayIndex]
        if (!column) return
        const initialPointer = pointToMinutes(event.clientY, column)
        columnRectsRef.current = measureColumnRects(columnRefs.current)
        const duration = tb.endMin - tb.startMin
        const offsetMin = initialPointer - tb.startMin
        let current: DraftTimeBlockMove | DraftTimeBlockResize = {
          kind: mode === 'move' ? 'tb_move' : 'tb_resize',
          blockId: tb.block.id,
          dayIndex: startDayIndex,
          startMin: tb.startMin,
          endMin: tb.endMin
        }
        setDraft(current)
        let moved = false
        const onMove = (e: PointerEvent): void => {
          moved = true
          const nextDayIndex =
            mode === 'move'
              ? findDayIndexAtX(columnRectsRef.current, e.clientX, startDayIndex)
              : startDayIndex
          const col = columnRefs.current[nextDayIndex]
          if (!col) return
          const cur = pointToMinutes(e.clientY, col)
          if (mode === 'move') {
            const nextStart = clampMin(snapMin(cur - offsetMin))
            const start = Math.min(DAY_MIN - duration, nextStart)
            current = {
              kind: 'tb_move',
              blockId: tb.block.id,
              dayIndex: nextDayIndex,
              startMin: start,
              endMin: start + duration
            }
          } else {
            const end = Math.max(tb.startMin + SLOT_MIN, clampMin(cur))
            current = {
              kind: 'tb_resize',
              blockId: tb.block.id,
              dayIndex: startDayIndex,
              startMin: tb.startMin,
              endMin: end
            }
          }
          setDraft(current)
        }
        const onUp = (): void => {
          window.removeEventListener('pointermove', onMove)
          window.removeEventListener('pointerup', onUp)
          setDraft(null)
          if (!moved) return
          const targetDay = days[current.dayIndex] ?? days[startDayIndex]
          const startAt = buildIsoAtMinutes(targetDay, current.startMin)
          const endAt = buildIsoAtMinutes(targetDay, current.endMin)
          onUpdateTimeBlock(tb.block.id, startAt, endAt)
        }
        window.addEventListener('pointermove', onMove)
        window.addEventListener('pointerup', onUp)
      },
    [days, onUpdateTimeBlock]
  )

  return {
    draft,
    setColumnRef,
    handleCreatePointerDown,
    handleBlockPointerDown,
    handleTimeBlockPointerDown
  }
}
