## Mapa de arquivos
- src/pages/index/page.tsx | monta Box unico (Header+Timer+Score) e container da pagina | 54-88
- src/layout/components/atoms/Box/index.tsx | atom com bg/shadow/border sempre presentes | 9-21
- src/pages/index/components/IndexHeader/IndexHeader.tsx | logo + nav (workflow/gear/dark toggle) | 36-51
- src/pages/index/components/IndexTimer.tsx | timer central `mx-auto h-56 w-56`, botoes full-width abaixo | 42-60 (timer), 124-187 (botoes)
- src/layout/components/common/Timer/index.tsx | SVG circular, 100% dimensionavel via className (mold: IndexTaskItem usa `w-16 h-16`) | 71-102
- src/layout/components/atoms/Button/index.tsx | variantes primary/danger/secondary, padding fixo `px-16 py-4` | 17-31
- src/pages/index/components/IndexScore.tsx | grid `grid-cols-2 md:grid-cols-4` de 8 tiles, labels `text-Black-450`/`text-Black-400` | 112-141
- src/pages/index/components/IndexTasks/IndexTasks.tsx | Box "Tasks", chama ActiveList/Footer | 12-57
- .../IndexActiveTasksList/IndexActiveTasksList.tsx | 3 secoes (Active/Paused/Pending); secao Active tem scroll externo `max-h-[520px] overflow-y-auto` (77-82); render `flex flex-col gap-3` (linhas 72-119, `renderSectionItems` 21-29) — alvo do item 5 (grid 2 col) e item 4 (remover este scroll externo)
- .../IndexTaskGroup/IndexTaskGroup.tsx | card do grupo: wrapper `bg-Black-100/50 rounded-xl` (90) + header `rounded-xl` proprio com bg-white (91) — os DOIS `rounded-xl` empilhados criam a costura de borda (item 3); progress+add-input+lista abaixo (156-181)
- .../IndexTaskGroup/IndexGroupTasksList.tsx | scroll interno das subtasks `max-h-[420px] overflow-y-auto` (61-63) — este e o UNICO scroll que deve sobrar (item 4)
- .../IndexTaskItem/IndexTaskItem.tsx | item ativo: badge de grupo HOJE ao lado do titulo na linha 1 (195-210); Start/End/Duration em row separada abaixo (238-252); acoes+alert+debug em row propria com overflow em mobile (254-294) — reestruturar linhas 195-252 (item 2) e tornar 254-294 `flex-wrap` (item 6)
- .../IndexFooter/IndexCompletedTaskItem.tsx | **MOLDE do item 2**: title sozinho (43-45) e logo abaixo, na MESMA row, badge do grupo + Start/End/Duration (46-67)
- .../IndexFooter/IndexCompletedTaskGroup.tsx | card do grupo concluido, mesmo padrao de wrapper (23) sem o problema do item 3 (so 1 `rounded-xl`, sem header aninhado)
- src/layout/styles/global.css | unica fonte dos tokens de cor, bloco `@theme` (6-37); paleta Black-100..900, sem token dedicado para "texto sobre superficie cinza"

## Molde a espelhar
IndexCompletedTaskItem.tsx (linhas 34-68) é o molde explícito citado pelo usuário para o item 2: `<div className="flex flex-col gap-1"><span>{title}</span><div className="flex items-center gap-2 ...">{badge}{start/end/duration}</div></div>`. IndexTaskItem.tsx precisa reproduzir essa mesma composicao (hoje o badge esta na row do titulo, nao na row de baixo).

## Footprint
- IndexActiveTasksList.tsx:24-27 renderiza `IndexSortableTaskGroup`/`IndexSortableTaskItem` para ambas secoes Active/Paused/Pending — qualquer troca de `flex-col`->grid nesses containers (72-119) afeta as 3 secoes igualmente.
- IndexGroupTasksList.tsx:16 usa `verticalListSortingStrategy` do dnd-kit — se o item 5 (grid 2 colunas) mudar o container pai para `grid`, a strategy de sorting das listas verticais (linha 13-14 em IndexActiveTasksList.tsx e GroupTasksList.tsx) pode precisar virar `rectSortingStrategy` para nao quebrar a UX de arrastar.
- IndexTaskItem.tsx:65 consome `GroupTitleContext` (definido em IndexTaskGroup/GroupTitleContext.ts, so encontrei a leitura, nao abri o arquivo em si) para pegar `groupTitle` — usado tanto pelo badge atual (206-210) quanto pelo que vai mover para a row de baixo.
- page.tsx:67-75 e o UNICO lugar que hoje envolve Header+Timer+Score num Box so — mudar isso e o ponto central do item 7.

## Armadilhas
- Item 2 SO faz sentido a luz do teste anterior: `.claude/tasks/2026-09-06_layout-task-card/tests-01/verdict.md` (caso 4) documenta que "badge ao lado do titulo + start/end/duration embaixo" foi IMPLEMENTADO e aprovado na task anterior — ou seja o estado atual do codigo (lido acima) É o que grupo-0.png marca como errado. O planner deve interpretar "deixar o nome do grupo AO LADO do nome da task" no pedido do usuario como "ao lado do start/end/duration" (mesma row, como no molde), nao "ao lado do titulo" — a citacao explicita do footer como molde resolve a ambiguidade.
- Item 3 (bordas do card de grupo): nao encontrei anotacao inequivoca na imagem para qual borda exatamente; a hipotese mais concreta encontrada no codigo e o duplo `rounded-xl` (header dentro do wrapper, IndexTaskGroup.tsx:90-91) criando costura visual quando ha conteudo abaixo do header (progress/add-input/lista) — o planner deve abrir `.claude/prompts/grupo-0.png` ele mesmo e comparar com este ponto antes de decidir.
- Item 4: scroll duplo ja foi provado deliberadamente na task anterior (tests-01 verdict, caso 7: os dois `[role="region"]` tem overflow simultaneo, `scrollHeight=664>clientHeight=520` na secao Active E `scrollHeight=1140>clientHeight=420` no grupo) — confirma que o scroll externo (IndexActiveTasksList.tsx:77-82) e o que precisa sumir/relaxar, mantendo so o interno (IndexGroupTasksList.tsx:61-63, aumentar o max-h/padding).
- Item 7: `.claude/prompts/header.png` exige leitura visual direta pelo planner (Opus) — a composicao exata (timer pequeno + botoes pequenos a esquerda, estatisticas ao lado, sem card em logo/nav/timer) nao da pra inferir 100% so pela descricao textual desta task; a referencia `.claude/tasks/2026-08-23_task-grupo-done/tests-07/screenshots/01-grupo-vazio-desabilitado.png` mostra timer+stats AINDA num card unico a esquerda (layout de 2 colunas antigo, ja descartado) — serve so como exemplo de "logo sem fundo de card", nao como layout-alvo completo.
- Nenhum arquivo de config `tailwind.config.*` existe — breakpoints sao os defaults do Tailwind v4 (`sm/md/lg`), tokens de cor inteiramente em global.css `@theme` (linhas 6-37).
- `useCountdownTimerState` (timer global) NAO e persistido em localStorage (so `timertasks:tasks` e `timertasks:workflows` o sao, ver useStoredTasks.ts:4 e useStoredWorkflows.ts:8) — apos `page.reload()` o timer volta a 25:00/Start; isso nao e bug a corrigir aqui, mas afeta o roteiro do teste de browser (precisa reclicar Start apos reload se o fluxo envolver reload).

## Sinal de teste
Nao encontrado nenhum teste automatizado (unit/e2e) no repo para estes componentes. Precisa de stack rodando + navegacao real: `npm run dev` (Vite, porta fixa 1420, `vite.config.ts:16-18` `strictPort:true`). Em ambiente headless, o app fica bloqueado atras do gate de permissao de notificacao (`page.tsx:16-19,69` `shouldBlockContent`) — as duas rodadas anteriores (tests-07 do task-grupo-done e tests-01 do layout-task-card) contornaram com `context.addInitScript(() => Object.defineProperty(window.Notification, 'permission', { value: 'granted' }))` antes do `goto`. Nao ha preset/seed de dados no repo (sem fixture, sem flag de seed) — os dados (grupos com subtasks + tasks concluidas) foram sempre criados via UI real no proprio script Playwright (padrao replicavel: criar grupo com `>` no input de "Add a task... (use > to create a group)", adicionar N subtasks, iniciar o timer global, dar Play em subtasks, usar Check para completar). MCP `mcp__playwright__browser_*` foi relatado quebrado nas ultimas 2 rodadas neste host — as duas usaram script Node + Playwright standalone (`npm i --no-save --prefix /tmp/pw playwright@1.63.0`, Chromium ja cacheado, `executablePath` as vezes precisa ser fixado manualmente pois o path default do playwright aponta pra um binario inexistente na imagem).

## Veredito de complexidade
1. Uma frente so? **não** — e so frontend (React/Tailwind), mas toca timer, header, tasks e footer: 7 sub-areas distintas de UI.
2. Footprint de no maximo 6 arquivos? **não** — ja sao pelo menos 9 arquivos certos (page.tsx, IndexHeader, IndexTimer, IndexScore, IndexActiveTasksList, IndexTaskGroup, IndexGroupTasksList, IndexTaskItem, global.css) mais os componentes de footer como referencia.
3. Existe molde/irmao claro para espelhar? **sim** (parcial) — IndexCompletedTaskItem.tsx resolve o item 2; os demais itens (3,4,5,6,7) nao tem molde de codigo, so imagens de referencia.
4. Zero decisao de arquitetura/produto em aberto? **não** — item 7 exige decidir a nova composicao de layout (Box unico -> Box so nas stats) e item 5 exige decidir sorting-strategy do dnd-kit em grid; ambas sao decisoes de design ainda nao resolvidas pelo codigo existente.
5. Zero logica/algoritmo novo nao-trivial? **sim** — tudo aqui e CSS/JSX/composicao, nenhum algoritmo novo.

veredito: complexa — falha nos itens 1, 2 e 4 (multiplas frentes de UI, footprint >6 arquivos, decisoes de layout em aberto no item 7 e na estrategia de grid do item 5)

## Sinal de partição
partição: não (é uma unica leva de ajustes de UI sobre componentes ja existentes, sem modulo/servico novo nem suite de testes propria a criar).
