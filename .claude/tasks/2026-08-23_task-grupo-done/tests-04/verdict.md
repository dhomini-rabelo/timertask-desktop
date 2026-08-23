# Verdict — tests-04

Task: task-grupo-done
Mode: Docker+browser only (Vite em http://localhost:1420)
Result: **FAIL (mesma causa das rodadas 01-03 — blocker-infra, nenhum caso de produto exercitado)**

## Reproducao

- Branch / commit: main | c1b9a17 (HEAD no inicio desta rodada)
- Vite dev server: JA no ar, `http://localhost:1420/` → 200 (nao iniciado nem parado por nos, conforme
  instrucao do orquestrador)
- Playwright MCP (esperado): `http://localhost:8932/mcp`, extension mode, rodando na maquina Windows

## O que foi checado nesta rodada

1. `ToolSearch({"query":"select:browser_snapshot,browser_click,browser_type,browser_take_screenshot,browser_hover,browser_press_key,browser_find,browser_tabs,browser_console_messages","max_results":10})`
   → **"No matching deferred tools found"**.
2. `ToolSearch({"query":"browser","max_results":20})` → nenhuma tool `browser_*` retornada (so `WebFetch`,
   que nao e a MCP do Playwright).
3. `ListMcpResourcesTool({"server":"playwright"})` → **`Server "playwright" not found"`**, com a lista de
   servidores disponiveis nesta sessao (todos `claude.ai *` + `claude-vscode`) — `playwright` nao esta entre
   eles.
4. `.claude/agents/browser-tester.agent.md` (lido nesta rodada, linhas 1-9): frontmatter `mcpServers` **ja
   esta em forma de mapa** (`playwright: {type: http, url: "http://localhost:8932/mcp"}`), exatamente a
   correcao que o handoff de tests-03 dizia ter sido aplicada. Ou seja, a correcao esta no arquivo, mas a
   tool `browser_*` continua **ausente** nesta sessao — mesmo sintoma de tests-01/tests-02, so que agora
   confirmado numa sessao nova (esta), o que contradiz a expectativa do delta ("esta e uma sessao nova — as
   tools `browser_*` devem existir para voce agora").
5. Script-ponte citado no verdict de tests-03 (`scratchpad/mcpcall.sh`) nao existe nesta sessao — busca
   `find` no repo e no filesystem nao encontrou o arquivo (o `scratchpad/` e isolado por sessao, entao o
   artefato da rodada anterior nao sobrevive). O arquivo `/tmp/mcp-session.id` (fora do scratchpad) ainda
   existe com um id de sessao antigo, mas reconstruir o bridge por conta propria seria "inventar caminho
   alternativo", que o delta desta rodada proibe explicitamente. Nao tentei.

## Casos NAO executados (todos os 8)

1. Grupo vazio → botao de concluir desabilitado.
2. Grupo com 1 de 2 subtasks concluidas → ainda desabilitado, progresso do header coerente.
3. 100% concluidas → habilita; ao clicar, grupo sai da lista ativa e aparece em completed com "N of N completed".
4. Reabrir via RotateCcw → volta para lista ativa, subtasks seguem concluidas.
5. Persistencia (F5) com grupo concluido.
6. Nao-regressao de task solta + contagem/ProgressBar do footer ignorando o grupo.
7. Editar/deletar grupo (cluster de hover intacto).
8. Usabilidade: tooltip do botao desabilitado/habilitado, alinhamento do card de grupo concluido no footer.

Nenhum destes foi tocado — sem tool `browser_*`, nao ha como abrir a aba, tirar snapshot ou clicar em nada.

## Classificacao do bloqueio

**Infra, nao produto.** Nao ha nenhuma evidencia contra a implementacao nesta rodada (nao foi possivel medir
nada). Como registrado em tests-03: type-check passou (exit=0) e a review Opus (`review-r1.md`) aprovou com
resalvas por leitura de codigo (gate / sem-cascata / footer). O gap que falta e exclusivamente exercitar via
browser real.

## Causa provavel (nao investigada a fundo por estar fora do escopo do tester)

A associacao `mcpServers` no frontmatter do agent file aparentemente nao esta sendo aplicada a subagentes
`Agent(subagent_type: "browser-tester", ...)` lancados dentro desta sessao/runtime — ja e a segunda sessao
"nova" em que isso e observado. Pode ser: (a) o runtime so le `mcpServers` de agent file no *start do
processo pai*, nao por subagente lancado depois; ou (b) a chave `mcpServers` no frontmatter simplesmente nao
e suportada para injetar servidor MCP escopado ao agente neste runtime (Claude Code / SDK atual). Isso e uma
hipotese, nao uma conclusao verificada — quem decide o proximo passo de infra deveria confirmar olhando a
documentacao do runtime ou tentando declarar o servidor `playwright` no nivel de sessao/projeto (`.mcp.json`
ou equivalente) em vez de (ou alem de) no agent file.

## Screenshots

Nenhum criado — pasta `.claude/tasks/2026-08-23_task-grupo-done/tests-04/screenshots/` permanece vazia
(confirmado com `ls -la` antes desta rodada: so `.` e `..`).

## Next

- O round de browser continua pendente, agora pela terceira vez com o mesmo sintoma. Sugestao para o
  orquestrador: antes de lancar uma quarta rodada de tester, validar fora do papel de tester que
  `mcpServers` do agent file realmente injeta a tool num `Agent(subagent_type: "browser-tester")` lancado
  *dentro* da sessao atual (nao so que a sessao top-level enxerga `browser_*", que e um caso diferente) —
  ou declarar o servidor `playwright` em escopo de projeto/sessao. Sem isso, uma nova rodada de tester
  provavelmente repete o mesmo FAIL.
