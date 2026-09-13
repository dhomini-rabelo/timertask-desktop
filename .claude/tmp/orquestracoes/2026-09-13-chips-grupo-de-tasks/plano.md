# Plano — chips de projeto abaixo do input de adicionar task

## Resumo do plano

### O que muda

#### Checkpoint 1 — Camada de dados: Projects e Settings
- **`src/pages/index/states/projects/index.ts` (novo).** Store Zustand `useProjectsState`, no mesmo
  desenho de `states/workflows/index.ts`: `Project { id, workflowId, title }`, mais
  `selectedProjectId`. Ações `addProject`/`editProject` recusam nome vazio/só espaço e nome
  repetido dentro do mesmo workflow; `deleteProject` limpa a seleção se o projeto excluído era o
  selecionado; `selectProject` alterna a seleção (clicar de novo desmarca).
- **`src/pages/index/hooks/useStoredProjects.ts` (novo).** Hidrata/persiste `projects` em
  `localStorage["timertasks:projects"]`, no mesmo desenho de `useStoredWorkflows.ts`.
- **`src/pages/index/states/settings/index.ts` (novo).** Store Zustand `useSettingsState` com
  `projectsEnabled: boolean`, padrão `true`.
- **`src/pages/index/hooks/useStoredSettings.ts` (novo).** Hidrata/persiste
  `{ projectsEnabled }` em `localStorage["timertasks:settings"]`, mesmo desenho de
  `useStoredWorkflows.ts`.

#### Checkpoint 2 — Chips de projeto, modal de projetos e prefixo do título
- **`IndexProjectChips.tsx` (novo).** Fileira abaixo do input: some por completo (sem espaço
  reservado) quando `projectsEnabled` é falso; senão mostra um chip por projeto do workflow
  selecionado, com destaque visual no selecionado, mais um chip de ícone de configuração que abre
  o modal de projetos.
- **`IndexProjectsDialog.tsx`, `IndexProjectsList.tsx`, `IndexProjectsListItem.tsx`,
  `IndexProjectsFooter.tsx` (novos).** Modal de CRUD de projetos, cópia do desenho de
  `IndexWorkflowDialog`/`IndexWorkflowList`/`IndexWorkflowListItem`/`IndexWorkflowFooter`, mas
  escopado ao `workflowId` corrente e sem a guarda de "não apagar o último".
- **`IndexTasks.tsx`.** `IndexProjectChips` entra logo abaixo de `IndexAddInput`.
- **`IndexAddInput.tsx`.** No branch normal do input (não no branch `>` de grupo), o título salvo
  passa a levar o prefixo `"[nome do projeto] "` quando há projeto selecionado e a função está
  ativa; sem seleção, ou com a função desativada, o título sai como hoje.

#### Checkpoint 3 — Header: "Manage" no select, engrenagem nova e modal de configurações
- **`IndexHeader.tsx`.** O select de workflows ganha a opção final "Manage", que abre o modal de
  workflows sem trocar o workflow selecionado. Uma nova engrenagem abre o modal de configurações.
- **`IndexWorkflowDialog.tsx`.** Vira controlado (`isOpen`/`onOpenChange`) e perde o botão de
  engrenagem e o `Dialog.Trigger` que tinha — só abre pelo "Manage" do select.
- **`IndexSettingsDialog.tsx`, `IndexProjectsSwitch.tsx` (novos).** Modal de configurações com o
  switch "Projetos" (ativo por padrão), construído sem dependência nova.

### Decisões que travei sozinho
- Os projetos moram num array próprio com `workflowId` como FK (candidata A do reconhecimento),
  e a engrenagem do header passa a abrir o modal de configurações, e não mais o de workflows — as
  duas decisões já vieram fechadas no delta desta run, não são minhas.
- **RT-014 implementado com recusa de nome duplicado**, apesar de o modal de workflows não
  recusar duplicado hoje. O texto do RT tem duas frases em tensão ("nome repetido é recusado" vs.
  "se o modal de workflows não recusa duplicado, seguir o que ele faz"), mas o roteiro aprovado
  pelo dev trava a prova S27 exigindo a recusa — o roteiro é contrato fechado, então recuso
  duplicado (comparação exata, após `trim()`, dentro do mesmo workflow) só em `addProject`/
  `editProject`, sem tocar `addWorkflow`/`editWorkflow`.
- `selectedProjectId` é um campo único e global (não escopado por workflow, não persistido em
  `localStorage`) e só é limpo quando o projeto selecionado é excluído (RT-022). Trocar de
  workflow ou ligar/desligar o switch "Projetos" não limpa a seleção — nenhum RT pede isso, e a
  fileira já filtra por workflow, então um projeto de outro workflow nunca aparece marcado.
- Chave nova de `localStorage` para o switch: `timertasks:settings`, guardando o objeto
  `{ projectsEnabled: boolean }` (não uma chave escalar), para bater com o formato de estado da
  store.
- Valor sentinela da opção "Manage" no select: a string literal `"manage-workflows"`, que nunca
  colide com um `crypto.randomUUID()` de workflow.
- O switch "Projetos" é um `<button role="switch" aria-checked>` estilizado à mão (sem
  `@radix-ui/react-switch`), porque RT-002 proíbe dependência nova e o projeto não tem nenhum
  primitivo de switch.

### O que fica de fora
- Nada além do que a spec já pôs em `[Fora de escopo]`: a task não guarda vínculo com o projeto
  (o prefixo é só texto, montado em `IndexAddInput.tsx` antes de chamar `addTask`, sem mudar a
  assinatura de `addTask`), o TaskGroup da sintaxe `>` não muda, e não há filtro/agrupamento de
  tasks por projeto.

### Como se prova
AC-001 — a fileira de chips do workflow selecionado, com o chip de configuração no fim (S01, S06,
S14, lane browser).
AC-002 — clicar seleciona com destaque distinto, clicar de novo desmarca, um de cada vez (S07,
S11, S12, lane browser).
AC-003 — task salva com `"[projeto] título"` quando há seleção, e sem colchete sem seleção (S09,
S13, lane browser).
AC-004 — o chip continua selecionado e o input some depois de salvar (S10, lane browser).
AC-005 — o chip de configuração da fileira abre o modal de projetos (S02, lane browser).
AC-006 — criar, renomear e excluir projetos do workflow corrente, com as duas validações de nome
(S03, S04, S05, S22, S23, S24, S25, S27, lane browser).
AC-007 — "Manage" no select abre o modal de workflows sem trocar o workflow selecionado (S15,
lane browser).
AC-008 — switch "Projetos" ativo por padrão, desligá-lo esconde chips e chip de configuração sem
deixar espaço em branco, e o estado sobrevive a recarregar (S17, S18, S20, S21, lane browser).
AC-009 — desligar o switch ou renomear um projeto não muda o título de task já salva (S19, S24,
lane browser).
AC-010 — a engrenagem do header abre o modal de configurações (S16, lane browser).

## Objetivo
Introduzir projetos por workflow, escolhidos por chip abaixo do input de adicionar task, que
prefixam o título da task salva; com CRUD de projetos num modal próprio (aberto pelo chip de
configuração da fileira), um modal de configurações novo (aberto pela engrenagem do header, com o
switch "Projetos") e o modal de workflows já existente agora só alcançável pela opção "Manage" do
select de workflows.

## Passos

### Checkpoint 1 — Camada de dados: Projects e Settings
1. (infra — pré-requisito dos passos 2-16) **`src/pages/index/states/projects/index.ts`** — criar
   o tipo `Project { id: string; workflowId: string; title: string }`, `ProjectsState { projects:
   Project[]; selectedProjectId: string | null }`, `ProjectsActions { setProjectsState,
   addProject, editProject, deleteProject, selectProject }`, e a store `useProjectsState =
   create<...>(...)` com estado inicial `{ projects: [], selectedProjectId: null }`, no mesmo
   desenho de `states/workflows/index.ts` (`set`/`get`, `setState` interno que preserva o que não
   mudou).
2. (RT-012, RT-013, RT-014) mesmo arquivo — `addProject(title: string)`: resolve `workflowId` via
   `useWorkflowsState.getState().state.selectedWorkflowId`; se for `null`, retorna sem criar;
   `trim()` no título, retorna sem criar se vazio; recusa (retorna sem criar) se já existir
   projeto com o mesmo `title.trim()` (comparação exata, case-sensitive) no mesmo `workflowId`;
   senão adiciona `{ id: crypto.randomUUID(), workflowId, title: trimmedTitle }` a `projects`.
3. (RT-012, RT-014, RT-022) mesmo arquivo — `editProject(projectId: string, title: string)`:
   `trim()`, retorna sem alterar se vazio; localiza o `workflowId` do projeto pelo `projectId`;
   recusa se outro projeto do mesmo `workflowId` (excluindo o próprio `projectId`) já tiver esse
   título; senão atualiza o `title` desse projeto.
4. (RT-012, RT-022) mesmo arquivo — `deleteProject(projectId: string)`: remove o projeto da
   lista; se `selectedProjectId === projectId`, zera `selectedProjectId` para `null` na mesma
   atualização de estado.
5. (RT-006, RT-007) mesmo arquivo — `selectProject(projectId: string)`: se `selectedProjectId ===
   projectId`, define `null` (desmarca); senão define `projectId` (troca a seleção, no máximo um
   por vez).
6. (infra — pré-requisito dos passos 9-15) **`src/pages/index/hooks/useStoredProjects.ts`** —
   hook que hidrata `projects` de `localStorage["timertasks:projects"]` uma vez (guardado por
   `hasHydratedRef`, igual a `useStoredWorkflows.ts:10-53`) e persiste a cada mudança; se a chave
   não existir, o JSON `parse` falhar, ou o array filtrado (`project && project.id &&
   project.workflowId && project.title`) ficar vazio, inicia com `[]` (não existe `defaultProjects`
   — ao contrário de `defaultWorkflows`, um workflow sem projeto é estado válido); retorna
   `projects`. Não hidrata nem persiste `selectedProjectId` (fica só em memória).
7. (RT-018, RT-020) **`src/pages/index/states/settings/index.ts`** — criar `SettingsState {
   projectsEnabled: boolean }`, `SettingsActions { setSettingsState, setProjectsEnabled }`, store
   `useSettingsState` com estado inicial `{ projectsEnabled: true }`, mesmo desenho de
   `states/workflows/index.ts`.
8. (RT-018, RT-019, RT-020) **`src/pages/index/hooks/useStoredSettings.ts`** — hook que hidrata de
   `localStorage["timertasks:settings"]` (JSON `{ projectsEnabled: boolean }`) uma vez; se a chave
   não existir, o parse falhar, ou `projectsEnabled` não for booleano, mantém `{ projectsEnabled:
   true }` (o padrão da primeira abertura, RT-018) e marca hidratado; persiste a cada mudança, no
   mesmo desenho de `useStoredWorkflows.ts`; retorna `projectsEnabled` e `setProjectsEnabled`.

Checkpoint 1 fecha com `npm run lint:fix` e `npx tsc --noEmit` passando: os quatro arquivos
compilam sozinhos, mesmo sem nenhum componente os consumir ainda.

### Checkpoint 2 — Chips de projeto, modal de projetos e prefixo do título
9. (infra — pré-requisito dos passos 10-14) criar a pasta
   `src/pages/index/components/IndexTasks/IndexProjectChips/` para os arquivos dos passos 10-14.
10. (RT-004, RT-005, RT-006, RT-007, RT-011, RT-019) **`IndexProjectChips.tsx`** — lê
    `projectsEnabled` de `useStoredSettings()` e retorna `null` se for falso (RT-019: sem chips e
    sem espaço reservado); lê `projects` de `useStoredProjects()` e `selectedWorkflowId` de
    `useWorkflowsState`, filtra `projects.filter((p) => p.workflowId === selectedWorkflowId)`;
    renderiza `<div className="flex flex-wrap items-center gap-2">` com um botão-chip por
    projeto filtrado (`onClick` chama `selectProject(project.id)`; classe condicional ao
    `selectedProjectId === project.id`, ex. `bg-Green-500 text-White` selecionado vs. `bg-White
    border border-Black-100 text-Black-700 dark:bg-Black-700 dark:border-Black-500 dark:text-White`
    não selecionado), mais um chip final com o ícone `Settings` (lucide-react) que abre o modal de
    projetos via `useState<boolean>` local (`isProjectsDialogOpen`), renderizando
    `<IndexProjectsDialog isOpen={isProjectsDialogOpen} onOpenChange={setIsProjectsDialogOpen}
    />`.
11. (RT-011) **`IndexProjectsDialog.tsx`** — `Dialog.Root` controlado (`isOpen`/`onOpenChange`,
    padrão de `UpdateTimerDialog.tsx:54`), `Dialog.Content title="Projects" description="Manage
    the projects of the current workflow"`, corpo com `<IndexProjectsList />`, `Dialog.Footer`
    com `<IndexProjectsFooter />`.
12. (RT-012, RT-013) **`IndexProjectsList.tsx`** — lê `projects` de `useStoredProjects()` e
    `selectedWorkflowId` de `useWorkflowsState`, filtra `projects.filter((p) => p.workflowId ===
    selectedWorkflowId)`, mapeia para `<IndexProjectsListItem key={project.id}
    projectId={project.id} projectTitle={project.title} />` — sem a prop `isDeleteDisabled` que
    `IndexWorkflowList` calcula (armadilha do reconhecimento: Project não tem regra de "não
    apagar o último").
13. (RT-012, RT-014, RT-022) **`IndexProjectsListItem.tsx`** — mesmo desenho de
    `IndexWorkflowListItem.tsx` (edição inline com `Pencil`/`Check`/`X`, exclusão com `Trash2`),
    trocando `workflowActions.editWorkflow`/`deleteWorkflow` por `projectActions.editProject`/
    `deleteProject` de `useProjectsState`; sem a prop/guarda `isDeleteDisabled`.
14. (RT-012, RT-014) **`IndexProjectsFooter.tsx`** — mesmo desenho de `IndexWorkflowFooter.tsx`,
    trocando `workflowActions.addWorkflow` por `projectActions.addProject`; placeholder do input
    `"New project"`.
15. (RT-004) **`src/pages/index/components/IndexTasks/IndexTasks.tsx:35`** — inserir
    `<IndexProjectChips />` logo depois de `<IndexAddInput />` e antes de `<IndexErrorMessage />`.
16. (RT-003, RT-008, RT-009, RT-010) **`IndexAddInput.tsx`** — no branch normal (linhas 34-37
    atuais, não no branch `>` das linhas 24-32), antes de chamar `addTask`: ler `selectedProjectId`
    e `projects` de `useProjectsState`, e `projectsEnabled` de `useStoredSettings()`; resolver
    `const selectedProject = projectsEnabled ? projects.find((p) => p.id === selectedProjectId) :
    undefined;`; compor `const composedTitle = selectedProject ? \`[${selectedProject.title}]
    ${title}\` : title;` e chamar `addTask(composedTitle, null)` no lugar de `addTask(title,
    null)`. O branch `>` não muda — nenhuma composição de prefixo ali, e a assinatura de `addTask`
    em `states/tasks/index.ts` não é alterada (a task continua sem vínculo com o projeto).

Checkpoint 2 fecha com `npm run lint:fix` e `npx tsc --noEmit` passando: a fileira de chips, o
modal de projetos e o prefixo do título já funcionam de ponta a ponta contra o workflow
selecionado, mesmo com o header ainda do jeito antigo (o passo 20 é quem move a engrenagem).

### Checkpoint 3 — Header: "Manage" no select, engrenagem nova e modal de configurações
17. (RT-015, RT-016) **`IndexHeader.tsx`** — declarar `const MANAGE_WORKFLOW_OPTION_VALUE =
    "manage-workflows";` no topo do arquivo; acrescentar `{ label: "Manage", value:
    MANAGE_WORKFLOW_OPTION_VALUE }` ao fim do array `workflowOptions` (linhas 19-22); em
    `handleWorkflowChange(value)`, se `value === MANAGE_WORKFLOW_OPTION_VALUE`, chamar
    `setIsWorkflowDialogOpen(true)` e retornar sem chamar
    `workflowActions.setSelectedWorkflowId` (RT-016: o workflow selecionado não muda); caso
    contrário, manter o comportamento atual (`workflowActions.setSelectedWorkflowId(value)`).
18. (infra — pré-requisito dos passos 17, 19 e 20) mesmo arquivo — acrescentar `const
    [isWorkflowDialogOpen, setIsWorkflowDialogOpen] = useState(false);` e `const
    [isSettingsDialogOpen, setIsSettingsDialogOpen] = useState(false);`.
19. (RT-015, RT-017) **`IndexWorkflowDialog.tsx`** — torná-lo controlado: props `{ isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void }`; trocar `<Dialog.Root>` (linha 8) por `<Dialog.Root
    isOpen={isOpen} onOpenChange={onOpenChange}>`; remover o `<Dialog.Trigger>` e o `<button>` de
    engrenagem que ele envolvia (linhas 9-16 atuais) — `Dialog.Content`, `IndexWorkflowList` e
    `IndexWorkflowFooter` continuam iguais.
20. (RT-017) mesmo arquivo `IndexHeader.tsx` — trocar `<IndexWorkflowDialog />` (linha 46 atual)
    por `<IndexWorkflowDialog isOpen={isWorkflowDialogOpen} onOpenChange={setIsWorkflowDialogOpen}
    />`; acrescentar um novo botão de engrenagem (ícone `Settings` de `lucide-react`, mesma classe
    do botão que `IndexWorkflowDialog` tinha antes) com `onClick={() =>
    setIsSettingsDialogOpen(true)}`, entre `IndexWorkflowDialog` e `IndexDarkModeToggle`; renderizar
    `<IndexSettingsDialog isOpen={isSettingsDialogOpen} onOpenChange={setIsSettingsDialogOpen} />`
    no fim do `return` do componente.
21. (infra — pré-requisito dos passos 22-23) criar a pasta
    `src/pages/index/components/IndexHeader/components/IndexSettingsDialog/` para os arquivos dos
    passos 22-23.
22. (RT-017, RT-018) **`IndexSettingsDialog.tsx`** — `Dialog.Root` controlado (`isOpen`/
    `onOpenChange`), `Dialog.Content title="Settings" description="App-wide preferences"`, corpo
    com `<IndexProjectsSwitch />`.
23. (RT-018, RT-019, RT-020) **`IndexProjectsSwitch.tsx`** — lê `projectsEnabled` e
    `setProjectsEnabled` de `useStoredSettings()`; renderiza um rótulo de texto visível
    `"Projects"` ao lado de `<button type="button" role="switch" aria-checked={projectsEnabled}
    onClick={() => setProjectsEnabled(!projectsEnabled)}>`, estilizado à mão como um toggle
    (trilho + círculo deslizante, sem `@radix-ui/react-switch` — RT-002).

Checkpoint 3 fecha com `npm run lint:fix` e `npx tsc --noEmit` passando: o header tem uma
engrenagem só (abre configurações), o select tem "Manage" (abre workflows sem trocar seleção), e
o switch "Projetos" controla a fileira de chips do checkpoint 2, persistido entre recargas.

## Marcos de validação
nenhum — task `simples`, a validação roda uma vez, no fim.

## Ondas
onda única — este plano cobre todos os RT da spec (RT-001 a RT-022).

## Contratos
```ts
// src/pages/index/states/projects/index.ts
export interface Project {
  id: string;
  workflowId: string;
  title: string;
}
export interface ProjectsState {
  projects: Project[];
  selectedProjectId: string | null;
}
interface ProjectsActions {
  setProjectsState: (projects: Project[]) => void;
  addProject: (title: string) => void;
  editProject: (projectId: string, title: string) => void;
  deleteProject: (projectId: string) => void;
  selectProject: (projectId: string) => void;
}

// src/pages/index/states/settings/index.ts
export interface SettingsState {
  projectsEnabled: boolean;
}
interface SettingsActions {
  setSettingsState: (settings: SettingsState) => void;
  setProjectsEnabled: (enabled: boolean) => void;
}
```
- `localStorage["timertasks:projects"]` — `Project[]`, mesmo formato que `timertasks:workflows`.
- `localStorage["timertasks:settings"]` — `{ projectsEnabled: boolean }`.
- Sentinela do select de workflows: `"manage-workflows"` (nunca colide com um `crypto.randomUUID()`).
- Prefixo do título: `` `[${project.title}] ${title}` `` composto em `IndexAddInput.tsx`, nunca em
  `states/tasks/index.ts` (assinatura de `addTask` intacta).

## Fixtures
veredito: sem mecanismo (confirmado do reconhecimento — o projeto não tem mecanismo de fixtures).
a mudar: nada.

O estado de partida de cada prova já está narrado na própria ação do roteiro (ex.: S01 parte de
"nenhum projeto cadastrado", que é o estado natural de `localStorage["timertasks:projects"]`
vazio/ausente — o hook do passo 6 já cobre isso sem passo adicional).

## Plano de teste
lane: browser, codigo
ambiente: npm run dev — http://localhost:1420
estado: nenhum
url: http://localhost:1420 — a tela de Tasks, com o input principal de adicionar task

### Roteiro — lane browser
S01 (RT-004, RT-005) [final] o dev abre o app com o workflow "Work" selecionado e nenhum
    projeto cadastrado → abaixo do input aparece só o chip de ícone de configuração, sem
    nenhum chip de projeto
S02 (RT-011) [final] o dev clica no chip de ícone de configuração → o modal de projetos abre,
    com a lista vazia
S03 (RT-012, RT-013) [final] o dev digita "projeto exemplo 1" no campo do modal de projetos e
    confirma → "projeto exemplo 1" aparece na lista do modal
S04 (RT-012) [final] o dev cria um segundo projeto, "projeto exemplo 2", no mesmo modal → a
    lista do modal mostra "projeto exemplo 1" e "projeto exemplo 2"
S05 (RT-014) [final] o dev tenta cadastrar um projeto com nome só de espaços → o modal recusa
    e a lista continua com só os dois projetos de antes
S06 (RT-012) [final] o dev fecha o modal de projetos → a fileira abaixo do input mostra o chip
    "projeto exemplo 1", o chip "projeto exemplo 2" e o chip de configuração no fim
S07 (RT-006) [final] o dev clica no chip "projeto exemplo 1" → o chip fica com o destaque
    visual de selecionado, distinto dos outros
S08 (RT-003) [final] com "projeto exemplo 1" selecionado, o dev digita "> grupo teste" no input
    e salva → um grupo de tasks "grupo teste" é criado, sem nenhum colchete no título
S09 (RT-008) [final] com "projeto exemplo 1" ainda selecionado, o dev digita "task 1" e salva →
    a lista de tasks mostra a task com o título "[projeto exemplo 1] task 1"
S10 (RT-010) [final] logo depois de salvar a task acima → o chip "projeto exemplo 1" continua
    com o destaque de selecionado, e o input está vazio
S11 (RT-007) [final] o dev clica no chip "projeto exemplo 2", com "projeto exemplo 1" ainda
    selecionado → só o chip "projeto exemplo 2" fica com o destaque de selecionado
S12 (RT-006) [final] o dev clica de novo no chip "projeto exemplo 2", já selecionado → nenhum
    chip fica com o destaque de selecionado
S13 (RT-009) [final] sem nenhum chip selecionado, o dev digita "task sem projeto" e salva → a
    lista de tasks mostra o título "task sem projeto", sem colchete nenhum
S14 (RT-005) [final] o dev troca o workflow do header de "Work" para "Personal", que não tem
    projeto cadastrado → a fileira abaixo do input mostra só o chip de configuração
S15 (RT-015, RT-016) [final] o dev volta o workflow para "Work" e escolhe "Manage" no select de
    workflows do header → o modal de workflows já existente abre, e o select continua mostrando
    "Work" como valor selecionado
S16 (RT-017) [final] o dev fecha o modal de workflows e clica na engrenagem do header → o modal
    de configurações abre, mostrando o switch "Projetos"
S17 (RT-018) [final] nesta primeira abertura do modal de configurações → o switch "Projetos"
    aparece ativo (ligado)
S18 (RT-019) [final] o dev desliga o switch "Projetos" e fecha o modal → abaixo do input não
    aparece nem a fileira de chips nem espaço em branco no lugar dela
S19 (RT-021) [final] com o switch desligado, o dev olha a lista de tasks → a task
    "[projeto exemplo 1] task 1" salva antes continua com o mesmo título, com o prefixo
S20 (RT-020) [final] o dev recarrega a página do app → o modal de configurações mostra o switch
    "Projetos" ainda desligado
S21 (RT-004) [final] o dev religa o switch "Projetos" e fecha o modal → a fileira de chips volta
    a aparecer abaixo do input, com "projeto exemplo 1", "projeto exemplo 2" e o chip de
    configuração
S22 (RT-013) [final] o dev troca o workflow para "Personal", abre o modal de projetos e cria
    "projeto pessoal 1" → "projeto pessoal 1" aparece sozinho na lista do modal
S23 (RT-013) [final] o dev volta o workflow para "Work" e abre o modal de projetos → a lista
    mostra só "projeto exemplo 1" e "projeto exemplo 2", sem "projeto pessoal 1"
S24 (RT-022) [final] o dev renomeia "projeto exemplo 1" para "projeto exemplo 1 renomeado" no
    modal → a task salva antes continua na lista com o título antigo,
    "[projeto exemplo 1] task 1", sem mudar
S25 (RT-022) [final] o dev seleciona o chip "projeto exemplo 1 renomeado" e, no modal de
    projetos, exclui esse mesmo projeto → depois de fechar o modal, nenhum chip da fileira
    aparece selecionado
S26 (RT-022) [final] o dev digita "task depois de excluir" e salva → a lista de tasks mostra o
    título "task depois de excluir", sem colchete nenhum
S27 (RT-014) [final] o dev abre o modal de projetos e tenta cadastrar "projeto exemplo 2", que
    já existe na lista → o modal recusa e a lista continua com um projeto só

### Roteiro — lane teste
comando: nenhum
n/a

### RT-001 — lane codigo
Procurar em: `src/pages/index/states/projects/index.ts`, `src/pages/index/hooks/useStoredProjects.ts`,
`src/pages/index/states/settings/index.ts`, `src/pages/index/hooks/useStoredSettings.ts`.
Reprova se: os projetos ou o `projectsEnabled` não estiverem persistidos via `localStorage` (ex.:
só em memória, sem hook `useStored*`), ou se usarem uma chave fora do padrão `timertasks:<feature>`
já usado por `timertasks:workflows`.

### RT-002 — lane codigo
Procurar em: `package.json` (`dependencies`), e os componentes novos `IndexProjectChips.tsx`,
`IndexProjectsDialog.tsx`, `IndexSettingsDialog.tsx`, `IndexProjectsSwitch.tsx`.
Reprova se: apareceu qualquer pacote novo em `dependencies` para modal, select, switch ou chip; ou
se algum desses componentes novos não usa `Dialog`/`Select` de `src/layout/components/atoms` como
primitivo.

## Cobertura
RT-001 → seção RT-001 na lane codigo
RT-002 → seção RT-002 na lane codigo
RT-003 → S08 na lane browser
RT-004 → S01, S21 na lane browser
RT-005 → S01, S14 na lane browser
RT-006 → S07, S12 na lane browser
RT-007 → S11 na lane browser
RT-008 → S09 na lane browser
RT-009 → S13 na lane browser
RT-010 → S10 na lane browser
RT-011 → S02 na lane browser
RT-012 → S03, S04, S06 na lane browser
RT-013 → S03, S22, S23 na lane browser
RT-014 → S05, S27 na lane browser
RT-015 → S15 na lane browser
RT-016 → S15 na lane browser
RT-017 → S16 na lane browser
RT-018 → S17 na lane browser
RT-019 → S18 na lane browser
RT-020 → S20 na lane browser
RT-021 → S19 na lane browser
RT-022 → S24, S25, S26 na lane browser

## Desvios da spec
nenhum.

## Riscos
- Radix `Select` pode destacar por um instante o item "Manage" antes de o modal de workflows
  abrir, já que `onValueChange` dispara mesmo quando o `value` controlado não muda — cosmético,
  não quebra RT-016 (o `value` do `Select.Root` continua `selectedWorkflowId`).
- `selectedProjectId` não é limpo ao desligar/religar o switch "Projetos": se o dev desligar,
  religar e salvar sem reclicar o chip, o prefixo antigo pode reaparecer. Nenhum RT do roteiro
  cobre esse encadeamento (S18→S21 não testam salvar task no meio), então não é bloqueio deste
  plano — fica registrado para o caso de o dev discordar no gate.
- As quatro chaves de `localStorage` novas (`timertasks:projects` no passo 6,
  `timertasks:settings` no passo 8) não colidem com `timertasks:workflows`, `timertasks:tasks`,
  `timertasks:reports` ou `theme`, já existentes.

## Premissas
- "Reabrir o app" (RT-020) é simulado recarregando a página em `npm run dev`, porque o estado
  vive em `localStorage` do navegador e este ambiente não empacota o app Tauri (premissa herdada
  do reconhecimento).
- Comparação de nome duplicado em `addProject`/`editProject` é exata após `trim()` e
  case-sensitive (mesmo critério que "nome repetido" sugere sem mais detalhe na spec).
- `selectedProjectId` é global ao app (não por workflow) e não persiste em `localStorage` — só
  fica em memória, e reseta ao recarregar a página; nenhum RT exige o contrário.
