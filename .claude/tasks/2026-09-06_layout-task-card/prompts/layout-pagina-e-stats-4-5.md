# Escopo B — card empilhado em largura cheia, seções Ativas/Pausadas/Pendentes abaixo, mais estatísticas

Repo: `/root/so/repos/timertasks/timertask-desktop-tree-1` | branch `main` | commit-base `4ed315b`.
Stack: React + TS + Tailwind **v4** (tokens em `src/layout/styles/global.css` via `@theme`; NÃO existe
`tailwind.config.js`). Não rode `git status`/`git diff`.

Este escopo pode rodar **em paralelo** com o escopo A (`card-task-itens-1-2-3.md`). Não toque em
nenhum arquivo fora da lista OWNED.

## Arquivos que você OWNS (e só esses)

- `src/pages/index/page.tsx`
- `src/pages/index/components/IndexTimer.tsx`
- `src/pages/index/components/IndexScore.tsx`
- `src/pages/index/states/tasks/scoreUtils.ts`
- `src/pages/index/states/tasks/utils.ts`  (somente ADICIONAR funções)
- `src/pages/index/hooks/useListingTasks.ts` (somente ADICIONAR retornos)
- `src/pages/index/components/IndexTasks/IndexTasks.tsx`
- `src/pages/index/components/IndexTasks/IndexActiveTasksList/IndexActiveTasksList.tsx`

## Decisões vinculantes (não reabra)

Resposta literal do usuário (é isto que vale, substitui qualquer leitura anterior de "grid 3 colunas +
sidebar"): *"card ocupa largura de 2 colunas do grid - grupo em cima de tasks e subtasks ativas (deve
ter um limite de tamanho com scroll para tasks ativas com muitas subtasks), grupo de pausadas e grupos
de pendentes em baixo"*. Ou seja: **não há sidebar nem grid lado-a-lado.** A página é uma pilha
vertical de largura cheia, nesta ordem:
1. **Card principal**, largura cheia, empilhado internamente: header no topo (Logo ---- workflow/dark
   mode) → timer, menor (`text-4xl`) → estatísticas, ocupando quase toda a largura do card.
2. Abaixo do card, na página: seção de tasks/subtasks **ATIVAS**, com altura máxima e scroll interno.
3. Abaixo: seção **PAUSADAS**.
4. Abaixo: seções **PENDENTES**.
- "timer tamanho 4" = `text-4xl` (hoje `text-6xl`), círculo de `w-64 h-64` para `w-56 h-56`.
- `max-w-6xl` do container raiz **fica como está**.
- Estado derivado (NÃO existe no modelo, e **é proibido persistir campo novo**):
  Task → `isRunning` = **active**; senão tem evento `start` = **paused**; senão **pending**.
  Grupo → algum filho não-completado active = **active**; senão algum paused = **paused**; senão
  (inclusive grupo vazio) **pending**.

## Contrato

### 4a. Card empilhado + pilha vertical da página — `page.tsx`
- `:66-74`: troque o wrapper
  `flex w-full flex-col items-center justify-center gap-24 md:flex-row md:items-start` por
  `flex w-full flex-col gap-6`.
- Dentro dele, nesta ordem: `<Box className="w-full flex flex-col gap-6 p-6">` (Box de
  `src/layout/components/atoms/Box`) com `<IndexHeader />`, `<IndexTimer />`, `<IndexScore />` — este é
  o card principal, largura cheia. Logo abaixo, **fora** desse Box: `<IndexTasks />` (que já renderiza
  internamente as seções Active/Paused/Pending via `IndexActiveTasksList`, ver 4e).
- `:58` (`<IndexHeader showOnlyLogo={shouldBlockContent} />`, fora do fluxo acima) passa a renderizar
  **só quando `shouldBlockContent`** — o gate de permissão continua com o header full-width e só logo.
  Quando o conteúdo está liberado, o único `IndexHeader` renderizado é o de dentro do card principal.

### 4b. Timer menor — `IndexTimer.tsx`
`:43` `<div className="w-64">` → `w-full`. `:45` `className="w-full h-64 text-6xl"` →
`"mx-auto h-56 w-56 text-4xl"`. `:60` controles `px-8` → `px-4`. Nada de lógica muda.

### 4c. Seção de tasks em largura cheia — `IndexTasks.tsx`
`:20` — remover `max-w-[600px]` e `ml-auto` do `Box`, deixando `w-full p-6 flex flex-col gap-8`, para
ela ocupar a mesma largura cheia do card principal (não mais 2/3 de um grid ao lado de uma sidebar).

### 4d. Derivação Active/Paused/Pending
- `states/tasks/utils.ts` — ADICIONE (não altere nada existente; `getGroupChildren`/`getGroupProgress`
  são consumidos por `IndexTaskGroup.tsx:47-48` e `IndexCompletedTaskGroup.tsx:19-20`):
  `export type TaskActivityStatus = "active" | "paused" | "pending";`
  `export function getTaskActivityStatus(task: Task): TaskActivityStatus`
  `export function getGroupActivityStatus(children: Task[]): TaskActivityStatus` (considere só
  `children` não-completados; lista vazia → `"pending"`).
- `hooks/useListingTasks.ts` — ADICIONE ao retorno `activeSectionItems`, `pausedSectionItems`,
  `pendingSectionItems`: partição de `activeListItems` (`:21-25`) **preservando a ordem plana**, usando
  `getTaskActivityStatus` para `isTask(item)` e `getGroupActivityStatus(getGroupChildren(tasks, item.id))`
  para `isTaskGroup(item)`. **Não remova nem altere a semântica de nenhum retorno existente** —
  `IndexTaskGroup`, `IndexGroupTasksList` e `IndexFooter` consomem esse hook.

### 4e. Três seções + scroll — `IndexActiveTasksList.tsx`
- Um **único** `DndContext` (o que já existe). Dentro dele, renderize as seções na ordem
  **Active → Paused → Pending**, cada uma com seu próprio `SortableContext`
  (`items` = ids **daquela** seção, `strategy={verticalListSortingStrategy}`) e um título discreto
  (`text-[10px] font-bold uppercase tracking-tight text-Black-450 dark:text-Black-400`).
  Seção vazia não renderiza (nem o título).
- Wrapper da seção **Active**: `flex flex-col gap-3 max-h-[520px] overflow-y-auto pr-1`
  (molde: `IndexFooter.tsx:81`). Paused e Pending: `flex flex-col gap-3`, sem limite de altura.
- `handleDragEnd` (`:30-36`): antes de chamar `reorderItems`, **ignore o drop se `active.id` e `over.id`
  não pertencerem à mesma seção** (monte um `Map<id, "active"|"paused"|"pending">` a partir das três
  listas). `reorderItems` continua operando sobre a lista plana por id — **não** o reescreva; ele vive
  em `states/tasks/index.ts:270` e depende da ordem linear que mistura grupos e tasks soltas.
- Cada item continua renderizado por `IndexSortableTaskGroup` / `IndexSortableTaskItem` como hoje
  (`:48-54`) — não mude as props desses componentes.

### 5. Mais estatísticas — `scoreUtils.ts` + `IndexScore.tsx`
`scoreUtils.ts` — ADICIONE (tudo derivado de `items.filter(isTask)` + `timeEvents`, **zero campo novo
persistido**, nada entra no fluxo de migração de `useStoredTasks.ts`):
- `calculateTotalSessions(items: TaskItem[]): number` — total de eventos `type === "start"`.
- `calculateAverageSessionTime(items: TaskItem[]): number` — `calculateTotalFocusedTime / sessions`,
  arredondado; retorna `0` se `sessions === 0`.
- `calculateTasksInProgress(items: TaskItem[]): number` — tasks com `!completed` e pelo menos um evento
  `start`.
`calculateTodayFocusedTime` **já existe** (`:66-72`) e só não era usado na UI — use como está.

`IndexScore.tsx`:
- `:67` — deixe de ser `Box`: troque por `<div className="w-full">` (ele passa a viver DENTRO do card
  principal; Box dentro de Box duplica sombra/borda). O grid de `:68` deixa de ser `grid-cols-2` fixo e
  vira `grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-6` — o card agora tem largura cheia, então as
  estatísticas devem ocupar boa parte dela em vez de ficarem em 2 colunas estreitas.
- 8 tiles, nesta ordem, mesmo shape de objeto de `:35-64` (label/value/icon/color/bg) e mesmo markup de
  `:69-92`: **Today's Focus** (`formatDuration(calculateTodayFocusedTime(items))`), **Focused Time**,
  **Sessions**, **Avg / session** (`formatDuration(...)`), **In Progress**, **Tasks Completed**,
  **Total cycles**, **Current Streak**.
- Ícones novos do `lucide-react` (ex.: `Sun`, `Repeat`, `Hourglass`, `PlayCircle`) e pares `color/bg`
  reaproveitando os tokens já usados no arquivo (`text-Green-400`/`bg-Green-100`,
  `text-Blue-400`/`bg-Blue-100`, `text-Red-400`/`bg-Red-100`, `text-Yellow-400`/`bg-Yellow-100` —
  todos existem em `global.css`).
- Não mude `calculateTasksCompleted` (fora de escopo).

## Fora de escopo
Migração/novo campo persistido; reescrita de `reorderItems`; drag entre seções ou entre grupos; mexer
em `IndexTaskItem.tsx`, `IndexTaskGroup.tsx`, `IndexGroupTasksList.tsx` ou `IndexCompletedTaskItem.tsx`
(são do escopo A); criar suíte de testes.

## Aceite

1. Página empilhada em largura cheia, sem sidebar: card principal no topo (Logo/options no topo, timer
   `text-4xl` abaixo, estatísticas ocupando quase toda a largura do card) e, abaixo dele, a seção de
   tasks também em largura cheia.
2. Tela de bloqueio de permissão continua intacta (header full-width só com o logo).
3. Abaixo do card, seções na ordem Active → Paused → Pending, sem título para seção vazia; a seção
   Active tem altura máxima e rola internamente quando há muitos itens.
4. 8 tiles de estatística com valores coerentes (nada `NaN`/vazio).
5. Drag-and-drop continua funcionando dentro de uma mesma seção; drop entre seções é ignorado sem erro.
6. `npm run build` passa (o script roda `tsc`). Não há suíte de testes no repo.
