APPROVED

# Review r1 — step 03 `botao-reports-e-abas-hoje-semana`

Base `0aa4e5b`, branch `main`. `npx tsc --noEmit` já limpo (não re-executado).

## Footprint

`git status` + `git diff --stat 0aa4e5b` confirmam exatamente 1 arquivo editado
(`src/pages/index/components/IndexTasks/IndexTasks.tsx`) + 7 novos em
`src/pages/index/components/IndexTasks/IndexReportsDialog/`. Nenhum arquivo fora da lista.
`IndexScore.tsx` **não** aparece no diffstat (D2 respeitado). Demais alterações são apenas
docs do loop (`.claude/tasks/...`).

## Decisões vinculantes

- **D1 — badge de workflow por aba.** `IndexReportsDialog.tsx:34-40`: Today usa
  `shouldShowWorkflowBadge(todayCompletedTasks)`; Week usa o pool `weekEntries.flatMap(getCompletedTasks)`.
  O mesmo `weekShowWorkflowBadge` é passado a **todas** as `IndexReportsDaySection` (`:102`), logo nunca
  é por-dia. `reportsViewUtils.ts:52-54` implementa exatamente
  `new Set(tasks.map(t => t.workflowId ?? "__none__")).size > 1`. Nenhum import de store de workflows
  em nenhum dos 7 arquivos novos.
- **D2 — `formatDuration` cópia local.** `reportsViewUtils.ts:4-15` é byte-a-byte idêntica a
  `IndexScore.tsx:12-23` (mesmos ramos `h+m` / `h` / `m`). Nada exportado de `IndexScore.tsx`;
  o arquivo não foi tocado.
- **D3 — formatação.** Totais e cabeçalho de dia usam `formatDuration`
  (`IndexReportsTotals.tsx:20`, `IndexReportsDaySection.tsx:30`); a linha de task usa
  `formatTime` de `code/utils/date.ts` para `Duration` (`IndexReportTaskRow.tsx:34`) e
  `formatCompletedAt` para `Done` — `reportsViewUtils.ts:17-26` omite `second` e devolve `"--:--"`
  quando `completedAt` é `null`, espelhando `IndexCompletedTaskItem.tsx:24-30`.
- **D4 — totais dos campos persistidos.** Today: `todayEntry?.focusedSeconds/cycles/completedCount`
  (`IndexReportsDialog.tsx:74-76`). Week: `reduce` sobre `entry.focusedSeconds/cycles/completedCount`
  (`:42-49`). Cabeçalho de dia: `entry.*` (`IndexReportsDaySection.tsx:30-31`). Em nenhum lugar há
  `.length` das linhas visíveis ou soma de `secondsToday` alimentando um total.
- **D5 — ordenação.** `weekEntries` vem de `getEntriesInWindow` e é consumido direto em `:98`,
  sem `.sort()`/`.reverse()` intermediário — a ordem mais-recente-primeiro de
  `states/reports/utils.ts:122-124` é preservada. Dentro do dia,
  `reportsViewUtils.ts:38-43` faz `[...entry.tasks].filter(...).sort(...)`: cópia antes do sort,
  `entry.tasks` intacto (trap T13 evitado). Comparador é ASC por string ISO de `completedAt`.
- **D6 — dialog controlado.** `isOpen`/`handleOpenChange` (`IndexReportsDialog.tsx:19-27`);
  `setActiveTab("today")` em toda abertura.
- **D7 — ícones.** `BarChart3` no trigger (`:1`, `:58`); `Clock`/`Zap`/`CheckCircle2` nos totais
  (`IndexReportsTotals.tsx:1`).
- **D8 — sem `Dialog.Footer`.** Confirmado: não é importado nem usado.

## Estados vazios

`IndexReportsDaySection.tsx:35-55` tem os quatro ramos na ordem exigida:
1. `completedTasks.length > 0` → linhas;
2. `entry.namesPurged` → "Task names are no longer retained for this day." (com totais no cabeçalho,
   atendendo ao critério do dia purgado);
3. `hasAnyActivity(entry)` → "No tasks completed on this day.";
4. fallback → "No activity on this day.".

Today sem entry → `IndexReportsEmptyState` "No tasks completed today yet." (`:87`);
janela vazia → "No activity in the last 7 days." (`:107`), ambos com o bloco de totais acima
(zerados via `?? 0`), como pedido.

## Traps e patterns do repo

- **T10** — o trigger é um `<button>` cru dentro de `Dialog.Trigger`
  (`IndexReportsDialog.tsx:53-61`), idêntico ao padrão de
  `IndexWorkflowDialog.tsx:9-16`. O atom `Button` não é importado em lugar nenhum.
  `Dialog.Trigger` usa `asChild` (`atoms/Dialog/trigger.tsx:9`), então não há botão aninhado.
- **T11 — `dark:` em toda classe nova.** Verificado classe a classe. Os únicos casos sem `dark:`
  são `text-Black-400` puro (`IndexReportsTotals.tsx:43`, `IndexReportsDaySection.tsx:29,44,48,52`,
  `IndexReportsEmptyState.tsx:8`), que é exatamente o padrão já existente do repo para texto
  secundário (`IndexTasks.tsx:42`, `IndexCompletedTaskItem.tsx:58`) — `Black-400` é o token que
  serve aos dois temas. Não é violação.
- **T13** — nenhuma mutação de array vindo do store; ver D5.
- **Ordem de hooks** — `IndexTasks.tsx:12-17` intacta (`useStoredTasks` → `useStoredReports` →
  comentário load-bearing → `useReportsSync` → `useListingTasks`). A edição foi só o wrapper
  `flex items-start justify-between gap-4` (`:21`) + `<IndexReportsDialog />` (`:31`) + o import (`:10`).
  `shrink-0` presente na classe do trigger (`IndexReportsDialog.tsx:56`).
- `IndexReportTaskRow.tsx:15,16,21` espelha `IndexCompletedTaskItem.tsx:47,55,60` (incl. o
  `bg-white` minúsculo, que é o uso corrente do repo em cards de task).
- Tokens usados existem em `layout/styles/global.css:27-36` (`Black-100/400/450/500/600/700`).

## Contrato congelado (re-lido, não parafraseado)

`src/pages/index/states/reports/index.ts:3-20`. Campos lidos pelo código novo:
`DailyReportTask.id/title/workflowId/workflowTitle/groupTitle/secondsToday/completedAt` e
`DailyReportEntry.date/cycles/focusedSeconds/completedCount/tasks/namesPurged`. Todos batem,
sem typo. `useReportsState((store) => store.state.entriesByDate)` bate com `ReportsStore`.
`getEntriesInWindow(entriesByDate, now)` e `getDayKey(now)` batem com as assinaturas em
`states/reports/utils.ts:6,114-118`.

## Detalhe de correção verificado

`formatDayHeading` (`reportsViewUtils.ts:29`) usa `parseISO(date)` — parse **local** de
`"yyyy-MM-dd"`, coerente com o comentário `// "yyyy-MM-dd" LOCAL` do contrato. Um
`new Date("2026-08-16")` teria sido UTC e deslocaria o dia em fusos negativos; o código está certo.

`Dialog.Content` recebe `w-[640px]` que sobrepõe o `w-[420px]` do atom via `twMerge`
(`atoms/Dialog/content.tsx:25-28`), mantendo `max-w-[90vw]`.

## Ressalvas (nenhuma bloqueante, nenhuma exigindo ação)

Nada relevante o bastante para registrar. Único cosmético: `IndexReportsTabs.tsx:27` repete
`text-Black-400 dark:text-Black-400` (redundante, inofensivo).

**Verdito: APPROVED.** Pode seguir para o teste de sistema.
