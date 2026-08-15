APROVADO

# Validação r1 — step 01 (modelo, store e migração)

Escopo revisado: os 20 arquivos do plan.md (5 do Lote A + 15 do Lote B, 3 deles apagados) no working
tree sobre `main`. `image.png` ignorado. `npx tsc --noEmit` limpo (resultado oficial do step, não
re-executado).

## Critérios de aceitação

1. **tsc limpo** — confiado no resultado oficial (exit=0).
2. **grep de resíduos** — rodei
   `grep -rn "SubTask\|subtasks\|inExecutionTaskId\|nonActiveExpandedTaskId\|getActiveTask\|TaskListingMode\|state\.tasks" src | grep -v "IndexSubTaskItem\|Subtask timer"`.
   Sobram **apenas** 5 linhas em `useStoredTasks.ts` (`:11,30,70,71,81`), todas leitura do JSON legado
   (`LegacySubTask`, `entry.subtasks`) — a exceção binding e documentada. Nada mais. OK.
3/4/5. Comportamento no browser — fora do meu escopo (é o teste de sistema).
6. **`src-tauri/` intocado** — `git diff --stat HEAD -- src-tauri` vazio; os 20 arquivos alterados estão
   todos sob `src/`. OK.

## Foco pedido — item por item

- **(a) Migração idempotente (`useStoredTasks.ts:33-116`)** — bate com o algoritmo do plan.md linha a
  linha: discriminação por `entry?.type` primeiro (`:41`, `:54`), legado com `subtasks.length > 0` →
  `[grupo, ...filhos]` via `flatMap` (`:71-92`) com `workflowId` herdado do pai e `groupId: entry.id`,
  `completed` do grupo legado descartado (o objeto de grupo em `:72-79` não tem o campo), legado sem
  subtasks → task de raiz com `groupId: null` e **nenhum grupo vazio** (`:95-107`). Idempotência real:
  a 2ª passada cai nos ramos `type === "group"` / `type === "task"`, que são map 1:1 e `new Date` sobre
  string ou Date. `timeEvents: []` no ramo de raiz não perde nada — o `Task` legado (`8185c5c`) não tinha
  campo `timeEvents`, só `subtasks`. `Array.isArray` guarda o `flatMap` (`:111`); o `catch` com
  `setItemsState([])` foi preservado (`:139-142`). Tipos `Legacy*` locais, sem `as TaskItem[]` cego.
- **(b) `executeTask` (`states/tasks/index.ts:311-340`)** — `return` cedo em
  `useCountdownTimerState.getState().state.isResting` preservado (`:312`); o `map` só toca `item.id === id`
  e nenhum outro item tem `isRunning` alterado. Decisão 1 respeitada. `stopTask` (`:342-367`) é simétrico.
- **(c) `beforeunload` (`useStoredTasks.ts:149-191`)** — mapeia **todas** as tasks (`isTask(item)` +
  `isRunning` + último evento `"start"`), empurra `{type:"stop"}` mantendo `isRunning: true` (o par que
  faz `shouldAutoStart` não retomar sozinho), com um único `stopDate` para todas. Grupos e tasks paradas
  passam intactos. T4 resolvida — o molde antigo só cobria o par task/subtask.
- **(d) `reorderItems` (`states/tasks/index.ts:242-293`)** — dança de índices idêntica ao
  `reorderTasks` de `8185c5c` (coleta `workflowItems` + `workflowItemIndexes`, reordena a fatia filtrada
  e reescreve nas mesmas posições globais). Guard de `isRunning` adaptado com `isTask()` nos dois lados
  (`:270-275`), porque `TaskGroup` não tem o campo. T1 preservada.
- **(e) Sync do timer global (`IndexSubTaskItem.tsx:111-116`)** — virou stop-only:
  `if (!isGlobalTimerRunning && timerState.isRunning) { stopTask(id); timerActions.stop(); }`. Não há
  ramo de auto-start no efeito, então ligar o timer global não inicia N tasks. O `autoStart` do
  `useCountUpTimer` (`:56-61`) continua sendo só a retomada de mount, e o par
  `isRunning:true + último evento "stop"` do `beforeunload` faz `shouldAutoStart` devolver `false`.
  P-C cumprida. Uma instância de `useCountUpTimer` e um `new Audio` por item (T6/T7) mantidos.
- **(f)** Ver critério 6 acima.
- **(g)** Ver critério 2 acima.

## Conformidade com o resto do contrato

- Tipos e type guards (`index.ts:5-38`) exatamente como a seção "Contrato do store"; padrão
  `{ state, actions }` e imutabilidade (T8) mantidos em todas as 11 ações; `getSelectedWorkflowId`
  preservado; `crypto.randomUUID()` (P-J) em `addTask`/`addGroup`.
- `addTask` insere após o **último** item do grupo (`:113-136`), preservando `[grupo, ...filhos]`;
  `deleteItem` remove os filhos do grupo (`:196-213`); `clearItems` filtra por workflow (`:295-309`).
- T3 resolvida por construção: `states/tasks/index.ts` não importa mais nada de `components/`.
- T5/P-G confirmada: comparei `calculateSubtaskTime` (versão antiga de `scoreUtils`) com
  `states/tasks/utils.ts:4-35` — são logicamente idênticas; a cópia sumiu e os 4 agregadores recebem
  `TaskItem[]` e iteram `items.filter(isTask)`.
- `useListingTasks` devolve as 6 chaves do contrato, sem parâmetros.
- Lote B conferido arquivo a arquivo contra a enumeração (itens 6-20): props removidas, `IndexTasks`
  com título fixo "Tasks", rodapé sem "Finish"/`IndexTaskNote` (P-I), `IndexCompletedTaskItem` sem os
  helpers e sem o cast, `IndexScore` sobre `state.items`. Os 3 arquivos apagados estão como `D` no
  índice. A nota obrigatória foi anexada ao fim da seção 4 da `memoria-da-task.md`.

## Ressalvas (registrar, não bloqueiam)

1. `IndexFooter/IndexCompletedTaskItem.tsx:31` — `task.timeEvents.sort(...)` ordena **in place** o array
   que vive dentro do store (mutação de estado, T8). O efeito visível é nulo (a ordenação é idempotente
   e não muda a identidade do array), e o código antigo já fazia isso no caminho de subtask, mas o
   correto é `[...task.timeEvents].sort(...)`.
2. `hooks/useStoredTasks.ts:70` — uma entrada `null`/não-objeto no JSON legado (`entry.subtasks` sobre
   `null`) lança e cai no `catch`, que zera **todo** o store. A "travessia defensiva" pedida pelo plan
   cobriria isso com um `if (!entry || typeof entry !== "object") return []`. Probabilidade baixa.
3. `IndexSubTaskItem.tsx:46,48,49` — as ações novas foram ligadas corretamente
   (`deleteItem`/`stopTask`/`toggleTask`), mas os aliases locais ainda se chamam `deleteTask`,
   `stopSubtask`, `toggleSubtask` (e `handleToggleSubtaskTimer:68`). O grep do critério 2 não pega
   (é `Subtask`, não `SubTask`). O step 02 renomeia o componente inteiro — resolver lá.
4. Código morto herdado da decisão P-I: `IndexFooter/IndexTaskNote.tsx` não tem mais nenhum consumidor
   (o único uso saiu de `IndexFooter.tsx`), e `IndexSortableTaskItem.tsx:8` declara `dragHandleProps?`
   sem consumir. Ambos são conformes ao plan (o plan mandou manter o arquivo e a prop); só registrar
   para o step 04 / step 02.
