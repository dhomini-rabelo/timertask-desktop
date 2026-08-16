## Mapa de arquivos

- `src/pages/index/components/IndexTasks/IndexTasks.tsx:19-28` | header row to restructure (flex-col -> flex-row justify-between) to fit new button | anchor 19-28
- `src/pages/index/states/reports/index.ts:1-72` | frozen shape `ReportsState`/`DailyReportEntry`/`DailyReportTask` + `useReportsState` | READ-ONLY, no edits
- `src/pages/index/states/reports/utils.ts:114-125` | `getEntriesInWindow(entriesByDate, today, days)` sorted most-recent-first | read-side selector to use as-is
- `src/pages/index/states/reports/utils.ts:6-8` | `getDayKey(date)` -> "yyyy-MM-dd" local | use for Today's key
- `src/layout/components/atoms/Dialog/root.tsx:1-20` | `DialogRoot({isOpen?, onOpenChange?})` wraps Radix, controlled when both passed | mold for controlled usage
- `src/layout/components/atoms/Dialog/content.tsx:13-54` | `DialogContent({title, description, className})`, default `w-[420px] max-w-[90vw]`, close button built-in | override className for width + scroll
- `src/layout/components/atoms/Dialog/trigger.tsx:1-11`, `footer.tsx:1-14` | `Dialog.Trigger` (asChild), `Dialog.Footer` (border-t + pt-4) | use directly
- `src/layout/components/atoms/Dialog/index.tsx` | barrel exporting `Dialog.Root/Trigger/Content/Footer` | import path `../../../../../layout/components/atoms/Dialog` (adjust depth for new folder)
- `src/layout/components/atoms/Button/index.tsx:1-37` | `Button` atom, default `px-16 py-4` (huge) + 3 variants | must override className if reused; header button will NOT use this atom (mirrors `IndexDarkModeToggle` raw `<button>` instead)
- `src/pages/index/components/IndexHeader/components/IndexDarkModeToggle.tsx:8-20` | raw `<button>` neutral style: border-Black-100/bg-White/text-Black-500 + dark: variants, `p-2` icon-only | mold for new button visual language; needs `+ label` variant (icon + text, so `px-3 py-2 gap-2` style, not bare `p-2`)
- `src/pages/index/components/IndexHeader/components/IndexWorkflowDialog/IndexWorkflowDialog.tsx:1-27` | uncontrolled `Dialog.Root` (no isOpen/onOpenChange passed) wrapping trigger button + `Dialog.Content` + `Dialog.Footer` | mold for folder shape: `ComponentName/ComponentName.tsx` + sibling files in same folder (here: `IndexWorkflowFooter.tsx`, `IndexWorkflowList.tsx`)
- `src/pages/index/components/IndexTasks/IndexActiveTasksList/IndexTaskNoteDialog.tsx:24-53,75-117` | CONTROLLED dialog via local `useState<{isOpen}>` + `handleOpenChange`, wide content (`w-[550px] max-h-[80vh] overflow-auto`), inner scroll region `max-h-[60vh] overflow-auto` | mold for controlled state + internal scroll pattern
- `src/pages/index/components/IndexTasks/IndexFooter/IndexCompletedTaskItem.tsx:46-96` | visual style ONLY (badge pill, Start/End/Duration line) — do NOT import, it needs `Task`/`timeEvents` the report doesn't have | mirror classes: badge `px-2 py-0.5 rounded-full bg-Black-100/50 text-Black-450 dark:bg-Black-600 dark:text-Black-400`, row card `p-4 rounded-xl bg-white border border-Black-100/30 dark:bg-Black-700 dark:border-Black-600`
- `src/pages/index/components/IndexScore.tsx:12-23` | local `formatDuration(seconds)` -> "Xh Ym"/"Xh"/"Ym", NOT exported | must re-implement locally in the new dialog (no shared util to import) or duplicate the function in a new local helper — confirm no export exists (checked: no `export` keyword on it)
- `src/code/utils/date.ts:3-11` | `formatTime(seconds)` -> "HH:MM:SS" or "MM:SS" (exported, already used elsewhere) | use for per-task duration if HH:MM:SS style is wanted, OR use IndexScore's Xh/Ym style — planner must pick one (spec says "duration", both mold options exist, `formatTime` is the exported/importable one)
- `src/pages/index/components/IndexTasks.tsx` header text style `text-2xl font-bold ... flex items-center gap-1.5` (h2) and `text-Black-300 dark:text-Black-400 text-sm` (p), and empty-state `text-base text-Black-400` (lines 38, 31-38) | reuse tone for dialog empty-state text
- `src/pages/index/hooks/useReportsSync.ts:1-60` | writes today's entry via `upsertDailyEntry`, keyed by `getDayKey(now)` | confirms today's entry is always the freshest, dialog just reads store, no new sync needed
- `src/layout/components/atoms/Box/index.tsx:9-21` | `Box` card wrapper, no `relative` positioning by default | header row must use flex justify-between, not absolute top-right positioning

## Molde a espelhar

Primary: `IndexWorkflowDialog/IndexWorkflowDialog.tsx` (dialog+trigger button in header, split into `IndexReportsDialog.tsx` + child list/footer files in own folder) combined with `IndexTaskNoteDialog.tsx` (controlled `isOpen` state pattern + wide scrollable content). No existing Tabs atom anywhere in the repo (`grep -rin "tab" --include=*.tsx` only matched unrelated "table"/debug-timer identifiers) — the Today/Week tab switcher has **no mold**, must be built as two plain buttons toggling local state (`activeTab: "today" | "week"`), styled like a segmented control (border container, active = filled, inactive = ghost) — this is the one place with no direct precedent, but it is a trivial two-button toggle, not new logic.

## Footprint

- `src/pages/index/page.tsx:72` | renders `<IndexTasks />` inside `<div className="w-full max-w-2xl flex-1">` — no prop passing, so the new dialog is fully self-contained inside `IndexTasks.tsx`, no signature change needed upstream.
- `src/pages/index/components/IndexTasks/IndexTasks.tsx:11-16` | already calls `useStoredReports()` and `useReportsSync()` on mount (order load-bearing per comment on line 14) — the new dialog only needs to *read* `useReportsState`, it must NOT call these hooks again or reorder anything.
- No other file imports `IndexTasks.tsx` besides `page.tsx`; no test file references it (see Sinal de teste).

## Armadilhas

- `IndexTasks.tsx:14` has an explicit ordering comment: "sync reads the store via getState(), already hydrated by useStoredTasks/useStoredReports in this same mount commit" — do not reorder these hook calls or insert the new dialog's logic before them.
- `getEntriesInWindow` returns entries **already sorted most-recent-first** (`utils.ts:122-124`) — for Week view just map over the returned array, do not re-sort; for Today, filter/find the entry whose `.date === getDayKey(new Date())` (may be absent from the map if nothing synced yet today — must handle "no entry" as an empty state, mirroring `IndexTasks.tsx:36-43` empty-state style).
- `DailyReportEntry.tasks` can be `[]` after retention purge even though `cycles`/`focusedSeconds`/`completedCount` are still populated (`namesPurged: true`, see `utils.ts:96-101`) — the dialog must handle "totals exist but task list is empty" for older days inside the Week tab, not just the fully-empty case. Show totals regardless of `namesPurged`; show an explanatory empty line (e.g. "task names not retained") only when `tasks.length === 0 && (focusedSeconds>0 || cycles>0 || completedCount>0)`.
- Workflow badge rule (P8, confirmed nowhere in code as an existing flag — this is new UI logic dictated by the task spec, not a pre-existing pattern): compute `distinctWorkflowIds = new Set(visibleTasks.map(t => t.workflowId).filter(Boolean))`; only render the `workflowTitle`/`groupTitle` badge per row when `distinctWorkflowIds.size > 1`. This must be computed per-scope (per Today's task list, and separately per each day's task list in Week — or per the whole Week's pooled tasks, whichever the plan picks; recon flags it as an open call for the planner, not a contradiction).
- `Button` atom's default padding (`px-16 py-4`, `Button/index.tsx:28`) is enormous — if reused for the small header trigger it MUST get a className override (e.g. `className="px-3 py-2 gap-2 text-sm w-auto"`), otherwise prefer the raw-`<button>` pattern from `IndexDarkModeToggle.tsx` (no Button atom at all) since that is the closer visual mold for a bordered-neutral small button with icon+label.
- Dark mode: every new color utility class needs its `dark:` pair (project-wide convention, visible in every file read above) — no exceptions found.
- `Dialog.Content` default width is `w-[420px]` (`content.tsx:26`) — for a two-column-ish report list with Start/End/Duration this is likely too narrow; override via `className` (e.g. `w-[560px]` or wider), following `IndexTaskNoteDialog.tsx:92`'s override precedent.
- `formatDuration` in `IndexScore.tsx` is NOT exported — either export it from `IndexScore.tsx` and import (touches an existing file outside the new folder) or duplicate a small local formatter inside the new dialog folder. Recon does not decide this; flagging as an open call for the planner.

## Sinal de teste

Não encontrado — no test files reference `IndexTasks.tsx`, `IndexScore.tsx`, or anything under `states/reports/` (checked via targeted grep for `IndexTasks`/`reports` under any `__tests__`/`*.test.*`/`*.spec.*` naming, no matches). This is a pure UI addition with no existing automated coverage; the sync/store logic it reads was already tested in steps 01/02. This step needs a running app + a browser UI path (open the app, click "Reports", switch Today/Week tabs, verify rows/totals) — no unit test scaffold exists to extend.

## Veredito de complexidade

1. Uma frente só? **sim** — pure frontend/UI, no backend/Rust/Tauri command involved (confirmed: no new IPC, reads an existing Zustand store only).
2. Footprint de no máximo 6 arquivos a criar/editar? **sim** — edit `IndexTasks.tsx` (1) + new folder `IndexReportsDialog/` with a small split: dialog shell, tab switcher, task row, totals/header (~4 new files) = 5 total, within budget.
3. Existe molde/irmão claro para espelhar? **sim** — `IndexWorkflowDialog.tsx` (folder shape + trigger+dialog composition) and `IndexTaskNoteDialog.tsx` (controlled dialog state pattern), both opened above.
4. Zero decisão de arquitetura/produto em aberto? **não** — two small open calls remain for the planner: (a) whether the workflow-badge distinct-check (P8) is computed per-day or pooled across the whole week, (b) whether to export `formatDuration` from `IndexScore.tsx` or duplicate it locally. Neither is architectural (no new store, no new file layout decision), but they are unresolved product/style calls a recon must not silently pick.
5. Zero lógica/algoritmo novo não-trivial? **sim** — grouping/filtering by day-key and a distinct-workflow-id count are trivial array operations mirroring `getEntriesInWindow`'s existing shape; no new parser/state machine/ranking algorithm.

veredito: complexa — item 4 falhou (duas decisões de produto em aberto: escopo do badge de workflow por dia vs. pool semanal; export vs. duplicação de formatDuration)

## Sinal de partição

partição: não — this is one cohesive UI feature (one dialog, one new folder), not a new module+test-suite pair nor a new cross-cutting taxonomy; it consumes an already-frozen type contract (`DailyReportEntry`/`DailyReportTask`) rather than defining one.
