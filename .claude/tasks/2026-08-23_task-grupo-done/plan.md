# Plano — task-grupo-done

Bug: "Tem um bug quando temos tasks em grupo não tem como marcar a task em grupo como done".
Hoje `TaskGroup` não tem campo `completed` e `toggleTask` tem guard `!isTask(item)` (`states/tasks/index.ts:172`) que torna qualquer chamada com id de grupo um **no-op silencioso**. Não existe nenhum botão de concluir no header do grupo (`IndexTaskGroup.tsx:104-131`: só Edit / Delete / Collapse).

Git: branch `main` | commit-base `4628ffc`.

## Premissas assumidas

Decisões do usuário (BINDING, não reabrir):

1. **Gate = B+** — o botão de concluir grupo só é habilitado quando `children.length > 0 && completedCount === children.length`. **Grupo vazio (0 subtasks) NÃO pode ser concluído.**
2. **Sem cascata** — pelo gate acima as subtasks já estão todas concluídas. Concluir ou reabrir o grupo **nunca** altera nenhuma subtask (nem `completed`, nem `timeEvents`, nem `isRunning`).
3. **Pós-conclusão = A** — grupo concluído **sai da lista ativa** e passa a aparecer na seção "completed" do footer como uma linha de grupo (título + "N of N completed") com **botão de reabrir**.

Premissas técnicas aceitas:

- Botão Check do grupo entra no **cluster de hover** ao lado de Edit/Delete em `IndexTaskGroup.tsx`. **Não** replicar o gate `isTimerActive` do molde (`IndexTaskItem.tsx:214-222`) — grupo não tem timer.
- **Ação nova `toggleGroup(id)`** no store, em vez de relaxar o guard de `toggleTask` (que grava `timeEvents`/`completed`, campos que `TaskGroup` não tem). `toggleTask` fica **intocada**.
- Migração legada escreve `completed` nos dois ramos que produzem group em `migrateEntry`.
- A contagem `{completedTasks.length} of {tasks.length} completed` e a `ProgressBar` do footer continuam contando **só tasks-folha**; grupo não entra na contagem nem no percentual.
- `states/reports/sync.ts` fica **fora de escopo** — grupo não vira linha do relatório diário.
- Sem undo além do especificado: `toggleGroup` é toggle (reversível) e a única entrada de reabertura na UI é o botão da linha do footer.

Premissas resolvidas por mim (o reviewer/tester lê como binding):

- **Fonte da verdade de posicionamento é a flag `group.completed`**, não a derivação das children. Se por qualquer razão um grupo `completed: true` tiver children pendentes (localStorage editado à mão, dado legado), ele continua na seção de concluídos e a linha exibe "N of M completed" derivado das children — a inconsistência fica **visível**, não é auto-corrigida. Não implementar auto-reopen.
- **Migração legada com subtasks** (`useStoredTasks.ts:70-93`): NÃO usar `!!entry.completed` nesse ramo (o flag do pai legado pode ser `true` com subtasks pendentes e violaria o gate). Derivar: `completed: subtasks.length > 0 && subtasks.every((sub) => !!sub.completed)`. No ramo `entry?.type === "group"` (linhas 41-51) usar `completed: !!entry.completed` como combinado.
- `collapsed` **não** é alterado por `toggleGroup` — ao reabrir, o grupo volta como estava.
- Não há caminho de UI para adicionar subtask a um grupo já concluído (o input vive no corpo do grupo, que só existe na lista ativa), portanto `addTask` **não** muda.
- `reorderItems` **não** muda: um grupo concluído sai do `SortableContext` mas mantém sua posição no array `items`, então ao reabrir reaparece no mesmo lugar relativo.

## Escopo — 1 escopo único (`grupo-done`)

Footprints **não são disjuntos**: o campo `completed` em `TaskGroup` é obrigatório (não-opcional), então state, persistência e UI quebram/compilam juntos. Paralelizar aqui só criaria um estado intermediário que não type-checa. Prompt: `prompts/grupo-done.md`.

## Mudanças, arquivo por arquivo

### 1. `src/pages/index/states/tasks/index.ts`

- **`TaskGroup`** (25-28): adicionar `completed: boolean;` (obrigatório, ao lado de `collapsed`).
- **`TasksActions`** (~192-204 na interface): declarar `toggleGroup: (id: string) => void;` logo depois de `toggleTask`.
- **`addGroup`** (~157-163, o literal `newGroup`): adicionar `completed: false`.
- **Nova função `toggleGroup(id)`**, colocada imediatamente depois de `toggleTask` (que termina em 194), espelhando a forma dela (`set((store) => ({ state: { items: ... }, actions: store.actions }))`):
  - `map` sobre `items`; guard `if (item.id !== id || !isTaskGroup(item)) return item;`
  - **reabrir sempre permitido**: se `item.completed` for `true`, retorna `{ ...item, completed: false }`.
  - **concluir passa pelo gate**: usar `canCompleteGroup(getGroupChildren(store.state.items, id))` (helpers do item 2). Se o gate reprovar, retornar `item` inalterado (no-op) — a UI já desabilita o botão, isso é a defesa no store.
  - Nunca tocar em nenhum outro item do array.
- **Objeto `actions` retornado** (~365-378): registrar `toggleGroup` depois de `toggleTask`.

### 2. `src/pages/index/states/tasks/utils.ts` (arquivo existente, já exporta `calculateTotalTimeInSeconds` / `getTimeRangeFromEvents`)

Adicionar helpers para o gate/progresso, para que store, `IndexTaskGroup` e `IndexCompletedTaskGroup` compartilhem a **mesma** regra:

- `getGroupChildren(items: TaskItem[], groupId: string): Task[]` — `items.filter(isTask).filter((task) => task.groupId === groupId)`.
- `getGroupProgress(children: Task[]): { completedCount: number; total: number; percentage: number }` — `percentage` arredondado, `0` quando `total === 0` (mesma fórmula de `IndexTaskGroup.tsx:38-42`).
- `canCompleteGroup(children: Task[]): boolean` — `children.length > 0 && children.every((task) => task.completed)`.

Cuidado com import: `utils.ts` hoje importa `type { TaskTimeEvent } from "./index"`; precisará também de `isTask` e dos tipos `Task`/`TaskItem`. `index.ts` passa a importar de `./utils` — a dependência é `index.ts -> utils.ts` para valores e `utils.ts -> index.ts` só para `isTask` + tipos. Se o ciclo de import causar problema em runtime (Vite/ESM), a alternativa aprovada é inlinar o predicado `task.type === "task"` em `utils.ts` e importar apenas os **tipos** de `./index` (`import type { Task, TaskItem }`), eliminando o ciclo de valores. Prefira essa forma sem ciclo de valores desde o início.

### 3. `src/pages/index/hooks/useStoredTasks.ts`

- Ramo `entry?.type === "group"` (41-51): adicionar `completed: !!entry.completed`.
- Ramo legado com `subtasks` (70-93, literal `group`): adicionar `completed: subtasks.length > 0 && subtasks.every((sub) => !!sub.completed)`.
- `LegacyTaskEntry` já tem `completed?: boolean` (linha 25) — **não** precisa mudar o tipo.
- Não tocar em `handleBeforeUnload` nem nos effects de persistência (eles serializam `items` como estão, o novo campo vai junto de graça).

### 4. `src/pages/index/hooks/useListingTasks.ts`

- Adicionar `const activeGroups = groups.filter((group) => !group.completed);`
- Adicionar `const completedGroups = groups.filter((group) => group.completed);`
- **`activeListItems`** (19-23): trocar `isTaskGroup(item) ||` por `(isTaskGroup(item) && !item.completed) ||`.
- Exportar `activeGroups` e `completedGroups` no objeto de retorno.
- **`groups` continua sendo TODOS os grupos** (ativos + concluídos): `IndexFooter.tsx:27-29` e `states/reports/sync.ts:18-20` usam essa lista só para o mapa `id -> title` do badge; filtrar ali apagaria o badge de grupo das subtasks concluídas. Não mexer na semântica de `groups`, `tasks`, `rootTasks`, `activeTasks`, `completedTasks`, `activeRootTasks`.

### 5. `src/pages/index/components/IndexTasks/IndexActiveTasksList/IndexTaskGroup/IndexTaskGroup.tsx`

- Trocar o cálculo inline de `completedCount`/`percentage` (38-42) pelos helpers `getGroupProgress` + `canCompleteGroup` sobre `children` (o `children` derivado de `tasks` do hook permanece).
- Importar `Check` de `lucide-react` e `toggleGroup` do store (`useTasksState((props) => props.actions.toggleGroup)`).
- Adicionar botão **como primeiro filho** do `div` de hover (`className="flex items-center opacity-0 group-hover:opacity-100 transition-all"`, linha ~105), antes do botão Pencil:
  - `onClick={() => toggleGroup(group.id)}`, `disabled={!canComplete}`
  - habilitado: `text-Green-400 hover:text-Green-500 transition-all p-2`, `title="Mark group as complete"`
  - desabilitado: acrescentar `opacity-40 cursor-not-allowed` (use `twMerge`, já usado no projeto) e `title` explicativo — `"Add at least one task first"` quando `children.length === 0`, `"Complete all tasks first"` quando há pendentes.
  - ícone `<Check className="w-5 h-5" />` (mesmo tamanho do molde `IndexTaskItem.tsx:214-222`).
- Este componente **só renderiza grupos ativos** (o filtro de `activeListItems` garante), então não precisa de estado visual "done" aqui.
- Não tocar em `handleToggleCollapsed`, `handleAddChild`, `IndexEditInput`, `IndexGroupTasksList`.

### 6. NOVO `src/pages/index/components/IndexTasks/IndexFooter/IndexCompletedTaskGroup.tsx`

Espelhar o shell de `IndexCompletedTaskItem.tsx` (o card da linha 47 e o círculo verde com Check das linhas 51-53), versão enxuta:

- Props: `{ group: TaskGroup }`.
- Deriva children com `useListingTasks()` + `getGroupChildren`/`getGroupProgress` (mesmo padrão de `IndexTaskGroup`, que já chama o hook internamente).
- Render: card → círculo verde preenchido com `Check` → título do grupo (`text-sm font-medium text-Black-450 dark:text-Black-400 break-all`) → subtexto `{completedCount} of {total} completed` (`text-xs text-Black-400`).
- À direita: botão de reabrir com `RotateCcw` de `lucide-react` (ícone já usado em `IndexFooter.tsx:73`), `title="Reopen group"`, `onClick={() => toggleGroup(group.id)}`, estilo `text-Blue-400 hover:text-Blue-500 transition-colors p-1` (mesmo do chevron de `IndexCompletedTaskItem.tsx:87`).
- **Sem** `ProgressBar`, **sem** lista de eventos, **sem** dialog de nota.

### 7. `src/pages/index/components/IndexTasks/IndexFooter/IndexFooter.tsx`

- Pegar `completedGroups` de `useListingTasks()` (linha 20).
- Criar `const hasCompletedItems = completedTasks.length > 0 || completedGroups.length > 0;` e usá-lo nos **4** pontos que hoje testam `completedTasks.length > 0`: classe de cursor (48-51), `onClick` (52-54), chevron (59-64) e o bloco de lista (80). Sem isso um grupo concluído poderia existir sem forma de abrir a seção.
- **Não** alterar o texto `{completedTasks.length} of {tasks.length} completed` nem `progressPercentage` (contagem leaf-only é premissa binding).
- Dentro do bloco expandido, renderizar `completedGroups.map(...)` com `<IndexCompletedTaskGroup key={group.id} group={group} />` **antes** do `completedTasks.map(...)` existente.
- `groupTitleById` (27-29) e o `groupTitle` passado ao `IndexCompletedTaskItem` ficam como estão.

## Critérios de aceite

1. `npx tsc --noEmit` (ou `npm run build`) passa — atenção aos 3 únicos sítios que constroem `TaskGroup`: `states/tasks/index.ts:159`, `useStoredTasks.ts:44`, `useStoredTasks.ts:73`.
2. Grupo **sem** subtasks: botão Check visível no hover, **desabilitado**, com title "Add at least one task first". Clicar não faz nada.
3. Grupo com subtasks pendentes: botão Check **desabilitado**, title "Complete all tasks first".
4. Grupo com **todas** as subtasks concluídas: botão Check **habilitado**; ao clicar, o grupo **desaparece da lista ativa** e aparece na seção "completed" do footer como linha com título + "N of N completed".
5. As subtasks **não** mudam de estado ao concluir/reabrir o grupo (nenhum `timeEvent` novo, nenhum `completed` alterado) — as subtasks concluídas continuam listadas no footer com seu badge de grupo.
6. Botão de reabrir na linha do footer devolve o grupo à lista ativa, na mesma posição relativa, com `collapsed` preservado.
7. Contagem `X of Y completed` e a `ProgressBar` do footer **não mudam** ao concluir um grupo (só tasks-folha contam).
8. Reload da página (persistência): o grupo concluído continua concluído. Um `localStorage` legado com `type: "group"` sem `completed` hidrata como não-concluído, sem crash.
9. Drag & drop da lista ativa continua funcionando com grupos ativos e tasks-raiz.

## Fora de escopo

- `states/reports/sync.ts` e qualquer coisa de relatório/History — grupo não entra no relatório diário.
- Cascata de conclusão para subtasks (decisão 2 elimina).
- Auto-reopen do grupo por mudança nas children.
- Contar grupos na `ProgressBar`/contador do footer.
- Delete/edit/nota na linha do grupo concluído (só reabrir).
- `toggleTask`, `executeTask`, `stopTask`, `reorderItems`, `clearItems`, `deleteItem` — inalteradas.

## Sinal de teste

Não existe teste automatizado para `states/tasks`, `useListingTasks` ou os componentes `Index*` (recon confirmou: nenhum `*.test.*` / `*.spec.*` sob `src/pages/index`). A prova é **via browser**: `npm run dev` (Vite) e percorrer o fluxo dos critérios 2→8. Modo de teste de sistema recomendado: **browser**.
