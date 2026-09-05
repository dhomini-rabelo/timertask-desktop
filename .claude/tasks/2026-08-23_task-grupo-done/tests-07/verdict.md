# Verdict — tests-07

Task: task-grupo-done
Mode: browser only (Vite em http://localhost:1420) — rota via **script Node + Playwright** (as ferramentas
MCP `mcp__playwright__browser_*` continuam quebradas nesta sessao/host; nao foram tentadas, conforme
instrucao desta rodada).

Result: **PASS** — os 8 casos profundos foram exercitados e passaram. Nenhum erro de console/pagina.

## Rota de execucao (infra)

- Vite: ja estava no ar (`curl` 200), nao foi tocado.
- Instalado `playwright@1.63.0` fora do projeto: `npm i --no-save --prefix /tmp/pw playwright@1.63.0`
  (exit=0). Chromium ja existia em `/root/.cache/ms-playwright/chromium-1243`.
- Scripts em `/tmp/qa-grupo-done.js` (+ 3 scripts de debug descartaveis), rodados com
  `NODE_PATH=/tmp/pw/node_modules node /tmp/qa-grupo-done.js > /tmp/qa-grupo-done.log 2>&1`, headless,
  viewport 1280x900.
- **Blocker de infra descoberto e contornado nesta rodada**: o app bloqueia toda a UI atras de um gate
  de permissao de notificacao (`src/pages/index/page.tsx`, `shouldBlockContent`). Em Chromium headless,
  `context.grantPermissions(['notifications'])` NAO alterou `Notification.permission` (permaneceu
  `"denied"`), entao a chamada `isPermissionGranted()` do `@tauri-apps/plugin-notification` (que cai no
  fallback `window.Notification.permission`) sempre resolvia negado, e a pagina de tarefas nunca
  renderizava. Contornado com `context.addInitScript(() => Object.defineProperty(window.Notification,
  'permission', { value: 'granted' }))` antes do `goto` — um shim de ambiente para teste headless, nao
  uma mudanca no app. Vale registrar para quem configurar rodadas futuras: sem esse shim, TODA rodada de
  browser nesta stack fica bloqueada na tela "Allow notifications", nao so esta.
- Segunda descoberta: o `countdownTimer` (timer global pomodoro) e um store em memoria, **nao
  persistido**. Completar uma subtask via UI exige clicar Play (que so funciona com o timer global
  rodando) antes do botao Check aparecer. Apos `page.reload()`, `isRunning` volta a `false` — precisei
  reclicar "Start" apos o reload para poder completar `QA-Task-Solta` no caso 6.

## Material criado (prefixo QA-, tudo criado do zero neste contexto novo)

- Grupo `QA-Grupo-Vazio` (sem subtasks) — usado nos casos 1, 7 (renomeado para
  `QA-Grupo-Vazio-Editado` e depois deletado).
- Grupo `QA-Grupo-Parcial` com subtasks `QA-Sub-A` e `QA-Sub-B` — usado nos casos 2–5, 8.
- Task solta `QA-Task-Solta` — usado no caso 6.

## Casos (1..8)

1. **PASS** — grupo vazio: botao Check `disabled=true`, `title="Add at least one task first"`.
   Screenshot: `screenshots/01-grupo-vazio-desabilitado.png`.
2. **PASS** — 1 de 2 subtasks concluidas: Check ainda `disabled=true`,
   `title="Complete all tasks first"`, progresso do header "1 of 2 completed".
   Screenshot: `screenshots/02-parcial-1de2-desabilitado.png`.
3. **PASS** — 100% concluidas: Check habilita (`title="Mark group as complete"`, progresso "2 of 2
   completed") — `screenshots/03a-parcial-100-habilitado.png`. Ao clicar, o grupo some da lista ativa
   (contagem 0 dentro do container `min-h-[250px]` da lista ativa) e aparece na secao completed do
   footer como linha "QA-Grupo-Parcial" + "2 of 2 completed" —
   `screenshots/03b-parcial-completo-no-footer.png`.
4. **PASS** — reabrir via RotateCcw: grupo volta para a lista ativa com progresso ainda "2 of 2
   completed" e o Check ja habilitado de novo (sem cascata reversa sobre as subtasks) —
   `screenshots/04-reaberto-sem-cascata.png`.
5. **PASS** — persistencia: com o grupo concluido novamente, `page.reload()` mantem a linha em
   completed ("2 of 2 completed") — `screenshots/05a-persistencia-pos-reload.png` — e reabrir via
   RotateCcw depois do reload funciona normalmente —
   `screenshots/05b-reaberto-pos-reload.png`.
6. **PASS** — nao-regressao: task solta `QA-Task-Solta` completa/normal; contador do footer
   ("X of Y completed") leu exatamente **"3 of 3 completed"** = as 3 tasks-folha (`QA-Sub-A`,
   `QA-Sub-B`, `QA-Task-Solta`), sem contar nenhum dos 2 grupos no denominador. ProgressBar em 100%
   coerente. Screenshot: `screenshots/06-nao-regressao-standalone.png`.
7. **PASS** — editar e deletar grupo continuam funcionando: cluster de hover (Check/Edit/Delete)
   intacto em `QA-Grupo-Vazio`; renomeado para `QA-Grupo-Vazio-Editado` (Enter salva) —
   `screenshots/07a-grupo-editado.png` — e deletado em seguida (grupo some do DOM, contagem 0) —
   `screenshots/07b-grupo-deletado.png`.
8. **PASS** — usabilidade: tooltips corretos e distintos por estado (capturados nos casos 1/2/3a:
   `"Add at least one task first"` / `"Complete all tasks first"` / `"Mark group as complete"`).
   Alinhamento do card de grupo concluido vs itens concluidos no footer e consistente (mesmo estilo de
   card, check verde, botao de acao a direita) — `screenshots/08-usabilidade-alinhamento-footer.png`.
   **Observacao cosmetica (nao bloqueante, fora do escopo de arquivos desta task)**: no badge de grupo
   dentro do item de task concluida (`IndexCompletedTaskItem`), o texto `"QA-Grupo-Parcial"` quebra no
   meio da palavra ("QA-Grupo-Par" / "cial") por causa da largura fixa do pill — visivel no screenshot
   08. Nao afeta nenhum dos criterios de aceitacao do gate/counting, so registrando como nota de
   usabilidade.

## Console/erros de pagina

Nenhum erro de console ou `pageerror` capturado durante toda a rodada (array vazio ao final).

## Servidor deixado no ar

- Vite: nao iniciado nem parado por mim; continua no ar em `http://localhost:1420/` (200) ao final da
  rodada, sem alteracao de estado do app (o contexto do browser desta rodada era isolado e foi fechado
  com `browser.close()` ao final — nada de persistente foi deixado, pois `localStorage` pertencia so a
  esse contexto Playwright).

## Screenshots (todas em `screenshots/`)

`01-grupo-vazio-desabilitado.png`, `02-parcial-1de2-desabilitado.png`, `03a-parcial-100-habilitado.png`,
`03b-parcial-completo-no-footer.png`, `04-reaberto-sem-cascata.png`, `05a-persistencia-pos-reload.png`,
`05b-reaberto-pos-reload.png`, `06-nao-regressao-standalone.png`, `07a-grupo-editado.png`,
`07b-grupo-deletado.png`, `08-usabilidade-alinhamento-footer.png`.

## Next

Nenhum defeito de produto encontrado nos 8 casos. Duas notas de infra vale registrar para rodadas
futuras de browser nesta stack (nao sao bugs do app, sao particularidades do ambiente headless/dev):
(a) o gate de notificacao exige o shim `addInitScript` acima para qualquer teste headless funcionar;
(b) o timer global pomodoro nao e persistido, entao qualquer fluxo que envolva `page.reload()` seguido
de completar/mudar timer de uma task precisa reclicar "Start" apos o reload.
