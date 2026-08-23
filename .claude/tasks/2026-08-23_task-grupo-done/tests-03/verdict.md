# Verdict — tests-03

Task: task-grupo-done
Mode: Docker+browser only (Vite em http://localhost:1420)
Result: FAIL (blocker-infra — nenhum caso de produto exercitado)

## Reproducao

- Branch / commit: main | b261997 (base 4628ffc)
- Vite dev server: JA no ar, http://localhost:1420 → 200 (nao iniciado nem parado por nos)
- Playwright MCP: `npx @playwright/mcp@latest --port 8932 --host 0.0.0.0 --extension` na maquina Windows

## O que foi medido (pelo orquestrador, via HTTP puro)

- `initialize` em http://localhost:8932/mcp responde: `serverInfo: Playwright 1.63.0-alpha-2026-08-05`
- `tools/list` expoe **24 tools `browser_*`**
- `tools/call browser_tabs {"action":"list"}` retorna a aba real do usuario: `0: (current) [Timertasks](http://localhost:1420/)`
  → o servidor MCP e a extensao do Chrome estao **saudaveis e conectados**

## Por que nenhum caso rodou

- Subagentes `browser-tester` desta sessao nao recebem tool `browser_*` nenhuma:
  `ListMcpResourcesTool(server: "playwright")` → `Server "playwright" not found` (tests-01, tests-02).
- `.claude/agents/browser-tester.agent.md` tinha `mcpServers` em forma de **lista**; corrigido para **mapa**
  (`playwright: {type: http, url: ...}`). A correcao NAO passou a valer nesta sessao — definicao de agente
  com MCP proprio e resolvida no start da sessao (ou nao e suportada neste runtime VSCode/SDK).
- `ss -tnp | grep :8932` desta maquina WSL: **0 conexoes** — o loop de reconexao que o usuario ve
  (dialogo da Playwright Extension a cada ~25s) NAO vem desta sessao.
- Suspeito externo mapeado: outras sessoes do Claude Code do usuario (`~/so/repos/cally`, `~/so/repos/cally-fix`)
  tem `playwright` configurado como `sse` em `http://localhost:8931/sse` — porta/transporte que nao existem
  no servidor atual (8932, http). Config desalinhada = cliente retentando em loop.

## Casos NAO executados (todos os 8)

1..8 — gate com grupo vazio / subtasks pendentes / 100% concluidas, conclusao, reabrir, persistencia apos F5,
nao-regressao de task solta + contagem do footer, editar/deletar grupo, usabilidade (tooltip + alinhamento).

## Caminho comprovado para o proximo round

Dois caminhos, ambos ja validados/instrumentados:

1. **Sessao nova do Claude Code** (frontmatter corrigido carrega no start) → `subagent_type: browser-tester`
   com as tools MCP nativas.
2. **Bridge HTTP** (funciona nesta sessao, uma unica sessao MCP reaproveitada em `/tmp/mcp-session.id`):
   `scratchpad/mcpcall.sh <tool> '<json-args>'` → ex.: `mcpcall.sh browser_snapshot '{}' | head -120`.
   Screenshots do servidor Windows aparecem em `/mnt/c/Users/T-GAMER/.playwright-mcp/`.

## Next

- Nao ha indicio de defeito de produto: implementacao type-checa (exit=0) e passou por review Opus
  (`review-r1.md`: APPROVED_WITH_RESALVAS, gate/no-cascata/footer conferidos por leitura).
- O round de browser continua **pendente** — nao ha PASS registrado.
