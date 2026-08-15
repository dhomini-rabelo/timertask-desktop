# Step 01 — modelo, store e migração

## Objetivo

Achatar o modelo de dados para nível único: `Task` passa a ser a entidade de nível 1 que carrega o
cronômetro, `TaskGroup` passa a ser um container sem cronômetro, `SubTask`/`Task.subtasks` deixam de
existir. Reescrever o store zustand, migrar os dados legados do localStorage e adaptar os agregadores de
score. A UI é ajustada apenas o necessário para o app abrir e o TypeScript passar.

## CLASSE: `julgamento`

Redesenho de modelo de dados + migração de dados reais de produção. Não existe molde equivalente no repo.

## IN

1. `src/pages/index/states/tasks/index.ts`
   - `SubTaskTimeEvent` → `TaskTimeEvent` (mesmo shape).
   - Novos tipos `Task`, `TaskGroup`, `TaskItem` exatamente como especificado na seção 2 de
     `memoria-da-task.md`. Estado passa a ser `{ items: TaskItem[] }`.
   - Apagar `SubTask` e todas as ações `*Subtask` (`addSubtask` `:221`, `toggleSubtask` `:254`,
     `deleteSubtask` `:294`, `saveEditingSubtask` `:321`, `reorderSubtasks` `:359`, `executeSubtask` `:408`,
     `stopSubtask` `:450`, `clearSubtasks` `:508`), substituindo por ações únicas sobre `TaskItem`.
   - `executeTask(id)` mantém o guard `isResting` (hoje em `:409-411`) e **NÃO zera `isRunning` das
     outras tasks** (hoje `:438`) — decisão 1 do usuário.
   - `addTask(title, groupId | null)` e `addGroup(title)` (o parsing do `>` NÃO é deste step; quem chama
     `addGroup` neste step é só a migração).
   - `deleteItem` de um grupo apaga também as tasks com aquele `groupId`.
   - Reordenação preservando o padrão de índices do array global (trap **T1**).
   - Remover o import de `getActiveTask` vindo da UI (`:2`, usado em `:78`) — trap **T3**.
2. `src/pages/index/states/tasks/utils.ts` — só o rename do tipo; as 3 funções sobrevivem intactas.
3. `src/pages/index/states/tasks/scoreUtils.ts` — os 4 agregadores (`:88`, `:98`, `:108`, `:126`) passam a
   iterar as tasks direto em vez de `task.subtasks.forEach`. Se der, unificar a duplicação com
   `utils.ts` (trap **T5**).
4. `src/pages/index/hooks/useStoredTasks.ts` — **a migração** (ver contrato abaixo) e o `beforeunload`
   adaptado para N tasks rodando (trap **T4**).
5. `src/pages/index/hooks/useListingTasks.ts` — deixa de receber `inExecutionTaskId`; devolve os itens do
   workflow selecionado já separados (grupos, tasks de raiz, tasks concluídas).
6. Ajuste **mecânico e enumerado** da UI para o app renderizar e `npx tsc --noEmit` passar:
   `IndexTasks.tsx`, `IndexActiveTasksList.tsx`, `IndexSortableTaskItem.tsx`, `IndexTaskItem.tsx`,
   `IndexAddInput.tsx`, `IndexEditInput.tsx`, `IndexFooter.tsx`, `IndexCompletedTaskItem.tsx`,
   `IndexTaskAccordionSubtaskItem.tsx`, `shared-state.ts` (ver footprint 3.1/3.2 da memória).
   Neste step a lista renderiza as tasks de nível 1 **em lista plana**, reaproveitando o componente
   `IndexSubTaskItem` como item (ele já aceita exatamente o shape que `Task` agora tem). Grupos podem
   aparecer só como um rótulo simples ou nem aparecer.

## OUT (explicitamente NÃO é deste step)

- Parsing do prefixo `>` no input, UI de grupo, contagem/progresso por grupo → **step 03**.
- Unificação/redesenho dos componentes de item, `isActive`, sincronismo de N cronômetros com o timer
  global, título "Tasks" → **step 02**.
- Rodapé, accordion de concluídas, `IndexScore` visual → **step 04**.
- **Nada em `src-tauri/`.**
- Após este step é ESPERADO que as tasks migradas apareçam numa lista plana sem o cabeçalho do grupo
  delas. Isso não é bug; é o step 03.

## Contrato de migração (decisão 3 do usuário — BINDING)

Chave localStorage: **`timertasks:tasks`**. Formato legado: `Task[]` com `subtasks`.

- Legado com `subtasks.length > 0` → 1 `TaskGroup` (`type:"group"`, mesmo `id`, `title`, `workflowId`,
  `note`, `collapsed:false`) + 1 `Task` por subtask (`type:"task"`, mesmo `id`, `title`, `completed`,
  `isRunning`, `timeEvents` com as `Date` revividas, `workflowId` herdado do pai, `groupId` = id do pai).
- Legado com `subtasks` vazio/ausente → vira uma `Task` na raiz (`groupId: null`), preservando o
  `completed` dele; **não** criar grupo vazio.
- O `completed` de um grupo legado é descartado (grupo não tem `completed`). Isso é seguro: pelo fluxo
  atual (`IndexFooter.tsx:43-46`) um grupo só era concluído com TODAS as subtasks concluídas.
- Ordem: os itens gerados entram na ordem `[grupo, ...filhos]`, preservando a ordem original.
- **Idempotência obrigatória** (trap **T10**): detectar o formato pela presença de `subtasks`/ausência de
  `type`; rodar de novo sobre dados já migrados não pode duplicar nem perder nada.
- `JSON.parse` que falha continua caindo no `catch` com estado vazio (`useStoredTasks.ts:39-42`).

## Respostas do usuário que afetam ESTE step

- **1 (paralelo)**: `executeTask` não pausa as outras tasks.
- **2 (grupo com filhos explícitos)**: `TaskGroup` é entidade própria; task referencia por `groupId`.
- **3 (migração preserva)**: contrato acima; todos os `timeEvents` sobrevivem.
- **P1**: `inExecutionTaskId`, `TaskListingMode`, `getTaskListingMode`, `getActiveTask` são removidos.
- **P3**: grupo sem `completed`, sem `timeEvents`, sem `isRunning`.
- **P4**: guard de `isResting` permanece no store.

## Dependências

Nenhuma — é o primeiro step.

## Modo de teste de sistema: **browser** (`npm run dev` :1420)

Não existe suíte de testes nem Dockerfile (trap **T9**). Roteiro mínimo:
`npx tsc --noEmit` limpo; então, com um `timertasks:tasks` no formato LEGADO plantado no localStorage
(grupo com subtasks + grupo sem subtasks), abrir o app e confirmar que as subtasks viraram tasks de
nível 1, que os tempos/`timeEvents` sobreviveram (cards FOCUSED TIME e TASKS COMPLETED do `IndexScore`
mantêm a ordem de grandeza anterior), que dar reload de novo não duplica nada, e que dá para iniciar
**duas** tasks ao mesmo tempo com o timer global rodando.
