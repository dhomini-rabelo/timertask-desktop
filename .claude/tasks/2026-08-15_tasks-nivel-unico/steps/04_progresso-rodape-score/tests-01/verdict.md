# Verdict — step 04 `progresso-rodape-score`, tests-01 (browser)

**Result: PASS**

Repo `/home/fael/so/code/saas/timertask-desktop`, branch `main`, commit `a45e46a` (impl `b4b36c7`).
App: reused an already-running Vite dev server on `http://localhost:1420` (was up before this run
started; not stopped at the end since this run did not start it). No notification-permission screen
ever blocked interaction in this session (the Chromium permission for this profile/context was already
granted from prior steps); the `Notification.permission`/`requestPermission` override from
`browser-instructions.md` was still applied after every reload as a precaution.

Screenshots: `.claude/tasks/2026-08-15_tasks-nivel-unico/steps/04_progresso-rodape-score/tests-01/screenshots/`

Scenario built live through the UI (not via localStorage fixture, since cases 1-2 explicitly exercise the
UI creation flow, and a `beforeunload` handler re-persists in-memory state on any `localStorage.clear()` +
navigate, so a fixture-before-hydration approach would have fought the app rather than helped). Workflow
**Work** = A, workflow **Personal** = B. Both pre-existed with contaminated leftover data from earlier
steps; cleared via the app's own **Reset** button before building the fresh scenario (not counted as the
case‑11 test — that reset is exercised again, deliberately, at the end).

## Case-by-case

1. **Nível único** — PASS. Created "Loose task 1"/"Loose task 2" via the main input. Each shows its own
   play/complete/edit/delete/Notes/alert controls; no chevron navigates to a second page; no "active by
   position" green border. Page heading is exactly "Tasks".
   Screenshot: `01-02-nivel-unico-e-grupo.png`.
2. **Grupo via prefixo `>`** — PASS. `>` alone and `>` + spaces created nothing and did **not** clear the
   input (verified `input.value` stayed `>` / `>   ` after clicking Add). `> Grupo X` created "Grupo X"
   with its own "Add a task..." input; added Child task 1/2/3, all 3 visible at level 1 inside the group.
   Screenshot: `01-02-nivel-unico-e-grupo.png`.
3. **Múltiplos cronômetros em paralelo** — PASS. With the global timer running, started "Loose task 1"
   (loose) and "Child task 1" (in-group) together; both showed "Running" and identical elapsed time
   (`00:38`) simultaneously, neither paused the other. Stopped both; `timeEvents` confirm parallel
   start/stop timestamps (`21:31:38.286` start for both, independent stops).
   Screenshot: `03-parallel-timers-running.png`.
4. **Progresso agregado no rodapé** — PASS, with a scope note. Root denominator correctly **excludes**
   the group at every point observed (never showed "of 6"). Final observed state: **3 of 5 completed
   (60%)** rather than the illustrative "2 of 5 (40%)" from the prompt, because one extra task (Child
   task 3) was completed while investigating how the "complete" control works (see note under case 7).
   The math is internally consistent (group 2/3=67%, root 3/5=60%, denominator unaffected by the group) —
   same feature, different absolute numbers than the example.
   Screenshot: `04-05-06-aggregate-and-group-progress.png`.
5. **Progresso próprio do grupo** — PASS. "Grupo X" shows "2 of 3 completed" / 67%, coexisting with the
   root "3 of 5 completed" / 60%. Same screenshot as above.
6. **Concluídas saem da lista e vão para o accordion** — PASS. Completed tasks (Loose task 1, Child task
   1, Child task 3) disappeared from the live list; clicking "3 of 5 completed" opened the accordion
   listing exactly those 3. Screenshot: `07-accordion-group-badge-and-08-notes-dialog.png`.
7. **Badge de grupo no accordion** — PASS. In the accordion: "Loose task 1" shows **no badge**; "Child
   task 1" and "Child task 3" both show a **"Grupo X"** badge. Start/End/Duration are coherent with the
   tracked time (Child task 1: two segments, `18:31:38→18:32:24` then `18:35:35→18:35:39`, Duration
   `00:50`, matching the ~46s parallel run from case 3 plus a short resume-and-complete). Expanding the
   chevron on Child task 1 showed the full event timeline: `start 18:31:38 / stop 18:32:24 / start
   18:35:35 / complete 18:35:39`. Screenshots: `07-accordion-group-badge-and-08-notes-dialog.png`,
   `07b-timeline-expanded.png`.
   **Bônus not reproduced as literally worded**: the "Complete" (checkmark) control only renders while a
   task `isRunning === true` — an idle/never-started task exposes only Play/Edit/Delete/Notes, no
   checkmark. Clicking Play always immediately records a `start` timeEvent (confirmed via
   `localStorage`), so there is no UI path to mark a task complete without at least one recorded start —
   "never started + completed" is not reachable this way. Closest reachable analog: Child task 3 was
   started and completed via this control, ending up with a real (short, ~9s) tracked duration, not "No
   time tracked". This is a UX/architecture observation for the implementer, not a required-blocking
   failure of this step's deliverable (the prompt explicitly marks it "Bônus").
8. **Nota** — PASS. Opened the Notes dialog for the completed "Child task 1" via its card icon, typed a
   note, "Save Note" → "Saved" confirmed, and it persisted in `localStorage` (`task.note` field). No
   separate "Notes" panel exists anywhere in the footer/accordion — confirmed by full-page screenshots
   and DOM search; only the per-task dialog. `src/pages/index/components/IndexTasks/IndexActiveTasksList/
   IndexTaskNote.tsx` (old file) does not exist; `IndexTaskNoteDialog.tsx` (current, working) does.
   Screenshot: `07-accordion-group-badge-and-08-notes-dialog.png`.
9. **Persistência** — PASS. Reloaded the page (re-applied the notification-permission override
   immediately, none needed in practice). After reload: group "Grupo X", its children, the 3 completed
   tasks with their exact durations and "Grupo X" badges, and "3 of 5 completed / 60%" all survived
   identically. Screenshot: `09-persistence-after-reload.png`.
10. **`IndexScore` contra os dados manipulados** — PASS. Cross-workflow summation demonstrated
    concretely: while the **Personal** workflow was selected (itself showing "0 of 1 completed"), the
    score cards still showed **"3 tasks" / "2m"** — i.e. entirely from workflow Work. After completing
    Personal's own task ("Personal task B1", ~10s tracked), the cards updated to **"4 tasks" / "3m"**
    while Personal was selected — confirms the score sums both workflows, as documented as expected/
    accepted. No FOCUSED TIME zeroing or lost time observed at any point. The "uncheck-then-recheck still
    counts" quirk was not specifically triggered (no task was uncompleted during this run), so it was not
    observed either way. Screenshot: `10-indexscore-cross-workflow-sum.png`.
11. **Reset escopado ao workflow** — PASS. On workflow Work (3 of 5 completed at the time), clicking
    Reset removed all of Work's tasks and the group ("No tasks yet. Add one above!", "0 of 0 completed").
    Switching to Personal showed its data fully intact ("Personal task B1", 1 of 1 completed, Duration
    00:10, 100%). Switching back to Work confirmed it stayed empty. TASKS COMPLETED correctly dropped
    from 4 to 1 (only Personal's completion remained) after the reset, confirming the score recomputes
    from the now-shorter task list rather than caching a stale cross-workflow total.
    Screenshot: `11-reset-scoped-to-workflow.png`.
12. **Varredura de resíduos** — PASS. Command and output:

    ```
    $ grep -rn --include='*.ts' --include='*.tsx' -E "subtasks|SubTask|inExecutionTaskId|nonActiveExpandedTaskId|TaskListingMode|getTaskListingMode|getActiveTask" src/
    src/pages/index/hooks/useStoredTasks.ts:11:interface LegacySubTask {
    src/pages/index/hooks/useStoredTasks.ts:30:  subtasks?: LegacySubTask[];
    src/pages/index/hooks/useStoredTasks.ts:70:  const subtasks = entry.subtasks ?? [];
    src/pages/index/hooks/useStoredTasks.ts:71:  if (subtasks.length > 0) {
    src/pages/index/hooks/useStoredTasks.ts:81:    const tasks: Task[] = subtasks.map((sub) => ({
    ```

    All 5 hits are in `useStoredTasks.ts`, the intentional legacy-migration shim. No hits elsewhere.

## `## Not run`

**Drag-and-drop (dnd-kit)**: reordering tasks within a group, within the root, and reordering groups
against each other. Confirmed 3x in prior steps (01/02/03) that neither `browser_drag` (Playwright MCP,
times out on "stable" because the timers re-render continuously) nor a synthetic `PointerEvent` sequence
(dnd-kit requires real OS-level pointer capture) can drive this in this environment. Per instructions, no
new automation attempt was made — recorded as not run for that established reason.

## Incidental findings (not step-blocking)

- A task's Play button is a no-op with a toast **"Global timer is not running"** if the workflow's own
  global Pomodoro timer hasn't been started yet — each workflow has its own independent global-timer
  state (confirmed: switching from Work, where the global timer was running, to Personal reset the
  global timer display to `25:00`/"Start"). Not part of this step's scope, just noted for awareness since
  it affects how any future browser test must sequence its actions (start the global timer for the
  workflow in view before starting any task).
- Completed tasks retain `isRunning: true` in storage even after completion (seen on every task completed
  in this run). Pre-existing quirk, already present in the leftover fixture data found at the start of
  this session (e.g. `Task Alpha`) — not introduced by this commit, not re-verified as a regression.
