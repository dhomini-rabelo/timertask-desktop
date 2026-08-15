<!--
FOLLOW-UP — plan notes after a FAILED system test (stage 4, fix loop).

Preferred form: `SendMessage` to the planner of this task — its context is intact, and this is a
short sequential chain over the same scope, which is exactly the case where reuse is the best deal.

Fresh planner instead when: the original planner is gone, OR its measured window is already above
~80k. Then launch with
  description: 'plan-{nome_task}-notes{NN}'
  prompt: "@.claude/skills/claude-simple-loop/prompts/plan-notes.md\n\n{delta with the file paths}"
and the fresh agent reads {task_dir}/plan.md + the failing verdict.md from disk — nothing else.
-->

# Prompt — plan notes after `tests-{NN}` FAIL

```text
The system test of the task "{nome_task}" FAILED on attempt {NN}. The verdict is on disk at {task_dir}/tests-{NN}/verdict.md — read it ONCE. It is the authoritative account of what failed; the failures there are facts, not opinions to re-litigate.

Your job is ONE thing: append a notes section at the BOTTOM of {task_dir}/plan.md. Do not rewrite the plan above it, do not restructure it, and do not silently change decisions that were already made — the history of the plan is part of the audit trail.

Append exactly this shape:

## Notes after tests-{NN} (FAIL)

- What failed: {one line per failure, each naming file:line where the verdict gives it}
- Root cause: {your diagnosis — the actual cause, not a restatement of the symptom; say "não identificada" if the verdict does not support one}
- What must be corrected: {concrete, actionable, one line each — an implementer must be able to execute it without asking you anything}
- Out of scope / do not change: {what must NOT be touched while fixing this, so the fix does not spread}

RULES FOR THE NOTES:
- Fix the CAUSE, not the symptom. If the verdict says a validation message never appears, the note says which handler/state is wrong — not "make the message appear".
- If the failure shows the PLAN was wrong (not the implementation), say so in one line under "Root cause" and correct the design in the notes. That is legitimate and it is why a planner writes this section instead of an implementer.
- NEVER weaken a business rule or delete a meaningful assertion to make the test pass. If the only way to green is to change what the feature does, that is a product decision — say so explicitly and stop; the orchestrator will take it to the user.
- If a scope's ready-prompt file at {task_dir}/prompts/{escopo-kebab}.md is now WRONG because of this, update that file too — the implementer is launched from it, not from the plan.

READING BUDGET: the verdict, the plan you already know, and at most 3 code files, opened with `Read` and `offset`/`limit`. Do NOT re-explore the project and do NOT re-run the recon — if you need something you do not have, say so in your return and the orchestrator will send you the snippet. Do NOT run the test suite, the type-checker or the linter, do NOT run `git status`/`git diff`, and do NOT write or edit any product code: an implementer applies these notes.

Do NOT spawn any agent. Never call AskUserQuestion — the only exception the orchestrator allows is the product-decision case above, and you signal that by returning it, not by asking.

DISK IS THE DELIVERY CHANNEL. Your final message may not reach the orchestrator. Append the notes to {task_dir}/plan.md (and update the scope prompt file if needed) BEFORE returning. Your final message is a POINTER, at most 8 lines: which file(s) you appended to, the root cause in one line, one line per required correction, and `escopo: {escopo-kebab}` naming which implementation scope must apply them.
```

## What the orchestrator does next

1. Commits the plan-notes update (its own stage commit).
2. Launches the fix round on the implementer that owns `escopo:` — see [`implementer.md`](implementer.md).
3. Re-validates **only if the fix is large**; a two-line fix goes straight to the next test attempt.
4. Opens `tests-{NN+1}` with a **fresh** tester — see [`tester-retry.md`](tester-retry.md).

**Three consecutive FAILs on the same case** is not a fix round any more: the orchestrator sends it
back for a re-design (fresh planner, reading the plan and every verdict), and records that decision
in `orquestration.md`.
