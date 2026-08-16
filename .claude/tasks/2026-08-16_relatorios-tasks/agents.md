# Agents — relatorios-tasks

Date: 2026-08-16
Skill: claude-step-loop

## Level 0 — Dispatcher

- Role: pure dispatcher (this chat)
- Model: Opus 5 (session default)
- Agent id: n/a (chat level 0)
- Context budget: launches the meta-planner and one stage orchestrator per step; reads no plan, no
  code, no diff, no verdict; commits only the meta-plan and the close

## Agents

| When | Role | Step | Nonce (`description`) | Agent id | Model | subagent_type | janela | Return |
|------|------|------|----------------------|----------|-------|---------------|--------|--------|
| 2026-08-16 | meta-planner | — | meta-relatorios-tasks | ae8a78e0e5900e595 | opus | general-purpose | 102k | 4 steps, 0 perguntas |

## Ledger (what level 0 keeps in context — ≤5 lines per step)

```text
meta | meta-relatorios-tasks | steps: 4 | 0 perguntas | janela: 102k (pct 67) | ok
```

## Reuse decisions

| Chain | Reused? | Why |
|---|---|---|
| meta-planner → answers round | yes | same chain |
| stage orchestrator → next step | **no (default)** | needs ALL of: window ≤80k, N+1 depends on N, no escalation |
| validator per round, tester per attempt | **never** | fresh by design |
