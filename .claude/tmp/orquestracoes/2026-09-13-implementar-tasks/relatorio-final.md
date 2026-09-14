# Relatório final — implementar as duas tasks já planejadas

Pasta: `.claude/tmp/orquestracoes/2026-09-13-implementar-tasks/`
Branch: `feat/add-projetos-e-inline-tasks` (publicada, `git push -u origin HEAD` dado ao fim de
cada run)

## Veredito

**Entregue com ressalvas.** Run A (chips de projeto) entregue por inteiro. Run B (task inline)
entregue, com uma ressalva de ferramenta de teste em uma `AC`, não de código.

## O que o dev recebe, por AC

### Run A — chips de projeto, CRUD de projetos, switch global ([pasta](../2026-09-13-chips-grupo-de-tasks/))

```text
AC-001  entregue
AC-002  entregue
AC-003  entregue
AC-004  entregue
AC-005  entregue
AC-006  entregue
AC-007  entregue
AC-008  entregue — corrigida uma race condition em useStoredSettings que fazia o switch
        "Projetos" reverter após reload (RT-020), achada na primeira validação e corrigida
AC-009  entregue
AC-010  entregue
```

10/10 AC entregues, 22/22 RT em PASS na validação final.

### Run B — inserção inline de task, seções Active/Paused/Pending no card do grupo ([pasta](../2026-09-13-inserir-task-inline/))

```text
AC-001  entregue
AC-002  entregue
AC-003  entregue
AC-004  entregue — corrigido um vazamento de hover entre frestas do mesmo grupo (RT-011), achado
        na primeira validação e corrigido
AC-005  entregue
AC-006  entregue
AC-007  entregue
AC-008  entregue com ressalva — RT-025 (drag-and-drop por dnd-kit) ficou `n/d`: o Playwright não
        consegue acionar os sensors do dnd-kit por simulação de ponteiro neste ambiente. Confirmado
        que a mesma limitação já existe no controle da raiz (pré-existente, não é regressão desta
        implementação). Os outros 4 RT que servem esta AC (RT-021, RT-023, RT-024, RT-026)
        passaram.
```

8/8 AC entregues, 25/26 RT em PASS, 1 `n/d` (RT-025, por ferramenta).

Mais um item fora das duas specs originais, autorizado no gate desta cadeia: a task criada pelo
ponto de inserção inline agora recebe o prefixo `"[projeto] "` quando há um chip de projeto
selecionado (RT-027, novo). Confirmado com screenshot.

## Provas em disco

- Run A: 54 PNG em [`2026-09-13-chips-grupo-de-tasks/screenshots/`](../2026-09-13-chips-grupo-de-tasks/screenshots/)
- Run B: 39 PNG em [`2026-09-13-inserir-task-inline/screenshots/`](../2026-09-13-inserir-task-inline/screenshots/)

## Cobertura

- Run A: 22/22 RT — lane `browser` 20/20 PASS, lane `codigo` 2/2 PASS (validação final, após a
  correção do RT-020).
- Run B: 26/26 RT com veredito — lane `browser` 20/20 PASS (15 na rodada 1 + RT-011 confirmado na
  rodada 2, os outros 14 mantidos), 1 `n/d` (RT-025); lane `codigo` 5/5 PASS.

## Desvios da spec

- Run B, RT-027 (novo): prefixo `"[projeto] "` na task criada pelo ponto de inserção inline —
  lacuna entre as specs de A e B, fechada como passo extra autorizado pelo dev no gate desta
  cadeia. Não estava na `spec.md` original de B.
- Nenhum RT declarado como "não vai ser cumprido" em nenhum dos dois planos.

## O que mudou

Run A:
- [`src/pages/index/states/projects/`](../../../../src/pages/index/states/projects/) — store e
  persistência de projetos e configurações
- Componentes de chips, modal de projetos e modal de configurações em
  [`src/pages/index/components/IndexTasks/`](../../../../src/pages/index/components/IndexTasks/)
- Commits: `46c56db`, `8d87c16`, `8043860`, `503d5c1`, `2cb64f9`

Run B:
- [`src/pages/index/states/tasks/`](../../../../src/pages/index/states/tasks/) — `insertTask`,
  `bucketByActivityStatus`
- `IndexInsertTaskPoint.tsx`, `IndexGroupTasksList.tsx` em
  [`src/pages/index/components/IndexTasks/`](../../../../src/pages/index/components/IndexTasks/)
- Commits: `fcbe30a`, `83d38b3`, `cbb2b74`, `2c1fa0f`, `07fd675`, `ee50ce6`, `354bc0c`

Regras de negócio `(rn)` das duas specs registradas em `.claude/memory/business-rules/`:
`projetos-chips-prefixo-titulo.md` (run A) e `insercao-inline-tasks.md` (run B).

## Premissas assumidas

- Comando de verificação real: `npx eslint . --fix` + `npx tsc --noEmit` — `npm run lint:fix` não
  existe no `package.json`, ao contrário do que `CLAUDE.md` e os planos mandam.
- "Uma de cada vez" foi executado como sequencial e sem parada intermediária entre as runs.
- O prefixo `"[projeto] "` na task inline (RT-027) foi tratado como passo extra autorizado da run
  B, não como desvio da spec de B.
- Destino das `AC (rn)` de ambas as runs: `.claude/memory/business-rules/`, não `CLAUDE.md` (fora
  do escopo desta cadeia).
- RT-025 (AC-008, run B) fechado como `n/d` permanente: limitação confirmada da ferramenta de
  teste (Playwright não aciona sensors do dnd-kit por simulação de ponteiro), reproduzida também
  no controle pré-existente da raiz. Não é bug de código; não foi tratado como blocker.
- `.claude/tmp/` é versionado neste repo — todo commit dos filhos usou `git add` por caminho,
  nunca `-A`.
- Nenhuma PR foi aberta (fora do escopo desta cadeia).

## Sem escopo restante

As duas runs-alvo do briefing fecharam. Nada pendente desta task.
