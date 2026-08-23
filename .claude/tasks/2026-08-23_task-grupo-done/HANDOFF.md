# Handoff — retomar `task-grupo-done` em sessao nova (tests-05)

Cole o bloco abaixo como primeira mensagem da sessao nova (na pasta
`/home/fael/so/code/saas/timertask-desktop`). Ele e autossuficiente: o proximo orquestrador nao
precisa reler `plan.md`, `recon.md` nem os reviews.

**PRE-REQUISITO FORA DO CLAUDE:** aceitar o trust da pasta (ver secao "Infra" abaixo). Sem isso o
tests-05 falha exatamente como as 4 rodadas anteriores.

---

Retome uma task do skill **claude-simple-loop** que ficou parada no **unico passo pendente: o round
de teste de sistema no browser (§4 do SKILL)**. Nao replaneje, nao reimplemente, nao revalide.

## Onde a task esta

- Skill: `.claude/skills/claude-simple-loop/SKILL.md` — voce e o orquestrador (level 0), mesmo
  contrato de contexto: nao leia `plan.md`, `recon.md`, `review-r1.md` nem diffs.
- Task dir: `.claude/tasks/2026-08-23_task-grupo-done/`
- Estado por doc: `process.md` (todo), `orquestration.md` (log + `## Extrato da task`),
  `agents.md` (nonces usados), `tests-01|02|03|04/verdict.md` (as 4 tentativas falhadas — todas
  blocker-infra, **nenhum caso de produto jamais exercitado**).
- Git: branch `main`. Ultimos commits: `f84338e` system-test-04, `d1f96e9` fix da infra MCP.

## Ja feito (nao repita)

- Recon (sonnet): veredito `complexa`. Plan (opus): `plan.md` + `prompts/grupo-done.md`.
- Implement (sonnet): 6 edits + `IndexCompletedTaskGroup.tsx` novo; `npx tsc --noEmit` exit=0.
- Validate r1 (opus): `APPROVED_WITH_RESALVAS` + fix curto de alinhamento. Ressalvas restantes ficam
  registradas de proposito.

## Infra: por que 4 rodadas falharam e o que foi consertado

O subagente `browser-tester` nunca recebeu tool `browser_*` (`ListMcpResourcesTool(server:"playwright")`
→ `Server "playwright" not found`). Causa-raiz achada na doc oficial (`docs/en/sub-agents.md`), **duas
causas somadas**:

1. `mcpServers` no frontmatter tem que ser **lista YAML** (`- playwright:` com a config indentada
   abaixo), nao mapa. A rodada 03 trocou lista→mapa, quebrando o que estava certo desde `d4204d3`.
   **Ja restaurado** para lista em `.claude/agents/browser-tester.md`.
2. `hasTrustDialogAccepted = false` para este projeto em `~/.claude.json`. Desde a **v2.1.238**
   (CLI local 2.1.239) servidor MCP inline em `.claude/agents/` **so carrega com a pasta confiada**, e
   e pulado **em silencio**. Isso explica tests-01/02, que rodaram com o YAML correto.
   → **Aceite o trust da pasta ao abrir a sessao nova** (ou confirme
   `hasTrustDialogAccepted: true` para `/home/fael/so/code/saas/timertask-desktop`).

Tambem feito: agent file renomeado para `.claude/agents/browser-tester.md` (`.agent.md` nao e
convencao documentada); `.mcp.json` **nao** deve existir — escopo de projeto daria o playwright para a
sessao toda, e o desenho e que so o tester tenha.

### Primeira coisa a fazer na sessao nova

Confirme que o `browser-tester` ve o servidor **antes** de gastar um round completo: lance um agente
barato que so rode `ListMcpResourcesTool(server:"playwright")` + `browser_tabs {"action":"list"}` e
volte. Se ainda der `not found`, o problema e o trust — nao lance o round de 8 casos.

## O que falta: tests-05 (browser)

Modo: **browser only** (Vite em http://localhost:1420 — provavelmente ja no ar;
`timeout 5 curl -s -o /dev/null -w "%{http_code}\n" http://localhost:1420/` e reuse no 200, nao
inicie nem pare servidor).

1. Crie `.claude/tasks/2026-08-23_task-grupo-done/tests-05/screenshots/`.
2. Lance **um** agente `subagent_type: browser-tester`, `model: sonnet`, foreground,
   `description: test-task-grupo-done-browser-r05`, com prompt =
   `@.claude/skills/claude-simple-loop/prompts/tester.md` +
   `@.claude/skills/claude-simple-loop/prompts/tester-retry.md` +
   `@.claude/docs/browser-instructions.md` + o extrato e os 8 casos abaixo.
   Handoff de leitura do tester: **so** `tests-04/verdict.md`.
3. O tester escreve `tests-05/verdict.md` e copia as screenshots antes de retornar.
4. Commit: `claude-simple-loop(task-grupo-done): system-test-05 — ...`
5. Em FAIL de produto: plan notes (`prompts/plan-notes.md`) -> fix no implementer -> `tests-06`.
   Em PASS: feche `process.md` e resuma pelo ledger.

### Higiene de conexao (servidor em `--extension` no Windows)

Cada nova sessao de cliente MCP abre dialogo de aprovacao no Chrome do usuario: um tester por run,
nunca `browser_close`/`browser_install`, `browser_tabs` list primeiro e reuse a aba `Timertasks`, um
retry em erro de conexao e depois pare. Screenshots do servidor Windows aparecem em
`/mnt/c/Users/T-GAMER/.playwright-mcp/` (o caminho reportado vem como `.playwright-mcp\<arquivo>.png`).

### Schema medido do servidor (Playwright MCP 1.63.0-alpha)

`browser_click` / `browser_type` / `browser_hover` / `browser_take_screenshot` usam **`target`** (o ref
do snapshot), **nao** `ref`. `browser_take_screenshot` **exige `scale`** (use `"css"`).
`browser_find {"text":"..."}` e barato para checar estado sem puxar snapshot inteiro.

### Estado do app ja medido (nao redescubra)

- Ja existe um grupo residual `Grupo Vazio` com 2 subtasks (`Subtask A`, `Subtask B`), 0 de 2
  concluidas — apesar do nome, **nao** esta vazio. Serve de material para os casos 2–5; para o caso 1
  crie um grupo realmente vazio.
- Criacao: no input do topo (`Add a task... (use > to create a group)`) o prefixo `>` cria **grupo**;
  o input de dentro do card cria subtask. O botao desabilitado do header ja aparece com
  `title="Complete all tasks first"`.
- Os 3 erros de console da pagina sao ruido da extensao do Playwright ("listener indicated an
  asynchronous response…"), **nao** sao defeito do app. Reporte so erros novos diferentes desse.

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
