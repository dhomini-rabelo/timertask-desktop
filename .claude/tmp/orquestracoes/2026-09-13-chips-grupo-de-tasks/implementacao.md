# Implementação — chips de projeto abaixo do input de adicionar task

## Base da run
commit: a7519c3
branch: feat/add-projetos-e-inline-tasks

## Checkpoints
checkpoint 3 de 3, restam não

## RT fechados
- checkpoint 1 → RT-001, RT-012, RT-013, RT-014, RT-018, RT-019, RT-020, RT-022, RT-006, RT-007
- checkpoint 2 → RT-003, RT-004, RT-005, RT-006, RT-007, RT-008, RT-009, RT-010, RT-011, RT-012, RT-013, RT-014, RT-019
- checkpoint 3 → RT-015, RT-016, RT-017, RT-018

## Commits
- 46c56db — feat(projects): store e persistência de projects e settings
- 8d87c16 — feat(projects): fileira de chips, modal de projetos e prefixo do título
- 8043860 — feat(projects): opcao Manage no select e modal de configuracoes com switch
- 503d5c1 — fix(projects): corrige race de hidratacao no useStoredSettings (RT-020)

## Arquivos alterados
- [src/pages/index/states/projects/index.ts](src/pages/index/states/projects/index.ts) — novo. Store Zustand `useProjectsState` com `Project`, `ProjectsState`, `addProject`/`editProject`/`deleteProject`/`selectProject` (checkpoint 1)
- [src/pages/index/hooks/useStoredProjects.ts](src/pages/index/hooks/useStoredProjects.ts) — novo. Hidrata/persiste `projects` em `localStorage["timertasks:projects"]` (checkpoint 1)
- [src/pages/index/states/settings/index.ts](src/pages/index/states/settings/index.ts) — novo. Store Zustand `useSettingsState` com `projectsEnabled: boolean`, padrão `true` (checkpoint 1)
- [src/pages/index/hooks/useStoredSettings.ts](src/pages/index/hooks/useStoredSettings.ts) — novo. Hidrata/persiste `{ projectsEnabled }` em `localStorage["timertasks:settings"]` (checkpoint 1)
- [src/pages/index/components/IndexTasks/IndexProjectChips/IndexProjectChips.tsx](src/pages/index/components/IndexTasks/IndexProjectChips/IndexProjectChips.tsx) — novo. Fileira de chips (some se `projectsEnabled` falso), chip de configuração que abre o modal de projetos (checkpoint 2)
- [src/pages/index/components/IndexTasks/IndexProjectChips/IndexProjectsDialog.tsx](src/pages/index/components/IndexTasks/IndexProjectChips/IndexProjectsDialog.tsx) — novo. Modal controlado de CRUD de projetos (checkpoint 2)
- [src/pages/index/components/IndexTasks/IndexProjectChips/IndexProjectsList.tsx](src/pages/index/components/IndexTasks/IndexProjectChips/IndexProjectsList.tsx) — novo. Lista filtrada por `workflowId === selectedWorkflowId` (checkpoint 2)
- [src/pages/index/components/IndexTasks/IndexProjectChips/IndexProjectsListItem.tsx](src/pages/index/components/IndexTasks/IndexProjectChips/IndexProjectsListItem.tsx) — novo. Item com edição inline e exclusão, sem guarda de "não apagar o último" (checkpoint 2)
- [src/pages/index/components/IndexTasks/IndexProjectChips/IndexProjectsFooter.tsx](src/pages/index/components/IndexTasks/IndexProjectChips/IndexProjectsFooter.tsx) — novo. Input + botão "Add" de criação de projeto (checkpoint 2)
- [src/pages/index/components/IndexTasks/IndexTasks.tsx](src/pages/index/components/IndexTasks/IndexTasks.tsx) — `<IndexProjectChips />` inserido logo após `<IndexAddInput />` (checkpoint 2)
- [src/pages/index/components/IndexTasks/IndexAddInput.tsx](src/pages/index/components/IndexTasks/IndexAddInput.tsx) — branch normal do `handleAdd` compõe `"[projeto] título"` quando há projeto selecionado e a função está ativa; branch `>` (grupo) intocado (checkpoint 2)
- [src/pages/index/components/IndexHeader/IndexHeader.tsx](src/pages/index/components/IndexHeader/IndexHeader.tsx) — `MANAGE_WORKFLOW_OPTION_VALUE`, opção "Manage" ao fim de `workflowOptions`, `handleWorkflowChange` desvia para abrir o modal de workflows sem trocar seleção; `IndexWorkflowDialog` agora controlado (`isWorkflowDialogOpen`); novo botão de engrenagem que abre `IndexSettingsDialog` (`isSettingsDialogOpen`) (checkpoint 3)
- [src/pages/index/components/IndexHeader/components/IndexWorkflowDialog/IndexWorkflowDialog.tsx](src/pages/index/components/IndexHeader/components/IndexWorkflowDialog/IndexWorkflowDialog.tsx) — vira controlado (`isOpen`/`onOpenChange`), perde `Dialog.Trigger` e o botão de engrenagem próprio (checkpoint 3)
- [src/pages/index/components/IndexHeader/components/IndexSettingsDialog/IndexSettingsDialog.tsx](src/pages/index/components/IndexHeader/components/IndexSettingsDialog/IndexSettingsDialog.tsx) — novo. `Dialog.Root` controlado, título "Settings", corpo com `<IndexProjectsSwitch />` (checkpoint 3)
- [src/pages/index/components/IndexHeader/components/IndexSettingsDialog/IndexProjectsSwitch.tsx](src/pages/index/components/IndexHeader/components/IndexSettingsDialog/IndexProjectsSwitch.tsx) — novo. Lê/escreve `projectsEnabled` de `useStoredSettings()`; `<button role="switch" aria-checked>` estilizado à mão, sem dependência nova (checkpoint 3)

## Desvios do plano
nenhum.

## Verificação
comando de verificação: ok (`npx eslint . --fix` — 0 erros, 6 warnings pré-existentes não relacionados; `npx tsc --noEmit` — sem saída), rodado após o checkpoint 1, de novo após o checkpoint 2, de novo após o checkpoint 3 e de novo após a rodada 1 (correção do RT-020)
comando de teste: nenhum

## Como testar
ambiente: npm run dev — http://localhost:1420
estado: nenhum
Com o checkpoint 3, o plano inteiro está implementado: o roteiro completo (S01–S27) do plano de
teste é provável de ponta a ponta, incluindo "Manage" no select (S15), a engrenagem única do
header abrindo o modal de configurações (S16) e o switch "Projetos" (S17–S21).

## Checkpoint 1
- Passo 1 — store `useProjectsState` criada com estado inicial `{projects: [], selectedProjectId: null}`.
- Passos 2–4 — `addProject`/`editProject`/`deleteProject` com as recusas de vazio/duplicado e limpeza de seleção ao excluir.
- Passo 5 — `selectProject` alterna seleção (clique de novo desmarca).
- Passo 6 — `useStoredProjects` hidrata/persiste `timertasks:projects`, sem `defaultProjects`.
- Passos 7–8 — `useSettingsState`/`useStoredSettings` com `projectsEnabled` padrão `true`, persistido em `timertasks:settings`.

## Checkpoint 2
- Passo 9 — pasta `IndexProjectChips/` criada.
- Passo 10 — `IndexProjectChips.tsx`: `null` quando desativado, filtro por workflow, chip de configuração.
- Passo 11 — `IndexProjectsDialog.tsx`: `Dialog.Root` controlado.
- Passo 12 — `IndexProjectsList.tsx`: filtra por `workflowId`.
- Passo 13 — `IndexProjectsListItem.tsx`: cópia do item de workflow, sem `isDeleteDisabled`.
- Passo 14 — `IndexProjectsFooter.tsx`: input + "Add" chamando `addProject`.
- Passo 15 — `IndexTasks.tsx`: `<IndexProjectChips />` inserido após `<IndexAddInput />`.
- Passo 16 — `IndexAddInput.tsx`: branch normal compõe o prefixo antes de `addTask`; branch `>` intocado.

## Checkpoint 3
- Passo 17 — `IndexHeader.tsx`: `MANAGE_WORKFLOW_OPTION_VALUE = "manage-workflows"`; opção
  `{ label: "Manage", value: MANAGE_WORKFLOW_OPTION_VALUE }` ao fim de `workflowOptions`;
  `handleWorkflowChange` abre o modal de workflows e retorna sem chamar `setSelectedWorkflowId`
  quando o valor é o sentinela.
- Passo 18 — mesmo arquivo: `isWorkflowDialogOpen` e `isSettingsDialogOpen` (`useState(false)`
  cada).
- Passo 19 — `IndexWorkflowDialog.tsx`: vira controlado (`isOpen`/`onOpenChange`), perde
  `Dialog.Trigger` e o botão de engrenagem que ele envolvia.
- Passo 20 — `IndexHeader.tsx`: `<IndexWorkflowDialog isOpen={isWorkflowDialogOpen}
  onOpenChange={setIsWorkflowDialogOpen} />`; novo botão de engrenagem (ícone `Settings`, mesma
  classe do botão antigo) entre `IndexWorkflowDialog` e `IndexDarkModeToggle`, abrindo
  `isSettingsDialogOpen`; `<IndexSettingsDialog isOpen={isSettingsDialogOpen}
  onOpenChange={setIsSettingsDialogOpen} />` renderizado no fim do componente.
- Passo 21 — pasta `IndexSettingsDialog/` criada.
- Passo 22 — `IndexSettingsDialog.tsx`: `Dialog.Root` controlado, título "Settings", descrição
  "App-wide preferences", corpo com `<IndexProjectsSwitch />`.
- Passo 23 — `IndexProjectsSwitch.tsx`: lê/escreve `projectsEnabled` de `useStoredSettings()`;
  rótulo "Projects" + `<button role="switch" aria-checked>` estilizado à mão (trilho + círculo
  deslizante via classe condicional), sem `@radix-ui/react-switch`.

## Rodada 1
Correção disparada por `teste-1-browser.md`: RT-020 (AC-008) reprovado — o switch "Projetos"
desligado voltava a ligado sozinho após reload da página.

- **`src/pages/index/hooks/useStoredSettings.ts`** — troquei `hasHydratedRef`/`settingsRef` (dois
  `useRef`) por um `hasHydrated` de `useState`, e a escrita em `localStorage` passou a serializar
  `{ projectsEnabled }` direto (o valor do closure do próprio effect), sem o `settingsRef`
  intermediário.
  Causa raiz confirmada por leitura do fluxo de effects (o achado do teste apontava a instância
  dupla do hook como gatilho, mas o problema é estrutural ao hook, presente mesmo numa instância
  só): no mount, o effect de hidratação lia o `localStorage`, chamava `setSettingsState(parsed)` e
  marcava `hasHydratedRef.current = true` **de forma síncrona, na mesma volta de effects** — sem
  esperar o re-render que propaga o `projectsEnabled` novo. O effect de persistência, que corria
  na sequência ainda nessa mesma volta, via `hasHydratedRef.current` já `true` e gravava
  `settingsRef.current` — que o effect de sincronização do ref (`useEffect(() => {
  settingsRef.current = { projectsEnabled }; }, [projectsEnabled])`) ainda não tinha atualizado,
  porque ele também roda nesse mesmo primeiro commit com o `projectsEnabled` do render antigo
  (`true`, o default) — regravando `true` por cima do `false` recém-lido do disco.
  Com `hasHydrated` como estado do React em vez de ref, o `setHasHydrated(true)` fica no mesmo
  batch do `setSettingsState(parsed)`: o effect de persistência só roda de novo **depois** do
  commit em que os dois já se propagaram juntos, então o `projectsEnabled` que ele lê do closure
  já é o valor hidratado — sem stale value, sem `ref` extra para dessincronizar. Isso corrige a
  race independente de quantas instâncias do hook estão montadas ao mesmo tempo (confirmei por
  grep que há três: `IndexAddInput.tsx`, `IndexProjectChips.tsx` e `IndexProjectsSwitch.tsx`), e
  não exigiu tocar nenhum desses três arquivos nem `useStoredWorkflows.ts`/`useStoredProjects.ts` —
  fora do escopo apontado pelo teste.

## Premissas
- `setState` interno de `useProjectsState` usa `partial.selectedProjectId !== undefined` (em vez
  do `??` que `states/workflows/index.ts` usa para `selectedWorkflowId`), porque
  `selectedProjectId` precisa poder ser setado explicitamente para `null` (ex.: `deleteProject`
  limpando a seleção, `selectProject` desmarcando) — com `??`, `null ?? store.state.x` retornaria
  `store.state.x` e a limpeza de seleção nunca aconteceria. Decisão de implementação, confinada ao
  arquivo novo, sem RT que dite o contrário.
- `useStoredProjects` não tem `defaultProjects` (ao contrário de `useStoredWorkflows`): chave
  ausente, parse inválido ou array vazio após o filtro inicia com `[]`, conforme o passo 6 do
  plano — "um workflow sem projeto é estado válido".
- Numeração conferida contra o plano: 3 checkpoints, 23 passos (1–23), 10 AC, 22 RT, lanes
  `browser` e `codigo`, 0 marcos de validação, Fixtures "sem mecanismo", dificuldade "simples" —
  bate com os números esperados da run, sem divergência a reportar.
- `isDisabled={workflowOptions.length === 0}` em `IndexHeader.tsx` não foi ajustado para
  `workflows.length === 0`: com a opção "Manage" sempre presente, essa expressão nunca é `true`,
  mas já não era antes — `useStoredWorkflows` sempre cai em `defaultWorkflows` (nunca vazio) e
  `deleteWorkflow` recusa apagar o último, então `workflows` nunca é `[]` em nenhum estado
  alcançável. Sem RT nem passo do plano pedindo a troca, e sem mudança de comportamento
  observável, mantive a expressão como estava.
