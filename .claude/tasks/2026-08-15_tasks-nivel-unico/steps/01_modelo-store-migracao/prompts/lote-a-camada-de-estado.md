# Lote A — camada de estado (step 01, tasks-nivel-unico)

Você é o IMPLEMENTADOR do Lote A. Escopo fechado: **5 arquivos**. Não abra o plano nem a memória da task —
tudo o que você precisa está aqui. Não faça perguntas: toda decisão de produto já está fechada abaixo.

Git: branch `main`, commit-base `8185c5c`, working tree limpo (`image.png` untracked na raiz é ruído).
Projeto: React + zustand + jotai + Vite (porta 1420) + Tauri. **Não toque em `src-tauri/`.**

## Arquivos que você POSSUI (nenhum outro)

1. `src/pages/index/states/tasks/index.ts`
2. `src/pages/index/states/tasks/utils.ts`
3. `src/pages/index/states/tasks/scoreUtils.ts`
4. `src/pages/index/hooks/useStoredTasks.ts`
5. `src/pages/index/hooks/useListingTasks.ts`

Os 15 arquivos de UI que vão quebrar são do Lote B — **não os edite**.

## Objetivo

Achatar o modelo para nível único: `Task` vira a entidade de nível 1 com cronômetro, `TaskGroup` vira
container sem cronômetro, `SubTask`/`Task.subtasks` deixam de existir. Estado passa a ser um array único
`items: TaskItem[]`.

## Tipos (BINDING — steps 02-04 assumem exatamente isto)

```ts
export type TaskTimeEvent = { type: "start" | "stop" | "complete"; createdAt: Date };
interface BaseTaskItem { id: string; title: string; workflowId: string | null; note?: string }
export interface Task extends BaseTaskItem {
  type: "task"; groupId: string | null; completed: boolean; isRunning: boolean; timeEvents: TaskTimeEvent[];
}
export interface TaskGroup extends BaseTaskItem { type: "group"; collapsed: boolean }
export type TaskItem = Task | TaskGroup;
export interface TasksState { items: TaskItem[] }
export function isTask(item: TaskItem): item is Task;           // item.type === "task"
export function isTaskGroup(item: TaskItem): item is TaskGroup;  // item.type === "group"
```

`SubTaskTimeEvent` → `TaskTimeEvent` (mesmo shape). Um único array `items` para todos os workflows —
**não** criar um segundo store/array para grupos.

## Ações do store (lista FINAL — nomes fechados, não invente outros)

| ação | assinatura | semântica |
|------|-----------|-----------|
| `setItemsState` | `(items: TaskItem[]) => void` | substitui o array inteiro |
| `addTask` | `(title: string, groupId?: string \| null) => void` | guards de título vazio e de `selectedWorkflowId`; cria `Task` com `timeEvents: []`, `completed:false`, `isRunning:false`, `groupId ?? null`. Sem `groupId` → push no fim; com `groupId` → inserir logo após o último item daquele grupo (o grupo ou o último filho), preservando `[grupo, ...filhos]` |
| `addGroup` | `(title: string) => void` | mesmos guards; `TaskGroup` com `collapsed:false`; push no fim |
| `toggleTask` | `(id: string) => void` | só sobre `type === "task"`; inverte `completed` e, **ao concluir**, empurra `{type:"complete", createdAt: new Date()}` (semântica do antigo `toggleSubtask` `:254-292`, agora por id direto) |
| `deleteItem` | `(id: string) => void` | remove o item; se for `group`, remove também toda `Task` com `groupId === id` |
| `saveEditingItem` | `(id: string, title: string) => void` | guard de título vazio; renomeia qualquer `TaskItem` |
| `saveNote` | `(id: string, note: string) => void` | grava `note` em qualquer `TaskItem` |
| `reorderItems` | `(activeId: string, overId: string) => void` | ver **T1** abaixo |
| `clearItems` | `() => void` | remove todos os itens do workflow selecionado |
| `executeTask` | `(id: string) => void` | **return cedo** se `useCountdownTimerState.getState().state.isResting`; marca `isRunning:true` e empurra `{type:"start"}` **só na task alvo — NÃO zera `isRunning` das outras** |
| `stopTask` | `(id: string) => void` | `isRunning:false` + evento `{type:"stop"}` na task alvo |

Apagar por completo: `SubTask`, `SubTaskTimeEvent`, `Task.subtasks`, `setTasksState`, `deleteTask`,
`saveEditingTask`, `saveTaskNote`, `reorderTasks`, `clearTasks`, `addSubtask`, `toggleSubtask`,
`deleteSubtask`, `saveEditingSubtask`, `reorderSubtasks`, `executeSubtask`, `stopSubtask`, `clearSubtasks`,
o helper interno `getActiveWorkflowTask` e **o import `getActiveTask` da camada de UI (`index.ts:2`)** — o
store não pode voltar a importar nada de `components/`.

Manter: o formato `{ state, actions }`, o helper `getSelectedWorkflowId()`, `crypto.randomUUID()` para ids,
e o estilo 100% imutável de todas as ações.

## Migração — `useStoredTasks.ts` (CONTRATO BINDING, não reabra)

Chave localStorage: **`timertasks:tasks`**. Formato legado: `Task[]` com `subtasks`. Substitui o
`parsedTasks.map` de `:22-37` (que é o molde: hoje ele só revive as `Date`). Funções puras fora do componente:

```
reviveEvents(events) -> (events ?? []).map(e => ({ type: e.type, createdAt: new Date(e.createdAt) }))

migrateEntry(entry): TaskItem[]
  if (entry?.type === "group")
    return [{ type:"group", id, title, workflowId: entry.workflowId ?? null, note: entry.note,
              collapsed: entry.collapsed ?? false }]
  if (entry?.type === "task")
    return [{ type:"task", id, title, workflowId: entry.workflowId ?? null, note: entry.note,
              groupId: entry.groupId ?? null, completed: !!entry.completed,
              isRunning: !!entry.isRunning, timeEvents: reviveEvents(entry.timeEvents) }]

  const subtasks = entry.subtasks ?? []
  if (subtasks.length > 0)
    return [
      { type:"group", id: entry.id, title: entry.title, workflowId: entry.workflowId ?? null,
        note: entry.note, collapsed: false },                        // `completed` do grupo é DESCARTADO
      ...subtasks.map(sub => ({ type:"task", id: sub.id, title: sub.title,
        completed: !!sub.completed, isRunning: !!sub.isRunning,
        timeEvents: reviveEvents(sub.timeEvents),
        workflowId: entry.workflowId ?? null, groupId: entry.id }))  // workflowId herdado do pai
    ]
  return [{ type:"task", id: entry.id, title: entry.title, completed: !!entry.completed,
            isRunning: !!entry.isRunning, timeEvents: [], workflowId: entry.workflowId ?? null,
            groupId: null, note: entry.note }]                       // sem grupo vazio

migrateStoredItems(parsed) -> Array.isArray(parsed) ? parsed.flatMap(migrateEntry) : []
```

- **Idempotência é obrigatória**: a discriminação é POR ENTRADA (`type` presente = já migrado), então rodar
  de novo sobre dados migrados é um map 1:1, e um array misto é tolerado. Rodar N vezes = rodar 1 vez.
- Ordem `[grupo, ...filhos]` preservando a ordem original — o `flatMap` já garante.
- `JSON.parse` que estoura continua no `catch` com `setItemsState([])` (`:39-42`).
- Tipe a entrada com tipos `Legacy*` locais ao arquivo (`createdAt: string | Date`); **não** faça
  `JSON.parse(...) as TaskItem[]` cego.

`beforeunload` (molde `:50-92`) para N tasks: com um único `stopDate`, para **cada** item `type === "task"`
com `isRunning === true` **e** último evento `"start"`, empurrar `{type:"stop", createdAt: stopDate}`
**mantendo `isRunning: true`**. Esse par é INTENCIONAL: `shouldAutoStart` (`states/tasks/utils.ts:72`) olha
só o último evento, então ao reabrir o app a task aparece como "estava rodando" mas não retoma sozinha.
Itens `group` e tasks paradas passam intactos. Os outros dois efeitos mudam só de nome/tipo; a função
retorna `items`.

## `useListingTasks.ts` — novo contrato

Deixa de receber `inExecutionTaskId` (não recebe mais nada). Retorna:

```ts
{ workflowItems: TaskItem[],  // items do workflow selecionado, na ordem do array global
  groups: TaskGroup[], tasks: Task[], rootTasks: Task[] /* groupId === null */,
  activeTasks: Task[] /* !completed */, completedTasks: Task[] }
```

Filtro por workflow idêntico ao atual (`workflowId === selectedWorkflowId`; `[]` se não houver workflow).
Remova o import de `ListingTask` de `components/IndexTasks/utils` — esse arquivo será apagado no Lote B.

## `scoreUtils.ts`

- Apagar `calculateSubtaskTime` (`:9-38`) e importar `calculateTotalTimeInSeconds` de `./utils` no lugar —
  são a MESMA função duplicada (não crie uma terceira cópia).
- Renomear `calculateSubtaskTimeToday` → `calculateTaskTimeToday` (lógica intacta).
- Os 4 agregadores (`calculateTotalFocusedTime` `:88`, `calculateTodayFocusedTime` `:98`,
  `calculateTasksCompleted` `:108`, `calculateCurrentStreak` `:126`) passam a receber `items: TaskItem[]` e
  iterar `items.filter(isTask)` direto, em vez do `forEach` aninhado em `task.subtasks`. Nada mais da
  lógica de data/streak muda.

## `states/tasks/utils.ts`

Só o rename do tipo (`SubTaskTimeEvent` → `TaskTimeEvent`, `:2,5,37,72`). As 3 funções
(`calculateTotalTimeInSeconds`, `getTimeRangeFromEvents`, `shouldAutoStart`) sobrevivem **intactas**.

## Armadilhas (leia antes de mexer)

- **T1 — array único, N workflows.** `items` guarda os itens de TODOS os workflows; o filtro é sempre
  `workflowId === selectedWorkflowId`. `reorderItems` tem de repetir a dança de índices do `reorderTasks`
  atual (`index.ts:171-219`): coletar o subconjunto do workflow **com** os índices globais, reordenar o
  subconjunto e devolver cada posição para o seu índice global. Sem isso, reordenar quebra outro workflow.
  Mantenha o guard de não reordenar quando o item de origem ou destino tem `isRunning` (só `Task` tem).
- **T2 — `workflowId` pode ser `null`.** `addTask`/`addGroup`/`clearItems` retornam cedo sem workflow selecionado.
- **T8 — React Compiler ligado.** Zero mutação de props/estado; tudo imutável, como já é hoje.
- **T10 — são dados de produção** (o usuário tem ~151 tasks concluídas e ~46h de foco em
  `timertasks:tasks`). A migração não pode duplicar nem perder nada.

## Critérios de aceitação do Lote A

1. `npx tsc --noEmit` acusa erros **somente** nestes 15 arquivos (todos do Lote B):
   `components/IndexTasks/{IndexTasks.tsx,IndexAddInput.tsx,shared-state.ts,utils.ts}`,
   `components/IndexTasks/IndexActiveTasksList/{IndexActiveTasksList.tsx,IndexSortableTaskItem.tsx,IndexTaskItem.tsx,IndexTaskAccordionSubtaskItem.tsx,IndexTaskNoteDialog.tsx}`,
   `.../IndexSubTaskItem/IndexSubTaskItem.tsx`, `.../shared-components/IndexEditInput.tsx`,
   `components/IndexTasks/IndexFooter/{IndexFooter.tsx,IndexCompletedTaskItem.tsx,IndexTaskNote.tsx}`,
   `components/IndexScore.tsx`.
   **Qualquer erro dentro dos seus 5 arquivos é seu e tem de ser corrigido antes de terminar.**
2. `grep -rn "SubTask\|subtasks\|getActiveTask" src/pages/index/states src/pages/index/hooks` não retorna nada.
3. Nada em `src-tauri/`. Não rode `npm test` (não existe suíte) nem lint (não existe script).

Ao terminar, reporte em poucas linhas: o que ficou na API pública do store e a lista de erros de `tsc` que
restou (só os do Lote B).
