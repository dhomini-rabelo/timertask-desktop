# Atualização de contexto — chips de projeto abaixo do input de adicionar task

## Escopo
raiz (pacote único) — baseline 503d5c1 (`fix(projects): corrige race de hidratacao no
useStoredSettings (RT-020)`, HEAD da run no início desta etapa).

## Regras registradas
- AC-003 — com um projeto selecionado, a task salva nasce como `"[nome do projeto] título
  digitado"`; sem seleção, o título sai exatamente como digitado →
  [.claude/memory/business-rules/projetos-chips-prefixo-titulo.md](../../../memory/business-rules/projetos-chips-prefixo-titulo.md)
- AC-008 — switch "Projetos" no modal de configurações do header, ativo por padrão e global
  (um só para o app); desligado, chips e chip de configuração somem sem reservar espaço →
  [.claude/memory/business-rules/projetos-chips-prefixo-titulo.md](../../../memory/business-rules/projetos-chips-prefixo-titulo.md)
- AC-009 — desativar a função, renomear ou excluir um projeto não muda o título de nenhuma task
  já salva →
  [.claude/memory/business-rules/projetos-chips-prefixo-titulo.md](../../../memory/business-rules/projetos-chips-prefixo-titulo.md)

As três foram registradas num arquivo só, porque são a mesma unidade de assunto (a feature de
projetos/chips) e nenhuma entrada existente em `business-rules/` era dona dele — a única entrada
anterior (`razao-de-negocio-e-casos-de-uso-v1.md`) é de outro produto (Ben), como o `projeto.md`
já apontava.

## Documentação alterada
- [.claude/memory/business-rules/projetos-chips-prefixo-titulo.md](../../../memory/business-rules/projetos-chips-prefixo-titulo.md) — novo. As três regras acima, com o motivo e o arquivo de código que aplica cada uma.
- [.claude/memory/business-rules/README.md](../../../memory/business-rules/README.md) — nova linha de índice apontando para o arquivo acima, sem remover a entrada existente.

## Não alterada, e por quê
- `CLAUDE.md` — o campo `docs de contexto` do cartão (`projeto.md`) nomeia `CLAUDE.md`, mas o
  delta desta etapa instruiu explicitamente não editá-lo: o dev, no gate da cadeia-mãe, decidiu
  que o destino das regras de negócio desta run é `.claude/memory/business-rules/`, e que editar
  `CLAUDE.md` está fora do escopo desta task. Essa decisão é mais recente que o cartão e vence.
- Nenhum outro arquivo de código ou doc: a run não alterou nenhum fluxo de sistema documentado em
  outro lugar (o único destino de doc apontado no cartão além de `CLAUDE.md` é a própria memória
  de negócio, já coberta acima).

## Pendente
nada — o cartão aponta um destino durável (`.claude/memory/business-rules/`) para as regras, e as
três `AC (rn)` foram registradas nele.

## Premissas
- Segui a instrução do delta desta etapa (não do `projeto.md`) quanto ao destino das `AC (rn)`:
  `.claude/memory/business-rules/`, sem tocar `CLAUDE.md`. Registrado aqui porque diverge do que o
  cartão da run nomeia em `docs de contexto`.
- `skills de contexto: nenhuma skill de contexto de unidade` no cartão → item 1 (varredura) desta
  etapa não roda; devolvo `sem varredura`, sem inventar uma reconciliação de contexto por conta
  própria.
- Repo de projeto único: nome do arquivo de memória sem prefixo (`backend-`/`mobile-`/`design-`
  não se aplicam aqui), conforme apontado no delta.
- `git --no-pager status --short` mostra arquivos sujos de etapas anteriores desta mesma run
  (`implementacao.md`, `log-implementacao.md`, `review-*.md`, `teste-*.md`, `screenshots/`,
  `.claude/tmp/orquestracoes/2026-09-13-implementar-tasks/`, `.playwright-mcp/`) — não são desta
  etapa (atualização de contexto), deixei-os como estavam e não entraram no commit abaixo.
- As três `AC (rn)` foram agrupadas num único arquivo de memória em vez de três arquivos
  separados: são a mesma unidade de negócio (a feature de projetos) e a skill `save-memory` prefere
  atualizar/manter um dono por assunto a criar quase-duplicados.

## Commit
2cb64f9 — docs(memory): registra regras de projeto/chips/switch em business-rules
