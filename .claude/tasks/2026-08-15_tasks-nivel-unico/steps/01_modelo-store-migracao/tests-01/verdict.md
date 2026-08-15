# System test verdict — step 01_modelo-store-migracao (attempt tests-01)

Nonce: S01-test-browser-r01-tasks-nivel-unico
Mode: browser (Playwright MCP against Vite dev server at http://127.0.0.1:1420)

## Setup notes (environment, not app behavior)

- The Vite dev server was already running and responding (200) on port 1420; reused it, did not start a second instance.
- The app gates all content behind a Tauri notification-permission screen ("Allow notifications"). In a plain browser (no Tauri bridge) this always resolves to `denied` on load. Worked around by overriding `window.Notification.permission` (getter → `'granted'`) and `window.Notification.requestPermission` (→ resolves `'granted'`) via `browser_evaluate`, then clicking "Allow notifications". This override does not persist across reloads (fresh JS context each time), so it was redone before every reload.
- `browser_click`/`browser_drag` via the Playwright MCP tool consistently timed out with "waiting for element to be visible and stable" on this app (likely because of continuously re-rendering live counters/timers defeating the actionability "stable" check), even though the same elements were clickable. Worked around by dispatching real DOM `click()` calls via `browser_evaluate` for all button interactions, which worked reliably. Native drag (dnd-kit, pointer-capture based) could not be reproduced this way — see item 6.
- Found and worked around a real pitfall in the *test methodology* itself: `useStoredTasks.ts` writes the in-memory state back to `localStorage` on `beforeunload`. If the app is ever allowed to hydrate with empty data first (e.g., by clearing the notification gate before planting the fixture) and *then* you plant the legacy fixture directly into `localStorage`, the next full navigation's `beforeunload` handler overwrites the fixture with the empty in-memory state before it's ever read. Fixed by always planting the fixture while the notification gate was still blocking `IndexTasks` (i.e., before hydration ever ran).

## Roteiro results

**1–2. Legacy fixture plant + first reload.** Planted under `timertasks:tasks` (workflowId `workflow-work`, confirmed as the app's default) a legacy array with:
- `legacy-group-1` "Debug flaky test suite" (Task with 3 subtasks: "Reproduce locally" 20 min stop/start, "Bisect commit history" 45 min + `completed:true` + `complete` event, "Patch root cause" left `isRunning:true` mid-session).
- `legacy-standalone-1` "Water the office plants" (Task, `subtasks: []`, `completed:true`, with its own start/stop/complete timeEvents, 5 min).

After the first reload: the 3 former subtasks appeared as flat level-1 tasks in the main list (no accordion/page 2) — PASS. The subtasks-less legacy Task became a standalone root task, present and counted ("3 of 4 completed" style progress, no items lost from the total count: 5 stored items = 1 group + 4 tasks) — PASS.
Screenshot: `screenshots/02-after-1st-reload-migrated-completed-expanded.png`.

One caveat, not a data-loss bug but worth flagging: the parent group `legacy-group-1` itself is preserved as a `type:"group"` item in the store/localStorage (nothing is discarded at the data level), but the current UI (`useListingTasks`/`IndexActiveTasksList`) never renders `TaskGroup` items at all — there is no group header/card anywhere, and no "Add Group" UI exists yet. So the *group's own title* has no visual representation post-migration, even though its data survives. Given this step's stated scope is "modelo, store e migração" (not full group UI), I'm treating this as an acceptable, presumably-deferred gap rather than a regression — but flagging it since the roteiro's "nada sumiu" wording could be read either way.

**3. Score cards reflect planted data.** Focused Time and Current Streak were non-zero and of the right order of magnitude (~1h15–1h18m depending on the ongoing "Patch root cause" timer; streak 1 day, all events today) — mostly PASS, **except** see the bug below which undercounts both Focused Time and Tasks Completed.

**4. Second reload — idempotency.** Re-inspected `localStorage` before and after the second hydration: 5 items both times, same 5 ids (`legacy-group-1`, `legacy-sub-1/2/3`, `legacy-standalone-1`), no duplication — PASS. Screenshot: `screenshots/03-after-2nd-reload-no-duplication.png`.

**5. Two tasks running simultaneously.** Started the global pomodoro timer (required — task play buttons are blocked with "Global timer is not running" otherwise), then started "Reproduce locally" while "Patch root cause" was already running from the migrated fixture. Verified directly in the store/localStorage: both `isRunning: true` at the same time, neither stopped the other — PASS, confirms the new multi-run behavior. Screenshot: `screenshots/04-two-tasks-running-simultaneously.png`.

**6. Normal CRUD.** All exercised and confirmed via both UI snapshot and direct store/localStorage inspection:
- Create task ("Write final report") — PASS.
- Inline edit title ("Write final report" → "Write final postmortem report") — PASS.
- Start it, mark as complete (adds a `complete` timeEvent, `completed:true`) — PASS.
- Open note dialog on the completed item, write and save a note (`note` field persisted) — PASS. Screenshot: `screenshots/05-create-edit-complete-note-flow.png`.
- Delete a task ("Reproduce locally", after stopping it since delete is hidden while running) — removed from store, UI counts updated (Focused Time recalculated down) — PASS. Screenshot: `screenshots/06-after-delete-task.png`.
- Drag reorder — **not verified**. Native `browser_drag` timed out (same actionability/stability issue as plain clicks); a synthetic PointerEvent sequence (pointerdown/move/up) did not trigger dnd-kit's sortable reorder either (dnd-kit's `PointerSensor` needs real pointer capture semantics that a scripted dispatch doesn't provide). Not attributable to the app; reporting as untested rather than pass/fail.

Console: only "A listener indicated an asynchronous response..." messages (browser-extension messaging noise), no app-level errors observed during any of the above.

## Bug found (blocks PASS)

**Legacy standalone Task's own `timeEvents` are discarded during migration**, even though `completed` survives.

`src/pages/index/hooks/useStoredTasks.ts`, `migrateEntry()`, the final fallback branch (used whenever a legacy entry has no `type` field and `subtasks` is empty/absent — i.e. exactly the "grupo SEM subtasks" case from the roteiro):

```ts
// lines 95-106
return [
  {
    type: "task",
    id: entry.id,
    title: entry.title,
    completed: !!entry.completed,
    isRunning: !!entry.isRunning,
    timeEvents: [],                    // <-- hardcoded empty, entry.timeEvents is dropped
    workflowId: entry.workflowId ?? null,
    groupId: null,
    note: entry.note,
  },
];
```

Every other branch that produces a `Task` (`type === "task"`, and the per-subtask mapping inside the "group with subtasks" branch) correctly calls `reviveEvents(entry.timeEvents)`. This branch alone hardcodes `[]` instead of `reviveEvents(entry.timeEvents)`.

Reproduced live: planted `legacy-standalone-1` "Water the office plants" with 3 timeEvents (start/stop/complete, 5 min). After migration it shows **"No time tracked"** in the completed list (screenshot `02-...png` and `06-...png`), while the sibling subtask-derived task "Bisect commit history" (same shape of timeEvents, migrated through the other branch) correctly shows "Start 14:46:08  End 15:31:08  Duration 45:00". Confirmed via direct inspection: `legacy-standalone-1` has `timeEventsCount: 0` post-migration versus 3 in the source fixture.

Consequences, both visible in the score cards:
- **Focused Time** undercounts by the lost duration (this task's 5 min never enters `calculateTotalFocusedTime`).
- **Tasks Completed** undercounted too: `calculateTasksCompleted` looks for a `"complete"` timeEvent, not the `completed` boolean — so this task doesn't count even though it visibly shows as completed (checkmark) in the list. Observed: score card showed "1 tasks" while the footer's own `completed`-flag-based counter showed "2 of 4 completed" — an internal inconsistency directly caused by this bug.

This directly contradicts the roteiro's requirement ("confirme que os tempos sobreviveram") for legacy top-level tasks that had their own time history, which is a plausible real-world shape (the `LegacyTaskEntry` TS interface in this same file explicitly types `timeEvents?: LegacyTimeEvent[]` on it, so the code itself anticipates this data existing).

## Verdict

**FAIL** — reproducible data-loss bug in the migration: a legacy standalone Task's own `timeEvents` (and thus its completion/focused-time contribution) are silently discarded by `migrateEntry()`'s fallback branch in `src/pages/index/hooks/useStoredTasks.ts` (line 102, should be `timeEvents: reviveEvents(entry.timeEvents)` like the other branches). Everything else in the roteiro (flattening of subtasks, no-accordion UI, idempotent re-migration, concurrent multi-task running, and standard CRUD/note flows) passed.
