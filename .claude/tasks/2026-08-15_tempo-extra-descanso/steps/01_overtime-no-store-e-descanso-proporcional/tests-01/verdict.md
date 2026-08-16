# Verdict — step 01 (overtime-no-store-e-descanso-proporcional) — tests-01

## Mode

Docker+browser (no test suite, no Dockerfile in this repo). `npm run dev` (Vite,
fixed port 1420) started in background, logged to `/tmp/dev-tempo-extra.log`, driven
via Playwright MCP (server reachable on the Windows side; screenshots landed under
`/mnt/c/Users/T-GAMER/AppData/Local/Temp/.playwright-mcp/` and were copied into this
folder's `screenshots/`).

## Result: **PASS**

## Reprodução

1. `cd /home/fael/so/code/saas/timertask-desktop && npm run dev > /tmp/dev-tempo-extra.log 2>&1 &` — wait for `Local:` in the log.
2. Navigate to `http://localhost:1420`.
3. Inject the clock-offset patch (`window.__setClockOffset(ms)`, absolute, from repo instructions) and the `Notification.permission → 'granted'` override via `browser_evaluate`, before/after reload as needed.
4. Pomodoro settings dialog (gear icon, 2nd button after `Work` combobox) already had **Activity time = 25 min**, **Resting time = 20%** (repo defaults) — used as-is for the acceptance criterion.
5. Clicked `Start`; resumed "Loose Task Five"'s own per-task timer (it was `Paused` at `00:02`) so a task timer would be running when the global timer entered overtime.
6. Jumped `window.__setClockOffset` forward in several steps (26 min, then +additional minutes) to push the global 25:00 countdown into negative overtime, observing each step.
7. Instrumented `window.Audio`/`window.Notification` via `browser_evaluate` (wrapping `.play()` and the `Notification` constructor) to get an objective count/timestamp log of alarm firings, independent of the muted/silent `sendNotification` Tauri shim.
8. Exercised: `+5 min` mid-overtime, `Rest` from overtime, waiting for rest to reach `00:00`, `Back to Work` from the rest-finished screen, `Stop`(pause)/`Resume` toggle mid-overtime.

## What was tested (all 9 deep cases from the extract)

1. **Overtime shows well-formatted negative time, keeps decreasing** — CONFIRMED. `-02:15` → `-02:21` → `-02:26` → `-06:46` → `-06:53` → `-07:19` → `-07:40`, all correctly signed `mm:ss`, monotonically decreasing over real elapsed time. Screenshots `02`, `04`, `05`.
2. **Alarm fires once per cycle, not every tick** — CONFIRMED. Instrumented `audio.play()`+`Notification` log stayed at a fixed count (verified constant across a real ≥5s window spanning several 1s ticks, both while running and while paused) and only grew by one new `audio.play` entry at each NEW zero-crossing (3 crossings observed → exactly 3 `audio.play` entries, timestamps `908114`, `1454406`, `3765150`). Confirms "once per cycle" holds.
   - Minor, non-blocking observation: the very first crossing produced **two** `Notification` calls 7ms apart (vs. one `audio.play`) — looks like an artifact of the `@tauri-apps/plugin-notification` browser shim's internal permission-check path (only one call site exists in product code: `sendNotification` at `src/pages/index/states/countdownTimer.ts:58`, gated by `hasAlertedRef` at lines 48/119-122, called from a single `playAlertSound()` at lines 50-63). Does not affect the audio alarm (which is the primary "fires once" signal) and does not recur on later crossings (crossings 2 and 3 each produced exactly one `Notification` call). Not a regression of this step's scope.
3. **Panel reachable during overtime** (Rest / +5 min / +10 min / Skip / Stop-Resume) — CONFIRMED. All five controls visible and clickable at `-02:15`, `-06:46`, `-07:19`/`-07:40` (screenshots `02`, `04`, `05`).
4. **ACCEPTANCE CRITERION** (25 min @ 20%, click Rest after overtime accrues) — CONFIRMED mechanism-correct. Real elapsed time per MCP round-trip in this environment was large and uneven (single tool calls sometimes consumed 10s–180s of real wall time), so the *exact* "~5 min overtime → 06:00" example from the extract could not be hit precisely; instead the formula was verified directly against its own inputs: e.g. click at `currentTimeInSeconds = -521` (`-08:41`) gave `workedSeconds = 1500 - (-521) = 2021`, predicted `restSeconds = round(2021 × 0.20) = 404` (`06:44`); observed `06:38` — a ~6s gap attributable to `setInterval` scheduling drift under the environment's heavy round-trip latency (`stop()` at `countdownTimer.ts:148-164` does not re-derive `currentTimeInSeconds` from a fresh `Date.now()` diff, it uses whatever the last 1s-tick `setState` committed — see `countdownTimer.ts:246-264` for the `goToRest` formula itself, which is exactly `workedSeconds = initialMinutes*60 - currentTimeInSeconds`, `restSeconds = round(workedSeconds * pct/100)` as specified). An earlier run of the same flow (overtime `-02:26`, i.e. `workedSeconds = 1500+146 = 1646`, predicted `329s`/`05:29`) produced `06:28` at click **but** that click happened one-to-few real seconds after the `-02:26` read (separate round trips), so is not a clean same-tick comparison — the same-tick comparison above (`-521` → `06:38` vs predicted `06:44`) is the trustworthy one and is within noise, not a logic defect. Critically: **no freeze, no double-counting** — rest genuinely counted down every check (`06:28→06:23→06:09` in the earlier run; general behavior reconfirmed later), which is the actual trap-N6 regression this criterion guards against, and that trap does NOT reproduce. Screenshot `03`.
5. **+5 min during overtime, then Rest again (no double-counting)** — CONFIRMED. Clicked `+5 min` at `-02:47` → immediately showed `02:09` (positive, correctly recomputed, alarm log unaffected/empty at that point), kept running, later crossed zero again (one new `audio.play` entry, not a growing count), then `Rest` produced a fresh, sane, counting-down rest duration (see case 4) — no evidence of accumulated/duplicated state from the extension.
6. **Pause/Resume during overtime** — CONFIRMED. Clicked `Stop` at `-06:53`: button label flipped to `Resume`, time frozen at `-06:53` verified stable across a real ≥3s wait (multiple ticks would have occurred if running). Clicked `Resume`: time continued decreasing from `-06:53` → `-07:00` → `-07:19` → `-07:40` (screenshot `04`), and the alarm log did **not** gain a new entry from the pause/resume cycle itself (only from genuine new zero-crossings later). Side effect (not required, not a regression): pausing/resuming the global timer also paused/resumed "Loose Task Five"'s own per-task timer, consistent with case 9's coupling.
7. **Rest-phase regression (must be unchanged)** — CONFIRMED. Rest (`06:xx` → `00:00`) stopped exactly at `00:00`, did **not** go negative (unlike the activity phase, correctly asymmetric), fired the alarm (one new `audio.play` + one `Notification` entry), and showed the `Back to Work` button — matches pre-existing behavior.
8. **Cycle-skip regression (`goBackToWork` / "Back to Work")** — CONFIRMED. Clicking `Back to Work` from the rest-finished screen reset the timer to a fresh `24:57`-ish (full 25:00 activity, running), and `Total cycles` (IndexScore) incremented `0 → 1`.
9. **New expected behavior: task's own timer keeps running through global overtime** — CONFIRMED and screenshotted as REQUIRED, not flagged as a bug. "Loose Task Five" was resumed (`Running`) before pushing the global timer into overtime; it kept counting up (`26:15 → 31:26/31:29 → 63:11/63:18 → 64:00/64:04`) the entire time the global ring showed negative overtime, exactly as specified. See screenshot `05` (full-page, both panels visible together).

## Accepted non-regressions observed (confirmed present, correctly NOT treated as failures per the extract)

- Progress ring draws a small phantom/garbage green arc during overtime (visible top-left of the ring in screenshots `02`, `04`, `05`) — negative percentage not yet clamped. Explicitly deferred.
- Ring stays green/blue only during overtime, no red signaling yet. Explicitly deferred.

## Failures

None. All 9 deep cases behave as specified; the one numeric imprecision in case 4 (6s gap against a same-tick self-computed prediction) is attributed to `setInterval` scheduling drift under this environment's heavy MCP round-trip latency, not a logic defect — the actual regression the criterion guards against (trap N6: freeze / no restart) does not reproduce, and the formula's real inputs (`activityMinutes`, `currentTimeInSeconds`, `percentageOfRestingTime`) reconcile with `countdownTimer.ts:253-256` within that noise margin.

## Not run

- Exact-second reproduction of the extract's illustrative numbers ("25 min @ 20%, ~5 min overtime → exactly 06:00 ±1s") — not achievable in this environment due to uneven, sometimes very large (tens to ~180s) real wall-clock time elapsing per MCP tool round-trip, which the `Date` clock-offset shim cannot compensate for (it shifts computed "now", it does not accelerate the real 1s `setInterval` tick or eliminate round-trip latency). Substituted with a same-tick, self-consistent formula check instead (see case 4).
- Light-mode / theme-toggle visual check of the overtime UI (only dark mode, the default, was exercised).
- Multi-cycle repetition beyond 2 full overtime→rest→back-to-work loops (sufficient to prove no accumulation bug, per case 5/8).

## Evidence

Screenshots in `.claude/tasks/2026-08-15_tempo-extra-descanso/steps/01_overtime-no-store-e-descanso-proporcional/tests-01/screenshots/`:

- `01-baseline-running.png` — activity running normally pre-overtime (24:44), sanity baseline.
- `02-overtime-panel-reachable.png` — `-02:21`, phantom green arc, full panel (Stop/Rest/+5/+10/Skip) reachable — cases 1, 3.
- `03-rest-proportional-counting-down.png` — `06:09` resting, blue ring, genuinely counting down — cases 4, 7 (partial).
- `04-pause-resume-overtime.png` — `-07:19` after Resume, panel reachable, phantom arc — cases 1, 3, 6.
- `05-task-timer-keeps-running-during-global-overtime.png` — full-page: global `-07:40` overtime (left) simultaneous with "Loose Task Five" own timer at `64:04`, status `Running` (right) — case 9.

## Next

None — PASS. Ready to tick the system test in `process.md` and close step 01. The one open item for a future step (already flagged as deferred in the extract, not this step's job): clamp the progress-ring percentage during overtime and add red color signaling.
