# Implementação — inserir task inline, na posição certa

## Base da run
commit: 2cb64f9
branch: feat/add-projetos-e-inline-tasks

## Checkpoints
checkpoint 3 de 3, restam não

## RT fechados
- checkpoint 1 → RT-002, RT-003, RT-017, RT-021, RT-024
- checkpoint 2 → RT-004, RT-005, RT-006, RT-007, RT-008, RT-009, RT-010, RT-012, RT-013, RT-014,
  RT-015, RT-016, RT-019, RT-020, RT-022 (mais RT-017/RT-024, já cobertos pela fundação do
  checkpoint 1 e agora com consumidor de verdade)
- checkpoint 3 → RT-011, RT-020, RT-023, RT-024, RT-025, RT-026 (RT-020/RT-024 já fechados no
  checkpoint 2/1, aqui com o consumidor de dentro do grupo)

## Commits
- fcbe30a — feat(tasks): fundacao para insercao inline (insertTask, bucketByActivityStatus)
- 83d38b3 — feat(tasks): ponto de insercao inline na listagem raiz
- cbb2b74 — feat(tasks): secciona a lista do card do grupo em Active/Paused/Pending
- 2c1fa0f — fix(tasks): traduz comentário para inglês em IndexInsertTaskPoint (rodada 1)

## Arquivos alterados
- [src/pages/index/states/tasks/index.ts](src/pages/index/states/tasks/index.ts) — extrai `createTask(title, workflowId, groupId)` do literal que estava dentro de `addTask` (que passou a usá-lo, sem mudança de comportamento); adiciona a action `insertTask(title, groupId, beforeId): string | null`, com a mesma guarda de `addTask` (título vazio ou sem workflow selecionado → `null`), inserindo via `findIndex` + `slice`/`slice` no índice exato de `beforeId` (fallback: acrescenta no fim se `beforeId` não for encontrado); devolve o id da task criada. (checkpoint 1)
- [src/pages/index/states/tasks/utils.ts](src/pages/index/states/tasks/utils.ts) — adiciona `bucketByActivityStatus<T>(items, resolveStatus)`, função pura que separa em `{ active, paused, pending }` preservando a ordem original, mesma lógica do `forEach` que antes só existia em `useListingTasks.ts`. (checkpoint 1)
- [src/pages/index/hooks/useListingTasks.ts](src/pages/index/hooks/useListingTasks.ts) — troca o `forEach` manual por uma chamada a `bucketByActivityStatus`, passando o mesmo resolvedor de status de hoje; os nomes devolvidos (`activeSectionItems`/`pausedSectionItems`/`pendingSectionItems`) não mudaram. (checkpoint 1)
- [src/pages/index/components/IndexTasks/shared-state.ts](src/pages/index/components/IndexTasks/shared-state.ts) — `IndexTasksPageState` e o valor inicial de `indexTasksPageStateAtom` ganham `insertingBeforeId: string | null`. (checkpoint 1)
- [src/pages/index/components/IndexTasks/IndexActiveTasksList/shared-components/IndexInsertTaskPoint.tsx](src/pages/index/components/IndexTasks/IndexActiveTasksList/shared-components/IndexInsertTaskPoint.tsx) (novo) — a fresta: fechada, `div` com `group`/`hover:h-9`/`group-hover:opacity-100` mostrando "+ adicionar task"; aberta, `Input` `autoFocus` controlado, `Enter` chama `insertTask` (e encadeia `executeTask`/`stopTask` por `status`, RT-020/RT-022) sem fechar a fresta (RT-010), `Escape`/`onBlur` (vazio) fecham (RT-015/RT-016), todo `keydown`/`click` incrementa `interactionTick` que reinicia o `setTimeout` de 20s (RT-012/RT-013/RT-014); um `useEffect` em `isOpen` zera `title`/`interactionTick` sempre que a fresta fecha por qualquer motivo (inclusive quando outra fresta abre e rouba `insertingBeforeId`, RT-017), para nunca reabrir com texto de uma sessão anterior. Também onde mora o RT-027 (ver `Desvios do plano`). (checkpoint 2)
- [src/pages/index/components/IndexTasks/IndexActiveTasksList/shared-components/IndexTasksSection.tsx](src/pages/index/components/IndexTasks/IndexActiveTasksList/shared-components/IndexTasksSection.tsx) (novo) — cabeçalho + omissão de seção vazia (`items.length === 0`) + `SortableContext` (`rectSortingStrategy` para `layout="grid"`, `verticalListSortingStrategy` para `layout="list"`) + grade/lista, interpolando um `IndexInsertTaskPoint` (`className="col-span-full"` só no `layout="grid"`) antes de cada item via `Fragment` com `key={item.id}`. (checkpoint 2)
- [src/pages/index/components/IndexTasks/IndexActiveTasksList/IndexActiveTasksList.tsx](src/pages/index/components/IndexTasks/IndexActiveTasksList/IndexActiveTasksList.tsx) — os 3 blocos de seção copiados (Active/Paused/Pending) viram 3 chamadas a `IndexTasksSection` com `layout="grid"`, `groupId={null}` e `renderItem` = a antiga `renderSectionItems` adaptada para um item por vez (`renderSectionItem`); `sectionByItemId`/`handleDragEnd` não mudaram. (checkpoint 2)
- [src/layout/components/atoms/Input/index.tsx](src/layout/components/atoms/Input/index.tsx) — `Input` ganha `forwardRef<HTMLInputElement, InputProps>`, sem mudar nenhuma prop nem estilo existente; nenhum consumidor atual passava `ref`, então nenhum outro chamador muda de comportamento. Necessário porque o passo 7 do plano pede refocar o campo via `ref` depois de criar a task (`inputRef.current?.focus()` em `IndexInsertTaskPoint.tsx`), e o `Input` de hoje era um function component simples que não repassa `ref`. (checkpoint 2, infra não prevista literalmente no plano — ver `Desvios do plano`)
- [src/pages/index/components/IndexTasks/IndexActiveTasksList/IndexTaskGroup/IndexGroupTasksList.tsx](src/pages/index/components/IndexTasks/IndexActiveTasksList/IndexTaskGroup/IndexGroupTasksList.tsx) — a lista plana (`visibleChildren`) vira `children = getGroupChildren(tasks, group.id).filter((task) => !task.completed)` seccionado por `bucketByActivityStatus(children, getTaskActivityStatus)` em `active`/`paused`/`pending`; renderiza 3x `IndexTasksSection` (`layout="list"`, `groupId={group.id}`, `renderItem={(item) => <IndexSortableTaskItem task={item as Task} />}`), todas dentro do mesmo wrapper de scroll de hoje (`max-h-[560px] overflow-y-auto pr-2 py-1`, agora envolvendo as 3 seções juntas). Um único `DndContext` com `handleDragEnd` reescrito para o mesmo guard de seção da raiz (`sectionByItemId` a partir dos 3 buckets locais; só chama `reorderItems` quando a seção de `active.id` e a de `over.id` coincidem). "No tasks yet." só aparece quando `children.length === 0` (soma dos 3 buckets). (checkpoint 3)

## Desvios do plano
nenhum — os 5 passos do checkpoint 1 (extrair `createTask`, `insertTask`, `bucketByActivityStatus`,
`useListingTasks` consumindo a função extraída, `insertingBeforeId` no átomo) foram implementados
como o plano descreve.

### Desvio deliberado (adição autorizada pelo dev no gate desta cadeia, não é falha)
O dev autorizou, fora do `plano.md`/`spec.md` originais, adaptar o ponto de criação da task inline
para compor o prefixo `"[projeto] "` quando há um chip de projeto selecionado — a mesma composição
que `IndexAddInput.tsx` já faz (run anterior, já mergeada nesta branch):

```ts
const selectedProject = projectsEnabled
  ? projects.find((project) => project.id === selectedProjectId)
  : undefined;
const composedTitle = selectedProject
  ? `[${selectedProject.title}] ${title}`
  : title;
```

(lê `useProjectsState` para `projects`/`selectedProjectId` e `useStoredSettings` para
`projectsEnabled`, definidos em `src/pages/index/states/projects` e
`src/pages/index/hooks/useStoredSettings.ts`.)

**Este checkpoint não é o lugar certo para esse passo.** O checkpoint 1 é fundação pura — action
`insertTask` e utilitários sem nenhum chamador visível ainda ("Checkpoint sem nenhuma mudança
visível ainda", conforme a fronteira do próprio plano). O ponto de criação da task inline de
verdade — o componente que chama `insertTask` a partir de um input controlado pelo usuário,
`IndexActiveTasksList/shared-components/IndexInsertTaskPoint.tsx` — só nasce no **checkpoint 2**
(passo 6/7 do plano). Compor o prefixo aqui exigiria antecipar a criação desse componente, o que
amplia o escopo deste checkpoint sem necessidade e quebra a fronteira "refactor + action nova sem
chamador" que o próprio plano define para o checkpoint 1.

Por isso: **o passo extra do prefixo fica para o checkpoint 2**, no mesmo commit que cria
`IndexInsertTaskPoint.tsx` e implementa o Enter que chama `insertTask` (passo 7 do plano) — é ali
que existe, pela primeira vez, um lugar onde compor o título antes de chamar a action.

**RT novo inventado para cobrir este cruzamento** (não existe nenhum RT no `spec.md` para isso,
porque o cruzamento projeto×inserção-inline não fazia parte da spec desta task):

> **RT-027 (novo, fora da spec original)** [MUST] Quando existe um chip de projeto selecionado e
> `projectsEnabled` está ligado, a task criada pelo ponto de inserção inline nasce com o título
> prefixado `"[{projeto}] "`, exatamente a mesma composição que `IndexAddInput.tsx` já usa para o
> campo fixo. Sem chip selecionado, ou com `projectsEnabled` desligado, o título nasce sem prefixo,
> igual a hoje.

**A prova de RT-027 acontece na lane `browser` da Etapa 4 (validação final), não nesta Etapa 3** —
nenhum passo deste checkpoint 1 toca UI, então não há como provar nada visualmente ainda. O roteiro
de teste da lane `browser` (`## Plano de teste` do `plano.md`) não tem nenhum `S0N` para RT-027 por
ser um RT inventado fora da spec; a prova concreta deverá ser adicionada/rodada quando o checkpoint
que implementa o prefixo (2) fechar, junto dos demais `S0N` do roteiro existente.

**Atualização (checkpoint 2): RT-027 foi implementado neste checkpoint**, no `handleSubmit` de
`IndexInsertTaskPoint.tsx` — mesma composição de `IndexAddInput.tsx` (`projectsEnabled` +
`selectedProjectId` resolvendo o `Project` em `useProjectsState`, prefixo `` `[${project.title}] ` ``
aplicado ao título trimado antes de chamar `insertTask`). Continua valendo: **prova reservada para
a lane `browser` da Etapa 4**, não para esta Etapa 3 — nenhum `S0N` do roteiro cobre RT-027 hoje,
e o RT novo continua sem seção própria no `spec.md`/`plano.md` por ser adição do gate da cadeia, não
da spec original.

### Segundo desvio deliberado, menor: `Input` ganha `forwardRef`
O plano (passo 7) pede "refoca o input via `ref`" depois do `Enter` que cria a task, mas o `Input`
de `src/layout/components/atoms/Input/index.tsx` era um function component comum, sem
`forwardRef` — passar `ref={inputRef}` para ele geraria o aviso do React de "function components
cannot be given refs" e o `ref` nunca chegaria ao `<input>` de verdade. O plano não previa mexer
neste atom porque o contrato dele (props/estilo) não muda — só o `forwardRef` foi acrescentado, sem
alterar nenhuma prop nem classe existente, então nenhum dos outros consumidores do `Input`
(`IndexAddInput.tsx`, `IndexEditInput.tsx`, etc.) muda de comportamento. Registrado aqui por tocar
um arquivo fora da lista original de arquivos do checkpoint 2 do `plano.md`.

### Checkpoint 3 — sem desvios
O passo 10 foi implementado como o `plano.md` descreve: `IndexGroupTasksList.tsx` trocou a lista
plana pelas 3 chamadas a `IndexTasksSection` (`layout="list"`, `groupId={group.id}`), o guard de
`handleDragEnd` é a mesma comparação de seção que a raiz já usa (`sectionByItemId` + só reordena
quando a seção de `active` e a de `over` coincidem), e o wrapper de scroll (`max-h-[560px]
overflow-y-auto pr-2 py-1`) continua envolvendo o conjunto das 3 seções, não uma por seção — igual
à premissa já travada no `plano.md`. `IndexInsertTaskPoint`/`IndexTasksSection` não precisaram de
nenhuma mudança para funcionar dentro do grupo: já eram genéricos em `groupId`/`layout` desde o
checkpoint 2. RT-027 (prefixo de projeto) não foi tocado neste checkpoint — conferido que o
`handleSubmit` de `IndexInsertTaskPoint.tsx` (checkpoint 2) já cobre o fluxo de dentro do grupo
sem alteração, porque `groupId` só afeta o `insertTask`, não a composição do prefixo.

## Verificação
comando de verificação: ok (`npx eslint . --fix` — 0 erros, 6 warnings pré-existentes de
`react-hooks/exhaustive-deps` em arquivos não tocados por esta run, nenhum novo; `npx tsc
--noEmit` — sem saída, sem erros)
comando de teste: nenhum (cartão do projeto: sem suíte automatizada)

## Como testar
ambiente: `npm run dev` (Vite, porta fixa 1420)
estado: monte o estado descrito na seção `Fixtures`/`## Plano de teste` do `plano.md` (shim de
notificação; "Task A"/"Task B" pelo campo fixo; grupo ">Group X" com "Sub 1"/"Sub 2"; Pomodoro
"Start"; "Task Ativa" com Play; "Task Pausada" com Play+Stop; Play em "Sub 1") e rode o roteiro
completo S01-S29 — o plano está implementado por inteiro a partir deste checkpoint. Prova de tela
é decisão do nível 0 na Etapa 4, não desta etapa.

## Premissas
- O passo extra do prefixo `"[projeto] "` (autorizado pelo dev fora do plano/spec) foi julgado como
  pertencente ao checkpoint 2 (ver `Desvios do plano`) — e foi implementado nele, no `handleSubmit`
  de `IndexInsertTaskPoint.tsx`.
- `col-span-full` só é aplicado quando `layout === "grid"` (raiz); dentro do grupo (`layout="list"`,
  checkpoint 3) o `IndexInsertTaskPoint` recebe `className={undefined}`, como o contrato de
  `IndexTasksSection` já prevê.
- O `useEffect` que zera `title`/`interactionTick` quando `isOpen` vira `false` não está no texto
  literal do plano, mas é necessário para RT-017 não vazar texto de uma fresta fechada para a
  próxima vez que a mesma fresta reabrir — sem isso, `title` (estado local do componente) sobrevive
  ao fechamento silencioso disparado por outra fresta abrindo, porque o componente nunca desmonta.
- `renderItem={(item) => <IndexSortableTaskItem task={item as Task} />}` (checkpoint 3) usa o cast
  `as Task` que o próprio plano já prevê no passo 10 — `IndexTasksSection.renderItem` é tipado por
  `TaskItem` (`Task | TaskGroup`) porque a raiz também renderiza grupos, mas dentro de um grupo
  `children` só contém `Task` (grupos não aninham grupos, premissa já travada no `plano.md`), então
  o cast é seguro em tempo de execução, só não é inferido pelo TS a partir da assinatura genérica de
  `IndexTasksSection`.

## Checkpoint 2
- Passo 6 — `IndexInsertTaskPoint.tsx` criado: fechada mostra "+ adicionar task" só no hover
  (`group`/`group-hover`), crescendo de faixa fina (`h-2`) para a altura do botão (`hover:h-9`) via
  `transition-all` (RT-004, RT-005, RT-006); clique abre o input focado na mesma posição (RT-007);
  `interactionTick` incrementado em todo `keydown`/`click` reinicia o `useEffect` do `setTimeout` de
  20s (RT-012, RT-013, RT-014); `Escape` e `onBlur` (com título vazio) fecham sem criar nada
  (RT-015, RT-016).
- Passo 7 — mesmo arquivo: `Enter` com título não vazio chama `insertTask` (com o prefixo de
  projeto já composto — RT-027) e encadeia `executeTask`/`stopTask` por `status` (RT-020, RT-022);
  limpa o título local e refoca via `inputRef` sem tocar `insertingBeforeId`, reabrindo vazio e
  focado logo abaixo da task nova (RT-008, RT-009, RT-010). Sobrevive a reload por já usar
  `insertTask`/`useStoredTasks` sem mudança (RT-019).
- Passo 8 — `IndexTasksSection.tsx` criado: omite seção vazia, `SortableContext` com a estratégia
  certa por `layout`, interpola `IndexInsertTaskPoint` antes de cada item via `Fragment` com
  `key={item.id}` (RT-024 — nenhuma segunda cópia do cabeçalho/grade).
- Passo 9 — `IndexActiveTasksList.tsx`: os 3 blocos de seção copiados viram 3 chamadas a
  `IndexTasksSection` com `layout="grid"`, `groupId={null}`; `sectionByItemId`/`handleDragEnd`
  preservados sem mudança.
- Passo extra (RT-027, fora do plano/spec, autorizado pelo dev) — implementado aqui: o `Enter` de
  `IndexInsertTaskPoint.tsx` compõe `` `[${project.title}] ` `` quando `projectsEnabled` está ligado
  e há um projeto selecionado, mesma leitura de `IndexAddInput.tsx`. Prova reservada para a lane
  `browser` da Etapa 4.
- Infra não prevista literalmente no plano: `Input` (átomo compartilhado) ganhou `forwardRef` para
  o `ref` do passo 7 alcançar o `<input>` real — ver `Desvios do plano`.

Fronteira do checkpoint 2 batida: `eslint`/`tsc` passam; a inserção inline funciona de ponta a ponta
na listagem raiz. Falta o checkpoint 3 (seccionamento do card do grupo + inserção dentro dele).

## Checkpoint 3
- Passo 10 — `IndexGroupTasksList.tsx`: a lista plana (`visibleChildren`) vira
  `children = getGroupChildren(tasks, group.id).filter((task) => !task.completed)`, seccionada por
  `bucketByActivityStatus(children, getTaskActivityStatus)` em `active`/`paused`/`pending` (RT-023,
  RT-024 — reusa a mesma função e o mesmo componente `IndexTasksSection` da raiz, sem segunda
  cópia). Renderiza 3x `IndexTasksSection` (`layout="list"`, `groupId={group.id}`, `status`/`label`
  por bucket, `renderItem={(item) => <IndexSortableTaskItem task={item as Task} />}`), todas dentro
  do mesmo wrapper de scroll de hoje (`max-h-[560px] overflow-y-auto pr-2 py-1`, agora em volta das
  3 seções juntas). Um único `DndContext`; `handleDragEnd` reescrito com o mesmo guard de seção que
  `IndexActiveTasksList.tsx` já usa (`sectionByItemId` a partir dos 3 buckets locais; só chama
  `reorderItems` quando a seção de `active.id` e a de `over.id` coincidem — RT-025). "No tasks yet."
  só aparece quando `children.length === 0`, soma dos 3 buckets (RT-023).
  `IndexTasksSection`/`IndexInsertTaskPoint` já eram genéricos em `groupId`/`layout` desde o
  checkpoint 2, então a inserção inline dentro do grupo (RT-011, RT-020) e o campo fixo do card do
  grupo (RT-026, não tocado) herdam o comportamento sem nenhuma mudança adicional.

Fronteira do checkpoint 3 (final) batida: `eslint`/`tsc` passam; o card do grupo aparece
seccionado nas mesmas 3 seções da listagem geral e a inserção dentro dele herda estado do mesmo
jeito que a raiz. Este era o último checkpoint do plano — os 3 checkpoints e os 26 `RT` da spec
(RT-001 a RT-026) mais o RT-027 (fora da spec, autorizado pelo dev) estão implementados.

## Rodada 1
`review-1.md` reprovou com um único blocker: o comentário em
`IndexInsertTaskPoint.tsx:43-44` era o único do repositório inteiro em português, violando a
convenção de comentários só em inglês. Traduzido mantendo o mesmo racional técnico (RT-017/
RT-012), sem tocar em nenhum outro arquivo. Gates rodados de novo (`eslint`/`tsc`), ambos ok.
Commit `2c1fa0f`.

## Etapa 5 — correção de FAIL (RT-011)
A Etapa 4 (`teste-1-browser.md`) reprovou RT-011 [MUST]: hover numa fresta dentro do card do grupo
revelava também o rótulo "+ adicionar task" de outra fresta do mesmo grupo (vazamento), ausente na
listagem raiz.

Causa raiz: `IndexTaskGroup.tsx:90` (o card do grupo) usa a classe genérica `group` para revelar
seus próprios botões de ação no hover do card inteiro. `IndexInsertTaskPoint.tsx` também usava
`group`/`group-hover` genéricos para o rótulo de cada fresta. Como o card é ancestral de todas as
frestas renderizadas dentro dele (via `IndexGroupTasksList.tsx`, checkpoint 3), `:hover` numa
fresta qualquer bolha em CSS até o card ancestral, acendendo `group-hover:opacity-100` em **todas**
as frestas do mesmo grupo, não só na hovered — CSS não tem noção de "group mais próximo", casa
qualquer ancestral com a classe. Na raiz isso não ocorre porque lá as frestas são irmãs dos cards
de task/grupo, nunca descendentes de nenhum `group`.

Conserto: nomear o group local da fresta (`group/insert-point` no wrapper,
`group-hover/insert-point:opacity-100` no botão) — Tailwind v4 casa `group-hover/nome:` só com o
ancestral que tiver exatamente `group/nome`, então o `group` genérico do card deixa de acender esse
rótulo. Nenhum outro elemento do repo usa `group-hover:opacity-100` dentro de um `IndexInsertTaskPoint`,
então renomear não quebra nada.

Arquivo alterado: `src/pages/index/components/IndexTasks/IndexActiveTasksList/shared-components/IndexInsertTaskPoint.tsx` (2 linhas).
Gates: ok (`npx eslint . --fix` — 0 erros, 6 warnings pré-existentes; `npx tsc --noEmit` — sem erros).
Commit: `07fd675`.

Janela ao fechar este passo: 93% (140828/150000), 59/60 turns — `medir-janela.sh --self` reportou
`status=handoff`. O passo pedido (o conserto de RT-011) foi concluído por inteiro antes do handoff;
não sobrou trabalho parcial. Se a próxima rodada de teste apontar novo achado, ele cai para um
sucessor fresco.
