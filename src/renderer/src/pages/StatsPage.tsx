import { useDomainStore } from "@renderer/store"
import { formatDuration } from "@renderer/utils/sessions"
import {
  completionsPerDay,
  summarizeTasks,
  timePerProject
} from "@renderer/utils/stats"
import { useMemo } from "react"
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts"
import { useShallow } from "zustand/react/shallow"

const RANGE_DAYS = 30

function StatCard({
  label,
  value,
  hint
}: {
  label: string
  value: string | number
  hint?: string
}): React.JSX.Element {
  return (
    <div className="rounded-lg border border-app-border/64 bg-app-card px-4 py-3">
      <p className="text-xs text-app-text-muted">{label}</p>
      <p className="mt-1 text-2xl font-semibold tabular-nums text-app-text">
        {value}
      </p>
      {hint && <p className="mt-0.5 text-xs text-app-text-muted">{hint}</p>}
    </div>
  )
}

const tooltipStyle = {
  background: "var(--app-card)",
  border: "1px solid var(--app-border)",
  borderRadius: 8,
  fontSize: 12,
  color: "var(--app-text)"
}

export default function StatsPage(): React.JSX.Element {
  const { tasks, sessions, projects } = useDomainStore(
    useShallow((state) => ({
      tasks: state.tasks,
      sessions: state.sessions,
      projects: state.projects
    }))
  )

  const summary = useMemo(
    () => summarizeTasks(tasks, sessions),
    [tasks, sessions]
  )
  const perDay = useMemo(() => completionsPerDay(tasks, RANGE_DAYS), [tasks])
  const perProject = useMemo(
    () => timePerProject(sessions, projects, RANGE_DAYS),
    [sessions, projects]
  )

  return (
    <div className="mx-auto max-w-5xl px-6 pb-8 pt-5">
      <h1 className="mb-6 text-lg font-semibold tracking-tight text-app-text">
        Statistics
      </h1>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="Completed today" value={summary.completedToday} />
        <StatCard
          hint="last 7 days"
          label="Completed"
          value={summary.completedThisWeek}
        />
        <StatCard
          hint={summary.streak === 1 ? "day" : "days"}
          label="Streak"
          value={summary.streak}
        />
        <StatCard
          hint={`${summary.overdue} overdue`}
          label="Active tasks"
          value={summary.active}
        />
      </div>

      <section className="mt-8">
        <h2 className="mb-3 text-sm font-medium text-app-text-secondary">
          Completed per day · last {RANGE_DAYS} days
        </h2>
        <div className="rounded-lg border border-app-border/64 bg-app-card p-3">
          <ResponsiveContainer height={220} width="100%">
            <BarChart data={perDay}>
              <CartesianGrid
                stroke="var(--app-chart-grid)"
                strokeDasharray="3 3"
                vertical={false}
              />
              <XAxis
                dataKey="label"
                fontSize={11}
                interval="preserveStartEnd"
                stroke="var(--app-chart-muted)"
                tickLine={false}
              />
              <YAxis
                allowDecimals={false}
                fontSize={11}
                stroke="var(--app-chart-muted)"
                tickLine={false}
                width={28}
              />
              <Tooltip
                contentStyle={tooltipStyle}
                cursor={{ fill: "var(--app-hover)" }}
              />
              <Bar
                dataKey="count"
                fill="var(--app-accent)"
                name="Completed"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="mt-8">
        <h2 className="mb-3 text-sm font-medium text-app-text-secondary">
          Tracked time per project · last {RANGE_DAYS} days ·{" "}
          {formatDuration(summary.trackedMinutes * 60_000)}
        </h2>
        {perProject.length === 0 ? (
          <p className="text-sm text-app-text-muted">
            No sessions yet. Start a timer from a task's context menu.
          </p>
        ) : (
          <div className="rounded-lg border border-app-border/64 bg-app-card p-3">
            <ResponsiveContainer
              height={Math.max(120, perProject.length * 36)}
              width="100%"
            >
              <BarChart data={perProject} layout="vertical">
                <XAxis hide type="number" />
                <YAxis
                  dataKey="name"
                  fontSize={12}
                  stroke="var(--app-chart-muted)"
                  tickLine={false}
                  type="category"
                  width={140}
                />
                <Tooltip
                  contentStyle={tooltipStyle}
                  cursor={{ fill: "var(--app-hover)" }}
                  formatter={(value) => [
                    formatDuration(Number(value) * 60_000),
                    "Time"
                  ]}
                />
                <Bar dataKey="minutes" radius={[0, 4, 4, 0]}>
                  {perProject.map((row) => (
                    <Cell fill={row.color} key={row.projectId} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </section>
    </div>
  )
}
