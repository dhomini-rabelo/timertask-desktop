# Plano — step 04 `progresso-rodape-score` (último step da task)

Base: branch `main`, commit-base `2877767`. Recon: `recon.md` (veredito `simples`, escalado para Opus por
divergência de classe). Contrato: `plan-simplified.md`. Decisões: `../../answers.md`. Memória:
`../../memoria-da-task.md`.

## Premissas assumidas

- **A1 — O IN nominal já está 90% entregue.** O step 01 reescreveu `IndexFooter.tsx` inteiro para compilar
  contra o novo store, e com isso já cumpriu, verificado item a item pelo recon: sem botão "Finish"
  (P13), sem `canFinishTask`/`handleFinishTask`, sem props `inExecutionTaskId`/`onFinishTask`, sem bloco
  `listingMode === "subtasks"`, `handleReset` chamando `clearItems()` escopado ao workflow (P14),
  contagem `completedTasks.length of tasks.length` sobre **todas** as tasks de nível 1 do workflow
  (soltas + dentro de grupos, grupos fora do denominador — decisão 4 + P3, garantido por
  `useListingTasks.ts:13-14`, que separa `groups` de `tasks` via type guards), e
  `IndexCompletedTaskItem.tsx` lendo `task.timeEvents` direto sem o branch `"subtasks" in task`.
  **Este step NÃO reescreve nada disso** — só valida no teste de sistema.
- **A2 — Restam exatamente 3 entregas de implementação**: (i) indicação de grupo no card de task concluída,
  (ii) apagar o órfão `IndexFooter/IndexTaskNote.tsx`, (iii) fechar a varredura de resíduos do IN item 4.
- **A3 — As 2 esquisitices do `IndexScore` são PRÉ-EXISTENTES e ficam FORA do escopo** (confirmadas
  byte-a-byte em `git show eec34ca^`): (a) `IndexScore.tsx` soma **todos** os workflows, ignorando
  `selectedWorkflowId`; (b) `calculateTasksCompleted` conta qualquer task que já emitiu um evento
  `"complete"`, mesmo que tenha sido desmarcada depois (`toggleTask` só ADICIONA o evento, nunca remove).
  Nenhuma das duas é regressão da migração; o OUT do `plan-simplified.md` veda mexer em métricas de score.
  O teste de sistema **registra** as duas se aparecerem, com a etiqueta "pré-existente, não é bug deste
  step", e **não** falha por causa delas.
- **A4 — `LegacySubTask` e `entry.subtasks` em `useStoredTasks.ts:11,30,70,71,81` são INTENCIONAIS** (é a
  leitura do formato antigo dentro de `migrateEntry`, exigida pela decisão 3 + T10 de idempotência). NÃO
  entram na varredura de resíduos. A varredura já foi refeita neste plano e está limpa fora deles
  (os demais hits de `ListingTask` são o nome do hook `useListingTasks`, não o tipo removido).
- **A5 — Sem prop nova de dados brutos.** `IndexCompletedTaskItem` continua um componente apresentacional
  que recebe dado já derivado; o lookup acontece **uma vez** no `IndexFooter`, não N vezes dentro dos
  itens. Ver "Decisão de desenho" abaixo.
- **A6 — Sem confirmação de usuário, sem novos arquivos, sem novas ações de store.** O contrato do store
  fechado no step 01 permanece fechado.

## Decisão de desenho — indicação de grupo na task concluída

Três opções consideradas: (a) passar `groups: TaskGroup[]` e fazer `.find()` dentro do item;
(b) passar o título já resolvido; (c) chamar `useListingTasks()` dentro de cada item.

**Escolhida: (b).** Motivos: o accordion pode ter dezenas/centenas de itens (T10 registra 151 concluídas
em produção) — (a) é O(n·m) e (c) cria N assinaturas do store por render; além disso
`IndexCompletedTaskItem` hoje recebe só `task` e não conhece o tipo `TaskGroup`, e manter isso preserva
a separação "footer deriva, item renderiza" que o próprio `IndexFooter` já usa.

Contrato exato:

1. **`IndexFooter.tsx`**
   - `:20` passa a desestruturar `groups` também: `const { tasks, completedTasks, groups } = useListingTasks();`
   - Novo derivado, logo após o cálculo de `progressPercentage` (`:24-26`):
     `const groupTitleById = new Map(groups.map((group) => [group.id, group.title]));`
     (`new Map` por render é aceitável e imutável — respeita T8/React Compiler; não usar `useMemo`, o
     compiler cuida disso e o resto do arquivo não usa `useMemo` em lugar nenhum.)
   - `:80` passa a prop resolvida:
     `groupTitle={task.groupId ? groupTitleById.get(task.groupId) : undefined}`
   - Nada mais muda no arquivo.

2. **`IndexCompletedTaskItem.tsx`**
   - Assinatura: `interface IndexCompletedTaskItemProps { task: Task; groupTitle?: string }`
     (`:11-13`), e `export function IndexCompletedTaskItem({ task, groupTitle }: ...)` (`:31`).
     `groupTitle` **opcional** — task solta (`groupId === null`) e grupo inexistente/de outro workflow
     caem no mesmo caminho "sem badge", sem `?? ""` e sem string vazia renderizada.
   - Markup: um `<span>` badge como **primeiro filho** da linha de metadados que já existe em `:54`
     (`<div className="flex items-center gap-2 text-xs text-Black-400">`), ANTES do ternário
     `hasTrackedTime`. Assim o badge aparece nos dois ramos (com tempo e "No time tracked") com uma única
     inserção, e não corre risco de quebrar o layout do título, que é `break-all` e pode ser longo.

     ```tsx
     {groupTitle && (
       <span className="px-2 py-0.5 rounded-full font-medium bg-Black-100/50 text-Black-450 dark:bg-Black-600 dark:text-Black-400 break-all">
         {groupTitle}
       </span>
     )}
     ```

     Justificativa das classes (todas já em uso no projeto, nada novo no design system):
     `bg-Black-100/50` = fundo do container de grupo (`IndexTaskGroup.tsx:84`);
     `dark:bg-Black-600` em vez de `dark:bg-Black-700/50` porque o card da concluída já é
     `dark:bg-Black-700` (`IndexCompletedTaskItem.tsx:43`) e o /50 sumiria;
     `text-Black-450 dark:text-Black-400` = par de texto secundário já usado em `:51` e `IndexTaskGroup.tsx:135`;
     `rounded-full px-2 py-0.5` = pílula, mesma família do `Select.Trigger` (`IndexAlertSelect.tsx:22`);
     o `text-xs` vem herdado do `<div>` pai, não repetir.
   - **Só o título do grupo**, sem prefixo "Grupo:"/"in ", sem ícone — espelha `IndexTaskGroup.tsx:98-100`,
     que mostra `group.title` cru. Não inventar copy nova.

3. **`IndexTaskNote.tsx`** (`IndexFooter/IndexTaskNote.tsx`) — **apagar o arquivo** (`git rm`). Órfão
  confirmado duas vezes: `grep -rn "IndexTaskNote\b" src/` só acha a própria `export function` na `:22`;
  a pasta `IndexFooter/` não tem barrel/`index.ts`. Era o painel de nota da navegação de 2 níveis (P1).
  **NÃO CONFUNDIR com `IndexActiveTasksList/IndexTaskNoteDialog.tsx`**, que é o dialog por-task do step 02,
  segue em uso (`IndexCompletedTaskItem.tsx:9,74`) e **não pode ser tocado** — o órfão importa o dialog
  (`IndexTaskNote.tsx:6`), então apagar o órfão não pode arrastar o dialog junto.

## Arquivos tocados

| Arquivo | Ação |
|---|---|
| `src/pages/index/components/IndexTasks/IndexFooter/IndexFooter.tsx` | editar (3 linhas: destructuring, `groupTitleById`, prop no call site) |
| `src/pages/index/components/IndexTasks/IndexFooter/IndexCompletedTaskItem.tsx` | editar (prop opcional + badge condicional) |
| `src/pages/index/components/IndexTasks/IndexFooter/IndexTaskNote.tsx` | **apagar** |

Explicitamente **NÃO** tocados: `IndexScore.tsx`, `scoreUtils.ts`, `states/tasks/index.ts`,
`hooks/useListingTasks.ts`, `hooks/useStoredTasks.ts`, `IndexTaskNoteDialog.tsx`, qualquer coisa em
`src-tauri/`.

## Fora de escopo (não corrigir neste step)

- Escopar `IndexScore` por workflow (A3a).
- Fazer `toggleTask` remover o evento `complete` ao desmarcar / `calculateTasksCompleted` contar por
  `task.completed` (A3b).
- Limpar `activeTasks`/`activeRootTasks`, que ficaram sem consumidores depois do step 03 (dívida
  registrada na memória, não bloqueante, e mexer em `useListingTasks` agora arrisca os 3 consumidores).
- `item.isRunning` preso em `true` pós-reload (T4 / risco aceito do step 02).
- Unificar `calculateTotalTimeInSeconds` com `calculateSubtaskTime` (T5).

## Critérios de aceite

1. `npx tsc --noEmit` sai limpo (gate estático obrigatório).
2. `src/pages/index/components/IndexTasks/IndexFooter/IndexTaskNote.tsx` não existe mais;
   `IndexActiveTasksList/IndexTaskNoteDialog.tsx` continua existindo e importado por
   `IndexCompletedTaskItem.tsx`.
3. No accordion de concluídas, uma task que pertence a um grupo mostra o título do grupo como badge; uma
   task solta (`groupId === null`) não mostra badge nenhum, e o layout dela fica idêntico ao de antes.
4. O badge aparece também quando a task não tem tempo registrado ("No time tracked").
5. Rodapé: `X of Y completed` com Y = todas as tasks de nível 1 do workflow selecionado (soltas + dentro de
   grupos) e **grupos fora do denominador**; `ProgressBar` = `round(X/Y*100)`.
6. `Reset` limpa só o workflow selecionado; outro workflow permanece intacto após a troca.
7. `grep -rnE "inExecutionTaskId|nonActiveExpandedTaskId|TaskListingMode|getTaskListingMode|getActiveTask"`
   em `src/` retorna zero; `subtasks|SubTask` retorna **apenas** os hits de `useStoredTasks.ts`
   (`LegacySubTask`/`entry.subtasks`, A4).
8. Nenhum arquivo novo criado, nenhuma ação de store nova, nada em `src-tauri/`.

## Git state

- Branch `main`, base `2877767`. Um commit ao fim da implementação, mensagem no padrão do loop:
  `claude-step-loop(tasks-nivel-unico): step 04 — indicação de grupo nas concluídas e limpeza de órfão`.
- Usar `git rm` (não `rm`) para o órfão, para o delete entrar no índice.

## Roteiro de teste de sistema — browser (fecha a régua INTEIRA do pedido original)

Modo: **browser**. `npm run dev` (Vite, porta fixa **1420**, `vite.config.ts:18` — falha se ocupada).
Gate estático antes de tudo: `npx tsc --noEmit`. **Não existe suíte de testes nem Docker** (T9) — não
tentar `npm test`, não criar runner, não criar Dockerfile.

Contornos obrigatórios já validados nos steps 01-03 (reutilizar, não redescobrir):
- Sobrescrever `window.Notification.permission` (getter → `'granted'`) e `.requestPermission`
  (→ resolve `'granted'`) via `browser_evaluate` **antes** de clicar "Allow notifications", refazendo a
  cada reload.
- **Não usar `browser_click` nem tecla Enter** — dão timeout de "stable" / não submetem por causa dos
  cronômetros re-renderizando. Usar `element.click()` real e, para inputs, o native value-setter +
  `dispatchEvent(new Event('input', {bubbles:true}))`, tudo via `browser_evaluate`.
- Se plantar fixture no `localStorage` (`timertasks:tasks`), plantar ANTES da hidratação (enquanto a tela
  de permissão ainda bloqueia), senão o `beforeunload` sobrescreve com o estado em memória.

Cenário base: workflow A com **1 grupo de 3 tasks + 2 tasks soltas** (total 5 tasks de nível 1);
workflow B com pelo menos 1 task, para o teste de escopo do Reset.

1. **Nível único / sem página 2** — criar as 2 tasks soltas pelo input principal. Cada task não concluída
   mostra os próprios controles (play/stop, concluir, seletor de alerta, nota). Não existe chevron `>`
   que navegue para outra tela, nem borda verde de "task ativa" por posição na lista. Título da página é
   **"Tasks"** (P6).
2. **Grupo via prefixo `>`** — digitar `> Grupo X` no input principal cria um grupo com input próprio
   "Add a task..."; adicionar 3 tasks por esse input; os 3 filhos ficam visíveis no nível 1 (P2/decisão 2).
   Conferir também o guard do step 03: `>` sozinho (ou `>` + espaços) **não cria nada e não limpa o input**.
3. **Múltiplos cronômetros em paralelo** (decisão 1) — com o timer global rodando, dar play em 2 tasks ao
   mesmo tempo (uma solta e uma dentro do grupo) e confirmar que **as duas** contam simultaneamente,
   nenhuma para a outra. Deixar rodar tempo suficiente para gerar duração legível (≥ ~10s cada) e parar.
4. **Progresso agregado no rodapé** — com 0 concluídas o rodapé diz `0 of 5 completed` (o **grupo não
   entra** no denominador; se disser `0 of 6`, é falha do critério 5). Concluir 2 tasks — uma dentro do
   grupo e uma solta — e conferir `2 of 5 completed` com a `ProgressBar` em 40%.
5. **Progresso próprio do grupo** (step 03, decisão 4) — o card do grupo mostra a **sua** contagem
   (`1 of 3 completed`, barra em 33%) coexistindo com a do rodapé. As duas metades convivem.
6. **Concluídas saem da lista e vão para o accordion** (P5) — as 2 concluídas sumiram da lista principal;
   clicar em `2 of 5 completed` abre o accordion com as 2.
7. **Indicação de grupo no accordion** (entrega deste step) — a concluída que veio do grupo mostra o badge
   com o título do grupo; a concluída solta **não** mostra badge. Conferir também Start/End/Duration
   coerentes com o tempo cronometrado no passo 3, e expandir o chevron para ver a linha do tempo de
   eventos. Bônus: concluir uma task do grupo que nunca foi iniciada e confirmar que ela mostra o badge
   **e** "No time tracked".
8. **Nota** — abrir o dialog de nota de uma task concluída pelo ícone do card (`IndexTaskNoteDialog`) e
   confirmar que funciona; não deve existir nenhum painel "Notes" antigo no rodapé (arquivo apagado).
9. **Persistência** — recarregar a página (refazendo o contorno de Notification) e confirmar que grupo,
   filhos, concluídas, tempos, badge e a contagem `2 of 5` sobrevivem.
10. **`IndexScore` contra os dados manipulados** — conferir os 4 cards (TOTAL CYCLES, TASKS COMPLETED,
    FOCUSED TIME, CURRENT STREAK) contra os tempos e conclusões dos passos 3-4. **Esperado e aceito**:
    os números somam os DOIS workflows, não só o selecionado (A3a); e se durante o teste alguma task for
    marcada e depois desmarcada, ela continua contando em TASKS COMPLETED (A3b). Registrar as duas como
    `pré-existente — não é bug deste step` e seguir; qualquer OUTRA divergência (ex.: FOCUSED TIME zerado,
    ou tempo de tasks migradas perdido) é falha real e deve ser reportada.
11. **Reset escopado ao workflow** (P14) — no workflow A, clicar `Reset`: as tasks e o grupo do workflow A
    somem (`clearItems` DELETA os itens do workflow, não zera flags — comportamento correto e idêntico ao
    antigo `clearTasks`+`clearSubtasks`). Trocar para o workflow B e confirmar que os itens dele
    continuam intactos. Voltar para A e confirmar que segue vazio.
12. **Varredura de resíduos** — rodar os greps do critério de aceite 7 e colar a saída no verdict.

### `## Not run` — obrigatório registrar, não bloqueia o step

- **Drag-and-drop (dnd-kit)**: reordenar tasks dentro do grupo, dentro da raiz, e reordenar grupos entre
  si. Não é testável por automação neste ambiente — nem `browser_drag` do Playwright MCP (timeout de
  "stable" pelos cronômetros re-renderizando) nem `PointerEvent` sintético (dnd-kit exige pointer-capture
  real de SO). Limitação confirmada 3x (steps 01, 02, 03). **Não tentar uma automação nova**; registrar
  como `## Not run` com esta razão. Este step não toca em DnD.

## Escopos de implementação

Um só: `prompts/rodape-concluidas-grupo.md`.
