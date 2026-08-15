## Mapa de arquivos

- `src/pages/index/components/IndexTasks/IndexActiveTasksList/IndexSubTaskItem/IndexSubTaskItem.tsx` | item único a virar molde final (renomear/mover) | 1-288
- `src/pages/index/components/IndexTasks/IndexActiveTasksList/IndexSortableTaskItem.tsx` | wrapper DnD; hoje passa `isActive` fixo `true` | 1-37 (prop em 32)
- `src/pages/index/components/IndexTasks/IndexActiveTasksList/IndexActiveTasksList.tsx` | lista + DndContext, sem lógica de 2 níveis | 1-53 (já limpo)
- `src/pages/index/components/IndexTasks/IndexTasks.tsx` | título/breadcrumb/empty states | 1-48 (JÁ reduzido: título "Tasks" fixo, sem breadcrumb, empty state com 1 ternário)
- `src/pages/index/components/IndexTasks/IndexAddInput.tsx` | input de criar task | 1-41 (JÁ sem `listingMode`/`taskId`)
- `src/pages/index/components/IndexTasks/IndexActiveTasksList/shared-components/IndexEditInput.tsx` | edição inline | 1-70 (JÁ sem `listingMode`)
- `src/pages/index/components/IndexTasks/shared-state.ts` | `indexTasksPageStateAtom{editingTaskId}` + `errorMessageAtom` | 1-11 (JÁ sem `inExecutionTaskId`/`nonActiveExpandedTaskId`)
- `src/pages/index/components/IndexTasks/IndexActiveTasksList/IndexTaskNoteDialog.tsx` | dialog de nota (a plugar no item unificado) | 1-121, uso: `taskId`+`label` (:74, :107 do arquivo apagado)
- `src/pages/index/components/IndexTasks/IndexFooter/IndexCompletedTaskItem.tsx` | único consumidor atual de `IndexTaskNoteDialog` — molde de uso | :74
- `src/pages/index/hooks/useListingTasks.ts` | deriva `activeTasks`/`tasks`/`completedTasks` de `items` | 1-27 (sem `inExecutionTaskId`, já nível único)
- `src/pages/index/hooks/useStoredTasks.ts` | persistência localStorage + `beforeunload` | 118-200, ver Armadilha abaixo (:149-184)
- `src/pages/index/states/tasks/index.ts` | store: `Task`/`TaskGroup`/`TaskItem`, `executeTask`/`stopTask` sem exclusividade, guard de reorder em item rodando | :17-23 (Task), :270-275 (guard reorder), :311-367 (execute/stop)
- `src/pages/index/states/tasks/utils.ts` | `calculateTotalTimeInSeconds`, `shouldAutoStart` (usa `timeEvents.at(-1).type==="start"`) | 1-76
- `src/layout/components/common/Timer/hooks/useCountUpTimer.ts` | 1 instância por chamada, `autoStart` só lido no mount (`useEffect([], )`) | 14-94

## Molde a espelhar

`IndexSubTaskItem.tsx` é o corpo (timer, play/stop, alerta, debug, guards). Falta absorver de
`IndexTaskItem.tsx` (apagado, ver `git show 8185c5c:...IndexTaskItem.tsx`): drag handle idêntico
(`!task.isRunning && <div {...dragHandleProps}>`, já presente em `IndexSubTaskItem.tsx:155-162`,
nenhuma mudança necessária); badge "Running/Paused" (bolinha verde pulsante/vermelha + texto,
ausente hoje em `IndexSubTaskItem.tsx`, no molde antigo ficava logo abaixo do header, condicionado a
"subtask ativa com timeEvents startado"); botão de nota via
`<IndexTaskNoteDialog taskId={task.id} label="Notes" />` (molde de uso real em
`IndexCompletedTaskItem.tsx:74`, `IndexTaskNoteDialog` já existe e não precisa mudar).

## Footprint

- `IndexActiveTasksList/IndexSortableTaskItem.tsx:30-34` | única chamada de `IndexSubTaskItem`, passa `isActive` hardcoded `true` e `dragHandleProps` — remover a prop aqui junto com o componente
- `IndexActiveTasksList/IndexActiveTasksList.tsx:47-49` | usa só `IndexSortableTaskItem`, não referencia `IndexSubTaskItem` direto
- `IndexTasks.tsx` | não importa `utils.ts`/`getActiveTask`/`getTaskListingMode` (já removidos no step 01) — nada a limpar aqui além de reconfirmar
- `states/tasks/index.ts:270-275 (reorderItems)` | já bloqueia reorder se `activeItem`/`overItem` isRunning — nenhuma mudança pedida por este step
- Nenhum arquivo fora de `IndexTasks/` importa `IndexSubTaskItem`, `IndexTaskItem` ou `utils.ts` (`grep -rn` vazio para os três)

## Armadilhas

- **T7 já respeitada estruturalmente**: cada `IndexSubTaskItem` chama seu próprio `useCountUpTimer` (linha 54); ao virar 1 componente por task de nível 1 isso continua igual, só o efeito de sync (linha 111-116) já reage a `isGlobalTimerRunning` isolado por instância — não precisa de mudança de forma, só remover a leitura de `isActive`.
- **Item 6 (limpeza de navegação) e item 7 (textos) do plano JÁ FORAM FEITOS pelo step 01**: `shared-state.ts`, `utils.ts` (apagado), `IndexEditInput.tsx`, `IndexAddInput.tsx`, `IndexTasks.tsx` não têm mais rastro de `listingMode`/`inExecutionTaskId`/`nonActiveExpandedTaskId`/breadcrumb. `IndexTaskAccordionSubtaskItem.tsx` não existe no diretório. Confirmar no plano final que os itens 6 e 7 do IN já estão satisfeitos (planner deve marcar como "sem ação" e não regredir).
- **Bug pré-existente em `useStoredTasks.ts:149-184`**: no `beforeunload`, quando a task estava rodando, o handler grava um evento `stop` mas mantém `isRunning: true` (linha 169, deveria ser `false`) — após recarregar a página o `Task.isRunning` continua `true` mesmo com o timer contabilizado como parado (`shouldAutoStart` retorna `false` porque o último evento é `stop`, então o timer local não autoinicia). Como o item 2 do plano faz a borda/fundo verde refletir `task.isRunning` diretamente (hoje reflete só `isActive`), esse mismatch fica VISÍVEL pela primeira vez: task aparece com borda "rodando" após reload mas o botão mostra Play. O cenário de teste do sistema pede exatamente reload + "nenhuma retoma sozinha" (T4) — decidir explicitamente se corrige essa linha ou se é aceito como está (não é regressão introduzida por este step, mas fica exposto por ele).
- `useCountUpTimer.ts:70-80` só lê `autoStart` no mount (`useEffect(..., [])`); se `isRunning` mudar depois via prop sem remount, o timer não reage sozinho — o sync atual depende do `useEffect` de `IndexSubTaskItem.tsx:111-116` chamar `timerActions.stop()` manualmente; ao generalizar para N tasks, cada instância continua isolada, então isso já funciona por item, só confirmar que a task `key` no map (`IndexSortableTaskItem`/`IndexActiveTasksList.tsx:47`) usa `task.id` (usa) para não remontar sem necessidade.
- Alarme (`IndexSubTaskItem.tsx:118-138`): compara `timerState.currentTimeInSeconds` por igualdade exata e cria `new Audio` a cada disparo (T6); ao rodar N instâncias em paralelo, cada `IndexSubTaskItem` já é isolado, então N alarmes tocando ao mesmo tempo é o comportamento esperado (não uma regressão a criar) — só não regredir criando um efeito compartilhado.
- React Compiler (T8): todo `set`/`map` no store já é imutável; manter o padrão ao mexer no componente fundido.

## Sinal de teste

Não encontrado (sem testes automatizados no repo). Sinal de sistema: `npx tsc --noEmit` limpo, depois roteiro manual via `npm run dev` (porta 1420) cobrindo N timers em paralelo, pausa/retomada do timer global, conclusão de uma task sem afetar outra, guard de timer global parado, e reload com verificação de T4 (ver bug acima). DnD (dnd-kit) não é testável por automação neste ambiente — registrar como "Not run".

## Veredito de complexidade

1. Uma frente só? **sim** — só frontend React, nada em `src-tauri/` (confirmado por grep, nenhum resultado de import cruzado).
2. Footprint de no máximo 6 arquivos a criar/editar? **não** — mínimo: `IndexSubTaskItem.tsx` (fusão+rename), `IndexSortableTaskItem.tsx` (remover prop `isActive`), possível pasta renomeada (git mv), mais decisão sobre `useStoredTasks.ts:169` (bugfix ou não) = já 3-4 arquivos certos, mas a fusão de comportamento (badge, nota, progressive disclosure, sync por-item) é decisão de design não mecânica, então o número real depende de quantos trechos do `IndexTaskItem.tsx` apagado o planner decidir portar.
3. Existe molde/irmão claro para espelhar? **sim** — `IndexSubTaskItem.tsx` é o corpo e `IndexTaskItem.tsx@8185c5c` fornece badge/nota, ambos localizados e lidos nesta recon.
4. Zero decisão de arquitetura/produto em aberto? **não** — falta decidir: (a) nome final do arquivo/pasta (plano deixa a critério do planner), (b) se corrige o bug de `isRunning` pós-reload em `useStoredTasks.ts:169` dado que agora fica visível, (c) onde exatamente entra o botão de nota e o badge Running/Paused no novo layout linear (o corpo antigo tinha 2 blocos empilhados: header + linha de status).
5. Zero lógica/algoritmo novo não-trivial? **sim** — é fusão de dois componentes existentes + generalização de um efeito já isolado por instância; nenhum algoritmo novo.

veredito: complexa — falha 2 (footprint real depende de decisões de fusão) e falha 4 (3 decisões de produto em aberto: nome do componente, bugfix do reload, posicionamento do badge/nota no layout).

## Sinal de partição

partição: não (é um único componente fundido + ajustes pontuais em consumidores; não introduz módulo novo nem suíte de testes própria).
