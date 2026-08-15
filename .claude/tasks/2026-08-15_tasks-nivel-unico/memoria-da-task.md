# memoria-da-task.md — tasks-nivel-unico

Memória entre steps. Cada step é executado por agentes NOVOS que só têm este arquivo + o
`plan-simplified.md` do step. Tudo aqui é resultado de leitura real do código no commit `d4204d3`.

---

## 1. Como o app é hoje (estado inicial, ANTES do step 01)

Modelo em `src/pages/index/states/tasks/index.ts`:

- `SubTaskTimeEvent` (`:6`) = `{ type: "start" | "stop" | "complete"; createdAt: Date }`
- `SubTask` (`:11`) = `{ id, title, completed, isRunning, timeEvents }` — **é quem tem cronômetro**
- `Task` (`:19`) = `{ id, title, completed, isRunning, subtasks: SubTask[], workflowId, note? }`
  — é o "task group" do print; **não tem `timeEvents`**, não tem cronômetro
- `TasksState` (`:29`) = `{ tasks: Task[] }` — array ÚNICO com todas as tasks de todos os workflows;
  o filtro por workflow é feito na leitura (`task.workflowId === selectedWorkflowId`)

Navegação em dois níveis (a "página 2" que o usuário quer eliminar):

- `indexTasksPageStateAtom` (jotai) em `src/pages/index/components/IndexTasks/shared-state.ts:9` =
  `{ editingTaskId, inExecutionTaskId, nonActiveExpandedTaskId }`
- `inExecutionTaskId !== null` ⇒ modo `"subtasks"` (página 2); `null` ⇒ modo `"tasks-group"` (página 1).
  Decidido por `getTaskListingMode` em `src/pages/index/components/IndexTasks/utils.ts:16`.
- `getActiveTask` (`utils.ts:10`) = **primeira task não concluída da lista**. É essa a definição atual de
  "task ativa": não é escolha do usuário, é posição na lista. É ela que ganha borda verde, o chevron `>`
  para entrar na página 2, e é o único item com cronômetro. **É exatamente isso que a decisão 1 mata.**
- `nonActiveExpandedTaskId` = o accordion do print (grupo "teste 2" aberto mostrando t1/t2/t3), que é
  read/write de subtasks sem cronômetro.

Regra de execução (o guard que deve sobreviver):

- `executeSubtask` (`states/tasks/index.ts:408`) retorna cedo se `useCountdownTimerState.getState().state.isResting`.
- Ao iniciar uma subtask, ele **zera `isRunning` de todas as outras** (`:438`) — é a trava de "uma só por
  vez" que a decisão 1 remove.
- Na UI, `handleToggleSubtaskTimer` (`IndexSubTaskItem.tsx:68`) só deixa iniciar se o timer global estiver
  rodando (`isGlobalTimerRunning && !isResting`), senão dispara `errorMessageAtom` = "Global timer is not running".

Persistência: `src/pages/index/hooks/useStoredTasks.ts`, chave localStorage **`timertasks:tasks`**,
guardando `Task[]` inteiro (todos os workflows).

---

## 2. Modelo ALVO (definido pelo meta-planner; steps 02-04 assumem exatamente isto)

Em `src/pages/index/states/tasks/index.ts`:

```ts
export type TaskTimeEvent = { type: "start" | "stop" | "complete"; createdAt: Date };

interface BaseTaskItem { id: string; title: string; workflowId: string | null; note?: string }

export interface Task extends BaseTaskItem {
  type: "task";
  groupId: string | null;      // null = task solta na raiz do nível 1
  completed: boolean;
  isRunning: boolean;
  timeEvents: TaskTimeEvent[]; // <- o que hoje é da SubTask
}

export interface TaskGroup extends BaseTaskItem {
  type: "group";
  collapsed: boolean;          // grupo NÃO tem completed nem timeEvents nem isRunning
}

export type TaskItem = Task | TaskGroup;
export interface TasksState { items: TaskItem[] }
```

Decisões de forma que valem para todos os steps:

- **Um único array `items`**, discriminado por `type`. Motivo: uma única chave de localStorage, uma única
  ordenação (posição no array), um único filtro por `workflowId`, e a migração vira um `flatMap`.
  NÃO criar um segundo store/array para grupos.
- `SubTask` e `Task.subtasks` **deixam de existir**. `SubTaskTimeEvent` é renomeado para `TaskTimeEvent`.
- Ordem visual: grupos e tasks-de-raiz aparecem na ordem do array `items` (filtrado por workflow); as
  tasks de um grupo aparecem dentro do container do grupo, na ordem em que aparecem em `items`.
- Ações do store no alvo (nomes sugeridos, o planner do step 01 fecha a lista):
  `setItemsState`, `addTask(title, groupId | null)`, `addGroup(title)`, `toggleTask`, `deleteItem`
  (apagar grupo apaga os filhos), `saveEditingItem`, `saveNote`, `reorder…`, `clearItems`,
  `executeTask`, `stopTask`.
- `executeTask` mantém o guard de `isResting` mas **NÃO** zera `isRunning` das outras tasks (decisão 1).

---

## 3. FOOTPRINT — greps já rodados, NÃO refazer

### 3.1 `subtasks` / `SubTask` (o que o step 01 tem de matar)

- `states/tasks/index.ts:6,11,16,24,115,233,245,267,271,309,345,374` — tipos e todas as ações de subtask
  (`addSubtask` `:221`, `toggleSubtask` `:254`, `deleteSubtask` `:294`, `saveEditingSubtask` `:321`,
  `reorderSubtasks` `:359`, `executeSubtask` `:408`, `stopSubtask` `:450`, `clearSubtasks` `:508`)
- `states/tasks/utils.ts:2,5,37,72` — `calculateTotalTimeInSeconds`, `getTimeRangeFromEvents`,
  `shouldAutoStart` (operam só sobre eventos; **sobrevivem intactos**, só muda o nome do tipo)
- `states/tasks/scoreUtils.ts:7,91,101,112,130` — os 4 agregadores iteram `task.subtasks.forEach`;
  passam a iterar as tasks direto (`items.filter(i => i.type === "task")`)
- `hooks/useStoredTasks.ts:27-34,55-86` — normalização na hidratação e o handler de `beforeunload`
- `components/IndexTasks/IndexActiveTasksList/IndexTaskItem.tsx:13,38,198,200,209`
- `components/IndexTasks/IndexActiveTasksList/IndexSortableTaskItem.tsx:3,5,52,55`
- `components/IndexTasks/IndexFooter/IndexCompletedTaskItem.tsx:4,16-36,61` — `getTotalTimeInSecondsForTask`
  e `getEventsForTask` fazem `"subtasks" in task`; viram uma linha só sobre `task.timeEvents`

### 3.2 Navegação de dois níveis (`inExecutionTaskId`, `TaskListingMode`, `getActiveTask`)

- `components/IndexTasks/utils.ts:8,10,16,17` — `TaskListingMode`, `getActiveTask`, `getTaskListingMode`
  (`ListingTask` em `:1` também some, ou vira alias de `Task`)
- `components/IndexTasks/shared-state.ts:5,6,11,12` — campos `inExecutionTaskId` e `nonActiveExpandedTaskId`
- `components/IndexTasks/IndexTasks.tsx:11,17,22,23,26,31,37,40,45,53,69,83,84,93,103,108`
- `components/IndexTasks/IndexAddInput.tsx:5,8,12,29,42`
- `components/IndexTasks/IndexActiveTasksList/IndexActiveTasksList.tsx:17,27,33,36`
- `components/IndexTasks/IndexActiveTasksList/IndexSortableTaskItem.tsx:4,11,17,44`
- `components/IndexTasks/IndexActiveTasksList/IndexTaskItem.tsx:15,35,38,58,64,67,101`
- `components/IndexTasks/IndexActiveTasksList/shared-components/IndexEditInput.tsx:7,11,16,19`
- `components/IndexTasks/IndexFooter/IndexFooter.tsx:8,35,59,131`
- `states/tasks/index.ts:2,78` — o store importa `getActiveTask` da camada de UI (ver trap T3)

### 3.3 `useListingTasks`

- Definido em `hooks/useListingTasks.ts` (arquivo inteiro, 31 linhas). Consumidores:
  `IndexTasks.tsx:4,16`, `IndexActiveTasksList.tsx:15,33`, `IndexFooter.tsx:6,32`.
  No alvo ele deixa de receber `inExecutionTaskId` e passa a devolver os itens do workflow já separados
  em grupos / tasks de raiz / concluídas.

### 3.4 Score

- `components/IndexScore.tsx:8,9,31,33` consome `calculateTotalFocusedTime` e `calculateTasksCompleted`.
  Renderiza os 4 cards do print (TOTAL CYCLES, TASKS COMPLETED, FOCUSED TIME, CURRENT STREAK).

---

## 4. MOLDES a espelhar (caminho:linha concretos)

| Step | O que construir | Molde que JÁ existe |
|------|-----------------|---------------------|
| 01 | migração/normalização na hidratação | `hooks/useStoredTasks.ts:22-37` (o `parsedTasks.map` que hoje só revive as `Date`) |
| 01 | escrita defensiva no `beforeunload` | `hooks/useStoredTasks.ts:50-92` |
| 01 | agregadores planos | `states/tasks/scoreUtils.ts:88-124` (só trocar o `forEach` aninhado por um simples) |
| 02 | item de task com cronômetro completo | `components/IndexTasks/IndexActiveTasksList/IndexSubTaskItem/IndexSubTaskItem.tsx` — **é o molde principal do projeto inteiro**: `Timer` (`:173`), play/stop (`:219`), concluir (`:234`), `IndexAlertSelect` (`:269`), `IndexDebugTimer` (`:282`), sync com timer global (`:111-122`), alertas sonoros (`:124-144`) |
| 02 | badge "Running/Paused" | `IndexTaskItem.tsx:165-181` |
| 02 | edição inline | `IndexActiveTasksList/shared-components/IndexEditInput.tsx` e `IndexTaskAccordionSubtaskItem.tsx:80-101` |
| 03 | container de grupo (cabeçalho + input próprio + lista) | `IndexTaskItem.tsx:182-217` — o accordion de subtask atual já é literalmente isso (input "Add a subtask...", lista, botão Notes) |
| 03 | contagem + barra de progresso do grupo | `IndexFooter/IndexFooter.tsx:37-41` (cálculo) + `:75-96` (a linha "X of Y completed") + `:129` (`ProgressBar`) |
| 03/01 | DnD sortable | `IndexActiveTasksList.tsx:37-71` (`DndContext`+`SortableContext`) e `IndexSortableTaskItem.tsx:19-33` (`useSortable`) |
| 04 | item de concluída | `IndexFooter/IndexCompletedTaskItem.tsx` |
| 04 | dialog de nota | `IndexActiveTasksList/IndexTaskNoteDialog.tsx` (usado em `IndexTaskItem.tsx:214`) e `IndexFooter/IndexTaskNote.tsx` |

Átomos de layout reutilizáveis (não recriar): `src/layout/components/atoms/{Box,Button,Input,ProgressBar,Select,Dialog}`
e `src/layout/components/common/Timer` (+ `hooks/useCountUpTimer.ts`).

> Step 01 apagou `IndexTaskItem.tsx` e `IndexTaskAccordionSubtaskItem.tsx` (UI da navegação de 2 níveis).
> Os moldes da tabela que apontam para eles continuam disponíveis em:
> `git show 8185c5c:src/pages/index/components/IndexTasks/IndexActiveTasksList/IndexTaskItem.tsx`
> `git show 8185c5c:src/pages/index/components/IndexTasks/IndexActiveTasksList/IndexTaskAccordionSubtaskItem.tsx`
> `components/IndexTasks/utils.ts` também foi apagado. Ações do store fechadas pelo step 01:
> `setItemsState addTask(title, groupId?) addGroup toggleTask deleteItem saveEditingItem saveNote
> reorderItems clearItems executeTask stopTask` + os type guards `isTask`/`isTaskGroup`.

---

## 5. Ordem e o que cada step assume do anterior

- **02 assume de 01**: `TaskItem`/`Task`/`TaskGroup` já existem, o store já expõe `executeTask`/`stopTask`
  sem a trava de exclusividade, os dados legados já foram migrados e `scoreUtils` já opera plano.
- **03 assume de 02**: existe UM componente de item de task pronto para ser renderizado tanto na raiz
  quanto dentro de um grupo; `isActive` já não existe.
- **04 assume de 03**: grupos já renderizam e já têm o seu próprio bloco de contagem+progresso, então o
  rodapé só precisa da visão agregada do workflow.

---

## 6. TRAPS encontradas no código (ler antes de mexer)

- **T1 — array único, múltiplos workflows.** `state.tasks` guarda tasks de TODOS os workflows; o filtro é
  sempre `workflowId === selectedWorkflowId` (`states/tasks/index.ts:67-74`, `useListingTasks.ts:14-16`).
  `reorderTasks` (`:171-219`) faz a dança de mapear índices do subconjunto do workflow de volta para os
  índices do array global — **esse padrão precisa continuar** com grupos, ou reordenar quebra outro workflow.
- **T2 — `workflowId` pode ser `null`.** `addTask` (`:105-108`) e `clearTasks` (`:493`) retornam cedo se não
  houver workflow selecionado. Manter os guards. Workflows padrão em `states/workflows/index.ts:8`.
- **T3 — inversão de dependência existente.** O store zustand importa `getActiveTask` da camada de UI
  (`states/tasks/index.ts:2`). Isso é drift pré-existente; ao remover `getActiveTask` (P1), aproveitar para
  não recriar o import de UI dentro do store.
- **T4 — `beforeunload` grava um evento `stop` mas mantém `isRunning: true`** (`useStoredTasks.ts:60-79`).
  É INTENCIONAL: `shouldAutoStart` (`states/tasks/utils.ts:72`) olha só o ÚLTIMO evento, então ao reabrir o
  app a task aparece como "estava rodando" mas o cronômetro não retoma sozinho. Preservar esse par
  `isRunning:true` + último evento `stop`. Com múltiplos cronômetros, o handler tem de fazer isso para
  TODAS as tasks rodando, não só uma.
- **T5 — dupla contagem de tempo.** `states/tasks/utils.ts:calculateTotalTimeInSeconds` e
  `states/tasks/scoreUtils.ts:calculateSubtaskTime` são a MESMA função duplicada. Não piorar: se der,
  o step 01 unifica; se não, no mínimo não criar uma terceira cópia.
- **T6 — `IndexSubTaskItem` faz duas coisas por render:** toca alarme e manda notificação Tauri no efeito
  de `:124-144`, comparando `currentTimeInSeconds` por igualdade exata com o alvo. Com N cronômetros em
  paralelo isso passa a poder disparar N alarmes ao mesmo tempo — o step 02 deve pelo menos não regredir
  aqui (o `new Audio(...)` por task já é o comportamento atual, uma instância por item).
- **T7 — `useCountUpTimer` com `autoStart`** (`IndexSubTaskItem.tsx:54-61`) depende de
  `isGlobalTimerRunning && !isResting && task.isRunning && shouldAutoStart(...)`. Ao replicar para N tasks,
  cada item continua com a sua própria instância do hook — **não** centralizar num único timer global.
- **T8 — React Compiler ligado** (`babel-plugin-react-compiler` no `package.json`, ver `vite.config.ts`).
  Evitar mutação de props/estado; o código atual é todo imutável — manter.
- **T9 — sem testes, sem Docker.** Nenhum `*.test.*` no repo, nenhum runner instalado, nenhum Dockerfile.
  Não tentar rodar `npm test`. Validação = `npx tsc --noEmit` + `npm run dev` (Vite, porta fixa **1420**,
  definida em `vite.config.ts:18`; a porta é fixa e falha se estiver ocupada).
- **T10 — dados de verdade no localStorage do usuário.** A migração do step 01 roda sobre `timertasks:tasks`
  em produção (o print mostra 151 tasks concluídas e 46h de foco). A migração tem de ser **idempotente**
  (rodar de novo sobre dados já migrados não pode duplicar nem apagar nada) e tolerante ao formato antigo.
- **T11 — `eslint.config.js` existe** mas não há script `lint` no `package.json`. Não é gate obrigatório.

---

## Padrões capturados no step 01

- **Contrato do store fechado de vez** (tipos `Task`/`TaskGroup`/`TaskItem`, type guards `isTask`/
  `isTaskGroup`, ações `setItemsState addTask(title, groupId?) addGroup toggleTask deleteItem
  saveEditingItem saveNote reorderItems clearItems executeTask stopTask`). Steps 02-04 IMPLEMENTAM sobre
  esse contrato, não o reabrem.
- **`migrateEntry()` em `useStoredTasks.ts` tem 3 ramos que produzem `Task`** (`type==="task"` linha 65,
  subtask-para-task dentro do ramo "grupo com subtasks" linha 87, fallback "task legada solta" linha
  102): os 3 SEMPRE chamam `reviveEvents(entry.timeEvents)`, nunca hardcoding de `timeEvents: []`. Isso
  já foi violado uma vez (bug do tests-01) e corrigido — qualquer novo ramo de migração que alguém
  precisar adicionar nos steps seguintes deve seguir o mesmo padrão.
- **`TaskGroup` não tem UI própria ainda** (nem cabeçalho/card, nem "Add Group") — os dados sobrevivem
  intactos no store/localStorage, só não há nada que renderize `type === "group"` nem chame `addGroup`.
  Isso é escopo do **step 03**, confirmado como gap aceito (não regressão) tanto em `validation-r1.md`
  quanto nos dois verdicts de teste.
- **Drag-and-drop (dnd-kit) não é testável por automação de browser neste ambiente**: nem
  `browser_drag` do Playwright MCP (timeout de "stable" nos cronômetros re-renderizando) nem uma
  sequência sintética de `PointerEvent` (dnd-kit exige pointer-capture real de SO) funcionam. Steps
  seguintes que tocarem em DnD devem registrar essa mesma limitação como "Not run" no teste de sistema,
  não tentar forçar uma automação nova.
- **Tela de permissão de notificação Tauri bloqueia tudo em teste de browser puro** (sem bridge Tauri,
  a permissão sempre nega). Contorno já validado 2x: sobrescrever `window.Notification.permission`
  (getter → `'granted'`) e `.requestPermission` (→ resolve `'granted'`) via `browser_evaluate` antes de
  clicar "Allow notifications", refazendo a cada reload (contexto JS novo). Reutilizar esse contorno
  em qualquer teste de browser dos steps seguintes.
- **`useStoredTasks.ts` grava no `localStorage` no `beforeunload`** — ao plantar um fixture de teste,
  plantar ANTES da hidratação rodar (ex.: enquanto a tela de permissão ainda bloqueia), senão o próximo
  `beforeunload` sobrescreve o fixture com o estado em memória (vazio).
- **Cliques via Playwright MCP (`browser_click`) dão timeout de "stable"** neste app por causa dos
  cronômetros re-renderizando continuamente; usar `click()` real via DOM (`browser_evaluate`) em vez
  disso é o contorno validado.
