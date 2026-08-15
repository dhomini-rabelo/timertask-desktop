## Extrato do step

Decisões vinculantes: prefixo `>`/`> ` no input principal cria `TaskGroup` (`addGroup`), sem prefixo
cria `Task` de raiz (`addTask(title, null)`); `>` sozinho/só espaços NÃO cria nada e NÃO limpa o input.
Zero mudança no store (contrato fechado no step 01). Colapsar usa `setItemsState` (sem ação nova).
Excluir grupo: sem modal de confirmação, apenas título do botão. Colapsado esconde lista+input, mantém
cabeçalho/contagem/progresso. Grip do grupo sempre visível (grupo não tem cronômetro).

Critérios de aceitação: `npx tsc --noEmit` limpo; `>`/`> ` cria grupo, texto puro cria task raiz;
placeholder menciona `>`; grupo renderiza grip/título/chevron/pencil/trash/input "Add a task..."/filhos
via `IndexTaskItem` (step 02)/contagem "X of Y completed"+ProgressBar; grupo com 0 filhos aparece
(gate de vazio corrigido) mostrando "0 of 0"+0%; filho concluído sai da lista mas conta no denominador;
task de raiz e grupo coexistem na ordem de `items`; excluir grupo remove filhos; reorder grupo-grupo e
filho-filho independentes, mover filho entre grupos impossível; reload preserva tudo.

Arquivos a CRIAR (3):
- `src/pages/index/components/IndexTasks/IndexActiveTasksList/IndexSortableTaskGroup.tsx`
- `src/pages/index/components/IndexTasks/IndexActiveTasksList/IndexTaskGroup/IndexTaskGroup.tsx`
- `src/pages/index/components/IndexTasks/IndexActiveTasksList/IndexTaskGroup/IndexGroupTasksList.tsx`

Arquivos a EDITAR (4):
- `src/pages/index/components/IndexTasks/IndexAddInput.tsx` (parsing `>` + placeholder)
- `src/pages/index/hooks/useListingTasks.ts` (+ `activeRootTasks`, + `activeListItems`)
- `.../IndexActiveTasksList/IndexActiveTasksList.tsx` (itera `activeListItems`, ramifica grupo/task)
- `src/pages/index/components/IndexTasks/IndexTasks.tsx` (gate de vazio na linha 31 → `activeListItems`)

NÃO tocar: `states/tasks/index.ts`, `IndexTaskItem/*`, `IndexSortableTaskItem.tsx`,
`shared-components/IndexEditInput.tsx`, `shared-state.ts`, `IndexFooter/*`, `IndexScore.tsx`,
`useStoredTasks.ts`, `src-tauri/`.

DnD: `SortableContext` externo plano sobre ids de grupos+tasks-raiz; cada grupo tem `DndContext`+
`SortableContext` PRÓPRIOS e independentes sobre ids dos seus filhos. `reorderItems` (store) não muda —
validado por simulação (ver plan.md Decisão B). Filhos de grupo SEMPRE via `filter(t => t.groupId ===
group.id)`, nunca por adjacência no array bruto.

Git: branch `main`, base commit `0c4fd64`. Working tree limpa exceto dois docs raiz da task (não
tocar) e `image.png` untracked (não tocar, não commitar).

Traps herdados: T1 (array único multi-workflow, `reorderItems` já mapeia índices do subconjunto pro
array global), T4 (pós-reload task fica `isRunning:true`, bloqueia seu próprio `reorderItems` — risco
aceito, não corrigir aqui), T8 (React Compiler, manter imutabilidade), isTimerActive é a fonte de
verdade visual de execução (nunca `task.isRunning` direto).

Teste de sistema: browser (`npm run dev` :1420 fixa). Sem suíte/runner/Dockerfile — gate estático
`npx tsc --noEmit`. DnD = `## Not run` (dnd-kit sem pointer-capture real de SO, confirmado steps 01/02).
Contornos: notification permission override via `browser_evaluate`, cliques via `click()` DOM real.

## Log

- Recon: `complexa`. Plan: Opus, sem dúvidas, escopo único. Implement: Sonnet, 3 arquivos criados +
  4 editados, `tsc --noEmit` limpo. Validate r1 (Opus): APPROVED. Commit impl: `7fb10d5`.
- Teste de sistema (browser, `tests-01/`): PASS 13/13 casos executáveis; DnD Not run (razão já
  registrada nos steps 01/02). Verdict: `tests-01/verdict.md`. Commit teste: ver `git log --oneline -5`.
- Fechado sem handoff e sem escalonamento para Opus (0 rodadas extras em validação/teste).
