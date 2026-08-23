# Browser instructions (Claude Code)

How to drive the **Playwright MCP** browser, save screenshots into task folders, and run **deep** UI system tests for `claude-simple-loop` / `claude-step-loop`.

Environment notes assume Claude Code with the repo in WSL2 and the Playwright MCP server reachable at `http://localhost:8932/mcp` (see [.claude/agents/browser-tester.md](../agents/browser-tester.md)).

## When this applies

- Any system-test stage that opens a real UI.
- Saving evidence under `.claude/tasks/.../tests-{NN}/screenshots/`.
- Deciding PASS / FAIL for panel / form / navigation flows.

Orchestrators must point the browser tester at **this file** in the Agent prompt (path: `.claude/docs/browser-instructions.md`).

## Who drives the browser

- Use `subagent_type: browser-tester` (model `sonnet` for loop test stages). That agent definition carries the Playwright MCP server config **and** the app credentials — the main session does not have those MCP tools.
- Do not try to drive the browser from level-0 chat; launch the subagent.
- If the MCP server is unreachable, report a blocker with the connection error instead of faking a verdict.

## Connection hygiene (extension mode)

The MCP server runs **on the Windows host**, started manually with
`npx @playwright/mcp@latest --port 8932 --host 0.0.0.0 --extension`, and drives the user's real
Chrome through the Playwright Extension. In that mode **every new MCP client session pops an
approval dialog** in the browser (`"…" is trying to connect to the Playwright Extension`). Churn
there is the single most disruptive failure mode of a test run — the user sees a dialog storm and
stray `Welcome` tabs.

Rules:

- **One `browser-tester` per test run.** Do not launch a second one "to retry"; continue the live one
  with `SendMessage`. A respawn = a new client session = a new dialog.
- **Never call `browser_close`** (nor `browser_install`). Closing ends the extension session, so the
  next tool call reconnects and asks for approval again. Leave the tab open at the end of the run —
  the "clean state" rule below means *navigate back / clear what you created*, not close the browser.
- **Reuse the tab that is already there.** `browser_tabs` (`action: "list"`) first; the app tab
  (`Timertasks`, http://localhost:1420) is usually already open. Do not open a tab per case.
- **Do not restart the app server.** Probe it first —
  `timeout 5 curl -s -o /dev/null -w "%{http_code}\n" http://localhost:1420/` — and reuse it on
  `200`. `strictPort: true` makes a second `npm run dev` fail anyway.
- **One retry, then stop.** If a `browser_*` call returns a connection error, retry **once**; if it
  fails again, write the blocker into `verdict.md` and return. Never loop on reconnects.
- Human-side bypass (ask the user once, do not try to do it from WSL): restart the server with
  `PLAYWRIGHT_MCP_EXTENSION_TOKEN=<token from the dialog>` set, so the approval dialog stops
  appearing.

## MCP capture flow

1. Playwright MCP tools may be deferred — resolve their schemas (`ToolSearch` with `select:browser_navigate,browser_snapshot,…`) before calling them.
2. `browser_tabs` (`action: "list"`) to see existing tabs; reuse a tab instead of piling up new ones.
3. `browser_navigate` to the URL, then `browser_snapshot` to confirm URL/title and get element refs.
4. Interact via snapshot refs (`browser_click`, `browser_type`, `browser_fill_form`, `browser_select_option`, `browser_press_key`). Prefer refs over coordinates.
5. `browser_wait_for` (text appears/disappears) instead of arbitrary sleeps when waiting on revalidation or toasts.
6. `browser_take_screenshot` with an explicit `filename` (e.g. `03-save-success.png`).
7. `browser_console_messages` when a page misbehaves — console/runtime errors belong in `verdict.md`.
8. Leave the browser in a clean state at the end of the run (`browser_close` if you opened throwaway tabs).

## Where screenshots land

`browser_take_screenshot` returns the **absolute path** of the saved file — read it from the tool result, don't guess. Playwright MCP writes into its output dir, by default `<os-temp>/playwright-mcp-output/<timestamp>/`.

- Server running under Linux/WSL: `/tmp/playwright-mcp-output/<timestamp>/<filename>.png`
- Server running under Windows: the reported path looks like `C:\Users\<USER>\AppData\Local\Temp\playwright-mcp-output\...` — from WSL the same file is `/mnt/c/Users/<USER>/AppData/Local/Temp/playwright-mcp-output/...`

Copy into the current test attempt, for example:

```bash
cp "/tmp/playwright-mcp-output/<timestamp>/03-save-success.png" \
  "/home/fael/{repo-path}/.claude/tasks/{YYYY-MM-DD}_{nome_task}/tests-01/screenshots/03-save-success.png"
```

For `claude-step-loop`, the destination is under `steps/{NN}_{step_slug}/tests-{MM}/screenshots/`.

### Practical tips

- Always pass `filename` so the path is predictable and the case is identifiable.
- Confirm the copy with `ls -la` on the destination.
- Broad `find` under `$HOME` for screenshot names is slow; go straight to the reported output dir.
- Commit PNGs when they are task evidence; skip one-off local probes.
- Some sites serve CAPTCHA / unusual-traffic pages to automated browsers; retry once, then report a blocker.

## Depth requirements (browser system tests)

Shallow smoke ("page opened, one happy click") is **not enough** when the change touches forms, CRUD, validation, session, or multi-step UI. Exercise the flow the way a careful user would.

### Always cover (when the feature has them)

| Area | What to prove |
|------|----------------|
| Create | Empty / invalid submit → friendly errors (no Next.js / runtime error overlay). Valid submit → success feedback + correct persisted UI state. |
| Edit / re-save | Open existing record; change fields; save again. Empty required secrets/password fields on edit (if the product requires re-entry) must show **friendly** validation, not a raw server error. |
| Delete / remove / clear | Confirm success message stays visible after revalidation; fields/lists update; no leftover error banners from a previous failed save conflicting with success. |
| Layout / usability | Inputs stay aligned when only some fields show errors; buttons stay usable while pending; labels/language match the product (this panel uses English). |
| Navigation | Back links, list → detail → back, switch-context (if in scope) still work after the change. |

### Lesson from `fx-link-friendly-required-fields`

A happy-path-only smoke missed real user breakage:

- Edit/save with empty API key/secret threw a **Next.js Runtime AppError** instead of form validation.
- Remove success banner disappeared after revalidate (gated on linked state).
- Stale save validation errors stayed visible next to remove success.
- Field row jumped when only one field had an error (`items-end`).

Browser tests must include **edit** and **remove** (and similar secondary actions), not only first-time create. Prefer one screenshot (or named step) per distinct outcome: validation, success, edit-validation, remove/clear, and any layout-sensitive case.

### PASS / FAIL bar

- **PASS** only if required cases from the plan / acceptance criteria were exercised **and** screenshots (or equivalent evidence) exist in the attempt folder.
- **FAIL** if: a runtime overlay appears for an expected validation path; success feedback is missing or vanishes incorrectly; form state is wrong after edit/delete; layout breaks usability for the case under test; or only the happy path was checked when create/edit/delete were in scope.
- Report concrete failures in `verdict.md` (what you did, what you saw, which screenshot). Do not mark PASS with "minor" usability breaks that contradict acceptance criteria — those are FAIL or must be fixed before PASS.

### Orchestrator prompt obligations

When launching `browser-tester` (or any agent that drives the UI), the prompt must:

1. Link/require `.claude/docs/browser-instructions.md`.
2. List the **deep** cases to run (create / edit / delete / validation / success), not only "open the page".
3. Require screenshots copied into `tests-{NN}/screenshots/` and named per case.
4. Forbid PASS on happy-path-only when edit/remove (or equivalent) are in scope.

## Anti-patterns

- One screenshot of a loaded page and calling it done.
- Ignoring edit and delete because create worked.
- Leaving evidence only in the Playwright MCP output dir.
- Accepting a Next.js error overlay as "the server rejected it" when the product should show inline/banner validation.
- Stopping after the first anomaly without capturing a screenshot of the failure.
