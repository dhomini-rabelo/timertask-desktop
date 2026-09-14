# Review — rodada 1 — inserir task inline, na posição certa

## Veredito
reprovado

## Escopo revisado
Diff completo contra a base da run (`2cb64f9`), lote checkpoints 1-3 (revisão única desta run):
- `src/pages/index/states/tasks/index.ts` (checkpoint 1)
- `src/pages/index/states/tasks/utils.ts` (checkpoint 1)
- `src/pages/index/hooks/useListingTasks.ts` (checkpoint 1)
- `src/pages/index/components/IndexTasks/shared-state.ts` (checkpoint 1)
- `src/pages/index/components/IndexTasks/IndexActiveTasksList/shared-components/IndexInsertTaskPoint.tsx` (novo, checkpoint 2)
- `src/pages/index/components/IndexTasks/IndexActiveTasksList/shared-components/IndexTasksSection.tsx` (novo, checkpoint 2)
- `src/pages/index/components/IndexTasks/IndexActiveTasksList/IndexActiveTasksList.tsx` (checkpoint 2)
- `src/layout/components/atoms/Input/index.tsx` (checkpoint 2, infra fora do plano literal — desvio registrado)
- `src/pages/index/components/IndexTasks/IndexActiveTasksList/IndexTaskGroup/IndexGroupTasksList.tsx` (checkpoint 3)

`git status --short` não mostra nenhum arquivo do produto fora da lista `Arquivos alterados` do
`implementacao.md`; nenhum arquivo ficou de fora por essa razão.

Sem `skills de contexto` de padrão de código específicas para este recorte (cartão do projeto
lista skills de processo — `task-especificar-e-planejar`, `task-implementar-e-validar`,
`save-memory` — nenhuma delas define convenção de escrita de código). Julguei a Lente 1 contra o
`## Padrão da vizinhança` do `reconhecimento.md` e contra o restante do código-fonte do repo
(convenção de comentários, só em inglês em todo o `src/`, verificado por grep).

## Blockers

### 1. Comentário em português no código — padrão
Onde: [src/pages/index/components/IndexTasks/IndexActiveTasksList/shared-components/IndexInsertTaskPoint.tsx:43-44](src/pages/index/components/IndexTasks/IndexActiveTasksList/shared-components/IndexInsertTaskPoint.tsx#L43)
O quê: o comentário `// Fecha em outra fresta (RT-017), por timeout (RT-012) ou por blur/Esc:
sempre reabre em branco na próxima vez, nunca com o texto de uma sessão anterior.` está em
português. Rodei `grep -nP "[ãáéíóúõçÃÁÉÍÓÚÕÇ]"` em todos os arquivos do diff e em todo o `src/`:
esse é o único comentário em português do repositório inteiro — todo o resto (`scoreUtils.ts`,
`useCountUpTimer.ts`, `IndexTasks.tsx`, `IndexScore.tsx`, todos com comentários de racional
semelhantes) está em inglês. É a violação exata que o protocolo do revisor lista em Lente 1:
"comentário... e código em português".
Conserto: traduzir o comentário para inglês, mantendo o mesmo racional, ex.: `// Closes when
another gap opens (RT-017), on timeout (RT-012), or via blur/Esc: always reopens blank next time,
never with text left over from a previous session.`

## Nits
nenhum.

## Gates conferidos
comando de verificação: ok (`npx eslint .` sem `--fix` — 0 erros, 6 warnings pré-existentes de
`react-hooks/exhaustive-deps`, nenhum em arquivo tocado por esta run; `npx tsc --noEmit` — sem
saída, sem erros)
comando de teste: nenhum (cartão do projeto: sem suíte automatizada)

## Plano em dúvida
nenhum. Os três checkpoints foram implementados fielmente ao `plano.md`: `createTask` extraído
literalmente do bloco que hoje mora dentro de `addTask`; `insertTask` usa o mesmo `findIndex` +
`slice`/`slice` com fallback de fim de array descrito no passo 2; `bucketByActivityStatus` é a
mesma lógica do `forEach` de `useListingTasks.ts`, agora compartilhada por `IndexGroupTasksList.tsx`
sem segunda cópia (RT-024 confirmado: nenhuma outra função de bucketing, nenhum outro bloco
cabeçalho+grade fora de `IndexTasksSection`); `sectionByItemId`/`handleDragEnd` da raiz
(`IndexActiveTasksList.tsx`) permanecem byte-a-byte os mesmos do commit-base, e o guard equivalente
foi replicado dentro do grupo, exatamente como o passo 10 pede. `package.json` não mudou (RT-001
confirmado por diff vazio). Os dois desvios registrados em `implementacao.md` (prefixo de projeto
RT-027, autorizado pelo dev fora da spec; `forwardRef` no `Input` compartilhado) são consistentes
com o resto do código: o prefixo replica fielmente a composição já usada em `IndexAddInput.tsx`
(mesma leitura de `useProjectsState`/`useStoredSettings`), e o `forwardRef` não altera nenhuma prop
nem estilo do `Input`, sem efeito nos demais consumidores (`IndexAddInput.tsx`, `IndexEditInput.tsx`).

## Premissas
- Julguei a Lente 1 sem uma skill de convenção de código dedicada (o cartão só lista skills de
  processo); usei o `reconhecimento.md` (`## Padrão da vizinhança`) e a leitura direta do restante
  do `src/` como padrão de comparação — em especial para a convenção de comentários (só inglês) e
  para a nomenclatura de constantes de tempo (`idleCloseDelayInMilliseconds` segue o padrão de
  `threeSecondsInMilliseconds` em `IndexErrorMessage.tsx`).
- Não tratei o desvio "prefixo de projeto (RT-027)" nem o desvio "`Input` ganha `forwardRef`" como
  achados de escopo: ambos estão documentados em `implementacao.md` como autorizados/necessários, e
  o código de ambos é correto e consistente com o padrão já existente no repo (verificado
  linha a linha contra `IndexAddInput.tsx`).
