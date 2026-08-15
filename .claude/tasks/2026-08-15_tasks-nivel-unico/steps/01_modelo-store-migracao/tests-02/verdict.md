# System test verdict — step 01_modelo-store-migracao (attempt tests-02)

Nonce: S01-test-browser-r02-tasks-nivel-unico
Mode: browser (Playwright MCP against Vite dev server at http://127.0.0.1:1420)

## Setup

- Dev server was already running and responding 200 on port 1420; reused it, did not start or stop it.
- `npx tsc --noEmit` clean (exit 0) before starting the browser run.
- Same environment workarounds as tests-01, reconfirmed: override `window.Notification.permission`
  (getter → `'granted'`) and `.requestPermission` (→ resolves `'granted'`) via `browser_evaluate` before
  clicking "Allow notifications"; redone after every reload (fresh JS context). All button interactions
  done via real DOM `click()` through `browser_evaluate` (native `browser_click` is unreliable on this
  app's continuously re-rendering timers). Legacy fixture planted into `localStorage` while the
  notification gate still blocked hydration, to avoid the `beforeunload` overwrite trap noted in
  tests-01.
- Screenshot tool quirk (new, not app-related): the Playwright MCP screenshot tool runs on a
  Windows-hosted process that mis-resolves POSIX-style `filename` paths (prepends `C:\`, breaks
  separators) — passing any custom filename/path always errored `ENOENT`. Worked around by taking
  screenshots with no `filename` (goes to the tool's default Windows temp output dir) and copying the
  resulting file into this attempt's `screenshots/` via `cp` from `/mnt/c/Users/T-GAMER/AppData/Local/Temp/.playwright-mcp/`.

## Focus case: the exact bug from tests-01

Planted (step 1) under `timertasks:tasks`, workflowId `workflow-work`:
- `legacy-group-A` "Ship v2 release" (no `type`, WITH 3 subtasks: "Draft changelog" completed
  20min, "Run smoke tests" not completed 15min, "Notify stakeholders" completed 5min).
- `legacy-standalone-B` "Renew SSL certificate" (no `type`, `subtasks: []`, `completed: true`, own
  `timeEvents` start/stop/complete, 15min) — the exact fallback-branch case that lost `timeEvents` in
  tests-01.

After reload (step 2), inspecting the store/localStorage directly: `legacy-standalone-B` has
`timeEventsCount: 3`, matching the fixture exactly (previously `0`). In the UI, its completed-list entry
shows `Start 12:00:00  End 12:15:00  Duration 15:00` instead of "No time tracked"
(`screenshots/02-after-1st-reload-completed-expanded-timeevents-survived.png`).

Score cards (step 3): Focused Time = 55m = 20+15+5+15 min (all four tasks' durations, including the
standalone one) — exact match. Tasks Completed = "3 tasks" (Draft changelog, Notify stakeholders,
Renew SSL certificate — all have a `complete` event). Footer = "3 of 4 completed" (75%). **3 == 3, no
divergence** — the tests-01 inconsistency (score card "1 tasks" vs footer "2 of 4") is gone.
Screenshot: `screenshots/01-after-1st-reload-collapsed-view.png` (collapsed) and
`02-after-1st-reload-completed-expanded-timeevents-survived.png` (expanded, showing all 3 durations).

## Full roteiro

**1–2. Fixture + first reload.** As above — subtasks flattened to level-1 tasks (no accordion), no data
lost, standalone task's timeEvents fixed. PASS.

**3. Score cards vs footer.** All four cards correct and consistent with the footer count. PASS.

**4. Second reload — idempotency.** Re-read localStorage before/after: 5 items both times, same ids
(`legacy-group-A`, `legacy-sub-A1/A2/A3`, `legacy-standalone-B`), no duplication.
Screenshot: `screenshots/03-after-2nd-reload-no-duplication.png`. PASS.

**5. Two tasks running simultaneously.** Added a new task "Backup database", started the global
pomodoro timer, then started both "Run smoke tests" and "Backup database" via their execute buttons.
Verified directly in localStorage: both `isRunning: true` at the same time (`legacy-sub-A2` and the new
task), neither stopped the other. Screenshot: `screenshots/04-two-tasks-running-simultaneously.png`
(both rows show the red Stop icon and live counters). PASS.

**6. CRUD.**
- Create task ("Backup database") — PASS.
- Mark complete while running (check button) — `completed:true` + `complete` event added, Tasks
  Completed 3→4, footer 3→4 of 5, Focused Time 55m→56m. PASS.
- Stop + inline edit title ("Run smoke tests" → "Run full regression suite") — title updated in
  store/UI. PASS.
- Delete task ("Run full regression suite") — removed from store, footer became "4 of 4 completed"
  (100%), Focused Time recalculated 56m→40m (its 15min removed), active list showed empty state
  "All tasks completed!". PASS.
- Open note dialog on a completed task ("Draft changelog"), write and save a note — persisted to
  `note` field in localStorage, dialog button switched to "Saved".
  Screenshot: `screenshots/05-crud-edit-complete-delete-note-flow.png`. PASS.
- Add group: confirmed (again, as in tests-01) there is still no "Add Group" UI — `addGroup` action
  exists in the store but nothing calls it. Not a regression for this step's scope (model/store/
  migration only); the pre-existing `legacy-group-A` TaskGroup's data (title "Ship v2 release", note
  "release notes") was directly inspected in localStorage and confirmed intact/unmodified throughout,
  even though it has no visual representation. Not exercised via UI (no control exists) — reported as
  "Not run" for the create-via-UI sub-case, not a failure.
- Drag-and-drop reorder — **not run**, same tooling limitation as tests-01: dnd-kit's `PointerSensor`
  needs real OS-level pointer capture, which neither `browser_drag` (times out on this app's
  continuously re-rendering timers) nor scripted `PointerEvent` dispatch can provide. Not attributable
  to the app.

Console: only browser-extension noise ("A listener indicated an asynchronous response..."), no
app-level runtime errors observed at any point.

## Verdict

**PASS** — The tests-01 bug is fixed and directly reproduced-then-confirmed-fixed: `legacy-standalone-B`
(a legacy top-level task with no subtasks and its own `timeEvents`) now retains all 3 of its time events
through migration (`useStoredTasks.ts:102` now calls `reviveEvents(entry.timeEvents)`), Focused Time
(55m) and Tasks Completed (3 tasks) both correctly include its contribution, and the score-card vs
footer divergence from tests-01 is gone (3 completed == 3 of 4). The rest of the roteiro — subtask
flattening, no-accordion UI, idempotent re-migration (no duplication across 2 reloads), concurrent
multi-task running, and full CRUD (create/edit/complete/delete/note) — all passed on direct
re-verification. Drag-and-drop remains unverifiable due to a pre-existing browser-automation/dnd-kit
pointer-capture limitation (not app-attributable); "Add Group" has no UI yet (out of this step's scope,
group data itself verified intact in the store).
