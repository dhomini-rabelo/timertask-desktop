# Handoff O5 → O6

Briefing: .claude/tmp/orquestracoes/2026-09-13-implementar-tasks/briefing.md
Ledger desta cadeia: .claude/tmp/orquestracoes/2026-09-13-implementar-tasks/log.md

Raiz do repo: `/root/so/repos/timertasks/timertask-desktop-tree-1`. Todo caminho abaixo é relativo
a ela.

## Estado da run B (inserir-task-inline)

Pasta: `.claude/tmp/orquestracoes/2026-09-13-inserir-task-inline/`
Ledger de B (leia primeiro, tem tudo confirmado): `log-implementacao.md` dessa pasta.

- Etapa 3 (implementação): **fechada**. 3 checkpoints, commits `fcbe30a`, `83d38b3`, `cbb2b74`,
  mais a correção do review `2c1fa0f`. RT-027 (prefixo `"[projeto] "`, novo, fora da spec.md
  original) implementado no checkpoint 2, dentro de `IndexInsertTaskPoint.tsx`.
- Etapa 3.5 (review, lote único checkpoints 1-3): **aprovado** na rodada 2 (`review-2.md`), depois
  de corrigir 1 blocker de comentário em português na rodada 1 (`review-1.md`).
- Etapa 4 (validação final), rodada 1:
  - Lane `codigo` (`teste-1-codigo.md`): **PASS 5/5** — RT-001, RT-002, RT-003, RT-021 (AC-007),
    RT-024 (AC-008).
  - Lane `browser` (`teste-1-browser.md`): **FAIL**. 13 PASS, 1 PASS com ressalva (RT-006,
    deslocamento medido = altura do próprio ponto, 28px, dentro do limite), 1 FAIL MUST, 1 n/d:
    - **RT-011 (AC-004) [MUST] FAIL** — hover numa fresta do grupo vaza e revela o rótulo de outra
      fresta do **mesmo grupo**; não ocorre na raiz. Criação/posição das tasks em si funcionam, só
      o hover vaza. **Isto é o que precisa de correção.**
    - **RT-025 (AC-008) [MUST] n/d** — o tester não conseguiu disparar os sensors do `dnd-kit` com
      simulação de ponteiro neste ambiente, **nem no controle da raiz** (mecanismo pré-existente,
      não é regressão desta run — o próprio tester confirmou isso testando o controle já existente
      antes desta feature). Não é bug de código; é limitação da ferramenta de teste (Playwright
      não consegue acionar os sensors do `dnd-kit` por simulação de ponteiro). **Não é FAIL, não
      vai para a Etapa 5** — mas é uma ressalva que precisa aparecer no `relatorio-final.md`, e
      contraria a premissa da cadeia de que não haveria `n/d` nesta validação. Decida ao fechar a
      AC-008: ela tem RT-021/RT-023/RT-024/RT-026 em PASS; só RT-025 ficou sem prova. Julgamento
      sugerido (não travado): registrar AC-008 como entregue com ressalva do n/d, já que o gap é
      de ferramenta e pré-existente, não desta implementação — mas quem fecha a run decide.
    - RT-027 (novo): **PASS**, confirmado com screenshot
      (`screenshots/r1-rt027-prefixo-projeto.png`).

## Próxima rodada — Etapa 5 (correção de RT-011)

Dispare o implementador de correção, `sonnet`, `general-purpose`, sem reler o `SKILL.md` inteiro
(a seção "Etapa 5 — correção" é curta; se precisar do detalhe exato do protocolo de correção, ela
está logo depois da Etapa 4 no `SKILL.md`, mas o essencial: implementador corrige, roda o gate,
comita, atualiza `implementacao.md`).

Passe, como caminhos:
- `.claude/skills/task-implementar-e-validar/prompts/implementador.md`
- `.claude/tmp/orquestracoes/2026-09-13-inserir-task-inline/plano.md`
- `.claude/tmp/orquestracoes/2026-09-13-inserir-task-inline/spec.md`
- `.claude/tmp/orquestracoes/2026-09-13-inserir-task-inline/implementacao.md`
- `.claude/tmp/orquestracoes/2026-09-13-inserir-task-inline/teste-1-browser.md` (o `RT` que
  reprovou, com a descrição do bug e as provas)
- a pasta da run

Descreva o bug a corrigir: **RT-011 (AC-004) — hover numa fresta do grupo revela o rótulo (tooltip
ou indicador de posição) de outra fresta do mesmo grupo**, quando deveria mostrar só o rótulo da
fresta sob o cursor. Não ocorre no comportamento equivalente da raiz — o bug é específico do
seccionamento por seção dentro do card do grupo (`IndexGroupTasksList.tsx`, do checkpoint 3).
Instrua o implementador a olhar `teste-1-browser.md` para as provas exatas (screenshots) antes de
mexer no código.

Depois da correção:
1. **Etapa 3.5 obrigatória entre correção e nova validação** (protege contra regressão do próprio
   conserto) — dispare o revisor de novo (mesmo formato da rodada anterior), rodada n=2 (é
   continuação do mesmo lote de review desta run — a numeração de `review-{n}.md` já está em 2,
   então esta seria `review-3.md`; confirme olhando os arquivos existentes na pasta antes de
   nomear).
2. Se aprovado, **Etapa 4, rodada 2**: redispare **só a lane `browser`**, só o `RT-011` (mais
   RT-025 se quiser tentar de novo, mas ele já foi confirmado como limitação de ferramenta —
   avalie se vale a pena insistir ou já aceitar o n/d permanente). A lane `codigo` não precisa ser
   redisparada: já passou 5/5 e nada nela foi tocado por esta correção.
3. Se RT-011 passar: Etapa 6 (contexto) → Etapa 7 (push) → `relatorio-final.md` somando as duas
   runs (A e B) → `bloco: fim`.

## Pendências, em ordem

1. Run B — Etapa 5: corrigir RT-011 (hover vazando entre frestas do mesmo grupo).
2. Run B — Etapa 3.5: revisar a correção (nova rodada do mesmo lote de review).
3. Run B — Etapa 4, rodada 2: redisparar só a lane `browser`, só RT-011 (decidir se insiste em
   RT-025 ou aceita o n/d).
4. Run B — Etapa 6 (contexto): destino de `AC (rn)` é `.claude/memory/business-rules/`, não
   `CLAUDE.md` (mesma premissa da run A, já usada).
5. Run B — Etapa 7: `git push -u origin HEAD` na branch `feat/add-projetos-e-inline-tasks`.
6. Escrever `.claude/tmp/orquestracoes/2026-09-13-implementar-tasks/relatorio-final.md` somando as
   duas runs (A entregue 10/10 AC 22/22 RT; B — ver estado acima, incluindo a ressalva do RT-025
   n/d se ela não for corrigida) e retornar `bloco: fim`.

## Já fechado

- **Run A (chips-grupo-de-tasks): entregue, 10/10 AC, 22/22 RT PASS.** Push já dado. Nada a
  reabrir — resumo completo no `handoff-3.md` desta pasta.
- **Run B, Etapa 3 (implementação) e Etapa 3.5 (review): fechadas**, aprovadas. Ver acima.
- **Run B, Etapa 4 rodada 1: fechada** com 1 FAIL real (RT-011) e 1 n/d de ferramenta (RT-025).

## Armadilhas

- **`npm run lint:fix` não existe.** Use sempre `npx eslint . --fix` + `npx tsc --noEmit`.
- **`.claude/tmp/` é versionado neste repo.** `git add` só por caminho, nunca `-A`.
- Branch já é `feat/add-projetos-e-inline-tasks`, já publicada no remoto — nenhum filho cria
  branch nova. Commits de B até agora: `fcbe30a`, `83d38b3`, `cbb2b74`, `2c1fa0f`.
- Não abra `plano.md`/`spec.md` você mesmo "para conferir" além do necessário para escrever o
  prompt do filho — o retorno do implementador/tester é a fonte, não a sua leitura.
- **RT-025 n/d não é bug**: o tester confirmou que o mesmo problema (sensors do `dnd-kit` não
  disparam por simulação de ponteiro do Playwright) já existe no controle da raiz, que é
  comportamento pré-existente e fora do escopo desta implementação. Não mande o implementador
  "consertar" isso — não há o que consertar no código do produto. Se insistir em prová-lo, seria
  trocando a técnica do tester (ex.: disparar os eventos de teclado do `dnd-kit`, que tem suporte a
  drag por teclado), não corrigindo código.
- Nenhum `agentId` novo desta rodada precisa ser reusado por você: o implementador de correção é
  um agente fresco (o anterior, `adc79fbcd0fbcb96e`, já fez seu trabalho e pode ser reaproveitado
  por `SendMessage` se ainda estiver "vivo" na sua sessão, mas não é obrigatório — julgue pela
  disponibilidade).

## Premissas

Todas as do `briefing.md` da cadeia continuam valendo. Uma premissa nova, aberta nesta rodada:
**RT-025 (AC-008) ficou `n/d`** por limitação de ferramenta de teste (Playwright não aciona
sensors do `dnd-kit` por simulação de ponteiro), confirmado como pré-existente e não regressão
desta run. A cadeia havia premissado "sem n/d esperado" — este é o primeiro caso, e a decisão de
como isso afeta o veredito final de AC-008 fica para quem fechar a run (sugestão: entregue com
ressalva, documentada no relatório final).

## Estado do mundo

- Branch `feat/add-projetos-e-inline-tasks` publicada no remoto, com os 5 commits da run A mais
  4 commits de B (`fcbe30a`, `83d38b3`, `cbb2b74`, `2c1fa0f`) — nenhum push novo desde a run A
  ainda (o push de B é a Etapa 7, ainda não disparada).
- Ambiente de teste (`npm run dev`, porta 1420) pode estar de pé ou não dependendo do que os
  testers deixaram — confira antes de subir de novo.
- Árvore de trabalho: só arquivos de `.claude/tmp/orquestracoes/` e `.playwright-mcp/` seguem
  untracked/modified fora do código já comitado nos 4 commits de B.

## Janela

Fechei em ~101k/140k (pct=72) no momento em que bati **50/50 turns**, `status=handoff` — não é
laço (`taxa=928`, bem acima do piso de 400 de `preso`): a rodada rendeu a Etapa 4 inteira, com um
bug real encontrado. Não é o segundo handoff seguido sem redução de pendência (o anterior, O4→O5,
não reduziu; este reduziu — a run B avançou de "nada disparado" para "implementação e review
fechados, validação rodada, 1 bug identificado"). Fechei o que estava na mão antes de escrever
este handoff: esperei o retorno da lane `browser` (já disparada antes do teto bater) antes de
qualquer coisa, sem abrir frente nova.
