# plan-simplified.md — step 02 · `sincronizacao-diaria-de-tasks-e-ciclos`

> Leia `../../memoria-da-task.md` ANTES de qualquer coisa. Este arquivo só carrega o recorte do step.

## Objetivo

Alimentar a entrada do DIA CORRENTE no store criado no step 01, a partir do estado vivo do app:
tasks com tempo rastreado/conclusão hoje, horas focadas do dia e ciclos concluídos no dia. A entrada
precisa **sobreviver ao botão Reset** e ao reload.

## IN

- Uma função pura de projeção (em `states/reports/utils.ts` ou `states/reports/sync.ts`), algo como
  `buildTodayTasks(items, workflows, today): DailyReportTask[]`:
  - percorre `items.filter(isTask)` (**todos os workflows** — P8; não usar `useListingTasks`, que
    filtra pelo selecionado — memória §2.5);
  - `secondsToday` = **reuso de `calculateTaskTimeToday(task.timeEvents)`**
    (`states/tasks/scoreUtils.ts:10-56`) — não reescrever esse recorte de dia;
  - `completedAt` = ISO do evento `complete` **cujo `createdAt` cai no dia de hoje** (o mais recente);
    `null` se não houver (P6). **Não** usar `calculateTasksCompleted` — trap T7, ela não filtra por dia;
  - descarta tasks com `secondsToday === 0` **e** `completedAt === null`;
  - `workflowTitle` e `groupTitle` são SNAPSHOTS resolvidos agora (workflow pode ser renomeado/apagado
    depois): workflow via `useWorkflowsState`, grupo via o item `type:"group"` de mesmo id em `items`.
- Mesclagem da entrada de hoje (P11), na action do store:
  - índice por `id`: o que já está no disco para hoje **nunca é removido**; o que vem do estado vivo
    sobrescreve os campos das entradas de mesmo `id`;
  - `focusedSeconds` = soma de `secondsToday` da lista MESCLADA (P7 — inclui tasks não concluídas);
  - `completedCount` = quantidade de entradas mescladas com `completedAt != null`.
- Ciclos por delta (P9): `ref` com o último `totalCycles` visto; quando `totalCycles` **cresce**, soma
  a diferença em `cycles` do dia; quando **cai** (reload/`reset`), apenas atualiza a `ref` — nunca
  subtrai, nunca zera o acumulado do dia.
- Virada de dia: a chave do dia é recalculada a cada sync; ao passar da meia-noite o sync passa a
  escrever no dia novo sem tocar no anterior.
- Onde mora: um hook `useReportsSync` (ou a extensão de `useStoredReports`) montado junto com
  `useStoredTasks()` em `components/IndexTasks/IndexTasks.tsx:10`. Só pode rodar **depois** da
  hidratação do step 01 (senão sobrescreve o histórico com um estado vazio antes de ler o disco).

## OUT

- Qualquer UI (steps 03/04).
- Alterar `countdownTimer.ts` — apenas LER `totalCycles` (P10). Nada de persistir o timer.
- Alterar `IndexScore.tsx` (P10) ou `scoreUtils.ts` (só reuso; a trap T7 **não** é corrigida aqui).
- Alterar `useStoredTasks` / o formato de `timertasks:tasks` (P13).
- Recalcular ou reescrever entradas de dias anteriores (são imutáveis — P11).

## Respostas do usuário que valem para ESTE step

- **P6** "tasks feitas" = concluídas naquele dia (evento `complete` no dia).
- **P7** "horas trabalhadas" = todo tempo rastreado no dia, inclusive de tasks não concluídas.
- **P8** escopo global: todos os workflows, com `workflowTitle` guardado por linha.
- **P9** ciclos por delta de `totalCycles`, que zera a cada reload.
- **P10** `IndexScore` e `countdownTimer` intocados.
- **P11** hoje é mesclado por id; dias anteriores são imutáveis.
- **P13** nada é apagado do store de tasks.

## Arquivos / âncoras

- `src/pages/index/states/tasks/scoreUtils.ts:10-56` (`calculateTaskTimeToday`) e `:66-72`
  (`calculateTodayFocusedTime`, **código morto hoje** — reusar em vez de reescrever).
- `src/pages/index/states/tasks/index.ts:5-38` (tipos + `isTask`/`isTaskGroup`), `:169-194`
  (`toggleTask` empurra `complete`), `:295-309` (`clearItems` — o inimigo, trap T6).
- `src/pages/index/states/countdownTimer.ts:11`, `:205` (único incremento de `totalCycles`), `:296`.
- `src/pages/index/states/workflows/index.ts` (títulos dos workflows).
- Molde de `ref` espelhando estado: `src/pages/index/hooks/useStoredTasks.ts:122`, `:145-147`.
- Montagem: `src/pages/index/components/IndexTasks/IndexTasks.tsx:10`.
- **Trap T4 (a mais perigosa deste step)**: só escrever no store quando o payload calculado DIFERIR do
  que já está lá, senão o efeito entra em loop de re-render.

## Dependências de steps anteriores

Step 01 entregue: tipos do §3, store, `timertasks:reports` hidratado com retenção aplicada e a action
de upsert de UM dia. Este step **não** redefine tipos nem mexe na retenção.

## Modo de teste de sistema

**Docker+browser only** (`npm run dev` + Playwright MCP). Roteiro mínimo:
1. criar 2 tasks, rodar o cronômetro de uma delas alguns segundos, concluir uma e deixar a outra só
   com tempo; ler `timertasks:reports` e conferir a entrada de hoje — `tasks` com as duas,
   `completedAt` só na concluída, `focusedSeconds` > 0, `completedCount === 1`;
2. **clicar em Reset** e reler a chave: a entrada de hoje continua íntegra (trap T6);
3. recarregar a página e reler: nada se perdeu e nada duplicou;
4. concluir um ciclo do timer (Rest → Back to Work, `countdownTimer.ts:205`) e conferir `cycles`
   incrementado; recarregar e concluir outro — `cycles` tem de ir a 2, não voltar a 1 (P9);
5. conferir no console que não há loop de render/gravação (trap T4).

## CLASSE

**`julgamento`.** É a única lógica genuinamente nova da task: recorte de dia, mesclagem idempotente,
delta de um contador que zera sozinho e guarda anti-loop. Nenhum molde do repo faz isso.
