---
name: claude-step-loop
description: >-
  Multi-step orchestration: an Opus meta-planner splits work into grouped steps
  under .claude/tasks/.../steps/, asks all clarifying questions once, and writes
  the cross-step memory. Then each step is run end to end by its OWN stage
  orchestrator (Sonnet, level 1) through recon → plan → implement → validate →
  system test in tests-{MM}/ until PASS, with a measured 150k window ceiling,
  handoff-by-disk and escalar-para-opus as the safety net. Level 0 only
  dispatches and keeps a ledger. Use when the user asks for claude-step-loop,
  /claude-step-loop, or a multi-step multi-agent workflow.
---

# Claude Step Loop

Level-0 chat is a **pure dispatcher**. It runs the meta-planner once, then launches **one stage
orchestrator per step** and keeps a ledger of a few lines each. It never implements, never plans,
never reads a plan or a diff, and never absorbs a dead agent's work.

For stage mechanics **inside** a step, this skill and
[claude-simple-loop](../claude-simple-loop/SKILL.md) share the same child prompts — a step
orchestrator launches them straight out of `../claude-simple-loop/prompts/`.

## Trigger

User says `claude-step-loop`, `/claude-step-loop`, or asks for this multi-step multi-agent loop.

## Architecture: three levels, and why

Level 0's context is re-read on **every turn of the whole run**:

```text
cost of the orchestrator ≈ turns × average context × price of a cache read
```

A level 0 that walks every step itself accumulates the entire task in the most expensive place
available. So the orchestration context is made to **be born and die inside one step**:

1. **Level 0 — pure dispatcher** (Opus, this chat). Launches the meta-planner, then one stage
   orchestrator per step. Keeps a ledger. Conducts the single user stop.
2. **Level 1 — stage orchestrator, one per step** (`general-purpose`, **Sonnet**, ceiling ~150k).
   Owns its step start to finish: recon → plan → implement → validate → test → commit → close.
3. **Level 2 — work agents** (recon, planner, implementers, validator, tester). **None of them
   sub-delegates.**

Maximum depth is **3**. Measured in a comparable pipeline, the stage-orchestrator block was **53.9%
of a group's cost, 94% cache**; moving it per unit of work plus a lean startup cut it **31% per
unit**.

**A stage orchestrator must have the `Agent` tool** — launch it with
`subagent_type: 'general-purpose'`. Without `Agent` it could not dispatch anyone.

## Non-negotiables

1. **Every launch carries an explicit `model`** — without it the child inherits Opus and pays ~2.5×.
2. **Every launch carries the nonce in `description`** — a pretty label there turns the child's
   window guard off.
3. **Every child prompt is an `@` mention plus a short delta.**
4. **Never poll, never `sleep` a turn away, never spawn an agent whose purpose is to wait.**
5. **Disk is the delivery channel** — in every child prompt.
6. **Level 0 reads nothing but its own ledger** (plus `process.md`, once, to recover).

## Level-0 context budget

**MAY:** create the root folder and the root docs; launch the meta-planner and the stage
orchestrators; `SendMessage` a live one (the user's answers, an unblock, a continuation); ask the
meta-planner's single question batch with `AskUserQuestion`; run `scripts/medir-janela.sh --main`;
keep the ledger.

**MUST NOT (ever):** read `plan-simplified.md`, `plan.md`, `recon.md`, `memoria-da-task.md`, code,
diffs, reviews or verdicts; run `git`, the linter, the type-checker or the test suite (**each step's
orchestrator owns its own commits**); launch a work agent (recon, planner, implementer, validator,
tester — those belong to the step); **absorb a dead step's work** — it launches a successor that
rebuilds from disk; stop to ask the user anything after the single batch.

> **One documented exception:** if level 0 is restarted mid-run, it may read **one** file to recover —
> `{task_dir}/process.md`. Cheaper alternative: relaunch the step orchestrator, which returns the
> state.

### The ledger

Everything level 0 keeps in context, ≤5 lines per step:

```text
meta | meta-outbound-files | steps: 4 | janela: 96k | ok (commit 4f2a1c)
S01 | S01-outbound-files | classe: mecânica (plan sonnet) | recon: simples | valid: APPROVED r1 | teste: PASS tests-01 | janela: 118k | reuso: não (>80k)
S02 | S02-outbound-files-r2 | escalou p/ opus (2 rodadas de revisão) | teste: PASS tests-02 | janela: 141k
```

If a step returns more than the return format asks for, **do not copy the excess** — it is output paid
once and window re-read on every turn afterwards.

## Models per role

| Role | `model` | `subagent_type` |
|------|---------|-----------------|
| Level 0 (dispatcher) | Opus (this chat) | — |
| Meta-planner (once) | `opus` | `general-purpose` |
| **Stage orchestrator, per step** | **`sonnet`** | `general-purpose` |
| Recon (per step) | `sonnet` | `general-purpose` |
| Step planner | `opus` when recon says `complexa`; `sonnet` when `simples` | `general-purpose` |
| Implementer | `sonnet` | `general-purpose` |
| Validator / code-pattern reviewer | `opus` (**never downgrade**) | `general-purpose` |
| System / Docker / browser tester | `sonnet` | `browser-tester` for UI, else `general-purpose` |

Do not substitute other models unless the user explicitly overrides.

**Why the stage orchestrator is Sonnet.** Conducting a step is mechanical: dispatch by reference,
log, lint/type-check, commit, update docs. Measured, the closest available comparison was **US$ 11.00
(Sonnet) against US$ 42.95 (Opus)** for orchestrator + planner on comparable units — **3.9×** — and
across two groups the escalation net was **never triggered in 6+ runs**. The judgement is bought in
the **planner** and the **validator**.

**The safety net: `escalar-para-opus`.** A step orchestrator stops and returns it — persisting
everything to disk as in a handoff — when the conducting stops being mechanical: the validator asked
for **2+ rounds**, or the tester failed **2 rounds**, or the plan/returns reveal an architecture
decision or new non-trivial logic **it** would have to arbitrate. Level 0 then launches an **Opus
successor** for the same step (nonce suffixed `-r2`) with
[`prompts/step-resume.md`](prompts/step-resume.md). Switching model mid-step is cheaper than a badly
conducted step.

**The step planner's model comes from the recon verdict, not from the class.** The class in
`plan-simplified.md` is a hint written before anyone looked at the code; the recon's five questions
are answered **after**. `mecânica` + `simples` → Sonnet. Any disagreement → **Opus**. On the
slightest doubt → Opus.

### Agent mechanics

- Launch with `run_in_background: false`: steps are strictly sequential.
- **The launch call does not block for the child's lifetime.** After launching, **end your turn** —
  the completion notification arrives on its own. Nothing to wait for, nothing to poll. Measured, an
  orchestrator that believed otherwise invented a `fork` "Idle wait placeholder": it inherited the
  parent's whole context (2.78M cache read over 36 turns), delivered nothing, and cost US$ 1.95.
- `SendMessage` continues a live agent with its context intact; a new `Agent` call starts fresh. It is
  **deferred**: load it with exactly one `ToolSearch`, query `select:SendMessage`, the first time you
  need it. **Never load `Monitor`.**
- Use `SendMessage` **only** to continue the **same** agent's own work (the meta-planner after the
  answers; a step orchestrator you want to continue). Never across steps of different natures.

### The nonce IS the `description`

Write the same value in the `description` parameter **and** in the delta's `{nonce}`; if they diverge,
the child's self-measurement is born dead. A disk sweep of 1,628 spawn records found **only 10**
carrying a nonce — and `scripts/medir-janela.sh --list` in this repo returns exactly the antipattern
(`"Validate: compare-only-used-fields"`).

| Role | `description` (= nonce) |
|---|---|
| Meta-planner | `meta-{nome_task}` |
| Stage orchestrator of step NN | `S{NN}-{nome_task}` |
| Recon | `S{NN}-recon-{nome_task}` |
| Step planner | `S{NN}-plan-{nome_task}` (second planner: `-p2`) |
| Implementer | `S{NN}-impl-{escopo}-{nome_task}` (fix: `-fix{N}`) |
| Validator | `S{NN}-validate-{nome_task}-r{N}` |
| Tester | `S{NN}-test-{mode}-r{MM}-{nome_task}` |
| Successor of any of them | suffix `-r2`, `-r3` |

Unique within the session, stable for the agent's life. Human-readable names live in `agents.md`;
`description` is measurement infrastructure.

## Dispatch: file mention plus delta

```text
Agent(
  subagent_type: 'general-purpose',
  model: 'sonnet',                      # explicit ALWAYS
  run_in_background: false,
  description: 'S{NN}-{nome_task}',     # the nonce IS this parameter
  prompt: "@.claude/skills/claude-step-loop/prompts/step-orchestrator.md\n\n{delta}"
)
```

Every delta carries the safety line:

```text
The file mentioned above IS your complete instruction set. If its content did not arrive expanded in this message, read it ONCE with `Read` and follow it.
```

| Older form | What it costs | Measured |
|---|---|---|
| Typing the cycle into the launch | the launcher's **output**, ~12× the per-token price of a re-read | a level 0 at **82k output = 26% of its own cost** |
| "read section X of file Y" | **cache write** in the child (~12.5× a cache read), whole file opened | one plan read **9 times by 5 agents** |
| Telling the child to open this SKILL | the child's window, paid on **every** later turn | a stage orchestrator at **206k** having produced only the plan |

**Trade-off:** `@` delivers the **whole file** — so the prompt files are one per role and short.

## Window ceiling and handoff

**No agent should pass ~150k tokens of window**, measured not estimated:

```bash
.claude/skills/claude-step-loop/scripts/medir-janela.sh "{nonce}"
# → janela=118539 teto=150000 pct=79 turns=33 taxa=1084 proj=161899 proxima=73 status=handoff …
```

A turn in a 240k window costs **~2.4×** the same turn at 100k, while a handoff costs a fresh ~24k
baseline (**US$ 0.06–0.12**) — a 10–20× payoff. **The projection decides, not today's value.**

| Who | When |
|---|---|
| Stage orchestrator | **4 checkpoints**: end of plan · validation approved · test closed · at close (mandatory — feeds the reuse decision) |
| Meta-planner and step planners (~60 turns) | turn **25**, then every **20** (`PASSO=20`) |
| Long-lived agents (tester/implementer past ~100 turns) | every **40**, at the `proxima=` returned |
| Level 0 | optional, `--main` |
| Recon, validator | do not measure — single-shot; the parent sees `subagent_tokens` |

Cadence is **~40% of expected life, first checkpoint before halfway**. A fixed 40-turn cadence applied
to ~60-turn planners measured once, late: **0 of 3 handed off, 3 of 3 blew the ceiling**.

**If a measurement errors, retry immediately with `--self`.** Only after both fail do you stop, note
it, and fall back to the observable criterion (hand off at the end of the test step of a step that
already needed 2+ test rounds). **Never invent a window number.**

**On `status=handoff`:** finish the current cycle step, persist to disk, return `handoff-necessario`.
Level 0 launches a successor ([`prompts/step-resume.md`](prompts/step-resume.md), nonce `-r2`) that
rebuilds from disk. In operation a successor reconciled two predecessors' work with **zero rework**.

## Reuse vs fresh

> **Reuse along a sequential chain over the same scope** — many short turns, close together.
> **Fresh plus disk memory is cheaper** when the turns are few, long and far apart.

| Chain | Decision |
|---|---|
| Meta-planner → answers round | **reuse** (`SendMessage`) — that is the same chain |
| Step planner → plan notes after a failed test | **reuse** while its window is ≤80k |
| Implementer → fix round on its own scope | **reuse** while ≤80k |
| Stage orchestrator → next step | **fresh, by default** |
| Validator per round, tester per attempt | **always fresh** |

**Never reuse an agent across steps** — that is the default path here, not an exception. The 80k
threshold is measured: a 160k threshold fired twice and **failed both times**, producing the 2nd and
4th most expensive agents of a group (entering at 151k and 112k, closing at **241k and 229k**) and
still needing a handoff. A stage orchestrator that ran a whole step rarely closes under 80k, so
**fresh is the normal case**. Reuse it only when the next step depends directly on this one *and* the
window is ≤80k *and* it did not escalate to Opus.

**What replaces the reuse is disk:** `memoria-da-task.md`, written by the meta-planner and extended by
each step with the patterns it established.

## Task folder

```text
.claude/tasks/{YYYY-MM-DD}_{nome_task}/
  process.md              # overall checklist across steps
  agents.md               # all agents (meta + per step), with nonces
  orquestration.md         # overall handoffs — one entry per step
  steps.md                # index of steps + grouping rationale (meta-planner)
  answers.md              # the single user Q&A batch (meta-planner)
  memoria-da-task.md      # cross-step memory: molds, footprints, deps, traps, captured patterns
  steps/
    01_{step_slug}/
      process.md
      agents.md
      orquestration.md    # log + the "## Extrato do step" block
      plan-simplified.md  # from meta-planner (scope, IN/OUT, class, test-mode hint)
      recon.md            # the step's map (recon agent)
      plan.md             # from step planner (+ notes after failed tests)
      prompts/
        {escopo-kebab}.md # one ready-to-send prompt per implementation scope
      review-r{N}.md
      tests-01/           # verdict.md + screenshots/ per attempt
      tests-02/
    02_{step_slug}/
      ...
```

- `{YYYY-MM-DD}` = today's date (local). `{nome_task}` / `{step_slug}` = `kebab-case` ASCII.
- Initialize root docs from [templates.md](templates.md). Step folders are created by the meta-planner
  when it finalizes the step list.

## Step sizing (critical)

The meta-planner **must group** related work so the run stays short:

- Prefer **3–6 steps** for a normal feature. Avoid one giant step and avoid many tiny steps.
- Group by dependency boundary or vertical slice (schema+model, API, UI, tests) — not one step per
  file or per micro-case.
- Merge cases that share the same files, the same decision, or would be trivial alone.
- Split only when a later slice needs the earlier one merged/shippable, or when validation/test modes
  clearly differ.
- If the naive split would exceed ~6 steps, regroup and justify in `steps.md`.
- **Split a step that bundles a NEW module/service AND its own test suite** (or a new
  taxonomy/contract others consume). Measured, one unit that bundled exactly that cost **21.8% of its
  group**, with both its planner (186k) and its implementer (175k over 81 turns) blowing the ceiling.

## Orchestrator loop

### 0. Bootstrap

1. Derive `nome_task`, create the root folder + root `process.md` / `agents.md` / `orquestration.md`.
2. Record level 0 in root `agents.md`.
3. Capture the git state **once** (branch + base commit, output cut). Every delta gets it from you.

### 1. Meta-plan — Opus, once

Launch [`prompts/meta-planner.md`](prompts/meta-planner.md),
`description: 'meta-{nome_task}'`.

**Orchestrator must:**

1. Show the question batch **once** with `AskUserQuestion`, then continue the **same** meta-planner
   via `SendMessage` with the decisions as `tópico → decisão` text. Zero questions is a great
   outcome.
2. Confirm from the return that `answers.md`, `steps.md`, `memoria-da-task.md` and every step's
   `plan-simplified.md` exist. **Do not read them.**
3. Record **one ledger line per step** (slug, class, test-mode hint).
4. Update root docs; **commit**: `claude-step-loop({nome_task}): meta-plan — {why}`

### 2. For each step, in order

Do **not** start step N+1 until step N is closed (or explicitly blocked and deferred by the user).

Launch **one stage orchestrator per step** —
[`prompts/step-orchestrator.md`](prompts/step-orchestrator.md), `model: 'sonnet'`,
`description: 'S{NN}-{nome_task}'`. Its delta carries **only**: step number and slug, the root and
step folder paths, the class, the test-mode hint, the git state, and one or two lines on what the
previous step delivered that this one builds on.

That agent then runs the whole step itself — recon → plan → extract → implement → lint/tsc →
validate → commit → system test until PASS → commit → docs → close — and **it owns its own commits**.
Level 0 does not commit inside a step.

**Handle the return:**

| Return | What level 0 does |
|---|---|
| `step-fechado` | record in the ledger (recon verdict, planner model, validation rounds, test attempt, commits, window), go to step N+1 |
| `handoff-necessario` | successor with [`step-resume.md`](prompts/step-resume.md), same model, nonce `-r2` |
| `escalar-para-opus` | successor with `model: 'opus'`, nonce `-r2`, same step |
| `blocked: {reason}` | if truly unfixable, ask the user **once**; otherwise send the missing snippet by `SendMessage` |
| nothing (died) | successor that rebuilds from disk — **never** do the work yourself |

**Reuse for step N+1** only when all three hold: the returned window is **≤80k**, step N+1 depends
directly on step N, and step N did **not** escalate. Otherwise fresh — the normal case.

**Parallel steps are possible but guarded**: at most **2** at a time, only when the meta-planner
attested that their footprints are disjoint and neither compiles against the other's output. Launch
both `Agent` calls **in the same message** (that is barrier semantics with no waiting agent).
Sequential on any doubt — a working-tree conflict costs more than the ~30 min it saves.

### 3. Close task

1. Root `process.md`: all steps done (or skipped with reason).
2. Summarize to the user **from the ledger**: step list, per-step verdicts, commits, test evidence
   paths.
3. No PR unless the user asks.

## Commit rules

- **Each step orchestrator commits its own stages** — plan, implement, validate/fix, each test
  attempt. Level 0 commits only the meta-plan stage and the close.
- Follow the user's git commit protocol (status/diff/log, HEREDOC message, no force, no amend unless
  rules allow, no push unless asked), always with the output cut to a file.
- Never commit secrets.

```text
claude-step-loop({nome_task}): meta-plan — {why}
claude-step-loop({nome_task}/{NN}): {stage} — {why}
```

Stages: `recon` | `plan` | `implement` | `validate` | `system-test-{MM}` | `fix-after-test` | `close`.

## Doc update rules

**Root docs** = whole-task progress + every agent's nonce. **Step docs** = that step's stages,
written by that step's orchestrator.

Writing is ~12× the per-token price of reading, so both are written **short**:

1. **Level 0** appends **one entry per step** to root `orquestration.md` (≤5 lines: verdict + pointer)
   and one row per agent to root `agents.md` (nonce, id, model, role, window). It ticks root
   `process.md` per step.
2. **The step orchestrator** writes its own `{step_dir}/process.md` and `orquestration.md` — including
   the **`## Extrato do step`** block — and appends `## Padrões capturados no step {NN}` to
   `memoria-da-task.md`.
3. **Nobody copies a return verbatim** into a doc.

**No work agent reads these files.** Measured, panel-style docs were read 16 times by 13 agents while
carrying nothing those agents needed. They are a panel and a resume state, not a context source —
which is why the step's extract block exists as the place children read from instead.

## Orchestrator anti-patterns

- Do not implement, plan, fix or review in level 0.
- Do not read `plan.md`, `recon.md`, `memoria-da-task.md`, a review, a verdict or a diff in level 0.
- Do not walk a step's stages yourself — that is the stage orchestrator's job, and the reason it
  exists is that your context is the expensive one.
- Do not commit inside a step from level 0.
- Do not launch without an explicit `model`; do not put a pretty label in `description`.
- Do not type a child's boilerplate into the launch; do not tell a child to "read section X".
- Do not poll, `sleep`, no-op (`Bash true`), or spawn any agent whose purpose is to wait.
- Do not spawn a `fork` for a search — a fresh Sonnet with the target in the prompt is cheaper
  (measured: a fork to find one HTTP route cost US$ 1.75 over 39 turns).
- Do not absorb a dead step's work — launch a successor that reads disk.
- Do not ask clarifying questions per step; only the meta-planner's batch (plus hard blockers).
- Do not create many tiny steps — regroup.
- Do not run step N+1 before step N is done (PASS test or documented skip).
- Do not expand a step beyond its simplified scope without updating `plan.md` and logging why.
- Do not reuse an agent across steps; do not reuse any agent whose window is >80k.
- Do not mark a step's system-test done on FAIL — plan notes → fix → `tests-{MM+1}`.
- Do not leave browser screenshots only in the Playwright MCP output folder.
- Do not mark a browser system-test PASS on happy-path-only when create/edit/delete are in scope.
- Do not weaken business rules only to make `.test` pass.
- Do not stop on a fixable test failure.

## Resume / failure

- **A step orchestrator failed, handed off, escalated or died:** launch a successor with
  [`prompts/step-resume.md`](prompts/step-resume.md) — fresh nonce suffix, same model (Opus after an
  escalation). Level 0 never does the work.
- **A child inside a step failed:** that step's orchestrator handles it (`SendMessage` or a fresh
  child); it does not come back to level 0.
- **Test FAIL** → plan notes → implementer → new `tests-{MM}`, all inside the step.
- **Level 0 restarted:** read root `process.md` — and nothing else — then continue. Cheaper
  alternative: relaunch the current step's orchestrator, which returns the state.
- **A step must be reshaped mid-run:** update `steps.md` + that step's `plan-simplified.md`, log it in
  root `orquestration.md`, and prefer **merging** over adding steps.
- **Pause only for unfixable blockers** (secrets, access, a product choice the answers never covered,
  external impossibility): ask once, update docs.

## Prompts

| File | Role |
|---|---|
| [prompts/meta-planner.md](prompts/meta-planner.md) | split into steps, one question batch, cross-step memory |
| [prompts/step-orchestrator.md](prompts/step-orchestrator.md) | level-1 agent: one step, the 10-stage cycle |
| [prompts/step-resume.md](prompts/step-resume.md) | successor after handoff / escalation / death |

Child prompts are shared with the simple loop and mentioned straight from there:
[recon](../claude-simple-loop/prompts/recon.md) ·
[planner](../claude-simple-loop/prompts/planner.md) ·
[implementer](../claude-simple-loop/prompts/implementer.md) ·
[validator](../claude-simple-loop/prompts/validator.md) ·
[tester](../claude-simple-loop/prompts/tester.md) ·
[tester-retry](../claude-simple-loop/prompts/tester-retry.md) ·
[plan-notes](../claude-simple-loop/prompts/plan-notes.md)

## Related

- Window measurement: [scripts/medir-janela.sh](scripts/medir-janela.sh)
- Root and per-step skeletons: [templates.md](templates.md)
- Playwright browser MCP + deep UI testing: [browser instructions](../../docs/browser-instructions.md)
- Single-task variant: [claude-simple-loop](../claude-simple-loop/SKILL.md)
