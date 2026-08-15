<!--
CHILD PROMPT — TESTER, new round. FRESH AGENT, always.

Two situations use this file:
  (a) the previous attempt returned FAIL, the implementer fixed it, and this is tests-{NN+1};
  (b) the previous tester returned `handoff-necessario` and this agent finishes the SAME attempt.

  Agent(
    subagent_type: 'browser-tester' | 'general-purpose',
    model: 'sonnet',
    run_in_background: false,
    description: 'test-{nome_task}-{mode}-r{NN}',       # (b) adds -r2 / -r3 to the SAME NN
    prompt: "@.claude/skills/claude-simple-loop/prompts/tester.md\n\n"
          + "@.claude/skills/claude-simple-loop/prompts/tester-retry.md\n\n{delta}"
  )

WHY FRESH. A tester that carries three rounds of history re-reads all of it on every turn: measured,
that agent closed at a 197k window and was the single most expensive agent of its group (US$ 30).
The channel between rounds is the previous `verdict.md` on disk — cheap, complete, and it survives
the agent.
-->

# Prompt — tester, new round (delta on top of `tester.md`)

```text
Both files mentioned above ARE your instruction set: the first one is the full tester contract (wait rules, depth requirements, disk-as-channel — all of it applies to you unchanged), and this one is the delta for a NEW ROUND. If their content did not arrive expanded, read each ONCE with `Read`.

THIS IS NOT THE FIRST ROUND. Read exactly ONE file to pick up where the previous round stopped:

  {task_dir}/tests-{previous NN}/verdict.md

That file is your handoff: it has what was already exercised and passed, what failed, the reproduction header, and — if the previous tester ran out of window — a `## Handoff` section with what is left and which servers were up on which ports. Read it ONCE. Do NOT read the earlier rounds before it, do NOT read the plan, and do NOT re-derive the scenario: whatever is not in that file is in the delta below.

WHAT CHANGED SINCE THAT ROUND (from the orchestrator):
{one line per fix applied, with file:line}

WHAT YOU MUST DO, in this order:
1. RE-EXERCISE EVERY CASE THAT FAILED in the previous round. These are the reason this round exists.
2. RE-EXERCISE THE CASES THE FIX COULD HAVE BROKEN — the fixed files' neighbours in the flow. A fix that repairs case A and breaks case B is the failure mode this step exists to catch.
3. RUN WHAT WAS NEVER RUN, if the previous verdict lists cases as not-run or hands off unfinished work.
You do NOT need to re-run cases that passed before and are untouched by the fix. Say explicitly in verdict.md which ones you carried over as previously-passed, and why that is safe.

YOUR VERDICT FOLDER IS {task_dir}/tests-{NN}/ — it already exists, and you never overwrite a previous round's folder. Write {task_dir}/tests-{NN}/verdict.md with: the mode, the result, what you re-exercised, what you carried over, the failures with `file:line` leads, and the screenshot paths under this round's `screenshots/`.

IF IT FAILS AGAIN ON THE SAME CASE, say so in the first line of verdict.md — `FAIL (mesma causa da rodada {previous NN})`. A failure repeating on the same case is a signal that the fix targeted the symptom, and the orchestrator needs that stated, not softened.

Everything else — the forbidden ways of waiting, the one correct wait form, hot-server reuse, kill-then-use in separate blocks, verbose output to a file, the search cut, not fixing the code yourself, disk as the delivery channel, no AskUserQuestion — is in the tester contract above and applies to you exactly as written.
```

## Round hygiene

- **One folder per attempt**, `tests-{NN}`, never overwritten. `NN` increments on every retest.
- **The verdict is the handoff.** Anything a later round needs must be in `verdict.md`: the reproduction header, the state reached, the ports in use, the cases carried over.
- **Three consecutive FAILs on the same case** stops being a test problem and becomes a plan problem: the orchestrator sends it back to the planner as a re-design, not another fix round, and records that decision in `orquestration.md`.
