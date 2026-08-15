# Claude Step Loop — templates

Copy into `.claude/tasks/{YYYY-MM-DD}_{nome_task}/`. Replace placeholders.

**Write them short.** These files are the audit trail and the resume state, not a narrative: writing
is ~12× the per-token price of reading, and a level-0 orchestrator measured in a comparable pipeline
spent **42% of its own cost on output**. Never copy an agent's return in full — log the verdict and
the pointer. Root docs are written by **level 0**; step docs by **that step's orchestrator**.

## Root `process.md`

```markdown
# Process — {nome_task}

Date: {YYYY-MM-DD}
Skill: claude-step-loop
Git: branch {branch} | commit-base {sha}

## Todo

- [ ] Bootstrap root folder + root docs + git state captured
- [ ] Meta-plan (Opus) — clarifying questions batch (ONE, for every step)
- [ ] Meta-plan — steps.md + answers.md + memoria-da-task.md + plan-simplified.md per step
- [ ] Commit: meta-plan
- [ ] Step 01 — stage orchestrator (Sonnet): recon → plan → implement → validate → test (PASS) → close
- [ ] Step 02 — stage orchestrator (Sonnet): …
- [ ] Step … (one line per step from `steps.md`)
- [ ] Close task + user summary

## Steps status

| Step | Slug | Class | Stage orchestrator | Status | Last test |
|------|------|-------|--------------------|--------|-----------|
| 01 | {step_slug} | mecânica \| julgamento | S01-{nome_task} | pending \| in_progress \| done \| blocked | tests-NN PASS/FAIL |
| 02 | {step_slug} | … | S02-{nome_task} | | |

## Notes

-
```

## Root `agents.md`

```markdown
# Agents — {nome_task}

Date: {YYYY-MM-DD}
Skill: claude-step-loop

## Level 0 — Dispatcher

- Role: pure dispatcher (this chat)
- Model: (session default)
- Agent id: n/a (chat level 0)
- Context budget: launches the meta-planner and one stage orchestrator per step; reads no plan, no
  code, no diff, no verdict; commits only the meta-plan and the close

## Agents

One row per launch that LEVEL 0 made. Children launched inside a step are recorded in that step's
`agents.md` by its orchestrator. The **nonce is the `description` parameter** — never a pretty label,
or the agent cannot measure its own window. `janela` is the `subagent_tokens` of the return.

| When | Role | Step | Nonce (`description`) | Agent id | Model | subagent_type | janela | Return |
|------|------|------|----------------------|----------|-------|---------------|--------|--------|
| {ts} | meta-planner | — | meta-{nome_task} | {id} | opus | general-purpose | {n}k | {n} steps |
| {ts} | stage orchestrator | 01 | S01-{nome_task} | {id} | sonnet | general-purpose | {n}k | step-fechado |
| {ts} | stage orchestrator (successor) | 02 | S02-{nome_task}-r2 | {id} | opus | general-purpose | {n}k | escalated: 2 review rounds |

## Ledger (what level 0 keeps in context — ≤5 lines per step)

```text
meta | meta-{nome_task} | steps: {n} | janela: {n}k | ok (commit {sha})
S01 | S01-{nome_task} | classe: {mecânica|julgamento} | recon: {simples|complexa} (plan {sonnet|opus}) | valid: {verdict} r{n} | teste: {PASS} tests-{MM} | janela: {n}k | reuso: {não|sim}
```

## Reuse decisions

| Chain | Reused? | Why |
|---|---|---|
| meta-planner → answers round | yes | same chain |
| stage orchestrator → next step | **no (default)** | needs ALL of: window ≤80k, N+1 depends on N, no escalation |
| validator per round, tester per attempt | **never** | fresh by design |
```

## Root `orquestration.md`

```markdown
# Orquestration — {nome_task}

Date: {YYYY-MM-DD}
Skill: claude-step-loop

One entry per step, ≤5 lines each: verdict + pointer, never a copied return.

## {timestamp} — bootstrap

- Root folder created; git state captured (branch / commit-base).

## {timestamp} — meta-planner (meta-{nome_task})

- Question batch: {n} topics (or "sem dúvidas")
- User answered: {tópico → decisão, one line each}
- Pointers: `steps.md`, `answers.md`, `memoria-da-task.md`, `steps/*/plan-simplified.md`
- Steps: {n} — {NN}:{slug}:{classe} …
- Next: step 01

## {timestamp} — step 01 (S01-{nome_task})

- Return: step-fechado | handoff-necessario | escalar-para-opus | blocked
- Recon: {simples|complexa} → planner in {sonnet|opus}
- Validation: {verdict}, {n} round(s)
- Test: {mode}, PASS at tests-{MM} → `steps/01_{slug}/tests-{MM}/verdict.md`
- Commits: {sha} …
- Window at close: {n}k → reuse for step 02: yes/no
- Next: step 02
```

## Root `steps.md`

```markdown
# Steps — {nome_task}

## Agrupamento

- Why these N steps and not a finer split:
- What was merged on purpose:
- Anything split because it bundled a NEW module AND its own suite/contract:

## Ordered steps

| # | Slug | Goal | Depends on | Class | Test mode hint |
|---|------|------|------------|-------|----------------|
| 01 | {step_slug} | … | — | mecânica \| julgamento | `.test` only \| Docker+browser only \| both \| skip |
| 02 | {step_slug} | … | 01 | … | … |

## Independence attestation (only if any steps may run in parallel)

- Steps {NN} and {MM} have disjoint footprints and neither compiles against the other's output:
  {the concrete reason, naming the files}. Max 2 in parallel; sequential on any doubt.
```

## Root `answers.md`

```markdown
# Answers — {nome_task}

Captured ONCE by the meta-planner. These decisions are BINDING. No step planner re-asks them, and no
agent reopens them.

## Decisões

1. Q: …
   A: …
   Binds steps: {NN}, {MM}

## Premissas assumidas (not asked, decided by the golden test)

- {premise} — binds steps: {NN}
```

## Root `memoria-da-task.md`

```markdown
# Memória da task — {nome_task}

Written by the meta-planner, extended by each step. **This file replaces the meta-planner's context**
for every fresh agent that comes later, so it is concrete: paths, symbol names, `path:line`. Never
copy code bodies — point to them. Read ONCE per authorized reader (step orchestrator, planner);
reopening it is cache read paid again plus a turn.

## Decisões e premissas transversais

- {decision} — binds steps {NN}, {MM}

## Por step

### Step {NN} — {slug}
- Molde a espelhar: `{path}:{lines}` — {why}
- Arquivos-chave: `{path}` …
- Forma/tipo a seguir: …

## Footprint

- `{path}:{line}` — {how it consumes what changes}   # the grep result, so nobody re-runs it

## Dependências e ordem

- Step {NN+1} assumes step {NN} already did: …

## Armadilhas

- `{path}:{line}` — {guard that must stay / pre-existing drift / env requirement / looks wrong but is
  intentional}

## Padrões capturados no step {NN}

- (appended by each step's orchestrator at close — one line per pattern later steps must follow)
```

## Per-step `plan-simplified.md`

```markdown
# Step {NN} — {step_slug} (simplified)

## Goal

…

## In scope

- …

## Out of scope

- …

## User answers that apply (binding)

- Q/A …

## Suggested areas / files

- `{path}:{lines}` — …

## Depends on

- Step {MM}: …

## System-test hint

`.test` only | Docker+browser only | both | skip — reason: …

## Classe

`mecânica` | `julgamento` — reason (one line).

`mecânica` requires ALL FOUR: zero real questions for this step + mechanical mirror of a mold that
already exists (name it) + no new non-trivial logic and no architecture/product decision + no
dependency beyond the locked premises, the mold and the memory. Anything else is `julgamento`; on the
slightest doubt, `julgamento`. It is a HINT for the planner's model — the recon verdict decides.
```

## Per-step `process.md`

```markdown
# Process — step {NN}_{step_slug}

Task: {nome_task}
Date: {YYYY-MM-DD}
Stage orchestrator: S{NN}-{nome_task} (sonnet)
Git: branch {branch} | commit-base {sha}

## Todo (the 10-stage cycle)

- [ ] 1a. Recon (Sonnet) — recon.md + veredito + partição
- [ ] 1b. Plan (model from the recon verdict) → plan.md + prompts/{escopo}.md  ← measure (1/4)
- [ ] 2. Extract block written in orquestration.md
- [ ] 3. Implement (Sonnet), one agent per scope
- [ ] 4. Lint + type-check (once, output to a file)
- [ ] 5. Validate (fresh Opus) — fix round + re-validate only if CHANGES_REQUIRED  ← measure (2/4)
- [ ] 6. Commit: implement + validate
- [ ] 7. System test — mode + tests-{MM} until PASS  ← measure (3/4)
- [ ] 8. Commit: fixes + each test attempt
- [ ] 9. Step docs + "Padrões capturados" appended to memoria-da-task.md
- [ ] 10. Close  ← measure (4/4, mandatory)

## Test attempts

| Run | Result | Notes |
|-----|--------|-------|
| tests-01 | pending \| PASS \| FAIL | |

## Notes

-
```

## Per-step `agents.md`

```markdown
# Agents — step {NN}_{step_slug}

Written by this step's orchestrator. Every launch carries an explicit `model` and the nonce in
`description`.

| When | Role | Nonce (`description`) | Agent id | Model | subagent_type | janela | Notes |
|------|------|----------------------|----------|-------|---------------|--------|-------|
| {ts} | recon | S{NN}-recon-{nome_task} | {id} | sonnet | general-purpose | {n}k | veredito: … |
| {ts} | planner | S{NN}-plan-{nome_task} | {id} | opus \| sonnet | general-purpose | {n}k | from verdict |
| {ts} | implementer | S{NN}-impl-{escopo}-{nome_task} | {id} | sonnet | general-purpose | {n}k | scope: {escopo} |
| {ts} | validator | S{NN}-validate-{nome_task}-r1 | {id} | opus | general-purpose | {n}k | fresh |
| {ts} | tester | S{NN}-test-{mode}-r01-{nome_task} | {id} | sonnet | browser-tester \| general-purpose | {n}k | tests-01 |

## My own measurements (stage orchestrator)

| Checkpoint | turns | janela | proj | status |
|---|---|---|---|---|
| 1/4 end of plan | | | | ok \| handoff |
| 2/4 validation approved | | | | |
| 3/4 test closed | | | | |
| 4/4 close (mandatory) | | | | |
```

## Per-step `orquestration.md`

```markdown
# Orquestration — step {NN}_{step_slug}

## Extrato do step

Written ONCE by the stage orchestrator, right after the plan lands. ≤40 lines. It is (a) the source of
every extract pasted into a child delta — so they are not re-derived per launch — and (b) what a
SUCCESSOR reads instead of reopening plan.md + recon.md + the reviews. Children told "do not open the
plan" read *this* instead; an instruction to not-open without a place to read from is exactly why the
earlier version of that rule failed.

- Decisões vinculantes: …
- Critérios de aceitação: …
- Arquivos no escopo: …
- Estado de git: branch … | commit-base …
- Armadilhas: …
- Cenário/preset de teste: …

## {timestamp} — recon (S{NN}-recon-{nome_task})

- Pointer: `recon.md` | Veredito: {simples|complexa} | Partição: {não|módulo + suíte}

## {timestamp} — planner (S{NN}-plan-{nome_task}, {model})

- Pointers: `plan.md`, `prompts/{escopo}.md` ×{n}
- Next: implement

## {timestamp} — implementer (S{NN}-impl-{escopo}-{nome_task})

- Files changed: {n} | Type-check: exit={code}

## {timestamp} — validator (S{NN}-validate-{nome_task}-r{N})

- Verdict: {…} | Pointer: `review-r{N}.md` | Findings: {file:line — what}

## {timestamp} — tests-{MM}

- Mode: … | Result: PASS | FAIL | Pointer: `tests-{MM}/verdict.md`
- Next: close step | plan notes + fix → tests-{MM+1}
```

## Per-step `tests-{MM}/verdict.md`

```markdown
# Verdict — step {NN}_{step_slug} / tests-{MM}

Mode: `.test` only | Docker+browser only | both
Result: PASS | FAIL

## Reprodução

- Branch / commit: …
- Servers up (and ports): …
- Seed / preset / fixture: …

## What was tested

- …

## Carried over from tests-{MM-1} (if any)

- Cases previously passed and untouched by the fix: … (why that is safe)

## Failures

- {file:line} — what failed + the lead on the cause (never a fix — the implementer fixes)

## Not run

- {case} — why

## Evidence

- Screenshots: `screenshots/…`
- Commands / logs: (verbose output to a file, `tail -5` in the log)

## Handoff (only if the tester hit the window ceiling)

- Left to exercise: … | State reached / how to reproduce: … | Servers and ports: …

## Next

- On PASS: close the step's system test
- On FAIL: plan notes on `plan.md` → implementer → tests-{MM+1}
```

## Plan footer (append on FAIL / after `.test` fixes)

```markdown
## Notes after tests-{MM} (FAIL)

- What failed: {one line each, file:line}
- Root cause: {the actual cause, or "não identificada"}
- What must be corrected: {actionable, one line each}
- Out of scope / do not change:

## Notes do implementador (após tests-{MM})

- O que foi corrigido:
- Regras de negócio preservadas:
- Testes ajustados (se houver) e por quê:
```

## Per-step `prompts/{escopo-kebab}.md` (written by the step planner)

Delivered to the implementer by `@` mention — **self-contained and short**. A file that grows undoes
the lever, because `@` delivers the whole file.

```markdown
# Escopo: {escopo-kebab} — step {NN}_{step_slug}

## Contrato

- Build: {what, in which files}
- Files you OWN: {list} — anything else is another agent's scope

## Decisões vinculantes (extract)

- …

## Molde a espelhar

- `{path}:{lines}` — {why, and the 3-6 lines that carry the pattern}

## Footprint (do not break)

- `{path}:{line}` — {how it consumes what changes}

## Estado de git

- Branch: {branch} | commit-base: {sha}

## Critérios de aceitação

- …
- Type-check passes (run it ONCE, at the end, output to a file)
```
