APPROVED

# Validação r1 — step 03 `grupos-prefixo`

Escopo revisado: os 3 arquivos criados + os 4 editados listados no delta, contra `0c4fd64`.
Não rodei `tsc` (gate já verde, informado no delta) nem toquei em código de produto.

---

## Checagem ponto a ponto (os 8 focos do delta)

### 1. Parsing do prefixo `>` — `IndexAddInput.tsx:21-38` ✔

```
const trimmedStart = title.trimStart();
if (trimmedStart.startsWith(">")) {
  const groupTitle = trimmedStart.slice(1).trimStart();
  if (!groupTitle.trim()) return;   // não cria E não limpa
  addGroup(groupTitle); setTitle(""); return;
}
if (title.trim()) { addTask(title, null); setTitle(""); }
```

Tabela de casos que percorri:

| entrada | resultado | esperado |
|---|---|---|
| `> Sprint 1` | grupo `Sprint 1` | ✔ |
| `>Sprint 1` | grupo `Sprint 1` | ✔ |
| `>` | nada, input **preservado** (`return` antes do `setTitle`) | ✔ P6 |
| `>` + espaços | nada, input preservado | ✔ P6 |
| `   > x` | grupo `x` (tolera espaço antes do `>`) | superset benigno da spec |
| `> Sprint  ` | grupo `Sprint` (`addGroup` faz `trim`) | ✔ |
| `Sprint 1` | task de raiz (`addTask(title, null)`) | ✔ |
| `   ` (só espaços) | nada, input preservado (comportamento pré-existente) | ✔ |

O `return` precoce está **antes** do `setTitle("")` — o P7/P6 (não limpar em `>` sozinho) está de fato
implementado, não só aparentemente. `handleKeyDown` (Enter) e o botão Add chamam o mesmo `handleAdd`,
então os dois caminhos têm o mesmo parsing. Placeholder: `"Add a task... (use > to create a group)"` ✔.

### 2. Filhos por `filter(groupId)`, nunca por adjacência ✔

- `IndexTaskGroup.tsx:38` — `tasks.filter((task) => task.groupId === group.id)` (denominador, inclui concluídos).
- `IndexGroupTasksList.tsx:33-35` — `tasks.filter((task) => task.groupId === group.id && !task.completed)` (lista visível).

`tasks` vem de `useListingTasks` (`workflowItems.filter(isTask)`), que preserva a ordem do array `items`
e já é filtrado por workflow. **Nenhuma leitura por contiguidade em lugar nenhum.** A armadilha 4 da recon
está fechada, e a precondição da Decisão B do plano é honrada.

Simulei os casos da Decisão B contra o código real, incluindo os que o plano não listou:
`[a, b, G2, G1, c]` (filhos ANTES do header, estado alcançável após arrastar G1 sobre G2) →
arrastar `c` sobre `G2`, `G2` sobre `c`, `G1` sobre `G2` — a lista externa fica correta nos três, nas duas
direções. Reorder interno com um filho concluído (invisível) no meio também fecha nas duas direções.
`addTask(title, groupId)` (`states/tasks/index.ts:113-121`) continua achando o índice certo nesses arranjos.
**Confirmo: `reorderItems` não precisa mudar.**

### 3. DnD de dois níveis realmente aninhado ✔

- Externo: `IndexActiveTasksList.tsx:39-55` — 1 `DndContext` + 1 `SortableContext` plano sobre
  `activeListItems.map(i => i.id)` (grupos + tasks de raiz ativas).
- Interno: `IndexGroupTasksList.tsx:50-63` — `DndContext` **próprio** (sensores próprios em `:26-31`) +
  `SortableContext` sobre `visibleChildren.map(t => t.id)`.

É a forma exigida, **não** o anti-padrão de vários `SortableContext` sob um `DndContext` único.
Consequência verificada: `useSortable` do `IndexSortableTaskItem` renderizado dentro do grupo resolve o
`DndContext` mais próximo (o interno) via React context, então os `listeners` espalhados no grip do filho
pertencem ao sensor interno; o grip do grupo (`IndexSortableTaskGroup` → `dragHandleProps` em
`IndexTaskGroup.tsx:92`) é um nó DOM irmão, não ancestral, então não há bubbling de um nível para o outro.
Detecção de colisão do contexto interno enxerga só os filhos → **mover filho entre grupos é impossível por
construção** (critério 9), e o guard `if (over && active.id !== over.id)` (`IndexGroupTasksList.tsx:40`)
cobre o drop fora da área.

### 4. Gate de vazio ✔

`useListingTasks.ts:19-23` define `activeListItems = workflowItems.filter(g => isTaskGroup(g) || (isTask(g)
&& groupId === null && !completed))` — **todo grupo entra incondicionalmente**, então:
- grupo com 0 filhos → `length ≥ 1` → lista renderiza ✔ (critério 5);
- grupo com todos os filhos concluídos → idem ✔.

`IndexTasks.tsx:31` gateia em `activeListItems.length === 0`, e o texto do empty-state (`:34-37`) continua
lendo `tasks.length > 0`. Como o branch vazio só é alcançado quando não há **nenhum** grupo e nenhuma task
de raiz ativa, as duas frases antigas ("All tasks completed!" / "No tasks yet. Add one above!") mantêm
exatamente a semântica anterior. Nada quebrado.

### 5. Contagem/progresso do grupo ✔

`IndexTaskGroup.tsx:39-42`:
```
const completedCount = children.filter(t => t.completed).length;
const percentage = children.length ? Math.round((completedCount / children.length) * 100) : 0;
```
Divisão por zero guardada → grupo vazio mostra `0 of 0 completed` + barra em 0% ✔ (critério 5).
Denominador é `children.length` (com concluídos), enquanto a lista visível exclui concluídos ✔ (critério 6 / P5).
O cálculo e a frase espelham `IndexFooter.tsx:22-26` e `:53-55` — mesmo padrão, mesmo `ProgressBar`
(`percentage: number`, resolve para `atoms/ProgressBar/index.tsx`).

### 6. Colapso via `setItemsState` ✔

`IndexTaskGroup.tsx:51-64` lê `useTasksState.getState()`, faz `items.map(...)` trocando **só** o grupo alvo
por `{ ...item, collapsed: !item.collapsed }` e chama `setItemsState`. Nenhuma ação nova no store
(contrato do step 01 intacto), imutabilidade preservada — array novo, objeto novo só no alvo, zero mutação
in-place (T8/React Compiler ok). O guard `!isTaskGroup(item)` evita mexer em task com id colidente.
Persistência: `useStoredTasks` grava em `localStorage` a cada mudança de `items` (o efeito que atualiza
`itemsRef` é declarado antes do efeito que persiste, então grava o valor novo), e `migrateEntry` lê
`collapsed ?? false` na volta → **critério 10 (colapso sobrevive ao reload) fecha**.
Colapsado esconde lista+input (`:142`) e mantém cabeçalho + contagem + `ProgressBar` (`:133-140`) ✔ (P5).

### 7. Excluir grupo ✔

`IndexTaskGroup.tsx:111` chama `deleteItem(group.id)`, e `states/tasks/index.ts:196-213` já remove o item
com aquele id **e** toda task com `groupId === id` → filhos vão junto (critério 8). Sem modal, com
`title="Delete group and its tasks"` (`:112`) ✔ decisão vinculante. Sem guard de "filho rodando" ✔ P4.

### 8. Edição do título do grupo ✔

`IndexTaskGroup.tsx:87` reusa `IndexEditInput` com `initialValue={group.title}` — o título guardado nunca
contém `>` (o prefixo é consumido no `IndexAddInput`), então **não há necessidade de redigitar `>`** ✔.
`saveEditingItem` (`states/tasks/index.ts:215-229`) mapeia por id sobre `items` sem filtrar por `type`,
logo funciona para `TaskGroup` sem nenhuma mudança no store. O atom `editingTaskId` é compartilhado com as
tasks, e ids são UUID → sem colisão.

## Padrões do repo

- `IndexSortableTaskGroup.tsx` é cópia 1:1 de `IndexSortableTaskItem.tsx` (mesmo `style`, mesmo
  `dragHandleProps={{...attributes, ...listeners}}`) ✔.
- `IndexGroupTasksList.tsx` é cópia 1:1 de `IndexActiveTasksList.tsx` (mesmos sensores, `closestCenter`,
  `verticalListSortingStrategy`, mesmo `handleDragEnd`) ✔.
- O cabeçalho do grupo (grip → título → pencil/trash em `opacity-0 group-hover:opacity-100` → chevron)
  reproduz o molde `8185c5c:.../IndexTaskItem.tsx`, inclusive a semântica do chevron (expandido = `ChevronUp`)
  e o vazio `"No tasks yet."` que espelha `"No subtasks yet."` ✔. Não é padrão inventado.
- Caminhos relativos de `IndexTaskGroup/` idênticos aos de `IndexTaskItem/` (mesma profundidade) ✔.
- Nenhum arquivo da lista "NÃO tocar" foi modificado (`git diff --stat` mostra exatamente os 4 editados;
  os 3 criados são os previstos, nada mais untracked em `src/`) ✔.
- `DndContext`/`SortableContext` não emitem DOM, então os `IndexSortableTaskItem` do grupo caem direto no
  `flex flex-col gap-3` de `IndexTaskGroup.tsx:143` — mesmo arranjo de `IndexTasks.tsx:30` ✔.

---

## Ressalvas (não bloqueiam; registro apenas)

1. **`useListingTasks.ts:16,18` — `activeTasks` e `activeRootTasks` ficaram sem nenhum consumidor.**
   `activeTasks` perdeu o último uso quando `IndexTasks.tsx` e `IndexActiveTasksList.tsx` migraram para
   `activeListItems`; `activeRootTasks` nasceu já sem consumidor. Ambos são exigidos/preservados
   explicitamente pela Decisão C do plano ("sem remover nem alterar nenhum dos existentes"), então **não
   peço mudança** — fica registrado como dívida de limpeza para um step futuro.

2. **`IndexTaskGroup.tsx:133,142` — editar o título do grupo esconde contagem, `ProgressBar`, input e a
   lista de filhos inteira** (os dois blocos são guardados por `!isEditing`). O molde antigo
   (`8185c5c:.../IndexTaskItem.tsx:182`) mantinha o corpo visível durante a edição; o `IndexTaskItem` atual
   esconde o rodapé. Os dois padrões existem no repo, e nenhum critério de aceitação fala disso — só
   registro que renomear um grupo faz o conteúdo dele sumir momentaneamente.

3. **`IndexTaskGroup.tsx:76-81` — o input interno do grupo não faz parsing de `>`.** É correto (grupo
   aninhado está OUT), mas quem já se acostumou com o prefixo pode digitar `> algo` ali e obter uma task
   com o título literal `> algo`. Aviso para o tester não tratar isso como bug.

## Observação para o tester (não é finding)

Um filho concluído sai da lista visível do grupo (critério 6) **e** passa a aparecer na lista global de
concluídos do `IndexFooter` (`completedTasks` = todas as tasks concluídas do workflow, sem distinguir
raiz/filho). Isso é comportamento herdado do step 01, e `IndexFooter/*` está na lista de "não tocar" —
não é regressão deste step.
