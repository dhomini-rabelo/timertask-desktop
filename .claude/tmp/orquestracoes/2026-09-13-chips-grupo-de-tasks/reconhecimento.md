# Reconhecimento — chips de projeto abaixo do input de adicionar task

## Estado atual
veredito: confirma

## Unidade afetada
raiz (pacote único React/Vite + Zustand; nenhuma outra unidade envolvida)

## Lane de cada RT
- RT-001 → codigo — `src/pages/index/hooks/useStoredWorkflows.ts` (padrão a imitar) e o novo hook `useStoredProjects` a criar no mesmo diretório
- RT-002 → codigo — `package.json` (dependencies) e os arquivos novos de chip/switch/modal
- RT-003 → browser — http://localhost:1420 (ver S08 do roteiro)
- RT-004 → browser
- RT-005 → browser
- RT-006 → browser
- RT-007 → browser
- RT-008 → browser
- RT-009 → browser
- RT-010 → browser
- RT-011 → browser
- RT-012 → browser
- RT-013 → browser
- RT-014 → browser
- RT-015 → browser
- RT-016 → browser
- RT-017 → browser
- RT-018 → browser
- RT-019 → browser
- RT-020 → browser
- RT-021 → browser
- RT-022 → browser

A lane `teste` está indisponível nesta task: o cartão do projeto diz `comando de teste: nenhum`, então nenhum RT foi posto nela — todos os que poderiam pedir suíte (regras com borda, como RT-014 e RT-022) caem em `browser`.

## RT problemáticos
nenhum

## Mapa do código
- [src/pages/index/components/IndexTasks/IndexAddInput.tsx:21](src/pages/index/components/IndexTasks/IndexAddInput.tsx#L21) — `handleAdd`: o branch `>` (linhas 24-32, cria `TaskGroup` via `addGroup`) e o branch normal (linhas 34-37, chama `addTask(title, null)`) já são ramos separados. O prefixo `"[nome do projeto] "` entra só no segundo ramo, compondo a string antes de chamar `addTask` — sem tocar o primeiro.
- [src/pages/index/states/tasks/index.ts:80](src/pages/index/states/tasks/index.ts#L80) — `addTask(title, groupId)`: só dá `trim()` no título recebido e não sabe nada de projeto. Fica agnóstico — o prefixo é montado no componente, não aqui, e bate com o "Fora de escopo" (a task não guarda vínculo com o projeto).
- [src/pages/index/states/workflows/index.ts:1](src/pages/index/states/workflows/index.ts#L1) — store Zustand de Workflow (`{id, title}`, CRUD `addWorkflow`/`editWorkflow`/`deleteWorkflow`, resolução de `selectedWorkflowId`). É o modelo de dados e de ações a imitar para Projects, com `workflowId` como FK em vez de reaproveitar o mesmo objeto Workflow.
  - `addWorkflow` (linha 95) e `editWorkflow` (linha 118) só recusam título vazio/só espaço — **não recusam nome duplicado**. Isso resolve a RT-014 sozinho: Projects deve seguir o mesmo, sem checagem de duplicado.
  - `deleteWorkflow` (linha 137) recusa apagar o último item (`workflows.length <= 1`). Não há regra equivalente para Project na spec — não copiar essa guarda.
- [src/pages/index/hooks/useStoredWorkflows.ts:1](src/pages/index/hooks/useStoredWorkflows.ts#L1) — hidrata de `localStorage["timertasks:workflows"]` uma vez (`hasHydratedRef`) e persiste a cada mudança via `useRef`. Modelo exato para `useStoredProjects` (chave nova, ex. `timertasks:projects`) e para o hook do switch (ex. `timertasks:projectsEnabled`), seguindo a convenção de nome `timertasks:<feature>` (linha 8, e as outras chaves em `useStoredTasks.ts:4`, `useStoredReports.ts:5`, `useDarkMode.ts:18`).
- [src/pages/index/components/IndexHeader/IndexHeader.tsx:1](src/pages/index/components/IndexHeader/IndexHeader.tsx#L1) — monta `Logo`, `IndexWorkflowSelector` (linha 40), `IndexWorkflowDialog` (linha 46, botão de engrenagem separado que hoje abre o modal de workflows direto) e `IndexDarkModeToggle` (linha 47). `workflowOptions` (linhas 19-22) e `handleWorkflowChange` (linha 24) são onde a opção "Manage" entra e onde o valor sentinela precisa ser filtrado antes de chamar `setSelectedWorkflowId`. É aqui também que o novo ícone de configurações (modal novo) entra, ao lado do que já existe.
- [src/pages/index/components/IndexHeader/components/IndexWorkflowSelector.tsx:1](src/pages/index/components/IndexHeader/components/IndexWorkflowSelector.tsx#L1) — wrapper fino do `Select.Root`/`Select.Trigger`/`Select.DisplayValue`; `options` é uma lista flat `{label, value}` (vem de `IndexHeader.tsx:19`). Não existe conceito de item "de ação" separado no primitivo — acrescentar "Manage" é só mais um item da mesma lista, com um `value` sentinela.
- [src/pages/index/components/IndexHeader/components/IndexWorkflowDialog/IndexWorkflowDialog.tsx:1](src/pages/index/components/IndexHeader/components/IndexWorkflowDialog/IndexWorkflowDialog.tsx#L1) — hoje é `Dialog.Root` não controlado, com seu próprio `Dialog.Trigger` (o botão de engrenagem, linhas 9-16). RT-015 exige abrir pelo select, então este componente precisa virar controlado (`isOpen`/`onOpenChange` vindo de fora) e perder o `Dialog.Trigger` interno — exatamente o padrão já usado em `UpdateTimerDialog.tsx:19-25,54` e `IndexReportsDialog.tsx:24,60` (estado `useState` no componente pai, dialog sem trigger próprio).
- [src/pages/index/components/IndexHeader/components/IndexWorkflowDialog/IndexWorkflowFooter.tsx:1](src/pages/index/components/IndexHeader/components/IndexWorkflowDialog/IndexWorkflowFooter.tsx#L1) — input + botão "Add" para criar workflow. Modelo do campo de criação do modal de Projects.
- [src/pages/index/components/IndexHeader/components/IndexWorkflowDialog/IndexWorkflowList.tsx:1](src/pages/index/components/IndexHeader/components/IndexWorkflowDialog/IndexWorkflowList.tsx#L1) e [IndexWorkflowListItem.tsx:1](src/pages/index/components/IndexHeader/components/IndexWorkflowDialog/IndexWorkflowListItem.tsx#L1) — lista + item com edição inline (Check/X) e exclusão (Trash2), botões com `disabled` calculado no pai. Modelo direto da lista/item do modal de Projects; a diferença é que a lista de Projects tem que filtrar por `workflowId === selectedWorkflowId` (RT-013), o que `IndexWorkflowList` não precisa fazer hoje porque Workflow não tem escopo.
- [src/layout/components/atoms/Dialog/root.tsx:1](src/layout/components/atoms/Dialog/root.tsx#L1), [index.tsx](src/layout/components/atoms/Dialog/index.tsx), [content.tsx](src/layout/components/atoms/Dialog/content.tsx), [footer.tsx](src/layout/components/atoms/Dialog/footer.tsx), [trigger.tsx](src/layout/components/atoms/Dialog/trigger.tsx) — primitivo de modal (Radix Dialog), já suporta `isOpen`/`onOpenChange` controlados. É a referência de desenho dos dois modais novos (RT-002), sem precisar de dependência nova.
- [src/layout/components/atoms/Select/*.tsx](src/layout/components/atoms/Select) — primitivo de select (Radix Select), `Root`/`Trigger`/`DisplayValue`/`Option`, já usado. Não precisa de dependência nova para a opção "Manage".
- [src/pages/index/hooks/useListingTasks.ts:9](src/pages/index/hooks/useListingTasks.ts#L9) — mostra o padrão de filtro `item.workflowId === selectedWorkflowId` (linha 15) usado em toda a base para escopar por workflow; mesmo padrão vale para os chips de Projects.
- [src/pages/index/components/IndexTimer.tsx:34](src/pages/index/components/IndexTimer.tsx#L34) — `useState<boolean>(isSettingsOpen)` + botão `Settings` (lucide) que chama `setIsSettingsOpen(true)`, com `UpdateTimerDialog` controlado nas linhas 187-190. É o padrão exato para o novo ícone de configurações do header abrir o modal de configurações novo.
- `package.json` — dependências atuais: `@radix-ui/react-dialog`, `@radix-ui/react-select` (sem `@radix-ui/react-switch` nem qualquer lib de chip/tag). Confirma que não há primitivo de switch pronto.

## Padrão da vizinhança
Cada domínio (`workflows`, `tasks`, `reports`) é uma store Zustand com `{state, actions}` isolada em `src/pages/index/states/<dominio>/index.ts`, pareada com um hook `useStored<Dominio>` em `src/pages/index/hooks/` que hidrata de uma chave `localStorage["timertasks:<dominio>"]` uma vez (guardado por `hasHydratedRef`) e persiste a cada mudança de estado via `useRef` + `useEffect`. Um modal de CRUD (workflows) é montado com `Dialog.Root` + uma lista (`*List.tsx`) que mapeia os itens + um item de lista com edição inline (`*ListItem.tsx`, ícones `Pencil`/`Check`/`X`/`Trash2`) + um rodapé com input de criação (`*Footer.tsx`). Um diálogo aberto por algo que não é o próprio `Dialog.Trigger` (um botão de ícone em outro componente) mantém `isOpen` num `useState` do componente pai e passa `isOpen`/`onOpenChange` para o `Dialog.Root`.

## Reuso disponível
- Primitivo `Dialog` (`src/layout/components/atoms/Dialog`) inteiro, controlado ou não.
- Primitivo `Select` (`src/layout/components/atoms/Select`) inteiro.
- `Button`, `Input` atoms.
- A família `IndexWorkflowDialog`/`IndexWorkflowList`/`IndexWorkflowListItem`/`IndexWorkflowFooter` como base de cópia para o modal de Projects (lista com editar/excluir + rodapé de criação).
- `useStoredWorkflows.ts` como base de cópia para `useStoredProjects` e para o hook do switch "Projetos".
- O padrão do botão `Settings` + `useState` + dialog controlado de `IndexTimer.tsx` para o novo ícone de configurações do header.

## Memórias que se aplicam
nenhuma (a única entrada de `business-rules` é de outro produto, conforme o cartão do projeto já registrou)

## Fixtures
veredito: sem mecanismo
estado: nenhum
a mudar: nada

## Roteiro de comprovação
ambiente: `npm run dev` — http://localhost:1420
estado: nenhum
url: http://localhost:1420

S01 (RT-004, RT-005) [final] o dev abre o app com o workflow "Work" selecionado e nenhum projeto cadastrado → abaixo do input aparece só o chip de ícone de configuração, sem nenhum chip de projeto.
S02 (RT-011) [final] o dev clica no chip de ícone de configuração → o modal de projetos abre, com a lista vazia.
S03 (RT-012, RT-013) [final] o dev digita "projeto exemplo 1" no campo do modal de projetos e confirma → "projeto exemplo 1" aparece na lista do modal.
S04 (RT-012) [final] o dev cria um segundo projeto, "projeto exemplo 2", no mesmo modal → a lista do modal mostra "projeto exemplo 1" e "projeto exemplo 2".
S05 (RT-014) [final] o dev tenta cadastrar um projeto com nome só de espaços → o modal recusa e a lista continua com só os dois projetos de antes.
S06 (RT-012) [final] o dev fecha o modal de projetos → a fileira abaixo do input mostra o chip "projeto exemplo 1", o chip "projeto exemplo 2" e o chip de configuração no fim.
S07 (RT-006) [final] o dev clica no chip "projeto exemplo 1" → o chip fica com o destaque visual de selecionado, distinto dos outros.
S08 (RT-003) [final] com "projeto exemplo 1" selecionado, o dev digita "> grupo teste" no input e salva → um grupo de tasks "grupo teste" é criado, sem nenhum colchete no título.
S09 (RT-008) [final] com "projeto exemplo 1" ainda selecionado, o dev digita "task 1" e salva → a lista de tasks mostra a task com o título "[projeto exemplo 1] task 1".
S10 (RT-010) [final] logo depois de salvar a task acima → o chip "projeto exemplo 1" continua com o destaque de selecionado, e o input está vazio.
S11 (RT-007) [final] o dev clica no chip "projeto exemplo 2", com "projeto exemplo 1" ainda selecionado → só o chip "projeto exemplo 2" fica com o destaque de selecionado.
S12 (RT-006) [final] o dev clica de novo no chip "projeto exemplo 2", já selecionado → nenhum chip fica com o destaque de selecionado.
S13 (RT-009) [final] sem nenhum chip selecionado, o dev digita "task sem projeto" e salva → a lista de tasks mostra o título "task sem projeto", sem colchete nenhum.
S14 (RT-005) [final] o dev troca o workflow do header de "Work" para "Personal", que não tem projeto cadastrado → a fileira abaixo do input mostra só o chip de configuração.
S15 (RT-015, RT-016) [final] o dev volta o workflow para "Work" e escolhe "Manage" no select de workflows do header → o modal de workflows já existente abre, e o select continua mostrando "Work" como valor selecionado.
S16 (RT-017) [final] o dev fecha o modal de workflows e clica no ícone de configurações do header → o modal de configurações abre, mostrando o switch "Projetos".
S17 (RT-018) [final] nesta primeira abertura do modal de configurações → o switch "Projetos" aparece ativo (ligado).
S18 (RT-019) [final] o dev desliga o switch "Projetos" e fecha o modal → abaixo do input não aparece nem a fileira de chips nem espaço em branco no lugar dela.
S19 (RT-021) [final] com o switch desligado, o dev olha a lista de tasks → a task "[projeto exemplo 1] task 1" salva antes continua com o mesmo título, com o prefixo.
S20 (RT-020) [final] o dev recarrega a página do app → o modal de configurações mostra o switch "Projetos" ainda desligado.
S21 (RT-004) [final] o dev religa o switch "Projetos" e fecha o modal → a fileira de chips volta a aparecer abaixo do input, com "projeto exemplo 1", "projeto exemplo 2" e o chip de configuração.
S22 (RT-013) [final] o dev troca o workflow para "Personal", abre o modal de projetos e cria "projeto pessoal 1" → "projeto pessoal 1" aparece sozinho na lista do modal.
S23 (RT-013) [final] o dev volta o workflow para "Work" e abre o modal de projetos → a lista mostra só "projeto exemplo 1" e "projeto exemplo 2", sem "projeto pessoal 1".
S24 (RT-022) [final] o dev renomeia "projeto exemplo 1" para "projeto exemplo 1 renomeado" no modal → a task salva antes continua na lista com o título antigo, "[projeto exemplo 1] task 1", sem mudar.
S25 (RT-022) [final] o dev seleciona o chip "projeto exemplo 1 renomeado" e, no modal de projetos, exclui esse mesmo projeto → depois de fechar o modal, nenhum chip da fileira aparece selecionado.
S26 (RT-022) [final] o dev digita "task depois de excluir" e salva → a lista de tasks mostra o título "task depois de excluir", sem colchete nenhum.

comando: nenhum
n/a

## Armadilhas
- `addWorkflow`/`editWorkflow` (states/workflows/index.ts:95,118) não recusam nome duplicado, só vazio/só espaço — RT-014 manda Projects seguir o mesmo; inventar checagem de duplicado cria duas regras diferentes no mesmo app.
- O branch `>` de `IndexAddInput.tsx:24-32` (cria `TaskGroup`) não pode receber o prefixo de projeto — é "Fora de escopo" da spec. Uma função única de "compor título" sem branch por tipo vaza o prefixo pro grupo.
- `IndexWorkflowDialog.tsx` hoje é não controlado, com `Dialog.Trigger` e botão de engrenagem próprios (linhas 8-16). RT-015/016 exigem abrir pelo select — o componente precisa virar controlado (`isOpen`/`onOpenChange`) e perder esse trigger interno, senão "Manage" no select não abre nada.
- O `Select.Root` é controlado por `value={selectedWorkflowId}` (IndexHeader.tsx:42). Adicionar "Manage" como mais um item e chamar `setSelectedWorkflowId` sem checar o valor sentinela quebra RT-016 (mudaria o workflow selecionado para "Manage").
- `deleteWorkflow` recusa apagar o último item (states/workflows/index.ts:139: `workflows.length <= 1`). Não existe regra equivalente para Project — não copiar essa guarda ao excluir o último projeto de um workflow.
- Não há `@radix-ui/react-switch` nem qualquer lib de chip instalada (só `react-dialog` e `react-select` em `package.json`). RT-002 proíbe dependência nova: o switch é um botão/checkbox estilizado à mão, no padrão do `IndexDarkModeToggle.tsx`.
- `useStoredWorkflows`/`useStoredTasks` só persistem depois que `hasHydratedRef.current` vira `true` (evita sobrescrever o `localStorage` com o estado inicial vazio antes da hidratação). Um hook novo para Projects/switch que pular essa guarda apaga o que já estava salvo a cada carregamento.

## Dúvidas
- Os projetos ficam num array próprio com `workflowId` como FK (mesmo padrão de `Task.workflowId` e do filtro `item.workflowId === selectedWorkflowId` já usado em `useListingTasks.ts`), ou aninhados dentro do objeto `Workflow` (um campo `projects: Project[]` em `states/workflows/index.ts`)? Candidatas: A) array próprio com FK, espelhando exatamente o padrão de Task e reaproveitando o mesmo filtro já usado no resto da base | B) aninhado em `Workflow`. Recomendo A, porque evita tocar o tipo/CRUD de Workflow (RT-002 e a regra "não tirar CRUD de workflow de onde está") e reaproveita um padrão de filtro já testado em produção.
- O botão de engrenagem que hoje abre o modal de workflows direto no header (`IndexWorkflowDialog.tsx`, ao lado do select) some do header, já que o modal passa a abrir só pelo "Manage" do select — ou ele continua ali como atalho extra, ao lado do novo ícone de configurações? Candidatas: A) o botão some, o header passa a ter só o novo ícone de configurações | B) os dois ícones convivem. Recomendo A, porque o delta descreve três modais com um caminho de entrada cada (select→workflows, chip→projetos, ícone novo→configurações) e dois ícones de engrenagem lado a lado no header confundiria qual abre o quê.

## Premissas
- "Reabrir o app" (RT-020) é simulado recarregando a página em `npm run dev`, porque o estado vive em `localStorage` do navegador e este ambiente não empacota o app Tauri.
- Novas chaves de `localStorage` seguem a convenção `timertasks:<feature>` já usada (`timertasks:workflows`, `timertasks:tasks`, `timertasks:reports`); o nome exato (ex. `timertasks:projects`, `timertasks:projectsEnabled`) é decisão de implementação, não muda o plano.
- O prefixo `"[nome do projeto] "` é composto dentro de `IndexAddInput.tsx` antes de chamar `addTask`, sem alterar a assinatura de `addTask` em `states/tasks/index.ts` — mantém a task sem vínculo com o projeto, como a spec pede em "Fora de escopo".

veredito: simples
