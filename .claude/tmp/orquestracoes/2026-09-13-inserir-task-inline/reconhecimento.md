# Reconhecimento — inserir task inline, na posição certa

> Terceira rodada. A spec ganhou `AC-008 (rn)` e os `RT-023` a `RT-026`; `AC-007`, `RT-011` e
> `RT-020` foram emendados para valer também "dentro de um grupo". O dev decidiu seccionar a lista
> de dentro do card do grupo em Active/Paused/Pending, com os mesmos cabeçalhos e comportamento da
> listagem geral. Este arquivo reaproveita o mapa da rodada 2 (RT-001 a RT-022, premissas sobre
> `getTaskActivityStatus`/`executeTask`/`stopTask`, ausência de exclusividade de task ativa) e
> concentra leitura nova no seccionamento do grupo. A Dúvida da rodada 2 sobre "o que uma fresta
> entre filhos de um grupo deveria herdar, já que grupo não tinha seção" está **resolvida pela
> própria spec desta rodada**: o grupo passa a ter seções de verdade (`AC-008`), então a herança
> funciona ali exatamente como na raiz — não é mais dúvida, é comportamento especificado.

## Estado atual
veredito: confirma

Tudo que a rodada 2 confirmou continua valendo: task nova só nasce pelo campo fixo do topo (fim da
lista) ou pelo campo fixo do grupo (fim do grupo); não existe ponto de criação no meio; ordem é só
a posição no array `TasksState.items`; estado de atividade é derivado (`getTaskActivityStatus`),
sem campo de status próprio; `executeTask`/`stopTask` são o único caminho de mudança de estado;
não existe exclusividade de "uma task ativa por vez" no código hoje.

Mapeando especificamente o delta desta rodada (o card do grupo seccionado):

- **Como a listagem geral renderiza as seções hoje**: `IndexActiveTasksList.tsx` (linhas 31-130) é
  um único componente que escreve **três blocos JSX literais e copiados**, um por seção
  (Active 72-89, Paused 91-108, Pending 110-127). Cada bloco é: `{itens.length > 0 && (...)}`
  (é assim que uma seção vazia é omitida — checagem de tamanho antes de renderizar, nada mais),
  um `<span>` com o rótulo fixo da seção, um `SortableContext` do `dnd-kit` com
  `items={itens.map(i => i.id)}` e `strategy={rectSortingStrategy}`, e dentro dele a grade
  `<div className="grid grid-cols-1 lg:grid-cols-2 gap-3 items-start" data-tasks-section="...">`
  que mapeia os itens via `renderSectionItems` (linha 21, decide `IndexSortableTaskGroup` vs
  `IndexSortableTaskItem`). **Não existe um componente "Section" reusável** — é copy-paste 3x no
  mesmo arquivo.
- **Quem particiona**: `useListingTasks.ts` (linhas 32-48) calcula `activeSectionItems` /
  `pausedSectionItems` / `pendingSectionItems` com um `forEach` que resolve o status de cada item
  (`getTaskActivityStatus` para task, `getGroupActivityStatus(getGroupChildren(tasks, item.id))`
  para grupo) e empurra no array certo, **preservando a ordem original do array de entrada**. A
  entrada é `activeListItems` (linhas 26-30), que já é **escopada à raiz**:
  `(isTaskGroup(item) && !item.completed) || (isTask(item) && item.groupId === null && !item.completed)`.
  Ou seja, a regra de bucketing (resolver status → empurrar no array certo, preservando ordem) e o
  escopo (só itens de raiz) estão **misturados no mesmo hook**, e é por isso que hoje não dá para
  reusar isso "as is" dentro de um grupo.
- **Quanto disso é reusável sem duplicar a regra (RT-024)**: a parte que precisa virar função
  pura e compartilhada é só o bucketing (dado um jeito de resolver o status de um item, devolver os
  três arrays na ordem original) — isso serve tanto à raiz (mistura task+grupo, resolvendo grupo via
  `getGroupActivityStatus`) quanto ao grupo (só tem `Task` como filho — grupo não aninha grupo,
  confirmado no tipo: `TaskGroup` não tem `groupId`, só `Task` tem — então dentro de um grupo o
  resolvedor é sempre `getTaskActivityStatus` direto, nunca precisa de `getGroupActivityStatus`).
  Extrair essa função para `states/tasks/utils.ts` (ao lado de `getTaskActivityStatus`/
  `getGroupActivityStatus`, que já existem lá) resolve RT-024 do lado da regra. Do lado da
  apresentação, o cabeçalho + a omissão de seção vazia + o `SortableContext`/grade é hoje 3 blocos
  copiados no mesmo arquivo — extrair isso para um componente de apresentação (ex.
  `IndexTasksSection`) no já existente
  `IndexActiveTasksList/shared-components/` (onde já mora `IndexEditInput.tsx`, mesmo padrão de
  pasta) e consumir esse componente tanto em `IndexActiveTasksList.tsx` quanto em
  `IndexGroupTasksList.tsx` é o que evita a segunda cópia da regra que o RT-024 proíbe. Nenhuma das
  duas extrações exige mexer em outro consumidor — ver `## Reuso disponível` para o raio de
  impacto conferido.
- **Como o drag-and-drop está montado hoje**: na raiz, um único `DndContext` (linhas 67-71)
  envolve as três `SortableContext`, e `handleDragEnd` (linhas 49-64) só reordena quando
  `activeSection === overSection` (mapa `sectionByItemId`, linhas 42-47) — ou seja, a raiz **já**
  impede mover item de uma seção para outra. Dentro do grupo, hoje
  (`IndexGroupTasksList.tsx`, linhas 23-76) é **um único** `DndContext` + **uma única**
  `SortableContext` (`verticalListSortingStrategy`) sobre `visibleChildren` (lista plana, sem
  partição), com `handleDragEnd` (linhas 37-43) que reordena sempre que `active.id !== over.id`,
  **sem nenhuma checagem de seção** — porque hoje não existe seção lá dentro.
- **O que muda no grupo depois do seccionamento (RT-025)**: exatamente o que já existe na raiz,
  replicado em escala menor — passar de 1 `SortableContext` para 3 (uma por seção, cada uma com sua
  própria grade/lista), e o `handleDragEnd` do grupo ganhar o mesmo guard `sectionByItemId` que a
  raiz já tem, para que arrastar só reordene dentro da mesma seção. Não é uma mudança de biblioteca
  nem de estratégia de drag, é literalmente copiar o padrão que a raiz já resolveu.
- **Onde o campo fixo do grupo insere a subtask hoje (RT-026)**: `IndexTaskGroup.tsx` (linhas
  72-87) — `handleAddChild` chama `addTask(childTitle, group.id)`. `addTask`
  (`states/tasks/index.ts:80-148`) acha o índice do **último item pertencente àquele grupo**
  (último filho, ou o próprio cabeçalho do grupo se não houver filho) e insere logo depois — ou
  seja, sempre no fim do array de itens daquele grupo, sem nenhum conceito de seção. Como toda task
  nova nasce `pending` (`isRunning: false`, `timeEvents: []`), e o bucketing preserva a ordem
  original do array, essa nova subtask cai automaticamente como o **último** item do bucket Pending
  — o mesmo mecanismo que já garante isso na raiz hoje. **`addTask` não precisa mudar** para
  RT-026 se sair de verdadeiro: o "fim da seção Pending" já é consequência de preservar ordem de
  array no bucketing, exatamente como a raiz já demonstra.
- **Julgamento de custo do seccionamento**: não é mais caro do que "reusar a apresentação da
  listagem geral" sugere. A extração é pequena e autocontida (uma função pura de bucketing +
  um componente de apresentação + replicar 1→3 `SortableContext` com o guard que a raiz já tem),
  não toca modelo de dado persistente, não muda contrato consumido por outra unidade (o projeto só
  tem uma unidade), e o padrão de extrair peça de apresentação para `shared-components/` já existe
  no repo. **Não vira onda nem exige gate técnico novo** — vira checkpoint próprio dentro do plano
  único desta task (separar "inserção básica" de "seccionamento do grupo" como dois checkpoints
  sequenciais é prudente para review, mas não precisa de outra rodada de reconhecimento/plano).
  Único ponto genuinamente em aberto é *o quão literal* é "mesma apresentação" — ver `## Dúvidas`.

## Unidade afetada
raiz (frontend React/Vite/TS) — recorte em
`src/pages/index/components/IndexTasks` e `src/pages/index/states/tasks`.

## Lane de cada RT
Projeto sem suíte automatizada (`comando de teste: nenhum`) e sem API HTTP própria (app
Tauri/SPA, estado só em `localStorage`) — lanes `teste` e `curl` continuam indisponíveis; todo RT
que as pediria cai em `browser` ou `codigo`.

- RT-001 → codigo — `package.json` (dependencies/devDependencies) e o diff da implementação;
  nenhuma lib nova para hover/timer/seccionamento, o repo já tem tudo (`dnd-kit` já dá conta de N
  `SortableContext`; Tailwind já tem `group-hover`).
- RT-002 → codigo — `src/pages/index/states/tasks/index.ts` (ordem continua sendo a posição no
  array `items`; `reorderItems`, linhas 270-310+, é escopado por `workflowId`, nunca por seção —
  nenhuma migração de shape).
- RT-003 → codigo — `src/pages/index/states/tasks/index.ts:80-148` (`addTask`) e `:339-397`
  (`executeTask`/`stopTask`); o revisor confere se a nova inserção reusa exatamente a mesma
  construção de `Task` que `addTask` já faz e a mesma composição `executeTask`(+`stopTask`) para o
  estado herdado (AC-007), sem caminho de mutação alternativo.
- RT-004 → browser — `http://localhost:1420/`
- RT-005 → browser — `http://localhost:1420/`
- RT-006 → browser — `http://localhost:1420/` (SHOULD; grade de 2 colunas na raiz — ver
  `## Armadilhas`; dentro do grupo hoje é lista vertical simples, não grade, então o mesmo problema
  de reflow não existe do mesmo jeito ali — depende da resposta da Dúvida 1)
- RT-007 → browser — `http://localhost:1420/`
- RT-008 → browser — `http://localhost:1420/`
- RT-009 → browser — `http://localhost:1420/`
- RT-010 → browser — `http://localhost:1420/`
- RT-011 → browser — `http://localhost:1420/` (dentro do card de um grupo, agora dentro da seção
  Pending daquele grupo — RT-011 e AC-008 se sobrepõem aqui; ver S10 ajustado)
- RT-012 → browser — `http://localhost:1420/`
- RT-013 → browser — `http://localhost:1420/`
- RT-014 → browser — `http://localhost:1420/`
- RT-015 → browser — `http://localhost:1420/` (dois casos: Esc com campo vazio, Esc com texto —
  ver S14/S15)
- RT-016 → browser — `http://localhost:1420/`
- RT-017 → browser — `http://localhost:1420/`
- RT-018 → browser — `http://localhost:1420/`
- RT-019 → browser — `http://localhost:1420/`
- RT-020 → browser — `http://localhost:1420/` (as três seções — Active, Paused, Pending — na raiz
  e, agora, também dentro de um grupo; ver S21/S22 e a nova prova de herança dentro do grupo)
- RT-021 → codigo — `src/pages/index/states/tasks/index.ts:80-148` e `:339-397`; o revisor confere
  se a inserção com estado herdado encadeia as mesmas actions/mutações (`addTask`-like +
  `executeTask` [+ `stopTask`]) em vez de gravar `isRunning`/`timeEvents` numa combinação que o
  código de hoje nunca produz.
- RT-022 → browser — `http://localhost:1420/` (a premissa condicional do RT é falsa neste
  código — não há exclusividade de task ativa — então a prova é visual: duas tasks contando tempo
  ao mesmo tempo, nenhuma para a outra).
- RT-023 → browser — `http://localhost:1420/` (cabeçalhos Active/Paused/Pending dentro do card do
  grupo, mesma ordem, seção vazia omitida).
- RT-024 → codigo — `src/pages/index/states/tasks/utils.ts` (função de bucketing extraída, usada
  tanto por `useListingTasks.ts` quanto pelo cálculo de seções do grupo) e
  `IndexActiveTasksList/shared-components/` (componente de apresentação da seção, consumido por
  `IndexActiveTasksList.tsx` e `IndexGroupTasksList.tsx`); o revisor confere que não existe uma
  segunda implementação da regra de bucketing nem uma segunda cópia do JSX de cabeçalho/grade.
- RT-025 → browser — `http://localhost:1420/` (arrastar dentro da mesma seção do grupo funciona;
  arrastar entre seções diferentes do grupo é recusado, mesma regra da raiz).
- RT-026 → browser — `http://localhost:1420/` (campo fixo do grupo continua criando no fim, e a
  subtask nova aparece no fim da seção Pending daquele grupo).

## RT problemáticos
nenhum.

## Mapa do código
- [src/pages/index/components/IndexTasks/IndexAddInput.tsx:1](src/pages/index/components/IndexTasks/IndexAddInput.tsx#L1) — campo fixo do topo (fora de escopo, RT-018 é regressão dele).
- [src/pages/index/components/IndexTasks/IndexActiveTasksList/IndexActiveTasksList.tsx:21](src/pages/index/components/IndexTasks/IndexActiveTasksList/IndexActiveTasksList.tsx#L21) — `renderSectionItems`, decide `IndexSortableTaskGroup` vs `IndexSortableTaskItem` por item.
- [src/pages/index/components/IndexTasks/IndexActiveTasksList/IndexActiveTasksList.tsx:31-130](src/pages/index/components/IndexTasks/IndexActiveTasksList/IndexActiveTasksList.tsx#L31) — os 3 blocos de seção copiados (Active 72-89, Paused 91-108, Pending 110-127): header, `SortableContext`, grade `data-tasks-section`, omissão por `.length > 0`. É o que RT-024 pede para não duplicar; é daqui que sai o componente de seção a extrair.
- [src/pages/index/components/IndexTasks/IndexActiveTasksList/IndexActiveTasksList.tsx:42-64](src/pages/index/components/IndexTasks/IndexActiveTasksList/IndexActiveTasksList.tsx#L42) — `sectionByItemId` + `handleDragEnd`: o guard de "só reordena na mesma seção" que RT-025 precisa replicar dentro do grupo.
- [src/pages/index/hooks/useListingTasks.ts:26-48](src/pages/index/hooks/useListingTasks.ts#L26) — `activeListItems` (escopo: só raiz) e o `forEach` de bucketing (linhas 36-48) que popula `activeSectionItems`/`pausedSectionItems`/`pendingSectionItems`, preservando ordem do array. É a regra que RT-024 proíbe duplicar; extrair o `forEach` como função pura parametrizada por resolvedor de status.
- [src/pages/index/components/IndexTasks/IndexActiveTasksList/IndexTaskGroup/IndexGroupTasksList.tsx:23-76](src/pages/index/components/IndexTasks/IndexActiveTasksList/IndexTaskGroup/IndexGroupTasksList.tsx#L23) — hoje: lista plana (`visibleChildren`, linha 33, sem partição), 1 `DndContext` + 1 `SortableContext` (`verticalListSortingStrategy`), sem cabeçalho, sem `data-tasks-section`, wrapper `flex flex-col gap-3 max-h-[560px] overflow-y-auto pr-2 py-1` (linha 64). É aqui que entram as 3 seções depois do seccionamento.
- [src/pages/index/components/IndexTasks/IndexActiveTasksList/IndexTaskGroup/IndexTaskGroup.tsx:72-87](src/pages/index/components/IndexTasks/IndexActiveTasksList/IndexTaskGroup/IndexTaskGroup.tsx#L72) — `handleChildTitleChange`/`handleChildKeyDown`/`handleAddChild`: o campo fixo do grupo (linhas 170-184 no JSX), chama `addTask(childTitle, group.id)`. RT-026 não pede mudar isto.
- [src/pages/index/states/tasks/index.ts:80-148](src/pages/index/states/tasks/index.ts#L80) — `addTask`; para grupo, acha o índice do último item daquele grupo (`insertIndex`, linhas 116-127) e insere logo depois (linhas 133-138) — sempre no fim do grupo, sem conceito de seção; task nova nasce `pending` (sem `timeEvents`), então cai no fim do bucket Pending de graça.
- [src/pages/index/states/tasks/index.ts:339](src/pages/index/states/tasks/index.ts#L339) e [:370](src/pages/index/states/tasks/index.ts#L370) — `executeTask`/`stopTask`; caminho de "nasce ativa"/"nasce pausada" (AC-007/RT-020/RT-021), reusado sem mudança tanto na raiz quanto dentro de um grupo — `IndexTaskItem.tsx` é o mesmo componente para os dois casos.
- [src/pages/index/states/tasks/index.ts:270-310+](src/pages/index/states/tasks/index.ts#L270) — `reorderItems`: escopado só por `workflowId`, nunca olha seção nem grupo; a checagem de seção fica inteiramente do lado do `handleDragEnd` do componente (raiz já tem, grupo precisa ganhar).
- [src/pages/index/states/tasks/index.ts:17-29](src/pages/index/states/tasks/index.ts#L17) — `Task`/`TaskGroup`/`TaskItem`: confirma que `TaskGroup` não tem `groupId` — grupo nunca aninha grupo, então o bucketing dentro de um grupo só precisa de `getTaskActivityStatus`, nunca de `getGroupActivityStatus`.
- [src/pages/index/states/tasks/utils.ts:106-133](src/pages/index/states/tasks/utils.ts#L106) — `getTaskActivityStatus`/`getGroupActivityStatus`; local natural para a nova função de bucketing compartilhada.
- [src/pages/index/components/IndexTasks/IndexActiveTasksList/shared-components/IndexEditInput.tsx:12](src/pages/index/components/IndexTasks/IndexActiveTasksList/shared-components/IndexEditInput.tsx#L12) — pasta e padrão onde o componente de seção reusável (RT-024) deve morar.
- [src/pages/index/components/IndexTasks/shared-state.ts:1](src/pages/index/components/IndexTasks/shared-state.ts#L1) — `indexTasksPageStateAtom` (`editingTaskId`); padrão de "um item especial por vez", reusável para o input inline de inserção (RT-017), sem mudança por causa do seccionamento.
- [src/pages/index/components/IndexTasks/IndexErrorMessage.tsx:9](src/pages/index/components/IndexTasks/IndexErrorMessage.tsx#L9) — único `setTimeout`/`clearTimeout` do projeto; padrão para o auto-dismiss de 20s (RT-012/RT-013/RT-014).
- [src/pages/index/components/IndexTasks/IndexActiveTasksList/IndexTaskItem/IndexTaskItem.tsx:46-78](src/pages/index/components/IndexTasks/IndexActiveTasksList/IndexTaskItem/IndexTaskItem.tsx#L46) — único lugar que chama `executeTask`/`stopTask`; confirma ausência de exclusão mútua (RT-022) e o gate do Pomodoro global.
- [src/pages/index/components/IndexTasks/IndexActiveTasksList/IndexTaskItem/IndexTaskItem.tsx:116-121](src/pages/index/components/IndexTasks/IndexActiveTasksList/IndexTaskItem/IndexTaskItem.tsx#L116) — auto-pausa quando o Pomodoro global para; a seção Active só existe com o Pomodoro rodando de verdade, na raiz e dentro de grupo.
- [src/pages/index/hooks/useStoredTasks.ts:195](src/pages/index/hooks/useStoredTasks.ts#L195) — persistência em `localStorage`; cobre RT-019 sem mudança.

## Padrão da vizinhança
Todo estado de UI "só um item especial por vez" (edição, e agora criação inline) vive num átomo
jotai compartilhado (`indexTasksPageStateAtom`), lido/escrito por `useAtom`. Toda mutação de dado
passa por `useTasksState` (zustand) com uma action nomeada, nunca manipulação direta do array fora
da store. A transição de estado de atividade usa exclusivamente `executeTask`/`stopTask` — nunca um
campo de status setado direto. Presença de item na tela é sempre computada por bucketing sobre o
array `items`, preservando ordem original — nunca por um índice/posição gravado no dado. Peça de
apresentação reusável entre dois pontos do componente ganha arquivo próprio em
`.../shared-components/` (`IndexEditInput.tsx` já é esse padrão); regra de negócio reusável ganha
função pura em `states/tasks/utils.ts` (`getTaskActivityStatus`/`getGroupActivityStatus` já são
esse padrão). Drag-and-drop usa `dnd-kit`: um `DndContext` por escopo de reordenação (raiz e cada
grupo têm o seu), com uma ou mais `SortableContext` dentro, e o guard de "não pode misturar seções"
vive no `handleDragEnd` do componente, comparando um mapa `id → seção`, nunca dentro da action de
store (`reorderItems` é agnóstica a seção).

## Reuso disponível
- A função de bucketing (resolver status de cada item → empurrar em active/paused/pending,
  preservando ordem) pode ser extraída de `useListingTasks.ts:36-48` para `states/tasks/utils.ts`
  como função pura genérica, e reusada por: (a) `useListingTasks` na raiz, passando um resolvedor
  que trata task e grupo (como já faz); (b) o novo cálculo de seções do grupo, passando
  `getTaskActivityStatus` direto sobre os filhos do grupo (nunca precisa tratar grupo, confirmado
  pelo tipo `TaskGroup` sem `groupId`). Único consumidor de `useListingTasks` fora deste recorte é
  `IndexTasks.tsx`, `IndexFooter.tsx` e `IndexCompletedTaskGroup.tsx` (todos leem campos como
  `tasks`/`activeListItems`, não os *SectionItems — extrair a função não quebra nenhum deles).
- O bloco de 3 seções copiadas em `IndexActiveTasksList.tsx` (72-127) vira o componente de
  apresentação (`shared-components/`) que `IndexGroupTasksList.tsx` também passa a consumir —
  resolve RT-023 e RT-024 juntos.
- O guard `sectionByItemId`/`handleDragEnd` da raiz (linhas 42-64) é o padrão exato a replicar
  dentro do `handleDragEnd` do grupo — resolve RT-025.
- `addTask`/`executeTask`/`stopTask` não precisam de nenhuma mudança para RT-026: o "fim da seção
  Pending" já é consequência de preservar ordem de array no bucketing.
- `IndexSortableTaskItem`/`IndexTaskItem` já são o mesmo componente para task de raiz e subtask de
  grupo — a herança de estado (Play/Stop) dentro de uma seção do grupo não precisa de nenhum código
  novo além do que a inserção básica (rodada 2) já escreve, só passar pelo caminho scoped a
  `group.id`.
- `insertIndex`/`slice`/`splice` de `addTask` (linhas 116-138) continua sendo o esqueleto de
  inserção por índice a estender para índice arbitrário (herdado da rodada 2, sem mudança).

## Memórias que se aplicam
Nenhuma entrada de `.claude/memory/` trata de UI de lista, hover, seccionamento ou estado de
atividade de task. A única entrada de `business-rules/` (`razao-de-negocio-e-casos-de-uso-v1.md`)
descreve a razão de negócio do produto e não toca esta mecânica — não aplicável aqui.

## Fixtures
veredito: sem mecanismo
estado: nenhum comando de estado automatizado existe. O ponto de partida é montado dirigindo a
própria UI: abrir `http://localhost:1420/` com o shim `Notification.permission = "granted"`
injetado antes do boot (necessário em Chromium headless, como em
`.claude/tasks/2026-09-06_layout-task-card/tests-01/run.js`, senão a UI trava na tela de
permissão); o workflow default "Work" já vem selecionado. Depois:
1. Pelo campo fixo do topo, criar "Task A" e "Task B" (fresta entre elas na seção Pending da raiz).
2. Criar um grupo ">Group X" com subtasks "Sub 1" e "Sub 2" pelo campo fixo do card do grupo
   (cenário de RT-011; as duas nascem Pending — é a seção Pending do grupo depois de seccionado).
3. Clicar em "Start" no painel do Pomodoro (`IndexTimer`) para deixar o timer global rodando —
   pré-condição para qualquer task poder ficar ativa pelo caminho manual.
4. Criar "Task Ativa" pelo campo fixo (raiz) e clicar em Play nela → seção Active da raiz.
5. Criar "Task Pausada" pelo campo fixo (raiz), clicar em Play e depois em Stop nela → seção
   Paused da raiz.
6. Dentro de "Group X", clicar em Play em "Sub 1" → "Sub 1" migra para a seção Active do grupo
   (novo, exigido pelo seccionamento: dá ao grupo um item em Active e um em Pending — "Sub 2" —
   para provar RT-023/RT-025/a herança dentro do grupo).
a mudar: nada (veredito `sem mecanismo`).

## Roteiro de comprovação
ambiente: `npm run dev` (Vite, porta fixa 1420)
estado: nenhum comando automatizado — montar dirigindo a UI, na ordem da seção Fixtures acima:
abrir a app com o shim de notificação; criar "Task A" e "Task B" pelo campo fixo do topo; criar um
grupo ">Group X" com subtasks "Sub 1" e "Sub 2" pelo campo fixo do card do grupo; iniciar o
Pomodoro global ("Start" no painel do timer); criar "Task Ativa" e dar Play nela; criar "Task
Pausada", dar Play e depois Stop nela; dar Play em "Sub 1" dentro de "Group X".
url: http://localhost:1420/ — seção Active da raiz com "Task Ativa" contando tempo; seção Paused
com "Task Pausada"; seção Pending com "Task A" e "Task B"; grupo "Group X" expandido mostrando a
seção Active com "Sub 1" contando tempo e a seção Pending com "Sub 2"

S01 (RT-004) [final] passar o mouse na fresta entre "Task A" e "Task B" (seção Pending da raiz) → aparece o ponto de inserção com o rótulo "+ adicionar task"
S02 (RT-004) [final] mover o mouse para fora de qualquer fresta da lista → nenhum ponto de inserção fica visível
S03 (RT-005) [final] passar o mouse na fresta acima de "Task A" (a primeira da seção Pending) → aparece o mesmo ponto de inserção ali
S04 (RT-005) [final] passar o mouse logo abaixo da última task da seção Pending da raiz → nenhum ponto de inserção aparece
S05 (RT-006) [final] comparar a fresta entre "Task A" e "Task B" sem hover e com hover → as duas tasks se deslocam, no máximo, a altura do próprio ponto de inserção
S06 (RT-007) [final] clicar no ponto de inserção entre "Task A" e "Task B" → ele vira um input de criação na mesma posição, com o cursor já piscando dentro do campo, sem nenhum clique extra
S07 (RT-008, RT-020) [final] digitar "Task Nova" no input aberto entre "Task A" e "Task B" e apertar Enter → "Task Nova" aparece exatamente entre "Task A" e "Task B", nessa ordem, nenhuma outra task muda de posição, e ela nasce na seção Pending (sem cronômetro rodando e sem o ícone de pausada), do mesmo jeito que uma task criada pelo campo fixo
S08 (RT-009) [final] com o input aberto e vazio, apertar Enter → nada é criado e o input continua aberto
S09 (RT-010) [final] depois de criar "Task Nova" (S07), digitar "Task Nova 2" no input que reabriu logo abaixo dela e apertar Enter → "Task Nova 2" aparece logo abaixo de "Task Nova", e o input reabre vazio e focado abaixo da segunda
S10 (RT-011) [final] passar o mouse na fresta entre "Sub 1" e "Sub 2", dentro da seção Pending do card "Group X" → aparece o ponto de inserção sob o cabeçalho "Pending" do grupo; clicar nele abre o input ali, com o cursor já piscando; digitar "Sub Nova" e apertar Enter → "Sub Nova" aparece exatamente entre "Sub 1" e "Sub 2", ainda dentro da seção Pending daquele grupo, e nenhum item de outra seção do grupo muda de posição
S11 (RT-012) [final] abrir um input vazio numa fresta e não interagir com nada por mais de 20 segundos → o input desaparece sozinho e a fresta volta a mostrar só o hover normal
S12 (RT-013) [final] abrir um input, digitar um texto e não interagir com nada por mais de 20 segundos → o input continua aberto com o texto digitado
S13 (RT-014) [final] abrir um input vazio, esperar cerca de 15 segundos, apertar uma tecla (reiniciando a contagem) e esperar mais 15 segundos → o input ainda está aberto (teria sumido aos 20s se a contagem não tivesse reiniciado)
S14 (RT-015) [final] com um input aberto e vazio, apertar Esc → o input fecha e nenhuma task nova aparece
S15 (RT-015) [final] com um input aberto e com um texto digitado, apertar Esc → o input fecha do mesmo jeito, sem criar nada e sem pedir confirmação
S16 (RT-016) [final] abrir um input vazio e clicar fora dele → o input fecha na hora
S17 (RT-016) [final] abrir um input, digitar um texto e clicar fora dele → o input continua aberto com o texto
S18 (RT-017) [final] com um input aberto numa fresta, clicar no ponto de inserção de outra fresta → o input da fresta antiga some e um novo input abre na fresta clicada, nunca os dois ao mesmo tempo
S19 (RT-018) [final] usar o campo fixo "Add a task..." do topo para criar "Task Final" → ela aparece no fim da lista, como hoje, sem nenhuma mudança de comportamento
S20 (RT-019) [final] criar uma task pelo ponto de inserção (repetir S07) e recarregar a página inteira → a task recém-criada continua na mesma posição
S21 (RT-020) [final] com o Pomodoro rodando e "Task Ativa" já contando tempo na seção Active da raiz, passar o mouse na fresta abaixo de "Task Ativa", clicar no ponto de inserção, digitar "Task Nova Ativa" e apertar Enter → "Task Nova Ativa" aparece na seção Active, exatamente na posição clicada, já contando tempo, sem precisar clicar em Play
S22 (RT-020) [final] com "Task Pausada" já pausada na seção Paused da raiz, passar o mouse na fresta abaixo dela, clicar no ponto de inserção, digitar "Task Nova Pausada" e apertar Enter → "Task Nova Pausada" aparece na seção Paused, exatamente na posição clicada, sem o cronômetro rodando, com a mesma aparência de uma task pausada manualmente (Play disponível, sem Square/Stop ativo)
S23 (RT-022) [final] depois de S21, observar a seção Active da raiz com "Task Ativa" e "Task Nova Ativa" lado a lado → as duas continuam contando tempo ao mesmo tempo, sem nenhuma interrupção no cronômetro de "Task Ativa" causada pela criação da nova
S24 (RT-023) [final] abrir o card "Group X" expandido, com "Sub 1" ativa e "Sub 2" pendente → o card mostra os cabeçalhos "Active" e "Pending" (na mesma ordem e com o mesmo estilo da listagem geral), cada um com sua subtask, sem nenhum cabeçalho "Paused" visível (nenhuma subtask está pausada)
S25 (RT-023) [final] clicar em Play em "Sub 2" (que estava Pending) → "Sub 2" migra para a seção Active do card, o card passa a mostrar só o cabeçalho "Active" com as duas subtasks, e o cabeçalho "Pending" some por a seção ter ficado vazia
S26 (RT-020, RT-011) [final] com o card "Group X" mostrando a seção Active, passar o mouse na fresta abaixo de "Sub 1" (dentro da seção Active do grupo), clicar no ponto de inserção, digitar "Sub Ativa Nova" e apertar Enter → "Sub Ativa Nova" aparece dentro da seção Active daquele grupo, exatamente na posição clicada, já contando tempo, sem precisar clicar em Play
S27 (RT-025) [final] com "Group X" tendo ao menos duas subtasks na seção Active (S26), arrastar uma delas para cima da outra dentro da mesma seção Active do grupo → as duas trocam de posição, e a ordem da seção Pending do mesmo grupo não muda
S28 (RT-025) [final] tentar arrastar uma subtask da seção Active do grupo para dentro da seção Pending do mesmo grupo → o drop é recusado: a subtask permanece na seção Active, na mesma posição de antes
S29 (RT-026) [final] com o card "Group X" aberto, usar o campo fixo "Add a task..." do próprio card para criar "Sub Final" → ela aparece no fim da seção Pending daquele grupo, como uma subtask recém-nascida (sem cronômetro), abaixo de qualquer outra subtask pendente já existente

comando: nenhum (comando de teste: nenhum — lane `teste` indisponível neste projeto)
T01 n/a

## Armadilhas
- A lista raiz é uma **grade de 2 colunas** (`lg:grid-cols-2`), não uma lista vertical simples —
  inserir um elemento no meio do `.map` desloca os itens seguintes na grade. Decidido pelo nível 0
  (candidata A, ver `## Premissas`): o ponto de inserção é elemento próprio no grid com
  `grid-column: 1 / -1`, aceitando o reflow que RT-006 autoriza (no máximo a própria altura). **A
  lista de dentro do grupo hoje NÃO é uma grade — é uma coluna vertical simples**
  (`flex flex-col gap-3`, `verticalListSortingStrategy`), então esse truque de reflow simplesmente
  não é necessário lá, a menos que o seccionamento também troque o layout do grupo para grade (ver
  Dúvida 1 abaixo — se sim, o truque precisa ser replicado lá também).
- A seção Active só existe (renderiza) enquanto o Pomodoro global está rodando de verdade —
  parar ou entrar em descanso auto-pausa toda task com cronômetro ligado
  (`IndexTaskItem.tsx:116-121`), o que esvazia a seção. Vale igual para a seção Active de dentro de
  um grupo: se o Pomodoro global para, as subtasks ativas do grupo também são auto-pausadas e a
  seção Active do grupo esvazia — a implementação da inserção não precisa checar
  `isGlobalTimerRunning`/`isResting` por conta própria além do que `executeTask` já checa.
- `addTask` (e portanto qualquer action nova de inserção) é no-op silencioso se
  `selectedWorkflowId` for `null`. A nova action de inserção deve manter essa mesma guarda.
- Gerar o `id` da task (via `crypto.randomUUID()`) antes de encadear
  `addTask`-like → `executeTask` → (`stopTask`) evita buscas separadas por id em updates de store
  distintos; qualquer sequência que produza o mesmo `Task` final satisfaz RT-003/RT-021.
- Ao extrair a função de bucketing para `utils.ts`, cuidado para não mudar a ordem de checagem
  (active → paused → pending) nem trocar `forEach`+push por algo que não preserve a ordem original
  do array — é essa preservação de ordem que garante de graça o "fim da seção Pending" do RT-026 e
  a posição correta nas provas S07/S10/S21/S22/S26.
- O `max-h-[560px] overflow-y-auto` que hoje envolve toda a lista do grupo (`IndexGroupTasksList.tsx:64`)
  precisa de uma decisão de onde fica depois do seccionamento (em volta das 3 seções juntas, ou por
  seção) — nada na spec pede mudar o comportamento de scroll do card, então a leitura mais barata é
  manter um único wrapper de scroll em volta das 3 seções juntas, preservando a altura/comportamento
  atual do card. Registrado como premissa, não dúvida, porque não muda nenhuma prova do roteiro.

## Dúvidas
- **RT-024 pede "reusar a mesma apresentação" da listagem geral dentro do card do grupo — isso
  inclui a grade de 2 colunas (`grid-cols-1 lg:grid-cols-2`) que a raiz usa, ou só o cabeçalho +
  omissão de seção vazia + regra de agrupamento, mantendo o layout de coluna única que o grupo já
  tem hoje?** O card do grupo já ocupa uma única célula da própria grade de 2 colunas da raiz
  (`IndexActiveTasksList.tsx:82`/`102`/`121` colocam `IndexSortableTaskGroup` dentro dessas
  células) — então o card já é, no desktop, algo em torno da metade da largura da página; encaixar
  uma segunda grade de 2 colunas dentro dele deixaria as subtasks bem estreitas. — candidatas:
  A) reusar só o componente de cabeçalho + a omissão de seção vazia + a função de bucketing,
  mantendo a lista de itens de cada seção do grupo em coluna única (como é hoje) | B) reusar
  literalmente o mesmo componente de seção da raiz, grade de 2 colunas incluída, aceitando cards de
  grupo mais estreitos por subtask no desktop. Recomendo A, porque o card já nasce mais estreito que
  a página inteira (é uma célula da grade da raiz) e nada na spec (`AC-008`/`RT-023`) menciona
  colunas — só cabeçalhos, ordem e omissão de seção vazia; a resposta muda se o `grid-column: 1/-1`
  do RT-006 precisa ser replicado dentro do grupo (só precisaria em B).

## Premissas
- Grade de 2 colunas da raiz: o ponto de inserção é elemento próprio no grid com
  `grid-column: 1 / -1`, aceitando o reflow de no máximo a própria altura (decidida pelo nível 0 na
  rodada 2).
- `RT-022`: como o app hoje **não** admite exclusividade de "uma task ativa por vez", a leitura
  correta é "nenhum comportamento de exclusividade novo é introduzido pela inserção".
- A nova inserção reaproveita a mesma construção de `Task` que `addTask` já faz hoje, variando o
  índice de inserção e, quando a seção pede, encadeando os mesmos efeitos de `executeTask`
  (e `stopTask`).
- O controle de "qual input inline de criação está aberto" reaproveita o mesmo padrão do
  `indexTasksPageStateAtom`/`editingTaskId` já usado para edição.
- RT-014 é lido literalmente: qualquer `keydown` ou `click` dentro do campo reinicia os 20s, mesmo
  sem mudar o valor do input.
- O wrapper de scroll (`max-h-[560px] overflow-y-auto`) do card do grupo continua envolvendo as 3
  seções juntas depois do seccionamento, em vez de um scroll por seção — nada na spec pede mudar o
  comportamento de altura/scroll do card.
- Groups nunca aninham groups (`TaskGroup` não tem `groupId` no tipo) — o bucketing dentro de um
  grupo só precisa resolver status via `getTaskActivityStatus`, nunca via `getGroupActivityStatus`.
- A Dúvida da rodada 2 sobre "o que uma fresta entre filhos de um grupo deveria herdar" está
  resolvida pela spec desta rodada (`AC-008` dá seção de verdade ao grupo) — não é mais dúvida.

veredito: simples
