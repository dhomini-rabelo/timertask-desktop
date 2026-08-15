# Plano — step 02: item unificado e múltiplas tasks ativas

Contrato de escopo: `plan-simplified.md` (IN 1-8, OUT). Mapa: `recon.md`.
Frentes de implementação: **1** (escopo único `item-task-unificado`).
Perguntas ao usuário: **sem dúvidas** — todas as decisões abertas foram fechadas abaixo.

---

## Premissas assumidas

Vinculantes para implementador, revisor e testador.

**A1 — Nome e local do componente fundido.** Confirmada a sugestão do `plan-simplified.md`, na
variante que preserva histórico e profundidade de import:

- `git mv src/pages/index/components/IndexTasks/IndexActiveTasksList/IndexSubTaskItem  .../IndexTaskItem`
- `git mv .../IndexTaskItem/IndexSubTaskItem.tsx  .../IndexTaskItem/IndexTaskItem.tsx`
- `IndexAlertSelect.tsx` e `IndexDebugTimer.tsx` **ficam dentro da pasta renomeada** — os imports
  `./IndexAlertSelect` e `./IndexDebugTimer` continuam válidos e a profundidade `../../../../../../`
  dos imports para `layout/`/`code/` **não muda** (mesmo nível de aninhamento). Nenhum recálculo de path.
- Símbolos renomeados: `IndexSubTaskItem` → `IndexTaskItem`, `IndexSubTaskItemProps` →
  `IndexTaskItemProps`, `IndexSubTaskItemState` → `IndexTaskItemState`, `stopSubtask` → `stopTask`,
  `toggleSubtask` → `toggleTask`, `handleToggleSubtaskTimer` → `handleToggleTaskTimer`.
- **Não** criar um `IndexTaskItem.tsx` solto na raiz de `IndexActiveTasksList/` (evita colidir
  mentalmente com o arquivo homônimo apagado no step 01).

**A2 — Fonte da verdade visual: `isTimerActive = timerState.isRunning`.** Esta é a decisão central e
resolve o bug exposto pelo IN 2. `isActive` some (P10) e, no lugar dele, **todo** condicional visual
passa a ler o estado do cronômetro local do próprio item, não `task.isRunning`:

```ts
const isTimerActive = timerState.isRunning; // "rodando visualmente, agora"
```

`task.isRunning` fica restrito a **um único uso**: o cálculo de `autoStart` do `useCountUpTimer`
(junto de `shouldAutoStart`), exatamente como hoje em `IndexSubTaskItem.tsx:54-61`.

Motivo (decisão 2 do briefing): `useStoredTasks.ts:169` mantém `isRunning: true` de propósito no
`beforeunload` — é o registro de "estava rodando", e `shouldAutoStart` (`states/tasks/utils.ts:72-75`)
devolve `false` porque o último evento é `stop`, o que garante a trap **T4** ("nada retoma sozinho").
Se a borda/fundo lesse `task.isRunning` direto, a task apareceria com borda verde + botão Play depois
de um reload, e ainda perderia drag handle, botão de apagar e alert-select (todos hoje condicionados a
`!task.isRunning`). Ancorar tudo em `timerState.isRunning` faz borda, badge, ícone play/stop, handle,
lixeira e debug timer concordarem entre si em qualquer cenário, **sem tocar no store nem na
persistência fechados no step 01**.

→ **`useStoredTasks.ts:169` NÃO é alterado neste step.** Nenhuma linha de `src/pages/index/hooks/` e
nenhuma de `src/pages/index/states/` é tocada.

**A3 — Sincronismo bidirecional com o timer global (IN 4 / P12).** O efeito de
`IndexSubTaskItem.tsx:111-116` hoje só sabe **parar**. O roteiro de teste do step exige
"pausar o timer global → as duas pausam; **retomar → as duas voltam**", então o efeito passa a ser
bidirecional, com memória local por item (um `useRef`, sem estado global, sem persistência):

```ts
const isGlobalActive = isGlobalTimerRunning && !isResting;
const wasAutoPausedRef = useRef(false);

useEffect(() => {
  if (!isGlobalActive) {
    if (timerState.isRunning) {
      stopTask(task.id);        // fecha o intervalo no store (contabilidade correta)
      timerActions.stop();
      wasAutoPausedRef.current = true;
    }
    return;
  }
  if (wasAutoPausedRef.current && !timerState.isRunning) {
    executeTask(task.id);       // novo evento `start`
    timerActions.start();       // continua de currentTimeInSeconds (não zera)
  }
  wasAutoPausedRef.current = false;
}, [isGlobalActive]);
```

Detalhes que sustentam isso (verificados, não presumidos):
- `useCountUpTimer.start()` (`useCountUpTimer.ts:25-45`) retoma de `state.currentTimeInSeconds`, então
  o retomar não perde o tempo já contado; `stop()` (`:47-56`) é no-op se já parado — as duas chamadas
  acima só ocorrem com o estado coerente no mesmo render.
- `autoStart` só é lido no mount (`useCountUpTimer.ts:70-80`), por isso o retomar **precisa** ser
  explícito no efeito; não existe caminho automático.
- `wasAutoPausedRef` é `ref` (não `useState`) de propósito: só é lido dentro do efeito, não participa de
  render, e evita re-render extra sob React Compiler (**T8**).
- A memória é **em memória**: se o usuário recarregar a página com o timer global pausado, nada retoma
  sozinho depois — o que é justamente o que **T4** pede.

**A4 — `isResting` conta como "global parado".** `isGlobalActive = isGlobalTimerRunning && !isResting`.
Motivo objetivo, não estético: `goToRest()` (`states/countdownTimer.ts:228-245`) mantém
`isRunning: true` e liga `isResting: true`; e `executeTask` (`states/tasks/index.ts:311-314`) **aborta
sem fazer nada** quando `isResting`. Sem o `!isResting`, um retomar durante o descanso deixaria o
cronômetro local rodando com o store parado (desync silencioso). Com ele, entrar em descanso pausa os
N cronômetros e `goBackToWork()`/`addExtraTime()` (que zeram `isResting` e chamam `start()`) os retomam.
Isso também alinha o efeito com o guard de P4 (`IN 5`), que já exige `!isResting` para iniciar.

**A5 — Progressive disclosure (IN 3 / P11), leitura literal.**
`const hasBeenStarted = task.timeEvents.some((event) => event.type === "start");`
- Sempre visíveis: botão play/stop, `IndexAlertSelect`, editar, apagar (quando `!isTimerActive`), nota.
- Só quando `hasBeenStarted`: o anel `Timer` no header, o badge Running/Paused e o `IndexDebugTimer`.
- Mudança em relação ao código atual: o `IndexAlertSelect` **deixa de ser escondido** enquanto a task
  roda (hoje `!task.isRunning` em `:261-273`) e **deixa de trocar de lugar** com o `IndexDebugTimer` —
  os dois passam a conviver na mesma linha. É o que P11 diz com todas as letras ("`IndexAlertSelect`
  sempre visível"), e é útil: dá para mudar o alerta sem parar o cronômetro (o efeito de alarme já
  depende de `state.alertMinutes`).

**A6 — Badge "Running/Paused" (decisão 3, parte 1).** Vai em **linha própria, alinhada à direita, entre
o header e a barra de controles** — mesma posição relativa do molde antigo
(`git show 8185c5c:...IndexTaskItem.tsx`, bloco `justify-end` logo após o header). Renderiza só quando
`hasBeenStarted`; o texto/cor vêm de `isTimerActive` (bolinha verde pulsante + "Running" / bolinha
vermelha + "Paused"), não de `timeEvents`. Markup copiado do molde antigo sem alteração de classes.

**A7 — Botão de nota (decisão 3, parte 2).** `<IndexTaskNoteDialog taskId={task.id} label="Notes" />`,
no **cluster esquerdo da barra de controles**, depois de editar/apagar. Sempre visível (a nota é útil
antes, durante e depois de rodar). O componente já é auto-suficiente (`IndexTaskNoteDialog.tsx:24-38`
lê a task pelo id no store) e **não muda**; molde de uso em `IndexFooter/IndexCompletedTaskItem.tsx:74`.

**A8 — IN 6 e IN 7: sem ação.** O step 01 já fez a limpeza (`recon.md`, Armadilhas). O implementador
**confirma por grep e não edita** `shared-state.ts`, `IndexTasks.tsx`, `IndexAddInput.tsx`,
`IndexEditInput.tsx`. Se algum grep achar resíduo (`listingMode`, `inExecutionTaskId`,
`nonActiveExpandedTaskId`, `getActiveTask`, `getTaskListingMode`, `IndexTaskAccordionSubtaskItem`),
aí sim remove — mas não redesenha nada nesses arquivos.

**A9 — Alarme (T6) intocado.** O efeito de `IndexSubTaskItem.tsx:118-138` e `playAlertSound` são
movidos **byte a byte**. O `new Audio` já é criado por disparo (não por render), então o requisito de
T6 já está satisfeito; N itens tocando N alarmes simultâneos é o comportamento esperado do modelo
paralelo, não uma regressão. Proibido criar efeito/áudio compartilhado entre itens.

**A10 — `useCountUpTimer` por item (T7) intocado.** Uma instância por `IndexTaskItem`, como hoje
(`:54`). `IndexActiveTasksList.tsx:47-48` já usa `key={task.id}`, então não há remount espúrio.

**A11 — Concluir uma task rodando: sem mudança.** Verificado: `toggleTask`
(`states/tasks/index.ts:169-194`) empurra um evento `complete`, e `calculateTotalTimeInSeconds`
(`states/tasks/utils.ts:19-27`) fecha o intervalo aberto tanto no `stop` quanto no `complete` — o tempo
é contabilizado certo mesmo concluindo com o cronômetro rodando. O item sai da lista ativa e
desmonta, o que zera seu `setInterval` (cleanup de `useCountUpTimer.ts:75-79`). Nenhum item vizinho é
afetado. Nada a fazer.

**A12 — Riscos aceitos (documentados, fora de escopo).**
1. `reorderItems` (`states/tasks/index.ts:270-275`) bloqueia reordenar por `item.isRunning`. Depois de
   um reload com `isRunning` "preso" em `true`, o drag handle aparece (A2) mas o drop é rejeitado em
   silêncio, até o próximo start/stop daquela task. Corrigir exigiria mexer no store fechado no step 01
   ou na persistência (`useStoredTasks.ts:169`), ambos fora do IN deste step.
2. Uma task concluída enquanto rodava fica com `isRunning: true` no store. Sem efeito visível na lista
   ativa (ela sai de lá) e sem efeito no tempo (A11). Se o step 04 precisar, resolve lá.

---

## Arquivos do step

| Arquivo | Ação |
| --- | --- |
| `.../IndexActiveTasksList/IndexSubTaskItem/` → `.../IndexActiveTasksList/IndexTaskItem/` | `git mv` da pasta |
| `.../IndexTaskItem/IndexSubTaskItem.tsx` → `.../IndexTaskItem/IndexTaskItem.tsx` | `git mv` + reescrita do corpo (A1-A7) |
| `.../IndexTaskItem/IndexAlertSelect.tsx` | só carona no `git mv` — conteúdo intocado |
| `.../IndexTaskItem/IndexDebugTimer.tsx` | só carona no `git mv` — conteúdo intocado |
| `.../IndexActiveTasksList/IndexSortableTaskItem.tsx` | novo import/nome, remove `isActive`, remove a prop morta `dragHandleProps` |
| todo o resto | **não tocar** |

`IndexSortableTaskItem.tsx` hoje declara `dragHandleProps` em `IndexSortableTaskItemProps` mas nunca
o desestrutura (monta o seu próprio via `useSortable`), e `IndexActiveTasksList.tsx:48` nunca o passa —
é prop morta, sai junto.

## Forma do componente `IndexTaskItem`

Props: `{ task: Task; dragHandleProps?: Record<string, unknown> }` (some `isActive`).

Derivados no topo, na ordem: `isEditing` (igual hoje) → hooks do store → `isGlobalActive` (A4) →
`useCountUpTimer` com o **mesmo** `autoStart` de hoje → `isTimerActive` (A2) → `hasBeenStarted` (A5).

Layout (o wrapper externo `group ... rounded-xl` de `:141` é mantido):

1. **Header** (`flex items-center justify-between p-4`, o mesmo bloco de `:142-148`), borda/fundo verde
   condicionados a **`isTimerActive`** no lugar de `isActive`:
   - `isEditing` → `<IndexEditInput initialValue={task.title} />`, sem mais nada (igual hoje).
   - esquerda: drag handle (só quando `!isTimerActive`, markup de `:155-162` inalterado) → anel `Timer`
     (só quando `hasBeenStarted`, markup de `:164-174`) → título (a classe de destaque usa
     `isTimerActive` no lugar de `isActive`).
   - direita: play/stop (`:213-224`) e, quando `isTimerActive`, o botão de concluir (`:226-234`).
     Some a duplicação dos dois blocos `isActive ? ... : ...` de `:189-236` — passa a existir **um** só.
2. **Badge** (A6), `flex items-center justify-end`, só quando `!isEditing && hasBeenStarted`.
3. **Barra de controles** (`:243-283`), só quando `!isEditing`, `flex items-center justify-between gap-2`:
   - esquerda: editar (lápis) → apagar (lixeira, só quando `!isTimerActive`) → `IndexTaskNoteDialog` (A7).
   - direita: `IndexAlertSelect` (sempre) e `IndexDebugTimer` (só quando `hasBeenStarted`), lado a lado;
     o `IndexDebugTimer` mantém seu container de largura (`w-full` dentro de um wrapper que possa
     encolher, ex. `flex-1 min-w-0`) para não estourar a linha.

Nenhum outro condicional pode voltar a ler `task.isRunning` (A2). Todo `map`/spread continua imutável (T8).

## Critérios de aceite

1. `npx tsc --noEmit` limpo e `grep -rn "IndexSubTaskItem\|isActive" src/pages/index/components/IndexTasks/`
   sem resultado.
2. `git status` mostra os arquivos como renomeados (`R`), não como apagado+criado.
3. Com o timer global rodando, dar play em **duas** tasks: os dois anéis sobem ao mesmo tempo, as duas
   ficam com borda verde, badge "Running" nas duas, e nenhuma para a outra.
4. Pausar o timer global: os dois cronômetros param, borda volta ao normal, badge vira "Paused".
   Retomar: os **dois** voltam a subir de onde pararam (A3), sem zerar.
5. Concluir uma delas: a outra continua rodando sem piscar/remontar.
6. Timer global parado + play: aparece "Global timer is not running" e nada inicia (P4).
7. Task nunca iniciada: play/stop e alert-select visíveis; anel, badge e debug timer ausentes (A5).
8. Reload com uma task que estava rodando: o tempo total é preservado, o botão mostra **Play**, a borda
   **não** está verde, o badge mostra **Paused**, o handle e a lixeira estão presentes e nada retoma
   sozinho (T4 + A2).
9. Editar e apagar continuam funcionando; a nota abre pelo diálogo e persiste.

## Fora de escopo

Tudo do OUT do `plan-simplified.md` (grupos → step 03; rodapé/concluídas/reset/`IndexScore` → step 04;
modelo/persistência → fechados no step 01; nada em `src-tauri/`), mais: `useStoredTasks.ts` (A2),
`states/tasks/index.ts` e `states/countdownTimer.ts` (A12), `IndexTaskNoteDialog.tsx` (A7),
`useCountUpTimer.ts` (A3), e a lógica de alarme (A9).

## Modo de teste de sistema

**browser** (`npm run dev`, porta 1420), como manda o `plan-simplified.md`: o step inteiro é
comportamento de UI com N cronômetros em paralelo e um reload — não há suíte automatizada no repo.
DnD (dnd-kit) fica "Not run" (não automatizável neste ambiente); os critérios 1-2 são conferidos por
`tsc`/`git`, os 3-9 pelo roteiro no navegador.

## Nota de medição de janela

O prompt de spawn não trouxe nonce, então `medir-janela.sh` não foi executado. O trabalho deste planner
ficou em ~12 leituras curtas, bem abaixo do teto de 150k — sem risco de handoff.
