import { z } from "zod"

// A Google event start/end is either a date (all-day; end is exclusive) or a
// dateTime (RFC3339 with offset). Both fields are optional/defensive.
export const googleEventDateTimeSchema = z
  .object({
    date: z.string().optional().catch(undefined),
    dateTime: z.string().optional().catch(undefined),
    timeZone: z.string().optional().catch(undefined)
  })
  .passthrough()

export const googleEventSchema = z
  .object({
    id: z.string(),
    status: z.enum(["confirmed", "tentative", "cancelled"]).catch("confirmed"),
    summary: z.string().optional().catch(undefined),
    description: z.string().optional().catch(undefined),
    location: z.string().optional().catch(undefined),
    colorId: z.string().optional().catch(undefined),
    start: googleEventDateTimeSchema.optional().catch(undefined),
    end: googleEventDateTimeSchema.optional().catch(undefined),
    recurrence: z.array(z.string()).optional().catch(undefined),
    recurringEventId: z.string().optional().catch(undefined),
    originalStartTime: googleEventDateTimeSchema.optional().catch(undefined),
    updated: z.string().optional().catch(undefined),
    etag: z.string().optional().catch(undefined)
  })
  .passthrough()

export type GoogleEvent = z.infer<typeof googleEventSchema>

export const googleEventsListSchema = z
  .object({
    items: z.array(z.unknown()).optional().catch([]),
    nextPageToken: z.string().optional().catch(undefined),
    nextSyncToken: z.string().optional().catch(undefined)
  })
  .passthrough()
