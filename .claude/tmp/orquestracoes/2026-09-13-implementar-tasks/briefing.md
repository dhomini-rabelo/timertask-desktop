# Briefing — implementar, uma de cada vez, as duas tasks já planejadas em `.claude/tmp/orquestracoes/`

## O pedido

> use a skill task-implementar-e-validar e implemente as tasks em .claude/tmp/orquestracoes/ uma de cada vez

## Perguntas e respostas

- Em que ordem implementar as duas tasks?
  → **Chips de projeto → task inline.**
- A task criada pelo "+ adicionar task" inline não vai receber o prefixo `"[projeto] "` dos
  chips: as duas specs foram escritas como se a outra não existisse, e nenhum `RT` cobre o
  cruzamento. O que fazer?
  → **Fechar a lacuna na segunda run.**
- A skill dá um `git push -u origin HEAD` ao fim de cada run, na branch
  `feat/add-projetos-e-inline-tasks`. Autoriza?
  → **Commitar e dar push ao fim de cada task.**
- A Etapa 6 registra as regras de negócio marcadas `(rn)` na doc de contexto que o cartão nomeia
  — aqui, o `CLAUDE.md` da raiz. Onde elas devem morar?
  → **Em `.claude/memory/business-rules/`.**

## As duas runs-alvo

| | Run A (primeira) | Run B (segunda) |
|---|---|---|
| Pasta | `.claude/tmp/orquestracoes/2026-09-13-chips-grupo-de-tasks/` | `.claude/tmp/orquestracoes/2026-09-13-inserir-task-inline/` |
| Entrega | chips de projeto abaixo do input, CRUD de projetos, switch global num modal de configurações; a task salva ganha o prefixo `"[projeto] "` | ponto de inserção "+ adicionar task" no hover entre tasks, seções Active/Paused/Pending, input inline que cria a task na posição e no estado daquela fresta |
| Checkpoints | 3 (23 passos) | 3 (10 passos) |
| `AC` / `RT` | 10 / 22 | 8 / 26 |
| Lanes | `browser`, `codigo` | `browser`, `codigo` |
| Marcos | nenhum | nenhum |
| Fixtures | sem mecanismo | sem mecanismo |
| Dificuldade | simples | simples |

Detalhe completo da comparação em [`r0-comparar.md`](r0-comparar.md), inclusive a sobreposição de
arquivos (só `src/pages/index/states/tasks/index.ts`, sem conflito) e o risco de plano velho
(nenhum passo de B fica desatualizado por A).

## Definição de pronto

As duas runs fechadas pela skill `task-implementar-e-validar`, em sequência, cada uma com:

- todos os `RT` da spec dela com veredito da Etapa 4 (`PASS`, `FAIL` ou `n/d` com motivo), lanes
  `browser` e `codigo`;
- `npx eslint . --fix` e `npx tsc --noEmit` verdes no último checkpoint;
- commits na branch `feat/add-projetos-e-inline-tasks` e um `git push -u origin HEAD` ao fim de
  cada run;
- `relatorio-final.md` desta pasta somando as duas, com o veredito por `AC` de cada uma.

Mais um item, que vale só para a run B: a task criada pelo ponto de inserção inline compõe o
prefixo `"[projeto] "` quando há chip de projeto selecionado, provado na lane `browser`.

## Fora do escopo

- Replanejar ou reescrever `spec.md` de qualquer uma das duas runs. O dev já as aprovou.
- Abrir PR.
- Editar o `CLAUDE.md`.
- Criar um script `lint`/`lint:fix` no `package.json`.
- Qualquer terceira task.

## Autorizações

- `git commit` pelos filhos que editam, e um `git push -u origin HEAD` ao fim de cada uma das
  duas runs, na branch `feat/add-projetos-e-inline-tasks`. Nada mais de rede.
- Escrita em `.claude/memory/business-rules/` na Etapa 6 de cada run.

## Premissas

- **O comando de verificação é `npx eslint . --fix`, depois `npx tsc --noEmit`.** O `package.json`
  não declara script `lint` nem `lint:fix`, então o `npm run lint:fix` que o `CLAUDE.md` e o
  `plano.md` da run A mandam rodar falharia. Todo filho que roda o gate usa a forma por `npx`, e
  isso vence o que o cartão e o plano escreverem.
- **"uma de cada vez" é sequencial e sem parada intermediária.** A run B começa quando a run A
  fecha, sem novo gate com o dev.
- **Cada run é uma execução inteira da skill `task-implementar-e-validar`** (Etapas 0 a 7), com o
  orquestrador da cadeia no papel de nível 0 dela e o `log-implementacao.md` da própria pasta.
- **Run bloqueada não recebe push** e não impede a run seguinte de começar: a cadeia reporta o
  bloqueio no relatório final e segue para B.
- **O fechamento da lacuna do prefixo entra como passo extra da run B**, fora do `plano.md`
  aprovado, e é o adaptador ou o próprio implementador quem o acomoda; ele sai nomeado no
  relatório final como desvio deliberado, autorizado pelo dev.
- **Ambiente corrigido antes da r0**: `.claude/tmp/` e `.claude/memory/` eram root-owned e nenhum
  filho conseguiria escrever ali. Corrigido com `sudo chown -R dev:devwork` (mais `CLAUDE.md` e
  `package-lock.json`) e `chmod g+w` nos diretórios de `.claude/`. Conteúdo intacto.
- **`.claude/tmp/` é versionado neste repo**, ao contrário do que a skill supõe. Todo commit dos
  filhos usa `git add` por caminho, então os arquivos da run não entram nos commits de código.
