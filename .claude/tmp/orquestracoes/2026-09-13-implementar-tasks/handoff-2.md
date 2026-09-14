# Handoff O2 → O3

Briefing: .claude/tmp/orquestracoes/2026-09-13-implementar-tasks/briefing.md
Ledger desta cadeia: .claude/tmp/orquestracoes/2026-09-13-implementar-tasks/log.md

Raiz do repo: `/root/so/repos/timertasks/timertask-desktop-tree-1`. Todo caminho abaixo é relativo
a ela.

## Onde a run A está

Você continua a **run A** (`chips-grupo-de-tasks`), dentro da skill `task-implementar-e-validar`,
como nível 0 dela. Pasta:
`.claude/tmp/orquestracoes/2026-09-13-chips-grupo-de-tasks/`. Sem `ondas.md`, sem sufixo `-o{k}`.

Leia, nesta ordem, antes de disparar qualquer filho:

1. `.claude/tmp/orquestracoes/2026-09-13-implementar-tasks/briefing.md` — o contrato da cadeia
   inteira (as duas runs).
2. `.claude/skills/task-implementar-e-validar/SKILL.md` — o workflow. Se você ainda não a leu
   nesta cadeia, leia inteira uma vez; ela se paga. Preste atenção especial nas Etapas 5, 5.5, 6 e
   7, que são o que falta.
3. `.claude/tmp/orquestracoes/2026-09-13-chips-grupo-de-tasks/log-implementacao.md` — o ledger da
   run A até agora. Ele já tem o cabeçalho, as etapas E3/E3.5/E4 e a seção `Cobertura por RT` /
   `Veredito por AC` montadas.

**Não releia nada além disso.** Os arquivos de cada etapa (`implementacao.md`, `review-1.md`,
`teste-1-browser.md`, `teste-1-codigo.md`) já foram lidos pelos filhos que os escreveram; você não
precisa reabri-los — o que importa deles já está resumido no ledger.

## Estado da run A: tudo certo, exceto um FAIL

- **Etapa 3 (implementação)**: 3/3 checkpoints, todos com gate verde e comitados.
  Commits: `46c56db` (cp1), `8d87c16` (cp2, handoff de janela no meio), `8043860` (cp3, fresco).
  Branch: `feat/add-projetos-e-inline-tasks` (a mesma da sessão, nenhuma nova criada).
  Base da run (HEAD antes da 1ª edição): `a7519c3`.
- **Etapa 3.5 (review r1)**, sobre os checkpoints 1–3 inteiros (N=3 → L=1, lote único):
  **aprovado**, 0 blockers, 2 nits (ver `## Nits do review` no ledger — nenhum bloqueia).
- **Etapa 4 (teste r1)**, validação final, duas lanes disparadas juntas:
  - `codigo`: 2/2 RT PASS (RT-001, RT-002).
  - `browser`: 19/20 RT PASS, **RT-020 (AC-008) FAIL** — "switch 'Projetos' desligado reverte
    para ligado sozinho após reload (race entre 2 instâncias de `useStoredSettings`)". 27/27
    provas do roteiro produzidas (screenshots em
    `.claude/tmp/orquestracoes/2026-09-13-chips-grupo-de-tasks/screenshots/r1-s01.png` a `r1-s27.png`).
  - Veredito de rodada do tester foi **FAIL** (não "PASS com ressalva"), então por
    `formats/teste.md` isso é FAIL de qualquer forma, independente de RT-020 ser `[MUST]` ou
    `[SHOULD]` sem alternativa pega. **AC-008 é a única não entregue no momento.**

## Próxima rodada: Etapa 5 (correção), rodada 1 de FAIL

1. Dispare um implementador **fresco** (não há `agentId` salvo desta cadeia para reusar — a
   sessão anterior encerrou), papel implementador, model `sonnet`, description
   `impl-chips-grupo-de-tasks-corr1`. Passe os caminhos de `implementacao.md`, `plano.md`,
   `spec.md`, `projeto.md` e **o caminho** de
   `.claude/tmp/orquestracoes/2026-09-13-chips-grupo-de-tasks/teste-1-browser.md` (não cole o
   conteúdo). Ele lê o relatório, entende o FAIL do RT-020 e conserta a race condition entre as
   duas instâncias de `useStoredSettings` (hook em
   `src/pages/index/hooks/useStoredSettings.ts`, segundo os retornos da Etapa 3).
2. Mesmas três correções de ambiente valem para todo filho novo desta run:
   - comando de verificação real: `npx eslint . --fix` + `npx tsc --noEmit` (não
     `npm run lint:fix`, que não existe);
   - `git add` por caminho, nunca `-A`;
   - branch já é `feat/add-projetos-e-inline-tasks`, não criar nova.
3. Depois do conserto comitado com gate verde, dispare a Etapa 3.5 **de novo**, `review-2.md`,
   passando também o caminho de `review-1.md` (não houve reprovação nele, mas o revisor da
   correção só precisa olhar o diff do conserto) — na verdade, como a reprovação veio do teste e
   não do review anterior, o revisor desta rodada não precisa do `review-1.md`; ele diffa o
   conserto contra a base da run como sempre. Siga a skill: revisor fresco, `r2`.
4. Com `review-2` aprovado, volte à Etapa 4 com `n=2`, mas **redispare só a lane `browser`**
   (a única que reprovou) — `codigo` já tem PASS que não expira dentro da run.
5. Se RT-020 passar: Etapa 6 (atualizador de contexto, `docs de contexto` = `CLAUDE.md` da raiz
   segundo o briefing, mas a resposta do gate desta cadeia foi **`.claude/memory/business-rules/`**
   — confirme no `projeto.md` qual campo aponta para onde, e se divergir do briefing, o briefing
   da cadeia vence porque é mais recente e foi decisão explícita do dev). Depois Etapa 7: push
   único (`git push -u origin HEAD`) só se o veredito final for `entregue` ou `entregue com
   ressalvas`.
6. Se RT-020 falhar de novo (2ª rodada) ou uma 3ª vez, siga a skill à risca: 3 FAILs do mesmo RT
   dispara a Etapa 5.5 (adaptação do plano), não mais uma correção direta.

Depois de a run A fechar (entregue, entregue com ressalvas, ou bloqueada — sem push se
bloqueada), **siga para a run B** (`inserir-task-inline`), que ainda não foi tocada, mais o passo
extra do prefixo `"[projeto] "` na `IndexInsertTaskPoint.tsx` (autorizado pelo dev, fora do
`plano.md` aprovado — ver briefing, seção "As duas runs-alvo" e "Pendências" do handoff anterior
desta cadeia, `.claude/tmp/orquestracoes/2026-09-13-implementar-tasks/handoff-1.md`, que você pode
ler se precisar do delta completo da run B — ele não foi reaberto por mim nesta rodada). Ao final
das duas, escreva `.claude/tmp/orquestracoes/2026-09-13-implementar-tasks/relatorio-final.md`
somando as duas runs e retorne `bloco: fim`.

## Já fechado (não repetir)

- Etapa 0 da run A: pasta já existia, `spec.md`/`plano.md`/`projeto.md`/`reconhecimento.md`
  presentes, `log-implementacao.md` criado com cabeçalho.
- Etapa 3: 3/3 checkpoints, comitados (ver hashes acima).
- Etapa 3.5: review r1, aprovado.
- Etapa 4: teste r1, ambas as lanes rodaram. `codigo` fechado (PASS, não precisa redisparar).
  `browser` reprovou em RT-020 e precisa de nova rodada **depois** do conserto e do review.

## Armadilhas

- **`npm run lint:fix` não existe.** Todo filho novo precisa do delta com o comando real.
- **`.claude/tmp/` é versionado neste repo.** `git add` só por caminho.
- A branch da sessão já é a branch de destino (`feat/add-projetos-e-inline-tasks`); não criar
  branch nova em nenhum filho.
- Nenhum `agentId` de implementador/revisor está vivo para reuso por `SendMessage` — a sessão que
  os disparou (eu, O2) encerrou. Todo disparo da Etapa 5 em diante nesta run é filho fresco.
- O `useStoredSettings.ts` tem, segundo o tester, duas instâncias do hook competindo (uma delas
  provavelmente no `IndexSettingsDialog` e outra em `IndexProjectsSwitch` ou no componente pai) —
  o implementador da correção precisa localizar as duas instâncias, não assumir que existe uma só.
- Screenshots da rodada 1 já existem em `screenshots/r1-s01.png`…`r1-s27.png` — uma rodada 2 de
  teste (se disparada) usa prefixo `r2-` e não sobrescreve os da r1.

## Premissas

Todas as do `briefing.md` da cadeia continuam valendo (comando de verificação por `npx`, sequencial
sem parada entre A e B, run bloqueada não recebe push mas não impede B, lacuna do prefixo vira
passo extra de B, ambiente já corrigido). Mais uma desta rodada:

- **AC-008 ainda não está fechada.** Não a reporte como entregue até o RT-020 passar numa rodada
  de teste nova.

## Janela

Fechei em ~126k de 140k (pct=89), 23 turns de 50, `status=handoff` por projeção (`proj=163k`,
`taxa=1496`). Progresso real, não laço: 3 checkpoints implementados, 1 review aprovado, 2 lanes de
teste rodadas, 1 FAIL identificado e já roteado para correção.
