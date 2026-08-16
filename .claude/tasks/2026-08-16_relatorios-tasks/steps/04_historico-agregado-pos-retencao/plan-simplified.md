# plan-simplified.md — step 04 · `historico-agregado-pos-retencao`

> Leia `../../memoria-da-task.md` ANTES de qualquer coisa. Este arquivo só carrega o recorte do step.

## Objetivo

Fechar o pedido: mostrar, no mesmo dialog do step 03, os dias **fora da janela de 7 dias** — aqueles
que já perderam os nomes das tarefas — com o que sobreviveu à retenção: data, **ciclos**, **horas
trabalhadas** e quantidade de tasks concluídas, deixando claro na copy que os nomes não são mais
guardados depois de uma semana.

## IN

- Uma terceira aba (ou uma seção abaixo das abas — decida e justifique) chamada **History**, no mesmo
  `Dialog` criado no step 03. Preferir manter o padrão de abas já estabelecido ali.
- Lista dos dias com `date` anterior à janela de 7 dias, do mais recente para o mais antigo, uma linha
  por dia: data formatada, `cycles`, `formatDuration(focusedSeconds)` e `completedCount`.
  Nada de nomes — eles não existem mais no disco (`tasks: []`, `namesPurged: true`).
- Totais do período no topo da seção (soma de ciclos, de horas e de tasks concluídas).
- Copy explicando a regra, em uma linha: nomes de tarefas são mantidos por 7 dias; depois disso ficam
  só ciclos e horas. Tom e tamanho do `<p>` descritivo de `IndexTasks.tsx:19-22`.
- Estado vazio: enquanto o app tiver menos de uma semana de uso, a seção não tem linhas — mensagem
  própria no molde `IndexTasks.tsx:31-38`.
- Caso de borda a tratar explicitamente: um dia antigo pode ter `namesPurged: true` com `tasks: []` e
  ainda assim `completedCount > 0` — é o comportamento correto, a linha mostra o número sem lista.
- Dark mode em toda classe nova (trap T11).

## OUT

- Mudar a regra de retenção, a janela de 7 dias ou o schema (step 01 — já fechado).
- Mudar as abas Today/Week, o botão ou o gatilho (step 03 — já fechado).
- Qualquer escrita no store: este step **só lê**.
- Export, gráfico, paginação, filtro por período arbitrário, "apagar histórico" (P15).
- Alterar `IndexScore` (P10) ou o store de tasks (P13).

## Respostas do usuário que valem para ESTE step

- **P4** depois de 7 dias os nomes são apagados **do disco**; ciclos, horas e contagem permanecem.
- **P5** a janela de 7 dias rolantes é a mesma da aba Week — a seção History começa exatamente onde
  a Week termina, sem sobreposição e sem buraco.
- **P10** o `IndexScore` continua com o contador de ciclos de sessão; não tentar reconciliar os dois
  números aqui.
- **P15** sem export, gráfico ou seletor de data.

## Arquivos / âncoras

- O dialog criado no step 03, em `components/IndexTasks/IndexReportsDialog/`.
- `src/pages/index/components/IndexScore.tsx:12-23` (`formatDuration`) e `:66-94` (bloco de métrica
  com ícone + rótulo — bom molde para as linhas agregadas).
- `src/pages/index/components/IndexTasks/IndexTasks.tsx:19-22` (tom da copy) e `:31-38` (estado vazio).
- `states/reports/utils.ts` do step 01: `getRetentionWindowStartKey` define o corte; a seção lista
  `date < janela`.
- Contrato dos campos que sobrevivem: memória §3 (`cycles`, `focusedSeconds`, `completedCount`,
  `namesPurged`).

## Dependências de steps anteriores

Steps 01–03 entregues: retenção aplicada na hidratação, dia corrente alimentado, dialog com abas
Today/Week existindo e funcionando.

## Modo de teste de sistema

**Docker+browser only** (`npm run dev` + Playwright MCP). O dado antigo **precisa ser semeado** — não
há como esperar 8 dias. Roteiro mínimo: via `browser_evaluate`, escrever em `timertasks:reports` dois
dias antigos (ex.: 20 e 40 dias atrás) com `tasks` **nomeadas**, `cycles` e `focusedSeconds`
preenchidos; recarregar (a purga do step 01 roda na hidratação); abrir o dialog e conferir que a
seção History mostra os dois dias com ciclos/horas/contagem e **nenhum nome**; conferir que a aba Week
não os inclui; conferir o estado vazio limpando a chave; screenshots **claro e escuro** (trap T11).

## CLASSE

**`julgamento`.** Renderiza um registro sem nomes, com copy, totais e estado vazio próprios, e é o
step que prova o requisito central de retenção do pedido do usuário — não é espelhamento mecânico de
nenhum molde existente.
