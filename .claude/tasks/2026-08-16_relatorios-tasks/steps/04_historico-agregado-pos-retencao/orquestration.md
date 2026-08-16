# orquestration.md — step 04 · `historico-agregado-pos-retencao`

## Extrato do step

- Git: branch `main`, commit-base `22e0f2f`, working tree limpa.
- Decisões vinculantes (plan.md): History é 3ª ABA (`Today | Week | History`), não seção — molde de
  abas já existe; `IndexReportsDaySection` reusado SEM edição (ramo `namesPurged` já trata "sem
  nomes" automaticamente); totais = soma de `focusedSeconds`/`cycles`/`completedCount` persistidos,
  NUNCA derivados de `tasks`; `weekTotals` fica intacto (duplicação aceita); `showWorkflowBadge=false`
  e `isToday=false` fixos no History; `formatDuration` só via cópia já existente em
  `reportsViewUtils.ts` (nunca importar de `IndexScore`); step só LÊ o store, zero escrita.
- Critérios de aceitação: `tsc --noEmit` limpo; aba History visível, dialog abre em Today; 2 dias
  semeados fora da janela aparecem mais-recente-primeiro com data+Xh Ym+N cycles+M done+frase de
  retenção e SEM título de task; totais do topo batem com `localStorage`; Week não inclui esses dias;
  copy de retenção sempre visível; estado vazio com chave limpa; dark mode em toda classe nova (T11);
  nenhum `setItem` disparado ao abrir History.
- Arquivos (4 editados, 0 criados): `states/reports/utils.ts` (+`getEntriesOutsideWindow`),
  `IndexReportsDialog/reportsViewUtils.ts` (+`sumEntryTotals`), `IndexReportsDialog/IndexReportsTabs.tsx`
  (tipo + 3º item TABS), `IndexReportsDialog/IndexReportsDialog.tsx` (imports, historyEntries/Totals,
  3º bloco JSX). NÃO tocar: `IndexReportsDaySection.tsx`, `IndexReportsTotals.tsx`,
  `IndexReportsEmptyState.tsx`, `IndexReportTaskRow.tsx`, `states/reports/index.ts`,
  `useStoredReports.ts`, `useReportsSync.ts`, `IndexScore.tsx`, store de tasks, `IndexTasks.tsx`.
- Traps: T8 (comparação de dia sempre por string `yyyy-MM-dd`, nunca Date/parseISO), T11 (dark: em
  toda classe nova), T13 (não mutar, copiar array antes de derivar).
- Teste de sistema: Docker+browser only, porta 1420 (nunca 5173), tester sempre foreground. Semear via
  `browser_evaluate` em `localStorage["timertasks:reports"]` (entriesByDate DIRETO, sem wrapper) dois
  dias fora da janela (ex.: -20 e -40) com tasks nomeadas + o dia de hoje; reload; abrir Reports →
  History; diff tela × localStorage; conferir Week não inclui; limpar chave e conferir vazio;
  screenshots claro + escuro.
