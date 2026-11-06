import { Textarea } from "@renderer/components/ui/textarea"
import { cn } from "@renderer/utils/cn"
import { useState } from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"

interface MarkdownNoteProps {
  value: string
  onChange: (event: React.ChangeEvent<HTMLTextAreaElement>) => void
  onBlur?: () => void
  className?: string
}

const tabClass = (active: boolean): string =>
  cn(
    "rounded px-2 py-0.5 text-xs transition-colors",
    active
      ? "bg-app-active text-app-text"
      : "text-app-text-muted hover:text-app-text-secondary"
  )

/** Description editor with a Markdown preview (GFM, no raw HTML). */
export function MarkdownNote({
  value,
  onChange,
  onBlur,
  className
}: MarkdownNoteProps): React.JSX.Element {
  const [mode, setMode] = useState<"write" | "preview">(() =>
    value.trim() ? "preview" : "write"
  )

  return (
    <div className={cn("flex min-h-0 flex-1 flex-col gap-1.5", className)}>
      <div className="flex items-center gap-1">
        <button
          className={tabClass(mode === "write")}
          onClick={() => setMode("write")}
          type="button"
        >
          Write
        </button>
        <button
          className={tabClass(mode === "preview")}
          onClick={() => {
            onBlur?.()
            setMode("preview")
          }}
          type="button"
        >
          Preview
        </button>
        <span className="ml-auto text-[10px] text-app-text-muted">
          Markdown supported
        </span>
      </div>
      {mode === "write" ? (
        <Textarea
          autoFocus={Boolean(value)}
          className="min-h-[10.25rem] flex-1 resize-none font-mono text-[13px]"
          onBlur={onBlur}
          onChange={onChange}
          placeholder="Add notes… (**bold**, - lists, [ ] checklists, `code`, [links](https://…))"
          value={value}
        />
      ) : (
        <div
          className="markdown-body min-h-[10.25rem] flex-1 cursor-text overflow-y-auto rounded-lg border border-app-border/64 px-3 py-2 text-sm text-app-text"
          onDoubleClick={() => setMode("write")}
          title="Double-click to edit"
        >
          {value.trim() ? (
            <ReactMarkdown
              components={{
                a: ({ href, children }) => (
                  <a href={href} rel="noreferrer" target="_blank">
                    {children}
                  </a>
                )
              }}
              remarkPlugins={[remarkGfm]}
            >
              {value}
            </ReactMarkdown>
          ) : (
            <p className="text-app-text-muted">No notes yet.</p>
          )}
        </div>
      )}
    </div>
  )
}
