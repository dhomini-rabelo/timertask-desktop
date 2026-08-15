# Orquestration — correcao-layout-tasks

Date: 2026-08-15
Skill: claude-step-loop

Uma entrada por step, ≤5 linhas: veredito + ponteiro, nunca um retorno copiado.

## 2026-08-15 — bootstrap

- Root folder criado; git capturado: branch `main` | commit-base `830b0f3`.
- Origem: bugs de layout reportados após a task `2026-08-15_tasks-nivel-unico`.
- Evidência: `test-1.png`, `test-2.png`, `3-active-tasks.png` (raiz do repo).
- Next: meta-planner (opus).

## 2026-08-15 — meta-planner (meta-correcao-layout-tasks)

- Lote de perguntas: **0** — 9 premissas assumidas e registradas em `answers.md` (produto: P2, `max-h` da lista de concluídas).
- Ponteiros: `steps.md`, `answers.md`, `memoria-da-task.md`, `steps/*/plan-simplified.md`.
- Steps: 2 — 01:overflow-horizontal-e-colapso-grupo:julgamento · 02:scroll-vertical-ativas-e-inativas:julgamento. Ambos Docker+browser.
- Ordem 01→02 obrigatória (o container com `overflow-y:auto` do step 02 é o que hoje mascara o bug de largura do step 01).
- Janela: 103k. Next: step 01.
