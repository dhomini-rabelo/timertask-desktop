APPROVED

# Validação r1 — step 04 `progresso-rodape-score` (commit `b4b36c7` sobre `2877767`)

Classe: julgamento. Escopo revisado: apenas os 3 arquivos do diff.

## Diff conferido

`git show b4b36c7 --stat` → exatamente 3 arquivos, 21 inserções / 114 remoções:

- `src/pages/index/components/IndexTasks/IndexFooter/IndexCompletedTaskItem.tsx` (editado)
- `src/pages/index/components/IndexTasks/IndexFooter/IndexFooter.tsx` (editado)
- `src/pages/index/components/IndexTasks/IndexFooter/IndexTaskNote.tsx` (deletado, 111 linhas)

## Critérios de aceite

1. **tsc limpo (coerência do diff)** — OK. A prop nova é `groupTitle?: string`; o call site passa
   `string | undefined` (`Map.get` retorna `string | undefined`, e o ternário entrega `undefined` no
   ramo falso). `groups` é de fato exportado por `useListingTasks()`
   (`src/pages/index/hooks/useListingTasks.ts:13,27`), tipado como `TaskGroup[]`, com `id`/`title`.
   Nada no diff sugere erro de tipo.
2. **Órfão apagado / dialog intacto** — OK. `IndexTaskNote.tsx` não existe mais e `grep -rn
   "IndexTaskNote"` fora de `IndexTaskNoteDialog` retorna zero hits (nenhum import quebrado).
   `IndexActiveTasksList/IndexTaskNoteDialog.tsx` existe, NÃO foi tocado por este commit, e continua
   importado (`IndexCompletedTaskItem.tsx:9`) e usado (`IndexCompletedTaskItem.tsx:83`).
3. **Badge só com grupo resolvido** — OK. `IndexCompletedTaskItem.tsx:59` usa
   `{groupTitle && (<span>…</span>)}`. Task solta → `task.groupId === null` → o call site
   (`IndexFooter.tsx:86-88`) manda `undefined` → nada renderiza. Grupo inexistente no map → `get`
   devolve `undefined` → idem. Sem `?? ""`, sem `<span>` vazio, sem `undefined` renderizado. (Título
   vazio `""` cairia no falsy e também não renderiza — comportamento aceitável.)
4. **Vale no ramo "No time tracked"** — OK. O bloco está em `IndexCompletedTaskItem.tsx:59-63`, dentro
   da `<div className="flex items-center gap-2 text-xs text-Black-400">` (linha 58) e ANTES do ternário
   `hasTrackedTime ?` (linha 64). Logo aparece nos dois ramos, inclusive no `No time tracked` (linha 77).
5. **Map sem `useMemo`, lookup no footer** — OK. `IndexFooter.tsx:27-29` constrói
   `new Map(groups.map((group) => [group.id, group.title]))` direto no corpo do componente; o arquivo
   continua sem nenhum `useMemo`. `IndexCompletedTaskItem.tsx` não importa `useListingTasks`, não
   recebe `groups: TaskGroup[]` e não faz lookup nenhum — só consome a string pronta. O `get` roda uma
   vez por item no `.map` do footer, custo O(1), não O(grupos) por item.
6. **Diff mínimo** — OK. Nada em `IndexScore.tsx`, `states/tasks/utils.ts` (scoreUtils),
   `states/tasks/index.ts`, `hooks/useListingTasks.ts`, `hooks/useStoredTasks.ts` ou `src-tauri/`.
7. **Sem resíduo novo** — OK. `grep -rnE "subtasks|SubTask|inExecutionTaskId|nonActiveExpandedTaskId|
   TaskListingMode|getTaskListingMode|getActiveTask"` em `src/` só bate em
   `src/pages/index/hooks/useStoredTasks.ts:11,30,70,71,81` (`LegacySubTask` / `entry.subtasks` da
   migração legada) — hits intencionais preexistentes, nenhum arquivo deste diff.
8. **Tailwind com precedente** — OK, nenhuma classe inventada:
   - `bg-Black-100/50 dark:bg-Black-600` é o par exato do track da `ProgressBar`
     (`src/layout/components/atoms/ProgressBar/index.tsx:20`), e `bg-Black-100/50` também aparece em
     `IndexTaskGroup.tsx:84` e `IndexTaskItem.tsx:154`.
   - `text-Black-450 dark:text-Black-400` é o par usado nas linhas vizinhas do próprio arquivo
     (`IndexCompletedTaskItem.tsx:55,108`), em `IndexTaskGroup.tsx:135`, `IndexScore.tsx:82` e
     `IndexFooter.tsx:47`. `--color-Black-450` está definido em `src/layout/styles/global.css:31`.
   - `px-2 py-0.5 rounded-full font-medium break-all` — `rounded-full` com padding horizontal já existe
     em `IndexAlertSelect.tsx:22` (`rounded-full px-2.5 py-0`) e `IndexNotificationRequest.tsx:57`;
     `break-all` é o mesmo tratamento do título/nota logo acima e abaixo.

## Correção / cenários de falha

Não encontrei cenário de falha concreto. Os dois pontos que tentei quebrar:

- **Grupo de outro workflow**: `groups` e `completedTasks` saem do MESMO `workflowItems` filtrado por
  `selectedWorkflowId` (`useListingTasks.ts:9-17`), então um `groupId` de task concluída sempre resolve
  dentro do escopo — e se não resolver (dado corrompido / migração), degrada para "sem badge" em vez de
  quebrar.
- **Custo por render**: o `new Map` roda em todo render do footer mesmo com o acordeão fechado, mas
  `groups` é a lista de grupos de um workflow (dezenas no pior caso), não a de tasks — irrelevante
  perto dos 150+ itens que a decisão do step queria proteger. Não é achado.

## Achados

Nenhum. Sem ressalvas.
