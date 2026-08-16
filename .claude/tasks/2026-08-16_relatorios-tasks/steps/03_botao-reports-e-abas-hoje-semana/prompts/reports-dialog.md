# Prompt — implementer · escopo `reports-dialog` (step 03, task `relatorios-tasks`)

Este arquivo é o SEU contrato completo. Não abra `plan.md`, `recon.md`, `memoria-da-task.md`,
`answers.md` nem `process.md` — tudo o que você precisa está aqui.

Git: branch `main`, base `0aa4e5b`, working tree limpa. Não commite (o orquestrador commita).

## O que construir

Um botão **"Reports"** no canto superior direito do card de Tasks que abre um `Dialog` com duas abas
(**Today** / **Week**) listando as tasks concluídas + os totais do recorte. **Somente leitura** do
store `useReportsState` — nenhuma escrita, nenhuma action, nenhum hook novo de sync/persistência.

## Arquivos que você POSSUI

Editar (1):
- `src/pages/index/components/IndexTasks/IndexTasks.tsx` — **apenas** o bloco `:20-28` + um import.

Criar (7), todos em `src/pages/index/components/IndexTasks/IndexReportsDialog/`:
`IndexReportsDialog.tsx`, `IndexReportsTabs.tsx`, `IndexReportsTotals.tsx`,
`IndexReportsDaySection.tsx`, `IndexReportTaskRow.tsx`, `IndexReportsEmptyState.tsx`,
`reportsViewUtils.ts`.

Qualquer outro arquivo é READ-ONLY. Em especial: **não toque em `IndexScore.tsx`** (nem para adicionar
`export`), `IndexFooter/*`, `states/reports/*`, `hooks/useStoredReports.ts`, `hooks/useReportsSync.ts`,
nem nos atoms. Ao terminar, `git status` deve mostrar exatamente 1 modificado + 7 novos.

## Contrato de dados (já existe, congelado — NÃO redefinir)

`src/pages/index/states/reports/index.ts` exporta:
```ts
interface DailyReportTask { id: string; title: string; workflowId: string | null;
  workflowTitle: string | null; groupTitle: string | null; secondsToday: number;
  completedAt: string | null; }                       // completedAt é STRING ISO, nunca Date
interface DailyReportEntry { date: string;            // "yyyy-MM-dd" LOCAL
  cycles: number; focusedSeconds: number; completedCount: number;
  tasks: DailyReportTask[];                            // [] depois da retenção de 7 dias
  namesPurged: boolean; }
```
Store: `useReportsState((store) => store.state.entriesByDate)` → `Record<string, DailyReportEntry>`.
`src/pages/index/states/reports/utils.ts` exporta `getDayKey(date: Date): string` e
`getEntriesInWindow(entriesByDate, today, days = 7): DailyReportEntry[]`
(**já vem ordenado mais-recente-primeiro — NÃO re-ordenar**).

## Decisões VINCULANTES

1. **Badge de workflow (D1)**: uma flag por ABA, calculada sobre as tasks visíveis daquela aba —
   Today = as concluídas de hoje; Week = o POOL de todas as concluídas da janela (uma flag só para a
   aba inteira, **não** por dia).
   `shouldShowWorkflowBadge = new Set(tasks.map((t) => t.workflowId ?? "__none__")).size > 1`.
   Renderiza o badge só quando a flag é true **E** `task.workflowTitle` existe.
   **Proibido** ler qualquer store de workflows: o relatório usa só o `workflowTitle` snapshotado.
2. **`formatDuration` (D2)**: COPIE o corpo de `IndexScore.tsx:12-23` para `reportsViewUtils.ts`.
   Não exporte do `IndexScore.tsx`, não o importe de lá.
3. **Totais (D4)**: sempre dos campos persistidos (`focusedSeconds`/`cycles`/`completedCount`).
   Nunca recomputar somando as linhas visíveis (o total inclui tasks NÃO concluídas e sobrevive à
   retenção).
4. **Lista (P6)**: só `task.completedAt !== null`, ordenada ASC por `completedAt` (comparação de
   string, sem `new Date()`). Copie antes de ordenar (`[...tasks].sort`) — nunca mute o array do store.
5. **Formatos (D3)**: totais → `formatDuration` (`"2h 15m"`); duração da linha →
   `formatTime(task.secondsToday)` de `src/code/utils/date.ts`; hora de conclusão →
   `toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })` (sem segundos), `"--:--"` se null;
   cabeçalho de dia → `format(parseISO(entry.date), "EEE, MMM d")` (`date-fns`, já é dependência)
   + `" · Today"` quando for o dia corrente.
6. **Dialog controlado (D6)**: `useState<boolean>` + `onOpenChange`; ao ABRIR, resetar a aba para
   `"today"`. Sem `Dialog.Footer` (o `Dialog.Content` já traz o botão de fechar).

## Estrutura a implementar

**`IndexTasks.tsx`** — envolver o bloco de título existente:
```tsx
<div className="flex items-start justify-between gap-4">
  <div className="flex flex-col gap-2"> ...h2 + p intactos... </div>
  <IndexReportsDialog />
</div>
```
**NÃO** toque nas linhas `:12-16` (`useStoredTasks` / `useStoredReports` / `useReportsSync` +
comentário): a ordem é load-bearing.

**`IndexReportsDialog.tsx`** (shell, ~110 linhas):
```
entriesByDate = useReportsState((s) => s.state.entriesByDate)
now = new Date(); todayKey = getDayKey(now)
todayEntry  = entriesByDate[todayKey] ?? null
weekEntries = getEntriesInWindow(entriesByDate, now)      // default 7 dias
```
- Gatilho: `<Dialog.Trigger>` com `<button type="button">` **cru** (NÃO o atom `Button` — o padding
  default dele é `px-16 py-4`), classes:
  `"flex items-center gap-2 shrink-0 px-3 py-2 rounded-xl border border-Black-100 bg-White text-Black-500 text-sm font-medium transition-colors hover:bg-Black-100 dark:border-Black-600 dark:bg-Black-700 dark:text-White dark:hover:bg-Black-600"`,
  conteúdo `<BarChart3 className="w-4 h-4" />` + `Reports`. `shrink-0` é obrigatório (o card é
  `max-w-[600px]` e os títulos usam `break-all`).
- `<Dialog.Content title="Reports" description="Completed tasks, focused time and cycles."
  className="w-[640px] max-h-[80vh] overflow-auto">`.
- Corpo: `<div className="flex flex-col gap-4">` → `<IndexReportsTabs />` → view ativa dentro de
  `<div className="flex flex-col gap-3 max-h-[60vh] overflow-auto pr-1">`.
- Today: `<IndexReportsTotals>` com os campos de `todayEntry` (ou zeros) + linhas
  (`IndexReportTaskRow`) ou `<IndexReportsEmptyState text="No tasks completed today yet." />`.
- Week: `<IndexReportsTotals>` com a soma dos campos das `weekEntries` + uma
  `<IndexReportsDaySection>` por entry (na ordem recebida) ou
  `<IndexReportsEmptyState text="No activity in the last 7 days." />`.

**`IndexReportsTabs.tsx`** — dois `<button type="button">` (não existe atom de tabs no repo, não
instale lib). Container `"inline-flex items-center gap-1 p-1 rounded-xl bg-Black-100/50 dark:bg-Black-700 w-fit"`;
ativo `"px-3 py-1.5 rounded-lg text-sm font-medium bg-White text-Black-700 dark:bg-Black-600 dark:text-White"`;
inativo `"px-3 py-1.5 rounded-lg text-sm font-medium text-Black-400 transition-colors hover:text-Black-500 dark:text-Black-400 dark:hover:text-White"`.

**`IndexReportsTotals.tsx`** — props `{ focusedSeconds, cycles, completedCount }`,
`"grid grid-cols-3 gap-3"`, cada tile
`"flex flex-col gap-1 p-3 rounded-xl bg-Black-100/30 dark:bg-Black-700"` com rótulo
`"text-xs text-Black-400 flex items-center gap-1.5"` (ícone `w-3.5 h-3.5`) e valor
`"text-lg font-bold text-Black-700 dark:text-White"`:
`Clock`/`Focused`/`formatDuration(focusedSeconds)` · `Zap`/`Cycles`/`cycles` ·
`CheckCircle2`/`Completed`/`completedCount` (os 3 ícones já são usados em `IndexScore.tsx`).

**`IndexReportsDaySection.tsx`** — props `{ entry, showWorkflowBadge, isToday }`. Cabeçalho:
`<span className="text-sm font-semibold text-Black-700 dark:text-White">` com
`formatDayHeading(entry.date, isToday)` e, à direita,
`<span className="text-xs text-Black-400">` com
`{formatDuration(entry.focusedSeconds)} · {entry.cycles} cycles · {entry.completedCount} done`.
Corpo, **nesta ordem de ramos**:
1. tem concluídas → as linhas;
2. `entry.namesPurged` → `"Task names are no longer retained for this day."`;
3. `focusedSeconds > 0 || cycles > 0 || completedCount > 0` → `"No tasks completed on this day."`;
4. senão → `"No activity on this day."`.
(um dia purgado tem `tasks: []` mas totais preservados — mostrar SEMPRE os totais.)

**`IndexReportTaskRow.tsx`** — props `{ task, showWorkflowBadge }`. Espelhe o ESTILO de
`src/pages/index/components/IndexTasks/IndexFooter/IndexCompletedTaskItem.tsx:47-79`, **sem importar
o componente** (ele exige `Task`/`timeEvents`, que o relatório não tem):
- card `"flex flex-col gap-1 p-4 rounded-xl bg-white border border-Black-100/30 dark:bg-Black-700 dark:border-Black-600"`
- título `"text-sm font-medium text-Black-450 dark:text-Black-400 break-all"`
- meta `"flex items-center flex-wrap gap-2 text-xs text-Black-400"` na ordem: badge de grupo (se
  `groupTitle`) → badge de workflow (se `showWorkflowBadge && workflowTitle`) → `Done {hora}` →
  `Duration {formatTime(task.secondsToday)}`. Badge:
  `"px-2 py-0.5 rounded-full font-medium bg-Black-100/50 text-Black-450 dark:bg-Black-600 dark:text-Black-400 break-all"`.
Sem checkbox, sem chevron, sem botão de nota — a linha não é interativa.

**`IndexReportsEmptyState.tsx`** — props `{ text }`:
`<div className="py-6 flex items-center justify-center"><span className="text-base text-Black-400">{text}</span></div>`.

**`reportsViewUtils.ts`** (puro, sem React): `formatDuration`, `formatCompletedAt`, `formatDayHeading`,
`getCompletedTasks(entry | null)`, `hasAnyActivity(entry)`, `shouldShowWorkflowBadge(tasks)`.

Caminhos de import a partir da nova pasta (mesma profundidade de
`IndexTasks/IndexActiveTasksList/IndexTaskNoteDialog.tsx` — confira lá se ficar em dúvida):
store/utils → `../../../states/reports` e `../../../states/reports/utils`;
`formatTime` → `../../../../../code/utils/date`;
`Dialog` → `../../../../../layout/components/atoms/Dialog`.

## Armadilhas (custaram tempo antes)

- **T11 — dark mode**: TODA classe de cor nova precisa do par `dark:`. É o erro nº 1 de revisão neste
  repo.
- **T13 — React Compiler ligado**: nunca mute objetos/arrays vindos do store (`[...arr].sort(...)`).
- **T10 — atom `Button`** tem `px-16 py-4` por padrão; por isso o gatilho é `<button>` cru.
- `Dialog.Content` default é `w-[420px]` — a sobrescrita `w-[640px]` é obrigatória.
- `getEntriesInWindow` já vem ordenado; re-ordenar é bug.
- `entriesByDate[todayKey]` pode ser `undefined` se nada sincronizou hoje → tratar como `null`.
- `user-select: none` é global no app; texto não selecionável é intencional, não "conserte".

## Aceite

1. `npx tsc --noEmit` limpo. **Não** existe runner de testes neste repo: não rode `npm test`, não
   instale vitest, não crie `*.test.*`.
2. Botão visível no topo-direito do card sem quebrar o `<h2>Tasks</h2>`; dialog abre na aba Today;
   alternar Today/Week funciona.
3. Today mostra os 3 totais + as tasks concluídas hoje (título, `Done`, `Duration`).
4. Week mostra os 3 totais somados + uma seção por dia, mais recente primeiro.
5. Estados vazios cobertos (hoje vazio / semana vazia / dia purgado com totais).
6. Exatamente 1 arquivo modificado + 7 novos no `git status`.

Ao terminar, responda em no máximo 10 linhas: arquivos criados/editados e qualquer desvio deste
contrato (com a razão).
