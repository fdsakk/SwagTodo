# Sugestie Poprawy (Improvements & Code Review)

Jako Senior SWE przejrzałem kod projektu. Architektura "local-first" i integracja `better-sqlite3` z Zustandem przez Delta Updates to świetne podejście. Niemniej jednak, w kodzie znajdują się miejsca, gdzie występują tzw. "bad practices", niepotrzebne komplikacje lub przestarzałe metody.

Oto lista sugestii co warto poprawić, napisać inaczej lub uprościć:

## 1. Frontend (React & UI)

### 1.1. Użycie utility `cn()` zamiast manualnej konkatenacji klas

W pliku `src/renderer/src/App.tsx` w wielu miejscach klasy CSS są budowane przy pomocy interpolacji stringów:

```tsx
className={`flex h-full flex-col ... ${isFullScreen ? '' : ' rounded-xl'}`}
```

Projekt posiada w zależnościach `clsx` i `tailwind-merge` oraz eksportuje utility `cn` (`src/renderer/src/utils/cn.ts`). Należy tego używać wszędzie zamiast "gołych" template stringów:

```tsx
className={cn("flex h-full flex-col ...", !isFullScreen && "rounded-xl")}
```

Jest to bezpieczniejsze (zapobiega błędom ze spacjami) i rozwiązuje konflikty klas Tailwinda.

### 1.2. Boilerplate selektorów Zustanda (Over-complication)

W `App.tsx` hooki `useUiStore` oraz `useDomainStore` używają `useShallow` do mapowania kilkunastu właściwości jedna po drugiej.
Wzorzec ten jest poprawny pod kątem optymalizacji renderowania, ale ekstremalnie rozwlekły.
**Sugestia:** Zamiast wyciągać każdą akcję osobno (np. `openCreateProjectPanel`, `closeTaskPanel` itd.), warto w samym store zgrupować akcje w jeden obiekt `actions` (wzorzec ze "slices" Zustanda nie powoduje re-renderów dla referencji do stałych funkcji). Wtedy w komponencie wyciągamy tylko `actions`, a sam stan mapujemy przez `useShallow`, co znacznie odchudzi kod.

### 1.3. C-style pętle `for` zamiast nowoczesnych metod (KanbanBoard.tsx)

W `KanbanBoard.tsx` stosowane są "stare" pętle `for`:

```tsx
for (let i = 0; i < props.tasks.length; i++) {
  const t = props.tasks[i]
  // ...
}
```

Mimo że pętle `for(let i=0;...)` są minimalnie szybsze, w kontekście aplikacji Reactowej operującej na tysiącach (nie milionach) rekordów, zabijają czytelność.
**Sugestia:** Warto używać iteracji `for...of` lub wręcz natywnego `Object.groupBy()` (lub `Map.groupBy()`), które od niedawna jest standardem w JS, aby w 2 linijkach podzielić zadania na statusy `todo`, `in_progress`, `done`.

## 2. Backend & Warstwa Danych (SQLite & Main Process)

### 2.1. "Ręczne" budowanie relacji w JS (sqlite.ts)

W funkcji `deserializeAppState` w `src/main/storage/sqlite.ts` widać, że z bazy wyciągane są płaskie tabele (`tasks`, `task_subtasks`, `task_labels`), a następnie w JavaScripcie używa się mapowań (np. `subTasksByTaskId.get()`), aby odbudować zagnieżdżone obiekty.
**Sugestia:** Korzystając z SQLite, o wiele wydajniej i czytelniej jest użyć funkcji JSON bezpośrednio w zapytaniu SQL, np. `json_group_array()`. Dzięki temu baza danych zwraca od razu w pełni zagnieżdżone obiekty `Task` z tablicą `subTasks` i `labels`, co pozwala całkowicie pozbyć się logiki mapowania po stronie Node.js.

### 2.2. Walidacja schematów

W `persist.ts` (oraz `sqlite.ts`) pojawia się dużo manualnych sprawdzeń typów i walidacji, np.:

```typescript
Array.isArray(data.tasks) ? data.tasks.map((task) => normalizeStoredTask(task)) : []
```

Taki kod szybko się starzeje i ciężko go utrzymać.
**Sugestia:** Warto wprowadzić bibliotekę do walidacji schematów, np. **Zod** lub **Valibot**. Pozwoli to zdefiniować schemat dla `AppState`, co automatycznie odrzuci (lub znormalizuje) uszkodzone dane z `localStorage` / SQLite bez konieczności pisania dziesiątek instrukcji warunkowych.

### 2.3. Ciche połykanie błędów (Error swallowing)

W `parseLegacyElectronStore` i `readLegacyElectronStore` występują bloki:

```typescript
catch {
  return null
}
```

**Sugestia:** Tzw. ciche "połykanie" błędów to bardzo zła praktyka (bad practice). Jeśli parsowanie JSON się sypie, prawdopodobnie wystąpił problem z korupcją danych. Warto przynajmniej zalogować ten błąd (`console.error(e)`) lub wykorzystać systemowy mechanizm logowania, by deweloper/użytkownik miał ślad, dlaczego migracja się nie powiodła.

## 3. Architektura ogólna

### 3.1. Hydracja Zustanda (Manual Hydration)

Obecnie `App.tsx` manualnie śledzi stan `hydrated` wykorzystując własny `useEffect`, ponieważ `skipHydration: true` jest włączone w opcjach middleware'u `persist`.
Chociaż ten wzorzec daje kontrolę nad pokazywaniem ekranu ładowania, Zustand udostępnia wbudowany callback `onRehydrateStorage`, którym można zarządzać statusem hydracji bezpośrednio z poziomu konfiguracji store'a, co mogłoby usunąć logikę hydracji z komponentu `<App />`.
