# Plan: Medication Tracking (Health/Meds)

## Background & Motivation
The user wants to track the intake and duration of effect for various ADHD medications (Medikinet IR, Medikinet CR, Concerta, Dexamphetamine, Elvanse). The goal is to provide a dedicated "Health / Meds" page accessible from the sidebar where they can log doses and view an interactive graph showing the estimated concentration/effect curve over time.

## Scope & Impact
- **Dependencies:** Addition of the `recharts` charting library and `lucide-react` (already present) for icons.
- **State Management:** Expanding the Zustand store (`useAppStore.ts`) to persist medication logs.
- **Routing/Navigation:** Adding a new `health` view to the app router (`App.tsx`) and a navigation link in the `Sidebar.tsx`.
- **New Components:** Creating a `HealthPage.tsx` which contains a `recharts` graph and an intake form.
- **Logic:** Implementing approximate pharmacokinetic (PK) curve calculations for different medication types (IR vs CR/XR release profiles).

## Proposed Solution

1. **State and Types**
   - Add a `MedicationLog` type in `types/index.ts`: `{ id: string; medId: string; medName: string; dose: number; takenAt: string; createdAt: string; }`.
   - Add `medications` array in `AppState` along with related actions in `AppStore` interface: `addMedicationLog(log)`, `deleteMedicationLog(id)`.
   - Add `health` to `ViewName` in `types/index.ts`.
   - Update `useAppStore.ts` to manage the new state and add `health` view selection (`selectHealth`). Ensure `medications` are persisted in `stateFromPersisted` and `unsubscribePersist`.

2. **Pharmacokinetic Modeling (`utils/pharmacokinetics.ts`)**
   - Implement basic concentration curve calculations for common ADHD medications:
     - **Medikinet IR / Dexamp:** Peak at ~1.5-2h, rapid decline, duration 4-6h.
     - **Medikinet CR:** Biphasic release, two peaks (approx 2h and 6h), duration 8h.
     - **Concerta:** Ascending curve, peak at 6-8h, duration 10-12h.
     - **Elvanse (Vyvanse):** Smooth curve, peak at 3.5-4h, duration 12-14h.
   - Provide a function `generateDailyChartData(logs, date)` that returns an array of points (e.g., every 30 minutes from 00:00 to 24:00) with calculated concentrations to feed into the chart.

3. **User Interface (`HealthPage.tsx`)**
   - Use `recharts` (`<AreaChart>`) to render the concentration curve for the selected day.
   - Form with quick-add buttons for the different medications and doses (e.g., "Medikinet 10mg IR", "Concerta 36mg", "Elvanse 30mg").
   - List view showing the medications taken today with a delete button for corrections.

4. **Integration**
   - Add `<HealthPage />` component mapping in `App.tsx` when `selectedView === 'health'`.
   - Add a "Health" navigation button in `Sidebar.tsx` using an appropriate icon (e.g., `HeartPulse` or `Pill` from `lucide-react`).

---

## Agent Prompt

If you are an AI assistant or agent implementing this plan, please execute the following steps exactly as described:

1. **Install Dependencies:** Run `npm install recharts` in the project root to install the charting library.
2. **Update Types:** In `src/renderer/src/types/index.ts`:
   - Add the `MedicationLog` interface.
   - Update `AppState` to include `medications: MedicationLog[]`.
   - Update `ViewName` union type to include `'health'`.
3. **Update Store:** In `src/renderer/src/store/useAppStore.ts`:
   - Add `medications: []` to the initial state.
   - Add `selectHealth: () => set({ selectedView: 'health', selectedProjectId: undefined })`.
   - Implement `addMedicationLog(input)` and `deleteMedicationLog(id)` actions.
   - Include `medications` in `stateFromPersisted` and in the dependency array for `unsubscribePersist` to ensure local storage saving.
4. **Create Logic:** Create a new file `src/renderer/src/utils/pharmacokinetics.ts`.
   - Define the PK profiles for Medikinet IR/CR, Concerta, Dexamp, Elvanse.
   - Implement a function that calculates the overlapping concentration curve for an array of `MedicationLog`s over a 24h period.
5. **Create UI:** Create a new page component `src/renderer/src/pages/HealthPage.tsx`.
   - Read `medications` from the store.
   - Use `recharts` `<ResponsiveContainer>`, `<AreaChart>`, `<XAxis>`, `<YAxis>`, `<Tooltip>`, and `<Area>` to plot the data from `pharmacokinetics.ts`.
   - Create a grid of quick-add buttons to call `addMedicationLog` with specific presets.
   - Render a list of today's taken medications with a delete icon button.
6. **Integrate:**
   - In `src/renderer/src/components/layout/Sidebar.tsx`, add a navigation item for the Health page (e.g., "Meds / Health").
   - In `src/renderer/src/App.tsx`, import `HealthPage` and add it to the conditional render block: `{selectedView === 'health' && <HealthPage />}`.

Make sure to format the chart nicely with the existing Tailwind colors (e.g., using `text-zinc-500` or `app-text-secondary`) so it fits seamlessly into the current dark theme workspace.