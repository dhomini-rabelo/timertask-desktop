# Prompt — implementador · step 02 `sincronizacao-diaria-de-tasks-e-ciclos` (escopo único)

Este arquivo é auto-contido: NÃO abra `plan.md`, `recon.md`, `plan-simplified.md`, `process.md` nem
`memoria-da-task.md`. Tudo que você precisa está aqui. Abra APENAS os arquivos de código listados
abaixo, e só nas âncoras indicadas.

**Git**: branch `main`, base `ea680c6`, working tree de código limpa. Não commitar, não criar branch.

## O que construir

Um sync que alimenta a entrada do DIA CORRENTE do store de reports (criado no step 01) a partir do
estado vivo do app. A entrada precisa sobreviver ao botão **Reset** (que apaga tasks) e ao **reload**
(que zera `totalCycles`). **Nenhuma UI neste step.**

Arquivos que você OWN (nada além destes 3 pode aparecer no diff):

1. `src/pages/index/states/reports/sync.ts` — NOVO, funções puras.
2. `src/pages/index/hooks/useReportsSync.ts` — NOVO, o hook.
3. `src/pages/index/components/IndexTasks/IndexTasks.tsx` — EDITADO, 1 import + 1 chamada + 1 comentário.

## Contrato já congelado (leia estas âncoras, não invente)

- `src/pages/index/states/reports/index.ts:3-29` — tipos `DailyReportTask` (`id`, `title`,
  `workflowId`, `workflowTitle`, `groupTitle`, `secondsToday`, `completedAt: string | null`),
  `DailyReportEntry` (`date`, `cycles`, `focusedSeconds`, `completedCount`, `tasks`, `namesPurged`) e
  a action `upsertDailyEntry(date, entry)` — **substitui o dia inteiro** e sempre devolve objeto novo
  (`:52-61`). É o ÚNICO ponto de escrita permitido. **Não editar este arquivo.**
- `src/pages/index/states/reports/utils.ts:6-8` — `getDayKey(date): string` (`yyyy-MM-dd` LOCAL).
  Use SEMPRE esta função; nunca `toISOString().slice(0,10)` (UTC erra o dia à noite em GMT-3).
- `src/pages/index/states/tasks/scoreUtils.ts:10-56` — `calculateTaskTimeToday(events): number`.
  **Reuso obrigatório**, não reescreva o recorte de dia. **NÃO** use `calculateTasksCompleted`
  (`:74-88`): apesar do nome interno, ela não filtra por dia.
- `src/pages/index/states/tasks/index.ts:5-38` — `TaskTimeEvent{type,createdAt: Date}`, `Task`
  (`groupId`, `timeEvents`), `TaskGroup`, `isTask`, `isTaskGroup`, `TaskItem`.
- `src/pages/index/states/workflows/index.ts:3` — `export interface Workflow` (`id`, `title`),
  store `useWorkflowsState` com `state.workflows`.
- `src/pages/index/components/IndexScore.tsx:26-29` — molde de SELEÇÃO FINA do zustand
  (`useCountdownTimerState((store) => store.state.totalCycles)`); copie esse estilo.
- `src/pages/index/hooks/useStoredTasks.ts:122`, `:145-147` — molde de `useRef` espelhando estado.
- `src/pages/index/components/IndexTasks/IndexTasks.tsx:10-13` — ponto de montagem.

## Parte 1 — `src/pages/index/states/reports/sync.ts` (puro, sem React, sem store)

### `buildTodayTasks(items: TaskItem[], workflows: Workflow[], today: Date): DailyReportTask[]`

1. Antes do loop, monte índices O(1): `Map<string,string>` de título por workflow id, e outro de
   título por id de grupo (a partir de `items.filter(isTaskGroup)`). Nada de `.find` dentro do loop.
2. Percorra `items.filter(isTask)` — **TODOS os workflows**. Proibido usar `useListingTasks` (ele
   filtra pelo workflow selecionado).
3. Por task:
   - `secondsToday = calculateTaskTimeToday(task.timeEvents)`;
   - `completedAt`: entre os `timeEvents` com `type === "complete"` cujo
     `isSameDay(new Date(event.createdAt), today)`, pegue o de MAIOR `createdAt` e devolva
     `.toISOString()`; senão `null`. Envelope `new Date(event.createdAt)` SEMPRE — `createdAt` é
     `Date` em memória e `string` quando vem do JSON;
   - **descarte** a task se `secondsToday === 0 && completedAt === null`;
   - `workflowTitle` = título do workflow por `task.workflowId`, `?? null`;
   - `groupTitle` = título do grupo por `task.groupId`, `?? null`;
   - copie `id`, `title`, `workflowId`.
4. Sempre objetos/arrays NOVOS (React Compiler está ligado — nunca mutar o que veio do store).

### `mergeDailyTasks(existingTasks, liveTasks): DailyReportTask[]`

Mescla por `id`, ordem estável (evita diffs espúrios quando `items` reordena):

1. Base = `existingTasks` NA ORDEM DO DISCO. Para id que também existe no live: objeto novo com os
   campos do live, EXCETO `secondsToday: Math.max(live, existing)` e
   `completedAt: live.completedAt ?? existing.completedAt`. Para id que NÃO existe no live: mantém a
   entrada do disco intacta — **nunca remover** (é o que faz o Reset não apagar o histórico).
2. Cauda = tasks do live cujos ids não estão no disco, na ordem do live.
3. Retorna `[...base, ...cauda]`; nunca mutar `existingTasks`.

### `buildDailyEntry(dateKey: string, existing: DailyReportEntry | null, liveTasks: DailyReportTask[], cycles: number): DailyReportEntry`

- `tasks = mergeDailyTasks(existing?.tasks ?? [], liveTasks)`;
- `focusedSeconds` = soma de `secondsToday` da lista MESCLADA (inclui tasks NÃO concluídas);
- `completedCount` = quantas da lista mesclada têm `completedAt !== null`;
- `namesPurged = tasks.length > 0 ? false : (existing?.namesPurged ?? false)`;
- `date: dateKey`, `cycles`.

### `areEntriesEqual(a: DailyReportEntry | null, b: DailyReportEntry): boolean`

Comparação por CONTEÚDO (comparar referência não protege: `upsertDailyEntry` sempre cria objeto novo).
`a === null` ⇒ `false`. Compara `date`, `cycles`, `focusedSeconds`, `completedCount`, `namesPurged`,
`tasks.length` e depois cada task POSIÇÃO A POSIÇÃO nos 7 campos. **Não** use `JSON.stringify`.

## Parte 2 — `src/pages/index/hooks/useReportsSync.ts`

`export function useReportsSync(): void`. Sem `useState`, sem `setInterval`/`setTimeout`, sem
`beforeunload`, sem `localStorage` (a gravação em disco já é feita por `useStoredReports`, não mexa
nele), sem importar actions de `tasks` ou de `countdownTimer` (leitura apenas).

### Seletores

```
const items       = useTasksState((store) => store.state.items);
const workflows   = useWorkflowsState((store) => store.state.workflows);
const totalCycles = useCountdownTimerState((store) => store.state.totalCycles);
const upsertDailyEntry = useReportsState((store) => store.actions.upsertDailyEntry);
```

**PROIBIDO** assinar `entriesByDate` neste hook (`useReportsState((s) => s.state.entriesByDate)`) —
é metade do loop infinito. Selecione só `totalCycles` do countdown: o store tica a cada 1s e uma
seleção larga faria o efeito rodar de segundo em segundo.

### Refs

```
const previousTotalCyclesRef = useRef<number | null>(null);
const cyclesAccumulatedRef   = useRef<number>(0);
const syncedDayKeyRef        = useRef<string | null>(null);
```

### O efeito — `useEffect(..., [items, workflows, totalCycles, upsertDailyEntry])`

Ordem EXATA das operações dentro do efeito:

1. `const now = new Date();` `const dayKey = getDayKey(now);` — a chave do dia é recalculada a cada
   sync, **dentro** do efeito (não no corpo do render: `new Date()` no render pode ser memoizado pelo
   React Compiler e daria uma dependência mentirosa). `dayKey` NÃO entra nas deps.
2. Leitura IMPERATIVA do estado de reports:
   `const existing = useReportsState.getState().state.entriesByDate[dayKey] ?? null;`
3. Mount ou virada de dia — se `syncedDayKeyRef.current !== dayKey`:
   `cyclesAccumulatedRef.current = existing?.cycles ?? 0;`
   `previousTotalCyclesRef.current = totalCycles;` (delta desta transição é 0)
   `syncedDayKeyRef.current = dayKey;`
4. Realinhamento monotônico:
   `cyclesAccumulatedRef.current = Math.max(cyclesAccumulatedRef.current, existing?.cycles ?? 0);`
5. Delta de ciclos: se `previousTotalCyclesRef.current !== null && totalCycles > previous`, some
   `totalCycles - previous` em `cyclesAccumulatedRef.current`. Se `totalCycles <= previous` (reload
   zera o contador, ou reset do timer): **não subtraia, não zere** — apenas realinhe. Em todos os
   casos, ao final: `previousTotalCyclesRef.current = totalCycles;`
6. `const liveTasks = buildTodayTasks(items, workflows, now);`
7. `const nextEntry = buildDailyEntry(dayKey, existing, liveTasks, cyclesAccumulatedRef.current);`
8. Se `existing === null && nextEntry.tasks.length === 0 && nextEntry.cycles === 0` ⇒ `return;`
   (não criar entrada vazia só porque o app abriu).
9. Se `areEntriesEqual(existing, nextEntry)` ⇒ `return;` **(guarda anti-loop obrigatória)**.
10. `upsertDailyEntry(dayKey, nextEntry);`

As duas metades da guarda anti-loop são obrigatórias: deps sem nada derivado de `entriesByDate` (a
própria escrita não reagenda o efeito) **e** a comparação de conteúdo do passo 9.

## Parte 3 — `IndexTasks.tsx`

Adicione o import e chame `useReportsSync();` como **3ª linha** do componente, logo depois de
`useStoredReports()` e antes de `useListingTasks()`. Ponha um comentário de UMA linha dizendo que a
ordem é load-bearing (o sync lê o store já hidratado por `useStoredTasks`/`useStoredReports` no mesmo
commit de mount, via `getState()`). **Não toque no JSX** — a UI é de outro step.

## Fora de escopo (não faça)

- Qualquer UI/botão/dialog; qualquer alteração em `countdownTimer.ts`, `IndexScore.tsx`,
  `scoreUtils.ts`, `useStoredTasks.ts`, `useStoredReports.ts`, `states/reports/index.ts`,
  `states/reports/utils.ts` ou no formato de `timertasks:tasks`.
- Recalcular/reescrever entradas de dias anteriores — são imutáveis.
- Testes automatizados: **não existe runner nem suíte neste repo**. Não crie `*.test.ts`, não instale
  vitest, não rode `npm test`. A validação é feita depois por outro agente, no browser.

## Critérios de aceite

1. `npx tsc --noEmit` limpo (sem erro novo); sem `any`, sem `@ts-ignore`, sem `console.log` deixado.
2. Só os 3 arquivos OWN no diff.
3. Nenhuma assinatura reativa de `entriesByDate` em `useReportsSync.ts`; toda escrita via
   `upsertDailyEntry`; nenhum `localStorage` no código novo.
4. Comportamentos que o teste de browser vai cobrar: (a) depois do **Reset** a entrada de hoje
   continua íntegra; (b) depois de **reload + novo ciclo**, `cycles` vai a 2 e não volta a 1;
   (c) nenhum loop de gravação/re-render no console.

Sua entrega final: os 3 arquivos escritos e uma resposta curta listando o que mudou em cada um e
qualquer desvio que você tenha precisado fazer (com o motivo).
