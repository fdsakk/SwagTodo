import type { Task } from "../shared/types"

/** Stored names are `<uuid><ext>` — never a path, never user-controlled. */
const STORED_NAME_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}(\.[A-Za-z0-9]{1,16})?$/

export const isStoredAttachmentName = (name: unknown): name is string =>
  typeof name === "string" && STORED_NAME_RE.test(name)

/** Keeps a short alphanumeric extension so the OS can pick an opener. */
export const storedAttachmentName = (
  id: string,
  originalName: string
): string => {
  const match = /\.([A-Za-z0-9]{1,16})$/.exec(originalName)
  return match ? `${id}.${match[1].toLowerCase()}` : id
}

export const referencedAttachmentNames = (
  tasks: readonly Task[]
): Set<string> => {
  const names = new Set<string>()
  for (const task of tasks) {
    for (const attachment of task.attachments ?? [])
      names.add(attachment.fileName)
  }
  return names
}

/** Files in the attachments folder no task references any more. */
export const orphanedAttachmentNames = (
  files: readonly string[],
  tasks: readonly Task[]
): string[] => {
  const referenced = referencedAttachmentNames(tasks)
  return files.filter(
    (name) => isStoredAttachmentName(name) && !referenced.has(name)
  )
}
