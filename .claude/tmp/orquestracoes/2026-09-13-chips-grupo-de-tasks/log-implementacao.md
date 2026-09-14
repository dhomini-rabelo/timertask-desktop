# Implementação — chips de projeto abaixo do input, CRUD de projetos, switch global, prefixo "[projeto] " na task salva

Início: 2026-09-13 22:00
Pasta: .claude/tmp/orquestracoes/2026-09-13-chips-grupo-de-tasks/
Projeto: index (states/projects, states/settings, hooks useStoredProjects/useStoredSettings) — projeto.md
Spec: .claude/tmp/orquestracoes/2026-09-13-chips-grupo-de-tasks/spec.md — 10 AC, 22 RT
Onda: onda única
Plano: .claude/tmp/orquestracoes/2026-09-13-chips-grupo-de-tasks/plano.md
Checkpoints: 3 (N=3 → L=1, review único no checkpoint 3)
Marcos: nenhum
Dificuldade: simples
Lanes: browser, codigo
Ambiente: ver teste-1-browser.md (npm run dev subiu/reaproveitou a porta 1420 — servidor derrubado ao fim pelo tester)
Pré-requisito: de pé (ver teste-1-browser.md para o detalhe da checagem)
Estado: ver teste-1-browser.md
Fixtures: sem mecanismo

## Etapas

| # | Papel | Agente | Modelo | Veredito |
|---|---|---|---|---|
| E3 | implementação (checkpoint 1/3) | impl-chips-grupo-de-tasks | sonnet | 4 arquivos, gates ok, commit 46c56db |
| E3 | implementação (checkpoint 2/3) | impl-chips-grupo-de-tasks (reuso) | sonnet | 7 arquivos, gates ok, commit 8d87c16, handoff ao fechar |
| E3 | implementação (checkpoint 3/3) | impl-chips-grupo-de-tasks (fresco) | sonnet | 4 arquivos, gates ok, commit 8043860, fecha lote (k==N) |
| E3.5 | review r1 (cp 1-3) | review-chips-grupo-de-tasks-r1 | sonnet | aprovado, 0 blockers, 2 nits |
| E4 | teste r1 (codigo) | teste-chips-grupo-de-tasks-codigo-r1 | sonnet | RT-001 PASS, RT-002 PASS — 2/2 |
| E4 | teste r1 (browser) | teste-chips-grupo-de-tasks-browser-r1 | sonnet | 19/20 PASS, RT-020 FAIL — 27/27 provas produzidas |
| E5 | correção RT-020 | impl-chips-grupo-de-tasks-corr1 (fresco) | sonnet | `useStoredSettings.ts`: troca `hasHydratedRef`/`settingsRef` por `useState`, gates ok, commit 503d5c1 |
| E3.5 | review r2 (diff da correção) | review-chips-grupo-de-tasks-r2 | sonnet | aprovado, 0 blockers, 0 nits |
| E4 | teste r2 (browser) | teste-chips-grupo-de-tasks-browser-r2 | sonnet | 20/20 PASS (RT-020 confirmado) — 27/27 provas produzidas |
| E6 | atualizar contexto | contexto-chips-grupo-de-tasks | sonnet | 3/3 AC(rn) registradas em `.claude/memory/business-rules/projetos-chips-prefixo-titulo.md`, CLAUDE.md não tocado (fora do escopo), commit 2cb64f9 |

## Cobertura por RT
- RT-001 (AC-Geral) — PASS — codigo
- RT-002 (AC-Geral) — PASS — codigo
- RT-003 (AC-Geral) — PASS — browser
- RT-004 (AC-001) — PASS — browser
- RT-005 (AC-001) — PASS — browser
- RT-006 (AC-002) — PASS — browser
- RT-007 (AC-002) — PASS — browser
- RT-008 (AC-003) — PASS — browser
- RT-009 (AC-003) — PASS — browser
- RT-010 (AC-004) — PASS — browser
- RT-011 (AC-005) — PASS — browser
- RT-012 (AC-006) — PASS — browser
- RT-013 (AC-006) — PASS — browser
- RT-014 (AC-006) — PASS — browser
- RT-015 (AC-007) — PASS — browser
- RT-016 (AC-007) — PASS — browser
- RT-017 (AC-010) — PASS — browser
- RT-018 (AC-008) — PASS — browser
- RT-019 (AC-008) — PASS — browser
- RT-020 (AC-008) — PASS (rodada 2, após correção commit 503d5c1; FAIL na rodada 1: switch
  "Projetos" desligado revertia para ligado sozinho após reload — race entre hidratação e
  persistência em `useStoredSettings`) — browser
- RT-021 (AC-009) — PASS — browser
- RT-022 (AC-009) — PASS — browser

## Veredito por AC
- AC-001 — entregue (RT-004, RT-005)
- AC-002 — entregue (RT-006, RT-007)
- AC-003 — entregue (RT-008, RT-009)
- AC-004 — entregue (RT-010)
- AC-005 — entregue (RT-011)
- AC-006 — entregue (RT-012, RT-013, RT-014)
- AC-007 — entregue (RT-015, RT-016)
- AC-008 — entregue (RT-018, RT-019, RT-020 — RT-020 fechou na rodada 2, após correção da race em
  `useStoredSettings`)
- AC-009 — entregue (RT-021, RT-022)
- AC-010 — entregue (RT-017)

Todas as 10 AC entregues. 22/22 RT com veredito PASS (2 lane codigo, rodada 1; 20 lane browser,
rodada 2 — a rodada 2 revalidou toda a lane, não só o RT que tinha reprovado).

## Desvios da spec

## Adaptações do plano

## Nits do review
- IndexAddInput.tsx:46 — composedTitle não trima o título interno antes de concatenar com o prefixo (edge case cosmético, sem RT cobrindo).
- IndexProjectsDialog.tsx:2 — inconsistência de extensão nos imports (.tsx vs sem extensão) frente ao par copiado, já pré-existente na base.

## Premissas assumidas
- Comando de verificação real é `npx eslint . --fix` + `npx tsc --noEmit` (npm run lint:fix não existe no package.json), premissa herdada do briefing da cadeia.
- `git add` sempre por caminho, nunca `-A` (.claude/tmp/ é versionado neste repo).
- A run comita na branch já corrente `feat/add-projetos-e-inline-tasks`, sem criar branch nova.

## Handoffs
- E3, checkpoint 2 fechou e o implementador mediu status=handoff (janela) ao retornar; checkpoint 3 segue com um implementador fresco lendo implementacao.md + plano.md.
- Cadeia de orquestradores: O1→O2→O3 (esta run foi retomada por handoff duas vezes; nenhum agentId
  de implementador/revisor sobreviveu entre sessões, então toda a Etapa 5 em diante rodou com
  filhos frescos).

## Commits
Branch: feat/add-projetos-e-inline-tasks
Base: a7519c3 (HEAD antes da primeira edição desta run)
- 46c56db — implementação checkpoint 1/3
- 8d87c16 — implementação checkpoint 2/3
- 8043860 — implementação checkpoint 3/3
- 503d5c1 — fix(projects): corrige race de hidratacao no useStoredSettings (RT-020)
- 2cb64f9 — docs(memory): registra regras de projeto/chips/switch em business-rules

## Resultado
Entregue — 10/10 AC, 22/22 RT PASS.
Push: dado — `git push -u origin HEAD`, branch `feat/add-projetos-e-inline-tasks` publicada (PR ainda não aberto, fora do escopo).
Fim: 2026-09-13, run A fechada. Segue para run B (`inserir-task-inline`).
