import { z } from "zod"
import type { AppearanceSettings, Task } from "./types"

const EPOCH_ISO = new Date(0).toISOString()
const storedBooleanSchema = z.preprocess(
  (value) => (typeof value === "number" ? value !== 0 : value),
  z.boolean().catch(false)
)

export const prioritySchema = z.enum(["p1", "p2", "p3", "p4"])
export const taskStatusSchema = z.enum(["todo", "in_progress", "done"])

export const subTaskSchema = z
  .object({
    id: z.string().catch(""),
    title: z.string().catch(""),
    completed: storedBooleanSchema
  })
  .passthrough()

export const taskSchema = z
  .object({
    id: z.string().catch(""),
    title: z.string().catch(""),
    description: z.string().optional().catch(undefined),
    priority: prioritySchema.catch("p4"),
    dueDate: z.string().optional().catch(undefined),
    projectId: z.string().optional().catch(undefined),
    labels: z.array(z.string()).catch([]),
    completed: storedBooleanSchema,
    status: taskStatusSchema.optional().catch(undefined),
    completedAt: z.string().optional().catch(undefined),
    archivedAt: z.string().optional().catch(undefined),
    createdAt: z.string().optional().catch(undefined),
    updatedAt: z.string().optional().catch(undefined),
    order: z.number().catch(0),
    subTasks: z.array(subTaskSchema).catch([])
  })
  .passthrough()
  .transform<Task>((task) => {
    const updatedAt = task.updatedAt ?? task.createdAt ?? EPOCH_ISO
    const status =
      task.status === "done" || task.completed
        ? "done"
        : task.status === "in_progress"
          ? "in_progress"
          : "todo"
    const completed = status === "done"

    return {
      id: task.id,
      title: task.title,
      description: task.description,
      priority: task.priority,
      dueDate: task.dueDate,
      projectId: task.projectId,
      labels: task.labels,
      completed,
      status,
      completedAt: completed ? (task.completedAt ?? updatedAt) : undefined,
      archivedAt: task.archivedAt,
      createdAt: task.createdAt ?? updatedAt,
      updatedAt,
      order: task.order,
      subTasks: task.subTasks
    }
  })

export const projectSchema = z
  .object({
    id: z.string().catch(""),
    name: z.string().catch(""),
    color: z.string().catch(""),
    emoji: z.string().optional().catch(undefined),
    description: z.string().optional().catch(undefined),
    createdAt: z.string().catch(EPOCH_ISO)
  })
  .passthrough()

export const labelSchema = z
  .object({
    id: z.string().catch(""),
    name: z.string().catch(""),
    color: z.string().catch("")
  })
  .passthrough()

export const sessionSchema = z
  .object({
    id: z.string().catch(""),
    taskId: z.string().catch(""),
    projectId: z.string().catch(""),
    startAt: z.string().catch(EPOCH_ISO),
    endAt: z.string().catch(EPOCH_ISO),
    createdAt: z.string().catch(EPOCH_ISO),
    updatedAt: z.string().catch(EPOCH_ISO)
  })
  .passthrough()

export const timeBlockSchema = z
  .object({
    id: z.string().catch(""),
    label: z.string().catch(""),
    startAt: z.string().catch(EPOCH_ISO),
    endAt: z.string().catch(EPOCH_ISO),
    createdAt: z.string().catch(EPOCH_ISO)
  })
  .passthrough()

export const calendarEventSchema = z
  .object({
    id: z.string().catch(""),
    title: z.string().catch(""),
    description: z.string().optional().catch(undefined),
    location: z.string().optional().catch(undefined),
    color: z.string().optional().catch(undefined),
    startAt: z.string().catch(EPOCH_ISO),
    endAt: z.string().catch(EPOCH_ISO),
    allDay: storedBooleanSchema,
    rrule: z.string().optional().catch(undefined),
    recurrenceId: z.string().optional().catch(undefined),
    googleCalendarId: z.string().optional().catch(undefined),
    googleEventId: z.string().optional().catch(undefined),
    etag: z.string().optional().catch(undefined),
    syncStatus: z
      .enum(["synced", "pending", "local_only"])
      .optional()
      .catch(undefined),
    deletedAt: z.string().optional().catch(undefined),
    createdAt: z.string().catch(EPOCH_ISO),
    updatedAt: z.string().catch(EPOCH_ISO)
  })
  .passthrough()

export const medicationSchema = z
  .object({
    id: z.string().catch(""),
    medId: z.string().catch(""),
    medName: z.string().catch(""),
    dose: z.number().catch(0),
    takenAt: z.string().catch(EPOCH_ISO),
    createdAt: z.string().catch(EPOCH_ISO)
  })
  .passthrough()

export const sharedAppearanceSchema = z
  .object({
    themeId: z.string(),
    customTokens: z.record(z.string(), z.string()).optional().catch({}),
    customTokensByTheme: z
      .record(z.string(), z.record(z.string(), z.string()))
      .optional()
      .catch({})
  })
  .passthrough()
  .transform<AppearanceSettings>((appearance) => ({
    themeId: appearance.themeId,
    customTokens: appearance.customTokens ?? {},
    customTokensByTheme: appearance.customTokensByTheme ?? {}
  }))
