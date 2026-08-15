# steps.md — tasks-nivel-unico

Base: branch `main`, commit-base `d4204d3`, working tree limpo no bootstrap.
Janela do meta-planner no fim da escrita: medida com `medir-janela.sh`, `status=ok` (48%, proj 98k).

## Lista ordenada de steps

| NN | slug | objetivo em uma linha | classe | teste de sistema | depende de |
|----|------|----------------------|--------|------------------|-----------|
| 01 | `modelo-store-migracao` | Achatar o modelo: `Task` de nível único com cronômetro + `TaskGroup` sem cronômetro, store reescrito, migração do localStorage legado e `scoreUtils` plano; UI ajustada ao mínimo para o app abrir e `tsc` passar. | julgamento | browser | — |
| 02 | `item-unificado-multiativas` | Unificar os dois componentes de item num único `IndexTaskItem` com cronômetro/alerta/debug/concluir/nota para TODA task, com múltiplos cronômetros em paralelo e sincronismo com o timer global; título "Tasks". | julgamento | browser | 01 |
| 03 | `grupos-prefixo` | Criar grupo digitando `> titulo`, render do grupo (cabeçalho colapsável, input próprio "Add a task...", contagem + progresso do grupo), edição/exclusão e drag-and-drop dentro/entre grupos. | julgamento | browser | 01, 02 |
| 04 | `progresso-rodape-score` | Rodapé geral coerente com o modelo plano (contagem de todas as tasks de nível 1, barra de progresso, accordion de concluídas, reset único, fim do "Finish") e `IndexScore` correto. | julgamento | browser | 01, 02, 03 |

## Agrupamento — por que 4 steps e não mais fino

O pedido do usuário são 6 bullets, mas eles NÃO são 6 unidades de trabalho: cinco deles caem sobre os
mesmos ~10 arquivos em `src/pages/index/`. O agrupamento segue a fronteira de dependência real do
código, não a lista do usuário:

- **"tasks só no nível 1"**, **"múltiplas ativas"** e **"tudo visível na página 1"** são a MESMA mudança
  de modelo: apagar `Task.subtasks` e mover `timeEvents`/`isRunning` para a task de nível 1. Um step só
  para "remover subtasks" e outro para "permitir múltiplas ativas" editaria as mesmas funções do
  zustand duas vezes. Ficaram juntos no **step 01** (camada de dados) e **02** (camada de item).
- **A separação 01 ↔ 02 é a única fronteira de camada que existe aqui**: 01 mexe em
  `states/tasks/*` + `hooks/*` (modelo, ações, persistência, cálculo de score) e só toca a UI o
  necessário para o app continuar renderizando; 02 refaz a UI do item. Não dá para separar mais
  ("modelo puro" sem tocar a UI é impossível: apagar `Task.subtasks` quebra a árvore de componentes na
  hora), e não dá para juntar (o step 01 já é o maior do lote; juntar com o redesenho do item é
  exatamente o padrão de bundling que estoura a janela do implementador).
- **"grupo com `>`"** é o único requisito com superfície própria (parsing de entrada + um componente de
  container novo + progresso por grupo + DnD de dois níveis) e é o único que depende do modelo já estar
  achatado. Sozinho no **step 03**.
- **"mudar título para Tasks"** é uma linha e foi anexada ao step 02 (mesmo arquivo,
  `IndexTasks.tsx`); criar um step para isso seria desperdício.
- **"progresso e concluídas no nível 1"** tem duas metades: a do grupo (dentro do container do grupo,
  step 03) e a geral (rodapé + score, step 04). A metade do rodapé ficou separada porque só faz sentido
  depois que grupos existem — o rodapé precisa contar tasks de nível 1 tanto soltas quanto dentro de
  grupos — e porque envolve arquivos que os outros steps não tocam (`IndexFooter/*`, `IndexScore.tsx`).

Um split mais fino (por bullet, ou "tipos" separado de "ações do store") produziria steps que editam os
mesmos arquivos em sequência, cada um com o seu recon/plan/implement/validate/test — custo alto sem
ganho de isolamento. **Não re-splitar.**

## Notas de execução

- Não existe suíte de testes no repositório (nenhum `*.test.*`, sem vitest/jest, sem Dockerfile).
  Validação de cada step = `npx tsc --noEmit` + `npm run dev` (Vite em `http://localhost:1420`) com o
  browser, exercitando os fluxos descritos no `plan-simplified.md` do step.
- O app é Tauri, mas toda a lógica em jogo é web pura (React + zustand + jotai + localStorage);
  `src-tauri/` **não** é tocado por nenhum step. A única API Tauri em jogo é
  `@tauri-apps/plugin-notification` em `IndexSubTaskItem.tsx:1`, que no browser simplesmente não notifica —
  não é motivo de falha de teste.
- Todos os 4 steps são `julgamento`: nenhum deles é espelho mecânico de um molde existente.
