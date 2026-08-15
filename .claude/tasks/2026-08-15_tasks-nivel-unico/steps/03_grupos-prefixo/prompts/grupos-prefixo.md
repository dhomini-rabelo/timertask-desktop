# Escopo único — step 03 "grupos-prefixo"

Você implementa TUDO deste escopo. Git: branch `main`, base `0c4fd64`. Working tree limpo exceto dois
docs de task na raiz e um `image.png` não rastreado — **não toque neles**.
Gate estático: `npx tsc --noEmit`. Não existe suíte de teste, runner nem Dockerfile — não tente `npm test`.

## O que construir

Criar grupos digitando `> titulo` no input principal, e renderizá-los como container de nível 1 com input
próprio, contagem + barra de progresso próprias, colapso, edição, exclusão e DnD em dois níveis.

### CRIAR (3 arquivos)

**1. `src/pages/index/components/IndexTasks/IndexActiveTasksList/IndexSortableTaskGroup.tsx`**
Cópia estrutural de `IndexActiveTasksList/IndexSortableTaskItem.tsx:1-35` (arquivo inteiro é o molde):
`useSortable({ id: group.id })`, mesmo `style`, e renderiza `<IndexTaskGroup group={group}
dragHandleProps={{...attributes, ...listeners}} />`. Prop tipada como `TaskGroup`.

**2. `src/pages/index/components/IndexTasks/IndexActiveTasksList/IndexTaskGroup/IndexTaskGroup.tsx`**
O card do grupo. Props: `{ group: TaskGroup; dragHandleProps?: Record<string, unknown> }`.

- Derivar os filhos de `useListingTasks().tasks`:
  `children = tasks.filter(t => t.groupId === group.id)` (ordem do array `items` já preservada),
  `completedCount = children.filter(t => t.completed).length`,
  `percentage = children.length ? Math.round((completedCount / children.length) * 100) : 0`.
  **NUNCA** derive filhos por "itens contíguos depois do header" — ver armadilha DnD abaixo.
- Cabeçalho — molde `git show 8185c5c:src/pages/index/components/IndexTasks/IndexActiveTasksList/IndexTaskItem.tsx`
  linhas 91-165: mesmo container `div` com as classes do card, `isEditing ? <IndexEditInput
  initialValue={group.title} /> : <>…</>`, grip com `{...dragHandleProps}` + `GripVertical`, título,
  e à direita o bloco `opacity-0 group-hover:opacity-100` com `Pencil` (edição) e `Trash2` (excluir),
  mais o chevron de colapsar (`ChevronUp`/`ChevronDown`).
  - `IndexEditInput` (`../shared-components/IndexEditInput`) e o átomo jotai `indexTasksPageStateAtom`
    (`../../shared-state`, campo `editingTaskId`) são **genéricos por id** e já funcionam para grupo —
    não altere nenhum dos dois. `isEditing = indexTasksPageState.editingTaskId === group.id`.
    Editar grupo NÃO exige digitar `>`.
  - Grip do grupo **sempre visível** (grupo não tem cronômetro).
  - Trash chama `deleteItem(group.id)` (o store já apaga os filhos em cascata) e leva
    `title="Delete group and its tasks"`. **Sem modal de confirmação, sem guard de filho rodando.**
- Colapsar — o campo `collapsed` existe no modelo mas **o contrato do store está FECHADO e você NÃO pode
  adicionar ação nova**. Faça o toggle com a ação existente `setItemsState`:
  ler `useTasksState.getState().state.items`, `.map` trocando só o item de id `group.id` por
  `{ ...item, collapsed: !item.collapsed }`, e chamar `setItemsState(novoArray)`. Imutável (React
  Compiler está ligado — nunca mutar). Persiste sozinho pelo `useStoredTasks`.
  Colapsado esconde a lista interna E o input de adicionar; cabeçalho, contagem e barra continuam visíveis.
- Input próprio + botão Add — molde nas linhas 185-197 do mesmo `git show` ("Add a subtask..."):
  `placeholder="Add a task..."`, Enter e clique chamam `addTask(title, group.id)` e limpam o campo.
- Contagem + progresso — molde `IndexFooter/IndexFooter.tsx:22-26` (cálculo), `:53-55` (a frase
  `{completedCount} of {children.length} completed`) e `:85` (`<ProgressBar percentage={percentage} />`).
  Grupo vazio ⇒ `0 of 0 completed` e 0% (a proteção contra divisão por zero é o `children.length ?`).
- Renderiza `<IndexGroupTasksList group={group} />` quando não colapsado.

**3. `src/pages/index/components/IndexTasks/IndexActiveTasksList/IndexTaskGroup/IndexGroupTasksList.tsx`**
Cópia estrutural de `IndexActiveTasksList/IndexActiveTasksList.tsx:1-53` (arquivo inteiro é o molde):
`DndContext` + `SortableContext` **próprios do grupo**, `sensors` próprios, `onDragEnd` chamando o mesmo
`reorderItems(active.id, over.id)`, `items` = ids dos filhos **não concluídos** do grupo, e cada filho
renderizado pelo `IndexSortableTaskItem` **já existente, sem nenhuma alteração** (`useSortable` se liga
ao `DndContext` mais próximo, que aqui é o interno). Filhos concluídos não aparecem (P5) mas continuam
no denominador da contagem. Se não houver filho visível, renderize um vazio discreto (ex.: texto
`No tasks yet.` no estilo `text-sm text-Black-400`) — nunca esconda o grupo.

> A pasta `IndexTaskGroup/` está na MESMA profundidade que `IndexTaskItem/`, então copie os caminhos
> relativos verbatim de `IndexTaskItem/IndexTaskItem.tsx`: `../../../../states/tasks`,
> `../../../../hooks/useListingTasks`, `../../../../../../layout/components/atoms/{Input,Button,ProgressBar}`,
> `../../shared-state`, `../shared-components/IndexEditInput`.

### EDITAR (4 arquivos)

**`src/pages/index/components/IndexTasks/IndexAddInput.tsx`** (arquivo inteiro, 41 linhas)
Em `handleAdd` (`:20-25`): se o título (após `trimStart`) começa com `>`, tirar o `>` e o espaço, e
chamar `addGroup(tituloLimpo)`; senão `addTask(title, null)` como hoje.
- `>titulo` e `> titulo` valem os dois.
- `>` sozinho (ou `>` + só espaços): **não cria nada e NÃO limpa o input** — o usuário continua vendo o
  que digitou. Só limpe o campo quando algo foi de fato criado.
- Placeholder passa a mencionar o prefixo, ex.: `"Add a task... (use > to create a group)"` (P7).

**`src/pages/index/hooks/useListingTasks.ts`** (arquivo inteiro, 27 linhas)
Acrescentar dois derivados e devolvê-los junto com os existentes. **Não remova nem altere nenhum campo
atual** — `IndexFooter` depende de `tasks`/`completedTasks`:
```
activeRootTasks = rootTasks.filter(t => !t.completed)
activeListItems = workflowItems.filter(i => isTaskGroup(i) || (isTask(i) && i.groupId === null && !i.completed))
```
`activeListItems` é a única fonte de verdade do que a lista de nível 1 mostra, na ordem do array `items`.

**`src/pages/index/components/IndexTasks/IndexActiveTasksList/IndexActiveTasksList.tsx`** (`:21,43-50`)
Trocar `activeTasks` por `activeListItems`: `SortableContext items={activeListItems.map(i => i.id)}` e,
no `.map`, ramificar `isTaskGroup(item) ? <IndexSortableTaskGroup key group={item} /> :
<IndexSortableTaskItem key task={item} />`. `DndContext`, sensores e `handleDragEnd` ficam como estão.

**`src/pages/index/components/IndexTasks/IndexTasks.tsx`** (`:11,31`)
Gate passa a ser `activeListItems.length === 0` (hoje é `activeTasks.length === 0`, que conta só tasks —
**um grupo vazio ou com todos os filhos concluídos faria a lista inteira sumir da tela**). O texto do
empty-state (`:34-37`) não muda.

### NÃO TOCAR
`src/pages/index/states/tasks/index.ts` (contrato fechado no step 01), `IndexTaskItem/*`,
`IndexSortableTaskItem.tsx`, `shared-components/IndexEditInput.tsx`, `shared-state.ts`, `IndexFooter/*`,
`IndexScore.tsx`, `useStoredTasks.ts`, `src-tauri/`.

## Decisões vinculantes e armadilhas

- **DnD de dois níveis, forma exata:** um `SortableContext` externo plano sobre
  `[grupos + tasks de raiz não concluídas]` e **um `DndContext` independente por grupo** sobre os ids dos
  seus filhos. Nada de vários `SortableContext` sob um `DndContext` único — isso abriria mover task entre
  grupos, que está **OUT**. Não há vazamento de eventos entre os contextos: os listeners do dnd-kit vão
  só no grip, e o grip do filho carrega apenas os do contexto interno.
- **`reorderItems` NÃO precisa de mudança** (já validado caso a caso pelo planner). A condição para isso
  valer é que os filhos de um grupo sejam renderizados por `filter(t => t.groupId === group.id)`. Se
  alguém renderizar por adjacência no array, quebra na primeira reordenação de grupo: arrastar um grupo
  move só o header, e os filhos deixam de ficar fisicamente logo depois dele.
- **Nunca leia `task.isRunning` para decidir visual** (padrão fechado no step 02: a verdade visual é o
  timer local do item). Nada neste escopo precisa desse campo.
- Risco herdado, **não conserte**: pós-reload uma task fica com `isRunning:true` no store (T4) e
  `reorderItems` aborta em silêncio qualquer par que a envolva. Aceito desde o step 02.
- Grupo nunca contém outro grupo. Mover task entre grupos por drag não é requisito.
- React Compiler ligado — código imutável, nada de mutar props/estado.

## Critérios de aceitação

1. `npx tsc --noEmit` limpo.
2. `> Sprint 1` e `>Sprint 1` criam um grupo de título `Sprint 1`; `Sprint 1` cria task de raiz;
   `>` sozinho não cria nada nem limpa o input; o placeholder menciona o `>`.
3. O grupo mostra grip, título, chevron de colapso, pencil, trash, input "Add a task...",
   os filhos com cronômetro (`IndexTaskItem` do step 02) e "X of Y completed" + `ProgressBar` próprios.
4. Grupo com 0 filhos aparece na tela e mostra `0 of 0 completed` / 0%.
5. Concluir um filho tira ele da lista visível do grupo mas mantém no denominador.
6. Grupo e task de raiz coexistem na ordem do array `items`.
7. Excluir grupo remove os filhos.
8. Reordenar grupos entre si e reordenar filhos dentro de um grupo funcionam de forma independente.
9. Reload preserva grupos, filhos, ordem e estado de colapso.

Teste de sistema é browser (`npm run dev`, porta fixa 1420). **DnD é `Not run`** — dnd-kit exige
pointer-capture real de SO, já confirmado não-automatizável nos steps 01 e 02. Não invente automação.
