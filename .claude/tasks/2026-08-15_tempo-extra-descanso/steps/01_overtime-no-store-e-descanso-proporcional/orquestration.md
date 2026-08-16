# Orquestration — step 01_overtime-no-store-e-descanso-proporcional

## Extrato do step

- Decisões vinculantes: A1 zero campo novo em `CountdownTimerState` (flag alarme = ref de módulo
  `hasAlertedRef`, molde `countdownTimer.ts:44-47`); A2 `goToRest`/`addExtraTime` chamam `stop()`
  (não clear inline) antes de `start()` (trap N6); A3 guard de `start()` vira
  `if (isResting && currentTimeInSeconds <= 0) return` (trap N7); A4 `initialMinutes` fica fracionário
  em `goToRest` (`restSeconds/60`) para preservar `currentTimeInSeconds === initialMinutes*60`; A5 sem
  clamp em `restSeconds` (nunca é negativo); A6 botão Stop/Resume no TOPO do painel de overtime; A7
  ramo `isFinished && !isResting` é subsumido pelo novo ramo `isOvertime` (markup MOVIDO, não
  duplicado); A8 anel/cor NÃO tocados neste step (é o 02) — arco fantasma no overtime é esperado, não
  é FAIL.
- Critérios de aceitação: tsc limpo; overtime decresce em negativo bem formatado (`-01:23`); alarme
  toca 1x por ciclo (não repete no overtime nem ao retomar); Rest/+5/+10/Skip + Stop/Resume acessíveis
  no overtime; **critério numérico**: 25min@20% + ~5min overtime + Rest ⇒ descanso inicia em 06:00
  (±1s) e decresce de verdade; +5 em -03:00 ⇒ ~+02:00 e corre; descanso continua parando em 00:00
  (P5, regressão); Skip/Back to Work zeram overtime e incrementam `totalCycles`; cronômetros das
  tasks continuam correndo no overtime (N5/P13, esperado).
- Arquivos no escopo: `src/pages/index/states/countdownTimer.ts` +
  `src/pages/index/components/IndexTimer.tsx` (escopo 1, acoplados) ·
  `src/layout/components/common/Timer/index.tsx` (escopo 2, só formatação, independente).
- Estado de git: branch `main` | commit-base `47278d8`.
- Armadilhas: N1 (`setState` enumera campo a campo — não criar campo novo), N4 (painel inalcançável
  se `isOvertime` não vier PRIMEIRO na cadeia de ramos), N6 (`stop()` antes de `start()` em
  `goToRest`/`addExtraTime`), N7 (guard de `start()` por fase, não por valor), N8 (alarme 1x, reset
  nas trocas de fase, não em `stop`/`start`), N2.1 (`Timer/index.tsx` formatação do negativo).
- Cenário/preset de teste: Docker+browser only. `npx tsc --noEmit` + `npm run dev` (porta 1420) +
  Playwright MCP; técnica de deslocamento de `window.Date` (memória §8) obrigatória (slider mínimo
  10 min). 9 casos mínimos listados em `plan.md` / `plan-simplified.md`.

## 2026-08-15 — recon (S01-recon-tempo-extra-descanso, predecessor)

- Pointer: `recon.md` | Veredito: julgamento confirmado (acoplamento semântico real store↔UI,
  3 modos de falha silenciosa N6/N7/N8) | Partição: 2 escopos recomendados

## 2026-08-16 — planner (S01-plan-tempo-extra-descanso, opus)

- Pointers: `plan.md`, `prompts/store-overtime-e-painel.md`, `prompts/timer-formatacao-negativa.md`
- Partição adotada: 2 escopos, igual à recomendação da recon (footprints disjuntos)
- Sem blocker, zero perguntas
- Next: implement

## 2026-08-16 — implement (S01-impl-store-overtime-e-painel + -r2, S01-impl-timer-formatacao-negativa)

- Files changed: 3 (countdownTimer.ts, IndexTimer.tsx, Timer/index.tsx) | Type-check: exit=0
- Predecessor implementer of scope 1 died after finishing countdownTimer.ts; fresh -r2 verified/
  completed IndexTimer.tsx; disk state confirmed complete and consistent with plan §1.1-1.9
- Next: validate

## 2026-08-16 — validator (S01-validate-tempo-extra-descanso-r1, opus)

- Verdict: APPROVED_WITH_RESALVAS | Pointer: `review-r1.md`
- Acceptance number reconstructed by hand: confirmed 06:00 (25min@20%+~5min overtime), 05:00 baseline,
  no double-count on +5
- Ressalvas (não bloqueantes, registradas): `Math.floor` no ramo negativo do tick deixa o overtime
  1s adiantado / pula 00:00 (validador sugere `Math.ceil` para o step 02, junto do clamp do anel);
  arco fantasma do anel no overtime (esperado, step 02); `addExtraTime` reseta o alarme e pode
  redisparar ~1s depois se aplicado bem fundo no overtime (comportamento conforme spec); `restMinutes`
  fracionário no modal (N9 pré-existente, não corrigir); `store` sombreado em `countdownTimer.ts:116`
  e wrapper redundante em `IndexTimer.tsx:128` (cosmético)
- Next: commit

## 2026-08-16 — commit (implement + validate)

- Commit `39f893b` — 3 arquivos de produto + docs do step

## 2026-08-16 — tests-01 (S01-test-docker-browser-r01-tempo-extra-descanso)

- Mode: Docker+browser only | Result: PASS | Pointer: `tests-01/verdict.md`
- 9/9 casos confirmados; critério numérico validado por comparação same-tick (drift de tempo real por
  latência de round-trip do MCP, não defeito de lógica; o regression real que o critério guarda —
  trap N6, congelar/não reiniciar — não reproduziu)
- 2 não-regressões aceitas confirmadas e corretamente NÃO tratadas como falha: arco fantasma do anel,
  sem cor vermelha (ambas deferidas ao step 02)
- Next: close

## 2026-08-16 — close (S01-tempo-extra-descanso-r2)

- Return: step-fechado
- Recon: julgamento confirmado (reused from predecessor) → planner em opus
- Validation: APPROVED_WITH_RESALVAS, 1 round
- Test: Docker+browser, PASS na tests-01 → `tests-01/verdict.md`
- Commits: 39f893b (implement+validate), 9f1b029 (tests-01)
- Window at close: 119023 (pct=79, proj=149103) → reuse para step 02: não (perto do teto)
- Padrões apendados em memoria-da-task.md §9: contrato isOvertime/isRunning/isResting confirmado,
  molde hasAlertedRef, obrigatoriedade de stop() antes de start(), ressalva Math.floor vs ceil para
  o step 02, arco fantasma/sem cor confirmados como esperado, técnica de teste same-tick
