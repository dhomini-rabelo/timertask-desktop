## Mapa de arquivos
- src/pages/index/states/tasks/index.ts | modelo TaskItem (Task/TaskGroup) + toggleTask/deleteItem etc | 10-38 (types), 169-194 (toggleTask)
- src/pages/index/components/IndexTasks/IndexActiveTasksList/IndexTaskGroup/IndexTaskGroup.tsx | render do header do grupo (edit/delete/collapse), sem botao de concluir | 28-131
- src/pages/index/components/IndexTasks/IndexActiveTasksList/IndexTaskItem/IndexTaskItem.tsx | render da task-folha, botao Check chama toggleTask | 214-222
- src/pages/index/hooks/useListingTasks.ts | deriva groups/tasks/activeListItems a partir de items | 13-23
- src/pages/index/hooks/useStoredTasks.ts | persistencia localStorage + migracao legado, TaskGroup nunca tem `completed` | 40-108 (migrateEntry), 118+ (hidratacao)
- src/pages/index/components/IndexTasks/IndexFooter/IndexFooter.tsx | contagem `completedTasks`/`tasks` (so Task, groups nao entram) | 20-26
- src/pages/index/components/IndexTasks/IndexFooter/IndexCompletedTaskItem.tsx | item da lista de concluidas, recebe groupTitle so como badge | 32-63
- src/pages/index/states/reports/sync.ts | export de relatorio usa groupTitle da task-folha, grupo nunca aparece como "completo" | 17-56

## Molde a espelhar
IndexTaskItem.tsx linhas 214-222 é o unico lugar que marca algo como concluido:
```tsx
{isTimerActive && (
  <button onClick={() => toggleTask(task.id)} className="transition-all p-2" title="Mark as complete">
    <Check className="w-5 h-5 text-Green-400" />
  </button>
)}
```
Esse botao so aparece quando `isTimerActive` (task com timer rodando) e chama `toggleTask(task.id)`. Nao ha equivalente no header do grupo (IndexTaskGroup.tsx 83-131: so tem Edit/Delete/Collapse).

## Footprint
- src/pages/index/components/IndexTasks/IndexActiveTasksList/IndexActiveTasksList.tsx:48-54 | renderiza `IndexSortableTaskGroup` p/ isTaskGroup(item), sem checar completed do grupo (grupo nao tem esse campo)
- src/pages/index/components/IndexTasks/IndexActiveTasksList/IndexSortableTaskGroup.tsx | wrapper de drag do grupo, so repassa props (nao encontrado botao de done aqui tambem)
- src/pages/index/components/IndexTasks/IndexFooter/IndexFooter.tsx:20-29 | `groups` so usado p/ montar `groupTitleById` (nome do grupo no badge da task concluida)
- src/pages/index/states/reports/sync.ts:18-19,52-53 | mesma coisa, so pega `group.title`, nunca `group.completed`

## Armadilhas
- `TaskGroup` (states/tasks/index.ts:25-28) NAO TEM campo `completed` no tipo — so `type, collapsed` alem dos campos base (id/title/workflowId/note). Adicionar "done" no grupo exige estender esse tipo.
- `toggleTask` (states/tasks/index.ts:169-194) tem guard `if (item.id !== id || !isTask(item)) return item;` — ou seja, mesmo se chamado com o id de um grupo, o guard `!isTask(item)` bloqueia e a acao vira no-op silencioso. Qualquer solucao precisa de uma acao nova ou relaxar esse guard com cuidado (toggleTask hoje tambem grava `timeEvents`/`completed`, campos que TaskGroup nao tem).
- `useStoredTasks.ts` migrateEntry (40-108) tambem nunca escreve `completed` em entries `type: "group"` — persistencia/migracao de dados legados precisaria de default (`completed: entry.completed ?? false`) se o campo for adicionado, senao grupos antigos quebram ao ler `group.completed`.
- `useListingTasks.ts:16` `activeListItems` inclui `isTaskGroup(item)` sem checar completude — se `completed` for adicionado ao grupo, esse filtro precisa decidir se some da lista ativa quando concluido (hoje so tasks saem da lista ativa via `!item.completed`, linha 22).
- Progresso do grupo (IndexTaskGroup.tsx 38-42) e' derivado 100% das children (`completedCount/children.length`), nunca de um campo proprio do grupo — logo mesmo com 100% das subtasks concluidas, o grupo em si fica sem nenhum estado "done" (nem visual, nem de dado).
- `deleteItem` (states/tasks/index.ts:196-213) e' a unica acao que trata grupo+filhos junto (cascata); nenhuma outra acao (toggle/execute/stop) tem esse tratamento cascata — um "concluir grupo" provavelmente precisa do mesmo padrao (afetar o grupo E propagar/considerar os filhos).

## Sinal de teste
Nao encontrado nenhum arquivo de teste automatizado para states/tasks, useListingTasks ou os componentes Index* (busca por `*.test.*`/`*.spec.*` sob src/pages/index nao retornou nada explorado). A prova precisa ser via UI rodando (app Tauri/vite) — fluxo manual: criar grupo, adicionar subtasks, concluir todas, tentar marcar o grupo como done.

## Veredito de complexidade
1. Uma frente só? **não** — precisa mudar estado (Zustand store `states/tasks/index.ts`: tipo `TaskGroup` + nova acao ou ajuste de `toggleTask`), persistencia/migracao (`useStoredTasks.ts`) e UI (`IndexTaskGroup.tsx`, possivelmente `useListingTasks.ts`/`IndexActiveTasksList.tsx` para o grupo sumir da lista ativa quando concluido).
2. Footprint de no máximo 6 arquivos a criar/editar? **sim** — projeção: states/tasks/index.ts, useStoredTasks.ts, IndexTaskGroup.tsx, useListingTasks.ts (~4 arquivos certos, IndexFooter/IndexCompletedTaskItem talvez se o grupo tiver que aparecer na lista de concluidos).
3. Existe molde/irmão claro para espelhar? **sim** — o botao Check + toggleTask de IndexTaskItem.tsx:214-222 e a acao toggleTask de states/tasks/index.ts:169-194 sao o molde direto, so precisam ser adaptados para aceitar TaskGroup.
4. Zero decisão de arquitetura/produto em aberto? **não** — falta decidir regra de produto: grupo so pode ser concluido quando todas as subtasks estao concluidas? concluir o grupo deve marcar as subtasks pendentes como concluidas em cascata (igual `deleteItem` cascade)? grupo concluido some da lista ativa ou fica com progress bar 100%? Isso e' decisao de planner/produto, nao esta nos arquivos.
5. Zero lógica/algoritmo novo não-trivial? **sim** — nao envolve algoritmo novo, so espelhar o padrao toggle existente e estender o tipo/migracao; a unica logica nova e' a regra de cascata/guard citada no item 4, que e' decisao, nao algoritmo complexo.

veredito: complexa — falha nos itens 1 e 4 (multi-arquivo state+persistencia+UI, e ha decisao de produto em aberto sobre a regra de "concluir grupo")

## Sinal de partição
partição: não
