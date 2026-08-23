APPROVED_WITH_RESALVAS

# Review r1 — task-grupo-done (nonce: validate-task-grupo-done-r1)

Base `4628ffc` → impl `60911a0`, 7 arquivos / +155 −17. Escopo revisado: exatamente os 7 arquivos da lista.

## 1. Completude vs decisoes vinculantes

| Decisao | Status | Onde |
|---|---|---|
| Gate: >=1 subtask E 100% concluidas; grupo vazio nao conclui | OK | `states/tasks/utils.ts:99` (`canCompleteGroup`: `children.length > 0 && every(completed)`), aplicado na UI (`IndexTaskGroup.tsx:112` `disabled`) **e** no store (`states/tasks/index.ts:209-212`) — defesa dupla, correto |
| Sem cascata | OK | `toggleGroup` so faz spread do proprio group; nao toca em nenhum item filho |
| `toggleTask` intocado | OK | diff nao altera `toggleTask` (`index.ts:173-196` inalterado) |
| Pos-conclusao: sai da lista ativa | OK | `useListingTasks.ts:23` (`isTaskGroup(item) && !item.completed`) |
| Aparece em "completed" do footer como linha de grupo (titulo + "N of N completed") + reabrir | OK | `IndexFooter.tsx:82-84` + `IndexCompletedTaskGroup.tsx:29-47` |
| Acao nova `toggleGroup(id)` | OK | `index.ts:197-219`, tipada em `TasksActions` (`index.ts:51`) e exposta (`index.ts:407`) |
| Botao Check no cluster de hover ao lado de Edit/Delete, sem gate `isTimerActive` | OK | `IndexTaskGroup.tsx:109-127`, dentro do wrapper `opacity-0 group-hover:opacity-100`; nao le `isTimerActive` |
| Migracao: grupos antigos abrem nao-concluidos | OK | `useStoredTasks.ts:48` `completed: !!entry.completed` — entrada legada nao tem o campo → `false`; e preserva o estado gravado pela versao nova (hardcodar `false` quebraria "reload preserva o estado") |
| Ramo `subtasks` deriva `completed` das subtasks respeitando o gate | OK | `useStoredTasks.ts:78` |
| `group.completed` e fonte da verdade; sem auto-reopen | OK | nenhum ponto recalcula/limpa `completed` a partir dos filhos em runtime |
| "X of Y completed" e ProgressBar do footer contam so folhas | OK | `IndexFooter.tsx:24-28,57` continuam sobre `tasks`/`completedTasks` (`useListingTasks` filtra por `isTask`); `completedGroups` entra apenas no `hasCompletedItems` (gate de expandir) e na lista renderizada |
| `states/reports/sync.ts` fora de escopo | OK | nao tocado |

Os 3 sitios que constroem `TaskGroup` preenchem `completed`: `index.ts:166`, `useStoredTasks.ts:48`, `useStoredTasks.ts:78`. Nao existe 4o sitio (`grep 'type: "group"'` → exatamente esses 3 + a declaracao do tipo). Persistencia confirmada: `useStoredTasks.ts:195-199` grava `items` inteiros a cada mudanca, e o ramo `type === "group"` do `migrateEntry` le o campo de volta → **reload preserva o estado**.

## 2. Armadilha do enunciado — estado inconsistente pos-conclusao: VERIFICADO, sem buraco

Rastreei todos os caminhos que poderiam reabrir/adicionar subtask de um grupo ja `completed`:

- `toggleTask` tem **um unico** call site na app: `IndexTaskItem.tsx:216`, e o botao Check so renderiza sob `isTimerActive`. `IndexTaskItem` de subtask so e montado por `IndexGroupTasksList`, que so e montado dentro do card do grupo — que sai da arvore quando `group.completed`.
- `IndexCompletedTaskItem` (linha de task no footer) **nao tem** botao de reabrir — so nota e expandir eventos.
- `addTask(title, groupId)` com groupId so e chamado de `IndexTaskGroup.tsx:82` (input dentro do card, tambem desmontado); `IndexAddInput` sempre chama `addTask(title, null)`.

Conclusao: com o grupo concluido nao existe caminho de UI para reabrir uma subtask nem para adicionar filho, logo o estado "grupo completed com filho pendente" e inalcancavel por interacao — nao ha task orfa (invisivel na lista ativa e ausente do footer). O comportamento resultante e coerente. Unica porta de entrada e localStorage editado a mao (ver ressalva 3).

## 3. Padroes do repo

- `toggleGroup` copia exatamente a forma de `toggleTask`/`deleteItem` (`set((store) => ({ state: {...}, actions: store.actions }))`) — fiel. `getGroupChildren` roda no maximo 1x por chamada (o early-return de id vem antes), sem O(n²).
- `utils.ts` mantem `import type ... from "./index"` (type-only). Por isso `getGroupChildren` usa `item.type === "task"` em vez do guard `isTask`: importar o guard (valor) criaria ciclo de runtime, ja que `index.ts` agora importa `./utils`. Escolha correta e consistente com o arquivo.
- Extracao de `getGroupChildren`/`getGroupProgress` remove a duplicacao entre `IndexTaskGroup` e o novo componente — bom.
- `IndexCompletedTaskGroup` espelha o card de `IndexCompletedTaskItem` (mesmo container, mesmo circulo verde, `text-Blue-400 hover:text-Blue-500` do botao). `twMerge` ja e padrao do repo (`IndexFooter`).
- Nenhum CLAUDE.md / prettier / lint rule no repo contradiz o codigo novo.

## 4. Ressalvas (registrar, nao bloqueiam)

1. `src/pages/index/hooks/useListingTasks.ts:14` (e `:30`) — `activeGroups` e derivado e retornado, mas nenhum consumidor o usa. Nao e novidade: `activeTasks`, `activeRootTasks`, `rootTasks` e `workflowItems` ja eram exports nao consumidos do mesmo hook, entao segue o padrao existente. Remover so se quiserem parar de crescer essa cauda.
2. `src/pages/index/components/IndexTasks/IndexFooter/IndexCompletedTaskGroup.tsx:24` — falta o espacador `<div className="w-5 h-5" />` que `IndexCompletedTaskItem.tsx:50` tem antes do circulo verde (ele alinha com a coluna do grip). Resultado: na lista de completed, o circulo da linha de grupo fica ~20px a esquerda dos circulos das linhas de task. Correto seria adicionar o mesmo espacador (ou aceitar a diferenca como hierarquia visual deliberada).
3. `src/pages/index/hooks/useStoredTasks.ts:48` — o ramo `type === "group"` confia no `completed` gravado sem revalidar o gate. Um localStorage com `{"type":"group","completed":true}` e zero/parciais filhos hidrata concluido e renderiza "0 of 0 completed" no footer. E o comportamento que as decisoes pedem (`completed` e fonte da verdade, sem auto-reopen), entao registro como risco conhecido, nao como bug. Se quiserem endurecer: `completed: !!entry.completed` → so `true` quando o gate passar sobre os filhos ja migrados (exigiria migrar em duas passadas, custo alto para um caso que a UI nao produz).
4. `src/pages/index/hooks/useStoredTasks.ts:78` — `subtasks.length > 0 &&` e redundante dentro do `if (subtasks.length > 0)` acima. Cosmetico.
5. Cosmetico de formatacao: quebras de linha manuais onde a linha caberia inteira — `src/pages/index/states/tasks/utils.ts:77-80` (assinatura de `getGroupChildren`) e `:89-91`, e `src/pages/index/components/IndexTasks/IndexFooter/IndexFooter.tsx:21-22`. Sem prettier configurado no repo, so nao bate com o estilo dos vizinhos.

## 5. Nao encontrado

Nenhum criterio de aceitacao silenciosamente descartado, nenhum caller/tipo/migracao faltando, nenhum guard removido, nenhum cenario de falha concreto (input/estado → saida errada).
