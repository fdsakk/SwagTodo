import { useMemo, useState } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { useDomainStore } from '@renderer/store'
import { EffectChart } from './health/EffectChart'
import { MedLogList } from './health/MedLogList'
import { PkParams } from './health/PkParams'
import { QuickAddButtons } from './health/QuickAddButtons'
import { today } from './health/utils'

export function HealthPage(): React.JSX.Element {
  const {
    medications,
    pkSettings,
    addMedicationLog,
    updateMedicationLog,
    deleteMedicationLog,
    updateChartSettings
  } = useDomainStore(
    useShallow((s) => ({
      medications: s.medications,
      pkSettings: s.pkSettings,
      addMedicationLog: s.addMedicationLog,
      updateMedicationLog: s.updateMedicationLog,
      deleteMedicationLog: s.deleteMedicationLog,
      updateChartSettings: s.updateChartSettings
    }))
  )

  const [selectedDate, setSelectedDate] = useState(today)

  const todayLogs = useMemo(
    () => medications.filter((m) => m.takenAt.slice(0, 10) === selectedDate),
    [medications, selectedDate]
  )

  const handleAdd = (medId: string, medName: string, dose: number): void => {
    const now = new Date()
    now.setSeconds(0, 0)
    addMedicationLog({ medId, medName, dose, takenAt: now.toISOString() })
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto px-6 py-6 overflow-hidden max-w-5xl">
      <div className="flex items-center gap-3">
        <h1 className="text-base font-semibold text-app-text">Medications</h1>
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="rounded-md border border-app-border bg-app-card px-2 py-1 text-xs text-app-text focus:outline-none"
        />
      </div>

      <section className="max-w-3xl space-y-6">
        <QuickAddButtons onAdd={handleAdd} />
        <MedLogList
          logs={todayLogs}
          selectedDate={selectedDate}
          onUpdateTime={updateMedicationLog}
          onDelete={deleteMedicationLog}
        />
      </section>

      <div className="rounded-xl border border-app-border bg-app-card p-4 [&_*]:outline-none">
        <EffectChart logs={todayLogs} selectedDate={selectedDate} pkSettings={pkSettings} />
        <PkParams pkSettings={pkSettings} onChange={updateChartSettings} />
      </div>
    </div>
  )
}
