import { runDataAction } from "@renderer/components/command-palette"
import { Button } from "@renderer/components/ui/button"
import { Switch } from "@renderer/components/ui/switch"
import type { AppPreferences } from "@renderer/types"
import { Download, FolderOpen, HardDriveDownload, Upload } from "lucide-react"

interface DataSectionProps {
  preferences: AppPreferences
  onUpdate: (patch: Partial<AppPreferences>) => void
}

export function DataSection({
  preferences,
  onUpdate
}: DataSectionProps): React.JSX.Element {
  const available = Boolean(window.api?.backup)

  return (
    <section className="space-y-3">
      <div>
        <h2 className="text-sm font-semibold text-app-text">Data</h2>
        <p className="mt-0.5 text-xs text-app-text-muted">
          Everything stays on this computer. Back up, export or restore.
        </p>
      </div>

      <div className="flex items-center justify-between gap-6 rounded-lg border border-app-border/64 bg-app-card px-4 py-2.5">
        <div>
          <p className="text-sm text-app-text">Daily automatic backup</p>
          <p className="text-xs text-app-text-muted">
            Keeps the newest {preferences.backupKeep} copies of the database
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select
            aria-label="Backups to keep"
            className="h-7 rounded-md border border-app-border bg-app-card px-2 text-xs text-app-text"
            onChange={(event) =>
              onUpdate({ backupKeep: Number(event.target.value) })
            }
            value={preferences.backupKeep}
          >
            {[3, 7, 14, 30].map((n) => (
              <option key={n} value={n}>
                keep {n}
              </option>
            ))}
          </select>
          <Switch
            checked={preferences.autoBackup}
            onCheckedChange={(autoBackup) => onUpdate({ autoBackup })}
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          disabled={!available}
          onClick={() => void runDataAction("backup")}
          size="sm"
          variant="outline"
        >
          <HardDriveDownload size={14} />
          Back up now
        </Button>
        <Button
          disabled={!available}
          onClick={() => void window.api?.backup.openFolder()}
          size="sm"
          variant="outline"
        >
          <FolderOpen size={14} />
          Open backups folder
        </Button>
        <Button
          disabled={!available}
          onClick={() => void runDataAction("exportJson")}
          size="sm"
          variant="outline"
        >
          <Download size={14} />
          Export JSON
        </Button>
        <Button
          disabled={!available}
          onClick={() => void runDataAction("exportCsv")}
          size="sm"
          variant="outline"
        >
          <Download size={14} />
          Export tasks CSV
        </Button>
        <Button
          disabled={!available}
          onClick={() => {
            if (
              window.confirm(
                "Importing replaces all current data. A backup is created first. Continue?"
              )
            )
              void runDataAction("import")
          }}
          size="sm"
          variant="outline"
        >
          <Upload size={14} />
          Import / restore…
        </Button>
      </div>
    </section>
  )
}
