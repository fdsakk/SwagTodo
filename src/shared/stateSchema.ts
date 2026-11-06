import { z } from "zod"
import { DEFAULT_PREFERENCES } from "./defaults"
import type { AppearanceSettings, AppPreferences, Task } from "./types"

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

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/

export const recurrenceSchema = z.object({
  freq: z.enum(["daily", "weekly", "monthly", "yearly"]),
  interval: z.number().int().min(1).max(365).catch(1),
  weekdays: z.array(z.number().int().min(0).max(6)).optional().catch(undefined),
  fromCompletion: z.boolean().optional().catch(undefined)
})

export const attachmentSchema = z.object({
  id: z.string(),
  name: z.string(),
  fileName: z.string(),
  size: z.number().catch(0),
  addedAt: z.string().catch(EPOCH_ISO)
})

export const taskSchema = z
  .object({
    id: z.string().catch(""),
    title: z.string().catch(""),
    description: z.string().optional().catch(undefined),
    priority: prioritySchema.catch("p4"),
    dueDate: z.string().optional().catch(undefined),
    dueTime: z.string().regex(TIME_RE).optional().catch(undefined),
    recurrence: recurrenceSchema.optional().catch(undefined),
    blockedBy: z.array(z.string()).optional().catch(undefined),
    attachments: z.array(attachmentSchema).optional().catch(undefined),
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
    const extras: Partial<Task> = {}
    if (task.dueDate && task.dueTime) extras.dueTime = task.dueTime
    if (task.recurrence) extras.recurrence = task.recurrence
    if (task.blockedBy?.length) extras.blockedBy = task.blockedBy
    if (task.attachments?.length) extras.attachments = task.attachments

    return {
      ...extras,
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

export const savedViewSchema = z.object({
  id: z.string(),
  name: z.string(),
  query: z.string().catch(""),
  status: z.enum(["all", "active", "done"]).catch("all"),
  projectId: z.string().catch("all"),
  priority: z.string().catch("all")
})

const D = DEFAULT_PREFERENCES
export const preferencesSchema = z
  .object({
    notificationsEnabled: z.boolean().catch(D.notificationsEnabled),
    reminderLeadMinutes: z
      .number()
      .int()
      .min(0)
      .max(24 * 60)
      .catch(D.reminderLeadMinutes),
    closeToTray: z.boolean().catch(D.closeToTray),
    autoBackup: z.boolean().catch(D.autoBackup),
    backupKeep: z.number().int().min(1).max(100).catch(D.backupKeep),
    quickAddShortcut: z.string().max(64).catch(D.quickAddShortcut),
    pomodoroWorkMinutes: z
      .number()
      .int()
      .min(1)
      .max(180)
      .catch(D.pomodoroWorkMinutes),
    pomodoroBreakMinutes: z
      .number()
      .int()
      .min(1)
      .max(60)
      .catch(D.pomodoroBreakMinutes),
    savedViews: z.array(savedViewSchema).catch([])
  })
  .partial()
  .transform<AppPreferences>((value) => ({ ...D, ...stripUndefined(value) }))

function stripUndefined<T extends object>(value: T): Partial<T> {
  const out: Partial<T> = {}
  for (const [key, v] of Object.entries(value)) {
    if (v !== undefined) (out as Record<string, unknown>)[key] = v
  }
  return out
}

export const normalizePreferences = (raw: unknown): AppPreferences => {
  const parsed = preferencesSchema.safeParse(raw ?? {})
  return parsed.success ? parsed.data : { ...D }
}
