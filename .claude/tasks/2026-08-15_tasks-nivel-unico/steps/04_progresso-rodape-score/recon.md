# Recon — step 04 progresso-rodape-score

## Mapa de arquivos

- `src/pages/index/components/IndexTasks/IndexFooter/IndexFooter.tsx` (88 linhas) | rodapé: contagem+ProgressBar+Reset+accordion, JÁ no modelo plano | anchors 14-30 (state/derivação), 39-88 (render)
- `src/pages/index/components/IndexTasks/IndexFooter/IndexCompletedTaskItem.tsx` (108 linhas) | card de task concluída no accordion, lê `task.timeEvents` direto | 1-13 (props/imports), 31-53 (falta indicação de grupo aqui)
- `src/pages/index/components/IndexTasks/IndexFooter/IndexTaskNote.tsx` (arquivo inteiro) | componente de nota da navegação de 2 níveis, ÓRFÃO confirmado | apagar por completo
- `src/pages/index/hooks/useListingTasks.ts` (35 linhas) | deriva `groups`/`tasks`/`completedTasks`/`activeListItems` do workflow selecionado | 4-34 (hook inteiro, curto)
- `src/pages/index/components/IndexScore.tsx` (96 linhas) | 4 cards de score, lê `state.items` SEM filtrar por workflow | 25-33 (hooks/cálculo)
- `src/pages/index/states/tasks/scoreUtils.ts` (127 linhas) | agregadores usados pelo IndexScore, já migrados para `items.filter(isTask)` | 58-88 (as 3 funções relevantes), 90-127 (`calculateCurrentStreak`, sem uso de workflow)
- `src/pages/index/states/tasks/index.ts` | `Task`/`TaskGroup`/`isTaskGroup` (17-37), `toggleTask` (169-194, grava evento `complete` só ao completar, não remove ao desmarcar), `clearItems` (295-309, filtra fora TODOS os itens do workflow selecionado — deleta, não "zera" flags)

## Molde a espelhar

Nenhum molde novo necessário: a indicação de grupo no item concluído é o mesmo padrão de "buscar dado
derivado e passar como prop" já usado em `IndexFooter.tsx:20` (`useListingTasks()` já expõe `groups`).
`IndexTaskGroup.tsx` (step 03) mostra `group.title` direto, sem lookup — aqui o lookup é por
`task.groupId` contra a lista de `groups`.

## Footprint

- `IndexFooter.tsx:80` | `<IndexCompletedTaskItem key={task.id} task={task} />` — único call site, ganharia prop `groups` (ou `groupTitle`) aqui.
- `IndexTaskNote.tsx` | zero consumidores (`grep -rn "IndexTaskNote\b" src/` só acha a própria `export function` na linha 22; sem barrel/index.ts na pasta `IndexFooter/`, sem re-export). Seguro apagar.
- `scoreUtils.ts` consumido só por `IndexScore.tsx:6-10`; nenhum outro arquivo importa essas 3 funções.

## Armadilhas

- **IndexScore ignora `selectedWorkflowId`.** Confirmado com `git show eec34ca^:...IndexScore.tsx` — antes da migração já lia `store.state.tasks` (todos os workflows) sem filtro; a migração preservou 1:1 esse comportamento. NÃO é regressão do step 01 nem do plan-simplified (OUT explicitamente veda "novas métricas ou novos cards"; escopo de workflow não está pedido). Mas vai parecer estranho no teste de sistema ("2 workflows, números do IndexScore não batem só com o selecionado") — registrar como comportamento pré-existente, não bug deste step.
- **`calculateTasksCompleted` conta por evento `"complete"` já emitido, não por `task.completed` atual.** `toggleTask` (`index.ts:169-194`) só ADICIONA o evento ao completar; ao desmarcar (`isCompleting=false`) o evento antigo permanece no array. Então uma task marcada→desmarcada continua contando como "completed" no score. Confirmado que esse comportamento já existia byte-a-byte antes da migração (`git show eec34ca^:...scoreUtils.ts`, mesma lógica sobre `subtask.timeEvents`) — não é algo que o step 04 introduziu nem deve "corrigir" (fora do IN).
- `clearItems` (`index.ts:295-309`) DELETA os itens do workflow (não zera `completed`/`timeEvents`) — igual ao antigo `clearTasks`/`clearSubtasks` (`git show eec34ca^:...IndexFooter.tsx:56-62`). `handleReset` já está correto per P14.
- Ao apagar `IndexTaskNote.tsx`, não confundir com `IndexTaskNoteDialog.tsx` (em `IndexActiveTasksList/`) — esse é o dialog por-task do step 02, ainda em uso (`IndexCompletedTaskItem.tsx:9,74` e dentro do próprio `IndexTaskNote.tsx:6`, que está sendo removido).

## Sinal de teste

Sem cobertura automatizada (`*.test.*`: não encontrado). Sinal = browser (`npm run dev`, Vite :1420) +
`npx tsc --noEmit`, conforme já fixado no plan-simplified e no T9 da memória da task.

## Veredito de complexidade

1. Uma frente só? **sim** — só frontend, um componente editado + um apagado (`IndexCompletedTaskItem.tsx`, `IndexTaskNote.tsx`).
2. Footprint ≤ 6 arquivos? **sim** — 2 arquivos tocados (`IndexCompletedTaskItem.tsx` editado, `IndexFooter.tsx` só para passar a nova prop, `IndexTaskNote.tsx` apagado); `IndexScore.tsx`/`scoreUtils.ts` só para validação de leitura, sem edição prevista.
3. Molde claro? **sim** — `useListingTasks().groups` já existe (`useListingTasks.ts:13,27`) e `IndexTaskGroup.tsx` já mostra `group.title`; é lookup trivial `groups.find(g => g.id === task.groupId)`.
4. Zero decisão de arquitetura/produto em aberto? **sim** — único ponto de decisão é "prop nova `groups` vs. hook direto no componente", puramente de implementação, sem impacto de produto.
5. Zero lógica nova não-trivial? **sim** — é um `.find()` e um `<span>` condicional; os "achados torto" do IndexScore são pré-existentes e ficam fora do IN (não requerem mudança).

veredito: simples

## Sinal de partição

partição: não (não há módulo/serviço novo nem suíte nova; é edição localizada + 1 delete).
