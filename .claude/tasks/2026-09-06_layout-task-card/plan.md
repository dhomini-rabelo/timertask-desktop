# Plano — layout-task-card

Branch `main` | commit-base `4ed315b` | recon: **complexa**, partição: não.
Pedido: 5 melhorias de UI (respiro no progresso do grupo, remoção do badge Paused, start/end/duration +
nome do grupo no card, novo layout em grid da página com seções Ativas/Pausadas/Pendentes, e mais
estatísticas no topo).

Sem dúvidas para o usuário — tudo o que faltava foi decidido abaixo.

## Premissas assumidas

1. **CORRIGIDO por decisão explícita do usuário (a leitura anterior de "sidebar 1 coluna + card de
   Tasks 2 colunas" era o inverso do pedido).** Resposta literal do usuário: *"card ocupa largura de 2
   colunas do grid - grupo em cima de tasks e subtasks ativas (deve ter um limite de tamanho com scroll
   para tasks ativas com muitas subtasks), grupo de pausadas e grupos de pendentes em baixo"*. Leitura
   adotada: **não há mais layout lado-a-lado**. A página vira uma pilha vertical de largura cheia dentro
   do `max-w-6xl` existente:
   1. **Card principal** (o único "card" da frase), ocupando toda a largura útil ("2 colunas do grid" =
      a largura cheia da área de conteúdo, não uma sidebar de 1/3), empilhado internamente:
      header no topo (Logo à esquerda ---- workflow/dark-mode à direita) → timer, menor (`text-4xl`) →
      estatísticas, ocupando quase toda a largura do card (podem se organizar em colunas internas, já
      que agora há bem mais largura disponível).
   2. Abaixo do card, na página (não dentro do card): a seção de tasks/subtasks **ATIVAS**, com altura
      máxima e scroll interno quando há muitas subtasks.
   3. Abaixo: seção de **PAUSADAS**.
   4. Abaixo: seções de **PENDENTES**.
   Isso é exatamente a estrutura de seções Active → Paused → Pending já descrita na premissa 6 e no
   pedido 4 — a única mudança é que ela deixa de ficar ao lado do card e passa a ficar abaixo dele, em
   largura cheia, na mesma coluna.
2. **"timer tamanho 4" = `text-4xl`** (hoje `text-6xl` em `IndexTimer.tsx:45`), com o círculo indo de
   `w-64 h-64` para `w-56 h-56`. Justificativa: "tamanho 4, um pouco menor que hoje" casa exatamente
   com a escala Tailwind `text-6xl → text-4xl` e é a única escala numérica "4" no componente.
3. **`max-w-6xl` da página é mantido** (não sobe para `7xl`). Justificativa: o ganho de largura do card
   já vem de ele passar a ocupar 100% da área de conteúdo (em vez de ficar ao lado de uma sidebar);
   mexer no container raiz aumentaria o risco visual sem pedido explícito.
4. **`IndexHeader` só migra para dentro do card principal quando o conteúdo está liberado.** Na tela de
   bloqueio de permissão (`page.tsx:61-64`) ele continua full-width com `showOnlyLogo`. Justificativa:
   mover incondicionalmente quebraria o gate de notificação, que não faz parte do pedido.
5. **`IndexScore` deixa de ser um `Box` e vira um bloco interno** (`div` full-width). Justificativa:
   ele passa a viver DENTRO do card principal (que já é um `Box`); Box dentro de Box daria sombra/borda
   duplicadas, e o pedido é "estatísticas ocupando boa parte da largura".
6. **Critério de Ativa/Pausada/Pendente** (não existe no modelo, é derivado):
   - Task: `isRunning` → **ativa**; senão tem evento `start` → **pausada**; senão → **pendente**.
   - Grupo: algum filho não-completado ativo → **ativo**; senão algum filho pausado → **pausado**;
     senão (inclusive grupo vazio) → **pendente**.
   Justificativa: são os únicos sinais persistidos hoje (`Task.isRunning` + `timeEvents`), sem migração.
7. **O split em 3 seções NÃO quebra a lista plana nem o DnD.** Um único `DndContext` envolve as três
   seções, com um `SortableContext` por seção; `handleDragEnd` ignora o drop quando origem e destino
   estão em seções diferentes. `reorderItems` continua operando sobre a lista plana por id.
   Justificativa: preserva o invariante de `states/tasks/index.ts:270` sem reescrever ordenação.
8. **Scroll interno é aplicado em DOIS lugares**: na seção ATIVAS (`IndexActiveTasksList`) e na lista de
   subtasks de um grupo (`IndexGroupTasksList`). Justificativa: a frase "altura máxima + scroll interno
   quando houver muitas subtasks" cabe nas duas leituras; ambas usam o molde já existente em
   `IndexFooter.tsx:81` e custam uma className cada.
9. **Start/End/Duration aparecem também na task standalone** (não só na filha de grupo); o badge com o
   nome do grupo só aparece quando `task.groupId` existe. Justificativa: o componente é o mesmo
   (`IndexTaskItem`), o usuário autorizou mudança compartilhada, e a informação é útil nos dois casos.
10. **`groupTitle` é derivado dentro do próprio `IndexTaskItem`** via `useListingTasks()` +
    `task.groupId`, sem nova prop. Justificativa: evita alterar `IndexSortableTaskItem` e
    `IndexGroupTasksList` só para repassar prop — footprint menor e escopos mais disjuntos.
11. **`formatClockTime`/`formatClockValue` sobem de `IndexCompletedTaskItem.tsx:16-30` para
    `src/code/utils/date.ts`** e passam a ser importados nos dois lugares. Justificativa: evita
    duplicar helper de formatação; `date.ts` já é a casa de `formatTime`.
12. **Métricas novas do pedido 5 (4 novas, total 8 tiles)** — todas deriváveis de `timeEvents`/`items`,
    zero migração:
    - **Today's Focus** (`calculateTodayFocusedTime`, já implementado e não usado na UI) — o número que
      mais motiva é o progresso de HOJE, e custa zero lógica nova.
    - **Sessions** (contagem de eventos `start`) — prova esforço mesmo nos dias sem task concluída.
    - **Avg / session** (`totalFocusedTime / sessions`) — recompensa blocos longos de foco, não só volume.
    - **In Progress** (tasks não-completadas com pelo menos um `start`) — puxa o usuário a fechar o que
      já começou, que é o gatilho de continuidade mais forte do app.
13. **Sem cobertura automatizada nova.** Validação é `npm run build` (roda `tsc`) + rodada de browser
    Playwright, como na task irmã. Justificativa: o recon confirmou que o repo não tem `*.test.*`.

## Escopos de implementação

Dois escopos com footprints **disjuntos** — **podem rodar em PARALELO**.

- **Escopo A — `card-task-itens-1-2-3`** (pedidos 1, 2, 3 + scroll da lista de subtasks).
  Prompt: `prompts/card-task-itens-1-2-3.md`.
  Arquivos OWNED: `src/pages/index/components/IndexTasks/IndexActiveTasksList/IndexTaskItem/IndexTaskItem.tsx`,
  `.../IndexTaskGroup/IndexTaskGroup.tsx`, `.../IndexTaskGroup/IndexGroupTasksList.tsx`,
  `src/pages/index/components/IndexTasks/IndexFooter/IndexCompletedTaskItem.tsx`,
  `src/code/utils/date.ts`.

- **Escopo B — `layout-pagina-e-stats-4-5`** (pedidos 4 e 5).
  Prompt: `prompts/layout-pagina-e-stats-4-5.md`.
  Arquivos OWNED: `src/pages/index/page.tsx`,
  `src/pages/index/components/IndexTimer.tsx`, `src/pages/index/components/IndexScore.tsx`,
  `src/pages/index/states/tasks/scoreUtils.ts`, `src/pages/index/states/tasks/utils.ts`,
  `src/pages/index/hooks/useListingTasks.ts`,
  `src/pages/index/components/IndexTasks/IndexTasks.tsx`,
  `src/pages/index/components/IndexTasks/IndexActiveTasksList/IndexActiveTasksList.tsx`.

Interface entre os dois: nenhuma. B só ADICIONA exports em `utils.ts`/`useListingTasks.ts` (A apenas
consome os já existentes) e A não toca em nenhum arquivo de B.

## Detalhamento por pedido

### Pedido 1 — respiro na contagem do grupo (escopo A)
`IndexTaskGroup.tsx:156-163`. O bloco `px-4 pb-3` está colado na box branca do título. Trocar o
wrapper por `px-4 pt-3 pb-3 flex flex-col gap-2` (respiro acima da contagem e entre a contagem e a
`ProgressBar`). Evidência do defeito:
`.claude/tasks/2026-08-23_task-grupo-done/tests-07/screenshots/03a-parcial-100-habilitado.png`.

### Pedido 2 — remover o badge Running/Paused (escopo A)
Remover **todo** o bloco `IndexTaskItem.tsx:228-244` (`{!isEditing && hasBeenStarted && …}` com a pill
Running/Paused). **NÃO** remover a const `hasBeenStarted` (`:65`): ela ainda governa o timer circular
(`:177-187`) e o `IndexDebugTimer` (`:275-283`). Vale para task solta e filha de grupo (mesmo
componente, sem flag por tipo) — é exatamente o que o usuário pediu.

### Pedido 3 — start/end/duration embaixo + nome do grupo ao lado do título (escopo A)
Molde direto: `IndexCompletedTaskItem.tsx:46-97`.
- Badge do grupo ao lado do título: espelhar as classes de `IndexCompletedTaskItem.tsx:60-62`, renderizado
  ao lado do `span` do título em `IndexTaskItem.tsx:190-200` (só quando `task.groupId` existir).
- Rodapé Start/End/Duration: espelhar `IndexCompletedTaskItem.tsx:64-78`, usando
  `getTimeRangeFromEvents(task.timeEvents)` e `calculateTotalTimeInSeconds(task.timeEvents)` de
  `states/tasks/utils.ts` (o segundo já é importado no arquivo). Renderizar **no lugar deixado pelo
  bloco removido do pedido 2** (entre a box branca do header e a linha de opções `:246-286`), somente
  quando `hasBeenStarted`.
- `formatClockTime`/`formatClockValue` migram para `src/code/utils/date.ts` e são importados nos dois
  componentes.

### Pedido 4 — card empilhado + seções Ativas/Pausadas/Pendentes abaixo, largura cheia (escopo B)
**CORRIGIDO** (ver premissa 1) — não há mais grid lado-a-lado nem card lateral de 1/3. A página vira
uma pilha vertical de largura cheia:
- `page.tsx:66-74`: substituir o wrapper flex
  (`"flex w-full flex-col items-center justify-center gap-24 md:flex-row md:items-start"`) por
  `"flex w-full flex-col gap-6"`.
- Dentro dele, nesta ordem: `<Box className="w-full flex flex-col gap-6 p-6"><IndexHeader />
  <IndexTimer /><IndexScore /></Box>` (o card principal, largura cheia) e, logo abaixo, fora do Box,
  `<IndexTasks />` (que já contém, internamente, o `IndexAddInput`, o `IndexErrorMessage`, as três
  seções Active/Paused/Pending — via `IndexActiveTasksList` — e o `IndexFooter`).
  `page.tsx:58` passa a renderizar o `<IndexHeader showOnlyLogo />` de topo de página **só quando
  `shouldBlockContent`** (premissa 4); quando o conteúdo está liberado, o único `IndexHeader` renderizado
  é o de dentro do Box acima.
- `IndexTimer.tsx:43-45`: `w-64` → `w-full`; `Timer className` `"w-full h-64 text-6xl"` →
  `"mx-auto h-56 w-56 text-4xl"`; controles `px-8` → `px-4` (`:60`).
- `IndexTasks.tsx:20`: `Box className="w-full max-w-[600px] ml-auto p-6 …"` → tirar
  `max-w-[600px] ml-auto` (já era `w-full`) para a seção de tasks ocupar a largura cheia da página,
  igual ao card acima.
- `states/tasks/utils.ts`: adicionar `getTaskActivityStatus(task): "active"|"paused"|"pending"` e
  `getGroupActivityStatus(children: Task[]): "active"|"paused"|"pending"` (regra da premissa 6).
- `useListingTasks.ts`: particionar `activeListItems` (preservando a ordem plana) em
  `activeSectionItems`, `pausedSectionItems`, `pendingSectionItems` e retorná-los junto do resto. Nada
  do que já é retornado pode ser removido nem ter a semântica alterada (`IndexTaskGroup`, `IndexFooter`,
  `IndexGroupTasksList` consomem).
- `IndexActiveTasksList.tsx`: um único `DndContext`; três seções renderizadas na ordem
  **Active → Paused → Pending**, cada uma com seu `SortableContext` (`items` = ids daquela seção) e um
  título discreto (`text-[10px] font-bold uppercase tracking-tight text-Black-450`); seções vazias não
  renderizam. Wrapper da seção ATIVAS: `flex flex-col gap-3 max-h-[520px] overflow-y-auto pr-1`
  (molde `IndexFooter.tsx:81`). Em `handleDragEnd`, ignorar o drop se `active.id` e `over.id` não
  pertencerem à mesma seção.
- `IndexGroupTasksList.tsx` (escopo A): envolver os filhos dentro do `SortableContext` em
  `<div className="flex flex-col gap-3 max-h-[420px] overflow-y-auto pr-1">`.

### Pedido 5 — mais estatísticas (escopo B)
`scoreUtils.ts` ganha `calculateTotalSessions`, `calculateAverageSessionTime`,
`calculateTasksInProgress` (todas sobre `items.filter(isTask)` e `timeEvents`; nenhum campo novo
persistido — nada entra no fluxo de migração de `useStoredTasks.ts`).
`IndexScore.tsx` passa a listar 8 tiles, na ordem: Today's Focus, Focused Time, Sessions, Avg /
session, In Progress, Tasks Completed, Total cycles, Current Streak. **CORRIGIDO** (ver premissa 1):
como o card agora ocupa a largura cheia da página (não mais 1/3), o grid de `:68` deixa de ser
`grid-cols-2` fixo e vira `grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-6`, para as estatísticas
"ocuparem boa parte da largura" em vez de ficarem espremidas em 2 colunas numa faixa estreita. Ícones
novos do `lucide-react` (ex.: `Sun`, `Repeat`, `Hourglass`, `PlayCircle`) e pares `color/bg`
reaproveitando os tokens já usados no arquivo. `Avg / session` e `Today's Focus` usam o
`formatDuration` local (`:12-23`). Divisão por zero em `Avg / session` retorna `0`.

## Critérios de aceite

1. Nenhuma pill "Running"/"Paused" na lista ativa, em nenhum caso (grupo e standalone).
2. Todo card de task já iniciada mostra Start / End / Duration na parte de baixo do card; filha de grupo
   mostra também o badge com o nome do grupo ao lado do título; standalone não mostra badge.
3. Há espaçamento visível entre a box branca do título do grupo e a linha "X of Y completed".
4. Página empilhada em largura cheia: card principal no topo (Logo/options → timer menor `text-4xl` →
   bloco de estatísticas ocupando quase toda a largura do card), sem sidebar; abaixo dele, também em
   largura cheia, a seção de tasks/subtasks.
5. Seções na ordem Active → Paused → Pending; a seção Active tem altura máxima e rola internamente
   quando há muitos itens; a lista de subtasks de um grupo também rola.
6. 8 tiles de estatística, com as 4 novas métricas exibindo valores coerentes (não `NaN`, não vazio).
7. `npm run build` passa (o script roda `tsc`).
8. Zero erro de console/página; recarregar mantém o estado (persistência intocada).
9. Drag-and-drop continua funcionando dentro de uma mesma seção e dentro de um grupo.

## Fora de escopo

- Qualquer migração/novo campo persistido (`useStoredTasks.ts` não é tocado).
- Mudar a semântica de `calculateTasksCompleted` (hoje conta qualquer evento `complete`, sem filtrar
  por dia) — segue como está.
- Reescrever `reorderItems`, permitir drag entre seções, ou drag entre grupos.
- Novas telas, novo módulo de reports, agregação sobre `states/reports`.
- Criar suíte de testes automatizada.

## Teste de sistema (browser / Playwright)

Modo recomendado: **browser only**. Rota que comprovadamente funciona nesta stack (ver
`.claude/tasks/2026-08-23_task-grupo-done/tests-07/verdict.md`): as ferramentas MCP
`mcp__playwright__browser_*` estão quebradas neste host — usar **script Node + Playwright**:
`npm i --no-save --prefix /tmp/pw playwright@1.63.0`, rodar com `NODE_PATH=/tmp/pw/node_modules`,
headless, viewport **1280x900**, Vite em `http://localhost:1420`.

Dois pré-requisitos de infra, obrigatórios:
- **Shim de notificação** antes do `goto` — sem ele a UI inteira fica atrás do gate
  (`page.tsx`, `shouldBlockContent`):
  `context.addInitScript(() => Object.defineProperty(window.Notification, 'permission', { value: 'granted' }))`.
- O timer global (`countdownTimer`) **não é persistido**: é preciso clicar "Start" no timer global antes
  de dar Play em qualquer task, e novamente depois de cada `page.reload()`.

Preset a montar (prefixo `QA-`, tudo criado do zero na rodada):
- `QA-Grupo-Scroll` com **8 subtasks** — 1 rodando (ATIVA), 1 iniciada e parada (PAUSADA), 6 nunca
  iniciadas (PENDENTES). Prova o scroll interno da lista de subtasks e o badge de grupo nos cards.
- `QA-Grupo-Pendente` com 2 subtasks nunca iniciadas — prova a seção PENDENTES.
- `QA-Task-Solta` iniciada e parada — prova o caso standalone (não-regressão vs
  `.claude/tasks/2026-08-23_task-grupo-done/tests-07/screenshots/06-nao-regressao-standalone.png`) e o
  caso "task pausada".
- `QA-Grupo-100` com 2 subtasks ambas completadas — reproduz o estado do screenshot
  `03a-parcial-100-habilitado.png` para conferir o respiro do pedido 1.

Casos a exercitar (screenshots em `tests-NN/screenshots/`): os 9 critérios de aceite acima, mais um
caso de reload e um de drag dentro da mesma seção.
