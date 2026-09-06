APPROVED_WITH_RESALVAS

# Review r2 — layout-task-card (delta do fix, commit 6d69c49)

Escopo desta rodada: **apenas** o último commit. A r1 é linha de base; nada já aprovado foi re-revisado.
Type-check já rodou pelo orquestrador (exit=0) — não re-executado.

## As ressalvas de r1 endereçadas: resolveram de fato?

| r1 | Fix | Veredito |
|---|---|---|
| R1 — `useListingTasks()` por linha (O(N²) + assinatura de `state.items`) | `GroupTitleContext` provido em `IndexGroupTasksList.tsx:53`, consumido em `IndexTaskItem.tsx:65` | **Resolvido.** `IndexTaskItem` não importa mais `useListingTasks`; volta a assinar só `actions.*` + o átomo local. Ver "cobertura do Provider" abaixo |
| R2 — rótulo "Active" dentro do scroll | `IndexActiveTasksList.tsx:73-89` — wrapper externo sem `max-h`, `<span>Active</span>` fora, `max-h-[520px] overflow-y-auto` no div interno | **Resolvido** |
| R3(a) — a11y do scroll | `IndexActiveTasksList.tsx:79-81` (`tabIndex/role="region"/aria-label`) e `IndexGroupTasksList.tsx:65-67` | **Resolvido com ressalva** (achado 1) |
| R5 — semântica de "Sessions" | `scoreUtils.ts:90-98` conta 1 por task | **Mudou a semântica; coerente internamente, rótulo discutível** (achado 4) |
| R6 — recomputação duplicada | `IndexScore.tsx:46-48` deriva de `totalFocusedTime/totalSessions` | **Resolvido com ressalva** (achado 3) |
| R7 — header sumia no boot | `page.tsx:67-75` | **Resolvido** (verificação abaixo) |
| R8 — `type Section` duplicado | `IndexActiveTasksList.tsx:17,42` importa `TaskActivityStatus` (`utils.ts:104`) | **Resolvido** |
| R3(b) DragOverlay / R4 feedback de drop | fora de escopo por decisão | Registrado, não é achado novo |

## Verificações pedidas

**Cobertura do `GroupTitleContext` — OK, todos os caminhos.** Só existem dois pontos de render de `IndexSortableTaskItem`:
`IndexActiveTasksList.tsx:26` (nível raiz) e `IndexGroupTasksList.tsx:70` (dentro do Provider). O nível raiz só recebe
itens de `activeListItems`, que por construção é `grupo || task com groupId === null` (`useListingTasks.ts:26-30`) —
logo a task standalone cai no default `undefined` do contexto e **não** exibe badge de grupo. O único outro render de
filhos de grupo é `IndexTaskGroup.tsx:180 -> IndexGroupTasksList`, sempre dentro do Provider. O early-return de grupo
vazio (`IndexGroupTasksList.tsx:48-50`) não renderiza item algum.
**Sem regressão vs. a derivação anterior**: `task.groupId ? groups.find(...)?.title : undefined` produzia exatamente os
mesmos dois resultados (inclusive `title === ""`, falsy nos dois caminhos, `IndexTaskItem.tsx:206`).

**`page.tsx` — hidratação e gates: OK.** `IndexHeader` está num único ponto (`page.tsx:68`), mesma posição e mesmo tipo
em todos os estados de permissão, só a prop `showOnlyLogo` muda → React preserva a instância, sem remount. E
`useStoredWorkflows()` é chamado em `IndexHeader.tsx:13`, **antes** do early-return de `showOnlyLogo`
(`IndexHeader.tsx:28-34`), então a hidratação de workflows volta a começar no primeiro paint, sem esperar
`isPermissionGranted()`. `hasInitializedPermissionStatus` agora só porteia Timer/Score (`page.tsx:69`) e o par
NotificationRequest/Tasks (`page.tsx:76-83`) — nada além disso depende dele. Item 4 preservado: card full-width
empilhado (header -> timer -> stats) e Active/Paused/Pending abaixo.

**`scoreUtils`/`IndexScore` — coerência.** `totalSessions` e `totalFocusedTime` são ambos all-time, então
`Avg / session = totalFocusedTime / totalSessions` (`IndexScore.tsx:47-48`) é internamente coerente. Uma task retomada
em dias diferentes conta **1** sessão e sua média é o tempo total dela — coerente com a regra declarada no comentário.
"Today's Focus" continua sendo a única métrica de recorte diário, convivendo com métricas all-time como já era antes do
fix. Sem migração de schema: tudo derivado de `timeEvents`. As 4 métricas do item 5 estão presentes
(`IndexScore.tsx:55,68,75,88`) no grid `grid-cols-2 md:grid-cols-4` (`IndexScore.tsx:111`) — o grid continua com 8 cards,
igual à linha de base aprovada em r1, não é achado novo.

## Ressalvas (não bloqueiam o system test)

**1 — `IndexGroupTasksList.tsx:66`: `role="list"` sem filhos `listitem`.**
Os filhos são `IndexSortableTaskItem`, cujo nó raiz é um `<div>` sem role (`IndexSortableTaskItem.tsx:28`). ARIA exige
que um `role="list"` possua filhos `listitem` (axe: `aria-required-children`) — do jeito atual o leitor de tela anuncia
uma lista vazia. Correto: usar `role="region"` (é o que o irmão faz em `IndexActiveTasksList.tsx:80`, e mantém os dois
containers consistentes) ou pôr `role="listitem"` no wrapper de `IndexSortableTaskItem.tsx:28`. O `tabIndex={0}` +
`aria-label` estão certos nos dois.

**2 — import circular: `IndexTaskItem.tsx:26` <-> `IndexGroupTasksList.tsx:20`.**
`IndexGroupTasksList -> IndexSortableTaskItem -> IndexTaskItem -> IndexGroupTasksList`. Não quebra hoje porque
`GroupTitleContext` só é lido em tempo de render (`IndexTaskItem.tsx:65`), nunca na avaliação do módulo, e não há
`import/no-cycle` no `eslint.config.js`. Mas é frágil: qualquer uso top-level futuro do binding cai em TDZ. Correto:
mover o `createContext` para um módulo folha ao lado (ex.: `IndexActiveTasksList/shared-context.ts`), no molde do
`IndexTasks/shared-state.ts` que o próprio `IndexTaskItem.tsx:25` já importa. Nota de padrão: este é o **primeiro**
`createContext` do repo (o resto do estado é jotai/zustand) — a escolha é defensável para um valor de subárvore, mas
merece morar num arquivo próprio e não pendurado no componente.

**3 — `scoreUtils.ts:101-106`: `calculateAverageSessionTime` virou código morto e duplica a fórmula.**
Nenhum consumidor restou (`grep` só acha a menção no comentário de `IndexScore.tsx:46`), e a mesma conta agora existe
inline em `IndexScore.tsx:47-48` — duas fontes que podem divergir. Correto: o que a r1/R6 sugeria — trocar a assinatura
para `calculateAverageSessionTime(totalFocusedTime, totalSessions)` e chamá-la do `IndexScore`, ou remover a função.

**4 — `scoreUtils.ts:90-98`: o rótulo "Sessions" não descreve mais o que a métrica conta.**
`executeTask` emite um evento `start` a cada retomada (`states/tasks/index.ts:346-348`), então "1 sessão por task"
significa, na prática, **"tasks que já foram iniciadas alguma vez"** — e "Avg / session" é, na prática, "média por
task". Duas consequências de leitura: (a) a métrica fica quase redundante com `In Progress` (`scoreUtils.ts:107-119` =
iniciadas e não concluídas) somada a `Tasks Completed`; (b) "Total cycles" (`IndexScore.tsx:95`, do countdown) é o que
mais se parece com "sessão" no produto. Não é bug — é coerente e sem migração. Se a intenção é medir "quantas vezes
sentei para focar", o meio-termo natural é 1 sessão por task **por dia** (o `startOfDay` já é usado em
`calculateCurrentStreak`, `scoreUtils.ts:128-130`); se a intenção é a atual, renomear para "Tasks worked" / "Avg / task"
resolve a ambiguidade.

**5 — cosmético, `page.tsx:67`: o `Box` agora é renderizado também no estado bloqueado**, virando um card com padding
`p-6` em volta de apenas o logo, com o `IndexNotificationRequest` fora dele. É o efeito colateral esperado de manter o
header montado num ponto único; vale um olhar no system test se o visual do estado "permissão negada" ficou aceitável.

## Nada bloqueante

Não encontrei cenário de entrada/estado que produza saída errada no delta. Sem regressão em task standalone
(verificado acima), sem resquício de badge "paused" reintroduzido, sem novo campo de schema, e o guard de reordenação
por seção (`IndexActiveTasksList.tsx:56-61`) segue intacto agora tipado por `TaskActivityStatus`.
