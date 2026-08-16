APPROVED_WITH_RESALVAS

# Validação r1 — step 02 `sincronizacao-diaria-de-tasks-e-ciclos`

Base `ea680c6`, branch `main`. Revisados apenas os 3 arquivos do escopo. Nenhum type-check/teste
re-executado (já rodou: exit=0).

## Escopo do diff — OK

`git status` (a favor do critério 2): só `src/pages/index/components/IndexTasks/IndexTasks.tsx`
modificado + os dois arquivos novos (`states/reports/sync.ts`, `hooks/useReportsSync.ts`). Os arquivos
declarados SÓ-LEITURA (`states/reports/index.ts`, `states/reports/utils.ts`, `hooks/useStoredReports.ts`,
`states/tasks/*`, `states/countdownTimer.ts`, `IndexScore.tsx`, `useStoredTasks.ts`) estão intocados —
contrato do step 01 permanece CONGELADO. O diff de `IndexTasks.tsx` é exatamente 1 import + 1 chamada +
1 comentário; JSX intocado.

## Decisões vinculantes — conferidas uma a uma

1. **Gate de hidratação por ordem de hooks** — OK. `IndexTasks.tsx:12-15`:
   `useStoredTasks()` → `useStoredReports()` → `useReportsSync()`. Efeitos passivos do mesmo componente
   disparam na ordem de declaração, e a hidratação de `useStoredReports.ts:15-38` é síncrona
   (`localStorage.getItem` + `set` do zustand), então a leitura imperativa em `useReportsSync.ts:23`
   já enxerga o mapa hidratado no mesmo commit de mount. Nenhum `hasHydrated` novo foi criado.
   Rede de segurança presente: `Math.max` de ciclos (`useReportsSync.ts:31-34`) e merge que nunca
   remove id do disco (`sync.ts:72-88`).
   Observação: no primeiro run o `items` capturado no render ainda é o pré-hidratação (`[]`). Isso é
   inofensivo justamente por causa da rede de segurança — o merge preserva as tasks do disco e o efeito
   re-roda assim que `items` hidrata. Verificado: não há caminho destrutivo nesse run.
2. **`dayKey` dentro do efeito, fora das deps** — OK. `useReportsSync.ts:20-21` calcula
   `new Date()`/`getDayKey(now)` no corpo do efeito; deps `[items, workflows, totalCycles, upsertDailyEntry]`
   (linha 59) não contêm data. T8 OK: usa `getDayKey` (date-fns `format`, local), zero `toISOString().slice(0,10)`.
3. **Merge monotônico por campo** — OK. `sync.ts:80-81`:
   `secondsToday: Math.max(liveTask.secondsToday, existingTask.secondsToday)` e
   `completedAt: liveTask.completedAt ?? existingTask.completedAt` (`??`, não `||` — T3 OK).
   Demais campos vêm do vivo via spread, conforme P11.
4. **Não criar entrada vazia** — OK. `useReportsSync.ts:50-52`.
5. **GUARDA ANTI-LOOP DUPLA (T4)** — OK, as duas metades presentes e corretas:
   - metade reativa: `grep` no hook retorna uma única ocorrência de `entriesByDate`, que é a leitura
     IMPERATIVA `useReportsState.getState().state.entriesByDate[dayKey]` (`useReportsSync.ts:23`).
     Nenhum seletor reativo sobre reports além da action.
   - a action selecionada (`useReportsSync.ts:13`) é referência ESTÁVEL: `states/reports/index.ts:38-43`
     preserva `actions: store.actions` em todo `set`, e as funções são criadas uma vez no `create`.
     Portanto a própria escrita não invalida a dep e não reagenda o efeito.
   - metade de conteúdo: `areEntriesEqual(existing, nextEntry)` corta a escrita (`useReportsSync.ts:54-56`),
     necessário porque `upsertDailyEntry` sempre devolve objeto novo (`states/reports/index.ts:56-59`).
   - fechamento do loop pelo outro lado: `useCountdownTimerState` é lido com seleção FINA de
     `totalCycles`, então o `setInterval` de `countdownTimer.ts:106` (que muda `currentTimeInSeconds`
     a cada segundo) não re-renderiza nem re-dispara o efeito. Nenhum `setInterval`/`setTimeout`/
     `beforeunload`/`useState` no código novo (grep limpo).
6. **Delta de ciclos** — OK e correto no ponto crítico. `useReportsSync.ts:36-40`: soma apenas
   `if (previous !== null && totalCycles > previous)`; quando `totalCycles` CAI (reload zera para 0 —
   `countdownTimer.ts:296` — ou remount) o código apenas realinha `previousTotalCyclesRef`, sem
   subtrair nem zerar. Confirmado que `goBackToWork` (`countdownTimer.ts:205`) é o ÚNICO incremento do
   app e que `reset()` (`countdownTimer.ts:166-185`) NÃO mexe em `totalCycles`.
   Cenário do roteiro (ciclo → reload → ciclo) rastreado à mão: acumulado 1 → reload zera `totalCycles`,
   entrada do disco tem `cycles: 1`, mount faz `acumulado = existing.cycles = 1` e `previous = 0` →
   `goBackToWork` leva `totalCycles` a 1 → delta 1 → `cycles === 2`. Correto.
7. **Reuso de `calculateTaskTimeToday`** — OK (`sync.ts:3,25`). `calculateTasksCompleted` NÃO é
   importado nem usado (T7 OK). `useListingTasks` NÃO é usado no hook — a projeção percorre
   `items.filter(isTask)` global, todos os workflows (P8 OK).
8. **`completedAt`** — OK. `sync.ts:29-39`: filtra `event.type === "complete"`, envelopa sempre em
   `new Date(event.createdAt)` (T1 OK), exige `isSameDay(eventDate, today)` e guarda o MAIS RECENTE;
   grava `.toISOString()` (string, nunca `Date`).
9. **Arquivos só-leitura** — OK (ver "Escopo do diff").

## Critérios de aceite

| Critério | Resultado |
|---|---|
| Só os 3 arquivos no diff | OK |
| Nenhuma assinatura reativa de `entriesByDate` em `useReportsSync.ts` | OK (única ocorrência é `getState()`) |
| Toda escrita passa por `actions.upsertDailyEntry` | OK — zero `setEntriesState`, zero `localStorage` no código novo |
| Sem `any` / `@ts-ignore` | OK |
| `areEntriesEqual` sem `JSON.stringify` | OK — compara 6 campos do entry + `length` + os 7 campos de cada task posição a posição (`sync.ts:118-153`) |

## T6 (Reset não apaga histórico) — provado estruturalmente

`clearItems` (`states/tasks/index.ts:295-309`) remove do `items` as tasks do workflow selecionado.
Com `items` reduzido, `buildTodayTasks` devolve menos (ou zero) tasks; em `mergeDailyTasks` a BASE é
`existingTasks.map(...)`, que devolve a entrada do disco INTACTA quando não há live com aquele id
(`sync.ts:74-76`) — nenhum id do disco é jamais removido. Como `secondsToday` é `Math.max` por id e
`completedAt` nunca volta a `null`, `focusedSeconds` (soma da lista mesclada) e `completedCount` são
monotônicos não-decrescentes dentro do dia. `cycles` idem, por `Math.max` + delta só positivo.
Nenhum caminho de redução foi encontrado.

## Ressalvas (registrar, não corrigir)

1. **`sync.ts:38` — cast `(latestCompletedAt as Date)`.** É contorno de limitação do control-flow
   analysis do TS (variável `let` atribuída dentro de callback). Não viola o critério (não é `any`
   nem `@ts-ignore`) e o `tsc` está limpo, mas é o único ponto do diff onde o tipo é forçado à mão.
   Alternativa sem cast, se algum dia incomodar: acumular `latestCompletedAtMs: number | null` e
   construir a `Date` no final.
2. **Perda de 1 ciclo exatamente na virada de dia.** Se o PRIMEIRO efeito de um dia novo for disparado
   pelo próprio `goBackToWork` (ciclo concluído logo após a meia-noite com o app aberto), o ramo de
   virada (`useReportsSync.ts:25-29`) realinha `previous = totalCycles` ANTES do cálculo do delta, e
   esse ciclo não é contado nem no dia anterior nem no novo. É consequência direta da decisão vinculante
   ("delta observado nesta transição é 0 — nenhum ciclo do dia anterior vaza para o dia novo") e do
   plano §2.3.3, então NÃO deve ser mexido neste step; fica registrado como limitação conhecida.
3. **Ciclos concluídos com `IndexTasks` desmontado não são contados.** Hoje é inalcançável —
   `page.tsx:66-74` monta `IndexTimer` e `IndexTasks` no mesmo bloco condicional, logo os dois
   desmontam juntos. Só vira problema se algum step futuro passar a montar o timer sem a lista.
4. **`focusedSeconds`/`completedCount` são sempre RECALCULADOS a partir da lista mesclada**
   (`sync.ts:99-105`). Hoje é seguro (a entrada de hoje nunca é purgada: `applyRetention` só toca
   `entry.date < windowStartKey`). Mas os steps 03/04 não podem introduzir purga de nomes na entrada
   do dia corrente sem antes rever essa recomputação — com `tasks: []` os agregados iriam a zero no
   próximo sync.

## Padrões do repo

Sem CLAUDE.md no projeto. O código novo segue o molde existente: hook em `pages/index/hooks/useXxx.ts`
com `useRef`/`useEffect` (espelha `useStoredTasks.ts:118-147`), funções puras em `states/reports/`
ao lado de `utils.ts`, `export function` (nada de arrow const exportada), aspas duplas, `date-fns` como
única lib de data, seleção fina de zustand no molde de `IndexScore.tsx:26-29`. Nada inventado.

**Veredito: APPROVED_WITH_RESALVAS — segue para o teste de sistema sem rodada de correção.**
