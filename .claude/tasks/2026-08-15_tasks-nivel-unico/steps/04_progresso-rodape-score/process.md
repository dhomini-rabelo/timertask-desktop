# Process — step 04 `progresso-rodape-score` (último step)

- Recon: veredito `simples`, sem partição. `recon.md`.
- Plan: escalado para Opus (classe `julgamento` × veredito `simples` diverge). `plan.md` +
  `prompts/rodape-concluidas-grupo.md`.
- Implementação: 1 escopo, commit `b4b36c7`. Badge de grupo no accordion de concluídas + `IndexFooter`
  resolvendo o título via `Map` + remoção do órfão `IndexTaskNote.tsx`.
- `npx tsc --noEmit`: limpo.
- Validação (Opus, r1): APPROVED sem ressalvas. `validation-r1.md`.
- Docs de plano/recon/validação: commit `a45e46a`.
- Teste de sistema: browser, tentativa `tests-01`, **PASS 12/12**. `tests-01/verdict.md`. DnD `## Not run`
  (4ª confirmação, não automatizável neste ambiente). Commit `bfb14fc`.
- Nenhuma escalação, nenhum handoff necessário durante o step.

## Fechamento da task inteira (este é o step 04, o último)

O tester confirmou de ponta a ponta: nível único sem página 2, múltiplas tasks ativas em paralelo,
grupo via prefixo `>` (com guard de `>` sozinho), título "Tasks", progresso agregado no rodapé (grupo
fora do denominador) coexistindo com o progresso próprio de cada grupo, accordion de concluídas com
indicação de grupo, nota por-task, persistência, `IndexScore` (com as 2 esquisitices pré-existentes
documentadas como não-bug), Reset escopado ao workflow, e varredura de resíduos limpa. A task
"tasks-nivel-unico" está coerente ponta a ponta.
