# answers.md — relatorios-tasks

Base: `main` @ `a0284a0`. Data: 2026-08-16.

## Perguntas levadas ao usuário

**Nenhuma (batch = 0 tópicos).** Todos os pontos abertos do pedido puderam ser resolvidos com
precedentes que já existem no código (ver `memoria-da-task.md`) ou com um default seguro e
não-destrutivo. As premissas marcadas **[sobrescrevível]** são as de produto que o usuário pode
querer trocar; nenhuma bloqueia a execução e cada uma é mudança de 1-5 linhas depois.

A única decisão que chegou perto de virar pergunta é a **P13** (varrer nomes antigos também do store
de TASKS). Foi resolvida pelo lado NÃO-destrutivo — nunca apagar dados do usuário sem ordem
explícita — e está sinalizada em destaque para ele poder reverter.

## Premissas travadas (vinculantes para todos os agentes seguintes)

- **P1 — O relatório NÃO é derivado do store de tasks na hora da leitura; ele tem storage próprio.**
  Motivo objetivo: o botão "Reset" (`IndexFooter.tsx:31-33` → `clearItems`, `states/tasks/index.ts:295-309`)
  apaga as tasks do workflow selecionado, e `deleteItem` apaga uma task; se o relatório lesse o store
  de tasks, o histórico sumiria junto. Novo store + nova chave de `localStorage`.
  Vincula: steps 01, 02, 03, 04.
- **P2 — Chave nova: `timertasks:reports`.** Segue o padrão `timertasks:*` já usado
  (`useStoredTasks.ts:4`, `useStoredWorkflows.ts:8`). Nenhuma chave existente é alterada ou migrada.
  Vincula: steps 01, 02.
- **P3 — A unidade do histórico é o DIA**, identificado por `date: "yyyy-MM-dd"` em hora LOCAL
  (o app já raciocina em `startOfDay(new Date())` local — `scoreUtils.ts:20`, `:96`, `:107`).
  Nada de UTC, nada de ISO com timezone na chave do dia. Vincula: steps 01, 02, 03, 04.
- **P4 — Retenção = 7 dias corridos, janela ROLANTE, incluindo hoje.** Um dia mantém os NOMES enquanto
  `date >= yyyy-MM-dd de startOfDay(subDays(hoje, 6))`. Fora disso, os nomes são APAGADOS DO DISCO
  (`tasks: []`, `namesPurged: true`) e permanecem `cycles`, `focusedSeconds` e `completedCount`.
  É a leitura literal do pedido ("depois da semana o histórico exato de nome de tarefas é perdido
  porém ainda devemos permanecer com os dados salvos de ciclos e horas trabalhadas").
  Vincula: steps 01, 03, 04.
- **P5 — "Semana" na UI = os mesmos 7 dias rolantes da retenção**, não semana calendário.
  [sobrescrevível] Justificativa: se fosse semana calendário (`startOfWeek`), numa segunda-feira a aba
  "Week" mostraria 1 dia e ainda haveria dias com nome vivo fora dela — a retenção e a view diriam
  coisas diferentes. Uma regra só, sem descasamento. Vincula: steps 01, 03.
- **P6 — "Tasks feitas" = tasks CONCLUÍDAS naquele dia** (evento `complete` com `createdAt` no dia).
  É o que a lista de hoje/semana exibe. Vincula: steps 02, 03.
- **P7 — "Horas trabalhadas" = TODO tempo rastreado no dia**, inclusive de tasks que não foram
  concluídas. São dois números diferentes lidos da MESMA estrutura (ver §3 da memória): a lista filtra
  por `completedAt != null`, o total soma `secondsToday` de todas as entradas. Vincula: steps 02, 03.
- **P8 — Escopo: TODOS os workflows, sem filtro pelo workflow selecionado.** [sobrescrevível]
  Precedente direto no código: o painel de score já é global — `IndexScore.tsx:29-33` usa
  `store.state.items` cru, sem passar por `useListingTasks` (que é quem filtra por workflow,
  `useListingTasks.ts:6-12`). O relatório é irmão do score, não da lista. Cada linha do relatório
  carrega o título do workflow como badge quando existe mais de um workflow. Vincula: steps 02, 03.
- **P9 — Ciclos por dia vêm do DELTA de `totalCycles`, nunca do valor absoluto.**
  `countdownTimer.ts` é 100% em memória (grep completo em §5 da memória): `totalCycles` (`:296`)
  volta a 0 a cada reload e só cresce em `goBackToWork` (`:205`). O sync guarda o último valor visto
  numa `ref` e soma ao dia apenas incrementos positivos; queda (reload/reset) NÃO subtrai e NÃO zera
  o acumulado do dia. Vincula: step 02.
- **P10 — O `IndexScore` NÃO é alterado nesta task.** [sobrescrevível] O "Total cycles" de
  `IndexScore.tsx:38` continua sendo o contador de sessão, em memória, zerando no reload. Fazer o
  score passar a ler o histórico persistido é uma mudança de comportamento que o usuário não pediu.
  Fica FORA. Vincula: steps 02, 03, 04.
- **P11 — A entrada de HOJE é recalculada/mesclada a cada mudança; as entradas de dias anteriores são
  imutáveis.** Mesclagem por `id` de task: o que está no disco para hoje nunca é removido pelo
  recálculo; o que vem do estado vivo sobrescreve os campos das entradas de mesmo `id`. É isso que
  faz o "Reset" e o `deleteItem` não apagarem o dia. Vincula: step 02.
- **P12 — Sem migração e sem versionamento de schema.** Ausência da chave `timertasks:reports` = `{}`.
  JSON inválido = `{}` (mesmo `try/catch` de `useStoredTasks.ts:133-142`). Não existe base instalada
  para migrar. Vincula: step 01.
- **P13 — A retenção NÃO toca no store de tasks (`timertasks:tasks`). [sobrescrevível — é a premissa
  mais provável de o usuário querer trocar]** Tasks concluídas antigas continuam vivas na lista até o
  usuário dar Reset, exatamente como hoje. Uma leitura estrita do pedido ("depois da semana o nome é
  perdido") poderia querer que o app também varresse tasks concluídas com mais de 7 dias — mas isso é
  apagar dado do usuário na lista de trabalho dele, destrutivo e irreversível, e não foi pedido em
  nenhum lugar de forma explícita. Default: não apagar nada fora do histórico. Vincula: steps 01, 02.
- **P14 — O gatilho é um botão com ícone + rótulo "Reports" no canto superior direito do card de
  tasks**, abrindo um `Dialog` (o padrão de overlay do app: `Dialog` atoms + `IndexWorkflowDialog`).
  Nada de rota nova, nada de página nova — o app é single-page (`page.tsx`), não há router.
  Vincula: step 03.
- **P15 — Sem export (CSV/JSON), sem gráfico, sem seletor de data arbitrária, sem edição do
  histórico.** O pedido é ver hoje/semana e não perder ciclos e horas. Tudo além disso fica fora, em
  todos os steps. Vincula: steps 03, 04.
- **P16 — Nada de dependência nova.** `date-fns` (já em uso: `countdownTimer.ts:2`, `utils.ts:1`,
  `scoreUtils.ts:1-6`), `zustand`, `lucide-react`, `tailwind-merge` bastam. Vincula: todos os steps.
