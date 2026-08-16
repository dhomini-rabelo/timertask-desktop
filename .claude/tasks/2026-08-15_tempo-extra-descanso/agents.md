# Agents — tempo-extra-descanso

Date: 2026-08-15
Skill: claude-step-loop

## Level 0 — Dispatcher

- Role: pure dispatcher (this chat)
- Model: Opus (session default)
- Agent id: n/a (chat level 0)
- Context budget: launches the meta-planner and one stage orchestrator per step; reads no plan, no
  code, no diff, no verdict; commits only the meta-plan and the close

## Agents

| When | Role | Step | Nonce (`description`) | Agent id | Model | subagent_type | janela | Return |
|------|------|------|----------------------|----------|-------|---------------|--------|--------|
| 2026-08-15 | meta-planner | — | meta-tempo-extra-descanso | a5ab8c8540383f64c | opus | general-purpose | 107k | 2 steps, 0 perguntas |
| 2026-08-15 | stage orchestrator | 01 | S01-tempo-extra-descanso | — | sonnet | general-purpose | — | interrompido pelo usuário após o recon |
| 2026-08-15 | stage orchestrator (successor) | 01 | S01-tempo-extra-descanso-r2 | ae6ca857d369cd7e4 | sonnet | general-purpose | 124k | step-fechado |
| 2026-08-15 | stage orchestrator | 02 | S02-tempo-extra-descanso | af2557767886c421a | sonnet | general-purpose | 108k | step-fechado |

## Ledger (what level 0 keeps in context — ≤5 lines per step)

```text
meta | meta-tempo-extra-descanso | steps: 2 | perguntas: 0 | janela: 107k | ok
S01 | S01-tempo-extra-descanso-r2 | classe: julgamento | recon: reaproveitado (plan opus) | valid: APPROVED_WITH_RESALVAS r1 | teste: PASS tests-01 | janela: 119k | reuso: não (>80k)
S02 | S02-tempo-extra-descanso | classe: julgamento | recon: complexa (plan opus) | valid: APPROVED_WITH_RESALVAS r1 | teste: PASS tests-01 | janela: 107k
```

## Reuse decisions

| Chain | Reused? | Why |
|---|---|---|
| meta-planner → answers round | yes | same chain |
| stage orchestrator → next step | **no (default)** | needs ALL of: window ≤80k, N+1 depends on N, no escalation |
| validator per round, tester per attempt | **never** | fresh by design |
