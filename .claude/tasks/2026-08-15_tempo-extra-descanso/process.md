# Process — tempo-extra-descanso

Date: 2026-08-15
Skill: claude-step-loop
Git: branch main | commit-base a8f2b56

## Todo

- [x] Bootstrap root folder + root docs + git state captured
- [x] Meta-plan (Opus) — clarifying questions batch: ZERO perguntas (13 premissas travadas)
- [x] Meta-plan — steps.md + answers.md + memoria-da-task.md + plan-simplified.md per step
- [x] Commit: meta-plan
- [x] Step 01 — overtime-no-store-e-descanso-proporcional (PASS tests-01, commits 39f893b/9f1b029/5c1282d)
- [x] Step 02 — sinalizacao-vermelha-do-overtime (PASS tests-01, commits 7997ddc/f42dedd/2ac212c)
- [x] Close task + user summary

## Steps status

| Step | Slug | Class | Stage orchestrator | Status | Last test |
|------|------|-------|--------------------|--------|-----------|
| 01 | overtime-no-store-e-descanso-proporcional | julgamento | S01-tempo-extra-descanso-r2 | done | tests-01 PASS |
| 02 | sinalizacao-vermelha-do-overtime | julgamento | S02-tempo-extra-descanso | done | tests-01 PASS |

## Notes

- Pedido do usuário: ao terminar o timer de atividade, o cronômetro continua contando em negativo
  (tempo extra). Ao iniciar o descanso, o tempo extra trabalhado deve incrementar o descanso
  proporcionalmente (ex.: 25/5 → trabalhou 30 → descansa 6). Cor vermelha para expressar tempo extra.
