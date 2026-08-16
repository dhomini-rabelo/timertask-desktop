## Extrato do step

Task `relatorios-tasks`, step 01/4 `store-de-relatorios-e-retencao`. Branch `main`, base commit `880cb24`.
Recon: veredito **complexa** (lógica de retenção é nova). Planner: **Opus**, 0 perguntas (P1-P16 já travavam tudo).

**Escopo único** `store-de-relatorios` (prompt em `prompts/store-de-relatorios.md`):
- CRIAR `src/pages/index/states/reports/index.ts` — tipos `DailyReportTask`/`DailyReportEntry`/`ReportsState` (copiados literais da memória §3) + store zustand `{state, actions}` molde `states/workflows/index.ts:37-79`. Actions: `setEntriesState`, `upsertDailyEntry`. **`set` DEVE devolver `actions: store.actions`** (trap T2).
- CRIAR `src/pages/index/states/reports/utils.ts` — `RETENTION_DAYS=7`, `getDayKey`, `getRetentionWindowStartKey`, `normalizeEntry`, `normalizeEntriesByDate`, `applyRetention` (idempotente, preserva `cycles`/`focusedSeconds`/`completedCount`, só zera `tasks`+seta `namesPurged`), `getEntriesInWindow` (default `days=RETENTION_DAYS`). Comparação de dia = comparação de STRING `yyyy-MM-dd` (nunca `Date`/`parseISO` no meio — trap T8). `??` nunca `||` (trap T3).
- CRIAR `src/pages/index/hooks/useStoredReports.ts` — molde EXATO `hooks/useStoredWorkflows.ts:10-56` + 1 linha extra (A8): `entriesRef.current` setada nos 3 ramos do efeito de hidratação (senão o efeito de save do mesmo commit grava `{}` por cima). Chave `timertasks:reports`. Sem `beforeunload`, sem migração (P12).
- EDITAR `src/pages/index/components/IndexTasks/IndexTasks.tsx` — 1 import + `useStoredReports();` ao lado de `useStoredTasks()` (`:10`). Nada de JSX muda.

**Critérios de aceite** (plan.md tem os 7 completos): build limpo (`npm run build`); chave `{}` numa instalação limpa; seed com dia de hoje + dia ~30d atrás (ambos com tasks/cycles/focusedSeconds/completedCount) → reload → dia antigo `tasks:[]`+`namesPurged:true` com agregados intactos, dia de hoje byte-a-byte igual; 2º reload idempotente; JSON inválido → `{}` sem quebrar tela; `timertasks:tasks`/`timertasks:workflows` intocados; `useReportsState.getState().actions` sobrevive a um `setEntriesState`.

**OUT**: ler `useTasksState`/`useCountdownTimerState`/`useWorkflowsState`; qualquer UI; beforeunload/migração; tocar `useStoredTasks`/`IndexScore`/`countdownTimer.ts`/`scoreUtils.ts`; nova dependência ou `*.test.ts`.

**Traps herdadas da memória**: T1 (completedAt é string ISO, nunca vira Date), T2 (actions no retorno do set), T3 (`??` não `||`), T5 (nada monta antes da permissão de notificação — tela de permissão ≠ bug), T8 (dia local via `format`, nunca `toISOString().slice(0,10)`), T9 (sem runner, teste só via browser), T13 (React Compiler — nunca mutar, `applyRetention` devolve mesma referência quando `changed:false`).

**Verificação local do implementador**: `npm run build` (tsc + vite build) — não há lint nem test script.

**Teste de sistema**: Docker+browser only (`npm run dev` + Playwright MCP + `.claude/docs/browser-instructions.md`). Roteiro: seed via `browser_evaluate` de 2 dias (hoje + ~30d atrás) → reload → reler chave → validar purga seletiva + idempotência + fallback de JSON inválido + não-toque em `timertasks:tasks`/`timertasks:workflows`.
