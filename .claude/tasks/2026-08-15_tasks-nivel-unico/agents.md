# Agents — tasks-nivel-unico

Date: 2026-08-15
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
| 2026-08-15 | meta-planner | — | meta-tasks-nivel-unico | | opus | general-purpose | | |

## Ledger

```text
meta | meta-tasks-nivel-unico | (running)
```

## Reuse decisions

| Chain | Reused? | Why |
|---|---|---|
| meta-planner → answers round | yes | same chain |
| stage orchestrator → next step | no (default) | needs window ≤80k + direct dep + no escalation |
