# Planejamento — inserir task inline, na posição certa, pelo hover na fresta entre itens

Início: 2026-09-13 (E6 disparada)
Pasta: .claude/tmp/orquestracoes/2026-09-13-inserir-task-inline/
Projeto: raiz (frontend React/Vite/TS) — projeto.md
Spec: 8 AC, 26 RT, 1 SHOULD — spec.md (emendada 2x na E7, pelo dev)
Corte: sem corte
Onda: onda única
Roteiro: 29 provas de tela, 0 casos de suíte — roteiro.md

## Etapas

| # | Papel | Agente | Modelo | Veredito |
|---|---|---|---|---|
| E6 | reconhecimento | recon-inserir-task-inline | sonnet | simples, estado confirma, fixtures: sem mecanismo, 16 browser / 3 codigo, roteiro: 19 provas, 2 dúvidas |
| E7 | dúvidas (1ª volta) | — | — | 1 assumida (grade), 1 perguntada: o dev escolheu a candidata rejeitada → emenda de spec |
| E6 | reconhecimento r2 | recon-inserir-task-inline-r2 | sonnet | simples, estado confirma, 22 RT, 1 dúvida (fresta dentro do grupo) |
| E7 | dúvidas (2ª volta) | — | — | o dev pediu seccionar o grupo em Active/Paused/Pending → 2ª emenda de spec (AC-008, RT-023 a RT-026) |
| E6 | reconhecimento r3 | recon-inserir-task-inline-r3b | sonnet | simples, onda única, seccionamento = checkpoint próprio; 21 browser / 5 codigo; roteiro: 29 provas |
| E7 | roteiro | — | — | aprovado como proposto; 1 dúvida assumida (sem grade de 2 colunas dentro do card) |
| E8 | plano | plano-inserir-task-inline | sonnet | 10 passos / 3 cp, 26/26 RT, marcos: nenhum, onda única |
| E9 | gate do plano | — | — | aprovado |

## Dúvidas técnicas (E7)
Levantadas: frestas nas seções Active/Paused (task nasce pending); grade de 2 colunas do ponto de inserção; o que a fresta dentro do grupo herda; reuso da grade de 2 colunas dentro do card.
Perguntadas: frestas por seção → o dev escolheu a candidata que o recon rejeitou (herdar o estado da seção); nascer Active → "cronômetro correndo, sem quebrar a estrutura de dados atual"; herança dentro do grupo → o dev pediu seccionar o grupo igual à lista geral, com cabeçalho.
Assumidas: ponto de inserção como elemento próprio no grid com `grid-column: 1 / -1` (candidata A, que o RT-006 já autoriza); dentro do card do grupo, reusar cabeçalho + omissão de seção vazia + função de agrupamento, mas NÃO a grade de 2 colunas (o card já é uma célula da grade da raiz).

## Roteiro de comprovação (E7)
Proposto: 29 provas — 29 screenshots, 0 casos de suíte
Ambiente: `npm run dev` (Vite, porta fixa 1420)
Fechado: aprovado como proposto (o desdobramento do Esc em vazio/com-texto foi pedido pelo nível 0 antes de mostrar)
Arquivo: roteiro.md

## Handoffs
- E6 r3: dois agentes frescos morreram por interrupção de sessão antes de gravar; o terceiro foi o próprio agente retomado por SendMessage, com ordem de escrever o arquivo primeiro. Nada foi perdido em disco.

## Premissas assumidas
- Sem exclusividade de task ativa: o app já admite várias contando tempo, e a inserção não introduz trava nova.
- A inserção reaproveita a mesma construção de task do campo fixo, variando só o índice e encadeando os efeitos de executar/parar quando a seção pede.

## Gate do plano (E9)
aprovado

## Desvios da spec
- nenhum

## Resultado
plano aprovado
Plano: .claude/tmp/orquestracoes/2026-09-13-inserir-task-inline/plano.md
Lanes: browser, codigo
Cobertura: 26/26 RT
Provas: 29 do roteiro no plano de teste; acrescentadas pelo planejador: nenhuma; dispensadas: nenhuma
Checkpoints: 3
Fixtures: sem mecanismo
Ambiente: `npm run dev` (Vite, porta fixa 1420)
Estado: nenhum comando automatizado — montagem dirigindo a UI, como o roteiro descreve
Fim: 2026-09-13
