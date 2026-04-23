Cześć! Witaj w projekcie **Swag Todo**. Przygotowałem dla Ciebie kompleksowe wprowadzenie, które pomoże Ci zrozumieć strukturę, przepływ danych i specyficzne zasady panujące w tym repozytorium.

### Czym jest ten projekt?

**Swag Todo** to aplikacja desktopowa w architekturze "local-first" służąca do zarządzania zadaniami, projektami, etykietami, sesjami i monitorowania zdrowia (w tym tzw. Health PK, czyli prostą farmakokinetyką). Nie ma tutaj chmury, telemetrii ani zewnętrznych baz danych. Całość działa lokalnie i jest zamknięta w ekosystemie Electrona.

### Główne Technologie

- **Środowisko i paczki:** `Bun` – **bardzo ważne:** w tym projekcie używamy wyłącznie Buna (`bun install`, `bun run <script>`, `bun add`). Używanie `npm`, `yarn` czy `pnpm` jest surowo wzbronione.
- **Frontend (Renderer):** React 18, Zustand (do zarządzania stanem), Tailwind CSS + Radix UI (do komponentów i interfejsu).
- **Backend (Main):** Electron (Node.js) + `better-sqlite3` (lokalna, szybka baza danych).
- **Inne:** TypeScript na obu końcach, Vite jako bundler (poprzez `electron-vite`).

---

### Architektura projektu

Projekt ma klasyczny podział dla nowoczesnych aplikacji w Electronie, a kluczowe foldery to:

1. **`src/main/`**: Logika systemowa i backendowa. Znajdziesz tu tworzenie okien, natywne dialogi i to, co najważniejsze: warstwę zapisu do bazy danych SQLite (`storage/sqlite.ts`).
2. **`src/preload/`**: "Most" między Node.js a przeglądarką. Znajduje się tam plik `index.ts`, który wystawia `window.api` (tylko i wyłącznie za pomocą `contextBridge`). Z poziomu Renderera nie masz dostępu do systemowych modułów typu `fs` czy `path`!
3. **`src/renderer/`**: Czysty frontend (React).
   - `pages/` - główne ekrany widoków zdefiniowane w routerze.
   - `components/` - tu obowiązuje ścisła zasada domenowa (np. `kanban`, `task-list`, `modals`). Nie ma "luźnych plików" bezpośrednio w folderze `components/`. Każdy komponent ma podfolder i re-eksportowany jest w `index.tsx` (barrel file). Co więcej, nowo tworzone komponenty używają **tylko** `named exports` (bez `export default`, chyba że jest to starszy komponent UI od Radixa).
4. **`src/shared/`**: Współdzielone typy TS, interfejsy i domyślne stałe (`defaults.ts`), z których korzysta zarówno Main, jak i Renderer.

---

### Architektura i Przepływ Danych (Data Flow)

Przepływ danych to zoptymalizowane podejście oparte na in-memory storage ze "sprytnym" synchronizowaniem do SQLite'a.

1. **Źródło prawdy (Source of Truth):** Na frontendzie sercem logiki jest **Zustand**. Aplikacja przechowuje w nim live-state całej bazy (zadania, projekty, sesje).
2. **Odczyt inicjalny:** Podczas startu aplikacji, Middleware z Zustanda wywołuje `window.api.storage.loadState()`. Main process czyta stan z lokalnej bazy SQLite i przesyła go do Renderera. Frontend parsuje i normalizuje te dane, ładując je do drzewa stanu.
3. **Zapis i Persystencja Delta (Zapis Cząstkowy):**
   - Kiedy dokonujesz modyfikacji (np. zmiana nazwy zadania), akcja Zustanda od razu uaktualnia stan UI (aplikacja działa natychmiastowo).
   - Mechanizm persystencji (middleware `persistedStorage` w `persist.ts`) wyłapuje te zmiany, analizuje "diff" (które dokładnie fragmenty się zmieniły) i robi tzw. **Delta Update**.
   - Przez kanał IPC wysyłany jest patch wykorzystując `window.api.storage.savePartial(patch)`.
   - Główny proces (`sqlite.ts`) przyjmuje patcha (częściowy update), identyfikuje zmienione ID np. zadań, dokonuje stringifikacji JSON (diff log) i aplikuje tylko to co się zmieniło (`INSERT OR REPLACE` dla zmienionych zadań). Taki mechanizm znacząco oszczędza dysk i RAM w odróżnieniu od robienia za każdym razem pełnego zrzutu danych.

---

### Specyficzne rozwiązania, na które musisz uważać (Key Learnings & Do-Not-Repeat)

W projekcie spotkasz kilka nietypowych konwencji i mechanizmów wypracowanych podczas wcześniejszego developmentu, które są opisane w notatkach z `Cerebrum.md` i `AGENTS.md`.

1. **Mechanizmy zapobiegające Crashom UI (Global Error Boundary):**
   - Aby uchronić użytkownika przed nagłym zamknięciem ("białym ekranem"), całe drzewo Reacta jest opakowane w layout-level `GlobalErrorBoundary`.
   - Main process ma zdefiniowane łapanie nieobsłużonych błędów, które nie wyłączają całej aplikacji, a wyświetlają natywny błąd w `dialog.showErrorBox`. Należy uważać przy łapaniu `window.error`, by zignorować w rendererze np. ewentualny błąd ładowania ikon czy zasobów.
2. **Kanban & Drag-and-Drop:**
   - W przypadku przesunięć kart zadań na tablicy w Kanbanie, stan kolumny docelowej (draft) należy uaktualniać podczas zdarzenia `onDragOver`, a nie dopiero na `onDragEnd` – w przeciwnym razie indeksy zadań się psują.
3. **Health PK (Farmakokinetyka):**
   - Projekt ma specyficzną analizę dla wykresów zdrowia (leków/dawek). Zwróć uwagę na asymetryczne wygładzanie (`smoothSummedEffect`), które służy zapobieganiu ostrych, nieprawdziwych "pików", analizując szybki wzrost, ale wolniejszy spadek.
4. **Agenty AI (Ekosystem OpenWolf):**
   - W projekcie znajduje się ukryty katalog `.wolf`. Narzuca on zestaw reguł do utrzymania higieny kodu przez automatycznych agentów i AI devów (takich jak ja). Przykładowo, jeśli dodajesz, zmieniasz, modyfikujesz ścieżkę do plików – należy odpowiednio zmodyfikować pliki `memory.md` i zaktualizować spis z inwentaryzacją w `anatomy.md`.

### Złote Zasady (TL;DR)

1. **Zawsze `bun`, nigdy `npm/yarn/pnpm`.**
2. Preferuj skrypty projektowe: `bun run format`, `bun run lint`, `bun run build`.
3. Komunikacja tylko przez `window.api`. Zakaz importowania modułów systemowych do Renderera.
4. UI i state update musi być szybki - używaj Zustanda na froncie i `window.api.storage.savePartial` w tle. Żadnego odpytywania bazy o całą paczkę danych po dokonaniu mikroskopijnej zmiany na froncie.
5. Szanuj strukturę komponentów UI (w podfolderach) i używaj `named exports`.
