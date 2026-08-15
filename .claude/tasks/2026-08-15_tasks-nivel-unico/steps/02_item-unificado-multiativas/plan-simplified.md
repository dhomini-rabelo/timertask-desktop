# Step 02 — item unificado e múltiplas tasks ativas

## Objetivo

Consolidar os dois componentes de item (`IndexTaskItem` de grupo + `IndexSubTaskItem` de subtask) num
único componente de task de nível 1, com cronômetro/alerta/debug/concluir/nota para TODA task, e fazer
os N cronômetros funcionarem em paralelo e em sincronia com o timer global. Encerrar de vez a navegação
de dois níveis e ajustar os textos da página.

## CLASSE: `julgamento`

Redesenho de componente com fusão de dois componentes divergentes + mudança de invariante de execução
(de "uma ativa" para "N em paralelo"). Tem molde forte, mas exige decisão de UI e de efeitos.

## IN

1. **Componente único de item de task** — molde principal:
   `src/pages/index/components/IndexTasks/IndexActiveTasksList/IndexSubTaskItem/IndexSubTaskItem.tsx`.
   Absorve do `IndexTaskItem.tsx` o que ainda faz sentido (drag handle `:105-112`, badge Running/Paused
   `:165-181`, botão de nota `:214` via `IndexTaskNoteDialog`). O nome final do arquivo/componente fica a
   critério do planner (sugestão: passar a ser `IndexTaskItem` e apagar a pasta `IndexSubTaskItem/`,
   mantendo `IndexAlertSelect.tsx` e `IndexDebugTimer.tsx`).
2. **Fim de `isActive`** (premissa **P10**): a prop some. Toda task não concluída renderiza os controles
   completos. A borda/fundo verde (`IndexSubTaskItem.tsx:149-153`) passa a refletir `task.isRunning`.
3. **Progressive disclosure** (premissa **P11**): play/stop e `IndexAlertSelect` sempre visíveis; o anel
   `Timer` (`:170-180`) e o `IndexDebugTimer` (`:280-288`) só depois que a task foi iniciada alguma vez
   (`timeEvents.some(e => e.type === "start")` — mesma ideia de `IndexTaskItem.tsx:39`).
4. **Sincronismo com o timer global para N tasks** (premissa **P12**): o efeito de
   `IndexSubTaskItem.tsx:111-122` hoje só age na task ativa; passa a valer para qualquer task com
   `isRunning === true`. Cada item mantém a SUA instância de `useCountUpTimer` (trap **T7**) —
   não centralizar.
5. **Guards preservados** (**P4**): iniciar exige timer global rodando e `!isResting`; caso contrário
   `errorMessageAtom` = "Global timer is not running" (`IndexSubTaskItem.tsx:68-80`).
6. **Limpeza da navegação de dois níveis** (**P1**), se algo tiver sobrado do step 01:
   `inExecutionTaskId` e `nonActiveExpandedTaskId` fora de `shared-state.ts`; `TaskListingMode`,
   `getTaskListingMode`, `getActiveTask` fora de `components/IndexTasks/utils.ts`; `IndexEditInput`
   deixa de receber `listingMode`; `IndexTaskAccordionSubtaskItem.tsx` é apagado (o accordion morre).
7. **Textos da página** (`IndexTasks.tsx`): título vira **"Tasks"** (**P6**), sem o breadcrumb
   `Tasks / <grupo>` (`:53-68`); empty states (`:90-101`) reduzidos a um caso só.
8. **DnD** continua funcionando na lista de nível 1 (`IndexActiveTasksList.tsx`, `IndexSortableTaskItem.tsx`),
   com a regra atual de não reordenar item em execução (`states/tasks/index.ts:196-201`).

## OUT

- Grupos: parsing do `>`, cabeçalho, input próprio do grupo, progresso do grupo → **step 03**.
- Rodapé, concluídas, reset, `IndexScore` → **step 04**.
- Mudanças de modelo/persistência (já fechadas no step 01).
- **Nada em `src-tauri/`.**

## Respostas do usuário que afetam ESTE step

- **1 (paralelo)**: N cronômetros rodam ao mesmo tempo, cada um com play/stop próprio; nada pausa nada.
- **P1, P2, P6, P10, P11, P12, P4** de `answers.md`.

## Dependências

Step 01: modelo `Task`/`TaskGroup`/`TaskItem`, `executeTask`/`stopTask` sem exclusividade, dados migrados.

## Traps a respeitar

- **T6** — o efeito de alarme (`IndexSubTaskItem.tsx:124-144`) compara o tempo por igualdade exata e cria
  um `new Audio` por disparo. Com N cronômetros isso pode disparar N alarmes simultâneos: não regredir,
  e de preferência não multiplicar instâncias de áudio por render.
- **T7** — uma instância de `useCountUpTimer` por item; não unificar.
- **T8** — React Compiler ligado; manter tudo imutável.

## Modo de teste de sistema: **browser** (`npm run dev` :1420)

`npx tsc --noEmit` limpo; então: criar 3 tasks, iniciar o timer global, dar play em **duas** ao mesmo
tempo e confirmar que ambos os cronômetros sobem simultaneamente; pausar o timer global e confirmar que
as duas pausam, retomar e confirmar que as duas voltam; concluir uma e confirmar que a outra continua
rodando; tentar dar play com o timer global parado e confirmar a mensagem de erro; recarregar a página e
confirmar que os tempos foram preservados e que nenhuma retoma sozinha (trap **T4**).
