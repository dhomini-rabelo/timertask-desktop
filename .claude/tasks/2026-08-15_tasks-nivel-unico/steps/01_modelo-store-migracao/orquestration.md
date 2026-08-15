## Extrato do step

- Decisões binding: contrato do store fechado em `plan.md` — tipos `Task/TaskGroup/TaskItem` (seção 2 da
  memória) + type guards `isTask`/`isTaskGroup`; ações finais `setItemsState addTask(title, groupId?)
  addGroup toggleTask deleteItem saveEditingItem saveNote reorderItems clearItems executeTask stopTask`.
  `executeTask` NÃO zera `isRunning` das outras (decisão 1). Migração idempotente discriminada por `type`
  em `useStoredTasks.ts` (algoritmo completo em plan.md). `IndexSubTaskItem` reaproveitado como item de
  nível 1, sempre `isActive={true}`, sync do timer global vira stop-only (P-C, provisório até step 02).
  `IndexTaskItem.tsx` e `IndexTaskAccordionSubtaskItem.tsx` são APAGADOS (P-D). `components/IndexTasks/
  utils.ts` é APAGADO (P-E). T5 resolvida: `scoreUtils` importa `calculateTotalTimeInSeconds` de `./utils`.
- Critérios de aceitação (plan.md, seção "Critérios de aceitação"): `tsc --noEmit` limpo; grep de
  `SubTask|subtasks|inExecutionTaskId|nonActiveExpandedTaskId|getActiveTask|TaskListingMode|state\.tasks`
  vazio (exceto nome do componente `IndexSubTaskItem` e string "Subtask timer..." em IndexDebugTimer.tsx:44);
  `npm run dev` :1420 sobe e renderiza lista plana; migração legada idempotente (2 reloads não duplicam);
  duas tasks rodando ao mesmo tempo sem zerar uma a outra.
- Lista de arquivos (20, enumeração completa em plan.md "Enumeração por arquivo"):
  Lote A (5): `states/tasks/index.ts`, `states/tasks/utils.ts`, `states/tasks/scoreUtils.ts`,
  `hooks/useStoredTasks.ts`, `hooks/useListingTasks.ts`.
  Lote B (15, 12 editados + 3 apagados): `IndexTasks/shared-state.ts`, `IndexTasks/utils.ts` (APAGAR),
  `IndexTasks/IndexTasks.tsx`, `IndexTasks/IndexAddInput.tsx`,
  `IndexActiveTasksList/IndexActiveTasksList.tsx`, `IndexActiveTasksList/IndexSortableTaskItem.tsx`,
  `IndexActiveTasksList/IndexSubTaskItem/IndexSubTaskItem.tsx`,
  `IndexActiveTasksList/shared-components/IndexEditInput.tsx`,
  `IndexActiveTasksList/IndexTaskItem.tsx` (APAGAR),
  `IndexActiveTasksList/IndexTaskAccordionSubtaskItem.tsx` (APAGAR),
  `IndexActiveTasksList/IndexTaskNoteDialog.tsx`, `IndexFooter/IndexFooter.tsx`,
  `IndexFooter/IndexCompletedTaskItem.tsx`, `IndexFooter/IndexTaskNote.tsx`, `components/IndexScore.tsx`.
- Git: branch `main`, commit-base `8185c5c`, working tree limpo (`image.png` untracked na raiz, ignorar,
  não commitar, não apagar).
- Traps ativas: T1 (array único multi-workflow, dança de índices em reorderItems), T4 (beforeunload:
  isRunning:true + último evento stop, agora para TODAS as tasks rodando), T7 (uma instância de
  useCountUpTimer por item, não centralizar), T8 (React Compiler, imutabilidade), T10 (migração idempotente
  sobre dados reais de produção).
- Teste de sistema: browser (`npm run dev` :1420). Roteiro no plan-simplified.md e nos critérios de
  aceitação acima.

## Log

- **tests-01: FAIL.** Bug de perda de dados na migração: `migrateEntry()` (`useStoredTasks.ts:95-107`,
  ramo "legado sem subtasks") hardcoda `timeEvents: []` em vez de `reviveEvents(entry.timeEvents)` —
  os outros dois ramos (`type==="task"` e o mapeamento de subtask-para-task) chamam `reviveEvents`
  corretamente. Consequência dupla: Focused Time subcontado e Tasks Completed subcontado (este último
  porque `calculateTasksCompleted` conta por evento `"complete"`, que nunca é criado quando `timeEvents`
  vira `[]`), gerando divergência visível entre o card de score e a contagem do rodapé. Resto do roteiro
  (achatamento, sem accordion, idempotência, 2 tasks rodando ao mesmo tempo, CRUD/nota) passou. Drag
  reorder não verificável neste ambiente (limitação de pointer-capture do Playwright com dnd-kit,
  não é defeito do app). Ver `tests-01/verdict.md`.
- **Fix** (`83722bb`): `useStoredTasks.ts:102` — `timeEvents: []` → `timeEvents: reviveEvents(entry.timeEvents)`
  no fallback de task legada sem subtasks, igual aos outros dois ramos. `tsc --noEmit` limpo.
- **tests-02: PASS.** Reproduz o caso exato do bug (task legada solta com `timeEvents` próprios) e
  confirma correção: `timeEventsCount` bate com o fixture, Focused Time e Tasks Completed corretos e
  sem divergência com o rodapé. Resto do roteiro (achatamento, idempotência, 2 tasks em paralelo, CRUD
  completo incl. criar/editar/concluir/apagar/nota) passou de novo. Drag continua "Not run" (limitação
  de ferramenta, não do app); "Add Group" sem UI confirmado como fora de escopo deste step (dado do
  grupo íntegro no store). Ver `tests-02/verdict.md`.
