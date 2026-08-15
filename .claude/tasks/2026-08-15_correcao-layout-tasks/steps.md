# steps.md — correcao-layout-tasks

Base: `main` @ `830b0f3` (task `tasks-nivel-unico` fechada). 2 steps.

| NN | slug | Objetivo (1 linha) | Depende de |
|----|------|--------------------|------------|
| 01 | `overflow-horizontal-e-colapso-grupo` | Matar o overflow horizontal da linha de ações do card de task (scrollbar horizontal + card cortado nos prints `test-1/test-2`) e fazer o chevron de colapsar funcionar em grupo com task ativa/rodando. | — |
| 02 | `scroll-vertical-ativas-e-inativas` | Tirar o scroll interno da lista de tasks **ativas** (a página passa a esticar e a rolar), e passar o scroll interno para a lista de tasks **concluídas/inativas**. | 01 |

## Agrupamento — por que 2 e não 3 (nem 1)

São 3 bugs, mas 2 steps. Justificativa, para que nenhum agente adiante re-divida isto:

- **Bug "overflow horizontal" + bug "colapsar grupo ativo" foram fundidos no step 01** porque ambos são
  correções *dentro do card*, no mesmo diretório `IndexActiveTasksList/`, validadas na mesma sessão de
  browser, com a mesma tela e o mesmo fixture. O colapso sozinho é uma correção trivial (provavelmente
  1-3 linhas) — um step só para ele seria overhead puro de orquestração (recon+plan+implement+validate+
  test para 3 linhas). São arquivos vizinhos (`IndexTaskItem/*` e `IndexTaskGroup/*`), sem conflito.
- **Bug "scroll vertical" ficou sozinho no step 02** porque, apesar de parecer o menor, ele é o único que
  sai do card e mexe no **shell da página** (`page.tsx`, `global.css`, `IndexTasks.tsx`, `IndexFooter.tsx`).
  É o de maior raio de regressão (pode quebrar o layout de duas colunas, o header, o IndexTimer e o
  IndexScore), e o único cuja validação exige olhar a **página inteira**, não o card. Modo de teste e
  superfície de regressão claramente diferentes ⇒ split legítimo pelo critério "a validação difere".
- **Ordem 01 → 02 é obrigatória, não estética.** O container `IndexTasks.tsx:30` tem `overflow-y-auto`;
  por spec de CSS isso computa `overflow-x: auto`, e é *ele* que está transformando o conteúdo largo
  demais do card em scrollbar horizontal. Se o step 02 rodar primeiro e remover esse `overflow-y-auto`
  com o card ainda largo demais, o overflow deixa de virar scrollbar e passa a **vazar por cima do
  layout** (pior que o bug atual). Consertar a largura do card ANTES é o que torna a remoção do
  container segura.
- **Não juntei tudo em 1 step** porque o step único teria de tocar `page.tsx` + `global.css` (shell
  global) *e* 3 componentes de card na mesma leva, com um único teste de sistema cobrindo regressão de
  card e regressão de página ao mesmo tempo — é exatamente o tipo de unidade que estoura janela e
  produz plano raso.

## Medição de janela do meta-planner

Nonce `meta-correcao-layout-tasks`. Checkpoint final, com todos os arquivos já escritos:
`janela=101392 teto=150000 pct=67 turns=52 taxa=1755 proj=136492 status=ok fonte=exato`.
Sem handoff. Nenhuma pergunta foi levada ao usuário (batch = 0 tópicos, ver `answers.md`).
