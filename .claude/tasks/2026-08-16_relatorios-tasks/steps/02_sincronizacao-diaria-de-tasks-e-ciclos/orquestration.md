## Extrato do step

**Step 02 — sincronizacao-diaria-de-tasks-e-ciclos** | branch `main`, base `ea680c6` | classe `julgamento`, recon `complexa`, planner `opus`.

**Escopo (1 único)**: 3 arquivos — `src/pages/index/states/reports/sync.ts` (NOVO: `buildTodayTasks`,
`mergeDailyTasks`, `buildDailyEntry`, `areEntriesEqual`), `src/pages/index/hooks/useReportsSync.ts`
(NOVO: hook com refs de delta de ciclos + efeito + guarda anti-loop), `IndexTasks.tsx` (EDITADO: 1
import + `useReportsSync()` como 3ª linha, após `useStoredReports()`).

**Decisões vinculantes do plano** (não redebater):
1. Gate de hidratação = ORDEM dos hooks (`useStoredReports()` antes de `useReportsSync()`), não um
   `hasHydrated` novo. Rede de segurança: `cycles = Math.max(ref, disco)`, merge nunca remove id.
2. `dateKey` calculado DENTRO do efeito (não no corpo do render, não nas deps — T13/React Compiler).
3. Merge monotônico por campo: `secondsToday = Math.max(live, existing)`, `completedAt = live ?? existing`.
4. Não criar entrada vazia (sem disco + lista vazia + cycles 0 ⇒ não chama `upsertDailyEntry`).
5. Guarda anti-loop DUPLA (T4, a mais perigosa): deps do efeito = `[items, workflows, totalCycles,
   upsertDailyEntry]` — NUNCA `entriesByDate` reativo; leitura do snapshot via `useReportsState.getState()`;
   `upsertDailyEntry` só chamado se `areEntriesEqual(existing, nextEntry) === false`.
6. Delta de ciclos com 3 refs (`previousTotalCyclesRef`, `cyclesAccumulatedRef`, `syncedDayKeyRef`):
   soma delta só quando `totalCycles` CRESCE; ao cair (reload) só realinha, nunca subtrai/zera.
7. Reuso obrigatório: `calculateTaskTimeToday` (scoreUtils.ts:10-56). Proibido `calculateTasksCompleted`
   (T7, não filtra por dia) e proibido `useListingTasks` (filtra por workflow selecionado — P8 é global).

**Arquivos só-leitura (não tocar)**: `states/reports/index.ts`, `states/reports/utils.ts`,
`hooks/useStoredReports.ts`, `states/tasks/*`, `states/countdownTimer.ts`, `IndexScore.tsx`.

**Critérios de aceite**: tsc sem erros novos; só os 3 arquivos no diff; `useReportsSync.ts` nunca
assina `entriesByDate` reativamente; toda escrita via `actions.upsertDailyEntry`; roteiro de teste
passa (Reset íntegro, reload sem duplicar, cycles chega a 2, console limpo sem loop).

**Teste de sistema**: Docker+browser only. `npm run dev` → `http://localhost:1420` (não 5173).
Validação por `browser_evaluate` sobre `localStorage["timertasks:reports"]`, não por pixel. 5 passos
no `plan.md` §6: projeção do dia (2 tasks, 1 concluída) → Reset (T6) → reload sem duplicar → ciclos
(1, reload, 2) → anti-loop (console limpo, leituras estáveis).

**Traps aplicáveis**: T1 (Date vira string — sempre `new Date(event.createdAt)`), T3 (`??` não `||`),
T4 (guarda dupla acima), T5 (gate de permissão pode já vir granted no Playwright), T6 (Reset é o
critério que prova o step), T7 (proibido `calculateTasksCompleted`), T8 (`getDayKey` local, nunca UTC),
T9 (sem runner, não criar `*.test.ts`), T13 (só objetos/arrays novos, nunca mutar).

**Deliverables do plan**: `plan.md`, `prompts/sincronizacao-diaria.md` (prompt do implementador único).

## Execução

- Recon (`recon.md`): veredito `complexa`, escopo único, 4 perguntas concretas respondidas.
- Plan (`plan.md`, planner Opus): 8 premissas assumidas registradas, roteiro de teste em 5 passos.
- Implement (escopo único, Sonnet): 3 arquivos, `tsc --noEmit` limpo, diff só nos 3 arquivos OWN.
- Validate r1 (Opus, `validate-r1.md`): **APPROVED_WITH_RESALVAS** — sem findings bloqueantes; ressalvas
  não-acionáveis (cast `as Date`, 1 ciclo perdido só se o 1º evento do dia novo já for `goBackToWork`,
  nota para steps 03/04 sobre `focusedSeconds`/`completedCount` recomputados do zero se `tasks` for
  purgado). Sem rodada de fix.
- Commit impl+validação: `7359665`.
- Teste de sistema (`tests-01/verdict.md`): Docker+browser only, **PASS 5/5** na 1ª tentativa (projeção
  do dia, Reset íntegro, reload sem duplicar, ciclos 1→2 via relógio virtual do Playwright, console
  limpo). Commit do teste: `f415558`.
