# steps.md — relatorios-tasks

Base: `main` @ `a0284a0` (task `tempo-extra-descanso` fechada). **4 steps.**

| NN | slug | Objetivo (1 linha) | Depende de |
|----|------|--------------------|------------|
| 01 | `store-de-relatorios-e-retencao` | Criar o store de relatórios (`states/reports/`) com o contrato de dados diário, a persistência em `timertasks:reports` e a purga de nomes com mais de 7 dias na hidratação — sem nenhuma UI. | — |
| 02 | `sincronizacao-diaria-de-tasks-e-ciclos` | Alimentar a entrada do dia corrente a partir do estado vivo: tasks com tempo/conclusão de hoje (mescladas por id, sobrevivendo ao Reset) e ciclos por delta de `totalCycles`. | 01 |
| 03 | `botao-reports-e-abas-hoje-semana` | Botão "Reports" no canto superior direito do card de tasks abrindo um dialog com as abas Today / Week, listando as tasks concluídas com nome, horas e ciclos. | 01, 02 |
| 04 | `historico-agregado-pos-retencao` | Seção de histórico no mesmo dialog para os dias fora da janela de 7 dias: só data, ciclos, horas e quantidade de tasks, com o aviso de que os nomes não são mais guardados. | 03 |

| NN | Classe | Modo de teste de sistema |
|----|--------|--------------------------|
| 01 | `julgamento` | Docker+browser only (`npm run dev` + Playwright MCP; não há suíte — trap T9). Prova: semear `timertasks:reports` com dias antigos via `browser_evaluate`, recarregar, ler a chave e conferir que os nomes sumiram e os agregados ficaram |
| 02 | `julgamento` | Docker+browser only. Prova: rodar uma task, concluir, ler `timertasks:reports`; depois clicar em **Reset** e conferir que a entrada do dia permanece |
| 03 | `julgamento` | Docker+browser only (screenshots claro/escuro do botão e do dialog) |
| 04 | `julgamento` | Docker+browser only (semear dias antigos + screenshots claro/escuro) |

## Agrupamento — por que 4 e não 6 (nem 2)

A divisão ingênua sairia em 6 (tipos+store / persistência / retenção / sync de tasks / sync de ciclos /
botão / abas / histórico). Foi regrupada em 4. Justificativa, para que nenhum agente adiante re-divida:

- **Tipos + store + persistência + retenção foram fundidos no step 01** porque são uma decisão só: a
  forma do registro diário (`DailyReportEntry`, memória §3) *é* o que define o que a purga apaga e o
  que ela preserva. Separar "retenção" do "schema" produziria um step cujo critério de aceite
  ("os nomes somem e os ciclos ficam") não pode nem ser enunciado sem o schema do outro. Os três
  moldes desse step já existem prontos e são pequenos (`useStoredWorkflows.ts:10-56` para o hook,
  `states/workflows/index.ts` para o store) — é volume baixo, decisão única.
- **O sync ficou sozinho no step 02** porque é a única lógica genuinamente nova e arriscada da task, e
  o risco não tem nada a ver com o schema: recorte de dia (`calculateTaskTimeToday`), mesclagem por id
  para sobreviver ao `clearItems` (trap T6), delta de `totalCycles` num contador que zera no reload
  (P9) e a guarda contra loop de gravação (trap T4). É a aplicação literal do aviso do meta-planner:
  módulo novo + contrato que outros consomem não devem viajar no mesmo step da lógica que o alimenta.
- **Botão + dialog + abas Today/Week ficaram juntos no step 03** porque compartilham os mesmos
  arquivos e a mesma decisão visual (o gatilho e o conteúdo têm de nascer no mesmo padrão de design), e
  porque um step só de botão entregaria um gatilho que não abre nada — não teria critério de aceite
  próprio. As duas abas são a mesma lista com dois recortes de data (P5), não duas telas.
- **O histórico agregado ficou no step 04, e não fundido no 03**, por dois motivos objetivos: (a) o
  modo de verificação é diferente — o 03 se prova com dado REAL gerado na hora no browser, o 04 só
  pode ser provado semeando entradas antigas no `localStorage`, porque nenhum teste pode esperar 8
  dias; (b) é a única parte da UI que renderiza um registro SEM nomes, com copy própria e estado vazio
  próprio. Fundir os dois daria o perfil de step grande que produz plano raso.
- **Não juntei 01+02** porque seria exatamente o caso que o meta-planner manda dividir: módulo/contrato
  novo + a lógica que o consome no mesmo step.
- **Não há step de testes**: o repo não tem suíte nem runner (trap T9); cada step é testado no browser
  pelo próprio loop, como nas 3 tasks anteriores deste repo.
- **Nada de `IndexScore`, export, gráfico ou route nova** em nenhum step (P10, P15).

## Perguntas ao usuário

**Zero.** Ver `answers.md`: 16 premissas travadas, 4 marcadas `[sobrescrevível]` (P5 semana rolante,
P8 escopo global entre workflows, P10 `IndexScore` intocado, P13 a retenção não apaga nada do store de
tasks). **P13 é a que mais merece o olhar do usuário**: foi resolvida pelo lado não-destrutivo (tasks
concluídas antigas continuam na lista até ele dar Reset). Nenhuma bloqueia a execução.

## Medição de janela do meta-planner

Nonce `meta-relatorios-tasks`. Checkpoint com `answers.md` e `memoria-da-task.md` já escritos:
`janela=61045 teto=150000 pct=40 turns=32 taxa=1492 proj=90885 status=ok fonte=exato`. Sem handoff.
