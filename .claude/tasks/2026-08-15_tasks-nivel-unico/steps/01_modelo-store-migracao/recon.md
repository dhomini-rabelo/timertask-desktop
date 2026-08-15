# Recon — step 01 (modelo-store-migracao)

## Mapa de arquivos
- `states/tasks/index.ts` | tipos+store zustand, tasks de todos workflows | ver memória 3.1/3.2 (base de tudo)
- `states/tasks/utils.ts` | 3 funcões de evento (rename de tipo só) | memória 3.1
- `states/tasks/scoreUtils.ts` | 4 agregadores `task.subtasks.forEach` | memória 3.1, molde `:88-124`
- `hooks/useStoredTasks.ts` | hidratação+migração+beforeunload | memória 3.1, molde `:22-37`,`:50-92`
- `hooks/useListingTasks.ts` | 31 linhas, recebe `inExecutionTaskId`, usa `.subtasks` (`:21`) | ler íntegro
- `components/IndexTasks/utils.ts` | `ListingTask{id,title,completed,isRunning}`, `getActiveTask`, `getTaskListingMode` | lido íntegro
- `IndexSubTaskItem/IndexSubTaskItem.tsx` | **NÃO está no item 6 do plan-simplified.md** mas importa `SubTask` (`:17`) e chama `deleteSubtask`(:46) `executeSubtask`(:47,71) `stopSubtask`(:48,77) `toggleSubtask`(:49,234) — quebra o build se não for editado
- `IndexTaskAccordionSubtaskItem.tsx` | importa `SubTask`(:5,9), `deleteSubtask`(:23,70), `saveEditingSubtask`(:24,54) | já está no item 6
- `IndexSubTaskItem/IndexAlertSelect.tsx`, `IndexDebugTimer.tsx` | sem acoplamento a `SubTask`/`Task` (só string "Subtask timer..." cosmética em DebugTimer:44) | não precisam edição funcional

## Molde a espelhar
Nenhum molde estrutural para o redesenho do modelo em si (o próprio plan-simplified.md já diz isso, `CLASSE: julgamento`). Para as sub-partes, os moldes já listados na memória (seção 4, linhas 135-137) se confirmam por leitura direta.

## Footprint (complemento ao já mapeado na memória)
- `IndexSubTaskItem.tsx:32` `task: SubTask` só lê `task.id/.title/.completed/.isRunning/.timeEvents` — **shape compatível 1:1** com o novo `Task` (que carrega esses 5 campos + `type/groupId/workflowId/note`), então basta trocar o import do tipo, sem alterar leitura de campos.
- `IndexSubTaskItem.tsx` tem prop `isActive` que hoje decide: mostra `Timer`+play/stop+check quando `true` (`:170-181`,`:217-242`); mostra editar/apagar quando `false` (`:196-215`); **mas quando `isActive=true` o bloco `:248-291` também renderiza editar/apagar/alertSelect/debugTimer** — ou seja, chamar sempre com `isActive={true}` reaproveita o layout expandido inteiro (timer+play/stop+edit+delete) sem tocar no JSX. Isso é o caminho mecânico mínimo citado no plan; **não está registrado em lugar nenhum do plan/memória**, é achado deste recon.
- `useListingTasks.ts` confirmado: `ListingTask[]` = ou `activeTask.subtasks` ou `workflowTasks` (`:20-21`); `activeTasks`/`completedTasks` particionam por `.completed` (`:22-23`) — o alvo (memória) já pede que devolva grupos/raiz/concluídas separados, então essa função é reescrita, não só ajustada.

## Armadilhas (complemento)
- **Gap no plan**: `plan-simplified.md` item 6 lista 9 componentes + `shared-state.ts` mas **omite `IndexSubTaskItem/IndexSubTaskItem.tsx`**, que é justamente o componente citado na mesma seção para ser "reaproveitado como item". Sem editá-lo (rename do tipo + troca das 4 chamadas de ação), `tsc` quebra. O planner precisa adicionar esse arquivo à lista.
- Todo o footprint (16 arquivos) depende do mesmo `states/tasks/index.ts` (tipos e nomes de ação); não há dois arquivos que possam ser fechados sem o índice estar decidido primeiro.

## Sinal de teste
Não encontrado nenhum teste automatizado (`T9`, confirmado). Modo = browser (`npm run dev`), conforme já definido no plan-simplified.md.

## Veredito de complexidade
1. Uma frente só? **sim** — só frontend (store zustand + React), nada em `src-tauri/`.
2. Footprint ≤ 6 arquivos? **não** — 16 arquivos reais a editar (5 de estado/hook + 11 de UI, incluindo o `IndexSubTaskItem.tsx` que faltava no plan).
3. Molde/irmão claro? **não** — o próprio plan classifica como `julgamento`; só sub-partes (migração, agregadores) têm molde, a forma geral do redesenho não.
4. Zero decisão de arquitetura em aberto? **não** — lista final de nomes de ação ainda "o planner do step 01 fecha" (memória §2), e o tratamento do `isActive`/reaproveitamento do `IndexSubTaskItem` não estava mapeado.
5. Zero lógica nova não-trivial? **não** — migração idempotente com discriminação de formato legado (flatMap grupo→[grupo,...filhos]) é lógica nova, mesmo com mold parcial.

`veredito: complexa — falha nos critérios 2, 3, 4 e 5 (footprint de 16 arquivos, sem molde estrutural, decisões de nomes/reuso em aberto, migração é lógica nova)`

## Sinal de partição
`partição: não` (só (a) — nova taxonomia de tipos que os steps 02-04 vão consumir — se aplica; não há suíte de testes própria, T9). Partição de ESCOPOS DE IMPLEMENTAÇÃO pedida no contexto: é **sequencial, não paralelizável em footprints disjuntos**. Toda a UI (11 arquivos) e os hooks (`useStoredTasks`, `useListingTasks`) importam nomes de tipo/ação de `states/tasks/index.ts`; nenhum pode ser fechado antes desse arquivo estar decidido. Divisão recomendada em 2 lotes SEQUENCIAIS (não paralelos, pois o lote 2 só compila depois do lote 1 congelar a API): Lote A = `states/tasks/{index,utils,scoreUtils}.ts` + `hooks/{useStoredTasks,useListingTasks}.ts` (5 arquivos, camada de estado); Lote B = os 11 arquivos de UI (`shared-state.ts` primeiro dentro do lote, pois `IndexTasks/IndexAddInput/IndexEditInput/IndexSubTaskItem` o importam). Um único implementador cobrindo os 2 lotes em sequência é mais seguro que dois implementadores em paralelo, dado o acoplamento total via `index.ts`.
