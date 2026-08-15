# Plano — step 01 (modelo, store e migração)

Contrato de execução. `plan-simplified.md` define IN/OUT e o contrato BINDING de migração; este arquivo
fecha o que estava em aberto (nomes de ação, reuso do `IndexSubTaskItem`, algoritmo da migração) e
enumera arquivo por arquivo o que muda.

Git: branch `main`, commit-base `8185c5c`, working tree limpo (`image.png` untracked na raiz é ruído, ignorar).

---

## Premissas assumidas (BINDING — nenhuma pergunta foi feita ao usuário; "sem dúvidas")

1. **P-A — Lista final de nomes de ação** (a memória §2 dizia "o planner do step 01 fecha a lista").
   Fechada em "Contrato do store" abaixo. Adotei os nomes sugeridos pela memória, incluindo o rename
   `saveTaskNote` → `saveNote` (custa 2 linhas em 2 arquivos e mantém os steps 02-04 alinhados com a
   memória). `toggleGroupCollapsed` **não** entra neste step (o campo `collapsed` existe no tipo, mas a UI
   de grupo é do step 03) — quem precisar cria lá.
2. **P-B — Reuso do `IndexSubTaskItem`**: o componente é mantido com o nome e caminho atuais
   (`IndexActiveTasksList/IndexSubTaskItem/IndexSubTaskItem.tsx`); rename/unificação é do step 02.
   Ele passa a receber `task: Task` e é sempre renderizado com `isActive={true}` — pelo achado do recon,
   `isActive=true` já rende o layout completo (timer + play/stop + concluir + editar + apagar + alert
   select + debug timer), então **o JSX não muda**. Muda só: o tipo importado, as 4 ações do store, a prop
   `listingMode` do `IndexEditInput` (que deixa de existir) e o efeito de sincronismo com o timer global
   (ver P-C). A prop `isActive` continua existindo na interface neste step (removê-la é do step 02).
3. **P-C — Sincronismo com o timer global, provisório**: hoje o efeito `IndexSubTaskItem.tsx:111-122`
   liga/desliga o cronômetro do item quando o timer global muda, condicionado a `isActive`. Com
   `isActive={true}` em N itens, **iniciar o timer global auto-iniciaria todas as tasks com tempo
   acumulado** — regressão grave. Neste step o efeito passa a ser **stop-only**: se o timer global parar e
   o cronômetro local estiver rodando, para a task (`stopTask` + `timerActions.stop()`). Retomar volta a
   ser manual. O desenho definitivo do sincronismo de N cronômetros é do **step 02** (está no OUT).
4. **P-D — `IndexTaskItem.tsx` e `IndexTaskAccordionSubtaskItem.tsx` são APAGADOS**. São a UI da navegação
   de 2 níveis (accordion de subtasks + entrada na "página 2"); sem `subtasks`/`addSubtask`/`getActiveTask`
   não há como mantê-los compilando, e reescrevê-los é trabalho dos steps 02/03. A memória §4 aponta
   `IndexTaskItem.tsx:182-217` como molde do container de grupo do step 03 e `IndexTaskAccordionSubtaskItem.tsx:80-101`
   como molde de edição inline do step 02 — por isso o Lote B **tem** de anexar a nota de rastreio à
   `memoria-da-task.md` (ver "Nota obrigatória para a memória", abaixo). O código continua acessível por
   `git show 8185c5c:<caminho>`.
5. **P-E — `components/IndexTasks/utils.ts` é APAGADO**. Os 4 símbolos do arquivo (`ListingTask`,
   `TaskListingMode`, `getActiveTask`, `getTaskListingMode`) morrem por decisão P1; o arquivo fica vazio.
   Isso também resolve a trap **T3** (o store deixa de importar da camada de UI por construção).
6. **P-F — Footprint real é 20 arquivos, não 16.** Além do `IndexSubTaskItem.tsx` que o recon achou, também
   entram `IndexScore.tsx` (lê `store.state.tasks` → `state.items` e passa `items` para os agregadores),
   `IndexTaskNoteDialog.tsx` e `IndexFooter/IndexTaskNote.tsx` (usam `saveTaskNote` → `saveNote`).
7. **P-G — T5 é resolvida**: `scoreUtils.calculateSubtaskTime` é logicamente idêntica a
   `states/tasks/utils.ts:calculateTotalTimeInSeconds` (comparadas linha a linha). A cópia em `scoreUtils`
   é apagada e o arquivo passa a importar de `./utils`.
8. **P-H — Ordem visual do step 01**: lista **plana** de todas as tasks não concluídas do workflow
   selecionado, na ordem de `items`, independentemente de `groupId`. Os grupos **não são renderizados**
   neste step (nem rótulo). É o comportamento esperado descrito no OUT do `plan-simplified.md`.
9. **P-I — Rodapé**: o botão "Finish" e o `IndexTaskNote` do rodapé existiam só para a navegação de 2
   níveis (concluir o grupo e sair da página 2). Ambos saem neste step; o desenho final do rodapé é do step 04.
10. **P-J — `crypto.randomUUID()`** continua sendo o gerador de id (padrão atual do store).

---

## Contrato do store — `src/pages/index/states/tasks/index.ts` (FECHADO, é a API que os steps 02-04 consomem)

Tipos (exatamente a seção 2 da memória, mais dois type guards):

```ts
export type TaskTimeEvent = { type: "start" | "stop" | "complete"; createdAt: Date };
interface BaseTaskItem { id: string; title: string; workflowId: string | null; note?: string }
export interface Task extends BaseTaskItem {
  type: "task"; groupId: string | null; completed: boolean; isRunning: boolean; timeEvents: TaskTimeEvent[];
}
export interface TaskGroup extends BaseTaskItem { type: "group"; collapsed: boolean }
export type TaskItem = Task | TaskGroup;
export interface TasksState { items: TaskItem[] }
export function isTask(item: TaskItem): item is Task;        // item.type === "task"
export function isTaskGroup(item: TaskItem): item is TaskGroup; // item.type === "group"
```

Ações (`store.actions`), lista final:

| ação | assinatura | semântica |
|------|-----------|-----------|
| `setItemsState` | `(items: TaskItem[]) => void` | substitui o array inteiro (usado só pela hidratação) |
| `addTask` | `(title: string, groupId?: string \| null) => void` | guarda título vazio + `selectedWorkflowId` (T2). Cria `Task` com `timeEvents: []`, `groupId ?? null`. Sem `groupId` → push no fim; com `groupId` → inserir logo depois do último item do grupo (o próprio grupo ou o último filho dele), preservando a regra `[grupo, ...filhos]` |
| `addGroup` | `(title: string) => void` | mesmos guards; cria `TaskGroup` com `collapsed: false`; push no fim. Neste step só a migração conceitualmente produz grupos; a ação existe para o step 03 |
| `toggleTask` | `(id: string) => void` | só sobre `type === "task"`; inverte `completed` e, **ao concluir**, empurra um evento `{type:"complete"}` (é a semântica do antigo `toggleSubtask` `:254-292`, agora por id direto, sem `getActiveWorkflowTask`) |
| `deleteItem` | `(id: string) => void` | remove o item; se for `group`, remove também toda `Task` com `groupId === id` |
| `saveEditingItem` | `(id: string, title: string) => void` | guard de título vazio; renomeia qualquer `TaskItem` |
| `saveNote` | `(id: string, note: string) => void` | grava `note` em qualquer `TaskItem` (rename do `saveTaskNote`) |
| `reorderItems` | `(activeId: string, overId: string) => void` | **T1**: mesma dança de índices do `reorderTasks` `:171-219`, agora sobre `items` filtrado por `workflowId`; mantém o guard de não reordenar item com `isRunning` (só `Task` tem `isRunning`) |
| `clearItems` | `() => void` | remove todos os itens do workflow selecionado (equivalente ao `clearTasks` `:492-506`) |
| `executeTask` | `(id: string) => void` | **return cedo** se `useCountdownTimerState.getState().state.isResting` (P4/guard de `:409-411`); marca `isRunning: true` e empurra `{type:"start"}` **só na task alvo — NÃO zera `isRunning` das outras** (decisão 1) |
| `stopTask` | `(id: string) => void` | marca `isRunning: false` e empurra `{type:"stop"}` na task alvo |

Removidos por completo: `SubTask`, `SubTaskTimeEvent`, `Task.subtasks`, `setTasksState`, `deleteTask`,
`saveEditingTask`, `saveTaskNote`, `reorderTasks`, `clearTasks`, `addSubtask`, `toggleSubtask`,
`deleteSubtask`, `saveEditingSubtask`, `reorderSubtasks`, `executeSubtask`, `stopSubtask`, `clearSubtasks`,
o helper interno `getActiveWorkflowTask` e o import de `getActiveTask` da UI (`:2`, **T3**).

Manter: o padrão imutável de todas as ações (**T8**, React Compiler ligado), o helper
`getSelectedWorkflowId()` e o formato `{ state, actions }` do store.

---

## Algoritmo da migração — `src/pages/index/hooks/useStoredTasks.ts` (implementa o contrato BINDING)

Chave `timertasks:tasks`. Substitui o `parsedTasks.map` de `:22-37` (molde). Fora do componente, funções puras:

```
reviveEvents(events) -> (events ?? []).map(e => ({ type: e.type, createdAt: new Date(e.createdAt) }))

migrateEntry(entry): TaskItem[]
  // 1. já migrado — discriminado por `type` (idempotência, T10)
  if (entry?.type === "group")
    return [{ type:"group", id, title, workflowId: entry.workflowId ?? null, note: entry.note,
              collapsed: entry.collapsed ?? false }]
  if (entry?.type === "task")
    return [{ type:"task", id, title, workflowId: entry.workflowId ?? null, note: entry.note,
              groupId: entry.groupId ?? null, completed: !!entry.completed,
              isRunning: !!entry.isRunning, timeEvents: reviveEvents(entry.timeEvents) }]

  // 2. legado (`Task[]` com `subtasks`, sem `type`)
  const subtasks = entry.subtasks ?? []
  if (subtasks.length > 0)
    return [
      { type:"group", id: entry.id, title: entry.title, workflowId: entry.workflowId ?? null,
        note: entry.note, collapsed: false },                       // `completed` do grupo é DESCARTADO
      ...subtasks.map(sub => ({ type:"task", id: sub.id, title: sub.title,
        completed: !!sub.completed, isRunning: !!sub.isRunning,
        timeEvents: reviveEvents(sub.timeEvents),
        workflowId: entry.workflowId ?? null, groupId: entry.id })) // workflowId herdado do pai
    ]
  return [{ type:"task", id: entry.id, title: entry.title, completed: !!entry.completed,
            isRunning: !!entry.isRunning, timeEvents: [], workflowId: entry.workflowId ?? null,
            groupId: null, note: entry.note }]                      // sem grupo vazio

migrateStoredItems(parsed) -> Array.isArray(parsed) ? parsed.flatMap(migrateEntry) : []
```

- Ordem: `flatMap` já produz `[grupo, ...filhos]` preservando a ordem original do array legado.
- Idempotência: entradas já migradas carregam `type`, então a 2ª execução é um map 1:1 (o `new Date` é
  aplicado sobre a string do JSON; sobre um `Date` também é seguro). Rodar N vezes = rodar 1 vez.
- Array misto (parte legado, parte migrado) é tolerado, porque a discriminação é **por entrada**.
- `JSON.parse` que estoura continua no `catch` com `setItemsState([])` (`:39-42`), inalterado.
- Tipar a entrada com tipos `Legacy*` locais ao arquivo (`createdAt: string | Date`) e uma travessia
  defensiva — **não** fazer `as TaskItem[]` cego no `JSON.parse`.

`beforeunload` (**T4**, molde `:50-92`): sobre `itemsRef.current`, para **cada** item `type === "task"` com
`isRunning === true` **e** último evento `"start"`, empurrar `{type:"stop", createdAt: stopDate}` mantendo
`isRunning: true` (o par intencional que faz `shouldAutoStart` não retomar sozinho). Itens `group` e tasks
paradas passam intactos. Um único `stopDate` para todas. Os outros dois efeitos (`itemsRef` e o `setItem`
por mudança de `items`) mudam só de nome/tipo.

---

## `useListingTasks` — novo contrato (`src/pages/index/hooks/useListingTasks.ts`)

Sem parâmetros (o `inExecutionTaskId` morre, P1). Retorna:

```ts
{ workflowItems: TaskItem[],   // items do workflow selecionado, na ordem do array global
  groups: TaskGroup[],
  tasks: Task[],               // todas as tasks do workflow (raiz + de grupo)
  rootTasks: Task[],           // tasks com groupId === null
  activeTasks: Task[],         // tasks com !completed  -> é o que a lista plana renderiza
  completedTasks: Task[] }
```

Filtro por workflow idêntico ao atual (`workflowId === selectedWorkflowId`, `[]` se não houver workflow).

---

## Enumeração por arquivo

### Lote A — camada de estado (5 arquivos) — congela a API

1. `src/pages/index/states/tasks/index.ts` — reescrever tipos + store conforme "Contrato do store".
2. `src/pages/index/states/tasks/utils.ts` — só `SubTaskTimeEvent` → `TaskTimeEvent` (`:2,5,37,72`).
   As 3 funções sobrevivem intactas.
3. `src/pages/index/states/tasks/scoreUtils.ts` — apagar `calculateSubtaskTime` (`:9-38`) e importar
   `calculateTotalTimeInSeconds` de `./utils` (**T5/P-G**); renomear `calculateSubtaskTimeToday` →
   `calculateTaskTimeToday`; os 4 agregadores (`:88`, `:98`, `:108`, `:126`) passam a receber
   `items: TaskItem[]` e iterar `items.filter(isTask)` direto, sem o `forEach` aninhado.
4. `src/pages/index/hooks/useStoredTasks.ts` — migração + `beforeunload` conforme acima; `Task[]` → `TaskItem[]`,
   `setTasksState` → `setItemsState`, `state.tasks` → `state.items`; a função retorna `items`.
5. `src/pages/index/hooks/useListingTasks.ts` — reescrever conforme o contrato acima.

Ao fim do Lote A, `npx tsc --noEmit` deve acusar erros **somente** nos 15 arquivos do Lote B. Qualquer erro
dentro desses 5 arquivos é do Lote A e tem de ser corrigido antes de seguir.

### Lote B — UI (15 arquivos: 12 editados, 3 apagados)

6. `components/IndexTasks/shared-state.ts` — `IndexTasksPageState` fica só `{ editingTaskId: string | null }`;
   remover `inExecutionTaskId` e `nonActiveExpandedTaskId` (do tipo e do valor inicial). `errorMessageAtom` intacto.
7. `components/IndexTasks/utils.ts` — **APAGAR** (P-E).
8. `components/IndexTasks/IndexTasks.tsx` — remover os imports de `./utils`, `listingMode`, `activeTask`,
   `handleExitSubtasks` e o `useEffect` `:25-40`. Título fixo `"Tasks"` (sem breadcrumb). `useListingTasks()`
   sem argumento; usar `activeTasks` para decidir o vazio e `tasks` para a mensagem
   (`tasks.length > 0 ? "All tasks completed!" : "No tasks yet. Add one above!"`).
   `<IndexAddInput />`, `<IndexActiveTasksList />` e `<IndexFooter />` passam a ser usados **sem props**.
9. `components/IndexTasks/IndexAddInput.tsx` — sem props; só `addTask(title, null)`; placeholder
   `"Add a new task..."`; remover `addSubtask`, `listingMode`, `taskId` e o import de `./utils`.
10. `IndexActiveTasksList/IndexActiveTasksList.tsx` — sem props; `reorderItems` fixo (sem o ternário de
    `listMode`); `const { activeTasks } = useListingTasks()`; remover `getActiveTask`/`getTaskListingMode`;
    `<IndexSortableTaskItem key task={task} />` sem `listMode`/`isActive`. `DndContext`/`SortableContext`
    e os sensores permanecem exatamente como estão (`:37-71`).
11. `IndexActiveTasksList/IndexSortableTaskItem.tsx` — props `{ task: Task; dragHandleProps? }`; remover o
    ternário e o import de `IndexTaskItem`; renderizar sempre
    `<IndexSubTaskItem task={task} isActive dragHandleProps={{...attributes, ...listeners}} />`.
    `useSortable` e o `style` ficam iguais.
12. `IndexActiveTasksList/IndexSubTaskItem/IndexSubTaskItem.tsx` — `type SubTask` → `type Task` (`:17,32`);
    `deleteSubtask`→`deleteItem`, `executeSubtask`→`executeTask`, `stopSubtask`→`stopTask`,
    `toggleSubtask`→`toggleTask` (`:46-49`, chamadas em `:71,77,207,234,261`); `<IndexEditInput
    initialValue={task.title} />` sem `listingMode` (`:156`); efeito `:111-122` vira o stop-only de **P-C**.
    **Nada mais do JSX muda.** Manter uma instância de `useCountUpTimer` por item (**T7**) e o
    `new Audio` por item (**T6**).
13. `IndexActiveTasksList/shared-components/IndexEditInput.tsx` — remover a prop `listingMode` e o import de
    `../../utils`; usar sempre `props.actions.saveEditingItem`.
14. `IndexActiveTasksList/IndexTaskItem.tsx` — **APAGAR** (P-D).
15. `IndexActiveTasksList/IndexTaskAccordionSubtaskItem.tsx` — **APAGAR** (P-D).
16. `IndexActiveTasksList/IndexTaskNoteDialog.tsx` — `saveTaskNote` → `saveNote` (`:34` + o uso).
17. `IndexFooter/IndexFooter.tsx` — sem props; `useListingTasks()`; contagem sobre `tasks`/`completedTasks`;
    `handleReset` chama `clearItems` (sem o ternário/`clearSubtasks`); remover `canFinishTask`,
    `handleFinishTask`, o botão "Finish", o `getTaskListingMode` e o bloco `<IndexTaskNote>` `:131-133` (P-I).
    A barra de progresso e o accordion de concluídas permanecem.
18. `IndexFooter/IndexCompletedTaskItem.tsx` — prop `task: Task`; apagar `getTotalTimeInSecondsForTask` e
    `getEventsForTask` (`:16-40`) e o cast `:61`; usar `calculateTotalTimeInSeconds(task.timeEvents)` e
    `task.timeEvents` direto; remover o import de `../utils`.
19. `IndexFooter/IndexTaskNote.tsx` — `saveTaskNote` → `saveNote` (`:26` + o uso).
20. `components/IndexScore.tsx` — `store.state.tasks` → `store.state.items` (`:29`) e passar `items` para
    `calculateTotalFocusedTime`/`calculateCurrentStreak`/`calculateTasksCompleted`.

### Nota obrigatória para a memória (entregável do Lote B)

Anexar ao fim da seção 4 de `.claude/tasks/2026-08-15_tasks-nivel-unico/memoria-da-task.md`, sem alterar
mais nada do arquivo:

```
> Step 01 apagou `IndexTaskItem.tsx` e `IndexTaskAccordionSubtaskItem.tsx` (UI da navegação de 2 níveis).
> Os moldes da tabela que apontam para eles continuam disponíveis em:
> `git show 8185c5c:src/pages/index/components/IndexTasks/IndexActiveTasksList/IndexTaskItem.tsx`
> `git show 8185c5c:src/pages/index/components/IndexTasks/IndexActiveTasksList/IndexTaskAccordionSubtaskItem.tsx`
> `components/IndexTasks/utils.ts` também foi apagado. Ações do store fechadas pelo step 01:
> `setItemsState addTask(title, groupId?) addGroup toggleTask deleteItem saveEditingItem saveNote
> reorderItems clearItems executeTask stopTask` + os type guards `isTask`/`isTaskGroup`.
```

---

## Critérios de aceitação

1. `npx tsc --noEmit` **limpo** (zero erros) ao fim do Lote B.
2. `grep -rn "SubTask\|subtasks\|inExecutionTaskId\|nonActiveExpandedTaskId\|getActiveTask\|TaskListingMode\|state\.tasks" src`
   não retorna nada além do nome do arquivo/componente `IndexSubTaskItem` (mantido de propósito, P-B) e da
   string cosmética `"Subtask timer..."` em `IndexDebugTimer.tsx:44`.
3. `npm run dev` (porta **1420**) sobe e a página renderiza a lista plana de tasks de nível 1.
4. Com um `timertasks:tasks` no formato **legado** plantado (1 grupo com subtasks + 1 grupo sem subtasks):
   as subtasks viram tasks de nível 1, a task sem subtasks vira task de raiz, nenhum grupo vazio é criado,
   os `timeEvents` sobrevivem (cards FOCUSED TIME / TASKS COMPLETED do `IndexScore` mantêm a ordem de
   grandeza), e **um segundo reload não duplica nem perde nada** (T10).
5. Dá para iniciar **duas** tasks ao mesmo tempo com o timer global rodando (decisão 1), e nenhuma das duas
   zera a outra.
6. Nenhum arquivo em `src-tauri/` tocado. `eslint`/testes não são gate (T9/T11).

## OUT (não fazer aqui)

Tudo o que o `plan-simplified.md` lista como OUT: parsing do `>`, UI/rótulo/progresso de grupo (step 03),
unificação dos componentes de item, fim do `isActive`, desenho definitivo do sincronismo de N cronômetros e
título "Tasks" (step 02), redesenho do rodapé/accordion de concluídas/`IndexScore` visual (step 04),
qualquer coisa em `src-tauri/`. Também está fora: `toggleGroupCollapsed`, migração de outras chaves de
localStorage e qualquer refactor de `Timer`/`useCountUpTimer`.

## Escopos de implementação

Dois escopos **SEQUENCIAIS**, mesmo implementador (o recon é claro: todos os 20 arquivos dependem da API de
`states/tasks/index.ts`, não há footprint disjunto para paralelizar). A partição existe para permitir
handoff limpo se a janela do implementador estourar no meio.

- `prompts/lote-a-camada-de-estado.md` — os 5 arquivos de estado/hooks.
- `prompts/lote-b-ui.md` — os 15 arquivos de UI + a nota na memória. Só começa com o Lote A fechado.

## Modo de teste de sistema

**browser** (`npm run dev`, porta 1420) — não existe suíte nem Dockerfile (T9), e o critério decisivo
(migração idempotente sobre `timertasks:tasks` + dois cronômetros em paralelo) só é observável no app.

## Medição de janela

Nenhum nonce foi fornecido a este planner no prompt de entrada, então `medir-janela.sh` não foi executado.
