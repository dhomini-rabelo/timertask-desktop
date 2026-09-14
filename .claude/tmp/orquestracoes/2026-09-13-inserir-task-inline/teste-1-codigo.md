# Teste — lane codigo — rodada 1 — inserir task inline, na posição certa

## Veredito
PASS

## Ambiente
pré-requisito: n/a
ambiente: n/a
url: n/a
estado: n/a
unidades: n/a

## RT provados

### RT-001 (Geral) [MUST]
Requisito: Não introduzir dependência nova por causa do ponto de inserção nem do temporizador,
porque o comportamento é hover mais contagem de tempo e o projeto já tem tudo que isso precisa;
dependência nova aqui paga custo de bundle sem trazer nada.
Como provei: `git diff 2cb64f9 --name-only` (lista completa dos 10 arquivos alterados na run) não
contém `package.json` nem `package-lock.json`; `git log --all --oneline -- package.json
package-lock.json` mostra que o último commit a tocar esses arquivos é anterior à base da run
(`4628ffc`, muito antes de `2cb64f9`). O ponto de inserção usa apenas Tailwind `group`/`group-hover`
(`IndexInsertTaskPoint.tsx:144,151`) e `setTimeout`/`clearTimeout` nativos
(`IndexInsertTaskPoint.tsx:57,66`), sem nenhuma lib nova.
Provas: n/a
Esperado: nenhuma dependência nova em `package.json`/`package-lock.json`.
Observado: `package.json`/`package-lock.json` não aparecem no diff da run; hover é Tailwind puro,
timer é `setTimeout` nativo.
Resultado: PASS

### RT-002 (Geral) [MUST]
Requisito: Não mudar a forma como a ordem das tasks é representada hoje, porque mexer nisso
mexeria no drag-and-drop, que está fora de escopo.
Como provei: `src/pages/index/states/tasks/index.ts` — as interfaces `Task`/`TaskGroup` (linhas
11-30) não ganharam nenhum campo `position`/`index`/`order`; `insertTask` (linhas 167-206) insere
por `findIndex`/`slice` no próprio array `items`, mesma técnica que `addTask` já usava; `reorderItems`
(linhas 328-379) permanece com a mesma lógica de `splice`/reatribuição por posição no array, sem
nenhuma lógica de seção acrescentada nele.
Provas: n/a
Esperado: nenhum campo novo de posição, `reorderItems` sem lógica de seção.
Observado: ordem continua sendo só a posição no array `items`; `reorderItems` inalterado (confirmado
pelo diff, que não toca essa função).
Resultado: PASS

### RT-003 (Geral) [MUST]
Requisito: A task criada pelo ponto de inserção é igual em tudo a uma criada pelo campo fixo,
exceto pela posição e pelo estado de atividade herdado da seção: mesmos campos, mesma persistência,
nenhuma combinação de campos que hoje não exista.
Como provei: `src/pages/index/states/tasks/index.ts:85-100` — `createTask(title, workflowId,
groupId)` é o único lugar que monta o literal `Task` (`type`, `id`, `title`, `workflowId`, `groupId`,
`completed: false`, `isRunning: false`, `timeEvents: []`). `addTask` (linha 115) e `insertTask`
(linha 182) chamam exatamente esse `createTask`, sem literal próprio. `insertTask` não grava
`isRunning`/`timeEvents` diretamente — quem faz isso é `IndexInsertTaskPoint.tsx:106-113`, encadeando
`executeTask`/`stopTask` depois de `insertTask` retornar o id.
Provas: n/a
Esperado: `insertTask` usa o mesmo `createTask` que `addTask`, sem campo a mais/a menos nem grava
direta de `isRunning`/`timeEvents`.
Observado: confirmado — único ponto de construção do objeto `Task` é `createTask`, compartilhado
pelas duas actions.
Resultado: PASS

### RT-021 (AC-007) [MUST]
Requisito: A herança de estado usa o caminho de criação e de mudança de estado que o app já tem
hoje: nenhum campo novo, nenhum valor novo e nenhuma combinação de campos inédita.
Como provei: `IndexInsertTaskPoint.tsx:106-114` (`handleSubmit`) — `insertTask(...)` retorna
`newTaskId`; se `status === "active"` chama só `executeTask(newTaskId)`; se `status === "paused"`
chama `executeTask(newTaskId)` seguido de `stopTask(newTaskId)`; se `status === "pending"` não chama
nada. `executeTask`/`stopTask` (`index.ts:397-453`) são as mesmas actions que o Play/Stop manual já
usam, gravando `isRunning`/`timeEvents` do mesmo jeito de sempre — nenhum campo novo em `Task`.
Provas: n/a
Esperado: encadeamento por `executeTask`/`stopTask`, sem `isRunning: true` setado direto na criação.
Observado: confirmado — `createTask` sempre nasce com `isRunning: false`; o estado "ativo"/"pausado"
só é alcançado depois, via `executeTask`/`stopTask`.
Resultado: PASS

### RT-024 (AC-008) [MUST]
Requisito: A divisão em seções dentro do grupo reusa a mesma apresentação e a mesma regra de
agrupamento da listagem geral, sem uma segunda cópia da regra.
Como provei: `bucketByActivityStatus` só existe em `src/pages/index/states/tasks/utils.ts:136-157`;
é chamada em `useListingTasks.ts:37` (raiz) e em `IndexGroupTasksList.tsx:43` (grupo) — nenhum outro
`forEach` no repositório resolve active/paused/pending a partir de status (os `forEach` remanescentes
em `IndexActiveTasksList.tsx:38-40` e `IndexGroupTasksList.tsx:46-48` só populam um `Map` de id→seção
a partir dos buckets já prontos, não recalculam status). O bloco JSX de cabeçalho+grade/lista existe
em um único lugar, `IndexTasksSection.tsx:20-61`; `IndexActiveTasksList.tsx:67-92` e
`IndexGroupTasksList.tsx:89-120` só chamam esse componente (com `layout="grid"`/`layout="list"`
respectivamente), sem JSX de cabeçalho próprio.
Provas: n/a
Esperado: uma função de bucketing, um componente de seção, sem segunda cópia em nenhum dos dois.
Observado: confirmado nos dois pontos (regra de agrupamento e apresentação).
Resultado: PASS

## Observações
RT-027 (o prefixo `"[projeto] "` na task inline) é um RT novo, fora da `spec.md` original, e o
próprio `implementacao.md` reserva a prova dele para a lane `browser` da Etapa 4 ("A prova de RT-027
acontece na lane browser da Etapa 4... nenhum S0N do roteiro cobre RT-027 hoje"). Não há entrada
`### RT-027 — lane codigo` no `## Plano de teste` do `plano.md`, e o `## Cobertura` do plano não lista
RT-027 em nenhuma lane. Premissa assumida: RT-027 não pertence à lane `codigo` nesta run — fica fora
deste relatório, não como `n/d`/FAIL, mas como fora de escopo desta lane (decisão já registrada pelo
próprio `implementacao.md`, não uma suposição minha). Achado incidental sem RT associado: nenhum.

## Cobertura da lane
5 de 5 RT desta lane exercitados (RT-001, RT-002, RT-003, RT-021, RT-024). Nenhum `n/d`.
provas: n/a

## O que quebrou
n/a — nenhum FAIL.

## Registros tocados
nenhum
