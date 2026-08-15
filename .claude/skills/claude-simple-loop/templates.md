# Claude Simple Loop — task file templates

Copy these into `.claude/tasks/{YYYY-MM-DD}_{nome_task}/` at bootstrap. Replace placeholders.

**Write them short.** These files are the audit trail and the resume state, not a narrative: writing
is ~12× the per-token price of reading, and a level-0 orchestrator measured in a comparable pipeline
spent **42% of its own cost on output** (78k tokens in 24 turns) by writing too much. Never copy an
agent's return in full — log the verdict and the pointer.

## `process.md`

```markdown
# Process — {nome_task}

Date: {YYYY-MM-DD}
Skill: claude-simple-loop
Git: branch {branch} | commit-base {sha}

## Todo

- [ ] Bootstrap task folder + docs + git state captured
- [ ] Recon (Sonnet) — map + verdict `simples`/`complexa` + partition signal
- [ ] Plan (model from the recon verdict) — clarifying questions batch
- [ ] Plan — final plan.md + one ready prompt per scope
- [ ] Extract block written in orquestration.md
- [ ] Commit: plan
- [ ] Implement (Sonnet) — one agent per scope
- [ ] Lint + type-check (once, orchestrator)
- [ ] Commit: implement
- [ ] Validate + code-pattern review (fresh Opus)
- [ ] Fix round (Sonnet) — only if CHANGES_REQUIRED
- [ ] Re-validate (fresh, -r{N+1}) — only if there was a fix round
- [ ] Commit: validate
- [ ] Decide system test mode: `.test` only | Docker+browser only | both | skip (docs-only)
- [ ] tests-01 — run + verdict.md (PASS required to finish; else fix loop)
- [ ] On FAIL: plan notes → implement fix → tests-02 / tests-03 …
- [ ] Commit: system-test (per attempt)
- [ ] Close + user summary

## Test attempts

| Run | Result | Notes |
|-----|--------|-------|
| tests-01 | pending \| PASS \| FAIL | |
| tests-02 | … | |

## Notes

-
```

## `agents.md`

```markdown
# Agents — {nome_task}

Date: {YYYY-MM-DD}
Skill: claude-simple-loop

## Level 0 — Orchestrator

- Role: orchestrator (this chat)
- Model: (session default)
- Agent id: n/a (chat level 0)
- Context budget: no code, no plan, no diffs, no verdicts — pointers and verdicts only

## Agents

One row per launch. The **nonce is the `description` parameter** of the `Agent` call — never a pretty
label, or the agent cannot measure its own window. `janela` is the `subagent_tokens` of the return
(window occupancy, not traffic).

| When | Role | Nonce (`description`) | Agent id | Model | subagent_type | janela | Notes |
|------|------|----------------------|----------|-------|---------------|--------|-------|
| {ts} | recon | recon-{nome_task} | {id} | sonnet | general-purpose | {n}k | veredito: simples\|complexa |
| {ts} | planner | plan-{nome_task} | {id} | opus \| sonnet | general-purpose | {n}k | model from recon verdict |
| {ts} | implementer | impl-{escopo}-{nome_task} | {id} | sonnet | general-purpose | {n}k | scope: {escopo} |
| {ts} | validator | validate-{nome_task}-r1 | {id} | opus | general-purpose | {n}k | fresh, round 1 |
| {ts} | tester | test-{nome_task}-{mode}-r01 | {id} | sonnet | browser-tester \| general-purpose | {n}k | tests-01 |

## Ledger (what level 0 keeps in context — ≤5 lines per stage)

```text
recon | recon-{nome_task} | veredito: {simples|complexa} | partição: {não|módulo + suíte}
plan | plan-{nome_task} | janela: {n}k | escopos: {n} | ok (commit {sha})
implement | impl-{escopo}-{nome_task} | arquivos: {n} | tsc exit=0 (commit {sha})
validate | validate-{nome_task}-r1 | {APPROVED|APPROVED_WITH_RESALVAS|CHANGES_REQUIRED} | rodadas: {n}
test | test-{nome_task}-{mode}-r01 | {PASS|FAIL} | tests-01/verdict.md
```

## Reuse decisions

| Chain | Reused? | Why |
|---|---|---|
| planner → answers → plan notes | yes/no | window ≤80k and same scope |
| implementer → fix round | yes/no | window ≤80k and same scope |
| validator per round | **never** | one that already approved arrives anchored |
| tester per attempt | **never** | handoff channel is verdict.md |
```

## `orquestration.md`

```markdown
# Orquestration — {nome_task}

Date: {YYYY-MM-DD}
Skill: claude-simple-loop

Chronological log of agent ↔ orchestrator decisions. **≤5 lines per entry** — verdict + pointer,
never the deliverable itself.

## Extrato da task

Written ONCE, right after the plan lands. ≤40 lines. This block is (a) the source of the extracts
pasted into child deltas, so the orchestrator does not re-derive them at every launch, and (b) what a
successor orchestrator reads instead of reopening plan.md + recon.md + the reviews. Children that are
told "do not open the plan" read *this* instead — an instruction to not-open without a place to read
from is the reason the earlier version of this rule failed.

- Decisões vinculantes: …
- Critérios de aceitação: …
- Arquivos no escopo: …
- Estado de git: branch … | commit-base …
- Armadilhas: …
- Cenário/preset de teste: …

## {timestamp} — bootstrap

- Task folder created; git state captured (branch / commit-base).

## {timestamp} — recon (recon-{nome_task})

- Pointer: `recon.md`
- Veredito: simples | complexa — {one line}
- Partição: não | módulo + suíte
- Next: plan in {opus|sonnet}

## {timestamp} — planner (plan-{nome_task})

- Question batch: {n} topics (or "sem dúvidas")
- User answered: {tópico → decisão, one line each}
- Pointers: `plan.md`, `prompts/{escopo}.md` ×{n}
- Next: implement

## {timestamp} — implementer (impl-{escopo}-{nome_task})

- Files changed: {n} — {list}
- Type-check: exit={code}
- Next: lint/tsc (orchestrator) → validate

## {timestamp} — validator (validate-{nome_task}-r{N})

- Verdict: APPROVED | APPROVED_WITH_RESALVAS | CHANGES_REQUIRED
- Pointer: `review-r{N}.md`
- Findings: {one line each, file:line}
- Next: fix | system-test

## {timestamp} — system test mode

- Mode: `.test` only | Docker+browser only | both | skip (docs-only)
- Reason: {from recon "Sinal de teste" when still valid}

## {timestamp} — tests-{NN} (test-{nome_task}-{mode}-r{NN})

- Result: PASS | FAIL
- Pointer: `tests-{NN}/verdict.md` (+ `screenshots/`)
- Next: close | plan notes + fix → tests-{NN+1}

## {timestamp} — fix after tests-{NN} (if FAIL)

- Plan notes appended: yes — root cause: {one line}
- Implementer: reused (SendMessage) | fresh (-fix{N}) — why
- Next: tests-{NN+1}
```

## `tests-{NN}/verdict.md`

```markdown
# Verdict — tests-{NN}

Task: {nome_task}
Mode: `.test` only | Docker+browser only | both
Result: PASS | FAIL

## Reprodução

- Branch / commit: …
- Servers up (and ports): …
- Seed / preset / fixture: …

## What was tested

- …

## Carried over from tests-{NN-1} (if any)

- Cases previously passed and untouched by the fix: … (why that is safe)

## `.test` (if applicable)

- Commands:
- Result: pass | fail
- Notes:

## Docker+browser (if applicable)

- Stack:
- Flows / deep cases (create / edit / delete / validation / success / usability):
- Result: pass | fail
- Screenshots:
  - `screenshots/…`

## Failures

- {file:line} — what failed, and the lead on the cause (never a fix — the implementer fixes)

## Not run

- {case} — why

## Handoff (only if the tester hit the window ceiling)

- Left to exercise: …
- State reached / how to reproduce it: …
- Servers up on which ports: …

## Next

- On PASS: close system-test
- On FAIL: plan notes on `plan.md` → implementer → tests-{NN+1}
```

## Plan footer (append on FAIL / after `.test` fixes)

```markdown
## Notes after tests-{NN} (FAIL)

- What failed: {one line each, file:line}
- Root cause: {the actual cause, or "não identificada"}
- What must be corrected: {actionable, one line each}
- Out of scope / do not change:

## Notes do implementador (após tests-{NN})

- O que foi corrigido:
- Regras de negócio preservadas:
- Testes ajustados (se houver) e por quê:
```

## `prompts/{escopo-kebab}.md` (written by the planner, one per implementation scope)

Delivered to the implementer by `@` mention — so it must be **self-contained and short**. A file that
grows undoes the lever, because `@` delivers the whole file.

```markdown
# Escopo: {escopo-kebab} — {nome_task}

## Contrato

- Build: {what, in which files}
- Files you OWN: {list} — anything else is another agent's scope

## Decisões vinculantes (extract)

- …

## Molde a espelhar

- `{path}:{lines}` — {why this is the mold, and the 3-6 lines that carry the pattern}

## Footprint (do not break)

- `{path}:{line}` — {how it consumes what changes}

## Estado de git

- Branch: {branch} | commit-base: {sha}

## Critérios de aceitação

- …
- Type-check passes (run it ONCE, at the end, output to a file)
```
