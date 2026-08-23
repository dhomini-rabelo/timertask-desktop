# Orquestration — task-grupo-done

Date: 2026-08-23
Skill: claude-simple-loop

## Extrato da task

- Decisoes vinculantes:
  - Gate: botao "concluir grupo" habilitado SO quando o grupo tem >=1 subtask E 100% das subtasks estao concluidas. Grupo vazio nao pode ser concluido.
  - Sem cascata: concluir/reabrir o grupo nao altera as subtasks (elas ja estao done pelo gate).
  - Pos-conclusao: grupo concluido SAI da lista ativa e aparece na secao "completed" do footer como linha de grupo (titulo + "N of N completed") com botao de reabrir.
  - Acao nova `toggleGroup(id)` no store (nao relaxar o guard de `toggleTask`).
  - Botao Check do grupo no cluster de hover ao lado de Edit/Delete, sem gate `isTimerActive`.
  - Migracao legada: grupos antigos abrem nao-concluidos; ramo com `subtasks` deriva `completed` das proprias subtasks (respeita o gate).
  - `group.completed` e a fonte da verdade de posicionamento; sem auto-reopen.
  - Contagem "X of Y completed" e ProgressBar do footer continuam contando so tasks-folha.
  - `states/reports/sync.ts` fora de escopo (grupo nao vira linha do relatorio diario).
- Criterios de aceitacao: criar grupo -> subtasks -> concluir todas -> concluir grupo -> grupo sai da lista ativa e aparece em completed -> reabrir volta para a lista ativa -> reload preserva o estado. Type-check passa.
- Arquivos no escopo: `src/pages/index/states/tasks/index.ts`, `useStoredTasks.ts`, `useListingTasks`, `IndexTaskGroup.tsx`, `IndexFooter.tsx`, novo `IndexFooter/IndexCompletedTaskGroup.tsx` (6 edits + 1 arquivo novo; detalhe exato em `prompts/grupo-done.md`).
- Estado de git: branch main | commit-base 4628ffc
- Armadilhas: `TaskGroup` nao tinha `completed` (campo obrigatorio -> state+persistencia+UI so type-checam juntos, nao paralelizar); `toggleTask` faz no-op silencioso em ids de grupo; 3 sitios constroem `TaskGroup`.
- Cenario/preset de teste: browser (`npm run dev`) — nao existe teste automatizado para `states/tasks`/`useListingTasks`/componentes `Index*`.

## 2026-08-23 — bootstrap

- Task folder created; git: branch main | commit-base 4628ffc
- Pedido do usuario: bug — tasks em grupo nao podem ser marcadas como done.

## 2026-08-23 — recon (recon-task-grupo-done)

- Pointer: `recon.md`
- Veredito: complexa — gap de 3 camadas (TaskGroup sem campo completed, guard em toggleTask, sem UI no header do grupo) + decisao de produto aberta
- Particao: nao
- Next: plan em opus

## 2026-08-23 — planner (plan-task-grupo-done, opus)

- Batch: 3 topicos; usuario respondeu gate=100% subtasks e >0, sem cascata, grupo concluido vai para a secao completed.
- Pointers: `plan.md`, `prompts/grupo-done.md`
- Escopos: 1 (`grupo-done`) — footprints NAO disjuntos, nao paralelizar
- Sinal de teste: browser (`npm run dev`); sem cobertura automatizada nessa area
- Next: implement (sonnet)

## 2026-08-23 — implementer (impl-grupo-done-task-grupo-done)

- Files changed: 6 edits + 1 novo (IndexCompletedTaskGroup.tsx); helpers em states/tasks/utils.ts
- Type-check (orquestrador, 1x): exit=0
- Next: validate (fresh opus)

## 2026-08-23 — validator (validate-task-grupo-done-r1)

- Verdict: APPROVED_WITH_RESALVAS (5 ressalvas, nenhuma bloqueante)
- Pointer: `review-r1.md`
- Fix round curto no implementer (reuse, 71k): espacador de alinhamento em IndexCompletedTaskGroup + condicao redundante em useStoredTasks; tsc exit=0
- Sem re-validate: fix de 2 linhas, verdict nao era CHANGES_REQUIRED
- Next: system test

## 2026-08-23 — system test mode

- Mode: Docker+browser (aqui: `npm run dev` no browser) only
- Reason: sinal de teste do planner/recon — nao existe cobertura automatizada para states/tasks, useListingTasks e componentes Index*

## 2026-08-23 — tests-01 / tests-02 (browser)

- Result: FAIL blocker-infra nos dois: tools `browser_*` nao chegam a subagentes desta sessao
- Correcoes de infra feitas: `browser-tester.agent.md` mcpServers lista → mapa; browser-instructions.md porta 8931 → 8932 + secao "Connection hygiene (extension mode)"
- Pointers: `tests-01/verdict.md`, `tests-02/verdict.md`

## 2026-08-23 — tests-03 (browser)

- Result: FAIL blocker-infra (nao lancado; diagnostico consolidado pelo orquestrador via HTTP)
- Medido: servidor MCP saudavel (24 tools, aba Timertasks conectada); 0 conexoes desta WSL para :8932
- Causa provavel do loop de dialogo do usuario: outras sessoes (cally, cally-fix) apontam playwright para sse :8931 inexistente
- Pointer: `tests-03/verdict.md` — round de browser PENDENTE, sem PASS

## 2026-08-23 — close

- Decisao do usuario: fechar a task com o round de browser PENDENTE; teste sera rodado em sessao nova (frontmatter corrigido carrega no start).
- Entregue e verificado: implementacao (tsc exit=0) + review Opus r1 APPROVED_WITH_RESALVAS + fix curto de alinhamento.
- Nao entregue: prova de runtime no browser (tests-01/02/03 = blocker-infra, sem PASS).
- Loop de dialogo da Playwright Extension: nao vem desta sessao (0 conexoes desta WSL para :8932); suspeito = cally/cally-fix apontando playwright para sse :8931 inexistente (nao alterado, decisao do usuario foi so fechar).

## 2026-08-23 — tests-04 (browser) + causa-raiz da infra

- Result: FAIL blocker-infra (4a vez), agora com **causa-raiz identificada**.
- Tester `test-task-grupo-done-browser-r04` (ac5eeb8d158d87ec8, sonnet, 66k): sessao NOVA, `mcpServers` do
  agent file ja em forma de mapa, e ainda assim `ListMcpResourcesTool(server:"playwright")` →
  `Server "playwright" not found`. Prova de que `mcpServers` no `.claude/agents/*.agent.md` **nao e honrado
  por subagentes neste runtime (VSCode/SDK)** — a correcao lista→mapa era necessaria mas nao suficiente.
- Causa-raiz: **`.mcp.json` nao existia no repo**. O servidor `playwright` nunca esteve declarado em escopo
  de projeto, que e o lugar que o runtime carrega no start da sessao.
- Fix aplicado: criado `.mcp.json` com `playwright` = `{type: http, url: http://localhost:8932/mcp}`.
  Carrega no **start da proxima sessao** — nao vale para esta.
- Medido pelo orquestrador nesta sessao (servidor saudavel, sem defeito de produto a vista):
  `initialize` OK (Playwright 1.63.0-alpha), `tools/list` = 24 tools `browser_*`,
  `browser_tabs list` = aba real `Timertasks` em :1420, `browser_find` respondendo.
  Schema desta versao: `target` (nao `ref`) e `scale` obrigatorio em `browser_take_screenshot`.
- Estado do app observado: grupo residual `Grupo Vazio` com 2 subtasks 0/2; 3 erros de console = ruido da
  extensao Playwright, nao do app.
- Round de browser continua **PENDENTE** (sem PASS). Pointer: `tests-04/verdict.md`.
