# Escopo `grupo-done` — implementação única

Bug: não existe forma de marcar uma task de grupo como done. `TaskGroup` não tem campo `completed`, e `toggleTask` (`src/pages/index/states/tasks/index.ts:169-194`) tem o guard `if (item.id !== id || !isTask(item)) return item;` que torna qualquer chamada com id de grupo um **no-op silencioso**. O header do grupo (`IndexTaskGroup.tsx:104-131`) só tem Edit / Delete / Collapse.

Git: branch `main` | commit-base `4628ffc`.

## Decisões BINDING (não reabrir, não "melhorar")

1. **Gate**: concluir grupo só é permitido quando `children.length > 0 && todas concluídas`. **Grupo vazio NÃO pode ser concluído.**
2. **Sem cascata**: concluir/reabrir o grupo **nunca** altera subtask alguma (nem `completed`, nem `timeEvents`, nem `isRunning`).
3. **Pós-conclusão**: grupo concluído **sai da lista ativa** e aparece na seção "completed" do footer como linha (título + "N of N completed") com botão de **reabrir**.
4. Ação **nova** `toggleGroup(id)`. `toggleTask` fica **intocada**.
5. Contador `{completedTasks.length} of {tasks.length} completed` e a `ProgressBar` do footer continuam contando **só tasks-folha**. Não mexer.
6. Fonte da verdade de posicionamento é a flag `group.completed`, nunca a derivação das children. **Não** implementar auto-reopen.
7. `collapsed` não é alterado por `toggleGroup`.

## Arquivos que você OWNS (6 edits + 1 novo)

1. `src/pages/index/states/tasks/index.ts`
2. `src/pages/index/states/tasks/utils.ts`
3. `src/pages/index/hooks/useStoredTasks.ts`
4. `src/pages/index/hooks/useListingTasks.ts`
5. `src/pages/index/components/IndexTasks/IndexActiveTasksList/IndexTaskGroup/IndexTaskGroup.tsx`
6. `src/pages/index/components/IndexTasks/IndexFooter/IndexFooter.tsx`
7. **NOVO** `src/pages/index/components/IndexTasks/IndexFooter/IndexCompletedTaskGroup.tsx`

## Contrato por arquivo

### 1. `states/tasks/index.ts`
- `TaskGroup` (25-28): adicionar `completed: boolean;` (obrigatório).
- `TasksActions`: declarar `toggleGroup: (id: string) => void;` após `toggleTask`.
- `addGroup` — literal `newGroup` (~157-163): adicionar `completed: false`.
- **`toggleGroup(id)`** logo após `toggleTask` (termina em 194), espelhando a forma dela (`set((store) => ({ state: { items: ... }, actions: store.actions }))`):
  - `map` com guard `if (item.id !== id || !isTaskGroup(item)) return item;`
  - se `item.completed` → retorna `{ ...item, completed: false }` (**reabrir é sempre permitido**);
  - senão → concluir só se `canCompleteGroup(getGroupChildren(store.state.items, id))`; reprovado = retorna `item` inalterado (defesa no store, a UI já desabilita).
  - nenhum outro item do array pode ser tocado.
- Objeto `actions` retornado (~365-378): registrar `toggleGroup` após `toggleTask`.

### 2. `states/tasks/utils.ts` (existente: `calculateTotalTimeInSeconds`, `getTimeRangeFromEvents`)
Adicionar, para store e UI compartilharem a MESMA regra:
- `getGroupChildren(items: TaskItem[], groupId: string): Task[]`
- `getGroupProgress(children: Task[]): { completedCount: number; total: number; percentage: number }` — mesma fórmula de `IndexTaskGroup.tsx:38-42`, `percentage` = 0 quando `total === 0`
- `canCompleteGroup(children: Task[]): boolean` — `children.length > 0 && children.every((t) => t.completed)`

**Evite ciclo de import de valores**: importe de `./index` apenas TIPOS (`import type { Task, TaskItem }`) e inline o predicado `item.type === "task"` em vez de importar `isTask`. `index.ts` passa a importar valores de `./utils`.

### 3. `hooks/useStoredTasks.ts` (só `migrateEntry`)
- Ramo `entry?.type === "group"` (41-51): `completed: !!entry.completed`.
- Ramo legado com `subtasks` — literal `group` (72-79): `completed: subtasks.length > 0 && subtasks.every((sub) => !!sub.completed)`. **Não** use `!!entry.completed` aqui (o flag do pai legado pode ser true com subtasks pendentes e violaria o gate).
- `LegacyTaskEntry` já tem `completed?: boolean` (linha 25) — não mudar o tipo. Não tocar em `handleBeforeUnload` nem nos effects.

### 4. `hooks/useListingTasks.ts`
- `const activeGroups = groups.filter((g) => !g.completed);` e `const completedGroups = groups.filter((g) => g.completed);` — exportar ambos no retorno.
- `activeListItems` (19-23): trocar `isTaskGroup(item) ||` por `(isTaskGroup(item) && !item.completed) ||`.
- **`groups` continua sendo TODOS os grupos** (ativos + concluídos): `IndexFooter.tsx:27-29` e `states/reports/sync.ts:18-20` usam só o mapa `id -> title` do badge; filtrar apagaria o badge das subtasks concluídas. Semântica de `tasks`/`rootTasks`/`activeTasks`/`completedTasks`/`activeRootTasks` inalterada.

### 5. `IndexTaskGroup.tsx` — MOLDE: `IndexTaskItem.tsx:214-222`
```tsx
{isTimerActive && (
  <button onClick={() => toggleTask(task.id)} className="transition-all p-2" title="Mark as complete">
    <Check className="w-5 h-5 text-Green-400" />
  </button>
)}
```
- **NÃO** replique o gate `isTimerActive` (grupo não tem timer).
- Trocar o cálculo inline de `completedCount`/`percentage` (38-42) pelos helpers (`getGroupProgress`, `canCompleteGroup`) sobre o `children` já derivado.
- Importar `Check` de `lucide-react`; `const toggleGroup = useTasksState((props) => props.actions.toggleGroup);`
- Botão como **primeiro filho** do div de hover (`"flex items-center opacity-0 group-hover:opacity-100 transition-all"`, ~linha 105), antes do Pencil:
  - `onClick={() => toggleGroup(group.id)}`, `disabled={!canComplete}`
  - habilitado: `text-Green-400 hover:text-Green-500 transition-all p-2`, `title="Mark group as complete"`
  - desabilitado: + `opacity-40 cursor-not-allowed` (via `twMerge`, já usado no projeto); title `"Add at least one task first"` se `children.length === 0`, senão `"Complete all tasks first"`
  - ícone `<Check className="w-5 h-5" />`
- Este componente só recebe grupos ativos — não crie estado visual "done" aqui. Não tocar em `handleToggleCollapsed`, `handleAddChild`, `IndexEditInput`, `IndexGroupTasksList`.

### 6. NOVO `IndexFooter/IndexCompletedTaskGroup.tsx` — MOLDE: `IndexCompletedTaskItem.tsx` (card da linha 47, círculo verde+Check das linhas 51-53, botão da linha 85-88)
- Props `{ group: TaskGroup }`. Deriva children via `useListingTasks()` + `getGroupChildren`/`getGroupProgress` (mesmo padrão de `IndexTaskGroup`, que já chama o hook internamente).
- Card → círculo verde com `Check` → título (`text-sm font-medium text-Black-450 dark:text-Black-400 break-all`) → subtexto `{completedCount} of {total} completed` (`text-xs text-Black-400`).
- À direita: botão reabrir com `RotateCcw` (`lucide-react`, já usado em `IndexFooter.tsx:73`), `title="Reopen group"`, `onClick={() => toggleGroup(group.id)}`, estilo `text-Blue-400 hover:text-Blue-500 transition-colors p-1`.
- **Sem** `ProgressBar`, sem lista de eventos, sem dialog de nota.

### 7. `IndexFooter.tsx`
- Pegar `completedGroups` de `useListingTasks()` (linha 20).
- `const hasCompletedItems = completedTasks.length > 0 || completedGroups.length > 0;` e usar nos **4** pontos que hoje testam `completedTasks.length > 0`: classe de cursor (48-51), `onClick` (52-54), chevron (59-64), bloco da lista (80). Sem isso um grupo concluído fica sem forma de abrir a seção.
- **Não** alterar o texto `{completedTasks.length} of {tasks.length} completed` nem `progressPercentage`.
- No bloco expandido: `completedGroups.map(...)` com `<IndexCompletedTaskGroup key={group.id} group={group} />` **antes** do `completedTasks.map(...)`.
- `groupTitleById` (27-29) e o `groupTitle` do `IndexCompletedTaskItem` ficam como estão.

## Footprint que você NÃO pode quebrar
- `src/pages/index/states/reports/sync.ts:18-20,52-53` — usa `isTaskGroup` só para o mapa `id -> title`. **Fora de escopo, não editar.**
- `IndexActiveTasksList.tsx:44-55` — `SortableContext` sobre `activeListItems.map(id)` + `isTaskGroup(item) ? IndexSortableTaskGroup : IndexSortableTaskItem`. **Não editar**: o filtro novo em `activeListItems` já remove o grupo concluído.
- `reorderItems` (`states/tasks/index.ts:241-291`) — **não editar**; grupo concluído sai do sortable mas mantém posição em `items`, então reabre no mesmo lugar.
- `toggleTask`, `executeTask`, `stopTask`, `deleteItem`, `clearItems`, `addTask` — **inalteradas**.
- Únicos 3 sítios que constroem `TaskGroup` (o campo é obrigatório, todos precisam do default): `states/tasks/index.ts:159`, `useStoredTasks.ts:44`, `useStoredTasks.ts:73`.

## Critérios de aceite
1. `npx tsc --noEmit` limpo (não existe suíte de teste no projeto; `npm run build` = `tsc && vite build`).
2. Grupo sem subtasks: Check visível no hover, **desabilitado**, title "Add at least one task first"; clique não faz nada.
3. Grupo com pendentes: Check **desabilitado**, title "Complete all tasks first".
4. Grupo 100% concluído: Check habilitado → grupo sai da lista ativa e aparece na seção "completed" do footer com título + "N of N completed".
5. Subtasks **não** mudam de estado ao concluir/reabrir (nenhum `timeEvent` novo); continuam no footer com o badge de grupo.
6. Reabrir devolve o grupo à lista ativa na mesma posição relativa, `collapsed` preservado.
7. Contador e `ProgressBar` do footer **não mudam** ao concluir um grupo.
8. Reload: grupo concluído permanece concluído; `localStorage` legado com `type: "group"` sem `completed` hidrata como não-concluído, sem crash.
9. Drag & drop da lista ativa continua funcionando.

## Fora de escopo
Relatórios/`sync.ts`/History; cascata para subtasks; auto-reopen; contar grupos na ProgressBar; delete/edit/nota na linha do grupo concluído.
