# System test verdict — step 02 `scroll-vertical-ativas-e-inativas`, attempt tests-01

**Overall verdict: PASS**

Commit under test: `babcf1e` (branch `main`). Mode: Docker+browser only, in practice browser-only
(no Dockerfile / no test suite in this repo). App driven at `http://localhost:1420` (Vite dev
server, already running, reused as-is — not started/stopped by this run). Playwright MCP server
runs on a Windows host reachable from this WSL2 shell via `/mnt/c/...`; screenshots were copied
from `/mnt/c/Users/T-GAMER/AppData/Local/Temp/.playwright-mcp/*.png` into this attempt's
`screenshots/` folder (paths below are repo-relative to
`.claude/tasks/2026-08-15_correcao-layout-tasks/steps/02_scroll-vertical-ativas-e-inativas/tests-01/screenshots/`).

Environment workarounds applied exactly as pre-validated: Notification permission override via
`browser_evaluate` (getter + `requestPermission` stub) redone after every reload; fixtures planted
directly into `localStorage["timertasks:tasks"]` before reload, with `Storage.prototype.setItem`
monkey-patched to swallow writes to that key right before navigating (defeats the `beforeunload`
autosave); clicks done via `element.click()` inside `browser_evaluate`, never MCP's `browser_click`.
DnD not touched (out of scope for this step; no case here required it).

## Case 1 — >=8 active tasks, window scroll (PASS)

Fixture: 5 loose active tasks + 1 group ("Group Alpha") with 3 children = 8 active tasks total.

Measured (`browser_evaluate`, container = the `div` with class `flex flex-col gap-3 min-h-[250px]`
in `IndexTasks.tsx:30`):

- `container.scrollHeight === container.clientHeight` → `1304 === 1304` → **no internal scrollbar
  on the active list**.
- `document.documentElement.scrollHeight (1739) > clientHeight (900)` → **window does scroll**.
- Same state, horizontal: `document.documentElement.scrollWidth === clientWidth` → `1905 === 1905`
  → no horizontal overflow at this scale (re-verifies step 01's fix holds with 8 items, not just a
  couple).

Screenshot: `case1-01-top-8active.png` (top of page, native window scrollbar visible on the far
right of the viewport, no scrollbar hugging the task list itself).

## Case 2 — 0 and 1 active tasks, edge cases + R1 follow-up (PASS, with a registered non-blocking finding)

- **0 active, 0 total tasks** (`localStorage` = `[]`): empty state "No tasks yet. Add one above!"
  renders centered inside the `min-h-[250px]` box, no collapse/hole in light mode. Checked again in
  **dark mode** (`localStorage.theme = "dark"`) specifically because `review-r1.md` flagged a risk
  here. Screenshot: `case2-01-empty-dark.png`.
- **0 active, 16 completed** ("All tasks completed!" copy variant): also centered correctly.
  Screenshot: `case2-03-all-completed-empty-active.png`.
- **1 active task**: renders normally, `min-h-[250px]` still reserves the vertical space below the
  single task row (blank area before the footer/divider), matching the intended "no collapse"
  behavior. Screenshot: `case2-02-one-active-light.png`.

**R1 follow-up (measured, not just "looks fine")**: with 0 tasks in dark mode, viewport height was
925px but `#root` / `.body-df` (`page.tsx:54`) only measured `677px` (`root.scrollHeight ===
bodyDf height === 677`), confirming `review-r1.md`'s static analysis: `.body-df`'s unlayered
`min-height: 100%` (`global.css:68`) beats the `min-h-screen` Tailwind utility in the cascade, and
since `#root` has auto height, that `min-height: 100%` resolves to `0` — so `.min-h-screen` on
`page.tsx:54` is effectively inert. **However**, this does not produce a visible defect: `html`,
`body`, `#root` all carry their own explicit `background-color` (`global.css:44-51`) which stays
correct for the active theme regardless of `.body-df`'s shrunk height, and the computed
`background-color` of `html`/`body`/`#root`/`.body-df` were all identical
(`rgb(17, 24, 39)` in dark mode) — no seam, no wrong-color strip below the fold, confirmed visually
in `case2-01-empty-dark.png`. Registering this as a **lead, not a failure**: the inert
`min-h-screen` in `page.tsx:54` is real (cascade fact, not a guess) but currently has zero visible
impact; if a future change makes `.body-df` height matter again (e.g. adding a fixed-position child
some day), this is where it would first misbehave. No code changed by this tester.

## Case 3 — Completed accordion with >=15 items (PASS)

Fixture: 16 completed tasks, 0 active. Opened the "16 of 16 completed" accordion via
`element.click()` on the trigger row.

Measured on the scroll container (`div` with class
`flex flex-col gap-3 max-h-[calc(100vh-400px)] overflow-y-auto`, `IndexFooter.tsx:81`):

- `clientHeight === 501px`, and `window.innerHeight - 400 === 501` → **height is capped at exactly
  `calc(100vh-400px)`**, not "roughly" — exact match.
- `scrollHeight (1364) > clientHeight (501)` → **has its own scrollbar**.
- `scrollContainer.contains(trigger) === false` → the "16 of 16 completed" trigger row lives
  **outside** the scrolling container, as coded (`IndexFooter.tsx:44-78` vs. the conditional block
  at `:80-92`).
- Set `scrollContainer.scrollTop = 800` (i.e. scrolled it, not the window) and re-read the
  trigger's `getBoundingClientRect().top`: unchanged (567px before and after) — the trigger stayed
  in place and remained clickable; clicking it a second time collapsed the list (`Completed Task
  Number 10` left the DOM), and clicking again reopened it. Two distinct scrollbars are visible in
  the screenshot: the completed-list's own (inner, near the right edge of the card) and the native
  window scrollbar (outer, far right of the viewport).

Screenshot: `case3-01-completed-scrolled.png` (completed list scrolled to show items 10-13, "16 of
16 completed" trigger still pinned above the scroll area).

## Case 4 — Header / IndexTimer / IndexScore integrity while scrolling (PASS)

Using the same 8-active-task fixture as Case 1: captured the page at scroll top, scrolled to the
bottom (`window.scrollTo(0, document.documentElement.scrollHeight)`), and at a middle position
(`window.scrollTo(0, 400)`).

- Top (`case1-01-top-8active.png`): header (logo, workflow selector, settings, dark-mode toggle),
  `IndexTimer` (countdown circle + Start button) and `IndexScore` (4 stat tiles) all render intact,
  side-by-side with the tasks column, no overlap.
- Bottom (`case4-01-scrolled-bottom.png`): the timer/score column (which is shorter than the tasks
  column and not sticky) has simply scrolled out of view above the fold — left column is blank,
  right column shows the tail of the active list and the footer ("0 of 8 completed" / Reset /
  Progress). This is expected, non-sticky layout behavior, not clipping/overlap/duplication.
- Middle (`case4-02-scrolled-mid.png`): `IndexScore`'s stat-tile card is fully visible and
  undistorted mid-scroll, no duplication, no overlap with the tasks column.

No console errors attributable to the app were seen during any of the scroll captures (2-3 harmless
"listener indicated an asynchronous response..." messages are browser-extension noise, unrelated to
this app, present even before any interaction).

## Case 5 — Zero horizontal scroll anywhere (PASS)

Checked `scrollWidth === clientWidth` in three different fixture states:

| Target | State | scrollWidth | clientWidth |
|---|---|---|---|
| `document.documentElement` | 8-active fixture | 1905 | 1905 |
| active-tasks container (`min-h-[250px]`) | 8-active fixture | 550 | 550 |
| `document.documentElement` | 16-completed fixture | 1905 | 1905 |
| active-tasks container (empty state) | 16-completed fixture | 550 | 550 |
| completed-tasks scroll container (`max-h-[calc(100vh-400px)]`) | 16-completed fixture, accordion open | 535 | 535 |

No horizontal overflow on any of the three surfaces named in the acceptance criteria, at scale.

## Case 6 — Regression: collapse/expand an ACTIVE group still works (PASS)

Fixture: "Group Alpha" with 3 children (>= 2 required), plus 3 loose active tasks above it (tall
enough list). Started the global countdown timer (clicked "Start"), then clicked the Play button on
child task "Alpha Child One" (`button.text-Green-400` inside its row) — confirmed it actually
entered the running state (row text included "Running", elapsed time ticking, e.g. `00:04`), not
just `isRunning` in the fixture.

- Located the chevron via DOM structure (not MCP click), per the pre-validated recipe: title span
  → closest `div.flex.items-center.justify-between` (group header row) → its
  `div.flex.items-center.gap-1` child → the single direct-child `<button>` of that container (edit
  and delete buttons live one level deeper, inside a nested `div`, so this selector is unambiguous).
- First click: collapsed. Children (`Alpha Child One/Two/Three`) and the "Add a task..." input
  disappeared from `document.body.innerText`; screenshot `case6-01-group-collapsed.png` shows the
  chevron now pointing down and the child rows gone, while the "0 of 3 completed / Progress" summary
  line (which sits outside the `!collapsed` block, `IndexTaskGroup.tsx:133-140` vs `:142-159`)
  remained visible, matching the code.
- Second click: expanded again. All three children reappeared, and the running child's state
  survived the collapse/expand cycle (`Running` still present in its text afterward).

This confirms the vertical-height/scroll change did not newly break reachability of the group
chevron — consistent with the prior step's finding that BUG C had no code-level guard tied to
overflow.

## Screenshots index

- `case1-01-top-8active.png` — 8 active tasks, top of page, window scrollbar visible, no container
  scrollbar.
- `case4-01-scrolled-bottom.png` — same fixture, scrolled to bottom.
- `case4-02-scrolled-mid.png` — same fixture, mid-scroll, IndexScore card intact.
- `case6-01-group-collapsed.png` — Group Alpha collapsed with a running child, summary row still
  showing.
- `case2-01-empty-dark.png` — 0 tasks, dark mode, R1 follow-up (no visible hole/seam despite the
  measured inert `min-h-screen`).
- `case2-02-one-active-light.png` — 1 active task, light mode.
- `case2-03-all-completed-empty-active.png` — 0 active / 16 completed, "All tasks completed!" copy
  variant, "16 of 16 completed" trigger visible.
- `case3-01-completed-scrolled.png` — completed accordion open and scrolled internally, trigger row
  pinned above it, two distinct scrollbars visible.

## Non-blocking lead for a future round (not a failure, no code changed)

`src/pages/index/page.tsx:54` — `min-h-screen` is measurably inert due to the cascade interaction
with `.body-df { min-height: 100% }` (`src/layout/styles/global.css:68`, unlayered vs. Tailwind's
`utilities` layer) combined with `#root` having auto height. Measured: with 0 tasks, viewport
925px vs. `.body-df` actual height 677px. Currently invisible because `html`/`body`/`#root` paint
the same background color independently (`global.css:44-51`). Flagged here per `review-r1.md`'s
request for a runtime check; left as-is since it was explicitly called out as "out of scope for
this step, needs an explicit decision" and produced no observable defect in any case run.
