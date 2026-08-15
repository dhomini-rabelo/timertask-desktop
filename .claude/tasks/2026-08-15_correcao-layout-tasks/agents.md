# Agents — correcao-layout-tasks

Date: 2026-08-15
Skill: claude-step-loop

## Level 0 — Dispatcher

- Role: pure dispatcher (this chat)
- Model: Opus 5 (1M) — sessão
- Agent id: n/a (chat level 0)
- Context budget: lança o meta-planner e um stage orchestrator por step; não lê plano, código, diff
  nem veredito; commita só o meta-plan e o close

## Agents

| When | Role | Step | Nonce (`description`) | Agent id | Model | subagent_type | janela | Return |
|------|------|------|----------------------|----------|-------|---------------|--------|--------|
| 2026-08-15 | meta-planner | — | meta-correcao-layout-tasks | aa251c9027669427e | opus | general-purpose | 103k | 2 steps, 0 perguntas |
| 2026-08-15 | stage orchestrator | 01 | S01-correcao-layout-tasks | adeffcccf067d90b3 | sonnet | general-purpose | 79k | step-fechado |
| 2026-08-15 | stage orchestrator | 02 | S02-correcao-layout-tasks | ab060f1bbdaca7b22 | sonnet | general-purpose | 77k | step-fechado |

## Ledger (level 0, ≤5 linhas por step)

```text
meta | meta-correcao-layout-tasks | steps: 2 | perguntas: 0 | janela: 103k | ok (commit 3e3108a)
S01 | S01-correcao-layout-tasks | classe: julgamento | recon: complexa (plan opus) | valid: PASS r1 | teste: PASS tests-01 | commits e521536/a223747/91fd07b | janela: 79k | reuso: não
S02 | S02-correcao-layout-tasks | classe: julgamento | recon: simples mas divergiu (plan opus) | valid: APPROVED_WITH_RESALVAS r1 | teste: PASS tests-01 | commits babcf1e/9cc0397 | janela: 77k | fim
```

## Reuse decisions

| Chain | Reused? | Why |
|---|---|---|
| meta-planner → answers round | yes | mesma cadeia |
| stage orchestrator → next step | **no (default)** | exige janela ≤80k + dependência direta + sem escalação |
| validator por rodada, tester por tentativa | **never** | fresh by design |
