# steps.md — tempo-extra-descanso

Base: `main` @ `a8f2b56` (task `correcao-layout-tasks` fechada). **2 steps.**

| NN | slug | Objetivo (1 linha) | Depende de |
|----|------|--------------------|------------|
| 01 | `overtime-no-store-e-descanso-proporcional` | O cronômetro de atividade passa a contar em negativo depois do zero, o painel de ações (Rest/+5/+10/Skip) continua alcançável durante o overtime, e o descanso passa a ser proporcional ao tempo REALMENTE trabalhado (25 min → trabalhou 30 → descansa 6). | — |
| 02 | `sinalizacao-vermelha-do-overtime` | Sinalizar o overtime em vermelho: o número do cronômetro e o anel de progresso do `Timer`, com o anel sem artefato geométrico e com dark mode correto. | 01 |

| NN | Classe | Modo de teste de sistema |
|----|--------|--------------------------|
| 01 | `julgamento` | Docker+browser only (na prática `npm run dev` + Playwright MCP; não há suíte — trap T9) |
| 02 | `julgamento` | Docker+browser only (screenshots claro/escuro) |

## Agrupamento — por que 2 e não 4 (nem 1)

A divisão ingênua seria 4 (contagem negativa / alarme+resume / fórmula do descanso / cor). Foi
regrupada em 2. Justificativa, para que nenhum agente adiante re-divida isto:

- **Contagem negativa + alarme-uma-vez + retomar do negativo + fórmula proporcional + condição do
  painel foram fundidos no step 01** porque são a MESMA decisão de modelo: uma vez que se aceita que
  `currentTimeInSeconds` fica negativo e o intervalo não para, as cinco consequências caem juntas no
  mesmo arquivo (`countdownTimer.ts`) e o resultado só é verificável em conjunto. Separar a fórmula do
  descanso da contagem negativa produziria um step cujo critério de aceite (o "6 min" do exemplo do
  usuário) não teria como ser atingido — não existe overtime para escalar. E separar "alarme" ou
  "resume" daria steps de 5 linhas com recon+plan+implement+validate+test em volta: overhead puro.
- **A condição de exibição do painel (`IndexTimer.tsx:37`) FICA no step 01, não no 02**, mesmo sendo
  UI, porque sem ela o botão "Rest" é inalcançável durante o overtime (trap N4 da memória) e o step 01
  não teria como provar o próprio critério de aceite no browser. Pelo mesmo motivo, a formatação do
  número negativo (`-01:23`, trap N2.1) também é do step 01: sem ela o teste não consegue nem LER o
  cronômetro.
- **A cor ficou sozinha no step 02** porque o modo de validação é claramente diferente: o step 01 se
  prova com NÚMEROS (o cronômetro passou de 0, o descanso veio 6:00 em vez de 5:00, os cronômetros das
  tasks continuaram correndo), e o step 02 se prova com SCREENSHOT em dois temas. Além disso o step 02
  carrega o único risco geométrico da task — o `strokeDashoffset` do anel com percentual negativo
  (trap N2.2) e a interação com `lastExtraAddedMinutes` (trap N10) —, que não tem nada a ver com a
  contabilidade de minutos do step 01. É o critério legítimo "a validação/o modo de teste difere".
- **Não juntei tudo em 1 step** porque o step único teria de decidir, na mesma leva, a contabilidade
  de tempo (com a armadilha de contagem dupla de §3.2 da memória), o ciclo de vida do intervalo
  (traps N6/N7/N8), a mudança de comportamento dos cronômetros das tasks (N5) E a geometria do anel
  SVG em dois temas. É exatamente o perfil de unidade que produz plano raso.
- **Não há step de testes**: o repo não tem suíte nem runner (trap T9); cada step é testado no browser
  pelo próprio loop.

## Perguntas ao usuário

**Zero.** Ver `answers.md`: 13 premissas travadas, 3 delas marcadas `[sobrescrevível]` (P3 teto do
overtime, P4 pausar durante o overtime, P5 descanso não conta negativo). Nenhuma bloqueia a execução;
cada uma é mudança de 1-3 linhas se o usuário pedir depois.

## Medição de janela do meta-planner

Nonce `meta-tempo-extra-descanso`. Último checkpoint, com todos os arquivos escritos:
`janela=104652 teto=150000 pct=69 turns=48 taxa=2050 proj=145652 status=ok fonte=exato`.
Sem handoff.
