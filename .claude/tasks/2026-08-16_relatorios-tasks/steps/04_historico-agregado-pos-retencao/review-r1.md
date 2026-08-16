# review-r1 — step 04 `historico-agregado-pos-retencao`

APPROVED

Escopo revisado: diff dos 4 arquivos declarados (`git diff --stat -- src` confirma exatamente esses
4, nenhum arquivo extra em `src`).

## Checagens do requisito central

1. `states/reports/utils.ts:127-136` — `getEntriesOutsideWindow` chama
   `getRetentionWindowStartKey(today)` (mesma função de `applyRetention:90`) e filtra por comparação
   de string `entry.date < windowStartKey`. Sem `parseISO`/`Date` no meio, sem parâmetro de dias.
   Corte casa com `getEntriesInWindow:119` (`getDayKey(startOfDay(subDays(today, days-1)))` com
   `days = RETENTION_DAYS`): janela `[startKey, todayKey]`, history `< startKey` — sem sobreposição
   nem buraco. `Object.values().filter()` já devolve array novo antes do `.sort()` (T13 ok).
2. `reportsViewUtils.ts:56-69` — `sumEntryTotals` soma `entry.focusedSeconds/cycles/completedCount`
   persistidos; nada derivado de `tasks.length` nem de linhas filtradas.
3. `IndexReportsDialog.tsx:47-54` — `weekTotals` inalterado (duplicação aceita pelo plano); blocos
   JSX de Today (79-98) e Week (100-120) idênticos ao step 03, só a troca ternário→`&&`.
4. History reusa `IndexReportsDaySection` com `showWorkflowBadge={false}` / `isToday={false}` fixos
   (`IndexReportsDialog.tsx:135-140`); `IndexReportsDaySection.tsx` não aparece no diff.
   `useStoredReports.ts:28` aplica `applyRetention` no load, então as entries do History chegam com
   `tasks: []` + `namesPurged: true` → cai no ramo "Task names are no longer retained for this day."
   (sem título de task).
5. T11 — única classe de cor nova: `IndexReportsDialog.tsx:124`
   `text-sm text-Black-300 dark:text-Black-400`, exatamente o par já usado em
   `layout/components/atoms/Dialog/content.tsx:36` e `IndexTasks.tsx:26`. Nenhuma classe
   preexistente foi alterada.
6. Nenhuma escrita no store no diff (`upsertDailyEntry`/`setEntriesState` ausentes); o step só lê
   `store.state.entriesByDate`.
7. `formatDuration` continua sendo a cópia única de `reportsViewUtils.ts:4-15`; nenhum import de
   `IndexScore.tsx` e nenhuma redefinição nova.
8. Ternário substituído por 3 blocos `{activeTab === "…" && (...)}` (79, 100, 122) — sem aninhamento.
   Tipo `IndexReportsTab` estendido com `"history"` e 3º item em `TABS` (`IndexReportsTabs.tsx:1,11`).
   `handleOpenChange` continua forçando `today` ao abrir (`IndexReportsDialog.tsx:29-31`).

## Ressalva (não bloqueante, comportamento preexistente)

- Entry com data futura (`> todayKey`) não aparece em Week (filtro `<= todayKey` já existia) nem em
  History (`< startKey`). Só ocorre com relógio alterado/seed manual; o step não piorou o caso.
