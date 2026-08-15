# Lote B — UI (step 01, tasks-nivel-unico)

Você é o IMPLEMENTADOR do Lote B. **Pré-requisito: o Lote A já está feito** (a camada de estado já foi
reescrita e é a API abaixo). Seu trabalho é o ajuste **mecânico e enumerado** da UI para o app renderizar e
`npx tsc --noEmit` ficar limpo. Não abra o plano nem a memória da task — está tudo aqui. Não pergunte nada.

Git: branch `main`, commit-base `8185c5c`. Projeto React + zustand + jotai + Vite (porta 1420) + Tauri.
**Não toque em `src-tauri/` nem nos 5 arquivos do Lote A** (`states/tasks/{index,utils,scoreUtils}.ts`,
`hooks/{useStoredTasks,useListingTasks}.ts`) — a não ser que `tsc` acuse um erro real DENTRO deles.

## API que o Lote A entregou (é o que você consome)

```ts
// src/pages/index/states/tasks/index.ts
export type TaskTimeEvent = { type: "start" | "stop" | "complete"; createdAt: Date };
export interface Task  { type: "task";  id; title; workflowId: string|null; note?: string;
                         groupId: string|null; completed: boolean; isRunning: boolean; timeEvents: TaskTimeEvent[] }
export interface TaskGroup { type: "group"; id; title; workflowId: string|null; note?: string; collapsed: boolean }
export type TaskItem = Task | TaskGroup;
export interface TasksState { items: TaskItem[] }        // store: store.state.items
export function isTask(i: TaskItem): i is Task; export function isTaskGroup(i: TaskItem): i is TaskGroup;
// store.actions:
setItemsState(items)  addTask(title, groupId?)  addGroup(title)  toggleTask(id)  deleteItem(id)
saveEditingItem(id, title)  saveNote(id, note)  reorderItems(activeId, overId)  clearItems()
executeTask(id)  stopTask(id)
```

```ts
// src/pages/index/hooks/useListingTasks.ts  — sem argumentos
const { workflowItems, groups, tasks, rootTasks, activeTasks, completedTasks } = useListingTasks();
// tasks = todas as Tasks do workflow (raiz + de grupo); activeTasks = !completed; completedTasks = completed
```

`SubTask`, `subtasks`, `inExecutionTaskId`, `TaskListingMode`, `getActiveTask`, `getTaskListingMode`,
`setTasksState`, `saveTaskNote`, `clearTasks`, `clearSubtasks`, `reorderTasks`/`reorderSubtasks`,
`deleteTask`/`deleteSubtask`, `executeSubtask`/`stopSubtask`/`toggleSubtask`/`saveEditingSubtask`,
`addSubtask` **não existem mais**.

## Forma alvo desta etapa

Lista **PLANA** de todas as tasks não concluídas do workflow selecionado, na ordem de `items`,
independentemente de `groupId`. Grupos **não são renderizados** neste step (nem rótulo) — o container de
grupo é o step 03. Navegação de 2 níveis (a "página 2" de subtasks) morre inteira.

## Os 15 arquivos que você POSSUI

### Apagar (3)

- `src/pages/index/components/IndexTasks/utils.ts` — seus 4 símbolos morreram; o arquivo fica vazio.
- `src/pages/index/components/IndexTasks/IndexActiveTasksList/IndexTaskItem.tsx` — UI da entrada na página 2.
- `src/pages/index/components/IndexTasks/IndexActiveTasksList/IndexTaskAccordionSubtaskItem.tsx` — accordion de subtasks.

### Editar (12)

1. `components/IndexTasks/shared-state.ts` — `IndexTasksPageState` fica só `{ editingTaskId: string | null }`
   (remover `inExecutionTaskId` e `nonActiveExpandedTaskId` do tipo e do valor inicial). `errorMessageAtom` intacto.
2. `components/IndexTasks/IndexTasks.tsx` — remover o import de `./utils`, `listingMode`, `activeTask`,
   `handleExitSubtasks` e o `useEffect` `:25-40`. Título fixo `"Tasks"` (sem breadcrumb). `useListingTasks()`
   sem argumento; vazio decidido por `activeTasks.length === 0`, com a mensagem
   `tasks.length > 0 ? "All tasks completed!" : "No tasks yet. Add one above!"`.
   `<IndexAddInput />`, `<IndexActiveTasksList />` e `<IndexFooter />` passam a ser usados **sem props**.
   `useStoredTasks()` e o `<Box>`/layout continuam iguais.
3. `components/IndexTasks/IndexAddInput.tsx` — sem props; só `addTask(title, null)`; placeholder
   `"Add a new task..."`; remover `addSubtask`, `listingMode`, `taskId` e o import de `./utils`.
4. `IndexActiveTasksList/IndexActiveTasksList.tsx` — sem props; `const reorderItems = useTasksState(p => p.actions.reorderItems)`
   (sem o ternário de `listMode`); `const { activeTasks } = useListingTasks()`; remover
   `getActiveTask`/`getTaskListingMode`; renderizar `<IndexSortableTaskItem key={task.id} task={task} />`
   sem `listMode`/`isActive`. `DndContext`, `SortableContext`, sensores e `handleDragEnd` ficam como estão (`:37-71`).
5. `IndexActiveTasksList/IndexSortableTaskItem.tsx` — props `{ task: Task; dragHandleProps? }`; remover o
   ternário e o import de `IndexTaskItem`; renderizar sempre
   `<IndexSubTaskItem task={task} isActive dragHandleProps={{ ...attributes, ...listeners }} />`.
   `useSortable` e o `style` ficam iguais.
6. `IndexActiveTasksList/IndexSubTaskItem/IndexSubTaskItem.tsx` — **este é o coração do reuso, leia a seção
   dedicada abaixo antes de editar.**
7. `IndexActiveTasksList/shared-components/IndexEditInput.tsx` — remover a prop `listingMode` e o import de
   `../../utils`; usar sempre `props.actions.saveEditingItem`. O resto do componente não muda.
8. `IndexActiveTasksList/IndexTaskNoteDialog.tsx` — `saveTaskNote` → `saveNote` (`:34` + o uso).
9. `IndexFooter/IndexFooter.tsx` — sem props; `useListingTasks()`; contagem "X of Y completed" sobre
   `completedTasks.length` / `tasks.length`; `handleReset` chama `clearItems()` (sem ternário/`clearSubtasks`);
   remover `canFinishTask`, `handleFinishTask`, o botão "Finish", `toggleTask`, `getTaskListingMode` e o
   bloco `<IndexTaskNote>` `:131-133` (eram todos da navegação de 2 níveis). `ProgressBar` e o accordion de
   concluídas (`IndexCompletedTaskItem`) permanecem.
10. `IndexFooter/IndexCompletedTaskItem.tsx` — prop `task: Task`; apagar `getTotalTimeInSecondsForTask` e
    `getEventsForTask` (`:16-40`) e o cast de `:61`; usar `calculateTotalTimeInSeconds(task.timeEvents)` e
    `task.timeEvents` direto; remover o import de `../utils`. O JSX não muda.
11. `IndexFooter/IndexTaskNote.tsx` — `saveTaskNote` → `saveNote` (`:26` + o uso).
12. `components/IndexScore.tsx` — `store.state.tasks` → `store.state.items` (`:29`) e passar `items` para
    `calculateTotalFocusedTime` / `calculateCurrentStreak` / `calculateTasksCompleted`.

## `IndexSubTaskItem.tsx` — reuso como item de task de nível 1 (decisão fechada, não redesenhe)

O componente **é o molde de item com cronômetro do projeto** e o shape que ele lê (`id`, `title`,
`completed`, `isRunning`, `timeEvents`) é 1:1 com o novo `Task`. Ele é mantido **com o nome e o caminho
atuais** (rename/unificação é do step 02) e passa a ser sempre renderizado com `isActive={true}` — com
`isActive` verdadeiro ele já rende o layout completo (Timer `:173`, play/stop `:219`, concluir `:234`,
editar/apagar `:252-265`, `IndexAlertSelect` `:269`, `IndexDebugTimer` `:282`). **O JSX não muda.**

Mude exatamente isto:

- `:17` `import { useTasksState, type SubTask }` → `type Task`; `:32` `task: SubTask` → `task: Task`.
- `:46-49` as 4 ações: `deleteSubtask`→`deleteItem`, `executeSubtask`→`executeTask`,
  `stopSubtask`→`stopTask`, `toggleSubtask`→`toggleTask`. Ajuste as chamadas (`:71`, `:77`, `:207`, `:234`,
  `:261`) — todas continuam recebendo `task.id`.
- `:156` `<IndexEditInput initialValue={task.title} listingMode="subtasks" />` → sem `listingMode`.
- A prop `isActive` **continua existindo** na interface (removê-la é do step 02); os pais passam `true`.
- **O efeito `:111-122` (sync com o timer global) vira stop-only.** Hoje ele liga E desliga o cronômetro do
  item conforme o timer global, gateado por `isActive`. Com `isActive={true}` em N itens, iniciar o timer
  global auto-iniciaria TODAS as tasks com tempo acumulado — regressão inaceitável. Substitua por:

  ```ts
  useEffect(() => {
    if (!isGlobalTimerRunning && timerState.isRunning) {
      stopTask(task.id);
      timerActions.stop();
    }
  }, [isGlobalTimerRunning]);
  ```

  Retomar passa a ser manual neste step; o sincronismo definitivo de N cronômetros é do **step 02**.
- Não mexa em `handleToggleSubtaskTimer` além do rename das ações (ele mantém o gate
  `isGlobalTimerRunning && !isResting` e o `errorMessageAtom` "Global timer is not running"), nem no efeito
  de alarme `:124-144`, nem no `useCountUpTimer` — **uma instância do hook e um `new Audio` por item** é o
  comportamento atual e tem de continuar assim.

## Entregável extra obrigatório: nota na memória da task

Anexe ao **fim da seção 4** de `.claude/tasks/2026-08-15_tasks-nivel-unico/memoria-da-task.md` (sem alterar
mais nada do arquivo) o bloco abaixo — a tabela de moldes aponta para dois arquivos que você apagou:

```
> Step 01 apagou `IndexTaskItem.tsx` e `IndexTaskAccordionSubtaskItem.tsx` (UI da navegação de 2 níveis).
> Os moldes da tabela que apontam para eles continuam disponíveis em:
> `git show 8185c5c:src/pages/index/components/IndexTasks/IndexActiveTasksList/IndexTaskItem.tsx`
> `git show 8185c5c:src/pages/index/components/IndexTasks/IndexActiveTasksList/IndexTaskAccordionSubtaskItem.tsx`
> `components/IndexTasks/utils.ts` também foi apagado. Ações do store fechadas pelo step 01:
> `setItemsState addTask(title, groupId?) addGroup toggleTask deleteItem saveEditingItem saveNote
> reorderItems clearItems executeTask stopTask` + os type guards `isTask`/`isTaskGroup`.
```

## Armadilhas

- **T8 — React Compiler ligado** (`babel-plugin-react-compiler`): zero mutação de props/estado.
- **T6/T7** — não centralize os cronômetros nem os alarmes; cada item segue com a sua instância.
- Não recrie átomos de layout: use os existentes em `src/layout/components/atoms/*` e
  `src/layout/components/common/Timer`.
- Não há suíte de testes nem script de lint — não rode `npm test` nem `eslint`.

## Critérios de aceitação

1. `npx tsc --noEmit` **limpo, zero erros**.
2. `grep -rn "SubTask\|subtasks\|inExecutionTaskId\|nonActiveExpandedTaskId\|getActiveTask\|TaskListingMode\|state\.tasks" src`
   só retorna o nome do arquivo/componente `IndexSubTaskItem` (mantido de propósito) e a string cosmética
   `"Subtask timer..."` em `IndexDebugTimer.tsx:44`.
3. `npm run dev` (porta 1420) sobe sem erro de runtime e renderiza a lista plana de tasks de nível 1.
4. A nota foi anexada à seção 4 da `memoria-da-task.md`.
5. Nada em `src-tauri/`; os 5 arquivos do Lote A intactos.

Ao terminar, reporte em poucas linhas: arquivos apagados, arquivos editados e a saída de `npx tsc --noEmit`.
