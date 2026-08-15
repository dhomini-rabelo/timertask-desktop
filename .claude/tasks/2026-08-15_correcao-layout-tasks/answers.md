# answers.md — correcao-layout-tasks

Nenhuma pergunta foi levada ao usuário (batch de perguntas = 0 tópicos). Tudo abaixo é **premissa
assumida** pelo meta-planner, resolvida pelo golden test (request + código + default previsível).
Premissas são **vinculantes** para os steps indicados — só o usuário pode reabrir.

## Premissas assumidas (nenhuma pergunta feita)

| # | Premissa | Vincula |
|---|----------|---------|
| P1 | O pedido "não devemos ter um scroll interno das tasks ativas — somente das tasks inativas" é literalmente **mover** a restrição de altura+scroll: tirar de `IndexTasks.tsx:30` (lista de ativas) e colocar na lista de **concluídas** dentro de `IndexFooter.tsx:80-92`. | 02 |
| P2 | **Altura máxima da lista de concluídas (inativas) = `max-h-[calc(100vh-400px)]`** — exatamente o valor que hoje está em `IndexTasks.tsx:30`, reaproveitado. Não há outro valor estabelecido no código (o único outro é `max-h-[60vh]` do dialog de nota, que é de modal, não de lista). É a única premissa "de produto" desta task; se o usuário discordar, é troca de UMA classe Tailwind em UMA linha — barata de reverter, e por isso não valeu um stop. | 02 |
| P3 | "as tasks ativas podem esticar as páginas" ⇒ o scroll passa a ser **da página inteira (window scroll)**, não de um container interno novo. Isso exige destravar a altura fixa do shell (`page.tsx:54 max-h-screen`, `global.css:44-47`, `global.css:67-71`) — sem isso, remover o `overflow-y-auto` só esconde conteúdo sem nenhum scroll. | 02 |
| P4 | `min-h-[250px]` do container de ativas **permanece** (mantém o empty-state centralizado com altura decente). Só `max-h-*` e `overflow-y-auto` saem. | 02 |
| P5 | Colapsar um grupo **não para** os cronômetros das tasks que estão rodando dentro dele. O tempo é derivado de `timeEvents` (`states/tasks/utils.ts:calculateTotalTimeInSeconds`), então desmontar o `IndexTaskItem` não perde tempo: ao reexpandir, `initialSeconds` + `shouldAutoStart` recolocam o cronômetro no ponto certo. Nenhum evento `stop` deve ser gravado ao colapsar. | 01 |
| P6 | **Não** adicionar indicador novo de "Running" no cabeçalho do grupo colapsado, nem qualquer outro elemento visual novo. Esta task é correção de bug; feature nova é escopo à parte. | 01 |
| P7 | Correção de overflow horizontal é **CSS/layout**, não mudança de composição: nada de remover botão, nada de esconder o Debug timer atrás de um menu. O objetivo é a linha de ações caber em 552px de largura útil (ver memória §4). Encolher (`min-w-0`/`flex-1`) e/ou quebrar linha (`flex-wrap`) são as saídas aceitas — a escolha entre elas é do planner do step 01. | 01 |
| P8 | Não mexer no átomo `Select` (`layout/components/atoms/Select/trigger.tsx`). O `w-full` de lá é usado também pelo `IndexWorkflowSelector` e provavelmente é desejado lá. A correção é **no call site** (`IndexAlertSelect.tsx:22`). | 01 |
| P9 | Escopo fechado = os 3 bugs relatados. Nada de refatorar DnD, nada de mexer em `IndexScore`/`scoreUtils` (as 2 esquisitices documentadas na task anterior seguem aceitas), nada de limpar `activeTasks`/`activeRootTasks` órfãos do `useListingTasks.ts`. | 01, 02 |
