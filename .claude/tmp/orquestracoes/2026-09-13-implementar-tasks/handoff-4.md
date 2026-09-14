# Handoff O4 → O5

Briefing: .claude/tmp/orquestracoes/2026-09-13-implementar-tasks/briefing.md
Ledger desta cadeia: .claude/tmp/orquestracoes/2026-09-13-implementar-tasks/log.md

Raiz do repo: `/root/so/repos/timertasks/timertask-desktop-tree-1`. Todo caminho abaixo é relativo
a ela.

## Próxima rodada

Dispare a Etapa 3 (implementação, checkpoint 1 de 3) da run B agora, sem reler `SKILL.md` da
skill `task-implementar-e-validar` inteira — este handoff já traz o que você precisa dela.

```text
subagent_type: 'general-purpose'
model: 'sonnet'
description: 'impl-inserir-task-inline'
run_in_background: false
```

Passe, como caminhos (nunca conteúdo colado):
- `.claude/skills/task-implementar-e-validar/prompts/implementador.md`
- `.claude/tmp/orquestracoes/2026-09-13-inserir-task-inline/plano.md`
- `.claude/tmp/orquestracoes/2026-09-13-inserir-task-inline/spec.md`
- `.claude/tmp/orquestracoes/2026-09-13-inserir-task-inline/projeto.md`
- `.claude/tmp/orquestracoes/2026-09-13-inserir-task-inline/reconhecimento.md` (é `k==1`, ele lê
  a leitura dirigida + veredito de dificuldade)
- a pasta da run: `.claude/tmp/orquestracoes/2026-09-13-inserir-task-inline/`

O `log-implementacao.md` de B **já tem o cabeçalho escrito** por mim (campos confirmados:
Spec 8 AC/26 RT, Onda única, Ambiente `npm run dev`:1420, Pré-requisito nenhum, Fixtures sem
mecanismo, comando de verificação por `npx`; campos ainda a confirmar: Checkpoints/Marcos/
Dificuldade/Lanes exatos, que vêm no retorno do implementador — atualize-os lá em vez de
recriar o arquivo). Não reescreva o cabeçalho do zero.

**Passo extra a incluir no prompt do implementador, além dos caminhos acima** (autorizado pelo
dev no gate desta cadeia, não é desvio do `plano.md` de B): depois de implementar os passos do
plano, ele adapta o ponto de criação da task inline ("+ adicionar task") para compor o prefixo
`"[projeto] "` quando há chip de projeto selecionado — a mesma composição que
`IndexAddInput.tsx` já usa na run A (ver `src/pages/index/hooks/useStoredSettings.ts` e
`src/pages/index/states/projects` para como A resolveu isso). Ele registra esse passo como
**desvio deliberado** (adição autorizada, não falha) em `implementacao.md` de B, inventa um `RT`
para cobrir o cruzamento (não existe no `spec.md` de B) e prova-o na lane `browser` da Etapa 4 —
não na Etapa 3.

Diga também, no mesmo prompt: *"não chame `AskUserQuestion`; toda ambiguidade vira premissa
assumida e documentada no seu arquivo"*; e o bloco de teto de janela do filho (150k / 60 turns,
`.claude/skills/task-implementar-e-validar/scripts/medir-janela.sh --self`).

### O que fazer com o retorno do implementador (sem reabrir SKILL.md)

- Ele devolve: checkpoint (1 de 3), arquivos alterados, gate ok/vermelho, branch, base da run
  (`git rev-parse HEAD` antes da 1ª edição), hash do commit, as **lanes** do plano
  (`browser`, `codigo`, confirme), o **total de checkpoints** (3, confirme), **marcos** (nenhum,
  confirme) e **dificuldade** (simples, confirme) — atualize o cabeçalho do
  `log-implementacao.md` com esses valores confirmados e acrescente a linha da Etapa 3 na tabela.
- **Guarde o `agentId`** do implementador: as Etapas 3.5 e a correção o reusam por `SendMessage`.
- **Cadência de review para N=3**: `L=1` (lote único), o review sobe **só no checkpoint 3** (o
  último). Nos checkpoints 1 e 2, se `aprovado`/sem review ainda necessário, mande o implementador
  seguir direto para o próximo checkpoint via `SendMessage` para o `agentId` guardado, sem passar
  caminho de review nenhum. Só depois do checkpoint 3 (`k == N`) dispare o revisor
  (`prompts/revisor.md`, `model: sonnet`, `description: review-inserir-task-inline-r1`), passando
  `plano.md`, `spec.md`, `projeto.md`, `implementacao.md`, `reconhecimento.md`, a pasta da run, o
  número da rodada (`n=1`) e o lote (`checkpoints 1 a 3`).
- Se o implementador voltar com `handoff` (150k/60 turns), dispare um sucessor **fresco** com os
  caminhos de `plano.md` e `implementacao.md` (mais `review-{n}.md` só se houver conserto
  pendente) — ver Etapa 3.5 do `SKILL.md` se precisar do detalhe exato, mas o essencial já está
  aqui.

## Pendências, em ordem

1. Run B — Etapa 3, checkpoint 1 de 3 (fundação: `insertTask`, `bucketByActivityStatus`,
   `insertingBeforeId`) — ainda não disparado.
2. Run B — Etapa 3, checkpoints 2 e 3 (ponto de inserção na raiz; seccionamento do card do
   grupo).
3. Run B — passo extra do prefixo `"[projeto] "` na criação inline (ver acima), a acomodar dentro
   do checkpoint que cria a task de fato (2 ou 3, conforme o implementador confirmar).
4. Run B — Etapa 3.5 (review, lote único, dispara só no checkpoint 3, `N=3`).
5. Run B — Etapa 4 (validação final, lanes `browser` e `codigo`, sem marco, sem `n/d` esperado).
6. Run B — Etapa 5 (correção), só se algum RT `[MUST]` reprovar.
7. Run B — Etapa 6 (contexto): destino de `AC (rn)` é `.claude/memory/business-rules/`, não
   `CLAUDE.md` (fora do escopo, mesma premissa da run A).
8. Run B — Etapa 7: `git push -u origin HEAD` na branch `feat/add-projetos-e-inline-tasks` (já
   publicada no remoto pela run A — o push de B só soma commits novos).
9. Depois das duas runs fechadas, escrever
   `.claude/tmp/orquestracoes/2026-09-13-implementar-tasks/relatorio-final.md` somando as duas e
   retornar `bloco: fim`.

## Já fechado

- **Run A (chips-grupo-de-tasks): entregue, 10/10 AC, 22/22 RT PASS.** Nada a reabrir; resumo
  completo no handoff-3.md desta pasta (não precisa reler: push já dado, branch publicada).
- Run B: planejamento completo (spec.md, plano.md, projeto.md, reconhecimento.md, roteiro.md) já
  existia antes desta rodada. Nesta rodada (O4) eu só escrevi o **cabeçalho** de
  `.claude/tmp/orquestracoes/2026-09-13-inserir-task-inline/log-implementacao.md` — nenhum filho
  disparado ainda, checkpoint 1 segue pendente.

## Armadilhas

- **`npm run lint:fix` não existe.** Use sempre `npx eslint . --fix` + `npx tsc --noEmit` — o
  `projeto.md` de B ainda cita a forma errada num comentário lateral, mas o campo mesmo já foi
  corrigido para a forma `npx`.
- **`.claude/tmp/` é versionado neste repo.** `git add` só por caminho, nunca `-A`.
- Branch já é `feat/add-projetos-e-inline-tasks`, já publicada no remoto — nenhum filho cria
  branch nova.
- Nenhum `agentId` desta sessão (O4) foi criado — nada a reusar por `SendMessage` ainda; o
  implementador que você disparar é o primeiro `agentId` da run B.
- **Não abra `plano.md`/`spec.md` você mesmo "para conferir"**: os campos do cabeçalho marcados
  "a confirmar" chegam no retorno do implementador. Abrir o arquivo você mesmo é o mesmo custo que
  esta skill existe para evitar (nível 0 nunca lê plano/spec).

## Premissas

Todas as do `briefing.md` da cadeia continuam valendo (comando de verificação por `npx`,
sequencial sem parada entre A e B, run bloqueada não recebe push mas não impede B, lacuna do
prefixo vira passo extra de B, ambiente já corrigido, `.claude/memory/business-rules/` como
destino de regra de negócio em vez de `CLAUDE.md`). Nenhuma premissa nova travada nesta rodada.

## Estado do mundo

- Branch `feat/add-projetos-e-inline-tasks` publicada no remoto (`origin`), com os 5 commits da
  run A. Nenhum commit novo desta rodada (só arquivos da pasta de orquestração, gitignored).
- Nenhum serviço (`npm run dev`) de pé — precisa subir na primeira lane de teste da Etapa 4 de B.
- Árvore de trabalho limpa quanto a código do projeto; só arquivos de `.claude/tmp/orquestracoes/`
  e `.playwright-mcp/` seguem untracked/modified, nenhum bloqueando a run B.

## Janela

Fechei em ~88k de 140k (pct=62), 5 turns de 50, `status=handoff` por projeção (taxa=11021,
proj=363k) — a taxa está inflada por um turno único de leitura grande (o `SKILL.md` de 1319
linhas, lido em duas chamadas, mais `briefing.md`, o handoff anterior, `plano.md` e `projeto.md`
de B para escrever o cabeçalho do ledger). Não é laço: nada foi repetido, e este é o primeiro
handoff desta cadeia sem redução de pendência (o anterior, O3→O4, fechou a run A inteira) — não
conta como "segundo seguido" pela regra de girar em falso. Decidi não abrir a frente de disparar
o implementador nesta janela porque o protocolo manda "nenhuma frente nova" sob `status=handoff`,
e preferi deixar o cabeçalho do ledger pronto e este handoff bem explícito, para que O5 dispare a
Etapa 3 imediatamente, sem pagar de novo a leitura do `SKILL.md`.
