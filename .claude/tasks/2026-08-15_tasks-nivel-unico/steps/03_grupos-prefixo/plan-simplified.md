# Step 03 — grupos criados com o prefixo `>`

## Objetivo

Permitir criar um grupo digitando `> titulo` (ou `>titulo`) no input principal, renderizar o grupo como
container de nível 1 com input próprio "Add a task...", contagem "X of Y completed" e barra de progresso
próprias, além de edição/exclusão do grupo e drag-and-drop em dois níveis.

## CLASSE: `julgamento`

Componente de container novo + regra de parsing + progresso derivado + DnD aninhado. Decisões de UI reais.

## IN

1. **Parsing do prefixo** — `src/pages/index/components/IndexTasks/IndexAddInput.tsx`.
   Regra: título que começa com `>` (com ou sem espaço depois) cria um **grupo**; o `>` e o espaço são
   removidos do título salvo. Título vazio depois de tirar o prefixo = não cria nada (mesmo padrão de
   guard de `addTask`, `states/tasks/index.ts:100-103`). Chamar `addGroup(titulo)` ou
   `addTask(titulo, null)` conforme o caso. Placeholder passa a mencionar o prefixo (**P7**).
2. **Componente de grupo** (novo, dentro de `IndexTasks/IndexActiveTasksList/`) — molde:
   `IndexTaskItem.tsx:182-217` (o accordion atual já é cabeçalho + input "Add a subtask..." + lista +
   botão Notes). O grupo tem:
   - cabeçalho com título, drag handle, editar, excluir e chevron de colapsar (`collapsed` no modelo);
   - input próprio "Add a task..." + botão Add, chamando `addTask(title, group.id)` (decisão 2);
   - a lista das tasks do grupo, renderizada com o **mesmo componente de item do step 02** (com
     cronômetro, alerta, debug, concluir, nota) — os filhos ficam SEMPRE visíveis no nível 1;
   - **contagem "X of Y completed" + `ProgressBar` próprios** (decisão 4) — molde de cálculo em
     `IndexFooter/IndexFooter.tsx:37-41`, molde visual em `:75-96` e `:129`;
   - excluir grupo apaga os filhos (ação já definida no step 01) — confirmar/avisar fica a critério do
     planner, mas o comportamento tem de ser previsível.
3. **Lista de nível 1** (`IndexActiveTasksList.tsx`): passa a intercalar, na ordem do array `items`,
   grupos (com os filhos dentro) e tasks de raiz (`groupId === null`).
4. **DnD em dois níveis** (**P8**): reordenar tasks dentro do seu grupo / dentro da raiz, e reordenar os
   grupos entre si. Mover task entre grupos por arraste **não** é requisito. Moldes:
   `IndexActiveTasksList.tsx:37-71` e `IndexSortableTaskItem.tsx:19-33`. Manter a regra de não reordenar
   item em execução (`states/tasks/index.ts:196-201`) e o mapeamento de índices do trap **T1**.
5. **Edição de título de grupo** — reutilizar `IndexEditInput` / o padrão de
   `IndexTaskAccordionSubtaskItem.tsx:80-101`. Editar um grupo NÃO exige digitar `>` de novo.

## OUT

- Rodapé geral, accordion de concluídas, reset, `IndexScore` → **step 04**.
- Sub-grupos / grupos aninhados: **não existem**. Um grupo nunca contém outro grupo.
- Mover task entre grupos por drag.
- **Nada em `src-tauri/`.**

## Respostas do usuário que afetam ESTE step

- **2 (grupo com filhos explícitos)**: input próprio dentro do grupo; filhos sempre visíveis no nível 1;
  nada de navegar para outra tela.
- **4 (progresso em dois lugares)**: cada grupo tem a sua própria contagem + barra de progresso.
- **P3**: grupo não tem cronômetro nem `completed`; o progresso é derivado dos filhos.
- **P7**: placeholder do input principal menciona o `>`.
- **P8**: DnD dentro do grupo e entre grupos.

## Decisões de borda já fechadas (não perguntar de novo)

- Grupo com 0 tasks: mostra `0 of 0 completed` e barra em 0% (mesmo comportamento de
  `IndexFooter.tsx:39-41`, que já protege divisão por zero).
- Tasks concluídas de um grupo saem da lista visível do grupo (**P5**) mas continuam contando no
  denominador do "X of Y" daquele grupo.

## Dependências

Steps 01 (modelo `TaskGroup` + `groupId` + `addGroup`/`addTask(groupId)`) e 02 (componente único de item).

## Modo de teste de sistema: **browser** (`npm run dev` :1420)

`npx tsc --noEmit` limpo; então: digitar `> Sprint 1` no input principal e confirmar que nasce um grupo
(e não uma task com `>` no nome); adicionar 3 tasks pelo input DO grupo; concluir uma e ver o
"1 of 3 completed" + progresso do grupo atualizarem; colapsar/expandir; criar uma task solta na raiz e
confirmar que ela convive com o grupo; reordenar tasks dentro do grupo e reordenar dois grupos entre si;
recarregar e confirmar que tudo persistiu; confirmar que as tasks dentro do grupo têm cronômetro e que
duas delas podem rodar em paralelo.
