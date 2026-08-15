---
name: claude-simple-loop
description: >-
  Orchestrates a multi-agent task loop: recon (Sonnet), plan (Opus or Sonnet by
  the recon verdict), implement (Sonnet), validate/review (Opus), then system
  test via `.test`, Docker+browser, or both (Sonnet) in tests-{NN}/ until PASS,
  with plan-note fix loops on FAIL. Child prompts live in prompts/ and are
  delivered by `@` mention; every agent gets an explicit model and a measurement
  nonce. Commits after each stage; tracks under .claude/tasks/. Use when the user
  asks for claude-simple-loop, /claude-simple-loop, or a multi-agent
  plan-implement-validate-test workflow.
---

# Claude Simple Loop

Level-0 chat is the **orchestrator**. It never implements the feature itself, and it never absorbs a
dead agent's work. It creates the task folder, launches each stage in order, keeps a short ledger,
commits after each stage, and keeps the three task docs up to date.

Level 0 is the only agent whose context is **re-read on every turn of the whole run**, so it is also
the most expensive place to put anything:

```text
cost of the orchestrator ≈ turns × average context × price of a cache read
```

Everything below follows from that one line.

## Trigger

User says `claude-simple-loop`, `/claude-simple-loop`, or asks to run this multi-agent loop for a task.

## Non-negotiables

1. **Every launch carries an explicit `model`.** A launch without it inherits Opus and pays ~2.5×
   where Sonnet would do.
2. **Every launch carries the nonce in `description`** — see [Nonce](#the-nonce-is-the-description).
   A pretty label there means the child's window guard is off.
3. **Every child prompt is an `@` mention of a file plus a short delta** — never boilerplate typed
   out in full. See [Dispatch](#dispatch-file-mention-plus-delta).
4. **Never poll, never `sleep` a turn away, never spawn an agent whose purpose is to wait.**
5. **Disk is the delivery channel** — in every child prompt, without exception.
6. **Level 0 does not read code, plans, diffs or logs.** See the budget below.

## Level-0 context budget

**MAY:**

- Create the task folder and write the task docs (short — see [Doc updates](#doc-update-rules)).
- Launch agents with `Agent`, and continue a live one with `SendMessage`.
- Ask the user the planner's single question batch with `AskUserQuestion`.
- Run `git` for the stage commits, always with the output cut: `git commit -m "…" > /tmp/git.log
  2>&1; echo "exit=$?"; tail -5 /tmp/git.log`.
- `scripts/medir-janela.sh --main` to check its own window — one line back.
- Keep a **ledger of ≤5 lines per stage** in context.

**MUST NOT (ever):**

- Read product code, `plan.md`, `recon.md`, a review, a `verdict.md`, or any diff. It acts on the
  **pointer and verdict** a child returns, not on the content behind it.
- Run the linter, the type-checker or the test suite. Those belong to stages that own them.
- Implement, fix or review anything itself — including "just this one line".
- **Absorb a dead agent's work.** If an agent dies or returns nothing, level 0 launches a
  **successor** that rebuilds state from disk. Swapping a cheap Sonnet for turns in the fattest
  context in the run is the most expensive move available.
- Copy a child's return into the docs verbatim. Log the verdict and the pointer.

> **One documented exception:** if level 0 is restarted mid-run, it may read **one** file to
> recover — `{task_dir}/process.md`. Nothing else.

### The ledger

Everything level 0 keeps in context, per stage, ≤5 lines:

```text
plan | plan-outbound-files-metadata | recon: simples (planner sonnet) | janela: 88k | escopos: 1 | ok (commit 4f2a1c)
validate | validate-outbound-files-metadata-r1 | APPROVED_WITH_RESALVAS (2) | rodadas: 1
test | test-outbound-files-metadata-browser-r01 | PASS | tests-01/verdict.md
```

If a child returns more than the return format asks for, **do not copy the excess into the ledger**
— it is output paid once and window re-read on every turn afterwards.

## Models per role

| Role | `model` | `subagent_type` | Why |
|------|---------|-----------------|-----|
| Recon | `sonnet` | `general-purpose` | mapping is not judgement |
| Planner — recon says `complexa` | `opus` | `general-purpose` | this is where reasoning lands in the artifact |
| Planner — recon says `simples` | `sonnet` | `general-purpose` | one front, ≤6 files, named mold, nothing open |
| Implementer | `sonnet` | `general-purpose` | executes a contract |
| Validator / code-pattern reviewer | `opus` | `general-purpose` | quality gate — never downgrade |
| System / Docker / browser tester | `sonnet` | `browser-tester` for UI, else `general-purpose` | |

Do not substitute other models unless the user explicitly overrides.

**Where this deliberately does not cut:** the validator and the test round. Measured across several
groups, reviewers were the cheapest line of the orchestration (~4.8%) and the one holding quality;
testers were expensive (~28%) and caught the only real defect of a group. Cut the wasted turns
**inside** a tester, never the round itself.

**The planner's model comes from the recon verdict, not from a hunch.** The five questions the recon
answers (one front? ≤6 files? clear mold? zero open decisions? zero new non-trivial logic?) are
answered **after looking at the code**. On any doubt the recon says `complexa` and the planner is
Opus: a wrong `simples` buys a cheap plan for a task that needed a good one, while a wrong
`complexa` only costs money.

### Agent mechanics

- Launch with `run_in_background: false`: the stages are strictly sequential.
- **The launch call does not block for the child's lifetime.** After launching, **end your turn** —
  the completion notification arrives on its own. There is nothing to wait for and nothing to poll.
  A measured orchestrator that believed otherwise invented a `fork` "Idle wait placeholder" to
  "wait" for a child: it inherited the parent's entire context (2.78M cache read over 36 turns),
  delivered nothing of its own, and cost US$ 1.95.
- `SendMessage` continues an existing agent with its context intact; a new `Agent` call always starts
  fresh. It is a **deferred** tool: load it with exactly one `ToolSearch` call, query
  `select:SendMessage`, the first time you actually need it — never by keyword, never at startup
  "just in case". **Never load `Monitor`**: nobody polls here.
- A subagent's final text is its return value. Every prompt in `prompts/` already states the return
  shape; do not ask for a narrative summary on top of it.

### The nonce IS the `description`

The measurement nonce is not a string in the prompt body — it is the `description` parameter of the
`Agent` call. That is where the harness persists it, and it is how the child finds its own
transcript. Write **the same value in both places** (the parameter and `{nonce}` in the delta); if
they diverge, the child's measurement is born dead.

This is not hypothetical. A disk sweep of 1,628 spawn records found **only 10 carrying a nonce**, and
`scripts/medir-janela.sh --list` in *this* repo returns exactly the antipattern: `"Validate:
compare-only-used-fields"`, `"Fix after validate"`. That is why three attempts at self-measurement
failed before the cause was found.

| Role | `description` (= nonce) |
|---|---|
| Recon | `recon-{nome_task}` |
| Planner | `plan-{nome_task}` (second planner: `-p2`; notes round: `-notes{NN}`) |
| Implementer | `impl-{escopo-kebab}-{nome_task}` (fix round: `-fix{N}`) |
| Validator | `validate-{nome_task}-r{N}` |
| Tester | `test-{nome_task}-{mode}-r{NN}` |
| Successor of any of them | suffix `-r2`, `-r3` |

Rules: **unique within the session** (a successor never reuses its predecessor's nonce, or the
measurement matches the wrong file) and **stable** for the agent's life. If you want a human-readable
name to find the agent later, it is in `agents.md` — `description` is measurement infrastructure.

## Dispatch: file mention plus delta

Every child is launched as **an `@` mention of a prompt file plus only the delta**:

```text
Agent(
  subagent_type: 'general-purpose',
  model: 'sonnet',                      # explicit ALWAYS
  run_in_background: false,
  description: '{nonce}',               # the nonce IS this parameter
  prompt: "@.claude/skills/claude-simple-loop/prompts/{role}.md\n\n{delta}"
)
```

And the delta always carries this safety line:

```text
The file mentioned above IS your complete instruction set. If its content did not arrive expanded in this message, read it ONCE with `Read` and follow it.
```

**The three older forms, and why each loses:**

| Form | What it costs | Measured |
|---|---|---|
| Typing the prompt into the launch | the **output** of the launcher, ~12× the per-token price of a re-read | a level-0 orchestrator at **82k output = 26% of its own cost** |
| "read section X of file Y" | **cache write** in the child (~12.5× a cache read) — and it opens the whole file | one plan read **9 times by 5 agents** |
| Telling the child to open this SKILL | the child's window, paid on **every** later turn | a stage orchestrator at **206k** having produced only the plan |

The `@` mention pays none of the three: the text is already written, it arrives expanded **in the
child**, and it never passes through the launcher's context.

**The declared trade-off:** `@` delivers the **whole file**. That is why `prompts/` has one short file
per role, and why the planner writes **one ready-prompt file per implementation scope** instead of
leaving everything inside `plan.md`. A prompt file that grows undoes the lever.

## Turn hygiene (every level, every agent)

1. **Verbose output goes to a file, never into context:**
   `cmd > /tmp/x.log 2>&1; echo "exit=$?"; tail -5 /tmp/x.log`. The linter, the type-checker, the
   test suite and `git` all qualify.
2. **Lean returns, always** — ≤10 lines or a list of changed files. Never a narrative summary, never
   a pasted plan or diff.
3. **Dispatch by `@` mention.** Nobody copies a ready prompt into their own context, and nobody is
   told to "read section X" of a bigger file.
4. **Dead agent → fresh respawn reading disk.** The parent never takes over the child's work.
5. **Everything is resumable from disk.** `plan.md`, `recon.md`, the reviews, the verdicts and the
   task docs persist the whole run.
6. **Every search carries the cut IN THE COMMAND** — narrow path, `-m 5`, `--include=`, `-l` when you
   only need which files, `| head -40` as the last stage. `Bash` with `grep`/`find` is the accepted
   way; if your toolset has `Grep`/`Glob`, using them with `head_limit` is equally fine — **the cut
   is the rule, not the tool** — and never spend a `ToolSearch` looking for them. *Do not count this
   rule as savings:* measured, unbounded searches were ~US$ 0.12–0.25 of a group. It exists for
   **tail risk** — one bad grep over a monorepo can cost more than every other search combined.
   `git diff`/`git log`/`git status` get the strictest cut of all (`--stat`, `--name-only`, `-n 5`,
   a path).
7. **Reading part of a large file is `Read` with `offset`/`limit`** — never `sed -n`, `cat`, `head`
   or `tail` on code or a plan.
8. **Git state goes down in the prompt.** The launcher already knows the branch, the base commit and
   the file list; the child never re-discovers them with `git status`.
9. **The type-checker runs once per stage that owns it.** Every non-implementer child prompt says so.
   Measured, 38 runs by 21 agents where the contract allowed 15.

### How to wait for something external

**Forbidden:** `sleep N` as a turn; a no-op turn used as waiting (`Bash({"command":"true"})`, `:`,
`echo .`, `date`, a repeated `ls`); polling for something that notifies you anyway. Measured, one
tester spent **246 of its 519 tool calls** on literal `true` while "waiting" — ~4.3% of the group's
cost, for nothing.

**The one correct form** — a single `Bash` whose command exits by itself, with a timeout:

```bash
timeout 120 bash -c 'until grep -q "Ready in" /tmp/dev.log; do sleep 0.5; done'; echo "exit=$?"
```

The `sleep` **inside** the `until` is correct — it runs inside one command, in one turn. The
forbidden `sleep` is the one that **ends the turn**.

And: **never kill a process and use its resource in the same `Bash` block.** `pkill` goes alone; what
depends on the freed port or file goes in the next call. Measured, the combined form failed 11 times
in a row with exit code 144.

## Window ceiling and handoff

**No agent should pass ~150k tokens of window.** The ceiling is **measured, not estimated**:

```bash
.claude/skills/claude-simple-loop/scripts/medir-janela.sh "{nonce}"
# → janela=118539 teto=150000 pct=79 turns=33 taxa=1084 proj=161899 proxima=73 status=handoff fonte=exato desc="plan-…"
```

Why 150k: measured, **a turn in a 240k window costs ~2.4× the same turn at 100k** (cache read
122,687/turn vs 48,694), while a handoff costs a fresh ~24k baseline — **US$ 0.06–0.12**. Payoff of
10–20× per handoff. The real inflection is ~180k; 150k is the ceiling because it leaves room to grow
between two checkpoints without crossing it.

**The projection decides, not today's value.** `pct=79` looks comfortable while `proj=161899` blows
the ceiling. Reprocessed on a real transcript, an agent that silently closed at 251k would have
handed off at **turn 108 of 172**, with 64 turns of slack.

| Who | When to measure |
|---|---|
| Planner (~60 turns) | first checkpoint at turn **25**, then every **20** (`PASSO=20`) |
| Long-lived agents (tester or implementer past ~100 turns) | every **40** turns, at the `proxima=` the last measurement returned |
| Level 0 | optional, `--main`, if it suspects it is carrying too much |
| Recon, validator, short implementers | do not measure — single-shot roles, the parent sees `subagent_tokens` in the return |

**Cadence is proportional to the role, not a fixed number**: ~40% of expected life, first checkpoint
before the halfway mark. The fixed 40-turn cadence, applied to ~60-turn planners, measured **once,
late** — 0 of 3 handed off and 3 of 3 blew the ceiling (130%, 135%, 107%).

**Do not measure** after every launch, every commit or "just to check" inside a stage. Between
checkpoints the observable criterion rules: if you feel mid-stage that the window exploded, **finish
the stage** and measure at its checkpoint.

**If a measurement errors, retry immediately with `--self`** (it finds the most recently written
subagent transcript and prints the `desc=` it matched). Only after both fail do you stop measuring —
and then you write one line saying so in the deliverable. **Never invent a window number.**

**On `status=handoff`:** finish the current unit of work, write state to disk, return
`handoff-necessario` plus where you stopped. Level 0 launches a successor (nonce suffixed `-r2`) that
rebuilds from disk. A partial plan handed over cleanly beats a complete plan written at 200k.

## The task extract

`Read` is the largest single channel of new content into context — **89% of all injected tool
results** in a measured group — and every first opening of a file is cache write at ~12.5× a cache
read. Measured, **US$ 14.10 of cache write sat in files opened by 3+ agents**.

The fix is not "do not open it": that was tried, and it failed for the task's own artifacts because
the instruction said *do not open* without saying *read here instead*. So the orchestrator writes
**one canonical block** in `orquestration.md`, right after the plan lands:

```markdown
## Extrato da task

- Decisões vinculantes: …          # from the answers + Premissas assumidas
- Critérios de aceitação: …
- Arquivos no escopo: …
- Estado de git: branch … | commit-base …
- Armadilhas: …                    # from recon.md
- Cenário/preset de teste: …
```

≤40 lines. It is (a) the source of the extracts pasted into child deltas — the orchestrator does not
re-derive them at each launch — and (b) what a successor orchestrator reads instead of reopening
`plan.md` + `recon.md` + the reviews.

**Who may open what:**

| Role | `plan.md` / `recon.md` | Task docs (`process`/`agents`/`orquestration`) | Runs the type-checker? |
|---|---|---|---|
| Planner | **full** — it writes the plan, and it gets `recon.md` by `@` | no | no |
| Orchestrator (level 0) | **no** | writes them; reads only `process.md`, and only to recover | no |
| Implementer | **no** — its ready-prompt file *is* its contract | no | yes, once, as its acceptance criterion |
| Validator / tester | **no** — extract in the delta | no | **no** |

**Declared risk:** an incomplete extract. If a child says it is missing context, **send the missing
snippet via `SendMessage`** — never grant it a re-read of the whole file.

## Reuse vs fresh

> **Reuse along a sequential chain over the same scope** — many short turns, close together, each
> building on what the agent already read. **Fresh plus disk memory is cheaper** when the turns are
> few, long and far apart: then the agent drags its whole accumulated context through every turn.

| Chain | Decision |
|---|---|
| Planner → answers round → plan notes after a failed test | **reuse** via `SendMessage`, while its window is ≤80k |
| Implementer → fix round on its own scope | **reuse** via `SendMessage`, while ≤80k |
| Validator, each round | **always fresh** — one that already approved arrives anchored to it |
| Tester, each attempt | **always fresh** — the handoff channel is `verdict.md`, not the agent |

The 80k threshold is measured: a 160k threshold fired twice and **failed both times**, producing the
2nd and 4th most expensive agents of a group (they entered at 151k and 112k and closed at 241k and
229k) and **still needing a handoff**. Above 80k, launch fresh and let it read disk.

## Task folder

Create immediately after the task name is known:

```text
.claude/tasks/{YYYY-MM-DD}_{nome_task}/
  process.md
  agents.md
  orquestration.md          # log + the "## Extrato da task" block
  recon.md                  # the map (recon agent)
  plan.md                   # the plan (+ notes after failed tests)
  prompts/
    {escopo-kebab}.md       # one ready-to-send prompt per implementation scope (planner writes)
  review-r{N}.md            # one per validation round
  tests-01/                 # each attempt: verdict.md + screenshots/ (+ logs if useful)
  tests-02/                 # created only when a previous run failed and we retest
  tests-NN/
```

- `{YYYY-MM-DD}` = today's date (local).
- `{nome_task}` = short slug from the user request (`kebab-case`, ASCII).

Initialize the three docs from [templates.md](templates.md) before launching agents.

## Orchestrator loop

### 0. Bootstrap

1. Derive `nome_task`, create the task folder + the three docs.
2. Record level 0 in `agents.md` (no agent id; note "chat level 0").
3. Capture the git state **once** — branch + base commit, with the output cut. Every child delta gets
   it from you; no child runs `git status`.

### 1a. Recon — Sonnet, before the planner

Launch [`prompts/recon.md`](prompts/recon.md), `description: 'recon-{nome_task}'`. It returns the
pointer to `recon.md` plus two decisive lines: `veredito: simples|complexa` and `partição: …`.

Log the verdict in `orquestration.md` (≤3 lines). This is the cheapest turn of the run and it is what
lets the planner design instead of explore: measured, an unmapped planner burned 106,967 cache-read
tokens per turn to produce 100 output tokens per turn.

### 1b. Plan — model from the recon verdict

Launch [`prompts/planner.md`](prompts/planner.md) with `@{task_dir}/recon.md` in the same prompt.
`simples` → `sonnet`; `complexa` → `opus`. `description: 'plan-{nome_task}'`.

**Orchestrator must:**

1. Present the planner's question batch to the user **once** with `AskUserQuestion`, then resume the
   **same** planner via `SendMessage` with the decisions as `tópico → decisão` text. Zero questions
   is a great outcome — skip straight to the plan.
2. Confirm `plan.md` and the per-scope files under `{task_dir}/prompts/` exist (the planner's return
   lists them). **Do not read them.**
3. Write the **`## Extrato da task`** block in `orquestration.md` from the planner's return + the
   answers you already have.
4. Update `process.md`, `agents.md` (id, model, subagent_type, nonce), `orquestration.md`.
5. **Commit** this stage (docs + recon + plan + scope prompts).

### 2. Implement — Sonnet

Launch one implementer per scope with [`prompts/implementer.md`](prompts/implementer.md) — the
prompt is `@{task_dir}/prompts/{escopo-kebab}.md` plus the 3-line delta.

**Two scopes in parallel come free:** two `Agent` calls **in the same message** launch in the same
turn and each return arrives on its own notification. That is barrier semantics with no waiting agent
— which is exactly what the no-fork rule forbids replacing. Only do it when the planner declared the
footprints disjoint; on any doubt, sequential.

Then, once: linter + type-checker, output to a file. **Orchestrator must** update the docs and
**commit**.

### 3. Validate — fresh Opus

Launch [`prompts/validator.md`](prompts/validator.md), `description: 'validate-{nome_task}-r{N}'`,
with the extract in the delta. Verdict: `APPROVED` | `APPROVED_WITH_RESALVAS` | `CHANGES_REQUIRED`.

**If `CHANGES_REQUIRED`:** one fix round on the implementer that owns the scope, then a **fresh**
validator at `-r{N+1}`. Log each round in `orquestration.md` (verdict + pointer, never the review
body). **2+ rounds is a signal**: record it — the run stopped being mechanical.

**Orchestrator must:** update docs, then **commit**.

### 4. System test — Sonnet (choose mode + pass loop)

**Orchestrator picks one mode**, preferring the recon's `## Sinal de teste` over re-deriving it:

| Mode | When |
|------|------|
| `.test` only | Automated unit/integration tests fully cover the change |
| Docker+browser only | Needs running stack / UI path; automated `.test` would not add useful signal |
| Both | Automated tests matter **and** runtime/UI still needs proof |

Record the chosen mode + reason in `orquestration.md`. At least one path must run unless the change
is docs-only / no runtime behavior (then skip with reason).

#### Test run folders

```text
tests-{NN}/
  verdict.md       # required — PASS | FAIL + feedback
  screenshots/     # browser captures for this run (when browser opened)
  # optional: logs, command output snippets
```

- System test is **not done** until a run ends with **PASS** in `verdict.md` (or the stage is skipped
  as docs-only).
- Never overwrite a previous `tests-{NN}/`; always increment `NN` on retest.
- When the browser opens: `subagent_type: browser-tester` and the deep cases listed in the delta —
  follow **[browser instructions](../../docs/browser-instructions.md)**
  (`.claude/docs/browser-instructions.md`). Screenshots go **inside** that run's `screenshots/`
  (copy them out of the Playwright MCP output dir).
- Browser tests must be **deep** (create / edit / delete / validation / success / usability), not
  happy-path smoke only — see that doc's "Depth requirements" and the
  `fx-link-friendly-required-fields` lesson.

#### Running a test attempt

1. Create the next `tests-{NN}/`.
2. Launch [`prompts/tester.md`](prompts/tester.md) fresh (`model: sonnet`; `browser-tester` for UI,
   else `general-purpose`), with the extract, the mode, and the explicit deep-case list in the delta.
3. If the mode is **both**, prefer `.test` first unless Docker is required to run them.
4. The tester writes `verdict.md` itself, before returning.
5. Commit the attempt (docs + evidence): `claude-simple-loop({nome_task}): system-test-{NN} — {why}`

#### On PASS

Mark system-test done in `process.md` and continue to close.

#### On FAIL — fix loop (do not stop the task)

Progress continues until PASS, unless the failure is **unfixable** (missing secrets/access,
contradictory requirements, external outage, a product decision not covered by the answers).

1. **Plan notes** — [`prompts/plan-notes.md`](prompts/plan-notes.md), via `SendMessage` to the
   planner (or fresh above 80k). It appends `## Notes after tests-{NN} (FAIL)` at the bottom of
   `plan.md`, and updates the scope's ready prompt if the contract changed.
2. **Implementer fix round** — `SendMessage` to the owning scope's agent, or a fresh Sonnet at
   `-fix{N}`. For **`.test` failures** the implementer may change production code **and/or** tests,
   but must keep business rules correct (no weakened assertions to go green), then append
   `## Notes do implementador (após tests-{NN})` to `plan.md`.
3. Re-validate only if the fix is large; a two-line fix goes straight to the next attempt.
4. Run **`tests-{NN+1}`** with a fresh tester —
   [`prompts/tester-retry.md`](prompts/tester-retry.md), whose handoff is the previous `verdict.md`.
5. Commit after the plan-notes update, after the implement fix, and after each new test attempt.

**Three consecutive FAILs on the same case** is no longer a fix round: send it back for a re-design
(fresh planner reading the plan and every verdict) and record that decision.

#### Unfixable stop

Only then pause: log in `orquestration.md`, leave `process.md` with the failing `tests-{NN}`, and ask
the user once.

### 5. Close

1. Ensure `process.md` shows all stages done (or skipped with reason).
2. Summarize to the user from the **ledger**: recon verdict, plan outcome, commits, validation
   verdict, test evidence paths.
3. Do not open a PR unless the user asks.

## Commit rules (every stage)

- One commit **per completed stage** (plan, implement, validate/fix, system-test).
- Follow the user's git commit protocol (status/diff/log, HEREDOC message, no force, no amend unless
  rules allow, no push unless asked) — always with the output cut to a file.
- Never commit secrets (`.env`, credentials, etc.).
- A stage commit includes the matching `.claude/tasks/...` doc updates for that stage.

```text
claude-simple-loop({nome_task}): {stage} — {why}
```

Stages: `recon` | `plan` | `implement` | `validate` | `system-test-{NN}` | `fix-after-test` | `close`.

## Doc update rules

The docs are the audit trail **and** the resume state — but writing is ~12× the per-token price of
reading, so they are written **short**, from the ledger, and never by copying a return.

After each stage (not after each turn):

1. **`process.md`** — tick finished items, keep pending ones unchecked, note blockers. One or two
   lines.
2. **`agents.md`** — append one row: nonce (`description`), agent id, model, subagent_type, role,
   window at return (`subagent_tokens`).
3. **`orquestration.md`** — append ≤5 lines: what was asked, the verdict, the pointer to the
   deliverable, what the orchestrator did next. Plus the **`## Extrato da task`** block, once, after
   the plan.

**No agent other than level 0 reads these files** — measured, `progress.md`-style panels were read
16 times by 13 agents while carrying nothing those agents needed. They are a panel, not a context
source.

## Orchestrator anti-patterns

- Do not implement, fix or review in level 0 while a stage agent is responsible for it.
- Do not read `plan.md`, `recon.md`, a review, a `verdict.md` or a diff in level 0.
- Do not launch without an explicit `model`, and do not put a pretty label in `description`.
- Do not type a child's boilerplate into the launch — mention the file, write only the delta.
- Do not tell a child to "read section X" of a bigger file.
- Do not poll, `sleep`, no-op (`Bash true`) or spawn any agent whose purpose is to wait.
- Do not spawn a `fork` for a search — a fresh Sonnet with the target in the prompt is cheaper and
  better (measured: a fork to find one HTTP route cost US$ 1.75 over 39 turns).
- Do not absorb a dead agent's work — respawn a successor that reads disk.
- Do not drip-feed clarifying questions; only the planner's single batch (plus hard blockers).
- Do not skip commits between stages.
- Do not default to Docker+browser when `.test` alone is enough; do not skip Docker+browser when
  runtime/UI proof is still needed; use **both** when each covers a different risk.
- Do not mark system-test done on FAIL — open `tests-{NN+1}` after plan notes + fix.
- Do not leave browser screenshots only in the Playwright MCP output folder.
- Do not mark a browser system-test PASS on happy-path-only when create/edit/delete are in scope.
- Do not weaken business rules or delete meaningful assertions only to make `.test` pass.
- Do not stop the loop on a fixable test failure.
- Do not skip validation because the implementation "looked fine".
- Do not reuse a validator or a tester across rounds; do not reuse any agent whose window is >80k.

## Resume / failure

- **Agent failed or returned incomplete work:** log it, then either `SendMessage` the live agent with
  a precise instruction, or launch a **successor** (nonce suffixed `-r2`) that rebuilds from disk.
  Level 0 never does the work itself.
- **`handoff-necessario`:** successor with the same role and model, pointed at the partial
  deliverable on disk.
- **Test FAIL** → plan notes → implementer → new `tests-{NN}` (see §4).
- **Level 0 restarted:** read `{task_dir}/process.md` — and nothing else — then continue.
- **Pause only for unfixable blockers** (secrets, access, a product choice not covered by the
  answers, external impossibility): ask once, update docs.

## Child prompts

| File | Role |
|---|---|
| [prompts/recon.md](prompts/recon.md) | map the codebase, verdict `simples`/`complexa`, partition signal |
| [prompts/planner.md](prompts/planner.md) | one question batch, `plan.md`, one ready prompt per scope |
| [prompts/implementer.md](prompts/implementer.md) | launch form + fix rounds |
| [prompts/validator.md](prompts/validator.md) | fresh Opus review, three verdicts |
| [prompts/tester.md](prompts/tester.md) | system test, wait rules, `verdict.md` |
| [prompts/tester-retry.md](prompts/tester-retry.md) | new round, handoff via the previous verdict |
| [prompts/plan-notes.md](prompts/plan-notes.md) | notes after a failed test |

## Related

- Window measurement: [scripts/medir-janela.sh](scripts/medir-janela.sh)
- Task file skeletons: [templates.md](templates.md)
- Playwright browser MCP + deep UI testing: [browser instructions](../../docs/browser-instructions.md)
- Multi-step variant: [claude-step-loop](../claude-step-loop/SKILL.md)
