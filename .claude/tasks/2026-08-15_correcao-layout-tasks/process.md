# Process — correcao-layout-tasks

Date: 2026-08-15
Skill: claude-step-loop
Git: branch main | commit-base 830b0f3

Origem: bugs encontrados no teste manual da task `.claude/tasks/2026-08-15_tasks-nivel-unico`.

Evidência do usuário (imagens na raiz do repo):
- `test-1.png`, `test-2.png` — bug de layout
- `3-active-tasks.png` — scroll interno indevido nas tasks ativas + minimizar task de grupo ativa

## Todo

- [x] Bootstrap root folder + root docs + git state captured
- [x] Meta-plan (Opus) — 0 perguntas, 9 premissas em `answers.md`
- [x] Meta-plan — steps.md + answers.md + memoria-da-task.md + plan-simplified.md per step
- [x] Commit: meta-plan
- [x] Step 01 — overflow-horizontal-e-colapso-grupo
- [x] Step 02 — scroll-vertical-ativas-e-inativas
- [x] Close task + user summary

## Steps status

| Step | Slug | Class | Stage orchestrator | Status | Last test |
|------|------|-------|--------------------|--------|-----------|
| 01 | overflow-horizontal-e-colapso-grupo | julgamento | S01-correcao-layout-tasks | done | tests-01 PASS |
| 02 | scroll-vertical-ativas-e-inativas | julgamento | S02-correcao-layout-tasks | done | tests-01 PASS |

## Notes

- 2/2 steps fechados, teste de browser PASS na primeira tentativa em ambos. Nenhum handoff, nenhuma
  escalação para Opus no nível de orquestração.
- **Em aberto:** BUG C ("não consigo minimizar uma task de grupo que está ativa") não foi reproduzido.
  Dois steps independentes confirmaram que o chevron e o `handleToggleCollapsed`
  (`IndexTaskGroup.tsx:51-64,118-127`) são incondicionais e não são afetados nem pelo overflow
  horizontal nem pela rolagem vertical. Precisa de repro do usuário.
