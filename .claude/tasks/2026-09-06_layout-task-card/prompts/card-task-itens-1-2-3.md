# Escopo A — card de task: respiro, remover Paused, start/end/duration + nome do grupo

Repo: `/root/so/repos/timertasks/timertask-desktop-tree-1` | branch `main` | commit-base `4ed315b`.
Stack: React + TS + Tailwind **v4** (tokens em `src/layout/styles/global.css` via `@theme`; NÃO existe
`tailwind.config.js`). Não rode `git status`/`git diff`.

Este escopo pode rodar **em paralelo** com o escopo B (`layout-pagina-e-stats-4-5.md`). Não toque em
nenhum arquivo fora da lista OWNED.

## Arquivos que você OWNS (e só esses)

- `src/pages/index/components/IndexTasks/IndexActiveTasksList/IndexTaskItem/IndexTaskItem.tsx`
- `src/pages/index/components/IndexTasks/IndexActiveTasksList/IndexTaskGroup/IndexTaskGroup.tsx`
- `src/pages/index/components/IndexTasks/IndexActiveTasksList/IndexTaskGroup/IndexGroupTasksList.tsx`
- `src/pages/index/components/IndexTasks/IndexFooter/IndexCompletedTaskItem.tsx`
- `src/code/utils/date.ts`

## Contrato

### 1. Respiro na contagem do grupo
`IndexTaskGroup.tsx:156-163` — o bloco `<div className="px-4 pb-3">` com `{completedCount} of {total}
completed` + `<ProgressBar/>` está colado na box branca do título. Troque a className do wrapper para
`px-4 pt-3 pb-3 flex flex-col gap-2`. Nada mais nesse arquivo.

### 2. Remover o badge Running/Paused — em TODOS os casos
`IndexTaskItem.tsx:228-244` — remova o bloco inteiro `{!isEditing && hasBeenStarted && ( … Running /
Paused … )}`. Decisão do usuário: o componente "paused" não faz sentido hoje, sai para task solta e
para filha de grupo (é o mesmo componente, sem flag por tipo).

**ARMADILHA:** NÃO remova a const `hasBeenStarted` (`IndexTaskItem.tsx:65`) — ela ainda governa o timer
circular (`:177-187`) e o `IndexDebugTimer` (`:275-283`).

### 3. Start/End/Duration na parte de baixo + nome do grupo ao lado do título
**Molde direto: `IndexCompletedTaskItem.tsx:46-97`.** Espelhe as classes de lá, não invente estilo novo.

- **Helpers**: mova `formatClockTime` e `formatClockValue` de `IndexCompletedTaskItem.tsx:16-30` para
  `src/code/utils/date.ts` (que já exporta `formatTime`), exporte-os, e importe nos dois componentes.
  `IndexCompletedTaskItem` deve continuar renderizando exatamente igual.
- **Badge do grupo** em `IndexTaskItem.tsx`: derive o título do grupo DENTRO do próprio componente —
  `const { groups } = useListingTasks()` (import de `../../../../hooks/useListingTasks`, o mesmo que
  `IndexTaskGroup.tsx:15` usa, ajustando o número de `../`) e
  `task.groupId ? groups.find((g) => g.id === task.groupId)?.title : undefined`. **Não crie prop nova** e
  não altere `IndexSortableTaskItem.tsx`. Renderize o badge ao lado do `span` do título
  (`IndexTaskItem.tsx:190-200`), só quando houver título de grupo, com as classes de
  `IndexCompletedTaskItem.tsx:60-62`.
- **Rodapé Start / End / Duration** em `IndexTaskItem.tsx`: renderize no espaço deixado pelo bloco
  removido no passo 2 (entre a box branca do header, que fecha em `:226`, e a linha de opções que abre
  em `:246`), condicionado a `!isEditing && hasBeenStarted`, alinhado à esquerda, espelhando
  `IndexCompletedTaskItem.tsx:64-78`:
  `getTimeRangeFromEvents(task.timeEvents)` (adicionar ao import já existente de
  `../../../../states/tasks/utils`, que hoje traz `calculateTotalTimeInSeconds` e `shouldAutoStart`),
  `calculateTotalTimeInSeconds(task.timeEvents)` e `formatTime` (já importado em `:12`).
  Vale tanto para task de grupo quanto para standalone (autorizado pelo usuário).

### 4. Scroll interno na lista de subtasks do grupo
`IndexGroupTasksList.tsx:55-62` — envolva o `.map` dos filhos, dentro do `SortableContext`, em
`<div className="flex flex-col gap-3 max-h-[420px] overflow-y-auto pr-1">`. Molde do padrão:
`IndexFooter.tsx:81` (`max-h-… overflow-y-auto`). Não mexa no `DndContext` nem no `handleDragEnd`.

## Footprint que você NÃO pode quebrar

- `IndexTaskItem` é usado por `IndexSortableTaskItem.tsx:29`, que serve **tanto** a task solta
  (`IndexActiveTasksList.tsx:52`) quanto a filha de grupo (`IndexGroupTasksList.tsx:60`) — a mesma
  mudança precisa ficar correta nos dois.
- `IndexCompletedTaskItem` é consumido por `IndexFooter.tsx:86-93` com a prop `groupTitle` — mantenha a
  assinatura.
- Não mude assinatura de nada em `states/tasks/utils.ts` (é do escopo B) — apenas importe.

## Aceite

1. Nenhuma pill "Running"/"Paused" na lista ativa (grupo e standalone).
2. Card de task já iniciada mostra Start / End / Duration embaixo; filha de grupo mostra também o badge
   com o nome do grupo ao lado do título; standalone não mostra badge.
3. Espaçamento visível entre a box branca do título do grupo e "X of Y completed".
4. Lista de subtasks de um grupo com muitos filhos rola internamente.
5. `npm run build` passa (o script roda `tsc`). Não há suíte de testes no repo.
