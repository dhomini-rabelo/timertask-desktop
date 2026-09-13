# Plano — inserir task inline, na posição certa

## Resumo do plano

### O que muda

#### Checkpoint 1 — Fundação: action de inserção e bucketing compartilhado
- **`src/pages/index/states/tasks/index.ts`.** Extrai um helper privado `createTask(title, workflowId, groupId)` do literal que hoje mora dentro de `addTask`, e `addTask` passa a usá-lo (nenhuma mudança de comportamento). Ganha a action nova `insertTask(title, groupId, beforeId)`, que constrói a task pelo mesmo `createTask` e a insere no índice exato de `beforeId` no array `items`, devolvendo o id da task nova (ou `null` se o título for vazio ou não houver workflow selecionado — mesma guarda de hoje).
- **`src/pages/index/states/tasks/utils.ts`.** Ganha `bucketByActivityStatus`, a função pura que separa uma lista em active/paused/pending preservando a ordem original — hoje esse `forEach` está escrito só dentro de `useListingTasks.ts`.
- **`src/pages/index/hooks/useListingTasks.ts`.** Passa a chamar `bucketByActivityStatus` em vez do `forEach` manual; os nomes que ele devolve (`activeSectionItems`/`pausedSectionItems`/`pendingSectionItems`) não mudam.
- **`src/pages/index/components/IndexTasks/shared-state.ts`.** O átomo `indexTasksPageStateAtom` ganha o campo `insertingBeforeId: string | null`, que vai controlar qual fresta tem o input de criação aberto (nunca mais de uma, como `editingTaskId` já garante para edição).

Checkpoint sem nenhuma mudança visível ainda — é refactor + action nova que ninguém chama.

#### Checkpoint 2 — Ponto de inserção inline na listagem raiz
- **`IndexActiveTasksList/shared-components/IndexInsertTaskPoint.tsx` (novo).** O elemento de uma fresta: some por trás do hover (`group`/`group-hover`), mostra "+ adicionar task", e ao clicar vira um input focado. Input vazio sem interação por 20s fecha sozinho; com texto nunca fecha por tempo; Esc sempre fecha sem criar nada; clicar fora fecha só se estiver vazio; Enter com texto cria a task na posição exata e encadeia `executeTask`/`stopTask` conforme a seção (ativa/pausada/pendente) e reabre o mesmo input, vazio e focado, logo abaixo da task recém-criada.
- **`IndexActiveTasksList/shared-components/IndexTasksSection.tsx` (novo).** O componente de seção reusável: cabeçalho, omissão quando vazia, `SortableContext`, e a grade de 2 colunas (raiz) ou lista de 1 coluna (grupo) conforme um prop de layout — interpolando um `IndexInsertTaskPoint` antes de cada item.
- **`IndexActiveTasksList/IndexActiveTasksList.tsx`.** Os 3 blocos de seção copiados viram 3 chamadas a `IndexTasksSection` com `layout="grid"` e `groupId={null}`.

Fecha com a inserção inline funcionando na listagem raiz (todas as provas do roteiro fora do grupo).

#### Checkpoint 3 — Seccionamento do card do grupo + inserção dentro dele
- **`IndexActiveTasksList/IndexTaskGroup/IndexGroupTasksList.tsx`.** A lista plana de hoje vira 3 chamadas a `IndexTasksSection` com `layout="list"` e `groupId={group.id}`, dentro do mesmo wrapper de scroll de hoje; ganha o mesmo guard de `handleDragEnd` que a raiz já tem (só reordena dentro da mesma seção).

Fecha com o card do grupo seccionado e a inserção herdando estado também lá dentro.

### Decisões que travei sozinho
- Reabrir o input depois de criar reaproveita a **mesma** `beforeId` (o item que já estava logo depois da fresta) em vez de rastrear o id da task recém-criada: esse item-âncora não muda de identidade quando a task nova entra na frente dele, então "a fresta antes dele" já é, de graça, a fresta logo abaixo da task nova — resolve RT-010 sem estado extra.
- Fechar o input ao clicar fora usa o `onBlur` do próprio campo (o React já dispara isso quando o foco sai por qualquer clique fora), em vez de um listener global de clique.
- RT-014 é lido literalmente: um contador de interação, separado do valor do título, incrementado em todo `keydown`/`click` dentro do input — reinicia os 20s mesmo quando a tecla não muda o texto.
- O ponto de inserção cresce de uma faixa fina para a altura do botão "+ adicionar task" só no hover — esse próprio crescimento é o mecanismo que limita o deslocamento ao "no máximo a altura do ponto de inserção" do RT-006.
- O guard de seção do `handleDragEnd` dentro do grupo é cópia literal do padrão que a raiz já usa (mapa id→seção + comparação antes de reordenar); não vira função compartilhada porque RT-025 pede o mesmo comportamento, não uma terceira abstração, para 6 linhas já validadas na raiz.
- `insertTask` devolve o id da task criada (em vez de `void`, como `addTask`) para o componente poder encadear `executeTask`/`stopTask` sem buscar a task por título depois.

### O que fica de fora
- Mexer no campo fixo de criação, na raiz ou no grupo — comportamento intocado, só reverificado (S19, S29).
- Mexer no drag-and-drop além do guard de seção que RT-025 exige dentro do grupo.
- Ponto de inserção abaixo da última task de cada seção.
- Mudar a regra de quando uma task é ativa/pausada/pendente, ou introduzir qualquer exclusividade de task ativa nova.
- Criar grupo/subtask pelo ponto de inserção — ele só cria task.

### Como se prova
AC-001 — passar o mouse revela "+ adicionar task" em qualquer fresta entre duas tasks e acima da primeira de cada seção, e some fora delas (S01, S02, S03, S04 na lane browser).
AC-002 — clicar no ponto de inserção abre um input já focado na mesma posição, e a task nasce exatamente ali (S06, S07 na lane browser).
AC-003 — depois de criar, o input continua aberto e focado logo abaixo da task recém-criada (S09 na lane browser).
AC-004 — o mesmo comportamento vale entre as tasks de um grupo/subtask (S10 na lane browser).
AC-005 — input vazio some sozinho aos 20s sem interação, com texto nunca some por tempo, qualquer interação reinicia a contagem, Esc sempre fecha sem criar nada, clique fora fecha só se vazio, e nunca existe mais de um input inline aberto ao mesmo tempo (S08, S11-S18 na lane browser).
AC-006 — o campo fixo do topo e o do card do grupo continuam criando no fim, sem nenhuma mudança (S19, S29 na lane browser).
AC-007 — a task nasce no mesmo estado de atividade da seção onde a fresta está (ativa contando tempo, pausada, ou pendente), sem campo novo nem combinação de campos inédita (S07, S21, S22, S23, S26 na lane browser; RT-003 e RT-021 na lane codigo).
AC-008 — o card do grupo passa a ter as mesmas seções, cabeçalhos e ordem da listagem geral, com seção vazia omitida, reusando a mesma regra de agrupamento, e o drag continua só dentro da mesma seção (S24, S25, S27, S28 na lane browser; RT-024 na lane codigo).

## Objetivo
Dar à listagem de tasks — na raiz e dentro do card de um grupo — um ponto de inserção inline em
toda fresta entre itens (e acima do primeiro de cada seção), que abre um input de criação focado
ali mesmo, cria a task exatamente naquela posição já herdando o estado de atividade da seção, e
soma sozinho quando fica ocioso e vazio; e seccionar a lista de dentro do card do grupo nas
mesmas três seções (Active/Paused/Pending) da listagem geral, reusando a mesma apresentação e a
mesma regra de agrupamento.

## Passos

### Checkpoint 1 — Fundação: action de inserção e bucketing compartilhado
1. (RT-002, RT-003) **`src/pages/index/states/tasks/index.ts`** — extrair um helper privado
   `createTask(title: string, workflowId: string, groupId: string | null): Task` do literal hoje
   construído dentro de `addTask` (linhas 93-102), e fazer `addTask` usá-lo no lugar do literal.
   Nenhuma mudança de comportamento: mesmos campos (`id`, `title`, `workflowId`, `groupId`,
   `completed: false`, `isRunning: false`, `timeEvents: []`).
2. (RT-002, RT-003, RT-021) **`src/pages/index/states/tasks/index.ts`** — adicionar
   `insertTask: (title: string, groupId: string | null, beforeId: string) => string | null` à
   interface `TasksActions` e implementá-la: mesma guarda de `addTask` (título vazio, ou
   `selectedWorkflowId` nulo → devolve `null` sem mutar nada); constrói a task com `createTask`;
   dentro do `set`, acha `insertIndex = items.findIndex((item) => item.id === beforeId)` e insere
   com `slice(0, insertIndex)` + `newTask` + `slice(insertIndex)` (fallback: se `beforeId` não for
   encontrado, acrescenta no fim do array, nunca lança); devolve `newTask.id`. Adicionar
   `insertTask` ao objeto de actions retornado pela store.
3. (RT-024) **`src/pages/index/states/tasks/utils.ts`** — adicionar
   `export function bucketByActivityStatus<T>(items: T[], resolveStatus: (item: T) =>
   TaskActivityStatus): { active: T[]; paused: T[]; pending: T[] }`, com a mesma lógica do
   `forEach` que hoje mora em `useListingTasks.ts:36-48` (checa active → paused → pending nessa
   ordem, empurra no array certo, preserva a ordem original de `items`).
4. (RT-024, infra — pré-requisito do passo 10) **`src/pages/index/hooks/useListingTasks.ts`** —
   trocar o `forEach` manual (linhas 32-48) por uma chamada a `bucketByActivityStatus`, passando o
   mesmo resolvedor de hoje (`isTask(item) ? getTaskActivityStatus(item) :
   getGroupActivityStatus(getGroupChildren(tasks, item.id))`); os nomes que o hook devolve
   (`activeSectionItems`/`pausedSectionItems`/`pendingSectionItems`) não mudam.
5. (RT-017, infra — pré-requisito do passo 6) **`src/pages/index/components/IndexTasks/shared-state.ts`**
   — adicionar `insertingBeforeId: string | null` à interface `IndexTasksPageState` e ao valor
   inicial de `indexTasksPageStateAtom` (`{ editingTaskId: null, insertingBeforeId: null }`).

Fronteira do checkpoint: `npx eslint . --fix` e `npx tsc --noEmit` passam; nenhum consumidor além
deste arquivo muda, e nada ainda é visível na tela (refactor puro + action nova sem chamador).

### Checkpoint 2 — Ponto de inserção inline na listagem raiz
6. (RT-004, RT-005, RT-006, RT-007, RT-009, RT-012, RT-013, RT-014, RT-015, RT-016, RT-017)
   **`IndexActiveTasksList/shared-components/IndexInsertTaskPoint.tsx`** (novo) — componente com
   props `{ groupId: string | null; beforeId: string; status: TaskActivityStatus; className?:
   string }`. Lê/escreve `indexTasksPageStateAtom`; `isOpen = insertingBeforeId === beforeId`.
   - Fechado: `<div className="group ...">` com um botão "+ adicionar task"
     (`opacity-0 group-hover:opacity-100`, altura crescendo de uma faixa fina para a altura do
     botão só no hover, via `transition-all`) que, ao clicar, faz
     `setIndexTasksPageState((prev) => ({ ...prev, insertingBeforeId: beforeId }))` — como o campo é
     único no átomo, abrir uma fresta fecha qualquer outra sozinho (RT-017).
   - Aberto: `<Input autoFocus>` com `title` em estado local; `onKeyDown` trata `Enter` (ver passo
     7) e `Escape` (`setIndexTasksPageState((prev) => ({ ...prev, insertingBeforeId: null }))`, sem
     criar nada, com ou sem texto — RT-015); todo `keydown`/`click` dentro do input também
     incrementa um contador local `interactionTick` (RT-014). `onBlur`: se `title.trim()` vazio,
     fecha (mesmo `setIndexTasksPageState` do Escape) — RT-016; com texto, não faz nada.
   - `useEffect` com deps `[isOpen, title, interactionTick, beforeId]`: se `isOpen` e
     `!title.trim()`, agenda `setTimeout(20000)` que fecha (só se `insertingBeforeId` ainda for
     este `beforeId`, para não fechar uma fresta que já mudou); `clearTimeout` no cleanup. Isso
     cobre RT-012 (fecha aos 20s vazio), RT-013 (nunca agenda enquanto há texto) e RT-014 (qualquer
     dependência mudando reinicia o efeito e portanto o timer).
7. (RT-008, RT-010, RT-019, RT-020, RT-022) **mesmo arquivo** — no `Enter` com
   `title.trim()` não vazio: chama `const id = insertTask(title, groupId, beforeId)`; se `id` não
   for `null`, encadeia por `status`: `"active"` → `executeTask(id)`; `"paused"` → `executeTask(id)`
   seguido de `stopTask(id)`; `"pending"` → nenhuma chamada extra. Limpa o `title` local
   (`setTitle("")`) e refoca o input via `ref` — **não** muda `insertingBeforeId`, porque o item
   que era a âncora da fresta (`beforeId`) continua sendo o mesmo item, agora deslocado para depois
   da task nova; é isso que reabre o input vazio e focado logo abaixo da task recém-criada
   (RT-010) sem precisar rastrear o id dela.
8. (RT-024, infra — pré-requisito do passo 9 e do checkpoint 3)
   **`IndexActiveTasksList/shared-components/IndexTasksSection.tsx`** (novo) — componente com props
   `{ status: TaskActivityStatus; label: string; items: TaskItem[]; groupId: string | null;
   layout: "grid" | "list"; renderItem: (item: TaskItem) => ReactNode }`. Devolve `null` se
   `items.length === 0` (omissão de seção vazia). Renderiza o `<span>` de cabeçalho com `label`,
   um `SortableContext` (`items={items.map((i) => i.id)}`, `strategy={layout === "grid" ?
   rectSortingStrategy : verticalListSortingStrategy}`), e dentro dele um wrapper
   (`grid grid-cols-1 lg:grid-cols-2 gap-3 items-start data-tasks-section={status}` para `"grid"`,
   `flex flex-col gap-3` para `"list"`) que mapeia `items` intercalando, antes de cada item, um
   `IndexInsertTaskPoint` (`beforeId={item.id}`, `groupId`, `status`, `className="col-span-full"`
   só quando `layout === "grid"`) e depois `renderItem(item)`.
9. (RT-004, RT-005, RT-006, RT-007, RT-008, RT-009, RT-010, RT-017, RT-019, RT-020, RT-022, infra)
   **`IndexActiveTasksList/IndexActiveTasksList.tsx`** — trocar os 3 blocos de seção copiados
   (linhas 72-127) por 3 chamadas a `IndexTasksSection`: `status="active"|"paused"|"pending"`,
   `label="Active"|"Paused"|"Pending"`, `items={activeSectionItems|pausedSectionItems|
   pendingSectionItems}`, `groupId={null}`, `layout="grid"`, `renderItem` = a função hoje chamada
   `renderSectionItems` adaptada para um item por vez (`isTaskGroup(item) ?
   <IndexSortableTaskGroup .../> : <IndexSortableTaskItem .../>`). `sectionByItemId` e
   `handleDragEnd` (linhas 42-64) não mudam.

Fronteira do checkpoint: `eslint`/`tsc` passam; a inserção inline funciona de ponta a ponta na
listagem raiz (S01-S09, S11-S23, exceto as provas que exigem o card do grupo).

### Checkpoint 3 — Seccionamento do card do grupo + inserção dentro dele
10. (RT-011, RT-020, RT-023, RT-024, RT-025, RT-026)
    **`IndexActiveTasksList/IndexTaskGroup/IndexGroupTasksList.tsx`** — trocar `visibleChildren`
    (lista plana, linha 33) por
    `const children = getGroupChildren(tasks, group.id).filter((task) => !task.completed)` e
    `const { active, paused, pending } = bucketByActivityStatus(children,
    getTaskActivityStatus)`; renderizar 3x `IndexTasksSection` (`layout="list"`,
    `groupId={group.id}`, `status`/`label`/`items` para cada bucket, `renderItem={(item) =>
    <IndexSortableTaskItem key={item.id} task={item as Task} />}`), todas dentro do mesmo wrapper
    de scroll de hoje (`max-h-[560px] overflow-y-auto pr-2 py-1`, agora em volta das 3 seções
    juntas, não uma por seção). Manter um único `DndContext`; trocar `handleDragEnd` (linhas 37-43)
    pelo mesmo guard que a raiz já usa: montar `sectionByItemId` a partir de `active`/`paused`/
    `pending` locais, e só chamar `reorderItems` quando a seção de `active.id` e a de `over.id`
    forem a mesma (idêntico a `IndexActiveTasksList.tsx:42-64`). A mensagem "No tasks yet." some só
    quando `children.length === 0` (soma dos 3 buckets).

Fronteira do checkpoint (final): `eslint`/`tsc` passam; o card do grupo aparece seccionado e a
inserção dentro dele herda estado do mesmo jeito que a raiz (S10, S24-S29).

## Marcos de validação
nenhum — veredito do reconhecimento é `simples`; a validação roda uma vez, no fim (checkpoint 3).

## Ondas
onda única — cobre RT-001 a RT-026.

### Onda 1 — esta
cobre: RT-001 a RT-026 (todos).

## Contratos
- `createTask(title: string, workflowId: string, groupId: string | null): Task` — helper privado
  de `states/tasks/index.ts`, mesmo shape de `Task` que `addTask` produz hoje.
- `insertTask(title: string, groupId: string | null, beforeId: string): string | null` — nova
  action de `useTasksState`; `null` quando o título é vazio ou não há workflow selecionado; caso
  contrário, o id da task inserida imediatamente antes de `beforeId` no array `items`.
- `bucketByActivityStatus<T>(items: T[], resolveStatus: (item: T) => TaskActivityStatus): {
  active: T[]; paused: T[]; pending: T[] }` — função pura em `states/tasks/utils.ts`, preserva a
  ordem original de `items`.
- `IndexTasksSection` props: `{ status: TaskActivityStatus; label: string; items: TaskItem[];
  groupId: string | null; layout: "grid" | "list"; renderItem: (item: TaskItem) => ReactNode }`.
- `IndexInsertTaskPoint` props: `{ groupId: string | null; beforeId: string; status:
  TaskActivityStatus; className?: string }`.
- `IndexTasksPageState` (shared-state.ts) ganha `insertingBeforeId: string | null` ao lado de
  `editingTaskId: string | null`.

## Fixtures
veredito: sem mecanismo (confirmado do reconhecimento; nenhuma linha nova por causa desta task).
a mudar: nada — nenhum arquivo de fixture/seed existe no projeto; o estado de partida de cada
prova é montado dirigindo a UI, como descrito na linha `estado` do `## Plano de teste` abaixo
(copiada do roteiro aprovado).

## Plano de teste
lane: browser, codigo
ambiente: `npm run dev` (Vite, porta fixa 1420)
estado: nenhum comando automatizado — montar dirigindo a UI, na ordem da seção Fixtures do
reconhecimento: abrir a app com o shim de notificação; criar "Task A" e "Task B" pelo campo fixo
do topo; criar um grupo ">Group X" com subtasks "Sub 1" e "Sub 2" pelo campo fixo do card do
grupo; iniciar o Pomodoro global ("Start" no painel do timer); criar "Task Ativa" e dar Play nela;
criar "Task Pausada", dar Play e depois Stop nela; dar Play em "Sub 1" dentro de "Group X".
url: http://localhost:1420/ — seção Active da raiz com "Task Ativa" contando tempo; seção Paused
com "Task Pausada"; seção Pending com "Task A" e "Task B"; grupo "Group X" expandido mostrando a
seção Active com "Sub 1" contando tempo e a seção Pending com "Sub 2"

### Roteiro — lane browser
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

### Roteiro — lane teste
comando: nenhum (comando de teste: nenhum — lane `teste` indisponível neste projeto)
T01 n/a

### RT-001 — lane codigo
Procurar em: `package.json` (dependencies/devDependencies) e o diff completo da implementação.
Reprova se: qualquer dependência nova aparece para viabilizar hover, timer de 20s ou
seccionamento (ex.: lib de "floating ui", debounce, utilitário de array) — `dnd-kit` (já usado),
Tailwind `group`/`group-hover` e `setTimeout`/`clearTimeout` (já usado em `IndexErrorMessage.tsx`)
bastam.

### RT-002 — lane codigo
Procurar em: `src/pages/index/states/tasks/index.ts` (`insertTask`, `addTask`, `reorderItems`).
Reprova se: a ordem de um item passa a depender de outro campo além da posição no array `items`
(ex.: um campo `position`/`index`/`order` novo em `Task`/`TaskGroup`), ou `reorderItems` ganha
lógica de seção.

### RT-003 — lane codigo
Procurar em: `src/pages/index/states/tasks/index.ts` (`createTask`, `insertTask`, `addTask`,
`executeTask`, `stopTask`).
Reprova se: `insertTask` constrói o objeto `Task` por um caminho diferente do `createTask`
compartilhado (campo a mais, a menos, ou default diferente do que `addTask` produz), ou grava
`isRunning`/`timeEvents` diretamente em vez de encadear `executeTask` (+ `stopTask`).

### RT-021 — lane codigo
Procurar em: `src/pages/index/states/tasks/index.ts` (`insertTask`, `executeTask`, `stopTask`) e
`IndexInsertTaskPoint.tsx` (o encadeamento por `status`).
Reprova se: a herança de estado ativo/pausado grava um campo novo, um valor novo, ou pula
`executeTask`/`stopTask` (ex.: setar `isRunning: true` direto na criação, sem passar pela action
de execução).

### RT-024 — lane codigo
Procurar em: `src/pages/index/states/tasks/utils.ts` (`bucketByActivityStatus`) e
`IndexActiveTasksList/shared-components/IndexTasksSection.tsx`.
Reprova se: existir uma segunda função de bucketing (outro `forEach` resolvendo
active/paused/pending) fora de `bucketByActivityStatus`, ou um segundo bloco JSX de
cabeçalho + grade/lista fora de `IndexTasksSection` (ex.: `IndexGroupTasksList.tsx` voltando a
escrever o próprio cabeçalho em vez de consumir o componente compartilhado).

## Cobertura
RT-001 → seção RT-001 na lane codigo
RT-002 → seção RT-002 na lane codigo
RT-003 → seção RT-003 na lane codigo
RT-004 → S01, S02 na lane browser
RT-005 → S03, S04 na lane browser
RT-006 → S05 na lane browser
RT-007 → S06 na lane browser
RT-008 → S07 na lane browser
RT-009 → S08 na lane browser
RT-010 → S09 na lane browser
RT-011 → S10, S26 na lane browser
RT-012 → S11 na lane browser
RT-013 → S12 na lane browser
RT-014 → S13 na lane browser
RT-015 → S14, S15 na lane browser
RT-016 → S16, S17 na lane browser
RT-017 → S18 na lane browser
RT-018 → S19 na lane browser
RT-019 → S20 na lane browser
RT-020 → S07, S21, S22, S26 na lane browser
RT-021 → seção RT-021 na lane codigo
RT-022 → S23 na lane browser
RT-023 → S24, S25 na lane browser
RT-024 → seção RT-024 na lane codigo
RT-025 → S27, S28 na lane browser
RT-026 → S29 na lane browser

## Desvios da spec
nenhum.

## Riscos
- Se `bucketByActivityStatus` não preservar exatamente a ordem de checagem (active → paused →
  pending) e a preservação da ordem original do array, as posições esperadas em S07/S10/S21/S22/S26
  quebram silenciosamente — nenhum teste automatizado pega isso, só a lane browser.
- O guard de seção do `handleDragEnd` do grupo precisa reproduzir exatamente a comparação da raiz
  (`activeSection !== overSection` bloqueia); qualquer divergência de detalhe reabre o drag entre
  seções que RT-025/S28 proíbe.
- `insertingBeforeId` referenciando um item apagado enquanto o input está aberto (ex.: outra aba/
  fluxo deleta a task-âncora) deixa o átomo apontando para um id que não renderiza mais nenhum
  `IndexInsertTaskPoint` — sem efeito visível, mas vale conferir na revisão que isso não trava o
  átomo em um estado que impeça abrir outra fresta (a escrita é sempre por valor, então não trava).
- O `col-span-full` do `IndexInsertTaskPoint` depende do wrapper pai ser `display: grid`
  (`layout="grid"`); se o prop `layout` for esquecido em algum consumidor futuro da seção, o
  elemento vira um bloco comum sem quebrar nada, mas perde o efeito de ocupar a linha inteira.

## Premissas
- Grade de 2 colunas da raiz: o ponto de inserção é elemento próprio no grid com
  `grid-column: 1 / -1` (`col-span-full`), aceitando o reflow de no máximo a própria altura —
  decisão já travada pelo nível 0, e ela só se aplica na listagem geral (`layout="grid"`); dentro
  do grupo o layout continua coluna única (`layout="list"`), sem grade replicada.
- RT-022: como o app hoje não admite exclusividade de "uma task ativa por vez", a leitura correta
  é "nenhum comportamento de exclusividade novo é introduzido pela inserção" — nenhuma checagem de
  exclusividade é adicionada.
- RT-014 é lido literalmente: qualquer `keydown` ou `click` dentro do campo reinicia os 20s, mesmo
  sem mudar o valor do input (contador de interação separado do valor do título).
- O wrapper de scroll (`max-h-[560px] overflow-y-auto`) do card do grupo continua envolvendo as 3
  seções juntas depois do seccionamento, em vez de um scroll por seção.
- Grupos nunca aninham grupos (`TaskGroup` não tem `groupId` no tipo) — o bucketing dentro de um
  grupo só precisa resolver status via `getTaskActivityStatus`, nunca via
  `getGroupActivityStatus`.
- Fechar o input ao clicar fora é implementado via `onBlur` do próprio campo, não um listener
  global de clique — é a leitura direta de "clicar fora" e seguindo o mesmo espírito do padrão já
  usado no projeto (nenhum outro componente do repo usa listener global de clique).
