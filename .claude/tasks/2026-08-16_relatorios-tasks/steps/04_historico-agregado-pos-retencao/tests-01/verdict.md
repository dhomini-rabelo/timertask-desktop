# System test verdict — relatorios-tasks / step 04 historico-agregado-pos-retencao / tests-01

Environment: Vite dev server already running at http://localhost:1420 (reused, not started by this run). Playwright MCP driving the browser. No notification-permission gate was showing (already granted in this session), app content was visible immediately.

## Setup / seeding (browser_evaluate)

Seeded `localStorage["timertasks:reports"]` with three entries, computed via JS `Date` arithmetic (today = 2026-08-16):

- `2026-07-27` (today − 20 days, outside 7-day window): `cycles: 3`, `focusedSeconds: 5400` (1h30m), `completedCount: 2`, 2 fake tasks (`FAKE_TASK_OLD20_ALPHA`, `FAKE_TASK_OLD20_BETA`), `namesPurged: false`.
- `2026-07-07` (today − 40 days, outside 7-day window): `cycles: 5`, `focusedSeconds: 9000` (2h30m), `completedCount: 3`, 3 fake tasks (`FAKE_TASK_OLD40_GAMMA/DELTA/EPSILON`), `namesPurged: false`.
- `2026-08-16` (today, control): `cycles: 2`, `focusedSeconds: 1800`, `completedCount: 1`, 1 fake task (`FAKE_TASK_TODAY_ZETA`), `namesPurged: false`.

## Step 1 — Retention purge runs on reload

Reloaded (`browser_navigate` to the same URL) and re-read `localStorage["timertasks:reports"]`. Result:

- `2026-07-27`: `tasks: []`, `namesPurged: true`, `cycles: 3`, `focusedSeconds: 5400`, `completedCount: 2` — unchanged numbers, names purged. ✅
- `2026-07-07`: `tasks: []`, `namesPurged: true`, `cycles: 5`, `focusedSeconds: 9000`, `completedCount: 3` — unchanged numbers, names purged. ✅
- `2026-08-16` (today): untouched by retention as expected (still has task list). Note: the app's own live task/session hydration merged in a pre-existing real task ("Personal Task Alpha") and nudged `focusedSeconds` to 601 / `completedCount` to 2 — this is unrelated app behavior (live session reconciliation on load) and does not affect History-tab correctness since History excludes today. Recorded for transparency, not a defect for this step.

Expected History totals (sum across the two out-of-window days only): `cycles = 8`, `focusedSeconds = 14400` (4h 0m), `completedCount = 5`.

## Step 2 — Reports dialog / Today tab (default)

Clicked "Reports" (top-right of Tasks card). Dialog opened, defaulted to the "Today" tab, correctly showing today's 2 tasks (`FAKE_TASK_TODAY_ZETA`, `Personal Task Alpha`), Focused 10m, Cycles 2, Completed 2. ✅

## Step 3 — History tab

Clicked "History". Verified via `browser_snapshot` and DOM inspection:

- Retention-explanation copy present above totals: "Task names are kept for 7 days. After that, only cycles, focused time and the completed count remain." ✅
- Totals block: Focused **4h**, Cycles **8**, Completed **5** — exactly matches the expected sum (14400s = 4h0m, 8, 5) and matches raw localStorage post-reload numbers. (Total shows "4h" with no "0m" suffix — consistent with the app's existing `formatDuration` behavior of omitting zero components, already observed on the Today tab showing "10m" instead of "0h 10m". Not a defect.) ✅
- Both old days present, most-recent-first: "Mon, Jul 27" ("1h 30m · 3 cycles · 2 done") listed before "Tue, Jul 7" ("2h 30m · 5 cycles · 3 done") — per-day numbers match seeded `cycles`/`focusedSeconds`/`completedCount` exactly. ✅
- Both days show the sentence "Task names are no longer retained for this day." ✅
- No task names anywhere in the History DOM: programmatically searched the dialog's `innerHTML` for all 5 fake old-day task titles (`FAKE_TASK_OLD20_ALPHA`, `FAKE_TASK_OLD20_BETA`, `FAKE_TASK_OLD40_GAMMA`, `FAKE_TASK_OLD40_DELTA`, `FAKE_TASK_OLD40_EPSILON`) — zero matches found. ✅

## Step 4 — Week tab unaffected

Clicked "Week". Only today's entry appears ("Sun, Aug 16 · Today", showing both today's tasks including titles — correct, today is inside the window). The two purged days (Jul 27, Jul 7) do NOT appear in Week. Week totals: Focused 10m, Cycles 2, Completed 2 — matches only today's data, unaffected by the old/purged entries. ✅

## Step 5 — Empty state

Cleared `localStorage["timertasks:reports"]` (`removeItem`), reloaded, opened Reports → History. Result: no crash, totals render as 0m/0/0, and an empty-state message is shown: "No history yet. Days older than 7 days will appear here." ✅ Screenshot: `screenshots/08-history-tab-empty-state.png`.

## Step 6 — Screenshots (dark + light)

Re-seeded the same 3 entries, reloaded (retention re-ran, same numbers as Step 1), opened Reports → History:

- Dark mode (app's default theme in this session): `screenshots/06-history-tab-dark.png`
- Toggled the in-app theme button ("Switch to light mode" in the header) to light mode, re-screenshotted: `screenshots/07-history-tab-light.png`

Both screenshots show the totals block, both old days with duration/cycles/completed/purge-notice, and the retention-explanation copy, rendering correctly in both themes.

## Step 7 — No extra writes from opening History (read-only check)

After the reload in Step 6, read `localStorage["timertasks:reports"]` (baseline). Then opened Reports → History tab, and read it again. The two JSON strings are **byte-identical** — opening the History tab does not mutate the store.

## Console

No app-level console errors observed throughout the run (only unrelated browser-extension noise: "A listener indicated an asynchronous response..." — not from this app).

## Screenshots

- `.claude/tasks/2026-08-16_relatorios-tasks/steps/04_historico-agregado-pos-retencao/tests-01/screenshots/06-history-tab-dark.png`
- `.claude/tasks/2026-08-16_relatorios-tasks/steps/04_historico-agregado-pos-retencao/tests-01/screenshots/07-history-tab-light.png`
- `.claude/tasks/2026-08-16_relatorios-tasks/steps/04_historico-agregado-pos-retencao/tests-01/screenshots/08-history-tab-empty-state.png`

## Verdict

**PASS**

All deep-test requirements were exercised and matched expectations: retention purge correctness, History totals/order/per-day fields, zero task-name leakage into History DOM, Week exclusion of purged days with unaffected totals, empty state, dark/light rendering, and read-only idempotency of opening the History tab.
