# Atualização de contexto — inserir task inline, na posição certa

## Escopo
raiz (pacote único) — baseline 07fd675 (`fix(tasks): isola o hover do ponto de inserção com group
nomeado`, HEAD da run no início desta etapa).

## Regras registradas
- AC-005 — input inline vazio some sozinho após 20s sem interação; com texto, nunca some por
  tempo →
  [.claude/memory/business-rules/insercao-inline-tasks.md](../../../memory/business-rules/insercao-inline-tasks.md)
- AC-007 — task inserida numa fresta nasce no mesmo estado de atividade da seção (ativa/pausada/
  pendente), reusando `executeTask`/`stopTask` já existentes →
  [.claude/memory/business-rules/insercao-inline-tasks.md](../../../memory/business-rules/insercao-inline-tasks.md)
- AC-008 — a lista de dentro de um grupo passa a ser seccionada em Active/Paused/Pending, com a
  mesma função e o mesmo componente de seção da listagem geral →
  [.claude/memory/business-rules/insercao-inline-tasks.md](../../../memory/business-rules/insercao-inline-tasks.md)

As três foram registradas num arquivo só, novo (`insercao-inline-tasks.md`), porque são a mesma
unidade de assunto (a feature de inserção inline) e nenhuma entrada existente em
`business-rules/` era dona dele.

## Documentação alterada
- [.claude/memory/business-rules/insercao-inline-tasks.md](../../../memory/business-rules/insercao-inline-tasks.md) — novo. As três regras acima, com o motivo e o arquivo de código que aplica cada uma (`IndexInsertTaskPoint.tsx`, `insertTask` em `states/tasks/index.ts`, `bucketByActivityStatus` em `states/tasks/utils.ts`, `IndexTasksSection.tsx`, `IndexGroupTasksList.tsx`).
- [.claude/memory/business-rules/README.md](../../../memory/business-rules/README.md) — nova linha de índice apontando para o arquivo acima, sem remover nenhuma entrada existente.

## Não alterada, e por quê
- `CLAUDE.md` — o campo `docs de contexto` do cartão (`projeto.md`) nomeia `CLAUDE.md`, mas a
  premissa desta cadeia (confirmada na run anterior, chips-grupo-de-tasks) é que o destino das
  regras de negócio `(rn)` é `.claude/memory/business-rules/`, e editar `CLAUDE.md` está fora de
  escopo. Essa decisão vence sobre o campo do cartão.
- Nenhum outro arquivo de código ou doc: a run não alterou nenhum fluxo de sistema documentado em
  outro lugar (RT-027, o prefixo de projeto na inserção inline, é extensão de uma regra já
  registrada em `projetos-chips-prefixo-titulo.md` na run anterior — mesma composição, mesmo
  arquivo de origem — e não constitui regra nova nem contradiz a existente, então não editei
  aquele arquivo de memória).

## Pendente
nada — as três `AC (rn)` foram registradas no destino durável (`.claude/memory/business-rules/`).

## Premissas
- Segui a mesma premissa já usada e confirmada na run A (chips-grupo-de-tasks): destino das `AC
  (rn)` é `.claude/memory/business-rules/`, sem tocar `CLAUDE.md`, apesar de o `projeto.md`
  nomear `CLAUDE.md` em `docs de contexto`.
- `skills de contexto` no cartão lista `task-especificar-e-planejar`, `task-implementar-e-validar`,
  `save-memory` e o agente `browser-tester` — nenhuma delas é uma skill de varredura de contexto
  (reconciliação doc-vs-código); são as skills da própria orquestração. Tratei isso como
  equivalente a "nenhuma" e não rodei nenhum workflow de varredura: devolvo `sem varredura`, sem
  inventar uma reconciliação por conta própria.
- `git --no-pager status --short` mostra arquivos sujos de outras runs/etapas (pasta
  `2026-09-13-chips-grupo-de-tasks/`, `2026-09-13-implementar-tasks/`, `.playwright-mcp/`,
  `state-check.png`) — não são desta etapa, deixei-os como estavam e não entraram no commit
  abaixo.
- As três `AC (rn)` foram agrupadas num único arquivo de memória em vez de três arquivos
  separados, mesmo critério da run anterior: mesma unidade de negócio, um dono por assunto.
- RT-027 (prefixo de projeto na task inline, adição autorizada fora da spec, ver
  `implementacao.md`) não gerou entrada nova nem edição em `projetos-chips-prefixo-titulo.md`:
  ele reusa a composição já documentada ali (`"[nome do projeto] título"` no momento do save),
  só com uma segunda origem de chamada; a regra em si não mudou.

## Commit
ee50ce6 — docs(memory): registra regras de insercao inline e seccionamento do grupo em business-rules
