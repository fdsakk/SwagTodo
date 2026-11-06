import { Button } from "@renderer/components/ui/button"
import { toastManager } from "@renderer/components/ui/toast-manager"
import type { TaskAttachment } from "@renderer/types"
import { FileIcon, Paperclip, Plus, X } from "lucide-react"

interface AttachmentListProps {
  attachments: readonly TaskAttachment[]
  onAdd: (attachments: TaskAttachment[]) => void
  onRemove: (attachmentId: string) => void
}

const formatSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

export function AttachmentList({
  attachments,
  onAdd,
  onRemove
}: AttachmentListProps): React.JSX.Element {
  const api = window.api?.attachments

  const handleAdd = async (): Promise<void> => {
    if (!api) return
    try {
      onAdd(await api.add())
    } catch (error) {
      toastManager.add({
        title: "Could not attach file",
        description: error instanceof Error ? error.message : String(error),
        type: "error"
      })
    }
  }

  const handleOpen = async (attachment: TaskAttachment): Promise<void> => {
    try {
      await api?.open(attachment.fileName)
    } catch (error) {
      toastManager.add({
        title: `Could not open ${attachment.name}`,
        description: error instanceof Error ? error.message : String(error),
        type: "error"
      })
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <p className="flex items-center gap-1.5 text-xs font-medium text-app-text-muted">
          <Paperclip size={12} />
          Attachments
        </p>
        <Button
          className="h-6 px-1.5 text-xs"
          disabled={!api}
          onClick={() => void handleAdd()}
          size="sm"
          type="button"
          variant="ghost"
        >
          <Plus size={12} />
          Add
        </Button>
      </div>
      {attachments.length > 0 && (
        <ul className="flex flex-wrap gap-2">
          {attachments.map((attachment) => (
            <li
              className="group flex max-w-60 items-center gap-1.5 rounded-md border border-app-border/64 bg-app-card px-2 py-1 text-xs"
              key={attachment.id}
            >
              <FileIcon className="shrink-0 text-app-text-muted" size={12} />
              <button
                className="min-w-0 truncate text-app-text hover:underline"
                onClick={() => void handleOpen(attachment)}
                title={`${attachment.name} · ${formatSize(attachment.size)}`}
                type="button"
              >
                {attachment.name}
              </button>
              <button
                aria-label={`Remove ${attachment.name}`}
                className="text-app-text-muted opacity-0 hover:text-app-text group-hover:opacity-100"
                onClick={() => onRemove(attachment.id)}
                type="button"
              >
                <X size={11} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
