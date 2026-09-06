# Orquestration — layout-task-card

Date: 2026-09-06
Skill: claude-simple-loop

## Respostas do usuário (batch antecipado, antes do recon — usuário sai)

- Item 5 (dados no topo): decisão delegada ao time — "melhor opção, o que mais deixaria o user motivado a continuar".
- Item 2 (paused): remover o componente de "paused" em TODOS os casos (grupo e unitária).
- Item 4 (2 colunas): o card de task ocupa a largura de 2 colunas do grid. Ordem: grupo de tasks/subtasks ATIVAS em cima (com altura máxima + scroll quando houver muitas subtasks), depois grupo de PAUSADAS e grupos PENDENTES embaixo. Dentro do card: header (logo ---- options) → timer menor abaixo → estatísticas ocupando boa parte da largura.
- Escopo: pode alterar componentes compartilhados (standalone e grupo mudam juntos); testar os dois para não regredir.

## Extrato da task

- Decisões vinculantes:
  - Item 1: dar respiro entre a contagem de completadas e a box do nome da task (subtasks de grupo).
  - Item 2: remover o componente/badge "paused" em TODOS os casos (grupo e unitária).
  - Item 3: na task de grupo, start/end/duration vão para a parte de baixo do card; nome do grupo ao lado do título. Molde: `IndexCompletedTaskItem.tsx`.
  - Item 4: card principal em LARGURA CHEIA (2 colunas do grid), empilhado: header (logo ---- options) → timer `text-4xl` menor → estatísticas em faixa larga. Abaixo, full-width: Active (max-height + scroll interno) → Paused → Pending.
  - Item 5: 4 métricas novas — Today's Focus, Sessions, Avg/session, In Progress. ZERO migração de schema; só dado existente/derivável.
  - Pode alterar componentes compartilhados; standalone e grupo precisam ser testados contra regressão.
- Critérios de aceitação: os 5 itens visíveis na UI; sem regressão em task standalone; type-check limpo; PASS em browser test.
- Arquivos no escopo:
  - A (`prompts/card-task-itens-1-2-3.md`): IndexTaskItem.tsx, IndexTaskGroup.tsx, IndexGroupTasksList.tsx, IndexCompletedTaskItem.tsx, date.ts
  - B (`prompts/layout-pagina-e-stats-4-5.md`): page.tsx, IndexTimer.tsx, IndexScore.tsx, scoreUtils.ts, utils.ts, useListingTasks.ts, IndexTasks.tsx, IndexActiveTasksList.tsx
  - Footprints disjuntos → A e B rodam em paralelo.
- Estado de git: branch main | commit-base 4ed315b
- Armadilhas: MCP Playwright quebrado neste host → testar via script Node+Playwright; precisa shim `Notification.permission='granted'` e re-clicar Start no timer global após reload.
- Cenário/preset de teste: `QA-Grupo-Scroll` (8 subtasks, prova o scroll), `QA-Grupo-Pendente`, `QA-Task-Solta` pausada, `QA-Grupo-100` (estado 100% do screenshot 03a).
- Limite de rodadas de teste: 20.

## 2026-09-06 — planner (plan-layout-task-card + p2)

- Pointers: `plan.md`, `prompts/card-task-itens-1-2-3.md`, `prompts/layout-pagina-e-stats-4-5.md`
- Sem batch de perguntas (usuário ausente) — 13 premissas documentadas no plan.md.
- Correção p2: item 4 estava invertido (sidebar de 1 coluna); reescrito como pilha full-width conforme decisão literal do usuário. Escopos seguem disjuntos.
- Next: implement A e B em paralelo (sonnet).

## 2026-09-06 — bootstrap

- Pasta criada; git: branch main | commit-base 4ed315b.

## 2026-09-06 — recon (recon-layout-task-card)

- Pointer: `recon.md` | janela 88k
- Veredito: complexa (multi-frente, >6 arquivos, decisão de produto aberta nos itens 4/5, agrupamento ativas/pausadas/pendentes é lógica nova)
- Partição: não. Molde: `IndexCompletedTaskItem.tsx` (resolve item 3). Sem molde para o grid do item 4.
- Sinal de teste: sem cobertura automatizada → browser/Playwright.
- Next: plan em Opus (sem batch de perguntas — usuário ausente, premissas documentadas).

## Override do usuário — gatilho de re-design

- A regra padrão da skill ("três FAILs consecutivos no mesmo caso → re-design com planner fresh")
  fica suspensa nesta task: o gatilho passa para **20 FAILs consecutivos no mesmo caso**.
- Não há e nunca houve teto de tentativas de teste: o loop segue abrindo tests-NN até PASS.
- Vale para todos os testers e rodadas de fix desta task; repassar no delta de cada tester.

## 2026-09-06 — regra de execução (usuário)

- Limite de rodadas de teste desta task: **20** (tests-01 … tests-20). Só paro o loop de teste ao atingir PASS ou esgotar tests-20.
- Mantida a regra do skill: 3 FAILs consecutivos no mesmo caso → re-design (planner fresh lendo plan.md + todos os verdicts), sem consumir o limite indevidamente.

## 2026-09-06 — implement (A e B em paralelo)

- A `impl-card-task-itens-1-2-3-layout-task-card`: 5 arquivos (date.ts, IndexCompletedTaskItem, IndexTaskGroup, IndexGroupTasksList, IndexTaskItem) | tsc exit=0
- B `impl-layout-pagina-e-stats-4-5-layout-task-card`: 8 arquivos (page.tsx, IndexTimer, IndexScore, scoreUtils, utils, useListingTasks, IndexTasks, IndexActiveTasksList) | tsc exit=0
- Orquestrador: `npx tsc --noEmit` exit=0. Sem script de lint no package.json.
- Next: validate (fresh Opus, r1).

## 2026-09-06 — validate r1 + fix

- Veredito: APPROVED_WITH_RESALVAS | pointer `review-r1.md` | 8 ressalvas, nenhuma bloqueante.
- Fix round (reuso dos implementadores A e B): A → GroupTitleContext elimina O(N²) em IndexTaskItem + a11y no scroll de subtasks. B → header persiste no boot, `calculateTotalSessions` conta 1 sessão por task (não por resume), IndexScore sem varredura extra, label "Active" fora do scroll + a11y, `Section` → `TaskActivityStatus`.
- Fora do fix (aceito): DragOverlay e feedback de drop entre seções — opcionais, custo/risco.
- tsc exit=0. Next: validate r2 (fresh Opus, só o delta do fix).

## 2026-09-06 — validate r2 + fix final

- Veredito: APPROVED_WITH_RESALVAS | pointer `review-r2.md` | todas as ressalvas de risco da r1 confirmadas resolvidas, sem regressão no delta.
- Fix final: A → `role="region"` + `GroupTitleContext.ts` como módulo folha (quebra import circular). B → remove `calculateAverageSessionTime` morta; rótulos passam a "Tasks Started" / "Avg / task" (decisão do orquestrador: "Sessions" era ambíguo frente a "In Progress").
- tsc exit=0. Sem r3: fixes mecânicos de 2 linhas.

## 2026-09-06 — modo de teste

- Modo: **browser only** (sem cobertura automatizada no repo; mudança é 100% de UI/layout).
- Rota: script Node+Playwright (MCP do host quebrado, mesmo diagnóstico de 2026-08-23_task-grupo-done/tests-07).
