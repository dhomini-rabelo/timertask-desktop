# Recon — step 03: grupos criados com prefixo `>`

## Mapa de arquivos

- `src/pages/index/components/IndexTasks/IndexAddInput.tsx` | input raiz, chama `addTask(title,null)` | 1-41 (tudo)
- `src/pages/index/components/IndexTasks/IndexActiveTasksList/IndexActiveTasksList.tsx` | DndContext único, lista flat de `activeTasks` | 1-53 (tudo, arquivo real menor que os `:37-71` citados no plan)
- `src/pages/index/components/IndexTasks/IndexActiveTasksList/IndexSortableTaskItem.tsx` | wrapper `useSortable` por task | 1-35 (tudo)
- `src/pages/index/components/IndexTasks/IndexActiveTasksList/IndexTaskItem/IndexTaskItem.tsx` | item unificado (step02), header+ações+cronômetro | 37-70 header, 108-113 edit toggle, 153-226 render header
- `src/pages/index/components/IndexTasks/IndexActiveTasksList/shared-components/IndexEditInput.tsx` | input de edição genérico, já funciona p/ qualquer `item.id` | 1-70 (tudo) — **não precisa mudar**, `saveEditingItem` já é type-agnostic
- `src/pages/index/components/IndexTasks/shared-state.ts` | `indexTasksPageStateAtom.editingTaskId` (genérico por id) | 1-9 (tudo)
- `src/pages/index/components/IndexTasks/IndexFooter/IndexFooter.tsx` | cálculo/visual do progresso geral | 22-26 calc, 39-61 contagem, 85 `ProgressBar`
- `src/layout/components/atoms/ProgressBar/ProgressBar.tsx` | átomo de barra, props `percentage/label` | 1-24 (tudo)
- `src/pages/index/hooks/useListingTasks.ts` | deriva `groups/tasks/rootTasks/activeTasks/completedTasks` de `items` | 1-23 (tudo) — **não expõe filhos por grupo**, o componente de grupo vai filtrar sozinho
- `src/pages/index/states/tasks/index.ts` | store: `Task`/`TaskGroup`, `addTask/addGroup/reorderItems/deleteItem/saveEditingItem` | 10-38 tipos, 77-145 `addTask` (insere logo após último filho do grupo, ou após header se vazio), 147-167 `addGroup`, 196-213 `deleteItem` (já cascade nos filhos), 242-293 `reorderItems` (guard de running: 270-275)
- `src/pages/index/components/IndexTasks/IndexTasks.tsx` | composição da página, gate de vazio | 11 `activeTasks`, 31-38 gate `activeTasks.length===0`

## Molde a espelhar

`git show 8185c5c:.../IndexActiveTasksList/IndexTaskItem.tsx` (versão pré-step02, antes do `git mv`), linhas 90-130: header com `IndexEditInput` condicional, drag handle (`{...dragHandleProps}` + `GripVertical`), título, botões edit/delete no hover, e (linhas ~170-215) bloco de accordion expandido com input "Add a subtask..." + `Button` "Add" + lista de filhos + `IndexTaskNoteDialog`. Essa é a estrutura a copiar para o container de grupo (trocar "Add a subtask" por "Add a task...", subtasks por `IndexTaskItem` do step02, e acrescentar contagem+`ProgressBar` que o accordion antigo não tinha).

## Footprint

- `IndexTasks.tsx:11,31-38` consome `activeTasks` do hook só para decidir a empty-state; hoje `activeTasks` = todas as tasks não completas (raiz + de grupo) — **armadilha**, ver abaixo.
- `IndexFooter.tsx:20-26` consome `tasks`/`completedTasks` (globais, todas as tasks, independente de grupo) — não deve mudar neste step (é do step 04), mas continua funcionando sem alteração pois `useListingTasks` não muda sua forma pública.
- Nenhum outro arquivo fora de `IndexTasks/` importa `useListingTasks`, `IndexTaskItem` ou `reorderItems` (grep confirmado, só os 4 arquivos acima).

## Armadilhas

1. **Gate de vazio quebra com grupo vazio** — `IndexTasks.tsx:31` só renderiza `IndexActiveTasksList` quando `activeTasks.length > 0`. Um grupo recém-criado com 0 filhos, ou um grupo cujos filhos estão todos completos, faz `activeTasks` (que só conta tasks, não grupos) ficar em 0 e o grupo inteiro desaparece da tela. Não está no IN explícito, mas é consumidor direto que quebra — avisar o planner.
2. **T1 continua valendo**: `reorderItems` (`states/tasks/index.ts:242-293`) mapeia por `id` dentro do subconjunto do workflow e depois devolve para os índices globais (`workflowItemIndexes`, linha 250-258) — isso é genérico por-id, não assume nada sobre grupo/task.
3. **Guard de não-reordenar-rodando** está em `states/tasks/index.ts:270-275` (não 196-201 como no delta — arquivo evoluiu; a regra é a mesma: se `activeItem` ou `overItem` é `Task` com `isRunning`, aborta).
4. **DnD de grupo NÃO move o bloco de filhos** — `reorderItems` reposiciona só o item cujo id foi arrastado. Se um `TaskGroup` for arrastado, seus filhos (que hoje ficam fisicamente logo após o header por causa do `insertIndex` de `addTask`, linhas 113-121) **não se movem junto** no array bruto `items`. Isso só é seguro se a renderização dos filhos de um grupo filtrar por `task.groupId === group.id` (preserva ordem relativa via `filter`, independe de adjacência) em vez de assumir contiguidade no array. **Nenhuma mudança de store é necessária** desde que a renderização siga esse filtro — mas se o planner implementar por "pegar os próximos itens contíguos após o header", vai quebrar na primeira reordenação de grupo.
5. `addTask(title, groupId)` já insere o novo item logo após o último filho existente do grupo (ou logo após o header se vazio) — então a ordem de criação dentro de um grupo já é coerente com a leitura por filtro acima.

## Sinal de teste

Não encontrado teste automatizado para esta área (nenhum arquivo `*.test.*` sob `src/pages/index`). Precisa stack rodando + navegador (`npm run dev` :1420, conforme plan-simplified). DnD não é automatizável neste ambiente (dnd-kit usa pointer capture) — herda a mesma limitação já registrada nos steps 01/02 (`tests-01/verdict.md` do step02: "DnD = Not run").

## Veredito de complexidade

1. Uma frente só? **sim** — só frontend React, nada em `src-tauri/` (confirmado, plan-simplified linha 45).
2. Footprint de no máximo 6 arquivos a criar/editar? **sim** — `IndexAddInput.tsx`, `IndexActiveTasksList.tsx`, 1 arquivo novo (container de grupo, possivelmente +1 wrapper sortable espelhando `IndexSortableTaskItem.tsx`), `IndexTasks.tsx` (gate de vazio, armadilha 1) = 4-5 arquivos.
3. Existe molde/irmão claro para espelhar? **sim** — accordion antigo em `git show 8185c5c:.../IndexTaskItem.tsx` + `IndexFooter.tsx` p/ progresso + `IndexActiveTasksList.tsx`/`IndexSortableTaskItem.tsx` p/ DnD.
4. Zero decisão de arquitetura/produto em aberto? **não** — decisão real em aberto: forma exata do DnD de 2 níveis (ver Armadilha 4) e se o novo container vira 1 arquivo ou 2 (item + wrapper sortable, espelhando o split existente); a contagem/filtro por-grupo também precisa de uma decisão de onde mora (helper novo em `useListingTasks` vs. filtro local no componente).
5. Zero lógica/algoritmo novo não-trivial? **não** — o parsing do prefixo é trivial, mas o encaixe do DnD de 2 níveis sobre um `reorderItems` que só entende pares de id (sem noção de bloco/hierarquia) é uma decisão de design não-trivial, mesmo que a conclusão desta recon seja "não precisa mexer no store".

`veredito: complexa — decisão 4 (arquitetura do DnD de 2 níveis / forma do novo componente) e decisão 5 (não-trivial encaixar hierarquia sobre reorderItems flat) falharam`

## Sinal de partição

`partição: não` — é um único componente novo mais ajustes em 3-4 arquivos existentes, nenhuma suíte de teste nova nem taxonomia/contrato novo sendo introduzido (o contrato `TaskGroup`/ações já fechou no step 01).
