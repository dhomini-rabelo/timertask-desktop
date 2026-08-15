## Extrato do step

- **Escopo**: fundir `IndexTaskItem`(2-níveis, apagado no step 01)+`IndexSubTaskItem` num componente
  único `IndexTaskItem` (nível 1), sem `isActive`; N cronômetros em paralelo sincronizados com o timer
  global. Escopo único (`item-task-unificado`), sem partição.
- **Decisões vinculantes** (ver `plan.md` A1-A12):
  - A1: `git mv` `IndexSubTaskItem/`→`IndexTaskItem/` e arquivo idem; `IndexAlertSelect.tsx`/
    `IndexDebugTimer.tsx` de carona, imports intactos.
  - A2 (central): fonte da verdade visual é `isTimerActive = timerState.isRunning` (não
    `task.isRunning`) — evita bug pós-reload (T4). `task.isRunning` só usado no cálculo de `autoStart`.
    `useStoredTasks.ts:169` **não é tocado**.
  - A3/A4: efeito de sync com timer global vira bidirecional (`wasAutoPausedRef`, `useRef`) — pausa E
    retoma; `isGlobalActive = isGlobalTimerRunning && !isResting`.
  - A5: `hasBeenStarted = task.timeEvents.some(e => e.type === "start")` — progressive disclosure.
  - A6: badge Running/Paused em linha própria entre header e barra de controles.
  - A7: `IndexTaskNoteDialog` no cluster esquerdo da barra de controles, sempre visível.
  - A8: IN 6/7 (navegação 2 níveis, textos) já feitos no step 01 — só confirmar por grep, não editar.
  - A9/A10: alarme (T6) e `useCountUpTimer` (T7) movidos byte-a-byte, um por item, sem centralizar.
  - A11: concluir task rodando — sem mudança necessária (já contabiliza certo).
  - A12: riscos aceitos e documentados (reorder pós-reload com isRunning preso; isRunning:true em task
    concluída rodando) — fora de escopo, não corrigir.
- **Arquivos**: `git mv` pasta+arquivo IndexSubTaskItem→IndexTaskItem (reescrita do corpo);
  `IndexSortableTaskItem.tsx` (novo import/nome, remove `isActive` e prop morta `dragHandleProps`).
  Nada mais tocado.
- **Critérios de aceite**: ver `plan.md` (9 itens) — tsc limpo, git mostra rename puro, N timers
  paralelos independentes, pausa/retoma em bloco, reload preserva estado sem auto-retomar, edição/nota
  ok.
- **Git state**: branch `main`, commit-base `5430dcd`, working tree limpo (exceto `image.png`
  untracked na raiz, não tocar).
- **Teste de sistema**: browser (`npm run dev` :1420). DnD = Not run (limitação de ambiente, não do
  app). Roteiro completo em `plan-simplified.md` seção "Modo de teste".
- **Traps herdadas**: T4 (não auto-retomar pós-reload), T6 (alarme por item), T7 (timer por item), T8
  (React Compiler, imutabilidade).

## Fechamento

Recon `complexa` -> plan Opus -> impl Sonnet (1 rodada) -> validate Opus APPROVED (r1) -> commit `9e8ea62`
-> teste browser `tests-01/` PASS 9/9 (DnD Not run) -> commit `3877612`. Zero rounds de correção, zero
escalação. Detalhe em `process.md`.
