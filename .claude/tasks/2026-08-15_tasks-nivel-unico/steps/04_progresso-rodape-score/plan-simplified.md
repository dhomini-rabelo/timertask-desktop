# Step 04 — rodapé, concluídas e score no modelo plano

## Objetivo

Deixar o rodapé da página e os cards de score coerentes com o mundo de nível único: contagem
"X of Y completed" + barra de progresso contando **todas** as tasks de nível 1 do workflow (soltas e
dentro de grupos), accordion de concluídas, reset único, e `IndexScore` correto. Fechar as pontas soltas
da navegação de dois níveis.

## CLASSE: `julgamento`

Define a semântica agregada (o que entra no denominador, o que conta como concluída) e remove um fluxo
de produto ("Finish"). Poucos arquivos, mas nada mecânico.

## IN

1. `src/pages/index/components/IndexTasks/IndexFooter/IndexFooter.tsx`
   - Contagem e `ProgressBar` (`:37-41`, `:75-96`, `:129`) passam a contar **todas as tasks de nível 1 do
     workflow selecionado**, incluindo as que estão dentro de grupos; **grupos não entram na contagem**
     (decisão 4 + **P3**).
   - Remover o botão "Finish" e `canFinishTask`/`handleFinishTask` (`:43-56`, `:108-117`) — premissa **P13**.
   - `handleReset` (`:58-64`) passa a chamar a ação única de reset do workflow — premissa **P14**.
   - Remover o bloco `listingMode === "subtasks"` do `IndexTaskNote` (`:131-133`); a nota agora é por task
     (dialog do item, step 02) e por grupo (step 03).
   - A prop `inExecutionTaskId` e o callback `onFinishTask` somem da assinatura.
2. `src/pages/index/components/IndexTasks/IndexFooter/IndexCompletedTaskItem.tsx`
   - `getTotalTimeInSecondsForTask` (`:16`) e `getEventsForTask` (`:30`) perdem o branch `"subtasks" in task`
     e passam a ler `task.timeEvents` direto.
   - Accordion de concluídas mostra as tasks concluídas do workflow (**P5**), com uma indicação de a qual
     grupo pertencem quando houver.
3. `src/pages/index/components/IndexScore.tsx` + `src/pages/index/states/tasks/scoreUtils.ts`
   - Conferir que TOTAL CYCLES / TASKS COMPLETED / FOCUSED TIME / CURRENT STREAK batem com o modelo plano
     depois da migração (o step 01 já converteu os agregadores; aqui é validação de ponta a ponta e
     correção do que tiver ficado torto).
4. Varredura final de resíduos: nenhuma referência restante a `subtasks`, `SubTask`, `inExecutionTaskId`,
   `nonActiveExpandedTaskId`, `TaskListingMode`, `getTaskListingMode`, `getActiveTask`, `ListingTask`
   (footprint 3.1/3.2 de `memoria-da-task.md`). Arquivos órfãos apagados.

## OUT

- Qualquer mudança de modelo, item de task ou UI de grupo (steps 01-03).
- Novas métricas ou novos cards de score.
- **Nada em `src-tauri/`.**

## Respostas do usuário que afetam ESTE step

- **4 (progresso em dois lugares)**: o rodapé é a metade "geral"; a metade "por grupo" já foi entregue no
  step 03. As duas coexistem.
- **P5**: concluídas saem da lista e vivem no accordion do rodapé.
- **P13**: sem botão "Finish".
- **P14**: um único reset por workflow.

## Dependências

Steps 01, 02 e 03. É o step de fechamento: só ele pode declarar a task inteira coerente.

## Modo de teste de sistema: **browser** (`npm run dev` :1420)

`npx tsc --noEmit` limpo; então, com um workflow contendo um grupo com 3 tasks + 2 tasks soltas:
confirmar que o rodapé diz `0 of 5 completed` (grupo não conta), concluir 2 e ver `2 of 5` com a barra em
40%; abrir o accordion de concluídas e conferir os tempos; usar o Reset e confirmar que limpa só o
workflow selecionado (trocar de workflow e confirmar que o outro continua intacto); conferir os 4 cards
do `IndexScore` contra os tempos registrados; recarregar e confirmar persistência.
