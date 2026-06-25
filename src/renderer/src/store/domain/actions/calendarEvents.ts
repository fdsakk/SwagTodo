import type { CalendarEvent } from "@renderer/types"
import { v4 as uuidv4 } from "uuid"
import type {
  DomainActions,
  DomainStoreGet,
  DomainStoreSet
} from "../../shared/types"
import {
  appendIfValid,
  getTimeRangeError,
  nowIso,
  removeById
} from "../../shared/utils"

type CalendarEventActions = Pick<
  DomainActions,
  "addCalendarEvent" | "updateCalendarEvent" | "deleteCalendarEvent"
>

// Notify the main process of a user-initiated mutation so it can push to
// Google. Only domain actions call this — sync-origin writes (which arrive via
// store rehydrate, not these actions) never enqueue, which is the echo guard.
const enqueuePush = (
  eventId: string,
  op: "insert" | "patch" | "delete"
): void => {
  if (typeof window === "undefined") return
  void window.api?.google?.push(eventId, op)
}

export const createCalendarEventActions = (
  set: DomainStoreSet,
  get: DomainStoreGet
): CalendarEventActions => ({
  addCalendarEvent: (input) => {
    const rangeError = getTimeRangeError(input.startAt, input.endAt)
    if (rangeError) return { ok: false, error: rangeError }

    const timestamp = nowIso()
    // The local id is always a uuid so it passes the renderer→main UUID gate
    // (isAppStatePatch). A Google id, when synced, lives in `googleEventId`.
    const event: CalendarEvent = {
      id: uuidv4(),
      title: input.title.trim() || "(No title)",
      description: input.description?.trim() || undefined,
      location: input.location?.trim() || undefined,
      color: input.color,
      startAt: input.startAt,
      endAt: input.endAt,
      allDay: input.allDay ?? false,
      rrule: input.rrule,
      syncStatus: "local_only",
      createdAt: timestamp,
      updatedAt: timestamp
    }

    set((state) => ({
      calendarEvents: appendIfValid(state.calendarEvents, event)
    }))
    enqueuePush(event.id, "insert")
    return { ok: true, id: event.id }
  },
  updateCalendarEvent: (id, updates) => {
    const state = get()
    const index = state.calendarEvents.findIndex((event) => event.id === id)
    if (index === -1) return { ok: false, error: "Event not found" }

    const current = state.calendarEvents[index]
    const startAt = updates.startAt ?? current.startAt
    const endAt = updates.endAt ?? current.endAt
    const rangeError = getTimeRangeError(startAt, endAt)
    if (rangeError) return { ok: false, error: rangeError }

    const next: CalendarEvent = {
      ...current,
      title: updates.title?.trim() ?? current.title,
      description:
        "description" in updates
          ? updates.description?.trim() || undefined
          : current.description,
      location:
        "location" in updates
          ? updates.location?.trim() || undefined
          : current.location,
      color: "color" in updates ? updates.color : current.color,
      startAt,
      endAt,
      allDay: updates.allDay ?? current.allDay,
      rrule: "rrule" in updates ? updates.rrule : current.rrule,
      // A synced event edited locally becomes pending until the next push.
      syncStatus:
        current.syncStatus === "synced" ? "pending" : current.syncStatus,
      updatedAt: nowIso()
    }

    const calendarEvents = state.calendarEvents.slice()
    calendarEvents[index] = next
    set({ calendarEvents })
    enqueuePush(id, "patch")
    return { ok: true }
  },
  deleteCalendarEvent: (id) => {
    let removed = false
    set((state) => {
      const calendarEvents = removeById(state.calendarEvents, id)
      if (calendarEvents === state.calendarEvents) return state
      removed = true
      return { calendarEvents }
    })
    if (removed) enqueuePush(id, "delete")
  }
})
