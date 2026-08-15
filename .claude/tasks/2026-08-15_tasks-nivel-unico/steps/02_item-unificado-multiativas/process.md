# Process — step 02: item unificado e múltiplas tasks ativas

- **Recon**: veredito `complexa` (fusão de layout + 2 decisões de produto em aberto). `recon.md`.
- **Plan**: Opus, 12 premissas (A1-A12) fechando nome do componente, fonte da verdade visual
  (`isTimerActive`) e efeito bidirecional de sync. Escopo único, sem partição. `plan.md`.
- **Implementação**: 1 rodada, sem retrabalho. `git mv` puro (rename real, não delete+create) +
  reescrita do corpo + ajuste em `IndexSortableTaskItem.tsx`. `tsc --noEmit` limpo.
- **Validação**: APPROVED na 1ª rodada (Opus). 5 ressalvas de registro (R1-R5), nenhuma bloqueante.
  `validation-r1.md`.
- **Commit implementação+validação**: `9e8ea62`.
- **Teste de sistema**: browser, `tests-01/`, PASS 9/9 casos executáveis na 1ª tentativa. DnD = Not run
  (limitação de ambiente, herdada do step 01). `tests-01/verdict.md`.
- **Commit teste**: `3877612`.
- **Rounds de correção**: 0. **Escalação**: nenhuma.
