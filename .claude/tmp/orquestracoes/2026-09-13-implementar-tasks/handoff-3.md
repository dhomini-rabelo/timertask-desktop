# Handoff O3 → O4

Briefing: .claude/tmp/orquestracoes/2026-09-13-implementar-tasks/briefing.md
Ledger desta cadeia: .claude/tmp/orquestracoes/2026-09-13-implementar-tasks/log.md

Raiz do repo: `/root/so/repos/timertasks/timertask-desktop-tree-1`. Todo caminho abaixo é relativo
a ela.

## Próxima rodada

**Run A está fechada — entregue.** Não reabra nada dela. Você começa a **run B**
(`inserir-task-inline`), do zero, dentro da skill `task-implementar-e-validar`, como nível 0 dela.
Pasta: `.claude/tmp/orquestracoes/2026-09-13-inserir-task-inline/`.

Leia, nesta ordem, antes de disparar qualquer filho:

1. `.claude/tmp/orquestracoes/2026-09-13-implementar-tasks/briefing.md` — o contrato da cadeia
   inteira (as duas runs). Note a seção "As duas runs-alvo" (tabela comparativa) e a premissa do
   prefixo `"[projeto] "` como passo extra da run B.
2. `.claude/skills/task-implementar-e-validar/SKILL.md` — se ainda não a leu nesta cadeia, leia
   inteira uma vez. Etapas 3, 3.5, 4, 6, 7 é o que você vai rodar (a run B não tem marco, então a
   Etapa 4 só tem validação final — sem validação de meio de caminho).
3. Os arquivos já prontos na pasta de B, escritos pela skill de planejamento (não reescreva
   nenhum): `spec.md` (8 AC, 26 RT), `plano.md` (3 checkpoints, N=3 → L=1 → review único no
   checkpoint 3, seção `## Plano de teste` com as lanes e o roteiro), `projeto.md` (o cartão —
   mesmo projeto da run A: raiz, `npm run dev` — http://localhost:1420, comando de verificação
   `npm run lint:fix` + `npx tsc --noEmit` **no cartão, mas use a forma por `npx` — ver
   Premissas**), `reconhecimento.md`, `roteiro.md`.

Dispare a Etapa 3 (implementação, checkpoint 1 de 3): `subagent_type: general-purpose`, `model:
sonnet`, `description: impl-inserir-task-inline`. Passe os caminhos de
`prompts/implementador.md`, `{pasta-de-B}/plano.md`, `{pasta-de-B}/spec.md`,
`{pasta-de-B}/projeto.md`, `{pasta-de-B}/reconhecimento.md` (é `k==1`) e a pasta da run. Escreva
antes o cabeçalho do `log-implementacao.md` de B (formato em
`.claude/skills/task-implementar-e-validar/formats/log-implementacao.md`).

**Passo extra da run B, fora do `plano.md` aprovado (autorizado pelo dev no gate desta cadeia):**
a task criada pelo ponto de inserção "+ adicionar task" inline compõe o prefixo `"[projeto] "`
(da run A, já entregue) quando há chip de projeto selecionado — nenhuma spec cobre esse
cruzamento porque as duas foram escritas isoladas. Diga isso ao implementador explicitamente no
delta: depois de implementar o plano de B, ele adapta o ponto de criação da task inline para
aplicar a mesma composição de prefixo que `IndexAddInput.tsx` usa (ver
`src/pages/index/hooks/useStoredSettings.ts` e `src/pages/index/states/projects` para como a run A
resolveu isso). Ele registra esse passo extra como **desvio deliberado** no `implementacao.md` de
B (não é desvio do plano — é adição autorizada, nomeie assim), com o `RT` inventado por você ou
por ele para cobrir o cruzamento (não existe no `spec.md` de B) e prove-o na lane `browser` da
Etapa 4.

## Pendências, em ordem

1. Run B — Etapa 3: 3 checkpoints (10 passos), ainda não iniciada.
2. Run B — passo extra do prefixo `"[projeto] "` na criação inline (ver acima), a acomodar dentro
   do checkpoint que criar a task (provavelmente o 2 ou o 3 — confira no `plano.md`).
3. Run B — Etapa 3.5 (review, lote único no checkpoint 3, já que N=3).
4. Run B — Etapa 4 (validação final, lanes `browser` e `codigo`, sem marco).
5. Run B — Etapa 5 (correção), só se algum RT `[MUST]` reprovar.
6. Run B — Etapa 6 (contexto): confira o `projeto.md` de B, mas pela mesma premissa da cadeia, o
   destino de `AC (rn)` é `.claude/memory/business-rules/` e não `CLAUDE.md`, que segue fora do
   escopo.
7. Run B — Etapa 7: `git push -u origin HEAD` na branch `feat/add-projetos-e-inline-tasks` (já
   existe no remoto, publicada por mim nesta rodada — o push de B só adiciona commits novos).
8. Depois das duas runs fechadas, escrever
   `.claude/tmp/orquestracoes/2026-09-13-implementar-tasks/relatorio-final.md` somando as duas e
   retornar `bloco: fim`.

## Já fechado

- **Run A (chips-grupo-de-tasks): entregue, 10/10 AC, 22/22 RT PASS.** Ledger completo em
  `.claude/tmp/orquestracoes/2026-09-13-chips-grupo-de-tasks/log-implementacao.md`. Etapa 5
  corrigiu a race de RT-020 em `useStoredSettings.ts` (commit `503d5c1`), Etapa 3.5 r2 aprovou (0
  blockers), Etapa 4 r2 (lane browser inteira) deu 20/20 PASS. Etapa 6 registrou as 3 `AC (rn)`
  (AC-003, AC-008, AC-009) em `.claude/memory/business-rules/projetos-chips-prefixo-titulo.md`
  (commit `2cb64f9`), sem tocar `CLAUDE.md` (fora do escopo — desvio deliberado). Etapa 7:
  `git push -u origin HEAD` dado com sucesso, branch `feat/add-projetos-e-inline-tasks` publicada
  no remoto `dhomini-rabelo/timertask-desktop` (sem PR aberto, fora do escopo). Não reabra nenhum
  arquivo da pasta de A — o que importa já está resumido aqui e no `log.md` da cadeia.
- Run B: planejamento completo (spec.md, plano.md, projeto.md, reconhecimento.md, roteiro.md) já
  existia na pasta antes desta rodada — nada novo criado por mim. Etapa 0 dela ainda não rodou
  (sem `log-implementacao.md`).

## Armadilhas

- **`npm run lint:fix` não existe.** Todo filho novo precisa do delta com o comando real (`npx
  eslint . --fix` + `npx tsc --noEmit`), inclusive na run B — o `projeto.md` de B provavelmente
  repete o mesmo campo errado do de A.
- **`.claude/tmp/` é versionado neste repo.** `git add` só por caminho, nunca `-A`.
- A branch de destino já é `feat/add-projetos-e-inline-tasks` e já está publicada no remoto — não
  criar branch nova em nenhum filho da run B.
- Nenhum `agentId` de implementador/revisor sobrevive entre sessões de orquestrador — toda a run B
  começa com filhos frescos, sem tentar `SendMessage` para um `agentId` desta sessão.
- O prefixo `"[projeto] "` é uma lacuna entre as duas specs, não um bug de nenhuma delas — não
  vire uma rodada de correção contra o `spec.md` de B por causa disso; é adição explícita.

## Premissas

Todas as do `briefing.md` da cadeia continuam valendo (comando de verificação por `npx`,
sequencial sem parada entre A e B, run bloqueada não recebe push mas não impede B, lacuna do
prefixo vira passo extra de B, ambiente já corrigido, `.claude/memory/business-rules/` como
destino de regra de negócio em vez de `CLAUDE.md`). Nenhuma premissa nova travada nesta rodada
além das já registradas no `log-implementacao.md` da run A.

## Estado do mundo

- Branch `feat/add-projetos-e-inline-tasks` publicada no remoto (`origin`), com os 5 commits da
  run A (`46c56db`, `8d87c16`, `8043860`, `503d5c1`, `2cb64f9`). HEAD local == HEAD remoto no
  fechamento desta rodada.
- Nenhum serviço (`npm run dev`) ficou de pé: o tester da Etapa 4 r2 derrubou o processo ao final
  (confirmado por curl com conexão recusada).
- Árvore de trabalho limpa quanto a código do projeto; só os arquivos da pasta de orquestração
  (`.claude/tmp/orquestracoes/2026-09-13-chips-grupo-de-tasks/*` e
  `2026-09-13-implementar-tasks/*`) e `.playwright-mcp/` seguem como untracked/modified — nenhum
  deles bloqueia a run B.

## Janela

Fechei em ~124k de 140k (pct=88), 42 turns de 50, `status=handoff` por projeção (`proj=157k`,
`taxa=1332`). Progresso real, não laço: run A inteira fechou nesta janela (correção, review,
reteste, contexto, push) — o handoff é só porque a run B ainda nem começou e não cabe no que
resta.
