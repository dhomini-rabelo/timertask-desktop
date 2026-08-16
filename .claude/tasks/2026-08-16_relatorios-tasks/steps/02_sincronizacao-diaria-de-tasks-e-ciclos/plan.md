# plan.md — step 02 · `sincronizacao-diaria-de-tasks-e-ciclos`

Base: branch `main`, commit base `ea680c6`. Escopo de implementação ÚNICO
(`prompts/sincronizacao-diaria.md`). Classe `julgamento` — recon veredito `complexa`.

Fontes vinculantes já lidas e NÃO reabertas pelo implementador além do necessário:
`plan-simplified.md` (IN/OUT + P6-P13 + roteiro de teste), `recon.md` (mapa), `memoria-da-task.md`
(traps T1-T14 + contrato congelado do step 01).

---

## Premissas assumidas

Nenhuma pergunta ao usuário — P6..P13 já respondidas. O que eu decidi como planner, e que vale como
contrato para implementador, revisor e testador:

1. **A ordem de hooks em `IndexTasks.tsx` é o gate de hidratação.** Não vou expor um
   `hasHydrated` de `useStoredReports` (arquivo do step 01, já revisado). O gate é: `useStoredReports()`
   é declarado ANTES de `useReportsSync()`; o efeito de hidratação do primeiro roda antes do efeito do
   segundo no mesmo commit de mount (React dispara efeitos passivos na ordem de declaração dentro do
   mesmo componente), e a hidratação é 100% síncrona (`localStorage.getItem` + `set` do zustand). Como
   `useReportsSync` lê o store de forma IMPERATIVA (`useReportsState.getState()`), ele enxerga o mapa
   já hidratado nesse mesmo commit — não depende de re-render. Um comentário no `IndexTasks.tsx`
   registra que a ordem é load-bearing.
2. **Rede de segurança para o caso de a ordem ser quebrada no futuro:** `cycles` é escrito com
   `Math.max(acumulado_em_ref, existente_no_disco)` e a mesclagem de tasks nunca remove id vindo do
   disco. Logo, uma execução pré-hidratação seria no máximo *adiada* (a hidratação substitui o mapa
   inteiro e o próximo sync remescla), nunca destrutiva.
3. **`dateKey` é calculado DENTRO do efeito, não no corpo do render, e NÃO entra nas deps.** O recon
   sugeriu `[items, workflows, totalCycles, dateKey]`; eu removo `dateKey` das deps de propósito:
   (a) `plan-simplified.md` exige apenas "a chave do dia é recalculada a cada sync", que é exatamente
   calcular dentro do efeito; (b) um `getDayKey(new Date())` no corpo do render é uma expressão sem
   dependências reativas e pode ser memoizada pelo React Compiler (T13), o que daria uma dep MENTIROSA
   e um `dateKey` divergente entre deps e corpo do efeito. Consequência aceita: à meia-noite, com o app
   ocioso, o sync não dispara sozinho; ele dispara no próximo evento (`items`/`workflows`/`totalCycles`)
   e aí já escreve na chave do dia novo, sem tocar no dia anterior. Nenhum timer novo é criado.
4. **Mesclagem monotônica por campo.** Para um id presente no disco E no snapshot vivo:
   `secondsToday = Math.max(live, existing)` e `completedAt = live ?? existing`. Justificativa:
   `calculateTaskTimeToday` é monotônico dentro do dia e `toggleTask` não remove o evento `complete`
   (memória §2.1), então em uso normal o valor vivo já é o maior/não-nulo; as duas regras só existem
   para garantir que NENHUMA execução do sync possa reduzir um dado já gravado. Os demais campos
   (`title`, `workflowId`, `workflowTitle`, `groupTitle`) são sobrescritos pelo vivo (P11: snapshot
   atualizado enquanto a task existe).
5. **Não se cria entrada vazia.** Se não existe entrada no disco para hoje E a lista mesclada é vazia
   E `cycles === 0`, o sync não chama `upsertDailyEntry`. Evita poluir `timertasks:reports` com dias
   sem nenhuma atividade só porque o app foi aberto.
6. **`namesPurged` de hoje**: `mergedTasks.length > 0 ? false : (existing?.namesPurged ?? false)` —
   nunca deixar `tasks` populado com `namesPurged: true`.
7. **Limitação conhecida e aceita (documentar, não corrigir):** uma task deixada RODANDO (evento
   `start` aberto) só tem seu `secondsToday` regravado quando algo dispara o efeito (novo evento de
   task, mudança de workflows, novo ciclo). Se o app for fechado com a task rodando, o valor do dia
   fica defasado no disco até o próximo sync; como `calculateTaskTimeToday` recalcula a partir dos
   `timeEvents` (que persistem em `timertasks:tasks`), o valor se autocorrige no mesmo dia assim que o
   efeito rodar de novo. Não há flush em `beforeunload` neste step (T14 diz que a ordem entre handlers
   não é garantida — dependeria do que o handler de tasks gravou).
8. **Sem tick periódico, sem novo `localStorage`, sem novo hook de persistência** — a gravação em
   disco continua sendo 100% do `useStoredReports` do step 01.

---

## Objetivo

Alimentar a entrada do DIA CORRENTE em `useReportsState` a partir do estado vivo (`tasks`,
`workflows`, `countdownTimer.totalCycles`), de forma que a entrada sobreviva ao botão **Reset**
(`clearItems`, trap T6) e ao **reload** (que zera `totalCycles`, P9). Nenhuma UI.

## Arquivos

| Arquivo | Ação | Dono |
|---|---|---|
| `src/pages/index/states/reports/sync.ts` | **NOVO** — funções puras de projeção/mesclagem/comparação | escopo único |
| `src/pages/index/hooks/useReportsSync.ts` | **NOVO** — hook de sync (refs + efeito + guarda) | escopo único |
| `src/pages/index/components/IndexTasks/IndexTasks.tsx` | **EDITADO** — 1 import + 1 chamada (3ª linha) + 1 comentário | escopo único |

Nada mais é editado. Em especial: `states/reports/index.ts`, `states/reports/utils.ts`,
`hooks/useStoredReports.ts`, `states/tasks/*`, `states/countdownTimer.ts`, `components/IndexScore.tsx`
são **somente leitura** neste step.

---

## 1. `src/pages/index/states/reports/sync.ts` — funções puras

Arquivo novo, sem React, sem acesso a store (recebe tudo por parâmetro). Imports permitidos:
`date-fns` (`isSameDay`), `../tasks` (`isTask`, `isTaskGroup`, tipos `TaskItem`/`Task`),
`../workflows` (tipo `Workflow`, exportado em `states/workflows/index.ts:3`), `./index` (tipos
`DailyReportTask`/`DailyReportEntry`), `../tasks/scoreUtils` (`calculateTaskTimeToday`).

### 1.1 `buildTodayTasks(items: TaskItem[], workflows: Workflow[], today: Date): DailyReportTask[]`

1. Monta dois índices O(1) ANTES do loop (não `.find` dentro do loop):
   - `workflowTitleById: Map<string, string>` a partir de `workflows`;
   - `groupTitleById: Map<string, string>` a partir de `items.filter(isTaskGroup)`.
2. Percorre `items.filter(isTask)` — **todos os workflows** (P8). Proibido usar `useListingTasks`
   (filtra pelo workflow selecionado, memória §2.5).
3. Por task:
   - `secondsToday = calculateTaskTimeToday(task.timeEvents)` — **reuso obrigatório** de
     `states/tasks/scoreUtils.ts:10-56`. Não reimplementar recorte de dia.
   - `completedAt`: entre `task.timeEvents` com `event.type === "complete"` e
     `isSameDay(new Date(event.createdAt), today)`, pega o de MAIOR `createdAt` e devolve
     `.toISOString()`; se não houver, `null`. **Sempre** envelopar em `new Date(event.createdAt)`
     (T1: `createdAt` é `Date` em memória e `string` quando vem do JSON). **Proibido**
     `calculateTasksCompleted` (T7 — não filtra por dia).
   - **descarta** a task se `secondsToday === 0 && completedAt === null`.
   - `workflowTitle = task.workflowId ? (workflowTitleById.get(task.workflowId) ?? null) : null`.
   - `groupTitle = task.groupId ? (groupTitleById.get(task.groupId) ?? null) : null`.
   - `id`, `title`, `workflowId` copiados da task.
4. Retorna array NOVO de objetos NOVOS (T13 — nada de mutar objetos vindos do store).

### 1.2 `mergeDailyTasks(existingTasks: DailyReportTask[], liveTasks: DailyReportTask[]): DailyReportTask[]`

Mesclagem por `id` (P11), ordem estável para não gerar diffs espúrios quando `items` reordena:

1. `liveById: Map<string, DailyReportTask>` a partir de `liveTasks`.
2. **Base** = `existingTasks.map(...)` na ORDEM ORIGINAL do disco: se existe live com o mesmo id,
   produz objeto novo com os campos do live, exceto
   `secondsToday: Math.max(live.secondsToday, existing.secondsToday)` e
   `completedAt: live.completedAt ?? existing.completedAt` (premissa 4); se não existe live com esse
   id, mantém a entrada do disco **intacta** (nunca remover — é o que faz o Reset/T6 passar).
3. **Cauda** = `liveTasks` cujos ids não aparecem em `existingTasks`, na ordem em que vieram do live.
4. Retorna `[...base, ...cauda]` — array novo, nunca mutação de `existingTasks`.

### 1.3 `buildDailyEntry(dateKey: string, existing: DailyReportEntry | null, liveTasks: DailyReportTask[], cycles: number): DailyReportEntry`

1. `tasks = mergeDailyTasks(existing?.tasks ?? [], liveTasks)`.
2. `focusedSeconds = tasks.reduce((total, t) => total + t.secondsToday, 0)` — soma da lista MESCLADA,
   inclui tasks não concluídas (P7).
3. `completedCount = tasks.filter((t) => t.completedAt !== null).length` — sobre a lista MESCLADA.
4. `namesPurged = tasks.length > 0 ? false : (existing?.namesPurged ?? false)`.
5. `date: dateKey`, `cycles`.

### 1.4 `areEntriesEqual(a: DailyReportEntry | null, b: DailyReportEntry): boolean`

Comparação por CONTEÚDO, nunca por identidade (`upsertDailyEntry` sempre cria objeto novo —
`states/reports/index.ts:52-61` — então comparar referência não protege de nada).

- `a === null` ⇒ `false`.
- compara `date`, `cycles`, `focusedSeconds`, `completedCount`, `namesPurged`;
- compara `a.tasks.length === b.tasks.length` e, em seguida, POSIÇÃO A POSIÇÃO, os 7 campos de
  `DailyReportTask` (`id`, `title`, `workflowId`, `workflowTitle`, `groupTitle`, `secondsToday`,
  `completedAt`). Ordem importa — por isso `mergeDailyTasks` tem ordem estável.
- Proibido `JSON.stringify` como comparador (ordem de chaves não é contrato).

---

## 2. `src/pages/index/hooks/useReportsSync.ts` — o hook

Arquivo novo. Não persiste nada, não lê `localStorage`, não cria store. Assinatura:
`export function useReportsSync(): void`.

### 2.1 Seletores (ordem exata de leitura de estado)

```
const items       = useTasksState((store) => store.state.items);
const workflows   = useWorkflowsState((store) => store.state.workflows);
const totalCycles = useCountdownTimerState((store) => store.state.totalCycles);
const upsertDailyEntry = useReportsState((store) => store.actions.upsertDailyEntry);
```

- Seleção FINA obrigatória (molde real em `components/IndexScore.tsx:26-29`): selecionar só
  `totalCycles` evita re-render a cada tick de `currentTimeInSeconds`
  (`states/countdownTimer.ts:106-145`).
- **PROIBIDO** `useReportsState((store) => store.state.entriesByDate)` neste hook — é a metade
  reativa do T4. O estado de reports só é lido imperativamente (2.2).
- Selecionar a action é seguro (referência estável; `useStoredReports.ts:9-11` faz igual).

### 2.2 Refs

```
const previousTotalCyclesRef = useRef<number | null>(null); // último totalCycles visto
const cyclesAccumulatedRef   = useRef<number>(0);           // ciclos do dia corrente
const syncedDayKeyRef        = useRef<string | null>(null); // dia que as refs acima representam
```

Molde de ref espelhando estado: `hooks/useStoredTasks.ts:122`, `:145-147` (só o padrão de `useRef`;
aqui NÃO há efeito-espelho separado — as refs são atualizadas dentro do próprio efeito de sync).

### 2.3 O efeito — ordem exata das operações

`useEffect(() => { ... }, [items, workflows, totalCycles, upsertDailyEntry])`

1. `const now = new Date();` e `const dayKey = getDayKey(now);`
   (`getDayKey` de `../states/reports/utils` — T8: `format(date,"yyyy-MM-dd")` local, NUNCA
   `toISOString().slice(0,10)`).
2. **Leitura imperativa do snapshot** (a outra metade da guarda anti-loop):
   `const existing = useReportsState.getState().state.entriesByDate[dayKey] ?? null;`
3. **Virada de dia / mount** — se `syncedDayKeyRef.current !== dayKey`:
   - `cyclesAccumulatedRef.current = existing?.cycles ?? 0;` (base = ciclos JÁ gravados do dia novo)
   - `previousTotalCyclesRef.current = totalCycles;` (delta observado nesta transição é 0 — nenhum
     ciclo do dia anterior vaza para o dia novo)
   - `syncedDayKeyRef.current = dayKey;`
4. **Realinhamento monotônico com o disco** (rede de segurança da premissa 2):
   `cyclesAccumulatedRef.current = Math.max(cyclesAccumulatedRef.current, existing?.cycles ?? 0);`
5. **Delta de ciclos (P9)** — sempre depois de 3 e 4:
   - `const previous = previousTotalCyclesRef.current;`
   - se `previous !== null && totalCycles > previous`:
     `cyclesAccumulatedRef.current += totalCycles - previous;`
   - se `totalCycles <= previous` (reload zera para 0, `countdownTimer.ts:296`; ou reset do timer):
     **não subtrai nada, não zera nada** — só realinha.
   - em todos os casos, ao final: `previousTotalCyclesRef.current = totalCycles;`
   - `totalCycles` só cresce em `goBackToWork` (`countdownTimer.ts:205`) — é o único incremento do app.
6. `const liveTasks = buildTodayTasks(items, workflows, now);`
7. `const nextEntry = buildDailyEntry(dayKey, existing, liveTasks, cyclesAccumulatedRef.current);`
8. **Guarda de entrada vazia** (premissa 5): se `existing === null && nextEntry.tasks.length === 0 &&
   nextEntry.cycles === 0` ⇒ `return;`
9. **Guarda anti-loop (T4)**: se `areEntriesEqual(existing, nextEntry)` ⇒ `return;`
10. `upsertDailyEntry(dayKey, nextEntry);`

Por que isso não entra em loop: (a) as deps não incluem nada derivado de `entriesByDate`, então a
própria escrita não reagenda o efeito; (b) mesmo que o efeito rode de novo por outro motivo, o passo 9
corta a escrita quando o conteúdo é idêntico. As DUAS metades são obrigatórias — só refs não bastam,
porque `upsertDailyEntry` sempre devolve objeto novo (spread em `states/reports/index.ts:56-59`).

### 2.4 Proibições explícitas no hook

- Nada de `setState`/`useState` no hook (qualquer estado local reintroduz o caminho de re-render).
- Nada de `setInterval`/`setTimeout`/`beforeunload`.
- Nada de escrita direta em `localStorage`.
- Nenhuma action de `countdownTimer` ou de `tasks` é importada — leitura apenas (P10, P13).

---

## 3. `IndexTasks.tsx` — montagem

`src/pages/index/components/IndexTasks/IndexTasks.tsx:10-13` hoje:
`useStoredTasks(); useStoredReports(); const { activeListItems, tasks } = useListingTasks();`

Mudança: `import { useReportsSync } from "../../hooks/useReportsSync";` e a chamada
`useReportsSync();` como **3ª linha**, imediatamente depois de `useStoredReports()` e antes de
`useListingTasks()`. Um comentário curto de UMA linha acima da chamada registrando que a ordem é
load-bearing (o sync precisa que a hidratação de reports/tasks já tenha rodado). Nenhuma outra
alteração no arquivo — JSX intocado (a UI é dos steps 03/04).

---

## 4. Traps aplicáveis (checklist do revisor)

- **T4** — guarda dupla da §2.3 (deps sem `entriesByDate` + `areEntriesEqual`). A mais perigosa.
- **T1** — `new Date(event.createdAt)` sempre; `completedAt` gravado como string ISO, nunca `Date`.
- **T3** — usar `??` (não `||`) em `existing?.cycles ?? 0` etc.; `0` é valor legítimo.
- **T6** — depois do Reset, o `items` fica vazio e `buildTodayTasks` devolve `[]`; `mergeDailyTasks`
  tem de preservar todas as entradas do disco. É o critério que prova o step.
- **T7** — nunca `calculateTasksCompleted`.
- **T8** — `getDayKey` do step 01, nada de UTC.
- **T13** — só objetos/arrays novos; nunca mutar `existing.tasks`, `items` ou `workflows`.
- **T5** — no teste de browser, se aparecer o pedido de permissão de notificação, nada montou; não é
  bug do step (`page.tsx:63-66`).
- **T9** — não existe runner de testes. Não criar `*.test.ts`, não instalar vitest, não rodar `npm test`.

## 5. Critérios de aceite

1. `npx tsc --noEmit` (ou `npm run build`) sem erros novos; sem `any` e sem `@ts-ignore`.
2. Só os 3 arquivos da tabela §Arquivos aparecem no diff.
3. `useReportsSync` não assina `entriesByDate` em lugar nenhum (grep: nenhum
   `useReportsState((`…`entriesByDate` dentro de `useReportsSync.ts`).
4. Toda escrita passa por `actions.upsertDailyEntry` — nenhum `setEntriesState`, nenhum
   `localStorage.setItem` no código novo.
5. O roteiro §6 passa integralmente, com destaque para: entrada íntegra depois do **Reset** e `cycles`
   chegando a **2** depois de reload + segundo ciclo.
6. Sem loop de gravação: nenhum warning de "Maximum update depth", console limpo, e a chave
   `timertasks:reports` estável entre leituras consecutivas sem interação.

## 6. Roteiro de teste de sistema — **Docker + browser only**

Referência de operação: `.claude/docs/browser-instructions.md`. `npm run dev` → **http://localhost:1420**
(porta fixa do Tauri; não é 5173). Leitura de dado via `browser_evaluate` sobre
`localStorage.getItem("timertasks:reports")` — este é um step de data-layer, a validação é por
`localStorage`, não por pixel. O gate de permissão de notificação pode já vir `granted` no contexto do
Playwright — não assumir que o prompt aparece.

1. **Projeção do dia** — criar 2 tasks; iniciar o cronômetro de uma delas, deixar correr alguns
   segundos e **parar**; concluir a outra. Ler `timertasks:reports`: a entrada de hoje
   (`entriesByDate["yyyy-MM-dd"]`) tem `tasks` com as DUAS, `completedAt` não-nulo só na concluída,
   `focusedSeconds > 0`, `completedCount === 1`, `namesPurged === false`, `date` = dia local de hoje.
2. **Reset (T6)** — clicar em **Reset** (`IndexFooter.tsx:67-76` → `clearItems`) e reler a chave: a
   entrada de hoje continua ÍNTEGRA (mesmas 2 tasks, mesmo `focusedSeconds`, mesmo `completedCount`).
3. **Reload** — recarregar a página e reler: nada se perdeu, nada duplicou (nenhum id repetido em
   `tasks`, `focusedSeconds` e `completedCount` iguais aos do passo 2).
4. **Ciclos (P9)** — concluir um ciclo do timer (chegar ao Rest e clicar **Back to Work**,
   `countdownTimer.ts:205`) e conferir `cycles === 1`; **recarregar** a página (o que zera
   `totalCycles`) e concluir outro ciclo: `cycles` tem de ir a **2**, nunca voltar a 1 nem zerar.
5. **Anti-loop (T4)** — com o app parado, capturar as mensagens de console (`browser_console_messages`)
   e ler `timertasks:reports` duas vezes com alguns segundos de intervalo sem interação: conteúdo
   idêntico, nenhum erro de "Maximum update depth exceeded", nenhum crescimento de `cycles` ou de
   `tasks` sozinho.

Se um passo falhar, o relatório precisa dizer QUAL passo e o conteúdo bruto de
`timertasks:reports` no momento da falha.

## 7. Fora de escopo (não fazer)

- Qualquer UI, botão, dialog ou leitura visual do relatório (steps 03/04).
- Alterar `countdownTimer.ts` (só LER `totalCycles`), `IndexScore.tsx` ou `scoreUtils.ts` (a trap T7
  **não** é corrigida aqui) — P10.
- Alterar `useStoredTasks`, `useStoredReports`, `states/reports/index.ts`, `states/reports/utils.ts`
  ou o formato de `timertasks:tasks` — P13 e contrato congelado do step 01.
- Recalcular, reescrever ou "consertar" entradas de dias anteriores — imutáveis (P11).
- Retenção/purga de nomes (já entregue no step 01) e qualquer mudança em `RETENTION_DAYS`.
- Testes automatizados, runner, `beforeunload`, sync periódico por timer.
