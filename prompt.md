# Prompt For Next Agent

Pracujesz w repo `SwagTodo` i masz dokończyć najważniejszą poprawkę po migracji persistence z `electron-store` do SQLite.

Najpierw przeczytaj:

- `AGENTS.md`
- `.wolf/OPENWOLF.md`
- `.wolf/anatomy.md`
- `.wolf/cerebrum.md`

## Kontekst

Stan obecny:

- persistence działa w main process przez `better-sqlite3`
- storage jest w `src/main/storage/appState.ts` i `src/main/storage/sqlite.ts`
- renderer zapisuje zmiany przez `window.api.storage.savePartial(...)`
- istnieje już:
  - normalizacja stanu
  - cache w pamięci procesu main
  - migracja legacy `electron-store` (`todoist-clone.json`) -> `swag-todo.db`

Największy obecny problem:

- `src/main/storage/sqlite.ts` nadal zapisuje cały snapshot przy każdym `saveState()` / `savePartial()`
- implementacja robi `DELETE` wszystkich tabel i potem `INSERT` całego stanu od nowa
- to jest główne wąskie gardło wydajnościowe i architektoniczne tej migracji

## Główny cel

Zamień pełny snapshot rewrite na zapisy delta.

Chcę, żeby storage:

- porównywał poprzedni znormalizowany stan z nowym
- robił `INSERT OR REPLACE` / `UPSERT` tylko dla rekordów dodanych lub zmienionych
- robił `DELETE` tylko dla rekordów usuniętych
- aktualizował `settings` osobno per key
- zachował poprawną kolejność dla kolekcji, które używają `position`
- nie łamał obecnej semantyki `normalizeAppState`, `mergeAppState`, `saveState`, `savePartial`

## Najważniejsze pliki

- `src/main/storage/sqlite.ts`
- `src/main/storage/appState.ts`
- `src/main/index.ts`
- `src/main/tests/sqlite.test.ts`

Możliwe, że trzeba dodać nowe testy albo wydzielić helper do diffów.

## Wymagania implementacyjne

- Nie cofaj istniejących zmian użytkownika.
- Używaj Bun (`bun run ...`), nie `npm`.
- Edytuj pliki przez `apply_patch`.
- Nie testuj bezpośrednio natywnego `better-sqlite3` w plain Node runtime, jeśli znowu pojawi się problem ABI; testy mogą dalej skupiać się na warstwie serializacji/diffów.
- Zachowaj migrację legacy store.
- Zachowaj cache w pamięci procesu main.
- Nie wprowadzaj zmian w rendererze, jeśli nie są konieczne.

## Dodatkowe rzeczy do poprawy, jeśli mieszczą się w scope

1. Przygotuj statementy SQL raz w konstruktorze i używaj ich wielokrotnie dla delta writes.
2. Dodaj testy dla przypadków:
   - update pojedynczego taska bez przepisywania reszty
   - usunięcie taska z cleanupem `task_subtasks` i `task_labels`
   - zmiana kolejności elementów (`position`)
   - update tylko `settings.uiScale` lub `appearance`
3. Sprawdź, czy warto dodać indeksy dla najczęstszych lookupów / kasowań:
   - `task_subtasks(task_id, position)`
   - `task_labels(task_id, position)`
   - ewentualnie tabel zależnych od `position`
4. Jeśli obecny schema utrudnia delta writes, możesz go delikatnie poprawić, ale bez psucia istniejącej migracji danych.
5. Ogranicz niepotrzebne `normalizeAppState(...)` tam, gdzie stan jest już gwarantowanie znormalizowany.

## Kryteria akceptacji

- storage nie robi już pełnego `DELETE + INSERT` całego app state przy każdym zapisie
- partial save aktualizuje tylko zmienione rekordy
- kolejność danych pozostaje poprawna po odczycie
- legacy migration nadal działa
- `bun run test` przechodzi
- `bun run build` przechodzi
- `bun run lint` przechodzi

## Oczekiwany rezultat

Po zakończeniu napisz krótko:

- co zostało zmienione
- jakie były trade-offy
- czy zostały jakieś miejsca, które nadal są snapshotowe i dlaczego
- jakie testy uruchomiłeś
