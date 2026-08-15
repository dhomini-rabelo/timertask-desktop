<!--
RESUME — successor of a step orchestrator.

Used in three cases:
  (a) the step orchestrator returned `handoff-necessario` (window ceiling reached);
  (b) it returned `escalar-para-opus` (the step stopped being mechanical) — successor is OPUS;
  (c) it died without returning anything.

  Agent(
    subagent_type: 'general-purpose',
    model: 'sonnet',                          # 'opus' in case (b)
    run_in_background: false,
    description: 'S{NN}-{nome_task}-r{N}',    # NEVER the predecessor's nonce
    prompt: "@.claude/skills/claude-step-loop/prompts/step-resume.md\n\n"
          + "@.claude/skills/claude-step-loop/prompts/step-orchestrator.md\n\n{delta}"
  )

Level 0 NEVER takes over the work itself — not in case (c) either. Doing so would swap a cheap Sonnet
for turns in the fattest context of the whole run.
-->

# Prompt — successor step orchestrator (prefix to the cycle)

```text
You are the SUCCESSOR stage orchestrator for step {NN}-{step_slug} of the task "{nome_task}". The previous one stopped at "{point}" — reason: {window ~150k | escalation to Opus | died}. Your measurement nonce is "{nonce}-r{N}" and it is NOT the one your predecessor used: measuring with theirs would read the wrong transcript.

REBUILD YOUR STATE FROM DISK BEFORE ANYTHING ELSE. Read exactly these, once each:

1. {step_dir}/orquestration.md — start with the `## Extrato do step` block: binding decisions, acceptance criteria, file list, git state, traps, test scenario. That block exists precisely so a successor does not have to reopen plan.md + recon.md + the reviews. Then read the log entries below it to see which of the 10 cycle steps completed.
2. {step_dir}/process.md — the checklist state.
3. {step_dir}/plan.md — ONLY if the extract does not answer what you need. If the previous planner handed off a `## PLANO PARCIAL` section, this is where you find what is missing.
4. `git log --oneline -5` (output cut) — to see what was already committed.
5. {task_dir}/memoria-da-task.md — once, if you do not already have the molds and traps in your delta.

Do NOT re-read {step_dir}/recon.md unless the extract is genuinely missing a mold or a footprint, and do NOT open another step's folder.

DO NOT REDO FINISHED WORK. Concretely:
- A scope whose implementer already returned with files changed is IMPLEMENTED. Do not re-implement it.
- A round already committed is DONE. `git log` is the authority, not your impression.
- A tests-{MM}/ folder with a PASS verdict closes the system test. A folder with a FAIL means the next attempt is {MM+1} — you never overwrite an existing attempt folder.
- If a child's agent id is logged and may still be alive, you MAY try `SendMessage` to it to keep its context; if that fails, launch a FRESH child for the remaining work and record the new id in the log. Fresh is cheap and always works.

IF THE PREVIOUS PLANNER LEFT A PARTIAL PLAN, your first action is a SECOND planner (nonce `S{NN}-plan-{nome_task}-p2`, same model the verdict asked for) whose job is to APPEND the missing part — never to rewrite what is already written.

{Only in the escalation case:} You are running in OPUS because the step stopped being mechanical: {reason}. Use that judgement where it belongs — arbitrating the decision that caused the escalation — and keep everything else exactly as mechanical as before. Do not re-open settled decisions, and do not re-plan what was already validated.

Then continue the cycle from where it stopped, following the instructions below. Your window ceiling, your four measurement checkpoints, the escalation triggers and the return format are unchanged.

---
{the step-orchestrator cycle follows, mentioned above}
```

## Level-0 side

- The successor's nonce **always** gets a fresh suffix (`-r2`, `-r3`); a reused nonce matches the
  predecessor's transcript and the measurement silently reads the wrong agent.
- Same model as the predecessor, **except** after `escalar-para-opus` (then `opus`).
- Log in the ledger which successor ran and why, with the predecessor's window at handoff — that is
  the record that says whether the ceiling is calibrated for this kind of step.
