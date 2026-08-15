# Verdict — step 03 "grupos-prefixo", attempt tests-01

## Overall: PASS

13 of 13 runnable cases PASS. DnD (case 14) is `## Not run` per the environment limitation confirmed in steps 01/02 (dnd-kit needs real OS pointer-capture; neither `browser_drag` nor synthetic `PointerEvent` sequences work here). No blocking issues found; no code changes made (tester role).

## Static gate

`npx tsc --noEmit` → clean, exit=0.

## Environment / methodology notes

- App reused an already-running `npm run dev` on port 1420 (was already bound before this run started).
- Notification-permission gate bypassed via `browser_evaluate` overriding `window.Notification.permission`/`requestPermission`, redone after every reload (fresh JS context each time) — worked as documented.
- `browser_click`/`browser_type` via Playwright's normal actionability engine were unreliable in this app (an `Enter` keypress via `.press()` after `.fill()` silently did nothing — likely lost to the continuous re-render noted in the environment workarounds). Switched to real DOM mutation (native input-value setter + `dispatchEvent('input')`) plus real `element.click()` via `browser_evaluate` for every interaction from that point on; this was reliable throughout.
- Found a pre-existing, unrelated leftover in `localStorage:timertasks:tasks` at the start of this run: a completed root task `Task Alpha` (`isRunning:true`, a residue of the accepted T4 trap from step 02's own testing). It is invisible in the UI (completed tasks don't render in the active list) and was left untouched — it is not part of this step's fixtures and does not interfere with any case below. Attempting a full `localStorage` wipe before hydration hit the known `beforeunload`-overwrite trap (removing the key, then navigating, caused the *old* page's `beforeunload` to rewrite the old in-memory state back before the new page's JS context existed to re-clear it) — since none of this step's acceptance criteria require an empty starting board, I abandoned the wipe and just deleted the one *visible* leftover task via the UI trash button, then proceeded directly with UI-driven group/task creation for the rest of the run.
- Console: only 3 generic `"A listener indicated an asynchronous response..."` messages throughout (extension noise, unrelated to the app) — no React/runtime error overlay was seen at any point in the run.

## Case-by-case

**1. CREATE `> Sprint 1` → group.** Input cleared, a group card was rendered with grip / title "Sprint 1" / pencil / trash ("Delete group and its tasks") / collapse chevron, its own "Add a task..." input, and "0 of 0 completed" + 0% progress bar. PASS. Screenshot: `screenshots/01-group-created-sprint1.png`.

**2. CREATE `>Sprint 2` (no space) → group.** Same result, group "Sprint 2" created, input cleared. Confirmed via snapshot text immediately after submit (two groups present, both with grip/pencil/trash/chevron/own input). Later screenshots (`05-collapsed-sprint1-empty-sprint2-root-task.png`, `07-after-reload-persisted.png`) also show this group (later renamed, see case 10). PASS.

**3. EDGE — bare `>` and `>` + spaces-only.** Typed `>` alone into the main input and clicked Add: `input.value` remained `">"` (not cleared) and the group count on screen stayed at 2 (no group created). Repeated with `">   "` (three trailing spaces): `input.value` remained `">   "` and group count stayed at 2. Both variants confirm nothing is created **and** the input is deliberately not cleared, matching the binding decision. PASS (both sub-cases).

**4. PLACEHOLDER.** Main input placeholder reads `"Add a task... (use > to create a group)"` — explicitly mentions the `>` prefix. PASS.

**5. 3 tasks inside Sprint 1's own input.** Added "Design mockups", "Write tests", and `"> Deploy to staging"` (this third one typed with a literal `>` prefix inside the *group's* own input). All three rendered using the full unified task-item component (grip, play/stop, pencil, trash, "Notes", alert-minutes select; timer + debug-timer + complete-check appear once a task's timer has been started, verified in case 6/12). Typing `>` inside the group-level input did **not** create a nested group — it produced a plain task literally titled `"> Deploy to staging"`, confirming group nesting is out of scope and not accidentally triggered. PASS. Screenshot: `screenshots/02-sprint1-3-tasks-added.png`.

**6. COMPLETE one of the 3 group tasks.** Started the global pomodoro timer, started "Design mockups"'s own timer (required — task play is blocked otherwise, inherited trap from step 01/02), then clicked "Mark as complete". Group counter updated to "1 of 3 completed" with a 33% progress bar, and "Design mockups" disappeared from the group's visible child list while still counting toward the "of 3" denominator (only "Write tests" and `"> Deploy to staging"` remained visible). PASS. Screenshots: `screenshots/03-parallel-timers-in-group.png` (before completing), `screenshots/04-one-completed-33pct.png` (after).

**7. ROOT COEXISTENCE.** Created a plain task "Root level task" (no `>`) at the main input level. It rendered as its own root-level task item in the nivel-1 list, alongside the "Sprint 1" and "Sprint 2" group cards (task → group → group → task ordering all visible in the same list). PASS. Screenshots: `screenshots/05-collapsed-sprint1-empty-sprint2-root-task.png`, `screenshots/07-after-reload-persisted.png`.

**8. EMPTY GROUP VISIBILITY.** "Sprint 2" (0 children) remained visible on screen the entire run — never hidden by an empty-list gate — showing "0 of 0 completed" and a 0% progress bar, with its own "No tasks yet." placeholder in the (empty) child-list area. PASS. Screenshots: `screenshots/05-collapsed-sprint1-empty-sprint2-root-task.png`, `screenshots/06-before-reload-full-state.png`.

**9. COLLAPSE.** Clicked Sprint 1's collapse chevron: the child task list *and* its "Add a task..." input both disappeared from the DOM, while the header ("Sprint 1"), the "1 of 3 completed" count, and the 33% progress bar remained visible. Clicked the chevron again: children ("Write tests", `"> Deploy to staging"`) and the "Add a task..." input reappeared. PASS. Screenshot: `screenshots/05-collapsed-sprint1-empty-sprint2-root-task.png` (collapsed state).

**10. EDIT GROUP TITLE.** Clicked the pencil on "Sprint 2"'s header, which swapped the row for an inline edit input pre-filled with "Sprint 2" (shared `IndexEditInput`, same component used by tasks). Changed the value to "Sprint 2 Renamed" and clicked the save (check) button — no `>` re-entry was required, and the group re-rendered immediately with the new title, confirmed to persist through the later reload (case 13). PASS.

**11. DELETE GROUP.** To exercise deletion with real orphan risk (Sprint 1/2 needed to survive intact for the reload case), created a throwaway third group `"Temp Group"` with one child task `"Temp child task"`, then clicked its trash ("Delete group and its tasks"). Both the group and its child disappeared from the DOM; cross-checked directly against `localStorage:timertasks:tasks` afterward — neither `"Temp Group"` nor `"Temp child task"` remained anywhere in the stored array (no orphaned root task with the child's title). PASS.

**12. PARALLEL TIMERS (in-group).** Started the timer on "Design mockups" then, while it kept running, started the timer on "Write tests" (same group, "Sprint 1"). Both showed "Running" simultaneously with independently advancing counters (e.g. 00:12 vs 00:06 in one snapshot, still diverging afterward), confirming grouping did not break the inherited step-02 multi-run behavior. PASS. Screenshot: `screenshots/03-parallel-timers-in-group.png`.

**13. RELOAD.** Before reload, state was: `Task Alpha` (pre-existing leftover, root, completed) → `Sprint 1` (collapsed=true, children: Design mockups[completed]/Write tests/`"> Deploy to staging"`) → `Sprint 2 Renamed` (0 children, expanded) → `Root level task` (root). Reloaded the page, redid the Notification-permission override in the fresh JS context (worked, no permission gate shown). Post-reload: **Sprint 1** still collapsed (chevron pointing down, "1 of 3 completed"/33%, no child list/input visible), **Sprint 2 Renamed** still shows its persisted rename with 0 children, **Root level task** still present, and the item order (group → group → task) is unchanged. Groups, children, order, and collapse state all survived the reload intact. PASS. Screenshot: `screenshots/07-after-reload-persisted.png` (compare to `screenshots/06-before-reload-full-state.png`).

## Not run

**14. DnD — three specific cases not exercised:**
- Reorder two groups relative to each other (drag "Sprint 1" past "Sprint 2").
- Reorder two children within the same group (drag "Write tests" past `"> Deploy to staging"` inside "Sprint 1").
- Confirm a child cannot be dragged out of its group into another group or to root (cross-group move impossible).

Reason: dnd-kit requires real OS-level pointer-capture to drive its sensors; this was confirmed non-automatable in this environment during steps 01 and 02 of this same task (neither Playwright MCP's `browser_drag` nor synthetic `PointerEvent` sequences trigger dnd-kit's drag lifecycle here). Per the delta instructions, no new automation approach was attempted for this case, and this gap did not block the rest of the verdict.
