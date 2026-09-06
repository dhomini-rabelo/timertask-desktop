## Mapa de arquivos
- src/pages/index/components/IndexTasks/IndexActiveTasksList/IndexTaskItem/IndexTaskItem.tsx | card de task (standalone e filha de grupo) | 154-289
- src/pages/index/components/IndexTasks/IndexActiveTasksList/IndexTaskGroup/IndexTaskGroup.tsx | card do grupo, header+progress+lista filhos | 89-185 (progress em 156-163)
- src/pages/index/components/IndexTasks/IndexActiveTasksList/IndexTaskGroup/IndexGroupTasksList.tsx | DnD list dos filhos visíveis do grupo | 33-65
- src/pages/index/components/IndexTasks/IndexActiveTasksList/IndexActiveTasksList.tsx | DnD list raiz (grupos+tasks soltas) | 20-58
- src/pages/index/components/IndexTasks/IndexActiveTasksList/IndexSortableTaskItem.tsx | wrapper dnd-kit, mesmo componente p/ solta e filha | 10-35
- src/pages/index/components/IndexTasks/IndexFooter/IndexCompletedTaskItem.tsx | MOLDE start/end/duration + badge de grupo | 46-97
- src/pages/index/components/IndexTasks/IndexFooter/IndexCompletedTaskGroup.tsx | card de grupo completo (mold visual simples) | 22-51
- src/pages/index/components/IndexTasks/IndexFooter/IndexFooter.tsx | lista completed, já usa max-h+overflow-y-auto | 81 (scroll), 82-93
- src/pages/index/components/IndexTasks/IndexTasks.tsx | container da página de tasks, sem grid hoje | 19-56
- src/pages/index/page.tsx | layout raiz flex (Timer/Score ao lado de Tasks), sem grid | 53-83
- src/pages/index/components/IndexScore.tsx | stats globais já em grid-cols-2, mold de "estatística" | 25-96
- src/layout/components/common/Timer/index.tsx | círculo do timer, className controla tamanho | 49-103
- src/pages/index/states/tasks/index.ts | modelo Task/TaskGroup, sem conceito "pending/paused" | 11-40, isRunning 22
- src/pages/index/states/tasks/utils.ts | calculateTotalTimeInSeconds, getTimeRangeFromEvents, getGroupProgress | 4-35, 37-70, 86-98
- src/pages/index/states/tasks/scoreUtils.ts | métricas deriváveis: foco total/hoje, completed, streak | 10-127
- src/pages/index/hooks/useListingTasks.ts | activeListItems (só não-completed), sem split paused/pending | 4-39
- src/layout/styles/global.css | tokens tailwind v4 @theme (Black-*/Green-*/etc) | 6-36

## Molde a espelhar
`IndexCompletedTaskItem.tsx` (linhas 46-97) é o molde direto do pedido 3: já mostra badge de `groupTitle` ao lado do título (58-63) e Start/End/Duration como rodapé do card (64-75), com `getTimeRangeFromEvents`/`calculateTotalTimeInSeconds` de `utils.ts`. `IndexFooter.tsx:81` já usa `max-h-[calc(100vh-400px)] overflow-y-auto` — molde do "scroll quando houver muitas subtasks" do pedido 4. `IndexScore.tsx:68` (`grid grid-cols-2`) é o molde de bloco de estatísticas. Para grid de página (2 colunas de largura do card) e split ativas/pausadas/pendentes: nenhum molde claro — não existe hoje.

## Footprint
- IndexTaskItem: consumido por IndexSortableTaskItem.tsx:29 (raiz) e indiretamente por IndexGroupTasksList.tsx:60 via IndexSortableTaskItem — MESMO componente para task solta e task de grupo, então qualquer mudança de layout do card afeta os dois casos simultaneamente.
- IndexTaskGroup: consumido por IndexSortableTaskGroup.tsx (wrapper dnd) e por IndexActiveTasksList.tsx:50.
- getGroupProgress/getGroupChildren (utils.ts:86,77): consumidos por IndexTaskGroup.tsx:47-48, IndexCompletedTaskGroup.tsx:19-20 — mexer na assinatura quebra os dois.
- Task.isRunning/timeEvents: consumidos por scoreUtils.ts (IndexScore), useStoredTasks.ts (persistência), IndexTaskItem (autostart/badge).

## Armadilhas
- `IndexTaskItem.tsx` é usado tanto para task solta quanto para task filha de grupo (mesmo componente, sem prop que diferencie) — o pedido 2 ("parece não funcionar para tasks unitárias") não tem causa raiz visível: o bloco Running/Paused (228-244) roda para ambos os casos igualmente; recomendação: remover o bloco inteiro (não é feature flag por tipo).
- `hasBeenStarted` (linha 65) controla tanto o timer circular (177-187) quanto o footer Running/Paused (228) quanto o IndexDebugTimer (275-283) — remover só o badge sem tocar nos outros usos de `hasBeenStarted`.
- Modelo de dados NÃO tem "pending" vs "paused" vs "active" como categorias — só `completed` (bool) e `isRunning` (bool) por task; grupo não tem `isRunning` próprio, só via filhos (`getGroupChildren`+checar `isRunning`/`timeEvents` dos filhos). Qualquer split ativas/pausadas/pendentes do pedido 4 exige nova lógica de derivação em `useListingTasks.ts` (hoje só filtra completed).
- `reorderItems` (index.ts:270) e `addTask` (index.ts:80-148) dependem da ordem linear de `items` misturando grupos e tasks soltas — separar em 3 seções na tela precisa continuar escrevendo/lendo essa mesma lista plana, sem quebrar drag-and-drop.
- `useStoredTasks.ts` faz migração de formato legado (`LegacySubTask`/`LegacyTaskEntry`, linhas 11-19) — qualquer novo campo persistido (ex.: contagem de sessões) precisa entrar nesse fluxo de migração.
- Tailwind v4 usa `@theme` em CSS (global.css), não `tailwind.config.js` — confirmar que não há config JS a atualizar para novo grid.

## Sinal de teste
Não encontrado nenhum arquivo `*.test.*`/`*.spec.*` no repo — sem cobertura automatizada. Precisa de stack rodando + caminho de UI (Playwright/browser), mesmo padrão da task anterior `2026-08-23_task-grupo-done` (screenshots em `tests-07/screenshots/`, presets QA-Grupo-Parcial/QA-Grupo-Vazio/QA-Sub-A/QA-Sub-B/QA-Task-Solta cobrindo grupo com subtasks, task pausada e task standalone).

## Veredito de complexidade
1. Uma frente só? não — mistura mudança visual pontual (pedidos 1-3) com redesign estrutural de layout/grid da página inteira e nova lógica de agrupamento ativas/pausadas/pendentes (pedido 4), que não existe hoje (useListingTasks.ts:21-25 só separa completed/não-completed).
2. Footprint ≤6 arquivos? não — toca IndexTaskItem.tsx, IndexTaskGroup.tsx, IndexGroupTasksList.tsx, IndexActiveTasksList.tsx, IndexTasks.tsx, page.tsx, useListingTasks.ts e possivelmente utils.ts/scoreUtils.ts para as novas estatísticas — mais de 6.
3. Existe molde claro? parcial — pedidos 1-3 têm molde (IndexCompletedTaskItem.tsx, IndexScore.tsx, IndexFooter.tsx:81); pedido 4 (grid 2-colunas + 3 seções ativas/pausadas/pendentes) não tem molde no código.
4. Zero decisão de arquitetura/produto em aberto? não — pedido 4 exige decidir o grid geral da página (quantas colunas totais, breakpoints) e o critério exato de "pausada" vs "pendente" para GRUPOS (hoje só existe por task); pedido 5 delega ao planner "o que mais motivaria o usuário", decisão de produto explícita em aberto.
5. Zero lógica nova não-trivial? não — derivar estado ativa/pausada/pendente por grupo (agregando estado dos filhos) é lógica nova, não é só espelhar layout.

veredito: complexa — falha 1, 2, 4 e 5 (mudança multi-frente com decisão de produto aberta e lógica nova de agrupamento, sem molde para o grid da página)

## Sinal de partição
partição: não (é uma única "feature" de UI, sem novo módulo/serviço isolado nem suíte de testes própria a criar — a evidência de teste é screenshot/browser como no task irmão, não uma suíte nova).

## Dados de tempo/sessão/progresso já existentes ou deriváveis (insumo para pedido 5)
Já calculados hoje (scoreUtils.ts): tempo focado total (`calculateTotalFocusedTime`), tempo focado hoje (`calculateTodayFocusedTime`, não usado na UI ainda), tasks completadas (`calculateTasksCompleted` — conta quem tem evento "complete", sem filtrar por dia real), streak de dias ativos (`calculateCurrentStreak`). Por task (utils.ts): tempo total (`calculateTotalTimeInSeconds`, soma intervalos start→stop/complete), start/end (`getTimeRangeFromEvents`). Por grupo (utils.ts): completedCount/total/percentage (`getGroupProgress`). Deriváveis sem migração (só reprocessar `timeEvents`/`items` já persistidos): número de sessões por task (contar eventos "start"), tempo médio por sessão, quantas subtasks de um grupo estão em andamento agora (`isRunning`) vs nunca iniciadas (sem evento "start") vs pausadas (têm "start" mas não "isRunning"), total de ciclos do pomodoro (`countdownTimer.ts: totalCycles`, já exposto em IndexScore). NÃO há hoje: meta diária, comparação com dia anterior, "melhor dia" — exigiriam agregação nova sobre reports (`states/reports`), não migração de schema.
