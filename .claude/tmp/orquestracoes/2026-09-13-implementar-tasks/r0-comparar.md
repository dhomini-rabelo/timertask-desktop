# r0 — comparação das runs A (chips-grupo-de-tasks) e B (inserir-task-inline)

Premissa assumida: nenhuma pergunta ficou pendente — todas as ambiguidades abaixo foram
resolvidas por leitura direta dos arquivos listados na tarefa (spec.md inteiro; de plano.md só
`## Passos` — títulos de checkpoint e caminhos citados —, `## Plano de teste`, `## Marcos de
validação`, `## Fixtures`, `## Cobertura`, `## Desvios da spec`; de reconhecimento.md só o
veredito). Nenhum arquivo de código-fonte foi lido além de confirmar que os caminhos citados
existem (`find`/`ls`), e `package.json`/`eslint.config.js` foram lidos só para o item 7.

## 1. Uma frase por task

- **A (chips-grupo-de-tasks)** entrega uma fileira de chips de projeto abaixo do input principal
  (por workflow, seleção única, persistidos em `localStorage`) que prefixam o título da task
  salva com `"[nome do projeto] "`, com CRUD de projetos num modal próprio e a função inteira
  ligada/desligada por um switch global num novo modal de configurações acessado pela engrenagem
  do header.
- **B (inserir-task-inline)** entrega um ponto de inserção "+ adicionar task" que aparece no hover
  de qualquer fresta entre tasks (inclusive dentro de um grupo, agora seccionado em
  Active/Paused/Pending), abre um input inline que cria a task exatamente naquela posição e
  naquele estado de atividade, some sozinho depois de 20s vazio e vira input reaberto na task
  seguinte para enfileirar criações.

## 2. Números por task

| | A | B |
|---|---|---|
| Checkpoints (`## Passos`) | 3 | 3 |
| Total de passos numerados | 23 (1–23) | 10 (1–10) |
| AC na spec | 10 (AC-001–AC-010) | 8 (AC-001–AC-008) |
| RT na spec | 22 (RT-001–RT-022) | 26 (RT-001–RT-026) |
| `lane:` do Plano de teste | browser, codigo | browser, codigo |
| Marcos de validação | 0 — "nenhum, task simples, validação roda uma vez no fim" | 0 — mesma redação, "veredito simples, validação roda uma vez no fim (checkpoint 3)" |
| Veredito de Fixtures | sem mecanismo | sem mecanismo |
| Veredito de dificuldade (reconhecimento) | simples | simples |

## 3. Sobreposição de arquivos

Único caminho citado nos dois planos: **`src/pages/index/states/tasks/index.ts`** (confirmado
que existe).

- **A** (passo 16, dentro de `IndexAddInput.tsx`) só **referencia** esse arquivo para garantir que
  não muda: compõe o prefixo `"[projeto] título"` em `IndexAddInput.tsx` antes de chamar
  `addTask(composedTitle, null)` — a assinatura de `addTask` em `states/tasks/index.ts` fica
  intacta, sem edição nele.
- **B** (passos 1 e 2) **edita** esse mesmo arquivo: extrai um helper privado `createTask(...)` do
  literal hoje dentro de `addTask` (refactor puro, sem mudança de comportamento) e acrescenta a
  nova action `insertTask(title, groupId, beforeId)` que usa esse helper.

Fora desse arquivo, os dois planos não tocam o mesmo caminho — mesmo estando na mesma árvore
(`src/pages/index/components/IndexTasks/`), A edita `IndexTasks.tsx` e `IndexAddInput.tsx`
(existentes) mais `IndexHeader.tsx`/`IndexWorkflowDialog.tsx` e cria a pasta
`IndexProjectChips/` e `IndexHeader/components/IndexSettingsDialog/`; B edita
`shared-state.ts`, `IndexActiveTasksList.tsx`, `IndexGroupTasksList.tsx`, `utils.ts`,
`useListingTasks.ts` e cria `IndexActiveTasksList/shared-components/` (`IndexInsertTaskPoint.tsx`,
`IndexTasksSection.tsx`) — nenhum desses caminhos coincide com os de A.

## 4. Dependência

Nenhuma. Nenhum passo de B lê ou importa algo que só existe depois de A (projects/settings), e
nenhum passo de A lê ou importa algo que só existe depois de B (insertTask/bucketing/seções). Os
dois só compartilham o arquivo do item 3, e de um jeito que não cria ordem obrigatória (leitura
sem edição vs. edição aditiva).

## 5. Risco de plano velho

- Se **A for implementada primeiro**: nenhum passo do plano de B fica desatualizado — B nunca
  menciona prefixo/projeto, e seu passo 7 (`Enter` chama `insertTask(title, groupId, beforeId)`
  direto) continua funcionando ao pé da letra. Só fica uma lacuna de produto não coberta por
  nenhum RT de nenhum dos dois planos: a task criada pelo ponto de inserção de B **não** ganha o
  prefixo `"[projeto] "` de A, porque `IndexInsertTaskPoint.tsx` chama `insertTask` e não passa
  pela composição de título que A só adicionou em `IndexAddInput.tsx` (passo 16 de A). Nenhum
  roteiro de B (S07/S09/S21/S22) prevê um chip de projeto selecionado.
- Se **B for implementada primeiro**: nenhum passo do plano de A fica desatualizado — A só lê
  `states/tasks/index.ts` para confirmar a assinatura de `addTask`, que o refactor de B preserva
  (passo 1 de B é explícito: "nenhuma mudança de comportamento"). A mesma lacuna acima existe, só
  que na outra direção: nada no roteiro de A (S08/S09/S13) usa o ponto de inserção de B.
- Em nenhuma ordem um plano invalida passos do outro; a única coisa que fica pendente nos dois
  casos é essa lacuna de composição de prefixo fora do fluxo de `IndexAddInput.tsx`, que nenhuma
  das duas specs previu (cada run foi planejada como se a outra não existisse).

## 6. Ordem recomendada

**A → B.** A é mais isolada (arquivos novos + edições pontuais em `IndexHeader.tsx`/
`IndexWorkflowDialog.tsx`/`IndexAddInput.tsx`/`IndexTasks.tsx`, sem tocar o motor de listagem).
B reestrutura o pipeline de renderização da lista (`useListingTasks.ts`, bucketing, seções,
drag-end) e ainda edita o core `states/tasks/index.ts`; landar essa mudança de maior raio contra
uma base já estável (A mesclada) reduz o risco de os dois diffs se emaranharem na mesma árvore
`IndexTasks/` durante a revisão.

## 7. Comando de verificação real

`package.json` não tem nenhum script chamado `lint` nem `lint:fix` (`scripts` só tem `dev`,
`build`, `preview`, `tauri`, `setup:win`, `build:win`) — `npm run lint:fix` **não existe** neste
projeto e falharia. Há um `eslint.config.js` na raiz, então o comando que de fato roda é
**`npx eslint . --fix`** (é exatamente o que o próprio plano.md de B usa na fronteira do
checkpoint 1; o plano.md de A usa "npm run lint:fix" nas fronteiras dos seus 3 checkpoints, que
precisaria virar `npx eslint . --fix` na hora de rodar). `npx tsc --noEmit` roda como descrito nos
dois planos.
