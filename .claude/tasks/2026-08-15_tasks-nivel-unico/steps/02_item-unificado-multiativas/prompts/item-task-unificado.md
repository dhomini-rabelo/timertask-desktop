# Escopo de implementação — `item-task-unificado` (step 02, task "tasks-nivel-unico")

Você IMPLEMENTA. Este arquivo é o contrato completo: não abra `plan.md`, `recon.md` nem outros arquivos
de `.claude/tasks/`. Não pergunte nada — todas as decisões já estão fechadas aqui.

## Git

Branch `main`, base `5430dcd` (último commit `eec34ca`). Working tree limpo, exceto `image.png` na raiz
(screenshot de referência do usuário: **não commitar, não apagar, não mover**).

## O que construir

Fundir os dois antigos componentes de item (grupo + subtask) num **único** componente de task de nível 1,
com cronômetro/alerta/debug/concluir/nota para toda task, e fazer N cronômetros rodarem em paralelo e em
sincronia com o timer global.

### Arquivos que você OWNS (nenhum outro)

| Arquivo | Ação |
| --- | --- |
| `src/pages/index/components/IndexTasks/IndexActiveTasksList/IndexSubTaskItem/` | `git mv` da pasta → `.../IndexActiveTasksList/IndexTaskItem/` |
| `.../IndexTaskItem/IndexSubTaskItem.tsx` | `git mv` → `IndexTaskItem.tsx` + reescrita do corpo (abaixo) |
| `.../IndexTaskItem/IndexAlertSelect.tsx`, `.../IndexTaskItem/IndexDebugTimer.tsx` | só carona no `git mv`, **conteúdo intocado** |
| `.../IndexActiveTasksList/IndexSortableTaskItem.tsx` | novo import/nome, remove `isActive`, remove a prop morta `dragHandleProps` |

Use `git mv` de verdade (o `git status` tem que mostrar `R`, renomeado). Os arquivos ficam no **mesmo
nível de aninhamento**, então nenhum import relativo (`./IndexAlertSelect`, `../../../../../../layout/...`)
precisa ser recalculado.

**Proibido tocar** em: `src/pages/index/hooks/**` (em especial `useStoredTasks.ts` — veja D2),
`src/pages/index/states/**`, `IndexTaskNoteDialog.tsx`, `useCountUpTimer.ts`, `IndexActiveTasksList.tsx`,
`IndexTasks.tsx`, `IndexAddInput.tsx`, `shared-components/IndexEditInput.tsx`, `shared-state.ts`,
qualquer coisa em `src-tauri/`.

## Renomeações

`IndexSubTaskItem` → `IndexTaskItem`; `IndexSubTaskItemProps` → `IndexTaskItemProps`;
`IndexSubTaskItemState` → `IndexTaskItemState`; `stopSubtask` → `stopTask`; `toggleSubtask` → `toggleTask`;
`handleToggleSubtaskTimer` → `handleToggleTaskTimer`. Props finais: `{ task: Task; dragHandleProps?: Record<string, unknown> }`
— **`isActive` deixa de existir**.

## Decisões vinculantes

**D1 — `isTimerActive = timerState.isRunning` é a única fonte de verdade visual.**
Todo condicional visual que hoje lê `isActive` **ou** `task.isRunning` passa a ler `isTimerActive`:
borda/fundo verde do header, destaque do título, drag handle, botão de apagar, badge, e a escolha
play/stop. `task.isRunning` sobrevive em **um único lugar**: o cálculo de `autoStart` do
`useCountUpTimer` (que fica exatamente como está hoje, junto de `shouldAutoStart`).

**D2 — não corrigir `useStoredTasks.ts:169`.** Aquele `isRunning: true` no `beforeunload` é
intencional (registro de "estava rodando"); `shouldAutoStart` devolve `false` porque o último evento é
`stop`, e é isso que impede a task de retomar sozinha depois de um reload. D1 é justamente o que impede
esse `isRunning` "preso" de vazar para a UI. Não altere a persistência nem o store.

**D3 — sincronismo bidirecional com o timer global.** Substitua o efeito atual (que só sabe parar) por:

```ts
const isGlobalActive = isGlobalTimerRunning && !isResting;
const wasAutoPausedRef = useRef(false);

useEffect(() => {
  if (!isGlobalActive) {
    if (timerState.isRunning) {
      stopTask(task.id);
      timerActions.stop();
      wasAutoPausedRef.current = true;
    }
    return;
  }
  if (wasAutoPausedRef.current && !timerState.isRunning) {
    executeTask(task.id);
    timerActions.start();
  }
  wasAutoPausedRef.current = false;
}, [isGlobalActive]);
```

Dependência **só** `[isGlobalActive]` (o efeito só reage a transições). `ref`, não `useState`.
Em `handleToggleTaskTimer`, zere `wasAutoPausedRef.current = false` nos dois ramos (start e stop
manuais), para que uma ação manual nunca seja desfeita por um auto-resume.
`isResting` entra em `isGlobalActive` porque `goToRest()` mantém `isRunning: true` e `executeTask()`
aborta quando `isResting` — sem isso, retomar durante o descanso desincronizaria o store do cronômetro.

**D4 — progressive disclosure.** `const hasBeenStarted = task.timeEvents.some((event) => event.type === "start");`
- sempre visíveis: play/stop, `IndexAlertSelect`, editar, apagar (quando `!isTimerActive`), nota;
- só quando `hasBeenStarted`: o anel `Timer`, o badge Running/Paused e o `IndexDebugTimer`.
- O `IndexAlertSelect` **deixa de ser escondido enquanto a task roda** e **deixa de trocar de lugar**
  com o `IndexDebugTimer`: os dois convivem na mesma linha.

**D5 — layout final** (mantendo o wrapper externo `group ... rounded-xl` que já existe):

1. **Header** (`flex items-center justify-between p-4`), borda/fundo verde por `isTimerActive`:
   - `isEditing` → só `<IndexEditInput initialValue={task.title} />` (igual hoje);
   - esquerda: drag handle (só `!isTimerActive`) → anel `Timer` (só `hasBeenStarted`) → título;
   - direita: play/stop e, quando `isTimerActive`, o botão de concluir (`Check`).
   - Some a duplicação dos dois blocos `isActive ? ... : ...` de ações — passa a existir **um** só.
2. **Badge Running/Paused**, linha própria `flex items-center justify-end`, quando
   `!isEditing && hasBeenStarted`. Markup recuperável em
   `git show 8185c5c:src/pages/index/components/IndexTasks/IndexActiveTasksList/IndexTaskItem.tsx`
   (bloco `justify-end` logo após o header: bolinha verde pulsante + "Running" / bolinha vermelha +
   "Paused"). Copie as classes; o texto/cor vêm de `isTimerActive`, não de `timeEvents`.
3. **Barra de controles**, quando `!isEditing`, `flex items-center justify-between gap-2`:
   - esquerda: lápis (editar) → lixeira (só `!isTimerActive`) → `<IndexTaskNoteDialog taskId={task.id} label="Notes" />`
     (molde de uso: `src/pages/index/components/IndexTasks/IndexFooter/IndexCompletedTaskItem.tsx:74`;
     o componente é auto-suficiente e não muda);
   - direita: `IndexAlertSelect` (sempre) + `IndexDebugTimer` (só `hasBeenStarted`) lado a lado; dê ao
     `IndexDebugTimer` um wrapper que possa encolher (`flex-1 min-w-0`) para não estourar a linha.

**D6 — não regredir as traps.**
- **T6/alarme**: mova o efeito de alarme e `playAlertSound` **byte a byte**. Nada de efeito ou instância
  de áudio compartilhada entre itens; N alarmes simultâneos são o comportamento esperado.
- **T7**: uma instância de `useCountUpTimer` por item — não centralizar.
- **T8** (React Compiler): todo `map`/spread imutável, como já está.
- **P4/guards**: iniciar continua exigindo timer global rodando e `!isResting`, senão
  `errorMessageAtom` = "Global timer is not running". Não mude a lógica de `handleToggleTaskTimer`
  além do rename e do `wasAutoPausedRef` de D3.

**D7 — limpeza de navegação e textos: sem ação.** O step 01 já removeu `listingMode`,
`inExecutionTaskId`, `nonActiveExpandedTaskId`, `getActiveTask`, `getTaskListingMode`, o breadcrumb e o
accordion. Confirme com **um** grep (`grep -rn "listingMode\|inExecutionTaskId\|nonActiveExpandedTaskId\|getTaskListingMode\|getActiveTask\|IndexTaskAccordionSubtaskItem" src/`)
e **não edite** esses arquivos se o grep vier vazio. Se aparecer resíduo, remova só o resíduo.

## Footprint a não quebrar

- `IndexActiveTasksList.tsx:47-48` renderiza `<IndexSortableTaskItem key={task.id} task={task} />` e
  **não** passa `dragHandleProps` — o `key={task.id}` evita remount, não mexa nele.
- `IndexSortableTaskItem.tsx:30-34` é a única chamada do item; ele monta o próprio
  `dragHandleProps={{ ...attributes, ...listeners }}` via `useSortable`.
- `states/tasks/index.ts:270-275` já bloqueia reorder de item rodando — nada a mudar.
- Nenhum arquivo fora de `IndexTasks/` importa o componente do item.

## Critérios de aceite

1. `npx tsc --noEmit` limpo.
2. `grep -rn "IndexSubTaskItem\|isActive" src/pages/index/components/IndexTasks/` sem nenhum resultado.
3. `git status` mostra os arquivos como renomeados (`R`), e `image.png` continua untracked e intacto.
4. Timer global rodando + play em **duas** tasks: os dois anéis sobem juntos, as duas com borda verde e
   badge "Running"; nenhuma para a outra.
5. Pausar o global: as duas param (borda normal, badge "Paused"); retomar: as **duas** voltam de onde
   pararam, sem zerar.
6. Concluir uma: a outra continua rodando, sem piscar/remontar.
7. Global parado + play: mensagem "Global timer is not running", nada inicia.
8. Task nunca iniciada: play/stop e alert-select visíveis; anel, badge e debug timer ausentes.
9. Reload com uma task que estava rodando: tempo total preservado, botão em **Play**, borda **não**
   verde, badge "Paused", handle e lixeira presentes, nada retoma sozinho.
10. Editar, apagar e o diálogo de nota continuam funcionando.

Rode `npx tsc --noEmit` antes de encerrar. Não rode build nem crie arquivos além dos listados.
