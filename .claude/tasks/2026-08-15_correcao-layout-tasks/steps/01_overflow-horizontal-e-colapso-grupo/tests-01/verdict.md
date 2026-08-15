# Verdict — step 01 `overflow-horizontal-e-colapso-grupo`, tests-01

## PASS

Mode: Docker+browser only (no runner/Docker in this repo). `npm run dev` (Vite, fixed port 1420) was
already running and reused. Browser: Playwright MCP, viewport **620x900** (PA8). Commit under test:
`e521536` (base `3e3108a`).

## Setup notes

- Notification permission was already `granted` from a prior session on this browser profile, so the
  blocking screen did not reappear. Defensively overrode `Notification.permission`/`requestPermission`
  anyway (no-op here, kept per trap instructions).
- Fixture (verbatim from plan.md BUG C section: `t0` root task, `g1` group, `t1`/`t2` children) planted
  into `localStorage["timertasks:tasks"]`. To survive the reload despite `useStoredTasks`'s
  `beforeunload` handler (which would otherwise overwrite it with the stale in-memory state of the
  page that was loaded with old data), I monkey-patched `Storage.prototype.setItem` to swallow writes
  to the `timertasks:tasks` key on the outgoing page, right after planting the fixture, then reloaded.
  The new document gets a fresh JS context (patch gone) and hydrates from the untouched fixture.
  Verified by reading `localStorage` right after reload: fixture intact.
- `hasBeenStarted` (task.timeEvents contains a `start` event) gates whether `IndexDebugTimer` renders
  at all — both `t0` and `t1` have it via the fixture's start+stop pair, so both already show the
  Debug widget at rest. States (a)/(c) = widget shown, "Debug" not yet clicked (00:00, no Check).
  States (b)/(d) = after clicking "Debug" and waiting, Check-reset button appears. Note:
  `IndexDebugTimer`'s own "Debug" button only actually starts (vs. dispatching "Subtask timer is not
  running") when the *parent* task's own timer (`isTimerActive`) is running, which itself requires the
  global countdown timer running. So before clicking a task's "Debug", I clicked the global "Start"
  button once and that task's own Play button.

## 1. `npx tsc --noEmit`

PASS — exit 0, no output.

## 2. Overflow matrix — 4 states

Measured `scrollWidth <= clientWidth + 1` on both the action row itself, `div.overflow-y-auto`
(`IndexTasks.tsx:30`) and `document.documentElement`.

| State | actionRow scrollW/clientW | scrollContainer scrollW/clientW | documentEl scrollW/clientW | Overflow? |
|---|---|---|---|---|
| (a) root, debug never clicked (`task solta`) | 506 / 506 | 508 / 508 | 605 / 605 | none — PASS |
| (b) root, debug already run (`task solta`, Debug 01:11, Check visible) | 506 / 506 | 508 / 508 | 605 / 605 | none — PASS |
| (c) group child, debug never clicked (`filha rodando`) | 472 / 472 | 508 / 508 | 605 / 605 | none — PASS |
| (d) group child, debug already run (`filha rodando`, Debug 00:48, Check visible) | 472 / 472 | 508 / 508 | 605 / 605 | none — PASS |

All 4 states measured `scrollWidth <= clientWidth + 1` on both containers. **PASS.** State (d), the
tightest budget per the plan (~496–501px estimated), measured 472px — comfortable margin, well inside
the 508px container. **The A3 contingency (`flex-wrap`) is not needed.**

## 3. No horizontal scrollbar / card not clipped

Confirmed numerically above (0 overflow in all 4 states) and visually in screenshots for (b) and (d)
(see below) — white card fully contains the action row in both cases, no clipping.

## 4. Select.Trigger width ≤ 140px

Measured `getBoundingClientRect().width` of the alert `Select.Trigger` (found via its "5 min" text) in
all 4 states: **101.02px** in every case (root/group, before/after Debug click) — well under the
140px bar and nowhere near the ~280px seen pre-fix in the bug screenshots. **PASS.**

As a bonus check, I reproduced the pre-fix trigger width by temporarily reverting the 2 changed files
to `3e3108a` (see §6) and re-measured: trigger width jumped to **~323–333px**, and the action rows
overflowed (`scrollWidth` 679–713 vs `clientWidth` 472–508, `scrollContainer` 714/508). This confirms
BUG A is real pre-fix and confirms the fix's measured effect is not coincidental.

## 5. Diff footprint

```
 .../IndexActiveTasksList/IndexTaskItem/IndexAlertSelect.tsx           | 2 +-
 .../IndexTasks/IndexActiveTasksList/IndexTaskItem/IndexTaskItem.tsx   | 4 ++--
 2 files changed, 3 insertions(+), 3 deletions(-)
```
(`git diff --stat 3e3108a HEAD -- src/`). Only these 2 files changed. `trigger.tsx`, `IndexTasks.tsx`,
`page.tsx`, `global.css`, `IndexFooter.tsx`, `IndexDebugTimer.tsx`, `IndexTaskGroup.tsx` intocados.
No `overflow-x-hidden` introduced (grepped visually while reading the diff/files; not present).
**PASS.**

## 6. BUG C — protocol de reprodução

Located the chevron exactly per the plan's DOM protocol: group header
(`IndexTaskGroup.tsx:85`, `div.flex.items-center.justify-between.p-4...`) → right-side actions
container (`:102`, `div.flex.items-center.gap-1`) → the only direct-child `<button>` of that container
(the edit/delete buttons are nested one level deeper inside their own `opacity-0 group-hover` div, so
they're excluded by `:scope > button`).

**Pre-fix run** (temporarily `git checkout 3e3108a -- IndexAlertSelect.tsx IndexTaskItem.tsx`, Vite HMR
picked it up, confirmed BUG A reproduced: trigger 332.9px, `t0` action row 713/506 overflowing,
`scrollContainer` 714/508 overflowing):
- Chevron rect at rest (scrollLeft=0, scrollTop=0): `{top:1175, left:495, right:531, width:36,
  height:36}`. Scroll-container box: `{top:951, bottom:1451, left:41, right:564}`. The chevron's rect
  is **fully inside** the container's own box (`right:531 <= 564`) — reachable without any horizontal
  scroll, despite the container's `scrollWidth` (714) exceeding its `clientWidth` (508). This is
  because the flex column's cross-axis (width) is fixed by a static ancestor (`max-w-[600px]`), so only
  the one overflowing task row visually bleeds past the box; sibling rows (including the group header)
  keep their own natural width and position — they do not get stretched by the sibling's overflow.
- Clicked the chevron via `element.click()`: `collapsed` toggled `false → true` in the store, child
  list hid from DOM, no new console errors (console only ever showed 3 baseline
  "message channel closed" entries from an unrelated browser extension, present before, during and
  after — never anything from app code). Re-clicked to re-expand, confirmed back to `collapsed: false`.

**Post-fix run** (restored via `git checkout HEAD -- ...`, confirmed back to 506/472 non-overflowing,
101px trigger):
- Same chevron, same rect: `{top:1175, left:495, right:531, width:36, height:36}` — **identical
  position pre- and post-fix.**
- Real click via `element.click()`: `collapsed` toggled `false → true`; the "Add a task…" input +
  `IndexGroupTasksList` block (`IndexTaskGroup.tsx:142-159`) disappeared from the DOM; the count
  ("0 of 2 completed") and `ProgressBar` (0%) **remained visible** — this is existing behavior, not a
  bug (see H2 row below). No console exceptions.
- Re-expanded: child list reappeared. The running child `filha rodando`'s timer was **06:09** right
  before collapsing and **07:12** right after re-expanding (elapsed ~9s of realtime spent on the
  round-trip) — timer kept advancing while collapsed, was not reset, did not lose time. Confirms P5.

**Decision table verdict: H0 refuted, no mechanism found.** The chevron was reachable and clickable
identically before and after the fix — BUG A's horizontal overflow never actually put the group's
chevron out of reach (sibling rows don't inherit the overflowing row's width in this flex-column /
fixed-width-ancestor layout). Per the table: *"Chevron alcançável e clicável pré-fix também, sem nada
quebrado" → H0 refutado sem mecanismo → Não inventar fix. Registrar 'não reproduzido' com toda a
evidência e escalar."*

**Escalating as instructed**: no second implementation scope is warranted from this evidence — no
guard, no exception, no positional bug was found in either code state. If the user's original bug
report (memoria-da-task.md §1) intended a different repro path (e.g. a narrower window where the
*group header itself* — not a sibling row — is the one whose own `Select`/content overflows, which
this fixture doesn't construct since the group header carries no Select), that would need a distinct
fixture/mechanism and is out of this step's evidence. Recommend the orchestrator treat BUG C as
**closed / not reproduced** for this step rather than opening a fix round, since PA1 already established
there is no static guard blocking collapse, and this dynamic test corroborates it.

(H1 — console exception: not observed. H3 — wrong/footer chevron: not applicable, protocol targeted
the group header chevron specifically, confirmed by DOM path, not `IndexFooter.tsx`.)

## 7. Vertical scrollbar of the active list still exists

`div.overflow-y-auto`: `scrollHeight=764`, `clientHeight=500` (`764 > 500`), `computedStyle.overflowY
= "auto"`. Vertical scroll is still active and necessary — confirmed both numerically and visually
(scrollbar track visible in `state-b-root-debug-already-run.png`). Not a regression; this is step 02's
job to remove, not this step's.

## Not run

- DnD (drag and drop) — not attempted, per the standing trap that it is not automatable in this
  environment.

## Screenshots

- `screenshots/state-b-root-debug-already-run.png` — root task `task solta`, Debug already run
  (01:11, Check visible), fits fully in the white card, vertical scrollbar of the active list visible
  on the right, no horizontal scrollbar.
- `screenshots/state-d-group-debug-already-run.png` — grouped task `filha rodando` (inside "Grupo
  Teste"), Debug already run (00:48, Check visible), and sibling `filha parada` (debug never started,
  select-only) both fit fully in the card, no horizontal scrollbar, no clipping.

## Summary

All 7 acceptance criteria measured and PASSED. BUG C's decision-table outcome is "H0 refuted / not
reproduced" (informational, does not block PASS per PA1 — BUG C was never implementation scope for
this step, only a reproduction protocol). No code was changed by the tester; the two temporary
`git checkout 3e3108a -- ...` / `git checkout HEAD -- ...` round-trips used for pre/post-fix comparison
left the working tree exactly as found (confirmed via `git diff --stat` showing no residual changes
to `src/`).
