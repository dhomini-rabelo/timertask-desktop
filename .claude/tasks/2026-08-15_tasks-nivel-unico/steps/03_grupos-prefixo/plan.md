# Plano — step 03: grupos criados com o prefixo `>`

Batch de perguntas: **sem dúvidas** (todas as respostas do usuário já estão em `answers.md` e dobradas
no `plan-simplified.md`; as 3 decisões em aberto sinalizadas pela recon são de arquitetura e foram
resolvidas aqui, sem consultar ninguém).

Medição de janela: **nenhum nonce foi entregue no delta**, então o `medir-janela.sh` não foi executado.
Este planner terminou em ~10 turns, muito abaixo do teto — não há risco de handoff.

---

## Premissas assumidas (vinculantes para implementador, revisor e tester)

1. **`IndexTaskItem` e `IndexSortableTaskItem` NÃO são tocados.** O mesmo `IndexSortableTaskItem` é
   reutilizado literalmente nos dois níveis: `useSortable` se registra no `DndContext` mais próximo via
   React context, então dentro do grupo ele se liga ao `DndContext` interno do grupo e na raiz ao
   externo. Zero duplicação, zero prop nova.
2. **Nada no store muda.** O contrato fechado no step 01 é suficiente (ver validação da decisão B).
   Nenhuma ação nova, nenhum campo novo.
3. **Colapsar usa `setItemsState`, não uma ação nova.** `collapsed` já existe no modelo mas não há
   `toggleGroupCollapsed` — e o contrato do store está FECHADO. O toggle é feito com a ação que já
   existe: ler `useTasksState.getState().state.items`, mapear trocando só o grupo alvo, chamar
   `setItemsState`. Persiste pelo `useStoredTasks` sem nenhuma mudança. Imutável (T8/React Compiler).
4. **Excluir grupo: sem modal de confirmação.** O repo não tem padrão de confirm nesta lista e um
   fluxo de Dialog inflaria o escopo. Previsibilidade vem do `title="Delete group and its tasks"` no
   botão. Também **não** existe guard de "filho rodando": a verdade visual de execução é o timer LOCAL
   de cada item (padrão do step 02) e o grupo não enxerga esse estado — implementar esse guard exigiria
   levantar estado de timer, o que está OUT.
5. **Colapsado esconde a lista interna E o input de adicionar**; cabeçalho, contagem e `ProgressBar`
   continuam visíveis. Grupo nasce com `collapsed: false` (já é o default de `addGroup`).
6. **`>` sozinho (ou `>` + só espaços) não cria nada E não limpa o input.** O usuário continua vendo o
   que digitou. Isso difere do fluxo atual (que limpa sempre que `title.trim()` é verdade) e é
   deliberado: limpar sem criar nada seria perda silenciosa.
7. **A contagem/filtro por grupo mora no próprio componente de grupo**, derivando de
   `useListingTasks().tasks` (que já preserva a ordem do array `items`). `useListingTasks` NÃO ganha
   uma API por-grupo; ganha apenas dois campos derivados globais (ver decisão C).
8. **Grip do grupo sempre visível** (grupo não tem cronômetro, logo não há estado "rodando").
9. Risco herdado e **não corrigido aqui**: pós-reload uma task fica com `isRunning:true` no store (T4),
   e `reorderItems` aborta silenciosamente qualquer par que envolva uma task running — inclusive quando
   ela é o `over` de um drag de grupo na raiz. Documentado no step 02 como risco aceito; continua aceito.

---

## Decisão A — arquivos do componente de grupo (3 arquivos, espelhando o split existente)

| Arquivo | Papel | Molde 1:1 |
|---|---|---|
| `src/pages/index/components/IndexTasks/IndexActiveTasksList/IndexSortableTaskGroup.tsx` | wrapper `useSortable({id: group.id})` do nível externo; passa `dragHandleProps` | `IndexActiveTasksList/IndexSortableTaskItem.tsx:1-35` (arquivo inteiro, trocar `Task`→`TaskGroup` e o filho) |
| `src/pages/index/components/IndexTasks/IndexActiveTasksList/IndexTaskGroup/IndexTaskGroup.tsx` | o card do grupo: cabeçalho (edit/grip/título/chevron/pencil/trash), input "Add a task...", contagem + `ProgressBar`, e renderiza a lista interna | cabeçalho: `git show 8185c5c:.../IndexTaskItem.tsx` linhas 91-165; input+lista: mesmas linhas 185-210; contagem/progresso: `IndexFooter/IndexFooter.tsx:22-26` (cálculo), `:53-55` (a frase), `:85` (`ProgressBar`) |
| `src/pages/index/components/IndexTasks/IndexActiveTasksList/IndexTaskGroup/IndexGroupTasksList.tsx` | `DndContext` + `SortableContext` PRÓPRIOS do grupo, sobre os filhos não concluídos | `IndexActiveTasksList/IndexActiveTasksList.tsx:1-53` (arquivo inteiro) |

Por que 3 e não 1: o wrapper sortable separado é o padrão já estabelecido no diretório
(`IndexSortableTaskItem` ⟂ `IndexTaskItem`) e evita que o mesmo arquivo hospede um `useSortable` do
contexto EXTERNO e um `DndContext` INTERNO (fonte clássica de confusão sobre a qual context o hook se
liga). A lista interna separada torna o arquivo uma cópia quase literal de `IndexActiveTasksList.tsx`,
o que faz o trabalho virar mecânico e mantém cada arquivo abaixo de ~120 linhas.

A pasta `IndexTaskGroup/` fica na mesma profundidade que `IndexTaskItem/`, então **todos os caminhos
relativos podem ser copiados verbatim de `IndexTaskItem/IndexTaskItem.tsx`** (`../../../../states/tasks`,
`../../../../../../layout/components/atoms/...`, `../../shared-state`, `../shared-components/IndexEditInput`).

---

## Decisão B — arquitetura do DnD de dois níveis (proposta da recon: **VALIDADA**, com precisões)

**Forma:** um `SortableContext` externo plano sobre `[ids dos grupos + ids das tasks de raiz não
concluídas]`, na ordem do array `items`; e **cada grupo com o seu próprio `DndContext` + `SortableContext`
independentes**, escopados só aos ids dos seus filhos não concluídos.

Por que `DndContext` aninhado (e não vários `SortableContext` sob um único `DndContext`): com um único
`DndContext`, a detecção de colisão é global e o `over` pode cair num item de outro container — isso
abriria justamente o "mover task entre grupos", que está **OUT**. Contextos aninhados independentes
tornam o movimento entre grupos impossível por construção.

Por que não há vazamento de eventos entre os contextos aninhados: os sensores do dnd-kit são acionados
pelos `listeners` que o `useSortable` devolve, e esses listeners são espalhados **apenas no grip**
(`dragHandleProps`). O grip de um filho carrega só os listeners do contexto interno; o grip do grupo, só
os do externo. Um pointerdown num filho nunca alcança o listener do grupo.

**Validação de que `reorderItems` (`states/tasks/index.ts:242-293`) não precisa mudar** — ele move um id
para o índice de outro id dentro do subconjunto do workflow, sem nenhuma noção de bloco/adjacência, e a
renderização dos filhos é por `filter(t => t.groupId === group.id)` (preserva ordem relativa,
independe de contiguidade). Casos simulados sobre `items = [G1, a, b, G2, c]`:

- arrastar G1 sobre G2 → `[a, b, G2, G1, c]`. Filhos de G1 ficam ANTES do header dele no array bruto,
  mas a lista externa (filtro grupos+raiz) lê `[G2, G1]` e G1 renderiza `[a, b]` na ordem original. ✔
- arrastar G2 sobre G1 → `[G2, G1, a, b, c]` → externa `[G2, G1]`. ✔ (as duas direções batem)
- arrastar filho `b` sobre `a` → `[G1, b, a, G2, c]` → interna `[b, a]`. ✔
- com uma task de raiz `r` no meio, nas duas direções, a lista externa fica correta. ✔
- com um filho concluído (invisível) entre dois visíveis, nas duas direções, a interna fica correta. ✔
  (o `splice` remove-e-insere é exatamente `arrayMove`; inserir no índice bruto do `over` — que é o
  vizinho visível — dá o resultado certo mesmo com itens ocultos no meio)
- `addTask(title, groupId)` (`:113-121`) continua coerente: ele procura o ÚLTIMO índice que seja o
  header do grupo ou um filho dele, então um intruso no meio do bloco não o afeta. ✔

Conclusão: **zero mudança no store.** O único requisito é que a lista de filhos venha de `filter` por
`groupId`, nunca de "os próximos itens contíguos depois do header" (armadilha 4 da recon).

---

## Decisão C — o gate de vazio (`IndexTasks.tsx:31`), armadilha não escopada

Hoje `activeTasks.length === 0` esconde a lista inteira, e `activeTasks` conta **só tasks**. Um grupo
recém-criado (0 filhos) ou com todos os filhos concluídos zera essa contagem e **o grupo some da tela**.

**Correção:** `useListingTasks` (`src/pages/index/hooks/useListingTasks.ts`) ganha dois campos derivados,
sem remover nem alterar nenhum dos existentes (`IndexFooter` continua intacto):

```
activeRootTasks  = rootTasks.filter(t => !t.completed)
activeListItems  = workflowItems.filter(i => isTaskGroup(i) || (isTask(i) && i.groupId === null && !i.completed))
```

`activeListItems` é a **única fonte de verdade** de "o que a lista de nível 1 mostra": `IndexTasks.tsx`
passa a gatear em `activeListItems.length === 0` e `IndexActiveTasksList` passa a iterar e a montar os
ids do `SortableContext` externo a partir dele. O texto do empty-state (`:34-37`) não muda — quando
existe um grupo, `activeListItems.length ≥ 1` e o branch vazio nem é alcançado.

---

## Escopo de implementação

**UM único escopo**, `grupos-prefixo` — os footprints se sobrepõem por construção (o novo campo de
`useListingTasks` é consumido por `IndexTasks.tsx` e por `IndexActiveTasksList.tsx`, e o componente de
grupo só compila junto com a lista que o renderiza). Não há corte backend/frontend possível: `src-tauri/`
está OUT. Prompt pronto: `prompts/grupos-prefixo.md`.

### Arquivos a CRIAR (3)
- `src/pages/index/components/IndexTasks/IndexActiveTasksList/IndexSortableTaskGroup.tsx`
- `src/pages/index/components/IndexTasks/IndexActiveTasksList/IndexTaskGroup/IndexTaskGroup.tsx`
- `src/pages/index/components/IndexTasks/IndexActiveTasksList/IndexTaskGroup/IndexGroupTasksList.tsx`

### Arquivos a EDITAR (4)
- `src/pages/index/components/IndexTasks/IndexAddInput.tsx` — parsing do `>` + placeholder (P7)
- `src/pages/index/hooks/useListingTasks.ts` — `+ activeRootTasks`, `+ activeListItems`
- `src/pages/index/components/IndexTasks/IndexActiveTasksList/IndexActiveTasksList.tsx` — itera
  `activeListItems`, ramifica grupo/task
- `src/pages/index/components/IndexTasks/IndexTasks.tsx` — gate na linha 31

### Explicitamente NÃO tocar
`states/tasks/index.ts`, `IndexTaskItem/*`, `IndexSortableTaskItem.tsx`, `shared-components/IndexEditInput.tsx`,
`shared-state.ts`, `IndexFooter/*`, `IndexScore.tsx`, `useStoredTasks.ts`, `src-tauri/`.

---

## Critérios de aceitação

1. `npx tsc --noEmit` limpo.
2. `> Sprint 1` e `>Sprint 1` no input principal criam um **grupo** com título `Sprint 1` (sem `>`);
   `Sprint 1` cria uma task de raiz. `>` sozinho não cria nada e não limpa o input.
3. Placeholder do input principal menciona o `>`.
4. O grupo renderiza como card de nível 1 com: grip, título, chevron de colapsar, pencil (edição inline
   pelo `IndexEditInput` já existente, sem exigir `>`), trash, input próprio "Add a task..." + botão Add,
   os filhos renderizados pelo `IndexTaskItem` do step 02 (com cronômetro), e "X of Y completed" +
   `ProgressBar` próprios.
5. Grupo com 0 filhos: aparece na tela (gate corrigido), mostra `0 of 0 completed` e barra em 0%.
6. Filho concluído sai da lista visível do grupo mas continua no denominador do "X of Y" (P5).
7. Task de raiz e grupo coexistem na lista, na ordem do array `items`.
8. Excluir o grupo remove os filhos junto (comportamento já do store).
9. Reordenar dois grupos entre si e reordenar filhos dentro de um grupo funcionam de forma independente;
   arrastar um filho para fora do grupo é impossível.
10. Recarregar preserva grupos, filhos, ordem e estado de colapso.

## Modo de teste de sistema: **browser** (`npm run dev`, Vite porta fixa 1420)

Sem suíte, sem runner, sem Dockerfile (T9) — o gate estático é `npx tsc --noEmit`.
**DnD entra como `## Not run`, com a razão já registrada nos steps 01 e 02**: dnd-kit exige
pointer-capture real de SO; nem `browser_drag` do Playwright MCP nem `PointerEvent` sintético funcionam
neste app (os cronômetros re-renderizando também estouram o "stable" do MCP). Não inventar automação
nova. Contornos já validados a reutilizar: sobrescrever `window.Notification.permission`/
`requestPermission` via `browser_evaluate` antes de "Allow notifications" (refazer a cada reload) e usar
`click()` real via `browser_evaluate` no lugar de `browser_click`.
