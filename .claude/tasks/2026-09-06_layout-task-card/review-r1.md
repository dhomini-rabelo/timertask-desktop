APPROVED_WITH_RESALVAS

# Review r1 — layout-task-card (commit b7c2392)

## Completude vs critérios

| Item | Situação | Evidência |
|---|---|---|
| 1 — respiro entre contagem e box do nome | OK | `IndexTaskGroup.tsx:155` — `px-4 pt-3 pb-3 flex flex-col gap-2` |
| 2 — remover badge "paused" em todos os casos | OK | `IndexTaskItem.tsx:241-254` substituiu o bloco Running/Paused; `grep -rn "Paused"` só sobra o rótulo de seção (item 4) e `wasAutoPausedRef` (lógica, não UI) |
| 3 — start/end/duration embaixo + nome do grupo ao lado do título | OK (com ressalva) | `IndexTaskItem.tsx:209-213` (badge de grupo) e `241-254` (strip), no molde de `IndexCompletedTaskItem.tsx:47-59` |
| 4 — card principal full-width empilhado, sem sidebar | OK | `page.tsx:69-76` (`flex w-full flex-col gap-6` + `Box` full-width), `IndexTimer.tsx:45` (`text-4xl`), `IndexScore.tsx:111` (`grid-cols-2 md:grid-cols-4`), `IndexTasks.tsx:20` (perdeu `max-w-[600px] ml-auto`), seções Active/Paused/Pending em `IndexActiveTasksList.tsx:73-113` |
| 5 — 4 métricas novas, zero migração | OK | `scoreUtils.ts:90/100/107` + `calculateTodayFocusedTime` (já existia, :66). Tudo derivado de `timeEvents`/`completed`; nenhum campo novo em schema |
| type-check | OK (exit=0, rodado pelo orquestrador) | — |
| sem regressão em task standalone | OK | `IndexTaskItem` continua a mesma superfície de ações; `isTimerActive` segue usado (:165,176,202,227,266); nada órfão (`noUnusedLocals: true` no `tsconfig.json:19`) |

Coerência A×B: sem exports duplicados. `formatClockTime`/`formatClockValue` foram corretamente promovidos de `IndexCompletedTaskItem` para `code/utils/date.ts` e reimportados nos dois consumidores. `getTimeRangeFromEvents` e `calculateTodayFocusedTime` já existiam — nada foi reinventado.

## Ressalvas (não bloqueiam o system test)

**R1 — `IndexTaskItem.tsx:65` chama `useListingTasks()` por linha; contradiz o molde do próprio repo e é O(N²).**
O padrão existente é o do `IndexFooter.tsx:29,89-91`: o pai monta um `groupTitleById = new Map(...)` uma vez e passa `groupTitle` como prop (`IndexCompletedTaskItem.tsx:17`). Aqui, cada `IndexTaskItem` executa o hook inteiro — que agora também deriva `activeSectionItems`/`pausedSectionItems`/`pendingSectionItems` (`useListingTasks.ts:31-47`) — e depois faz `groups.find(...)` (`IndexTaskItem.tsx:73-75`). Dois efeitos: (a) N linhas × O(N) de derivação a cada render; (b) `IndexTaskItem` passa a assinar `state.items` inteiro, coisa que antes não fazia (só assinava `actions.*`, que são estáveis) — qualquer mutação no store re-renderiza todas as linhas.
Correto: passar `groupTitle` como prop a partir de `IndexSortableTaskItem`/`IndexGroupTasksList` no molde do `IndexFooter`, ou, em último caso, um seletor estreito (`useTasksState((p) => p.state.items.find(...)?.title)`).

**R2 — `IndexActiveTasksList.tsx:74-77`: o rótulo "Active" está DENTRO do container de scroll.**
`<div className="... max-h-[520px] overflow-y-auto">` engloba o `<span>Active</span>`, então o cabeçalho da seção rola junto e some. Correto: o `max-h`/`overflow-y-auto` deve ficar num wrapper interno, com o rótulo fora dele (ou `sticky top-0` com fundo). Mesma estrutura em `IndexGroupTasksList.tsx:59` — ali o scroll já está no lugar certo (dentro do `SortableContext`, sem rótulo).

**R3 — acessibilidade/overflow do scroll interno (`IndexActiveTasksList.tsx:74`, `IndexGroupTasksList.tsx:59`).**
(a) Nenhum dos dois containers tem `tabIndex={0}` / `role="region"` / `aria-label` — usuário de teclado não consegue rolar a região nem sabe que ela existe. (b) Não há `DragOverlay` do dnd-kit: com `overflow-y-auto`, o item arrastado é recortado nos limites do container ao sair da área visível. Vale checar no system test se o drag dentro de uma lista longa (>520px) fica utilizável.

**R4 — drag entre seções é silenciosamente ignorado (`IndexActiveTasksList.tsx:53-58`).**
`if (!activeSection || activeSection !== overSection) return;` é a escolha certa para não corromper a ordem, mas o usuário não recebe nenhum feedback ao soltar um item Pending sobre um Active — o item simplesmente volta. Registrar como comportamento intencional ou adicionar um `dropAnimation`/cursor de "não permitido".

**R5 — semântica de "Sessions" (`scoreUtils.ts:90-98`) conta cada retomada.**
Cada `resume` emite um evento `start`, então pausar/retomar a mesma task três vezes registra 3 "sessions" e reduz proporcionalmente o `Avg / session` (`scoreUtils.ts:100-105`). É dado derivável e sem migração (atende o item 5), mas o rótulo pode enganar. Se a intenção é "quantas vezes você sentou para focar", está correto; se é "quantas tasks você trabalhou", a métrica é outra.

**R6 — `IndexScore.tsx:44-46`: recomputação duplicada.**
`calculateAverageSessionTime(items)` recalcula internamente `calculateTotalSessions(items)` e `calculateTotalFocusedTime(items)`, que já foram computados nas linhas 44 e 45 — quatro varreduras completas de `items` (cada uma com `sort` por task) onde bastavam duas. Correto: `calculateAverageSessionTime(totalFocusedTime, totalSessions)` recebendo os números já calculados, ou memoizar com `useMemo` sobre `items`.

**R7 — `page.tsx:59-61`: header some durante a inicialização.**
Antes, `<IndexHeader showOnlyLogo={shouldBlockContent} />` era renderizado incondicionalmente. Agora só aparece quando `shouldBlockContent` é true, ou dentro do `Box` quando `hasInitializedPermissionStatus` já resolveu. No intervalo `!hasInitializedPermissionStatus && !shouldBlockContent` (o caso normal de boot, enquanto `isPermissionGranted()` está pendente) a página fica completamente vazia — antes mostrava o logo. Efeito colateral adicional: `IndexHeader` monta `useStoredWorkflows()` (`useStoredWorkflows.ts:10`), então a hidratação dos workflows agora só começa depois de a permissão resolver, e um flip de `shouldBlockContent` desmonta/remonta o header. Correto: manter o `IndexHeader` montado fora do gate (e apenas alternar `showOnlyLogo`), ou subir `useStoredWorkflows()` para `IndexPage`.

**R8 — `IndexActiveTasksList.tsx:20`: `type Section = "active" | "paused" | "pending"` duplica `TaskActivityStatus` (`utils.ts:104`).**
Coerência A×B: importar o tipo em vez de redeclará-lo, para que qualquer novo estado seja adicionado num lugar só.

**R9 — `IndexTaskItem.tsx:241`: a strip start/end/duration é condicionada a `hasBeenStarted`.**
O molde (`IndexCompletedTaskItem`) sempre a exibe, e `formatClockValue` já foi escrito para devolver `"--:--"` num `null` — o guard torna esse fallback morto no caminho da task ativa. Se a decisão do item 3 era "sempre na parte de baixo do card", remover o `hasBeenStarted`. Não tenho certeza de qual era a intenção; deixo como pergunta, não como defeito.

**R10 — badge de grupo redundante dentro do card do grupo (`IndexTaskItem.tsx:209-213`).**
Tasks filhas renderizadas dentro do `IndexTaskGroup` já estão visualmente sob o nome do grupo, e agora repetem esse nome em cada linha. No `IndexCompletedTaskItem` o badge faz sentido porque a lista de concluídas é plana. Verificar no system test se o resultado visual é o desejado.

**R11 — `code/utils/date.ts:28` continua sem newline no fim do arquivo** (o arquivo já era assim antes; o commit só moveu a fronteira). Cosmético.

## Nada bloqueante encontrado

Não encontrei cenário de entrada/estado que produza saída errada. A derivação active/paused/pending (`utils.ts:106-133`) está correta e sem migração: `isRunning` → active, `timeEvents` com algum `start` → paused, caso contrário pending; para grupos, `getGroupActivityStatus` ignora filhos concluídos antes de agregar, que é o comportamento esperado (um grupo com 3/3 filhos concluídos mas ainda não fechado cai em "pending", o que é aceitável já que o card oferece o botão de concluir). O guard de reordenação por seção evita o único bug real que essa quebra em três listas poderia introduzir.
