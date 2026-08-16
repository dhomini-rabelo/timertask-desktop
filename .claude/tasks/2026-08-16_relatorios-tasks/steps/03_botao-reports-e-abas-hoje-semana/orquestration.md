## Extrato do step

Decisões vinculantes (plan.md):
- D1: badge de workflow por ABA (Today = tasks concluídas hoje; Week = pool de toda a janela),
  `showWorkflowBadge = new Set(tasks.map(t=>t.workflowId ?? "__none__")).size > 1`. Nunca ler store de workflows.
- D2: `formatDuration` copiado (não exportado) para `reportsViewUtils.ts`; `IndexScore.tsx` NÃO é tocado.
- D3: totais usam `formatDuration`; linha de task usa `formatTime` (code/utils/date.ts); "Done HH:MM" sem segundos.
- D4: totais SEMPRE dos campos persistidos (focusedSeconds/cycles/completedCount), nunca recomputados das linhas visíveis.
- D5: Week usa a ordem de `getEntriesInWindow` (mais-recente-primeiro, não reordenar); tasks dentro do dia ASC por completedAt.
- D6: dialog controlado, aba volta a "today" toda vez que abre.
- D7: ícone `BarChart3`; totais usam `Clock`/`Zap`/`CheckCircle2`.
- D8: sem `Dialog.Footer`.

Critérios de aceite (1-9 em plan.md): tsc limpo; botão no canto sup. direito sem quebrar header
(`max-w-[600px]`, `shrink-0`); dialog abre em Today; Week soma janela de 7 dias, mais-recente-primeiro;
estados vazios (sem entry hoje / janela vazia / dia com `tasks:[]`+`namesPurged` mostrando totais e
linha explicativa); badge de workflow por D1; dark: em toda classe nova; footprint exatamente
1 arquivo editado + 7 novos.

Arquivos:
- Editado: `src/pages/index/components/IndexTasks/IndexTasks.tsx` (:20-28 envolver header em
  `flex items-start justify-between`, import novo; NÃO tocar :12-16 ordem de hooks).
- Novos (todos em `src/pages/index/components/IndexTasks/IndexReportsDialog/`):
  `IndexReportsDialog.tsx`, `IndexReportsTabs.tsx`, `IndexReportsTotals.tsx`,
  `IndexReportsDaySection.tsx`, `IndexReportTaskRow.tsx`, `IndexReportsEmptyState.tsx`,
  `reportsViewUtils.ts`.
- READ-ONLY (não editar): `states/reports/*`, `hooks/useStoredReports.ts`, `hooks/useReportsSync.ts`,
  `components/IndexScore.tsx`, `IndexFooter/*`, `states/tasks/*`, `states/countdownTimer.ts`, atoms.

Git: branch `main`, base commit `0aa4e5b`.

Traps: T10 (Button atom padding gigante — usar `<button>` cru), T11 (dark: obrigatório em toda classe
nova), T13 (React Compiler — nunca mutar `entry.tasks`, copiar antes de `.sort`), trap do recon (não
reordenar hooks `useStoredTasks`/`useStoredReports`/`useReportsSync` em `IndexTasks.tsx:12-15`).

Teste de sistema: Docker+browser only (`npm run dev` porta 1420 + Playwright MCP). Roteiro: concluir
task, abrir dialog pelo botão, conferir Today (nome/duração/totais), Week (agrupado por dia, mais
recente primeiro), estado vazio, screenshots claro/escuro, header do card não quebrar.

Escopo de implementação: 1 (`prompts/reports-dialog.md`).

## Fechamento

- Validação: APPROVED r1, 0 rounds de correção (`review-r1.md`).
- Commit implementação+validação: `9e40c3a`.
- Teste de sistema: Docker+browser, PASS na 1ª tentativa (`tests-01/verdict.md`) — cobriu Today/Week
  cross-checados contra `localStorage["timertasks:reports"]`, o caso de regressão Reset (dia sobrevive)
  e estado vazio de dia com atividade e 0 conclusões.
- Commit do teste: `c8b0a4a`.
- Nota operacional: dois testers concorrentes chegaram a rodar contra o mesmo `tests-01/` (um
  background abandonado + um foreground). O foreground validou as evidências do outro antes de
  reportar; nenhum dado do verdict é espúrio, mas não repetir o padrão — testers deste loop devem
  correr em `run_in_background: false`.
