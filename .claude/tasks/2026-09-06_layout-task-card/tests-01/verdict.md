# Verdict — tests-01

Task: layout-task-card
Mode: browser only (Vite em http://localhost:1420) — rota via **script Node + Playwright**
(canal MCP `mcp__playwright__browser_*` está quebrado neste host, conforme instrução da rodada;
não foi tentado). Script adaptado do padrão de `.claude/tasks/2026-08-23_task-grupo-done/tests-07/`.

Result: **PASS** — todos os casos profundos exigidos foram exercitados e passaram. Zero erro de
console/página durante toda a rodada.

## Rota de execução (infra)

- Vite: já estava no ar (`curl` 200), não foi tocado, não foi parado.
- Playwright `1.63.0` reaproveitado de `/tmp/pw/node_modules` (instalação de uma rodada anterior).
  Chromium 1243 localizado em `/opt/ms-playwright/chromium-1243/chrome-linux64/chrome` (o padrão
  `executablePath` do playwright apontava para `chromium_headless_shell`, que não existe nesta
  imagem — precisei fixar `executablePath` explicitamente).
- Script em `/tmp/qa-layout-shots/run.js`, rodado com `NODE_PATH=/tmp/pw/node_modules node run.js`,
  headless, viewport 1280x900.
- Shim obrigatório (mesma armadilha do tests-07): `context.addInitScript` fixando
  `window.Notification.permission = 'granted'` antes do `goto` — sem isso a UI fica presa atrás do
  gate de permissão.
- Armadilha nova encontrada e contornada: `text=` locator do Playwright **não** casa com
  `placeholder` de `<input>` — troquei por `getByPlaceholder(...).waitFor(...)`. Também descobri que
  `input[value="..."]` não funciona para os inputs de edição controlados por React (o atributo HTML
  `value` não é refletido pelo React em inputs controlados) — troquei por `input:focus` (o
  `IndexEditInput` tem `autoFocus`).
- Timer global não persiste após reload (conhecido do tests-07): screenshot 21 confirma que os
  dados das tasks (estado, badges, start/end/duration) persistem corretamente via localStorage; só
  o countdown global volta a "25:00 / Start", como esperado.

## Preset criado via UI (prefixo QA-, tudo novo neste contexto)

- `QA-Task-Solta` — task solta (standalone), deixada pausada ao final.
- `QA-Grupo-Pendente` — grupo vazio (status pending), depois renomeado para
  `QA-Grupo-Pendente-Editado` e deletado (prova edit+delete de grupo).
- `QA-Grupo-100` — grupo com `QA-Sub100-A` e `QA-Sub100-B`, ambas completadas → grupo levado a 100%
  e marcado como concluído (some das 3 seções, aparece no footer completo).
- `QA-Grupo-Scroll` — grupo com 8 subtasks (`QA-Sub-1`..`QA-Sub-8`), uma delas (`QA-Sub-1`) iniciada
  para forçar o grupo para a seção Active (prova scroll interno duplo: da seção Active e da lista de
  subtasks do grupo).
- `QA-Task-CRUD` — task solta descartável, editada (renomeada) e deletada (prova CRUD de task
  standalone, além do CRUD de grupo).

## Casos (evidência em `screenshots/`)

1. **Layout da página / card full-width, sem sidebar** — `00-layout-inicial-full-width.png`,
   `19-card-topo-header-timer-stats.png`: card principal em largura cheia no topo, empilhado
   (header logo/options → timer `25:00` em `text-4xl`/`w-56 h-56` → estatísticas em
   `grid-cols-2 md:grid-cols-4` com 8 tiles). Nenhuma sidebar de 1 coluna em nenhuma captura.
2. **4 métricas nomeadas no contrato, coerentes com a sessão** — verificado via `page.evaluate`
   lendo os spans: `Today's Focus: 0m`, `Tasks Started: 4`, `Avg / task: 0m`, `In Progress: 2`.
   `Tasks Started` = 4 tasks distintas com pelo menos 1 evento start (`QA-Task-Solta`, `QA-Sub-1`,
   `QA-Sub100-A`, `QA-Sub100-B`) — bate com o que foi de fato iniciado na sessão. `In Progress` = 2
   (`QA-Task-Solta` pausada + `QA-Sub-1` ativa, ambas não completadas com evento start) — bate com o
   esperado. As outras 4 métricas do card (Focused Time, Tasks Completed, Total cycles, Current
   Streak) também aparecem, sem `NaN`/vazio — `12-grupo-100-completo-no-footer.png`.
3. **Badge "paused" removido em todos os casos** — `05-standalone-timer-rodando-sem-badge-paused.png`,
   `06-standalone-pausado-sem-badge-paused.png` (task solta, iniciada → parada, sem nenhuma pill
   Running/Paused), `09-grupo-scroll-ativo-com-1-rodando.png` (filha de grupo rodando, mesma
   ausência). Nenhum resquício visual do componente em nenhuma captura da rodada.
4. **Start/End/Duration embaixo + nome do grupo ao lado do título (task de grupo)** —
   `09-grupo-scroll-ativo-com-1-rodando.png` e `11-grupo-100-parcial-para-completo-habilitado.png`:
   `QA-Sub-1`/`QA-Sub100-A`/`QA-Sub100-B` mostram badge `QA-Grupo-Scroll`/`QA-Grupo-100` ao lado do
   título e a linha `Start HH:MM:SS AM  End HH:MM:SS AM  Duration 00:0X` na parte de baixo do card.
5. **Não regressão standalone** — mesmas capturas do item 3: `QA-Task-Solta` mostra Start/End/
   Duration embaixo do card mas **sem** nenhum badge de grupo ao lado do título (ela não pertence a
   grupo nenhum) — confirma que o badge só aparece para filhas de grupo.
6. **Task de grupo concluída (footer)** — `13-footer-completo-expandido.png`: `QA-Grupo-100`
   aparece na lista de concluídos com "2 of 2 completed"; expandindo, `QA-Sub100-A` e `QA-Sub100-B`
   mostram badge do grupo + Start/End/Duration, no mesmo componente/estilo que já existia
   (`IndexCompletedTaskItem`, usado como molde do item 4/5) — sem regressão nesse componente.
7. **Scroll interno (8 subtasks)** — `09-grupo-scroll-ativo-com-1-rodando.png` mostra `QA-Sub-2`
   cortado na borda inferior do contêiner rolável. Prova objetiva via `page.evaluate` nos elementos
   `[role="region"]`: região "Active tasks" `scrollHeight=664 > clientHeight=520` (overflow=true) e
   região "QA-Grupo-Scroll subtasks" `scrollHeight=1140 > clientHeight=420` (overflow=true) — os dois
   níveis de scroll (seção Active e lista de subtasks do grupo) provados simultaneamente com o mesmo
   grupo de 8 itens.
8. **Rótulo "Active" não rola + região focável por teclado** — `09b-active-region-scrollada-label-
   fixo.png`: setei `scrollTop=50` na região via DOM e confirmei por `getBoundingClientRect` que a
   posição do `<span>Active</span>` não mudou (`labelStaysPutWhileRegionScrolls: true` — o label é
   irmão externo do contêiner rolável, não filho). Foco: a região tem `tabIndex=0`
   (`role="region" aria-label="Active tasks"`) e `region.focus()` resultou em
   `document.activeElement === region` (`isActiveElement: true`) — a área é de fato alcançável via
   teclado (Tab entra nela na ordem do DOM; comprovado aqui via foco programático + tabIndex, já que
   o primeiro `Tab` isolado da página pousa antes, em um botão do header, o que é esperado dado o
   layout).
9. **CRUD de grupo** — criar (`01-presets-criados.png`), editar
   (`14-grupo-pendente-editado.png`, "QA-Grupo-Pendente" → "QA-Grupo-Pendente-Editado", Enter salva)
   e deletar (`15-grupo-pendente-deletado.png`, grupo some da seção Pending).
10. **CRUD de task standalone** — criar, editar (`16-task-solta-crud-editada.png`, "QA-Task-CRUD" →
    "QA-Task-CRUD-Editada") e deletar (`17-task-solta-crud-deletada.png`).
11. **Validação de campos obrigatórios** — `03-validacao-submit-vazio-sem-crash.png`: submit com
    título em branco (apenas espaços) é no-op (nenhuma task fantasma criada, contagem "0 of 11
    completed" inalterada), sem overlay de erro/crash (`hasOverlayOnEmptySubmit: false`, checado via
    `document.querySelector('vite-error-overlay')`).
12. **Start/pause/resume, incluindo o caminho que ANTES mostrava "Paused"** —
    `04-timer-global-iniciado.png` (timer global Start, pré-requisito para qualquer Play de task) →
    `05-...-rodando-sem-badge-paused.png` (Play em `QA-Task-Solta`) →
    `06-...-pausado-sem-badge-paused.png` (Stop/pause) → `07-standalone-retomado.png` (resume) →
    `08-standalone-deixado-pausado.png` (pause final, preset deixado como pedido). Em nenhum desses
    estados aparece a pill Running/Paused; Start/End/Duration acumula corretamente
    (`Duration 00:02` → depois do resume/pause final o valor evolui de forma consistente).
13. **Persistência pós-reload** — `21-pos-reload-persistencia.png`: após `page.reload()`, todas as
    tasks/grupos, badges, Start/End/Duration e as 8 métricas do topo permanecem idênticos aos
    valores pré-reload (`Tasks Started: 4`, `In Progress: 2`, etc.); só o timer global volta a
    "25:00 / Start" (limitação conhecida, não é bug desta task — countdown timer não é persistido).
14. **Responsivo (viewport estreito, 420px)** — `20-responsivo-estreito.png`: stats mantêm
    `grid-cols-2` (2 colunas, sem quebra/overlap) e o card principal + seção de tasks continuam
    full-width sem sidebar nem overflow horizontal da página.

## Console/erros de página

Nenhum erro de console nem `pageerror` capturado durante toda a rodada (array vazio ao final,
`consoleErrors: []` no JSON de resultado do script).

## Servidor deixado no ar

Vite não foi iniciado nem parado por esta rodada; continua no ar em `http://localhost:1420/` (200)
ao final, sem alteração de estado do app real (o contexto de browser desta rodada era isolado —
`browser.close()` ao final — o `localStorage` usado pelas capturas pertencia só a esse contexto
Playwright, não ao navegador do usuário).

## Screenshots (em `screenshots/`)

`00-layout-inicial-full-width.png`, `01-presets-criados.png`, `02-subtasks-adicionadas.png`,
`03-validacao-submit-vazio-sem-crash.png`, `04-timer-global-iniciado.png`,
`05-standalone-timer-rodando-sem-badge-paused.png`, `06-standalone-pausado-sem-badge-paused.png`,
`07-standalone-retomado.png`, `08-standalone-deixado-pausado.png`,
`09-grupo-scroll-ativo-com-1-rodando.png`, `09b-active-region-scrollada-label-fixo.png`,
`10-grupo-100-antes.png`, `11-grupo-100-parcial-para-completo-habilitado.png`,
`12-grupo-100-completo-no-footer.png`, `13-footer-completo-expandido.png`,
`14-grupo-pendente-editado.png`, `15-grupo-pendente-deletado.png`,
`16-task-solta-crud-editada.png`, `17-task-solta-crud-deletada.png`,
`18-layout-completo-active-paused-pending.png`, `19-card-topo-header-timer-stats.png`,
`20-responsivo-estreito.png`, `21-pos-reload-persistencia.png`.

## Next

Nenhum defeito de produto encontrado. Item cosmético já conhecido/fora de escopo (não bloqueante):
nada novo observado nesta rodada além do que já constava em rodadas anteriores.
