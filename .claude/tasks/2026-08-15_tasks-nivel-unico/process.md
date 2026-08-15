# Process — tasks-nivel-unico

Date: 2026-08-15
Skill: claude-step-loop
Git: branch main | commit-base d4204d3

## Todo

- [x] Bootstrap root folder + root docs + git state captured
- [x] Meta-plan (Opus) — clarifying questions batch (ONE, for every step) — 4 tópicos, respondidos
- [x] Meta-plan — steps.md + answers.md + memoria-da-task.md + plan-simplified.md per step
- [x] Commit: meta-plan
- [ ] Step 01 — modelo-store-migracao
- [ ] Step 02 — item-unificado-multiativas
- [ ] Step 03 — grupos-prefixo
- [ ] Step 04 — progresso-rodape-score
- [ ] Close task + user summary

## Steps status

| Step | Slug | Class | Stage orchestrator | Status | Last test |
|------|------|-------|--------------------|--------|-----------|
| 01 | modelo-store-migracao | julgamento | S01-tasks-nivel-unico | pending | |
| 02 | item-unificado-multiativas | julgamento | S02-tasks-nivel-unico | pending | |
| 03 | grupos-prefixo | julgamento | S03-tasks-nivel-unico | pending | |
| 04 | progresso-rodape-score | julgamento | S04-tasks-nivel-unico | pending | |

Gate estático de cada step: `npx tsc --noEmit` (não há suíte de testes nem Dockerfile no repo).
Teste de sistema: browser via `npm run dev` (Vite :1420).

## Notes

- Pedido do usuário (verbatim, PT-BR):
  - devemos poder ativar mais de uma task por vez
  - tasks devem ficar somente no nível 1 (só feita ou não feita)
  - para criar um grupo de tasks devemos começar com `>` ou `> `
  - mudar título para somente "Tasks"
  - todas as tasks devem ser vistas na página 1 (hoje só o grupo aparece; ver `image.png`, task "teste 2") — tudo no nível um
  - no nível um deve mostrar task + tasks concluídas + progresso, igual hoje nas tasks de grupo
- Screenshot de referência: `image.png` na raiz do repo.
