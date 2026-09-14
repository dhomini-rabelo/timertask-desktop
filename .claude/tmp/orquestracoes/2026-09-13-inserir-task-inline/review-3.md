# Review — rodada 3 — inserir task inline, na posição certa

## Veredito
aprovado

## Escopo revisado
`git show 07fd675` sobre a base do `review-2.md` (aprovado): único arquivo tocado,
`src/pages/index/components/IndexTasks/IndexActiveTasksList/shared-components/IndexInsertTaskPoint.tsx`
(2 linhas trocadas). Nenhum outro arquivo do lote 1-3 mudou.

## Blockers
nenhum.

## Nits
nenhum.

## Gates conferidos
comando de verificação: ok (`npx eslint .` sem `--fix` — 0 erros, os mesmos 6 warnings
pré-existentes de `react-hooks/exhaustive-deps`, nenhum novo; `npx tsc --noEmit` — sem saída, sem
erros)
comando de teste: nenhum (cartão do projeto: sem suíte automatizada)

## Blockers da rodada anterior
nenhum — `review-2.md` já era `aprovado`, zero blockers. Este é um achado da Etapa 4 (RT-011/AC-004
reprovado na validação), não um blocker desta review; trato-o como o diff novo desde a rodada 2.

## Novos nesta rodada
Analisei o conserto do commit `07fd675` como possível regressão de padrão ou causa raiz mal
endereçada — nenhum blocker encontrado:
- **Causa raiz confere.** `IndexTaskGroup.tsx:90` usa a classe genérica `group` no card (para
  revelar os botões de ação do card no próprio hover, linha 114:
  `group-hover:opacity-100`). Como o card é ancestral de toda fresta renderizada dentro dele
  (via `IndexGroupTasksList.tsx` → `IndexTasksSection` → `IndexInsertTaskPoint`), o `group-hover`
  genérico que `IndexInsertTaskPoint` também usava casava com esse mesmo ancestral — hover em
  qualquer fresta do grupo acendia `:hover` no card inteiro, e todo `group-hover:opacity-100`
  descendente (inclusive o de outras frestas irmãs) acendia junto. Na raiz isso não acontecia
  porque lá as frestas nunca têm um `group` ancestral (confirmado: nenhum outro `group`/`group-hover`
  genérico entre `IndexTasksSection`/`IndexActiveTasksList` e a fresta).
- **O conserto isola corretamente.** Renomear para `group/insert-point` +
  `group-hover/insert-point:opacity-100` restringe o casamento ao ancestral nomeado mais próximo —
  que passa a ser o próprio `div` da fresta (ela é ao mesmo tempo o portador do nome e o elemento
  hoverado), nunca mais o `group` genérico do card. Tailwind 4.1.17 (`package.json`) suporta a
  sintaxe de group nomeado nativamente; não há dependência nova.
- **Não quebra os outros usos já revisados.** `grep -rn "group/\|group-hover/" src` confirma que
  `insert-point` é o único nome usado no repo — não colide com nenhum outro group nomeado. O
  `group`/`group-hover:opacity-100` genérico de `IndexTaskGroup.tsx:90/114` continua intocado
  (fora do diff) e continua funcionando para os botões de ação do card, porque ele nunca lia o
  nome `insert-point` para começo de conversa. Cada instância de `IndexInsertTaskPoint` carrega seu
  próprio `div` com o nome — frestas irmãs dentro do mesmo grupo não interferem entre si nem antes
  nem depois do conserto (o vazamento era só fresta → ancestral do card, nunca fresta → fresta
  direto). Na raiz, sem `group` ancestral algum, o comportamento por instância não muda.

## Plano em dúvida
nenhum.

## Premissas
nenhuma nova além das já registradas em `review-1.md`/`review-2.md`.
