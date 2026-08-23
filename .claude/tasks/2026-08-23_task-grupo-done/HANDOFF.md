# Handoff — retomar `task-grupo-done` em sessao nova

Cole o bloco abaixo como primeira mensagem da sessao nova (na pasta
`/home/fael/so/code/saas/timertask-desktop`). Ele e autossuficiente: o proximo orquestrador nao
precisa reler `plan.md`, `recon.md` nem os reviews.

---

Retome uma task do skill **claude-simple-loop** que ficou parada no **unico passo pendente: o round
de teste de sistema no browser (§4 do SKILL)**. Nao replaneje, nao reimplemente, nao revalide.

## Onde a task esta

- Skill: `.claude/skills/claude-simple-loop/SKILL.md` — voce e o orquestrador (level 0), mesmo
  contrato de contexto: nao leia `plan.md`, `recon.md`, `review-r1.md` nem diffs.
- Task dir: `.claude/tasks/2026-08-23_task-grupo-done/`
- Estado por doc: `process.md` (todo), `orquestration.md` (log + `## Extrato da task`),
  `agents.md` (nonces usados), `tests-01|02|03/verdict.md` (as 3 tentativas falhadas).
- Git: branch `main`. Stages ja commitados: `f367a03` plan, `60911a0` implement, `b261997` validate,
  `99ddb2a` system-test-03 (blocker infra), `f0c4485` close parcial.

## Ja feito (nao repita)

- Recon (sonnet): veredito `complexa`.
- Plan (opus): `plan.md` + `prompts/grupo-done.md`, 3 decisoes de produto respondidas pelo usuario.
- Implement (sonnet): 6 edits + `IndexCompletedTaskGroup.tsx` novo; `npx tsc --noEmit` exit=0.
- Validate r1 (opus): `APPROVED_WITH_RESALVAS` + fix curto de alinhamento. Ressalvas restantes ficam
  registradas de proposito.

## O que falta: tests-04 (browser)

Modo: **browser only** (`npm run dev` / Vite em http://localhost:1420 — provavelmente ja no ar;
`timeout 5 curl -s -o /dev/null -w "%{http_code}\n" http://localhost:1420/` e reuse no 200, nao
inicie nem pare servidor).

1. Crie `.claude/tasks/2026-08-23_task-grupo-done/tests-04/screenshots/`.
2. Lance **um** agente `subagent_type: browser-tester`, `model: sonnet`, foreground,
   `description: test-task-grupo-done-browser-r04`, com prompt =
   `@.claude/skills/claude-simple-loop/prompts/tester-retry.md` +
   `@.claude/docs/browser-instructions.md` + o extrato e os 8 casos abaixo.
3. O tester escreve `tests-04/verdict.md` e copia as screenshots antes de retornar.
4. Commit: `claude-simple-loop(task-grupo-done): system-test-04 — ...`
5. Em FAIL de produto: plan notes (`prompts/plan-notes.md`) -> fix no implementer -> `tests-05`.
   Em PASS: feche `process.md` e resuma pelo ledger.

### Antes de lancar: confirme que as tools MCP existem nesta sessao

As 3 tentativas anteriores morreram porque os subagentes nao recebiam tool `browser_*`
(`ListMcpResourcesTool(server:"playwright")` -> `Server "playwright" not found`). O
`mcpServers` de `.claude/agents/browser-tester.agent.md` ja foi corrigido (mapa, http,
`http://localhost:8932/mcp`) e **so carrega no start da sessao** — por isso a sessao nova.
Se ainda faltar, o caminho comprovado e o bridge JSON-RPC por HTTP (`initialize` ->
`notifications/initialized` -> `tools/call`) reaproveitando UMA sessao MCP; receita em
`tests-03/verdict.md`.

Higiene obrigatoria (o servidor roda em `--extension` no Windows e cada nova sessao de cliente abre
dialogo de aprovacao no Chrome do usuario): um tester por run, nunca `browser_close`/`browser_install`,
`browser_tabs` list primeiro e reuse a aba `Timertasks`, um retry em erro de conexao e depois pare.
Screenshots do servidor Windows aparecem em `/mnt/c/Users/T-GAMER/.playwright-mcp/`.

## Extrato da task (cole no delta do tester)

- Gate: botao Check no cluster de hover do header do grupo (ao lado de Edit/Delete) habilita SO com
  >=1 subtask E 100% das subtasks concluidas. Grupo vazio nao pode ser concluido.
- Sem cascata: concluir/reabrir o grupo nao altera as subtasks.
- Pos-conclusao: grupo concluido SAI da lista ativa e aparece na secao completed do footer como linha
  de grupo (titulo + "N of N completed") com botao de reabrir (RotateCcw).
- Contagem "X of Y completed" e ProgressBar do footer contam so tasks-folha.
- Arquivos no escopo: `states/tasks/index.ts`, `states/tasks/utils.ts`, `hooks/useStoredTasks.ts`,
  `hooks/useListingTasks.ts`, `IndexTaskGroup.tsx`, `IndexFooter.tsx`,
  `IndexFooter/IndexCompletedTaskGroup.tsx` (novo).
- Nao rode o type-checker (ja rodou: exit=0). Use itens com prefixo `QA-` e apague o que criar.

## 8 casos profundos obrigatorios (screenshot por estado)

1. Grupo vazio: botao de concluir DESABILITADO.
2. Grupo com 1 de 2 subtasks concluidas: ainda desabilitado; progresso do header coerente.
3. 100% concluidas: habilita; ao clicar, grupo sai da lista ativa e aparece em completed com
   "N of N completed".
4. Reabrir via RotateCcw: volta para a lista ativa, subtasks seguem concluidas (sem cascata reversa).
5. Persistencia: com grupo concluido, F5 -> continua em completed; reabrir depois do reload funciona.
6. Nao-regressao: task solta concluir/reabrir normal; contagem e ProgressBar do footer nao contam o grupo.
7. Editar e deletar o grupo continuam funcionando (cluster de hover intacto).
8. Usabilidade: title/tooltip do botao desabilitado vs habilitado; alinhamento do card de grupo
   concluido em relacao aos itens concluidos no footer.
