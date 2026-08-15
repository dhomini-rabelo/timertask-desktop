# process.md — step 01 (modelo, store e migração para nível único)

Checklist do ciclo de 10 estágios (step-orchestrator.md). Reconstruído por um sucessor (nonce
`S01-tasks-nivel-unico-r2`) após o predecessor ser interrompido no meio do lançamento do tester.

- [x] 1a. RECON — `recon.md`. Veredito: **complexa** (partição em 2 lotes: A camada de estado, B UI).
- [x] 1b. PLAN — `plan.md` (Opus, por causa do veredito complexa) + `prompts/lote-a-camada-de-estado.md`
      + `prompts/lote-b-ui.md`.
- [x] 2. EXTRATO — `## Extrato do step` no topo de `orquestration.md`.
- [x] 3. IMPLEMENT — Lote A (camada de estado) e Lote B (UI) implementados. 20 arquivos alterados
      (5 Lote A + 15 Lote B, sendo 3 apagados). Commit `eec34ca`.
- [x] 4. LINT + TYPE-CHECK — `npx tsc --noEmit` limpo (exit=0), resultado oficial do step.
- [x] 5. VALIDATE — `validation-r1.md`: **APROVADO** de primeira, sem rodada de correção. 4 ressalvas
      registradas (não bloqueiam), repassadas à memória/steps seguintes.
- [x] 6. COMMIT da implementação + validação — `eec34ca` (27 arquivos, +1244/-1170).
- [x] 7. SYSTEM TEST — modo browser (`npm run dev` :1420). `tests-01` (nonce
      `S01-test-browser-r01-tasks-nivel-unico`): **FAIL** — bug de perda de `timeEvents` no ramo
      "legado sem subtasks" de `migrateEntry()` (`useStoredTasks.ts:95-107`). Fix de uma linha aplicado
      (`useStoredTasks.ts:102`). `tests-02` (nonce `S01-test-browser-r02-tasks-nivel-unico`): **PASS** —
      reproduz o caso exato do bug e confirma correção; resto do roteiro OK. Ver `tests-01/verdict.md`,
      `tests-02/verdict.md` e o `## Log` em `orquestration.md`.
- [x] 8. COMMIT das tentativas de teste / fixes — `aec2ee4` (tests-01 FAIL + notas de plano), `83722bb`
      (fix), commit de `tests-02` (ver git log).
- [x] 9. DOCS DO STEP + memória — este `process.md`, `orquestration.md` atualizados; seção
      `## Padrões capturados no step 01` adicionada a `memoria-da-task.md`.
- [x] 10. CLOSE — step fechado por `S01-tasks-nivel-unico-r2`.

## Nota da sucessão

Predecessor (nonce `S01-tasks-nivel-unico`) foi interrompido pelo usuário durante o lançamento do
tester de browser (nonce previsto `S01-test-browser-r01-tasks-nivel-unico`, tests-01). Nada foi
perdido: recon/plan/validação/commit já estavam em disco e commitados antes da interrupção. Este
sucessor (nonce `S01-tasks-nivel-unico-r2`) retomou no estágio 7, rodou `tests-01` (FAIL), aplicou o
fix, rodou `tests-02` (PASS) e fechou o step por conta própria, sem voltar ao nível 0.
